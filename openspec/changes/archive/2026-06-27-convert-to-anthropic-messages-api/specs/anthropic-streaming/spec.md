## ADDED Requirements

### Requirement: Tutorial 02 streams responses using Anthropic SSE format
The tutorial SHALL send requests with `stream: true` and parse Anthropic's SSE event format.

#### Scenario: Streaming response
- **WHEN** user runs `pnym dev <prompt>`
- **THEN** the tutorial sends a POST request with `stream: true` to the Anthropic Messages API
- **AND** reads SSE lines from the response body
- **AND** parses each `event:` line to determine event type

### Requirement: Tutorial 02 handles Anthropic streaming event types
The tutorial SHALL correctly handle these Anthropic SSE event types: `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`.

#### Scenario: Text content streaming
- **WHEN** a `content_block_delta` event arrives with `type: "text_delta"`
- **THEN** the `delta.text` value is written to stdout

#### Scenario: Thinking content streaming
- **WHEN** a `content_block_start` event arrives with `type: "thinking"`
- **THEN** the tutorial prints `[thinking]` prefix to stderr
- **AND** subsequent `content_block_delta` events with `type: "thinking_delta"` are written to stderr in dimmed style

### Requirement: Tutorial 02 reads API key from ANTHROPIC_API_KEY env var
The tutorial SHALL read the API key from the `ANTHROPIC_API_KEY` environment variable.

#### Scenario: Missing API key
- **WHEN** `ANTHROPIC_API_KEY` is not set
- **THEN** the tutorial prints an error message and exits with code 1
