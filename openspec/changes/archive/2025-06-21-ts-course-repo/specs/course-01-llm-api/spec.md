## ADDED Requirements

### Requirement: LLM API call functionality
The course SHALL demonstrate how to call an LLM API using TypeScript.

#### Scenario: Accept prompt parameter
- **WHEN** running the course with a prompt argument
- **THEN** the prompt SHALL be passed to the LLM API

#### Scenario: Use API key from environment
- **WHEN** making an API call
- **THEN** the system SHALL read API key from AGNES_APIKEY environment variable via .env file

#### Scenario: Use OpenAI Responses API
- **WHEN** making an API call
- **THEN** the system SHALL use OpenAI Responses API format (POST /v1/responses with input field)

#### Scenario: Return API response
- **WHEN** API call completes
- **THEN** the response SHALL be parsed from output array and printed to console

### Requirement: Course structure
The first course SHALL follow the standard course directory structure.

#### Scenario: Standard files exist
- **WHEN** the course is created
- **THEN** it SHALL contain src/index.ts, tsconfig.json, package.json, and README.md

#### Scenario: README contains usage instructions
- **WHEN** viewing the course README
- **THEN** it SHALL explain how to run the course and set the API key
