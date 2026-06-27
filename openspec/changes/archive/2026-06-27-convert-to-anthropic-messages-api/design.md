## Context

All four tutorials currently use the Agnes AI Responses API (`POST /v1/responses`) with raw `fetch()` calls. The API uses a proprietary request/response format: `input` string/array, `stream: true` flag, and custom SSE event types (`response.output_item.added`, `response.output_text.delta`, `response.function_call_arguments.delta`, etc.).

We need to convert to the **Anthropic Messages API** (`POST /v1/messages`), which uses a different format: `messages` array, `model` field, streaming via `event: text_delta` SSE events, and structured `content` blocks.

## Goals / Non-Goals

**Goals:**
- Convert all 4 tutorials to use the Anthropic Messages API
- Maintain equivalent functionality (basic request, streaming, multi-turn, tool calling)
- Keep using raw `fetch()` (no SDK) to stay consistent with the tutorial's learning approach
- Update env var from `AGNES_APIKEY` to `ANTHROPIC_API_KEY`

**Non-Goals:**
- Introducing the `@anthropic-ai/sdk` package (tutorials teach raw HTTP calls)
- Adding new tutorials or features beyond API migration
- Changing the tutorial structure or file organization

## Decisions

### 1. Endpoint and Auth

**Choice:** `https://api.anthropic.com/v1/messages` with `x-api-key` header and `anthropic-version: 2023-06-01`

**Rationale:** Standard Anthropic API. The `x-api-key` header (not `Authorization: Bearer`) is Anthropic's auth convention. Must include `anthropic-version` header.

### 2. Model Name

**Choice:** `claude-sonnet-4-20250514`

**Rationale:** Latest Sonnet model, good balance of capability and cost for tutorials.

### 3. Request Body Format

**Choice:** Use `messages` array with `role`/`content` pairs. Content blocks use `{ type: "text", text: "..." }` format.

**Rationale:** Anthropic Messages API requires `messages` array (not `input`). For simple prompts, single user message. For multi-turn, alternating user/assistant messages. System prompt goes in top-level `system` field (not inside messages).

### 4. Streaming Event Mapping

**Choice:** Map Anthropic SSE events to the same output behavior:
- `message_start` → no-op (metadata)
- `content_block_start` with `type: "thinking"` → print `[thinking]` prefix
- `content_block_delta` with `type: "thinking_delta"` → write to stderr (dimmed)
- `content_block_delta` with `type: "text_delta"` → write to stdout
- `content_block_stop` → end of a content block
- `message_delta` → contains `stop_reason`, usage stats
- `message_stop` → end of response

**Rationale:** Anthropic's streaming uses finer-grained events. The mapping preserves the same user-facing behavior (thinking to stderr, response to stdout).

### 5. Tool Definitions Format

**Choice:** Anthropic tool format with `name`, `description`, and `input_schema` (instead of Agnes `parameters`).

```json
{
  "name": "read_file",
  "description": "Read the contents of a file",
  "input_schema": {
    "type": "object",
    "properties": { ... },
    "required": [...]
  }
}
```

### 6. Tool Call Response Format

**Choice:** Tool calls arrive as `content_block_start` with `type: "tool_use"` and `content_block_delta` with `type: "input_json_delta"`. Tool results are sent as a `user` message with `type: "tool_result"` content blocks, referencing the `tool_use` id from the assistant message.

**Rationale:** Anthropic requires the full assistant message (with tool_use blocks) to be appended to messages, followed by a user message containing tool_result blocks. This differs from Agnes's flat `function_call`/`function_call_output` items.

## Risks / Trade-offs

- **[Risk]** Users with existing `.env` files need to update env var → **Mitigation**: Clear error message when `ANTHROPIC_API_KEY` is not set
- **[Risk]** Streaming event format is significantly different → **Mitigation**: Each tutorial's streaming handler rewritten to match Anthropic's event structure
- **[Risk]** Tool calling loop structure changes significantly (assistant tool_use blocks + user tool_result blocks) → **Mitigation**: Tutorial 04 restructured to build message history correctly
