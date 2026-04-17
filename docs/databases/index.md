---
title: 数据库
---

# 数据库

本章覆盖关系型数据库（MySQL）和 NoSQL（Redis）的核心原理，按技术层次递进：先理解架构，再深入索引、事务、优化、日志，最后扩展到分库分表和 Redis。

## 怎么使用这一章

1. 先看 MySQL 架构，建立对数据库内部分层的整体认知。
2. 再看索引和事务，这是面试最高频的两个主题。
3. 然后看 SQL 优化和日志机制，理解性能调优和数据安全的底层支撑。
4. 最后看分库分表和 Redis，扩展到分布式场景。

## 分类地图

| 主题 | 概念 | 核心知识点 |
|------|------|------|
| [MySQL 架构](./mysql-architecture) | MySQL 分层架构与存储引擎 | 一条 SQL 的执行流程、InnoDB vs MyISAM、Buffer Pool |
| [索引原理](./indexing) | B+ 树索引与查询优化的基础 | 聚簇索引、覆盖索引、最左前缀、索引失效场景 |
| [事务与锁](./transaction-lock) | 并发控制的两大支柱 | ACID、隔离级别、MVCC、行锁/间隙锁/临键锁、死锁 |
| [SQL 优化](./sql-optimization) | 定位慢查询并系统优化 | EXPLAIN 详解、SQL 改写技巧、深分页优化、JOIN 算法 |
| [MySQL 日志](./mysql-logs) | 日志驱动的崩溃恢复与复制 | redo log、undo log、binlog、两阶段提交 |
| [分库分表](./sharding) | 单库瓶颈后的水平扩展 | 垂直/水平拆分、分片策略、分布式 ID、跨库问题 |
| [Redis 核心](./redis) | 高性能内存数据库 | 数据类型与底层结构、持久化、缓存穿透/击穿/雪崩、集群 |

## 建议顺序

1. 先看 [MySQL 架构](./mysql-architecture)，建立全局视角。
2. 再看 [索引原理](./indexing) 和 [事务与锁](./transaction-lock)，这是面试必考。
3. 然后看 [SQL 优化](./sql-optimization) 和 [MySQL 日志](./mysql-logs)，补全 MySQL 知识体系。
4. 最后看 [分库分表](./sharding) 和 [Redis 核心](./redis)，覆盖分布式和缓存场景。
