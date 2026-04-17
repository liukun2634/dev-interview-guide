# 数据库章节设计文档

**日期**：2026-04-17
**定位**：核心原理简明讲清 + 每节末尾附"面试常问 & 怎么答"。覆盖 MySQL 核心机制与 Redis。
**组织方式**：按技术层次递进。
**格式**：沿用数据结构与算法章节的统一模式。

---

## 章节结构

### 1. MySQL 架构与存储引擎 (`mysql-architecture`)

**概念**：理解 MySQL 内部分层，一条 SQL 从发出到返回结果经历了什么。

**核心内容**：
- MySQL 逻辑架构（连接器 → 查询缓存 → 分析器 → 优化器 → 执行器 → 存储引擎）
- InnoDB vs MyISAM 核心区别（事务、锁粒度、崩溃恢复、外键）
- 一条 SELECT / UPDATE 语句的完整执行流程
- Buffer Pool 与内存管理
- 存储引擎选型指南

**子页面**：暂不拆分，单页覆盖。

---

### 2. 索引原理 (`indexing`)

**已有内容，保持不动。**

---

### 3. 事务与锁 (`transaction-lock`)

**概念**：数据库并发控制的两大支柱——事务保证正确性，锁保证隔离性。

**核心内容**：
- ACID 特性与每个字母的实现机制
- 四种隔离级别（读未提交 / 读已提交 / 可重复读 / 串行化）
- MVCC 原理（隐藏列、undo log 版本链、ReadView）
- InnoDB 锁类型（行锁、间隙锁、临键锁、意向锁）
- 死锁产生条件、检测与预防
- 当前读 vs 快照读

**子页面**：暂不拆分，单页覆盖。

---

### 4. SQL 优化 (`sql-optimization`)

**概念**：定位慢查询并系统优化的方法论。

**核心内容**：
- EXPLAIN 各字段详解（type / key / rows / Extra）
- 慢查询日志开启与分析
- 常见 SQL 改写技巧（子查询 → JOIN、OR → UNION、深分页优化）
- JOIN 算法（Nested Loop / Hash Join）
- ORDER BY 与 GROUP BY 优化
- COUNT(*) vs COUNT(1) vs COUNT(column)

**子页面**：暂不拆分，单页覆盖。

---

### 5. MySQL 日志机制 (`mysql-logs`)

**概念**：MySQL 靠日志实现崩溃恢复、数据一致性和主从复制。

**核心内容**：
- redo log（WAL 机制、崩溃恢复）
- undo log（事务回滚、MVCC 版本链）
- binlog（逻辑日志、主从复制、数据恢复）
- 两阶段提交（redo log + binlog 一致性保证）
- 三种日志的对比与协作关系

**子页面**：暂不拆分，单页覆盖。

---

### 6. 分库分表 (`sharding`)

**概念**：单库性能瓶颈后的水平扩展方案。

**核心内容**：
- 垂直拆分 vs 水平拆分
- 分片键选择与常见分片策略（Range / Hash / 一致性哈希）
- 分布式 ID 方案（雪花算法、号段模式）
- 跨库查询、跨库事务、全局排序问题
- 常见中间件（ShardingSphere、Vitess）
- 什么时候该分、什么时候不该分

**子页面**：暂不拆分，单页覆盖。

---

### 7. Redis 核心 (`redis`)

**概念**：最常用的内存数据库，面试覆盖数据结构、持久化、缓存问题三大块。

**核心内容**：
- 五种基本数据类型与底层数据结构（SDS、ziplist、quicklist、skiplist、intset、dict）
- 持久化机制（RDB 快照 vs AOF 日志 vs 混合持久化）
- 内存淘汰策略（8 种策略对比）
- 缓存穿透、缓存击穿、缓存雪崩的区别与解决方案
- Redis 单线程模型与 I/O 多路复用
- Redis 集群方案（主从、哨兵、Cluster）

**子页面**：暂不拆分，单页覆盖。

---

## 每节统一格式

```markdown
## 概念
这一节在讲什么

## 核心原理
关键流程与机制

## 面试常问 & 怎么答
高频问题 + 简明回答思路

## 看到什么就先想到这类
触发信号
```

## 现有内容处理

- `docs/databases/indexing.md` 保留，不修改

## 文件结构

```
docs/databases/
├── index.md                    # 章节总览（重写）
├── mysql-architecture.md       # 1. MySQL 架构
├── indexing.md                 # 2. 索引原理（已有）
├── transaction-lock.md         # 3. 事务与锁
├── sql-optimization.md         # 4. SQL 优化
├── mysql-logs.md               # 5. MySQL 日志
├── sharding.md                 # 6. 分库分表
└── redis.md                    # 7. Redis 核心
```
