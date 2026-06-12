---
title: Project Reactor 深度
---

# Project Reactor 深度

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 高频（响应式必考）</span>

::: tip 💡 核心要点
**Project Reactor 是 Spring 全家桶的响应式心脏**——WebFlux、Spring Cloud Gateway、R2DBC、Spring Data 响应式版本**全部基于 Reactor**。核心是两个类型 `Mono<T>` / `Flux<T>` + 操作符 + 调度器 + 背压。2026 面试三大重点：① **冷流 vs 热流**；② **错误处理 6 种姿势**；③ **Context 替代 ThreadLocal**。**虚拟线程时代 Reactor 不会消失**——它仍是 Spring 栈"流式数据 + 异步编排"的标准答案。
:::

---

## Reactor 在 Spring 生态中的位置

```
┌────────────────────────────────────────────────────────────┐
│  应用层：Spring WebFlux / Spring Cloud Gateway / Spring AI   │
│              ↓ 全部基于 Reactor                              │
├────────────────────────────────────────────────────────────┤
│  Reactor Core：Mono<T> / Flux<T> + 操作符 + Schedulers       │
│              ↓ 实现 Reactive Streams 规范                    │
├────────────────────────────────────────────────────────────┤
│  Reactive Streams（JDK 9 Flow API）：Publisher/Subscriber   │
│              ↓ 基于                                          │
├────────────────────────────────────────────────────────────┤
│  Netty / Reactor Netty：非阻塞 I/O                           │
└────────────────────────────────────────────────────────────┘
```

| 项目 | 谁开发 | 关系 |
|------|--------|------|
| **Project Reactor** | Pivotal / VMware Tanzu | Spring 栈响应式实现 |
| **Reactor Netty** | Spring | Reactor + Netty 的胶水层，WebFlux 默认服务器 |
| **Spring WebFlux** | Spring | 基于 Reactor 的 Web 框架 |
| **Spring Cloud Gateway** | Spring | 基于 WebFlux 的网关 |
| **Spring AI** | Spring | Streaming ChatClient 用 Flux |

> **理解口诀**：「**Reactor = 库；WebFlux = 框架；Reactor Netty = 服务器**」。

---

## Mono vs Flux

```
Mono<T>  ── 0 或 1 个元素的异步序列（→ Optional<T> 的异步版）
  ┌─────┐
  │  T  │──→ onComplete  /  onError
  └─────┘

Flux<T>  ── 0 到 N 个元素的异步序列（→ Stream<T> 的异步版）
  ┌─┐ ┌─┐ ┌─┐ ┌─┐
  │T│ │T│ │T│ │T│──→ onComplete  /  onError
  └─┘ └─┘ └─┘ └─┘
```

| 类型 | 语义 | 典型场景 |
|------|------|---------|
| `Mono<T>` | 0..1 元素 | 查单条记录、保存操作、单 RPC 调用 |
| `Mono<Void>` | 仅完成信号 | 删除、提交、发布事件 |
| `Flux<T>` | 0..N 元素 | 查询列表、SSE 推送、Kafka 流、文件分块 |

### 创建方式

```java
// === Mono ===
Mono.just("hi")                                  // 已知值
Mono.empty()                                     // 空（直接完成）
Mono.error(new IllegalStateException("oops"))    // 直接出错
Mono.fromCallable(() -> jdbcQuery())             // 包装阻塞调用
Mono.fromFuture(completableFuture)               // 桥接 CompletableFuture
Mono.fromSupplier(() -> expensive())             // 惰性求值
Mono.defer(() -> Mono.just(LocalTime.now()))     // 每次订阅重新计算

// === Flux ===
Flux.just(1, 2, 3)
Flux.range(1, 100)
Flux.fromIterable(list)
Flux.fromStream(() -> Files.lines(path))
Flux.interval(Duration.ofSeconds(1))             // 定时发射
Flux.generate(sink -> sink.next(System.nanoTime()))   // 同步生成
Flux.create(sink -> {                            // 异步生成（适合桥接回调 API）
    listener.onMessage(msg -> sink.next(msg));
    sink.onDispose(() -> listener.close());
});
```

::: warning ⚠️ 经典坑：Cold Stream 不订阅不执行
```java
// ❌ 不会执行任何业务！
Mono.fromCallable(() -> jdbcSave(entity));   // 没有 .subscribe()

// ✅ 必须订阅
Mono.fromCallable(() -> jdbcSave(entity)).subscribe();
```
**Spring WebFlux 例外**：Controller 返回 `Mono` / `Flux` 由框架自动订阅，业务代码**不要手动 subscribe**——会出现重复执行。
:::

---

## 操作符全景（高频面试）

### 转换类

| 操作符 | 作用 | 示例 |
|--------|------|------|
| `map` | 同步转换 | `flux.map(s -> s.toUpperCase())` |
| `flatMap` | **异步转换 + 并发**（**默认并发 256**） | `flux.flatMap(id -> findById(id))` |
| `concatMap` | **异步转换 + 顺序**（前一个完成才下一个） | `flux.concatMap(id -> findById(id))` |
| `switchMap` | 异步转换，**新元素来时取消旧的** | 搜索框防抖典型场景 |
| `flatMapSequential` | 并发执行但**保持顺序输出** | 并发拉数据 + 输出有序 |

::: tip 💡 `flatMap` vs `concatMap` vs `switchMap` 决策表

| 你想要 | 用 |
|--------|---|
| 最快（顺序无所谓）| `flatMap` |
| 必须保留顺序 + 顺序执行 | `concatMap` |
| 必须保留顺序 + 并发执行 | `flatMapSequential` |
| 来了新的就丢弃旧的 | `switchMap` |

:::

### 过滤类

```java
flux.filter(x -> x > 0)
    .take(10)                  // 前 10 个
    .skip(5)                   // 跳过前 5 个
    .distinct()                // 去重（按 equals）
    .distinctUntilChanged()    // 去除连续重复
    .elementAt(3)              // 第 4 个（Mono）
```

### 组合类

```java
// 串行
mono1.then(mono2)              // 等 1 完成（丢值）→ 执行 2
mono1.thenReturn("done")       // 等完成 → 返回固定值

// 并行
Mono.zip(monoA, monoB, monoC)  // 等三个都完成，组合 Tuple3
    .map(t -> new Profile(t.getT1(), t.getT2(), t.getT3()))

Flux.merge(fluxA, fluxB)       // 合并多个流（交错输出）
Flux.concat(fluxA, fluxB)      // 先 A 完，再 B（顺序）
Flux.zip(fluxA, fluxB)         // 按位置配对

// 聚合
flux.reduce(0, Integer::sum)   // 累加
flux.collectList()             // → Mono<List<T>>
flux.collectMap(User::id)      // → Mono<Map<id, User>>
flux.count()                   // → Mono<Long>
```

### 时间类

```java
flux.delayElements(Duration.ofMillis(100))   // 每元素延迟
flux.timeout(Duration.ofSeconds(3))          // 超时抛 TimeoutException
flux.window(Duration.ofSeconds(1))           // 时间窗口
flux.buffer(Duration.ofSeconds(1))           // 时间缓冲（→ List）
```

### 副作用类（重要：调试 + 日志）

```java
flux.doOnNext(x -> log.info("got {}", x))    // 收到元素时
    .doOnError(e -> log.error("err", e))     // 出错时
    .doOnComplete(() -> log.info("done"))    // 完成时
    .doOnSubscribe(s -> log.info("subscribed"))
    .doOnCancel(() -> log.info("cancelled"))
    .doFinally(signal -> cleanup())          // 任何终止信号都执行
    .log("my-flux")                          // 内置详细日志
```

---

## 错误处理 6 种姿势（高频面试）

```java
// 1. 提供兜底值
mono.onErrorReturn(Order.empty())

// 2. 切到其他 Publisher
mono.onErrorResume(e -> callBackupService())
mono.onErrorResume(IllegalStateException.class, e -> Mono.empty())

// 3. 转换异常类型（不影响成功路径）
mono.onErrorMap(SQLException.class, e -> new DbException(e))

// 4. 简单重试（固定次数）
mono.retry(3)

// 5. 高级重试（指数退避 + 过滤异常类型）
mono.retryWhen(Retry.backoff(3, Duration.ofMillis(100))
    .maxBackoff(Duration.ofSeconds(2))
    .filter(e -> e instanceof IOException)
    .doBeforeRetry(s -> log.warn("retry #{}", s.totalRetries()))
)

// 6. 仅记录日志、继续抛出
mono.doOnError(e -> log.error("failed", e))
```

::: warning ⚠️ 三大坑
1. **`retry()` 重新订阅整个上游**——如果上游有副作用（如 INSERT），会**多次执行** → 用 `retryWhen` + 检查异常类型
2. **`onErrorReturn` 静默吞异常**——日志一定要在前面 `doOnError` 一下，否则线上排查崩溃
3. **`onErrorResume` 之后的链路用的是新的 Publisher**——失效注意上下文丢失
:::

---

## 调度器（Schedulers）

```java
Schedulers.parallel()           // CPU 密集：核心数 × 1 线程
Schedulers.boundedElastic()     // I/O 密集：CPU × 10 线程，最多 100K 个；超时回收
Schedulers.single()             // 单线程
Schedulers.immediate()          // 不切线程（同步执行）
Schedulers.fromExecutor(executor)  // 自定义
```

### `subscribeOn` vs `publishOn`（必考）

```java
mono
    .map(x -> "step1: " + x)        // 在 ① 上执行
    .publishOn(Schedulers.parallel())
    .map(x -> "step2: " + x)        // 在 parallel 上执行
    .publishOn(Schedulers.single())
    .map(x -> "step3: " + x)        // 在 single 上执行
    .subscribeOn(Schedulers.boundedElastic())  // ★ 整个链路订阅时切到 boundedElastic
    .subscribe();
```

| 操作符 | 影响范围 | 多次调用 |
|--------|---------|---------|
| **`subscribeOn`** | **整个链路 的"开始"** | 只有**第一次**生效 |
| **`publishOn`** | **之后的所有操作符** | 每次都生效 |

**经验**：① 整链有阻塞调用 → `subscribeOn(boundedElastic())`；② 中间需要切到 CPU 池处理 → `publishOn(parallel())`；③ 想精确控制特定步骤的线程 → `publishOn`。

::: warning ⚠️ 把阻塞调用调度出去
WebFlux 中 **绝对禁止阻塞 Event Loop 线程**。所有 JDBC / 文件 IO / 同步 RPC 必须包装：

```java
// ✅ 正确：阻塞调用调度到 boundedElastic
Mono.fromCallable(() -> jdbcTemplate.queryForObject(sql, User.class))
    .subscribeOn(Schedulers.boundedElastic())
    .map(this::process)
    .subscribe();
```
:::

---

## 冷流 vs 热流（Cold vs Hot Stream）

| 类型 | 特征 | 例子 |
|------|------|------|
| **Cold（冷流）** | **每个订阅者都从头收到全部数据** | `Flux.range(1, 10)`、`Mono.fromCallable(...)` |
| **Hot（热流）** | **数据已经在产生，订阅时只收到之后的** | `Sinks.Many`、键盘事件、WebSocket 消息 |

### 创建热流：`Sinks.Many`（Reactor 3.4+ 推荐）

```java
// Multicast：所有订阅者收到相同消息（但有缓存策略）
Sinks.Many<String> sink = Sinks.many().multicast().onBackpressureBuffer();

Flux<String> flux = sink.asFlux();
flux.subscribe(msg -> System.out.println("A: " + msg));   // 订阅者 A

sink.tryEmitNext("hello");           // A 收到
flux.subscribe(msg -> System.out.println("B: " + msg));   // 订阅者 B
sink.tryEmitNext("world");           // A 和 B 都收到
```

| Sinks 类型 | 行为 |
|------------|------|
| `Sinks.one()` | 单值 Mono；之后订阅者拿到缓存的值 |
| `Sinks.many().multicast()` | 多订阅者，**之后订阅者只收新消息** |
| `Sinks.many().replay()` | 多订阅者，**之后订阅者重放历史** |
| `Sinks.many().unicast()` | 仅一个订阅者，缓存所有未消费 |

### 冷流转热流

```java
ConnectableFlux<Long> hot = Flux.interval(Duration.ofSeconds(1)).publish();
hot.subscribe(x -> log.info("A: {}", x));
hot.subscribe(x -> log.info("B: {}", x));
hot.connect();                       // ★ 调用后才真正开始发射
```

---

## Context：响应式版的 ThreadLocal

::: tip 💡 为什么需要 Context
Reactor 链路**跨多个线程切换**——`ThreadLocal` 完全不工作。Reactor 提供 `Context`：**不可变、自下而上、绑定订阅链路**。Spring Security、Sleuth、MDC 都用它传递上下文。
:::

```java
Mono<String> getUser() {
    return Mono.deferContextual(ctx -> {
        String userId = ctx.get("userId");   // 读取
        return userRepo.findById(userId);
    });
}

// 写入 Context（必须在链路末尾）
getUser()
    .contextWrite(Context.of("userId", "u_123"))
    .subscribe();
```

| 关键点 | 说明 |
|--------|------|
| **不可变** | 每次 `contextWrite` 返回新的 Context |
| **方向自下而上** | Context 沿 `subscribe` 方向**反向**传播（链路尾部写，上游读） |
| **生命周期 = 订阅链** | 一次 subscribe 内有效，多个订阅相互独立 |
| **MDC 集成** | 用 `ContextSnapshot`（io.micrometer:context-propagation）桥接日志 MDC |

---

## 背压（Backpressure）4 种策略

```java
Flux<Integer> source = Flux.range(1, 1_000_000);

source.onBackpressureBuffer(1000)           // 缓冲 1000 个，满了报错
source.onBackpressureBuffer(1000, x -> log.warn("dropped {}", x))  // 满了丢弃
source.onBackpressureDrop()                  // 一律丢弃下游处理不过来的
source.onBackpressureLatest()                // 只保留最新
source.onBackpressureError()                 // 直接报错（默认）
```

| 策略 | 适合 |
|------|------|
| **Buffer** | 短时突发；要保证所有数据 | 容易 OOM |
| **Drop** | 监控数据；丢失可接受 | 适合实时 |
| **Latest** | 股票行情；只关心最新 | 适合 UI |
| **Error** | 设计要求"绝不堆积"；快速失败 | 适合关键链路 |

---

## 测试：StepVerifier

```java
@Test
void testFlux() {
    Flux<Integer> flux = Flux.just(1, 2, 3)
        .map(x -> x * 10);

    StepVerifier.create(flux)
        .expectNext(10, 20, 30)
        .expectComplete()
        .verify();
}

@Test
void testError() {
    Mono<String> mono = Mono.error(new IllegalStateException("oops"));

    StepVerifier.create(mono)
        .expectErrorMatches(e -> e instanceof IllegalStateException
            && e.getMessage().equals("oops"))
        .verify();
}

@Test
void testWithVirtualTime() {
    StepVerifier.withVirtualTime(() ->
        Flux.interval(Duration.ofSeconds(1)).take(3)
    )
    .thenAwait(Duration.ofSeconds(3))    // ★ 不真等 3 秒
    .expectNext(0L, 1L, 2L)
    .expectComplete()
    .verify();
}
```

**核心 API**：`expectNext()` / `expectComplete()` / `expectError()` / `thenAwait()` / `withVirtualTime()`。

---

## Reactor 版本时间线

| 版本 | 时间 | 关键变化 |
|------|------|---------|
| **1.x** | 2014 | 早期 EventBus 风格 |
| **2.x** | 2015 | 加入 Reactive Streams 规范 |
| **3.0** | 2016 | **重写**：`Mono` / `Flux` 作为核心；Spring 5 / WebFlux 选定 |
| **3.1** | 2017 | `Context` 引入 |
| **3.2** | 2018 | 改进 backpressure、调试支持 |
| **3.3** | 2019 | `flatMapSequential` 等高级操作符稳定 |
| **3.4** | 2020 | **`Sinks` API** 取代 `EmitterProcessor` / `DirectProcessor` |
| **3.5** | 2022 | JDK 17 适配；性能优化 |
| **3.6** | 2023 | 进一步对齐 JDK 21 |
| **3.7** | 2024 | JDK 21+ Loom 时代调度器优化；与虚拟线程协作 |
| **3.8** | 2025-2026 | 持续维护；Spring Boot 4 / Spring 7 配套 |

---

## 虚拟线程时代 Reactor 还有意义吗？

::: warning ⚠️ 2026 高频面试题
"既然 Spring Boot 3.2+ 一行开启虚拟线程就能搞定高并发，Reactor 还要学吗？" — **要**，但**定位变了**。
:::

| 场景 | 虚拟线程时代结论 |
|------|----------------|
| 高并发 CRUD（10K QPS + JDBC）| ❌ Reactor 过度设计 → MVC + 虚拟线程 |
| **流式数据（SSE / Kafka / 文件分块）** | ✅ **Reactor 仍最优** — `Flux<ServerSentEvent>` 一行 |
| **复杂异步编排（10 个下游服务 fan-out）** | ✅ **Reactor 优雅** — `Mono.zip` / `flatMap(parallel)` |
| **背压控制（生产 > 消费的实时数据）** | ✅ **Reactor 不可替代** — 4 种策略 |
| **Spring Cloud Gateway** | ✅ **仍是 WebFlux + Reactor** — 网关本身就是 I/O |
| **Spring AI Streaming Chat** | ✅ **必须 Flux** — Streaming Chunk 输出 |

**心智模型**：「**虚拟线程让 Reactor 退出"高并发解药"位置，回到它真正擅长的'流式 + 编排 + 背压' 领域**」。

详见 [Spring WebFlux · 虚拟线程时代选型](./spring-mvc/webflux#虚拟线程时代-webflux-还有必要吗boot-32-必读)。

---

## 与其他响应式库的对比

| 库 | 核心类型 | 与 Reactor 的关系 |
|----|---------|------------------|
| **Reactor**（Spring）| `Mono<T>` / `Flux<T>` | — |
| **RxJava 3** | `Single` / `Maybe` / `Flowable` / `Observable` | API 风格类似，**操作符更多**；Android 偏好 |
| **Mutiny**（Quarkus）| `Uni<T>` / `Multi<T>` | API 更易读，但功能略少 |
| **JDK 9 Flow** | `Publisher` / `Subscriber` | 仅接口规范；Reactor 实现它 |
| **Kotlin Coroutines + Flow** | `Flow<T>` | 协程版响应式；Kotlin 项目首选 |

详见 [响应式 Java 框架横评](./reactive-java#五大框架横评)。

---

## 面试常问 & 怎么答

### Q1: Mono 和 Flux 是什么？

都是 Reactor 实现的 `Publisher`（Reactive Streams 规范）。**`Mono`** 表示 0 或 1 个元素的异步序列（≈ 异步 `Optional`），**`Flux`** 表示 0 到 N 个元素的异步序列（≈ 异步 `Stream`）。**它们是惰性的（Cold）**——不订阅不执行。WebFlux 中由框架自动订阅；普通代码必须手动 `.subscribe()`。

### Q2: `subscribeOn` 和 `publishOn` 的区别？

**`subscribeOn`** 影响**整个链路的执行线程**，只有第一次调用生效（订阅时刻才确定）。**`publishOn`** 影响**之后的所有操作符**，每次都生效，可以多次切换。**经验**：阻塞调用用 `subscribeOn(boundedElastic())`；中间需要 CPU 计算用 `publishOn(parallel())`。

### Q3: `flatMap` 和 `concatMap` 的区别？

都是异步转换。**`flatMap`** **并发执行**子流（默认并发度 256），输出顺序不保证；**`concatMap`** **顺序执行**子流，前一个完全完成才订阅下一个。**典型选择**：① 顺序无所谓 → `flatMap`（最快）；② 必须保留顺序 → `concatMap`；③ 保留顺序但要并发 → `flatMapSequential`；④ 搜索框防抖 → `switchMap`（新元素来了取消旧的）。

### Q4: 什么是 Cold Stream 和 Hot Stream？

**Cold**：每个订阅者**独立从头收到全部数据**（`Flux.range`、`Mono.fromCallable`）。**Hot**：数据已经在产生，**订阅时只收到之后的**（鼠标事件、WebSocket）。Reactor 3.4+ 用 `Sinks.Many` 创建热流（`multicast` / `replay` / `unicast` 三种策略）。**典型坑**：把"调用 API 拿数据"写成热流 → 每个订阅者都会真的调一次 API。

### Q5: Reactor 怎么实现重试？

**`retry(n)`** 简单重试 n 次（**整个上游重新订阅**——有副作用要小心）。**`retryWhen(Retry.backoff(...))`** 高级重试，支持指数退避、过滤异常类型、记录日志。**生产推荐 `retryWhen`**——可以只对网络异常重试，对业务异常立即失败。

### Q6: Context 是什么？为什么不用 ThreadLocal？

Reactor 链路**跨多个线程切换**——`ThreadLocal` 完全失效。Reactor 的 `Context` 是**不可变 + 沿订阅链反向传播 + 生命周期=订阅周期**的上下文容器。Spring Security 的 `ReactiveSecurityContextHolder`、Sleuth/Micrometer Tracing 的 traceId 都用 Context 传递。**MDC 日志关联**：用 `ContextSnapshot`（io.micrometer:context-propagation）桥接。

### Q7: 虚拟线程让 Reactor 过时了吗？

**没有，是回归本质**。虚拟线程让"高并发 I/O"不再需要响应式 → 但 Reactor 在**流式数据（SSE / Kafka）、复杂编排（`Mono.zip`）、背压控制、网关（Spring Cloud Gateway）、Spring AI Streaming** 仍是不可替代的标准答案。**正确理解**：简单 CRUD → MVC + 虚拟线程；流式 / 编排 / 背压 → Reactor。不要把两者对立成"哪个更好"。

---

## 常见陷阱

::: warning ⚠️ 8 大新手坑

1. **忘记 `.subscribe()`** → Cold Stream 永远不执行
2. **WebFlux Controller 里手动 `.subscribe()`** → 重复执行
3. **阻塞调用不调度到 `boundedElastic()`** → 卡死 Event Loop，TPS 暴跌
4. **`map` 里写阻塞代码** → 同 3
5. **`retry()` 而非 `retryWhen()`** → 业务异常也重试，重复 INSERT
6. **`onErrorReturn` 静默吞异常** → 线上没日志无法排查
7. **滥用 `ThreadLocal`** → 异步链路必丢上下文，改用 `Context`
8. **`Sinks.Many.multicast()` 新订阅者收不到历史** → 想要重放用 `.replay()`

:::

---

## 看到什么就先想到这类

- **Mono / Flux** → Reactor 核心类型
- **WebFlux / Spring Cloud Gateway** → 底层都是 Reactor
- **Spring AI Streaming Chat** → `Flux<ChatResponse>`
- **Cold / Hot Stream** → Reactor 流类型；`Sinks.Many` 创建热流
- **subscribeOn / publishOn** → 调度器切换
- **flatMap / concatMap / switchMap** → 异步转换决策表
- **retry / retryWhen** → 错误重试；生产用后者
- **Context** → 替代 ThreadLocal 的异步上下文
- **背压 / Backpressure** → Reactive Streams 规范核心
- **StepVerifier** → Reactor 测试 API
- **R2DBC** → 响应式数据库；返回 Mono/Flux
- **boundedElastic / parallel** → I/O 池 vs CPU 池

## 延伸阅读

- 📄 [Spring WebFlux](./spring-mvc/webflux) — Reactor + WebFlux 集成；虚拟线程选型
- 📄 [响应式 Java 框架横评](./reactive-java) — Reactor / RxJava / Vert.x / Mutiny / Pekko 五框架对比
- 📄 [Spring Cloud 速查](./spring-cloud-overview) — Gateway 基于 WebFlux + Reactor
- 📄 [Java 并发编程](../programming-languages/java-concurrency) — 虚拟线程 / CompletableFuture / ScopedValue
- 🔗 [projectreactor.io](https://projectreactor.io)
- 🔗 [Reactor 3 Reference Guide](https://projectreactor.io/docs/core/release/reference/)
- 🔗 [Sebastien Deleuze - Reactor 演讲](https://www.youtube.com/results?search_query=project+reactor)
