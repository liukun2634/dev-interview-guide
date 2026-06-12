---
title: JMH 基准测试
---

# JMH（Java Microbenchmark Harness）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 高频（性能优化必问）</span>

::: tip 💡 核心要点
**「你怎么证明你的优化是有效的？」—— 高级 Java 面试 Top 5 问题**，标准答案就是 **JMH**。JMH 是 OpenJDK 官方出品的微基准测试框架，**专门解决 JVM 的 JIT 编译 / 死代码消除 / 锁升级 / GC 抖动等问题**——`System.currentTimeMillis()` 手测的结果**永远是错的**。掌握 JMH 的 `@Warmup` / `@Measurement` / `@Fork` / `Blackhole` / `@State` 是 senior Java 工程师的硬指标。面试金句：**「不用 JMH 测的微基准都是耍流氓」**。
:::

---

## 为什么不能用 `System.currentTimeMillis()`

新手最爱写：

```java
// ❌ 这样测出来的结果都不可信
long start = System.currentTimeMillis();
for (int i = 0; i < 1_000_000; i++) {
    Math.log(i);
}
long elapsed = System.currentTimeMillis() - start;
System.out.println("耗时: " + elapsed + "ms");
```

JVM 会让结果**严重失真**，5 大原因：

| 失真原因 | 实际后果 |
|----------|---------|
| **JIT 编译延迟** | 前 1-5 万次解释执行，之后 C1/C2 编译加速；**没预热就测，测的是解释器** |
| **死代码消除（DCE）** | `Math.log(i)` 结果未被使用 → JIT **直接删掉整个循环** → 测出 0ms |
| **循环展开 / 内联** | JIT 把循环展开 8 倍 → 实际迭代数 < 你以为的 |
| **GC 抖动** | 一次 Full GC 就让 P99 飙到几十 ms |
| **CPU 缓存 / 频率波动** | turbo boost / 散热降频 / 同核线程竞争 → 噪声 ± 30% |

**JMH 就是用来对抗这一切的工具**。

---

## 快速上手

### Maven 引入

```xml
<dependencies>
  <dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-core</artifactId>
    <version>1.37</version>
  </dependency>
  <dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-generator-annprocess</artifactId>
    <version>1.37</version>
    <scope>provided</scope>
  </dependency>
</dependencies>
```

或用官方 Maven Archetype 一键生成项目：
```bash
mvn archetype:generate \
  -DinteractiveMode=false \
  -DarchetypeGroupId=org.openjdk.jmh \
  -DarchetypeArtifactId=jmh-java-benchmark-archetype \
  -DgroupId=com.example \
  -DartifactId=bench \
  -Dversion=1.0
```

### 最小可运行示例

```java
import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.runner.*;
import org.openjdk.jmh.runner.options.*;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)             // 平均耗时
@OutputTimeUnit(TimeUnit.NANOSECONDS)        // ns 精度
@Warmup(iterations = 5, time = 1)            // 预热 5 轮，每轮 1s
@Measurement(iterations = 10, time = 1)      // 正式 10 轮
@Fork(value = 2, jvmArgsAppend = {"-Xms2G", "-Xmx2G"})  // 独立 JVM 跑 2 次
@State(Scope.Benchmark)                       // 状态在所有线程共享
public class StringConcatBench {

    @Param({"10", "100", "1000"})            // 多个 size 矩阵测试
    private int size;

    private String[] data;

    @Setup(Level.Trial)                       // 每个 Trial 开始前一次
    public void init() {
        data = new String[size];
        for (int i = 0; i < size; i++) data[i] = "item-" + i;
    }

    @Benchmark
    public String concatByPlus() {
        String s = "";
        for (String x : data) s += x;          // String 拼接陷阱
        return s;
    }

    @Benchmark
    public String concatByBuilder() {
        StringBuilder sb = new StringBuilder();
        for (String x : data) sb.append(x);
        return sb.toString();
    }

    public static void main(String[] args) throws Exception {
        Options opt = new OptionsBuilder()
            .include(StringConcatBench.class.getSimpleName())
            .build();
        new Runner(opt).run();
    }
}
```

**典型输出**：
```
Benchmark              (size)  Mode  Cnt    Score    Error  Units
concatByPlus              10  avgt   20    225.4 ±   12.3  ns/op
concatByPlus             100  avgt   20  15782.0 ±  890.5  ns/op
concatByPlus            1000  avgt   20  1.45e6 ± 0.07e6   ns/op
concatByBuilder           10  avgt   20    115.2 ±    5.1  ns/op
concatByBuilder          100  avgt   20    980.4 ±   30.2  ns/op
concatByBuilder         1000  avgt   20  10254.0 ±  410.0  ns/op
```

**结论**：`StringBuilder` 在 size=1000 时**比 `+` 拼接快 140 倍**，且数据量越大优势越明显（`+` 是 O(n²)）。

---

## 五大核心注解

### `@BenchmarkMode`：测什么指标

| Mode | 含义 | 典型用途 |
|------|------|---------|
| `Throughput` | **吞吐量**：ops/sec | "每秒能调多少次" |
| `AverageTime` | **平均耗时**：time/op | 单次调用延迟 |
| `SampleTime` | **采样延迟**：P50/P95/P99 分位 | **长尾延迟分析** |
| `SingleShotTime` | **单次执行时间** | 冷启动 / GC 暂停时长 |
| `All` | 同时测以上四种 | — |

### `@Warmup` / `@Measurement`：预热与正式测量

```java
@Warmup(iterations = 5, time = 1, timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 10, time = 1, timeUnit = TimeUnit.SECONDS)
```

- **预热目的**：让 JIT 编译完成（C2 通常需要 1 万次以上调用）
- **典型配置**：`5 × 1s warmup + 10 × 1s measurement`
- **不预热的代价**：结果包含解释执行 → 慢 10-100×

### `@Fork`：独立 JVM 隔离

```java
@Fork(value = 2, jvmArgsAppend = {"-XX:+UseG1GC", "-Xmx4g"})
```

- **作用**：每个 Benchmark 在**全新 JVM** 进程跑，避免 JIT 缓存污染
- **`value = 0`**：不 fork（**仅 debug 用**，结果不可信）
- **`value = 1` 是最小生产配置**；`value = 2-3` 更稳定（平均多次运行）

### `@State`：状态作用域

```java
@State(Scope.Benchmark)    // 所有线程共享（测共享数据）
@State(Scope.Thread)       // 每线程独立（默认，最常用）
@State(Scope.Group)        // 每个 @Group 共享
```

```java
@State(Scope.Benchmark)
public class SharedState {
    public AtomicLong counter = new AtomicLong();
}

@Benchmark
public long increment(SharedState s) { return s.counter.incrementAndGet(); }
```

### `@Param`：参数化矩阵

```java
@Param({"10", "100", "1000", "10000"})
private int size;
```

JMH 会**自动跑 4 个版本**，并在结果中按 size 分组——一次跑出"size 增长曲线"。

---

## Setup / TearDown 三层级

| Level | 触发时机 | 用途 |
|-------|---------|------|
| `Level.Trial` | **整个 Benchmark** 开始/结束（一次）| 准备大数据、创建连接 |
| `Level.Iteration` | **每个 iteration** 开始/结束 | 重置状态 |
| `Level.Invocation` | **每次 @Benchmark 调用前后** | 慎用！开销大易失真 |

```java
@Setup(Level.Trial)
public void initData() { data = generateLargeArray(); }

@TearDown(Level.Trial)
public void cleanup() { closeConnections(); }
```

---

## Blackhole：对抗死代码消除

JIT 看到"结果没被使用" → 直接删除代码。**两个解决方案**：

### 方案 1：返回值（推荐）

```java
@Benchmark
public int compute() {
    int sum = 0;
    for (int i = 0; i < 1000; i++) sum += i * i;
    return sum;            // ★ 返回，JMH 自动吃掉，JIT 不能删
}
```

### 方案 2：Blackhole.consume

```java
@Benchmark
public void compute(Blackhole bh) {
    int sum = 0;
    for (int i = 0; i < 1000; i++) sum += i * i;
    bh.consume(sum);       // ★ 显式告诉 JIT "我用了"
}
```

`Blackhole` 还能消费多个值、`evaporate()` 抵消编译器假设——是对抗 JIT 优化的官方武器。

---

## 异步 / 多线程基准

### `@Threads`：多线程并发跑

```java
@Threads(8)                    // 8 个线程同时跑
@Benchmark
public long contended(SharedCounter c) {
    return c.counter.incrementAndGet();   // 测多线程竞争下的吞吐
}
```

### `@Group` + `@GroupThreads`：生产-消费场景

```java
@State(Scope.Group)
public class ProducerConsumerBench {
    private BlockingQueue<Integer> q = new ArrayBlockingQueue<>(1000);

    @Benchmark
    @Group("pc")
    @GroupThreads(4)               // 4 个生产者线程
    public void produce() throws InterruptedException {
        q.put(42);
    }

    @Benchmark
    @Group("pc")
    @GroupThreads(2)               // 2 个消费者线程
    public Integer consume() throws InterruptedException {
        return q.take();
    }
}
```

---

## Profiler 集成：火焰图 / JFR / GC

JMH 内置多个 profiler，加 `.addProfiler()`：

```java
Options opt = new OptionsBuilder()
    .include(MyBench.class.getSimpleName())
    .addProfiler(GCProfiler.class)              // GC 次数、GC 暂停时长
    .addProfiler(StackProfiler.class)           // 简易火焰图
    .addProfiler(AsyncProfiler.class,           // ★ async-profiler 集成
        "output=flamegraph;dir=target/flames")
    .addProfiler(JavaFlightRecorder.class)      // JFR 录制
    .build();
```

| Profiler | 用途 |
|----------|------|
| `GCProfiler` | 每次 op 的 GC 字节、GC 次数；**OOM 排查首选** |
| `StackProfiler` | 简易栈采样 |
| `AsyncProfiler` | **生产级火焰图**（CPU / Lock / Allocation） |
| `JavaFlightRecorder` | JFR 文件输出，可在 JMC 中分析 |
| `LinuxPerfProfiler` | Linux perf 集成（hardware counter） |

---

## 5 大典型陷阱（面试常追问）

### 坑 1：循环 + 死代码消除

```java
// ❌ 测不出任何东西
@Benchmark
public void wrong() {
    for (int i = 0; i < 1000; i++) Math.log(i);  // 结果未用，被 JIT 删
}

// ✅ 用返回值或 Blackhole
@Benchmark
public double right() {
    double sum = 0;
    for (int i = 0; i < 1000; i++) sum += Math.log(i);
    return sum;
}
```

### 坑 2：常量折叠

```java
// ❌ JIT 看到 i=10 是常量 → 编译期直接算好
@Benchmark
public int wrong() { return compute(10); }

// ✅ 用 @State 让 JIT 不知道值
@State(Scope.Benchmark)
public class State { public int value = 10; }

@Benchmark
public int right(State s) { return compute(s.value); }
```

### 坑 3：循环不变量提升

```java
// ❌ JIT 把 list.size() 提到循环外，测不出真实开销
@Benchmark
public int wrong(State s) {
    int sum = 0;
    for (int i = 0; i < s.list.size(); i++) sum += s.list.get(i);
    return sum;
}
```

### 坑 4：用单一类型造成 megamorphic 失真

```java
// ❌ 只测一种 List 实现 → JIT 内联 + 类型特化
List<Integer> list = new ArrayList<>();  // 永远 ArrayList

// ✅ 用 @Param 让 JIT 看到多个实现
@Param({"ArrayList", "LinkedList"})
private String type;
```

### 坑 5：基准代码与生产代码差异大

JMH 测的是**纯方法调用**——真实业务有 Spring 代理、AOP、序列化、数据库连接，**结果不能直接外推到 QPS 预测**。**JMH 适合证明"哪种实现更快"，不适合预测"系统能扛多少 QPS"**（后者用 wrk / JMeter / gatling 压测）。

---

## JMH vs JMeter vs ab/wrk

| 工具 | 层次 | 适合 | 不适合 |
|------|------|------|--------|
| **JMH** | **方法级微基准** | 算法对比、数据结构选型、并发原语 | HTTP 吞吐、E2E 延迟 |
| **JMeter** | **端到端压测** | HTTP / JDBC / JMS 全流程 | 微秒级方法对比 |
| **ab / wrk / wrk2 / vegeta** | **HTTP 黑盒压测** | API QPS / RT | 业务逻辑分析 |
| **Gatling** | HTTP + Scala DSL | 复杂场景脚本 | 微基准 |
| **YCSB** | NoSQL 数据库基准 | Redis / Cassandra / Mongo 对比 | 业务 API |
| **async-profiler** | **采样分析器**（不是基准） | CPU / 锁 / 分配热点定位 | 不测吞吐 |

**口诀**：「**JMH 测方法 / 压测工具测系统 / Profiler 找瓶颈**」——三个层次的工具，缺一不可。

---

## 实战：5 种典型基准模板

### 模板 1：算法对比（ArrayList vs LinkedList 遍历）

```java
@State(Scope.Benchmark)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 1)
@Fork(2)
public class ListTraverseBench {

    @Param({"100", "10000", "1000000"})
    int size;

    List<Integer> arrayList, linkedList;

    @Setup
    public void init() {
        arrayList = new ArrayList<>(size);
        linkedList = new LinkedList<>();
        for (int i = 0; i < size; i++) { arrayList.add(i); linkedList.add(i); }
    }

    @Benchmark public long arrayIndex() {
        long sum = 0;
        for (int i = 0; i < size; i++) sum += arrayList.get(i);   // O(1)
        return sum;
    }
    @Benchmark public long linkedIndex() {
        long sum = 0;
        for (int i = 0; i < size; i++) sum += linkedList.get(i);  // O(n)！每次从头遍历
        return sum;
    }
    @Benchmark public long linkedIterator() {
        long sum = 0;
        for (Integer i : linkedList) sum += i;                    // O(n) 总开销
        return sum;
    }
}
```

**典型结果**：size=10000 时 `linkedIndex` 比 `linkedIterator` **慢 5000 倍**（O(n²) vs O(n)）——这种结论直接拿去 PR review 是杀手锏。

### 模板 2：并发原语对比（AtomicLong vs LongAdder）

```java
@State(Scope.Benchmark)
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@Threads(16)
public class CounterBench {
    AtomicLong atomic = new AtomicLong();
    LongAdder adder = new LongAdder();

    @Benchmark public long atomic() { return atomic.incrementAndGet(); }
    @Benchmark public void adder() { adder.increment(); }
}
```

**16 线程下**：`LongAdder` 吞吐通常是 `AtomicLong` 的 **5-10×**（分段累加 vs CAS 单点竞争）。

### 模板 3：GC 影响（ArrayList vs Stream 流式）

```java
@State(Scope.Benchmark)
@BenchmarkMode(Mode.Throughput)
public class GCImpactBench {

    private List<Integer> data;

    @Setup public void init() { data = IntStream.range(0, 10000).boxed().toList(); }

    @Benchmark public long forLoop() {
        long sum = 0;
        for (Integer i : data) sum += i;
        return sum;
    }

    @Benchmark public long streamSum() {
        return data.stream().mapToLong(Integer::longValue).sum();
    }
}
```

加 `addProfiler(GCProfiler.class)` 跑：可以看到 stream 的 allocation rate 通常比 for 高 2-5×（Stream / Lambda 内部对象）。

---

## 黄金答题模板

**面试官：你怎么证明你的优化是有效的？**

> **三步走**：
> ① **JMH 微基准**：`@Warmup(5)` `@Measurement(10)` `@Fork(2)` 跑出方法级数据，配 `GCProfiler` 看分配速率；
> ② **wrk / JMeter 端到端压测**：模拟生产 QPS、并发用户数，重点看 P50/P95/P99 延迟；
> ③ **async-profiler 火焰图**：定位 CPU / 锁 / 内存 热点。**三个工具缺一不可**——JMH 证明"哪种实现更快"，压测证明"系统能扛多少"，Profiler 证明"瓶颈在哪"。**没经过 JMH 验证的"优化"都是猜测**。

---

## 看到什么就先想到这类

- **"你怎么证明优化有效"** → JMH + 压测 + Profiler 三件套
- **"`@Benchmark` `@Warmup` `@Fork`"** → JMH 微基准
- **"死代码消除 / DCE"** → 用返回值或 `Blackhole.consume`
- **"常量折叠"** → 用 `@State` 让 JIT 不知道值
- **"看 GC 开销"** → `addProfiler(GCProfiler.class)`
- **"看火焰图"** → `addProfiler(AsyncProfiler.class)` 或 `JavaFlightRecorder`
- **"多线程并发竞争"** → `@Threads(N)` + `@State(Scope.Benchmark)`
- **"测 P99 延迟"** → `Mode.SampleTime`
- **"测吞吐"** → `Mode.Throughput`
- **"测冷启动 / GC 暂停"** → `Mode.SingleShotTime`

## 延伸阅读

- 📄 [Java 工程实战](./java-engineering) — JVM 调优、GraalVM、CRaC、性能对比
- 📄 [Java 并发编程](./java-concurrency) — LongAdder / Disruptor / 虚拟线程
- 📄 [JVM 深入](./jvm-internals) — JIT 编译、GC、类加载
- 📄 [可观测性 · OpenTelemetry](../engineering-practice/monitoring-observability)
- 🔗 [openjdk.org/projects/code-tools/jmh](https://openjdk.org/projects/code-tools/jmh/)
- 🔗 [github.com/openjdk/jmh](https://github.com/openjdk/jmh) — JMH 源码 + 38 个官方 sample
- 🔗 [github.com/async-profiler/async-profiler](https://github.com/async-profiler/async-profiler)
