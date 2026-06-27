import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { executeTool } from '../src/tools.ts';

test('executeTool writes and reads files', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'course-04-'));
  const filePath = path.join(tempDir, 'nested', 'hello.txt');

  try {
    const writeResult = executeTool('write_file', {
      path: filePath,
      content: 'Hello tools',
    });
    const readResult = executeTool('read_file', { path: filePath });

    assert.equal(writeResult, `Successfully wrote to ${filePath}`);
    assert.equal(readResult, 'Hello tools');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
