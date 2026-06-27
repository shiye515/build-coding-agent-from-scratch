import { BASE_URL, MODEL, API_KEY, CONTEXT_WINDOW } from './config.js';
import { tools, executeTool } from './tools.js';
import { parseStream, ToolCall, StreamUsage } from './stream.js';

export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: string;
  [key: string]: any;
}

export interface AgentCallbacks {
  onText?: (text: string) => void;
  onThinking?: (text: string) => void;
  onThinkingStart?: () => void;
  onToolCall?: (toolCall: ToolCall) => void;
  onToolResult?: (toolName: string, result: string) => void;
  onRequestStart?: (index: number) => void;
  onUsage?: (usage: StreamUsage, contextPercent: number) => void;
}

export class Agent {
  private messages: Message[] = [];
  private messageQueue: Message[] = [];
  private agentRunning = false;
  private maxIterations = 10;
  private callbacks: AgentCallbacks;
  private totalInputTokens = 0;
  private totalOutputTokens = 0;

  constructor(callbacks: AgentCallbacks = {}) {
    this.callbacks = callbacks;
  }

  get isRunning(): boolean {
    return this.agentRunning;
  }

  get messageCount(): number {
    return this.messages.length;
  }

  get contextPercent(): number {
    return Math.round(((this.totalInputTokens + this.totalOutputTokens) / CONTEXT_WINDOW) * 100);
  }

  get tokenUsage(): { input: number; output: number; percent: number } {
    return {
      input: this.totalInputTokens,
      output: this.totalOutputTokens,
      percent: this.contextPercent,
    };
  }

  queueMessage(content: string): void {
    this.messageQueue.push({ role: 'user', content });
  }

  async processNextMessage(): Promise<boolean> {
    if (this.agentRunning) return false;

    const nextMessage = this.messageQueue.length > 0 ? this.messageQueue.shift()! : null;
    if (!nextMessage) return false;

    this.messages.push(nextMessage);
    this.agentRunning = true;

    try {
      await this.runAgentLoop();
    } finally {
      this.agentRunning = false;
    }

    return true;
  }

  private async runAgentLoop(): Promise<void> {
    let iteration = 0;

    while (iteration < this.maxIterations) {
      iteration++;
      this.callbacks.onRequestStart?.(iteration);

      const response = await this.sendRequest();
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}\n${errorBody}`,
        );
      }

      const result = await parseStream(response, {
        onText: this.callbacks.onText,
        onThinking: this.callbacks.onThinking,
        onThinkingStart: this.callbacks.onThinkingStart,
        onToolCall: this.callbacks.onToolCall,
      });

      if (result.usage.inputTokens > 0) {
        this.totalInputTokens = result.usage.inputTokens;
      }
      this.totalOutputTokens += result.usage.outputTokens;
      this.callbacks.onUsage?.(result.usage, this.contextPercent);

      if (result.toolCalls.length > 0) {
        const assistantContent: ContentBlock[] = [];

        for (const text of result.textBlocks) {
          assistantContent.push({ type: 'text', text });
        }

        for (const toolCall of result.toolCalls) {
          assistantContent.push({
            type: 'tool_use',
            id: toolCall.id,
            name: toolCall.name,
            input: toolCall.input,
          });
        }

        this.messages.push({ role: 'assistant', content: assistantContent });

        const toolResults: ContentBlock[] = [];
        for (const toolCall of result.toolCalls) {
          const output = executeTool(toolCall.name, toolCall.input);
          this.callbacks.onToolResult?.(toolCall.name, output);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: output,
          } as ContentBlock);
        }

        this.messages.push({ role: 'user', content: toolResults });
      } else {
        if (result.textBlocks.length > 0) {
          this.messages.push({ role: 'assistant', content: result.textBlocks.join('') });
        }
        break;
      }

      if (this.messageQueue.length > 0) {
        break;
      }
    }
  }

  private async sendRequest(): Promise<Response> {
    return fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        stream: true,
        tools,
        messages: this.messages,
      }),
    });
  }
}
