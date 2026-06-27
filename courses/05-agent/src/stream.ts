export interface StreamEvent {
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
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export interface StreamUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface StreamResult {
  textBlocks: string[];
  toolCalls: ToolCall[];
  stopReason: string;
  usage: StreamUsage;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface StreamCallbacks {
  onText?: (text: string) => void;
  onThinking?: (text: string) => void;
  onThinkingStart?: () => void;
  onToolCall?: (toolCall: ToolCall) => void;
}

export async function parseStream(
  response: Response,
  callbacks: StreamCallbacks = {},
): Promise<StreamResult> {
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
  let stopReason = '';
  let inputTokens = 0;
  let outputTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;

      try {
        const event: StreamEvent = JSON.parse(data);

        if (event.type === 'message_start') {
          const usage = event.message?.usage || event.usage;
          if (usage?.input_tokens) {
            inputTokens = usage.input_tokens;
          }
        }

        if (event.type === 'content_block_start' && event.content_block) {
          currentBlockType = event.content_block.type;
          currentBlockId = event.content_block.id || '';
          currentBlockName = event.content_block.name || '';

          if (currentBlockType === 'thinking') {
            callbacks.onThinkingStart?.();
          }

          if (currentBlockType === 'tool_use') {
            pendingToolCalls.set(currentBlockId, {
              id: currentBlockId,
              name: currentBlockName,
              input: {},
            });
            pendingToolJson.set(currentBlockId, '');
          }
        }

        if (event.type === 'content_block_delta' && event.delta) {
          if (event.delta.type === 'thinking_delta' && event.delta.thinking) {
            callbacks.onThinking?.(event.delta.thinking);
          } else if (event.delta.type === 'text_delta' && event.delta.text) {
            callbacks.onText?.(event.delta.text);
            assistantText += event.delta.text;
          } else if (event.delta.type === 'input_json_delta' && event.delta.partial_json) {
            const toolCall = pendingToolCalls.get(currentBlockId);
            if (toolCall) {
              const previousJson = pendingToolJson.get(currentBlockId) || '';
              const nextJson = previousJson + event.delta.partial_json;
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
              callbacks.onToolCall?.(toolCall);
              pendingToolCalls.delete(currentBlockId);
              pendingToolJson.delete(currentBlockId);
            }
          }
          currentBlockType = '';
        }

        if (event.type === 'message_delta') {
          if (event.message?.stop_reason) {
            stopReason = event.message.stop_reason;
          }
          if (event.usage?.output_tokens) {
            outputTokens = event.usage.output_tokens;
          }
        }
      } catch {}
    }
  }

  if (assistantText) {
    textBlocks.push(assistantText);
  }

  return {
    textBlocks,
    toolCalls,
    stopReason,
    usage: { inputTokens, outputTokens },
  };
}
