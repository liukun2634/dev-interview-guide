# Web 与框架章节实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `docs/web-and-frameworks/` 创建完整的 Spring 生态面试知识体系，8 节内容按技术栈分层递进。

**Architecture:** VitePress 文档站点，所有内容为 Markdown 文件。每节有 index.md（概念与处理）和可选子页面。Sidebar 配置在 `docs/.vitepress/config.ts` 中。

**Tech Stack:** VitePress, Markdown

**Spec:** `docs/superpowers/specs/2026-04-17-web-and-frameworks-design.md`

---

### Task 1: 创建章节总览 index.md

**Files:**
- Modify: `docs/web-and-frameworks/index.md`

- [ ] **Step 1: 重写 index.md**

替换现有内容，采用与 `docs/data-structures-and-algorithms/index.md` 相同的结构（分类地图表格 + 怎么使用 + 建议顺序）。

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/web-and-frameworks/index.md
git commit -m "docs: rewrite web-and-frameworks index with layered structure"
```

---

### Task 2: Web 基础 (`web-basics.md`)

**Files:**
- Create: `docs/web-and-frameworks/web-basics.md`

- [ ] **Step 1: 创建 web-basics.md**

内容覆盖：
- 概念：理解 Spring 之前必须搞清的 Web 底层
- 怎么处理：
  - Servlet 生命周期（init → service → destroy）
  - Servlet 容器（Tomcat）的工作原理：监听端口 → 接收请求 → 创建 Request/Response 对象 → 调用 Servlet → 返回响应
  - Filter 链机制（请求预处理 / 响应后处理，与 Spring 拦截器的区别）
  - Listener 机制（ServletContextListener、HttpSessionListener）
  - HTTP 请求响应模型要点（方法语义、状态码分类、Header 常用字段）
  - Cookie vs Session vs Token 对比表（存储位置、安全性、跨域、扩展性）
  - 为什么 Spring 要封装 Servlet（模板代码多、请求参数解析繁琐、缺少 IoC 支持）
- 面试常问 & 怎么答：
  - Servlet 生命周期？
  - Filter 和 Interceptor 的区别？
  - Cookie、Session、Token 各自的优缺点？
  - 为什么现在更倾向用 Token（JWT）而不是 Session？
- 看到什么就先想到这类：出现 Servlet、Filter、Cookie、Session、HTTP 基础

格式参照 `docs/data-structures-and-algorithms/arrays/index.md` 的概念/怎么处理/典型实例结构，末尾加"面试常问 & 怎么答"和"看到什么就先想到这类"。

- [ ] **Step 2: Commit**

```bash
git add docs/web-and-frameworks/web-basics.md
git commit -m "docs: add web basics - Servlet, HTTP, Cookie/Session/Token"
```

---

### Task 3: Spring 核心 — index + 三个子页面

**Files:**
- Create: `docs/web-and-frameworks/spring-core/index.md`
- Create: `docs/web-and-frameworks/spring-core/ioc-di.md`
- Create: `docs/web-and-frameworks/spring-core/bean-lifecycle.md`
- Create: `docs/web-and-frameworks/spring-core/aop.md`

- [ ] **Step 1: 创建 spring-core/index.md**

概念页，覆盖：
- 概念：Spring 最底层的容器与编程模型
- 怎么处理：先理解 IoC 容器怎么管理对象的创建和依赖关系，再理解 AOP 怎么实现横切关注点
- 典型知识点表格：链接到 ioc-di、bean-lifecycle、aop
- 面试常问：什么是 IoC？什么是 AOP？Spring Bean 的作用域有哪些？
- 看到什么就先想到这类：出现依赖注入、Bean、代理、切面

- [ ] **Step 2: 创建 spring-core/ioc-di.md**

内容覆盖：
- IoC（控制反转）的核心思想：对象的创建和依赖关系由容器管理，而非对象自己 new
- DI 的三种方式：构造器注入（推荐）、Setter 注入、字段注入（@Autowired 直接标注字段，不推荐）
- BeanFactory vs ApplicationContext
- @Component / @Service / @Repository / @Controller 的语义区别
- @Autowired vs @Resource vs @Inject
- 循环依赖与三级缓存（singletonObjects → earlySingletonObjects → singletonFactories）
- 循环依赖在构造器注入下无法解决（Spring Boot 3 默认禁止循环依赖）
- 面试常问：什么是 IoC 和 DI？三级缓存解决循环依赖的流程？为什么推荐构造器注入？

- [ ] **Step 3: 创建 spring-core/bean-lifecycle.md**

内容覆盖：
- Bean 完整生命周期：实例化 → 属性填充 → Aware 接口回调 → BeanPostProcessor#postProcessBeforeInitialization → @PostConstruct / InitializingBean#afterPropertiesSet / init-method → BeanPostProcessor#postProcessAfterInitialization → 使用 → @PreDestroy / DisposableBean#destroy / destroy-method
- Bean 作用域：singleton（默认）、prototype、request、session、application
- singleton vs prototype 的关键区别（容器管理 vs 不管理销毁）
- @Scope 和作用域代理
- 面试常问：Bean 生命周期的完整流程？singleton 和 prototype 的区别？BeanPostProcessor 的作用？

- [ ] **Step 4: 创建 spring-core/aop.md**

内容覆盖：
- AOP 核心概念：切面（Aspect）、连接点（JoinPoint）、切入点（Pointcut）、通知（Advice）、织入（Weaving）
- 五种通知类型：@Before、@After、@AfterReturning、@AfterThrowing、@Around
- Spring AOP 实现机制：JDK 动态代理（接口）vs CGLIB（类），Spring Boot 默认使用 CGLIB
- AOP 的典型应用：日志、事务（@Transactional）、权限校验、缓存
- AOP 失效场景：自调用（同类方法调用不经过代理）、private/final 方法、非 Spring 管理的对象
- 面试常问：JDK 动态代理和 CGLIB 的区别？AOP 在什么场景下会失效？@Transactional 为什么会失效？

- [ ] **Step 5: Commit**

```bash
git add docs/web-and-frameworks/spring-core/
git commit -m "docs: add Spring core - IoC/DI, Bean lifecycle, AOP"
```

---

### Task 4: Spring MVC — index + 子页面 + 迁移 restful-api

**Files:**
- Create: `docs/web-and-frameworks/spring-mvc/index.md`
- Create: `docs/web-and-frameworks/spring-mvc/request-flow.md`
- Move: `docs/web-and-frameworks/restful-api.md` → `docs/web-and-frameworks/spring-mvc/restful-api.md`

- [ ] **Step 1: 创建 spring-mvc/index.md**

概念页，覆盖：
- 概念：Spring 的 Web 请求处理层，基于 Servlet 封装
- 怎么处理：理解一个 HTTP 请求从进入 DispatcherServlet 到返回响应的完整流程
- 典型知识点：链接到 request-flow、restful-api
- 面试常问：Spring MVC 的请求处理流程？拦截器和 Filter 的区别？@Controller 和 @RestController 的区别？
- 看到什么就先想到这类：出现 Controller、RequestMapping、拦截器、参数校验、异常处理

- [ ] **Step 2: 创建 spring-mvc/request-flow.md**

内容覆盖：
- DispatcherServlet 完整请求处理流程：
  1. 接收请求
  2. HandlerMapping 查找 Handler（Controller 方法）
  3. HandlerAdapter 执行 Handler
  4. 拦截器链（preHandle → Handler 执行 → postHandle → afterCompletion）
  5. ViewResolver 解析视图（前后端分离下直接返回 JSON）
  6. 返回响应
- 参数绑定：@RequestParam、@PathVariable、@RequestBody、@ModelAttribute
- 数据校验：@Valid / @Validated + BindingResult，分组校验
- 全局异常处理：@ControllerAdvice + @ExceptionHandler
- @Controller vs @RestController（后者 = @Controller + @ResponseBody）
- 面试常问：DispatcherServlet 的工作流程？@Valid 和 @Validated 的区别？如何实现全局异常处理？

- [ ] **Step 3: 迁移 restful-api.md**

```bash
git mv docs/web-and-frameworks/restful-api.md docs/web-and-frameworks/spring-mvc/restful-api.md
```

- [ ] **Step 4: Commit**

```bash
git add docs/web-and-frameworks/spring-mvc/
git commit -m "docs: add Spring MVC - request flow, migrate RESTful API"
```

---

### Task 5: Spring Boot — index + 子页面

**Files:**
- Create: `docs/web-and-frameworks/spring-boot/index.md`
- Create: `docs/web-and-frameworks/spring-boot/auto-configuration.md`
- Create: `docs/web-and-frameworks/spring-boot/configuration.md`

- [ ] **Step 1: 创建 spring-boot/index.md**

概念页，覆盖：
- 概念：Spring 的约定优于配置层，理解自动装配是关键
- 怎么处理：先理解 @SpringBootApplication 背后做了什么，再理解配置加载优先级
- 典型知识点：链接到 auto-configuration、configuration
- 面试常问：Spring Boot 的自动配置原理？Starter 是什么？Spring Boot 和 Spring 的区别？
- 看到什么就先想到这类：出现自动配置、Starter、application.yml、Actuator

- [ ] **Step 2: 创建 spring-boot/auto-configuration.md**

内容覆盖：
- @SpringBootApplication = @SpringBootConfiguration + @EnableAutoConfiguration + @ComponentScan
- 自动配置加载机制：
  - Spring Boot 2.x：META-INF/spring.factories
  - Spring Boot 3.x：META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
- 条件注解体系：@ConditionalOnClass、@ConditionalOnMissingBean、@ConditionalOnProperty 等
- 自动配置生效判断流程：有类 → 没有用户自定义 Bean → 条件满足 → 自动注册
- Starter 机制：starter 引入依赖 + autoconfigure 提供自动配置类
- 自定义 Starter 的步骤（简述）
- 面试常问：自动配置的加载流程？@ConditionalOnMissingBean 的作用？如何自定义 Starter？

- [ ] **Step 3: 创建 spring-boot/configuration.md**

内容覆盖：
- 配置文件格式：application.properties vs application.yml
- 配置加载优先级（命令行参数 > 环境变量 > application-{profile}.yml > application.yml）
- Profile 机制（spring.profiles.active）
- 配置绑定：@Value、@ConfigurationProperties（类型安全，推荐）
- Actuator 端点：/health、/info、/metrics、/env，生产环境安全配置
- 面试常问：配置加载优先级？@Value 和 @ConfigurationProperties 的区别？Actuator 有哪些常用端点？

- [ ] **Step 4: Commit**

```bash
git add docs/web-and-frameworks/spring-boot/
git commit -m "docs: add Spring Boot - auto-configuration, configuration system"
```

---

### Task 6: 数据访问与事务 — index + 子页面

**Files:**
- Create: `docs/web-and-frameworks/data-access/index.md`
- Create: `docs/web-and-frameworks/data-access/transaction.md`
- Create: `docs/web-and-frameworks/data-access/orm-integration.md`

- [ ] **Step 1: 创建 data-access/index.md**

概念页，覆盖：
- 概念：Spring 对持久层的统一抽象与事务管理
- 怎么处理：先理解声明式事务的 AOP 实现，再理解事务传播行为
- 典型知识点：链接到 transaction、orm-integration
- 面试常问：@Transactional 的原理？事务传播行为有哪些？@Transactional 失效的场景？
- 看到什么就先想到这类：出现事务、@Transactional、JPA、MyBatis、数据源

- [ ] **Step 2: 创建 data-access/transaction.md**

内容覆盖：
- 声明式事务 vs 编程式事务（TransactionTemplate）
- @Transactional 的 AOP 实现原理：代理对象拦截方法调用 → 开启事务 → 执行方法 → 提交/回滚
- 7 种事务传播行为：REQUIRED（默认）、REQUIRES_NEW、NESTED、SUPPORTS、NOT_SUPPORTED、MANDATORY、NEVER，每种给出一句话解释 + 典型场景
- 事务隔离级别（与数据库章节衔接）
- @Transactional 失效的典型场景：
  1. 自调用（同类中 this.method() 不经过代理）
  2. 方法不是 public
  3. 异常类型不对（默认只回滚 RuntimeException 和 Error）
  4. 捕获了异常没有重新抛出
  5. 数据库引擎不支持事务（MyISAM）
- 面试常问：@Transactional 失效的 5 种场景？REQUIRED 和 REQUIRES_NEW 的区别？

- [ ] **Step 3: 创建 data-access/orm-integration.md**

内容覆盖：
- Spring Data JPA vs MyBatis 选型对比表（开发效率、灵活性、学习成本、适用场景）
- Spring Data JPA 核心：Repository 接口、方法名推导查询、@Query
- MyBatis 核心：XML 映射 vs 注解、动态 SQL、ResultMap
- MyBatis-Plus 简述（在 MyBatis 基础上的增强）
- 数据源与连接池：HikariCP（Spring Boot 默认）配置要点
- 面试常问：JPA 和 MyBatis 怎么选？MyBatis 的 # 和 $ 的区别（SQL 注入）？

- [ ] **Step 4: Commit**

```bash
git add docs/web-and-frameworks/data-access/
git commit -m "docs: add data access - transaction management, ORM integration"
```

---

### Task 7: Spring Security (`spring-security.md`)

**Files:**
- Create: `docs/web-and-frameworks/spring-security.md`

- [ ] **Step 1: 创建 spring-security.md**

内容覆盖：
- 概念：Spring 的安全框架，核心是过滤器链
- 怎么处理：
  - SecurityFilterChain 架构：DelegatingFilterProxy → FilterChainProxy → 多个 SecurityFilterChain
  - 核心过滤器：UsernamePasswordAuthenticationFilter、BasicAuthenticationFilter、ExceptionTranslationFilter、FilterSecurityInterceptor / AuthorizationFilter
  - 认证流程：AuthenticationManager → AuthenticationProvider → UserDetailsService
  - JWT 认证实现思路：自定义 Filter 解析 Token → 设置 SecurityContext
  - OAuth2 登录（Spring Security OAuth2 Client）简述
  - 授权模型：
    - URL 级别：requestMatchers().hasRole()
    - 方法级别：@PreAuthorize、@Secured
    - RBAC 模型（角色 - 权限）
  - CORS 配置（CorsConfigurationSource）
  - CSRF 防护（何时启用 / 前后端分离下通常禁用）
- 面试常问：Spring Security 的过滤器链执行流程？认证和授权的区别？JWT 和 Session 的优缺点？如何实现 RBAC？
- 看到什么就先想到这类：出现认证、授权、JWT、OAuth、RBAC、CORS、CSRF

- [ ] **Step 2: Commit**

```bash
git add docs/web-and-frameworks/spring-security.md
git commit -m "docs: add Spring Security - filter chain, auth, RBAC"
```

---

### Task 8: Spring Boot 3 新特性 (`spring-boot3-new-features.md`)

**Files:**
- Create: `docs/web-and-frameworks/spring-boot3-new-features.md`

- [ ] **Step 1: 创建 spring-boot3-new-features.md**

内容覆盖：
- 概念：Spring 6 / Boot 3 引入的重要变化
- 怎么处理：
  - Jakarta EE 迁移：javax.* → jakarta.*，影响范围（Servlet、JPA、Validation、Mail 等）
  - GraalVM Native Image：
    - AOT（Ahead-of-Time）编译 vs JIT
    - 优势：毫秒级启动、更低内存
    - 限制：反射需声明、动态代理受限、构建慢
    - 适用场景：Serverless、CLI 工具、微服务
  - 虚拟线程（Project Loom / JDK 21）：
    - 虚拟线程 vs 平台线程
    - Spring Boot 配置：spring.threads.virtual.enabled=true
    - 适用场景：I/O 密集型服务
    - 注意事项：避免 synchronized（pin 住载体线程），用 ReentrantLock 替代
  - 声明式 HTTP 客户端（@HttpExchange）：
    - 定义接口 + 注解 → Spring 生成代理
    - 对比 RestTemplate / WebClient / OpenFeign
  - Observability 体系：
    - Micrometer Observation API
    - Micrometer Tracing（替代 Spring Cloud Sleuth）
    - 与 Zipkin / Grafana Tempo 集成
  - ProblemDetail（RFC 9457）：标准化错误响应格式
- 面试常问：Spring Boot 3 有哪些重大变化？GraalVM Native Image 的优势和限制？虚拟线程和平台线程的区别？
- 看到什么就先想到这类：出现 Jakarta、Native Image、虚拟线程、@HttpExchange、Observability

- [ ] **Step 2: Commit**

```bash
git add docs/web-and-frameworks/spring-boot3-new-features.md
git commit -m "docs: add Spring Boot 3 new features - Native Image, virtual threads, observability"
```

---

### Task 9: Spring Cloud 速查 (`spring-cloud-overview.md`)

**Files:**
- Create: `docs/web-and-frameworks/spring-cloud-overview.md`

- [ ] **Step 1: 创建 spring-cloud-overview.md**

内容覆盖：
- 概念：微服务基础设施的 Spring 实现，轻量速查
- 怎么处理：
  - 服务注册与发现：Nacos vs Eureka 对比（Nacos 支持配置管理 + AP/CP 切换）
  - API 网关：Spring Cloud Gateway（基于 WebFlux，替代 Zuul），核心概念（Route、Predicate、Filter）
  - 熔断与限流：Sentinel vs Resilience4j 对比，熔断器状态机（Closed → Open → Half-Open）
  - 分布式配置中心：Nacos Config，配置热更新（@RefreshScope）
  - 服务调用：OpenFeign 声明式调用 + 负载均衡（Spring Cloud LoadBalancer）
  - 深度内容指向：[微服务架构](../system-design/microservices)
- 面试常问：Nacos 和 Eureka 的区别？Gateway 和 Zuul 的区别？什么是熔断？Sentinel 的限流策略？
- 看到什么就先想到这类：出现注册发现、网关、熔断、限流、配置中心

- [ ] **Step 2: Commit**

```bash
git add docs/web-and-frameworks/spring-cloud-overview.md
git commit -m "docs: add Spring Cloud overview - Nacos, Gateway, Sentinel"
```

---

### Task 10: 更新 VitePress sidebar 配置

**Files:**
- Modify: `docs/.vitepress/config.ts`

- [ ] **Step 1: 更新 sidebar 配置**

将 `config.ts` 中 `'/web-and-frameworks/'` 的 sidebar 替换为：

```typescript
'/web-and-frameworks/': [
  {
    text: 'Web 基础',
    collapsed: false,
    items: [
      { text: '章节概览', link: '/web-and-frameworks/' },
      { text: 'Web 基础', link: '/web-and-frameworks/web-basics' },
    ],
  },
  {
    text: 'Spring 核心',
    collapsed: false,
    items: [
      { text: '概念与处理', link: '/web-and-frameworks/spring-core/' },
      { text: 'IoC 与依赖注入', link: '/web-and-frameworks/spring-core/ioc-di' },
      { text: 'Bean 生命周期与作用域', link: '/web-and-frameworks/spring-core/bean-lifecycle' },
      { text: 'AOP 原理与实践', link: '/web-and-frameworks/spring-core/aop' },
    ],
  },
  {
    text: 'Spring MVC',
    collapsed: false,
    items: [
      { text: '概念与处理', link: '/web-and-frameworks/spring-mvc/' },
      { text: '请求处理流程', link: '/web-and-frameworks/spring-mvc/request-flow' },
      { text: 'RESTful API', link: '/web-and-frameworks/spring-mvc/restful-api' },
    ],
  },
  {
    text: 'Spring Boot',
    collapsed: false,
    items: [
      { text: '概念与处理', link: '/web-and-frameworks/spring-boot/' },
      { text: '自动配置原理', link: '/web-and-frameworks/spring-boot/auto-configuration' },
      { text: '配置体系与 Profile', link: '/web-and-frameworks/spring-boot/configuration' },
    ],
  },
  {
    text: '数据访问与事务',
    collapsed: false,
    items: [
      { text: '概念与处理', link: '/web-and-frameworks/data-access/' },
      { text: '事务管理与传播行为', link: '/web-and-frameworks/data-access/transaction' },
      { text: 'JPA 与 MyBatis 集成', link: '/web-and-frameworks/data-access/orm-integration' },
    ],
  },
  {
    text: 'Spring Security',
    collapsed: false,
    items: [
      { text: 'Spring Security', link: '/web-and-frameworks/spring-security' },
    ],
  },
  {
    text: 'Spring Boot 3 与新特性',
    collapsed: false,
    items: [
      { text: 'Spring Boot 3 新特性', link: '/web-and-frameworks/spring-boot3-new-features' },
    ],
  },
  {
    text: 'Spring Cloud 速查',
    collapsed: false,
    items: [
      { text: 'Spring Cloud 速查', link: '/web-and-frameworks/spring-cloud-overview' },
    ],
  },
],
```

- [ ] **Step 2: 本地验证**

```bash
cd docs && npx vitepress dev
```

在浏览器中检查：
- sidebar 所有链接可点击且页面正常渲染
- 现有 RESTful API 页面在新路径下正常访问
- 页面间导航正常

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/config.ts
git commit -m "docs: update sidebar config for web-and-frameworks chapter"
```
