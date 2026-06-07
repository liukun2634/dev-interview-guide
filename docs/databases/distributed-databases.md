---
title: 分布式数据库（NewSQL）
---

# 分布式数据库 NewSQL（TiDB / CockroachDB / Spanner / YugabyteDB / OceanBase）

<span class="dig-tag dig-tag--category">数据存储</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**NewSQL = SQL + 强一致 + 水平扩展**——既不像 MySQL 单机有上限，也不像 NoSQL 牺牲事务。2026 大厂面试**必问**：你为什么选 TiDB 而不是 MySQL 分库分表？Raft / Paxos / Percolator 怎么实现跨节点事务？Snowflake Schema 的全局唯一 ID 怎么生成？
:::

## 概念

### 三代数据库演进

```text
第 1 代：传统 RDBMS（MySQL / PostgreSQL / Oracle）
   ✅ ACID + SQL
   ❌ 单机扩展上限：~ 千万行/单表，~ 5K QPS

第 2 代：NoSQL（MongoDB / Cassandra / DynamoDB）
   ✅ 横向扩展、超高吞吐
   ❌ 牺牲 SQL + 牺牲事务（最终一致）

第 3 代：NewSQL（TiDB / CockroachDB / Spanner / OceanBase / YugabyteDB）
   ✅ SQL + 强一致 + 横向扩展（兼得）
   ❌ 复杂运维 + 跨节点事务成本（10-100ms）
```

### NewSQL vs MySQL 分库分表（必背追问）

| 维度 | **MySQL 分库分表** | **NewSQL（TiDB 等）** |
|------|---------------|-------------------|
| **跨分片 JOIN** | ❌ 不支持，必须业务层拼 | ✅ 原生支持 |
| **跨分片事务** | ❌ XA 慢且不稳 | ✅ Percolator / 2PC |
| **扩缩容** | **手动重新分片**（数月工程）| **加节点自动 rebalance**（小时） |
| **全局二级索引** | ❌ 只能查 shard key | ✅ 原生 |
| **DDL 不停机** | ❌ 需 gh-ost / pt-osc | ✅ Online DDL |
| **业务改造** | **每张表都要改**（加 shard key）| **几乎零改造**（兼容 MySQL 协议）|
| **成本** | 便宜 + 成熟 | **贵 2-5×** + 团队学习曲线 |
| **运维门槛** | 中 | 高（K8s / TiUP / 多组件）|

::: warning ⚠️ 选 NewSQL 的关键阈值

> ① **数据量超过 10TB** 或 **单表 10 亿行**——MySQL 分库分表力不从心；
> ② **跨业务 JOIN 频繁**——分库分表代码层拼会崩溃；
> ③ **不可停机扩容**——电商大促前临时扩容场景；
> ④ **全球部署 + 强一致**——只有 Spanner / CockroachDB / YugabyteDB 能做。
>
> **不够痛就别上**：单库百亿数据用 MySQL 分表 + Read Replica 完全可行。

:::

---

## NewSQL 选型对比（2026 主流）

### 选型矩阵

| 产品 | 厂商 | SQL 兼容 | 共识 | 强项 | 弱项 |
|------|------|---------|------|------|------|
| **TiDB** | PingCAP（中国）| **MySQL 5.7/8.0** | Raft（Multi-Raft）| **生态最广、HTAP、运维友好** | 写延迟 5-20ms |
| **OceanBase** | 阿里/蚂蚁 | MySQL / Oracle 双兼容 | Paxos | **金融级、阿里淘宝/支付宝实战** | 闭源主线、社区版功能阉割 |
| **CockroachDB** | Cockroach Labs | **PostgreSQL** | Raft | **全球分布、地理感知** | License 收紧（2024 改 CCL）|
| **YugabyteDB** | Yugabyte | **PostgreSQL + Cassandra 双 API** | Raft | 开源 Apache 2.0、PG 生态完整 | 国内案例少 |
| **Spanner** | Google Cloud | 自有 SQL（类 PG）| Paxos + TrueTime | **全球外部一致性**、最强一致性模型 | 仅 GCP、贵 |
| **Aurora** | AWS | **MySQL / PostgreSQL** | 共享存储（非真正 NewSQL）| AWS 集成深、读写分离强 | 单写节点（写不水平扩展）|
| **SingleStore**（前 MemSQL）| SingleStore | **MySQL** | **HTAP 极速** | **内存优先、列存 + 行存混合** | 商业、贵 |
| **PolarDB** | 阿里云 | MySQL / PG / Oracle | 共享存储 | 阿里云生态、Serverless | 仅阿里云 |

### 决策树

```text
你的业务是什么？
├─ 金融、支付、库存 → OceanBase / Spanner（最强一致）
├─ 全球分布 / 多地多活 → CockroachDB / Spanner / YugabyteDB
├─ MySQL 迁移 + HTAP → TiDB（首选）
├─ PostgreSQL 用户 → YugabyteDB / CockroachDB
├─ 仅在 AWS → Aurora（不是真分布式，但够用）
└─ 仅在阿里云 → PolarDB
```

---

## TiDB 深度（国内最主流）

**2026 国内大厂 NewSQL 事实标准**——美团、字节、平安、知乎、米哈游都在用。

### 架构（必背）

```text
                ┌────────────────┐
                │   TiDB Server  │  ← 计算层（无状态）
                │   (SQL 引擎)    │     多个，按 LB 分流
                └────────┬───────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌────────┐       ┌────────┐       ┌────────┐
   │  TiKV  │       │  TiKV  │       │  TiKV  │ ← 行存（OLTP）
   │ (Raft) │       │ (Raft) │       │ (Raft) │     Multi-Raft
   └────┬───┘       └────┬───┘       └────┬───┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ┌────▼────┐
                    │   PD    │  ← 元数据 + 调度
                    │ (Raft)  │     Placement Driver
                    └─────────┘

  另起一组列存（HTAP）:
   ┌────────┐       ┌────────┐
   │TiFlash │       │TiFlash │  ← 列存（OLAP）
   └────────┘       └────────┘     与 TiKV 实时同步
```

**四大组件**：

| 组件 | 角色 | 关键设计 |
|------|------|---------|
| **TiDB Server** | SQL 解析 + 执行 | **无状态**，挂了换一个；100% 兼容 MySQL 协议 |
| **TiKV** | KV 行存 | **Region**（96MB）为单位 Multi-Raft 复制；3 副本 |
| **PD** | 元数据 + 调度 | Raft 集群，决定 Region 分布、Leader 平衡、热点调度 |
| **TiFlash** | 列存 | 与 TiKV **同步**（Raft Learner），同一份数据**HTAP** |

### Region 与 Multi-Raft

```text
全表按主键范围切成多个 Region（每个 96MB）:

  Region 1: pk [1, 1000)    ─ 3 副本 ─ Raft Group 1
  Region 2: pk [1000, 5000) ─ 3 副本 ─ Raft Group 2
  Region 3: pk [5000, ∞)    ─ 3 副本 ─ Raft Group 3

每个 Region 独立 Raft，可分别选主、平衡负载
```

**自动分裂 / 合并**：Region > 144MB 自动 split，< 20MB 自动 merge。**完全不用手工分片**。

### Percolator 分布式事务

**Google Percolator 论文（2010）**——TiDB 跨节点事务的核心。

```text
2PC 优化版（Snapshot Isolation）:

① Prewrite 阶段:
   - 客户端从 PD 拿 start_ts
   - 给每行加 lock 列
   - 选一行作为 Primary Lock

② Commit 阶段:
   - 从 PD 拿 commit_ts
   - 写 Primary Row 的 write 列 → 事务成功
   - 异步清理 Secondary Lock

崩溃恢复:
   - 看 Primary Lock 还在 → 回滚
   - 看 Primary 已 commit → 完成 Secondary
```

::: warning ⚠️ Percolator 的代价

> 跨节点事务**延迟 5-20ms**（2PC + Raft 写）+ **PD 时钟分配 1ms**——比单机 MySQL 慢 10-100×。**业务设计要让事务尽量局部化**。

:::

### TiDB HTAP 一表两用

```sql
-- 单表既能 OLTP 又能 OLAP
ALTER TABLE orders SET TIFLASH REPLICA 2;
-- ↑ 自动同步到 2 个 TiFlash 节点（列存）

-- 优化器自动选择走 TiKV（点查）还是 TiFlash（聚合）
SELECT product_id, SUM(amount) FROM orders
WHERE created_at > '2026-01-01'
GROUP BY product_id;
-- → 自动走 TiFlash 列存（快 10-100×）

SELECT * FROM orders WHERE id = 12345;
-- → 自动走 TiKV 行存（点查 ms 级）
```

**HTAP 核心价值**：
- 不再需要 MySQL → 同步到 ClickHouse / Doris 的复杂 ETL
- 实时数据立即可分析（毫秒级延迟）
- 同一份数据，运维成本减半

### TiDB 7+ 关键演进（2024-2026）

| 特性 | 版本 | 价值 |
|------|------|------|
| **Serverless 模式**（TiDB Cloud）| 6.6+ | 按量付费、自动扩缩 |
| **DDL 并行执行** | 7.0+ | 大表加列从小时降到分钟 |
| **资源管控**（Resource Control）| 7.1+ | 多租户隔离 CPU/IO |
| **TTL 表** | 7.2+ | 自动清理过期数据 |
| **缓存表** | 7.0+ | 小热表全内存加速 |
| **TiCDC 同步到 Kafka/Snowflake** | 7+ | CDC 实时数据流 |
| **向量索引**（TiDB Vector）| 8.0 2024 | RAG / 多模态可直接用 |
| **Vector Search 集成 Qdrant 模式** | 8.0+ | 不再需要外挂向量库 |

---

## CockroachDB（PostgreSQL 兼容 + 全球部署）

### 核心特色

**口号**："Built for survival"——单节点 / 单 AZ / 单 region 挂掉都能继续运行。

| 特性 | 说明 |
|------|------|
| **PostgreSQL 协议兼容** | 大多数 PG 客户端 / ORM 即插即用 |
| **Range 分片**（类 TiDB Region）| 64MB 一片，Raft 3 副本 |
| **地理分区**（Geo-Partitioning）| `LOCALITY REGIONAL BY ROW` 一行用户数据自动放他所在地区 |
| **多活无主**（Multi-Active）| 全球节点都能写，自动冲突避免 |
| **Serverless** | CockroachDB Serverless 按用量付费 |

### 地理感知配置（杀手特性）

```sql
-- 给全球用户表配置地理分区
ALTER TABLE users SET LOCALITY REGIONAL BY ROW;

-- 插入时自动按 region 列存到对应区域
INSERT INTO users (id, region, name)
VALUES (1, 'us-east', 'Alice');     -- 物理存到 us-east
INSERT INTO users (id, region, name)
VALUES (2, 'eu-west', 'Bob');        -- 物理存到 eu-west

-- 美国用户查美国数据 → 本地读，延迟 < 5ms
-- 跨境查询自动走 Raft 多数派，延迟 50-100ms
```

::: warning ⚠️ CockroachDB License 变化（2024）

> CockroachDB v23.2+ **核心改为 CCL（Cockroach Community License）**——不再 BSL，更严格的商业使用限制。
>
> **2026 选型注意**：评估 license 适用性，规模化商用需付费。开源派可选 **YugabyteDB（仍 Apache 2.0）**。

:::

---

## Google Spanner（最强一致性鼻祖）

**Google 2012 论文**，**首个全球外部一致性**数据库。

### TrueTime API（核心创新）

```text
传统系统:
   节点 A 写: timestamp = clock.now()
   节点 B 写: timestamp = clock.now()  ← NTP 时钟漂移可能导致排序错乱

Spanner TrueTime:
   timestamp = TT.now()  返回 [earliest, latest] 区间
   commit_wait 直到 TT.after(commit_ts) 才返回客户端
   → 保证任意两个 commit 都能全球严格排序

物理基础: GPS + 原子钟 → 时钟误差 < 7ms
```

**外部一致性（External Consistency）= 比线性一致更强**：
- 线性一致：单节点视角顺序
- 外部一致性：**全球真实时间顺序**

### Spanner 局限

- ✅ 全球强一致 + ACID + SQL
- ❌ 仅 GCP 可用（虽有 Open Spanner emulator）
- ❌ 写延迟 100ms（需 commit_wait）
- ❌ 贵

---

## OceanBase（阿里/蚂蚁，金融级）

**支付宝核心数据库**，2024 双 11 处理峰值百万 TPS。

### 关键特色

| 特性 | 说明 |
|------|------|
| **MySQL + Oracle 双兼容** | 国内 Oracle 替换首选 |
| **Paxos 共识** | 区别于 Raft，理论性能略优 |
| **零数据丢失**（RPO=0）| 金融场景核心 |
| **TPC-C 世界纪录** | 多次刷新榜首 |
| **HTAP** | 同表 OBKV + OBOLAP |
| **多租户原生** | 单集群千个租户隔离 |

**适用**：金融、政务、传统大企业 Oracle 替换。

---

## 全局唯一 ID — 分布式必备

**NewSQL 的痛点之一**：自增 ID 在分布式下要慎用（写热点）。主流方案：

### 5 大方案对比

| 方案 | 性能 | 趋势 | 长度 | 推荐场景 |
|------|------|------|------|---------|
| **UUID v4** | 极快（本地）| ❌ 完全无序 | 128 bit | 业务无序 ID |
| **UUID v7**（2024 RFC 9562）| 快 | ✅ 时间前缀有序 | 128 bit | **现代标准**、B+ 树友好 |
| **Snowflake**（Twitter）| 快 | ✅ 时间有序 | 64 bit | **国内事实标准** |
| **TiDB AUTO_RANDOM** | 中 | ❌ 无序（分散热点）| 64 bit | TiDB 默认 |
| **数据库号段**（Leaf）| 慢 | ✅ 趋势有序 | 可变 | 美团方案、可降级 |

### Snowflake 算法详解（面试 Top 必考）

```text
64 bit:
┌─────┬──────────────────────────────────────┬──────────┬──────────┐
│ 1 b │           41 bit timestamp           │ 10 bit   │ 12 bit   │
│ 0   │           毫秒（~ 69 年）              │ workerId │ sequence │
└─────┴──────────────────────────────────────┴──────────┴──────────┘

41 bit ms = 2^41 / (1000 * 60 * 60 * 24 * 365) ≈ 69 年
10 bit workerId = 1024 个机器节点
12 bit sequence = 单机每毫秒 4096 个 ID（即 400万 QPS）
```

**Java 实现关键点**：

```java
public synchronized long nextId() {
    long now = System.currentTimeMillis();
    if (now < lastTs) {
        // ⚠️ 时钟回拨 — 拒绝生成或等待
        throw new ClockMovedBackwardException();
    }
    if (now == lastTs) {
        sequence = (sequence + 1) & SEQ_MASK;
        if (sequence == 0) {           // 当前毫秒用完
            now = tilNextMillis(lastTs);
        }
    } else {
        sequence = 0L;
    }
    lastTs = now;
    return ((now - EPOCH) << TS_SHIFT)
         | (workerId << WORKER_SHIFT)
         | sequence;
}
```

::: warning ⚠️ Snowflake 时钟回拨（必踩坑）

> NTP 同步、跨时区机器、虚拟机时间漂移都会导致回拨。生产对策：
>
> ① **小幅回拨（< 5ms）：等待**直到追上；
> ② **大幅回拨**：抛异常 + 告警，**人工处理**；
> ③ **百度 UidGenerator**：workerId 动态分配，回拨容忍度更高；
> ④ **美团 Leaf-Snowflake**：用 ZK 注册 workerId + 上报时间防回拨；
> ⑤ **彻底解决**：用 **UUID v7**（RFC 9562 2024）—— 单调递增 + 时间有序 + 抗回拨。

:::

详见 [分布式 ID 生成](../engineering-practice/distributed-id)。

### UUID v7 vs Snowflake（2024-2026 新趋势）

| 维度 | Snowflake | **UUID v7** |
|------|----------|-------------|
| **长度** | 64 bit | 128 bit |
| **时序** | 毫秒级有序 | **毫秒级有序** |
| **workerId** | 需配置 + 防冲突 | **不需要**（含随机 74 bit） |
| **时钟回拨** | 需处理 | **不敏感** |
| **B+ 树插入** | 友好 | 友好 |
| **跨语言** | 自己实现 | 标准库（PG 17+ / Java UUID 类）|
| **存储** | 8 byte | 16 byte（多 2 倍）|

**2026 趋势**：新项目**用 UUID v7**（PostgreSQL 17 已原生支持 `uuidv7()`），老项目继续 Snowflake。

---

## 跨节点事务对比（必背）

| 方案 | 代表 | 一致性 | 性能 | 复杂度 |
|------|------|-------|------|--------|
| **2PC**（XA）| MySQL XA、跨库 | 强 | **慢**（同步阻塞）| 中 |
| **Percolator** | TiDB | Snapshot Isolation | 中（5-20ms）| 高 |
| **Calvin**（确定性）| FaunaDB | 强 | 慢 | 高 |
| **Raft + 单 Region**（局部）| TiDB 单 Region | 强 | **快**（< 5ms）| 低 |
| **TCC / Saga**（业务层）| Seata、业务自己写 | 最终 | 快 | **业务复杂** |
| **本地消息表** | 业务自己写 | 最终 | 快 | 中 |

详见 [分布式事务](../system-design/distributed-transaction)。

---

## 黄金答题模板（必背）

> **面试官：你怎么选分布式数据库？为什么不用 MySQL 分库分表？**
>
> **答**：先看痛点：
> ① **数据量 > 10TB / 单表 > 10 亿**——MySQL 分库分表力不从心；
> ② **跨业务 JOIN 频繁**——分库分表业务层拼盘极痛苦；
> ③ **需要不停机扩容**——大促临时加节点；
> ④ **全球分布 + 强一致**——只有 NewSQL 能做。
>
> **不痛就别上**：单库百亿、读多写少用 **MySQL + Read Replica + 缓存** 完全够。
>
> **常见选型**：
> - **国内 + MySQL 兼容** → **TiDB**（生态最广、HTAP 杀手锏 TiFlash、TiCDC 同步数仓、8.0 集成向量）
> - **金融 / Oracle 替换** → **OceanBase**（蚂蚁实战、RPO=0、Paxos）
> - **PostgreSQL 用户** → **YugabyteDB**（Apache 2.0 开源）或 **CockroachDB**（License 变化要评估）
> - **全球部署 + 最强一致** → **Spanner**（仅 GCP）/ **CockroachDB**（开源备选）
> - **仅 AWS** → **Aurora**（不是真分布式，单写但够用）
>
> **关键代价**：跨节点事务 **5-20ms**（Percolator 2PC + Raft），运维门槛比 MySQL 高 2-3 倍。业务设计**让事务尽量局部化**。
>
> **2024-2026 趋势**：**TiDB 集成向量索引**（8.0），**OceanBase 全 HTAP**，**UUID v7 替代 Snowflake**（PG 17 原生支持，无回拨问题）。

---

## 常见陷阱

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **没痛上 NewSQL** | 2-5× 成本 + 复杂运维 | 先评估 MySQL + 分表能否解决 |
| **跨节点事务滥用** | 延迟暴涨 10-100× | 业务设计让事务局部化（同 region） |
| **shard key / partition 选错** | 写热点 + 扩容噩梦 | 高基数 + 业务常用 + 不可变 |
| **Snowflake 时钟回拨没处理** | ID 重复 | UUID v7 或美团 Leaf |
| **CockroachDB 没看 License** | 商业合规风险 | 评估 CCL 或换 YugabyteDB |
| **TiDB 把 OLAP 全压 TiKV** | TiKV 卡死 | 大表加 TiFlash 副本走列存 |
| **OceanBase 当 MySQL 用** | 不会用多租户 / 分区表 | 学习 OB 特有优化 |

---

## 看到什么就先想到这类

- **"MySQL 单库撑不住了"** → 先 Read Replica + 分表，再 NewSQL
- **"国内大厂大数据 + 兼容 MySQL"** → TiDB
- **"金融 / 支付 / Oracle 替换"** → OceanBase
- **"PostgreSQL 全球分布"** → YugabyteDB / CockroachDB
- **"GCP 全球强一致"** → Spanner
- **"全局唯一 ID"** → Snowflake 或 UUID v7
- **"时钟回拨"** → Leaf / UidGenerator / 直接 UUID v7
- **"HTAP 不要再 ETL 到 ClickHouse"** → TiDB + TiFlash
- **"跨节点事务慢"** → Percolator 2PC 5-20ms，业务尽量局部化
- **"不想自建"** → TiDB Cloud / CockroachDB Cloud / Spanner / Aurora
