---
title: AI 技术
---

# AI 技术

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hot">🔥 核心章节</span>

::: tip 💡 核心要点
AI 技术章节覆盖从 Transformer 原理到生产级 AI 应用的完整知识链。核心主线是：**LLM 基础 → 应用技术（Prompt / Embedding / RAG）→ Agent 智能体 → 工程实践（训练 / 推理优化 / 架构设计）**。理解每一层解决什么问题、怎么衔接，比孤立背概念更有用。面试中能画出 AI 应用的全景图并说清每一层的职责，就已经展示了系统理解。
:::

---

## 全局视角：AI 应用的完整技术栈

理解 AI 技术的最好方式是跟踪**一个用户提问从输入到回答**的完整过程：

```
用户输入（自然语言）
  ↓
Prompt 工程（System Prompt + 上下文组装）
  ↓ 是否需要外部知识？
  ├── 是 → RAG 检索增强
  │     ├── Embedding 模型 → 向量化
  │     ├── 向量数据库 → 语义检索
  │     ├── Reranking → 精排
  │     └── 上下文注入 Prompt
  ├── 是否需要执行动作？
  │     └── Agent → 规划 → 工具调用 → 反思循环
  └── 否 → 直接调用 LLM
  ↓
LLM 推理（Transformer → 自注意力 → 解码生成）
  ├── KV Cache 加速
  ├── 量化 / 推测解码优化
  └── 安全护栏（Guardrails）
  ↓
流式输出 → 前端渲染 → 用户看到回答
```

## AI 知识体系全景

```
┌─────────────────────────────────────────────────────┐
│                   AI 面试与实战                       │
│  (面试准备策略 / 全栈 AI 实战 / AI 系统设计)           │
├─────────────────────────────────────────────────────┤
│                AI 工程实践                            │
│  (模型训练 / 推理优化 / 评估对齐 / 应用架构)            │
├─────────────────────────────────────────────────────┤
│          AI Agent              │   RAG 系统           │
│  (ReAct / Tool Use /           │  (检索 / 向量数据库 / │
│   Memory / MCP)                │   Rerank / 评估)      │
├─────────────────────────────────────────────────────┤
│               LLM 应用技术                            │
│  (Prompt Engineering / Embedding / 向量数据库)         │
├─────────────────────────────────────────────────────┤
│                   LLM 基础                            │
│  (Transformer / 自注意力 / Tokenization / 解码策略)     │
├─────────────────────────────────────────────────────┤
│                   AI 概述                             │
│  (发展历程 / 弱AI-AGI / ML分类 / Scaling Laws)         │
└─────────────────────────────────────────────────────┘
```

**从下往上理解**：
1. **AI 概述**是背景知识——理解 AI 发展脉络和当前所处阶段
2. **LLM 基础**是核心——Transformer 架构、注意力机制、解码策略
3. **应用技术**是工具箱——Prompt Engineering 调优输出，Embedding 连接语义空间，向量数据库存储知识
4. **RAG & Agent**是高级应用——RAG 让 LLM 连接外部知识，Agent 让 LLM 具备行动能力
5. **工程实践**是生产化——训练、推理优化、架构设计、评估对齐
6. **面试实战**是综合运用——系统设计题、项目表达、能力展示

---

## 核心概念速查

| 概念 | 一句话解释 | 为什么重要 |
|------|-----------|-----------|
| Transformer | 基于自注意力机制的序列模型，抛弃了 RNN 的顺序限制 | 所有现代 LLM 的基础架构 |
| Self-Attention | 让每个 token 关注序列中所有其他 token，捕捉长距离依赖 | 理解 LLM 能力的核心 |
| KV Cache | 缓存已计算的 Key/Value，避免重复计算 | 推理加速的第一手段 |
| Embedding | 将文本映射到高维向量空间，语义相近的文本距离接近 | RAG 和语义搜索的基础 |
| RAG | 检索外部知识 + 注入 Prompt，解决 LLM 知识截断和幻觉问题 | 企业级 AI 应用的主流架构 |
| Agent | LLM + 规划 + 工具调用 + 记忆，从"回答问题"进化到"完成任务" | AI 应用的下一个范式 |
| RLHF | 用人类反馈训练奖励模型，再优化 LLM 的输出偏好 | 让 LLM 从"能说话"到"说人话" |
| LoRA | 冻结原始权重，只训练低秩增量矩阵 | 低成本微调的事实标准 |
| 量化 | 降低模型权重精度（FP16→INT4），减少显存和计算量 | 让大模型能在消费级硬件运行 |
| Function Calling | LLM 输出结构化的函数调用指令，由系统执行 | Agent 调用工具的核心机制 |

---

## 面试中 AI 题的特点

AI 面试题有三个层次：

| 层次 | 问法 | 考查重点 | 举例 |
|------|------|---------|------|
| **概念层** | "XX 是什么" | 知不知道这个技术 | "什么是 RAG？" |
| **原理层** | "XX 怎么实现的" | 理不理解底层机制 | "Transformer 的注意力机制怎么工作的？" |
| **设计层** | "设计一个 XX 系统" | 能不能落地 | "设计一个企业知识库问答系统" |

**回答策略**：
1. **先说"是什么"**——一句话定义（如 "RAG 是检索增强生成，让 LLM 基于外部知识回答问题"）
2. **再说"怎么做"**——核心流程（如 "用户查询 → Embedding → 向量检索 → Rerank → 注入 Prompt → LLM 生成"）
3. **最后说"有什么坑"**——实战经验（如 "分块策略影响检索质量，Rerank 能显著提升准确率"）

---

## 学习技巧与直觉培养

### 技巧一：理解"为什么有这个东西"比"怎么用"更重要

每个技术的存在都是为了解决一个具体痛点：

| 技术 | 解决的痛点 |
|------|-----------|
| Transformer / Self-Attention | RNN 无法并行 + 长距离依赖丢失 |
| Prompt Engineering | LLM 输出质量取决于输入质量 → 系统化调优方法 |
| Embedding + 向量数据库 | 关键词搜索无法捕捉语义 → 语义相似度检索 |
| RAG | LLM 知识有截断日期 + 会产生幻觉 → 注入实时外部知识 |
| Agent | LLM 只能生成文本 → 让它能规划、使用工具、完成任务 |
| LoRA / QLoRA | 全量微调成本太高 → 低秩适配，用 1% 参数量达到接近效果 |
| 量化 | 模型太大放不进显存 → 降低精度换空间 |
| KV Cache | 自回归解码每步重复计算 → 缓存避免冗余 |
| RLHF / DPO | 预训练模型不懂人类偏好 → 用反馈信号对齐 |
| Guardrails | LLM 可能输出有害内容 → 安全护栏过滤 |

### 技巧二：对比学习

很多概念成对出现，对比记忆效率更高：

| A | B | 核心区别 |
|---|---|---------|
| RAG | 微调 | RAG 注入外部知识（不改模型），微调改变模型权重（不需要检索） |
| RAG | Long Context | RAG 检索最相关片段（精准），Long Context 塞入全文（可能遗漏中间内容） |
| 单模型调用 | Compound AI System | 单模型简单但不可靠，复合系统多组件协作更可靠但工程复杂 |
| LoRA | 全量微调 | LoRA 只训练增量矩阵（省资源），全量微调更新所有参数（效果上限更高） |
| RLHF | DPO | RLHF 需要单独训练奖励模型，DPO 直接从偏好数据优化（更简单） |
| Dense Retrieval | Sparse Retrieval (BM25) | Dense 用向量语义匹配，Sparse 用关键词精确匹配；混合检索效果最好 |
| Agent | Chain/Pipeline | Agent 有自主规划和反思能力，Chain 是预定义的固定流程 |
| Prefill | Decode | Prefill 并行处理输入（计算密集），Decode 自回归逐 token 生成（显存密集） |
| MQA / GQA | MHA | 减少 KV Head 数量降低显存，MQA 极端到 1 个 Head，GQA 是折中 |
| Temperature 高 | Temperature 低 | 高温更随机多样，低温更确定保守 |

### 技巧三：画架构图是最好的理解方法

AI 的核心机制都可以用架构图表达：
- **RAG 流程**：Query → Embedding → 向量检索 → Rerank → 上下文注入 → LLM → 回答
- **Agent 循环**：感知 → 规划 → 行动 → 观察 → 反思 → 下一步行动
- **推理优化**：Prefill（并行）→ KV Cache 存储 → Decode（自回归 + Cache 复用）
- **训练流程**：预训练（海量数据）→ SFT（指令微调）→ RLHF/DPO（对齐）

面试时主动画图，展示你的系统思维。

### 技巧四：从"失败原因"反推原理

理解失败原因就是理解原理：

| 失败现象 | 反推出的原理 |
|---------|------------|
| RAG 检索到了但回答错误 | 检索质量不够 → 需要 Rerank 精排 + 分块策略优化 |
| RAG 回答中出现幻觉 | 检索结果不相关但被注入了 → 需要相关性阈值过滤 |
| Agent 陷入死循环 | 缺少终止条件和反思机制 → 需要最大步数限制 + Self-Reflection |
| 微调后模型变差 | 过拟合或遗忘 → 数据质量问题 + 学习率过高 |
| Prompt 不稳定 | 模型对指令措辞敏感 → 需要 Few-shot 示例 + 结构化 Prompt |
| 量化后精度下降明显 | 压缩过度 → 考虑 INT8 而非 INT4，或混合精度量化 |

---

## 分类地图

### AI 基础

| 主题 | 核心内容 | 面试频率 | 详细页面 |
|------|---------|---------|---------|
| AI 概述与发展历程 | 弱AI/AGI/ASI、ML 分类、Scaling Laws、MoE | 🔥 | [AI 概述](./ai-overview) |
| LLM 大语言模型原理 | Transformer、自注意力、位置编码、Tokenization、解码策略 | 🔥🔥🔥 | [LLM 原理](./llm-fundamentals) |

### LLM 应用技术

| 主题 | 核心内容 | 面试频率 | 详细页面 |
|------|---------|---------|---------|
| Prompt Engineering | Zero/Few-shot、CoT、Self-Consistency、ToT、Prompt 安全 | 🔥🔥🔥 | [Prompt Engineering](./prompt-engineering) |
| Embedding 与向量数据库 | Word2Vec/BERT、向量数据库选型、ANN 算法(HNSW/IVF) | 🔥🔥 | [Embedding 与向量数据库](./embedding-and-vector-db) |
| RAG 检索增强生成 | RAG 架构、分块策略、混合检索、Rerank、HyDE/GraphRAG | 🔥🔥🔥 | [RAG](./rag) |

### AI Agent

| 主题 | 核心内容 | 面试频率 | 详细页面 |
|------|---------|---------|---------|
| AI Agent 智能体 | ReAct、记忆系统、Tool Use、MCP、多 Agent、框架对比 | 🔥🔥🔥 | [AI Agent](./ai-agents) |
| Agent Skills 编写指南 | Skill 定义形式、指令设计、工具权限、触发路由、测试验证 | 🔥🔥 | [Skills 编写指南](./ai-agent-skills) |
| Harness Engineering | Prompt 分层架构、执行循环、上下文预算、安全控制、可观测性 | 🔥🔥 | [Harness Engineering](./harness-engineering) |

### AI 工程实践

| 主题 | 核心内容 | 面试频率 | 详细页面 |
|------|---------|---------|---------|
| 模型微调与训练 | SFT、LoRA/QLoRA、RLHF/DPO、分布式训练 | 🔥🔥 | [模型训练](./model-training) |
| 模型评估、对齐与 AI 安全 | Evals-Driven Development、RLHF/DPO/Constitutional AI、Red Teaming、Guardrails 架构 | 🔥🔥🔥 | [评估、对齐与安全](./evaluation-and-alignment) |
| LLM 推理优化 | KV Cache、MQA/GQA、量化、推测解码、Continuous Batching | 🔥🔥🔥 | [推理优化](./inference-optimization) |
| AI 应用架构设计 | 架构模式、模型服务、API 设计、成本优化、可观测性 | 🔥🔥 | [应用架构](./ai-architecture) |
| AI 系统设计面试题 | 设计框架、智能客服/代码补全案例、权衡分析 | 🔥🔥 | [系统设计](./ai-system-design) |
| AI 前沿趋势与新范式 | Compound AI Systems、Model Routing、GraphRAG、Evals-Driven、AI 可观测性 | 🔥🔥🔥 | [前沿趋势](./ai-trends) |

### AI 面试准备

| 主题 | 核心内容 | 面试频率 | 详细页面 |
|------|---------|---------|---------|
| AI 时代面试准备策略 | AI 辅助学习方法、知识图谱构建、面试中如何展示 AI 能力 | 🔥🔥🔥 | [面试准备策略](./ai-interview-prep) |
| 全栈工程师 AI 实战能力 | 后端 SSE 流式、Prompt 管理、前端渲染、成本控制 | 🔥🔥🔥 | [全栈 AI 实战](./ai-for-fullstack) |

---

## 建议学习顺序

```
第一阶段（基础，必须掌握）：
  AI 概述 → LLM 原理（重点：Transformer + 自注意力）

第二阶段（核心应用，面试重点）：
  Prompt Engineering → Embedding 与向量数据库 → RAG

第三阶段（高级应用）：
  AI Agent → AI 应用架构设计 → AI 系统设计

第四阶段（工程深入，按需学习）：
  模型训练（LoRA）→ 推理优化（KV Cache / 量化）→ 评估与对齐
```

---

## 高频面试题速查

| 问题 | 核心答案 | 详见 |
|------|---------|------|
| Transformer 的自注意力机制？ | Q·K 点积算权重，加权求和 V，捕捉全局依赖 | [LLM 原理](./llm-fundamentals) |
| 什么是 RAG？为什么需要它？ | 检索外部知识注入 Prompt，解决知识截断和幻觉 | [RAG](./rag) |
| RAG vs 微调怎么选？ | RAG 适合动态知识、成本低；微调适合改变模型行为、固定领域 | [应用架构](./ai-architecture) |
| Agent 的核心架构？ | 感知→规划→行动→记忆，ReAct 模式交替推理和行动 | [AI Agent](./ai-agents) |
| LoRA 的原理？ | 冻结原始权重，训练两个低秩矩阵 A·B 作为增量 | [模型训练](./model-training) |
| KV Cache 是什么？ | 缓存已计算的 K/V，Decode 阶段只算新 token 的 Q 与全部 K/V | [推理优化](./inference-optimization) |
| Prompt Engineering 的核心技巧？ | Few-shot 示例 + CoT 推理链 + 结构化输出 + 角色设定 | [Prompt Engineering](./prompt-engineering) |
| 如何评估 LLM？ | 自动基准(MMLU/HumanEval) + 人工评估 + LLM-as-Judge | [评估与对齐](./evaluation-and-alignment) |

## 对比速查

| A | B | 一句话区别 |
|---|---|-----------|
| RAG | 微调 | RAG 注入知识不改模型，微调改模型不需检索 |
| LoRA | 全量微调 | LoRA 训练 1% 参数，全量微调更新全部参数 |
| RLHF | DPO | RLHF 需要奖励模型，DPO 直接从偏好数据优化 |
| Dense | Sparse (BM25) | Dense 向量语义匹配，Sparse 关键词精确匹配 |
| Agent | RAG | Agent 能规划和执行动作，RAG 只增强知识检索 |
| Prefill | Decode | Prefill 并行处理输入，Decode 自回归逐 token 生成 |
| MHA | GQA / MQA | MHA 每个头独立 KV，GQA/MQA 共享 KV 头省显存 |
| CoT | Few-shot | CoT 引导推理过程，Few-shot 提供输入输出示例 |
