---
title: Spring Boot
---

# Spring Boot

Spring 的约定优于配置层。Spring Boot 不是新框架，而是让 Spring 应用更容易启动和配置的工具。理解自动装配原理是关键。

## 概念

- Spring Boot 的核心价值是自动配置 — 根据 classpath 上的依赖自动配置 Spring 应用。
- Starter 是依赖管理的封装 — 引入一个 starter 就引入了一组相关依赖和自动配置。
- 配置体系支持多环境管理 — Profile、配置文件优先级、外部化配置。

## 怎么处理

1. 先理解 @SpringBootApplication 背后做了什么。
2. 再理解自动配置的加载和条件匹配机制。
3. 最后理解配置文件的加载优先级和绑定方式。

## 典型知识点

| 专题 | 先看什么 |
|------|------|
| [自动配置原理](./auto-configuration) | @EnableAutoConfiguration、条件注解、Starter 机制 |
| [配置体系与 Profile](./configuration) | 配置优先级、@ConfigurationProperties、Actuator |

## 面试常问 & 怎么答

### Q1: Spring Boot 的自动配置原理？

@SpringBootApplication 包含 @EnableAutoConfiguration，它通过 SpringFactoriesLoader 加载 META-INF 下的自动配置类列表（Boot 3 用 AutoConfiguration.imports 文件）。每个配置类上有条件注解（@ConditionalOnClass 等），只有条件满足时才生效。比如 classpath 有 DataSource 类且没有用户自定义的 DataSource Bean，就自动配置一个。

### Q2: Starter 是什么？

Starter 是一组"开箱即用"的依赖封装。比如 spring-boot-starter-web 引入了 Tomcat、Spring MVC、Jackson 等依赖，同时附带对应的自动配置。引入 Starter 就自动获得合理的默认配置，可以零配置启动。

### Q3: Spring Boot 和 Spring 的区别？

Spring 是框架本体（IoC、AOP、MVC 等），Spring Boot 是在 Spring 之上提供自动配置、嵌入式服务器、Starter 依赖管理。Spring Boot 不引入新功能，只简化 Spring 应用的搭建和配置。

## 看到什么就先想到这类

- 出现自动配置、@EnableAutoConfiguration、spring.factories。
- 出现 Starter、starter 原理。
- 出现 application.yml、Profile、配置优先级。
- 出现 Actuator、健康检查、监控。
