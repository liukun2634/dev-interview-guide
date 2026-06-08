---
title: Go 并发编程
---

# Go 并发编程（GMP / Goroutine / Channel / Context / sync）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 章节范围
本页覆盖 **Go 并发模型完整体系**：**GMP 调度（Top 面试题）**、Channel + Select、Context 取消传播、defer/panic/recover、sync 并发原语（Mutex/WaitGroup/Once/Pool）、Go GC。语法基础见 [Go 基础](./go-fundamentals)。
:::

## GMP 调度模型（必背 Top 题）

**面试 Top 1**："Goroutine 为什么比线程轻？怎么调度的？" —— 能讲清 GMP 立刻区分中/高级。

### 核心三件套

```text
G - Goroutine（用户态协程）
   - 栈初始 2KB（可动态扩容到 GB）
   - 上下文切换 < 200ns（vs 线程 1-5μs）

M - Machine（OS 线程，内核态）
   - 真正占用 CPU 核心
   - 默认数量: GOMAXPROCS

P - Processor（逻辑处理器，调度上下文）
   - 数量 = GOMAXPROCS（默认 = CPU 核数）
   - 持有本地 G 队列（LRQ）
```

### 调度图

```text
        ┌─────────────────────────────────────┐
        │  Global Run Queue (GRQ)              │
        │  [G][G][G][G][G][G]                  │
        └─────────────────────────────────────┘
                        ↑
                        │ steal
        ┌───────────────┼───────────────┐
        │               │                │
   ┌────▼────┐     ┌───▼────┐      ┌───▼────┐
   │ P1 LRQ  │     │ P2 LRQ  │      │ P3 LRQ  │
   │[G][G][G]│     │[G][G]   │      │[G][G][G]│
   └────┬────┘     └────┬───┘      └────┬───┘
        │ bind            │ bind           │ bind
   ┌────▼────┐     ┌────▼────┐      ┌────▼────┐
   │   M1    │     │   M2    │      │   M3    │
   │ (OS Th) │     │ (OS Th) │      │ (OS Th) │
   └────┬────┘     └────┬────┘      └────┬────┘
        │ run             │ run            │ run
   ┌────▼────┐     ┌────▼────┐      ┌────▼────┐
   │  CPU 1  │     │  CPU 2  │      │  CPU 3  │
   └─────────┘     └─────────┘      └─────────┘
```

### 调度规则

| 规则 | 说明 |
|------|------|
| **M:N 映射** | N 个 Goroutine 复用 M 个 OS 线程（典型 M ≈ CPU 核数）|
| **P 持有 LRQ** | 每个 P 有自己的本地队列（256 个 G 容量）|
| **Work Stealing** | P 本地 G 用完 → **偷其他 P 一半 G**（无锁 / CAS）|
| **GRQ 兜底** | 全局队列存溢出的 G、阻塞唤醒的 G |
| **网络轮询器** | **netpoller**（epoll/kqueue）独立 M，IO 就绪通知调度 |

### 协作式 + 抢占式调度

```text
Go 1.13 之前：纯协作（goroutine 主动让出）
   问题：纯计算循环 for {} 永远不让出 → 阻塞 GC

Go 1.14+：基于信号的抢占
   - 编译器在函数序言插入抢占检查点
   - sysmon 后台监控线程发现 G 跑 > 10ms → 发 SIGURG
   - 信号处理器记录现场 → 让出
```

### Goroutine vs OS 线程

| 维度 | OS 线程 | **Goroutine** |
|------|---------|-------------|
| **栈大小** | 固定 1-8MB | **初始 2KB，动态扩容** |
| **创建时间** | 10-100μs | **< 1μs** |
| **切换开销** | 1-5μs（陷入内核）| **< 200ns**（用户态）|
| **数量** | 数千 | **数百万** |
| **调度** | 内核（抢占式）| 用户态 GMP（协作 + 抢占）|

---

## Channel — Go 并发灵魂

### 4 种 channel 模式

```go
// 1. 无缓冲（同步）—— 发送方阻塞直到接收方 ready
ch := make(chan int)

// 2. 有缓冲（异步）—— 缓冲未满前发送不阻塞
ch := make(chan int, 10)

// 3. 只读 / 只写（函数参数）
func producer(out chan<- int) { out <- 1 }
func consumer(in  <-chan int) { v := <-in }

// 4. 关闭信号
ch := make(chan struct{})       // ★ 用 struct{}{} 零内存
close(ch)                       // 通知所有接收方
```

### Select 多路复用

```go
select {
case msg := <-ch1:
    fmt.Println("from ch1:", msg)
case ch2 <- value:
    fmt.Println("sent to ch2")
case <-time.After(time.Second):
    fmt.Println("timeout")           // ★ 超时控制
case <-ctx.Done():
    return ctx.Err()                 // ★ 取消
default:
    fmt.Println("no channel ready")  // 非阻塞
}
```

### Channel 必背陷阱

```go
// ❌ 死锁: 无缓冲 channel 发送阻塞
func main() {
    ch := make(chan int)
    ch <- 1                          // ★ 死锁: 没人接收
    fmt.Println(<-ch)
}

// ❌ 向已关闭 channel 发送 → panic
ch := make(chan int)
close(ch)
ch <- 1                              // ★ panic: send on closed channel

// ✅ 从已关闭 channel 接收 → 返回零值 + ok=false
v, ok := <-ch                        // v=0, ok=false（用 ok 判断是否关闭）

// ❌ 重复关闭 → panic
close(ch)
close(ch)                            // ★ panic

// ✅ 生产者多个时 → 用 sync.Once 关闭
var once sync.Once
once.Do(func() { close(ch) })
```

### 经典模式

#### Worker Pool

```go
func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {                    // range 自动等关闭
        results <- j * 2
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    for w := 1; w <= 5; w++ {
        go worker(w, jobs, results)
    }

    for j := 1; j <= 50; j++ {
        jobs <- j
    }
    close(jobs)

    for r := 1; r <= 50; r++ {
        <-results
    }
}
```

#### Fan-out / Fan-in

```go
// Fan-out: 1 producer → N consumers
for i := 0; i < 10; i++ {
    go worker(jobs, results)
}

// Fan-in: N producers → 1 channel
func merge(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    for _, c := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for v := range c {
                out <- v
            }
        }(c)
    }
    go func() { wg.Wait(); close(out) }()
    return out
}
```

---

## Context — 取消 + 超时 + 传值

```go
// 5 大类型
ctx := context.Background()                        // 根
ctx := context.TODO()                              // 占位（不确定时）

ctx, cancel := context.WithCancel(parent)          // 手动取消
ctx, cancel := context.WithTimeout(parent, 5*time.Second)
ctx, cancel := context.WithDeadline(parent, deadline)
ctx := context.WithValue(parent, "userID", 123)    // 传值（慎用）
```

### 标准用法

```go
func handleRequest(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()                                  // ★ 必须 defer cancel

    result, err := queryDB(ctx)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    fmt.Fprint(w, result)
}

func queryDB(ctx context.Context) (string, error) {
    select {
    case <-time.After(10 * time.Second):
        return "data", nil
    case <-ctx.Done():
        return "", ctx.Err()                        // 超时 / 取消
    }
}
```

::: warning ⚠️ Context 必背规则

> ① **Context 作为第一参数**，命名 `ctx`
> ② **永远不要存到 struct 字段**（除非短生命周期）
> ③ **传 nil Context 是 bug**（用 TODO）
> ④ **WithCancel/WithTimeout 必须 defer cancel()** 防泄漏
> ⑤ **WithValue 只传请求级元数据**（trace ID / user ID）—— 不传可选参数

:::

---

## defer / panic / recover

### defer 必背规则

```go
func main() {
    defer fmt.Println("1")
    defer fmt.Println("2")
    defer fmt.Println("3")
}
// 输出: 3 2 1   ★ 后进先出（栈）
```

```go
// ❌ 闭包陷阱: defer 捕获变量
func bad() {
    for i := 0; i < 3; i++ {
        defer fmt.Println(i)          // ★ 编译期捕获 i，输出 2 1 0（每次新 i）
                                       // ★ Go 1.22+ 已修复
    }
}

// ❌ defer 在循环中累积
func bad2() {
    for i := 0; i < 1000000; i++ {
        f, _ := os.Open(file[i])
        defer f.Close()               // ★ 100 万个 defer 累积，函数结束才执行
    }
}

// ✅ 用 IIFE
func good() {
    for i := 0; i < 1000000; i++ {
        func() {
            f, _ := os.Open(file[i])
            defer f.Close()           // ★ IIFE 结束就释放
            // ...
        }()
    }
}
```

### panic / recover

```go
func mayPanic() {
    panic("something bad")
}

func safe() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered:", r)
        }
    }()
    mayPanic()
    fmt.Println("after panic")        // 不执行
}
// 输出: Recovered: something bad
```

**生产规则**：
- ✅ HTTP / RPC handler 顶层 recover 防崩
- ❌ **不要用 panic 做流程控制**（用 error 返回）
- ❌ **recover 只能在 defer 中调用**

---

## 并发原语速查

```go
// 1. sync.Mutex / sync.RWMutex
var mu sync.Mutex
mu.Lock()
defer mu.Unlock()

// 2. sync.WaitGroup
var wg sync.WaitGroup
for i := 0; i < 5; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        // work
    }()
}
wg.Wait()

// 3. sync.Once
var once sync.Once
once.Do(initialize)                  // ★ 只执行一次

// 4. sync.Pool（对象复用，减 GC）
var pool = sync.Pool{
    New: func() any { return new(Buffer) },
}
b := pool.Get().(*Buffer)
defer pool.Put(b)

// 5. sync/atomic
var counter atomic.Int64             // Go 1.19+ 类型化原子
counter.Add(1)
counter.Load()
counter.CompareAndSwap(old, new)

// 6. errgroup（限并发 + 错误传播）
import "golang.org/x/sync/errgroup"

g, ctx := errgroup.WithContext(ctx)
g.SetLimit(10)                       // ★ 最多 10 并发
for _, url := range urls {
    url := url
    g.Go(func() error {
        return fetch(ctx, url)
    })
}
if err := g.Wait(); err != nil {
    // 任一错误 → 全部取消
}
```

---

## Go GC（三色标记 + 写屏障）

| 维度 | 数值 |
|------|------|
| **算法** | **并发三色标记 + 删除屏障**（Go 1.5+）|
| **STW 时间** | **< 1ms**（百 GB 堆也不超）|
| **触发** | 默认堆 2× 增长 + 强制 2 分钟 |
| **vs Java** | STW 远低于 G1，但吞吐略低 |

**关键调优**：

```go
// GOGC: 默认 100（堆翻倍触发 GC）
// 调低（GOGC=50）→ GC 更频繁、内存更省
// 调高（GOGC=200）→ GC 更少、内存翻倍但吞吐更高

// Go 1.19+ 内存限制
debug.SetMemoryLimit(2 * 1024 * 1024 * 1024)   // 2GB
```

---

