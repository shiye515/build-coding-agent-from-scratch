## 1. Root Configuration

- [x] 1.1 Create root package.json with pnpm workspace configuration
- [x] 1.2 Create root tsconfig.json with base TypeScript settings
- [x] 1.3 Create pnpm-workspace.yaml
- [x] 1.4 Add tsx as root dev dependency

## 2. Course Template Structure

- [x] 2.1 Create courses/ directory
- [x] 2.2 Create example course directory (01-intro)
- [x] 2.3 Create course-level package.json with dev/build/install scripts
- [x] 2.4 Create course-level tsconfig.json extending root config
- [x] 2.5 Create src/index.ts with starter code
- [x] 2.6 Create course README.md

## 3. Course 01: LLM API Call

- [x] 3.1 Implement LLM API call logic in src/index.ts
- [x] 3.2 Add prompt parameter handling from command line args
- [x] 3.3 Add AGNES_APIKEY environment variable reading
- [x] 3.4 Add API response handling and output
- [x] 3.5 Write README.md with usage instructions

## 4. Root Scripts

- [x] 4.1 Add course:dev script to root package.json
- [x] 4.2 Add build:all script to root package.json
- [x] 4.3 Add course:watch script for development

## 5. Verification

- [x] 5.1 Run pnpm install to verify workspace setup
- [x] 5.2 Test course execution with pnpm dev
- [x] 5.3 Test course compilation with pnpm build
- [x] 5.4 Test course global installation with pnpm install -g
