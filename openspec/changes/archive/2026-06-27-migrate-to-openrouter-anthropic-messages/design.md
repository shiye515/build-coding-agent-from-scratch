## Context

教程项目包含 4 个渐进式课程，教授如何从零构建 coding agent：
- `01-intro`: 基础 API 调用（非流式）
- `02-streaming`: SSE 流式响应
- `03-multi-turn`: 多轮对话 + 历史管理
- `04-tools`: 工具调用 + agentic loop

当前代码使用 Agnes AI 的 OpenAI Responses API 格式（`apihub.agnes-ai.com/v1/responses`），该服务不稳定。需要全部迁移到 OpenRouter 的 Anthropic Messages API 格式（`openrouter.ai/api/v1/messages`），这是一个免费且稳定的端点。

Anthropic Messages API 的核心特征：
- 请求体用 `messages` 数组（不是 `input`），`max_tokens`（不是 `max_output_tokens`）
- 用户消息 `content` 可以是字符串或 `[{type: "text", text: "..."}]`
- 流式 SSE 事件使用 `message_start` / `content_block_start` / `content_block_delta` / `message_delta` / `message_stop` 等事件类型
- 工具定义使用 `type: "custom"` + `input_schema`
- 工具调用/结果使用 `tool_use` / `tool_result` 类型块

## Goals / Non-Goals

**Goals:**
- 所有 4 个教程的 API 端点统一迁移到 `openrouter.ai/api/v1/messages`
- 请求/响应格式完全对齐 Anthropic Messages API
- 流式事件处理逻辑重写为 Anthropic Messages SSE 格式
- 工具定义/调用/结果格式对齐 Anthropic Messages 格式
- 环境变量统一为 `OPENROUTER_API_KEY`
- 模型使用 `anthropic/claude-sonnet-4`
- 更新 README 文档反映新 API

**Non-Goals:**
- 不改变教程的教学逻辑和渐进结构
- 不引入新的 npm 依赖（继续使用原生 `fetch`）
- 不添加新的教程课程
- 不修改 `pnpm-workspace.yaml` / `tsconfig.json` 等项目配置

## Decisions

### D1: 使用原生 fetch 而非 Anthropic SDK

**选择**: 继续使用 Node.js 内置 `fetch` + 手动处理 SSE，不引入 `@anthropic-ai/sdk`

**理由**: 教程的目标是教授 agent 构建的底层原理。使用 SDK 会隐藏 API 交互细节，降低教学价值。OpenRouter 兼容 Anthropic Messages API 格式，原生 fetch 完全可以对接。

**替代方案**: 引入 `@anthropic-ai/sdk` — 更简单但隐藏了协议细节，不适合教学场景。

### D2: 流式事件处理策略

**选择**: 直接解析 Anthropic Messages SSE 格式，处理 `message_start` / `content_block_start` / `content_block_delta` / `content_block_stop` / `message_delta` / `message_stop` 事件

**理由**: Anthropic Messages API 的流式事件结构清晰，每个 content block（text、tool_use、thinking）都有明确的生命周期事件，便于教学讲解。

### D3: 多轮对话历史格式

**选择**: 使用 Anthropic Messages 标准格式 — `messages` 数组中的每个元素是 `{role, content}` 对象，`content` 可以是字符串或结构化数组。工具调用通过 assistant 消息中的 `tool_use` 块 + user 消息中的 `tool_result` 块实现。

**理由**: 这是 Anthropic 官方的标准多轮对话格式，教程教授的内容与生产环境一致。

### D4: tool_use / tool_result 格式

**选择**: 
- assistant 返回 `tool_use` 类型 content block（含 `id`, `name`, `input`）
- 用户消息包含 `tool_result` 类型 content block（含 `tool_use_id`, `content`）

**理由**: 这是 Anthropic Messages API 的标准工具调用模式。教程 04 的 tool calling loop 需要相应调整消息拼装逻辑。

## Risks / Trade-offs

- **[风险] OpenRouter 免费模型可能限流** → 已知限制，教程使用 `anthropic/claude-sonnet-4`（OpenRouter 上有免费额度），如遇限流可在 README 中说明
- **[风险] 流式事件格式变化较大** → 逐教程重写，每个教程完成后手动测试验证
- **[权衡] 不使用 SDK** → 增加了代码量但保留了教学透明度，这对教程项目是正确的选择
