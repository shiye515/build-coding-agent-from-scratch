import fs from 'fs';
import path from 'path';

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export const tools: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The file path to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The file path to write' },
        content: { type: 'string', description: 'The content to write' },
      },
      required: ['path', 'content'],
    },
  },
];

export function executeTool(name: string, args: Record<string, string>): string {
  try {
    switch (name) {
      case 'read_file':
        return fs.readFileSync(args.path, 'utf-8');
      case 'write_file':
        fs.mkdirSync(path.dirname(args.path), { recursive: true });
        fs.writeFileSync(args.path, args.content);
        return `Successfully wrote to ${args.path}`;
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
