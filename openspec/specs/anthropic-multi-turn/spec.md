# anthropic-multi-turn 规范

## 目的
定义教程 03-multi-turn 的多轮对话规范，演示如何使用 TypeScript 通过 OpenRouter 的 Anthropic Messages API 格式实现多轮对话和上下文管理。

## 需求

### 需求：教程 03 使用 Anthropic Messages 格式维护对话历史
教程 SHALL 以 `{role, content}` 消息对象数组的形式维护对话历史，使用 Anthropic Messages API 格式。

#### 场景：对话历史结构
- **当** 用户发送消息并收到响应
- **THEN** messages 数组包含 `{ role: "user", content: "..." }` 条目和 `{ role: "assistant", content: "..." }` 条目

### 需求：教程 03 向 Anthropic Messages API 发送多轮请求
教程 SHALL 在每次请求的 `messages` 字段中发送完整的对话历史。

#### 场景：多轮请求
- **当** 用户在持续对话中发送后续消息
- **THEN** 请求体的 `messages` 数组包含所有历史消息
- **并且** 请求包含 `model`、`max_tokens` 和 `stream: true`

### 需求：教程 03 使用 Anthropic SSE 格式进行流式输出
教程 SHALL 解析 Anthropic 的 SSE 事件格式以实现流式响应。

#### 场景：带历史的流式输出
- **当** 收到流式响应
- **THEN** 文本增量写入 stdout 并追加到助手响应
- **并且** 完成的助手响应作为助手消息添加到对话历史

### 需求：教程 03 将请求记录到磁盘
教程 SHALL 将每个请求/响应保存到 `log/` 目录的日志文件中。

#### 场景：日志文件创建
- **当** 向 API 发送请求
- **THEN** 将请求详情和响应写入 `log/turn-<N>.json` 文件

### 需求：教程 03 从根目录配置读取 API 密钥
教程 SHALL 从根目录 `.env` 文件读取 `OPENROUTER_API_KEY`，从根目录 `settings.json` 读取 `BASE_URL` 和 `MODEL`。

#### 场景：缺少 API 密钥
- **当** `OPENROUTER_API_KEY` 未设置
- **THEN** 教程打印错误信息并以退出码 1 退出
