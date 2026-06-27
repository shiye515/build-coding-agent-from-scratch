## 1. Environment Configuration

- [x] 1.1 Update all 4 `.env` files to use `OPENROUTER_API_KEY` with the provided token
- [x] 1.2 Update all 4 `.env.example` files to use `OPENROUTER_API_KEY=your-openrouter-api-key-here`

## 2. Tutorial 01-intro

- [x] 2.1 Rewrite `01-intro/src/index.ts` to use Anthropic Messages API (endpoint, request format, env var, model)
- [x] 2.2 Test `01-intro` with `pnpm dev "hello"` to verify basic API call works

## 3. Tutorial 02-streaming

- [x] 3.1 Rewrite `02-streaming/src/index.ts` to use Anthropic Messages API with SSE streaming (`message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop` events)
- [x] 3.2 Test `02-streaming` with `pnpm dev "hello"` to verify streaming output works

## 4. Tutorial 03-multi-turn

- [x] 4.1 Rewrite `03-multi-turn/src/index.ts` to use Anthropic Messages API format — `messages` array with `{role, content}` pairs, streaming, and history management
- [x] 4.2 Test `03-multi-turn` with multi-turn conversation to verify history accumulation

## 5. Tutorial 04-tools

- [x] 5.1 Rewrite `04-tools/src/tools.ts` — update tool definitions to Anthropic format (`type: "custom"`, `input_schema`)
- [x] 5.2 Rewrite `04-tools/src/index.ts` — migrate request format, tool definition, tool call streaming (`input_json_delta`), tool result format (`tool_result`), and agentic loop
- [x] 5.3 Test `04-tools` with tool-calling scenarios (read_file, write_file) to verify agentic loop works

## 6. Documentation

- [x] 6.1 Update README.md files in all tutorials to reflect new API endpoint and usage instructions
