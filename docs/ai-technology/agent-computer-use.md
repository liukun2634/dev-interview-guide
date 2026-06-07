---
title: Computer Use 与多 Agent 编排
---

# Computer Use 与多 Agent 编排

<span class="dig-tag dig-tag--category">AI Agent</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**Computer Use** 是 Anthropic 2024 年提出的 Agent 新范式——让 LLM **直接操作屏幕**（看截图 + 移动鼠标 + 键盘）。**多 Agent 编排**（LangGraph / AutoGen / CrewAI）则解决了"单 Agent 走不远"的问题。这两个方向是 2025-2026 高级岗位**必考**。
:::

## Part 1：Computer Use（计算机操控 Agent）

### 概念

**Computer Use** = LLM 直接观察屏幕截图、生成鼠标/键盘动作，**像人一样操作任意 GUI 应用**。

```
传统 Agent:    LLM ──API── 工具（Tool Function）
Computer Use: LLM ──截图── 屏幕 ──动作── 鼠标/键盘
```

**与 RPA / API Agent 的本质区别**：

| 维度 | API Agent | RPA | Computer Use |
|------|----------|-----|---------------|
| **接口** | API JSON | 录屏规则脚本 | 像素 + OS 事件 |
| **适用应用** | 有 API 的服务 | 重复固定流程 | **任意 GUI 应用** |
| **变化容忍** | API 变就坏 | UI 一改就坏 | **泛化好，UI 改了仍能工作** |
| **典型代表** | OpenAI Tools / Claude Tools | UiPath / 影刀 | **Claude Computer Use** / OpenAI Operator |

### Anthropic Computer Use 实现细节

**Claude 3.5/4 Sonnet 是首个生产可用的 Computer Use 模型**（2024.10 发布）。原理：

```
┌─────────────────────────────────────────────────────┐
│  循环: while not done:                                │
│    ① 截屏 + OS 信息（鼠标坐标 / 窗口列表）            │
│    ② Claude 视觉理解 + 决策                          │
│    ③ 输出动作（JSON）                                │
│       {action: "screenshot|left_click|type|key|...",│
│        coordinate: [x, y], text: "...", duration:..}│
│    ④ 在虚拟机执行动作                                 │
│    ⑤ 等待 UI 响应（默认 sleep 2s）                   │
│    ⑥ goto ①                                          │
└─────────────────────────────────────────────────────┘
```

**3 个核心工具**（Anthropic 官方）：

| 工具 | 输入 | 用途 |
|------|------|------|
| **`computer`** | screenshot / left_click(x,y) / type(text) / key(combo) / cursor_position | 屏幕通用操作 |
| **`bash`** | command | Shell 命令（兜底）|
| **`text_editor`** | view / create / str_replace / insert / undo_edit | 文件编辑 |

### 关键设计抉择（必背）

#### 1. 坐标系统：像素 vs 网格

```python
# ❌ 早期 Operator 方案：让模型说"点击右上角"
# 模型不擅长精确空间定位

# ✅ Anthropic 方案：模型输出 [x, y] 像素坐标
# 训练时用专门的 grounding 数据
{"action": "left_click", "coordinate": [856, 423]}
```

**关键训练**：Computer Use 模型必须经过 **grounding** 训练——给截图 + "点击登录按钮"，输出准确像素。普通 VLM 不擅长这件事。

#### 2. 动作粒度：原子 vs 复合

```
原子动作: 截屏 → 决策 → 单次点击 → 截屏 → 决策 → ...
  ✅ 容错好，每步可观察
  ❌ 慢（一次操作 5-10 秒）

复合动作: 截屏 → 决策 → "点登录 → 输入用户名 → 输入密码 → 点提交"
  ✅ 快
  ❌ 中间任一步出错就崩
```

**生产实践**：**原子为主，预定义复合宏（如填表单）**。

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

        # ★ 关键：用 LLM 判断状态是否改变
        if self.detect_stuck(before, after, step_count):
            return self.recover()  # 回退 / 求助人 / 换策略

        if step_count > MAX_STEPS:  # 硬上限
            raise StuckError()
```

#### 4. 沙箱与权限

**绝对不要直接给 Computer Use Agent 控制宿主机**：

```yaml
# Anthropic 官方 reference docker-compose
services:
  agent:
    image: anthropic/computer-use-demo
    # ★ 跑在容器/虚拟机内
    # ★ 通过 VNC 暴露屏幕
    # ★ 仅访问明确指定的目录
    volumes:
      - ./data:/data:ro    # 只读
```

**生产部署 3 层隔离**：
- ① 应用沙箱：Firecracker / gVisor 微 VM
- ② 网络隔离：默认无网络，按需开白名单
- ③ 操作审计：所有 action JSON 持久化

### Computer Use 应用全景

| 场景 | 例子 | 成熟度 |
|------|------|------|
| **数据录入** | 把 Excel 数据填进老系统 | 已生产 |
| **流程自动化** | 跨多个 SaaS 系统抓取报告 | 已生产 |
| **网页操作** | 订机票 / 填表单 / 比价 | 已生产 |
| **桌面助手** | "帮我整理桌面 / 改 PPT 配色" | 早期 |
| **QA 测试** | UI 回归自动化（取代 Selenium）| 兴起 |
| **辅助残障人士** | 视障辅助交互 | 探索 |

::: warning ⚠️ Computer Use 的 5 大局限

> ① **速度慢**：单步 5-10 秒，做完一个表单 1-2 分钟；
> ② **成本高**：每次截图 image token 烧钱，长任务 $1-10/次；
> ③ **可靠性 80-90%**：远低于 API 调用的 99.9%；
> ④ **不擅长游戏 / 视频** 这类高帧率交互；
> ⑤ **安全风险**：被截图里的恶意指令注入（[Prompt Injection](./security-and-jailbreak#类型-2间接注入indirect-injection-更危险)）。

:::

### 主流 Computer Use 产品对比

| 产品 | 厂商 | 特点 |
|------|------|------|
| **Claude Computer Use** | Anthropic | **首个生产可用**，开源 demo，企业 API |
| **OpenAI Operator** | OpenAI | 浏览器内 Agent，专注 Web 操作 |
| **Google Project Mariner** | Google | Chrome 扩展，浏览器 Agent |
| **Apple Intelligence Screen Awareness** | Apple | 端侧屏幕理解（隐私优先）|
| **Browser-Use**（开源）| 社区 | 基于 Playwright + LLM 的 Web Agent |
| **Anthropic Claude Code** | Anthropic | **代码 Agent**（不是 Computer Use 但同类思路）|

---

## Part 2：多 Agent 编排框架

### 为什么需要多 Agent

**单 Agent 走不远**——上下文太长会"记忆错乱"，单一角色难以胜任复杂任务。

**多 Agent 优势**：
- ✅ **角色分工**：产品经理 Agent + 工程师 Agent + QA Agent
- ✅ **上下文隔离**：每个 Agent 自己的 history，避免污染
- ✅ **并行执行**：多 Agent 同时跑不同子任务
- ✅ **专家系统**：每个 Agent 配不同 prompt / model / tool 子集

### 主流框架深度对比

| 框架 | 核心抽象 | 强项 | 弱项 | 选型场景 |
|------|---------|------|------|---------|
| **LangGraph** | **图（StateGraph）+ 节点 + 边** | **状态机最严谨、可控、可调试**、原生检查点支持 | API 略复杂、学习曲线 | **生产首选**：复杂工作流、可控状态 |
| **AutoGen**（微软 → 0.4 重写）| **多 Agent 对话**（GroupChat / ChatManager）| 自然的对话隐喻、Code Execution 强 | 早期版本不稳定，0.4 异步重写后好转 | 多 Agent 协作、Code Agent |
| **CrewAI** | **Crew + Agent + Task + Process（顺序/层级）** | **API 最简、role-based** | 灵活性差、调试难 | 快速 PoC、固定角色业务流 |
| **OpenAI Agents SDK**（2025.3）| **Agent + Handoff + Guardrail + Tracing** | 官方背书、Trace UI 友好 | 锁定 OpenAI 生态 | 已用 OpenAI 用户 |
| **Pydantic Agents**（2024）| **Pydantic 类型 + Agent + Dependency Injection** | **强类型校验**、Python 友好 | 较新、社区小 | Python 后端工程师 |
| **Magentic-One**（微软研究）| **Orchestrator + Specialized Agents** | 设计严谨、benchmark 强 | 研究项目，生产慎用 | 学习参考 |
| **MetaGPT** | **SOP 软件工程公司** | 模拟"产品-设计-开发-测试" | 学院风格 | 教育、Demo |
| **Swarm**（OpenAI 实验）| **轻量级 Agent 切换** | 极简（< 500 行） | 已被 Agents SDK 取代 | 历史参考 |

### LangGraph 核心模式（必背）

LangGraph 是 **2025-2026 生产 Agent 编排的事实标准**，必懂。

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

#### 3. LangGraph 杀手特性：Checkpoint（断点续跑）

```python
from langgraph.checkpoint.sqlite import SqliteSaver

memory = SqliteSaver.from_conn_string("checkpoints.db")
app = graph.compile(checkpointer=memory)

# 运行时指定 thread_id（会话 ID）
config = {"configurable": {"thread_id": "user-123"}}
result = app.invoke({"messages": [...]}, config=config)

# ★ 神奇之处：crash 后从最后断点恢复
# ★ 也可以 time travel: 跳回任意历史状态修改并重跑
```

**生产价值**：
- Agent 跑到一半 OOM / 网络断 → **从断点恢复**
- 调试时回到关键节点，改变状态重跑（**time travel**）
- Human-in-the-loop：在某节点暂停等待人工 → 继续

### AutoGen 0.4（异步重写版）

**2024.11 微软发布 AutoGen 0.4，整个重写**。核心：

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

**新特性**：
- 全异步（asyncio）
- 多模型解耦（每个 Agent 配不同 LLM）
- 内置流式
- AutoGen Studio：低代码 UI

### 多 Agent 选型决策表

| 你需要 | 推荐 |
|--------|------|
| **生产可控的复杂工作流** | **LangGraph** |
| **快速 PoC** | **CrewAI** |
| **强类型 Python 后端** | **Pydantic Agents** |
| **已在 OpenAI 生态** | **OpenAI Agents SDK** |
| **Code Agent / Code Execution** | **AutoGen 0.4** |
| **多模型解耦** | **AutoGen 0.4** 或 **LangGraph** |
| **超大规模生产** | **LangGraph + 自定义** |

---

## Part 3：黄金答题模板（必背）

### 题目 1：Computer Use 怎么实现？

> **答**：核心是**截屏 → LLM 视觉决策 → 输出像素坐标动作 → 执行 → 再截屏**的循环。Anthropic Claude Computer Use 是首个生产可用方案，3 个核心工具：`computer`（screenshot/click/type）、`bash`（兜底 shell）、`text_editor`（文件操作）。
>
> 关键设计：① **坐标必须像素而非"右上角"**——需要 grounding 训练；② **原子动作为主 + 预定义复合宏**——平衡速度与容错；③ **失败检测必备**——前后截图对比 + 步数上限 + 卡死回退；④ **三层沙箱**——Firecracker 微 VM + 默认无网络 + 完整审计。
>
> 局限：单步 5-10 秒慢、$1-10/次贵、可靠性 80-90%、最大安全风险是**截图里的恶意指令注入**。

### 题目 2：你怎么编排多 Agent？

> **答**：**LangGraph 是 2025-2026 生产事实标准**。核心抽象是 **StateGraph + 节点 + 条件边**，每个节点是一个 Agent / Function。
>
> 4 大常用模式：① **Supervisor** —— LLM 决定路由到哪个专家 Agent；② **Hierarchical** —— 多层管理结构，超大任务用；③ **Reflection** —— 生成 + 反思迭代，适合写作 / 代码；④ **Plan-and-Execute** —— 先规划再执行，适合长任务。
>
> 杀手特性是 **Checkpoint**：crash 自动从断点恢复、time travel 调试、人工审批暂停继续——这些是其他框架（CrewAI、AutoGen）缺的关键能力。
>
> 选型简单：复杂可控用 LangGraph，快速 PoC 用 CrewAI，Python 强类型用 Pydantic Agents，Code Execution 用 AutoGen 0.4。

---

## 看到什么就先想到这类

- **"让 Agent 操作老旧 GUI"** → Computer Use
- **"绕过没 API 的 SaaS"** → Computer Use
- **"复杂工作流要可控"** → LangGraph + StateGraph
- **"Agent crash 怎么续跑"** → LangGraph Checkpoint
- **"多 Agent 自然对话"** → AutoGen 0.4 GroupChat
- **"快速搭多 Agent 系统"** → CrewAI Crew/Task
- **"如何防 Agent 注入"** → [LLM 安全](./security-and-jailbreak)
