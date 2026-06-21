#!/usr/bin/env node

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import * as readline from 'readline';

config({ path: path.join(process.cwd(), '.env') });

interface TextMessage {
  type?: 'message';
  role: 'user' | 'assistant' | 'system';
  content: string | { type: 'input_text'; text: string }[];
}

type InputItem = TextMessage;

interface StreamEvent {
  type: string;
  delta?: string;
  item?: {
    type: string;
    content?: {
      type: string;
      text?: string;
    }[];
  };
  item_id?: string;
}

class ChatSession {
  private input: InputItem[] = [];
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
    this.input.push({ role: 'user', content: [{ type: 'input_text', text: input }] });
    this.turnCount++;

    const url = 'https://apihub.agnes-ai.com/v1/responses';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
    const body: Record<string, any> = {
      model: 'agnes-2.0-flash',
      input: this.input,
      stream: true,
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
        response: { status: response.status, statusText: response.statusText, headers: responseHeaders },
      };

      if (!response.ok) {
        const errorBody = await response.text();
        logEntry.response.body = errorBody;
        logEntry.error = `API request failed: ${response.status} ${response.statusText}`;
        this.lastRequest = logEntry;
        this.saveLog(`API request failed: ${response.status} ${response.statusText}\n${errorBody}`);
        throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorBody}`);
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
    let currentItemType = 'message';
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

            if (event.type === 'response.output_item.added' && event.item) {
              currentItemType = event.item.type;
            }

            if (event.type === 'response.output_item.added' && event.item?.type === 'reasoning') {
              process.stderr.write('\x1b[2m[thinking]\x1b[0m ');
            }

            if (event.delta) {
              if (currentItemType === 'reasoning' || event.type === 'response.reasoning_text.delta') {
                process.stderr.write('\x1b[2m' + event.delta + '\x1b[0m');
              } else if (event.type === 'response.output_text.delta') {
                process.stdout.write(event.delta);
                assistantResponse += event.delta;
              }
            }
          } catch {}
        }
      }
    }

    process.stdout.write('\n');
    this.input.push({ role: 'assistant', content: assistantResponse });

    return { responseBody };
  }

  private saveLog(error?: string): void {
    process.stderr.write(`\x1b[2m[saveLog] turn=${this.turnCount}\x1b[0m\n`);
    const filename = path.join(this.logDir, `turn-${this.turnCount}.json`);
    const logData: any = {
      turn: this.turnCount,
      ...this.lastRequest,
      input: this.input,
    };
    if (error) {
      logData.error = error;
    }
    fs.writeFileSync(filename, JSON.stringify(logData, null, 2));
  }
}

async function main() {
  const apiKey = process.env.AGNES_APIKEY;
  if (!apiKey) {
    console.error('AGNES_APIKEY environment variable is not set');
    process.exit(1);
  }

  const session = new ChatSession(apiKey);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Multi-turn Chat (type "exit" to quit)\n');

  const prompt = (): void => {
    rl.question('You: ', async (input) => {
      const trimmed = input.trim();
      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
        console.log('Bye!');
        rl.close();
        process.exit(0);
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

      prompt();
    });
  };

  prompt();
}

main();
