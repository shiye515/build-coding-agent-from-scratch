## ADDED Requirements

### Requirement: API endpoint configuration
All tutorials SHALL use `https://openrouter.ai/api/v1/messages` as the API endpoint, with `OPENROUTER_API_KEY` environment variable for authentication via `Authorization: Bearer <key>` header.

#### Scenario: 01-intro calls API
- **WHEN** user runs `pnpm dev "hello"` in `01-intro`
- **THEN** the program sends a POST request to `https://openrouter.ai/api/v1/messages` with `Authorization: Bearer <OPENROUTER_API_KEY>` header

#### Scenario: Missing API key
- **WHEN** `OPENROUTER_API_KEY` is not set in `.env`
- **THEN** the program prints an error message and exits with code 1

### Request format: Anthropic Messages API
All tutorials SHALL use Anthropic Messages API request format: `model`, `messages` array, `max_tokens` (not `max_output_tokens`), and `stream: true/false`.

#### Scenario: 01-intro request body
- **WHEN** `01-intro` sends a request
- **THEN** the request body contains `model: "anthropic/claude-sonnet-4"`, `messages: [{role: "user", content: "<prompt>"}]`, and `max_tokens: 1024`

#### Scenario: 02-streaming request body
- **WHEN** `02-streaming` sends a request
- **THEN** the request body contains `stream: true` in addition to the standard fields

### User message content format
User messages SHALL use Anthropic Messages content format: either a plain string or `[{type: "text", text: "..."}]` array.

#### Scenario: Simple string content
- **WHEN** user sends a simple text prompt
- **THEN** the message is `{role: "user", content: "the prompt text"}`

#### Scenario: Structured content (when needed)
- **WHEN** message needs structured content blocks
- **THEN** the message is `{role: "user", content: [{type: "text", text: "..."}]}`

### Streaming SSE events
Tutorials 02, 03, 04 SHALL handle Anthropic Messages SSE event format: `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`.

#### Scenario: Text streaming in 02-streaming
- **WHEN** `02-streaming` receives a streaming response
- **THEN** it processes `content_block_delta` events with `type: "text"` to stream text output, and `message_stop` to detect completion

#### Scenario: Thinking/reasoning display
- **WHEN** the response contains a thinking content block (`type: "thinking"`)
- **THEN** thinking text is displayed to stderr with dim formatting (`\x1b[2m...\x1b[0m`)

#### Scenario: Stream completion
- **WHEN** `message_stop` event is received
- **THEN** the stream is considered complete and a newline is printed

### Multi-turn conversation history (03-multi-turn)
03-multi-turn SHALL maintain conversation history using Anthropic Messages format with `messages` array.

#### Scenario: Accumulating messages
- **WHEN** user sends multiple messages
- **THEN** each user message and assistant response are appended to the `messages` array as `{role: "user", content: "..."}` and `{role: "assistant", content: "..."}` respectively

#### Scenario: Assistant response as string
- **WHEN** assistant responds with plain text
- **THEN** the assistant message is `{role: "assistant", content: "full response text"}`

### Tool definition format (04-tools)
04-tools SHALL define tools using Anthropic Messages format: `type: "custom"`, `name`, `description`, `input_schema`.

#### Scenario: read_file tool definition
- **WHEN** `04-tools` defines the `read_file` tool
- **THEN** it is `{type: "custom", name: "read_file", description: "Read the contents of a file", input_schema: {type: "object", properties: {path: {type: "string", description: "The file path to read"}}, required: ["path"]}}`

#### Scenario: write_file tool definition
- **WHEN** `04-tools` defines the `write_file` tool
- **THEN** it is `{type: "custom", name: "write_file", description: "Write content to a file", input_schema: {type: "object", properties: {path: {type: "string", ...}, content: {type: "string", ...}}, required: ["path", "content"]}}`

### Tool call response handling (04-tools)
04-tools SHALL handle `tool_use` content blocks from assistant responses and `tool_result` content blocks in subsequent user messages.

#### Scenario: Assistant returns tool_use
- **WHEN** the assistant response contains a `tool_use` content block
- **THEN** the block has `type: "tool_use"`, `id`, `name`, and `input` (parsed JSON arguments)

#### Scenario: Tool result sent back
- **WHEN** a tool is executed and result is ready
- **THEN** a user message is appended with `content: [{type: "tool_result", tool_use_id: "<id>", content: "<result>"}]`

#### Scenario: Agentic loop continues
- **WHEN** assistant response contains `tool_use` blocks
- **THEN** the loop executes tools, appends results, and sends a new request (up to 10 iterations)

#### Scenario: Agentic loop terminates
- **WHEN** assistant response contains only text (no `tool_use` blocks) or `end_turn` stop reason
- **THEN** the loop ends and the response is displayed

### Tool call streaming (04-tools)
04-tools SHALL stream `tool_use` content blocks from the response, accumulating the `input` JSON as it arrives via `input_json_delta` events.

#### Scenario: Streaming tool call arguments
- **WHEN** the response streams a `tool_use` content block
- **THEN** `content_block_delta` events with `type: "input_json_delta"` are accumulated into the tool's `input` field

### Environment files
All `.env` and `.env.example` files SHALL use `OPENROUTER_API_KEY` as the variable name, with the provided token value in `.env`.

#### Scenario: .env.example content
- **WHEN** a user reads `.env.example`
- **THEN** it contains `OPENROUTER_API_KEY=your-openrouter-api-key-here`

#### Scenario: .env content
- **WHEN** a user reads `.env`
- **THEN** it contains `OPENROUTER_API_KEY=sk-or-v1-<your-key>`
