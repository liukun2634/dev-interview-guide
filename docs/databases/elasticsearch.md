---
title: Elasticsearch 全文搜索
---

# Elasticsearch 全文搜索（OpenSearch / 向量混合检索）

<span class="dig-tag dig-tag--category">搜索引擎</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**Elasticsearch（ES）2026 已不只是"全文搜索"——也是分析、可观测性、RAG 混合检索的核心**。面试必问：**倒排索引怎么实现**？**ES vs OpenSearch 怎么选**？**Lucene Segment 写入流程**？**ES 8 的 KNN 向量检索怎么用**？能讲清"**倒排索引 + 分片机制 + ES 8 BBQ 向量量化**"立刻区分中/高级。
:::

## 什么是 Elasticsearch

**Elasticsearch** = **基于 Apache Lucene 的分布式搜索 + 分析引擎**。RESTful API + JSON 文档存储。

### 主要应用场景

| 场景 | 例子 |
|------|------|
| **全文搜索** | 商品搜索、文档检索、博客站搜索 |
| **日志聚合**（ELK / EFK）| Kibana 看监控 / 故障分析 |
| **可观测性** | APM、SIEM、ELK 三件套 |
| **复杂查询 + 聚合** | 多维度 BI 分析、面板 |
| **GIS** | 地理位置搜索（外卖、网约车）|
| **RAG 混合检索** | 2024+ ES 8 向量检索成新标准 |
| **推荐 / 风控规则** | 实时规则引擎 |

### 与传统关系数据库的本质区别

| 维度 | RDBMS（MySQL）| **Elasticsearch** |
|------|--------------|-------------------|
| **数据模型** | 行 / 列 / 关系 | **JSON 文档 + 倒排索引** |
| **查询语言** | SQL | **DSL（JSON）**、SQL 兼容（ES 6+）|
| **强项** | 事务 / 关系 / 一致性 | **全文搜索 / 模糊匹配 / 聚合** |
| **写延迟** | < 1ms | **1-2 秒**（刷盘 + 刷新）|
| **读延迟** | 取决于索引 | < 100ms 海量 |
| **横向扩展** | 难 | **原生分布式** |
| **强一致** | 强 | **最终一致**（refresh 间隔）|
| **典型用法** | 业务数据持久化 | **辅助搜索 + 分析** |

::: warning ⚠️ ES 不是数据库

> ES **不要做唯一数据源**——它没强事务、写延迟 1-2 秒。**主库 MySQL/PG + CDC 同步到 ES 做搜索**，是 99% 场景的正确架构。

:::

---

## 倒排索引（Inverted Index）— 全文搜索的灵魂

### 正排 vs 倒排

```text
═══════════════════════════════════════════════════════════════
正排索引（MySQL 主键）:  documentId → content
═══════════════════════════════════════════════════════════════
   doc1 → "苹果手机价格"
   doc2 → "华为手机价格"
   doc3 → "苹果电脑售价"

查询 "苹果手机" → 全扫所有 doc，慢

═══════════════════════════════════════════════════════════════
倒排索引（Elasticsearch / Lucene）:  term → [docId list]
═══════════════════════════════════════════════════════════════
   "苹果"   → [doc1, doc3]
   "手机"   → [doc1, doc2]
   "电脑"   → [doc3]
   "价格"   → [doc1, doc2]
   "售价"   → [doc3]

查询 "苹果手机" → 取 "苹果" 列表 ∩ "手机" 列表 = [doc1]
极快: O(K)，K 是 term 数
```

### 倒排索引完整结构

```text
Term Dictionary（FST 数据结构）:
  "苹果" → 指向 Term Info
  "手机" → ...

Term Info（每个 term）:
  - doc_freq: 出现的文档数
  - posting list 指针

Posting List（每个 term）:
  - [docId, frequency, positions, offsets]
  - 例: [doc1: freq=2, pos=[0,5], doc3: freq=1, pos=[0]]
```

**关键数据结构**：
- **FST（Finite State Transducer）**：term dictionary 压缩 + 前缀共享
- **Skip List**：posting list 跳跃，O(log N) 找到指定 doc
- **Roaring Bitmap**：filter 缓存

### 分词（Analyzer）—中文搜索关键

```text
"苹果手机价格" 用不同分词器:

  Standard Analyzer:  ["苹","果","手","机","价","格"]  ← 按字切，召回烂
  IK Analyzer:        ["苹果","手机","价格"]            ← 中文必备
  ICU Analyzer:       ["苹果","手机","价格"]            ← 内置 Unicode

英文 "Quick brown fox":
  Standard:   ["quick","brown","fox"]
  English:    ["quick","brown","fox"]（含 stemming：running → run）
```

**中文场景必装**：
- **IK Analyzer**（最主流）—— 支持自定义词典
- **HanLP**—— 学术质量高
- **Jieba** —— Python 生态友好
- **mmseg** —— 简单快速

---

## ES 集群架构（必背）

```text
┌────────────────────────────────────────────────────┐
│            Elasticsearch Cluster                   │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Master Node  │  │ Master Node  │  │ Master   │ │
│  │ (eligible)   │  │ (active)     │  │ (eligible│ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│         ↓                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Data Node   │  │  Data Node   │  │  Data    │ │
│  │  Shard 1 P   │  │  Shard 2 P   │  │  Shard 3 │ │
│  │  Shard 2 R   │  │  Shard 3 R   │  │  Shard 1 │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│         ↓                                           │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ Coordinating │  │ Ingest Node  │               │
│  │ Node         │  │ (Pipeline)   │               │
│  └──────────────┘  └──────────────┘               │
└────────────────────────────────────────────────────┘

P = Primary Shard, R = Replica Shard
```

### 节点角色

| 角色 | 职责 | 部署建议 |
|------|------|---------|
| **Master** | 元数据 / 集群状态管理 | **3 个 master-eligible**（防脑裂，奇数）|
| **Data** | 数据存储 + 查询 | 按数据量横向扩 |
| **Coordinating** | 协调请求路由 + 聚合 | 大集群单独部署 |
| **Ingest** | 写入预处理（pipeline）| 按需 |
| **ML / Transform** | 机器学习 / 数据转换 | ES 7.x+ 商业特性 |

### Index → Shard → Segment

```text
Index（逻辑表）
  └── Shards（默认 1 primary, 1 replica）
         └── Segments（不可变的 Lucene 倒排索引文件）
                ├── Segment 1
                ├── Segment 2
                └── Segment N
```

**关键概念**：
- ✅ **Shard 数一旦创建不可改**（除非 split / shrink / reindex）
- ✅ **Segment 是不可变的**——写入是"append 新 segment + 标记旧 doc 删除"
- ✅ **定期 Merge**（多个小 segment 合并大 segment，提升查询效率）

---

## ES 写入流程（面试 Top 必背）

```text
应用 PUT/POST 文档
    ↓
① Coordinating Node 接收
    ↓
② 按 routing 计算到 Primary Shard
    ↓
③ Primary Shard:
    ① 写入 in-memory buffer（内存缓冲区）
    ② 写入 translog（事务日志，类似 WAL，落盘保证持久化）
    ↓
    返回 ACK 给客户端 ← 注意此时还不可搜！
    ↓
④ Refresh（默认 1s）:
    ① in-memory buffer → 新建 in-memory Segment
    ② 数据**变得可搜**
    ③ buffer 清空
    ↓
⑤ Flush（默认 30 分钟或 translog 满）:
    ① in-memory Segments → 持久化到磁盘
    ② translog 清空
    ↓
⑥ Merge（后台）:
    多个小 Segment 合并为大 Segment
```

### 关键参数（必背）

| 参数 | 默认 | 说明 | 调优 |
|------|------|------|------|
| `refresh_interval` | 1s | 数据可搜的延迟 | 大批写入临时调 30s 提速 |
| `index.translog.durability` | request | 每写请求 fsync | 高吞吐场景可改 async |
| `index.translog.sync_interval` | 5s | async 模式下的 fsync 间隔 | 折衷耐久和性能 |
| `index.number_of_shards` | 1 | Primary shard 数 | 单 shard < 50GB（最佳实践）|
| `index.number_of_replicas` | 1 | 副本数 | 读多 = 加副本 |

::: warning ⚠️ 为什么 ES 写入不是实时可搜

> ES 写入"接受"和"可搜"是**两步**：
> ① 写入 → 返回 ACK（已存 buffer + translog）
> ② Refresh → 1 秒后可搜
>
> 业务必须确认即查必须 `?refresh=true`（**慎用**，频繁 refresh 会让 segment 爆炸）。

:::

---

## ES 查询深度

### 5 种主流 Query 类型

```json
// 1. Match: 全文匹配（最常用）
GET /products/_search
{
  "query": {
    "match": {
      "title": "苹果手机"   // 分词后 OR 匹配
    }
  }
}

// 2. Term: 精确匹配（不分词）
GET /products/_search
{
  "query": {
    "term": {
      "category.keyword": "phone"
    }
  }
}

// 3. Bool: 组合查询（AND/OR/NOT）
GET /products/_search
{
  "query": {
    "bool": {
      "must":     [{ "match": { "title": "手机" } }],
      "should":   [{ "match": { "brand": "Apple" } }],
      "filter":   [{ "range": { "price": { "gte": 500 } } }],   // ★ 不算分，可缓存
      "must_not": [{ "term": { "status": "off" } }]
    }
  }
}

// 4. Match Phrase: 短语匹配（连续词序）
"match_phrase": { "title": "苹果手机" }   // 必须连续出现

// 5. Multi-Match: 跨字段
"multi_match": {
  "query": "苹果",
  "fields": ["title^3", "description"]   // title 权重 3 倍
}
```

### 聚合（Aggregations）— OLAP 神器

```json
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "by_country": {
      "terms": { "field": "country.keyword", "size": 10 },
      "aggs": {
        "total_sales": { "sum": { "field": "amount" } },
        "avg_price":   { "avg": { "field": "price" } },
        "top_products": {
          "top_hits": { "size": 3, "sort": [{ "amount": "desc" }] }
        }
      }
    },
    "monthly": {
      "date_histogram": {
        "field": "created_at",
        "calendar_interval": "month"
      },
      "aggs": { "total": { "sum": { "field": "amount" } } }
    }
  }
}
```

**ES 聚合 vs SQL `GROUP BY`**：
- ✅ ES 聚合**多层嵌套**自然（在 SQL 里要复杂 JOIN）
- ✅ ES 在亿级数据上**毫秒返回**（SQL 慢得多）
- ❌ ES 聚合精度**有损失**（默认 top N 不精确）

---

## ES 8 重大变化（2026 必懂）

### 1. KNN 向量检索（2022 起，2026 已成熟）

```json
// 创建带 dense_vector 字段的索引
PUT /docs
{
  "mappings": {
    "properties": {
      "title": { "type": "text" },
      "embedding": {
        "type": "dense_vector",
        "dims": 1536,
        "index": true,
        "similarity": "cosine"
      }
    }
  }
}

// 纯向量查询
POST /docs/_search
{
  "knn": {
    "field": "embedding",
    "query_vector": [0.1, -0.3, ...],
    "k": 10,
    "num_candidates": 100
  }
}
```

### 2. Hybrid Search（关键词 + 向量）— RAG 标配

```json
// ES 8 原生混合检索
POST /docs/_search
{
  "query": {
    "match": { "title": "Spring Boot 教程" }       // BM25 词法
  },
  "knn": {
    "field": "embedding",
    "query_vector": [...],                           // 向量语义
    "k": 10,
    "num_candidates": 100
  },
  "rank": {
    "rrf": { "window_size": 50, "rank_constant": 20 }  // ★ Reciprocal Rank Fusion
  }
}
```

### 3. BBQ（Better Binary Quantization，ES 8.16+ 2024.11）

**向量量化爆炸**：把 1536 维 float32 向量压缩到 192 字节（32× 压缩）+ recall 仅降 1-3%。

```json
{
  "type": "dense_vector",
  "dims": 1536,
  "index_options": {
    "type": "bbq_hnsw"    // ★ ES 8.16+，自动 BBQ 量化 + HNSW
  }
}
```

**实战收益**：1 亿向量 = **18GB 显存**（不量化要 600GB），是 ES 突破向量规模限制的关键。

### 4. ES|QL（新查询语言，2024 GA）

**类 Splunk SPL / KQL 的管道式查询语言**，替代 DSL 简化复杂场景：

```sql
FROM logs
| WHERE @timestamp > NOW() - 1 hour AND level == "ERROR"
| STATS error_count = COUNT(*) BY service
| SORT error_count DESC
| LIMIT 10
```

**为什么重要**：DSL（JSON）写复杂查询痛苦，ES|QL 让运维 / 数据分析师上手快。

### 5. 其他 ES 8 重要变化

| 变化 | 说明 |
|------|------|
| **取消 type** | 已彻底移除（7.x 标记 deprecated）|
| **Security 默认开启** | 8.x 起强制 TLS + 用户认证 |
| **节点角色拆分明确** | master / data_hot / data_warm / data_cold / data_frozen |
| **Searchable Snapshot** | 把 S3 / Azure Blob 当冷存储直接搜 |
| **Runtime Fields** | schema-on-read，无需 reindex 加字段 |
| **更好的 ML 集成** | 异常检测 / 预测 / NLP 内置 |

---

## ES vs OpenSearch（必知）

### 历史

```text
2010: Shay Banon 创立 Elasticsearch（基于 Lucene）
2015: Elastic NV 公司化
2021.1: Elastic 改 SSPL/EL License（限制 AWS 转售）
2021.1: AWS Fork → OpenSearch（Apache 2.0）
2024.8: Elastic 转回 AGPL 3.0（与 OpenSearch 兼容）+ 重启合作
```

### 关键差异（2026）

| 维度 | **Elasticsearch（Elastic）** | **OpenSearch（AWS / Foundation）** |
|------|------------------------------|-----------------------------------|
| **License** | AGPL 3.0 / Elastic License | **Apache 2.0** |
| **托管** | Elastic Cloud（多云）| **AWS OpenSearch Service** |
| **特性领先** | **稍领先**（KNN BBQ / ES\|QL / ML）| 跟随，社区驱动 |
| **生态** | Kibana / Beats / Logstash | OpenSearch Dashboards / Data Prepper |
| **客户** | 全球大量企业 | AWS 用户为主 |
| **K8s 部署** | ECK（Elastic Cloud on K8s）| OpenSearch Operator |
| **未来** | Elastic 重新开放后吸引力回升 | 社区独立发展 |

::: tip 💡 怎么选

> ① **在 AWS** → **OpenSearch**（深度集成，便宜）
> ② **多云 / Azure / GCP / 自建** → **Elasticsearch**（特性领先、Elastic Cloud 全云）
> ③ **License 敏感（不能 AGPL）** → **OpenSearch**（Apache 2.0）
> ④ **重 ML / 高级特性** → **Elasticsearch**

:::

---

## 生产 ES 集群最佳实践

### 1. 集群规划

```text
小集群（< 1TB）:
  3 master + 3 data（同节点）

中型（1-10TB）:
  3 master 独立 + N data + 2 coordinating

大型（10TB+）:
  3 dedicated master + N data_hot + N data_warm + N data_cold
  + 多个 coordinating
  + Snapshot 到 S3/Azure Blob 做归档
```

### 2. Shard 黄金法则

| 规则 | 数值 |
|------|------|
| **单 Shard 大小** | **20-50 GB**（最佳）|
| **单节点 Shard 数** | **< 20 / GB heap**（如 32G heap → 600 个 shard 上限）|
| **JVM Heap** | **≤ 31 GB**（避免压缩指针失效）|
| **物理内存** | Heap + 同等 Page Cache（如 64GB 机器分 31GB heap）|

::: warning ⚠️ "千个 shard" 是经典坑

> 不要为"以后扩展"建 100 个 shard 的索引——元数据爆炸 + 查询慢。**单索引 3-10 shard 是常态**，按时间分索引（如 `logs-2026.06.07`）做长期存储。

:::

### 3. 写入优化

```yaml
# 大批写入临时调
PUT /my-index/_settings
{
  "index.refresh_interval": "30s",      # 1s → 30s
  "index.number_of_replicas": 0          # 写时关副本，写完再开
}

# Bulk API（必用）
POST /_bulk
{ "index": { "_index": "products" } }
{ "name": "A", "price": 100 }
{ "index": { "_index": "products" } }
{ "name": "B", "price": 200 }
# 一次 5-10MB 是甜区
```

### 4. 查询优化

```text
✅ 用 filter context（不算分 + 可缓存）
✅ 限制返回字段 _source: ["title", "price"]
✅ 避免深分页 → 用 search_after / Scroll / PIT
✅ 大聚合用 composite aggregation（分页）
✅ 大数据集设 size: 0 + 聚合
❌ 不要用 wildcard "*xxx"（左通配灾难）
❌ 不要 script 排序（慢）
❌ 不要查 _all（已废弃，性能差）
```

### 5. 索引模板（ILM 索引生命周期）

```json
PUT /_ilm/policy/logs_policy
{
  "policy": {
    "phases": {
      "hot":    { "actions": { "rollover": { "max_size": "50GB" } } },
      "warm":   { "min_age": "7d",  "actions": { "shrink": { "number_of_shards": 1 } } },
      "cold":   { "min_age": "30d", "actions": { "freeze": {} } },
      "delete": { "min_age": "365d","actions": { "delete": {} } }
    }
  }
}
```

**省钱铁律**：日志类索引必走 hot → warm → cold → delete 流转。

---

## ES 与其他技术的对比 / 协作

### ES vs ClickHouse

| 维度 | **Elasticsearch** | **ClickHouse** |
|------|------|------|
| **强项** | 全文搜索 / 聚合 / 日志 | **极致 OLAP 单表聚合**（亿级秒级）|
| **写入** | 1-2s 可搜 | 即时 |
| **JOIN** | 弱 | 中（不如 PG）|
| **存储成本** | 高（倒排索引 + 副本）| **低 3-10×**（列存压缩极致）|
| **典型用法** | 日志搜索 / 全文 / 复杂条件聚合 | 实时大屏 / 监控指标 / 用户行为分析 |
| **2026 趋势** | 日志归 ClickHouse 是常态 | 互联网大厂广用 |

### ES vs OpenSearch CDC 流程

```text
MySQL/PG（主库）
    │
    │ Debezium CDC
    ↓
Kafka
    │
    │ Kafka Connect
    ↓
Elasticsearch（搜索 + 聚合）
```

这是 99% 的"主库 + ES" 落地架构。

---

## 常见陷阱

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **把 ES 当主库** | 写延迟 / 弱事务出大事故 | 主库另选 + ES 只做搜索 |
| **Shard 过多** | 元数据爆炸 + 查询慢 | 单索引 3-10 shard |
| **不用 Bulk** | 写入慢 100× | 批量 5-10MB |
| **深分页** | 内存爆炸 | search_after / PIT |
| **wildcard "*xxx"** | 全索引扫描 | 反向存储 / 双向索引 |
| **不调 JVM Heap** | OOM | 物理内存 50% + ≤ 31GB |
| **不做 ILM** | 老索引堆积 | hot/warm/cold 自动迁移 |
| **中文用 standard 分词** | 召回烂 | 必装 IK |
| **聚合 size 过大** | OOM | composite aggregation 分页 |

---

## 黄金答题模板（必背）

> **面试官：你怎么用 Elasticsearch？2026 有什么新东西？**
>
> **答**：ES 在我项目中是 **MySQL/PG + CDC → ES** 架构的搜索层——不做主库（写延迟 1-2s + 弱事务）。
>
> **核心原理**：
> ① **倒排索引**：term → docId 列表，O(K) 找文档（vs MySQL 主键 O(log N) 全扫）；
> ② **底层 Lucene Segment**：不可变 + Append + Merge，配合 translog（WAL）保证耐久；
> ③ **集群分布式**：Index → Shard（Primary + Replica）→ Segment，Shard 一旦建好不可改。
>
> **2026 重大变化**：
> ① **KNN 向量检索** + **ES 8.16 BBQ 量化**（32× 压缩，1 亿向量 18GB）→ 已是 RAG 混合检索的强力选项；
> ② **Hybrid Search 原生**（BM25 + KNN + RRF）一个 query 搞定；
> ③ **ES|QL**（管道查询）替代复杂 DSL；
> ④ **Searchable Snapshot** 把 S3 当冷存储直接搜。
>
> **必踩坑**：① shard 过多→元数据爆炸（单索引 3-10 个）；② JVM heap ≤ 31GB（压缩指针）；③ 必走 ILM（hot/warm/cold）；④ 中文必装 IK 分词；⑤ Bulk API 写、search_after 分页。
>
> **vs OpenSearch**：AWS 用户选 OpenSearch（深度集成 + Apache 2.0），其他场景选 Elasticsearch（特性领先）。**Elastic 2024 改回 AGPL 后两者再次兼容**。

---

## 看到什么就先想到这类

- **"全文搜索 / 商品搜索"** → ES + IK 分词
- **"日志聚合 / 监控"** → ES + Kibana（ELK）或 Loki + Tempo（PLG）
- **"复杂多条件查询 + 聚合"** → ES（比 MySQL 强）
- **"RAG 混合检索"** → ES 8 + BBQ + KNN + BM25 + RRF
- **"实时大屏单表聚合"** → ClickHouse（不是 ES）
- **"AWS 上的 ES"** → OpenSearch
- **"License 不能 AGPL"** → OpenSearch
- **"中文搜索召回烂"** → 装 IK 分词器
- **"ES 集群挂"** → master 节点数（必须 ≥3 奇数）
- **"写入慢"** → Bulk API + 关副本写完再开
- **"日志归档省钱"** → ILM hot/warm/cold 流转
- **"向量检索 < 10M"** → pgvector / Qdrant / ES 8 BBQ
- **"向量检索 100M+"** → Milvus（[向量库选型](./vector-database-selection)）
