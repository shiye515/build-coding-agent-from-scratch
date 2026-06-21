#!/usr/bin/env node

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import * as readline from 'readline';

config({ path: path.join(process.cwd(), '.env') });

interface TextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | { type: 'input_text'; text: string }[];
}

interface FunctionCall {
  type: 'function_call';
  id: string;
  call_id: string;
  name: string;
  arguments: string;
}

interface FunctionCallOutput {
  type: 'function_call_output';
  call_id: string;
  output: string;
}

type InputItem = TextMessage | FunctionCall | FunctionCallOutput;

interface Tool {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

interface ToolCall {
  id: string;
  call_id: string;
  name: string;
  arguments: string;
}

interface StreamEvent {
  type: string;
  delta?: string;
  item?: {
    type: string;
    name?: string;
    id?: string;
    call_id?: string;
    arguments?: string;
    content?: {
      type: string;
      text?: string;
    }[];
  };
  item_id?: string;
}

const tools: Tool[] = [
  {
    type: 'function',
    name: 'read_file',
    description: 'Read the contents of a file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The file path to read' },
      },
      required: ['path'],
    },
  },
  {
    type: 'function',
    name: 'write_file',
    description: 'Write content to a file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The file path to write' },
        content: { type: 'string', description: 'The content to write' },
      },
      required: ['path', 'content'],
    },
  },
];

function executeTool(name: string, args: Record<string, string>): string {
  try {
    switch (name) {
      case 'read_file':
        return fs.readFileSync(args.path, 'utf-8');
      case 'write_file':
        fs.mkdirSync(path.dirname(args.path), { recursive: true });
        fs.writeFileSync(args.path, args.content);
        return `Successfully wrote to ${args.path}`;
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

class ChatSession {
  private input: InputItem[] = [];
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
    this.input.push({ role: 'user', content: [{ type: 'input_text', text: input }] });
    this.turnCount++;
    this.requestCount = 0;

    const maxIterations = 10;
    let iteration = 0;

    try {
      while (iteration < maxIterations) {
        iteration++;
        const url = 'https://apihub.agnes-ai.com/v1/responses';
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        };
        const body: Record<string, any> = {
          model: 'agnes-2.0-flash',
          input: this.input,
          tools: tools,
          stream: true,
          max_output_tokens: 4096,
        };

        this.requestCount++;
        const requestIndex = this.requestCount;
        process.stderr.write(`\x1b[2m[request #${requestIndex}]\x1b[0m\n`);

        const logEntry: any = {
          requestIndex,
          timestamp: new Date().toISOString(),
          request: { url, method: 'POST', headers, body },
        };

        let result: { toolCalls: ToolCall[]; responseBody: any[] };

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

          logEntry.response = { status: response.status, statusText: response.statusText, headers: responseHeaders };

          if (!response.ok) {
            const errorBody = await response.text();
            logEntry.response.body = errorBody;
            logEntry.error = `API request failed: ${response.status} ${response.statusText}`;
            throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorBody}`);
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
          for (const toolCall of result.toolCalls) {
            this.input.push({
              type: 'function_call',
              id: toolCall.id,
              call_id: toolCall.call_id,
              name: toolCall.name,
              arguments: toolCall.arguments,
            });

            process.stderr.write(`\x1b[2m[tool: ${toolCall.name}]\x1b[0m\n`);
            const args = JSON.parse(toolCall.arguments);
            const output = executeTool(toolCall.name, args);
            process.stderr.write(`\x1b[2m${output}\x1b[0m\n\n`);

            this.input.push({
              type: 'function_call_output',
              call_id: toolCall.call_id,
              output,
            });
          }
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

  private async handleStream(
    response: Response,
  ): Promise<{ toolCalls: ToolCall[]; responseBody: any[] }> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentItemType = 'message';
    let assistantResponse = '';
    const toolCalls: ToolCall[] = [];
    const pendingToolCalls: Map<string, ToolCall> = new Map();
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
              if (event.item.type === 'function_call') {
                const name = event.item.name || '';
                const itemId = (event.item as any).id || event.item_id || '';
                const callId = event.item.call_id || itemId;
                const toolCall: ToolCall = {
                  id: itemId,
                  call_id: callId,
                  name,
                  arguments: '',
                };
                pendingToolCalls.set(toolCall.id, toolCall);
              }
            }

            if (
              event.type === 'response.output_item.added' &&
              event.item?.type === 'reasoning'
            ) {
              process.stderr.write('\x1b[2m[thinking]\x1b[0m ');
            }

            if (event.type === 'response.function_call_arguments.delta') {
              const toolCallId = event.item_id || '';
              const toolCall = pendingToolCalls.get(toolCallId);
              if (toolCall) {
                toolCall.arguments += event.delta || '';
              }
            }

            if (event.type === 'response.output_item.done' && event.item?.type === 'function_call') {
              const itemId = event.item_id || (event.item as any).id || '';
              const toolCall = pendingToolCalls.get(itemId);
              if (toolCall && toolCall.name) {
                toolCalls.push(toolCall);
                pendingToolCalls.delete(itemId);
              }
            }

            if (event.delta) {
              if (
                currentItemType === 'reasoning' ||
                event.type === 'response.reasoning_text.delta'
              ) {
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

    if (assistantResponse) {
      process.stdout.write('\n');
      this.input.push({ role: 'assistant', content: assistantResponse });
    }

    return { toolCalls, responseBody };
  }

  private saveRequestLog(logEntry: any): void {
    const filename = path.join(this.logDir, `turn-${this.turnCount}-request-${logEntry.requestIndex}.json`);
    fs.writeFileSync(filename, JSON.stringify(logEntry, null, 2));
  }

  private saveLog(error?: string): void {
    process.stderr.write(`\x1b[2m[saveLog] turn=${this.turnCount} requests=${this.requestCount}\x1b[0m\n`);
    const filename = path.join(this.logDir, `turn-${this.turnCount}.json`);
    const logData: any = {
      turn: this.turnCount,
      timestamp: new Date().toISOString(),
      requestCount: this.requestCount,
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

  console.log('Tool Calling Chat (type "exit" to quit)\n');
  console.log('Available tools: read_file, write_file\n');

  const prompt = (): void => {
    rl.question('You: ', async (input) => {
      const trimmed = input.trim();
      if (
        trimmed.toLowerCase() === 'exit' ||
        trimmed.toLowerCase() === 'quit'
      ) {
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
