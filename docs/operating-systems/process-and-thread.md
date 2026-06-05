---
title: 进程与线程
---

# 进程与线程 Process & Thread

<span class="dig-tag dig-tag--category">操作系统</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
进程是操作系统资源分配的基本单位，线程是 CPU 调度的基本单位。同一进程下的线程共享内存空间，而进程之间相互隔离。理解二者的区别及通信方式是操作系统面试的核心。
:::

## 进程状态

进程在生命周期中会经历五种状态，操作系统通过状态机来管理所有进程：

```
        创建
          │
          ▼
        新建 (New)
          │  admit
          ▼
┌─────► 就绪 (Ready) ──── scheduler dispatch ────► 运行 (Running)
│         ▲                                              │
│         │  interrupt                                   │
│         └──────────────────────────────────────────────┘
│                                                        │
│         I/O or event wait                              │
│       ┌─────── 阻塞 (Blocked) ◄────────────────────────┘
│       │           │
│       │           │ I/O or event completion
│       └───────────┘
│
│  exit
└─────── 终止 (Terminated)
```

| 状态 | 说明 |
|------|------|
| **新建 New** | 进程刚被创建，尚未进入就绪队列 |
| **就绪 Ready** | 等待 CPU 调度，所有资源已就绪 |
| **运行 Running** | 占用 CPU 正在执行指令 |
| **阻塞 Blocked** | 等待 I/O 完成或某事件发生，暂时无法运行 |
| **终止 Terminated** | 进程执行完毕或被强制结束 |

> **单核 CPU** 同一时刻只有一个进程处于运行状态；多核 CPU 则可以有多个进程同时运行。

## 进程与线程的区别

这是操作系统面试最高频的考点，需要从多个维度进行对比。

| 维度 | 进程 (Process) | 线程 (Thread) |
|------|---------------|--------------|
| **定义** | 程序运行的一个实例，是资源分配单位 | 进程内的执行单元，是 CPU 调度单位 |
| **内存空间** | 独立的虚拟地址空间 | 共享所属进程的内存空间 |
| **通信方式** | IPC（管道、消息队列、共享内存等） | 直接读写共享内存（需要同步机制） |
| **切换开销** | 大（需要切换页表、刷新 TLB） | 小（同一地址空间内切换） |
| **创建开销** | 大（需要复制父进程资源） | 小（共享进程资源） |
| **健壮性** | 一个进程崩溃不影响其他进程 | 一个线程崩溃可能导致整个进程崩溃 |
| **并发性** | 进程间可以并发执行 | 同一进程内线程可以并发执行 |

### 线程私有资源 vs 共享资源

**线程私有：**
- 程序计数器 (PC)
- 寄存器集合
- 栈 (Stack)
- 线程本地存储 (TLS)

**线程共享（同一进程）：**
- 堆 (Heap)
- 全局变量 / 静态变量
- 文件描述符表
- 代码段 (Text Segment)
- 信号处理器

## 上下文切换 (Context Switch)

上下文切换是指 CPU 从一个进程/线程切换到另一个的过程。

### 切换流程

1. **保存当前上下文** - 将 CPU 寄存器、PC 等保存到 PCB（进程控制块）
2. **更新 PCB** - 将进程状态从 Running 改为 Ready / Blocked
3. **选择下一个进程** - 调度器从就绪队列选取
4. **恢复上下文** - 从新进程的 PCB 中加载寄存器等状态
5. **切换内存映射** - 切换页表（进程切换时），刷新 TLB

### 引发上下文切换的原因

- 时间片耗尽（抢占式调度）
- 系统调用（I/O 等待）
- 信号处理
- 优先级更高的进程变为就绪状态

### 上下文切换的开销

进程上下文切换比线程上下文切换开销大，主要差异在于：

- **页表切换：** 进程有独立页表，切换时需加载新页表
- **TLB 刷新：** Translation Lookaside Buffer 缓存了页表项，进程切换时需全量失效
- **缓存污染：** 新进程的工作集与原进程不同，CPU 缓存命中率下降

## 进程间通信 (IPC)

Linux/Unix 提供了多种 IPC 机制，每种适用于不同场景：

| 方式 | 特点 | 适用场景 |
|------|------|---------|
| **管道 Pipe** | 半双工，单向，只能在父子进程间使用 | shell 命令管道 `|` |
| **命名管道 FIFO** | 可跨任意进程，以文件形式存在 | 无亲缘关系进程间通信 |
| **共享内存** | 最快的 IPC，多进程直接读写同一块内存 | 高性能数据共享 |
| **消息队列** | 消息以队列形式存储，支持优先级 | 异步消息传递 |
| **信号量 Semaphore** | 主要用于同步控制，而非数据传输 | 互斥访问共享资源 |
| **信号 Signal** | 轻量级通知机制（如 SIGKILL, SIGTERM） | 进程控制、事件通知 |
| **Socket** | 支持网络通信，最通用 | 跨主机或本机进程通信 |

### 共享内存示例

```c
// 创建共享内存
int shmid = shmget(IPC_PRIVATE, 1024, IPC_CREAT | 0666);

// 挂载到当前进程地址空间
char *ptr = (char*) shmat(shmid, NULL, 0);

// 写入数据
sprintf(ptr, "Hello from process A");

// 使用完毕，解除挂载
shmdt(ptr);

// 删除共享内存
shmctl(shmid, IPC_RMID, NULL);
```

## 线程同步机制

多线程共享内存会引发竞态条件，需要同步机制来保证数据一致性：

### 互斥锁 (Mutex)

```c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

void* thread_func(void* arg) {
    pthread_mutex_lock(&lock);
    // critical section: 同一时刻只有一个线程能执行
    shared_counter++;
    pthread_mutex_unlock(&lock);
    return NULL;
}
```

### 条件变量 (Condition Variable)

```c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t cond = PTHREAD_COND_INITIALIZER;
int ready = 0;

// Producer
pthread_mutex_lock(&lock);
ready = 1;
pthread_cond_signal(&cond);   // 通知消费者
pthread_mutex_unlock(&lock);

// Consumer
pthread_mutex_lock(&lock);
while (!ready) {
    pthread_cond_wait(&cond, &lock); // 释放锁并等待

}
// process data
pthread_mutex_unlock(&lock);
```

## 内核线程 / 用户态线程 / 虚拟线程 / 协程

**这是 2025-2026 年并发面试最容易把候选人问垮的话题**——四个概念名字接近、实际机制大不相同。能讲清四者的差异，立刻显出深度。

### 一张图看懂四者关系

```
┌──────────────────────────────────────────────────┐
│  应用层视角                                       │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ T1   │  │ T2   │  │ T3   │  │ T4   │         │
│  └──────┘  └──────┘  └──────┘  └──────┘         │
└──────────────────────────────────────────────────┘
            ↓ 调度模型                ↑
┌──────────────────────────────────────────────────┐
│  内核线程       1:1        每个用户线程对应一个内核线程  │
│  (1:1 KSE)               POSIX pthread / Java Thread (老)│
├──────────────────────────────────────────────────┤
│  用户态线程     N:1        多用户线程映射到 1 个内核线程 │
│  (N:1)                   早期 Java Green Threads / Linux 旧 LinuxThreads│
├──────────────────────────────────────────────────┤
│  虚拟线程/协程  M:N        M 个用户线程 ↔ N 个内核线程  │
│  (M:N)                   Go goroutine / Java VirtualThread / Kotlin Coroutine│
└──────────────────────────────────────────────────┘
```

### 四种模型详细对比

| 维度 | **内核线程**（1:1）| **用户态线程**（N:1）| **协程**（M:N，应用调度）| **虚拟线程**（M:N，运行时调度）|
|------|------------------|------------------|----------------------|------------------------|
| **代表** | Linux pthread / Java 旧 Thread | 已淘汰 | Go goroutine / Kotlin coroutine / Python asyncio | **Java 21+ VirtualThread** |
| **调度者** | OS 内核 | 用户态调度器 | 用户态调度器（编程模型友好）| JVM Continuation（M:N 自动）|
| **栈大小** | 1-8 MB（固定）| 几 KB | 几 KB（按需增长）| **几 KB 起步、可增长** |
| **创建数量** | 数千 | 数万 | **百万级** | **百万级** |
| **阻塞表现** | 占用内核线程 | **一个线程阻塞，全组都阻塞** | 调度器把控制权切给其他协程 | JVM 自动 unmount + 切换 |
| **切换开销** | μs 级（涉及内核态切换）| ns 级 | ns 级 | ns 级 |
| **能利用多核** | ✅ | ❌（全在一个内核线程上）| ✅ | ✅ |
| **业务代码风格** | 命令式 | — | **需要 async/await 等关键字** | **同步代码**（最大优势）|

### 关键洞察：协程 vs 虚拟线程

虽然都是 M:N，但**业务代码体验完全不同**：

```kotlin
// Kotlin 协程：必须用 suspend / async 关键字"染色"
suspend fun fetchUser(): User {
    return api.getUser()  // suspend 函数才能调 suspend 函数
}
```

```java
// Java 虚拟线程：原生 Thread API，业务代码零修改
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> {
        return api.getUser();  // 普通同步调用，JVM 自动调度
    });
}
```

::: tip 💡 虚拟线程的"无侵入"是革命

> **Java 虚拟线程不需要 async/await 关键字染色**——这是它和 Kotlin 协程、JS async/await 最大的区别。所有现有阻塞 IO 库（JDBC、HttpClient）**直接受益**，**业务代码完全不用改**。这是 Java 后端在 2025-2026 年大幅简化高并发开发的核心新能力。

**前提**：JDK 24+ 已修复 `synchronized` 内 Pinning 问题（详见 [JDK 22-25 新进展](../programming-languages/java-modern-features#8-jdk-22-25-新进展-2024-2025)）。

:::

### 上下文切换开销实测

| 切换类型 | 典型耗时 | 涉及操作 |
|---------|---------|---------|
| 进程切换 | **3-5 μs** | TLB flush + 页表切换 + 寄存器保存 |
| 内核线程切换 | **1-2 μs** | 寄存器保存 + 栈切换（同进程不刷 TLB）|
| 虚拟线程 / 协程切换 | **~100 ns** | 用户态保存上下文，**比内核切换快 10-30×** |
| 函数调用 | ~1 ns | 仅入栈 |

::: tip 💡 一个能记住一辈子的数字

> **协程/虚拟线程切换比内核线程快 10-30 倍**，所以高并发 IO 场景下用它们能让吞吐量提升数倍——根本原因是省掉了内核态切换的开销。

:::

### 面试黄金回答模板

> **"四种并发模型本质是'谁来调度'：内核线程让 OS 调度，1:1 简单但创建昂贵；用户态线程纯应用调度但不能利用多核已淘汰；现代主流是 M:N 模型——Go goroutine、Kotlin 协程、Java 21 虚拟线程都是。**
> 
> **协程和虚拟线程的关键差异在编程模型**：协程要 suspend/async 关键字'染色'，虚拟线程是原生 Thread API、业务代码零改动。所以 Java 后端在 JDK 21+ 之后，写 IO 密集型服务就用虚拟线程，**直接把传统 `每请求一线程` 模型推到百万并发**。"

---

## 死锁 (Deadlock)

### 死锁四个必要条件（Coffman 条件）

1. **互斥** - 资源同一时刻只能被一个进程占用
2. **占有并等待** - 进程持有资源的同时等待其他资源
3. **不可剥夺** - 进程持有的资源只能由自己主动释放
4. **循环等待** - 进程 A 等待 B 的资源，B 等待 A 的资源

### 预防死锁

- **破坏占有并等待：** 一次性申请所有资源
- **破坏循环等待：** 规定资源申请顺序，按序申请
- **银行家算法：** 动态检测资源分配是否会导致不安全状态

## 经典并发题模板（必背手撕）

**这三道经典并发题是大厂面试 Top 3**：生产者-消费者、读者-写者、哲学家就餐。能讲清原理 + 现场写 Java 模板，立刻显出并发底子。

### 题 1：生产者-消费者（必背）

**核心问题**：缓冲区有界，多生产者多消费者，写满 / 读空时阻塞。

#### 方案 A：BlockingQueue（生产首选）

```java
class ProducerConsumer {
    BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(10);

    void produce() throws InterruptedException {
        for (int i = 0; ; i++) queue.put(i);     // 满了自动阻塞
    }

    void consume() throws InterruptedException {
        while (true) {
            Integer item = queue.take();          // 空了自动阻塞
            process(item);
        }
    }
}
```

#### 方案 B：ReentrantLock + Condition（面试要会手撕）

```java
class BoundedBuffer {
    final Lock lock = new ReentrantLock();
    final Condition notFull = lock.newCondition();
    final Condition notEmpty = lock.newCondition();
    final Object[] items = new Object[100];
    int putIdx, takeIdx, count;

    public void put(Object x) throws InterruptedException {
        lock.lock();
        try {
            while (count == items.length) notFull.await();    // ← 必须 while 不能 if
            items[putIdx] = x;
            if (++putIdx == items.length) putIdx = 0;
            count++;
            notEmpty.signal();
        } finally { lock.unlock(); }
    }

    public Object take() throws InterruptedException {
        lock.lock();
        try {
            while (count == 0) notEmpty.await();
            Object x = items[takeIdx];
            if (++takeIdx == items.length) takeIdx = 0;
            count--;
            notFull.signal();
            return x;
        } finally { lock.unlock(); }
    }
}
```

::: warning ⚠️ 经典坑：必须用 while 而不是 if

> **`while (count == 0) wait()`** —— 即使被唤醒，还要**再次检查条件**：
> ① **虚假唤醒（spurious wakeup）**——OS 可能无原因唤醒；
> ② **被通知后才能拿锁**——通知到拿锁之间，另一个线程可能已把数据消费完。

:::

#### 三种实现性能对比

| 方案 | 性能 | 代码量 | 适用 |
|------|------|-------|------|
| **synchronized + wait/notify** | 一般 | 短 | 简单场景、面试基础 |
| **ReentrantLock + Condition** | 好 | 中 | 需要多条件区分（满 vs 空）|
| **BlockingQueue** | **最好** | **极短** | **生产首选**，封装好 |
| **Disruptor**（无锁）| 最快 | 长 | 单机百万 TPS（详见 [现代并发工具](../programming-languages/java-concurrency#disruptor)）|

### 题 2：读者-写者问题

**核心问题**：读读并发、读写互斥、写写互斥。

```java
class ReadWriteCounter {
    private int count;
    private final ReadWriteLock lock = new ReentrantReadWriteLock();
    private final Lock readLock = lock.readLock();
    private final Lock writeLock = lock.writeLock();

    public int read() {
        readLock.lock();
        try { return count; }
        finally { readLock.unlock(); }
    }

    public void write(int delta) {
        writeLock.lock();
        try { count += delta; }
        finally { writeLock.unlock(); }
    }
}
```

#### 读写锁的"读者优先" vs "写者优先"

| 策略 | 行为 | 风险 |
|------|------|------|
| **读者优先**（默认）| 只要有读者，新读者立刻进入 | **写者饥饿**（永远等不到）|
| **写者优先** | 有写者等待时，新读者排队 | 读者偶发性饥饿 |
| **公平锁**（构造时 `new ReentrantReadWriteLock(true)`）| 按 FIFO 排队 | 性能下降 |

::: tip 💡 StampedLock 是新选择

> Java 8 的 **StampedLock 支持"乐观读"**——读时不上锁，读完后校验是否有写发生，没有就直接用。**适合读远多于写的场景**（如配置中心）。详见 [现代并发 — StampedLock](../programming-languages/java-concurrency#stampedlock-读多写少的乐观读神器)。

:::

### 题 3：哲学家就餐问题

**核心问题**：5 个哲学家围成一圈，左右各有 1 个筷子，必须拿到两支才能吃 → 全部同时拿左筷子 = 死锁。

#### 4 种经典解法

| 解法 | 思路 |
|------|------|
| **资源分级**（最常考）| 给筷子编号 0-4，**每人必须先拿低号再拿高号** → 第 5 个人会先拿 0 号 → 破坏循环等待 |
| **服务员仲裁** | 任何人拿筷子前要先问服务员（信号量）批准 |
| **拿不到放回**（活锁）| 拿到一支后如果拿不到第二支就放回 → 可能活锁 |
| **奇偶分离** | 奇数号先拿左，偶数号先拿右 → 同样破坏循环 |

#### Java 解法（资源分级）

```java
class Philosopher implements Runnable {
    private final Object leftFork, rightFork;
    private final int id;
    Philosopher(int id, Object left, Object right) {
        this.id = id;
        // 资源分级: 先拿编号小的
        if (System.identityHashCode(left) < System.identityHashCode(right)) {
            this.leftFork = left; this.rightFork = right;
        } else {
            this.leftFork = right; this.rightFork = left;
        }
    }
    public void run() {
        while (true) {
            synchronized (leftFork) {
                synchronized (rightFork) {
                    eat();
                }
            }
        }
    }
}
```

### 信号量 vs 互斥锁

| 维度 | **Mutex（互斥锁）** | **Semaphore（信号量）** |
|------|------------------|----------------------|
| **本质** | 二值锁（0/1）| **N 值计数器** |
| **谁可释放** | 必须是加锁者 | **任意线程都可 V 操作** |
| **能否 0** | 锁 = 不可用 | 信号量 = 0 表示资源耗尽 |
| **典型用途** | 临界区互斥 | **资源池**（连接池/线程池容量控制）|

```java
// Semaphore 经典用法：限流当前并发数 = 10
Semaphore sem = new Semaphore(10);
public void handleRequest() throws InterruptedException {
    sem.acquire();        // 减 1，>= 0 则获取，否则阻塞
    try {
        // 业务...
    } finally {
        sem.release();    // 加 1
    }
}
```

## 常见误区

::: warning 易错点
1. **线程崩溃会影响整个进程**，但进程崩溃不影响其他进程 — 因此微服务架构将不同模块隔离成独立进程
2. **协程（Coroutine）不是线程**，协程是用户态的轻量级并发单元，由程序员显式控制切换（如 Go 的 goroutine）
3. **多线程不一定比多进程快**，线程同步的锁竞争开销有时比进程切换开销更大
4. **共享内存虽然最快，但最容易出 bug**，需要配合信号量或互斥锁使用
:::

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 进程和线程有什么区别？什么时候用多进程，什么时候用多线程？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 进程间通信（IPC）有哪些方式？各有什么优缺点？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 什么是上下文切换？为什么进程切换比线程切换开销大？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### Q1: 进程和线程有什么区别？

**核心答法（4 个维度）：**

1. **资源分配单位 vs 调度单位：** 进程是操作系统资源分配（内存、文件描述符等）的基本单位；线程是 CPU 调度的基本单位，同一进程内的线程共享进程的资源。

2. **隔离性：** 进程拥有独立的虚拟地址空间，相互隔离，一个进程崩溃不影响其他进程；线程共享内存，一个线程的野指针可能导致整个进程崩溃。

3. **切换开销：** 进程切换需要切换页表、刷新 TLB，开销大；线程切换只需保存/恢复寄存器，开销小。

4. **通信方式：** 进程间通信需要 IPC 机制（管道、消息队列、共享内存等）；同进程内线程直接读写共享内存，但要注意线程安全。

**选型建议：**
- 多进程适合：安全隔离要求高、独立释放资源（如 Chrome 多标签）
- 多线程适合：密集共享数据、低延迟通信（如 Web 服务器处理请求）

### Q2: 进程间通信有哪些方式？

按速度从快到慢排序：**共享内存 > 消息队列 > 管道 > Socket**

| 方式 | 优点 | 缺点 |
|------|------|------|
| 共享内存 | 最快，零拷贝 | 需要手动同步，容易出 bug |
| 消息队列 | 支持缓冲，异步 | 有大小上限，需要内核参与 |
| 管道/FIFO | 简单易用 | 管道只支持父子进程，单向 |
| Socket | 最通用，支持网络 | 开销最大，代码最复杂 |

### Q3: 什么是上下文切换？

上下文切换是 CPU 从执行一个进程/线程切换到另一个的过程：

1. 保存当前进程的 CPU 寄存器、PC 到 PCB
2. 更新进程状态
3. 调度器选择下一个进程
4. 从新进程的 PCB 恢复寄存器
5. （进程切换时）切换页表，刷新 TLB

**为什么进程切换比线程切换开销大？** 因为进程有独立的虚拟地址空间，切换时必须切换页表并刷新 TLB（Translation Lookaside Buffer）。TLB 是 CPU 用于加速地址翻译的缓存，刷新后会导致后续内存访问的 miss rate 上升，这是最主要的开销来源。

## 延伸阅读

- [Linux 进程调度 - CFS 完全公平调度算法](https://www.kernel.org/doc/html/latest/scheduler/sched-design-CFS.html)
- [POSIX Threads Programming - Lawrence Livermore National Laboratory](https://hpc-tutorials.llnl.gov/posix/)
- 《操作系统概念》（Operating System Concepts）第 3-5 章
