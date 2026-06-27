import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStream } from '../src/stream.ts';

function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
    { status: 200, statusText: 'OK' },
  );
}

test('parseStream collects text, tool calls, stop reason, and usage', async () => {
  const seenText: string[] = [];
  const seenTools: string[] = [];

  const result = await parseStream(
    streamResponse([
      'data: {"type":"message_start","message":{"usage":{"input_tokens":7}}}\n\n',
      'data: {"type":"content_block_start","content_block":{"type":"text"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Need file"}}\n\n',
      'data: {"type":"content_block_stop"}\n\n',
      'data: {"type":"content_block_start","content_block":{"type":"tool_use","id":"toolu_1","name":"Read"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"type":"input_json_delta","partial_json":"{\\"file_path\\":\\"/tmp/a"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"type":"input_json_delta","partial_json":".txt\\"}"}}\n\n',
      'data: {"type":"content_block_stop"}\n\n',
      'data: {"type":"message_delta","message":{"stop_reason":"tool_use"},"usage":{"output_tokens":5}}\n\n',
    ]),
    {
      onText: (text) => seenText.push(text),
      onToolCall: (toolCall) => seenTools.push(toolCall.name),
    },
  );

  assert.deepEqual(result.textBlocks, ['Need file']);
  assert.deepEqual(result.toolCalls, [
    { id: 'toolu_1', name: 'Read', input: { file_path: '/tmp/a.txt' } },
  ]);
  assert.equal(result.stopReason, 'tool_use');
  assert.deepEqual(result.usage, { inputTokens: 7, outputTokens: 5 });
  assert.deepEqual(seenText, ['Need file']);
  assert.deepEqual(seenTools, ['Read']);
});
