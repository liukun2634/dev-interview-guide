---
title: Agent Skills 编写指南
---

# Agent Skills 编写指南

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 中频</span>

::: tip 💡 核心要点
Agent Skill 是将特定领域的能力（Prompt 指令 + 工具集 + 执行约束）封装为可复用模块的设计模式。2025 年以来，Skill 的定义方式正在从**自定义格式**走向**协议标准化**——Google 的 A2A 协议将 Skill 作为 Agent 对外声明能力的核心原语，MCP 标准化了工具层，主流 SDK（OpenAI Agents SDK、Anthropic Agent SDK）也各自沉淀了 Skill 编排的最佳实践。本页聚焦实战编写，概念与架构详见 [AI Agent 智能体 - Skills 章节](./ai-agents#agent-skills-技能系统)。
:::

---

## 什么是 Agent Skill

Skill 是 Agent 的**能力单元**。一个 Skill 回答三个问题：

| 问题 | 对应要素 | 示例 |
|------|---------|------|
| **什么时候激活？** | 触发条件（trigger） | 用户输入 `/review`、意图匹配"审查代码" |
| **做什么？** | 指令（instruction） | 分析代码质量、检查安全漏洞、输出报告 |
| **用什么？** | 工具集 + 约束（tools & constraints） | 可用 Bash(lint)、Read；不可执行删除操作 |

**类比**：如果 Agent 是一个多面手员工，那 Skill 就是他的**标准作业流程（SOP）**——遇到特定任务时，按照预设流程执行，而不是每次即兴发挥。

---

## 行业标准的演进：从自定义到协议化

2025 年之前，Skill 的定义完全是各框架自行设计的。2025 年起，两个开放协议正在标准化 Skill 的声明和交互方式：

### MCP + A2A：双协议格局

```
┌─────────────────────────────────────────────────┐
│               Agent 能力体系                      │
├─────────────────────────────────────────────────┤
│  A2A (Agent-to-Agent Protocol)                  │
│  ├── Agent Card: Agent 对外声明自己有哪些 Skills  │
│  ├── Task: Agent 之间交换任务的标准格式            │
│  └── 定位: Agent 之间的能力发现与任务委派           │
├─────────────────────────────────────────────────┤
│  MCP (Model Context Protocol)                   │
│  ├── Tools: 标准化的工具定义（函数签名 + 描述）     │
│  ├── Resources: 只读数据源                       │
│  └── 定位: Agent 与工具/数据源之间的标准接口        │
├─────────────────────────────────────────────────┤
│  关系: Skill 调用 MCP Tools 执行具体操作           │
│        A2A 让 Skill 可被其他 Agent 发现和调用      │
└─────────────────────────────────────────────────┘
```

### A2A 中的 Skill 定义

Google 于 2025 年 4 月发布的 A2A（Agent-to-Agent）协议，将 Skill 作为 Agent Card 的核心字段——Agent 通过 `/.well-known/agent.json` 声明自己的能力：

```json
{
  "name": "CodeReviewAgent",
  "description": "自动化代码审查 Agent",
  "url": "https://review-agent.example.com",
  "skills": [
    {
      "id": "code-review",
      "name": "Code Review",
      "description": "审查代码变更的质量、安全性和最佳实践合规性",
      "tags": ["code", "security", "review"],
      "examples": [
        "审查这个 PR 的代码质量",
        "检查最近的提交有没有安全漏洞"
      ]
    },
    {
      "id": "generate-tests",
      "name": "Test Generation",
      "description": "根据源代码自动生成单元测试",
      "tags": ["code", "testing"],
      "examples": [
        "给 UserService 生成单元测试"
      ]
    }
  ],
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  }
}
```

**A2A 的关键设计**：
- Skill 声明是**对外广告**——告诉其他 Agent"我能做什么"，但不暴露内部实现
- 客户端 Agent 通过 Skill 的 `description`、`tags`、`examples` 来决定是否委派任务
- 任务执行是**不透明的**——调用方不需要知道对方内部用了哪些 Tools 或 Prompt

### 当前格局对比

| 维度 | 自定义 Skill（框架内） | A2A Skill（跨 Agent） | MCP Tool（工具层） |
|------|---------------------|---------------------|-------------------|
| **粒度** | 一个完整的任务流程 | 一个可委派的能力 | 一个原子操作 |
| **发现机制** | 内部路由器匹配 | Agent Card 公开声明 | MCP Server 注册 |
| **执行方式** | 内部 Prompt 注入 | 跨 Agent 的 Task 交换 | 函数调用 |
| **标准化程度** | 各框架各异 | 开放协议（Google 主导） | 开放协议（Anthropic 主导） |
| **典型场景** | 单 Agent 内部的能力切换 | 多 Agent 协作的能力发现 | Agent 调用外部工具 |

---

## Skill 的实现形式

### 形式一：基于 Prompt 文件

最轻量的方式——Skill 就是一个带元数据的 Markdown 文件，Agent 在匹配到触发条件时将其注入上下文。

```markdown
---
name: code-review
description: 审查代码的质量、安全性和最佳实践合规性
trigger:
  - command: /review
  - keywords: ["审查代码", "code review", "检查代码"]
tools: [Read, Grep, Bash]
constraints:
  - 不修改任何文件，只输出审查报告
  - 不执行 git push 等远程操作
---

## 角色

你是一位资深代码审查专家，专注于代码质量、安全性和可维护性。

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
**缺点**：逻辑较固定，无法做复杂的条件分支

---

### 形式二：基于 SDK 的代码实现

2025 年的主流 Agent SDK 都提供了标准化的工具/技能定义方式。

#### OpenAI Agents SDK（2025 年 3 月发布）

OpenAI Agents SDK（前身 Swarm）将 Agent 本身作为 Skill 的载体——通过 `instructions` 定义行为，通过 `tools` 声明能力，通过 `handoffs` 实现 Skill 间的委派：

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


# 每个 Agent 就是一个 Skill——专注于一个职责
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

# Agent 之间通过 handoffs 实现 Skill 路由
# 用户意图不明确时，triage Agent 决定委派给哪个 Skill Agent
triage_agent = Agent(
    name="Triage",
    instructions="根据用户意图，将任务委派给合适的专家 Agent。",
    handoffs=[code_review_agent, test_gen_agent, commit_agent],
)

# 运行
result = Runner.run_sync(triage_agent, "审查最近的代码变更")
print(result.final_output)
```

**关键模式**：
- **Agent-as-Skill**：每个 Agent 专注于一个职责，本身就是一个 Skill
- **Handoffs**：Triage Agent 充当路由器，通过 handoff 将任务委派给专业 Agent
- **Agent-as-Tool**：也可以将一个 Agent 注册为另一个 Agent 的 Tool，实现嵌套调用

#### Anthropic Agent SDK + Tool Use

Anthropic 的 Agent 模式基于 **Tool Use + System Prompt** 实现 Skill：

```python
import anthropic

client = anthropic.Anthropic()

# 工具定义——遵循 MCP 兼容的 JSON Schema 格式
tools = [
    {
        "name": "run_linter",
        "description": (
            "对指定文件运行代码静态分析。"
            "输入：文件路径。输出：问题列表（行号、规则、描述）。"
            "仅支持 .py/.js/.ts/.java 文件。"
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
    },
    {
        "name": "read_file",
        "description": "读取指定路径的文件内容",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "文件路径"}
            },
            "required": ["path"]
        }
    }
]

# Skill 的行为由 System Prompt 定义
skill_instruction = """你是一位资深代码审查专家。
请按以下步骤执行审查：
1. 使用 read_file 读取需要审查的文件
2. 使用 run_linter 对每个文件运行静态分析
3. 结合 lint 结果和你的专业判断，输出结构化审查报告
约束：你只做审查，不修改任何文件。"""

# Agent 循环：持续调用直到模型完成任务
messages = [{"role": "user", "content": "审查 src/auth/login.py 的代码质量"}]

while True:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=skill_instruction,
        tools=tools,
        messages=messages,
    )

    if response.stop_reason == "end_turn":
        print(response.content[0].text)
        break

    # 执行工具调用并返回结果
    for block in response.content:
        if block.type == "tool_use":
            result = execute_tool(block.name, block.input)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({
                "role": "user",
                "content": [{
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": str(result),
                }],
            })
```

#### MCP Server 作为 Skill 的工具层

当 Skill 需要调用标准化工具时，可以通过 MCP Server 提供：

```python
# MCP Server 定义工具（供任何 MCP 兼容的 Agent 调用）
from mcp.server import Server
from mcp.types import Tool

server = Server("code-analysis")

@server.tool()
async def run_linter(file_path: str) -> str:
    """对指定文件运行代码静态分析。支持 .py/.js/.ts 文件。"""
    # 实际的 lint 逻辑
    ...

@server.tool()
async def check_security(file_path: str) -> str:
    """检查文件中的安全漏洞（OWASP Top 10）。"""
    ...
```

**MCP 的价值**：工具定义一次，任何支持 MCP 的 Agent（Claude Desktop、VS Code Copilot、自定义 Agent）都可以调用，无需为每个 Agent 重复实现。

---

### 形式三：基于配置（JSON/YAML Schema）

适合平台化的 Agent 系统（如 Dify、Coze），用声明式配置定义 Skill：

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

### 各形式对比

| 维度 | Prompt 文件 | SDK 代码 | 配置 Schema | A2A Agent Card |
|------|------------|---------|------------|----------------|
| **上手难度** | 低 | 中 | 低-中 | 低 |
| **灵活性** | 中 | 高 | 中 | 低（仅声明） |
| **标准化** | 低 | 中（SDK 特定） | 低 | 高（开放协议） |
| **跨 Agent 复用** | 不支持 | 不支持 | 不支持 | 原生支持 |
| **适用场景** | 单 Agent 内部 | 需要复杂编排 | 平台化系统 | 多 Agent 协作 |
| **典型产品** | Claude Code | OpenAI Agents SDK | Dify、Coze | Google A2A 生态 |

---

## 编写高质量 Skill 指令

Skill 的核心是**指令（Instruction）**——它决定了 Agent 在 Skill 被激活后的行为。指令质量直接影响 Skill 的可靠性。

### 原则一：明确角色与边界

```markdown
# ❌ 模糊的角色定义
你是一个助手，帮助用户审查代码。

# ✅ 清晰的角色 + 边界
你是一位资深后端工程师，专注于 Java/Spring 生态的代码审查。
你只负责识别问题并输出报告，不直接修改代码。
如果发现安全漏洞（如 SQL 注入），将其标记为 Critical 级别。
如果文件是测试代码，放宽格式要求但严格检查断言覆盖。
```

**关键点**：
- 指定**专业领域**（不是万能助手）
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

Skill 应显式声明它需要哪些工具，以及不允许使用哪些工具。这是**安全边界**的核心。

### 最小权限原则

```yaml
tools:
  # 该 Skill 可以使用的工具
  allowed:
    - read_file      # 读取代码文件
    - bash           # 运行 git diff、lint 等只读命令
    - grep           # 搜索代码模式

  # 显式禁止的工具
  forbidden:
    - write_file     # 审查 Skill 不应修改代码
    - delete_file    # 绝对不能删除
    - git_push       # 不能推送远程

  # Bash 工具的细粒度约束
  bash_constraints:
    allowed_commands:
      - "git diff *"
      - "git log *"
      - "npx eslint *"
      - "python -m pylint *"
    forbidden_patterns:
      - "rm "
      - "git push"
      - "curl "        # 防止数据外泄
```

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

### 三种触发方式

```
┌────────────────────────────────────────────────┐
│               用户输入                          │
├────────────────────────────────────────────────┤
│  1. 显式命令:  /review, /commit, /debug        │
│     → 精确匹配，零歧义                          │
│                                                │
│  2. 关键词匹配: "帮我审查代码", "检查一下"        │
│     → 灵活但可能误触发                          │
│                                                │
│  3. LLM 意图分类 / Handoff 路由                 │
│     → 最灵活，主流 SDK 的默认方式                │
│     → OpenAI: triage Agent + handoffs          │
│     → Anthropic: tool_choice + system prompt   │
├────────────────────────────────────────────────┤
│  推荐: 混合路由                                 │
│  命令式触发（/xx）优先 → 关键词补充 → LLM 兜底   │
└────────────────────────────────────────────────┘
```

### Handoff 路由（OpenAI Agents SDK 模式）

OpenAI Agents SDK 引入的 **Handoff** 是一种优雅的 Skill 路由方式——Triage Agent 作为路由器，根据用户意图将对话"移交"给专业 Agent：

```python
from agents import Agent

# 每个专业 Agent 就是一个 Skill
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
| **新 Skill 接入** | 需要手动添加触发词 | 只需在 instructions 中描述 |
| **误判处理** | 静默失败或执行错误 Skill | 可以反问用户确认 |
| **成本** | 零（规则匹配） | 一次 LLM 调用 |

### 避免触发冲突

当多个 Skill 可能被同一输入触发时：

| 策略 | 做法 | 适用场景 |
|------|------|---------|
| **优先级排序** | 每个 Skill 声明 priority（1-10） | Skill 数量 < 20 |
| **范围细化** | 缩小每个 Skill 的触发关键词范围 | 关键词有重叠 |
| **互斥声明** | Skill A 声明与 Skill B 互斥 | 功能相近的 Skill |
| **Handoff 语义路由** | Triage Agent 用 LLM 判断 | 主流 SDK 的推荐方式 |

---

## 测试与验证

Skill 编写完成后，需要从三个层面验证。

### 层面一：指令测试

验证 Skill 指令本身的质量——给定输入，输出是否符合预期：

```python
def test_skill_instruction_quality():
    """测试 Skill 指令是否能引导 LLM 产出正确格式的结果。"""
    skill = load_skill("code-review")

    test_code = """
    def get_user(user_id):
        query = f"SELECT * FROM users WHERE id = {user_id}"
        return db.execute(query)
    """

    result = agent.execute_with_skill(skill, context={"code": test_code})

    assert "Critical" in result           # 应发现 SQL 注入
    assert "SQL" in result.lower()        # 应提及 SQL 注入
    assert "|" in result                  # 应使用表格格式
```

### 层面二：路由测试

验证 Skill 的触发条件是否正确匹配：

```python
def test_skill_routing():
    """测试各种输入是否正确路由到对应 Skill。"""
    router = SkillRouter(registry)

    # 应该触发 code-review Skill
    assert router.route("/review").name == "code-review"
    assert router.route("帮我审查代码").name == "code-review"
    assert router.route("这段代码有没有安全问题").name == "code-review"

    # 不应该触发 code-review Skill
    assert router.route("帮我写一段代码").name != "code-review"
    assert router.route("/commit").name != "code-review"
```

### 层面三：集成测试

验证 Skill 在完整 Agent 系统中的端到端表现：

```python
def test_skill_end_to_end():
    """端到端测试：从用户输入到最终输出。"""
    agent = create_test_agent(skills=["code-review"])

    setup_test_repo_with_sql_injection()

    result = agent.run("请审查当前分支的代码变更")

    assert result.skill_used == "code-review"
    assert result.tools_called == ["bash", "read"]
    assert "SQL 注入" in result.output
    assert "write_file" not in result.tools_called  # 没有违反约束
```

---

## 实战案例：从零编写一个 Commit Message Skill

以下是一个完整的 Skill 编写过程，展示从需求分析到最终实现。

### Step 1：明确需求

```
目标：自动分析 git 暂存区的变更，生成规范的 commit message
触发方式：用户输入 /commit
输出格式：Conventional Commits（type(scope): description）
约束：不自动执行 git commit，只生成 message 供用户确认
```

### Step 2：设计 Skill 定义

```markdown
---
name: commit-message
description: 分析暂存区变更并生成规范的 Conventional Commits 格式的 commit message
trigger:
  commands: ["/commit", "/cm"]
  keywords: ["生成 commit", "提交信息", "commit message"]
tools: [bash, read, grep]
constraints:
  - 不执行 git commit，只输出 message 文本
  - 不执行 git push
  - 不修改任何文件
---

## 角色

你是一位遵循 Conventional Commits 规范的 commit message 专家。

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
    # 路由测试（如果使用 triage agent）
    result = Runner.run_sync(triage_agent, "/commit")
    assert result.last_agent.name == "CommitMessageGenerator"

    # 指令测试
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

## 常见陷阱

::: warning ⚠️ 编写 Skill 时的常见误区

1. **指令过于模糊**：写"审查代码"不如写"按以下 4 个维度逐文件审查：安全性、正确性、性能、风格"。模糊指令导致每次执行结果不一致。

2. **忘记声明约束**：一个"代码审查" Skill 如果不禁止 write_file 工具，Agent 可能在审查过程中"顺手"修改代码，违背 Skill 的只读语义。

3. **触发条件过宽**：关键词"代码"会让几乎所有编程相关对话都触发此 Skill。应使用更具体的词组（"审查代码"而非"代码"）并设置排除条件。

4. **缺少异常处理指令**：没告诉 Skill 遇到空输入、超大文件、二进制文件怎么办，导致执行中断或产出无意义内容。

5. **工具描述与 Skill 指令脱节**：Skill 指令说"运行 lint 检查"，但工具列表中没有注册 linter 工具，导致 Agent 无法执行或用错误方式替代。

6. **没做路由冲突检测**：新增 Skill 后不测试是否抢占了已有 Skill 的触发词，导致原有功能失效。

7. **忽视协议标准化趋势**：还在用纯自定义格式定义 Skill，没有考虑 MCP/A2A 兼容性。工具层应尽量使用 MCP 标准格式，便于跨 Agent 复用。

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

Agent Skill 系统的核心设计包含三层：

1. **Skill 定义层**：每个 Skill 必须包含五个要素：
   - **名称和描述**：用于路由匹配和对外声明（A2A Agent Card 中的 skills 字段）
   - **触发条件**：何时激活（显式命令、关键词、LLM 意图分类）
   - **指令**：具体的执行步骤和行为规范
   - **工具声明**：可用和禁用的工具列表（推荐使用 MCP 标准格式定义工具）
   - **约束**：安全边界和行为限制

2. **路由层**：根据用户输入选择合适的 Skill。当前主流方式有两种：传统混合路由（命令优先 + 关键词 + LLM 兜底），以及 SDK 原生的 Handoff 路由（OpenAI Agents SDK 中 Triage Agent 通过 handoffs 委派给专业 Agent）。

3. **执行层**：将 Skill 的指令注入 Agent 上下文，限制工具权限到 Skill 声明的范围，执行完成后恢复默认状态。

Skill 的实现有多种形式：Prompt 文件（最轻量）、SDK 代码（OpenAI Agents SDK 的 Agent-as-Skill 或 Anthropic Tool Use + System Prompt）、配置 Schema（适合 Dify/Coze 等平台）、A2A Agent Card（面向跨 Agent 协作）。

---

### Q2：MCP 和 A2A 在 Agent Skill 体系中分别扮演什么角色？它们是什么关系？

**要点**：

MCP 和 A2A 是**互补**关系，分别解决不同层面的问题：

**MCP（Model Context Protocol）**——标准化 Agent 与工具/数据源之间的接口：
- 定义**原子操作**（Tools）：如"查询数据库""运行 linter""读取文件"
- 每个 MCP Server 暴露一组 Tools，任何 MCP 兼容的 Agent 都可以调用
- 类比：USB 接口——标准化设备连接方式

**A2A（Agent-to-Agent Protocol）**——标准化 Agent 之间的能力发现和任务委派：
- 定义**Skills**：Agent 通过 Agent Card 声明自己能做什么（如"代码审查""测试生成"）
- 客户端 Agent 发现远程 Agent 的 Skills 后，通过 Task 交换委派任务
- 类比：企业间的合同和工单系统——我知道你能做什么，给你派任务

**两者的协作**：一个 Skill 的内部实现可能调用多个 MCP Tools。例如"代码审查" Skill 内部调用 MCP 的 `read_file`、`run_linter` 工具，但调用方（通过 A2A 委派任务的其他 Agent）只看到 Skill 的名称和描述，不关心内部用了哪些 Tools。

**面试加分点**：指出 MCP 是 Anthropic 主导（2024 年发布），A2A 是 Google 主导（2025 年 4 月发布），两者都是开放协议，正在形成 Agent 生态的"双协议"标准。

---

### Q3：如何保证 Skill 的安全性？工具权限应该怎么设计？

**要点**：

Skill 安全性的核心原则是**最小权限**——每个 Skill 只应获得完成任务所必需的工具和权限。

具体措施：

1. **显式工具声明**：Skill 定义中列出 `allowed` 和 `forbidden` 工具。未声明的工具默认禁用（白名单模式）。
2. **细粒度约束**：对通用工具（如 Bash）限制可执行的命令模式。例如代码审查 Skill 只允许 `git diff`、`git log`，禁止 `rm`、`curl` 等。
3. **沙箱执行**：工具调用在隔离环境中运行，防止 Skill 通过工具影响宿主系统。
4. **人工审批节点**（Human-in-the-Loop）：对高风险操作设置审批点，Skill 执行到此步时暂停等待确认。OpenAI Agents SDK 的 Guardrails 和 Anthropic 的 tool approval 机制都支持此模式。
5. **审计与追踪**：记录每个 Skill 的每次工具调用。OpenAI Agents SDK 内置 Tracing，Anthropic 可通过 API 日志实现。

**关键设计**：工具权限应绑定在 Skill 级别而非 Agent 级别——同一个 Agent 在执行"代码审查" Skill 时只有只读权限，切换到"代码生成" Skill 时才有写权限。这比全局权限更安全。

---

## 延伸阅读

- [AI Agent 智能体 - Skills 概念详解](./ai-agents#agent-skills-技能系统)
- [Prompt Engineering 提示工程](./prompt-engineering) — Skill 指令的编写基础
- [Anthropic Tool Use Documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview) — Claude Tool Use 标准格式
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) — Agent-as-Skill 和 Handoff 模式
- [Google A2A Protocol](https://github.com/google/A2A) — Agent Card 中的 Skills 声明标准
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io) — 标准化工具定义协议
