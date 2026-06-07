---
title: PostgreSQL 深度
---

# PostgreSQL 深度（vs MySQL 决策、2026 必备）

<span class="dig-tag dig-tag--category">关系型数据库</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**2026 PostgreSQL 已是大多数新项目首选**——不是因为 MySQL 不好，而是 **PG 的扩展生态（pgvector / TimescaleDB / PostGIS / FDW）让"一个 PG 解决 80% 数据需求"**。能讲清"**MVCC 实现差异（in-place vs append-only）**"、"**JSONB 怎么替代 MongoDB**"、"**PG 17 新特性**" 立刻区分中/高级。
:::

## 为什么 PG 2026 越来越火

### 国内外趋势

| 时间 | 趋势 |
|------|------|
| 2010 之前 | MySQL > PostgreSQL（互联网偏好）|
| 2015-2020 | 平分秋色（PG 慢慢追上）|
| 2020-2023 | **PG 加速超车**（JSONB / 并行查询 / 逻辑复制成熟）|
| **2024-2026** | **PG 成新项目默认选择**（pgvector 火爆推波助澜）|

**核心原因**：
1. ✅ **扩展生态爆炸**：pgvector（向量）、TimescaleDB（时序）、PostGIS（GIS）、Citus（分片）、AGE（图）、pg_cron（调度）
2. ✅ **JSONB > MongoDB**：替代 80% 的 MongoDB 场景，还有 ACID 事务
3. ✅ **AI 时代红利**：所有 RAG 教程都用 pgvector 起手
4. ✅ **企业级特性**：CTE / 窗口函数 / Materialized View / Partition / 高级类型，MySQL 多年才补齐
5. ✅ **Aurora PG / Cloud SQL / RDS PG** 让运维和 MySQL 一样简单

---

## PostgreSQL vs MySQL 深度对比（必背）

### 全维度对比表

| 维度 | **MySQL 8.x** | **PostgreSQL 16-17** |
|------|--------------|----------------------|
| **协议 / 哲学** | 开源 GPL，互联网风格 | BSD 类似，学院派"对的事情"|
| **存储引擎** | InnoDB（主）/ MyISAM | 单一存储引擎 |
| **MVCC 实现** | **回滚段 undo log**（in-place 更新）| **多版本元组**（append-only）|
| **JSON** | 5.7+ JSON 类型（仍以字符串校验为主）| **JSONB**（二进制 + 完整索引）|
| **窗口函数** | 8.0+ | 9.0+（早 6 年）|
| **CTE / 递归查询** | 8.0+ | 8.4+（早 8 年）|
| **物化视图** | ❌ 仍不支持 | ✅ 原生 |
| **数组 / Range / 自定义类型** | ❌ | ✅ |
| **存储过程语言** | SQL only | **PL/pgSQL / Python / Perl / R / JavaScript** |
| **复制** | 主从 / 组复制（MGR）| **流复制 + 逻辑复制**（PostgreSQL 主推）|
| **分区** | 6 种 | 9 种 + 子分区 |
| **全文搜索** | 简易 | **原生强**（tsvector / ts_rank） |
| **GIS** | 简易 | **PostGIS**（全球 GIS 标杆）|
| **向量** | 8.0+ 集成 | **pgvector**（全球 RAG 事实标准）|
| **触发器** | 弱 | **强**（多种类型，可写复杂逻辑）|
| **JOIN 算法** | Nested Loop / Hash（8.0+）| **Nested Loop / Hash / Merge** |
| **并发** | InnoDB 行锁 | **MVCC + 多种锁等级** |
| **VACUUM** | 不需要 | **需要**（MVCC 副作用）|
| **生态** | 互联网用户多 | **学术 / 金融 / GIS / AI** |
| **典型大用户** | 国内大厂、互联网 | **Apple / Instagram / Stripe / Coinbase** |

### MVCC 实现差异（面试 Top 必背）

```text
═══════════════════════════════════════════════════════════════
MySQL InnoDB MVCC（in-place + undo log）
═══════════════════════════════════════════════════════════════

UPDATE users SET age=30 WHERE id=1;

  数据页:                    Undo Log Segment:
  ┌─────────────────┐       ┌─────────────────────────┐
  │ id=1, age=30    │ ────→ │ 旧版本: id=1, age=25    │
  │ trx_id=100      │       │ trx_id=99               │
  │ roll_ptr        │       └─────────────────────────┘
  └─────────────────┘

旧事务读: 顺 roll_ptr 跳到 undo log 找历史版本
特点: 数据原地更新 + undo 链构建历史 → 数据页紧凑

═══════════════════════════════════════════════════════════════
PostgreSQL MVCC（append-only 多版本元组）
═══════════════════════════════════════════════════════════════

UPDATE users SET age=30 WHERE id=1;

  数据页:
  ┌──────────────────────────────────────┐
  │ Tuple1: id=1, age=25                 │  ← 旧版本（dead）
  │   xmin=99, xmax=100                  │     xmax=100 标记被事务 100 删
  │                                       │
  │ Tuple2: id=1, age=30                 │  ← 新版本（live）
  │   xmin=100, xmax=∞                   │
  └──────────────────────────────────────┘

特点:
  - 每次更新都"插入新版本 + 标记旧版本死亡"
  - 不需要 undo log（旧版本就在原表）
  - 旧事务直接读旧 tuple（更快）
  - 副作用: 表会膨胀 → 必须 VACUUM 清理
```

**对比含义**：

| 维度 | MySQL（in-place）| PostgreSQL（append-only）|
|------|----------------|------------------------|
| **更新性能** | 快（数据页原地改）| 略慢（写新元组）|
| **历史读性能** | **慢**（跳 undo 链）| **快**（旧元组就在表里）|
| **回滚** | **快**（undo log 反向）| 慢（需扫描标记）|
| **死亡元组清理** | 不需要（undo 自动）| **VACUUM 必备** |
| **HOT 长事务** | undo 段可能爆炸 | **表膨胀严重** |

::: warning ⚠️ PostgreSQL VACUUM 是 2026 面试必问

> **VACUUM 是 PG 的"必要之恶"**——清理死亡元组、回收空间、防止 XID 回绕灾难。
>
> ① **AUTOVACUUM**（默认开）：后台自动清理；
> ② **VACUUM FULL**：重建表，锁表慢，少用；
> ③ **长事务杀手**：长事务阻止 VACUUM 清理 → 表膨胀爆炸；
> ④ **XID 回绕**：32 位事务 ID 用完会数据丢失，**生产必须监控** `pg_stat_activity` + `pg_database.datfrozenxid`。

:::

---

## PostgreSQL 高级特性深度（面试加分点）

### 1. JSONB — 替代 MongoDB 的 80% 场景

```sql
-- 创建 JSONB 字段
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    data JSONB
);

INSERT INTO products (data) VALUES
  ('{"name":"iPhone","tags":["phone","apple"],"price":999}'),
  ('{"name":"Pixel","tags":["phone","google"],"price":799}');

-- 索引 JSONB（GIN）
CREATE INDEX idx_products_data ON products USING GIN (data);

-- 富查询
SELECT * FROM products WHERE data->>'name' = 'iPhone';
SELECT * FROM products WHERE data @> '{"tags":["phone"]}';     -- 包含
SELECT * FROM products WHERE data ? 'discount';                 -- 存在 key
SELECT * FROM products WHERE (data->>'price')::INT > 800;
```

**JSONB 性能对比 MongoDB**：

| 场景 | PG JSONB | MongoDB |
|------|---------|---------|
| **点查 by JSON 字段** | 与 MongoDB 持平（GIN 索引）| - |
| **复杂关系 JOIN** | **强**（PG 本职）| 弱（$lookup 慢）|
| **事务** | **强 ACID** | 多文档事务慢 10× |
| **聚合分析** | **窗口函数 + CTE** | Aggregation Pipeline |
| **运维** | 同 PG | 单独维护 |

::: tip 💡 决策原则

> **没有"必须 MongoDB"的理由 → 默认选 PG JSONB**。MongoDB 适合：① 文档极度嵌套；② 单 Collection 数十亿行；③ 跨地域 sharding 必需。

:::

### 2. CTE 与递归查询（面试常考）

```sql
-- 普通 CTE: 提高可读性
WITH active_users AS (
  SELECT * FROM users WHERE active = true
),
recent_orders AS (
  SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '7 days'
)
SELECT au.name, COUNT(ro.id) AS orders_count
FROM active_users au
LEFT JOIN recent_orders ro ON au.id = ro.user_id
GROUP BY au.name;

-- 递归 CTE: 树形结构（组织架构、评论嵌套）
WITH RECURSIVE org_tree AS (
  SELECT id, name, manager_id, 1 AS level
  FROM employees WHERE manager_id IS NULL    -- 锚点：根节点

  UNION ALL

  SELECT e.id, e.name, e.manager_id, t.level + 1
  FROM employees e
  JOIN org_tree t ON e.manager_id = t.id     -- 递归
)
SELECT * FROM org_tree ORDER BY level, name;
```

### 3. 窗口函数（OLAP 必备）

```sql
-- 每个部门 Top 3 工资
SELECT * FROM (
  SELECT name, dept, salary,
         RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rk
  FROM employees
) t WHERE rk <= 3;

-- 同比环比
SELECT month, sales,
  LAG(sales, 1) OVER (ORDER BY month) AS last_month,
  sales - LAG(sales, 1) OVER (ORDER BY month) AS mom_diff,
  100.0 * (sales - LAG(sales, 12) OVER (ORDER BY month))
       / LAG(sales, 12) OVER (ORDER BY month) AS yoy_pct
FROM monthly_sales;

-- 累计求和
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) AS cumulative
FROM transactions;
```

### 4. 物化视图（Materialized View）

```sql
-- 创建物化视图（持久化查询结果）
CREATE MATERIALIZED VIEW mv_daily_sales AS
SELECT date_trunc('day', created_at) AS day, SUM(amount) AS total
FROM orders GROUP BY 1;

-- 刷新（可选 CONCURRENTLY 不锁读）
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;

-- 查询时性能等同表
SELECT * FROM mv_daily_sales WHERE day > '2026-01-01';
```

**面试加分**："MySQL 没有物化视图，常用 PG 这一项做报表预聚合，比应用层重新算快 10-100×"。

### 5. 分区表（Partitioning）

```sql
-- 按月分区（适合时序数据）
CREATE TABLE measurements (
    id BIGSERIAL,
    time TIMESTAMPTZ NOT NULL,
    sensor_id INT,
    value DOUBLE PRECISION
) PARTITION BY RANGE (time);

CREATE TABLE measurements_2026_01 PARTITION OF measurements
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE measurements_2026_02 PARTITION OF measurements
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- 自动 partition pruning
EXPLAIN SELECT * FROM measurements WHERE time > '2026-02-15';
--   只扫 measurements_2026_02（其他分区跳过）
```

### 6. 数组类型 + Range 类型

```sql
-- 数组（MySQL 没有）
CREATE TABLE tags (id INT, labels TEXT[]);
INSERT INTO tags VALUES (1, ARRAY['vip','engineer','beijing']);
SELECT * FROM tags WHERE 'vip' = ANY(labels);

-- Range 类型（时间范围、IP 范围）
CREATE TABLE bookings (
    room_id INT,
    during TSTZRANGE,
    EXCLUDE USING GIST (room_id WITH =, during WITH &&)  -- 防止同房间时间重叠
);
```

### 7. 强大的 EXPLAIN

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders o JOIN users u ON o.user_id = u.id
WHERE o.created_at > '2026-01-01';

-- 输出示例
-- Hash Join  (cost=12.50..235.00 rows=1234 width=80) (actual time=0.5..2.3 rows=1200 loops=1)
--   Hash Cond: (o.user_id = u.id)
--   Buffers: shared hit=120 read=5      ← 缓存命中 vs 磁盘读
--   ->  Seq Scan on orders o  (cost=...)
--   ->  Hash  (cost=...)
--         ->  Seq Scan on users u
-- Planning Time: 0.123 ms
-- Execution Time: 2.456 ms
```

**比 MySQL EXPLAIN 强在**：
- ✅ `ANALYZE`：实际执行 + 真实时间（MySQL 8.0+ 也有了）
- ✅ `BUFFERS`：缓冲池命中详情
- ✅ 详细到每个算子的 cost / rows / actual time
- ✅ 文本 / JSON / YAML 格式

---

## PostgreSQL 17 新特性（2024.9 发布，2026 必懂）

| 特性 | 价值 |
|------|------|
| **UUID v7 原生支持** | `uuidv7()` 内置函数，时序有序 + 无冲突 |
| **流式 IO 重写** | Sequential Scan 提速 30-50% |
| **`pg_basebackup` 增量备份** | 备份只复制变化部分 |
| **VACUUM 内存效率改进** | 大表 VACUUM 内存占用大幅降低 |
| **MERGE 增强**（RETURNING）| 一条 MERGE 同时返回插入/更新行 |
| **JSON_TABLE** | 把 JSONB 解析为关系表（SQL 标准）|
| **逻辑复制改进**（failover slots）| 灾难恢复更平滑 |
| **planner 改进** | 复杂查询性能改进 |

**示例**：

```sql
-- UUID v7 原生
SELECT uuidv7();   -- 0190fb7e-...（前缀含时间戳，天然有序）

-- JSON_TABLE（SQL 标准）
SELECT jt.*
FROM products,
  JSON_TABLE(data, '$.tags[*]' COLUMNS (
    tag TEXT PATH '$'
  )) jt;

-- MERGE + RETURNING
MERGE INTO inventory t USING orders s ON t.product_id = s.product_id
WHEN MATCHED THEN UPDATE SET qty = t.qty - s.qty
WHEN NOT MATCHED THEN INSERT (product_id, qty) VALUES (s.product_id, -s.qty)
RETURNING t.product_id, t.qty;
```

---

## PostgreSQL 扩展生态（"一个 PG 解决一切"）

**面试金句**："PostgreSQL 已不是 RDBMS，而是数据管理平台"。

| 扩展 | 用途 | 替代谁 |
|------|------|--------|
| **pgvector** | 向量检索 | Milvus / Pinecone（小规模）|
| **TimescaleDB** | 时序数据 | InfluxDB / Druid |
| **PostGIS** | 地理空间 | （行业标杆，无替代）|
| **Citus** | 分片 / 分布式 | TiDB（部分场景）|
| **AGE**（Apache）| 图查询（Cypher）| Neo4j（中小图）|
| **pg_cron** | 任务调度 | Airflow（小型）|
| **pg_stat_statements** | 慢查询分析 | 必装 |
| **pg_partman** | 自动分区管理 | 必装（分区表用户）|
| **plv8** | JavaScript 存储过程 | - |
| **postgres_fdw** | 跨 PG 联邦查询 | - |
| **wal2json / Debezium** | CDC 实时数据流 | - |

### pgvector 实战

```sql
-- 安装扩展
CREATE EXTENSION vector;

-- 创建表 + 向量索引
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding VECTOR(1536)   -- OpenAI ada-002 维度
);

CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- 检索
SELECT id, content, embedding <=> $1 AS distance
FROM documents
ORDER BY embedding <=> $1
LIMIT 10;
```

**2026 RAG 选型铁律**：
- 数据 < 1M 向量 + 已有 PG → **pgvector**（首选）
- 数据 > 10M + 高吞吐 → Milvus / Qdrant
- 详见 [向量数据库选型](./vector-database-selection)

### TimescaleDB 实战

```sql
-- 把普通表变时序超表
SELECT create_hypertable('measurements', 'time');

-- 时序专用聚合（窗口函数 + 时间桶）
SELECT
  time_bucket('1 hour', time) AS hour,
  sensor_id,
  AVG(value) AS avg_value
FROM measurements
WHERE time > NOW() - INTERVAL '1 day'
GROUP BY hour, sensor_id;

-- 连续聚合（自动维护汇总表）
CREATE MATERIALIZED VIEW measurements_hourly
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS hour, sensor_id, AVG(value)
FROM measurements GROUP BY 1, 2;
```

---

## PostgreSQL 复制（主从 / 流复制 / 逻辑复制）

### 三种复制模式

| 模式 | 同步性 | 适用 |
|------|-------|------|
| **异步流复制** | 异步 | 默认，高吞吐 |
| **同步流复制** | 同步（主等从 ack）| 金融、零数据丢失 |
| **逻辑复制** | 异步，**表级别** | 跨大版本、跨实例选择性同步 |

```sql
-- 主库
CREATE PUBLICATION pub_orders FOR TABLE orders, users;

-- 从库
CREATE SUBSCRIPTION sub_orders
  CONNECTION 'host=master port=5432 dbname=mydb user=replicator'
  PUBLICATION pub_orders;
```

**逻辑复制典型用途**：
- ✅ **跨大版本升级**（PG 14 → 17 零停机）
- ✅ **跨地域多活**
- ✅ **CDC 到 Kafka / Iceberg**（接 Debezium）
- ❌ DDL 不复制（需手动两边都执行）

---

## PostgreSQL 高可用方案

| 方案 | 厂商 / 实现 | 特色 |
|------|----------|------|
| **Patroni** | Zalando | **开源主流**，配合 etcd / Consul 做 leader 选举 |
| **PgPool-II** | - | 老牌，连接池 + 负载均衡 + 自动 failover |
| **pgBackRest** | - | 备份恢复王者 |
| **Citus** | Citus Data（已被微软收购）| **水平分片**，做分布式 PG |
| **YugabyteDB** | - | PG 协议兼容 + Raft 分布式（[NewSQL](./distributed-databases)）|
| **CockroachDB** | - | PG 兼容 + 全球分布 |
| **Aurora PostgreSQL** | AWS | 共享存储 + 多 Read Replica |
| **Azure Database for PostgreSQL** | Azure | Flexible Server + Cosmos DB for PostgreSQL（Citus 升级版）|
| **Cloud SQL / AlloyDB** | GCP | AlloyDB AI 集成深 |

---

## 何时还该选 MySQL（2026 仍然适合的场景）

**虽然 PG 强，但 MySQL 仍是某些场景的最佳选择**：

| 场景 | 为什么 MySQL 更好 |
|------|----------------|
| **国内互联网大厂技术栈** | 团队都熟 MySQL、生态文档多 |
| **极高写吞吐 + 简单 schema** | InnoDB in-place 更新略快 |
| **简单 CRUD + 读多** | MySQL 内置 query cache（虽然 8.0 取消了）+ 简单 |
| **现有 MySQL 系统不重写** | 不要为了"先进"重构 |
| **TiDB / OceanBase 迁移** | 这俩都兼容 MySQL 协议 |
| **共享 Aurora MySQL** | AWS 上 MySQL 比 PG 略便宜 |

---

## 黄金答题模板（必背）

> **面试官：新项目你选 MySQL 还是 PostgreSQL？**
>
> **答**：**2026 默认首选 PostgreSQL**——除非有 3 个具体场景：① 团队已深度 MySQL 化；② 计划迁 TiDB / OceanBase；③ 现有系统不重写。
>
> **PG 优势**：
> ① **扩展生态爆炸**——pgvector（RAG 必备）+ TimescaleDB（时序）+ PostGIS（GIS）+ Citus（分布式），"**一个 PG 解决 80% 数据需求**"；
> ② **JSONB 替代 MongoDB**——还有 ACID 事务，复杂关系不用 $lookup；
> ③ **企业级 SQL**——CTE 递归 / 窗口函数 / 物化视图 / 分区 / 数组 / Range，MySQL 多年才补齐；
> ④ **MVCC 设计先进**——append-only 元组让历史读快、回滚有代价但 VACUUM 解决；
> ⑤ **PG 17 新红利**——`uuidv7()`、流式 IO、增量备份、JSON_TABLE。
>
> **MVCC 差异（必背）**：MySQL **in-place + undo log**（更新快、历史读慢）；PG **append-only 多版本元组**（更新略慢、历史读快、必须 VACUUM 防表膨胀）。
>
> **必踩坑**：① **VACUUM** 长事务阻塞会让表膨胀爆炸；② **XID 32 位回绕** 必须监控；③ **HOT UPDATE** 优化要求所有索引列不变；④ 默认 `max_connections=100` 高并发场景需用 **PgBouncer** 连接池。

---

## 看到什么就先想到这类

- **"2026 新项目"** → PostgreSQL（默认）
- **"灵活 schema"** → PG JSONB（不要先想 MongoDB）
- **"RAG / 向量检索"** → pgvector（< 10M 向量）
- **"时序 / IoT"** → TimescaleDB
- **"地理空间"** → PostGIS（无替代）
- **"复杂报表 / 物化视图"** → PG
- **"递归查询 / 组织树"** → PG CTE
- **"表膨胀 / VACUUM 异常"** → 长事务在阻塞
- **"XID 回绕告警"** → 立即 VACUUM FREEZE
- **"PG 高并发崩"** → PgBouncer 连接池
- **"国内大厂迁 OceanBase / TiDB"** → 仍选 MySQL 协议
- **"跨地域 PG 多活"** → Citus / YugabyteDB / CockroachDB
