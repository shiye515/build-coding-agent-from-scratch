## 1. 项目脚手架

- [x] 1.1 创建 `courses/05-agent/` 目录结构：`src/`、`package.json`、`tsconfig.json`、`.env.example`、`README.md`
- [x] 1.2 配置 `package.json`：添加 `dotenv` 依赖、`tsx` dev 脚本、workspace 配置
- [x] 1.3 配置 `tsconfig.json`：对齐现有教程的 TypeScript 配置

## 2. 配置模块

- [x] 2.1 实现 `src/config.ts`：从根目录读取 `.env` 和 `settings.json`，导出 `BASE_URL`、`MODEL`、`API_KEY`

## 3. 工具定义与执行

- [x] 3.1 实现 `src/tools.ts`：定义 7 个工具（Read、Write、Edit、Bash、Glob、Grep、LS）的 schema 和执行器
- [x] 3.2 实现 Read 工具：读取文件内容，支持 offset 和 limit 参数
- [x] 3.3 实现 Write 工具：写入文件，自动创建父目录
- [x] 3.4 实现 Edit 工具：精确字符串替换，支持 replace_all
- [x] 3.5 实现 Bash 工具：执行 shell 命令，支持 timeout
- [x] 3.6 实现 Glob 工具：使用 `glob` 模块或 `fs` 搜索文件
- [x] 3.7 实现 Grep 工具：使用 `child_process` 调用 `rg` 或实现简单正则搜索
- [x] 3.8 实现 LS 工具：列出目录内容，支持 ignore 过滤

## 4. 流式解析模块

- [x] 4.1 实现 `src/stream.ts`：解析 Anthropic Messages SSE 事件，处理 text_delta、thinking_delta、input_json_delta、tool_use 等事件类型

## 5. Agent 核心模块

- [x] 5.1 实现 `src/agent.ts`：Agent 循环核心 — 发送请求、解析流式响应、执行工具、追加结果
- [x] 5.2 实现消息队列机制 — `messageQueue` 数组 + `agentRunning` 状态标志
- [x] 5.3 实现 agent 小循环结束时检查队列 — 有新消息则追加并继续循环

## 6. CLI 模块

- [x] 6.1 实现 `src/cli.ts`：readline 交互式输入循环 + 消息队列管理
- [x] 6.2 实现用户输入与 agent 并发 — 用户输入入队，agent 空闲时触发处理
- [x] 6.3 实现显示逻辑 — stdout 输出响应文本，stderr 输出 agent 状态和 thinking

## 7. 入口与集成

- [x] 7.1 实现 `src/index.ts`：组装所有模块，启动 CLI
- [x] 7.2 端到端测试 — 验证基础对话、工具调用、并发输入功能

## 8. 文档

- [x] 8.1 编写 `README.md`：教程说明、运行方式、工具列表、架构概览
