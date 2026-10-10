---
title: Harness Engineering
---

# Harness Engineering

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 中频</span>

::: tip 💡 核心要点
Harness 是围绕 LLM 构建的**运行时与环境脚手架**：组装指令和上下文、发现与分发工具、运行 Agent Loop、管理权限/沙箱、压缩历史、调度 Subagents，并用检查点、验证闭环和 Tracing 保持长任务可恢复。LLM 决定下一步，Harness 决定它能看到什么、能做什么、何时暂停以及如何证明完成。Harness Engineering 就是把这一层从“手工 while 循环”提升为可测试、可恢复、可审计的工程系统。
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
| **Skill** | 按需加载的过程知识与资源；本身不是执行主体 | 操作手册 / 能力包 |
| **Harness** | 运行时与环境（上下文、Loop、工具、权限、恢复、验证） | 操作系统 + 调度器 |
| **MCP Server** | 标准化的外部工具/数据/Prompt 服务 | 外设或网络服务 |

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

System Prompt 组装只是 Harness 的一部分。更完整的 **Context Engineering** 要在每次推理前选择最小且高信号的 token 集合：系统指令、Skill、工具定义、记忆、检索结果、消息历史和工具结果都竞争同一注意力预算。

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
| **L3 动态上下文** | 项目信息、用户偏好、记忆、必要的时效信息 | 每次请求动态注入 | 运行时状态 |
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

动态值应尽量放在稳定前缀之后；把每轮时间戳、随机 ID 等塞进 System Prompt 会破坏 Prompt Cache。分层也不是“后层自动覆盖前层”的语言规范：冲突指令的优先级由消息角色、模型和宿主实现共同决定，最佳做法是消除冲突而不是依赖层叠覆盖。

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

        # 由 Harness 强制缩小工具面；不能只在 Prompt 中声明
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
            "constraints": self.registry.get_default_constraints(),
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
    ├── 缩小工具集（只保留 read_file, bash, grep）
  └── 设置约束（禁止 write_file, delete_file）
  ↓
LLM 调用（使用新的 System Prompt + 工具集）
  ↓
任务完成 → SkillManager.deactivate()
  ├── System Prompt 恢复为默认（仅 L1）
    ├── 工具集恢复为会话默认最小集合
    └── 恢复默认约束（不是清空权限）
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
                # end_turn 只表示模型停止，不等于任务已通过验收；
                # 此最小示例未实现 verifier；生产实现必须检查 acceptance criteria，
                # 失败时把证据回注并继续循环。
                self.skill_manager.deactivate()
                return response.content[0].text

            # 4. 工具调用（带权限检查）
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    self._check_permission(block.name, config)
                    result = await self._execute_tool(block)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(result),
                    })

            # 同一轮 assistant 响应只追加一次；所有 tool_result 放进紧邻的一个 user 消息。
            if tool_results:
                messages.append({
                    "role": "assistant", "content": response.content
                })
                messages.append({"role": "user", "content": tool_results})

        return await self._force_conclude(messages)

    def _check_permission(self, tool_name: str, config: dict):
        """Harness 层的权限检查——拦截未授权的工具调用。"""
        allowed = {tool.name for tool in config["tools"]}
        if tool_name not in allowed:
            raise PermissionError(
                f"当前任务未启用工具: {tool_name}"
            )
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
│    │   → 生产版运行 verifier；通过才返回结果     │
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

### 4. 上下文管理（Context Engineering）

随着对话轮次增加和工具结果累积，上下文窗口会逐渐被填满。Harness 需要主动管理上下文的容量和质量。

#### 上下文预算分配

```python
class ContextBudget:
    """管理上下文窗口的 Token 预算分配。"""

    def __init__(self, model_context_window: int,
                 allocations: dict[str, float]):
        self.total = model_context_window
        self.allocations = allocations  # 按模型、任务和历史 trace 配置
        if not 0.99 <= sum(allocations.values()) <= 1.01:
            raise ValueError("allocations must sum to 1")

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

        # 将旧消息压缩为摘要。这里返回 Harness 内部消息，不能直接作为
        # Anthropic Messages API 的 role="system" 历史消息发送；接入具体
        # Provider 时应放入独立 system/developer 区或转换为合法消息。
        summary = summarize_messages(older)
        return [{"kind": "history_summary", "content": summary}] + recent
```

**上下文预算的直觉**（比例应由任务和评测决定，不存在通用固定值）：

| 分配 | 预算 | 原因 |
|------|------|------|
| System Prompt / Skills | 先保留关键约束，再删重复说明 | 指令要完整但不堆砌百科知识 |
| 对话与任务状态 | 保留目标、决策、未完成项和近期交互 | 原始长历史不一定比高保真摘要更有用 |
| 工具定义与结果 | 常用工具常驻，其余按需发现；结果只回传高信号字段 | 工具 Schema、截图和日志都占上下文 |
| 输出预留 | 根据模型输出上限和任务产物估算 | 生成被截断会破坏结构化结果与代码 |

#### Tool Search、Compaction 与 Subagents

| 手段 | 用途 | 边界 |
|------|------|------|
| **Tool Search / deferred loading** | 工具很多时先搜索 catalog，只把命中的定义放进模型上下文 | 召回可能失败；常用工具应常驻，权限仍在执行层检查 |
| **Compaction** | 对接近窗口上限的历史做高保真压缩，或先清理旧工具结果 | 有损；Prompt Cache 省计算但不回收窗口，不能替代 compaction |
| **结构化外部状态** | 将计划、验收条件、决策、进度和 Artifact 存到文件/数据库 | 要有 Schema、版本和恢复流程，不能只写散文摘要 |
| **Subagents** | 把高输出、可独立探索的任务放进干净上下文，只返回摘要或 Artifact 引用 | 不适合每一步都强共享状态的任务；需限制并发、深度、工具和预算 |

::: tip 💡 记忆法
**Search 管“现在加载什么”，Compaction 管“过去保留什么”，Subagent 管“哪些细节不要进入主上下文”。**
:::

### 5. 检查点与验证闭环

长任务不能只依赖会话摘要。Harness 应持久化可恢复的状态，并把“完成”绑定到环境证据：

1. **任务清单**：每项有验收条件、状态和负责人；模型不能删除失败项来宣告完成。
2. **检查点**：保存 session/run state、工作区快照或 Git commit、工具副作用记录和 Harness/Prompt 版本。
3. **恢复前体检**：新会话先读取目标、进度和变更，再运行基本 smoke test；环境已坏时先修复，不叠加新改动。
4. **验证闭环**：执行 → 读取真实结果 → 对照验收条件 → 修复 → 重跑，直到通过或触发停止/升级条件。
5. **独立验证**：重要结论可由独立 verifier、确定性测试或外部权威来源检查，避免让生成者只凭自评给自己通过。

Compaction 只保留“关于工作的信息”，Checkpoint 还要保留**可恢复执行状态和外部副作用边界**，两者不能混为一谈。

---

### 6. 安全与 Guardrails

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

OpenAI Agents SDK 提供 Agent 级 input/output guardrails，也提供自定义 function tool 的 tool guardrails。下面先展示输入/输出两端的简化示例：

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

**边界**：OpenAI Agents SDK 的 input guardrail 默认可与 Agent 并行运行，触发前 Agent 可能已经消耗 token 甚至执行工具；需要阻止副作用时使用 blocking 模式。Agent 级 input guardrail 只覆盖链首，output guardrail 只覆盖最终 Agent；每次自定义 function tool 调用应使用 tool guardrail。Hosted tools、Computer/Shell/ApplyPatch 以及 Handoff 不都经过同一 tool-guardrail 管线，因此仍需权限、审批、沙箱和执行前校验。

---

### 7. 可观测性与 Tracing

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
| **Claude Agent SDK** | `query()` / `ClaudeSDKClient` | preset/custom system prompt + Skills/配置源 | 内置 Subagents / Agent tool | 内置工具 + MCP | 权限模式、Hooks、沙箱、文件检查点 | 消息流 + Hooks |
| **Anthropic Client SDK** | 自建循环或 Tool Runner | `system` 参数 | 应用层实现 | client/server tools | 应用层权限与校验 | 自建 |
| **LangGraph** | `StateGraph` | `SystemMessage` | Graph 条件边 | `ToolNode` | 条件边 + 中断点 | LangSmith |
| **Claude Code** | 内置引擎 | 分层 System Prompt | Skill 文件 + 意图匹配 | 内置工具 + MCP | 权限模式 + Hooks | 内置 |

### OpenAI Agents SDK：Runner 即 Harness

```python
from agents import Agent, Runner

# Agent 定义包含 instructions、tools、handoffs、guardrails 等运行时配置，
# 不是 Agent Skills 开放标准的 SKILL.md。
# Runner 负责执行循环、handoff、guardrail、session 等 Harness 职责。
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
#   6. 按各 guardrail 的适用边界执行检查，并记录 tracing
```

### Anthropic Client SDK 与 Claude Agent SDK

```python
import anthropic

client = anthropic.Anthropic()

# Client SDK 路线：需要自行实现 Harness 的关键组件
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

**关键区别**：OpenAI Agents SDK 的 `Runner` 提供 Agent Loop、Handoff、Sessions、HITL 与 Tracing；Claude Agent SDK 则提供 Claude Code 同源的 Loop、内置工具、权限、Hooks、Skills、MCP、Subagents 与 context management。只有直接使用 Anthropic Client SDK 时，才通常需要自己构建完整 while 循环。三者抽象层级不同，不应把“Anthropic SDK”笼统写成只能自建 Harness。

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

Harness 的**输出层（L5）**已从“在 Prompt 里请求 JSON”扩展到 API 原生 Structured Outputs、strict tool use 和开源约束解码。不同模型与 Schema 子集的保证不同，生产实现必须查目标 API 的当前支持范围并处理拒绝、截断和校验失败。

#### 三档约束强度

| 档位 | 实现方式 | 能保证什么 | 不能保证什么 |
|------|---------|-----------|-------------|
| **弱约束** | Prompt 里要求 JSON | 仅提供行为提示 | JSON 合法性与 Schema 均不保证 |
| **中约束** | API 层 JSON Mode | 语法上是合法 JSON | 字段、类型和业务语义不一定正确 |
| **强约束** | Structured Outputs / Constrained Decoding / strict tools | 在受支持 Schema 范围内约束生成结构 | 拒绝、截断、服务错误和字段内容正确性仍需处理 |

#### 主流方案对比

| 方案 | 提供者 | 原理 | 适用 |
|------|-------|------|------|
| **OpenAI Structured Outputs** | OpenAI | 服务端把 schema 编译为有限状态机，token 采样时强制约束 | OpenAI API |
| **Anthropic strict tool use** | Anthropic | 在自定义工具上设置 `strict: true`，结合 JSON Schema 约束工具输入 | Claude API；仍需校验业务语义与工具输出 |
| **Outlines / lm-format-enforcer** | 开源 | 客户端拦截 logits，按正则/grammar 屏蔽非法 token | 自建推理 + vLLM |
| **SGLang Constrained Decoding** | SGLang | grammar 约束解码 | 自建推理 |
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

强约束可以缩小**当前输出通道**的表达空间，但不是 Prompt Injection 防线：如果 Harness 仍向模型暴露 `delete_user` 等高权限工具，结构化最终输出并不会阻止中间工具调用。真正的边界是工具最小化、参数校验、审批、沙箱和不可信内容隔离。

详见 [评估、对齐与安全 — Prompt Injection 防御](./evaluation-and-alignment#prompt-injection-攻防深度)。

#### 何时**不**使用强约束

| 场景 | 原因 |
|------|------|
| **开放式生成**（写文章、长解释） | 强约束会损失生成质量 |
| **首 Token 延迟敏感**（实时聊天）| 某些实现需要编译/缓存 Schema，应按目标服务实测 |
| **思维链推理** | 推理过程是自由文本，最后才结构化输出（混合模式：先 CoT 后 JSON）|
| **多模型路由** | 不是所有模型都支持，统一兼容层成本高 |

---

## 常见陷阱

::: warning ⚠️ Harness 设计中的常见误区

1. **System Prompt 无限膨胀**：不断往 System Prompt 里加规则，最终超过 Token 预算或降低 LLM 遵循度。解决：分层管理 + 预算控制 + 按需加载。

2. **Skill 切换时状态残留**：切换 Skill 后，上一个 Skill 的工具权限或输出格式约束还在生效。解决：切换时完整替换 L2-L5，而非增量修改。

3. **没有执行循环的终止保护**：Agent 陷入无限循环（重复调用同一工具、在两个工具间反复切换）。解决：设置 max_steps + max_tokens + 重复检测。

4. **上下文管理缺失**：工具返回了超长结果（如读取整个文件），把上下文窗口撑满。解决：按需检索 + 高信号结果 + Tool Search + Compaction；截断时必须标明遗漏范围。

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

核心职责至少有七个：
1. **System Prompt 组装**：将基础身份、Skill 指令、动态上下文、工具说明、输出格式分层管理，按需组合
2. **Skill 加载与切换**：根据用户意图路由到正确的 Skill，切换时完整更新 Prompt 和工具权限
3. **执行循环**：管理 LLM 调用 → 工具执行 → 结果回注的循环，包括终止条件检查
4. **安全控制**：输入过滤、工具权限检查、输出审查的三层防线
5. **可观测性**：全链路 Tracing，记录路由、组装、调用、工具执行的每个环节
6. **恢复与检查点**：保存 Run State、外部副作用和版本，支持中断后安全续跑
7. **验证与调度**：运行测试/validator，按需调度 Subagents，并以环境证据决定是否完成

类比：LLM 是 CPU，Skill 是操作手册，Harness 是操作系统与调度器。OpenAI Agents SDK 的 `Runner` 和 Claude Agent SDK 都提供不同风格的现成 Harness；直接使用模型 Client SDK 时才需要自行组装更多组件。

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
- **预算控制**：按模型和任务动态分配；关键安全约束不能因超预算被静默裁剪

**面试加分点**：指出分层是维护手段，不是模型端的 CSS 级联规则。出现冲突时应在组装期检测并消除，而不是假设“后层一定覆盖前层”。

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

实现方式上，OpenAI Agents SDK 提供 Agent 级与 function-tool 级 Guardrails；Claude Agent SDK 提供权限模式、allow/deny rules、`can_use_tool`、Hooks、Sandbox 和文件检查点。直接使用 Anthropic Client SDK 时，需要在应用层实现对应权限与审批。

---

### Q4：如何管理 Agent 的上下文窗口预算？

**要点**：

上下文窗口是有限资源，需要系统化分配和管理。推荐的预算分配：

| 类别 | 占比 | 说明 |
|------|------|------|
| System Prompt / Skills | 保留身份、边界和当前任务方法 | 不固定百分比 |
| 对话与任务状态 | 保留目标、决策、未完成项、近期交互 | 长历史应压缩或外置 |
| 工具定义与结果 | 常用工具常驻，其余按需发现；只回传高信号字段 | 截图、代码、日志尤其昂贵 |
| 输出预留 | 按产物上限预估 | 防止代码或 JSON 被截断 |

管理策略：
1. **指令去重**：压缩重复解释，但保护安全约束、目标和输出契约
2. **对话历史压缩**：保留近期交互，把早期历史压成包含决策、未完成项和证据的结构化摘要
3. **工具按需发现**：用 Tool Search/deferred loading 避免一次暴露全部 Schema
4. **工具结果整形**：限制查询范围、分页、字段投影；截断时标明遗漏范围并保留可重新读取的引用
5. **状态外置与 Subagents**：把进度/Artifact 持久化，将独立高输出任务放进单独上下文

**面试加分点**：预算分配不是固定的。代码审查可能需要更多工具结果空间，问答可能需要更多对话历史；应根据模型窗口、任务验收条件和生产 trace 动态调优，而不是背统一百分比。

---

## 延伸阅读

- [AI Agent 智能体](./ai-agents) — Agent 核心架构与组件详解
- [Agent Skills 编写指南](./ai-agent-skills) — Skill 的定义与编写实战
- [Prompt Engineering 提示工程](./prompt-engineering) — Prompt 设计的基础原则
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) — Runner（Harness）+ Guardrails 的参考实现
- [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview) — Claude Code 同源 Agent Loop、工具、权限、Skills、MCP 与 Subagents
- [Anthropic Tool Use Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) — Client/Server Tools 与自建循环基础
- [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Tool Search、Compaction、外部记忆和 Subagents
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — 进度文件、增量工作和端到端验证
- [LangGraph Documentation](https://docs.langchain.com/oss/python/langgraph/overview) — StateGraph、持久化、durable execution 与 HITL
