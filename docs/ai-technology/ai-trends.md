---
title: AI 前沿趋势与新范式
---

# AI 前沿趋势与新范式

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（截至 2026-10-10）
AI 工程正从"单模型调用"走向**可评估的复合系统**：AI Gateway 与 Model Routing 管理模型，Batch/Cache 控制成本，Structured Outputs 固化边界，Observability + Evals 形成质量闭环；Agent 侧则由 Harness 管理长时间执行，MCP、A2A、Agent Skills 分别解决工具连接、跨 Agent 协作和过程知识封装。以下“趋势”是基于已发布产品和规范的工程判断，不等于所有团队都已采用，更不把预测写成事实。
:::

---

## 最新进展快照：2026-10-10 {#latest-updates}

本次更新以官方公告、规范和模型卡为依据，区分公开可用、分阶段访问和 SDK beta。模型榜单反映特定 Harness、环境与预算，不代表通用生产成功率。

| 日期 | 已核实进展 | 可用范围与工程边界 |
|------|------------|--------------------|
| 2026-10-07 | [GPT-6 与 Intelligent UI](https://openai.com/index/gpt-6-for-everyone/) | ChatGPT Chat 分批开放，付费档使用 Sol、Free/Go 使用 Luna；本次公告不改变 Work/Codex 模型，不等于全部 API 与 IDE 同步换模 |
| 2026-10-02 | [GPT-6 工程指南](https://openai.com/index/practical-guide-building-gpt-6/) | 覆盖 Astra、6.1 Sol、Luna，Responses 多 Agent 仍为 beta；模型、effort、速度档、缓存与压缩要分别评估 |
| 2026-10-07 | [Claude Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5) | 已公开提供，适合分类、抽取、压缩和有边界的子任务；小模型也支持可调推理，SDK 浏览器/桌面驱动仍 beta |
| 2026-09-28 | [Claude Sonnet 5.5](https://www.anthropic.com/claude-sonnet-5-5) | 已公开提供；高 effort 可能因超时或超范围修改反而降低验收成绩，不是越高越好 |
| 2026-09-22 | [Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5) | 已公开提供，部分高风险领域有安全回退；迁移需核对 thinking、历史保留和工具版本 |
| 2026-09-30 | [Gemini 4 Argon](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/) | Fairwind 可信防御者与早期测试者分阶段访问，并非普遍公开 API；1M Token 是公告中的输出上限，不是输入窗口或免费预算 |
| 2026-09-02 | [Gemini 3.8 Flash / Cyber](https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/) | Flash 可通过 Gemini API 使用，Cyber 面向可信防御者；长程任务可能增加工具步骤与 Token 总量 |
| 2026-10-06 | [EmbeddingGemma 2](https://blog.google/innovation-and-ai/technology/developers-tools/embeddinggemma-2/) | 740M 模块化多模态 Embedding，Apache 2.0 权重，支持端侧跨模态检索；部分托管平台支持仍待上线 |
| 2026-09-17（论文） | [DeepSeek-V4.1-Flash](https://arxiv.org/abs/2609.19969)与[模型卡](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash) | MIT 权重，多模态 MoE；CED、CSA2、FP4 KV 和局部状态重放改善缓存压力，激活参数少不等于总权重小 |
| 2026-09-20 / 09-18 | [Qwen 官方研究索引](https://qwen.ai/research) | Qwen-Image-2.1 标注开放发布，Omni-Flash/LiveTranslate 标注 Release；不能据此断言全部权重可下载或各地域 API 均已开放 |
| 2026-07-28 | [MCP 新版规范变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog) | 无状态自包含请求替代初始化握手，MRTR 与 Tasks 扩展改变交互集成；SDK 和宿主兼容性需单独核对 |

### 升级检查：能力、预算和生命周期

1. **先测任务成功成本**：把推理、工具、子 Agent、失败重试、缓存写入、运行时与人工接管都计入，而不是只比较单 Token 价格。
2. **交互式 UI 不代表执行授权**：受控组件与 Schema 用于渲染，后端独立鉴权、审批与幂等；模型生成按钮不意味着可以直接付款或发送消息。
3. **保留完整版本信息**：公告日、核验日、模型快照、SDK/Harness、Prompt/Skill、工具和索引版本都纳入回归与灰度。
4. **区分产品弃用与技术失效**：按 [OpenAI 弃用清单](https://developers.openai.com/api/docs/deprecations)，Assistants API 已于 2026-08-26 关闭，旧 Computer Use Preview 已于 2026-07-23 关闭，Sora 2 / Videos API 已于 2026-09-24 关闭；它们不再是新项目的可运行接口示例。
5. **为已公告的迁移留出时间**：托管 Evals 平台计划 2026-10-31 只读、2026-11-30 关闭；Agent Builder 和可复用 Prompt 对象计划 2026-11-30 关闭。评估方法仍有效，应迁移数据与评分规则，而不是停止做 Evals。

无法核实的新版本不补猜测参数、价格或排名。V3/R1 等历史报告仍适合讲原理，但不称作“当前最强”；开放权重、API 发布、许可证与设备可部署性分别判断。

---

## 全局视角：从单模型到复合系统

```
2022-2023: 单模型调用时代
  用户 → Prompt → LLM → 回答

2023-2024: RAG + Tool Use 时代
  用户 → 检索 → Prompt 组装 → LLM → 回答

2025-2026: Compound AI Systems 走向生产化
  用户 → AI Gateway（路由/缓存/限流）
    → 意图分类器（小模型/SLM）
    → 路由到合适的处理管线
      ├── 简单问题 → 低成本模型直接回答
      ├── 知识问题 → RAG/GraphRAG → 大模型
      ├── 复杂推理 → Reasoning Model（按 reasoning effort 调节）
      ├── 复杂任务 → Agent（多步规划 + 工具调用 + A2A 协作）
      └── 安全检查 → Guardrails → 输出
    → 评估管线（质量监控 + 回归检测）
```

**核心转变**：模型能力仍然重要，但生产差异越来越取决于**系统设计**——如何组合组件、路由、缓存和评估来构建可靠产品。

---

## Compound AI Systems（复合 AI 系统）

### 核心理念

BAIR（Berkeley AI Research）在 2024 年系统阐述了这一方向。复合系统可让检索、路由、验证和安全组件独立演进，但并不保证“一致优于”单调用：每增加一个组件都会带来延迟、故障面和评估成本，应从最简单可行架构开始，用 Evals 证明增量价值。

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

**不路由的代价**：全部使用最高能力档通常会增加成本与延迟，全部使用低成本档则可能损失复杂任务质量；具体差距随模型和流量难度分布变化，应以评估结果为准。

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
| **路由** | 按规则/成本/质量/地域/能力分发到不同模型 | LiteLLM、OpenRouter、自建 Router |
| **负载均衡** | 多供应商或多个模型实例间分发请求 | 云平台、自建 Gateway |
| **缓存** | 精确/语义响应缓存与供应商 Prompt Cache | GPTCache、供应商原生 Prompt Caching |
| **限流** | Token/请求级别的限流 | 自研 |
| **可观测性** | 请求日志、延迟、成本追踪 | LangSmith, Helicone |
| **Fallback** | 主模型不可用时自动切换 | LiteLLM |

网关、路由器和反向代理不是同一概念：Router 只做模型选择，Gateway 还承担协议适配、鉴权、配额、容错、成本和 Trace。生产路由应先建立每类任务的质量/延迟/成本基线，并检查 Fallback 是否仍支持相同的工具、Schema、上下文和数据地域。

---

## RAG 的演进：不是过时了，而是在进化

### RAG vs Long Context vs Fine-tuning：何时用什么

这是近年常见的选型题之一：

| 维度 | RAG | Long Context | Fine-tuning |
|------|-----|-------------|-------------|
| **知识更新** | 实时（更新知识库即可） | 实时（放进上下文即可） | 需要重新训练 |
| **知识量** | 可扩展到大规模语料，但召回有限 | 受限于所选模型上下文窗口 | 固化在权重中 |
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

## 2026 年值得关注的已落地方向

### Reasoning Models 与 Reasoning Effort

从 2024 年底开始，推理模型把**测试时计算（test-time compute）**变成显式工程旋钮。到 2026 年，多家 API 已支持按请求调节 reasoning effort / thinking level，并把内部推理 Token 计入用量：

| 模型 | 厂商 | 特点 |
|------|------|------|
| **GPT-5.6 系列** | OpenAI | `reasoning.effort` 按模型支持从低到更高档位；复杂任务可选更强模式 |
| **Claude 5 系列 / 4.6+** | Anthropic | 新模型以 adaptive thinking + effort 为主；固定 `budget_tokens` 在 4.6 已弃用、4.7+ 不支持 |
| **Gemini 3 / 2.5** | Google | `thinking_level` 按模型支持不同档位，默认可动态思考 |
| **DeepSeek-R1 系列** | DeepSeek | 开放权重推理模型推动可验证奖励与蒸馏实践 |

**面试要点**：Effort 是待评估的质量/延迟/成本旋钮，不是越高越好。分类和简单抽取从低档开始，复杂调试、研究和长程规划再升级；默认值与可选枚举依模型而异，网关不能把各家参数机械映射。还要为不可见推理 Token 留出上下文和预算。

### DeepSeek-V3 / R1 深度解析

DeepSeek-V3 / R1 是理解 2024-2025 开放权重模型与推理训练的重要历史案例。下述数字来自其技术报告，适合解释设计思路，不应外推为 2026 年所有模型的默认方案。

#### V3 的工程创新

| 技术 | 解决的问题 | 价值 |
|------|----------|------|
| **MoE 671B / 37B 激活** | 推理时算力像 37B 模型，能力像数百 B 模型 | 推理成本大幅低于同档稠密模型 |
| **无辅助损失负载均衡** | 传统 MoE 用辅助损失会损害模型能力 | 用偏置项动态调整专家选择，性能不让步 |
| **FP8 混合精度训练** | 降低训练内存与计算成本 | 效果依硬件、算子和数值稳定性工程而定 |
| **MLA（Multi-head Latent Attention）** | KV Cache 显存随序列线性增长 | 把 KV 压缩到低维隐变量，降低缓存占用 |
| **MTP（Multi-Token Prediction）** | 自回归一次只出一个 token | 训练时同时预测 N 个未来 token，推理可配合推测解码加速 |
| **DualPipe + 计算-通信重叠** | 大集群训练 GPU 经常等通信 | 流水线并行打满 GPU |

#### R1 的训练突破

R1 不是简单的"V3 + RLHF"。R1-Zero 展示了不先做 SFT、直接使用强化学习时可出现推理行为；正式 R1 仍包含冷启动 SFT、RL、拒绝采样和通用数据阶段：

```
R1-Zero（探索版）:
  V3 Base 模型 → 直接用 GRPO 强化学习（无 SFT）
  → 模型自发涌现长思维链、自我反思、回溯能力
  → 缺点: 语言混合、可读性差

R1（正式版）:
  Stage 1: 冷启动 SFT（少量高质量推理数据）
  Stage 2: 推理任务 RL（GRPO + 规则奖励）
  Stage 3: 拒绝采样 + 通用 SFT
  Stage 4: 全场景 RL（推理 + 偏好对齐）
  → 在技术报告所列基准上具有竞争力；使用前核对权重许可证与部署条件
```

#### GRPO 算法关键点

GRPO（Group Relative Policy Optimization）是 R1 的核心 RL 算法，相比 PPO 的简化：

| 维度 | PPO（传统 RLHF）| GRPO（R1）|
|------|---------------|----------|
| **是否需要 Critic 模型** | 需要额外价值网络 | **不需要**，减少额外模型开销 |
| **优势函数估计** | GAE，需 Critic 输出价值 | **同 prompt 采样多个回答，用组内归一化作为优势** |
| **适合什么奖励** | 任意奖励 | 特别适合**规则可验证**的奖励（数学正确性、代码通过测试）|
| **训练复杂度** | 需联合维护 Policy / Critic | 移除 Critic，但仍需处理采样、奖励与 KL 约束 |

#### 行业冲击与启示

| 维度 | 在 DeepSeek 之前 | 在 DeepSeek 之后 |
|------|---------------|---------------|
| **训练透明度** | 前沿训练细节多为闭源 | 技术报告公开了更多架构与训练细节 |
| **开放权重竞争** | 能力差距较明显 | 在部分基准和场景显著缩小，但许可证、部署与真实质量仍需逐项评估 |
| **推理模型范式** | 公开复现路径有限 | 强化了“RL + 可验证奖励”这条公开研究路线 |
| **MoE 工程化** | 复杂度高 | 展示了大规模训练与服务优化案例，但不一定适合所有负载 |

#### 面试黄金回答模板

> 当面试官问 "你怎么看 DeepSeek？" 时：
> 
> **"DeepSeek 的价值不只是参数量：架构上用 MoE + MLA 降低激活计算与 KV Cache 压力；训练上用 FP8、DualPipe 和通信重叠提高集群效率；后训练上用 GRPO 和可验证奖励展示了不依赖 Critic 的推理强化学习路线。技术报告中的成本与基准应结合口径阅读，不能直接等同于完整商业研发成本或线上质量。**
> 
> **对工程师的启示是：MoE 推理、KV Cache 压缩和基于可验证奖励的后训练都是值得按岗位深入的方向；应用工程岗位更应优先掌握评估、路由、缓存和可靠性治理。"**

---

### Agentic AI 的成熟

AI Agent 已在编码、研究和企业工作流中形成可用产品，但可靠性、权限和长任务恢复仍决定能否生产化：

| 产品/框架 | 类型 | 状态（2025-2026） |
|-----------|------|-------------------|
| **Claude Code** | 编程 Agent | 终端与 IDE 中的 Agent 工作流 |
| **OpenAI Agents SDK** | Agent 开发框架 | 提供 Agent、handoff、guardrail 与 tracing 原语 |
| **GitHub Copilot cloud agent / agent mode** | 编程 Agent | 云端后台任务与本地 IDE 自主编辑是两种不同执行形态 |
| **LangGraph** | Agent 编排框架 | 支持状态图、持久化与人工介入 |
| **CrewAI** | 多 Agent 框架 | 提供角色化 Agent 与工作流编排 |

**关键变化**：Agent 能否生产化，越来越取决于模型外的 **Harness**：指令分层、Skill 路由、工具注册、结构化输出、权限审批、上下文压缩、检查点、终止条件、Trace 与 Evals。编程 Agent 已是可用产品类别，但不能由此推断任意业务 Agent 都可靠。

### Long-running Agents（长时间运行 Agent）

后台执行 API、持久化 Agent Session 和 A2A Task 状态已经出现，说明任务生命周期正在从“一次请求”升级为“可恢复运行”。典型架构是 Job/Task + 队列 + Worker + 事件流 + Checkpoint：客户端可以断线重连，系统可以取消、恢复或请求人工输入。长任务必须设置步骤/Token/费用/时间预算，对工具动作使用幂等键，在不可逆副作用前审批，并把业务状态保存在供应商响应之外。

### A2A 协议（Agent-to-Agent）

Google 于 2025 年 4 月发布 A2A，后将项目捐赠给 Linux Foundation；截至 2026-08-09，A2A 1.0 已发布并由技术委员会维护。它定义独立 Agent 的发现、消息、Task 生命周期和 Artifact 交换：

```
MCP（Model Context Protocol）: AI Host/Client ↔ MCP Server
  解决: AI 应用如何发现并连接工具、资源和 Prompt

A2A（Agent-to-Agent Protocol）: Agent ↔ Agent
  解决: 不同 Agent 之间如何发现、通信、协作

两者互补，共同构成 Agentic AI 的基础设施层。
```

**面试要点**：MCP 解决 AI 应用如何连接 Tools/Resources/Prompts，A2A 解决独立 Agent 如何发现、委派和交换结果。它们互补，但 MCP 不替代模型原生 Function Calling，A2A 也不是 Agent SDK 或内部 sub-agent 调用协议。

### Agent Skills：过程知识层

Agent Skills 开放规范用 `SKILL.md` 和可选 scripts/references/assets 封装可按需加载的 SOP。它与 A2A Agent Card 里的 `AgentSkill` 同名但不同：前者包含可加载实现，后者只是远程 Agent 的能力广告。典型分层是 **Skills 教流程、MCP 接工具、A2A 做远程委派、Harness 负责运行时控制**。

### 小型高效模型（SLM）与端侧 AI

“更小但更强”仍是重要方向，推动部分 AI 工作负载从云端走向端侧：

| 模型 | 参数量 | 亮点 |
|------|--------|------|
| **Phi 系列** | 小型语言模型 | 适合分类、抽取和端侧候选方案，需按设备评估 |
| **Gemma 4** | 开放模型 | 覆盖轻量与本地部署场景 |
| **Llama 系列** | 开放权重模型 | 生态广，具体许可和硬件要求按版本核对 |

**面试要点**：SLM 可在 Model Routing 中作为意图分类器或简单请求处理器，是否降低整体成本取决于质量门槛、升级比例与部署利用率。端侧部署可减少网络延迟并改善数据控制，但仍要评估设备性能、模型更新和本地数据安全。

### 开放权重模型缩小差距

开放权重模型在部分任务上与闭源模型的差距缩小：

- **Llama 系列**：Meta 持续推动开放权重与工具生态
- **DeepSeek V3 / R1 系列**：推动 MoE、MLA 与开放推理模型实践
- **Qwen 3 系列**：覆盖多尺寸、推理与多模态场景

**影响**：企业 AI 选型不再是"闭源 vs 开源 = 质量 vs 自由"的简单取舍。开放权重模型在部分任务上有竞争力，也带来数据控制和部署灵活性；但“开源”与“开放权重”要区分，许可证、训练透明度、总拥有成本和真实任务质量需分别审查。

### 多模态成为默认能力

到 2026 年，多个前沿模型族已原生接受文本和图像，实时音频、视频生成/理解则仍受模型和 API 形态限制：

- **文本 + 图像**：已是多个通用模型族的基础输入能力
- **实时语音对话**：OpenAI Realtime、Gemini Live 等已有专用模型/API
- **视觉理解 + 代码生成**：截图生成代码、UI 理解等从 Demo 进入实用阶段

**面试要点**：多模态不再是"未来方向"，而是选型时的基本考量维度。

### AI 基础设施层的崛起

AI 基础设施已形成相对独立的产业层。理解这一层的分工，是回答“AI 工程师在做什么、系统成本在哪里”的关键。

```
┌──────────────────────────────────────────────────┐
│  应用层    Cursor / Devin / Perplexity / 客服    │
├──────────────────────────────────────────────────┤
│  Agent/编排 LangGraph / LlamaIndex / CrewAI      │
├──────────────────────────────────────────────────┤
│  推理服务  Together / Fireworks / Groq / DeepInfra│
│            （托管开放权重模型与专用加速）          │
├──────────────────────────────────────────────────┤
│  模型权重  OpenAI / Anthropic / Google / Meta /  │
│            DeepSeek / Mistral / Qwen             │
├──────────────────────────────────────────────────┤
│  推理引擎  vLLM / SGLang / TensorRT-LLM / TGI    │
├──────────────────────────────────────────────────┤
│  算力      NVIDIA H100/H200/B200 / AMD MI300X /  │
│            Google TPU / AWS Trainium / Groq LPU   │
├──────────────────────────────────────────────────┤
│  数据中心  Hyperscaler（AWS/Azure/GCP）+ 新进者  │
│            CoreWeave、Lambda、Crusoe              │
└──────────────────────────────────────────────────┘
```

#### GPU 算力分层

| 层级 | 代表硬件 | 单卡显存 | 主要用途 | 2025-2026 价位（参考）|
|------|---------|---------|---------|-------------|
| **训练 / 大型推理** | H100 / H200 / B200 | 80-192 GB HBM | 训练 + MoE 推理 | 数万美元/月（云租）|
| **生产推理主力** | H100 / A100 | 80 GB | 70B 级推理服务 | 中等成本 |
| **中小推理** | L40S / L4 / A10 | 24-48 GB | 7-13B 模型、边缘推理 | 低成本 |
| **专用加速** | Groq LPU / Cerebras / SambaNova | — | 极致低延迟推理（数百-数千 tok/s）| 按请求计费 |
| **苹果端侧** | M4 / M5（统一内存）| 16-192 GB | 本地 7-70B 推理 | 一次性购买 |

#### 推理云 vs 官方 API

2024-2025 年崛起的**第三方推理云**（Together、Fireworks、DeepInfra、Replicate、Groq）成为开源模型的主要分发渠道：

| 维度 | 官方 API（OpenAI/Anthropic）| 第三方推理云 | 自建部署 |
|------|---------------------------|-----------|--------|
| **可用模型** | 仅自家闭源模型 | 主流开源 + 少数闭源 | 任意 |
| **单价** | 按官方价目表 | 可能更低，也可能因服务等级更高 | 高且稳定利用率时可能更低 |
| **延迟** | 稳定 | 视厂商，Groq 极低 | 自己控制 |
| **数据合规** | 受厂商政策约束 | 同上 | 完全可控 |
| **冷启动** | 无 | 无 | 慢（需预热）|
| **最适合** | 闭源最强模型 | 开源模型主流选择 | 高 QPS + 隐私 |

**面试加分点**：能说出"为什么 Cursor 用 Claude 但 Devin 自托管"——同一道问题的答案，本质就是 Latency、单 token 成本、合规、可控性这四个维度的不同取舍。

#### 训练算力 vs 推理算力

随着 Agent、搜索和多模态应用扩大，推理负载的重要性持续上升；但“全球推理支出已超过训练”缺少统一公开统计口径，不应当作确定事实。架构上更有价值的是比较两类负载：

| 维度 | 训练算力 | 推理算力 |
|------|---------|---------|
| **集中度** | 极高（少数前沿实验室）| 分散（每个 AI 应用都需要）|
| **硬件偏好** | 大集群、HBM 大、NVLink 互联 | 单机或小集群、TCO 优先 |
| **成本形态** | 项目制、阶段性峰值 | 随用户量、Agent 步数和输出持续累积 |
| **容量规划** | 面向训练作业与 checkpoint | 面向 P95 延迟、吞吐、缓存命中和可用性 |
| **核心瓶颈** | 集群互联带宽 | 显存带宽、能耗 |

**含义**：推理基础设施（vLLM/SGLang 优化、GPU 调度、Gateway 与成本治理）是重要工程方向；岗位需求是否“超过训练”应以具体市场数据为准。

---

## 面试常问 & 怎么答

### Q1: RAG 还有必要用吗？什么时候用 Long Context 替代 RAG？

RAG 没有过时，但适用范围更精确了。**Long Context 适合**：文档量可以放进上下文窗口、需要全文理解而非片段检索的场景（如长文档分析、会议纪要）。**RAG 仍然更好**：知识库大且持续更新、需要来源引用、需要精确事实回答的场景（如企业知识库、客服系统）。实际中最佳实践是**RAG + 适度长上下文**：先用 RAG 检索最相关的内容，放进合理长度的上下文中生成回答。

### Q2: 什么是 Compound AI Systems？为什么比单一模型调用好？

Compound AI Systems 是将检索器、多个模型、验证器和安全过滤器等组合成完整系统的理念。核心优势：①组件可独立优化和替换；②按任务路由可能降低成本；③验证与降级可提高可靠性。代价是延迟、故障面和运维复杂度，因此应使用 Evals 证明每个组件的收益，而不是默认复合一定更好。

### Q3: Model Routing 怎么实现？有哪些策略？

三种主要策略：①**基于规则**：按 Token 数、关键词等简单规则路由（实现简单但不够智能）；②**基于分类器**：用小模型先判断请求复杂度，再分发到不同大小的模型（准确但增加延迟）；③**级联（Cascade）**：先用小模型回答，自动评估质量，质量不够再用大模型重新回答（成本最优但总延迟可能更高）。生产中通常混合使用，用 AI Gateway 统一管理路由、缓存、限流和可观测性。

### Q4: Evals-Driven Development 是什么？为什么重要？

Evals-Driven Development 是将评估作为 AI 产品开发核心反馈机制的实践。具体做法：①定义任务成功标准和 Golden Dataset；②构建自动化评估管线并集成 CI；③每次模型、Prompt、Skill、工具 Schema 或检索索引变更都触发回归；④分析失败案例并经人工审核后回流。LLM-as-Judge 也有偏差，需要校准、抽查和版本化。

### Q5: AI 可观测性和传统应用监控有什么区别？

传统监控关注延迟、错误率、吞吐量，这些指标有明确的对错判断。LLM 应用额外需要：①**输出质量监控**——LLM 输出质量是概率性的，需要 LLM-as-Judge 或用户反馈来衡量；②**Token 成本追踪**——按模型、功能、用户维度分析花费；③**Prompt 级追踪**——调试时需要看完整的输入和输出，而非只看状态码；④**回归检测**——Prompt 修改或模型更新可能导致质量下降，需要自动化评估管线持续检测。主流工具包括 LangSmith、Arize Phoenix、Helicone 等。

### Q6: 什么是 Reasoning Models？和普通 LLM 有什么区别？

Reasoning Models 通过额外的测试时计算改善复杂任务，API 往往用 reasoning effort / thinking level 暴露控制。它们在数学、编程、规划等任务上可能更强，代价是更多推理 Token、延迟和上下文占用。生产中按任务类型路由，并以 Evals 决定 effort；简单任务通常从较低档位开始。

### Q7: A2A 和 MCP 有什么区别和联系？

MCP 解决 AI 应用与工具/数据源的标准连接，A2A 解决独立 Agent 的发现、任务和结果交换。两者互补；Function Calling 仍负责模型生成工具调用，Agent Skills 封装可加载 SOP，Harness 负责执行循环和治理。截至 2026-08-09，MCP 与 A2A 都已进入 Linux Foundation 体系的开放治理，但应固定规范版本并关注兼容性，不能把生态采用等同于所有实现完全互通。

---

## 看到什么就先想到这类

| 关键词/场景 | 联想到 |
|-------------|--------|
| "RAG 过时了吗" | RAG vs Long Context vs Fine-tuning 选型分析 |
| "成本太高" | Model Routing + 语义缓存 + 级联策略 + SLM |
| "系统不稳定/质量波动" | Compound AI Systems + Verifier + Evals Pipeline |
| "多跳推理/全局问题" | GraphRAG（知识图谱 + 社区摘要） |
| "复杂推理/数学/代码" | Reasoning Models + 按任务调节 Reasoning Effort |
| "多 Agent 协作" | A2A 协议 + LangGraph / CrewAI |
| "编程效率" | Agentic AI（Claude Code、Copilot cloud agent / agent mode） |
| "怎么评估 AI 产品" | Evals-Driven Development + LLM-as-Judge |
| "怎么监控 LLM 应用" | AI 可观测性（Tracing + 质量评估 + 成本分析） |
| "模型选型" | 不是选一个模型，而是用 Router 按需分发 |
| "端侧/隐私/离线" | SLM / 开放权重模型 + 设备实测 |
| "开源 vs 闭源" | 区分开源与开放权重，按许可、质量、TCO 和合规选型 |
| "自动优化 Prompt" | DSPy（声明式定义 + 自动编译优化） |
| "长任务/断线恢复" | Background execution + Job/Task + Checkpoint + 预算与审批 |
| "协议怎么分层" | Skills（SOP）/ MCP（工具）/ A2A（远程 Agent）/ Harness（运行时） |

---

## 延伸阅读

- [Compound AI Systems (BAIR Blog)](https://bair.berkeley.edu/blog/2024/02/18/compound-ai-systems/)
- [GraphRAG: Unlocking LLM discovery on narrative private data (Microsoft)](https://microsoft.github.io/graphrag/)
- [DSPy: Compiling Declarative Language Model Calls](https://arxiv.org/abs/2310.03714)
- [FrugalGPT: How to Use Large Language Models While Reducing Cost](https://arxiv.org/abs/2305.05176)
- [Your AI Product Needs Evals (Hamel Husain)](https://hamel.dev/blog/posts/evals/)
- [LLM Patterns (Eugene Yan)](https://eugeneyan.com/writing/llm-patterns/)
- [A2A Protocol](https://a2a-protocol.org/latest/)
- [OpenAI Reasoning Models](https://developers.openai.com/api/docs/guides/reasoning)
- [Claude Thinking (Anthropic)](https://platform.claude.com/docs/en/build-with-claude/thinking)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/specification/latest)
- [Agent Skills Specification](https://agentskills.io/specification)
