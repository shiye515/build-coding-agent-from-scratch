#!/usr/bin/env node

import { config } from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import * as readline from 'readline';
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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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

export class ChatSession {
  private messages: Message[] = [];
  private apiKey: string;
  private logDir: string;
  private turnCount: number = 0;
  private lastRequest: any = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.logDir = path.join(process.cwd(), 'log');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  async sendMessage(input: string): Promise<void> {
    this.messages.push({ role: 'user', content: input });
    this.turnCount++;

    const url = `${BASE_URL}/messages`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
    const body: Record<string, any> = {
      model: MODEL,
      max_tokens: 4096,
      stream: true,
      messages: this.messages,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const logEntry: any = {
        timestamp: new Date().toISOString(),
        request: { url, method: 'POST', headers, body },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        },
      };

      if (!response.ok) {
        const errorBody = await response.text();
        logEntry.response.body = errorBody;
        logEntry.error = `API request failed: ${response.status} ${response.statusText}`;
        this.lastRequest = logEntry;
        this.saveLog(`API request failed: ${response.status} ${response.statusText}\n${errorBody}`);
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}\n${errorBody}`,
        );
      }

      const result = await this.handleStream(response);
      logEntry.response.body = result.responseBody;
      this.lastRequest = logEntry;
      this.saveLog();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.saveLog(errorMessage);
      throw error;
    }
  }

  private async handleStream(response: Response): Promise<{ responseBody: any[] }> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentBlockType = '';
    let assistantResponse = '';
    const responseBody: any[] = [];

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
            responseBody.push(event);

            if (event.type === 'content_block_start' && event.content_block) {
              currentBlockType = event.content_block.type;
              if (currentBlockType === 'thinking') {
                process.stderr.write('\x1b[2m[thinking]\x1b[0m ');
              }
            }

            if (event.type === 'content_block_delta' && event.delta) {
              if (event.delta.type === 'thinking_delta' && event.delta.thinking) {
                process.stderr.write('\x1b[2m' + event.delta.thinking + '\x1b[0m');
              } else if (event.delta.type === 'text_delta' && event.delta.text) {
                process.stdout.write(event.delta.text);
                assistantResponse += event.delta.text;
              }
            }
          } catch {}
        }
      }
    }

    process.stdout.write('\n');
    this.messages.push({ role: 'assistant', content: assistantResponse });

    return { responseBody };
  }

  private saveLog(error?: string): void {
    process.stderr.write(`\x1b[2m[saveLog] turn=${this.turnCount}\x1b[0m\n`);
    const filename = path.join(this.logDir, `turn-${this.turnCount}.json`);
    const logData: any = {
      turn: this.turnCount,
      ...this.lastRequest,
      messages: this.messages,
    };
    if (error) {
      logData.error = error;
    }
    fs.writeFileSync(filename, JSON.stringify(logData, null, 2));
  }
}

export async function main() {
  if (!API_KEY) {
    console.error('API_KEY is not configured (settings.json or .env)');
    process.exit(1);
  }

  const session = new ChatSession(API_KEY);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let isClosed = false;
  rl.on('close', () => {
    isClosed = true;
  });

  console.log('Multi-turn Chat (type "exit" to quit)\n');

  const prompt = (): void => {
    if (isClosed) {
      return;
    }

    rl.question('You: ', async (input) => {
      const trimmed = input.trim();
      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
        console.log('Bye!');
        rl.close();
        return;
      }

      if (!trimmed) {
        prompt();
        return;
      }

      try {
        process.stdout.write('Assistant: ');
        await session.sendMessage(trimmed);
        console.log('\n');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
      }

      if (!isClosed) {
        prompt();
      }
    });
  };

  prompt();
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isMain) {
  main();
}
