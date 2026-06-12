---
title: 响应式 Java 框架（Vert.x / Reactor / RxJava）
---

# 响应式 Java 框架

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥 中频（金融/网关）</span>

::: tip 💡 核心要点
2026 年 Java 响应式生态三巨头：**Project Reactor**（Spring 栈）、**RxJava 3**（Android / 历史项目）、**Mutiny**（Quarkus）。**Vert.x** 是底层非阻塞工具包，是 Quarkus / Helidon 的引擎。**Akka Classic 已商业化**（Lightbend BSL 协议 2022.09 起），开源用户用 **Pekko**（Apache 接管）。**核心 2026 论断**：**虚拟线程让 80% 业务不再需要响应式**——但**流式数据、背压控制、组合编排、协议层（RSocket / SSE / WebSocket）**仍是响应式不可替代的领域。
:::

---

## 响应式编程定位（先理清概念）

| 概念 | 解释 |
|------|------|
| **Reactive Programming** | 数据流（流）+ 变化传播；声明式异步 |
| **Reactive Streams（规范）** | JVM 标准（JDK 9 `Flow` API）：Publisher / Subscriber / Subscription / Processor，**核心特性是背压** |
| **Reactor / RxJava / Mutiny** | Reactive Streams 的**实现库**（操作符 + 调度器） |
| **响应式系统**（Reactive Manifesto） | 响应迅速、有韧性、有弹性、消息驱动 |

::: warning ⚠️ 概念混乱
"响应式编程"≠"响应式系统"。**操作符流式 API 是编程模型**；**响应式系统是架构理念**（Actor / Akka 才更贴近）。面试不要混用。
:::

---

## 五大框架横评

| 维度 | **Project Reactor** | **RxJava 3** | **Vert.x 5** | **Mutiny** | **Pekko**（Akka 替代） |
|------|--------------------|--------------|--------------|------------|----------------------|
| **首发** | 2013（Spring）| 2014（Netflix）| 2014（Eclipse）| 2019（Quarkus / Red Hat）| 2022（Akka 商业化后 Apache 分叉）|
| **类型** | 操作符库 | 操作符库 | 完整工具包 + 操作符 | 操作符库 | Actor 模型 + 工具包 |
| **底层** | 直接基于 Reactive Streams | 自有 + RS 桥接 | Event Bus + Netty | 自有（更"现代 API"） | Actor / 邮箱 |
| **核心类型** | `Mono<T>` / `Flux<T>` | `Single<T>` / `Maybe<T>` / `Observable<T>` / `Flowable<T>` | `Future<T>` + `Promise<T>` | `Uni<T>` / `Multi<T>` | `ActorRef` |
| **背压（Backpressure）** | ✅ | ✅（Flowable）| ⚠️ 部分 | ✅ | ✅（Stream） |
| **JDK 要求** | 8+ | 8+ | 11+（5.x）| 11+ | 11+ |
| **典型用户** | Spring WebFlux / Cloud Gateway | 历史项目 / Android | Quarkus 引擎、Eclipse / 高吞吐网关 | Quarkus 应用层 | 历史 Akka 用户迁移 |
| **学习曲线** | 高 | 高 | 中（API 简单）| **中等**（API 设计现代）| 极高（Actor 思维） |
| **2026 推荐度** | ★★★★★ | ★★（历史） | ★★★★（特殊场景） | ★★★★（Quarkus 用户）| ★★★（迁移 Akka 用） |

---

## Project Reactor（Spring 生态首选）

### 核心类型

```
Mono<T>  ── 0 或 1 个元素的异步序列
Flux<T>  ── 0 到 N 个元素的异步序列
```

```java
// Mono：单值
Mono.just("hello")
    .map(String::toUpperCase)
    .flatMap(s -> callRemote(s))
    .defaultIfEmpty("fallback")
    .doOnError(e -> log.error("err", e))
    .subscribe(System.out::println);

// Flux：多值
Flux.range(1, 10)
    .filter(i -> i % 2 == 0)
    .buffer(3)
    .delayElements(Duration.ofMillis(100))
    .subscribe(System.out::println);

// 组合多个异步请求
Mono.zip(userMono, orderMono, addressMono)
    .map(t -> new Profile(t.getT1(), t.getT2(), t.getT3()))
    .subscribe();
```

### 关键调度器（Schedulers）

```java
Schedulers.parallel()         // CPU 密集：核心数 × 1
Schedulers.boundedElastic()   // I/O 密集（默认 CPU × 10，最多 100K 个线程）
Schedulers.single()           // 单线程
Schedulers.immediate()        // 不切线程
```

```java
// 把阻塞调用调度到独立线程池
Mono.fromCallable(() -> jdbcQuery())   // 阻塞 JDBC
    .subscribeOn(Schedulers.boundedElastic())  // ★ 切到 I/O 线程池
    .map(this::process)                // 回到默认线程
    .subscribe();
```

::: warning ⚠️ Reactor 三大坑
1. **`.subscribe()` 必须调用**（Cold Stream 不订阅不执行）
2. **阻塞调用必须 `subscribeOn(boundedElastic())`**——否则卡死 Event Loop
3. **Stack Trace 难追踪**——`Hooks.onOperatorDebug()` 开启全量栈（性能差，仅开发用）
:::

详见 [Spring WebFlux](./spring-mvc/webflux)。**Reactor 操作符 / Cold vs Hot Stream / Context / Sinks / StepVerifier 等深度内容** → [Project Reactor 深度](./project-reactor)。

---

## RxJava 3（历史与 Android）

### 类型对照（与 Reactor）

| RxJava 3 | Reactor | 含义 |
|----------|---------|------|
| `Single<T>` | `Mono<T>` | 1 个值或异常 |
| `Maybe<T>` | `Mono<T>` | 0/1 个值或异常 |
| `Completable` | `Mono<Void>` | 仅完成信号 |
| `Observable<T>` | — | 不支持背压 |
| `Flowable<T>` | `Flux<T>` | **支持背压** |

### 现状

- **Android 仍大量使用**（Kotlin 协程 + Flow 在替代中）
- **后端新项目几乎不用 RxJava**（已被 Reactor / Mutiny 取代）
- **历史项目维护**——掌握 API 即可

```java
Flowable.range(1, 100)
    .filter(i -> i % 2 == 0)
    .map(i -> i * 10)
    .subscribeOn(Schedulers.io())
    .observeOn(Schedulers.single())
    .subscribe(System.out::println);
```

---

## Vert.x（多语言响应式工具包）

### 定位

> **Vert.x 不只是响应式库，而是完整的"响应式应用工具包"**——内置 HTTP/2/3、WebSocket、TCP、UDP、Event Bus、SQL Client、Kafka Client、JWT 等几十个组件。

### 特点

| 特性 | 说明 |
|------|------|
| **多语言** | Java / Kotlin / Groovy / **JS** / Ruby / Scala（Polyglot） |
| **不约束架构** | 不强制 MVC / Reactor 风格，给你工具自由组装 |
| **EventBus** | **跨节点的消息总线**（点对点 / 发布订阅 / Request-Response）|
| **Verticle** | 类似 Actor 的部署单元；可水平扩展 |
| **被 Quarkus 用作底层** | Quarkus 的 HTTP / SQL Client / Kafka 全部基于 Vert.x |

### Vert.x 5 (2024) 重大变化

- **JDK 11 → 17 提升**
- **Future API 现代化**（`Future.compose()` / `Future.await()` 类 async/await 风格）
- **HTTP/3 支持**
- **正式拥抱虚拟线程**（VirtualThread Worker）

### Vert.x 代码示例

```java
public class HttpServerVerticle extends AbstractVerticle {
    @Override
    public void start() {
        Router router = Router.router(vertx);

        router.get("/orders/:id").handler(ctx -> {
            String id = ctx.pathParam("id");

            // 通过 EventBus 给 OrderService Verticle 发消息
            vertx.eventBus().<JsonObject>request("order.find", id)
                .onSuccess(reply -> ctx.json(reply.body()))
                .onFailure(err -> ctx.response().setStatusCode(500).end(err.getMessage()));
        });

        vertx.createHttpServer()
            .requestHandler(router)
            .listen(8080);
    }
}
```

### Vert.x EventBus（杀手锏）

```java
// 节点 A 监听消息
vertx.eventBus().consumer("order.find", message -> {
    String id = message.body().toString();
    Order o = repo.find(id);
    message.reply(new JsonObject().put("id", o.id()).put("amount", o.amount()));
});

// 节点 B 发送消息（可跨集群）
vertx.eventBus().request("order.find", "123", reply -> {
    if (reply.succeeded()) System.out.println(reply.result().body());
});
```

**EventBus 跨集群**：用 Hazelcast / Infinispan / Ignite 作为集群管理器，可在多节点间无缝通信。

### Vert.x 适用场景

| ✅ 适合 | ❌ 不适合 |
|---------|-----------|
| 高并发网关 / API Gateway | 标准 CRUD 业务 |
| WebSocket / SSE 实时推送 | 数据库为主的业务系统 |
| IoT 网关（百万连接）| 团队不熟悉异步编程 |
| 多协议网关（TCP/UDP/HTTP）| 强依赖 Spring 生态 |
| 流式数据处理 | — |

---

## Mutiny（Quarkus 的响应式 API）

### 定位

> **Mutiny = Reactor / RxJava 的"现代化重做"**——Red Hat 在 2019 年新设计，**针对新手友好**，避免 Reactor 大量操作符的认知负担。

### 核心类型

```
Uni<T>    ── 0 或 1 个元素（≈ Mono）
Multi<T>  ── 0 到 N 个元素（≈ Flux）
```

### 代码风格对比

```java
// Reactor 风格
Mono.fromCallable(() -> findOrder(id))
    .flatMap(o -> chargeAccount(o))
    .timeout(Duration.ofSeconds(3))
    .retry(2)
    .onErrorResume(e -> Mono.just(Order.empty()));

// Mutiny 风格（更易读）
Uni.createFrom().item(() -> findOrder(id))
    .onItem().transformToUni(o -> chargeAccount(o))
    .ifNoItem().after(Duration.ofSeconds(3)).fail()
    .onFailure().retry().atMost(2)
    .onFailure().recoverWithItem(Order.empty());
```

**Mutiny 设计哲学**：「**操作符必须自描述**」——`.onItem().transformToUni(...)` 比 `.flatMap(...)` 更显式，新手少走弯路。

---

## Akka → Pekko 迁移（2022 商业化事件）

::: warning ⚠️ 2022.09 重大变化
**Lightbend 把 Akka 改为 BSL 商业协议**（年收入 > 2500 万美元需付费），Apache 立即分叉为 **Apache Pekko**——**开源用户应迁移到 Pekko**，API 100% 兼容。
:::

### Akka / Pekko Actor 模型

```java
// 定义 Actor
class OrderActor extends AbstractBehavior<OrderActor.Command> {
    interface Command {}
    record CreateOrder(String userId, ActorRef<Result> replyTo) implements Command {}
    interface Result {}
    record OrderCreated(String orderId) implements Result {}

    @Override
    public Receive<Command> createReceive() {
        return newReceiveBuilder()
            .onMessage(CreateOrder.class, this::onCreate)
            .build();
    }

    private Behavior<Command> onCreate(CreateOrder cmd) {
        String id = repo.save(cmd.userId());
        cmd.replyTo.tell(new OrderCreated(id));
        return this;
    }
}
```

### 适用场景

| ✅ 适合 | ❌ 不适合 |
|---------|-----------|
| 复杂状态机 + 流式处理 | 简单 CRUD |
| 跨节点分布式协调 | 团队没有 Actor 经验 |
| 长连接 + 大量短消息 | Java 标准微服务 |
| CQRS / Event Sourcing | — |

**面试黄金答法**：「**Actor 模型在 Java 生态从未主流——大多数团队选 Reactor / Vert.x 或直接虚拟线程；Akka/Pekko 是金融、IoT、游戏服务器的小众选择**」。

---

## 响应式选型决策表（2026）

```
┌──────────────────────────────────────────────────────────┐
│ Q1: 已用 Spring 全家桶？                                  │
│   是 → Project Reactor + Spring WebFlux                  │
│   否 ↓                                                   │
├──────────────────────────────────────────────────────────┤
│ Q2: 高并发 I/O 业务（CRUD + JDBC）？                     │
│   是 → ❌ 不要用响应式 → Spring MVC + 虚拟线程（Boot 3.2+）│
│   否 ↓                                                   │
├──────────────────────────────────────────────────────────┤
│ Q3: 网关 / 万级连接 / 协议网关？                          │
│   是 → Vert.x（最灵活、性能最好）                          │
│   否 ↓                                                   │
├──────────────────────────────────────────────────────────┤
│ Q4: Quarkus 应用？                                       │
│   是 → Mutiny（Quarkus 原生 API）                        │
│   否 ↓                                                   │
├──────────────────────────────────────────────────────────┤
│ Q5: 复杂状态机 / Actor 模型 / Event Sourcing？           │
│   是 → Pekko（注意 Akka 已商业化）                        │
│   否 → 回到 Q1（用 Reactor / Vert.x）                    │
└──────────────────────────────────────────────────────────┘
```

### 一句话定位

| 框架 | 一句话 |
|------|--------|
| **Reactor** | "Spring 栈响应式默认"——`Mono` / `Flux` 与 WebFlux / Cloud Gateway 无缝集成 |
| **RxJava 3** | "**Android / 历史项目**专用——后端新项目不要选" |
| **Vert.x** | "**最灵活的响应式工具包**——EventBus + 多协议网关 + Quarkus 引擎" |
| **Mutiny** | "**Quarkus 原生**响应式 API——API 比 Reactor 更易读" |
| **Pekko** | "Akka 开源替代（2022.09 商业化后由 Apache 分叉）——Actor 模型 + 分布式" |

---

## 虚拟线程时代的响应式（核心论断）

::: warning ⚠️ 2026 顶级面试题
"既然 Spring Boot 3.2+ 一行开启虚拟线程就能扛 10 万并发，**响应式编程是不是要被淘汰了？**" —— **不是淘汰，是回归本质**。
:::

### 三场景结论

| 场景 | 虚拟线程时代结论 |
|------|----------------|
| **高并发 CRUD（10K QPS + JDBC）** | ❌ 响应式过度设计 → 用 MVC + 虚拟线程 |
| **流式数据 / SSE / WebSocket** | ✅ **响应式仍不可替代** → `Flux<ServerSentEvent>` 一行 |
| **复杂异步编排（fan-out / 背压）** | ✅ **响应式仍优雅** → `Mono.zip` / `Flux.merge` |
| **协议网关 / IoT** | ✅ **Vert.x 仍是最优** → 万级连接 + 多协议 |
| **简单代理网关** | ⚠️ Spring Cloud Gateway 仍用 WebFlux，但可考虑虚拟线程网关 |

### 心智模型

```
2020 年：响应式 = "高并发解药"
2024 年：响应式 = "流式 + 编排 + 协议"
未来：    响应式 vs 虚拟线程 = "工具，不是宗教"
```

详见 [Spring WebFlux · 虚拟线程时代的选型](./spring-mvc/webflux#虚拟线程时代-webflux-还有必要吗boot-32-必读)。

---

## 面试常问 & 怎么答

### Q1: Reactor、RxJava、Mutiny、Vert.x 怎么选？

按生态决定：① **Spring 用 Reactor**（无悬念）；② **Quarkus 用 Mutiny**；③ **Android 历史项目用 RxJava**；④ **网关 / 多协议 / IoT 用 Vert.x**。**新项目不要选 RxJava**——后端已被 Reactor 完全取代；Android 也在迁 Kotlin 协程。

### Q2: 什么是背压（Backpressure）？

**消费者控制生产者速率的机制**。当下游处理不过来时，通过 `Subscription.request(n)` 告诉上游"我只要 n 个"，防止数据堆积 OOM。**RxJava 中**：`Flowable` 支持背压，`Observable` 不支持；**Reactor 中**：`Mono` / `Flux` 默认都支持。背压策略：BUFFER（缓冲）、DROP（丢弃）、LATEST（保留最新）、ERROR（抛异常）。

### Q3: 虚拟线程让响应式过时了吗？

**不是过时，是回归本质**。虚拟线程让"高并发 I/O 业务"不再需要响应式 → 但响应式在**流式数据、SSE/WebSocket、复杂异步编排、背压控制**仍然不可替代。**正确理解**：① 简单 CRUD 业务 → MVC + 虚拟线程；② 流式 / 实时 / 网关 → 响应式（Reactor / Vert.x）；③ 不要把两者对立——是工具选择问题，不是宗教问题。

### Q4: Akka 还能用吗？

**开源用户不能再用 Akka**——Lightbend 2022.09 改为 BSL 商业协议（年收入 > 2500 万美元付费）。**Apache 立即分叉为 Pekko**，API 100% 兼容。**迁移成本极低**：包名 `akka.*` → `org.apache.pekko.*`，依赖换一下。**新项目首选 Pekko**。

### Q5: Vert.x 和 Spring WebFlux 怎么选？

**Spring WebFlux** = Reactor 之上的 Web 层抽象，与 Spring 生态深度集成。**Vert.x** = 多协议工具包，更灵活。**选 WebFlux**：① 已用 Spring；② Web API 为主；③ 用 Spring Cloud Gateway。**选 Vert.x**：① 多协议（TCP/UDP/HTTP/WebSocket）；② 极致性能；③ IoT / 网关；④ 不想被 Spring 锁定。**Quarkus 用户两者都有**——业务用 Quarkus，底层借力 Vert.x。

### Q6: Reactor 的 `subscribeOn` 和 `publishOn` 区别？

**`subscribeOn`** 影响**整个链路的执行线程**（订阅时切换），只影响"上游开始的位置"——**多次调用只有第一次生效**。**`publishOn`** 影响**之后的所有操作符**，每次都生效，可以多次切换。**经验**：把阻塞调用放在 `subscribeOn(boundedElastic())`，后续 CPU 处理用 `publishOn(parallel())`。

---

## 看到什么就先想到这类

- **"Mono / Flux"** → Project Reactor / Spring WebFlux
- **"Single / Maybe / Observable / Flowable"** → RxJava 3
- **"Uni / Multi"** → Mutiny（Quarkus）
- **"Future / Promise + EventBus"** → Vert.x
- **"ActorRef / Behavior"** → Akka / Pekko
- **"高并发 + 简单业务"** → 虚拟线程（不要响应式）
- **"流式 / SSE / WebSocket"** → 响应式（Reactor / Vert.x）
- **"网关 / 万级连接"** → Vert.x / Spring Cloud Gateway
- **"Akka 商业化"** → 迁 Pekko
- **"背压 / Backpressure"** → Reactive Streams 规范
- **"Cold Stream / Hot Stream"** → Reactor 中的 ConnectableFlux / Sinks

## 延伸阅读

- 📄 [Spring WebFlux](./spring-mvc/webflux) — Reactor + WebFlux 深度，虚拟线程 vs WebFlux 选型
- 📄 [Spring Cloud 速查](./spring-cloud-overview) — Gateway 基于 WebFlux
- 📄 [Java 云原生框架](./java-cloud-native) — Quarkus / Helidon（响应式 vs 虚拟线程理念差异）
- 📄 [Java 并发编程](../programming-languages/java-concurrency) — 虚拟线程 / CompletableFuture
- 🔗 [projectreactor.io](https://projectreactor.io)
- 🔗 [vertx.io](https://vertx.io)
- 🔗 [smallrye.io/smallrye-mutiny](https://smallrye.io/smallrye-mutiny)
- 🔗 [pekko.apache.org](https://pekko.apache.org) — Akka 开源替代
