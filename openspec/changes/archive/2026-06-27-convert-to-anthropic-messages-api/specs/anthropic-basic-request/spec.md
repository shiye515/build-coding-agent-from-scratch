## ADDED Requirements

### Requirement: Tutorial 01 uses Anthropic Messages API for basic requests
The tutorial SHALL send requests to `https://api.anthropic.com/v1/messages` using the Anthropic Messages API format.

#### Scenario: Successful non-streaming request
- **WHEN** user runs `pnpm dev <prompt>`
- **THEN** the tutorial sends a POST request to the Anthropic Messages API with:
  - Header `x-api-key` containing the `ANTHROPIC_API_KEY` value
  - Header `anthropic-version: 2023-06-01`
  - Header `Content-Type: application/json`
  - Body containing `model`, `max_tokens`, and `messages` array
- **AND** the response is printed as JSON to stdout

### Requirement: Tutorial 01 uses correct Anthropic request body format
The request body SHALL contain `model` (string), `max_tokens` (integer), and `messages` (array of `{role, content}` objects).

#### Scenario: Request body structure
- **WHEN** the tutorial constructs the request body
- **THEN** the body contains `model: "claude-sonnet-4-20250514"`, `max_tokens: 4096`, and `messages: [{ role: "user", content: [{ type: "text", text: "<prompt>" }] }]`

### Requirement: Tutorial 01 reads API key from ANTHROPIC_API_KEY env var
The tutorial SHALL read the API key from the `ANTHROPIC_API_KEY` environment variable.

#### Scenario: Missing API key
- **WHEN** `ANTHROPIC_API_KEY` is not set
- **THEN** the tutorial prints an error message and exits with code 1
