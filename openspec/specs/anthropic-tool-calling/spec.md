# anthropic-tool-calling 规范

## 目的
定义教程 04-tools 的工具调用规范，演示如何使用 TypeScript 通过 OpenRouter 的 Anthropic Messages API 格式实现工具调用和 agentic loop。

## 需求

### 需求：教程 04 使用 Anthropic 格式定义工具
教程 SHALL 使用 Anthropic 的 `tools` 数组格式定义工具，包含 `type: "custom"`、`name`、`description` 和 `input_schema` 字段。工具定义 SHALL 在独立的 `src/tools.ts` 文件中维护。

#### 场景：工具定义结构
- **当** 教程定义工具
- **THEN** 每个工具包含 `type: "custom"`、`name`（字符串）、`description`（字符串）和 `input_schema`（包含 `type`、`properties`、`required` 的 JSON Schema 对象）

### 需求：教程 04 在请求中包含工具定义
教程 SHALL 在每次 API 请求的 `tools` 字段中包含工具定义。

#### 场景：带工具的请求
- **当** 向 API 发送请求
- **THEN** 请求体包含 `tools` 数组，其中包含已定义的工具 schema

### 需求：教程 04 从流式响应中处理工具调用
教程 SHALL 从 Anthropic 的流式事件中检测和收集工具调用。

#### 场景：工具调用检测
- **当** 收到 `content_block_start` 事件且 `content_block.type` 为 `"tool_use"`
- **THEN** 教程创建待处理的工具调用条目，包含 `id` 和 `name`
- **并且** 后续 `content_block_delta` 事件中 `type: "input_json_delta"` 的内容追加到工具调用参数

#### 场景：工具调用完成
- **当** 收到 `content_block_stop` 事件且当前块为 tool_use
- **THEN** 完成的工具调用添加到工具调用列表

### 需求：教程 04 本地执行工具并追加结果
教程 SHALL 本地执行工具调用并将结果追加到对话中。

#### 场景：工具执行和结果追加
- **当** 从 API 收到工具调用
- **THEN** 通过 `executeTool()` 本地执行每个工具调用
- **并且** 包含 `tool_use` 内容块的助手消息追加到 messages
- **并且** 包含 `tool_result` 内容块（引用每个 `tool_use` id）的用户消息追加到 messages
- **并且** 使用更新后的 messages 重新发送请求

### 需求：教程 04 循环执行直到没有工具调用
教程 SHALL 继续工具调用循环，直到 API 返回不包含工具调用的响应。

#### 场景：多步骤工具调用
- **当** API 返回工具调用
- **THEN** 教程执行它们、追加结果并重新请求
- **并且** 重复直到 `stop_reason` 为 `"end_turn"`（没有更多工具调用）
- **并且** 限制最多 10 次迭代

### 需求：教程 04 使用 Anthropic SSE 格式进行流式输出
教程 SHALL 在处理工具调用事件的同时，解析 Anthropic 的 SSE 事件格式以实现流式响应。

#### 场景：带工具调用的流式输出
- **当** 流式响应同时包含文本和 tool_use 内容块
- **THEN** 文本增量写入 stdout
- **并且** 工具调用参数增量收集
- **并且** 完整的助手响应追加到对话历史

### 需求：教程 04 从根目录配置读取 API 密钥
教程 SHALL 从根目录 `.env` 文件读取 `OPENROUTER_API_KEY`，从根目录 `settings.json` 读取 `BASE_URL` 和 `MODEL`。

#### 场景：缺少 API 密钥
- **当** `OPENROUTER_API_KEY` 未设置
- **THEN** 教程打印错误信息并以退出码 1 退出
