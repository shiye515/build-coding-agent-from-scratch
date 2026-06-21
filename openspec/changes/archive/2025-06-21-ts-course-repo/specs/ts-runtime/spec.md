## ADDED Requirements

### Requirement: TypeScript compilation per course
Each course SHALL be independently compilable with its own tsconfig.json.

#### Scenario: Independent compilation
- **WHEN** running tsc in a course directory
- **THEN** only that course's code SHALL be compiled

#### Scenario: Shared base configuration
- **WHEN** a course tsconfig.json extends root config
- **THEN** it SHALL inherit base TypeScript settings

### Requirement: Runtime execution
The system SHALL support direct execution of TypeScript files without pre-compilation.

#### Scenario: Run single file
- **WHEN** executing `pnpm dev` in a course directory
- **THEN** the course's index.ts SHALL be executed

#### Scenario: Watch mode
- **WHEN** executing `pnpm dev:watch` in a course directory
- **THEN** the course SHALL re-run on file changes
