## Why

教程 04-tools 仅提供 `read_file` 和 `write_file` 两个基础工具，无法演示真实 coding agent 的能力。同时，当前架构将用户输入、agent 循环、工具执行全部耦合在一个类中，不利于教学和后续迭代。需要第五课来：(1) 对齐 Claude Code 的核心工具集，(2) 实现用户输入与 agent 循环的并发分离，(3) 将 agent 拆分为可独立迭代的模块。

## What Changes

- **新增** `courses/05-agent/` 教程，包含完整的模块化 agent 实现
- **BREAKING**: 用户输入循环与 agent 循环分离 — 用户可在 agent 执行时输入新消息，消息在当前 agent 小循环结束后插入
- **BREAKING**: 工具集完全替换为 Claude Code 的 7 个核心工具（替代原来的 `read_file`、`write_file`）：
  - `Read` — 读取文件内容
  - `Write` — 写入文件
  - `Edit` — 精确字符串替换编辑文件
  - `Bash` — 执行 shell 命令
  - `Glob` — 文件模式匹配搜索
  - `Grep` — 文件内容正则搜索
  - `LS` — 列出目录内容
- **BREAKING**: Agent 按功能拆分为独立模块：
  - `tools.ts` — 工具定义与执行器
  - `agent.ts` — Agent 循环核心逻辑
  - `stream.ts` — SSE 流式解析
  - `cli.ts` — 用户输入循环与显示
  - `config.ts` — 配置加载
  - `index.ts` — 入口，组装模块
- **非目标**:
  - 不实现 Task（子 agent 派生）工具
  - 不实现 WebFetch/WebSearch 工具
  - 不实现 TodoWrite 任务管理
  - 不实现 NotebookEdit
  - 不改变 API 格式或认证方式

## Capabilities

### New Capabilities

- `agent-modular-architecture`: 模块化 agent 架构 — 将 agent 拆分为 tools、agent loop、stream、cli、config 独立模块，支持并发用户输入
- `claude-code-tools`: Claude Code 风格工具集 — 实现 Read、Write、Edit、Bash、Glob、Grep、LS 七个核心工具

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **新增文件**: `courses/05-agent/src/` 下 6 个模块文件 + `package.json`、`README.md` 等
- **依赖**: 无新增 npm 依赖，继续使用原生 `fetch` 和 Node.js 内置模块
- **配置**: 复用根目录 `.env` 和 `settings.json`
