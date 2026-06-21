## ADDED Requirements

### Requirement: Course-level scripts
Each course SHALL provide npm scripts for common operations.

#### Scenario: Dev script
- **WHEN** running `pnpm dev` in course directory
- **THEN** the course SHALL execute using tsx

#### Scenario: Build script
- **WHEN** running `pnpm build` in course directory
- **THEN** the course SHALL compile to JavaScript in dist/

#### Scenario: Install script
- **WHEN** running `pnpm run install:global` in course directory
- **THEN** the course SHALL be installed globally as a command

### Requirement: Root-level scripts
The root package SHALL provide scripts to run or build all courses.

#### Scenario: Run single course from root
- **WHEN** executing `pnpm course:dev 01-intro`
- **THEN** the specified course SHALL execute

#### Scenario: Build all courses
- **WHEN** executing `pnpm build:all`
- **THEN** all courses SHALL be compiled

### Requirement: Filter support
The system SHALL support filtering operations by course.

#### Scenario: Install dependencies for specific course
- **WHEN** executing `pnpm install --filter 01-intro`
- **THEN** only that course's dependencies SHALL be installed
