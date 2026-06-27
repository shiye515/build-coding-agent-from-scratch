## ADDED Requirements

### Requirement: Tutorial 04 defines tools in Anthropic tool format
The tutorial SHALL define tools using Anthropic's `tools` array format with `name`, `description`, and `input_schema` fields.

#### Scenario: Tool definition structure
- **WHEN** the tutorial defines tools
- **THEN** each tool has `name` (string), `description` (string), and `input_schema` (JSON Schema object with `type`, `properties`, and `required`)

### Requirement: Tutorial 04 sends tool definitions in request
The tutorial SHALL include tool definitions in the `tools` field of each API request.

#### Scenario: Request with tools
- **WHEN** a request is sent to the API
- **THEN** the request body contains a `tools` array with the defined tool schemas

### Requirement: Tutorial 04 handles tool calls from streaming response
The tutorial SHALL detect and collect tool calls from Anthropic's streaming events.

#### Scenario: Tool call detection
- **WHEN** a `content_block_start` event arrives with `type: "tool_use"`
- **THEN** the tutorial creates a pending tool call entry with the `id` and `name`
- **AND** subsequent `content_block_delta` events with `type: "input_json_delta"` append to the tool call arguments

#### Scenario: Tool call completion
- **WHEN** a `content_block_stop` event arrives for a tool_use block
- **THEN** the completed tool call is added to the tool calls list

### Requirement: Tutorial 04 executes tools locally and appends results
The tutorial SHALL execute tool calls locally and append the results to the conversation.

#### Scenario: Tool execution and result appending
- **WHEN** tool calls are received from the API
- **THEN** each tool call is executed locally via `executeTool()`
- **AND** the assistant message containing `tool_use` content blocks is appended to messages
- **AND** a user message containing `tool_result` content blocks (referencing each `tool_use` id) is appended to messages
- **AND** the request is re-sent with the updated messages

### Requirement: Tutorial 04 loops until no more tool calls
The tutorial SHALL continue the tool calling loop until the API returns a response without tool calls.

#### Scenario: Multi-step tool calling
- **WHEN** the API returns tool calls
- **THEN** the tutorial executes them, appends results, and re-requests
- **AND** repeats until `stop_reason` is `"end_turn"` (no more tool calls)
- **AND** limits to a maximum of 10 iterations

### Requirement: Tutorial 04 streams responses using Anthropic SSE format
The tutorial SHALL parse Anthropic's SSE event format for streaming responses while handling tool call events.

#### Scenario: Streaming with tool calls
- **WHEN** a streaming response contains both text and tool_use content blocks
- **THEN** text deltas are written to stdout
- **AND** tool call arguments are collected incrementally
- **AND** the full assistant response is appended to conversation history

### Requirement: Tutorial 04 reads API key from ANTHROPIC_API_KEY env var
The tutorial SHALL read the API key from the `ANTHROPIC_API_KEY` environment variable.

#### Scenario: Missing API key
- **WHEN** `ANTHROPIC_API_KEY` is not set
- **THEN** the tutorial prints an error message and exits with code 1
