---
title: Spring Boot
---

# Spring Boot

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Spring Boot 不是新框架，而是让 Spring 应用更容易启动和配置的工具。核心价值三个：**自动配置**（根据 classpath 自动配置）、**Starter**（一站式依赖管理）、**嵌入式服务器**（无需外部 Tomcat）。理解自动配置原理是面试必考。
:::

---

## Spring Boot 解决了什么问题

| 没有 Boot 时 | 有 Boot 后 |
|-------------|-----------|
| 手写大量 XML 配置 | 零配置启动 |
| 手动管理依赖版本兼容 | Starter 自动管理 |
| 部署到外部 Tomcat | 内嵌 Tomcat，java -jar 直接运行 |
| 手动配置数据源、MVC、安全等 | 有依赖就自动配置 |

**一句话理解**：Spring Boot = Spring + 合理的默认配置 + 嵌入式服务器 + Starter 依赖管理。

## 核心机制

### 自动配置原理（面试必考）

```
@SpringBootApplication
  ├── @SpringBootConfiguration   → 等于 @Configuration
  ├── @ComponentScan              → 扫描当前包及子包的 Bean
  └── @EnableAutoConfiguration    → 核心！触发自动配置
        └── SpringFactoriesLoader 加载 META-INF/spring.factories
            （Boot 3 改为 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports）
              └── 每个配置类上有条件注解
                  @ConditionalOnClass → classpath 有这个类才生效
                  @ConditionalOnMissingBean → 用户没自定义才生效
                  @ConditionalOnProperty → 配置项开启才生效
```

**核心逻辑**：有依赖 + 没有用户自定义 → 自动配置生效。用户自定义了 → 自动配置退让。

### 条件注解一览

| 注解 | 含义 | 典型使用 |
|------|------|---------|
| @ConditionalOnClass | classpath 存在某个类 | 有 DataSource 类就配数据源 |
| @ConditionalOnMissingBean | 容器中没有这个 Bean | 用户没定义就用默认的 |
| @ConditionalOnProperty | 配置项满足条件 | `spring.cache.type=redis` 才配置 Redis 缓存 |
| @ConditionalOnWebApplication | 是 Web 应用 | 配置 DispatcherServlet |

## 详细专题

| 专题 | 核心知识点 | 面试频率 | 详细页面 |
|------|-----------|---------|---------|
| 自动配置原理 | @EnableAutoConfiguration、条件注解、Starter 机制、自定义 Starter | 🔥🔥🔥 | [自动配置原理](./auto-configuration) |
| 配置体系与 Profile | 配置加载优先级、Profile 机制、@ConfigurationProperties、Actuator | 🔥🔥 | [配置体系与 Profile](./configuration) |

## 配置加载优先级（面试常考）

Spring Boot 配置有严格的优先级（高优先级覆盖低优先级）：

```
命令行参数（--server.port=8081）         ← 最高
  ↓
环境变量（SPRING_DATASOURCE_URL）
  ↓
application-{profile}.yml
  ↓
application.yml
  ↓
@ConfigurationProperties 默认值
  ↓
代码中的 @Value 默认值                   ← 最低
```

## 面试常问 & 怎么答

### Q1: Spring Boot 的自动配置原理？

@SpringBootApplication 包含 @EnableAutoConfiguration，它通过 SpringFactoriesLoader 加载 META-INF 下的自动配置类列表。每个配置类上有条件注解（@ConditionalOnClass 等），只有条件满足时才生效。核心逻辑：有依赖 + 用户没自定义 → 自动配置；用户自定义了 → 自动配置退让。

### Q2: Starter 是什么？

Starter 是"开箱即用"的依赖封装。引入 spring-boot-starter-web 就引入了 Tomcat、Spring MVC、Jackson 等，同时附带对应的自动配置。引入 Starter 就获得合理默认配置，零配置启动。

### Q3: Spring Boot 和 Spring 的区别？

Spring 是框架本体（IoC、AOP、MVC 等），Spring Boot 是在 Spring 之上提供自动配置、嵌入式服务器、Starter 依赖管理。Spring Boot 不引入新功能，只简化 Spring 应用的搭建和配置。

### Q4: 如何自定义一个 Starter？

三步：①创建一个 autoconfigure 模块，写 @Configuration 类 + 条件注解；②在 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 中注册配置类；③创建一个 starter 模块，只包含 pom 依赖（依赖 autoconfigure 模块 + 第三方库）。

## 看到什么就先想到这类

- 出现自动配置、@EnableAutoConfiguration、spring.factories → 自动配置原理
- 出现 Starter、starter 原理 → Starter 机制
- 出现 application.yml、Profile、配置优先级 → 配置体系
- 出现 Actuator、健康检查、监控 → Actuator 端点
- 出现"Boot 和 Spring 的区别" → 架构分层
