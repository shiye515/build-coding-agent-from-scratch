#!/usr/bin/env node

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import * as readline from 'readline';

config({ path: path.join(process.cwd(), '.env') });

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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
  private history: Message[] = [];
  private apiKey: string;
  private logDir: string;
  private turnCount: number = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.logDir = path.join(process.cwd(), 'log');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  async sendMessage(input: string): Promise<void> {
    this.history.push({ role: 'user', content: input });

    const response = await fetch('https://apihub.agnes-ai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'agnes-2.0-flash',
        input: this.formatInput(),
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    await this.handleStream(response);
  }

  private formatInput(): string {
    return this.history
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
  }

  private async handleStream(response: Response): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentItemType = 'message';
    let assistantResponse = '';

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
    this.history.push({ role: 'assistant', content: assistantResponse });
    this.saveLog();
  }

  private saveLog(): void {
    this.turnCount++;
    const filename = path.join(this.logDir, `turn-${this.turnCount}.json`);
    fs.writeFileSync(filename, JSON.stringify(this.history, null, 2));
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
