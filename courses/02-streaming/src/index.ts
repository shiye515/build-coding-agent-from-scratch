#!/usr/bin/env node

import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(process.cwd(), '.env') });

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

async function callLLMStream(prompt: string): Promise<void> {
  const apiKey = process.env.AGNES_APIKEY;
  if (!apiKey) {
    throw new Error('AGNES_APIKEY environment variable is not set');
  }

  const response = await fetch('https://apihub.agnes-ai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'agnes-2.0-flash',
      input: prompt,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let currentItemType = 'message';

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
          handleEvent(event, currentItemType);
          if (event.type === 'response.output_item.added' && event.item) {
            currentItemType = event.item.type;
          }
        } catch {}
      }
    }
  }
}

function handleEvent(event: StreamEvent, currentItemType: string): void {
  if (process.env.DEBUG) {
    process.stderr.write(JSON.stringify(event) + '\n');
  }

  switch (event.type) {
    case 'response.output_item.added':
      if (event.item?.type === 'reasoning') {
        process.stderr.write('\x1b[2m[thinking]\x1b[0m ');
      }
      break;
    case 'response.reasoning_text.delta':
    case 'response.output_text.delta':
      if (event.delta) {
        if (currentItemType === 'reasoning' || event.type === 'response.reasoning_text.delta') {
          process.stderr.write('\x1b[2m' + event.delta + '\x1b[0m');
        } else {
          process.stdout.write(event.delta);
        }
      }
      break;
    case 'response.completed':
      process.stdout.write('\n');
      break;
  }
}

async function main() {
  const prompt = process.argv[2];
  if (!prompt) {
    console.error('Usage: pnpm dev <prompt>');
    process.exit(1);
  }

  try {
    await callLLMStream(prompt);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
