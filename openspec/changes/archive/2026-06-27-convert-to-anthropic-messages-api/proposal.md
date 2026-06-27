## Why

All four tutorials currently call the Agnes AI Responses API (`POST /v1/responses`), which is a proprietary endpoint. We want to switch to the **Anthropic Messages API** (`POST /v1/messages`) so the tutorials use a well-documented, widely-adopted standard LLM API. This makes the tutorials more useful for learners who want to build real-world agents against Anthropic's API.

## What Changes

- **01-intro**: Replace `fetch('https://apihub.agnes-ai.com/v1/responses')` with `fetch('https://api.anthropic.com/v1/messages')`, update request body to Anthropic Messages format (`messages` array instead of `input`), use `x-api-key` header instead of `Authorization: Bearer`, change model to `claude-sonnet-4-20250514`
- **02-streaming**: Same endpoint/body/header migration, plus rewrite SSE event parsing to handle Anthropic's `message_start`, `content_block_delta`, `message_delta`, `message_stop` events
- **03-multi-turn**: Same migration, restructure conversation history from Agnes `input` array to Anthropic `messages` array format (role/content pairs with `type: "text"` content blocks), change env var from `AGNES_APIKEY` to `ANTHROPIC_API_KEY`
- **04-tools**: Same migration plus restructure tool definitions from Agnes format to Anthropic `tools` format (`input_schema` instead of `parameters`), update function call/stream events to Anthropic's `content_block_start`/`content_block_delta` pattern, restructure tool call+result loop to append `assistant` tool_use blocks + `user` tool_result blocks
- **All tutorials**: Change env var from `AGNES_APIKEY` → `ANTHROPIC_API_KEY`, update `.env.example` files

## Capabilities

### New Capabilities

- `anthropic-basic-request`: Tutorial 01 — basic non-streaming request to Anthropic Messages API
- `anthropic-streaming`: Tutorial 02 — SSE streaming with Anthropic's event format
- `anthropic-multi-turn`: Tutorial 03 — multi-turn conversation using Anthropic Messages API
- `anthropic-tool-calling`: Tutorial 04 — tool definitions and tool-use loop via Anthropic Messages API

### Modified Capabilities

(none)

## Impact

- **Code changes**: All 4 tutorial `src/index.ts` files rewritten (request format, streaming events, tool definitions)
- **Config changes**: All 4 `.env.example` files (`AGNES_APIKEY` → `ANTHROPIC_API_KEY`)
- **Dependencies**: No new npm packages needed — still using raw `fetch()` calls
- **Breaking change**: Users with existing `.env` files need to update their env var name
