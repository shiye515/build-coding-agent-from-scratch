## Why

构建一个 TypeScript 系列课程仓库，需要标准化的项目结构和运行配置，使每节课程可以独立运行和测试，方便学习者按章节学习。

## What Changes

- 创建 monorepo 风格的课程仓库结构
- 配置 TypeScript 编译器和项目配置
- 每节课程使用独立目录，包含独立的 `tsconfig.json` 和 `package.json`
- 提供统一的开发脚本和构建流程
- 添加示例课程目录结构作为模板

## Capabilities

### New Capabilities

- `repo-scaffolding`: 仓库目录结构初始化，包含根配置和课程目录模板
- `ts-runtime`: TypeScript 运行时配置，支持独立编译和执行每节课程
- `dev-scripts`: 开发脚本配置，支持单节课程运行和全量构建
- `course-01-llm-api`: 第一课内容，LLM API 调用示例

### Modified Capabilities

<!-- 无现有能力需要修改 -->

## Impact

- 新增文件：根目录配置文件（tsconfig.json, package.json）、课程目录模板
- 依赖：TypeScript, ts-node 或 tsx
- 影响范围：新仓库初始化，无现有代码影响
