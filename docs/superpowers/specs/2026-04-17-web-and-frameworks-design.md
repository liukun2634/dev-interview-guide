# Web 与框架章节设计文档

**日期**：2026-04-17
**定位**：核心原理简明讲清 + 每节末尾附"面试常问 & 怎么答"。覆盖到 Spring Boot 3 / Spring 6 新特性。
**组织方式**：按技术栈分层递进。
**格式**：沿用数据结构与算法章节的统一模式。

---

## 章节结构

### 1. Web 基础 (`web-basics`)

**概念**：理解 Spring 之前必须搞清的 Web 底层。

**核心内容**：
- Servlet 生命周期（init → service → destroy）
- Filter 与 Listener 机制
- HTTP 请求响应模型（方法、状态码、Header）
- Cookie / Session / Token 对比与选型
- 为什么 Spring 要封装 Servlet

**子页面**：暂不拆分，单页覆盖。

---

### 2. Spring 核心 (`spring-core`)

**概念**：Spring 最底层的容器与编程模型。

**核心内容**：
- IoC 容器与依赖注入原理（构造器 vs Setter vs 字段注入）
- Bean 生命周期（实例化 → 属性填充 → 初始化 → 销毁）与作用域（singleton/prototype 等）
- AOP 实现机制（JDK 动态代理 vs CGLIB）
- 循环依赖与三级缓存
- 常用注解语义（@Component/@Service/@Repository/@Configuration）

**子页面**：
- `ioc-di` — IoC 与依赖注入
- `bean-lifecycle` — Bean 生命周期与作用域
- `aop` — AOP 原理与实践

---

### 3. Spring MVC (`spring-mvc`)

**概念**：Spring 的 Web 请求处理层。

**核心内容**：
- DispatcherServlet 请求处理全流程
- HandlerMapping 与 HandlerAdapter
- 拦截器链（HandlerInterceptor）
- 参数绑定、数据校验（@Valid / @Validated）
- 全局异常处理（@ControllerAdvice / @ExceptionHandler）
- RESTful API 设计（整合现有 `restful-api.md`）

**子页面**：
- `request-flow` — 请求处理流程
- `restful-api` — RESTful API（现有内容迁移）

---

### 4. Spring Boot (`spring-boot`)

**概念**：Spring 的约定优于配置层，理解自动装配是关键。

**核心内容**：
- 自动配置原理（@EnableAutoConfiguration → spring.factories / AutoConfiguration.imports）
- 条件注解体系（@ConditionalOnClass/OnProperty/OnBean 等）
- Starter 机制与自定义 Starter
- 配置体系（yaml / properties / Profile / 配置优先级）
- Actuator 健康检查与监控端点

**子页面**：
- `auto-configuration` — 自动配置原理
- `configuration` — 配置体系与 Profile

---

### 5. 数据访问与事务 (`data-access`)

**概念**：Spring 对持久层的统一抽象与事务管理。

**核心内容**：
- Spring 事务管理（声明式 vs 编程式、PlatformTransactionManager）
- 事务传播行为（REQUIRED / REQUIRES_NEW / NESTED 等）
- @Transactional 失效的典型场景（自调用、异常类型、非 public 方法）
- JPA vs MyBatis 选型与集成要点
- 数据源与连接池配置（HikariCP）

**子页面**：
- `transaction` — 事务管理与传播行为
- `orm-integration` — JPA 与 MyBatis 集成

---

### 6. Spring Security (`spring-security`)

**概念**：Spring 的安全框架，核心是过滤器链。

**核心内容**：
- SecurityFilterChain 架构
- 认证流程（表单登录 / JWT / OAuth2）
- 授权模型（RBAC、方法级安全 @PreAuthorize）
- CORS / CSRF 处理
- 常见安全问题与防范

**子页面**：暂不拆分，单页覆盖。

---

### 7. Spring Boot 3 与新特性 (`spring-boot3-new-features`)

**概念**：Spring 6 / Boot 3 引入的重要变化。

**核心内容**：
- Jakarta EE 迁移（javax → jakarta 命名空间）
- GraalVM Native Image 支持（AOT 编译、限制与适用场景）
- 虚拟线程（Project Loom）集成
- 声明式 HTTP 客户端（@HttpExchange）
- Observability 体系（Micrometer Tracing / Observation API）
- ProblemDetail 错误响应（RFC 9457）

**子页面**：暂不拆分，单页覆盖。

---

### 8. Spring Cloud 速查 (`spring-cloud-overview`)

**概念**：微服务基础设施的 Spring 实现，轻量速查。

**核心内容**：
- 服务注册与发现（Nacos / Eureka）
- API 网关（Spring Cloud Gateway）
- 熔断与限流（Sentinel / Resilience4j）
- 分布式配置中心（Nacos Config）
- 深度内容指向 `system-design/microservices`

**子页面**：暂不拆分，单页覆盖。

---

## 每节统一格式

```markdown
## 概念
这一节在讲什么

## 怎么处理
核心原理与关键流程

## 典型知识点
展开的子页面链接表

## 面试常问 & 怎么答
高频问题 + 简明回答思路

## 看到什么就先想到这类
触发信号
```

## 现有内容处理

- `docs/web-and-frameworks/restful-api.md` 保留，移动到 Spring MVC 节下

## 文件结构

```
docs/web-and-frameworks/
├── index.md                    # 章节总览
├── web-basics.md               # 1. Web 基础
├── spring-core/
│   ├── index.md                # 2. 概念与处理
│   ├── ioc-di.md
│   ├── bean-lifecycle.md
│   └── aop.md
├── spring-mvc/
│   ├── index.md                # 3. 概念与处理
│   ├── request-flow.md
│   └── restful-api.md          # 现有内容迁移
├── spring-boot/
│   ├── index.md                # 4. 概念与处理
│   ├── auto-configuration.md
│   └── configuration.md
├── data-access/
│   ├── index.md                # 5. 概念与处理
│   ├── transaction.md
│   └── orm-integration.md
├── spring-security.md          # 6. Spring Security
├── spring-boot3-new-features.md # 7. 新特性
└── spring-cloud-overview.md    # 8. Spring Cloud 速查
```
