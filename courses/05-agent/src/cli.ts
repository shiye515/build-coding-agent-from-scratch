import * as readline from 'readline';
import { Agent } from './agent.js';
import { CONTEXT_WINDOW } from './config.js';

export class CLI {
  private agent: Agent;
  private rl: readline.Interface;
  private isClosed = false;

  constructor() {
    this.agent = new Agent({
      onText: (text) => process.stdout.write(text),
      onThinkingStart: () => process.stderr.write('\x1b[2m[thinking]\x1b[0m '),
      onThinking: (text) => process.stderr.write('\x1b[2m' + text + '\x1b[0m'),
      onToolCall: (toolCall) => process.stderr.write(`\x1b[2m[tool: ${toolCall.name}]\x1b[0m\n`),
      onToolResult: (name, result) => process.stderr.write(`\x1b[2m${result}\x1b[0m\n\n`),
      onRequestStart: (index) => process.stderr.write(`\x1b[2m[request #${index}]\x1b[0m\n`),
      onUsage: (usage, percent) => {
        const bar = this.formatBar(percent);
        process.stderr.write(
          `\x1b[2m[context: ${bar} ${percent}% | tokens: ${usage.inputTokens} in / ${usage.outputTokens} out]\x1b[0m\n`,
        );
      },
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.rl.on('close', () => {
      this.isClosed = true;
    });
  }

  private formatBar(percent: number): string {
    const filled = Math.round(percent / 5);
    const empty = 20 - filled;
    return '[' + '#'.repeat(filled) + '-'.repeat(empty) + ']';
  }

  start(): void {
    console.log('Agent Chat (type "exit" to quit)\n');
    console.log('Tools: Read, Write, Edit, Bash, Glob, Grep, LS');
    console.log(`Context window: ${(CONTEXT_WINDOW / 1000).toFixed(0)}k tokens\n`);
    this.prompt();
  }

  private prompt(): void {
    if (this.isClosed) {
      return;
    }

    this.rl.question('You: ', async (input) => {
      const trimmed = input.trim();

      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
        console.log('Bye!');
        this.rl.close();
        return;
      }

      if (!trimmed) {
        this.prompt();
        return;
      }

      this.agent.queueMessage(trimmed);

      if (!this.agent.isRunning) {
        await this.processAgent();
      }

      if (!this.isClosed) {
        this.prompt();
      }
    });
  }

  private async processAgent(): Promise<void> {
    while (await this.agent.processNextMessage()) {
      process.stdout.write('\n');
    }
  }
}
