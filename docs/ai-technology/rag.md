---
title: RAG 检索增强生成
---

# RAG 检索增强生成

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 高频</span>

::: tip 💡 核心要点
RAG（Retrieval-Augmented Generation，检索增强生成）通过在生成前从外部知识库中检索相关信息，为大语言模型提供**可更新、可追溯**的上下文，以缓解 LLM 的**幻觉问题（Hallucination）**和**知识截止（Knowledge Cutoff）**限制。RAG 不保证回答准确：检索遗漏、错误来源、权限过滤和生成不忠实都可能造成失败。长上下文正在改变其应用边界，但在大规模知识库、动态数据、权限隔离和成本控制场景下，检索仍然重要。
:::

## 为什么需要 RAG

大语言模型存在以下固有局限：

| 问题 | 说明 | RAG 如何解决 |
|------|------|-------------|
| **幻觉（Hallucination）** | 模型可能生成看似合理但事实错误的内容 | 提供可验证文档作为依据，配合引用和忠实度评测降低风险 |
| **知识截止（Knowledge Cutoff）** | 训练数据有时间截止，无法获取最新信息 | 从实时更新的知识库中检索 |
| **领域知识不足** | 通用模型缺乏特定行业的专业知识 | 接入企业内部文档和专业数据库 |
| **数据隐私** | 不便将私有数据用于模型训练 | 数据留在本地，仅在推理时检索 |

与微调相比，RAG 的显著优势在于**无需重新训练模型**，且知识库可随时更新。

---

## RAG 核心架构

RAG 的工作流程分为三个核心阶段：**索引（Indexing）→ 检索（Retrieval）→ 生成（Generation）**。

```mermaid
graph TD
    subgraph Offline["离线索引阶段"]
        D1["文档库"] --> D2["文档加载"]
        D2 --> D3["分块 Chunking"]
        D3 --> D4["Embedding 模型"]
        D4 --> D5["向量数据库"]
    end
    
    subgraph Online["在线查询阶段"]
        Q1["用户查询"] --> Q2["Query Embedding"]
        Q2 --> Q3["相似度检索"]
        D5 --> Q3
        Q3 --> Q4["Top-K 相关文档"]
        Q4 --> Q5["构建 Prompt<br/>System + Context + Query"]
        Q5 --> Q6["LLM 生成回答"]
        Q6 --> Q7["返回结果 + 引用来源"]
    end
```

---

## RAG vs 长上下文窗口

2024 年以来，部分模型的上下文窗口扩展到数十万乃至百万级 Token，这对 RAG 的定位产生了深远影响：对可放入窗口的小型、相对稳定语料，直接提供全文成为一种可行方案。具体上限、定价和长上下文质量随模型版本变化，应以供应商当前文档和本地评测为准。

### 对比分析

| 对比维度 | RAG | 长上下文窗口 | 混合方案 |
|----------|-----|-------------|----------|
| **架构复杂度** | 高 — 需要分块、Embedding、向量数据库、检索链路 | 低 — 直接将文档拼接到 Prompt | 中等 |
| **单次查询成本** | 低 — 只传入检索到的少量片段 | 高 — 每次查询都传入全量文档 | 中等 |
| **知识库规模** | 可扩展到大规模语料 | 受限于具体模型上下文窗口 | 大规模知识库 + 精细推理 |
| **实时性** | 支持动态更新，索引后即可检索 | 需要每次查询时重新加载 | 灵活 |
| **准确性** | 依赖检索质量，可能漏召回 | 无检索阶段漏召回，但仍可能受截断、位置偏差和推理错误影响 | 依赖召回范围、上下文噪声和目标模型 |
| **延迟** | 较低（检索 + 生成） | 较高（处理大量 Token 耗时） | 中等 |

### 决策指南

::: tip 💡 如何选择

- **文档量可稳定放入目标模型上下文**（Anthropic 的 Contextual Retrieval 指南以 200K Token 作为其示例边界）→ 可评估**长上下文方案**，架构简单但仍存在位置偏差、输入截断和成本问题
- **文档量 > 1M Token 或数据持续更新** → 使用 **RAG**，成本可控且可扩展
- **对准确性要求极高**（如医疗、法律、金融）→ 采用**混合方案**：RAG 检索缩小候选范围，再将候选文档放入长上下文让模型精细推理

:::

### 混合架构（Hybrid RAG + Long Context）

混合方案是常见的生产选择之一。典型流程：

```mermaid
graph LR
    A["用户查询"] --> B["RAG 检索<br/>Top-K 相关文档"]
    B --> C["将检索结果<br/>放入长上下文窗口"]
    C --> D["LLM 在大上下文中<br/>精细推理和生成"]
```

与传统 RAG 只传入少量片段不同，混合方案可以传入更多候选文档，让模型在更大范围内交叉验证和推理。但候选越多也可能增加噪声、延迟和“Lost in the Middle”，应通过 Token 预算和评测选择 Top-K，而不是固定使用 Top-50/Top-100。

---

## RAG vs Skill vs Fine-tuning

"如何让 LLM 掌握外部知识/能力"在 2025 年有了三条主流路线：**RAG**（注入知识）、**Skill**（注入流程，详见 [Agent Skills 编写指南](./ai-agent-skills)）、**Fine-tuning**（注入到权重）。这是 2025-2026 年 AI 面试中**高频追问**——很多候选人只会讲 RAG，不会区分这三者的边界。

### 三方核心区别

| 维度 | RAG | Skill | Fine-tuning |
|------|-----|-------|-------------|
| **解决什么问题** | 模型不知道**事实/知识** | 模型不知道**怎么做某类任务的流程** | 模型不具备**某种风格/能力/隐式知识** |
| **加载方式** | 运行时检索 → 注入 Prompt 上下文 | 路由触发 → 注入指令 + 工具子集到上下文 | 训练时写入模型权重 |
| **更新成本** | 重新索引（分钟级） | 改 Markdown / 配置（秒级） | 重新训练（小时-天级） |
| **可解释性** | 高（能给出引用） | 高（指令可读） | 低（权重不可读） |
| **是否消耗推理 Token** | 是（每次注入检索片段） | 是（每次注入 Skill 指令） | 否（能力已固化） |
| **典型载体** | 向量数据库 + Embedding | Markdown / YAML / Code | LoRA / 全量权重 |
| **失败模式** | 检索遗漏、片段截断 | 路由错配、Skill 指令冲突 | 灾难性遗忘、过拟合 |

### 一句话区分

> **RAG 是"教模型查资料"，Skill 是"教模型按 SOP 办事"，Fine-tuning 是"教模型形成肌肉记忆"。**

### 决策指南

::: tip 💡 如何选

- **回答需要**最新/海量/可追溯的事实** → RAG
- **任务有固定的多步流程**（代码审查、PR 总结、定制报告）→ Skill
- **需要改变模型说话风格 / 输出格式 / 领域语感** → Fine-tuning
- **三者并不互斥**：一个生产级 Agent 通常 = Fine-tuned 基模 + 多个 Skill + RAG 知识库

:::

### 组合架构（最常见的生产形态）

```mermaid
graph TD
    U["用户请求"] --> R["Skill 路由器"]
    R -->|代码审查| S1["code-review Skill<br/>指令 + 工具子集"]
    R -->|知识问答| S2["qa Skill<br/>触发 RAG"]
    S2 --> RAG["RAG 检索<br/>向量数据库"]
    RAG --> LLM
    S1 --> LLM["微调后的<br/>基础模型"]
    LLM --> O["输出"]
```

**面试加分点**：
- Skill 内部**可以调用** RAG（"先检索知识库再按 SOP 输出"），但 RAG 本身**不是** Skill
- Fine-tuning **不能替代** RAG——再大的模型也无法记住实时变化的事实
- Skill **不能替代** Fine-tuning——Prompt 难以稳定改变模型的输出风格和审美

---

## 文档处理与分块策略

文档分块（Chunking）的质量**直接影响检索效果**，是 RAG 系统中最关键的环节之一。

### 分块策略对比

| 策略 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **固定大小分块** | 按固定字符/Token 数切分 | 实现简单、速度快 | 可能在语义中间切断 |
| **递归分块** | 按层级分隔符（段落→句子→字符）递归切分 | 尽量保留语义完整性 | 实现相对复杂 |
| **语义分块** | 基于 Embedding 相似度检测语义边界 | 语义完整性最好 | 计算开销大 |
| **文档结构分块** | 按 Markdown 标题、HTML 标签等结构切分 | 保留文档层级关系 | 依赖文档格式 |

### 分块参数选择

- **Chunk Size（分块大小）**：通常 256~1024 Token。太小会丢失上下文，太大会引入噪声
- **Chunk Overlap（重叠）**：通常 10%~20%，防止关键信息被分隔符截断

### Contextual Retrieval（上下文化检索）

传统分块可能丢失文档级信息，例如片段中的“该公司”缺少公司名和报告期。Contextual Retrieval 在索引前为每个 Chunk 生成一段简短的、面向检索的文档内上下文，并将其前置到 Chunk 后同时用于 Dense Embedding 和 BM25 索引：

```text
原始片段: 该公司的收入环比增长 3%。
上下文化: 本片段来自 ACME 2023 年 Q2 财报，讨论该季度收入变化。该公司的收入环比增长 3%。
```

它是**索引预处理**，不是简单把全文摘要复制到每块，也不会自动保证提升。Anthropic 在其测试集上报告 Contextual Embeddings + Contextual BM25 降低了 Top-20 检索失败率，加入 Reranker 后进一步改善；这些数字不能直接外推到其他语料，仍需评估生成上下文的事实性、索引成本和领域效果。

### Python 分块示例

```python
from typing import List

def recursive_split(text: str, chunk_size: int = 512,
                    chunk_overlap: int = 64) -> List[str]:
    """
    递归分块：优先按段落 → 句子 → 字符分割。

    Args:
        text: 原始文本
        chunk_size: 每个分块的最大字符数
        chunk_overlap: 相邻分块重叠的字符数
    Returns:
        分块后的文本列表
    """
    separators = ["\n\n", "\n", "。", ".", " ", ""]
    chunks: List[str] = []

    def _split(text: str, sep_idx: int) -> List[str]:
        if len(text) <= chunk_size:
            return [text]

        sep = separators[sep_idx]
        if not sep:
            # 最后的回退：按字符硬切
            return [text[i:i + chunk_size]
                    for i in range(0, len(text), chunk_size - chunk_overlap)]

        parts = text.split(sep)
        current_chunk = ""
        result = []

        for part in parts:
            candidate = current_chunk + sep + part if current_chunk else part
            if len(candidate) <= chunk_size:
                current_chunk = candidate
            else:
                if current_chunk:
                    result.append(current_chunk)
                # 如果单个 part 超过 chunk_size，递归使用下一个分隔符
                if len(part) > chunk_size:
                    result.extend(_split(part, sep_idx + 1))
                    current_chunk = ""
                else:
                    current_chunk = part

        if current_chunk:
            result.append(current_chunk)
        return result

    raw_chunks = _split(text, 0)

    # 添加重叠
    for i, chunk in enumerate(raw_chunks):
        if i > 0 and chunk_overlap > 0:
            overlap_text = raw_chunks[i - 1][-chunk_overlap:]
            chunk = overlap_text + chunk
        chunks.append(chunk.strip())

    return chunks
```

---

## Embedding 与向量数据库

RAG 系统依赖 Embedding 模型将文本转换为向量，并通过向量数据库进行高效检索。关于 Embedding 模型的选择、相似度度量、向量数据库对比和 ANN 索引算法的详细介绍，请参阅 [Embedding 与向量数据库](./embedding-and-vector-db)。

---

## 检索策略

### 稠密检索 Dense Retrieval

基于 Embedding 向量的语义相似度搜索，使用余弦相似度或内积计算距离：

$$
\text{sim}(q, d) = \frac{q \cdot d}{\|q\| \cdot \|d\|}
$$

**优点**：捕获深层语义关系（如同义词、意译）。**缺点**：对精确关键词匹配可能不如稀疏检索。

### 稀疏检索 Sparse Retrieval (BM25)

基于词频统计的经典检索算法，BM25 的评分公式为：

$$
\text{BM25}(q, d) = \sum_{t \in q} \text{IDF}(t) \cdot \frac{f(t, d) \cdot (k_1 + 1)}{f(t, d) + k_1 \cdot \left(1 - b + b \cdot \frac{|d|}{\text{avgdl}}\right)}
$$

**优点**：精确关键词匹配能力强、可解释性好。**缺点**：无法处理语义相似但词汇不同的情况。

### 混合检索 Hybrid Retrieval

结合稠密检索和稀疏检索的优势，通过排名融合提升检索覆盖。两路原始分数尺度不同，不应未经校准直接相加；RRF 不依赖分数可比性，权重和候选深度仍需评测：

```python
def hybrid_search(query: str, top_k: int = 10,
                  alpha: float = 0.7) -> list:
    """
    混合检索：结合稠密检索和 BM25 稀疏检索。

    Args:
        query: 用户查询
        top_k: 返回的结果数
        alpha: 稠密检索权重（1-alpha 为稀疏检索权重）
    Returns:
        排序后的文档列表
    """
    # 稠密检索: 通过 Embedding 向量相似度搜索
    dense_results = vector_db.similarity_search(
        query_embedding=embed_model.encode(query),
        top_k=top_k * 2
    )

    # 稀疏检索: 通过 BM25 关键词匹配
    sparse_results = bm25_index.search(
        query=query,
        top_k=top_k * 2
    )

    # 使用 Reciprocal Rank Fusion (RRF) 融合排名
    scores = {}
    k = 60  # RRF 常数

    for rank, doc in enumerate(dense_results):
        scores[doc.id] = scores.get(doc.id, 0) + alpha / (k + rank + 1)

    for rank, doc in enumerate(sparse_results):
        scores[doc.id] = scores.get(doc.id, 0) + (1 - alpha) / (k + rank + 1)

    # 按融合分数排序返回 top_k
    sorted_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [doc_id for doc_id, _ in sorted_docs[:top_k]]
```

---

## 重排序 Reranking

初次检索（First-stage Retrieval）召回的结果可能包含噪声。**重排序（Reranking）**使用交叉编码器（Cross-Encoder）对 Query-Document 对进行精细打分，通常能改善最终结果的相关性，但会增加延迟和成本。

```mermaid
graph LR
    A["用户查询"] --> B["Dense Retrieval<br/>向量检索 Top-100"]
    B --> C["Cross-Encoder<br/>Reranker 精排"]
    C --> D["Top-K 最终结果"]
```

### 为什么需要两阶段

- **第一阶段**（Bi-Encoder）：Query 和 Document 独立编码，检索速度快但精度有限
- **第二阶段**（Cross-Encoder）：Query 和 Document 拼接后联合编码，精度高但计算开销大，只能用于少量候选

常用重排序模型包括 `bge-reranker-v2-m3`、`Cohere Rerank` 等。

---

## 高级 RAG 技术

### 查询改写 Query Transformation

原始用户查询可能模糊或不完整，通过 LLM 改写查询以提升检索效果：

```python
def query_rewrite(original_query: str, llm) -> list:
    """
    使用 LLM 将原始查询改写为多个检索友好的查询。
    """
    prompt = f"""请将以下用户问题改写为 3 个更适合检索的查询，
每个查询从不同角度描述同一个信息需求。

原始问题: {original_query}

改写查询:"""
    response = llm.generate(prompt)
    queries = response.strip().split("\n")
    return [original_query] + queries  # 包含原始查询
```

改写可能把用户意图、专有名词或时间条件“改没了”，因此通常保留原查询，与改写结果并行召回后融合；订单号、错误码、法规条款等精确词应锁定或交给稀疏检索。多跳问题可先分解子查询，但要限制查询数、超时和可访问数据源。

### HyDE（Hypothetical Document Embeddings）

先让 LLM 生成一个**假设性回答文档**，再用该文档的 Embedding 去检索，利用"文档-文档"相似度通常优于"查询-文档"相似度的特性。

```mermaid
graph LR
    A["用户查询"] --> B["LLM 生成假设性回答"]
    B --> C["Embedding"]
    C --> D["向量检索"]
    D --> E["检索到真实文档"]
```

### Self-RAG

让模型自己决定**是否需要检索**，以及**对检索结果进行自我评估**。模型生成特殊标记来控制流程：

- `[Retrieve]`：判断是否需要检索
- `[IsRel]`：判断检索结果是否与查询相关
- `[IsUse]`：判断检索结果是否对生成有用
- `[IsSup]`：判断生成内容是否被检索结果支持

### Corrective RAG（CRAG）

Corrective RAG 在 Self-RAG 的基础上引入**显式的纠错动作**：用一个轻量评估器（grader）对检索结果打分，根据置信度走三条不同路径。

```mermaid
graph TD
    Q["用户查询"] --> R["向量检索"]
    R --> G["Retrieval Grader<br/>评估相关性"]
    G -->|Correct 高置信| U["直接使用检索片段"]
    G -->|Ambiguous 中等| M["检索 + 网络搜索<br/>混合补全"]
    G -->|Incorrect 低置信| W["丢弃检索结果<br/>改用网络搜索"]
    U --> L["LLM 生成"]
    M --> L
    W --> L
```

**关键差异**：Self-RAG 是模型**自身**通过特殊 token 反思；CRAG 是**外挂一个评估器**做硬路由，工程上更易落地，对非微调模型也适用。

### Adaptive RAG

Adaptive RAG 在最前端加一个**查询复杂度分类器**，根据问题难度选择检索策略，避免"无脑全检索"。

| 查询类型 | 示例 | 处理路径 |
|---------|------|---------|
| **简单事实** | "马斯克的出生年份？" | 直接 LLM 回答，不检索 |
| **单跳问答** | "DeepSeek R1 用的是什么 RL 算法？" | 单次 RAG 检索 |
| **多跳推理** | "DeepSeek 的 RL 算法和 RLHF 的核心差异是什么？" | 多步检索 + Agent 规划 |

**收益**：简单问题可以跳过昂贵检索，多跳问题再升级检索深度；实际成本与质量收益取决于分类准确率、各路径单价和查询分布，应通过路由混淆矩阵与线上 Trace 评估。

### GraphRAG

GraphRAG 将传统 RAG 中的"扁平文档检索"升级为**基于知识图谱的结构化检索**：

> **传统 RAG**：查询 → 向量检索 → 独立文档片段 → LLM。**GraphRAG**：查询 → 图谱检索 → 实体 + 关系 + 社区 → LLM。

**核心流程**：
1. **构建知识图谱**：使用 LLM 从文档中提取 (实体, 关系, 实体) 三元组
2. **社区检测**：对知识图谱进行层次聚类，识别主题社区
3. **社区摘要**：为每个社区生成摘要，作为检索单元
4. **全局问答**：综合多个社区的信息回答全局性问题

**优势**：擅长回答需要跨文档推理的**全局性问题**（如"这个领域的主要趋势是什么？"），传统 RAG 由于只检索局部片段难以处理此类问题。

#### Microsoft GraphRAG 完整流水线（2024 论文级实现）

**面试 2026 高频追问**："GraphRAG 怎么实现？比向量 RAG 强在哪？成本如何评估？"——关键是讲清完整流程、查询模式和适用边界。

```text
┌────────────── 索引阶段（贵）──────────────┐
① 文档切分（chunk ~600 token + overlap）
       ↓
② LLM 提取实体 + 关系 (用 Claude/GPT-4 跑全文)
   输出: [("Apple", "founded_by", "Steve Jobs"),
          ("Apple", "headquartered_in", "Cupertino"), ...]
       ↓
③ 构建知识图谱（NetworkX / Neo4j）
       ↓
④ Leiden 算法做社区检测
   多层级聚类: Level 0 (大社区) → Level 1 → ...
       ↓
⑤ LLM 生成每个社区的摘要（最贵的一步）
   "Apple 社区: 由 Steve Jobs 创立，总部 Cupertino..."
└──────────────────────────────────────────┘

┌────────────── 查询阶段 ──────────────┐
Global Search: "这个领域的主要趋势是什么？"
  → 用所有社区摘要做 Map-Reduce
  → Map: 每个社区摘要独立回答
  → Reduce: 合并所有部分答案

Local Search: "Steve Jobs 是谁的导师？"
  → 实体匹配 + 1-2 跳邻居展开
  → 拉取相关三元组 + 原始文档块
└────────────────────────────────────┘
```

成本取决于语料长度、Chunk 大小、实体密度、抽取/摘要模型、并发和查询模式。Microsoft 官方文档也提供用传统 NLP 替代部分 LLM 抽取的 FastGraphRAG，以较低成本换取更嘈杂、较低保真的图。上线前应分别计量索引 Token、增量维护、Global/Local/DRIFT 查询的 P95 延迟和单问成本。

::: warning ⚠️ GraphRAG 不是银弹

> ① LLM 实体/关系抽取与社区摘要通常使索引显著贵于普通向量 RAG，但不存在通用的固定倍数；
> ② Global Search 是遍历社区报告的 Map-Reduce，通常比 Local/Basic Search 更耗资源；
> ③ 文档更新会带来实体合并、关系和社区摘要维护成本，增量能力取决于具体实现和版本，不能假设零成本更新；
> ④ **小规模数据通常没必要**：少量文档可先评估长上下文或传统 RAG，关系和全局分析需求明确后再引入图索引。

**适用场景判断**：
- ✅ 跨文档推理的**全局问题**（"竞品总览"、"研究趋势"）
- ✅ 关系密集型领域（人物关系 / 法律案例 / 医学）
- ❌ FAQ / 客服（用 BM25 + 向量足够）
- ❌ 实时对话（延迟过高）

:::

#### 开源实现对比

| 项目 | 厂商 | 特色 |
|------|------|------|
| **Microsoft GraphRAG** | 微软 | 论文官方实现，最完整 |
| **LightRAG** | 港大 2024.10 | 轻量图检索，项目提供增量插入能力 |
| **nano-graphrag** | 社区 | 精简实现，便于理解原型流程 |
| **Neo4j GraphRAG** | Neo4j | 商业级，集成 LangChain |
| **LlamaIndex GraphRAG** | LlamaIndex | 集成度高、易上手 |

### Agentic RAG

将 RAG 与 [AI Agent](./ai-agents) 结合，由 Agent **自主决定检索策略**，是 Self-RAG / CRAG / Adaptive RAG 的进一步泛化——把"是否检索、检索几次、检索什么、用哪个数据源"全部交给 LLM 的规划循环。

| 能力 | 传统 RAG | Agentic RAG |
|------|---------|-------------|
| **是否检索** | 始终检索 | 由 Agent 判断 |
| **检索次数** | 一次 | 多轮迭代（基于上一轮结果决定下一轮）|
| **数据源** | 固定向量库 | 在向量检索 / SQL / 网络搜索 / API 间动态选择 |
| **查询分解** | 直接用原始查询 | 拆解为子查询并行/串行检索 |
| **失败恢复** | 无 | 检索结果不满足时换策略重试 |

**典型场景**：跨多个知识库的复杂分析、需要计算或最新数据的混合问答、企业内多源数据问答。

Agentic RAG 增加了工具误用、间接 Prompt Injection、循环失控和成本不可预测风险。生产中应限制允许的数据源、轮数、Token/费用和总时限；每次检索和工具调用都由服务端重新鉴权，高风险动作不能由“检索到的内容”授权。

**与 CRAG/Self-RAG 的关系**：CRAG 和 Self-RAG 可视为 Agentic RAG 的**特定退化形式**——只有一个固定的"评估-纠错"循环；而 Agentic RAG 的工具集和循环结构是开放的。

### 高级 RAG 变体一览

| 变体 | 核心思想 | 适用场景 | 落地复杂度 |
|------|---------|---------|-----------|
| **HyDE** | 用假设性回答的 Embedding 检索 | 查询过短或与文档语义差距大 | 低 |
| **Self-RAG** | 模型自带反思 token | 需要细粒度自我评估，但需微调 | 高（需训练）|
| **CRAG** | 外挂评估器 + 三档路由 | 通用，对非微调模型友好 | 中 |
| **Adaptive RAG** | 按查询复杂度路由 | 流量大、查询分布差异大 | 中 |
| **GraphRAG** | 知识图谱 + 社区摘要 | 全局性问题、跨文档推理 | 高 |
| **Agentic RAG** | Agent 自主多轮规划 | 复杂、开放式、多源数据 | 高 |
| **ColBERT v2** | **Late Interaction**（词级延迟交互）| 长文档 / 高 recall 要求 | 中 |

### ColBERT v2 / Late Interaction（2026 必知）

**ColBERT**（Stanford 2020 + v2 2022）是和 dense bi-encoder 完全不同的另一条技术路线——**词级别延迟交互**，常被忽视但效果出色。

#### 与传统 dense retrieval 的本质区别

```
Dense Bi-Encoder（OpenAI / BGE）:
  Doc:   [token_1, ..., token_N] → Encoder → 1 个向量 (1024d)
  Query: [token_1, ..., token_M] → Encoder → 1 个向量 (1024d)
  Score: cos(query_vec, doc_vec)
  → 把整段文档压成 1 个向量，丢失细粒度信息

ColBERT (Late Interaction):
  Doc:   [token_1, ..., token_N] → Encoder → N 个向量 (每 token 128d)
  Query: [token_1, ..., token_M] → Encoder → M 个向量 (每 token 128d)
  Score: Σ_q max_d (cos(q_vec, d_vec))   ← MaxSim 操作
  → 保留每个 token 的语义，匹配更精细
```

**优势**：
- ✅ 在不少检索基准和长文档场景中优于单向量 Dense，但提升幅度取决于数据集和基线
- ✅ **OOD 泛化好**（不易被陌生领域打败）
- ✅ **可解释**（能看到哪个 query token 匹配了 doc 哪个 token）

**劣势**：
- ❌ 原始 Token 级表示远大于单向量 Dense；ColBERTv2/PLAID 可通过残差压缩等技术降低开销，但仍需专用容量评估
- ❌ **检索复杂**：需特殊索引（PLAID）

**何时用 ColBERT**：
- 高 recall 要求的法律 / 医学 / 科研搜索
- 数据量 < 1000 万文档（再多存储成本顶不住）
- 已尝试 dense + Reranker 仍然 recall 不够

**主流实现**：[RAGatouille](https://github.com/AnswerDotAI/RAGatouille)（最易用）、Pyserini、Vespa 原生支持。

### 多模态 RAG

将 RAG 扩展到**图文混合**场景：

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| **图像描述索引**（Caption Indexing）| 用多模态模型生成图像描述，按文本索引和检索 | 图表、截图类文档 |
| **多模态 Embedding** | 用 CLIP / SigLIP / Voyage-Multimodal 等模型生成图文统一的 Embedding | 图文混合检索 |
| **文档解析**（Document Parsing）| 使用 OCR + 版面分析提取图表中的结构化信息 | PDF、扫描件 |
| **VLM 直接读图**（ColPali / Visual RAG）| 跳过 OCR，VLM 直接看页面截图 | 复杂版面 PDF |

#### 三大主流方案对比（2026）

| 方案 | 代表 | 优势 | 劣势 |
|------|------|------|------|
| **Caption + Text RAG** | LlamaIndex Multi-Modal | 与现有 RAG 兼容、容易部署 | 信息损失大、依赖 caption 质量 |
| **多模态 Embedding** | Voyage Multimodal / Cohere Embed / CLIP 等 | 图文统一表示，可减少 OCR 依赖 | 模型选择、语言和长文档效果需评测 |
| **ColPali**（2024.6）| ColPali / ColQwen 系列 | 可跳过传统 OCR 流水线，直接检索 PDF 页图像 | 多向量存储大、推理成本高 |

#### ColPali：2024 现象级新范式

**ColPali** = ColBERT 思路 + 视觉 PDF 处理。**直接把 PDF 每页变成图像 + VLM 抽特征**，不再做 OCR / 版面解析。

```python
# colpali-engine 的最小流程；具体模型与设备参数以当前版本文档为准
from colpali_engine.models import ColPali, ColPaliProcessor

model_name = "vidore/colpali-v1.3"
model = ColPali.from_pretrained(model_name).eval()
processor = ColPaliProcessor.from_pretrained(model_name)

# 索引：处理 PDF 页图像，再由模型生成每页的多向量表示
image_batch = processor.process_images(pdf_page_images)
image_embeddings = model(**image_batch)

# 查询：文本 query 同样编码为多向量，再做 late-interaction 打分
query_batch = processor.process_queries(["营收增长率多少？"])
query_embeddings = model(**query_batch)
scores = processor.score_multi_vector(query_embeddings, image_embeddings)
```

**为什么是突破**：
- ✅ 保留复杂表格、图表和多栏排版的视觉线索，可减少 OCR/版面解析造成的信息损失
- ✅ 在 ViDoRe 的部分视觉文档检索任务上优于文本解析基线，但收益依模型、语言、基准版本与文档类型而异

**2026 现状**：对于财务、法律、医学等复杂 PDF，ColPali / ColQwen 值得纳入候选评测；是否采用还要比较 OCR 质量、领域语言、存储、延迟、合规和可解释性。

---

### 混合架构：RAG + 长上下文

**核心洞察**：RAG 和长上下文窗口**不是替代关系，是互补关系**。当前已有百万级上下文模型，但上下文上限不等于有效召回、权限隔离和成本问题自动消失。

#### 决策树（必背）

```text
知识库大小？
├─ < 100K token（约 1 本书）
│   └─ 直接长上下文，无需 RAG
│       优势: 无检索阶段漏召回、零索引成本、推理灵活
│       成本: 每次查询需处理全量输入，价格依模型和缓存命中而变
│
├─ 100K - 1M token
│   └─ 混合：用 RAG 召回 50K → 塞进长上下文
│       优势: 扩大候选上下文并保留精细推理空间
│
├─ 1M - 100M token
│   └─ 标准 RAG（chunk + dense retrieval + Reranker）
│
└─ > 100M token
    └─ GraphRAG / Agentic RAG / 分库 RAG
```

#### 何时选长上下文 > RAG

| 场景 | 长上下文优势 |
|------|------------|
| **完整文档分析**（法律合同审查、学术论文综述）| RAG 切片会丢失上下文 |
| **跨章节推理** | RAG 难找到所有相关片段 |
| **多文档对比**（"对比这 5 份合同的差异")| 一次性塞进所有 |
| **少样本学习**（few-shot examples）| 直接放 prompt 里 |

#### 何时仍需 RAG

| 场景 | RAG 优势 |
|------|---------|
| **超大知识库** | 长上下文也装不下 |
| **新鲜数据** | 长上下文每次都要重新喂、贵 |
| **隐私分级** | 按 ACL 检索是必需的 |
| **多源数据** | DB / API / 文档混合 |
| **成本敏感** | RAG 只送入候选片段，长上下文处理更多输入；实际差异取决于模型价格、缓存命中、检索/重排成本和请求长度 |

#### Prompt Caching：长上下文的成本优化手段

详见 [Prompt Caching](./ai-agents#prompt-caching)——固定知识库前缀命中缓存时可降低输入成本和延迟，但折扣、最小缓存长度、TTL 和失效条件由供应商决定，也不能消除长上下文质量问题。



### 生产级 RAG 模式

| 模式 | 说明 |
|------|------|
| **语义缓存** | 对相似查询缓存结果，减少重复检索和 LLM 调用 |
| **检索监控** | 追踪检索的 recall、precision，发现退化趋势 |
| **渐进式索引** | 增量更新知识库，避免全量重建索引 |
| **A/B 测试** | 对比不同分块策略、检索算法、Prompt 模板的效果 |

### 权限过滤与信任边界

RAG 不能“先全库检索、再让模型判断用户能否看”。租户、用户、文档 ACL、地域和保留期等授权条件必须由可信身份派生，并在**召回前或召回执行过程中**强制过滤；Post-filter 既可能泄露分数/内容，也可能使 Top-K 数量不足。

- 文档和 Chunk 继承同一权限标签，索引更新、删除、缓存和备份都要保持一致
- Query rewriting、Embedding 和 Reranker 不得去掉 ACL；跨租户缓存键必须包含授权上下文
- 对网页、邮件、用户上传和工具结果保留来源、信任级别与 taint 标签；它们是数据，不是授权指令
- 引用只返回用户有权访问的来源；日志和评测样本同样需要脱敏与访问控制
- 用“无权限文档能否被召回/引用/缓存命中”的负向测试验证隔离，而不是只测正常问答

### Prompt Caching 在 RAG 中的应用

RAG 场景下的 Prompt Caching 与 Agent 略有不同——RAG 的**检索片段每次都在变**，所以**不能像 Agent 一样缓存上下文中部**。正确的姿势：

::: tip 💡 RAG 的 Prompt 排版黄金顺序

```
1. System Prompt（不变 → 支持时优先评估缓存）
2. 检索指引 / 输出格式约束（不变 → 支持时优先评估缓存）
3. Few-shot 示例（不变 → 支持时优先评估缓存）
4. ──── 缓存断点（cache_control）────
5. 检索到的 Top-K 文档片段（每次变）
6. 用户问题（每次变）
```

把所有“不依赖检索结果”的稳定内容前置，断点之后才放检索片段。收益取决于稳定前缀占比、最小缓存长度、命中率、TTL、写入/读取计价和供应商实现；应根据 API usage 字段与线上流量实测，不能预设固定节省百分比。

详细缓存机制和定价对比见 [AI Agent — Prompt Caching](./ai-agents#prompt-caching)。

:::

---

## RAG 评估

RAG 系统的评估需要从**检索质量**和**生成质量**两个维度进行。

### 评估指标

| 指标 | 维度 | 衡量内容 |
|------|------|----------|
| **Context Precision** | 检索 | 检索到的文档中相关文档的比例 |
| **Context Recall** | 检索 | 所有相关文档被检索到的比例 |
| **Faithfulness** | 生成 | 生成的回答是否忠实于检索到的上下文 |
| **Answer Relevancy** | 生成 | 生成的回答与原始问题的相关性 |
| **Answer Correctness** | 端到端 | 最终回答的准确性（与标准答案对比） |
| **Citation Correctness / Completeness** | 生成 | 引用是否真正支持对应主张、关键主张是否都有来源 |
| **ACL Leakage Rate** | 安全 | 无权限文档被召回、引用或泄露的比例（目标为 0） |

离线检索还常用 **Recall@K、MRR、nDCG@K**；在线需观察无答案拒答率、P50/P95 延迟、Token/查询、缓存命中和用户反馈。RAGAS/LLM-as-Judge 可扩展评测，但会有 Judge 偏差，关键事实与权限边界应结合确定性检查和人工抽检。评测集应同时包含可回答、不可回答、多跳、时间敏感、精确标识符、对抗注入和越权查询。

### 评估框架

常用的 RAG 评估框架包括：
- **RAGAS**：提供多种生成质量和上下文质量指标；ACL 泄露率等业务安全指标需要自定义确定性测试
- **LlamaIndex Evaluation**：内置多种评估器
- **TruLens**：支持可视化的评估仪表盘

```text
版本无关的评测流程：
1. 将 question / answer / retrieved_contexts / reference_answer 组织成评测数据集
2. 用 RAGAS 或自建 Judge 计算 Faithfulness、Answer Relevancy、Context Precision 等指标
3. 用检索标注单独计算 Recall@K、MRR、nDCG@K
4. 用确定性负向测试验证 ACL 泄露、引用越权和缓存跨租户命中
5. 对低分与高风险样本做人工复核，并记录所用模型、Prompt 与框架版本
```

---

## 完整 RAG Pipeline 示例

```python
class SimpleRAGPipeline:
    """
    简化的 RAG 流水线实现，展示核心流程。
    """

    def __init__(self, embed_model, vector_store, llm,
                 chunk_size=512, top_k=5):
        self.embed_model = embed_model
        self.vector_store = vector_store
        self.llm = llm
        self.chunk_size = chunk_size
        self.top_k = top_k

    def ingest(self, documents: list):
        """离线索引：分块 → 向量化 → 存储"""
        for doc in documents:
            chunks = recursive_split(doc.text, self.chunk_size)
            for chunk in chunks:
                embedding = self.embed_model.encode(chunk)
                self.vector_store.add(
                    text=chunk,
                    embedding=embedding,
                    metadata=doc.metadata
                )

    def query(self, question: str) -> str:
        """在线查询：检索 → 构建 Prompt → 生成"""
        # Step 1: 将查询向量化
        query_embedding = self.embed_model.encode(question)

        # Step 2: 检索最相关的文档片段
        results = self.vector_store.similarity_search(
            query_embedding=query_embedding,
            top_k=self.top_k
        )

        # Step 3: 拼接上下文
        context = "\n\n---\n\n".join([r.text for r in results])

        # Step 4: 构建 Prompt 并调用 LLM
        prompt = f"""根据以下参考资料回答用户的问题。
如果参考资料中没有相关信息，请明确告知用户。

参考资料:
{context}

用户问题: {question}

回答:"""

        return self.llm.generate(prompt)
```

---

## 常见陷阱

::: warning ⚠️ 常见误区

1. **分块策略不当**：分块太大导致检索结果包含大量无关信息，分块太小导致上下文不完整，丢失关键语义。应根据文档类型和查询模式选择合适的分块策略和大小。

2. **忽视 Embedding 模型与查询语言的匹配**：使用英文为主的 Embedding 模型处理中文文档，会导致语义捕获不准确。中文场景应优先选用 BGE、GTE 等针对中文优化的模型。

3. **只用稠密检索忽视稀疏检索**：稠密检索擅长语义匹配但可能漏掉精确关键词，BM25 等稀疏检索在精确匹配场景下更可靠。混合检索通常值得优先评估，但不保证对所有语料都更好。

4. **检索数量 Top-K 设置不合理**：K 太小可能漏掉关键信息，K 太大会引入噪声且增加 LLM 的上下文负担。建议先召回较多候选（如 Top-20），再通过 Reranking 精选（如 Top-5）。

5. **缺乏评估体系**：上线后不监控检索质量和生成质量，无法发现和修复系统退化。应建立包含 Faithfulness、Relevancy 等指标的持续评估机制。

6. **检索后才做权限过滤**：把越权片段交给模型后再要求“不引用”已经越过信任边界。ACL 必须进入检索执行计划，并覆盖缓存、Reranker、引用与日志。

:::

---

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 请描述 RAG 的核心架构和工作流程</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 稠密检索和稀疏检索各有什么优缺点？如何结合使用？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 如何评估一个 RAG 系统的质量？有哪些关键指标？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
</div>

## 面试真题详解

### Q1：请描述 RAG 的核心架构和工作流程

**要点**：

RAG 系统分为**离线索引**和**在线查询**两个阶段：

**离线索引阶段**：
1. **文档加载**：从各种数据源（PDF、数据库、网页等）获取原始文档
2. **文档分块**：将长文档按策略切分为语义完整的小块（通常 256~1024 Token）
3. **向量化**：使用 Embedding 模型将每个分块转换为稠密向量
4. **存储**：将向量和原始文本存入向量数据库，建立索引

**在线查询阶段**：
1. **查询向量化**：将用户问题通过同一个 Embedding 模型转换为向量
2. **向量检索**：在向量数据库中搜索与查询最相似的 Top-K 个文档片段
3. **（可选）重排序**：使用 Cross-Encoder 对候选结果精排
4. **Prompt 构建**：将检索到的文档片段拼接进 Prompt 的上下文部分
5. **LLM 生成**：大语言模型基于上下文生成最终回答

**核心设计要点**：查询和文档必须使用同一个 Embedding 模型，确保在相同的向量空间中计算相似度。

---

### Q2：稠密检索和稀疏检索各有什么优缺点？如何结合使用？

**要点**：

| 对比维度 | 稠密检索 | 稀疏检索 (BM25) |
|----------|----------|------------------|
| 原理 | 基于 Embedding 语义向量相似度 | 基于词频和逆文档频率的统计匹配 |
| 语义匹配 | 强 —— 能理解同义词、意译 | 弱 —— 只做字面匹配 |
| 精确匹配 | 弱 —— 可能漏掉精确关键词 | 强 —— 关键词完全匹配得分高 |
| 速度 | 需要 ANN 索引，较快 | 倒排索引，非常快 |
| 可解释性 | 低 —— 向量空间难以直观理解 | 高 —— 可以看到匹配的关键词 |

**结合方式（混合检索）**：

1. **并行检索**：同时执行稠密检索和稀疏检索
2. **分数融合**：使用 RRF（Reciprocal Rank Fusion）或加权求和合并排名
3. **（可选）重排序**：对融合后的结果使用 Cross-Encoder 精排

混合检索的收益和权重没有通用数值。应在标注查询集上比较 Dense、Sparse、RRF/加权融合以及 Reranker 的 Recall@K、nDCG、P95 延迟和成本；精确标识符密集的语料可能需要更高的稀疏权重。

---

### Q3：如何评估一个 RAG 系统的质量？有哪些关键指标？

**要点**：

RAG 系统的评估需要覆盖检索和生成两个维度，核心指标包括：

**检索维度**：
- **Context Precision（上下文精确率）**：检索到的 Top-K 文档中，真正与问题相关的占比。高精确率意味着检索噪声少
- **Context Recall（上下文召回率）**：所有相关文档被成功检索到的比例。高召回率意味着不会遗漏关键信息

**生成维度**：
- **Faithfulness（忠实度）**：生成的回答是否完全基于检索到的上下文，不包含模型自行编造的信息。这是衡量幻觉问题的核心指标
- **Answer Relevancy（回答相关性）**：生成的回答与用户原始问题的相关程度

**端到端指标**：
- **Answer Correctness（回答正确性）**：最终回答与标准答案的匹配程度

**评估方法**：
1. 构建包含问题、标准答案、相关文档的评测集
2. 使用 RAGAS 等框架自动计算各项指标
3. 结合人工评估判断回答质量
4. 建立持续评估机制，监控系统在生产环境中的表现

---

## 延伸阅读

- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al., 2020)](https://arxiv.org/abs/2005.11401)
- [Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection](https://arxiv.org/abs/2310.11511)
- [Precise Zero-Shot Dense Retrieval without Relevance Labels (HyDE)](https://arxiv.org/abs/2212.10496)
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)
- [Microsoft GraphRAG Documentation](https://microsoft.github.io/graphrag/)
- [LangChain Documentation — RAG](https://python.langchain.com/docs/tutorials/rag/)
- [LlamaIndex Documentation](https://docs.llamaindex.ai/)
