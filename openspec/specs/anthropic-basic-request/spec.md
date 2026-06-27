# anthropic-basic-request 规范

## 目的
定义教程 01-intro 的基础 API 调用规范，演示如何使用 TypeScript 通过 OpenRouter 的 Anthropic Messages API 格式发送非流式请求。

## 需求

### 需求：教程 01 使用 Anthropic Messages API 进行基础请求
教程 SHALL 向根目录 `settings.json` 中配置的 `BASE_URL` 端点发送请求，使用 Anthropic Messages API 格式。

#### 场景：非流式请求成功
- **当** 用户运行 `pnpm dev <prompt>`
- **THEN** 教程向 `${BASE_URL}/messages` 发送 POST 请求，包含：
  - Header `Authorization: Bearer <OPENROUTER_API_KEY>`
  - Header `Content-Type: application/json`
  - Body 包含 `model`、`max_tokens` 和 `messages` 数组
- **并且** 响应以 JSON 格式打印到 stdout

### 需求：教程 01 使用正确的请求体格式
请求体 SHALL 包含 `model`（字符串，来自 `settings.json`）、`max_tokens`（整数）和 `messages`（`{role, content}` 对象数组）。

#### 场景：请求体结构
- **当** 教程构建请求体
- **THEN** body 包含 `model`（来自 settings.json）、`max_tokens: 1024`，以及 `messages: [{ role: "user", content: "<prompt>" }]`

### 需求：教程 01 从根目录配置读取 API 密钥
教程 SHALL 从根目录 `.env` 文件读取 `OPENROUTER_API_KEY`，从根目录 `settings.json` 读取 `BASE_URL` 和 `MODEL`。

#### 场景：缺少 API 密钥
- **当** `OPENROUTER_API_KEY` 未设置
- **THEN** 教程打印错误信息并以退出码 1 退出
