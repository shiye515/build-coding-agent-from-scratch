#!/usr/bin/env node

import { config } from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import { tools, executeTool } from './tools.js';

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

interface ToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

interface TextBlock {
  type: 'text';
  text: string;
}

interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

type ContentBlock = TextBlock | ThinkingBlock | ToolUse;

interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
}

interface StreamEvent {
  type: string;
  index?: number;
  delta?: {
    type: string;
    text?: string;
    thinking?: string;
    partial_json?: string;
  };
  content_block?: {
    type: string;
    id?: string;
    name?: string;
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
  private requestCount: number = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.logDir = path.join(process.cwd(), './log');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  async sendMessage(input: string): Promise<void> {
    this.messages.push({ role: 'user', content: input });
    this.turnCount++;
    this.requestCount = 0;

    const maxIterations = 10;
    let iteration = 0;

    try {
      while (iteration < maxIterations) {
        iteration++;
        const url = `${BASE_URL}/messages`;
        const headers = {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        };
        const body: Record<string, any> = {
          model: MODEL,
          max_tokens: 4096,
          stream: true,
          tools: tools,
          messages: this.messages,
        };

        this.requestCount++;
        const requestIndex = this.requestCount;
        process.stderr.write(`\x1b[2m[request #${requestIndex}]\x1b[0m\n`);

        const logEntry: any = {
          requestIndex,
          timestamp: new Date().toISOString(),
          request: { url, method: 'POST', headers, body },
        };

        let result: {
          toolCalls: ToolCall[];
          textBlocks: string[];
          responseBody: any[];
          stopReason: string;
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

          logEntry.response = {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
          };

          if (!response.ok) {
            const errorBody = await response.text();
            logEntry.response.body = errorBody;
            logEntry.error = `API request failed: ${response.status} ${response.statusText}`;
            throw new Error(
              `API request failed: ${response.status} ${response.statusText}\n${errorBody}`,
            );
          }

          result = await this.handleStream(response);
          logEntry.response.body = result.responseBody;
          this.saveRequestLog(logEntry);
        } catch (fetchError) {
          logEntry.error = fetchError instanceof Error ? fetchError.message : String(fetchError);
          logEntry.errorStack = fetchError instanceof Error ? fetchError.stack : undefined;
          this.saveRequestLog(logEntry);
          throw fetchError;
        }

        if (result.toolCalls.length > 0) {
          const assistantContent: ContentBlock[] = [];

          for (const textBlock of result.textBlocks) {
            assistantContent.push({ type: 'text', text: textBlock });
          }

          for (const toolCall of result.toolCalls) {
            assistantContent.push({
              type: 'tool_use',
              id: toolCall.id,
              name: toolCall.name,
              input: toolCall.input,
            });
          }

          this.messages.push({
            role: 'assistant',
            content: assistantContent,
          });

          const toolResults: ContentBlock[] = [];

          for (const toolCall of result.toolCalls) {
            process.stderr.write(`\x1b[2m[tool: ${toolCall.name}]\x1b[0m\n`);
            const output = executeTool(toolCall.name, toolCall.input);
            process.stderr.write(`\x1b[2m${output}\x1b[0m\n\n`);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: output,
            } as any);
          }

          this.messages.push({
            role: 'user',
            content: toolResults,
          });
        } else {
          break;
        }
      }

      if (iteration >= maxIterations) {
        process.stderr.write('\x1b[33m[warning] max iterations reached\x1b[0m\n');
      }

      this.saveLog();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.saveLog(errorMessage);
      throw error;
    }
  }

  private async handleStream(response: Response): Promise<{
    toolCalls: ToolCall[];
    responseBody: any[];
    textBlocks: string[];
    stopReason: string;
  }> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentBlockType = '';
    let currentBlockId = '';
    let currentBlockName = '';
    let assistantText = '';
    const textBlocks: string[] = [];
    const toolCalls: ToolCall[] = [];
    const pendingToolCalls: Map<string, ToolCall> = new Map();
    const pendingToolJson: Map<string, string> = new Map();
    const responseBody: any[] = [];
    let stopReason = '';

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
              currentBlockId = event.content_block.id || '';
              currentBlockName = event.content_block.name || '';

              if (currentBlockType === 'thinking') {
                process.stderr.write('\x1b[2m[thinking]\x1b[0m ');
              }

              if (currentBlockType === 'tool_use') {
                const toolCall: ToolCall = {
                  id: currentBlockId,
                  name: currentBlockName,
                  input: {},
                };
                pendingToolCalls.set(currentBlockId, toolCall);
                pendingToolJson.set(currentBlockId, '');
              }
            }

            if (event.type === 'content_block_delta' && event.delta) {
              if (event.delta.type === 'thinking_delta' && event.delta.thinking) {
                process.stderr.write('\x1b[2m' + event.delta.thinking + '\x1b[0m');
              } else if (event.delta.type === 'text_delta' && event.delta.text) {
                process.stdout.write(event.delta.text);
                assistantText += event.delta.text;
              } else if (event.delta.type === 'input_json_delta' && event.delta.partial_json) {
                const toolCall = pendingToolCalls.get(currentBlockId);
                if (toolCall) {
                  const prevJson = pendingToolJson.get(currentBlockId) || '';
                  const nextJson = prevJson + event.delta.partial_json;
                  pendingToolJson.set(currentBlockId, nextJson);
                  try {
                    toolCall.input = JSON.parse(nextJson);
                  } catch {}
                }
              }
            }

            if (event.type === 'content_block_stop') {
              if (currentBlockType === 'text' && assistantText) {
                textBlocks.push(assistantText);
                assistantText = '';
              }
              if (currentBlockType === 'tool_use') {
                const toolCall = pendingToolCalls.get(currentBlockId);
                if (toolCall && toolCall.name) {
                  toolCalls.push(toolCall);
                  pendingToolCalls.delete(currentBlockId);
                  pendingToolJson.delete(currentBlockId);
                }
              }
              currentBlockType = '';
            }

            if (event.type === 'message_delta' && event.message?.stop_reason) {
              stopReason = event.message.stop_reason;
            }
          } catch {}
        }
      }
    }

    if (assistantText) {
      textBlocks.push(assistantText);
    }

    process.stdout.write('\n');

    if (textBlocks.length > 0 && toolCalls.length === 0) {
      this.messages.push({ role: 'assistant', content: textBlocks.join('') });
    }

    return { toolCalls, responseBody, textBlocks, stopReason };
  }

  private saveRequestLog(logEntry: any): void {
    const filename = path.join(
      this.logDir,
      `turn-${this.turnCount}-request-${logEntry.requestIndex}.json`,
    );
    fs.writeFileSync(filename, JSON.stringify(logEntry, null, 2));
  }

  private saveLog(error?: string): void {
    process.stderr.write(
      `\x1b[2m[saveLog] turn=${this.turnCount} requests=${this.requestCount}\x1b[0m\n`,
    );
    const filename = path.join(this.logDir, `turn-${this.turnCount}.json`);
    const logData: any = {
      turn: this.turnCount,
      timestamp: new Date().toISOString(),
      requestCount: this.requestCount,
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

  console.log('Tool Calling Chat (type "exit" to quit)\n');
  console.log('Available tools: read_file, write_file\n');

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
