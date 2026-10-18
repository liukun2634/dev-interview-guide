---
title: Computer Use 与多 Agent 编排
---

# Computer Use 与多 Agent 编排

<span class="dig-tag dig-tag--category">AI Agent</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**Computer Use** 让模型通过截图理解界面，并让宿主 Harness 执行鼠标、键盘或浏览器动作；Anthropic 于 2024 年较早公开了通用桌面方案，但这不是单一厂商专属概念。**多 Agent 编排**用于需要上下文隔离、专业分工或并行探索的任务，不是“单 Agent 必然走不远”的默认答案。
:::

## Part 1：Computer Use（计算机操控 Agent）

### 概念

**Computer Use** = 模型观察屏幕截图并生成鼠标/键盘动作，由宿主在桌面或浏览器环境中执行。它能覆盖许多没有 API 的 GUI，但不保证适配任意应用。

```
传统 Agent:    LLM ──API── 工具（Tool Function）
Computer Use: LLM ──截图── 屏幕 ──动作── 鼠标/键盘
```

**与 RPA / API Agent 的本质区别**：

| 维度 | API Agent | RPA | Computer Use |
|------|----------|-----|---------------|
| **接口** | API JSON | 录制/规则/选择器 | 截图坐标 + OS/浏览器事件；也可混合 DOM/可访问性树 |
| **适用应用** | 有 API 的服务 | 重复固定流程 | 无需专用 API 的广泛 GUI 场景；仍需处理布局、遮挡和视觉歧义 |
| **变化容忍** | 契约变更需适配 | 依赖规则与选择器 | 可能跨应用泛化，但仍会受布局、遮挡和视觉歧义影响 |
| **典型代表** | OpenAI Tools / Claude Tools | UiPath / 影刀 | Claude Computer Use / OpenAI Responses API `computer` |

### Anthropic Computer Use 实现细节

Anthropic Computer Use 提供 **Beta** 接口。本文示例使用 beta header `computer-use-2025-11-24` 和工具类型 `computer_20251124`，支持 Claude Opus 5、Sonnet 5、Opus 4.8/4.7/4.6、Sonnet 4.6、Opus 4.5；较旧模型使用 `computer-use-2025-01-24` / `computer_20250124`。模型名、beta header 和工具 schema 是三个独立版本点，升级时必须一起核对。

```
┌─────────────────────────────────────────────────────┐
│  循环: while not done:                                │
│    ① 截屏 + OS 信息（鼠标坐标 / 窗口列表）            │
│    ② Claude 视觉理解 + 决策                          │
│    ③ 输出动作（JSON）                                │
│       {action: "screenshot|left_click|type|key|...",│
│        coordinate: [x, y], text: "...", duration:..}│
│    ④ 在虚拟机执行动作                                 │
│    ⑤ 等待 UI 稳定或目标状态出现                      │
│    ⑥ goto ①                                          │
└─────────────────────────────────────────────────────┘
```

Anthropic quickstart 常把以下三个**客户端工具**组合使用，但只有 `computer` 是 Computer Use 必需工具，另外两个是可选增强：

| 工具 | 输入 | 用途 |
|------|------|------|
| **`computer_20251124`** | screenshot / left_click / type / key / mouse_move / scroll / drag / zoom 等 | 屏幕通用操作；`zoom` 需显式开启 |
| **`bash`** | command | Shell 命令（兜底）|
| **`text_editor_20250728`** | view / create / str_replace / insert | 文件编辑；当前版本不含 `undo_edit` |

<small>注：本节接口与工具支持快照为 2026-08-09；接入前核对官方兼容列表。</small>

### 关键设计抉择（必背）

#### 1. 坐标系统：像素 vs 网格

```python
# 视觉 Computer Use 常输出截图坐标；DOM/可访问性树路线也可输出元素引用
{"action": "left_click", "coordinate": [856, 423]}
```

**关键训练**：Computer Use 模型必须经过 **grounding** 训练——给截图 + "点击登录按钮"，输出准确像素。普通 VLM 不擅长这件事。

#### 2. 动作粒度：原子 vs 复合

```
原子动作: 截屏 → 决策 → 单次点击 → 截屏 → 决策 → ...
  ✅ 容错好，每步可观察
    ❌ 模型往返多，延迟较高

复合动作: 截屏 → 决策 → "点登录 → 输入用户名 → 输入密码 → 点提交"
  ✅ 快
  ❌ 中间任一步出错就崩
```

**生产实践**：高风险和状态不稳定的步骤保持细粒度并逐步验证；低风险、可回滚且状态明确时可批量执行。OpenAI 当前 `computer` tool 会在一次 `computer_call.actions[]` 中返回一组有序动作，因此“永远只做一个原子动作”也不是通用规则。

#### 3. 失败恢复

**Computer Use 最难的不是会做，是知道何时错了**。

```python
# 常见失败模式：
# - 点错位置（坐标 grounding 错）
# - 弹窗遮挡（没看到模态框）
# - 等待时间不够（异步加载未完）
# - 死循环（一直点不到目标）

# 设计模式：
class ComputerAgent:
    def step(self):
        before = screenshot()
        action = self.decide(before)
        execute(action)
        after = screenshot()

        # ★ 关键：先用确定性信号，必要时再让模型判断状态变化
        if self.detect_stuck(before, after, step_count):
            return self.recover()  # 回退 / 求助人 / 换策略

        if step_count > MAX_STEPS:  # 硬上限
            raise StuckError()
```

#### 4. 沙箱与权限

**不要默认给 Computer Use Agent 控制真实宿主机**。官方参考实现使用容器化桌面；生产环境还应限制凭据、文件挂载、网络和可执行动作：

```yaml
# Anthropic 官方 reference docker-compose
services:
  agent:
    # 参考实现位于 anthropics/anthropic-quickstarts/computer-use-demo
    # ★ 跑在容器/虚拟机内
    # ★ 通过 VNC 暴露屏幕
    # ★ 仅访问明确指定的目录
    volumes:
      - ./data:/data:ro    # 只读
```

**生产安全边界**：
- ① 隔离浏览器、容器或 VM，使用最小权限账户，不继承宿主环境变量/凭据
- ② 文件、域名、下载、网络出口和可执行动作默认拒绝，按任务最小化放行
- ③ 页面、PDF、邮件、聊天、截图和工具输出一律视为不可信内容，不能提供授权
- ④ 删除、发送、购买、改权限、输入敏感数据等动作在**风险发生前**确认；验证码、改密码最终步骤等场景交还用户
- ⑤ 记录动作、确认、截图引用和状态变化，准备超时、停止、回滚与事故审计

### Computer Use 应用全景

| 场景 | 例子 | 成熟度 |
|------|------|------|
| **数据录入** | 把表格数据填进老系统 | 可落地，但需按具体流程评测 |
| **流程自动化** | 跨多个 SaaS 系统抓取报告 | 有条件可用 |
| **网页操作** | 填表单 / 比价 / 信息收集 | 有条件可用；交易需确认 |
| **桌面助手** | "帮我整理桌面 / 改 PPT 配色" | 早期 |
| **QA 测试** | UI 回归自动化（取代 Selenium）| 兴起 |
| **辅助残障人士** | 视障辅助交互 | 探索 |

::: warning ⚠️ Computer Use 的 5 大局限

> ① **延迟较高**：每轮需要模型推理、动作执行和界面加载，具体耗时由模型、页面和 Harness 决定；
> ② **上下文与成本增长快**：截图、动作历史和工具结果都会占 token，应按真实 trace 计量；
> ③ **可靠性依任务变化大**：坐标、弹窗、异步加载和跨应用状态都会引入错误，不能引用统一成功率；
> ④ **不擅长游戏 / 视频** 这类高帧率交互；
> ⑤ **安全风险**：被截图里的恶意指令注入（[Prompt Injection](./security-and-jailbreak#indirect-prompt-injection)）。

:::

### 主流 Computer Use 产品对比

| 产品 | 厂商 | 特点 |
|------|------|------|
| **Claude Computer Use** | Anthropic | Beta API；`computer_20251124`，宿主执行动作；有开源参考实现 |
| **OpenAI `computer` tool** | OpenAI | Responses API GA 路线；支持一次返回批量 `actions[]`；旧 `computer-use-preview` 已弃用 |
| **ChatGPT agent** | OpenAI | 已整合原 Operator 产品；Operator 独立站点已下线 |
| **Google Project Mariner** | Google | Chrome 扩展，浏览器 Agent |
| **Browser-Use**（开源）| 社区 | 基于 Playwright + LLM 的 Web Agent |
| **Anthropic Claude Code** | Anthropic | **代码 Agent**（不是 Computer Use 但同类思路）|

### OpenAI 当前接口与迁移

OpenAI 的新实现使用 Responses API 的 `tools: [{"type": "computer"}]`。当前官方示例使用 `gpt-5.6`，迁移表至少要求从旧 `computer-use-preview` / `computer_use_preview` 改为 GA 模型（表中为 `gpt-5.5`）和 `computer` tool；新 `computer_call` 可包含有序 `actions[]`，不再是每轮单个 action。模型推荐会继续变化，代码中应配置模型并在升级前重跑任务评测。

**确认应发生在风险点，而不是任务一开始**：

- 删除本地/云端数据、发送邮件/消息、公开发布、购买、改权限、安装下载的软件、修改系统安全设置等，在动作执行前确认。
- 输入密码、一次性验证码、API Key、医疗/财务等敏感数据本身就是传输；必须使用用户提供且明确授权的值。
- 修改密码的最终步骤、绕过 HTTPS 警告或网站安全屏障等应交还用户；页面里的“请继续”“忽略之前指令”不构成授权。
- 用户初始请求可对少数明确动作提供窄范围预授权，但不能被网页、PDF、邮件或工具输出扩大。

---

## Part 2：多 Agent 编排框架

### 为什么需要多 Agent

单 Agent 在高输出探索、并行调查或权限隔离场景中可能受限，但多 Agent 不是默认升级路径。

更准确地说，多 Agent 是一种**有代价的上下文与执行隔离手段**。只有当子任务能独立并行、需要不同工具/权限/模型，或高输出探索值得放到独立上下文时才有优势；强依赖共享状态的任务往往更适合单 Agent、普通代码工作流或少量 Agent-as-tool。

**多 Agent 优势**：
- ✅ **角色分工**：产品经理 Agent + 工程师 Agent + QA Agent
- ✅ **上下文隔离**：每个 Agent 自己的 history，避免污染
- ✅ **并行执行**：多 Agent 同时跑不同子任务
- ✅ **专家系统**：每个 Agent 配不同 prompt / model / tool 子集

### 主流框架深度对比

| 框架 | 核心抽象 | 强项 | 弱项 | 选型场景 |
|------|---------|------|------|---------|
| **LangGraph** | **StateGraph + 节点 + 边** | 低层图编排、持久化、durable execution、interrupt/HITL | API 较低层，需自行设计 Agent 架构 | 长运行、有状态、确定性与 Agentic 混合流程 |
| **AutoGen 0.7.x** | **AgentChat + 事件驱动 Core + Extensions** | 对话式单/多 Agent、分布式 runtime、代码执行扩展 | 抽象层较多，需区分 AgentChat 与 Core | 研究、原型、事件驱动多 Agent 系统 |
| **CrewAI** | **Flow + Crew + Agent + Task** | Flow 控制状态/流程，Crew 做角色协作 | 角色协作也会增加协调开销 | 业务 Flow 中嵌入自治协作 |
| **OpenAI Agents SDK** | **Agent + Runner + Agent-as-tool / Handoff + Guardrails** | Sessions、HITL、Tracing、MCP、Sandbox Agents | Responses API 路径最完整，其他模型能力取决于 provider | 轻量 Python Agent runtime |
| **Pydantic AI** | **Agent + 类型化依赖/输出 + Graph** | 强类型、模型可替换、Python 友好 | 编排与生态选择需自行评估 | 强类型 Python 应用 |
| **Magentic-One**（微软研究）| **Orchestrator + Specialized Agents** | 设计严谨、benchmark 强 | 研究项目，生产慎用 | 学习参考 |
| **MetaGPT** | **SOP 软件工程公司** | 模拟"产品-设计-开发-测试" | 学院风格 | 教育、Demo |
| **Swarm**（OpenAI 实验）| **轻量级 Agent 切换** | 极简（< 500 行） | 已被 Agents SDK 取代 | 历史参考 |

### LangGraph 核心模式

LangGraph 是流行的低层编排 runtime 之一，擅长长运行、有状态、需要 durable execution 与人工中断的工作流；它不是唯一标准，也不应仅凭流行度默认选用。简单流程可直接用代码或 SDK Runner，团队型协作也可评估 AutoGen、CrewAI、OpenAI Agents SDK 或自建 Harness。

#### 1. 基础结构：StateGraph

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
from operator import add

class State(TypedDict):
    messages: Annotated[list, add]    # ★ Reducer 函数：列表自动累加
    next_agent: str

# 定义节点（每个节点是一个 Agent / Function）
def researcher_node(state: State):
    answer = llm.invoke(f"研究: {state['messages']}")
    return {"messages": [answer], "next_agent": "writer"}

def writer_node(state: State):
    text = llm.invoke(f"基于研究写作: {state['messages']}")
    return {"messages": [text], "next_agent": "reviewer"}

def reviewer_node(state: State):
    review = llm.invoke(f"评审: {state['messages']}")
    return {"messages": [review], "next_agent": END}

# 构图
graph = StateGraph(State)
graph.add_node("researcher", researcher_node)
graph.add_node("writer", writer_node)
graph.add_node("reviewer", reviewer_node)

graph.set_entry_point("researcher")
graph.add_conditional_edges(
    "researcher",
    lambda s: s["next_agent"],
    {"writer": "writer", END: END}
)
# ... 其他边

app = graph.compile()
result = app.invoke({"messages": ["写一篇 RAG 综述"]})
```

#### 2. 4 大经典模式

##### 模式 A：Supervisor（监督者模式）

```
                ┌─────────────────┐
                │   Supervisor     │  ← LLM 决定路由到谁
                │   (路由决策)      │
                └────────┬─────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │ Agent A  │    │ Agent B  │    │ Agent C  │
   │ (Code)   │    │ (Search) │    │ (Math)   │
   └────┬────┘    └────┬────┘    └────┬────┘
        │              │              │
        └──────────────┴──────────────┘
                 ▼ 结果汇总
              Supervisor
```

**适合**：任务可分类，每类有专门 Agent 处理。

##### 模式 B：Hierarchical（层级）

```
            CEO Supervisor
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
  Tech Lead   PM Lead    QA Lead
       │
   ┌───┴───┐
   ▼       ▼
 Coder  Coder
```

**适合**：超大型任务，单层 Supervisor 不够。

##### 模式 C：Reflection（自我反思）

```
   Generator ─→ Reflector ─→ 满足? ──Yes──→ END
       ▲                       │
       └──────── No ────────────┘
```

**适合**：写作 / 代码 / 复杂推理——多轮迭代提升质量。

##### 模式 D：Plan-and-Execute

```
   Planner（分解任务）─→ [Task1, Task2, Task3]
                                │
                                ▼
                      Executor（逐个执行）
                                │
                                ▼
                      Replanner（动态调整）
```

**适合**：长任务，先规划再执行（AutoGPT 风格）。

#### 3. LangGraph 重要能力：Checkpoint（持久化与续跑）

```python
from langgraph.checkpoint.sqlite import SqliteSaver

memory = SqliteSaver.from_conn_string("checkpoints.db")
app = graph.compile(checkpointer=memory)

# 运行时指定 thread_id（会话 ID）
config = {"configurable": {"thread_id": "user-123"}}
result = app.invoke({"messages": [...]}, config=config)

# 持久化状态可支持失败恢复、状态历史与人工中断后继续
```

**生产价值**：
- Agent 跑到一半 OOM / 网络断 → **从断点恢复**
- 调试时回到关键节点，改变状态重跑（**time travel**）
- Human-in-the-loop：在某节点暂停等待人工 → 继续

### AutoGen 当前架构

AutoGen 当前稳定文档为 0.7.x，分为高层 **AgentChat**、事件驱动 **Core**、集成实现 **Extensions** 与原型 UI **Studio**。不要继续把“0.4 重写”当成当前版本名称。

```python
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import MaxMessageTermination

# 异步 Agent
async def main():
    agent1 = AssistantAgent("researcher", model_client=oai_client)
    agent2 = AssistantAgent("writer", model_client=anthropic_client)

    team = RoundRobinGroupChat(
        [agent1, agent2],
        termination_condition=MaxMessageTermination(10)
    )

    async for msg in team.run_stream(task="写一份 LLM 安全报告"):
        print(msg)
```

**当前架构特性**：
- 全异步（asyncio）
- 多模型解耦（每个 Agent 配不同 LLM）
- 内置流式
- AutoGen Studio：低代码 UI

### 多 Agent 选型决策表

| 你需要 | 推荐 |
|--------|------|
| **图状态、持久化与人工中断** | **LangGraph** |
| **Flow + 角色型协作** | **CrewAI** |
| **强类型 Python 后端** | **Pydantic AI** |
| **已在 OpenAI 生态** | **OpenAI Agents SDK** |
| **对话式 Code Agent / Code Execution** | **AutoGen AgentChat + Extensions** |
| **多模型解耦** | **AutoGen**、**LangGraph** 或模型可替换的 SDK |
| **跨组织的远程 Agent 协作** | **A2A 1.0 + 适合的内部 runtime** |

---

## Part 3：黄金答题模板（必背）

### 题目 1：Computer Use 怎么实现？

> **答**：核心是**截屏 → 模型返回动作 → 宿主校验并执行 → 再截屏验证**的循环。Anthropic 当前 Computer Use 使用 `computer-use-2025-11-24` / `computer_20251124`，仍为 Beta；OpenAI 新实现使用 Responses API 的 `computer` tool，旧 `computer-use-preview` 已弃用。`bash` 和 `text_editor` 可增强 Claude 流程，但不是 Computer Use 必需工具。
>
> 关键设计：① 视觉路线要处理坐标 grounding，浏览器路线也可混合 DOM/可访问性信息；② 根据风险和状态稳定性选择细粒度或批量动作；③ 每批动作后读取真实界面状态，设置步数/时间上限和回退；④ 使用隔离环境、最小权限、域名/动作白名单、风险点确认和完整审计。
>
> 局限：多轮视觉交互延迟高，截图消耗上下文，坐标和异步 UI 容易出错；最大安全风险之一是**界面内容中的间接 Prompt Injection**。因此页面内容不能视为授权，高风险动作要在执行点确认。

### 题目 2：你怎么编排多 Agent？

> **答**：先判断是否真的需要多 Agent。需要图状态、持久化和 HITL 时可选 LangGraph；偏对话式协作可看 AutoGen；Flow 中嵌入角色团队可看 CrewAI；OpenAI 生态可用 Agents SDK 的 Agent-as-tool 或 Handoff。它们是不同抽象，不存在唯一“事实标准”。
>
> 4 大常用模式：① **Supervisor** —— LLM 决定路由到哪个专家 Agent；② **Hierarchical** —— 多层管理结构，超大任务用；③ **Reflection** —— 生成 + 反思迭代，适合写作 / 代码；④ **Plan-and-Execute** —— 先规划再执行，适合长任务。
>
> LangGraph 的突出能力是 **Checkpoint / persistence**：为失败恢复、状态历史和人工中断后继续提供基础。但“保存状态”不等于“安全恢复”——外部副作用还需幂等键、事务/补偿、版本兼容和恢复前验证。
>
> OpenAI Agents SDK 中，Agent-as-tool 由 manager 保留会话控制；Handoff 则把会话交给目标 Agent。跨服务器、跨厂商委派再考虑 A2A 1.0，不要把框架内 Handoff 与 A2A 混为一谈。

---

## 看到什么就先想到这类

- **"让 Agent 操作老旧 GUI"** → Computer Use
- **"操作没有 API 的受信任 SaaS"** → Computer Use，并检查服务条款与授权
- **"复杂工作流要可控"** → LangGraph + StateGraph
- **"Agent crash 怎么续跑"** → LangGraph Checkpoint
- **"多 Agent 自然对话"** → AutoGen AgentChat / GroupChat
- **"快速搭多 Agent 系统"** → CrewAI Crew/Task
- **"如何防 Agent 注入"** → [LLM 安全](./security-and-jailbreak)
