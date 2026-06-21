## ADDED Requirements

### Requirement: Root project configuration
The system SHALL provide root-level configuration files including package.json, tsconfig.json, and pnpm-workspace.yaml.

#### Scenario: Root package.json exists
- **WHEN** repository is initialized
- **THEN** root package.json SHALL exist with pnpm workspace configuration

#### Scenario: Root tsconfig.json exists
- **WHEN** repository is initialized
- **THEN** root tsconfig.json SHALL provide base TypeScript configuration

### Requirement: Course directory structure
The system SHALL organize courses in a `courses/` directory with each lesson in its own subdirectory.

#### Scenario: Course directory created
- **WHEN** a new course is added
- **THEN** it SHALL be placed under `courses/<lesson-number>-<lesson-name>/`

#### Scenario: Course contains required files
- **WHEN** a course directory is created
- **THEN** it SHALL contain `src/index.ts`, `tsconfig.json`, and `package.json`

### Requirement: Course template
The system SHALL provide a template for creating new courses with standard structure.

#### Scenario: Template provides standard files
- **WHEN** creating a new course from template
- **THEN** it SHALL include starter code, configuration, and README
