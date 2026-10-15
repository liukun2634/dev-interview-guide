---
title: Agent Skills 编写指南
---

# Agent Skills 编写指南

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 中频</span>

::: tip 💡 核心要点
Agent Skills 是一种开放的、基于文件系统的能力封装格式：用 `SKILL.md` 描述任务指令，并可附带脚本、参考资料和模板。它与 **A2A Agent Card 中的 `AgentSkill`**、SDK 中的专业 Agent / Handoff 不是同一个规范：前者交付可加载的实现，A2A 对外声明远程 Agent 的能力，SDK 则负责运行时编排。本页以 [Agent Skills 开放标准](https://agentskills.io) 为主线，并说明它与 MCP、A2A 和 Agent SDK 的关系。
:::

---

## 什么是 Agent Skill

广义上，Skill 是 Agent 的**能力单元**。但工程实践中至少有三种同名概念，必须先区分：

| 名称 | 本质 | 是否包含实现 | 典型载体 |
|------|------|-------------|---------|
| **Agent Skills 开放标准** | 可被 Agent 按需加载的知识与工作流包 | 是 | `SKILL.md` + scripts / references / assets |
| **A2A `AgentSkill`** | 远程 Agent 对外发布的能力描述 | 否，仅是能力广告 | Agent Card 的 `skills` 数组 |
| **SDK 专业 Agent / Handoff** | 应用内部的运行时编排方式 | 是，但由代码实现 | OpenAI Agents SDK、Claude Agent SDK 等 |

本文后文单独写 **Agent Skills** 时，默认指第一种开放标准。一个 Agent Skill 主要回答三个问题：

| 问题 | 对应要素 | 示例 |
|------|---------|------|
| **什么时候激活？** | `description` 中的适用场景 | 请求涉及审查 PR、检查代码风险 |
| **做什么？** | 指令（instruction） | 分析代码质量、检查安全漏洞、输出报告 |
| **依赖什么？** | 脚本、参考资料、环境与权限 | 运行 linter、读取规范、请求用户批准写操作 |

**类比**：如果 Agent 是一个多面手员工，那 Skill 就是他的**标准作业流程（SOP）**——遇到特定任务时，按照预设流程执行，而不是每次即兴发挥。

---

## 三个互补层次：Agent Skills、MCP 与 A2A

这三者不是互相替代的竞品，而是分别解决「如何教会 Agent」「如何连接工具」「如何委派给远程 Agent」的问题：

### 分层关系

```
┌─────────────────────────────────────────────────┐
│               Agent 能力体系                      │
├─────────────────────────────────────────────────┤
│  A2A (Agent2Agent Protocol)                     │
│  ├── Agent Card: 远程 Agent 对外声明能力           │
│  ├── Message / Task / Artifact: 跨 Agent 协作      │
│  └── 定位: 独立 Agent 之间的发现与任务委派          │
├─────────────────────────────────────────────────┤
│  MCP (Model Context Protocol)                   │
│  ├── Tools / Resources / Prompts                │
│  └── 定位: AI 应用与外部工具、数据源之间的接口       │
├─────────────────────────────────────────────────┤
│  Agent Skills                                   │
│  ├── SKILL.md + scripts/references/assets       │
│  └── 定位: 给 Agent 注入可复用的过程知识与工作流     │
└─────────────────────────────────────────────────┘
```

一个本地 Agent Skill 可以指导 Agent 调用 MCP Tools；一个 A2A Server 在执行远程任务时，也可以在内部加载 Agent Skills 并调用 MCP。三层可以组合，但彼此没有强制依赖。

### A2A 中的 `AgentSkill` 定义

A2A 的 `AgentSkill` 位于 Agent Card 的 `skills` 数组，描述远程 Agent 的能力、标签、例子及输入输出媒体类型。调用方据此评估是否委派任务，不会下载它的内部指令。

因此，一个代码审查 Agent 可以在 Card 中声明 `code-review`，内部却使用普通代码、多个 Agent 或本地 Skill。名称相同不意味着两种 Skill 是同一个对象。完整 Card、任务状态与协作流程已放到 [A2A 专题](./a2a#agent-card)；工具连接见 [MCP 专题](./mcp)。

### 当前格局对比

| 维度 | Agent Skills | A2A `AgentSkill` | MCP Tool |
|------|--------------|------------------|----------|
| **解决问题** | 如何给 Agent 复用知识和工作流 | 如何发现并委派给远程 Agent | 如何连接并调用外部能力 |
| **载体** | 本地/容器中的 Skill 目录 | Agent Card 中的描述对象 | MCP Server 暴露的 Tool Schema |
| **实现内容** | 指令、脚本、参考资料、模板 | 能力描述，不暴露内部实现 | 原子或聚合操作及输入输出 Schema |
| **主要选择者** | 模型根据 `description` 按需加载 | A2A 客户端或编排器 | 模型根据 Tool 描述调用 |
| **治理/标准** | agentskills.io 开放标准 | Linux Foundation A2A 项目 | MCP 开放协议 |
| **典型场景** | 代码审查 SOP、文档生成规范 | 跨组织研究 Agent 委派 | 查询数据库、调用 API、执行操作 |

---

## 能力封装与运行时实现形式

### 形式一：Agent Skills 标准目录（本文重点）

Agent Skills 不是任意 Prompt 文件，而是一个以 `SKILL.md` 为入口的目录。下面是**符合开放标准**的最小示例；自动选择主要依赖 `description`，`/review` 等显式调用语法由具体客户端决定，并不是标准 frontmatter 字段。

```markdown
---
name: code-review
description: 审查代码变更的正确性、安全性、性能和可维护性。在用户要求 review PR、检查 diff、分析代码风险或寻找潜在缺陷时使用。
---

## 目标与边界

只分析和报告问题，不修改文件，不创建提交，也不推送远程分支。

## 执行步骤

1. **读取变更文件**：使用 `git diff` 获取当前分支的变更内容
2. **逐文件审查**：对每个变更文件执行以下检查
   - 逻辑正确性：是否存在明显 bug 或边界条件遗漏
   - 安全性：是否引入 OWASP Top 10 漏洞（SQL 注入、XSS 等）
   - 代码风格：是否符合项目现有的命名和格式约定
   - 性能：是否存在明显的性能问题（如 N+1 查询、内存泄漏）
3. **输出报告**：按严重程度分类（Critical / Warning / Suggestion）

## 输出格式

### 审查摘要
- 变更文件数：X
- 问题总数：X（Critical: X, Warning: X, Suggestion: X）

### 问题列表
| 文件 | 行号 | 严重程度 | 问题描述 | 建议修改 |
|------|------|---------|---------|---------|
| ... | ... | ... | ... | ... |
```

**优点**：零代码、易编辑、版本管理友好
**扩展方式**：复杂逻辑可以放入 `scripts/`，大段参考资料可以放入 `references/`；因此它不只是静态 Prompt。

---

### 形式二：SDK 内部编排（相关概念，不等于 Agent Skills）

Agent SDK 可以用专业 Agent、Handoff、工具和权限实现相似的能力隔离，但这些代码对象不是 `agentskills.io` 定义的 Agent Skill。只有 SDK 明确加载 `SKILL.md` 目录时，才是在使用 Agent Skills 标准。

#### OpenAI Agents SDK（2025 年 3 月发布）

OpenAI Agents SDK（前身 Swarm）通过 `instructions` 定义专业 Agent，通过 `tools` 声明能力，通过 `handoffs` 转移对话控制权。它能实现与 Skill 类似的职责封装，但不是 Agent Skills 文件格式：

```python
from agents import Agent, Runner, function_tool


# 将工具定义为简单的 Python 函数
@function_tool
def run_linter(file_path: str) -> str:
    """对指定文件运行静态分析。仅支持 .py/.js/.ts 文件。"""
    import subprocess
    result = subprocess.run(
        ["ruff", "check", file_path],
        capture_output=True, text=True
    )
    return result.stdout or "No issues found"


@function_tool
def get_git_diff() -> str:
    """获取当前暂存区的代码变更。"""
    import subprocess
    result = subprocess.run(
        ["git", "diff", "--cached"],
        capture_output=True, text=True
    )
    return result.stdout or "No staged changes"


# 专业 Agent：每个 Agent 专注于一个职责
code_review_agent = Agent(
    name="CodeReviewer",
    instructions="""你是一位资深代码审查专家。
    按以下步骤审查代码：
    1. 使用 get_git_diff 获取变更
    2. 使用 run_linter 对每个变更文件运行静态分析
    3. 结合 lint 结果和你的判断，输出审查报告
    报告格式：Critical / Warning / Suggestion 分级""",
    tools=[run_linter, get_git_diff],
)

# Agent 之间通过 handoffs 实现控制权转移
# 用户意图不明确时，triage Agent 决定委派给哪个专业 Agent
triage_agent = Agent(
    name="Triage",
    instructions="根据用户意图，将任务委派给合适的专家 Agent。",
    handoffs=[code_review_agent],
)

# 运行
result = Runner.run_sync(triage_agent, "审查最近的代码变更")
print(result.final_output)
```

**关键模式**：
- **专业 Agent**：每个 Agent 专注于一个职责，但不是 `SKILL.md` 标准对象
- **Handoffs**：Triage Agent 充当路由器，通过 handoff 将任务委派给专业 Agent
- **Agent-as-Tool**：也可以将一个 Agent 注册为另一个 Agent 的 Tool，实现嵌套调用

#### Claude Agent SDK

Claude Agent SDK 把 Claude Code 的 Agent Loop、内置工具、权限、会话、MCP 和 Agent Skills 暴露为 Python / TypeScript 库。它与 Anthropic Client SDK 不同：前者替应用运行工具循环，后者直接调用 Messages API，工具循环由应用自己实现。

```python
import asyncio
from claude_agent_sdk import ClaudeAgentOptions, query


async def main():
    # 项目中的 .claude/skills/code-review/SKILL.md 会像在 Claude Code 中一样被发现。
    # 只读示例不预批准 Bash；Prompt 中的“不要修改”不能替代宿主权限。
    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Glob", "Grep"],
        permission_mode="dontAsk",
    )
    async for message in query(
        prompt="审查当前分支中已提供的代码变更；不要修改文件。",
        options=options,
    ):
        print(message)


asyncio.run(main())
```

如果只使用 `anthropic` Client SDK，则工具定义中的 `input_schema` 是 Anthropic Messages API 的工具 Schema；它与 MCP 都使用 JSON Schema 描述输入，但不能因此称为“自动兼容 MCP”。应用仍需执行每个 `tool_use`，并将同一轮的所有执行结果作为 `tool_result` 返回。

#### MCP Server 作为 Skill 的工具层

当 Skill 需要调用标准化工具时，可以通过 MCP Server 提供：

```python
# MCP Server 定义工具（供任何 MCP 兼容的 Agent 调用）
from mcp.server import MCPServer

mcp = MCPServer("code-analysis")

@mcp.tool()
async def run_linter(file_path: str) -> str:
    """对指定文件运行代码静态分析。支持 .py/.js/.ts 文件。"""
    # 实际的 lint 逻辑
    ...

@mcp.tool()
async def check_security(file_path: str) -> str:
    """检查文件中的安全漏洞（OWASP Top 10）。"""
    ...

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

**MCP 的价值**：Server 实现可在多个兼容 Host 中复用，但客户端仍需完成协议版本、认证授权、用户审批和宿主集成；“支持 MCP”不等于任意 Agent 无条件可调用。

---

### 形式三：平台自定义配置（非通用标准）

一些平台会用 JSON/YAML 编排工作流，但字段由平台各自定义。下面只是**说明性伪 Schema**，不能直接当作 Dify、Coze 或 Agent Skills 的配置使用：

```yaml
# skills/code-review.yaml
skill:
  name: code-review
  version: "1.2"
  description: 审查代码的质量、安全性和最佳实践

  trigger:
    commands: ["/review"]
    intents: ["code_review", "check_code"]
    keywords: ["审查代码", "code review"]

  tools:
    required: ["bash", "read_file"]
    optional: ["grep"]
    forbidden: ["write_file", "delete_file"]

  parameters:
    - name: scope
      type: enum
      values: ["full", "security-only", "style-only"]
      default: "full"
      description: 审查范围

  steps:
    - id: get_diff
      tool: bash
      args:
        command: "git diff --name-only HEAD~1"
      output: changed_files

    - id: review_each
      loop: "$changed_files"
      tool: llm
      prompt: |
        审查以下文件的代码质量：
        文件：$item
        内容：$read_file($item)
      output: reviews

    - id: summarize
      tool: llm
      prompt: |
        汇总以下审查结果为结构化报告：
        $reviews
      output: final_report

  output:
    format: markdown
    template: |
      ## 代码审查报告
      $final_report
```

**优点**：非开发者也能定义 Skill、易于平台化管理、可视化编辑
**缺点**：表达能力有限，复杂逻辑难以描述

### 各机制对比

| 维度 | Agent Skills 目录 | SDK 代码编排 | 平台配置 Schema | A2A Agent Card |
|------|------------|---------|------------|----------------|
| **上手难度** | 低 | 中 | 低-中 | 低 |
| **灵活性** | 中-高（可附脚本） | 高 | 取决于平台 | 低（只声明能力） |
| **标准化** | 高（agentskills.io） | SDK 特定 | 平台特定 | 高（A2A） |
| **跨客户端复用** | 支持兼容客户端 | 通常不支持 | 通常不支持 | 支持跨 Agent 委派，但不分发实现 |
| **适用场景** | 可移植的知识与工作流 | 复杂运行时编排 | 低代码平台工作流 | 独立 Agent 协作 |
| **典型产品** | Claude Code、Copilot、Codex、Gemini CLI | Claude / OpenAI Agents SDK | Dify、Coze 等 | A2A 兼容 Agent |

---

## 编写高质量 Skill 指令

Skill 的核心是**指令（Instruction）**——它决定了 Agent 在 Skill 被激活后的行为。指令质量直接影响 Skill 的可靠性。

### 原则一：明确任务范围与边界

```markdown
# ❌ 模糊的任务定义
帮助用户审查代码。

# ✅ 清晰的范围 + 边界
审查 Java/Spring 代码变更的正确性、安全性和可维护性。
只识别问题并输出报告，不直接修改代码。
如果发现安全漏洞（如 SQL 注入），将其标记为 Critical 级别。
如果文件是测试代码，放宽格式要求但严格检查断言覆盖。
```

**关键点**：
- 指定**任务对象和成功标准**（不是泛化的“帮忙”）
- 声明**行为边界**（什么可做、什么不可做）
- 给出**优先级规则**（不同场景的处理策略）

### 原则二：步骤化而非目标式

```markdown
# ❌ 目标式（Agent 自行决定怎么做）
请审查代码，找出所有问题并给出建议。

# ✅ 步骤化（明确执行顺序和每步产出）
请按以下步骤执行代码审查：

1. **获取变更范围**：运行 `git diff --cached --name-only` 获取暂存文件列表
2. **分类文件**：将文件按类型分组（源代码 / 测试 / 配置 / 文档）
3. **逐文件审查**：对每个源代码文件检查以下维度
   - 逻辑正确性：变量命名、条件判断、边界处理
   - 安全性：输入校验、SQL 拼接、敏感信息暴露
   - 性能：循环中的 I/O、未使用索引的查询
4. **交叉检查**：源代码变更是否有对应的测试更新
5. **输出报告**：按 Critical → Warning → Suggestion 排序
```

**何时用目标式**：Skill 是柔性的（如"提供架构建议"），结果形式不固定
**何时用步骤化**：Skill 是刚性的（如"代码审查""生成 commit message"），流程固定

### 原则三：内嵌示例（Few-shot in Skill）

在 Skill 指令中直接包含期望输出的示例，避免 Agent 自行猜测格式：

```markdown
## 输出示例

以下是一个审查问题的标准格式：

| 文件 | 行号 | 严重程度 | 问题描述 | 建议修改 |
|------|------|---------|---------|---------|
| UserService.java | 42 | Critical | SQL 拼接导致注入风险 | 使用 PreparedStatement 参数化查询 |
| OrderController.java | 87 | Warning | 未处理空指针异常 | 添加 null check 或使用 Optional |
| config.yaml | 12 | Suggestion | 数据库密码硬编码 | 迁移到环境变量或密钥管理服务 |
```

### 原则四：错误处理指令

告诉 Skill 遇到异常情况时怎么办：

```markdown
## 异常处理

- 如果 `git diff` 返回空（无变更文件）→ 输出"暂无代码变更需要审查"并终止
- 如果某个文件超过 2000 行 → 只审查变更的行及其上下 10 行的上下文
- 如果文件是二进制文件（如图片、编译产物）→ 跳过并在报告中注明
- 如果无法判断某段代码是否有问题 → 标记为 Info 级别，注明"需人工确认"
```

---

## 工具声明与权限设计

Skill 正文应说明完成任务需要什么能力、哪些动作不应执行，但**文字约束不是安全边界**。真正的权限必须由加载 Skill 的宿主（Claude Code、VS Code、Agent SDK、自定义 Harness）在工具层强制执行。

### 最小权限原则

```python
# Claude Agent SDK：权限由运行时配置，而不是由任意 SKILL.md 字段强制。
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep", "Bash"],
    permission_mode="default",
)
```

Agent Skills 开放标准目前只有实验性的 `allowed-tools` 字段：

```yaml
allowed-tools: Bash(git:*) Bash(ruff:*) Read
```

它表示这些工具可以被**预批准**，支持情况因客户端而异；它不是可移植的 deny list，也不保证其他工具从模型的可用工具池中消失。需要强制只读、禁止网络或限制 Shell 命令时，应使用宿主的权限规则、沙箱、审批和审计机制。

::: warning ⚠️ 不要发明标准字段
`tools.allowed`、`tools.forbidden`、`bash_constraints`、`trigger`、`priority` 等可以是某个自定义平台的 Schema，但都不是 `agentskills.io` 规定的 frontmatter 字段。若使用客户端扩展字段，应标明目标客户端并接受可移植性下降。
:::

### 工具描述质量

工具的 `description` 决定了 Agent 能否正确使用它。好的工具描述应包含**功能、输入、输出、限制和示例**：

```python
{
    "name": "run_linter",
    "description": (
        "对指定文件运行代码静态分析工具。"
        "输入：文件路径（字符串）。"
        "输出：lint 结果列表，包含行号、规则 ID、问题描述。"
        "限制：仅支持 .py / .js / .ts / .java 文件。"
        "示例输入：'src/main/UserService.java'"
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "要分析的文件路径"
            }
        },
        "required": ["file_path"]
    }
}
```

**工具描述的常见问题**：

| 问题 | 后果 | 改进 |
|------|------|------|
| 描述太短（"运行 linter"） | Agent 不知道输入格式，传参错误 | 加上输入/输出说明和示例 |
| 缺少限制条件 | Agent 对不支持的文件类型调用工具 | 明确支持的文件类型和范围 |
| 多个工具描述重叠 | Agent 选错工具 | 在描述中说明**何时用此工具而非另一个** |

---

## 触发条件设计

触发条件决定了 Skill **在什么情况下被激活**。设计不当会导致误触发或漏触发。

### 两种主要激活方式

```
┌────────────────────────────────────────────────┐
│               用户输入                          │
├────────────────────────────────────────────────┤
│  1. 模型自动选择                                │
│     → 模型从 Skill catalog 读取 name/description │
│     → 判断相关后加载完整 SKILL.md                │
│                                                │
│  2. 用户显式激活                                │
│     → /skill-name、$skill-name 或客户端 UI       │
│     → 具体语法由客户端定义，不属于开放标准         │
└────────────────────────────────────────────────┘
```

大多数兼容实现依赖模型的语义判断，而不是 Harness 里的关键词匹配器。因此触发质量主要来自 `description`：同时写清楚**做什么、何时使用、典型对象和排除边界**。关键词应自然地出现在描述中，而不是维护一个独立 `keywords` 数组。

### Handoff 是内部 Agent 路由，不是 Skill 触发标准

OpenAI Agents SDK 的 **Handoff** 是一种专业 Agent 路由方式——Triage Agent 根据用户意图将对话控制权“移交”给专业 Agent：

```python
from agents import Agent

# 每个专业 Agent 是 SDK 内部角色，不是 SKILL.md 对象
review_agent = Agent(
    name="CodeReviewer",
    instructions="你是代码审查专家...",
    tools=[run_linter, read_file],
)
test_agent = Agent(
    name="TestGenerator",
    instructions="你是测试生成专家...",
    tools=[read_file, write_file],
)

# Triage Agent 负责路由
triage = Agent(
    name="Triage",
    instructions=(
        "根据用户意图，将任务移交给合适的专家：\n"
        "- 代码审查、安全检查 → CodeReviewer\n"
        "- 生成测试、补充测试 → TestGenerator\n"
        "如果不确定，先询问用户。"
    ),
    handoffs=[review_agent, test_agent],
)
```

与传统路由器的对比：

| 维度 | 传统路由器（关键词/正则） | Handoff 路由（LLM 决策） |
|------|----------------------|------------------------|
| **理解能力** | 只匹配表面词汇 | 理解语义和意图 |
| **新能力接入** | 需要手动添加触发词 | 需要提供清晰的 Handoff 描述 |
| **误判处理** | 静默失败或执行错误 Skill | 可以反问用户确认 |
| **成本** | 零（规则匹配） | 一次 LLM 调用 |

### 避免触发冲突

当多个 Skill 可能被同一输入触发时：

| 策略 | 做法 | 适用场景 |
|------|------|---------|
| **描述细化** | 在 `description` 中写清对象、动作与使用场景 | 名称或领域重叠 |
| **负边界** | 明确 `Do not use for...; use X instead` | 功能相近的 Skill |
| **合并能力** | 高度重叠的 Skill 合并为一个条件工作流 | 总是同时触发 |
| **触发评测** | 同时准备 should-trigger / should-not-trigger 查询 | 所有自动激活 Skill |
| **客户端控制** | 对有副作用的 Skill 禁止模型自动调用 | 发布、部署、发送消息等 |

---

## 测试与验证

Skill 编写完成后，应分别验证**能否正确触发**和**触发后能否正确完成任务**。只看到 Skill 被加载，并不能证明输出质量有所提高。

### 层面一：触发评测

准备真实、具体的 should-trigger 与 should-not-trigger 请求，尤其覆盖相邻 Skill 和含糊表达：

```json
[
  {"query": "review PR #418，重点看 auth 中的越权和测试缺口", "should_trigger": true},
  {"query": "解释一下这段代码做了什么，不需要 review", "should_trigger": false},
  {"query": "给 UserService 生成单元测试", "should_trigger": false},
  {"query": "帮我看看当前 diff 有没有会导致数据丢失的问题", "should_trigger": true}
]
```

如果漏触发，补充用户真实会说的场景和关键词；如果误触发，增加排除边界。修改后要在新会话中重跑，避免之前加载过的 Skill 污染结果。

### 层面二：行为与产物评测

为每个代表性任务写可验证的断言，而不是只判断输出“看起来不错”：

```json
{
  "skill_name": "code-review",
  "evals": [
    {
      "id": 1,
      "prompt": "审查包含字符串拼接 SQL 的变更，只输出报告",
      "files": ["evals/files/sql-injection.diff"],
      "expectations": [
        "将 SQL 注入识别为最高严重级别",
        "给出参数化查询的修复建议",
        "没有修改工作区文件",
        "报告引用具体文件和行号"
      ]
    }
  ]
}
```

将事实正确性、流程遵循和产物质量分开评分；对文件输出运行解析器、编译器、测试或 validator，不要只用另一个 LLM 主观打分。

### 层面三：基线、集成与安全评测

1. 在干净会话中分别运行 **with-skill** 与 **without-skill**，比较通过率、耗时和 token；没有基线就无法证明 Skill 有价值。
2. 至少准备 3 个场景，并覆盖正常输入、边界输入和失败恢复；若面向多个模型/客户端，分别测试。
3. 审计工具调用和文件差异，确认没有写文件、联网、安装依赖或执行破坏性命令等越界副作用。
4. 对带脚本的 Skill 测试缺失依赖、非法参数、超时和部分失败，要求错误消息能指导 Agent 修复。
5. 观察 Agent 实际读取了哪些 reference；从未读取的文件可能信号不清或没有必要，反复读取的内容可能应该上移到 `SKILL.md`。

---

## 从单个 Skill 到可维护的技能库 {#skill-lifecycle}

写出一个能用的 Skill 只是起点。真正困难的是：增加十个相邻 Skill 后，它还会不会被正确选择？升级正文或脚本后，旧任务能否继续？同一份目录交给另一个宿主时，会不会丢失权限限制？

### 发现、激活与执行要分开记录

```text
扫描受信任目录 -> 校验 frontmatter 与资源路径 -> 形成 catalog
  -> 选择 Skill -> 加载固定版本正文 -> 按需使用资源
  -> 宿主检查权限 -> 执行工具 -> 验证产物
```

“目录存在”“模型选中”“正文已读”“任务成功”是四种不同事件。排查漏触发时先确认宿主是否扫描到了该目录；排查任务失败时再检查读取了哪些 reference、依赖是否存在、工具是否被拒绝。

标准不规定统一的 `priority`、`active_version` 或依赖求解器。`metadata.version` 可以记录作者定义的版本，但不会自动带来版本选择、安装依赖或回滚。项目级与用户级同名覆盖规则也由宿主决定，团队应明确约定并测试。

### 更新不是只替换一段文字

| 变更 | 可能影响什么 | 最小回归范围 |
|------|--------------|--------------|
| `description` 或名称 | 触发、误触发、与邻近 Skill 的竞争 | 正反触发集，加上相邻 Skill 的请求 |
| 步骤或参考资料 | 决策路径、停止条件、报告质量 | 代表性任务、失败恢复与只读边界 |
| 脚本、依赖、MCP 工具 | 参数、输出 Schema、环境与副作用 | 脚本测试、缺依赖、工具拒绝与集成测试 |
| 客户端扩展字段 | 自动调用、可见性、预批准权限 | 每个支持宿主的实际行为 |

Prompt 措辞变化也可能让行为显著变化，不能一概视为低风险。对于已有任务，固定其使用的 Skill 发布版本或目录内容哈希，避免恢复后混入新规则；升级新任务时再灰度比较通过率与成本。

### 三种冲突，三种处理

- **名称冲突**：两个来源提供同名 Skill。配置确定的来源优先级，并让日志显示实际加载路径；不要依赖文件遍历顺序。
- **语义冲突**：`code-review` 和 `security-review` 都匹配“看看这段代码”。细化对象与排除边界，必要时合并流程或请用户明确范围。
- **约束冲突**：一个 Skill 要求自动提交，另一个要求只读。由宿主和当前授权决定可执行范围，不能按“最后加载的获胜”放宽权限。

### 可移植的是格式，不是全部运行环境

同一目录被两个宿主识别，不代表行为一致。应验证发现路径、显式调用语法、自动激活方式、工具名称、Shell、依赖与客户端扩展字段。`compatibility` 用于描述要求，不会帮宿主安装软件；实验性 `allowed-tools` 的语义和支持程度也要单独核对。

团队发布时至少保留：源码与资源版本、依赖清单、支持的宿主/模型组合、评测结果、权限需求和回滚目标。脚本或外部资源更新后重新审查；内容哈希只能帮助识别变更，不能证明内容安全。

### 用失败样例验证发布质量

| 场景 | 应看到的结果 |
|------|--------------|
| 用户只要求解释代码 | 不误触发修改或提交流程 |
| 缺少必需工具或 reference | 明确报告缺失条件，不编造执行结果 |
| 宿主拒绝写操作 | 停止该动作或提供只读结果，不换工具绕过 |
| 同一任务中断后恢复 | 使用固定版本和已有产物，不重复不可逆动作 |
| 引用资料夹带新指令 | 作为不可信内容处理，不扩大用户授权 |

这些是行为测试，不是检查 `SKILL.md` 能否解析。格式校验与任务评测都通过，才能说明这次发布可用。恢复、幂等和审批的运行时实现见 [Harness Engineering](./harness-engineering#durable-execution)。

---

## 实战案例：从零编写一个 Commit Message Skill

以下是一个完整的 Skill 编写过程，展示从需求分析到最终实现。

### Step 1：明确需求

```
目标：自动分析 git 暂存区的变更，生成规范的 commit message
激活方式：description 语义匹配；支持的客户端也可用 /commit-message 显式调用
输出格式：Conventional Commits（type(scope): description）
约束：不自动执行 git commit，只生成 message 供用户确认
```

### Step 2：设计 Skill 定义

```markdown
---
name: commit-message
description: 分析 Git 暂存区 diff 并生成 Conventional Commits 格式的提交说明。在用户要求编写 commit message、总结 staged changes 或检查提交描述时使用。
---

## 目标与边界

生成提交说明供用户确认。不要执行 `git add`、`git commit` 或 `git push`，不要修改工作区文件。

## 执行步骤

1. **获取暂存变更**
   - 运行 `git diff --cached --stat` 查看变更概览
   - 运行 `git diff --cached` 查看详细变更内容
   - 运行 `git log --oneline -5` 了解最近的提交风格

2. **分析变更性质**
   - 判断变更类型：feat / fix / refactor / docs / test / chore / style / perf
   - 确定影响范围（scope）：哪个模块或组件
   - 总结变更的核心目的（"为什么"而非"改了什么"）

3. **生成 commit message**
   - 标题行：`type(scope): 简明描述`（不超过 72 字符）
   - 空行
   - 正文：详细说明变更原因和影响（如有必要）
   - 如果变更包含 BREAKING CHANGE，在 footer 中注明

4. **输出结果**
   - 输出生成的 commit message
   - 如果不确定类型，给出 2-3 个候选方案

## 异常处理

- 如果暂存区为空 → 提示"暂存区没有变更，请先 git add"
- 如果变更文件超过 20 个 → 先输出概览，再针对核心变更生成 message
- 如果变更混合了多个不相关的修改 → 建议拆分为多个 commit
```

### Step 3：用 OpenAI Agents SDK 实现

```python
from agents import Agent, Runner, function_tool


@function_tool
def get_staged_diff() -> str:
    """获取 git 暂存区的变更详情（git diff --cached）。"""
    import subprocess
    result = subprocess.run(
        ["git", "diff", "--cached"],
        capture_output=True, text=True,
    )
    return result.stdout or "暂存区没有变更，请先 git add"


@function_tool
def get_recent_commits(count: int = 5) -> str:
    """获取最近的 commit 记录，用于了解项目的提交风格。"""
    import subprocess
    result = subprocess.run(
        ["git", "log", f"--oneline", f"-{count}"],
        capture_output=True, text=True,
    )
    return result.stdout


commit_agent = Agent(
    name="CommitMessageGenerator",
    instructions="""你是一位遵循 Conventional Commits 规范的 commit message 专家。
    
执行步骤：
1. 使用 get_staged_diff 获取暂存区变更
2. 使用 get_recent_commits 了解项目的提交风格
3. 分析变更类型（feat/fix/refactor/docs/test/chore）
4. 生成标题行：type(scope): 简明描述（不超过 72 字符）
5. 如有必要，添加正文说明变更原因

约束：只输出 commit message 文本，不执行 git commit。""",
    tools=[get_staged_diff, get_recent_commits],
)

result = Runner.run_sync(commit_agent, "生成 commit message")
print(result.final_output)
```

### Step 4：测试验证

```python
def test_commit_skill():
    setup_staged_changes(files={
        "src/auth/jwt.py": "add refresh token rotation logic",
    })
    result = Runner.run_sync(commit_agent, "生成 commit message")

    # 验证输出格式
    first_line = result.final_output.strip().split("\n")[0]
    assert ":" in first_line                  # Conventional Commits 格式
    assert len(first_line) <= 72              # 标题不超 72 字符
    assert any(first_line.startswith(t)       # 以合法类型开头
               for t in ["feat", "fix", "refactor", "docs", "test", "chore"])
```

---

## SKILL.md 标准写法：Anthropic 官方最佳实践

上文介绍了相邻协议与 SDK。**Agent Skills 格式最初由 Anthropic 开发，随后作为开放标准发布**；当前规范与客户端清单见 [agentskills.io](https://agentskills.io)。它已被 Claude Code、GitHub Copilot、Codex、Cursor、Gemini CLI 等多种客户端采用。本节总结官方建议、标准结构，并按 Skill 类型分类给出正文写法与真实范例。

### 核心原则：上下文窗口是公共资源

官方最重要的一句话是 **"The context window is a public good"**。所有写作建议都围绕它展开——你的 Skill 与系统提示、对话历史、其他 Skill 的元数据共享同一个上下文，因此每一个 token 都要物有所值。

::: tip 💡 官方五条核心建议

1. **精简（Concise is key）**：默认假设「Claude 已经很聪明」，只补它不知道的东西。别科普「什么是 PDF」，直接给关键代码。
2. **渐进式披露（Progressive disclosure）**：`SKILL.md` 只放概览和导航（建议正文 &lt; 5000 tokens、通常 &lt; 500 行），细节拆到 `references/`，脚本放 `scripts/`。执行脚本时源码通常不进入上下文，但**脚本输出仍消耗 token**。
3. **自由度匹配任务**：易错的窄桥任务（数据库迁移）给死命令；多路径的开阔任务（代码审查）给方向让模型自己判断。
4. **description 决定发现**：客户端预加载 `name` 和 `description`，模型主要根据 description 选择 Skill。description 用第三人称写清“做什么 + 何时用”；正文再使用祈使句。
5. **用「解释为什么」代替生硬的 MUST**：`skill-creator` 官方原文——"explain to the model why things are important in lieu of heavy-handed musty MUSTs"。

:::

### 标准目录结构

来自官方 `skill-creator` 自身正文的「Anatomy of a Skill」：

```text
skill-name/
├── SKILL.md            # 必需：YAML frontmatter + Markdown 指令
├── references/         # 按需读入上下文的文档（API 细节、领域规格）
│   ├── forms.md
│   └── reference.md
├── scripts/            # 可执行代码（确定性/重复任务，执行不读入）
│   └── validate.py
└── assets/             # 输出用的模板、图标、字体
```

**三级渐进式加载**：

| 层级 | 内容 | 何时进入上下文 | 预算 |
|------|------|--------------|------|
| 1. 元数据 | `name` + `description` | 会话启动/发现时 | 约 50–100 tokens / Skill |
| 2. SKILL.md 正文 | 指令主体 | 激活时加载 | 建议 &lt; 5000 tokens、通常 &lt; 500 行 |
| 3. Bundled 资源 | references / scripts / assets | 按需（脚本通常只返回输出） | 未访问时不占上下文 |

### 标准 frontmatter 与客户端扩展

Agent Skills 开放标准定义以下字段：

| 字段 | 必需 | 约束或含义 |
|------|------|------------|
| `name` | 是 | 1–64 字符；仅小写字母、数字和连字符；不能以连字符开头/结尾或包含连续连字符；必须与父目录同名 |
| `description` | 是 | 1–1024 字符；描述“做什么 + 何时用”，并包含有区分度的关键词 |
| `license` | 否 | 许可证名称或 Skill 内许可证文件的引用 |
| `compatibility` | 否 | 1–500 字符；仅在有系统包、网络、目标产品等环境要求时填写 |
| `metadata` | 否 | 字符串到字符串的扩展元数据，例如作者和版本 |
| `allowed-tools` | 否 | 空格分隔的预批准工具；仍是实验字段，客户端支持程度不同 |

Anthropic 产品还要求名称不能含 `claude`、`anthropic` 等保留词；这是产品约束，不是 `agentskills.io` 通用规范。Claude Code / VS Code 等客户端还可能支持 `disable-model-invocation`、`user-invocable`、`argument-hint`、`context: fork` 等扩展字段。使用这些字段前应查看目标客户端文档，不要假设其他客户端也理解它们。

### Skill 放在哪里

开放标准规定 Skill **目录内部格式**，不强制安装路径。常见跨客户端约定是项目级 `.agents/skills/` 和用户级 `~/.agents/skills/`；客户端也有自己的位置，例如 Claude Code 使用 `.claude/skills/`，VS Code / GitHub Copilot 还支持 `.github/skills/`、`~/.copilot/skills/`。项目级 Skill 通常覆盖同名用户级 Skill，但具体优先级以客户端实现为准。

从仓库加载的 Skill 应视为可执行软件：启用前审查 `SKILL.md`、脚本、依赖、外部 URL 和网络调用；项目级 Skill 最好受工作区信任机制保护。

### description 怎么写：正例 vs 反例

| | 写法 | 说明 |
|---|------|------|
| ✅ 好 | `Extracts text and tables from PDFs, fills forms, merges files, and performs OCR. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.` | 第三人称、覆盖关键子任务、包含使用场景 |
| ✅ 更好 | `...Do NOT use for PDFs, spreadsheets, or general coding tasks.` | 结尾用 `Do NOT use for...` 划清边界，防止多 Skill 抢触发 |
| ❌ 差 | `Helps with documents` / `Does stuff with files` | 模糊、无关键词，无法被正确触发 |
| ❌ 差 | `I can help you process Excel files` | 第一/第二人称，会导致选择混乱 |

> 官方经验：模型可能「欠触发」（该用时不用），所以 description 要具体并覆盖用户真实会说的场景。最关键的“何时使用”应放进 description；正文可以补充更细的条件分支，但不能依赖正文帮助首次发现。

### 正文的通用骨架

开放标准不强制正文标题，但一个实用 Skill 通常从下列模块中按需选择。不要为了“结构完整”加入没有价值的空章节：

```markdown
# [Skill 名称]

## Scope                     # 目标、边界、何时转交其他 Skill
## Decision guide            # 输入类型 → 应走的路径/工具
## Workflow                  # 明确步骤、每步产物与停止条件
## Validation                # 检查 → 修复 → 重试的反馈闭环
## Edge cases                # 空输入、超大输入、缺依赖、部分失败
## Output contract           # 严格模板、文件名、Schema 或质量标准
## Resources                 # 何时读取 reference、运行哪个 script
```

正文优先使用祈使句，例如“先读取项目配置”“运行 validator”“失败时回到第 2 步”。对于容易出错或有副作用的任务，写清前置条件、预期信号、回滚方法和验证步骤；对于开放式创作，只给目标、审美原则和禁止事项，避免把模型锁死在一个示例上。

### 正文写法：先按类型总说差异，再举例

不同类型的 Skill，正文主结构差异很大。先看总览决策表：

| Skill 类型 | 正文主结构 | 自由度 | 参考范例 |
|-----------|-----------|--------|---------|
| 工具/文档操作 | 路由表 → gotchas 清单 → 验证闭环 | 低 | `xlsx` `docx` `pdf` |
| 大型参考手册 | 超强触发 → Reading Guide 分流 → 防幻觉约束 | 低 | `claude-api` |
| 多子类型任务 | 分诊台 → 分发到 `examples/` 各文件 | 中 | `internal-comms` |
| 多步协作 | 分阶段 Stage + 每阶段先提问 | 中 | `doc-coauthoring` |
| 多阶段构建 | Phase 1/2/3 + 按阶段加载引用 | 中 | `mcp-builder` |
| 品牌/样式 | 可直接抄的规格清单（hex/字体） | 低 | `brand-guidelines` |
| 创意/前端生成 | 模板起点 + 概念清单 + 划红线 | 高 | `algorithmic-art` |
| 事故排查/应急 | 可量化判级 + 脚本决策 + 复盘模板 | 低 | 社区 `incident-commander` |

下面挑四类给出真实正文片段。

**① 工具/文档类：开头一张路由表 + gotchas**（[xlsx](https://github.com/anthropics/skills/tree/main/skills/xlsx/SKILL.md)）

```markdown
# XLSX creation, editing, and analysis

| Task | Approach |
|---|---|
| **Create/edit** with formulas | `openpyxl` — see gotchas below |
| **Bulk data** in or out | `pandas` (read_excel, to_excel) |

## Requirements for every output
- **Use formulas, never hardcoded results.** Write `sheet['B10'] = '=SUM(B2:B9)'`,
  not the Python-computed total. The sheet must recalculate when inputs change.

## openpyxl gotchas
- **`data_only=True` is destructive if you save.** That workbook has no formulas
  left, so saving replaces every one with a literal — permanently.
```

要点：第一屏就路由「什么任务→什么工具」；每条规则附「为什么」和「反例」；用 gotchas 清单堵模型最爱踩的雷。

**② 多子类型任务：分诊台模式**（[internal-comms](https://github.com/anthropics/skills/tree/main/skills/internal-comms/SKILL.md)）

```markdown
## How to use this skill
1. **Identify the communication type** from the request
2. **Load the appropriate guideline file** from the `examples/` directory:
    - `examples/3p-updates.md` - For Progress/Plans/Problems updates
    - `examples/company-newsletter.md` - For company-wide newsletters
    - `examples/faq-answers.md` - For answering FAQs
3. **Follow the specific instructions** in that file
```

要点：`SKILL.md` 本身极短，只做分诊；互斥的格式规范拆到独立文件，用到哪个读哪个——渐进式披露的标准落地。

**③ 创意/生成类：模板是起点不是抄袭源**（[algorithmic-art](https://github.com/anthropics/skills/tree/main/skills/algorithmic-art/SKILL.md)）

```markdown
## RESOURCES
- **templates/viewer.html**: REQUIRED STARTING POINT.
  - **Keep unchanged**: Layout structure, colors/fonts, seed controls
  - **Replace**: The p5.js algorithm, parameter definitions

**Critical reminder**:
- The template is the STARTING POINT, not inspiration
- Don't copy the example - build what the philosophy demands
```

要点：高自由度任务也要划红线——明确区分「必须保留 vs 必须替换」，反复强调不要照抄示例。

**④ 事故排查类：可量化判级 + 脚本决策**（社区示例 [incident-commander](https://github.com/alirezarezvani/claude-skills/tree/main/engineering-team/skills/incident-commander/SKILL.md)，非 Anthropic 官方 Skill）

```markdown
#### SEV3 - Minor Impact
**Characteristics:** Single feature affected · <25% of users impacted · workarounds available
**Response Requirements:** Response within 2 hours during business hours

### Exit Codes（把高风险判级交给确定性脚本）
| Code | Meaning | Required Response |
| 2 | SEV1 — critical | Immediate 15-minute war room |
```

要点：严重级别写成「可判定的量化标准」（`<25% 用户`），而不是模糊形容；判级这种高风险决策交给脚本用退出码驱动。

### 官方评测驱动的迭代流程

官方强烈建议 **先评测、后写文档**，用「双 Claude」迭代而非一次写完：

```mermaid
flowchart LR
    A[无 skill 跑真实任务<br/>观察在哪失败] --> B[建立基线<br/>写 3+ 评测场景]
    B --> C[写最小指令<br/>只补缺口]
    C --> D[Claude A 帮改进<br/>删多余解释]
    D --> E[Claude B 实测<br/>观察真实行为]
    E -->|发现遗漏| D
    E -->|通过| F[优化 description 触发率<br/>打包定稿]
```

### 相关的官方优秀 Skills 链接

| Skill | 学什么 | 链接 |
|-------|--------|------|
| **template** | 最简起点（两个字段） | [template/SKILL.md](https://github.com/anthropics/skills/tree/main/template/SKILL.md) |
| **pdf** | 结构范本：路由表 + Quick Start + 对照表 | [skills/pdf](https://github.com/anthropics/skills/tree/main/skills/pdf/SKILL.md) |
| **docx / xlsx** | 生产级 gotchas + 验证闭环 | [skills/docx](https://github.com/anthropics/skills/tree/main/skills/docx/SKILL.md) · [skills/xlsx](https://github.com/anthropics/skills/tree/main/skills/xlsx/SKILL.md) |
| **internal-comms** | 分诊分发架构 | [skills/internal-comms](https://github.com/anthropics/skills/tree/main/skills/internal-comms/SKILL.md) |
| **doc-coauthoring** | 多阶段协作、提问与读者测试 | [skills/doc-coauthoring](https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring/SKILL.md) |
| **mcp-builder** | 阶段化工作流 + 按阶段加载引用 | [skills/mcp-builder](https://github.com/anthropics/skills/tree/main/skills/mcp-builder/SKILL.md) |
| **claude-api** | 大型参考库的语言/任务分流 | [skills/claude-api](https://github.com/anthropics/skills/tree/main/skills/claude-api/SKILL.md) |
| **frontend-design** | 高自由度创作的质量约束 | [skills/frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design/SKILL.md) |
| **webapp-testing** | 工具驱动的测试工作流 | [skills/webapp-testing](https://github.com/anthropics/skills/tree/main/skills/webapp-testing/SKILL.md) |
| **skill-creator** | 官方写作指南 + 自查标准 | [skills/skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator/SKILL.md) |
| **规范校验器** | 校验 frontmatter 与命名规则 | [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) |
| **官方文档** | Skill 写作最佳实践全文 | [best-practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) |
| **工程博客** | 设计理念：渐进式披露 | [Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) |

::: tip ✅ 写好 SKILL.md 的 10 条速记
1. 开头给路由表或 Reading Guide 先分流
2. 只写模型不知道的（gotchas、领域规格、验证法），别科普语法
3. 解释「为什么」代替喊 MUST
4. description 用第三人称；正文用祈使句（Run... / Verify... / Never...）
5. 正文控制在 &lt; 5000 tokens、通常 &lt; 500 行；超出就拆到 references/，引用只一层深
6. 确定性任务用 scripts/；执行时源码通常不入上下文，但输出仍占 token
7. 产出后自查：渲染成图、跑 validator、feedback loop
8. 严格格式给死模板 + 例子；创意任务给概念 + 划红线
9. 多 Skill 用 `Do NOT use for...` 划边界
10. 不含 malware/exploit，行为不能偏离描述
:::

---

## 常见陷阱

::: warning ⚠️ 编写 Skill 时的常见误区

1. **指令过于模糊**：写"审查代码"不如写"按以下 4 个维度逐文件审查：安全性、正确性、性能、风格"。模糊指令导致每次执行结果不一致。

2. **把文字约束当权限控制**：正文写“不要修改文件”只能引导模型，不能替代宿主的只读工具集、deny rule、沙箱或审批机制。

3. **description 过宽**：只写“处理代码”会与大量 Skill 重叠。应写清对象、动作、典型请求和 `Do not use for...` 排除边界。

4. **缺少异常处理指令**：没告诉 Skill 遇到空输入、超大文件、二进制文件怎么办，导致执行中断或产出无意义内容。

5. **工具与环境假设没有说明**：正文要求运行 lint，但没有提供脚本、依赖说明或 `compatibility`，导致 Agent 在目标环境中无法执行。

6. **没做路由冲突检测**：新增 Skill 后不测试是否抢占了已有 Skill 的触发词，导致原有功能失效。

7. **混淆三种“Skill”**：把 Agent Skills 的 `SKILL.md`、A2A Agent Card 的 `AgentSkill`、SDK 中的专业 Agent 当成同一对象，进而写出不存在的标准字段或错误的集成方式。

8. **盲目信任共享 Skill**：未审计脚本、依赖、外部 URL 和网络行为就启用，可能导致提示注入、数据外泄或未授权操作。共享 Skill 应像软件包一样评审。

:::

---

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 如何设计一个 Agent Skill 系统？Skill 的定义应包含哪些要素？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>2. MCP 和 A2A 在 Agent Skill 体系中分别扮演什么角色？它们是什么关系？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 如何保证 Skill 的安全性？工具权限应该怎么设计？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

## 面试真题详解

### Q1：如何设计一个 Agent Skill 系统？Skill 的定义应包含哪些要素？

**要点**：

一个符合开放标准的 Agent Skill，最低只需要一个目录和其中的 `SKILL.md`：frontmatter 必须包含 `name`、`description`，正文包含任务指令；复杂 Skill 再按需附带 `scripts/`、`references/` 和 `assets/`。

一个完整的 Skill 系统通常包含六层：

1. **发现与校验**：扫描项目级和用户级目录，解析 frontmatter，校验名称、描述和目录同名规则；为同名 Skill 设置确定的覆盖优先级，并对不可信工作区启用信任检查。
2. **Catalog 层**：只向模型披露每个 Skill 的 `name`、`description` 和可选位置，避免启动时加载全部正文。
3. **激活层**：模型根据 description 语义选择，或由用户通过客户端支持的 slash command / UI 显式激活；激活时加载完整正文。
4. **资源层**：根据正文引用按需读取 reference、执行 script、使用 asset；相对路径以 Skill 根目录解析。
5. **权限与上下文层**：由宿主强制工具权限、审批和沙箱；避免重复注入已加载 Skill，并在上下文压缩时保护仍需生效的指令。
6. **评测层**：分别测试触发准确率和任务完成质量，与无 Skill 基线比较，并审计工具调用与副作用。

A2A Agent Card 中的 `AgentSkill` 只负责远程能力广告，SDK 的专业 Agent / Handoff 负责运行时编排；两者都不是 `SKILL.md` 的替代格式。

---

### Q2：MCP 和 A2A 在 Agent Skill 体系中分别扮演什么角色？它们是什么关系？

**要点**：

MCP 和 A2A 是**互补**关系，分别解决不同层面的问题：

**MCP（Model Context Protocol）**——标准化 AI 应用与工具/数据源之间的接口：
- 定义可发现、可调用的 **Tools**，既可以是原子操作，也可以封装聚合工作流
- MCP Client 连接并获得授权后，可以调用 Server 暴露的 Tools，也可以读取 Resources、使用 Prompts
- 类比：USB 接口——标准化设备连接方式

**A2A（Agent2Agent Protocol）**——标准化独立 Agent 之间的能力发现和任务委派：
- 定义**Skills**：Agent 通过 Agent Card 声明自己能做什么（如"代码审查""测试生成"）
- 客户端发现远程 Agent 的 Skills 后发送 Message；复杂工作可创建有生命周期的 Task，简单交互也可直接返回 Message
- 类比：企业间的合同和工单系统——我知道你能做什么，给你派任务

**三者的协作**：一个本地 Agent Skill 可以指导 Agent 调用多个 MCP Tools；这个 Agent 也可以作为 A2A Server 对外声明一个同名或相关的 `AgentSkill`。A2A 调用方只看到能力、接口和安全要求，不关心服务端内部加载了哪些 `SKILL.md` 或 MCP Tools。

**面试加分点**：MCP 由 Anthropic 于 2024 年发起并开放；A2A 由 Google 于 2025 年 4 月发布，随后贡献给 Linux Foundation 并由社区治理。两者互补，但 Agent Skills 是第三个独立层次，负责可加载的过程知识与工作流。

---

### Q3：如何保证 Skill 的安全性？工具权限应该怎么设计？

**要点**：

Skill 安全性的核心原则是**最小权限 + 不信任外部内容**。Skill 可以包含指令和可执行脚本，应像第三方软件一样审计。

具体措施：

1. **供应链审查**：检查 `SKILL.md`、所有脚本、二进制/图片资源、依赖和外部 URL，警惕与描述不符的网络访问或文件操作。
2. **宿主强制权限**：由 Agent Harness 配置允许/拒绝工具和 Shell 模式。正文里的“不要写文件”不是安全控制；标准中的 `allowed-tools` 只是实验性的预批准字段。
3. **细粒度隔离**：对代码审查只提供 Read / Grep 和必要的只读命令；在沙箱中运行脚本，限制网络、文件系统范围、资源和超时。
4. **人工审批节点**：部署、发送消息、删除、付费、写生产数据等操作必须在执行前暂停并获得确认。
5. **输入与输出防护**：将 reference、网页和工具结果视为不可信数据，防止其中的指令劫持流程；校验工具参数和脚本输出。
6. **审计与回滚**：记录 Skill 激活、工具调用、参数和文件差异；对有副作用的工作流准备回滚方案。

**关键设计**：权限应跟随当前任务缩小，但具体能否做到 Skill 级动态授权取决于客户端。做不到时，应为高风险 Skill 使用独立 Agent、子进程或沙箱，而不是依赖 Prompt 自律。

---

## 延伸阅读

- [AI Agent 基本概念](./ai-agents)
- [MCP 模型上下文协议](./mcp)
- [A2A 智能体协作协议](./a2a)
- [Prompt Engineering 提示工程](./prompt-engineering) — Skill 指令的编写基础
- [Anthropic Tool Use Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) — Claude Client / Server Tools 与 Tool Use 循环
- [Agent Skills Specification](https://agentskills.io/specification) — 跨平台 `SKILL.md` 规范及校验规则
- [Agent Skills Integration Guide](https://agentskills.io/integrate-skills) — 发现、Catalog、激活和上下文管理
- [anthropics/skills](https://github.com/anthropics/skills) — 官方 Skill 示例仓库（pdf/docx/xlsx/mcp-builder/skill-creator 等）
- [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview) — 将 Claude Code 的 Agent Loop、工具、权限和 Skills 作为库使用
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) — 专业 Agent、Agent-as-Tool 和 Handoff 编排
- [A2A Protocol](https://a2a-protocol.org/latest/specification/) — Agent Card 中的 `AgentSkill` 与跨 Agent 任务协议
- [VS Code Agent Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills) — Copilot 的存放位置、客户端扩展字段和调用方式
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io) — 标准化工具定义协议
