---
title: SQL 优化
---

# SQL 优化

## 概念

SQL 优化是指通过分析执行计划、改写查询语句、合理利用索引等手段，降低数据库查询的响应时间和资源消耗的过程。核心目标是减少磁盘 I/O、降低 CPU 开销、避免全表扫描。

---

## 核心原理

### 1. EXPLAIN 各字段详解

`EXPLAIN` 是分析查询执行计划的首要工具，执行后返回一张描述查询步骤的表格。

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 100;
```

**最关键字段速查表：**

| 字段 | 含义 | 关注点 |
|------|------|--------|
| `type` | 访问类型，性能核心指标 | 越靠左越好，避免 `ALL` |
| `key` | 实际使用的索引 | `NULL` 表示未走索引 |
| `rows` | 估算扫描行数 | 越小越好 |
| `Extra` | 附加执行信息 | 出现 `filesort`/`temporary` 需警惕 |
| `possible_keys` | 可能使用的索引 | 辅助判断索引覆盖情况 |
| `filtered` | 经条件过滤后的行比例(%) | 结合 rows 评估实际扫描量 |

**type 访问类型（性能由高到低）：**

| type | 说明 | 典型场景 |
|------|------|---------|
| `system` | 表只有一行 | 系统表 |
| `const` | 主键/唯一索引等值查询，最多一行 | `WHERE id = 1` |
| `eq_ref` | 联表时被驱动表走主键/唯一索引 | `JOIN ON a.id = b.id` |
| `ref` | 非唯一索引等值查询 | `WHERE user_id = 100` |
| `range` | 索引范围扫描 | `WHERE age BETWEEN 20 AND 30` |
| `index` | 全索引扫描（比全表扫描略好） | 覆盖索引但无 WHERE 过滤 |
| `ALL` | 全表扫描，性能最差 | 无索引可用 |

**Extra 常见值含义：**

| Extra 值 | 含义 | 是否需要优化 |
|----------|------|------------|
| `Using index` | 覆盖索引，无需回表 | 理想状态 |
| `Using where` | 在存储引擎层过滤后再由 Server 层过滤 | 通常正常 |
| `Using filesort` | 无法利用索引排序，需额外排序操作 | 需优化 |
| `Using temporary` | 使用临时表（常见于 GROUP BY、ORDER BY） | 需优化 |
| `Using index condition` | 索引下推（ICP），减少回表次数 | 正常 |

---

### 2. 慢查询日志

**开启慢查询日志（MySQL）：**

```sql
-- 查看当前状态
SHOW VARIABLES LIKE 'slow_query_log%';
SHOW VARIABLES LIKE 'long_query_time';

-- 动态开启（重启失效，建议写入 my.cnf）
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;           -- 超过 1 秒记录
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';

-- 同时记录未走索引的查询
SET GLOBAL log_queries_not_using_indexes = ON;
```

**my.cnf 永久配置：**

```ini
[mysqld]
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1
log_queries_not_using_indexes = 1
```

**使用 `mysqldumpslow` 分析日志：**

```bash
# 按平均查询时间排序，显示前 10 条
mysqldumpslow -s at -t 10 /var/log/mysql/slow.log

# 按总时间排序
mysqldumpslow -s t -t 10 /var/log/mysql/slow.log

# 过滤包含特定关键词的慢查询
mysqldumpslow -g "ORDER BY" /var/log/mysql/slow.log
```

---

### 3. 常见 SQL 改写技巧

#### 子查询 → JOIN

子查询在某些情况下会被优化器物化为临时表，改写为 JOIN 可利用索引。

```sql
-- 优化前：子查询
SELECT * FROM orders
WHERE user_id IN (SELECT id FROM users WHERE status = 'active');

-- 优化后：JOIN
SELECT o.* FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.status = 'active';
```

#### OR → UNION ALL

`OR` 连接不同列的条件时，索引合并效率低，改用 `UNION ALL` 可各自走索引。

```sql
-- 优化前
SELECT * FROM users WHERE name = 'Alice' OR email = 'alice@example.com';

-- 优化后（name 和 email 各有单列索引时更高效）
SELECT * FROM users WHERE name = 'Alice'
UNION ALL
SELECT * FROM users WHERE email = 'alice@example.com';
```

#### 深分页优化

`LIMIT 100000, 10` 会扫描并丢弃前 10 万行，代价极高。

```sql
-- 优化前：深分页，性能随偏移量线性下降
SELECT * FROM orders ORDER BY id LIMIT 100000, 10;

-- 优化方案一：延迟关联（Deferred Join）
-- 先用覆盖索引定位主键，再回表取完整数据
SELECT o.* FROM orders o
INNER JOIN (
    SELECT id FROM orders ORDER BY id LIMIT 100000, 10
) t ON o.id = t.id;

-- 优化方案二：游标分页（需记录上次最大 ID）
-- 要求前端传入上一页最后一条记录的 ID
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 10;
```

#### NOT IN → NOT EXISTS / LEFT JOIN IS NULL

`NOT IN` 对 NULL 值处理有陷阱，且性能较差。

```sql
-- 优化前
SELECT * FROM orders WHERE user_id NOT IN (SELECT id FROM blacklist);

-- 优化方案一：NOT EXISTS
SELECT * FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM blacklist b WHERE b.id = o.user_id);

-- 优化方案二：LEFT JOIN IS NULL（通常性能最优）
SELECT o.* FROM orders o
LEFT JOIN blacklist b ON o.user_id = b.id
WHERE b.id IS NULL;
```

#### SELECT * → 指定列

- 避免传输不必要的数据，减少网络开销
- 有机会触发**覆盖索引**（Extra: Using index），避免回表

```sql
-- 优化前
SELECT * FROM users WHERE status = 'active';

-- 优化后（假设有联合索引 (status, id, name)）
SELECT id, name FROM users WHERE status = 'active';
-- Extra: Using index，无需回表
```

---

### 4. JOIN 算法

| 算法 | 原理 | 适用场景 |
|------|------|---------|
| **Nested Loop Join (NLJ)** | 驱动表每行去被驱动表通过索引查找 | 被驱动表有索引，小结果集 |
| **Block Nested Loop (BNL)** | 驱动表分批放入 join_buffer，批量与被驱动表匹配 | 被驱动表无索引时的降级方案 |
| **Hash Join (8.0+)** | 对小表建哈希表，大表逐行探测 | 大表等值 JOIN，无索引场景 |

```sql
-- 查看 join_buffer_size（BNL 使用）
SHOW VARIABLES LIKE 'join_buffer_size';

-- 优化原则：确保 JOIN 的关联字段有索引，小表驱动大表
-- 查看是否使用了 BNL（需要警惕）
EXPLAIN SELECT * FROM a JOIN b ON a.id = b.a_id;
-- Extra: Using join buffer (Block Nested Loop) → 给 b.a_id 加索引
```

---

### 5. ORDER BY 优化

MySQL 有两种排序模式：

| 模式 | 触发条件 | 说明 |
|------|---------|------|
| **全字段排序** | sort_buffer 足够 | 将所有需要的列放入 sort_buffer 排序，直接返回 |
| **rowid 排序** | 单行数据量超过 `max_length_for_sort_data` | 只排序主键，排完再回表取数据 |

**利用索引排序（最优）：**

```sql
-- 联合索引 (user_id, create_time)
-- 以下查询可利用索引顺序，避免 filesort
SELECT id, amount FROM orders
WHERE user_id = 100
ORDER BY create_time DESC
LIMIT 10;
-- Extra: Using index condition（无 filesort）

-- 以下会产生 filesort（排序方向不一致）
SELECT id, amount FROM orders
WHERE user_id = 100
ORDER BY user_id ASC, create_time DESC;
```

**避免 filesort 的原则：**
- ORDER BY 的列与 WHERE 等值条件共同构成最左前缀索引
- 多列排序方向必须一致（同为 ASC 或同为 DESC）

---

### 6. GROUP BY 优化

| 扫描类型 | 说明 | 触发条件 |
|----------|------|---------|
| **松散索引扫描 (Loose Index Scan)** | 只读取每个分组中满足条件的部分索引条目，效率高 | GROUP BY 列是索引前缀，且使用 MIN/MAX 等聚合 |
| **紧凑索引扫描 (Tight Index Scan)** | 扫描整个索引范围，按分组聚合 | GROUP BY 列是索引但不满足松散扫描条件 |

```sql
-- 联合索引 (status, age)
-- 松散索引扫描：Extra 中显示 Using index for group-by
SELECT status, MAX(age) FROM users GROUP BY status;

-- 无法利用索引时会产生 Using temporary; Using filesort
-- 优化：给 GROUP BY 涉及的列加索引，或调大 tmp_table_size
```

---

### 7. COUNT(*) vs COUNT(1) vs COUNT(column)

| 写法 | 含义 | 是否忽略 NULL | 性能 |
|------|------|--------------|------|
| `COUNT(*)` | 统计所有行数（包含 NULL） | 不忽略 | 最优（优化器专门优化） |
| `COUNT(1)` | 与 COUNT(*) 等价 | 不忽略 | 与 COUNT(*) 相同 |
| `COUNT(column)` | 统计该列非 NULL 的行数 | 忽略 NULL | 略慢（需判断 NULL） |

**本质区别：**
- `COUNT(*)` 和 `COUNT(1)` 在 InnoDB 中完全等价，优化器会自动选择最小的索引进行全索引扫描
- `COUNT(column)` 语义不同，当列含 NULL 时结果会小于总行数
- MyISAM 的 `COUNT(*)` 直接读取元数据，O(1)；InnoDB 需扫描

```sql
-- 推荐写法：语义最明确，性能最优
SELECT COUNT(*) FROM orders WHERE status = 'paid';

-- 统计非 NULL 值（注意语义差异）
SELECT COUNT(remark) FROM orders;  -- remark 为 NULL 的行不计入
```

---

## 索引下推 ICP / 覆盖索引 / MRR — 三大优化器加速器（必背）

**面试 Top 追问**："EXPLAIN 里 Extra 出现 Using index condition / Using index / Using MRR 是什么意思？"——这三个**互联网二面必问**，答清楚直接证明你看过执行计划。

### 1. Using index — 覆盖索引（Covering Index）

**定义**：查询只需要的字段**全部在索引里**，**不回表**就能拿到结果。

```sql
-- 索引：idx_user_status_amount (user_id, status, amount)

-- ❌ 走二级索引 + 回表
SELECT * FROM orders WHERE user_id = 100 AND status = 'paid';

-- ✅ 覆盖索引，Extra: Using index（不回表）
SELECT user_id, status, amount FROM orders WHERE user_id = 100 AND status = 'paid';
```

::: tip 💡 实战价值

> 覆盖索引能把查询性能提升 **5-10×**，因为省去了"二级索引→主键→聚簇索引"的回表过程。优化 `SELECT *` 慢查询的首选方案：**列出实际需要的字段 + 给字段建联合索引**。

:::

### 2. Using index condition — 索引下推 ICP（MySQL 5.6+）

**定义**：把 WHERE 条件中**能用索引判断的部分**下推到存储引擎层过滤，**减少回表次数**。

```sql
-- 索引：idx_name_age (name, age)
-- SQL: SELECT * FROM users WHERE name LIKE '张%' AND age = 25;
```

**没有 ICP（5.5 之前）**：
```
存储引擎 → 按 name LIKE '张%' 取出所有匹配的索引记录 → 全部回表 → Server 层再过滤 age=25
```
假如有 1000 个"张姓"用户，回表 1000 次。

**有 ICP（5.6+）**：
```
存储引擎 → 按 name LIKE '张%' 过滤 → 在引擎层用 age=25 再过滤 → 只回表满足条件的 50 个
```
**回表减少到 50 次**，I/O 减少 **20×**。

| 触发条件 | 必须满足 |
|---------|---------|
| 使用**联合索引**或**前缀索引** | ✅ |
| WHERE 条件中**非前导列**能用索引判断 | ✅（如 `age` 在 `(name, age)` 中是第 2 列）|
| 不能用于聚簇索引（主键索引）| ❌ |
| `optimizer_switch='index_condition_pushdown=on'`（默认开）| ✅ |

### 3. Using MRR — Multi-Range Read（MySQL 5.6+）

**问题**：范围扫描时，按二级索引顺序回表 → 主键随机 I/O，性能差。

**MRR 思路**：先把二级索引的**主键 ID 攒一批 + 排序**，再按主键顺序去聚簇索引取数据 → 变随机 I/O 为顺序 I/O。

```sql
-- 索引：idx_age (age)
EXPLAIN SELECT * FROM users WHERE age BETWEEN 20 AND 30;
-- Extra: Using index condition; Using MRR
```

**开启方法**：`SET optimizer_switch='mrr=on,mrr_cost_based=off';`（默认基于代价判断，可能不启用）。

::: warning ⚠️ MRR 实战注意

> MRR 在 SSD 上**收益不大**（SSD 随机 I/O 几乎等于顺序），主要给 HDD 用；MySQL 8.0 默认情况下不一定主动用，需要显式调优。

:::

### 4. 三个加速器对比速查

| Extra 字段 | 中文名 | 触发条件 | 性能收益 |
|-----------|-------|---------|---------|
| **Using index** | 覆盖索引 | 查询字段全在索引中 | **5-10×**（省回表）|
| **Using index condition** | 索引下推 ICP | 联合索引非前导列在 WHERE | **2-20×**（减少回表次数）|
| **Using MRR** | Multi-Range Read | 二级索引范围扫描 | HDD 上 2-5×，SSD 弱 |
| **Using where** | Server 层过滤 | WHERE 条件无法下推 | 无优化，警告信号 |
| **Using filesort** | 文件排序 | ORDER BY 没走索引 | **慢，必须优化** |
| **Using temporary** | 用临时表 | GROUP BY / DISTINCT 无索引 | **很慢，必须优化** |

---

## 慢 SQL 实战 5 大场景 — 真实生产案例

### 场景 1：深分页（LIMIT 10000000, 10）— 经典杀手

```sql
-- ❌ 慢：扫描 1000 万 + 10 行
SELECT * FROM orders ORDER BY id LIMIT 10000000, 10;

-- ✅ 方案 1：游标分页（用上次结果的 id 作为起点）
SELECT * FROM orders WHERE id > 10000000 ORDER BY id LIMIT 10;

-- ✅ 方案 2：子查询先定位主键
SELECT * FROM orders WHERE id IN (
    SELECT id FROM orders ORDER BY id LIMIT 10000000, 10
);
```

**面试金句**：深分页慢的根本原因是**回表 1000 万次**，子查询方案让回表只发生在最后 10 行。

### 场景 2：索引失效 7 大坑

| 坑 | 反例 | 修正 |
|----|------|------|
| **函数操作索引列** | `WHERE DATE(create_time)='2026-06-06'` | `WHERE create_time >= '2026-06-06' AND create_time < '2026-06-07'` |
| **隐式类型转换** | `WHERE phone = 13800000000`（phone 是 VARCHAR）| `WHERE phone = '13800000000'` |
| **前缀通配** | `WHERE name LIKE '%张'` | 改用全文索引或反向存储 |
| **OR 条件部分无索引** | `WHERE a=1 OR b=2`（b 无索引）| 给 b 建索引或拆 UNION |
| **联合索引违反最左前缀** | 索引 `(a,b,c)` 但 `WHERE b=1` | 调整索引顺序或 SQL |
| **NOT IN / != / <>** | `WHERE status != 'paid'` | 改写为 `IN ('pending','cancelled')` |
| **`IS NOT NULL`** | 不一定走索引（看选择性）| 业务允许的话改为非 NULL 列 + 默认值 |

### 场景 3：JOIN 慢 — 小表驱动大表 + Hash Join (8.0)

```sql
-- MySQL 8.0+ 自动 Hash Join（不支持等值 JOIN 之外）
EXPLAIN FORMAT=TREE
SELECT * FROM small_table s JOIN large_table l ON s.id = l.sid;
-- 输出: -> Hash join (l.sid = s.id)  cost=1234
```

**优化原则**：
- 小表（结果集小）做驱动表（外层循环），大表做被驱动表（内层）
- 被驱动表的 JOIN 列**必须有索引**，否则退化为 BNL（Block Nested Loop），代价巨大
- 8.0 引入 Hash Join，不再依赖索引也能跑，但**内存消耗高**

### 场景 4：ORDER BY 走 filesort — 索引排序

```sql
-- 索引：idx_user_time (user_id, create_time)
-- ✅ 索引天然有序，Extra 无 filesort
SELECT * FROM orders WHERE user_id = 100 ORDER BY create_time DESC LIMIT 10;

-- ❌ 排序字段不在索引中，触发 filesort
SELECT * FROM orders WHERE user_id = 100 ORDER BY amount DESC LIMIT 10;
```

**ORDER BY 走索引 3 个条件**：① 排序列在索引中；② WHERE 列 + ORDER BY 列符合最左前缀；③ 排序方向一致（或全 ASC 或全 DESC，8.0 支持混合）。

### 场景 5：count(*) 优化

```sql
-- 不同写法性能对比（InnoDB）
SELECT COUNT(*)  FROM t;  -- ★ 推荐，优化器会找最小索引扫描
SELECT COUNT(1)  FROM t;  -- 与 COUNT(*) 等价
SELECT COUNT(id) FROM t;  -- 略慢，需判断 id 非空
SELECT COUNT(col) FROM t; -- 最慢，需判断 col 非空（且语义不同）

-- 大表 count 优化方案：
-- 1. 估算值（够用即可）：SHOW TABLE STATUS LIKE 't';
-- 2. 维护单独的计数表 + 事务更新
-- 3. Redis 单独计数（容忍少量误差）
```

::: warning ⚠️ MyISAM vs InnoDB count(*)

> **MyISAM**：表级别维护 row 数，`COUNT(*)` O(1)；
> **InnoDB**：因 MVCC 不同事务看到的行数不同，必须实时扫描，所以 InnoDB 大表 `COUNT(*)` 慢。

:::

### 黄金答题模板

> **面试官：你怎么优化一条慢 SQL？**
>
> **答**：分 5 步走：① **看慢查询日志**找到目标 SQL；② **EXPLAIN** 看 type（是否 ALL）、key（是否命中）、rows（扫描量）、Extra（filesort/temporary/Using index）；③ **三大优化器加速器**——能用覆盖索引就用，看 ICP 是否触发，范围查询试 MRR；④ **针对场景**：深分页用游标 / 索引失效 7 坑排查 / JOIN 小表驱动大表 + 被驱动表加索引 / ORDER BY 走索引避 filesort；⑤ **架构层兜底**：分表、读写分离、缓存、ES 取代复杂查询。

---

## 面试常问 & 怎么答

**Q1: 如何定位和优化慢查询？**

> 分三步走：定位 → 分析 → 优化。
>
> **定位**：开启慢查询日志（`slow_query_log=ON`，`long_query_time=1`），用 `mysqldumpslow` 按总耗时排序，找出 Top N 慢语句。也可用 `performance_schema` 或 `pt-query-digest` 做更细粒度分析。
>
> **分析**：对慢语句执行 `EXPLAIN`，重点看 `type`（是否全表扫描）、`key`（是否走索引）、`rows`（扫描行数）、`Extra`（是否出现 filesort/temporary）。
>
> **优化**：根据分析结果对症下药——缺索引就加索引，有索引没走就检查是否触发了索引失效（函数操作、隐式转换、前缀通配符等）；查询写法有问题就改写（子查询转 JOIN、深分页转游标等）；若是热点数据可引入缓存层。

---

**Q2: EXPLAIN 结果中最关键的字段是哪些？怎么看？**

> 最关键的三个字段是 **type**、**key**、**Extra**。
>
> - `type` 代表访问方式，性能从高到低：`const > eq_ref > ref > range > index > ALL`。生产环境中应至少达到 `ref` 或 `range`，出现 `ALL` 即全表扫描，必须优化。
> - `key` 显示实际使用的索引，为 `NULL` 说明没有走索引。还要结合 `key_len` 判断联合索引是否完整生效。
> - `Extra` 中出现 `Using filesort` 说明排序无法利用索引，出现 `Using temporary` 说明使用了临时表，两者都是性能警告信号，需要针对性优化。`Using index` 则是理想状态，表示覆盖索引命中，无回表操作。

---

**Q3: 深分页（LIMIT 大偏移）为什么慢？怎么优化？**

> **为什么慢**：`LIMIT offset, size` 的实现并非跳过 offset 行，而是先扫描并读取前 `offset + size` 行，然后丢弃前 offset 行，只返回最后 size 行。当 offset 为 10 万时，实际扫描了 10 万零 10 行，且每行可能涉及回表操作，代价极高。
>
> **两种优化方案**：
>
> 1. **延迟关联**：先用覆盖索引（只扫描索引树，无回表）定位目标页的主键集合，再用主键回表取完整数据。
>    ```sql
>    SELECT o.* FROM orders o
>    INNER JOIN (SELECT id FROM orders ORDER BY id LIMIT 100000, 10) t
>    ON o.id = t.id;
>    ```
>
> 2. **游标分页（推荐）**：记录上一页最后一条记录的 ID，下次查询直接从该 ID 之后开始，彻底避免大偏移。
>    ```sql
>    -- 前端记住上次返回的最大 id（如 last_id = 100000）
>    SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 10;
>    ```
>    游标分页的局限是不支持随机跳页，适合无限滚动、下一页等场景。

---

## 看到什么就先想到这类

| 触发信号 | 第一反应 |
|----------|---------|
| 查询响应慢、接口超时 | 慢查询日志 + EXPLAIN 分析，先看 type 和 key |
| EXPLAIN 的 type 是 ALL | 缺索引，或索引失效（函数/隐式转换/前缀%） |
| Extra 出现 Using filesort | ORDER BY 列未走索引，考虑建联合索引或调整排序列顺序 |
| Extra 出现 Using temporary | GROUP BY / ORDER BY 产生临时表，检查索引覆盖情况 |
| 分页接口越翻越慢 | 深分页问题，延迟关联或游标分页 |
| 大表 JOIN 无索引 | Block Nested Loop 或 Hash Join 降级，务必给关联字段加索引 |
| `NOT IN` + 子查询 | 改写为 LEFT JOIN IS NULL，避免 NULL 陷阱 |
| `COUNT(column)` 结果异常 | 检查列是否含 NULL，考虑改用 `COUNT(*)` |

---

## 深度图解与高频面试题

### EXPLAIN 输出字段全解析

执行 `EXPLAIN SELECT ...` 后重点关注以下字段：

| 字段 | 含义 | 好 → 差 |
|------|------|---------|
| **type** | 访问类型（最重要） | system > const > eq_ref > **ref** > range > index > **ALL（需优化）** |
| **key** | 实际使用的索引 | 有值（命中索引）> NULL（未命中，需检查） |
| **rows** | 估算扫描行数 | 越小越好，与实际差距大时考虑 ANALYZE TABLE |
| **Extra** | 额外执行信息 | `Using index`（覆盖索引✅）> `Using where` > `Using filesort`（❌）> `Using temporary`（❌最差） |

**type 字段含义速查：**

| type值 | 含义 | 触发示例 |
|--------|------|---------|
| const | 主键/唯一索引等值查询，最多1行 | `WHERE id = 1` |
| eq_ref | 联表时主键/唯一索引匹配 | `JOIN ON 主键` |
| ref | 非唯一索引等值查询 | `WHERE status = 1`（有索引） |
| range | 索引范围扫描 | `WHERE id BETWEEN 1 AND 100` |
| index | 全索引扫描（比ALL少IO） | 覆盖索引但需全扫 |
| ALL | 全表扫描 | 无可用索引，必须优化 |

**Extra 关键值解读：**
- `Using index`：覆盖索引，无需回表，最优
- `Using filesort`：无法用索引排序，需额外排序步骤，考虑加索引
- `Using temporary`：用临时表（常见于GROUP BY、DISTINCT），性能较差
- `Using join buffer`：JOIN时被驱动表无索引，用缓冲区，考虑加索引

---

### 大表分页深翻页优化

```sql
-- ❌ 原始写法：MySQL扫描100020行后丢弃前100000行
SELECT id, title, created_at FROM articles
ORDER BY created_at DESC LIMIT 100000, 20;

-- ✅ 方案1：游标法（前端传上次最后一条记录的时间）
SELECT id, title, created_at FROM articles
WHERE created_at < '2024-01-01 12:00:00'
ORDER BY created_at DESC LIMIT 20;

-- ✅ 方案2：覆盖索引子查询（先用索引定位ID，再回表取数据）
SELECT a.* FROM articles a
INNER JOIN (
    SELECT id FROM articles
    ORDER BY created_at DESC LIMIT 100000, 20
) t ON a.id = t.id;
-- 子查询只走覆盖索引(created_at, id)，大幅减少回表IO
```

---

### 高频面试Q&A

**Q: count(\*)、count(1)、count(主键)、count(列名) 有什么区别？**

A: 从快到慢：`count(*)` ≈ `count(1)` > `count(主键)` > `count(列名)`。具体：`count(*)` 是SQL标准，MySQL 8.0已优化，InnoDB会走最小的二级索引统计，不取具体列值；`count(1)` 与之等价；`count(主键)` 需取主键值判断非NULL，略慢；`count(列名)` 只统计该列非NULL的行数，语义不同，且无法走部分优化。建议统一使用 `count(*)`。

**Q: 如何定位慢SQL并优化？**

A: 三步走：① **开启慢查询日志**——`slow_query_log=ON, long_query_time=1`，记录超过阈值的SQL，用 `mysqldumpslow` 分析Top慢查询；② **EXPLAIN 分析执行计划**——重点看 type（是否ALL）、key（是否命中索引）、Extra（是否有filesort/temporary）；③ **针对性优化**——type=ALL则加索引，filesort则给ORDER BY列加索引，大结果集则考虑分页或分表。常见优化方向：消除全表扫描、避免函数操作索引列、使用覆盖索引、拆分大事务。

**Q: 为什么不建议使用 `SELECT *`？**

A: 四个原因：① **无法使用覆盖索引**——`SELECT *` 总需要回表读完整行，而指定列查询可能命中覆盖索引避免回表；② **网络传输浪费**——返回不必要的列增加带宽和序列化开销；③ **binlog膨胀**——ROW格式下UPDATE的前后镜像包含所有字段，binlog文件更大影响主从同步；④ **维护风险**——表结构增加字段后，应用层反序列化可能出错。

**Q: 一条SQL执行很慢有哪些可能原因？**

A: 分两种情况：**偶发性慢**——① 等锁（`SHOW PROCESSLIST` 看 Waiting for lock）；② InnoDB刷脏页（buffer pool脏页比例过高触发强制刷盘）。**持续性慢**——① 未命中索引（EXPLAIN type=ALL）；② 索引失效（函数操作/隐式类型转换/like前缀通配）；③ 数据量太大（需分表）；④ 返回数据量太大（需分页）；⑤ JOIN顺序不当（应让小结果集驱动大表）；⑥ 锁等待（高并发下行锁冲突）。
