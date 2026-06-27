# tcode: 多轮对话

本课程演示如何使用 TypeScript 实现 LLM 多轮对话（通过 DeepSeek 提供的 Anthropic 兼容 API），保持上下文记忆。

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

- 交互式命令行界面
- 自动维护对话历史（`messages` 数组）
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
