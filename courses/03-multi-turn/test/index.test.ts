import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

test('ChatSession persists the user and assistant messages for a streamed turn', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'course-03-'));
  const originalCwd = process.cwd();
  const originalFetch = globalThis.fetch;
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;

  globalThis.fetch = async () =>
    streamResponse([
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Saved"}}\n\n',
    ]);
  process.stdout.write = (() => true) as typeof process.stdout.write;
  process.stderr.write = (() => true) as typeof process.stderr.write;
  process.chdir(tempDir);

  try {
    const { ChatSession } = await import('../src/index.ts');
    const session = new ChatSession('test-key-03');

    await session.sendMessage('Remember this');

    const log = JSON.parse(fs.readFileSync(path.join(tempDir, 'log', 'turn-1.json'), 'utf-8'));
    assert.deepEqual(
      log.messages.map((message: { role: string; content: string }) => message.content),
      ['Remember this', 'Saved'],
    );
    assert.equal(log.request.body.messages[0].role, 'user');
  } finally {
    process.chdir(originalCwd);
    globalThis.fetch = originalFetch;
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
