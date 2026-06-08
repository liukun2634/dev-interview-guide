---
title: Web 与框架
---

# Web 与框架

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--hot">🔥 核心章节</span>

::: tip 💡 核心要点
Web 与框架这一章覆盖从 HTTP 请求到后端响应再到前端渲染的完整链路。后端以 Spring 生态为核心（IoC → MVC → Boot → 数据访问 → 安全 → 微服务），前端覆盖 React 和 Angular 两大主流框架。理解每一层解决什么问题、怎么衔接，比孤立背 API 更有用。
:::

---

## 全局视角：一个请求的完整旅程

理解 Web 框架的最好方式是跟踪**一个 HTTP 请求从发出到响应**的完整过程：

```
浏览器/客户端
  ↓ HTTP 请求
Tomcat/Netty（Servlet 容器）
  ↓ Filter 链（编码、CORS、安全）
DispatcherServlet（Spring MVC 前端控制器）
  ↓ HandlerMapping（找到哪个 Controller 处理）
  ↓ Interceptor 链（preHandle）
Controller（业务入口，参数绑定、校验）
  ↓ 调用 Service 层
Service（业务逻辑，@Transactional 事务控制）
  ↓ 调用 DAO/Repository 层
数据访问层（JPA/MyBatis → 数据库）
  ↑ 返回数据
Service → Controller → @ResponseBody → JSON 序列化
  ↑ Interceptor 链（postHandle / afterCompletion）
  ↑ Filter 链
  ↑ HTTP 响应
浏览器/客户端
  ↓ 前端框架（React/Angular）接收 JSON
  ↓ 状态管理 → 组件渲染 → 用户看到页面
```

面试中能画出这张图并说清每一层的职责，就已经展示了对 Web 架构的系统理解。

---

## Spring 生态架构全景

Spring 不是一个框架，而是一个**生态系统**。理解各模块的关系和分层至关重要：

```
┌─────────────────────────────────────────────────────┐
│                   Spring Cloud                       │
│  (Nacos / Gateway / Sentinel / OpenFeign / Config)   │
├─────────────────────────────────────────────────────┤
│                  Spring Boot                         │
│  (自动配置 / Starter / Actuator / 嵌入式服务器)        │
├─────────────────────────────────────────────────────┤
│          Spring MVC        │   Spring Security        │
│  (DispatcherServlet /      │  (过滤器链 / 认证 /       │
│   Controller / 参数绑定)    │   授权 / JWT / OAuth2)    │
├─────────────────────────────────────────────────────┤
│               Spring Data / 事务管理                  │
│  (JPA / MyBatis / @Transactional / 连接池)            │
├─────────────────────────────────────────────────────┤
│                   Spring 核心                         │
│  (IoC 容器 / DI / AOP / Bean 生命周期)                │
└─────────────────────────────────────────────────────┘
```

**从下往上理解**：
- **Spring 核心**是地基——IoC 容器管理所有对象，AOP 实现横切关注点
- **数据访问层**建在核心之上——事务通过 AOP 实现
- **Spring MVC**处理 Web 请求——Controller 方法就是普通的 Spring Bean
- **Spring Boot**简化配置——不引入新功能，只让上述组件开箱即用
- **Spring Cloud**面向微服务——在 Boot 之上提供服务注册、网关、熔断等

---

## 前端框架全景

现代 Web 应用的前端同样需要框架来管理复杂的 UI 状态和交互：

| 框架 | 核心思想 | 数据流 | 适合场景 |
|------|---------|--------|---------|
| **React** | UI = f(state)，组件化 + 虚拟 DOM | 单向数据流（state → view） | 灵活选型、生态丰富、中小到大型项目 |
| **Angular** | 全功能框架、依赖注入、TypeScript 优先 | 双向绑定 + RxJS | 大型企业级应用、团队规范统一 |

**前端框架的共同核心问题：**
1. **组件化**——如何拆分和复用 UI
2. **状态管理**——数据在哪里存、怎么更新、怎么同步
3. **路由**——单页应用的页面切换
4. **与后端通信**——HTTP 请求、错误处理、加载状态
5. **性能优化**——减少不必要的渲染和重绘

---

## 面试中 Web 框架题的特点

### 后端（Spring）面试特点

Spring 面试题有两个层次：

| 层次 | 问法 | 考查重点 | 举例 |
|------|------|---------|------|
| **用法层** | "怎么用 XX" | 会不会写代码 | "@Transactional 怎么用" |
| **原理层** | "XX 的原理是什么" | 理不理解底层机制 | "@Transactional 为什么会失效" |

一线大厂几乎只问原理层。回答时的策略：
1. **先说"是什么"**——一句话定义
2. **再说"怎么实现"**——核心机制（如 AOP 代理、条件注解）
3. **最后说"有什么坑"**——失效场景、常见误用

### 前端面试特点

| 层次 | 问法 | 考查重点 |
|------|------|---------|
| 概念层 | "虚拟 DOM 是什么" | 理解核心原理 |
| 实战层 | "怎么优化列表渲染" | 解决实际性能问题 |
| 设计层 | "设计一个状态管理方案" | 架构思维 |

---

## 学习技巧与直觉培养

### 技巧一：理解"为什么有这个东西"比"怎么用"更重要

每个框架/组件的存在都是为了解决一个具体痛点：

| 技术 | 解决的痛点 |
|------|-----------|
| IoC/DI | 对象之间硬编码依赖 → 难以测试和替换 |
| AOP | 日志/事务等横切逻辑散布在各处 → 难以维护 |
| Spring MVC | 手写 Servlet 太繁琐 → 注解驱动简化 |
| Spring Boot | Spring XML 配置地狱 → 自动配置零配置启动 |
| @Transactional | 手动管理事务代码冗长 → 声明式一行注解搞定 |
| React/虚拟 DOM | 直接操作 DOM 性能差且易出错 → 声明式 UI + diff 算法 |
| Angular/DI | 前端组件依赖管理混乱 → 框架级依赖注入 |

面试时说出"它解决了什么问题"，比背 API 更有说服力。

### 技巧二：对比学习

很多概念成对出现，对比记忆效率更高：

| 对比项 | A | B | 核心区别 |
|--------|---|---|---------|
| Filter vs Interceptor | Servlet 层 | Spring MVC 层 | Filter 先执行，Interceptor 能访问 Spring 容器 |
| @Controller vs @RestController | 返回视图 | 返回 JSON | @RestController = @Controller + @ResponseBody |
| JPA vs MyBatis | ORM 全自动映射 | SQL 半自动映射 | JPA 简单 CRUD 省事，MyBatis 复杂 SQL 灵活 |
| REQUIRED vs REQUIRES_NEW | 加入当前事务 | 新建独立事务 | 内层回滚是否影响外层 |
| singleton vs prototype | 容器一个实例 | 每次新实例 | singleton 注入 prototype 有坑 |
| React vs Angular | 库（灵活选型） | 全功能框架 | React 生态自由、Angular 开箱即用 |

### 技巧三：画流程图是最好的理解方法

Spring 的核心机制都可以用流程图表达：
- **请求处理流程**：Filter → DispatcherServlet → Interceptor → Controller → Service → DAO
- **Bean 生命周期**：实例化 → 属性注入 → Aware 回调 → BeanPostProcessor → init → 使用 → destroy
- **AOP 代理**：调用代理对象 → 切面逻辑（前置通知）→ 目标方法 → 切面逻辑（后置通知）
- **自动配置**：@SpringBootApplication → @EnableAutoConfiguration → 加载配置类 → 条件匹配 → 注册 Bean

面试时主动画图，展示你的系统思维。

### 技巧四：从"失效场景"反推原理

Spring 面试最爱问"XX 什么时候会失效"。理解失效原因就是理解原理：

| 失效场景 | 反推出的原理 |
|---------|------------|
| @Transactional 自调用失效 | 事务基于 AOP 代理，this 调用不走代理 |
| @Async 自调用失效 | 同上，也是 AOP 代理 |
| private 方法上的 @Transactional 无效 | JDK 动态代理基于接口，CGLIB 要求方法可继承 |
| @Cacheable 在同一个类中调用无效 | 同样是代理问题 |
| Filter 中无法注入 Spring Bean | Filter 由 Servlet 容器管理，不是 Spring Bean |

一个原理（AOP 代理）解释了五个失效场景。面试时说"这些本质上都是同一个原因"会非常加分。

---

## 分类地图

### 后端：Spring 生态

| 类别 | 核心内容 | 面试频率 | 详细页面 |
|------|---------|---------|---------|
| Web 基础 | Servlet、HTTP、Cookie/Session/Token | 🔥🔥 | [Web 基础](./web-basics) |
| Spring 核心 | IoC/DI、AOP、Bean 生命周期、循环依赖 | 🔥🔥🔥 | [Spring 核心](./spring-core/) |
| Spring MVC | DispatcherServlet 流程、参数绑定、异常处理 | 🔥🔥🔥 | [Spring MVC](./spring-mvc/) |
| Spring Boot | 自动配置原理、Starter、配置体系 | 🔥🔥🔥 | [Spring Boot](./spring-boot/) |
| 数据访问与事务 | @Transactional 原理与失效、JPA/MyBatis | 🔥🔥🔥 | [数据访问与事务](./data-access/) |
| Spring Security | 过滤器链、JWT、RBAC | 🔥🔥 | [Spring Security](./spring-security) |
| Spring Boot 3 新特性 | Jakarta 迁移、Native Image、虚拟线程 | 🔥 | [Spring Boot 3 新特性](./spring-boot3-new-features) |
| Spring Cloud 速查 | Nacos、Gateway、Sentinel、Seata、Micrometer Tracing | 🔥🔥 | [Spring Cloud 速查](./spring-cloud-overview) |

### Java 后端框架进阶（Spring 之外）

| 类别 | 核心内容 | 面试频率 | 详细页面 |
|------|---------|---------|---------|
| 🔥 Java 云原生 | Quarkus / Micronaut / Helidon vs Spring Boot、Native Image 实测、CRaC | 🔥🔥（外企/云原生） | [Java 云原生框架](./java-cloud-native) |
| 🔥 Apache Dubbo 3 | Triple 协议、应用级注册、SPI、Dubbo vs Spring Cloud vs gRPC | 🔥🔥🔥（国内必考） | [Apache Dubbo 3](./dubbo) |
| 响应式 Java | Reactor / RxJava / Vert.x / Mutiny / Pekko、虚拟线程时代选型 | 🔥（金融/网关） | [响应式 Java](./reactive-java) |

### 前端：主流框架

| 类别 | 核心内容 | 面试频率 | 详细页面 |
|------|---------|---------|---------|
| React | 组件化、Hooks、虚拟 DOM、状态管理、RSC、React 19、微前端 | 🔥🔥🔥 | [React](./react) |
| Angular | 模块化、依赖注入、RxJS、变更检测、Signals、Zoneless | 🔥🔥 | [Angular](./angular) |
| TypeScript | 类型系统、infer/satisfies、5.x 新特性、Branded Types | 🔥🔥🔥 | [TypeScript](./typescript) |

---

## 建议学习顺序

### 后端学习路线

```
第一阶段（基础，必须掌握）：
  Web 基础 → Spring 核心（IoC/AOP/Bean）

第二阶段（核心，面试重点）：
  Spring MVC → Spring Boot → 数据访问与事务

第三阶段（进阶，按需深入）：
  Spring Security → Spring Boot 3 新特性 → Spring Cloud
```

### 前端学习路线

```
选择一个深入（根据目标岗位）：
  React（更通用、生态更大）
  Angular（企业级、全功能）

两者共通的基础：
  组件化 → 状态管理 → 路由 → HTTP 通信 → 性能优化
```

---

## 总结速查表

### Spring 核心注解速查

| 注解 | 作用 | 所属模块 |
|------|------|---------|
| `@Component / @Service / @Repository` | 标记 Bean，交给容器管理 | Spring Core |
| `@Autowired` | 自动注入依赖 | Spring Core |
| `@Aspect / @Around / @Before` | 定义切面和通知 | Spring AOP |
| `@Controller / @RestController` | 标记 Controller | Spring MVC |
| `@RequestMapping / @GetMapping` | 映射请求路径 | Spring MVC |
| `@RequestBody / @ResponseBody` | JSON 请求体/响应体 | Spring MVC |
| `@Valid / @Validated` | 参数校验 | Spring MVC |
| `@Transactional` | 声明式事务 | Spring TX |
| `@SpringBootApplication` | Boot 启动类（含自动配置） | Spring Boot |
| `@ConfigurationProperties` | 配置绑定到 POJO | Spring Boot |
| `@ConditionalOnClass / OnBean` | 条件注解 | Spring Boot |

### 高频面试题速查

| 问题 | 核心答案 | 详见 |
|------|---------|------|
| IoC 是什么？ | 对象创建交给容器，DI 是实现方式 | [IoC 与 DI](./spring-core/ioc-di) |
| 循环依赖怎么解决？ | 三级缓存（singletonFactories 提前暴露半成品） | [IoC 与 DI](./spring-core/ioc-di) |
| Bean 生命周期？ | 实例化→属性注入→Aware→BeanPostProcessor→init→使用→destroy | [Bean 生命周期](./spring-core/bean-lifecycle) |
| AOP 原理？JDK vs CGLIB？ | JDK 代理接口，CGLIB 代理子类 | [AOP](./spring-core/aop) |
| DispatcherServlet 流程？ | HandlerMapping→HandlerAdapter→Controller→ViewResolver | [请求处理流程](./spring-mvc/request-flow) |
| @Transactional 为什么失效？ | 自调用不走代理、非 public、异常被吞等 | [事务管理](./data-access/transaction) |
| 自动配置原理？ | @EnableAutoConfiguration + 条件注解 + SPI 机制 | [自动配置](./spring-boot/auto-configuration) |
| Spring Security 认证流程？ | FilterChain → AuthenticationManager → UserDetailsService | [Spring Security](./spring-security) |

### 对比速查

| A | B | 一句话区别 |
|---|---|-----------|
| BeanFactory | ApplicationContext | ApplicationContext 是 BeanFactory 的超集，支持事件、国际化 |
| @Autowired | @Resource | @Autowired 按类型，@Resource 按名称 |
| JDK 代理 | CGLIB 代理 | JDK 代理接口，CGLIB 代理类（final 类不行） |
| Filter | Interceptor | Filter 是 Servlet 层，Interceptor 是 Spring MVC 层 |
| REQUIRED | REQUIRES_NEW | REQUIRED 加入当前事务，REQUIRES_NEW 挂起当前新建 |
| JPA | MyBatis | JPA 全自动 ORM，MyBatis 半自动（写 SQL） |
| React | Angular | React 是库(灵活)，Angular 是全功能框架(规范) |
