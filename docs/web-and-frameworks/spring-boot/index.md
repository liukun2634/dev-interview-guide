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

## Spring Boot 版本演进时间线

Spring Boot 由 Pivotal（现 VMware Tanzu）的 Phil Webb 发起，2014.04 首版 1.0 GA。一句话定位：**Spring 应用的"约定优于配置"打包方式**。

| 版本 | 时间 | Spring 依赖 | JDK | 关键变化 |
|------|------|------------|-----|---------|
| **1.0** | 2014.04 | Spring 4.0 | JDK 6 | **首版**：自动配置（`spring.factories`）、Starter POM、嵌入式 Tomcat、Actuator、CLI |
| **1.3** | 2015.11 | Spring 4.2 | JDK 7 | DevTools 热重载、缓存自动配置 |
| **1.5** | 2017.01 | Spring 4.3 | JDK 7 | Kafka starter、OAuth2 增强；1.x 末代 |
| **2.0** | 2018.03 | Spring 5.0 | **JDK 8** | **🔥 重写底层**：Reactor / WebFlux 支持、HTTP/2、Actuator 端点全面重构（新指标体系 Micrometer）、Spring Security 5、JOOQ |
| **2.1 / 2.2** | 2018-2019 | Spring 5.1/5.2 | JDK 8/11 | JUnit 5 默认、懒加载（`spring.main.lazy-initialization`） |
| **2.3** | 2020.05 | Spring 5.2 | JDK 8/11 | **Graceful Shutdown**（优雅停机）、Docker 镜像构建（Cloud Native Buildpacks）、Liveness/Readiness 探针 |
| **2.4** | 2020.11 | Spring 5.3 | JDK 8/11 | **配置文件加载机制重写**（统一 `spring.config.import`）、Volume 配置 |
| **2.5 / 2.6** | 2021 | Spring 5.3 | JDK 8/11 | 周期任务执行器、Layered Jar 改进 |
| **2.7** | 2022.05 | Spring 5.3 | JDK 8/11/17 | **2.x 末代版本**；自动配置文件改为 `AutoConfiguration.imports`（为 3.x 平滑过渡）；OSS 维护到 2023.11，商业支持到 2025.08 |
| **3.0** | 2022.11 | **Spring 6.0** | **JDK 17** | **🔥 断代式升级**：Jakarta EE 9（`javax → jakarta`）、AOT + GraalVM Native Image、Observability（Micrometer Tracing）、HTTP Interface |
| **3.1** | 2023.05 | Spring 6.0 | JDK 17 | **Docker Compose / Testcontainers 集成**（启动时自动起依赖容器）、Spring Authorization Server 1.0 |
| **3.2** | 2023.11 | Spring 6.1 | JDK 17 | **🔥 虚拟线程支持（Java 21）**：`spring.threads.virtual.enabled=true` 一行开启；**CRaC**（Coordinated Restore at Checkpoint）启动毫秒级；RestClient |
| **3.3** | 2024.05 | Spring 6.1 | JDK 17 | Native Image 加强、SBOM Actuator 端点、Bitnami CNB 默认镜像 |
| **3.4** | 2024.11 | Spring 6.2 | JDK 17 | 结构化日志（JSON Logs）、Bean Background Initialization、`@SpringBootApplication` 启动加速 |
| **3.5** | 2025.05 | Spring 6.2 | JDK 17 | Bean 配置改进；3.x 末代；商业支持延长 |
| **4.0** | 2025.11（GA） | **Spring 7.0** | **JDK 17 / 25 LTS** | API 模块化重构、强化 AOT 与原生镜像；自动配置进一步精简；HTTP/3 实验 |

::: warning ⚠️ Spring Boot 2.x → 3.x 升级关键点

1. **JDK 17 强制**：2.x 兼容 JDK 8/11/17；3.x 起最低 JDK 17。
2. **Jakarta 包名迁移**：`javax.servlet`、`javax.persistence`、`javax.validation` → `jakarta.*`。**第三方库也必须升级**（Tomcat 10+ / Hibernate 6+ / Spring Cloud 2022.0+）。
3. **配置元数据文件路径变化**：自动配置注册从 `META-INF/spring.factories` 改为 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（一行一个全限定类名）。
4. **`spring-boot-starter-validation` 不再传递依赖**：3.x 中需显式引入。
5. **Native Image 一等公民**：`mvn -Pnative native:compile` 即可生成可执行文件，启动 < 100ms，内存占用 1/10。
6. **虚拟线程改变线程模型直觉**：3.2+ 开启后 Tomcat / @Async / Scheduled 全部走虚拟线程，"线程池调优"思路要重新审视。
:::

### Spring Boot 三阶段心智模型

```
2014 ─────────── 2018 ─────────── 2022 ─────────── 2025+
"约定优于配置时代"  "云原生时代"     "AOT + Jakarta 时代"  "虚拟线程 + 原生镜像时代"
                  (Boot 2 + WebFlux) (Boot 3 + JDK 17)    (Boot 3.2+ / Boot 4)
   Boot 1.x       Boot 2.x          Boot 3.0-3.1         Boot 3.2+ / 4.0
   省 XML、嵌 Tomcat 响应式 + 指标体系  Jakarta + Native    Loom + CRaC + JSON 日志
```

**面试黄金答法**：被问"Spring Boot 这些年演进"按这四阶段讲，强调**"3.0 是 2014 以来最大的一次断代升级（JDK + Jakarta + Native），不是日常小版本迭代"**，并补一句"**2026 主流已到 3.4+，部分新项目开始用 3.5 / 4.0**"。

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
