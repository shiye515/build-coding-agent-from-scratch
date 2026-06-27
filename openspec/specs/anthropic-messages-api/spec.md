# anthropic-messages-api 规范

## 目的
定义所有教程统一使用 OpenRouter Anthropic Messages API 的跨教程规范，包括端点配置、请求格式、流式事件、多轮对话和工具调用的通用要求。

## 需求

### 需求：API 端点配置
所有教程 SHALL 使用根目录 `settings.json` 中配置的 `BASE_URL` 作为 API 端点，使用根目录 `.env` 中的 `OPENROUTER_API_KEY` 进行认证（通过 `Authorization: Bearer <key>` header）。

#### 场景：01-intro 调用 API
- **当** 用户在 `01-intro` 运行 `pnpm dev "hello"`
- **THEN** 程序向 `${BASE_URL}/messages` 发送 POST 请求，包含 `Authorization: Bearer <OPENROUTER_API_KEY>` header

#### 场景：缺少 API 密钥
- **当** `.env` 中未设置 `OPENROUTER_API_KEY`
- **THEN** 程序打印错误信息并以退出码 1 退出

### 需求：请求格式遵循 Anthropic Messages API
所有教程 SHALL 使用 Anthropic Messages API 请求格式：`model`（来自 `settings.json`）、`messages` 数组、`max_tokens`（不是 `max_output_tokens`）和 `stream: true/false`。

#### 场景：01-intro 请求体
- **当** `01-intro` 发送请求
- **THEN** 请求体包含 `model`（来自 settings.json）、`messages: [{role: "user", content: "<prompt>"}]` 和 `max_tokens: 1024`

#### 场景：02-streaming 请求体
- **当** `02-streaming` 发送请求
- **THEN** 请求体在标准字段之外还包含 `stream: true`

### 需求：用户消息内容格式
用户消息 SHALL 使用 Anthropic Messages 内容格式：纯字符串或 `[{type: "text", text: "..."}]` 数组。

#### 场景：简单字符串内容
- **当** 用户发送简单文本提示
- **THEN** 消息为 `{role: "user", content: "提示文本"}`

#### 场景：结构化内容（需要时）
- **当** 消息需要结构化内容块
- **THEN** 消息为 `{role: "user", content: [{type: "text", text: "..."}]}`

### 需求：流式 SSE 事件
教程 02、03、04 SHALL 处理 Anthropic Messages SSE 事件格式：`message_start`、`content_block_start`、`content_block_delta`、`content_block_stop`、`message_delta`、`message_stop`。

#### 场景：02-streaming 中的文本流式输出
- **当** `02-streaming` 收到流式响应
- **THEN** 处理 `content_block_delta` 事件（`type: "text_delta"`）以流式输出文本，处理 `message_stop` 以检测完成

#### 场景：思考/推理显示
- **当** 响应包含思考内容块（`type: "thinking"`）
- **THEN** 思考文本以暗色格式显示到 stderr（`\x1b[2m...\x1b[0m`）

#### 场景：流完成
- **当** 收到 `message_stop` 事件
- **THEN** 流被视为完成并打印换行符

### 需求：多轮对话历史（03-multi-turn）
03-multi-turn SHALL 使用 Anthropic Messages 格式的 `messages` 数组维护对话历史。

#### 场景：累积消息
- **当** 用户发送多条消息
- **THEN** 每条用户消息和助手响应分别追加到 `messages` 数组，格式为 `{role: "user", content: "..."}` 和 `{role: "assistant", content: "..."}`

#### 场景：助手响应为字符串
- **当** 助手以纯文本响应
- **THEN** 助手消息为 `{role: "assistant", content: "完整响应文本"}`

### 需求：工具定义格式（04-tools）
04-tools SHALL 使用 Anthropic Messages 格式定义工具：`type: "custom"`、`name`、`description`、`input_schema`。

#### 场景：read_file 工具定义
- **当** `04-tools` 定义 `read_file` 工具
- **THEN** 格式为 `{type: "custom", name: "read_file", description: "读取文件内容", input_schema: {type: "object", properties: {path: {type: "string", description: "要读取的文件路径"}}, required: ["path"]}}`

#### 场景：write_file 工具定义
- **当** `04-tools` 定义 `write_file` 工具
- **THEN** 格式为 `{type: "custom", name: "write_file", description: "写入文件内容", input_schema: {type: "object", properties: {path: {type: "string", ...}, content: {type: "string", ...}}, required: ["path", "content"]}}`

### 需求：工具调用响应处理（04-tools）
04-tools SHALL 处理助手响应中的 `tool_use` 内容块和后续用户消息中的 `tool_result` 内容块。

#### 场景：助手返回 tool_use
- **当** 助手响应包含 `tool_use` 内容块
- **THEN** 该块包含 `type: "tool_use"`、`id`、`name` 和 `input`（解析后的 JSON 参数）

#### 场景：发送工具结果
- **当** 工具执行完毕且结果就绪
- **THEN** 追加用户消息，`content: [{type: "tool_result", tool_use_id: "<id>", content: "<结果>"}]`

#### 场景：Agentic loop 继续
- **当** 助手响应包含 `tool_use` 块
- **THEN** 循环执行工具、追加结果并发送新请求（最多 10 次迭代）

#### 场景：Agentic loop 终止
- **当** 助手响应仅包含文本（无 `tool_use` 块）或 `stop_reason` 为 `end_turn`
- **THEN** 循环结束并显示响应

### 需求：工具调用流式输出（04-tools）
04-tools SHALL 流式输出响应中的 `tool_use` 内容块，通过 `input_json_delta` 事件增量累积 `input` JSON。

#### 场景：流式工具调用参数
- **当** 响应流式输出 `tool_use` 内容块
- **THEN** `content_block_delta` 事件中 `type: "input_json_delta"` 的内容累积到工具的 `input` 字段

### 需求：环境文件
所有 `.env` 和 `.env.example` 文件 SHALL 使用 `OPENROUTER_API_KEY` 作为变量名。各教程从根目录读取配置，不再使用独立的 `.env` 文件。

#### 场景：.env.example 内容
- **当** 用户查看 `.env.example`
- **THEN** 包含 `OPENROUTER_API_KEY=your-openrouter-api-key-here`

#### 场景：.env 内容
- **当** 用户查看根目录 `.env`
- **THEN** 包含 `OPENROUTER_API_KEY=sk-or-v1-...`
