# tcode: 工具调用

本课程演示如何使用 TypeScript 实现 LLM 工具调用（Tool Use），支持文件读写操作。

## 前置条件

复制 `.env.example` 为 `.env` 并填入你的 API Key:

```bash
cp .env.example .env
# 编辑 .env 文件，填入 AGNES_APIKEY
```

## 运行

```bash
# 开发模式运行
pnpm dev
```

## 功能特点

- 多轮对话 + 工具调用
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
