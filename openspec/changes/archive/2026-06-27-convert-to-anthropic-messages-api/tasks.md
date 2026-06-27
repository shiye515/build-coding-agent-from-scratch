## 1. Environment Configuration

- [x] 1.1 Update all 4 `.env.example` files: change `AGNES_APIKEY` to `ANTHROPIC_API_KEY`
- [x] 1.2 Verify `.env.example` content is correct in each tutorial

## 2. Tutorial 01 — Basic Request (01-intro)

- [x] 2.1 Rewrite `callLLM()` in `courses/01-intro/src/index.ts` to POST to `https://api.anthropic.com/v1/messages`
- [x] 2.2 Update request headers: `x-api-key` (not Bearer), `anthropic-version: 2023-06-01`
- [x] 2.3 Update request body: `model`, `max_tokens`, `messages` array format
- [x] 2.4 Update `ResponsesAPIResult` interface to match Anthropic response format
- [x] 2.5 Update env var reference from `AGNES_APIKEY` to `ANTHROPIC_API_KEY`

## 3. Tutorial 02 — Streaming (02-streaming)

- [x] 3.1 Rewrite `callLLMStream()` in `courses/02-streaming/src/index.ts` to POST to Anthropic Messages API
- [x] 3.2 Update request headers and body (same as tutorial 01 + `stream: true`)
- [x] 3.3 Rewrite SSE parsing to handle Anthropic event types: `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`
- [x] 3.4 Implement thinking detection: `content_block_start` with `type: "thinking"` → print `[thinking]` prefix, subsequent `thinking_delta` events to stderr
- [x] 3.5 Implement text streaming: `text_delta` events to stdout
- [x] 3.6 Update env var reference from `AGNES_APIKEY` to `ANTHROPIC_API_KEY`

## 4. Tutorial 03 — Multi-Turn (03-multi-turn)

- [x] 4.1 Rewrite `sendMessage()` in `courses/03-multi-turn/src/index.ts` to POST to Anthropic Messages API
- [x] 4.2 Update conversation history format: `input` array → `messages` array with `{role, content: [{type: "text", text}]}` format
- [x] 4.3 Update request body: `model`, `max_tokens`, `messages`, `stream: true`
- [x] 4.4 Rewrite `handleStream()` to parse Anthropic SSE events
- [x] 4.5 Update assistant response appending to use Anthropic message format `{role: "assistant", content: [{type: "text", text}]}`
- [x] 4.6 Update env var reference from `AGNES_APIKEY` to `ANTHROPIC_API_KEY`

## 5. Tutorial 04 — Tool Calling (04-tools)

- [x] 5.1 Rewrite tool definitions in `courses/04-tools/src/index.ts` to use Anthropic format: `{name, description, input_schema}`
- [x] 5.2 Rewrite `sendMessage()` to POST to Anthropic Messages API with `tools` array
- [x] 5.3 Update conversation history format: `InputItem[]` → `messages` array with `{role, content}` format
- [x] 5.4 Rewrite `handleStream()` to parse Anthropic SSE events for tool calls: detect `content_block_start` with `type: "tool_use"`, collect `input_json_delta` events
- [x] 5.5 Update tool call loop: append assistant `tool_use` content blocks + user `tool_result` content blocks (with `tool_use` id references) to messages
- [x] 5.6 Update `stop_reason` check: break loop when `stop_reason` is `"end_turn"` instead of checking for empty tool calls
- [x] 5.7 Update env var reference from `AGNES_APIKEY` to `ANTHROPIC_API_KEY`

## 6. Verification

- [x] 6.1 Verify each tutorial compiles without TypeScript errors (`pnpm build` or `tsc --noEmit`)
- [x] 6.2 Verify each tutorial can be run with a valid `OPENROUTER_API_KEY`
