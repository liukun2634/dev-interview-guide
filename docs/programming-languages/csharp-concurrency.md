---
title: C# 并发与多线程
---

# C# 并发与多线程（Task / async / 锁 / 并发集合 / 取消）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 章节范围
本页覆盖 **C# 并发体系**：Thread/ThreadPool/Task 层次、Task vs ValueTask、锁与同步原语、并发集合、IAsyncEnumerable、CancellationToken、Parallel/PLINQ。`async/await` 的语法与 ConfigureAwait 死锁见 [C# 现代特性](./csharp-modern-features#_1-async-await-异步核心)；线上诊断见 [C# 工程实战](./csharp-engineering#线上诊断与调试工具箱必备)。
:::

> 对标 Java 的并发体系。C# 的并发哲学是"**优先 Task，少碰 Thread**"——`async/await` + `Task` 是首选，裸 `Thread` 只在长时间后台循环时才用。

## Thread vs ThreadPool vs Task（层次关系）

| 抽象 | 层级 | 何时用 |
|------|------|--------|
| **Thread** | 最底层，1:1 OS 线程 | 长时间运行的专用后台线程（极少）|
| **ThreadPool** | 复用线程池，避免频繁创建 | 短任务（`QueueUserWorkItem`，少直接用）|
| **Task** | TPL 任务抽象，跑在 ThreadPool 上 | **绝大多数场景的首选** |
| **async/await** | 语法糖，把 Task 编译成状态机 | I/O 密集（不占线程）|

```csharp
// CPU 密集 → Task.Run 丢到线程池
var result = await Task.Run(() => HeavyCompute());

// I/O 密集 → 直接 await，不占线程（不要 Task.Run 包 IO！）
var data = await httpClient.GetStringAsync(url);
```

::: warning ⚠️ 别用 `Task.Run` 包 I/O
`Task.Run(() => client.GetAsync(...))` 是反模式：白白占一个线程池线程去等 I/O。真异步 API 直接 await 即可，await 期间**不占任何线程**。
:::

## Task vs ValueTask（高频）

| | `Task<T>` | `ValueTask<T>` |
|------|----------|----------------|
| 类型 | 引用类型（堆分配）| 值类型（栈，零分配）|
| 适用 | 通用 | **热路径 + 经常同步完成**（命中缓存）|
| 限制 | 可多次 await | **只能 await 一次**，不能并发复用 |

```csharp
// 命中缓存时同步返回，避免 Task 堆分配
public ValueTask<int> GetAsync(string key) {
    if (_cache.TryGetValue(key, out var v))
        return new ValueTask<int>(v);          // 零分配
    return new ValueTask<int>(LoadFromDbAsync(key));
}
```

## 锁与同步原语

```csharp
private readonly object _lock = new();

// ① lock = Monitor.Enter/Exit 语法糖（最常用）
lock (_lock) { _counter++; }

// ② Interlocked = 无锁原子操作（最快，单变量）
Interlocked.Increment(ref _counter);
Interlocked.CompareExchange(ref _value, newVal, expected);   // CAS

// ③ SemaphoreSlim = 限流 + 唯一支持 async 的锁
private readonly SemaphoreSlim _sem = new(1, 1);
await _sem.WaitAsync();
try { await DoAsync(); }
finally { _sem.Release(); }

// ④ ReaderWriterLockSlim = 读多写少
```

| 原语 | 对标 Java | 关键点 |
|------|----------|--------|
| **lock / Monitor** | `synchronized` | 不可跨 await（await 里不能持 lock）|
| **Interlocked** | `Atomic*` / CAS | 单变量原子，最快 |
| **SemaphoreSlim** | `Semaphore` | **唯一能 `await` 的锁**，异步限流首选 |
| **ReaderWriterLockSlim** | `ReentrantReadWriteLock` | 读并发、写互斥 |

::: warning ⚠️ `lock` 块里不能 `await`
`lock` 基于 Monitor，依赖同一线程进出；`await` 可能换线程 → 编译报错。异步场景用 **SemaphoreSlim**。
:::

> 锁的底层原理（CAS / 内存屏障 / 自旋 vs 互斥）见 [操作系统 · 同步与锁原理](/operating-systems/synchronization)。

## 并发集合

| 集合 | 用途 | 对标 Java |
|------|------|----------|
| `ConcurrentDictionary<K,V>` | 线程安全字典（`GetOrAdd` 原子）| `ConcurrentHashMap` |
| `ConcurrentQueue<T>` | 无锁队列 | `ConcurrentLinkedQueue` |
| `ConcurrentBag<T>` | 无序高并发袋 | — |
| `BlockingCollection<T>` | 阻塞生产消费（旧）| `BlockingQueue` |
| `Channel<T>` | **异步生产消费（首选）** | — |

```csharp
// GetOrAdd 原子，但工厂可能被调多次（注意副作用）
var val = dict.GetOrAdd(key, k => ExpensiveCreate(k));
```

### Channel（生产者-消费者首选）

```csharp
using System.Threading.Channels;

var channel = Channel.CreateBounded<int>(100);     // 有界 → 背压控制

// 生产者
_ = Task.Run(async () => {
    for (int i = 0; i < 1000; i++)
        await channel.Writer.WriteAsync(i);        // 满了自动等待
    channel.Writer.Complete();
});

// 消费者
await foreach (var item in channel.Reader.ReadAllAsync())
    Process(item);
```

**Channel vs BlockingCollection**：Channel 异步原生（await 让出线程，不阻塞）、有界背压、类似 Go channel 但更类型安全——新代码首选 Channel。

## IAsyncEnumerable — 异步流（C# 8）

```csharp
// 流式异步返回（边产边消费，不用一次性加载）
public async IAsyncEnumerable<int> ReadAsync() {
    await foreach (var row in db.StreamRowsAsync())
        yield return Process(row);
}

await foreach (var x in ReadAsync())
    Console.WriteLine(x);
```

**适用**：分页拉取、流式读 DB / 文件 / gRPC stream，避免内存堆积。

## CancellationToken — 协作式取消（必背）

```csharp
public async Task DoAsync(CancellationToken ct) {
    while (!ct.IsCancellationRequested) {
        await Step().WaitAsync(ct);     // 传播取消
        ct.ThrowIfCancellationRequested();
    }
}

// 超时取消
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
await DoAsync(cts.Token);   // 5s 后自动取消
```

> **约定**：异步方法把 `CancellationToken` 作为最后一个参数层层传下去；ASP.NET Core 会在请求中断时自动触发，避免做无用功。

## Parallel / PLINQ（CPU 密集并行）

```csharp
// 并行 for（CPU 密集，自动分区到多核）
Parallel.For(0, 1000, i => Compute(i));
Parallel.ForEach(items, item => Process(item));

// .NET 6+ 异步并行 + 限并发度
await Parallel.ForEachAsync(urls,
    new ParallelOptions { MaxDegreeOfParallelism = 10 },
    async (url, ct) => await Download(url, ct));

// PLINQ
var result = data.AsParallel().Where(x => x.IsValid).ToList();
```

::: warning ⚠️ 仅 CPU 密集才用
`Parallel` / `AsParallel` 只对**CPU 密集 + 大数据 + 无副作用**有收益；I/O 密集用 `Task.WhenAll`，小数据并行反而更慢（分区 + 调度开销）。
:::

## 面试常问 & 怎么答

**Q1：async/await 是多线程吗？**

不是。`async/await` 是**任务化的异步**，本质是编译器生成状态机。`await` 之前的代码同步执行，遇到 `await` 一个未完成的 I/O Task 时**让出当前线程**（线程还回线程池去干别的），I/O 完成后再从状态机恢复执行。所以一台机器用很少的线程就能扛大量并发 I/O——这是它和"开很多线程"的本质区别。

**Q2：Task 和 ValueTask 怎么选？**

默认用 `Task`。只有在**热路径 + 经常同步完成**（如缓存命中直接返回）时才用 `ValueTask` 省掉 Task 的堆分配。代价是 `ValueTask` 只能 await 一次、不能并发复用、不能多次取结果，用错很危险，所以非性能敏感处别用。

**Q3：C# 里有哪些锁？async 方法里怎么加锁？**

`lock`/`Monitor`（最常用，但**不能跨 await**）、`Interlocked`（单变量无锁 CAS，最快）、`SemaphoreSlim`（**唯一支持 `await` 的锁**，异步限流首选）、`ReaderWriterLockSlim`（读多写少）。异步场景必须用 `SemaphoreSlim.WaitAsync()`，因为 `lock` 依赖同线程进出而 await 可能换线程。

**Q4：怎么实现可取消的异步操作？**

用 `CancellationToken` 协作式取消：把 token 作为参数层层传递，循环里检查 `IsCancellationRequested` 或调 `ThrowIfCancellationRequested()`，并把 token 传给下游 await。超时用 `CancellationTokenSource(timeout)`。ASP.NET Core 在请求中断时会自动 cancel，避免浪费资源。

## 看到什么就先想到这类

| 关键词 / 场景 | 联想到 |
|-------------|--------|
| 高并发 I/O、少占线程 | async/await + Task.WhenAll |
| 热路径、缓存命中 | ValueTask 省分配 |
| 异步代码里要加锁 / 限并发 | SemaphoreSlim（不是 lock）|
| 单变量原子自增 | Interlocked（不是 lock）|
| 线程安全字典 | ConcurrentDictionary.GetOrAdd |
| 生产者消费者 | Channel（不是 BlockingCollection）|
| 流式异步返回、边产边消费 | IAsyncEnumerable + await foreach |
| 可取消 / 超时 | CancellationToken(Source) |
| CPU 密集多核并行 | Parallel.For / AsParallel |
| `.Result` / `.Wait()` | 死锁风险，全链路 await |
