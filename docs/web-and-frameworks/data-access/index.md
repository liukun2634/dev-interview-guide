---
title: 数据访问与事务
---

# 数据访问与事务

Spring 对持久层的统一抽象与事务管理。@Transactional 是面试最高频的 Spring 知识点之一。

## 概念

- Spring 通过 PlatformTransactionManager 抽象事务管理，支持声明式（@Transactional）和编程式（TransactionTemplate）两种方式。
- @Transactional 基于 AOP 实现 — 代理对象在方法前后控制事务的开启、提交和回滚。
- Spring Data JPA 和 MyBatis 是两种主流的持久层方案，各有适用场景。

## 怎么处理

1. 先理解声明式事务的 AOP 实现原理。
2. 再理解事务传播行为 — 方法调用方法时事务怎么传递。
3. 最后理解 @Transactional 失效的典型场景 — 这是面试必考。

## 典型知识点

| 专题 | 先看什么 |
|------|------|
| [事务管理与传播行为](./transaction) | 声明式事务原理、7 种传播行为、失效场景 |
| [JPA 与 MyBatis 集成](./orm-integration) | JPA vs MyBatis 选型、核心用法、连接池 |

## 面试常问 & 怎么答

### Q1: @Transactional 的原理？

基于 AOP 实现。Spring 为标注了 @Transactional 的 Bean 创建代理对象，代理在方法执行前开启事务，正常返回则提交，抛出异常则回滚。默认只回滚 RuntimeException 和 Error。

### Q2: 事务传播行为有哪些？

最常用三种：REQUIRED（默认，有事务就加入，没有就新建）、REQUIRES_NEW（总是新建，挂起当前事务）、NESTED（嵌套事务，回滚不影响外层）。面试主要考 REQUIRED 和 REQUIRES_NEW 的区别。

### Q3: @Transactional 失效的场景？

五种：自调用（this 调用不经过代理）、方法不是 public、异常类型不对（checked exception 默认不回滚）、异常被 catch 吞掉、数据库引擎不支持事务（MyISAM）。

## 看到什么就先想到这类

- 出现事务、@Transactional、回滚。
- 出现事务传播行为、REQUIRED、REQUIRES_NEW。
- 出现 JPA、MyBatis、数据源、连接池。
