# tcode: 从零手搓 Coding Agent

用 TypeScript 手搓一个 Coding Agent。零依赖、零基础，一步步带你完成。

## 你将学到

- TypeScript 基础与工程化
- LLM API 调用与 Prompt 工程
- Agent 架构设计与实现
- 工具调用（Tool Use）机制
- 自主决策与任务规划

## 快速开始

### 环境依赖

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18.0.0 | 运行时环境，推荐使用 nvm 管理版本 |
| pnpm | >= 8.0.0 | 包管理器，比 npm 更快更省空间 |
| TypeScript | >= 5.0.0 | 课程已内置，无需单独安装 |

安装 Node.js 和 pnpm:

```bash
# 安装 nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js
nvm install 22
nvm use 22

# 安装 pnpm
npm install -g pnpm
```

### 配置 API Key

本课程使用 [Agnes AI](https://agnes-ai.com) 提供的 LLM API。

1. 注册账号并获取 API Key
2. 复制 `.env.example` 为 `.env`:

```bash
cp courses/01-intro/.env.example courses/01-intro/.env
```

3. 编辑 `.env` 文件，填入你的 API Key:

```
AGNES_APIKEY=your-api-key-here
```

### 运行第一课

```bash
# 安装依赖
pnpm install

# 运行课程
cd courses/01-intro
pnpm dev "你好，请介绍一下自己"
```

## 课程结构

```
tcode/
├── courses/
│   ├── 01-intro/          # 第一课：LLM API 调用
│   ├── 02-streaming/      # 第二课：流式输出
│   └── ...
├── package.json
├── tsconfig.json
└── pnpm-workspace.yaml
```

每节课程包含:
- `src/index.ts` - 课程代码
- `package.json` - 课程配置
- `tsconfig.json` - TypeScript 配置
- `.env.example` - 环境变量模板

## API 调用示例

本课程使用 OpenAI Responses API 格式:

```typescript
const response = await fetch('https://apihub.agnes-ai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'agnes-2.0-flash',
    input: prompt,
  }),
});
```

详细文档请参考 [Agnes AI 快速开始](https://agnes-ai.com/doc/quick-start)。

## 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev <prompt>` | 运行当前课程 |
| `pnpm build` | 编译 TypeScript |
| `pnpm run install:global` | 全局安装命令 |

## License

MIT
