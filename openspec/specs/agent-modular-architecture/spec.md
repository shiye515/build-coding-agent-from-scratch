# agent-modular-architecture Specification

## Purpose
TBD - created by archiving change course-05-agent-modular. Update Purpose after archive.
## Requirements
### Requirement:Agent 按功能拆分为独立模块
教程 05 SHALL 将 agent 拆分为 6 个独立模块：`config.ts`、`cli.ts`、`agent.ts`、`stream.ts`、`tools.ts`、`index.ts`，每个模块职责单一。

#### Scenario:模块文件结构
- **当** 查看 `courses/05-agent/src/` 目录
- **THEN** 包含 `index.ts`、`config.ts`、`cli.ts`、`agent.ts`、`stream.ts`、`tools.ts` 六个文件

#### Scenario:模块依赖方向
- **当** 分析模块依赖
- **THEN** `index.ts` 依赖 `cli.ts`，`cli.ts` 依赖 `agent.ts`，`agent.ts` 依赖 `stream.ts` 和 `tools.ts`，`config.ts` 被所有模块引用

### Requirement:用户输入循环与 agent 循环分离
教程 05 SHALL 实现两个并发循环：用户输入循环（`cli.ts`）和 agent 执行循环（`agent.ts`），用户可在 agent 执行时输入新消息。

#### Scenario:用户在 agent 执行时输入
- **当** agent 正在执行工具调用或流式输出
- **AND** 用户输入一条新消息
- **THEN** 该消息被加入消息队列
- **AND** agent 当前小循环完成后，从队列取出并处理该消息

#### Scenario:agent 空闲时接收用户输入
- **当** agent 空闲且无待处理消息
- **AND** 用户输入一条消息
- **THEN** agent 立即开始处理该消息

#### Scenario:消息队列顺序
- **当** 用户连续输入多条消息
- **THEN** 消息按输入顺序排队
- **AND** agent 按顺序逐条处理

### Requirement:Agent 小循环结束时检查消息队列
教程 05 的 agent SHALL 在每次 API 调用 + 工具执行完成后检查消息队列。

#### Scenario:队列有新消息
- **当** agent 完成一次 API 调用和工具执行
- **AND** 消息队列中有新消息
- **THEN** 将队列中的消息追加到 `messages` 数组
- **AND** 继续执行 agent 循环

#### Scenario:队列为空
- **当** agent 完成一次 API 调用和工具执行
- **AND** 消息队列为空
- **AND** API 响应无工具调用（`stop_reason` 为 `end_turn`）
- **THEN** agent 循环结束，等待新用户输入

### Requirement:config 模块加载根目录配置
`config.ts` SHALL 从项目根目录读取 `.env` 和 `settings.json`，导出 `BASE_URL`、`MODEL`、`API_KEY`。

#### Scenario:配置加载
- **当** agent 启动
- **THEN** 从 `../../.env` 读取 `OPENROUTER_API_KEY`
- **AND** 从 `../../settings.json` 读取 `BASE_URL` 和 `MODEL`

### Requirement:cli 模块管理用户输入和显示
`cli.ts` SHALL 使用 `readline` 实现交互式命令行，管理消息队列，显示 agent 输出。

#### Scenario:启动提示
- **当** agent 启动
- **THEN** 显示工具列表和 `You:` 提示符

#### Scenario:退出命令
- **当** 用户输入 `exit` 或 `quit`
- **THEN** 程序退出

#### Scenario:空输入处理
- **当** 用户输入空字符串
- **THEN** 重新显示 `You:` 提示符，不发送消息

### Requirement:agent 模块执行工具调用循环
`agent.ts` SHALL 实现 agentic loop：发送请求 → 解析流式响应 → 执行工具 → 追加结果 → 循环。

#### Scenario:工具调用循环
- **当** API 响应包含 `tool_use` 内容块
- **THEN** agent 执行工具、追加 `tool_result`、重新发送请求
- **AND** 限制最多 10 次迭代

#### Scenario:纯文本响应
- **当** API 响应不包含工具调用
- **THEN** agent 将文本追加到 `messages` 并结束循环

### Requirement:stream 模块解析 SSE 事件
`stream.ts` SHALL 解析 Anthropic Messages API 的 SSE 流式事件。

#### Scenario:文本流式输出
- **当** 收到 `content_block_delta` 事件（`type: "text_delta"`）
- **THEN** 将文本写入 stdout

#### Scenario:工具调用流式输出
- **当** 收到 `content_block_start` 事件（`type: "tool_use"`）
- **THEN** 创建待处理的工具调用条目
- **并且** 后续 `input_json_delta` 事件累积到工具的 `input` 字段

#### Scenario:思考内容输出
- **当** 收到 `content_block_start` 事件（`type: "thinking"`）
- **THEN** 向 stderr 打印 `[thinking]` 前缀
- **并且** 后续 `thinking_delta` 内容以暗色写入 stderr

