# tcode: LLM API 调用

本课程演示如何使用 TypeScript 调用 LLM API（通过 DeepSeek 提供的 Anthropic 兼容 API）。

## 前置条件

在仓库根目录配置 API Key：

```bash
# 方式 1（推荐）：编辑根目录 settings.json，填入 env.API_KEY
# 方式 2：在根目录 .env 中设置 API_KEY
```

## 运行

```bash
# 开发模式运行
pnpm dev "你好，请介绍一下自己"

# 或者直接使用 tsx
npx tsx src/index.ts "你的提示词"
```

## 构建

```bash
pnpm build
```

## 全局安装

```bash
pnpm install -g .
tcode "你的提示词"
```
