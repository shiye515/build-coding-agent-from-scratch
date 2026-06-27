# tcode: 模块化 Agent

一个能在真实终端里读写文件、执行命令、搜索代码的极简 coding agent —— 对齐 Claude Code 的 7 个核心工具，模块化架构，用户输入与 agent 执行并发运行。但这也只是起点：错误恢复、状态持久化、子 agent 派生、上下文工程、权限控制、插件扩展等能力，还有待我们一起构建。

## 架构

```
src/
├── index.ts      # 入口：组装模块，启动 CLI
├── config.ts     # 配置加载：读取 settings.json 和 .env
├── cli.ts        # 用户输入循环：readline + 消息队列管理
├── agent.ts      # Agent 核心：消息循环 + API 调用 + 工具分发
├── stream.ts     # SSE 流式解析：处理 Anthropic 流事件
└── tools.ts      # 工具定义与执行器
```

## 工具

| 工具    | 功能               |
| ------- | ------------------ |
| `Read`  | 读取文件内容       |
| `Write` | 写入文件           |
| `Edit`  | 精确字符串替换编辑 |
| `Bash`  | 执行 shell 命令    |
| `Glob`  | 文件模式匹配搜索   |
| `Grep`  | 文件内容正则搜索   |
| `LS`    | 列出目录内容       |

## 特性

- 用户输入与 agent 循环并发 — 用户可在 agent 执行时输入新消息
- 消息队列 — 用户输入在 agent 小循环结束后插入
- 流式输出 — 实时显示响应文本和 thinking
- 工具调用 — 自动执行工具并返回结果

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

## 使用示例

```
You: 列出当前目录的文件
Assistant: [tool: LS] src/ package.json ...

You: 读取 package.json 的内容
Assistant: [tool: Read] { "name": "tcode", ... }

You: 创建一个 hello.txt 文件，内容为 "Hello World"
Assistant: [tool: Write] File written successfully: hello.txt

You: 在 hello.txt 中将 "World" 替换为 "TypeScript"
Assistant: [tool: Edit] File edited successfully: hello.txt

You: 运行 node --version
Assistant: [tool: Bash] v22.22.3
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
