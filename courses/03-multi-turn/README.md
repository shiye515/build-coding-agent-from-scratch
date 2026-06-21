# tcode: 多轮对话

本课程演示如何使用 TypeScript 实现 LLM 多轮对话，保持上下文记忆。

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

- 交互式命令行界面
- 自动维护对话历史
- 流式输出响应
- 支持 thinking 输出
- 输入 `exit` 退出对话

## 构建

```bash
pnpm build
```

## 全局安装

```bash
pnpm run install:global
tcode
```
