---
title: 向量数据库选型深度
---

# 向量数据库选型深度（2026 必备）

<span class="dig-tag dig-tag--category">数据库</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**RAG / 推荐 / 搜索 / 多模态检索**全靠向量数据库。2026 主流选型已**收敛到 5 个核心选项**：**Milvus / Qdrant / Pinecone / pgvector / Weaviate**。能讲清"什么场景选什么 + 为什么"是 RAG 系统设计**必背追问点**。
:::

## 概念

**向量数据库（Vector Database）**：把 embedding 向量（768-3072 维浮点数）按近邻关系组织，支持**最近邻查询（ANN）**——给一个 query 向量，返回最相似的 Top K。

**与传统数据库的本质区别**：

| 维度 | 传统 DB（MySQL/Redis）| 向量 DB |
|------|---------------------|--------|
| **查询语义** | 精确匹配（=、IN、LIKE）| **语义相似**（余弦/欧氏距离）|
| **索引** | B+ 树 / 哈希 | **ANN 索引**（HNSW / IVF / DiskANN）|
| **典型 query** | `WHERE user_id = 100` | `find Top 10 similar to [0.12, -0.45, ...]` |
| **数据规模** | 行（结构化）| 亿级稠密向量 + metadata |

---

## 主流选型对比（2026 收敛）

### 选型矩阵

| 数据库 | 类型 | 强项 | 弱项 | 适用场景 |
|--------|------|------|------|---------|
| **Milvus**（Zilliz）| **专用向量 DB**（开源）| **大规模、高吞吐、多索引**；GPU 加速；生态最广 | 部署复杂（分布式架构）| **生产首选（10M+ 向量）** |
| **Qdrant**（Rust）| 专用向量 DB（开源）| **过滤性能最强**（payload index）；**Rust 性能稳定**；单机部署简单 | 集群版本较新 | **中型生产 + 复杂过滤** |
| **Pinecone** | 云端 SaaS | **零运维、Serverless 按需付费**、低延迟 | 闭源、贵、数据出境 | **不想运维 + 海外业务** |
| **pgvector** | PostgreSQL 扩展 | **已有 PG 直接用**、SQL 关联、事务一致性 | 1M 向量后性能下降明显 | **< 1M 向量 + 已有 PG 栈** |
| **Weaviate** | 专用向量 DB（开源）| 内置模块化（OpenAI/HuggingFace 集成）、GraphQL | 性能不如 Milvus/Qdrant | 快速 PoC |
| **Chroma** | 嵌入式（Python 库）| **极简、单文件部署**、Python 友好 | 不适合生产规模 | **本地原型 / 小项目** |
| **Elasticsearch + ANN** | 全文搜索 + 向量 | 全文 + 向量**混合检索**最成熟 | 资源消耗大 | **已有 ES** 想加向量 |
| **Vespa** | 搜索 + 向量 + ML | **学术性能最强**（Yahoo 出品）| 学习曲线陡 | 复杂搜索场景 |
| **OpenSearch + k-NN** | ES fork | AWS 生态 | 同 ES 资源消耗 | AWS 用户 |
| **MongoDB Atlas Vector Search** | NoSQL + 向量 | 已有 MongoDB 直接用 | 仅 Atlas 云版本支持 | MongoDB 用户 |
| **Redis Vector** | KV + 向量 | 已有 Redis 直接用、超低延迟 | 内存贵、不适合大规模 | **缓存 + 小规模实时** |

### 决策树（2026 实战）

```
向量数 < 1M？
├─ Yes → 已有 PostgreSQL？
│       ├─ Yes → pgvector
│       └─ No  → Chroma（本地）/ Qdrant（生产）
│
└─ No → 1M < 向量数 < 100M？
       ├─ Yes → 需要复杂过滤？
       │       ├─ Yes → Qdrant
       │       └─ No  → Milvus（生态最广）
       │
       └─ No → > 100M
              ├─ 不想运维 → Pinecone
              └─ 想自建 → Milvus（GPU + 分布式）
```

---

## ANN 索引算法对比（必背）

**向量数据库的灵魂是 ANN 索引**。精确 K-NN 是 O(N×D)，亿级规模算不动，必须用近似算法。

### 三大主流索引

| 算法 | 原理 | 优点 | 缺点 | 适用 |
|------|------|------|------|------|
| **HNSW**（Hierarchical NSW）| **多层图导航**：上层粗、下层细，类似跳表 | **查询速度最快**（ms 级亿级）、recall 高 | 内存占用大（图结构）、构建慢 | **首选**：实时 RAG / 推荐 |
| **IVF**（Inverted File）| K-Means 聚类 + 倒排，先找最近 nlist 个簇再精排 | 内存友好、构建快 | 速度不如 HNSW、需调 nprobe 平衡精度 | 显存受限 / 离线 |
| **DiskANN**（微软 2019）| **基于磁盘的图索引**（不需要全内存）| **单机能跑十亿向量**、成本极低 | 速度比 HNSW 慢、Milvus 等已集成 | **超大规模 + 成本敏感** |

### HNSW 关键参数

```python
# Milvus / Qdrant 都用 HNSW
index_params = {
    "M": 16,              # 每层每节点连接数（典型 16-48），越大 recall 越高内存越大
    "efConstruction": 200, # 构建时探索范围，越大 recall 越高构建越慢
    "ef": 64,             # 查询时探索范围（运行时可调），越大越准越慢
}
```

**调优经验**：
- 高质量场景：`M=32, efConstruction=400, ef=128` → recall 95%+，延迟 5-10ms
- 速度优先：`M=16, ef=32` → recall 90%，延迟 1-2ms

### IVF-PQ（极致压缩，10×+ 节省内存）

**IVF + Product Quantization**：聚类 + 把每个向量切段并量化到 8-bit 编号。

```
原始: 768 dim × 4 byte = 3072 byte/vector

IVF-PQ (M=96 段, 每段 8 bit):
  存储: 96 byte/vector  →  压缩 32 倍
  代价: recall 下降 5-10%
```

**适用**：超大规模（亿级以上）+ 可接受少量 recall 损失。Pinecone、Milvus 都支持。

### 量化方案对比

| 量化 | 内存 | 速度 | recall 损失 |
|------|------|------|------------|
| **Flat**（无压缩）| 1× | 慢 | 0%（精确） |
| **HNSW + FP32** | 1.2× | **快** | < 1% |
| **HNSW + FP16** | 0.6× | **快** | < 2% |
| **HNSW + SQ8**（标量量化）| 0.3× | 快 | 2-5% |
| **IVF + PQ** | **0.05×** | 中 | 5-10% |
| **二值量化**（BQ）| **0.03×** | 极快 | 10-20% |

---

## 关键设计要点（生产必知）

### 1. Embedding 维度选择

| 维度 | 模型 | 适用 |
|------|------|------|
| **384** | sentence-transformers/all-MiniLM | 端侧、低成本 |
| **768** | BERT-base | 通用基线 |
| **1024** | BGE-large、CoHere v3 | 中文场景 |
| **1536** | **OpenAI ada-002 / text-embedding-3-small** | **API 默认** |
| **3072** | **OpenAI text-embedding-3-large** | 最高精度 |
| **128-3072 可变** | text-embedding-3 系列（**Matryoshka**）| 可截断维度 |

**关键洞察**：text-embedding-3 系列支持 **Matryoshka 表示**——同一向量可截断到任意维度仍保留语义。`3072 → 256` 截断后 recall 仅降 2-3%，**成本节省 12×**。

### 2. 混合检索（Hybrid Search）— 2026 标配

**纯向量检索的弊端**：找不到精确关键词（如型号、SKU、人名）。

**Hybrid Search**：向量检索（语义）+ BM25（关键词）+ 重排（RRF / Reranker）。

```python
# Qdrant 原生支持 Hybrid Search（2024.12）
from qdrant_client import QdrantClient
from qdrant_client.models import Fusion, FusionQuery

results = client.query_points(
    collection_name="docs",
    prefetch=[
        models.Prefetch(query=dense_vector, using="dense", limit=20),
        models.Prefetch(query=sparse_vector, using="sparse", limit=20),  # BM25
    ],
    query=FusionQuery(fusion=Fusion.RRF),  # Reciprocal Rank Fusion
    limit=10
)
```

**Hybrid 通常比纯向量 recall 高 10-20%**——RAG 系统**必须**做。

### 3. 元数据过滤（Filtered Search）

```python
# 检索"用户 100 的文档中最相关的 10 个"
results = client.search(
    collection_name="docs",
    query_vector=query_emb,
    query_filter=Filter(must=[
        FieldCondition(key="user_id", match=MatchValue(value=100)),
        FieldCondition(key="created_at", range=Range(gte=1700000000)),
    ]),
    limit=10
)
```

::: warning ⚠️ 过滤性能陷阱

> **Pre-filter vs Post-filter**：
> - **Pre-filter**（先过滤再 ANN）：精确，但破坏 HNSW 图导航 → **查询慢 10×**
> - **Post-filter**（先 ANN 再过滤）：快，但可能返回不足 K 个
>
> **Qdrant 独家**：支持 **Payload Index + Filtered HNSW**——专门优化过滤性能，是 2026 选 Qdrant 的关键理由。

:::

### 4. 重排（Reranker）— RAG 必备

向量检索召回 100 → 用 **Cross-Encoder 重排** 选 Top 10。

```python
# 主流 Reranker
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")
scores = reranker.predict([(query, doc) for doc in candidates])
top10 = [c for _, c in sorted(zip(scores, candidates), reverse=True)[:10]]
```

**主流 Reranker**：

| 模型 | 特色 |
|------|------|
| **BGE-Reranker-v2** | 开源最强，中英双语 |
| **Cohere Rerank 3** | API 调用，质量好 |
| **Jina Reranker** | 开源，多语言 |
| **Voyage Rerank** | API，质量高 |
| **GPT-4o / Claude 当 Reranker** | 慢但质量最高，少量场景用 |

**Reranker 通常让 Top 10 准确率提升 20-40%**——这是 [RAG](../ai-technology/rag) 章节的关键一步。

---

## 与 RAG 的协作模式

```
用户 Query
    ↓
① Embedding (OpenAI text-embedding-3-small, 1536d)
    ↓
② 向量 DB 检索 (Milvus HNSW, recall=top 50)
    ↓
③ BM25 检索 (Elasticsearch, recall=top 50)
    ↓
④ RRF 融合 → top 30
    ↓
⑤ Reranker (BGE-Reranker-v2) → top 10
    ↓
⑥ 拼 Prompt + LLM 生成
```

详见 [RAG 检索增强生成](../ai-technology/rag)。

---

## 常见陷阱（必背）

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **直接用 SELECT * 取出全部 chunk** | OOM | 永远 LIMIT |
| **没用过滤** | 用户 A 看到用户 B 的私密数据 | 按 user_id 过滤（Qdrant Payload Index）|
| **chunk 太大或太小** | 大: 召回精度低 / 小: 上下文不完整 | 256-1024 token + overlap 50-100 |
| **没做混合检索** | 关键词 query 失败 | Hybrid Search（必须）|
| **embedding 模型与 reranker 不匹配** | 重排反而变差 | 用同生态（如 BGE-emb + BGE-reranker）|
| **维度太高烧钱** | 存储 + 计算成本爆炸 | Matryoshka 截断到 512-768 |
| **没监控 recall** | 慢慢退化没人发现 | 定期跑评估集 + 监控 |

---

## 黄金答题模板（必背）

> **面试官：你的 RAG 系统选什么向量数据库？为什么？**
>
> **答**：按 **数据量 + 运维偏好 + 已有栈** 决策：
> ① **< 1M 向量 + 已有 PostgreSQL** → **pgvector** 一站式（事务、JOIN、SQL 都有）；
> ② **1M-100M + 复杂过滤场景** → **Qdrant**（Payload Index + Filtered HNSW 过滤性能最强）；
> ③ **100M+ 高吞吐** → **Milvus**（GPU + 分布式 + IVF-PQ 极致压缩）；
> ④ **不想运维 + 海外业务** → **Pinecone**（Serverless 按需付费）；
> ⑤ **已有 Elasticsearch** → ES + dense_vector（混合检索最自然）。
>
> **关键技术配套**：
> - 索引：**HNSW**（速度王）或 **IVF-PQ**（成本王）
> - 检索：**Hybrid Search**（向量 + BM25 + RRF）—— RAG 必做，recall 提升 10-20%
> - 重排：**BGE-Reranker-v2** —— Top 10 准确率再提 20-40%
> - 向量：**OpenAI text-embedding-3 + Matryoshka 截断** —— 维度自由、成本节省 12×
>
> **避坑**：① 过滤用 pre-filter 慢 10×，选 Qdrant 用 Filtered HNSW；② chunk 256-1024 token + overlap；③ 监控 recall 防退化。

---

## 看到什么就先想到这类

- **"小规模 + 已有 PG"** → pgvector
- **"复杂过滤"** → Qdrant Filtered HNSW
- **"亿级向量"** → Milvus
- **"不想运维"** → Pinecone
- **"已有 ES 想加向量"** → Elasticsearch dense_vector
- **"成本敏感超大规模"** → DiskANN（Milvus 集成）
- **"recall 不够"** → Hybrid Search + Reranker
- **"向量太贵"** → Matryoshka 截断 + IVF-PQ
- **"关键词查不到"** → 混合检索（不要纯向量）
