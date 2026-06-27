# tcode: 工具调用

本课程演示如何使用 TypeScript 实现 LLM 工具调用（通过 DeepSeek 提供的 Anthropic 兼容 API），支持文件读写操作。

## 前置条件

在仓库根目录配置 API Key：

```bash
# 方式 1（推荐）：编辑根目录 settings.json，填入 env.API_KEY
# 方式 2：在根目录 .env 中设置 API_KEY
```

## 运行

```bash
# 开发模式运行
pnpm dev
```

## 功能特点

- 多轮对话 + 工具调用（`tool_use` / `tool_result`）
- 工具定义在 `src/tools.ts` 中，使用 Anthropic 格式（`type: "custom"`, `input_schema`）
- 内置工具：
  - `read_file`: 读取文件内容
  - `write_file`: 写入文件内容
- 流式输出响应
- 支持 thinking 输出
- 自动执行工具调用并返回结果

## 使用示例

```
You: 创建一个 hello.txt 文件，内容为 "Hello World"
Assistant: [tool: write_file] Successfully wrote to hello.txt
Assistant: 已创建 hello.txt 文件

You: 读取 hello.txt 的内容
Assistant: [tool: read_file] Hello World
Assistant: 文件内容为：Hello World

You: 使用我提供的读写工具将package.json 中的name字段写入./log/out.txt
```

## 构建

```bash
pnpm build
```

## 全局安装

```bash
pnpm run install:global
tcode
```
