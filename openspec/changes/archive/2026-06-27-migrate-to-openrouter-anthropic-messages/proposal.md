## Why

教程代码当前使用 Agnes AI 的 OpenAI Responses API 格式 (`apihub.agnes-ai.com/v1/responses`)，该服务不可靠且不稳定。需要统一迁移到 OpenRouter 提供的免费 Anthropic Messages API (`openrouter.ai/api/v1/messages`)，这是一个稳定、免费、文档完善的 API 端点，且 Anthropic Messages API 格式更贴近业界主流（Anthropic 官方 SDK 的标准格式），对教程教学更友好。

## What Changes

- **BREAKING**: 所有 4 个教程的 API 端点从 `apihub.agnes-ai.com/v1/responses` 改为 `openrouter.ai/api/v1/messages`
- **BREAKING**: 请求格式从 OpenAI Responses API 格式（`input` 数组 + `max_output_tokens`）改为 Anthropic Messages API 格式（`messages` 数组 + `max_tokens`）
- **BREAKING**: 响应流格式从 OpenAI Responses SSE events（`response.output_text.delta` 等）改为 Anthropic Messages SSE events（`content_block_delta` 等）
- **BREAKING**: 用户消息格式从 `[{ type: 'input_text', text: '...' }]` 改为 Anthropic Messages 的 `content` 字段（字符串或 `[{ type: 'text', text: '...' }]`）
- **BREAKING**: 工具定义格式从 `type: 'function'` + `parameters` 改为 Anthropic Messages 的 `type: 'custom'` + `input_schema`
- **BREAKING**: 工具调用/结果格式从 `function_call` / `function_call_output` 改为 `tool_use` / `tool_result`
- 环境变量从 `AGNES_APIKEY` 改为 `OPENROUTER_API_KEY`，值为 `sk-or-v1-<your-key>`
- 更新所有 `.env` 和 `.env.example` 文件
- 模型从 `agnes-2.0-flash` 改为 `anthropic/claude-sonnet-4`

## Capabilities

### New Capabilities

- `anthropic-messages-api`: 教程代码全面迁移至 Anthropic Messages API 格式，包括请求/响应结构、SSE 流事件、工具定义和工具调用的完整对接

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **代码文件**: 4 个教程的 `src/index.ts`（01-intro、02-streaming、03-multi-turn、04-tools）+ `src/tools.ts`（04-tools）
- **配置文件**: 所有 4 个教程的 `.env` 和 `.env.example` 文件
- **API 变更**: 请求/响应格式完全变化，流事件处理逻辑需要重写
- **依赖**: 无新增依赖，仅使用 Node.js 内置 `fetch`
