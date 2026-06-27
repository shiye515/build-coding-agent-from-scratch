import assert from 'node:assert/strict';
import test from 'node:test';

test('callLLM sends an Anthropic messages request with the configured API key', async () => {
  process.env.API_KEY = 'test-key-01';
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init: init as RequestInit });
    return new Response(
      JSON.stringify({
        id: 'msg_01',
        model: 'deepseek-v4-flash',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 2, output_tokens: 1 },
      }),
      { status: 200, statusText: 'OK' },
    );
  };

  try {
    const { callLLM } = await import('../src/index.ts');
    const result = JSON.parse(await callLLM('Say hello'));

    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://api.deepseek.com/anthropic/messages');
    assert.equal((requests[0].init.headers as Record<string, string>)['x-api-key'], 'test-key-01');

    const body = JSON.parse(String(requests[0].init.body));
    assert.equal(body.model, 'deepseek-v4-flash');
    assert.deepEqual(body.messages, [{ role: 'user', content: 'Say hello' }]);
    assert.equal(result.content[0].text, 'Hello');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.API_KEY;
  }
});
