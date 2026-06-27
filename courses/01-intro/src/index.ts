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

interface MessagesResult {
  id: string;
  model: string;
  role: string;
  content: { type: string; text?: string }[];
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export async function callLLM(prompt: string): Promise<string> {
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
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data: MessagesResult = await response.json();

  return JSON.stringify(data, null, 2);
}

export async function main() {
  const prompt = process.argv[2];
  if (!prompt) {
    console.error('Usage: pnpm dev <prompt>');
    process.exit(1);
  }

  try {
    const result = await callLLM(prompt);
    console.log(result);
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
