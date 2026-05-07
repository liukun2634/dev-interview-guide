---
title: 数据访问与事务
---

# 数据访问与事务

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Spring 通过 AOP 实现声明式事务（@Transactional），通过 Spring Data / MyBatis 简化持久层开发。**@Transactional 的原理和失效场景是面试最高频的 Spring 知识点之一**——理解它就是理解 AOP 在实际业务中最重要的应用。
:::

---

## 整体架构

```
Service 层（业务逻辑）
  ↓ @Transactional → AOP 代理拦截
事务管理器（PlatformTransactionManager）
  ├── DataSourceTransactionManager（JDBC / MyBatis）
  └── JpaTransactionManager（JPA / Hibernate）
  ↓ 获取连接、开启事务
数据访问层
  ├── Spring Data JPA（Repository 接口，自动实现 CRUD）
  ├── MyBatis（XML/注解写 SQL，半自动 ORM）
  └── JdbcTemplate（原始 JDBC 封装）
  ↓
数据源（HikariCP 连接池）
  ↓
数据库
```

## @Transactional 原理速查

面试核心考点——用一句话说清楚：

> **@Transactional 基于 AOP 代理实现：Spring 为标注了 @Transactional 的 Bean 创建代理对象，代理在方法执行前开启事务，正常返回则提交，抛出异常则回滚。**

这就解释了为什么"自调用"会失效——通过 `this` 调用另一个方法不会经过代理对象。

### 五大失效场景（面试必考）

| 失效场景 | 原因 | 修复方法 |
|---------|------|---------|
| 自调用（this.method()） | 不经过代理 | 注入自身、用 AopContext、拆分类 |
| 方法不是 public | 代理无法拦截非 public 方法 | 改为 public |
| 异常被 catch 吞掉 | 代理没感知到异常，不触发回滚 | 不 catch 或 catch 后重新抛出 |
| 抛出 checked exception | 默认只回滚 RuntimeException 和 Error | 加 `rollbackFor = Exception.class` |
| 数据库不支持事务 | MyISAM 引擎无事务能力 | 换 InnoDB |

## JPA vs MyBatis 选型

| 对比项 | Spring Data JPA | MyBatis |
|--------|----------------|---------|
| SQL 编写 | 自动生成（方法名推导） | 手写 SQL |
| 复杂查询 | 复杂 SQL 不方便 | 完全掌控 SQL |
| 学习曲线 | 低（简单 CRUD 零 SQL） | 中（需要写 XML/注解） |
| 性能优化 | 不透明，需要理解 Hibernate | 直接优化 SQL |
| 适合场景 | 简单 CRUD 为主的项目 | 复杂查询多、DBA 审核 SQL 的项目 |
| 国内使用 | 较少 | 主流（阿里系大量使用） |

**面试答法**：国内大厂以 MyBatis 为主（SQL 可控、DBA 能审核），海外和中小项目 JPA 更多（开发效率高）。两者不冲突，同一项目可以混用。

## 详细专题

| 专题 | 核心知识点 | 面试频率 | 详细页面 |
|------|-----------|---------|---------|
| 事务管理与传播行为 | 声明式事务原理、7 种传播行为、隔离级别、失效场景 | 🔥🔥🔥 | [事务管理与传播行为](./transaction) |
| JPA 与 MyBatis 集成 | JPA vs MyBatis 选型、核心用法、连接池、N+1 问题 | 🔥🔥 | [JPA 与 MyBatis 集成](./orm-integration) |

## 事务传播行为速查（面试常考前三个）

| 传播行为 | 含义 | 面试频率 |
|---------|------|---------|
| **REQUIRED**（默认） | 有事务就加入，没有就新建 | 🔥🔥🔥 |
| **REQUIRES_NEW** | 总是新建，挂起当前事务 | 🔥🔥🔥 |
| **NESTED** | 嵌套事务（Savepoint），内层回滚不影响外层 | 🔥🔥 |
| SUPPORTS | 有事务就加入，没有就非事务执行 | 💧 |
| NOT_SUPPORTED | 总是非事务执行，挂起当前事务 | 💧 |
| MANDATORY | 必须在事务中调用，否则抛异常 | 💧 |
| NEVER | 必须不在事务中，否则抛异常 | 💧 |

**REQUIRED vs REQUIRES_NEW**：内层方法抛异常回滚时，REQUIRED 会连带外层一起回滚（同一个事务），REQUIRES_NEW 不影响外层（独立事务）。这是面试最常考的对比。

## 面试常问 & 怎么答

### Q1: @Transactional 的原理？

基于 AOP 实现。Spring 为标注了 @Transactional 的 Bean 创建代理对象，代理在方法执行前开启事务，正常返回则提交，抛出异常则回滚。默认只回滚 RuntimeException 和 Error。

### Q2: 事务传播行为有哪些？

最常用三种：REQUIRED（默认，有事务就加入，没有就新建）、REQUIRES_NEW（总是新建，挂起当前事务）、NESTED（嵌套事务，回滚不影响外层）。面试主要考 REQUIRED 和 REQUIRES_NEW 的区别。

### Q3: @Transactional 失效的场景？

五种：自调用（this 调用不经过代理）、方法不是 public、异常类型不对（checked exception 默认不回滚）、异常被 catch 吞掉、数据库引擎不支持事务（MyISAM）。

### Q4: JPA 和 MyBatis 怎么选？

简单 CRUD 为主选 JPA（开发效率高），复杂查询多或需要 DBA 审核 SQL 选 MyBatis（SQL 可控）。国内大厂以 MyBatis 为主。两者可以在同一项目中混用。

## 看到什么就先想到这类

- 出现事务、@Transactional、回滚 → 声明式事务原理
- 出现事务传播行为、REQUIRED、REQUIRES_NEW → 传播行为对比
- 出现事务失效、自调用 → AOP 代理问题
- 出现 JPA、MyBatis、数据源、连接池 → ORM 选型
- 出现 N+1 查询、懒加载 → JPA 性能陷阱
