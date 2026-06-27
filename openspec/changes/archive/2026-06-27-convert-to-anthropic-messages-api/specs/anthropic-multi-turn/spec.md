## ADDED Requirements

### Requirement: Tutorial 03 maintains conversation history in Anthropic messages format
The tutorial SHALL maintain conversation history as an array of `{role, content}` message objects in the Anthropic Messages API format.

#### Scenario: Conversation history structure
- **WHEN** a user sends a message and receives a response
- **THEN** the messages array contains a `{ role: "user", content: [{ type: "text", text: "..." }] }` entry and a `{ role: "assistant", content: [{ type: "text", text: "..." }] }` entry

### Requirement: Tutorial 03 sends multi-turn requests to Anthropic Messages API
The tutorial SHALL send the full conversation history in the `messages` field of each request.

#### Scenario: Multi-turn request
- **WHEN** the user sends a follow-up message in an ongoing conversation
- **THEN** the request body contains all previous messages in the `messages` array
- **AND** the request includes `model`, `max_tokens`, and `stream: true`

### Requirement: Tutorial 03 streams responses using Anthropic SSE format
The tutorial SHALL parse Anthropic's SSE event format for streaming responses.

#### Scenario: Streaming with history
- **WHEN** a streaming response is received
- **THEN** text deltas are written to stdout and appended to the assistant response
- **AND** the completed assistant response is added to the conversation history as an assistant message

### Requirement: Tutorial 03 logs requests to disk
The tutorial SHALL save each request/response to a log file in the `log/` directory.

#### Scenario: Log file creation
- **WHEN** a request is sent to the API
- **THEN** a JSON file is written to `log/turn-<N>.json` containing the request details and response

### Requirement: Tutorial 03 reads API key from ANTHROPIC_API_KEY env var
The tutorial SHALL read the API key from the `ANTHROPIC_API_KEY` environment variable.

#### Scenario: Missing API key
- **WHEN** `ANTHROPIC_API_KEY` is not set
- **THEN** the tutorial prints an error message and exits with code 1
