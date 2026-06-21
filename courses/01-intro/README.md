# tcode: LLM API 调用

本课程演示如何使用 TypeScript 调用 LLM API。

## 前置条件

复制 `.env.example` 为 `.env` 并填入你的 API Key:

```bash
cp .env.example .env
# 编辑 .env 文件，填入 AGNES_APIKEY
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
