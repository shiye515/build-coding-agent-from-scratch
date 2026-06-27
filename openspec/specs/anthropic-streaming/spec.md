# anthropic-streaming 规范

## 目的
定义教程 02-streaming 的流式输出规范，演示如何使用 TypeScript 通过 OpenRouter 的 Anthropic Messages API 格式实现 SSE 流式响应。

## 需求

### 需求：教程 02 使用 Anthropic SSE 格式进行流式输出
教程 SHALL 发送包含 `stream: true` 的请求，并解析 Anthropic 的 SSE 事件格式。

#### 场景：流式响应
- **当** 用户运行 `pnpm dev <prompt>`
- **THEN** 教程向 API 发送包含 `stream: true` 的 POST 请求
- **并且** 从响应体读取 SSE 行
- **并且** 解析每个 `data: ` 前缀的行以获取事件数据

### 需求：教程 02 处理 Anthropic 流式事件类型
教程 SHALL 正确处理以下 Anthropic SSE 事件类型：`message_start`、`content_block_start`、`content_block_delta`、`content_block_stop`、`message_delta`、`message_stop`。

#### 场景：文本内容流式输出
- **当** 收到 `content_block_delta` 事件且 `delta.type` 为 `"text_delta"`
- **THEN** `delta.text` 的值写入 stdout

#### 场景：思考内容流式输出
- **当** 收到 `content_block_start` 事件且 `content_block.type` 为 `"thinking"`
- **THEN** 教程向 stderr 打印 `[thinking]` 前缀
- **并且** 后续 `content_block_delta` 事件中 `type: "thinking_delta"` 的内容以暗色样式写入 stderr

### 需求：教程 02 从根目录配置读取 API 密钥
教程 SHALL 从根目录 `.env` 文件读取 `OPENROUTER_API_KEY`，从根目录 `settings.json` 读取 `BASE_URL` 和 `MODEL`。

#### 场景：缺少 API 密钥
- **当** `OPENROUTER_API_KEY` 未设置
- **THEN** 教程打印错误信息并以退出码 1 退出
