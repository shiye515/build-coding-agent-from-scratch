#!/usr/bin/env node

import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(process.cwd(), '.env') });

interface ResponsesAPIResult {
  id: string;
  output: {
    type: string;
    content?: {
      type: string;
      text?: string;
    }[];
  }[];
}

async function callLLM(prompt: string): Promise<string> {
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
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data: ResponsesAPIResult = await response.json();

  return JSON.stringify(data, null, 2);
}

async function main() {
  const prompt = process.argv[2];
  if (!prompt) {
    console.error('Usage: pnpm dev <prompt>');
    process.exit(1);
  }

  try {
    const result = await callLLM(prompt);
    console.log(result);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
