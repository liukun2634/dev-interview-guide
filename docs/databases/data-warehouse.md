---
title: 数据仓库与 Lakehouse
---

# 数据仓库与 Lakehouse（Snowflake / BigQuery / Databricks / Redshift / Synapse）

<span class="dig-tag dig-tag--category">数据存储</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**数据仓库（DW）≠ 数据湖（Data Lake）≠ Lakehouse**。Snowflake / BigQuery / Databricks / Redshift / Azure Synapse 是 2026 OLAP / 数仓面试**必背**。能讲清三代演进、**存算分离架构**、**Snowflake Micro-partition**、**BigQuery Slot**、**Databricks Photon + Delta Lake**——立刻区分中/高级数据工程师。
:::

## 数据架构三代演进

```text
第 1 代：传统数据仓库（Teradata、Oracle Exadata、Greenplum）
  ✅ 强 SQL + ACID + 模式化
  ❌ 存算耦合、扩展难、贵、闭源

第 2 代：数据湖（Hadoop / Spark on S3）
  ✅ 廉价存储、海量数据、灵活 schema
  ❌ 没有 ACID、查询慢、治理乱（"数据沼泽"）

第 3 代：云原生数仓 / Lakehouse（Snowflake / BigQuery / Databricks）
  ✅ 存算分离 + ACID + 弹性 + 廉价对象存储
  ✅ 兼具 DW 的 SQL/事务和 Lake 的开放/灵活
  → 2024-2026 主流
```

### 数据仓库 vs 数据湖 vs Lakehouse

| 维度 | 数据仓库 | 数据湖 | **Lakehouse** |
|------|---------|--------|---------------|
| **存储** | 专有列存格式 | 对象存储 + Parquet | **对象存储 + 表格式（Iceberg / Delta）** |
| **Schema** | Schema-on-Write（先建表）| Schema-on-Read | **可选** |
| **ACID** | ✅ | ❌ | ✅（表格式提供）|
| **Time Travel** | ❌ | ❌ | ✅ |
| **数据类型** | 结构化 | 结构化 / 半结构化 / 非结构化 | 全支持 |
| **代表** | Snowflake / BigQuery / Redshift | S3 + Hive / Parquet | **Databricks / Apache Iceberg + Trino** |
| **2026 趋势** | 仍主流 | 已被 Lakehouse 取代 | **新项目首选** |

---

## Snowflake 深度（2026 数仓王者）

**Snowflake 2012 创立，2020 IPO 史上最大软件 IPO**。**完全云原生**，跑在 AWS / Azure / GCP 上。

### 三层架构（必背）

```text
┌────────────────────────────────────────────────────┐
│  ① Cloud Services（云服务层）                       │
│     - 查询解析、优化、元数据、ACID、权限             │
│     - 全 Snowflake 共享，无状态                     │
└─────────────────────┬──────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────┐
│  ② Compute（虚拟仓库 Virtual Warehouse）             │
│     - 每个 VW 是一组独立 MPP 节点                    │
│     - **多个 VW 共享底层数据**（关键创新）            │
│     - 按用途分：ETL / BI / Data Science              │
│     - 秒级启动 + 自动暂停 + 弹性扩容                  │
└─────────────────────┬──────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────┐
│  ③ Storage（存储层）                                │
│     - 列存 + 压缩（专有 FDN 格式）                   │
│     - 跑在 S3 / Azure Blob / GCS 上                 │
│     - Micro-partition（自动分区，16MB 不可变）       │
└────────────────────────────────────────────────────┘
```

**核心创新：存算分离 + 多集群共享数据**

| 传统 MPP（Teradata / Redshift Classic）| **Snowflake** |
|------|------|
| 存算耦合，扩存储 = 扩计算 | **独立扩**，存储无限便宜 |
| 多业务争抢资源 | **多 VW 隔离**，BI 不影响 ETL |
| 关机不省钱 | **VW 暂停 = 0 计算费**，只付存储 |

### Snowflake Micro-partition

```text
传统按用户写的 partition by 列分区:
  PARTITION BY date  → 一个文件代表一天，可能 GB 级
  → 文件大小不均 + 用户得手工设计

Snowflake Micro-partition:
  - 自动按写入顺序切分，16MB 一份不可变
  - 每个 micro-partition 自带"裁剪元数据"（min/max、distinct count）
  - 查询时自动跳过不命中的 micro-partition（Pruning）
```

**裁剪示例**：

```sql
-- 表有 100 万个 micro-partition
SELECT * FROM orders WHERE created_at > '2026-06-01';

-- Snowflake 元数据扫描:
--   只有 50000 个 partition 的 created_at max > '2026-06-01'
--   只扫这 50000 个 → I/O 减少 95%
```

**对比 BigQuery**：BigQuery 用 **Capacitor 格式**类似思路；ClickHouse 用 **MergeTree 跳数索引**。

### 虚拟仓库（Virtual Warehouse）规格

| 规格 | Credits/hour | 节点数 | 适用 |
|------|-------------|--------|------|
| X-Small | 1 | 1 | 小查询 / 开发 |
| Small | 2 | 2 | ↓ |
| Medium | 4 | 4 | BI 报表 |
| Large | 8 | 8 | 中等 ETL |
| X-Large | 16 | 16 | 大 ETL |
| 2X-Large | 32 | 32 | ↓ |
| 4X-Large | 128 | 128 | 海量并行 |

**$1 Credit ≈ $2-4**（按区域和合约不同）。

::: tip 💡 Snowflake 省钱真经

> ① **AUTO_SUSPEND**：60 秒无查询自动暂停（不付计算费）
> ② **AUTO_RESUME**：来查询自动启动
> ③ **不同业务用不同 VW**（避免抢资源，且独立计费可见）
> ④ **大查询用大 VW**（线性变快，不更贵——8 倍大跑 1/8 时间，钱一样）
> ⑤ **物化视图 + Result Cache**（24h 内同查询直接返）

:::

### Snowflake 独家特性

#### 1. Time Travel（时间旅行）

```sql
-- 看 1 小时前的数据
SELECT * FROM orders AT(OFFSET => -3600);

-- 看某个 query 之前的版本
SELECT * FROM orders BEFORE (STATEMENT => '8e5d0ca9-005e-44e6-b858-...');

-- 恢复被删的表
UNDROP TABLE orders;

-- 默认 1 天回溯（Enterprise+ 可设 90 天）
```

#### 2. Zero-Copy Clone（零拷贝克隆）

```sql
-- 瞬间克隆整个数据库（不复制数据）
CREATE DATABASE prod_clone CLONE prod;

-- 在 clone 上做 DDL / 实验，零成本
-- 数据真正被修改时才 Copy-on-Write
```

#### 3. Data Sharing（数据共享，跨账号无 ETL）

```sql
-- 数据提供方
CREATE SHARE sales_share;
GRANT USAGE ON DATABASE sales TO SHARE sales_share;
GRANT SELECT ON TABLE sales.orders TO SHARE sales_share;
ALTER SHARE sales_share ADD ACCOUNT = partner_account;

-- 数据消费方（partner_account）直接 SELECT
SELECT * FROM partner_db.orders;
-- 0 复制、0 ETL、毫秒级共享
```

**真实价值**：广告主和广告平台共享数据；上下游供应商共享库存——彻底打破"数据孤岛"。

#### 4. 半结构化原生支持（VARIANT）

```sql
-- 直接存 JSON
CREATE TABLE events (id INT, payload VARIANT);
INSERT INTO events SELECT 1, PARSE_JSON('{"user":"alice","actions":[1,2,3]}');

-- 直接查 JSON 字段
SELECT payload:user::STRING FROM events;
SELECT VALUE FROM events, LATERAL FLATTEN(payload:actions);
```

#### 5. Snowpark + ML Functions（2024-2026 重磅）

```python
# Snowpark Python — Spark-like API 直接在 Snowflake 跑
from snowflake.snowpark import Session
session = Session.builder.configs(conn).create()

df = session.table("orders").filter(col("amount") > 100)
df.group_by("country").agg(sum("amount")).show()

# 2024+ 集成 Snowflake Cortex（AI Functions）
SELECT
  SNOWFLAKE.CORTEX.SUMMARIZE(review_text)        as summary,
  SNOWFLAKE.CORTEX.SENTIMENT(review_text)         as sentiment,
  SNOWFLAKE.CORTEX.TRANSLATE(review_text, 'en', 'zh') as zh_text,
  SNOWFLAKE.CORTEX.COMPLETE('llama3', prompt)     as llm_result
FROM reviews;
```

### Snowflake 缺点

- ❌ **贵**：$Credit 算下来 storage $23/TB·月 + compute 按秒计
- ❌ **专有 FDN 格式**（不开放，数据迁出难）
- ❌ **跨账号需要 Data Sharing**（不能直接 SQL JOIN 别人数据）
- ❌ **2024 起逐步支持 Iceberg 外表**——挽救开放性

---

## Google BigQuery（Serverless OLAP 标杆）

### 核心创新：完全无服务器

```text
你完全看不到 "节点" 这个概念:
   提交 SQL → 自动调度 N 个 Dremel 节点 → 返回结果
   按扫描数据量 ($5/TB) 或 Slot 容量计费
```

**关键架构**：
- **存储**：**Colossus**（Google 文件系统）+ **Capacitor**（列存格式）
- **计算**：**Dremel**（MPP 查询引擎，2010 论文）
- **网络**：**Jupiter**（数据中心网络）—— 1Pb/s 带宽让"全扫"也快

### BigQuery 两种计费

| 模式 | 计费 | 适用 |
|------|------|------|
| **On-Demand**（按需）| **$5 / TB 扫描** | 偶发查询、PoC |
| **Capacity**（容量）| 月付固定 Slot 数（100 Slot $2400/月）| 稳定大量查询 |

::: warning ⚠️ On-Demand 的"账单杀手"

> 写 `SELECT * FROM big_table`（10TB 表）= $50/次。**漏掉 partition / cluster** 会让账单暴涨 10-100×。
>
> **对策**：
> - ✅ 永远 `WHERE partition_column = ...` 命中分区
> - ✅ 用 `CLUSTER BY` 减少扫描量
> - ✅ 开 **Query Approval** 防 > $10 查询
> - ✅ 切到 Capacity 模式（高频用户）

:::

### BigQuery vs Snowflake 关键对比

| 维度 | **BigQuery** | **Snowflake** |
|------|------|------|
| **架构** | Serverless（看不到节点）| 显式 Virtual Warehouse |
| **计费** | 按扫描 / Slot | 按 VW 时间 |
| **存储** | Colossus + Capacitor | S3/Blob/GCS + 专有 FDN |
| **多云** | ❌ 仅 GCP | ✅ AWS / Azure / GCP |
| **ML 集成** | **BigQuery ML**（SQL 训练模型）+ Gemini | Snowpark + Cortex AI |
| **流式插入** | 原生强 | 通过 Snowpipe |
| **GIS** | ✅ 原生 | 弱 |
| **典型场景** | GCP 用户、广告 / 营销分析 | 多云、企业 BI |

---

## Databricks + Delta Lake（Lakehouse 标杆）

### 起源

**Spark 创始团队 2013 创办**，2024 估值 $620 亿。核心理念："数据湖也能 ACID"。

### Delta Lake 架构

```text
对象存储（S3 / ADLS / GCS）:
   /warehouse/orders/
   ├── _delta_log/                       ← 事务日志（核心）
   │   ├── 0000000.json                  ← commit 1
   │   ├── 0000001.json                  ← commit 2
   │   └── 0000010.checkpoint.parquet    ← 每 10 个 commit 一次快照
   ├── part-00000-xxx.parquet            ← 数据文件
   └── part-00001-xxx.parquet
```

**ACID 怎么实现**：
- 写入是**追加新 Parquet 文件**（不修改老文件）
- `_delta_log` 记录"当前哪些文件构成最新版本"
- 读时只读 commit log 指向的文件 → **快照隔离**
- 多写者用 **Optimistic Concurrency Control** 冲突重试

### Delta Lake 核心特性

```sql
-- Time Travel
SELECT * FROM orders VERSION AS OF 10;
SELECT * FROM orders TIMESTAMP AS OF '2026-06-01';

-- MERGE（UPSERT）
MERGE INTO orders t
USING new_orders s
ON t.id = s.id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

-- 数据修复（GDPR 删除特定用户）
DELETE FROM orders WHERE user_id = 'u123';

-- 自动优化
OPTIMIZE orders ZORDER BY (user_id, created_at);  -- 数据共址
VACUUM orders RETAIN 168 HOURS;                    -- 清理旧文件
```

### Databricks Photon（C++ 重写查询引擎）

**问题**：Spark 用 JVM，性能不如 C++ 原生 MPP。

**Photon**：完全 C++ 重写 Spark SQL 执行层，**2-12× 加速**，2024 起默认开启。

### Unity Catalog（统一数据治理）

```sql
-- 三层命名空间
SELECT * FROM main_catalog.sales_schema.orders;

-- 跨工作区共享 + 细粒度权限
GRANT SELECT ON TABLE sales.orders TO `analytics_team`;
GRANT SELECT ON COLUMN sales.users.email TO ROLE pii_reader;

-- Lineage（自动追踪表→表 数据流）
-- 谁动了我的数据？Unity Catalog 看一眼
```

### Databricks vs Snowflake 决战（2026 热点）

| 维度 | **Databricks** | **Snowflake** |
|------|------|------|
| **基因** | Spark + Lakehouse 开放 | 传统 DW 云原生化 |
| **存储** | **开放**（Delta / Iceberg / Parquet）| 专有 FDN（2024+ 支持 Iceberg）|
| **AI / ML** | **王者**（MLflow / Mosaic / Dolly）| 弱（Cortex 追赶中）|
| **流式** | Spark Structured Streaming 强 | Snowpipe |
| **BI 友好度** | 中（需要 SQL Warehouse）| **极强**（DW 基因）|
| **数据科学家** | **首选**（notebook 强）| 不擅长 |
| **典型客户** | AI 公司、互联网 | 金融、零售、传统企业 |

::: tip 💡 Snowflake or Databricks？

> **如果团队是 SQL + BI 为主** → Snowflake
> **如果团队有大量 ML / AI 工作 + Spark 经验** → Databricks
> **如果想要数据开放（避免锁定）** → Databricks + Iceberg
> **新项目 2026 趋势**：**Lakehouse + Iceberg + 多引擎**（Databricks + Snowflake + Trino 同读一份数据）

:::

---

## AWS Redshift / Azure Synapse / 其他

### AWS Redshift

| 维度 | 说明 |
|------|------|
| **架构** | Leader Node + Compute Nodes（MPP）|
| **存储** | 共享存储（RA3）/ 本地（DC2）|
| **特色** | **Redshift Spectrum** — 直查 S3 Parquet 不导入 |
| **Serverless** | Redshift Serverless（2022）按使用付费 |
| **vs Snowflake** | 更便宜、AWS 集成深，但弹性 / 易用性差 |

### Azure Synapse Analytics

| 维度 | 说明 |
|------|------|
| **架构** | SQL Pool（专用 / Serverless）+ Spark Pool + Pipelines |
| **特色** | **一站式**：DW + 数据湖 + ETL + Power BI 集成 |
| **存储** | ADLS Gen2 |
| **vs Snowflake** | Azure 生态深、Microsoft 客户首选；功能完整度不如 Snowflake |

**2024 起 Azure 主推 Fabric**（统一 Synapse / Power BI / Data Factory）。

### 对比矩阵

| 维度 | Snowflake | BigQuery | Databricks | Redshift | Synapse / Fabric |
|------|-----------|----------|-----------|----------|-----------------|
| **多云** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Serverless** | 半（VW 自动暂停）| ✅ | 半 | ✅ Serverless | ✅ Serverless Pool |
| **Lakehouse** | 2024+（Iceberg）| 2024+（Iceberg）| **✅ 原生** | 2024+（Iceberg）| ✅（Delta + Parquet）|
| **AI / ML** | Cortex | BQ ML / Gemini | **MLflow / Mosaic** | 弱 | 中（PromptFlow）|
| **流式** | Snowpipe / Streaming | 原生强 | **Spark Streaming** | Kinesis | Stream Analytics |
| **BI 集成** | 强 | 强（Looker）| 中 | 强（QuickSight）| **强（Power BI）** |
| **定价模型** | Compute Credits + 存储 | 按扫描 / Slot | DBU + 存储 | 节点小时 / 按使用 | DWU / vCore |

---

## Lakehouse 表格式（Iceberg vs Delta Lake vs Hudi）

**2026 数据湖 ACID 三巨头**——已在 [RAG/对象存储/数据湖](./cloud-storage#iceberg-delta-lake-hudi-对比2026-热点) 介绍。

### 2026 决战

```text
2023 之前：三家割据
  - Delta Lake → Databricks 独占
  - Iceberg → Netflix / Apple / Cloudera
  - Hudi → Uber / 字节

2024 转折：
  - Databricks 收购 Tabular（Iceberg 母公司）→ 全面拥抱 Iceberg
  - Snowflake 支持 Iceberg 外表 + Iceberg 原生表
  - AWS Glue / BigQuery / Trino 全部主推 Iceberg
  → Iceberg 成为事实标准
```

**2026 新项目建议**：**Iceberg + 任意计算引擎**（Spark / Trino / Flink / Snowflake 都能读）。

---

## 数仓分层（必背基础）

**典型 ODS → DWD → DWS → ADS 4 层**（国内业界事实标准）：

| 层 | 全称 | 内容 | 例子 |
|----|------|------|------|
| **ODS**（Operational Data Store）| 操作数据层 | 原始数据 1:1 复制，不做加工 | 业务库 CDC 同步过来 |
| **DWD**（Data Warehouse Detail）| 明细数据层 | 清洗、维度退化、宽表化 | 订单宽表（含商品 / 用户维度）|
| **DWS**（Data Warehouse Summary）| 汇总数据层 | 按业务主题聚合 | 用户每日下单数 / GMV |
| **ADS**（Application Data Service）| 应用数据层 | 给报表 / API 用 | 大屏指标 / 用户画像 |

详见 [数据库选型方法论](../system-design/database-selection)。

---

## 实时数仓（OLAP 新方向）

**离线数仓 T+1 已不够**——电商大促实时大屏、风控秒级决策都需要 OLAP 引擎。

| 引擎 | 强项 | 弱项 | 选型 |
|------|------|------|------|
| **ClickHouse** | **单表聚合王者**（亿级秒级）| JOIN 弱、缺事务 | 单表大宽表、互联网指标 |
| **Apache Doris**（前 Palo）| **JOIN 好 + MySQL 协议**、易用 | 国内为主 | 国内大厂选型 |
| **StarRocks**（Doris fork）| Doris 升级版、性能更强 | 同上 | 国内大厂 |
| **Apache Pinot** | **超低延迟实时**（< 100ms）| 灵活性差 | LinkedIn / Uber 实时指标 |
| **Apache Druid** | 时序聚合优 | 复杂 | 监控 / 物联网 |
| **DuckDB** | **嵌入式 OLAP**（SQLite for analytics）| 单机 | 单机分析、Notebook |
| **Trino** / **Presto** | **联邦查询**（Hive + S3 + MySQL）| 不存数据 | Lakehouse 查询引擎 |

详见 [向量数据库选型](./vector-database-selection)（如果业务有向量）。

---

## 黄金答题模板（必背）

> **面试官：Snowflake / BigQuery / Databricks 怎么选？**
>
> **答**：按**云栈 + 团队基因 + 需求**决策：
>
> **按云栈**：
> - 多云 / Azure / AWS / 不锁定 → **Snowflake**
> - GCP 重度 → **BigQuery**
> - Azure 重度 → **Synapse / Fabric**（一站式 + Power BI）
> - AWS 重度 + 成本敏感 → **Redshift Serverless**
>
> **按团队基因**：
> - **SQL + BI 为主**（金融、零售、传统）→ **Snowflake**（最易用、最稳）
> - **数据科学 + ML 重度** → **Databricks**（MLflow / Mosaic / Notebook 强）
> - **完全 Serverless 不想运维** → **BigQuery**
>
> **按 2024-2026 趋势**：**Lakehouse + Iceberg**——存数据用 S3 / ADLS + Iceberg，查数据用任意引擎（Snowflake / Databricks / Trino / DuckDB），**避免厂商锁定**。
>
> **Snowflake 核心创新讲法**：存算分离（VW 暂停 0 计算费）+ Micro-partition（自动 Pruning）+ Zero-Copy Clone + Data Sharing 跨账号 0 ETL + 2024 Cortex AI 函数 SQL 直调 LLM。
>
> **必踩坑**：① BigQuery On-Demand 漏写 partition = $50/次；② Snowflake 大 VW 不暂停烧钱；③ Databricks 不用 Photon = 浪费 5×；④ Redshift Concurrency Scaling 没配 = 高峰挂掉。

---

## 看到什么就先想到这类

- **"SQL + BI + 多云"** → Snowflake
- **"GCP 上的 OLAP"** → BigQuery
- **"AI / ML + Notebook"** → Databricks
- **"Azure 一站式"** → Synapse / Fabric
- **"AWS 数据湖直查"** → Redshift Spectrum + Athena
- **"实时大屏 / 单表聚合"** → ClickHouse / Doris / StarRocks
- **"嵌入式分析"** → DuckDB
- **"联邦查询 Hive + S3 + MySQL"** → Trino / Presto
- **"避免厂商锁定"** → **Iceberg** + 多引擎
- **"Snowflake 怎么省钱"** → AUTO_SUSPEND + 大 VW 跑大查询 + Result Cache
- **"BigQuery 怎么省钱"** → 必走 partition + cluster，或转 Capacity
- **"实时 + 离线一套"** → TiDB HTAP / Databricks Lakehouse / 阿里 Hologres
