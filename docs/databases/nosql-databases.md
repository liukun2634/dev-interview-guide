---
title: NoSQL 数据库全景
---

# NoSQL 数据库全景（MongoDB / Cosmos DB / DynamoDB / Cassandra）

<span class="dig-tag dig-tag--category">数据存储</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**NoSQL 不是"反 SQL"，是"针对特定场景优化"**。2026 面试必问：你**为什么选 MongoDB 而不是 PostgreSQL**？**DynamoDB 怎么设计分区键**？**Cassandra 的 LWT 为什么慢**？**Azure Cosmos DB 的 5 种一致性级别**怎么选？能讲清"**选型 = CAP 权衡 + 数据模型 + 一致性需求**"的人，立刻区分中/高级。
:::

## NoSQL 4 大类型（必背）

```
┌─────────────────┬─────────────────────────────────────┐
│ 类型             │ 代表                                │
├─────────────────┼─────────────────────────────────────┤
│ Key-Value       │ Redis / DynamoDB / Memcached       │
│ Document        │ MongoDB / Cosmos DB / DocumentDB   │
│ Column-Family   │ Cassandra / HBase / ScyllaDB       │
│ Graph           │ Neo4j / TigerGraph / ArangoDB      │
└─────────────────┴─────────────────────────────────────┘
```

### 类型对比速查

| 类型 | 数据模型 | 强项 | 弱项 | 典型场景 |
|------|---------|------|------|---------|
| **Key-Value** | `key → value`（任意 blob）| **超低延迟**、横向扩展 | 无复杂查询 | 缓存、Session、排行榜 |
| **Document** | JSON 文档 + 索引 | **灵活 schema**、富查询 | 多文档事务弱 | 用户画像、内容管理、产品目录 |
| **Column-Family** | 宽行 + 列族 | **超大规模写**、时序 | 复杂 query 弱 | 时序、IoT、海量日志 |
| **Graph** | 节点 + 边 | **关系查询**（朋友推荐、欺诈）| 大规模写慢 | 社交、知识图谱、风控 |

---

## MongoDB 深度（最主流 Document DB）

### 数据模型

```javascript
// 一个 Document（BSON 格式）
{
  _id: ObjectId("..."),
  name: "Alice",
  age: 30,
  addresses: [
    { city: "Beijing", zip: "100000" },
    { city: "Shanghai", zip: "200000" }
  ],
  tags: ["vip", "engineer"],
  createdAt: ISODate("2026-06-07T10:00:00Z")
}
```

**关键能力**：
- ✅ **嵌套数组 / 对象**，无需 JOIN
- ✅ **动态 schema**，加字段不用 ALTER TABLE
- ✅ **丰富索引**：单字段 / 复合 / 文本 / 地理 / TTL
- ✅ **聚合管道**（Aggregation Pipeline）替代 GROUP BY

### MongoDB vs PostgreSQL 关键对比

| 维度 | MongoDB | PostgreSQL |
|------|---------|-----------|
| **数据模型** | BSON 文档 | 关系表 + JSONB（混合）|
| **Schema** | 动态 | 强 schema（可以 JSONB 半结构化）|
| **JOIN** | `$lookup`（不推荐）| 强 |
| **事务** | 4.0+ 多文档事务（贵）| 强（ACID）|
| **横向扩展** | **原生 sharding** | 需要 Citus / 手动分片 |
| **典型场景** | 文档存储、CMS、IoT | 通用 OLTP、强一致 |
| **2026 选型** | 文档为主 + 横向需求 | **没有"必须 MongoDB"的理由就选 PG** |

::: warning ⚠️ "MongoDB or PostgreSQL?" 是 2026 经典送命题

> **PostgreSQL JSONB 已经能做 80% 的 MongoDB 工作**——还多了 ACID 事务 + 关系 + 成熟运维。
> **真的需要 MongoDB 才用 MongoDB**：① 文档天然嵌套深；② 单 Collection > 数十亿；③ 跨地域 sharding 必需。其他场景**默认选 PostgreSQL**。

:::

### 副本集（Replica Set）

```text
            ┌────────────┐
            │  Primary   │  ← 唯一写节点
            └─────┬──────┘
                  │ oplog 异步复制
        ┌─────────┼─────────┐
        ▼         ▼         ▼
   ┌──────┐  ┌──────┐  ┌──────┐
   │ Sec  │  │ Sec  │  │ Arb  │  ← Arbiter 仲裁，不存数据
   └──────┘  └──────┘  └──────┘
```

**关键特性**：
- ✅ **自动故障转移**（Primary 挂 → Secondary 选主）
- ✅ **读分离**（`readPreference: secondary`）
- ✅ **Read Concern**（majority / linearizable）
- ✅ **Write Concern**（`w: "majority"` 等多数派确认）

### Sharded Cluster（分片集群）

```
                    mongos (路由)
                    /    |    \
                   /     |     \
              Shard1   Shard2   Shard3
              (RS)     (RS)     (RS)

      Config Server (RS)  ← 存储分片元数据
```

**Shard Key（分片键）选择是生死决策**：

| 类型 | 适合 | 注意 |
|------|------|------|
| **范围分片**（如 `createdAt`）| 范围查询 | ⚠️ 写热点（新数据全到一个 shard）|
| **哈希分片**（如 `hashed(userId)`）| 均匀分布 | ❌ 无法范围查询 |
| **Zone Sharding** | 地理就近 | 全球部署 |

::: tip 💡 Shard Key 黄金法则

> ① **高基数**（cardinality 高，避免少数 key 集中）
> ② **均匀分布**（写不集中到一个 shard）
> ③ **查询常用**（避免 scatter-gather）
> ④ **不可变**（改 shard key 是噩梦）
>
> 例：电商订单 → `{userId: 1, orderId: 1}` 复合 shard key 比单纯 `orderId` 好。

:::

### MongoDB 事务（多文档）

```javascript
// 4.0+ 支持多文档事务
const session = client.startSession();
try {
  session.startTransaction({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" }
  });

  await accounts.updateOne({_id: "A"}, {$inc: {balance: -100}}, {session});
  await accounts.updateOne({_id: "B"}, {$inc: {balance: 100}}, {session});

  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
}
```

::: warning ⚠️ MongoDB 事务的代价

> 多文档事务**显著降低吞吐**（2-10×），还有 60 秒超时上限。**MongoDB 设计哲学是"嵌套文档代替事务"**——尽量用嵌套设计避免事务。需要复杂事务的场景，**仔细考虑是否选错了 NoSQL**。

:::

### 索引最佳实践

```javascript
// 复合索引（必背：ESR 规则 = Equality, Sort, Range）
db.orders.createIndex({ userId: 1, createdAt: -1, amount: 1 });
//                       ↑ Equality   ↑ Sort         ↑ Range

// 部分索引（节省空间）
db.orders.createIndex(
  { userId: 1 },
  { partialFilterExpression: { status: "active" } }
);

// TTL 索引（自动过期）
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// 文本索引（轻量级搜索）
db.articles.createIndex({ title: "text", content: "text" });
```

---

## Azure Cosmos DB（多模型云数据库）

**面试官 Top 题**："Cosmos DB 是什么？比 MongoDB 强在哪？"

### 核心特色：**5 种 API + 5 种一致性**

#### 5 种 API（一份数据多种接口）

| API | 兼容 | 适用 |
|-----|------|------|
| **NoSQL（Core）** | Cosmos DB 原生 SQL | 新项目首选 |
| **MongoDB API** | MongoDB 4.x wire 协议 | 现有 MongoDB 迁移 |
| **Cassandra API** | CQL | 现有 Cassandra 迁移 |
| **Gremlin** | Apache TinkerPop | 图数据库 |
| **PostgreSQL（Citus 扩展）** | PG + 横向扩展 | 关系 + 全球分布 |

**关键洞察**：Cosmos DB **一种存储引擎，多种 API 接入**——价值是**无需迁移代码即可享受 Azure 的全球分布 + SLA**。

#### 5 种一致性级别（面试 Top 必背）

| 级别 | 含义 | 性能 | 适用 |
|------|------|------|------|
| **Strong**（强一致）| 线性一致，全球同步写 | 慢 | 金融账户、库存 |
| **Bounded Staleness**（有界陈旧）| 读最多落后 K 个版本或 T 秒 | 中 | 大多数业务（带 SLA 的 RC）|
| **Session**（会话一致）★默认★ | 单会话内 read-your-writes | 快 | **绝大多数场景**（用户操作自己数据）|
| **Consistent Prefix** | 按写入顺序读，不漏中间 | 快 | 评论、Feed |
| **Eventual** | 最终一致 | **最快** | 计数、统计 |

```python
# Python SDK 指定一致性
from azure.cosmos import CosmosClient, ConsistencyLevel

client = CosmosClient(
    url, credential,
    consistency_level=ConsistencyLevel.Session   # ★ 默认
)
```

::: tip 💡 真实案例：选错一致性的代价

> 某电商**库存系统**用了 Eventual——双 11 超卖 5000 单。教训：**钱、库存、订单类必须 Strong 或 Bounded Staleness**，社交/统计才能 Eventual。

:::

### Cosmos DB 全球分布

```text
单一逻辑数据库
     ↓
分布到全球 30+ 区域（一键复制）
     ↓
   ┌──────────┬──────────┬──────────┐
   │ Beijing  │ Frankfurt│ Virginia │
   └──────────┴──────────┴──────────┘
        ↑ Multi-master 写（可选）
        ↑ 自动冲突解决
```

**关键能力**：
- ✅ **Single-region 写 + Multi-region 读**（默认）
- ✅ **Multi-region 写**（冲突解决 LWW 或自定义）
- ✅ **99.999% SLA**（行业最高）
- ✅ **延迟 SLA**：P99 < 10ms（同区域读）

### RU/s 计费模型（必懂）

**Cosmos DB 不按 CPU/RAM 收费**，按 **Request Unit per second** 收费。

```text
1 KB Point Read = 1 RU
1 KB Point Write = 5 RU
复杂 query 可能消耗 100-10000 RU
```

**两种模式**：
- **Provisioned**：固定 RU/s，便宜但需容量规划
- **Serverless**：按使用付费，初期 / 流量低适用
- **Autoscale**：自动 10%-100% 范围内调

::: warning ⚠️ RU 是 Cosmos 最大的坑

> 应用上线后**没监控 RU 消耗**→ 突然 throttle 429 错误 → 业务暂停。生产必做：
> ① **Azure Monitor 看 RU 使用率**
> ② **慢查询用 `RequestCharge` 头检查每个 query 的 RU**
> ③ **大查询拆 + 用索引** 把 RU 降下来

:::

---

## DynamoDB（AWS 旗舰 NoSQL）

### 数据模型

```
Table: Orders
  Partition Key: userId        (HASH, 决定数据放哪个 shard)
  Sort Key:      orderId       (RANGE, 同 partition 内排序)

  Items:
  {userId: "u1", orderId: "o1", amount: 100, status: "paid"}
  {userId: "u1", orderId: "o2", amount: 200, status: "pending"}
  {userId: "u2", orderId: "o3", amount: 300, status: "paid"}
```

### 5 种核心 API

| API | 用途 | 性能 |
|-----|------|------|
| **GetItem** | 单条按 PK 取 | < 10ms（最快）|
| **Query** | 按 PK + Sort Key 范围取 | 快 |
| **Scan** | 全表扫描 | **慢且贵，禁用** |
| **PutItem / UpdateItem** | 写入 | 快 |
| **TransactWriteItems** | 最多 100 个跨表事务 | 慢 + 贵 |

### DynamoDB 关键设计原则（必背）

#### 1. Partition Key 必须均匀

```python
# ❌ 危险：按月份分（写热点）
PK = "2026-06"  # 当月所有写都打到一个分区

# ✅ 散列：加随机后缀
PK = f"orders#{user_id}#{random(1,10)}"

# ✅ 业务键：用户ID
PK = f"user#{user_id}"
```

**单分区上限**：3000 RCU / 1000 WCU / 10GB——超过就报 ProvisionedThroughputExceededException。

#### 2. 单表设计（Single Table Design）

**反直觉但是 DynamoDB 圣经**：**所有实体放一张表，用 GSI 不同维度查**。

```text
PK              SK                          属性
USER#u1         PROFILE                     {name, email}
USER#u1         ORDER#2026-06-07#o1         {amount, status}
USER#u1         ORDER#2026-06-07#o2         {amount, status}
ORDER#o1        DETAIL                      {productId, qty}

查询 "u1 的所有订单"：
  Query: PK = "USER#u1" AND begins_with(SK, "ORDER#")
```

**为什么**：DynamoDB **JOIN 慢且贵**，但 partition 内 query 极快。设计目标是让**每个常用 query 命中单 partition**。

#### 3. GSI（Global Secondary Index）

```python
# 主表 PK: userId, SK: orderId
# GSI: status (PK), createdAt (SK)
# → 可以按 status 查询所有订单

client.query(
    TableName='Orders',
    IndexName='status-createdAt-index',
    KeyConditionExpression='#s = :status AND createdAt > :time',
    ExpressionAttributeNames={'#s': 'status'},
    ExpressionAttributeValues={':status': {'S': 'paid'}, ':time': {'S': '2026-01-01'}}
)
```

::: warning ⚠️ DynamoDB 三大学费

> ① **Scan 不能用** → 设计阶段就要规划好 PK + GSI；
> ② **单 partition 上限** → PK 必须均匀分布；
> ③ **改 schema 难** → 加字段简单，改 PK 必须重建表；
> ④ **跨 partition 事务慢且贵** → 设计要让事务局部化。

:::

---

## Cassandra（超大规模写王者）

### 数据模型：宽行 / 列族

```cql
CREATE TABLE sensor_data (
  sensor_id text,
  date text,
  ts timestamp,
  value double,
  PRIMARY KEY ((sensor_id, date), ts)
) WITH CLUSTERING ORDER BY (ts DESC);

-- 同一 (sensor_id, date) 是一行，内部按 ts 排序
-- 单行可存数百万 column
```

**核心特点**：
- ✅ **写吞吐顶级**：单节点 10K+ TPS，集群线性扩展（无 master）
- ✅ **可调一致性**（ONE / QUORUM / ALL）
- ✅ **多数据中心复制**
- ❌ **不支持 JOIN / 子查询 / 聚合**
- ❌ **范围查询限制多**

### Cassandra 一致性级别

```
读：    Read CL + Write CL > Replication Factor → 强一致
        例：RF=3, Write QUORUM (2), Read QUORUM (2)  → 2+2 > 3 ✅

常用组合：
- QUORUM/QUORUM：均衡（强一致 + 容忍 1 节点挂）
- ONE/ONE：低延迟（最终一致）
- LOCAL_QUORUM：跨 DC 时只看本 DC（避免跨 DC 网络延迟）
```

### LWT（Lightweight Transaction）

**Cassandra 唯一的"事务"**——基于 Paxos：

```cql
INSERT INTO users (id, email) VALUES ('u1', 'a@b.com')
IF NOT EXISTS;   -- ← LWT
```

::: warning ⚠️ LWT 极慢（10× 普通写）

> 走 Paxos 4 轮 RPC + Read repair → 单次写从 1ms 变 10-50ms。**LWT 仅用于"唯一性"等少数关键场景**，不要把 Cassandra 当 RDBMS 用。

:::

### Cassandra 数据建模 — Query-First Design

**反 RDBMS 思维**：**先看你要怎么查，再设计表**。

```cql
-- ❌ 关系思维: 一张 users 表
CREATE TABLE users (id text PRIMARY KEY, email text, name text);

-- 但如果要"按 email 查"，必须再建一张表：
CREATE TABLE users_by_email (email text PRIMARY KEY, id text, name text);
-- → 同一份数据**冗余多份**，每种 query 一张表
```

**ScyllaDB（C++ 重写版）**：性能 10× Cassandra，2024-2026 大厂选型趋势。

---

## NoSQL 选型决策树

```text
什么数据？
├─ Key-Value 缓存 → Redis
├─ Key-Value 持久化 → DynamoDB（在 AWS）/ Cosmos DB
├─ Document → MongoDB（先考虑 PostgreSQL JSONB 是否够）
├─ 时序 / 海量写 → Cassandra / ScyllaDB / TimescaleDB（PG 扩展）
├─ 关系密集 → Neo4j / 图数据库
└─ 多模型 + 云原生 + 全球分布 → Azure Cosmos DB

云栈优先：
- AWS → DynamoDB（NoSQL）/ DocumentDB（MongoDB API）
- Azure → **Cosmos DB**（多 API 全能）
- GCP → Firestore / Bigtable
- 自建 → MongoDB / Cassandra / ScyllaDB
```

---

## 数据库选型总览（OLTP / OLAP / 缓存 / 时序）

| 场景 | 首选 | 备选 |
|------|------|------|
| **OLTP 关系型** | PostgreSQL / MySQL | TiDB（分布式）|
| **OLAP 分析型** | ClickHouse / Doris / StarRocks | Snowflake / BigQuery |
| **缓存** | Redis | Memcached |
| **会话** | Redis / DynamoDB | Cosmos DB |
| **文档** | MongoDB / Cosmos DB | PG JSONB |
| **时序** | TimescaleDB / InfluxDB / VictoriaMetrics | Cassandra |
| **图** | Neo4j / Cosmos DB Gremlin | TigerGraph |
| **向量** | Milvus / Qdrant / pgvector | Pinecone |
| **全文搜索** | Elasticsearch / OpenSearch | MeiliSearch |
| **宽列海量写** | Cassandra / ScyllaDB / HBase | DynamoDB |
| **HTAP**（混合）| TiDB / OceanBase | SingleStore |

详见 [向量数据库选型](./vector-database-selection)、[数据库选型方法论](../system-design/database-selection)。

---

## 常见陷阱（必背）

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **没事别上 MongoDB** | PG JSONB 就够，多一个组件 | 默认 PG |
| **MongoDB 用多文档事务做日常** | 吞吐降 10× | 改用嵌套文档设计 |
| **DynamoDB Scan** | 慢 + 贵 + throttle | 设计阶段规划 GSI |
| **DynamoDB PK 不均匀** | Hot partition | 加随机后缀或选高基数 key |
| **Cassandra 当 RDBMS** | 没 JOIN / 没事务 | Query-First 设计 + 数据冗余 |
| **Cassandra 滥用 LWT** | 写慢 10× | LWT 仅用于唯一性 |
| **Cosmos DB 不监控 RU** | 突然 429 throttle | Azure Monitor 告警 + 慢查询审计 |
| **MongoDB shard key 选不可变字段** | 改起来要导出重导入 | 一开始选好 |
| **副本读读到旧数据** | 业务不一致 | Read Concern / 一致性级别提升 |

---

## 黄金答题模板（必背）

> **面试官：你怎么选 NoSQL？**
>
> **答**：先问 4 件事：① **数据形态**（KV / 文档 / 宽行 / 图）；② **一致性要求**（强一致 / 最终一致）；③ **规模**（GB / TB / PB）；④ **云栈**（AWS / Azure / 自建）。
>
> **常见选型**：
> - **缓存 / Session** → **Redis**（不要别的）
> - **文档场景** → **先考虑 PostgreSQL JSONB**，PG 不够再上 MongoDB
> - **AWS 重度 + Key-Value** → **DynamoDB**（单表设计 + GSI + Partition Key 均匀）
> - **Azure 重度 + 多 API + 全球分布** → **Cosmos DB**（默认 Session 一致性，钱/库存用 Bounded Staleness）
> - **超大规模写**（IoT / 时序 / 日志）→ **Cassandra / ScyllaDB**（Query-First 设计 + 适当冗余）
> - **关系密集**（社交 / 风控）→ **Neo4j**
>
> **必踩坑**：① MongoDB 多文档事务慢，应该嵌套设计；② DynamoDB 禁用 Scan，PK 必须均匀；③ Cassandra LWT 慢 10×，仅用于唯一性；④ Cosmos DB 必监控 RU，否则 429 throttle 业务暂停。
>
> **2026 趋势**："NoSQL or PG JSONB" 是经典送命题——**没有"必须 NoSQL"的场景默认选 PostgreSQL**。NoSQL 是工具，不是信仰。

---

## 看到什么就先想到这类

- **"高写吞吐 + 时序"** → Cassandra / ScyllaDB / TimescaleDB
- **"文档 + 灵活 schema"** → MongoDB 或 PG JSONB
- **"AWS 上单表查询"** → DynamoDB + 单表设计
- **"Azure 全球分布 + 多 API"** → Cosmos DB
- **"社交关系链 / 风控图"** → Neo4j
- **"缓存"** → Redis
- **"对象存储"** → [Azure Blob / S3](./cloud-storage)
- **"向量检索"** → [Milvus / Qdrant](./vector-database-selection)
- **"多文档事务"** → ⚠️ 警告，可能选错 NoSQL，重新考虑 PG
