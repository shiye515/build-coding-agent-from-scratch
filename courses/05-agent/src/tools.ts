import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export const tools: ToolDefinition[] = [
  {
    name: 'Read',
    description:
      'Reads a file from the local filesystem. The file_path parameter must be an absolute path. By default reads up to 2000 lines. Supports offset and limit parameters.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'The absolute path to the file to read' },
        offset: { type: 'number', description: 'The line number to start reading from' },
        limit: { type: 'number', description: 'The number of lines to read' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'Write',
    description:
      'Writes a file to the local filesystem. Overwrites existing files. Creates parent directories if needed.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to write',
        },
        content: { type: 'string', description: 'The content to write' },
      },
      required: ['file_path', 'content'],
    },
  },
  {
    name: 'Edit',
    description:
      'Performs exact string replacements in files. The old_string must match exactly. Use replace_all to replace all occurrences.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to modify',
        },
        old_string: { type: 'string', description: 'The text to replace' },
        new_string: { type: 'string', description: 'The text to replace it with' },
        replace_all: {
          type: 'boolean',
          description: 'Replace all occurrences (default false)',
        },
      },
      required: ['file_path', 'old_string', 'new_string'],
    },
  },
  {
    name: 'Bash',
    description: 'Executes a bash command with optional timeout. Returns stdout and stderr.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The command to execute' },
        timeout: {
          type: 'number',
          description: 'Optional timeout in milliseconds (max 600000)',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'Glob',
    description: 'Fast file pattern matching. Supports glob patterns like "**/*.js".',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'The glob pattern to match files' },
        path: { type: 'string', description: 'The directory to search in' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'Grep',
    description: 'Searches file contents using regular expressions (ripgrep-based).',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'The regex pattern to search for' },
        path: { type: 'string', description: 'File or directory to search in' },
        glob: { type: 'string', description: 'Glob pattern to filter files' },
        output_mode: {
          type: 'string',
          enum: ['content', 'files_with_matches', 'count'],
          description: 'Output mode (default: files_with_matches)',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'LS',
    description: 'Lists files and directories in a given path.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The absolute path to list' },
        ignore: {
          type: 'array',
          items: { type: 'string' },
          description: 'Glob patterns to ignore',
        },
      },
      required: ['path'],
    },
  },
];

export function executeTool(name: string, args: Record<string, any>): string {
  try {
    switch (name) {
      case 'Read':
        return readFile(args);
      case 'Write':
        return writeFile(args);
      case 'Edit':
        return editFile(args);
      case 'Bash':
        return bashExec(args);
      case 'Glob':
        return globSearch(args);
      case 'Grep':
        return grepSearch(args);
      case 'LS':
        return lsDir(args);
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function readFile(args: Record<string, any>): string {
  const { file_path, offset, limit } = args;
  if (!fs.existsSync(file_path)) {
    return `Error: File not found: ${file_path}`;
  }
  const content = fs.readFileSync(file_path, 'utf-8');
  const lines = content.split('\n');
  const start = (offset || 1) - 1;
  const end = limit ? start + limit : lines.length;
  return lines
    .slice(start, end)
    .map((line, i) => `${start + i + 1}: ${line}`)
    .join('\n');
}

function writeFile(args: Record<string, any>): string {
  const { file_path, content } = args;
  const dir = path.dirname(file_path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(file_path, content);
  return `File written successfully: ${file_path}`;
}

function editFile(args: Record<string, any>): string {
  const { file_path, old_string, new_string, replace_all } = args;
  if (!fs.existsSync(file_path)) {
    return `Error: File not found: ${file_path}`;
  }
  const content = fs.readFileSync(file_path, 'utf-8');
  if (!content.includes(old_string)) {
    return `Error: old_string not found in ${file_path}`;
  }
  const newContent = replace_all
    ? content.replaceAll(old_string, new_string)
    : content.replace(old_string, new_string);
  fs.writeFileSync(file_path, newContent);
  return `File edited successfully: ${file_path}`;
}

function bashExec(args: Record<string, any>): string {
  const { command, timeout } = args;
  const timeoutMs = Math.min(timeout || 120000, 600000);
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
    });
    return output || '(no output)';
  } catch (error: any) {
    const stdout = error.stdout || '';
    const stderr = error.stderr || '';
    const status = error.status || 'unknown';
    return `Exit code: ${status}\n${stderr}${stdout}`;
  }
}

function globSearch(args: Record<string, any>): string {
  const { pattern, path: searchPath } = args;
  const cwd = searchPath || process.cwd();
  try {
    const output = execSync(
      `find "${cwd}" -name "${pattern.replace(/\*/g, '*')}" -type f 2>/dev/null | head -200`,
      { encoding: 'utf-8', timeout: 10000 },
    );
    return output.trim() || '(no matches)';
  } catch {
    return '(no matches)';
  }
}

function grepSearch(args: Record<string, any>): string {
  const { pattern, path: searchPath, glob, output_mode } = args;
  const mode = output_mode || 'files_with_matches';
  const target = searchPath || '.';
  const globFlag = glob ? `--glob "${glob}"` : '';
  const modeFlag = mode === 'content' ? '-n' : mode === 'count' ? '-c' : '';
  try {
    const output = execSync(
      `rg ${modeFlag} ${globFlag} "${pattern}" "${target}" 2>/dev/null | head -200`,
      { encoding: 'utf-8', timeout: 10000 },
    );
    return output.trim() || '(no matches)';
  } catch {
    return '(no matches)';
  }
}

function lsDir(args: Record<string, any>): string {
  const dirPath = args.path || process.cwd();
  const ignore = Array.isArray(args.ignore) ? args.ignore : [];
  if (!fs.existsSync(dirPath)) {
    return `Error: Directory not found: ${dirPath}`;
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const ignoreSet = new Set<string>(ignore || []);
  const filtered = entries.filter((entry) => {
    for (const pattern of ignoreSet) {
      if (entry.name.match(new RegExp(pattern.replace(/\*/g, '.*')))) {
        return false;
      }
    }
    return true;
  });
  return filtered.map((entry) => `${entry.isDirectory() ? 'd' : '-'} ${entry.name}`).join('\n');
}
