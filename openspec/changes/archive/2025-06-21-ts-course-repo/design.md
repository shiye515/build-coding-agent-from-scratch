## Context

当前需要创建一个 TypeScript 系列课程仓库，用于存放多节课程内容。每节课程需要独立运行，同时保持统一的项目结构和配置。

## Goals / Non-Goals

**Goals:**
- 创建清晰的目录结构，每节课程独立存放
- 配置 TypeScript 编译环境，支持独立编译和运行
- 提供便捷的开发脚本
- 便于扩展新课程

**Non-Goals:**
- 不涉及课程内容编写
- 不配置 CI/CD 流程
- 不集成测试框架（后续按需添加）

## Decisions

### 1. 使用 pnpm workspace 管理 monorepo
**选择**: pnpm workspace  
**理由**: 
- 原生支持 monorepo，无需额外工具
- 依赖管理高效，节省磁盘空间
- 配置简单，学习成本低

**替代方案**: 
- npm workspaces: 功能类似但性能较差
- yarn berry: 配置复杂，对课程仓库过重

### 2. 每节课程目录结构
```
courses/
  01-intro/
    ├── src/
    │   └── index.ts
    ├── tsconfig.json
    ├── package.json
    └── README.md
```

**理由**:
- 独立 tsconfig.json 允许每节课程自定义编译选项
- 独立 package.json 方便管理课程特定依赖
- src 目录存放课程代码

### 3. 运行时选择 tsx
**选择**: tsx (TypeScript Execute)  
**理由**:
- 零配置直接运行 TypeScript
- 启动速度快，适合教学演示
- 支持 watch 模式

**替代方案**:
- ts-node: 需要更多配置
- tsc + node: 需要先编译再运行，步骤繁琐

## Risks / Trade-offs

- [课程目录过多可能影响 pnpm 性能] → 课程数量控制在 50 节以内可接受
- [每节课程独立 package.json 增加依赖安装时间] → 使用 pnpm 的 --filter 参数优化
