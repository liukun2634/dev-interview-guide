---
title: Spring 核心
---

# Spring 核心

Spring 最底层的容器与编程模型。理解 IoC、DI 和 AOP 是掌握整个 Spring 生态的基础。

## 概念

- Spring 的核心是 IoC 容器：由容器管理对象的创建、依赖关系和生命周期，开发者不再手动 new 对象。
- AOP（面向切面编程）是 Spring 实现事务、日志、安全等横切关注点的基础机制。
- Bean 是 Spring 容器管理的对象，理解 Bean 的生命周期和作用域是解决很多 Spring 问题的关键。

## 怎么处理

1. 先理解 IoC 容器怎么管理对象的创建和依赖关系。
2. 再理解 Bean 从创建到销毁的完整生命周期。
3. 最后理解 AOP 怎么通过代理实现横切关注点。

## 典型知识点

| 专题 | 先看什么 |
|------|------|
| [IoC 与依赖注入](./ioc-di) | 控制反转、三种注入方式、循环依赖 |
| [Bean 生命周期与作用域](./bean-lifecycle) | 完整生命周期流程、singleton vs prototype |
| [AOP 原理与实践](./aop) | 代理机制、通知类型、AOP 失效场景 |

## 面试常问 & 怎么答

### Q1: 什么是 IoC？

IoC（控制反转）是指对象的创建和依赖关系不再由对象自己控制，而是交给 Spring 容器管理。DI（依赖注入）是 IoC 的具体实现方式：容器在创建对象时自动注入它所依赖的其他对象。好处是解耦 — 对象不需要知道依赖从哪来，便于测试和替换。

### Q2: 什么是 AOP？

AOP（面向切面编程）是把多个类中重复出现的横切逻辑（如日志、事务、权限）抽取到切面中统一处理。Spring AOP 通过动态代理实现：在目标方法执行前后插入切面逻辑，而不修改原有代码。@Transactional 就是 AOP 最典型的应用。

### Q3: Spring Bean 的作用域有哪些？

最常用两种：singleton（默认，整个容器一个实例）和 prototype（每次获取创建新实例）。Web 环境下还有 request、session、application。singleton 的 Bean 注入 prototype 会有问题 — prototype 不会每次都创建新实例，需要用 @Scope 的 proxyMode 或 ObjectProvider 解决。

## 看到什么就先想到这类

- 出现依赖注入、@Autowired、@Component、Bean。
- 出现代理、切面、@Aspect、@Transactional 原理。
- 出现循环依赖、三级缓存。
- 出现 Bean 生命周期、BeanPostProcessor。
