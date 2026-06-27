#!/usr/bin/env node

import { config } from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const COURSE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = path.join(COURSE_ROOT, '../..');
const CONFIG_DIR = fs.existsSync(path.join(REPO_ROOT, 'settings.json'))
  ? REPO_ROOT
  : path.join(os.homedir(), '.tcode');
const settingsPath = path.join(CONFIG_DIR, 'settings.json');

if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

if (!fs.existsSync(settingsPath)) {
  fs.writeFileSync(
    settingsPath,
    JSON.stringify(
      {
        env: {
          BASE_URL: 'https://api.deepseek.com/anthropic',
          MODEL: 'deepseek-v4-flash',
          CONTEXT_WINDOW: 100000,
        },
      },
      null,
      2,
    ) + '\n',
  );
}

config({ path: path.join(CONFIG_DIR, '.env') });

const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
const BASE_URL = settings.env.BASE_URL;
const MODEL = settings.env.MODEL;
const API_KEY = process.env.API_KEY || settings.env.API_KEY || '';

interface StreamEvent {
  type: string;
  index?: number;
  delta?: {
    type: string;
    text?: string;
    thinking?: string;
  };
  content_block?: {
    type: string;
    text?: string;
    thinking?: string;
  };
  message?: {
    stop_reason?: string;
  };
  usage?: {
    output_tokens?: number;
  };
}

export async function callLLMStream(prompt: string): Promise<void> {
  if (!API_KEY) {
    throw new Error('API_KEY is not configured (settings.json or .env)');
  }

  const response = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const event: StreamEvent = JSON.parse(data);
          handleEvent(event);
        } catch {}
      }
    }
  }
}

export function handleEvent(event: StreamEvent): void {
  if (process.env.DEBUG) {
    process.stderr.write(JSON.stringify(event) + '\n');
  }

  switch (event.type) {
    case 'content_block_start':
      if (event.content_block?.type === 'thinking') {
        process.stderr.write('\x1b[2m[thinking]\x1b[0m ');
      }
      break;
    case 'content_block_delta':
      if (event.delta) {
        if (event.delta.type === 'thinking_delta' && event.delta.thinking) {
          process.stderr.write('\x1b[2m' + event.delta.thinking + '\x1b[0m');
        } else if (event.delta.type === 'text_delta' && event.delta.text) {
          process.stdout.write(event.delta.text);
        }
      }
      break;
    case 'message_stop':
      process.stdout.write('\n');
      break;
  }
}

export async function main() {
  const prompt = process.argv[2];
  if (!prompt) {
    console.error('Usage: pnpm dev <prompt>');
    process.exit(1);
  }

  try {
    await callLLMStream(prompt);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isMain) {
  main();
}
