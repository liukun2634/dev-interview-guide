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
