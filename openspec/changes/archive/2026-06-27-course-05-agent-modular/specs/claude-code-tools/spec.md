## ADDED Requirements

### Requirement:工具集替换为 Claude Code 的 7 个核心工具
教程 05 SHALL 使用 Claude Code 的 7 个核心工具（Read、Write、Edit、Bash、Glob、Grep、LS）完全替代教程 04 中的 `read_file` 和 `write_file`。

#### Scenario:工具定义完整性
- **当** 查看 `tools.ts` 导出的工具列表
- **THEN** 包含 `Read`、`Write`、`Edit`、`Bash`、`Glob`、`Grep`、`LS` 七个工具定义

### Requirement:Read 工具读取文件内容
Read 工具 SHALL 读取指定路径的文件内容，支持偏移量和行数限制。

#### Scenario:读取整个文件
- **当** 调用 Read 工具，参数 `file_path` 为有效文件路径
- **THEN** 返回文件的完整内容

#### Scenario:读取部分文件
- **当** 调用 Read 工具，参数 `file_path`、`offset`、`limit`
- **THEN** 从 `offset` 行开始返回 `limit` 行内容

#### Scenario:文件不存在
- **当** 调用 Read 工具，参数 `file_path` 指向不存在的文件
- **THEN** 返回错误信息

### Requirement:Write 工具写入文件
Write 工具 SHALL 将内容写入指定路径，如目录不存在则自动创建。

#### Scenario:写入新文件
- **当** 调用 Write 工具，参数 `file_path` 和 `content`
- **THEN** 文件被创建或覆盖，内容为 `content`

#### Scenario:自动创建目录
- **当** 调用 Write 工具，`file_path` 的父目录不存在
- **THEN** 自动创建父目录（递归）

### Requirement:Edit 工具精确替换编辑
Edit 工具 SHALL 在文件中执行精确的字符串替换。

#### Scenario:单次替换
- **当** 调用 Edit 工具，参数 `file_path`、`old_string`、`new_string`
- **THEN** 文件中第一个匹配 `old_string` 的位置被替换为 `new_string`

#### Scenario:全部替换
- **当** 调用 Edit 工具，参数 `replace_all` 为 `true`
- **THEN** 文件中所有匹配 `old_string` 的位置被替换

#### Scenario:未找到匹配
- **当** 调用 Edit 工具，`old_string` 在文件中不存在
- **THEN** 返回错误信息，文件不被修改

### Requirement:Bash 工具执行 shell 命令
Bash 工具 SHALL 在持久 shell 会话中执行命令，支持超时控制。

#### Scenario:执行简单命令
- **当** 调用 Bash 工具，参数 `command` 为 `"ls -la"`
- **THEN** 执行命令并返回 stdout 和 stderr 输出

#### Scenario:命令超时
- **当** 调用 Bash 工具，命令执行时间超过 `timeout`（默认 120 秒）
- **THEN** 命令被终止并返回超时错误

### Requirement:Glob 工具文件模式匹配
Glob 工具 SHALL 使用 glob 模式搜索文件。

#### Scenario:搜索 TypeScript 文件
- **当** 调用 Glob 工具，参数 `pattern` 为 `"**/*.ts"`
- **THEN** 返回匹配的文件路径列表

#### Scenario:指定搜索目录
- **当** 调用 Glob 工具，参数 `pattern` 和 `path`
- **THEN** 在指定目录下搜索匹配的文件

### Requirement:Grep 工具内容搜索
Grep 工具 SHALL 使用正则表达式搜索文件内容。

#### Scenario:搜索文件内容
- **当** 调用 Grep 工具，参数 `pattern` 为 `"function\\s+\\w+"`
- **THEN** 返回匹配的文件路径和行号

#### Scenario:指定搜索路径
- **当** 调用 Grep 工具，参数 `pattern` 和 `path`
- **THEN** 在指定路径下搜索匹配内容

#### Scenario:文件类型过滤
- **当** 调用 Grep 工具，参数 `glob` 为 `"*.ts"`
- **THEN** 仅搜索匹配 glob 的文件

### Requirement:LS 工具列出目录内容
LS 工具 SHALL 列出指定目录的文件和子目录。

#### Scenario:列出目录
- **当** 调用 LS 工具，参数 `path` 为有效目录路径
- **THEN** 返回目录下的文件和子目录列表

#### Scenario:忽略模式
- **当** 调用 LS 工具，参数 `ignore` 包含 glob 模式
- **THEN** 返回的列表中排除匹配的文件/目录
