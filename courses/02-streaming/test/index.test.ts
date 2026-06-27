import assert from 'node:assert/strict';
import test from 'node:test';

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

test('callLLMStream writes streamed text deltas to stdout', async () => {
  process.env.API_KEY = 'test-key-02';
  const originalFetch = globalThis.fetch;
  const originalWrite = process.stdout.write;
  let stdout = '';

  globalThis.fetch = async () =>
    streamResponse([
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hel"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"lo"}}\n\n',
      'data: {"type":"message_stop"}\n\n',
    ]);
  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write;

  try {
    const { callLLMStream } = await import('../src/index.ts');
    await callLLMStream('stream please');

    assert.match(stdout, /Hello\n$/);
  } finally {
    globalThis.fetch = originalFetch;
    process.stdout.write = originalWrite;
    delete process.env.API_KEY;
  }
});
