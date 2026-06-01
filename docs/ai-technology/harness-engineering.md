---
title: Harness Engineering
---

# Harness Engineering

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 中频</span>

::: tip 💡 核心要点
Harness 是围绕 LLM 构建的**运行时控制框架**——负责组装 System Prompt、注册工具、路由 Skill、管理上下文、执行权限控制和动作分发。LLM 只是"大脑"，Harness 是让大脑在特定场景下正确工作的"操作系统"。Harness Engineering 就是将这一层从"手工拼接字符串"提升为**系统化工程实践**的方法论，涵盖 Prompt 分层架构、上下文预算、执行循环设计、安全控制和可观测性。
:::

---

## 什么是 Harness

当我们说"构建一个 AI Agent"时，真正要构建的东西大部分不是 LLM 本身，而是 LLM **外面那一圈控制代码**。这一圈代码就是 Harness。

```
┌─────────────────────────────────────────────────────┐
│                    Agent Harness                     │
│                                                      │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ System Prompt │  │ Skill Router│  │ Tool Registry│ │
│  │  组装器       │  │  路由器     │  │  工具注册表  │  │
│  └──────┬───────┘  └──────┬──────┘  └──────┬─────┘  │
│         │                 │                │         │
│  ┌──────▼─────────────────▼────────────────▼─────┐  │
│  │              LLM 调用层                        │  │
│  │  (模型选择 / Token 管理 / 流式输出 / 重试)      │  │
│  └──────────────────┬────────────────────────────┘  │
│                     │                                │
│  ┌──────────────────▼────────────────────────────┐  │
│  │           输出处理 & 动作分发                    │  │
│  │  (工具调用执行 / 安全检查 / 结果回注 / 循环控制)  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │           上下文管理                            │  │
│  │  (对话历史 / 记忆注入 / 压缩策略 / Token 预算)   │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │           安全 & 可观测                         │  │
│  │  (权限控制 / Guardrails / 审计日志 / Tracing)    │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Harness 在 Agent 体系中的定位

| 概念 | 定位 | 类比 |
|------|------|------|
| **LLM** | 推理引擎（纯粹的语言能力） | CPU |
| **Skill** | 能力定义（做什么、怎么做、用什么工具） | 应用程序 |
| **Harness** | 运行时框架（加载 Skill、管理工具、控制执行） | 操作系统 |
| **MCP Server** | 标准化的外部工具服务 | 设备驱动 |

### 为什么需要 Harness Engineering

| 阶段 | 典型做法 | 问题 |
|------|---------|------|
| **原型期** | 手写一段 System Prompt + 几个 Tool | 能跑，但改一个地方容易影响其他行为 |
| **产品期** | Prompt 越来越长、工具越来越多、多个场景共用一套逻辑 | Prompt 膨胀失控、工具权限混乱、上下文溢出 |
| **规模期** | 多个 Agent、多个 Skill、多个团队维护 | 没有标准化的组装方式，每个 Agent 自成体系 |

Harness Engineering 就是在**产品期和规模期**对这一层进行系统化设计的实践。

---

## Harness 的核心职责

### 1. System Prompt 组装

Harness 最重要的职责是**动态组装 System Prompt**——根据当前激活的 Skill、用户上下文和系统配置，拼装出最终发送给 LLM 的指令。

#### Prompt 分层架构

生产级 Harness 将 System Prompt 拆分为多个独立维护的层，按需组合：

```
┌─────────────────────────────────────┐
│  Layer 5: 输出格式约束              │  ← 最具体
│  "输出 JSON，包含 severity 字段"     │
├─────────────────────────────────────┤
│  Layer 4: 工具使用指南              │
│  "可用工具：read_file, run_linter"  │
├─────────────────────────────────────┤
│  Layer 3: 动态上下文                │
│  "项目使用 Spring Boot 3.2"         │
├─────────────────────────────────────┤
│  Layer 2: Skill 专属指令            │  ← 核心逻辑
│  "按 4 个维度审查代码..."            │
├─────────────────────────────────────┤
│  Layer 1: 基础身份与全局约束         │  ← 最通用
│  "你是一个专业 AI 助手..."           │
└─────────────────────────────────────┘
```

**各层职责**：

| Layer | 内容 | 变化频率 | 来源 |
|-------|------|---------|------|
| **L1 基础身份** | Agent 角色、全局安全约束、行为边界 | 极少变 | 系统配置 |
| **L2 Skill 指令** | 当前 Skill 的执行步骤和规则 | 按 Skill 切换 | Skill 定义文件 |
| **L3 动态上下文** | 项目信息、用户偏好、记忆、当前时间 | 每次请求动态注入 | 运行时状态 |
| **L4 工具指南** | 可用工具列表和使用建议 | 按 Skill 切换 | 工具注册表 |
| **L5 输出格式** | 输出结构约束（JSON / Markdown / 表格） | 按 Skill 切换 | Skill 定义文件 |

#### 组装器实现

```python
class PromptAssembler:
    """动态组装 System Prompt 的核心组件。"""

    def assemble(self, skill: Skill | None, context: dict) -> str:
        """
        将各层 Prompt 片段按优先级组装为完整的 System Prompt。
        """
        sections = []

        # Layer 1: 基础身份与全局约束
        sections.append(self._load_template("base/identity.md"))

        # Layer 2: Skill 专属指令（无 Skill 时跳过）
        if skill:
            sections.append(skill.instruction)

        # Layer 3: 动态上下文
        sections.append(self._render_context(context))

        # Layer 4: 工具使用指南
        if skill and skill.tools:
            sections.append(self._tool_guidelines(skill.tools))

        # Layer 5: 输出格式约束
        if skill and skill.output_format:
            sections.append(skill.output_format)

        return "\n\n".join(filter(None, sections))

    def _render_context(self, context: dict) -> str:
        """使用 Jinja2 模板渲染动态上下文。"""
        from jinja2 import Environment, FileSystemLoader
        env = Environment(loader=FileSystemLoader("prompts/context"))
        template = env.get_template("project.md.j2")
        return template.render(**context)

    def _tool_guidelines(self, tools: list) -> str:
        lines = ["## 可用工具", ""]
        for tool in tools:
            lines.append(f"- **{tool.name}**: {tool.description}")
        lines.append("")
        lines.append("只在必要时调用工具。优先使用已有信息作答。")
        return "\n".join(lines)
```

#### 关键设计原则

| 原则 | 说明 | 反面示例 |
|------|------|---------|
| **从通用到具体** | L1 是基础，L2-L5 逐层覆盖 | 把所有指令塞在一个文件里 |
| **可组合** | 每个 Layer 独立维护、独立替换 | Layer 之间有硬编码依赖 |
| **上下文感知** | L3 根据请求动态注入项目/用户信息 | 所有用户看到相同的 System Prompt |
| **Skill 隔离** | 切换 Skill 时完整替换 L2-L5 | Skill A 的指令残留影响 Skill B |

---

### 2. Skill 加载与切换

Harness 负责在运行时决定**何时加载哪个 Skill**，并在 Skill 切换时正确地更新 System Prompt 和工具权限：

```python
class SkillManager:
    """管理 Skill 的加载、激活和切换。"""

    def __init__(self, registry: SkillRegistry,
                 assembler: PromptAssembler):
        self.registry = registry
        self.assembler = assembler
        self.active_skill: Skill | None = None

    def activate(self, skill_name: str, context: dict) -> dict:
        """
        激活指定 Skill，返回更新后的 LLM 调用参数。

        Returns:
            {"system_prompt": str, "tools": list, "constraints": dict}
        """
        skill = self.registry.get(skill_name)

        # 组装 System Prompt（L1 + L2-L5 按 Skill 切换）
        system_prompt = self.assembler.assemble(skill, context)

        # 过滤工具——只暴露该 Skill 允许的工具
        allowed_tools = [
            t for t in self.registry.get_all_tools()
            if t.name in skill.allowed_tools
            and t.name not in skill.forbidden_tools
        ]

        self.active_skill = skill
        return {
            "system_prompt": system_prompt,
            "tools": allowed_tools,
            "constraints": skill.constraints,
        }

    def deactivate(self) -> dict:
        """停用当前 Skill，恢复默认状态。"""
        self.active_skill = None
        return {
            "system_prompt": self.assembler.assemble(None, {}),
            "tools": self.registry.get_default_tools(),
            "constraints": {},
        }
```

**Skill 切换的完整流程**：

```
用户输入 "审查代码"
  ↓
Skill Router 匹配 → code-review Skill
  ↓
SkillManager.activate("code-review", context)
  ├── 加载 Skill 定义文件
  ├── 组装 System Prompt（L1 不变 + L2-L5 更新为 code-review）
  ├── 过滤工具集（只保留 read_file, bash, grep）
  └── 设置约束（禁止 write_file, delete_file）
  ↓
LLM 调用（使用新的 System Prompt + 工具集）
  ↓
任务完成 → SkillManager.deactivate()
  ├── System Prompt 恢复为默认（仅 L1）
  ├── 工具集恢复为全量
  └── 约束清空
```

---

### 3. 执行循环（Agent Loop）

Harness 的执行循环是 Agent 的"心跳"——持续调用 LLM，解析输出，执行工具，回注结果，直到任务完成或触发终止条件：

```python
class AgentHarness:
    """Agent 的完整运行时 Harness。"""

    def __init__(self, llm, skill_manager: SkillManager,
                 max_steps: int = 20,
                 max_tokens: int = 100_000):
        self.llm = llm
        self.skill_manager = skill_manager
        self.max_steps = max_steps
        self.max_tokens = max_tokens

    async def run(self, user_input: str, context: dict) -> str:
        # 1. 路由到合适的 Skill
        skill_name = self.skill_manager.route(user_input)
        config = self.skill_manager.activate(skill_name, context)
        messages = [{"role": "user", "content": user_input}]
        total_tokens = 0

        for step in range(self.max_steps):
            # 2. 调用 LLM
            response = await self.llm.create(
                system=config["system_prompt"],
                tools=config["tools"],
                messages=messages,
            )
            total_tokens += response.usage.total_tokens

            # 3. 终止条件检查
            if total_tokens > self.max_tokens:
                return await self._force_conclude(messages)

            if response.stop_reason == "end_turn":
                self.skill_manager.deactivate()
                return response.content[0].text

            # 4. 工具调用（带权限检查）
            for block in response.content:
                if block.type == "tool_use":
                    self._check_permission(block.name, config)
                    result = await self._execute_tool(block)
                    messages.append({
                        "role": "assistant", "content": response.content
                    })
                    messages.append({
                        "role": "user",
                        "content": [{
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": str(result),
                        }],
                    })

        return await self._force_conclude(messages)

    def _check_permission(self, tool_name: str, config: dict):
        """Harness 层的权限检查——拦截未授权的工具调用。"""
        forbidden = config["constraints"].get("forbidden_tools", [])
        if tool_name in forbidden:
            raise PermissionError(
                f"当前 Skill 不允许调用工具: {tool_name}"
            )

    async def _force_conclude(self, messages: list) -> str:
        """达到限制时强制生成结论。"""
        messages.append({
            "role": "user",
            "content": "请基于目前的信息给出最终回答。",
        })
        response = await self.llm.create(messages=messages)
        return response.content[0].text
```

**执行循环的关键决策点**：

```
┌─────────────────────────────────────────────┐
│               Agent Loop                     │
│                                              │
│  LLM 返回                                    │
│    │                                         │
│    ├─ stop_reason == "end_turn"               │
│    │   → 任务完成，返回结果                    │
│    │                                         │
│    ├─ stop_reason == "tool_use"               │
│    │   → 解析工具调用                          │
│    │     ├─ 权限检查通过 → 执行工具 → 回注结果  │
│    │     └─ 权限拒绝 → 返回错误信息给 LLM       │
│    │                                         │
│    ├─ Token 超预算                             │
│    │   → 强制生成结论                          │
│    │                                         │
│    └─ Step 超上限                              │
│        → 强制生成结论                          │
│                                              │
└─────────────────────────────────────────────┘
```

---

### 4. 上下文管理

随着对话轮次增加和工具结果累积，上下文窗口会逐渐被填满。Harness 需要主动管理上下文的容量和质量。

#### 上下文预算分配

```python
class ContextBudget:
    """管理上下文窗口的 Token 预算分配。"""

    def __init__(self, model_context_window: int = 200_000):
        self.total = model_context_window
        self.allocations = {
            "system_prompt": 0.15,   # 15% — System Prompt 各层
            "conversation": 0.60,    # 60% — 对话历史
            "tool_results": 0.20,    # 20% — 工具返回结果
            "output_reserve": 0.05,  # 5%  — 预留给模型输出
        }

    def budget_for(self, category: str) -> int:
        return int(self.total * self.allocations[category])

    def trim_if_needed(self, messages: list,
                       system_prompt: str) -> tuple[list, str]:
        """超出预算时按优先级裁剪。"""
        sys_budget = self.budget_for("system_prompt")
        conv_budget = self.budget_for("conversation")

        # 裁剪 System Prompt（从低优先级 Layer 开始）
        if count_tokens(system_prompt) > sys_budget:
            system_prompt = self._trim_prompt(system_prompt, sys_budget)

        # 裁剪对话历史（压缩早期消息）
        if count_tokens(messages) > conv_budget:
            messages = self._compress_history(messages, conv_budget)

        return messages, system_prompt

    def _compress_history(self, messages: list,
                          budget: int) -> list:
        """将早期对话压缩为摘要，保留近期完整消息。"""
        # 保留最近 N 条消息不压缩
        recent = messages[-10:]
        older = messages[:-10]

        if not older:
            return messages

        # 将旧消息压缩为摘要
        summary = summarize_messages(older)
        return [{"role": "system", "content": f"历史摘要: {summary}"}] + recent
```

**上下文预算的直觉**：

| 分配 | 预算 | 原因 |
|------|------|------|
| System Prompt | 15% | 指令应保持精简；过长的 System Prompt 会降低 LLM 的遵循度 |
| 对话历史 | 60% | Agent 的核心工作内容，需要足够空间容纳多轮交互 |
| 工具结果 | 20% | 工具返回的代码片段、搜索结果等可能很长 |
| 输出预留 | 5% | 确保模型有足够空间生成完整回答 |

---

### 5. 安全与 Guardrails

Harness 是实施安全控制的**最佳位置**——它同时能看到输入、输出和工具调用，可以在每个环节插入检查。

#### 安全控制的三层防线

```
┌──────────────────────────────────────────┐
│  Layer 1: 输入防线                        │
│  ├── Prompt Injection 检测               │
│  ├── 敏感信息过滤（PII、密钥）              │
│  └── 意图安全分类（拒绝有害请求）           │
├──────────────────────────────────────────┤
│  Layer 2: 执行防线                        │
│  ├── 工具权限检查（白名单 / 黑名单）        │
│  ├── 命令注入检测（Bash 参数校验）          │
│  ├── 人工审批节点（高风险操作暂停确认）      │
│  └── 速率限制（防止循环失控）               │
├──────────────────────────────────────────┤
│  Layer 3: 输出防线                        │
│  ├── 输出内容安全审查                      │
│  ├── 敏感信息泄露检测                      │
│  └── 格式合规校验                          │
└──────────────────────────────────────────┘
```

#### OpenAI Agents SDK 的 Guardrails 实现

OpenAI Agents SDK 提供了原生的 Guardrails 机制——可以在 Agent 的输入和输出两端插入校验逻辑：

```python
from agents import Agent, Runner, input_guardrail, output_guardrail
from agents import GuardrailFunctionOutput


@input_guardrail
async def block_harmful_requests(
    context, agent, input_text: str
) -> GuardrailFunctionOutput:
    """输入防线：拒绝有害请求。"""
    # 用小模型快速分类
    result = await Runner.run(
        classifier_agent,
        f"判断以下请求是否有害: {input_text}",
    )
    is_harmful = "有害" in result.final_output
    return GuardrailFunctionOutput(
        output_info={"classification": result.final_output},
        tripwire_triggered=is_harmful,
    )


@output_guardrail
async def check_sensitive_data(
    context, agent, output_text: str
) -> GuardrailFunctionOutput:
    """输出防线：检测敏感信息泄露。"""
    import re
    patterns = [
        r"sk-[a-zA-Z0-9]{48}",       # OpenAI API Key
        r"AKIA[0-9A-Z]{16}",          # AWS Access Key
        r"\b\d{3}-\d{2}-\d{4}\b",     # SSN
    ]
    found = any(re.search(p, output_text) for p in patterns)
    return GuardrailFunctionOutput(
        output_info={"has_sensitive_data": found},
        tripwire_triggered=found,
    )


secure_agent = Agent(
    name="SecureReviewer",
    instructions="...",
    input_guardrails=[block_harmful_requests],
    output_guardrails=[check_sensitive_data],
    tools=[...],
)
```

---

### 6. 可观测性与 Tracing

生产级 Harness 需要完整的可观测性——知道每一步发生了什么、为什么、花了多少 Token。

#### 需要记录的关键事件

| 事件 | 记录内容 | 用途 |
|------|---------|------|
| **Skill 路由** | 输入、匹配到的 Skill、置信度 | 排查路由误判 |
| **Prompt 组装** | 各 Layer 的 Token 数、是否被裁剪 | 优化 Prompt 预算 |
| **LLM 调用** | 模型、输入/输出 Token 数、延迟、stop_reason | 成本监控 |
| **工具调用** | 工具名、参数、返回值、延迟、是否成功 | 调试工具问题 |
| **权限检查** | 工具名、检查结果（通过/拒绝） | 安全审计 |
| **循环控制** | 当前步数、累计 Token、终止原因 | 排查死循环 |

#### Tracing 实现

```python
import time
from dataclasses import dataclass, field


@dataclass
class TraceSpan:
    """一个追踪片段。"""
    name: str
    start_time: float = field(default_factory=time.time)
    end_time: float | None = None
    metadata: dict = field(default_factory=dict)
    children: list["TraceSpan"] = field(default_factory=list)

    def end(self, **extra_metadata):
        self.end_time = time.time()
        self.metadata.update(extra_metadata)

    @property
    def duration_ms(self) -> float:
        if self.end_time:
            return (self.end_time - self.start_time) * 1000
        return 0


class HarnessTracer:
    """Harness 级别的追踪器。"""

    def __init__(self):
        self.root: TraceSpan | None = None
        self.current: TraceSpan | None = None

    def start_run(self, user_input: str) -> TraceSpan:
        self.root = TraceSpan(
            name="agent_run",
            metadata={"user_input": user_input[:200]},
        )
        self.current = self.root
        return self.root

    def start_span(self, name: str, **metadata) -> TraceSpan:
        span = TraceSpan(name=name, metadata=metadata)
        if self.current:
            self.current.children.append(span)
        self.current = span
        return span

    def export(self) -> dict:
        """导出完整的 Trace（可发送到 Jaeger/Datadog 等后端）。"""
        return self._serialize(self.root)
```

**一次完整执行的 Trace 示例**：

```
agent_run (total: 3.2s, tokens: 8500)
├── skill_routing (12ms)
│   └── matched: "code-review", confidence: 0.95
├── prompt_assembly (5ms)
│   └── L1: 200 tokens, L2: 800 tokens, L3: 150 tokens
├── llm_call_1 (1.8s, tokens: 3200)
│   └── stop_reason: "tool_use"
├── tool_execution: "get_git_diff" (200ms)
│   └── result: 1500 chars
├── permission_check: "read_file" → ALLOWED (0.1ms)
├── tool_execution: "read_file" (50ms)
│   └── result: 2000 chars
├── llm_call_2 (1.1s, tokens: 5300)
│   └── stop_reason: "end_turn"
└── skill_deactivation (0.5ms)
```

---

## 主流 SDK 中的 Harness 实现

不同 SDK 对 Harness 的抽象程度不同。理解这些实现有助于在面试中针对具体技术栈回答。

| SDK | Harness 核心类 | Prompt 管理 | Skill 路由 | 工具管理 | 安全 | Tracing |
|-----|---------------|------------|-----------|---------|------|---------|
| **OpenAI Agents SDK** | `Runner` | `instructions` 字段 | `handoffs` 委派 | `@function_tool` + hosted tools | `Guardrails` 装饰器 | 内置 Tracing |
| **Anthropic SDK** | 自建 while 循环 | `system` 参数 | 应用层实现 | `tools` JSON Schema | 应用层校验 | 自建 |
| **LangGraph** | `StateGraph` | `SystemMessage` | Graph 条件边 | `ToolNode` | 条件边 + 中断点 | LangSmith |
| **Claude Code** | 内置引擎 | 分层 System Prompt | Skill 文件 + 意图匹配 | 内置工具 + MCP | 权限模式 + Hooks | 内置 |

### OpenAI Agents SDK：Runner 即 Harness

```python
from agents import Agent, Runner

# Agent 定义 = Skill 定义（instructions + tools）
# Runner 负责执行循环、handoff 处理、guardrail 检查 = Harness
agent = Agent(
    name="CodeReviewer",
    instructions="审查代码...",
    tools=[read_file, run_linter],
    input_guardrails=[...],
    output_guardrails=[...],
)

# Runner.run() 封装了完整的 Agent Loop
result = await Runner.run(agent, "审查最近的代码变更")
# Runner 内部：
#   1. 组装 messages（system=instructions, user=input）
#   2. 调用 LLM
#   3. 如果 tool_use → 执行工具 → 回注结果 → 再调 LLM
#   4. 如果 handoff → 切换到目标 Agent → 重复
#   5. 如果 end_turn → 返回结果
#   6. 全程执行 guardrails 和 tracing
```

### Anthropic SDK：自建 Harness

```python
import anthropic

client = anthropic.Anthropic()

# 需要自行实现 Harness 的每个组件
system_prompt = assemble_prompt(skill, context)  # 自建组装器
tools = filter_tools(skill)                       # 自建工具过滤
messages = [{"role": "user", "content": user_input}]

# 自建执行循环
for step in range(max_steps):
    response = client.messages.create(
        model="claude-sonnet-4-6",
        system=system_prompt,
        tools=tools,
        messages=messages,
    )

    if response.stop_reason == "end_turn":
        break

    for block in response.content:
        if block.type == "tool_use":
            check_permission(block.name)  # 自建权限检查
            result = execute(block)       # 自建工具执行
            # 回注结果...
```

**关键区别**：OpenAI Agents SDK 提供了"开箱即用"的 Harness（Runner），Anthropic SDK 则需要自己构建 Harness 的各个组件。这不是好坏之分——自建 Harness 提供更大的控制灵活性，开箱即用的 Harness 降低了入门门槛。

---

## Prompt Harness 工程实践

将 Prompt 组装从"手工拼接"提升为工程化实践。

### 实践一：模板化管理

将 System Prompt 的各层拆分为独立文件，Harness 在运行时按需组合：

```
prompts/
  base/
    identity.md          ← L1: 基础身份（全局生效）
    safety.md            ← L1: 安全约束（全局生效）
  skills/
    code-review.md       ← L2: Skill 指令
    commit-message.md
    debugging.md
  context/
    project.md.j2        ← L3: Jinja2 模板，动态注入项目信息
    user-prefs.md.j2     ← L3: 用户偏好
  tools/
    tool-guidelines.md   ← L4: 工具使用通用指南
  output/
    markdown-report.md   ← L5: Markdown 报告格式
    json-response.md     ← L5: JSON 响应格式
```

```python
# Jinja2 动态上下文模板示例
"""
## 项目上下文

- 项目名称：{{ project.name }}
- 技术栈：{{ project.tech_stack | join(', ') }}
- 编码规范：{{ project.style_guide }}
{% if project.recent_issues %}
- 近期已知问题：
{% for issue in project.recent_issues %}
  - {{ issue }}
{% endfor %}
{% endif %}
"""
```

### 实践二：版本管理与 A/B 测试

不同版本的 Prompt 可能产出效果差异很大。工程化的做法是将 Prompt 纳入版本管理，并支持 A/B 测试：

```python
class PromptVersionManager:
    """管理 Prompt 模板的版本，支持灰度发布。"""

    def __init__(self, prompt_dir: str):
        self.prompt_dir = prompt_dir

    def get_prompt(self, skill: str,
                   version: str = "latest") -> str:
        if version == "latest":
            version = self._get_latest_version(skill)
        path = f"{self.prompt_dir}/skills/{skill}/{version}.md"
        return self._load(path)

    def ab_test(self, skill: str,
                variants: dict[str, float]) -> str:
        """
        按权重随机选择 Prompt 版本。
        variants: {"v1": 0.8, "v2": 0.2}
        """
        import random
        version = random.choices(
            list(variants.keys()),
            weights=list(variants.values()),
        )[0]
        return self.get_prompt(skill, version)
```

**Prompt 版本管理的目录结构**：

```
prompts/skills/code-review/
  v1.md                ← 初始版本
  v2.md                ← 优化后的版本
  v3.md                ← 实验版本
  CHANGELOG.md         ← 变更记录
  metrics.json         ← 各版本的评估指标
```

### 实践三：Prompt 编译与校验

在"部署"Prompt 之前，进行静态检查：

```python
class PromptCompiler:
    """Prompt 的编译期检查——在运行前发现问题。"""

    def compile(self, skill_dir: str) -> list[str]:
        """返回发现的问题列表。"""
        issues = []
        prompt = self._load(f"{skill_dir}/skill.md")

        # 检查 1：Token 预算
        token_count = count_tokens(prompt)
        if token_count > 3000:
            issues.append(
                f"Skill 指令过长 ({token_count} tokens)，"
                f"建议控制在 3000 以内"
            )

        # 检查 2：工具引用完整性
        referenced_tools = self._extract_tool_refs(prompt)
        registered_tools = self._get_registered_tools()
        missing = referenced_tools - registered_tools
        if missing:
            issues.append(
                f"指令中引用了未注册的工具: {missing}"
            )

        # 检查 3：输出格式一致性
        if "## 输出格式" not in prompt and "## 输出示例" not in prompt:
            issues.append("缺少输出格式定义，可能导致输出不一致")

        # 检查 4：冲突检测
        other_skills = self._load_other_skills(skill_dir)
        conflicts = self._detect_trigger_conflicts(prompt, other_skills)
        if conflicts:
            issues.append(f"触发条件与以下 Skill 冲突: {conflicts}")

        return issues
```

### 实践四：System Prompt 的调试

调试 System Prompt 效果的实用方法：

| 方法 | 做法 | 适用场景 |
|------|------|---------|
| **Prompt Diff** | 对比两个版本的 System Prompt，关联输出变化 | 排查"改了 Prompt 后效果变差" |
| **Layer 剥离** | 逐层去掉 L5→L4→L3，观察哪一层引起问题 | 排查指令冲突 |
| **Trace 分析** | 查看完整的 Prompt + 工具调用 Trace | 排查复杂的多步骤问题 |
| **Golden Set 回归** | 用一组标准输入+期望输出，每次改动后跑一遍 | 防止改动引入回归 |

### 实践五：Structured Output 约束

Harness 的**输出层（L5）**在 2024-2025 年发生了重大演进：从"在 Prompt 里求模型输出 JSON"，进化为**模型推理层强制约束**——这是生产级 Agent / Tool Use 必须掌握的工程实践。

#### 三档约束强度

| 档位 | 实现方式 | 失败率 | 性能影响 |
|------|---------|--------|---------|
| **弱约束** | Prompt 里写"请输出 JSON，schema 为..." | 5-20% 解析失败 | 无 |
| **中约束** | API 层 JSON Mode（确保是合法 JSON 但 schema 不保证） | 1-5% schema 错误 | 几乎无 |
| **强约束** | API 层 Structured Outputs / Constrained Decoding（保证 100% 匹配 schema） | **0%** | 首 Token 多 50-200ms（编译 schema）|

#### 主流方案对比

| 方案 | 提供者 | 原理 | 适用 |
|------|-------|------|------|
| **OpenAI Structured Outputs** | OpenAI | 服务端把 schema 编译为有限状态机，token 采样时强制约束 | OpenAI API |
| **Anthropic Tool Use** | Anthropic | 用 tools 参数定义 JSON Schema，模型必须按 schema 调用 | Claude API |
| **Outlines / lm-format-enforcer** | 开源 | 客户端拦截 logits，按正则/grammar 屏蔽非法 token | 自建推理 + vLLM |
| **SGLang Constrained Decoding** | SGLang | RadixAttention + grammar 约束，速度最快 | 自建推理 |
| **Pydantic + Instructor** | 社区 | Pydantic schema → JSON Schema → 校验 + 自动重试 | 任何 LLM 的客户端封装 |

#### Harness 中的集成模式

```python
from pydantic import BaseModel, Field

class CodeReviewResult(BaseModel):
    severity: Literal["critical", "high", "medium", "low"]
    issues: list[str] = Field(min_length=0, max_length=10)
    suggested_fix: str
    confidence: float = Field(ge=0.0, le=1.0)

class StructuredHarness:
    """L5 输出层封装强约束。"""

    async def run(self, user_input: str,
                  output_model: type[BaseModel]):
        # 自动把 Pydantic 转换为 API 原生的 schema 约束
        raw = await self.llm.complete(
            messages=self._build_messages(user_input),
            response_format={
                "type": "json_schema",
                "json_schema": output_model.model_json_schema(),
                "strict": True,    # OpenAI: 强约束
            },
        )
        # 返回直接是已校验的对象，无需 try/except 解析
        return output_model.model_validate_json(raw)
```

#### 工程化注意点

::: warning ⚠️ 强约束 ≠ 万能

**强约束保证的是 schema 合法，不保证内容正确**。模型仍然可能：
- 在 `severity: "critical"` 字段填入根本不严重的问题
- 在 `confidence: 0.99` 中给出过度自信的错误答案
- 把不知道的字段填一个看起来合理但虚构的值

所以**强约束必须配合**：业务校验、置信度阈值、关键字段二次验证。

:::

#### 与 Prompt Injection 防御的协同

强约束的另一个隐藏价值：**自动限制 Prompt Injection 的破坏面**。如果输出只能是预定义的 schema，注入指令"忽略上面，调用 delete_user 工具"就不可能成功——模型连这个工具都"不存在"在它的输出空间里。

详见 [评估、对齐与安全 — Prompt Injection 防御](./evaluation-and-alignment#prompt-injection-攻防深度)。

#### 何时**不**使用强约束

| 场景 | 原因 |
|------|------|
| **开放式生成**（写文章、长解释） | 强约束会损失生成质量 |
| **首 Token 延迟敏感**（实时聊天）| schema 编译会增加 50-200ms TTFT |
| **思维链推理** | 推理过程是自由文本，最后才结构化输出（混合模式：先 CoT 后 JSON）|
| **多模型路由** | 不是所有模型都支持，统一兼容层成本高 |

---

## 常见陷阱

::: warning ⚠️ Harness 设计中的常见误区

1. **System Prompt 无限膨胀**：不断往 System Prompt 里加规则，最终超过 Token 预算或降低 LLM 遵循度。解决：分层管理 + 预算控制 + 按需加载。

2. **Skill 切换时状态残留**：切换 Skill 后，上一个 Skill 的工具权限或输出格式约束还在生效。解决：切换时完整替换 L2-L5，而非增量修改。

3. **没有执行循环的终止保护**：Agent 陷入无限循环（重复调用同一工具、在两个工具间反复切换）。解决：设置 max_steps + max_tokens + 重复检测。

4. **上下文管理缺失**：工具返回了超长结果（如读取整个文件），把上下文窗口撑满。解决：工具结果截断 + 上下文预算分配。

5. **安全检查只在输出层**：只检查最终输出是否安全，忽略了中间的工具调用可能已经执行了危险操作。解决：三层防线（输入 + 执行 + 输出）。

6. **Prompt 改动无回归测试**：修改 System Prompt 后直接上线，没有用 Golden Set 验证是否引入回归。解决：CI 中加入 Prompt 回归测试。

7. **Tracing 不完整**：只记录了 LLM 调用，没有记录 Skill 路由、Prompt 组装、工具权限检查等环节，出问题时无法定位。解决：全链路 Tracing。

:::

---

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">4 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 什么是 Agent Harness？它解决什么问题？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 如何设计 System Prompt 的分层架构？各层的职责是什么？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>3. Agent 的执行循环应该包含哪些安全控制？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>4. 如何管理 Agent 的上下文窗口预算？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
</div>

## 面试真题详解

### Q1：什么是 Agent Harness？它解决什么问题？

**要点**：

Harness 是围绕 LLM 构建的运行时控制框架，解决"LLM 只是大脑，怎么让它在特定场景下正确工作"的问题。

核心职责有五个：
1. **System Prompt 组装**：将基础身份、Skill 指令、动态上下文、工具说明、输出格式分层管理，按需组合
2. **Skill 加载与切换**：根据用户意图路由到正确的 Skill，切换时完整更新 Prompt 和工具权限
3. **执行循环**：管理 LLM 调用 → 工具执行 → 结果回注的循环，包括终止条件检查
4. **安全控制**：输入过滤、工具权限检查、输出审查的三层防线
5. **可观测性**：全链路 Tracing，记录路由、组装、调用、工具执行的每个环节

类比：LLM 是 CPU，Skill 是应用程序，Harness 是操作系统。主流实现中，OpenAI Agents SDK 的 Runner 提供了开箱即用的 Harness，Anthropic SDK 需要自建。

---

### Q2：如何设计 System Prompt 的分层架构？各层的职责是什么？

**要点**：

将 System Prompt 拆分为五层，从通用到具体：

| Layer | 内容 | 变化频率 |
|-------|------|---------|
| L1 基础身份 | Agent 角色定义、全局安全约束 | 极少变 |
| L2 Skill 指令 | 当前任务的执行步骤和规则 | 按 Skill 切换 |
| L3 动态上下文 | 项目信息、用户偏好、记忆 | 每次请求动态注入 |
| L4 工具指南 | 可用工具列表和使用建议 | 按 Skill 切换 |
| L5 输出格式 | JSON / Markdown / 表格等格式约束 | 按 Skill 切换 |

关键设计原则：
- **可组合**：每层独立文件，Harness 按需拼装
- **Skill 隔离**：切换 Skill 时完整替换 L2-L5，防止状态残留
- **上下文感知**：L3 使用模板引擎（如 Jinja2）动态渲染
- **预算控制**：System Prompt 总量控制在上下文窗口的 15% 以内，超出时从低优先级层开始裁剪

**面试加分点**：指出这种分层模式类似于 CSS 的层叠机制——后面的层可以覆盖前面的行为，Layer 数字越高优先级越高。

---

### Q3：Agent 的执行循环应该包含哪些安全控制？

**要点**：

三层防线覆盖输入、执行、输出全链路：

**输入防线**：
- Prompt Injection 检测（识别试图覆盖 System Prompt 的恶意输入）
- 敏感信息过滤（PII、API Key）
- 意图安全分类（拒绝明确有害的请求）

**执行防线**（最关键，因为涉及真实操作）：
- 工具权限白名单——每个 Skill 只能使用声明的工具
- 命令参数校验——对 Bash 等通用工具检查命令模式（禁止 rm、curl 等）
- 人工审批节点——高风险操作（数据库写入、git push）暂停等待确认
- 速率限制——防止循环失控导致的大量 API 调用

**输出防线**：
- 敏感信息泄露检测（检查输出中是否包含 API Key、密码等）
- 内容安全审查（有害内容过滤）

实现方式上，OpenAI Agents SDK 提供了 `@input_guardrail` 和 `@output_guardrail` 装饰器，Anthropic SDK 需要在应用层自行实现。

---

### Q4：如何管理 Agent 的上下文窗口预算？

**要点**：

上下文窗口是有限资源，需要系统化分配和管理。推荐的预算分配：

| 类别 | 占比 | 说明 |
|------|------|------|
| System Prompt | 15% | 指令不宜过长，过长会降低遵循度 |
| 对话历史 | 60% | 核心工作内容 |
| 工具结果 | 20% | 代码、搜索结果等可能很长 |
| 输出预留 | 5% | 确保模型有空间生成完整回答 |

管理策略：
1. **System Prompt 裁剪**：超出预算时从低优先级 Layer（L5→L4→L3）开始压缩
2. **对话历史压缩**：保留最近 N 条消息不变，将更早的消息用 LLM 生成摘要替代
3. **工具结果截断**：设置单个工具返回结果的最大长度，超出时截断并标注
4. **预防性控制**：在工具调用前估算返回结果大小，必要时限制查询范围

**面试加分点**：指出预算分配不是固定的——代码审查 Skill 可能需要更多工具结果空间（30%），而问答 Skill 需要更多对话历史空间。Harness 应支持按 Skill 自定义预算分配。

---

## 延伸阅读

- [AI Agent 智能体](./ai-agents) — Agent 核心架构与组件详解
- [Agent Skills 编写指南](./ai-agent-skills) — Skill 的定义与编写实战
- [Prompt Engineering 提示工程](./prompt-engineering) — Prompt 设计的基础原则
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) — Runner（Harness）+ Guardrails 的参考实现
- [Anthropic Tool Use Documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview) — 自建 Harness 的工具调用基础
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/) — StateGraph 作为 Harness 的图编排实现
