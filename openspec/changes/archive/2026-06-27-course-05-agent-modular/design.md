## Context

当前教程 04-tools 是单文件架构（`index.ts` + `tools.ts`），所有逻辑耦合在一个 `ChatSession` 类中。用户输入、agent 循环、流式解析、工具执行全部串行执行 — 用户必须等待 agent 完成才能输入下一条消息。

本设计为第五课 `courses/05-agent/` 创建模块化 agent 架构，对齐 Claude Code 的核心工具集，并实现用户输入与 agent 循环的并发分离。

## Goals / Non-Goals

**Goals:**
- 模块化拆分：tools、agent loop、stream parser、cli、config 各自独立
- 工具集对齐 Claude Code 的 7 个核心文件/代码工具
- 用户输入与 agent 循环并发 — 用户可随时输入，消息在 agent 小循环结束后插入
- 保持教学渐进性 — 比 04-tools 更接近真实 coding agent

**Non-Goals:**
- 不实现 Task（子 agent）工具
- 不实现 WebFetch/WebSearch/WebSearch 工具
- 不实现 TodoWrite、NotebookEdit
- 不引入新的 npm 依赖
- 不修改现有 01-04 教程

## Decisions

### D1: 并发模型 — 双循环 + 消息队列

**选择**: 使用 Node.js 事件循环的异步特性，通过 `readline` 的异步 `question` 和 `setImmediate`/`setTimeout` 实现两个并发循环。

**架构**:
```
用户输入循环 (cli.ts)          Agent 循环 (agent.ts)
  │                               │
  ├─ rl.question() 等待输入       ├─ while (有消息要处理)
  ├─ 用户输入 → 入队消息          │   ├─ 发送请求到 API
  ├─ 如果 agent 空闲 → 触发处理   │   ├─ 流式解析
  └─ 继续等待下一条输入           │   ├─ 执行工具
                                  │   ├─ 追加工具结果到消息
                                  │   └─ 循环继续或结束
                                  ├─ agent 完成后检查队列
                                  └─ 有新消息 → 继续循环
```

**关键机制**:
- `messageQueue: Message[]` — 用户输入的消息队列
- `agentRunning: boolean` — agent 是否正在执行
- Agent 每次小循环（单次 API 调用 + 工具执行）结束后，检查队列
- 如果队列有新消息，追加到 `messages` 并继续循环
- 如果队列为空且 agent 空闲，等待新用户输入

**替代方案**: 使用 `worker_threads` — 过于复杂，不适合教学。使用 `Promise` 并发 — readline 不支持真正的并发读取。

### D2: 工具定义格式

**选择**: 每个工具在 `tools.ts` 中定义为对象，包含 `name`、`description`、`input_schema`（JSON Schema）。工具执行器是一个 `switch` 分发函数。

**理由**: 与 Claude Code 的工具定义格式一致，且保持简单。每个工具的 schema 直接作为 Anthropic API 的 `tools` 参数。

**工具列表**:
| 工具 | 功能 | 输入参数 |
|------|------|---------|
| `Read` | 读取文件 | `file_path`, `offset?`, `limit?` |
| `Write` | 写入文件 | `file_path`, `content` |
| `Edit` | 精确替换编辑 | `file_path`, `old_string`, `new_string`, `replace_all?` |
| `Bash` | 执行命令 | `command`, `timeout?` |
| `Glob` | 文件匹配 | `pattern`, `path?` |
| `Grep` | 内容搜索 | `pattern`, `path?`, `glob?`, `output_mode?` |
| `LS` | 列出目录 | `path`, `ignore?` |

### D3: 模块划分

```
courses/05-agent/src/
├── index.ts      # 入口：组装模块，启动 CLI
├── config.ts     # 配置加载：读取 settings.json 和 .env
├── cli.ts        # 用户输入循环：readline + 消息队列管理
├── agent.ts      # Agent 核心：消息循环 + API 调用 + 工具分发
├── stream.ts     # SSE 流式解析：处理 Anthropic 流事件
└── tools.ts      # 工具定义与执行器
```

**依赖方向**: `index.ts` → `cli.ts` → `agent.ts` → `stream.ts`、`tools.ts`。`config.ts` 被所有模块引用。

### D4: 消息格式

保持与 04-tools 一致的 Anthropic Messages 格式：
- 用户消息: `{ role: 'user', content: string | ContentBlock[] }`
- 助手消息: `{ role: 'assistant', content: string | ContentBlock[] }`
- 工具调用: `ContentBlock` 中的 `{ type: 'tool_use', id, name, input }`
- 工具结果: 用户消息中的 `{ type: 'tool_result', tool_use_id, content }`

## Risks / Trade-offs

- **[风险] readline 并发输入可能丢失字符** → 使用 `process.stdin` 的 raw mode 和手动 buffer 管理
- **[风险] Agent 循环与用户输入的输出交叉** → 使用 stderr 显示 agent 状态，stdout 显示响应文本，避免混杂
- **[权衡] 工具数量有限** → 7 个工具已覆盖核心文件操作和命令执行，足以演示 coding agent 能力
- **[权衡] 不使用 worker_threads** → 简化教学复杂度，牺牲真正的并行执行
