---
title: Web 与框架
---

# Web 与框架

这一章按技术栈分层组织，从 Web 基础到 Spring 生态逐层递进。每一节都给出三个核心问题：概念是什么、核心原理怎么理解、面试怎么回答。

## 怎么使用这一章

1. 先看某一节的概念页，搞清楚这一层解决什么问题。
2. 再看核心原理与关键流程，建立理解框架。
3. 最后看面试常问，把理解转化成表达。

## 分类地图

| 类别 | 概念 | 核心内容 | 典型知识点 |
|------|------|------|------|
| [Web 基础](./web-basics) | Servlet、HTTP、Cookie/Session — 理解 Spring 的前置知识 | 先搞清请求在容器里怎么走 | Servlet 生命周期、Filter/Listener、Cookie vs Session vs Token |
| [Spring 核心](./spring-core/) | IoC/DI、AOP、Bean 生命周期 — Spring 最底层的容器与编程模型 | 先理解容器怎么管理对象 | [IoC 与依赖注入](./spring-core/ioc-di)、[Bean 生命周期](./spring-core/bean-lifecycle)、[AOP](./spring-core/aop) |
| [Spring MVC](./spring-mvc/) | 请求处理层 — 从 HTTP 请求到 Controller 返回 | 先理解 DispatcherServlet 流程 | [请求处理流程](./spring-mvc/request-flow)、[RESTful API](./spring-mvc/restful-api) |
| [Spring Boot](./spring-boot/) | 自动配置与约定优于配置 | 先理解自动装配原理 | [自动配置原理](./spring-boot/auto-configuration)、[配置体系](./spring-boot/configuration) |
| [数据访问与事务](./data-access/) | 持久层抽象与事务管理 | 先理解声明式事务怎么工作 | [事务管理](./data-access/transaction)、[ORM 集成](./data-access/orm-integration) |
| [Spring Security](./spring-security) | 安全框架 — 认证与授权 | 先理解过滤器链架构 | SecurityFilterChain、JWT/OAuth2、RBAC |
| [Spring Boot 3 新特性](./spring-boot3-new-features) | Spring 6 / Boot 3 的重要变化 | 先了解 Jakarta 迁移和 Native Image | GraalVM、虚拟线程、@HttpExchange、Observability |
| [Spring Cloud 速查](./spring-cloud-overview) | 微服务基础设施速查 | 知道有哪些组件，深度看系统设计章节 | Nacos、Gateway、Sentinel |

## 建议顺序

1. 先看 [Web 基础](./web-basics)，把 Servlet 和 HTTP 搞清楚。
2. 再看 [Spring 核心](./spring-core/)，理解 IoC、AOP 和 Bean 管理。
3. 然后看 [Spring MVC](./spring-mvc/) 和 [Spring Boot](./spring-boot/)，理解请求处理和自动配置。
4. 再看 [数据访问与事务](./data-access/) 和 [Spring Security](./spring-security)。
5. 最后看 [新特性](./spring-boot3-new-features) 和 [Spring Cloud 速查](./spring-cloud-overview)。
