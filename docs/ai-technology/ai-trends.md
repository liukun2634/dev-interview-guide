---
title: AI 前沿趋势与新范式
---

# AI 前沿趋势与新范式

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
AI 工程已从"单模型调用"全面转向"多组件协作系统"。**Compound AI Systems（复合 AI 系统）** 已成为标准架构模式，**Model Routing** 在主流平台已普遍可用，**RAG 持续演进**（GraphRAG / Long Context / Agentic RAG），**Reasoning Models（推理模型）** 开创了"慢思考"新范式，**Agentic AI** 从概念走向生产工具，**A2A 协议** 推动 Agent 间通信标准化，**开源/开放权重模型** 大幅缩小与闭源的差距。理解这些趋势是 2025-2026 年 AI 面试的核心竞争力。
:::

---

## 全局视角：从单模型到复合系统

```
2022-2023: 单模型调用时代
  用户 → Prompt → LLM → 回答

2023-2024: RAG + Tool Use 时代
  用户 → 检索 → Prompt 组装 → LLM → 回答

2025-2026: Compound AI Systems 时代（已成为主流）
  用户 → AI Gateway（路由/缓存/限流）
    → 意图分类器（小模型/SLM）
    → 路由到合适的处理管线
      ├── 简单问题 → 小模型直接回答（Phi-4, Gemma 2）
      ├── 知识问题 → RAG/GraphRAG → 大模型
      ├── 复杂推理 → Reasoning Model（o3, Claude 深度思考）
      ├── 复杂任务 → Agent（多步规划 + 工具调用 + A2A 协作）
      └── 安全检查 → Guardrails → 输出
    → 评估管线（质量监控 + 回归检测）
```

**核心转变**：AI 产品的竞争力不再取决于"用了哪个模型"，而取决于**系统设计**——如何组合多个组件、路由、缓存和评估来构建可靠的产品。

---

## Compound AI Systems（复合 AI 系统）

### 核心理念

来自 BAIR（Berkeley AI Research）2024 年的核心论断，现已被业界广泛验证：**多组件系统在可靠性、成本和质量上一致性地优于单一模型调用**。到 2025 年，复合系统已成为 AI 工程的标准架构模式。

```
单一模型调用:
  Input → LLM → Output
  问题: 可靠性不够、成本高、无法验证

复合 AI 系统:
  Input → Retriever → LLM → Verifier → Output
         ↑                    ↓
       Knowledge DB      如果验证失败 → 重试/降级
  优势: 每个组件可独立优化和替换
```

### 复合系统的典型组件

| 组件 | 职责 | 示例 |
|------|------|------|
| **Router** | 按意图/复杂度分发请求 | 简单问题用小模型，复杂问题用大模型 |
| **Retriever** | 从知识库获取相关上下文 | 向量检索 + BM25 混合 |
| **Generator** | 基于上下文生成回答 | LLM 调用 |
| **Verifier** | 验证输出的正确性 | LLM-as-Judge / 规则检查 |
| **Guardrails** | 安全过滤 | 输入/输出安全分类器 |
| **Cache** | 缓存相似请求的结果 | 语义缓存（Embedding 相似度） |
| **Fallback** | 降级策略 | 大模型失败时回退到小模型或模板 |

### DSPy：自动优化复合管线

DSPy 是斯坦福提出的框架，**用编程方式定义 LLM 管线，然后自动优化 Prompt 和参数**：

```python
import dspy

# 定义 Signature（输入-输出规范）
class AnswerQuestion(dspy.Signature):
    """Answer a question based on retrieved context."""
    context = dspy.InputField(desc="relevant passages")
    question = dspy.InputField()
    answer = dspy.OutputField(desc="concise answer")

# 定义 Module（管线组件）
class RAGModule(dspy.Module):
    def __init__(self, num_passages=3):
        super().__init__()
        self.retrieve = dspy.Retrieve(k=num_passages)
        self.generate = dspy.ChainOfThought(AnswerQuestion)

    def forward(self, question):
        context = self.retrieve(question).passages
        answer = self.generate(context=context,
                               question=question)
        return answer

# 编译优化（自动调 Prompt + Few-shot）
from dspy.teleprompt import BootstrapFewShot

optimizer = BootstrapFewShot(metric=answer_accuracy)
optimized_rag = optimizer.compile(
    RAGModule(),
    trainset=train_examples
)
```

**DSPy 的核心价值**：不再手写 Prompt，而是定义输入输出规范，让框架根据评估指标自动优化。

---

## Model Routing（模型路由）

### 为什么需要路由

| 请求类型 | 最佳模型 | 原因 |
|---------|---------|------|
| "你好" | 小模型 (Haiku) | 简单寒暄，大模型浪费 |
| "解释量子纠缠" | 中等模型 (Sonnet) | 知识问答，中等复杂度 |
| "设计一个分布式锁" | 大模型 (Opus) | 复杂推理，需要深度思考 |

**不路由的代价**：全部用大模型 → 成本高 10~50 倍，延迟高 3~5 倍。全部用小模型 → 复杂问题质量差。

### 路由策略

```
用户请求
  ↓
┌─────────────────────────────────┐
│       Model Router               │
│                                  │
│  策略一: 基于规则                  │
│    Token 数 < 50 → 小模型         │
│    包含"代码"/"设计" → 大模型      │
│                                  │
│  策略二: 基于分类器                │
│    小模型先判断复杂度（1-5 分）     │
│    1-2 → 小模型                  │
│    3-4 → 中等模型                 │
│    5 → 大模型                    │
│                                  │
│  策略三: 级联（Cascade）          │
│    先用小模型回答                  │
│    自动评估置信度                  │
│    置信度低 → 大模型重新回答        │
└─────────────────────────────────┘
```

### 级联路由实现

```python
class CascadeRouter:
    """级联路由：先小后大，按质量需要升级。"""

    def __init__(self, models: list[dict]):
        # models 按成本从低到高排序
        self.models = models  # [haiku, sonnet, opus]

    def route(self, query: str,
              quality_threshold: float = 0.8) -> str:
        for model in self.models:
            response = model["client"].generate(query)
            confidence = self.assess_confidence(
                query, response
            )

            if confidence >= quality_threshold:
                return response

            # 如果是最后一个模型，无论如何都返回
            if model == self.models[-1]:
                return response

        return response

    def assess_confidence(self, query: str,
                          response: str) -> float:
        """用轻量级检查评估回答质量。"""
        checks = [
            self.check_length(response),      # 太短可能不完整
            self.check_hedging(response),      # "我不确定"等表达
            self.check_relevance(query, response),  # 是否切题
        ]
        return sum(checks) / len(checks)
```

### AI Gateway

AI Gateway 是模型路由的工程化实现，类似 API Gateway 但专为 LLM 设计：

| 功能 | 说明 | 产品 |
|------|------|------|
| **路由** | 按规则/成本/质量分发到不同模型 | OpenRouter, Martian, Unify |
| **负载均衡** | 多个模型实例间分发请求 | AWS Bedrock, Azure AI |
| **缓存** | 语义缓存减少重复调用 | GPTCache, Prompt Caching（Anthropic/OpenAI 已原生支持） |
| **限流** | Token/请求级别的限流 | 自研 |
| **可观测性** | 请求日志、延迟、成本追踪 | LangSmith, Helicone |
| **Fallback** | 主模型不可用时自动切换 | LiteLLM |

---

## RAG 的演进：不是过时了，而是在进化

### RAG vs Long Context vs Fine-tuning：何时用什么

这是 2025 年面试最高频的选型题之一：

| 维度 | RAG | Long Context | Fine-tuning |
|------|-----|-------------|-------------|
| **知识更新** | 实时（更新知识库即可） | 实时（放进上下文即可） | 需要重新训练 |
| **知识量** | 无限（向量数据库） | 受限于上下文窗口（1M tokens） | 固化在权重中 |
| **准确性** | 高（可追溯来源） | 中（"大海捞针"效应） | 取决于训练数据质量 |
| **成本** | 中（检索 + 生成） | 高（长上下文 Token 费用） | 高（训练成本）+ 低（推理） |
| **延迟** | 中（检索耗时） | 高（长上下文推理慢） | 低（无检索开销） |
| **幻觉控制** | 好（有来源引用） | 一般（可能忽略关键信息） | 差（无法引用来源） |
| **适用场景** | 知识库问答、客服、搜索 | 长文档分析、会议纪要 | 改变模型行为/风格 |

**面试答法**：RAG 不是过时了，而是从"万能方案"变成了"知识密集型场景的最佳选择"。长上下文窗口（100K~1M tokens）让"把所有内容塞进 Prompt"成为可能，但存在"大海捞针"问题——模型可能忽略中间的关键信息。最佳实践是**混合使用**：RAG 检索最相关的内容，放入合理长度的上下文中。

### GraphRAG

GraphRAG 是 Microsoft 提出的 RAG 演进方案，核心思想是**用知识图谱增强检索**：

```
传统 RAG:
  Query → Embedding → 向量检索（相似度匹配） → Top-K 文档 → LLM

GraphRAG:
  索引阶段:
    文档 → LLM 提取实体和关系 → 构建知识图谱
    知识图谱 → 社区检测算法 → 生成社区摘要

  检索阶段:
    Query → 两种检索模式:
      Local Search: 从相关实体出发，沿图谱边遍历，获取局部子图
      Global Search: 搜索社区摘要，获取全局概览
```

**GraphRAG vs 传统 RAG 对比**：

| 维度 | 传统 RAG | GraphRAG |
|------|---------|----------|
| **检索方式** | 向量相似度 | 图谱遍历 + 社区摘要 |
| **多跳推理** | 弱（只能检索直接相关文档） | 强（沿关系链推理） |
| **全局问题** | 弱（"总结所有..."类问题） | 强（社区摘要提供全局视角） |
| **索引成本** | 低 | 高（需要 LLM 提取实体关系） |
| **适用场景** | 事实性问答 | 分析性问答、多跳推理 |

### Agentic RAG

Agentic RAG 是将 RAG 嵌入 Agent 循环中，让检索成为 Agent 的一个工具而非固定流程：

```
传统 RAG（固定流程）:
  Query → 检索 → 生成 → 结束

Agentic RAG（动态决策）:
  Query → Agent 思考: "我需要什么信息？"
    → 行动 1: 检索知识库 A
    → 思考: "信息不够，还需要查 B"
    → 行动 2: 检索知识库 B
    → 思考: "需要验证数据 C"
    → 行动 3: 调用 API 获取实时数据
    → 思考: "现在信息充分了"
    → 生成最终回答
```

**优势**：Agent 可以动态决定搜索什么、搜索几次、是否需要其他工具补充信息，而不是机械地"检索 → 生成"。

---

## AI 可观测性（Observability）

### 为什么 LLM 应用需要专门的可观测性

传统应用监控关注**延迟、错误率、吞吐量**。LLM 应用还需要关注：

| 维度 | 传统应用 | LLM 应用 |
|------|---------|---------|
| **正确性** | 有明确的对错 | 输出质量是概率性的 |
| **成本** | 资源消耗可预测 | Token 消耗波动大 |
| **调试** | 看日志和堆栈 | 需要看完整的 Prompt 和 Response |
| **回归** | 代码变更触发 | Prompt 变更、模型更新都可能回归 |

### AI 可观测性的核心能力

```
┌─────────────────────────────────────────┐
│          AI 可观测性平台                  │
├─────────────────────────────────────────┤
│  Tracing（追踪）                         │
│  ├── 请求级: 用户输入 → 最终输出          │
│  ├── Span 级: 检索耗时、LLM 耗时、后处理  │
│  └── Token 级: 输入/输出 Token 数、成本    │
├─────────────────────────────────────────┤
│  Evaluation（评估）                      │
│  ├── 在线评估: 实时 LLM-as-Judge 评分    │
│  ├── 离线评估: 批量回归测试              │
│  └── 用户反馈: 点赞/点踩/投诉            │
├─────────────────────────────────────────┤
│  Analytics（分析）                       │
│  ├── 成本分析: 按模型/功能/用户的花费     │
│  ├── 质量分析: 按类别的成功率趋势         │
│  └── 使用分析: 热门问题类型、高频失败模式  │
├─────────────────────────────────────────┤
│  Alerting（告警）                        │
│  ├── 质量下降告警（评估分数低于阈值）      │
│  ├── 成本异常告警（Token 消耗突增）        │
│  └── 安全告警（Guardrails 拦截率异常）     │
└─────────────────────────────────────────┘
```

### 工具生态

| 工具 | 核心能力 | 适用场景 |
|------|---------|---------|
| **LangSmith** | LangChain 原生追踪、评估、数据集管理 | LangChain 生态项目 |
| **Arize Phoenix** | 开源，Trace 可视化、Embedding 漂移检测 | 需要开源方案 |
| **Helicone** | 轻量级 API 代理，成本追踪、缓存 | 快速接入、成本优先 |
| **Weights & Biases Weave** | 实验追踪 + LLM 评估 | ML 团队，已用 W&B |
| **Braintrust** | 评估 + Prompt 管理 + 数据集 | 评估驱动开发 |

---

## 2025-2026 新兴趋势

### Reasoning Models（推理模型）——"慢思考"范式

2024 年底至 2025 年，推理模型成为最重要的新范式。与传统 LLM 的"快速回答"不同，推理模型通过**扩展推理时间（test-time compute）**来提升复杂任务的准确率：

| 模型 | 厂商 | 特点 |
|------|------|------|
| **o1 / o3 / o4-mini** | OpenAI | 开创推理模型品类，o3 在数学/编程上接近人类专家 |
| **Claude（Extended Thinking）** | Anthropic | Claude 支持扩展思考模式，推理与创作兼顾 |
| **Gemini 2.5（Thinking）** | Google | 内置思考模式，原生多模态推理 |
| **DeepSeek-R1** | DeepSeek | 开源推理模型，性能接近 o1，推动开源社区跟进 |

**面试要点**：推理模型不是简单的"更大模型"，而是用更多推理时间换取更高准确率。在 Model Routing 中，推理模型适合数学证明、复杂代码生成、多步逻辑推理等场景，但延迟和成本较高，简单任务不需要使用。

### Agentic AI 的成熟

AI Agent 从 2024 年的概念验证阶段，到 2025 年已进入生产工具阶段：

| 产品/框架 | 类型 | 状态（2025-2026） |
|-----------|------|-------------------|
| **Claude Code** | 编程 Agent | 已成为开发者日常工具 |
| **OpenAI Agents SDK** | Agent 开发框架 | 2025 年发布，统一 Agent 构建范式 |
| **GitHub Copilot Workspace** | 编程 Agent | 从需求到 PR 的端到端 Agent |
| **LangGraph** | Agent 编排框架 | 已成熟，支持复杂状态管理和多 Agent 编排 |
| **CrewAI** | 多 Agent 框架 | 生态完善，企业级多 Agent 协作 |

**关键变化**：Agent 不再是"Demo 好看，生产不行"。通过更好的工具调用、结构化输出和错误恢复机制，编程 Agent 已成为实际提升开发效率的生产工具。

### A2A 协议（Agent-to-Agent）

Google 于 2025 年 4 月发布 A2A 协议，定义了 Agent 间通信的开放标准：

```
MCP（Model Context Protocol）: 模型 ↔ 工具/数据源
  解决: Agent 如何调用外部工具

A2A（Agent-to-Agent Protocol）: Agent ↔ Agent
  解决: 不同 Agent 之间如何发现、通信、协作

两者互补，共同构成 Agentic AI 的基础设施层。
```

**面试要点**：MCP 解决的是"Agent 怎么用工具"，A2A 解决的是"Agent 怎么找到并协作其他 Agent"。类比微服务架构：MCP 是数据库驱动，A2A 是服务间 RPC。

### 小型高效模型（SLM）与端侧 AI

2025 年，"更小但更强"成为重要趋势，推动 AI 从云端走向端侧：

| 模型 | 参数量 | 亮点 |
|------|--------|------|
| **Phi-3 / Phi-4** | 3.8B~14B | 微软，小参数量下性能惊人 |
| **Gemma 2** | 2B~27B | Google，开源，适合端侧部署 |
| **Llama 3.2** | 1B~3B | Meta，支持移动端推理 |

**面试要点**：SLM 在 Model Routing 中扮演关键角色——作为意图分类器、简单请求处理器，大幅降低系统整体成本。端侧部署还解决了隐私和延迟问题。

### 开放权重模型缩小差距

2025 年，开源/开放权重模型与闭源模型的差距大幅缩小：

- **Llama 3（405B）/ Llama 4**：Meta 持续推动开放权重，Llama 4 Scout/Maverick 引入 MoE 架构
- **DeepSeek V3 / R1**：中国团队以极低训练成本达到顶级性能，引发行业震动
- **Qwen 2.5 / QwQ**：阿里巴巴，在中文场景表现突出，推理能力持续提升

**影响**：企业 AI 选型不再是"闭源 vs 开源 = 质量 vs 自由"的简单取舍。在许多场景下，开放权重模型已能提供与闭源模型相当的质量，同时拥有更好的数据控制和部署灵活性。

### 多模态成为默认能力

2025 年，主流模型已将多模态作为默认能力而非附加功能：

- **文本 + 图像 + 视频 + 音频**：GPT-4o、Gemini 2.5、Claude 均原生支持多种模态
- **实时语音对话**：GPT-4o 的实时语音、Gemini Live 已落地到消费级产品
- **视觉理解 + 代码生成**：截图生成代码、UI 理解等从 Demo 进入实用阶段

**面试要点**：多模态不再是"未来方向"，而是选型时的基本考量维度。

---

## 面试常问 & 怎么答

### Q1: RAG 还有必要用吗？什么时候用 Long Context 替代 RAG？

RAG 没有过时，但适用范围更精确了。**Long Context 适合**：文档量可以放进上下文窗口、需要全文理解而非片段检索的场景（如长文档分析、会议纪要）。**RAG 仍然更好**：知识库大且持续更新、需要来源引用、需要精确事实回答的场景（如企业知识库、客服系统）。实际中最佳实践是**RAG + 适度长上下文**：先用 RAG 检索最相关的内容，放进合理长度的上下文中生成回答。

### Q2: 什么是 Compound AI Systems？为什么比单一模型调用好？

Compound AI Systems 是将多个 AI 组件（检索器、多个 LLM、验证器、安全过滤器等）组合成一个完整系统的设计理念，自 2024 年由 BAIR 提出后，已成为 2025 年 AI 工程的标准架构。核心优势：①每个组件可以独立优化和替换；②可以用小模型处理简单请求，大模型处理复杂请求（Model Routing），大幅降低成本；③增加验证环节提高可靠性；④支持降级和 Fallback。目前 OpenRouter、AWS Bedrock、Azure AI 等主流平台均已内置路由和级联能力。

### Q3: Model Routing 怎么实现？有哪些策略？

三种主要策略：①**基于规则**：按 Token 数、关键词等简单规则路由（实现简单但不够智能）；②**基于分类器**：用小模型先判断请求复杂度，再分发到不同大小的模型（准确但增加延迟）；③**级联（Cascade）**：先用小模型回答，自动评估质量，质量不够再用大模型重新回答（成本最优但总延迟可能更高）。生产中通常混合使用，用 AI Gateway 统一管理路由、缓存、限流和可观测性。

### Q4: Evals-Driven Development 是什么？为什么重要？

Evals-Driven Development 是将评估（Evals）作为 AI 产品开发的核心驱动力的工程实践。核心理念：AI 产品失败几乎都因为缺少系统化评估。具体做法：①定义评估标准和 Golden Dataset；②构建自动化评估管线（集成到 CI）；③每次 Prompt 或模型变更都触发评估；④分析失败案例，迭代改进。评估数据还可以形成**飞轮效应**：失败案例经人工修正后成为微调数据，进一步提升模型质量。

### Q5: AI 可观测性和传统应用监控有什么区别？

传统监控关注延迟、错误率、吞吐量，这些指标有明确的对错判断。LLM 应用额外需要：①**输出质量监控**——LLM 输出质量是概率性的，需要 LLM-as-Judge 或用户反馈来衡量；②**Token 成本追踪**——按模型、功能、用户维度分析花费；③**Prompt 级追踪**——调试时需要看完整的输入和输出，而非只看状态码；④**回归检测**——Prompt 修改或模型更新可能导致质量下降，需要自动化评估管线持续检测。主流工具包括 LangSmith、Arize Phoenix、Helicone 等。

### Q6: 什么是 Reasoning Models？和普通 LLM 有什么区别？

Reasoning Models（如 OpenAI o3/o4-mini、Claude Extended Thinking、Gemini 2.5 Thinking）通过**扩展推理时间**来提升复杂任务的准确率，本质是"用更多计算换更好结果"。与普通 LLM 的区别：①普通 LLM 是"快思考"——一次前向传播生成答案；推理模型是"慢思考"——在回答前进行多步内部推理。②推理模型在数学、编程、逻辑推理等任务上显著优于同级别普通模型。③代价是延迟更高、成本更大。**在 Compound AI Systems 中的定位**：推理模型应该通过 Model Routing 用于真正需要深度推理的请求，简单请求仍用普通小模型处理。

### Q7: A2A 和 MCP 有什么区别和联系？

MCP（Model Context Protocol）解决的是**模型与工具/数据源之间的连接**——让 Agent 能调用外部 API、读取数据库等。A2A（Agent-to-Agent Protocol）解决的是**Agent 之间的发现和通信**——让不同 Agent 能互相找到、了解能力、发起协作。两者互补：MCP 是"Agent 怎么用工具"，A2A 是"Agent 怎么和其他 Agent 协作"。类比微服务架构：MCP 相当于数据库连接层，A2A 相当于服务间的 gRPC/REST 通信协议。

---

## 看到什么就先想到这类

| 关键词/场景 | 联想到 |
|-------------|--------|
| "RAG 过时了吗" | RAG vs Long Context vs Fine-tuning 选型分析 |
| "成本太高" | Model Routing + 语义缓存 + 级联策略 + SLM |
| "系统不稳定/质量波动" | Compound AI Systems + Verifier + Evals Pipeline |
| "多跳推理/全局问题" | GraphRAG（知识图谱 + 社区摘要） |
| "复杂推理/数学/代码" | Reasoning Models（o3, Claude Extended Thinking） |
| "多 Agent 协作" | A2A 协议 + LangGraph / CrewAI |
| "编程效率" | Agentic AI（Claude Code, Copilot Workspace） |
| "怎么评估 AI 产品" | Evals-Driven Development + LLM-as-Judge |
| "怎么监控 LLM 应用" | AI 可观测性（Tracing + 质量评估 + 成本分析） |
| "模型选型" | 不是选一个模型，而是用 Router 按需分发 |
| "端侧/隐私/离线" | SLM（Phi-4, Gemma 2, Llama 3.2） |
| "开源 vs 闭源" | 开放权重模型已缩小差距，按场景选型 |
| "自动优化 Prompt" | DSPy（声明式定义 + 自动编译优化） |

---

## 延伸阅读

- [Compound AI Systems (BAIR Blog)](https://bair.berkeley.edu/blog/2024/02/18/compound-ai-systems/)
- [GraphRAG: Unlocking LLM discovery on narrative private data (Microsoft)](https://microsoft.github.io/graphrag/)
- [DSPy: Compiling Declarative Language Model Calls](https://arxiv.org/abs/2310.03714)
- [FrugalGPT: How to Use Large Language Models While Reducing Cost](https://arxiv.org/abs/2305.05176)
- [Your AI Product Needs Evals (Hamel Husain)](https://hamel.dev/blog/posts/evals/)
- [LLM Patterns (Eugene Yan)](https://eugeneyan.com/writing/llm-patterns/)
- [A2A Protocol (Google)](https://google.github.io/A2A/)
- [OpenAI Reasoning Models](https://platform.openai.com/docs/guides/reasoning)
- [Claude Extended Thinking (Anthropic)](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
