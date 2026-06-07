---
title: 数据库
---

# 数据库章节总览（2026 全栈版）

<span class="dig-tag dig-tag--category">章节导览</span> <span class="dig-tag dig-tag--easy">⭐ 入门</span>

::: tip 💡 章节定位
本章覆盖 **2026 年所有主流数据存储**——不再只有 MySQL + Redis 两件套。从经典 **OLTP**（MySQL / PostgreSQL）、**分布式 NewSQL**（TiDB / Spanner）、**NoSQL**（MongoDB / Cosmos DB / DynamoDB / Cassandra）、**OLAP 数仓**（Snowflake / BigQuery / Databricks）到**专用存储**（向量库 / 对象存储 / 全文搜索），按面试高频度梳理。
:::

## 章节地图（按面试频率排序）

### 🔥 必背基础（OLTP 关系型）

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [MySQL 架构](./mysql-architecture) | 一条 SQL 的执行流程、InnoDB vs MyISAM、Buffer Pool | ⭐⭐⭐⭐⭐ |
| [索引原理](./indexing) | B+ 树、聚簇索引、覆盖索引、最左前缀、索引失效 | ⭐⭐⭐⭐⭐ |
| [事务与锁](./transaction-lock) | ACID、隔离级别、MVCC、行锁/间隙锁/临键锁、死锁 | ⭐⭐⭐⭐⭐ |
| [SQL 优化](./sql-optimization) | EXPLAIN、ICP/MRR/覆盖索引、慢 SQL 5 大场景 | ⭐⭐⭐⭐⭐ |
| [MySQL 日志](./mysql-logs) | redo log、undo log、binlog、两阶段提交 | ⭐⭐⭐⭐ |
| [PostgreSQL 深度](./postgresql) **🆕** | MVCC（与 MySQL 差异）、JSONB、PG vs MySQL 决策 | ⭐⭐⭐⭐ |

### 🔥 扩展与分布式

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [分库分表](./sharding) | 垂直/水平拆分、分片策略、分布式 ID、跨库 JOIN | ⭐⭐⭐⭐ |
| [分布式数据库 NewSQL](./distributed-databases) **🆕** | TiDB / CockroachDB / Spanner / OceanBase、Raft / Percolator / TrueTime | ⭐⭐⭐⭐ |

### 🔥 NoSQL 与缓存

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [Redis 核心](./redis) | 数据类型、持久化、缓存穿透/击穿/雪崩、集群、HLL/Bitmap/GEO | ⭐⭐⭐⭐⭐ |
| [NoSQL 全景](./nosql-databases) **🆕** | MongoDB / Cosmos DB（5 API + 5 一致性）/ DynamoDB / Cassandra / ScyllaDB | ⭐⭐⭐⭐ |

### 🔥 分析与数据栈（OLAP）

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [数据仓库与 Lakehouse](./data-warehouse) **🆕** | Snowflake / BigQuery / Databricks / Redshift / Synapse、Iceberg / Delta Lake、ClickHouse | ⭐⭐⭐⭐ |
| [Elasticsearch 全文搜索](./elasticsearch) **🆕** | 倒排索引、ES 8 新特性、OpenSearch、向量混合检索 | ⭐⭐⭐ |

### 🔥 专用存储

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [向量数据库选型](./vector-database-selection) **🆕** | Milvus / Qdrant / pgvector / Pinecone、HNSW / IVF-PQ、混合检索 | ⭐⭐⭐⭐⭐ |
| [对象存储与云存储](./cloud-storage) **🆕** | Azure Blob / S3 / GCS / OSS / MinIO、分层 / 安全 / 数据湖 | ⭐⭐⭐⭐ |

---

## 数据库选型快速决策（2026 必背）

**面试 Top 题**："给你一个业务场景，怎么选数据库？"

```text
你的核心需求是什么？
│
├─ ① OLTP 强事务 + 关系模型
│   ├─ 单库容量 < 1TB → MySQL / PostgreSQL
│   ├─ 已有 PG + 半结构化 → PostgreSQL JSONB
│   ├─ 1-10TB → MySQL 分库分表（[sharding](./sharding)）
│   └─ > 10TB + 跨节点 JOIN → TiDB / CockroachDB（[NewSQL](./distributed-databases)）
│
├─ ② 高速缓存 / Session / 排行榜
│   └─ Redis（[Redis 核心](./redis)）
│
├─ ③ 文档型 / 灵活 schema
│   ├─ 先考虑 PG JSONB（够用就别上 MongoDB）
│   └─ 否则 → MongoDB / Cosmos DB（[NoSQL 全景](./nosql-databases)）
│
├─ ④ 海量写 / 时序 / 日志
│   ├─ 时序专门 → TimescaleDB / InfluxDB / VictoriaMetrics
│   └─ 宽列大规模 → Cassandra / ScyllaDB
│
├─ ⑤ OLAP 分析 / BI / 数仓
│   ├─ 单表大宽表实时聚合 → ClickHouse / Doris / StarRocks
│   ├─ 云数仓（多云）→ Snowflake
│   ├─ 完全 Serverless（GCP）→ BigQuery
│   └─ Lakehouse + ML → Databricks（[数仓](./data-warehouse)）
│
├─ ⑥ 全文搜索 + 复杂查询
│   └─ Elasticsearch / OpenSearch（[全文搜索](./elasticsearch)）
│
├─ ⑦ 向量检索（RAG / 推荐 / 相似度）
│   └─ [向量数据库选型](./vector-database-selection)
│
└─ ⑧ 文件 / 图片 / 视频 / 备份 / 数据湖底座
    └─ [对象存储](./cloud-storage)（Azure Blob / S3 / GCS）
```

---

## 2026 数据库技术全景图

```text
                    ┌──────────────────────────────────┐
                    │         应用层                    │
                    └────────────┬─────────────────────┘
                                 │
        ┌────────────────────────┼─────────────────────────────┐
        │                        │                              │
┌───────▼──────┐    ┌────────────▼──────────┐      ┌───────────▼────────┐
│  事务型      │    │   分析型               │      │   专用存储          │
│  OLTP        │    │   OLAP                 │      │                     │
├──────────────┤    ├────────────────────────┤      ├─────────────────────┤
│ MySQL        │    │ Snowflake              │      │ Vector              │
│ PostgreSQL   │    │ BigQuery               │      │ - Milvus            │
│ TiDB         │    │ Databricks             │      │ - Qdrant            │
│ OceanBase    │    │ Redshift / Synapse     │      │ - pgvector          │
│ CockroachDB  │    │ ClickHouse / Doris     │      │                     │
│ Spanner      │    │                        │      │ Search              │
│              │    │ ↓ Lakehouse 底层格式    │      │ - Elasticsearch     │
│              │    │ Iceberg / Delta / Hudi │      │ - OpenSearch        │
└──────────────┘    └────────────────────────┘      │                     │
                                                     │ Object              │
        ┌──────────────────┐                         │ - Azure Blob        │
        │  缓存 / KV       │                         │ - AWS S3            │
        ├──────────────────┤                         │ - MinIO             │
        │ Redis            │                         └─────────────────────┘
        │ Memcached        │
        │ DynamoDB         │     ┌──────────────────┐
        └──────────────────┘     │  时序            │
                                 ├──────────────────┤
        ┌──────────────────┐     │ TimescaleDB      │
        │  Document        │     │ InfluxDB         │
        ├──────────────────┤     │ VictoriaMetrics  │
        │ MongoDB          │     └──────────────────┘
        │ Cosmos DB        │
        └──────────────────┘     ┌──────────────────┐
                                 │  Graph           │
        ┌──────────────────┐     ├──────────────────┤
        │  Wide Column     │     │ Neo4j            │
        ├──────────────────┤     │ TigerGraph       │
        │ Cassandra        │     └──────────────────┘
        │ ScyllaDB         │
        │ HBase            │     ┌──────────────────┐
        └──────────────────┘     │  统一查询引擎     │
                                 ├──────────────────┤
                                 │ Trino / Presto   │
                                 │ DuckDB           │
                                 │ Spark            │
                                 └──────────────────┘

         ↓ 所有数据最终落到对象存储 ↓
         ┌────────────────────────────────────────┐
         │   Azure Blob / S3 / GCS / OSS / MinIO  │
         └────────────────────────────────────────┘
```

---

## 推荐学习顺序（按职业阶段）

### 校招 / 1-3 年（必背基础）

1. [MySQL 架构](./mysql-architecture) → 建立全局视角
2. [索引原理](./indexing) + [事务与锁](./transaction-lock) → **面试必考双子**
3. [SQL 优化](./sql-optimization) + [MySQL 日志](./mysql-logs) → 补全 MySQL
4. [Redis 核心](./redis) → 缓存必修

### 3-5 年（中级工程师）

5. [PostgreSQL 深度](./postgresql) → 2026 大量场景已优于 MySQL
6. [分库分表](./sharding) + [分布式数据库](./distributed-databases) → 应对单库瓶颈
7. [NoSQL 全景](./nosql-databases) → 文档/宽列/KV 选型
8. [Elasticsearch](./elasticsearch) → 搜索 + 复杂查询

### 5+ 年（架构师 / 数据工程）

9. [数据仓库与 Lakehouse](./data-warehouse) → OLAP / BI / 数据栈
10. [向量数据库选型](./vector-database-selection) → AI / RAG 时代必备
11. [对象存储与云存储](./cloud-storage) → 云原生底座

---

## 2026 必懂的 5 个范式变革

### 1. PostgreSQL "扩展即特性"成 2026 主流

- 已**不止是关系数据库**：pgvector（向量）/ TimescaleDB（时序）/ PostGIS（GIS）/ AGE（图）
- "**一个 PG 解决 80% 数据需求**"成为新共识
- 详见 [PostgreSQL 深度](./postgresql)

### 2. NewSQL 进入生产成熟期

- TiDB 8.0（2024）原生支持向量索引
- OceanBase 全 HTAP 落地金融
- Spanner 全球外部一致性已是标杆
- 详见 [分布式数据库](./distributed-databases)

### 3. Lakehouse 取代独立数据湖

- **Iceberg 成事实标准**（Databricks 2024 收购 Tabular）
- Snowflake / BigQuery / Databricks 三巨头都支持 Iceberg 外表
- "**存数据用 Iceberg，查数据用任意引擎**"
- 详见 [数据仓库](./data-warehouse)

### 4. 向量数据库爆发

- RAG 系统标配 → Milvus / Qdrant / Pinecone / pgvector
- **混合检索**（向量 + BM25 + Reranker）成生产标准
- 详见 [向量数据库选型](./vector-database-selection)

### 5. 对象存储成"统一底座"

- 所有数据最终落在 S3 / Azure Blob / GCS
- 数据湖、AI 训练权重、备份归档都基于对象存储
- 详见 [对象存储与云存储](./cloud-storage)

---

## 数据库 + 微服务时代的关联章节

- [分布式事务](../system-design/distributed-transaction)（跨库一致性）
- [缓存策略](../system-design/caching-strategies)（多级缓存与 Redis 实战）
- [系统设计 — 数据库选型方法论](../system-design/database-selection)（综合决策框架）
- [分布式 ID 生成](../engineering-practice/distributed-id)（Snowflake / Leaf / UUID v7）
- [消息队列](../engineering-practice/message-queue)（CDC / 异步解耦 / Exactly-Once）

---

## 看到什么就先想到这类（速查）

- **"强事务 + 关系模型"** → MySQL / PostgreSQL
- **"高速缓存 / 排行榜"** → Redis
- **"灵活 schema / JSON"** → PG JSONB（首选）或 MongoDB
- **"百亿大数据 + JOIN"** → TiDB / 分布式 NewSQL
- **"AWS Key-Value"** → DynamoDB
- **"Azure 全球多 API"** → Cosmos DB
- **"BI 分析 / 数仓"** → Snowflake / BigQuery / Databricks
- **"实时 OLAP 单表聚合"** → ClickHouse / Doris / StarRocks
- **"全文搜索"** → Elasticsearch / OpenSearch
- **"向量检索 / RAG"** → Milvus / Qdrant / pgvector
- **"图片视频备份日志"** → Azure Blob / S3
- **"时序 / IoT / 监控指标"** → TimescaleDB / InfluxDB / VictoriaMetrics
- **"社交关系链 / 风控图"** → Neo4j
