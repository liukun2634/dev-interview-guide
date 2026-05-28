---
title: Spring WebFlux
---

# Spring WebFlux

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Spring WebFlux 是 Spring 5 引入的**响应式 Web 框架**，与 Spring MVC 并列。MVC 是同步阻塞（一个请求占一个线程），WebFlux 是异步非阻塞（少量线程处理大量请求）。面试核心：**什么时候该用 WebFlux、Mono/Flux 是什么、和 MVC 的区别**。
:::

---

## Spring MVC vs WebFlux 全景对比

```
Spring MVC（命令式）                    Spring WebFlux（响应式）
─────────────────                      ─────────────────────
Servlet API（阻塞 I/O）                 Reactive Streams（非阻塞 I/O）
一个请求 = 一个线程                      一个请求 = 一个事件（Event Loop）
Tomcat / Jetty（Servlet 容器）          Netty / Undertow（非 Servlet 容器）
返回值：POJO / ResponseEntity           返回值：Mono<T> / Flux<T>
@Controller + @RequestMapping           @Controller 或 RouterFunction
同步编程模型                             异步响应式编程模型
```

| 对比项 | Spring MVC | Spring WebFlux |
|--------|-----------|----------------|
| 编程模型 | 命令式（Imperative） | 响应式（Reactive） |
| I/O 模型 | 同步阻塞 | 异步非阻塞 |
| 线程模型 | 每请求一线程（thread-per-request） | 事件循环（Event Loop），少量线程 |
| 底层容器 | Servlet 容器（Tomcat、Jetty） | Netty（默认）、Undertow、Servlet 3.1+ |
| 返回类型 | `T`、`ResponseEntity<T>` | `Mono<T>`、`Flux<T>` |
| 数据库访问 | JDBC / JPA（阻塞） | R2DBC / Reactive MongoDB（非阻塞） |
| 适用场景 | CRUD 业务系统、传统 Web 应用 | 高并发网关、流式数据、实时推送 |
| 学习曲线 | 低 | 高（响应式思维转换） |

## 核心概念

### Reactive Streams 规范

WebFlux 基于 Reactive Streams 规范，核心接口：

| 接口 | 职责 |
|------|------|
| `Publisher<T>` | 数据发布者，产生数据流 |
| `Subscriber<T>` | 数据订阅者，消费数据流 |
| `Subscription` | 发布者与订阅者之间的连接，支持背压 |
| `Processor<T,R>` | 同时是 Publisher 和 Subscriber |

**背压（Backpressure）**：订阅者告诉发布者"我只能处理 N 个"，防止生产速度 > 消费速度导致 OOM。这是响应式编程区别于传统异步回调的关键。

### Mono 与 Flux

```
Mono<T>  ── 0 或 1 个元素的异步序列
  ┌─────┐
  │  T  │──→ onComplete
  └─────┘

Flux<T>  ── 0 到 N 个元素的异步序列
  ┌─┐ ┌─┐ ┌─┐ ┌─┐
  │T│ │T│ │T│ │T│──→ onComplete
  └─┘ └─┘ └─┘ └─┘
```

| 类型 | 语义 | 等价理解 | 典型场景 |
|------|------|---------|---------|
| `Mono<T>` | 0..1 个元素 | 异步的 `Optional<T>` | 查询单个对象、保存操作 |
| `Flux<T>` | 0..N 个元素 | 异步的 `List<T>` / `Stream<T>` | 查询列表、SSE 推送、实时数据流 |

常用操作符：

```java
// Mono
Mono.just("hello")
    .map(String::toUpperCase)
    .flatMap(s -> callRemoteService(s))  // 异步转换
    .defaultIfEmpty("fallback")
    .doOnError(e -> log.error("failed", e))
    .subscribe();

// Flux
Flux.range(1, 10)
    .filter(i -> i % 2 == 0)
    .map(i -> i * 10)
    .buffer(3)              // 按 3 个一组收集
    .delayElements(Duration.ofMillis(100))  // 模拟延迟
    .subscribe(System.out::println);
```

### 两种编程模型

WebFlux 支持两种风格，面试常考区别：

**注解式（与 MVC 相似）：**

```java
@RestController
public class UserController {

    @GetMapping("/users/{id}")
    public Mono<User> getUser(@PathVariable String id) {
        return userRepository.findById(id);  // 返回 Mono
    }

    @GetMapping("/users")
    public Flux<User> listUsers() {
        return userRepository.findAll();  // 返回 Flux
    }
}
```

**函数式路由（RouterFunction）：**

```java
@Configuration
public class RouterConfig {

    @Bean
    public RouterFunction<ServerResponse> routes(UserHandler handler) {
        return RouterFunctions.route()
            .GET("/users/{id}", handler::getUser)
            .GET("/users", handler::listUsers)
            .POST("/users", handler::createUser)
            .build();
    }
}

@Component
public class UserHandler {

    public Mono<ServerResponse> getUser(ServerRequest request) {
        String id = request.pathVariable("id");
        return userRepository.findById(id)
            .flatMap(user -> ServerResponse.ok().bodyValue(user))
            .switchIfEmpty(ServerResponse.notFound().build());
    }
}
```

| 对比项 | 注解式 | 函数式路由 |
|--------|--------|-----------|
| 风格 | 声明式，Spring MVC 迁移成本低 | 函数式，路由集中管理 |
| 路由定义 | 分散在各 Controller | 集中在 RouterFunction |
| 灵活性 | 受注解能力限制 | 完全可编程 |
| 适用场景 | 大多数业务项目 | 轻量级微服务、网关 |

## 线程模型详解

```
Spring MVC（Tomcat）                    Spring WebFlux（Netty）
┌──────────────────┐                    ┌──────────────────┐
│  线程池 200 线程   │                    │ Event Loop 4 线程  │
│                  │                    │  （= CPU 核心数）   │
│ 请求1 → 线程1     │                    │                   │
│ 请求2 → 线程2     │  阻塞等 DB 返回      │ 请求1 → 事件注册    │
│ 请求3 → 线程3     │  线程被占用          │ 请求2 → 事件注册    │
│ ...              │                    │ 请求3 → 事件注册    │
│ 请求200 → 线程200 │                    │ ...               │
│ 请求201 → 排队！  │                    │ 请求10000 → 事件注册 │
└──────────────────┘                    │ DB 回调 → 继续处理   │
                                        └──────────────────┘
```

**关键区别**：MVC 线程在等待 I/O 时被阻塞占用；WebFlux 线程注册回调后立即去处理其他请求，I/O 完成时再回来继续。

::: warning ⚠️ 注意
WebFlux 的 Event Loop 线程不能被阻塞。如果在 WebFlux 中调用了 JDBC、Thread.sleep() 等阻塞操作，会卡死整个 Event Loop，性能比 MVC 还差。**WebFlux 要求全链路非阻塞。**
:::

## WebFlux 与 SSE / WebSocket

WebFlux 天然适合流式数据推送：

**SSE（Server-Sent Events）—— 服务端单向推送：**

```java
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<String>> stream() {
    return Flux.interval(Duration.ofSeconds(1))
        .map(seq -> ServerSentEvent.<String>builder()
            .id(String.valueOf(seq))
            .event("message")
            .data("tick " + seq)
            .build());
}
```

**WebSocket —— 全双工通信：**

```java
@Configuration
public class WebSocketConfig {

    @Bean
    public HandlerMapping webSocketMapping() {
        Map<String, WebSocketHandler> map = Map.of(
            "/ws/chat", session -> {
                Flux<WebSocketMessage> output = session.receive()
                    .map(msg -> session.textMessage("Echo: " + msg.getPayloadAsText()));
                return session.send(output);
            }
        );
        SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping();
        mapping.setUrlMap(map);
        mapping.setOrder(-1);
        return mapping;
    }
}
```

| 推送方式 | 协议 | 方向 | WebFlux 支持 |
|---------|------|------|-------------|
| SSE | HTTP | 服务端 → 客户端 | `Flux<ServerSentEvent>` |
| WebSocket | WS | 双向 | `WebSocketHandler` |
| RSocket | TCP/WebSocket | 双向 + 背压 | Spring 原生集成 |

## R2DBC —— 响应式数据库访问

传统 JDBC 是阻塞的，WebFlux 需要全链路非阻塞，因此使用 R2DBC：

```java
// 传统 JDBC（阻塞）
User user = jdbcTemplate.queryForObject("SELECT ...", User.class);

// R2DBC（非阻塞）
Mono<User> user = r2dbcTemplate.selectOne(query, User.class);
```

| 对比项 | JDBC / JPA | R2DBC |
|--------|-----------|-------|
| I/O 模型 | 阻塞 | 非阻塞 |
| 返回类型 | `T` / `List<T>` | `Mono<T>` / `Flux<T>` |
| 事务管理 | `@Transactional` | `@Transactional`（ReactiveTransactionManager） |
| 支持数据库 | 所有 | PostgreSQL、MySQL、H2、SQL Server 等 |
| ORM 支持 | Hibernate、MyBatis | 无成熟 ORM（Spring Data R2DBC 提供基础映射） |
| 成熟度 | ✅ 非常成熟 | 逐步成熟，生态仍在发展 |

## 什么时候用 WebFlux？

::: details ✅ 适合 WebFlux 的场景
- **API 网关**：高并发转发，Spring Cloud Gateway 底层就是 WebFlux
- **流式数据**：SSE 推送、实时监控、股票行情
- **微服务间调用**：大量 I/O 密集型的服务编排
- **聊天 / 通知系统**：WebSocket 实时通信
- **高并发低延迟**：C10K 问题场景
:::

::: details ❌ 不适合 WebFlux 的场景
- **传统 CRUD 应用**：MVC + JPA 足够，WebFlux 增加复杂度
- **CPU 密集型计算**：WebFlux 不解决 CPU 瓶颈
- **依赖阻塞库**：JDBC、MyBatis、同步 SDK → 破坏非阻塞链路
- **团队不熟悉响应式**：学习成本高，调试困难
:::

## Spring Cloud Gateway 与 WebFlux

Spring Cloud Gateway 是 WebFlux 最经典的落地场景：

```
客户端请求 → Spring Cloud Gateway（基于 WebFlux）
                ├── Route 路由匹配
                ├── Predicate 断言
                ├── Filter 链（限流、鉴权、日志）
                └── 转发到下游微服务

// 为什么用 WebFlux？
// 网关只做转发，几乎全是 I/O 操作
// 非阻塞模型下少量线程即可处理万级并发
```

## 面试常问 & 怎么答

### Q1: Spring MVC 和 WebFlux 的区别？

MVC 是同步阻塞模型，基于 Servlet API，一个请求占一个线程；WebFlux 是异步非阻塞模型，基于 Reactive Streams，使用 Event Loop 少量线程处理大量请求。MVC 适合传统 CRUD，WebFlux 适合高并发 I/O 密集型场景如 API 网关。

### Q2: Mono 和 Flux 是什么？

都是 Project Reactor 的核心类型，实现了 Reactive Streams 的 Publisher 接口。Mono 表示 0 或 1 个元素的异步序列，Flux 表示 0 到 N 个元素的异步序列。它们是惰性的，只有 subscribe 后才会执行。

### Q3: WebFlux 中能用 JDBC 吗？

技术上可以，但不应该。JDBC 是阻塞的，会卡住 Event Loop 线程，导致整个应用性能崩溃。应该用 R2DBC 做响应式数据库访问，或者把阻塞调用通过 `Mono.fromCallable().subscribeOn(Schedulers.boundedElastic())` 调度到独立线程池。

### Q4: 背压（Backpressure）是什么？

背压是响应式流中消费者控制生产者速率的机制。当下游处理不过来时，通过 Subscription.request(n) 告诉上游"我只要 n 个"，防止数据堆积导致 OOM。这是 Reactive Streams 规范的核心特性。

### Q5: 项目中什么时候选 WebFlux？

当系统是 I/O 密集型、需要高并发（如网关、消息推送）且全链路能做到非阻塞时选 WebFlux。如果是传统 CRUD 业务、依赖 JDBC/MyBatis、或团队不熟悉响应式编程，就用 MVC。关键判断标准：全链路能否做到非阻塞。

## 看到什么就先想到这类

- 出现 Mono、Flux、Reactive → Spring WebFlux 响应式编程
- 出现 Event Loop、非阻塞 → WebFlux 线程模型
- 出现 R2DBC → 响应式数据库访问
- 出现 SSE、流式推送 → WebFlux + Flux 实时数据流
- 出现 Spring Cloud Gateway → 基于 WebFlux 的网关
- 出现背压、Backpressure → Reactive Streams 流控机制
