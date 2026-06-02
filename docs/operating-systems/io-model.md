---
title: I/O 模型
---

# I/O 模型

## 概念

I/O 模型描述了应用程序与操作系统之间进行数据读写时的交互方式。核心问题是：**当数据还没准备好时，调用者该怎么办？数据准备好后，谁来完成从内核到用户空间的拷贝？**

一次 I/O 操作分两个阶段：
1. **数据准备阶段**：等待数据到达内核缓冲区（如网卡收到数据包）
2. **数据拷贝阶段**：将内核缓冲区的数据拷贝到用户空间

不同 I/O 模型的本质区别，就在于这两个阶段是否阻塞调用线程。

---

## 核心原理

### 1. 五种 I/O 模型（Unix 网络编程经典分类）

#### 阻塞 I/O（Blocking I/O）

调用 `read()` 后，线程挂起，直到数据准备好且拷贝完成才返回。两个阶段都阻塞。

#### 非阻塞 I/O（Non-blocking I/O）

调用 `read()` 后立即返回。若数据未就绪返回 `EAGAIN`，应用需轮询（busy-loop）不断重试。数据拷贝阶段仍阻塞。

#### I/O 多路复用（I/O Multiplexing）

用 `select` / `poll` / `epoll` 同时监听多个文件描述符。等待阶段阻塞在 `select/epoll_wait`，有描述符就绪后再调用 `read()`（拷贝阶段阻塞）。本质仍是同步 I/O，但一个线程可处理大量连接。

#### 信号驱动 I/O（Signal-driven I/O）

注册 `SIGIO` 信号处理函数，数据就绪时内核发信号通知应用，应用在信号处理函数中调用 `read()`。准备阶段非阻塞，拷贝阶段仍阻塞。实践中较少使用。

#### 异步 I/O（Asynchronous I/O，AIO）

调用 `aio_read()` 后立即返回，内核负责等待数据并完成拷贝，全部完成后通知应用。**两个阶段都不阻塞**。Linux 的 `io_uring`（5.1+）是目前最成熟的实现。

#### 五种模型对比（ASCII 图）

```
                  数据准备阶段        数据拷贝阶段
                 ┌─────────────┐    ┌─────────────┐
阻塞 I/O        │   阻塞等待   │    │   阻塞拷贝   │
                 └─────────────┘    └─────────────┘

                 ┌─────────────┐    ┌─────────────┐
非阻塞 I/O      │ 轮询/EAGAIN  │    │   阻塞拷贝   │
                 └─────────────┘    └─────────────┘

                 ┌─────────────┐    ┌─────────────┐
I/O 多路复用    │ 阻塞在select │    │   阻塞拷贝   │
                 └─────────────┘    └─────────────┘

                 ┌─────────────┐    ┌─────────────┐
信号驱动 I/O    │ 非阻塞(信号) │    │   阻塞拷贝   │
                 └─────────────┘    └─────────────┘

                 ┌─────────────┐    ┌─────────────┐
异步 I/O        │    非阻塞    │    │    非阻塞    │
                 └─────────────┘    └─────────────┘
```

#### 同步 vs 异步的本质区别

- **同步 I/O**：数据拷贝阶段由调用线程完成（阻塞）。前四种模型均属同步 I/O。
- **异步 I/O**：数据拷贝阶段由内核完成，完成后通知应用，调用线程全程不阻塞。

> 阻塞/非阻塞描述的是**等待数据准备时**调用者的状态；同步/异步描述的是**数据拷贝**由谁完成。

---

### 2. I/O 多路复用详解

#### select

```c
int select(int nfds, fd_set *readfds, fd_set *writefds,
           fd_set *exceptfds, struct timeval *timeout);
```

- 用 `fd_set` 位图表示文件描述符集合，最大支持 **1024** 个 fd（`FD_SETSIZE`）
- 每次调用前需重新设置 `fd_set`，返回后需遍历所有 fd 判断哪个就绪
- 时间复杂度 **O(n)**，每次都把 fd 集合从用户态拷贝到内核态

#### poll

```c
int poll(struct pollfd *fds, nfds_t nfds, int timeout);
```

- 用 `pollfd` 数组替代位图，**没有 1024 上限**（受系统 `ulimit` 限制）
- 仍需遍历全部 fd，时间复杂度 **O(n)**
- 解决了 select 的 fd 上限问题，但大量连接时性能仍差

#### epoll

```c
int epoll_create(int size);                            // 创建 epoll 实例
int epoll_ctl(int epfd, int op, int fd,
              struct epoll_event *event);              // 注册/修改/删除 fd
int epoll_wait(int epfd, struct epoll_event *events,
               int maxevents, int timeout);            // 等待就绪事件
```

- 内核用**红黑树**维护监听的 fd，用**双向链表（就绪链表）**维护就绪事件
- `epoll_wait` 只返回就绪的 fd，**O(1)** 事件通知（与连接总数无关）
- fd 信息常驻内核，无需每次重新拷贝

#### 三者对比表

| 特性 | select | poll | epoll |
|------|--------|------|-------|
| 最大连接数 | 1024（`FD_SETSIZE`） | 无硬限制 | 无硬限制（受内存限制） |
| 数据结构 | fd_set 位图 | pollfd 数组 | 红黑树 + 就绪链表 |
| 遍历效率 | O(n) | O(n) | O(1)（只遍历就绪） |
| fd 拷贝 | 每次调用全量拷贝 | 每次调用全量拷贝 | 仅 epoll_ctl 时拷贝一次 |
| 触发模式 | 水平触发（LT） | 水平触发（LT） | LT 和 ET 均支持 |
| 跨平台 | 是 | 是 | 仅 Linux |

---

### 3. epoll 深入

#### 工作流程（三步）

```
epoll_create()  →  在内核创建 epoll 对象（红黑树 + 就绪链表）
      ↓
epoll_ctl()     →  向红黑树中增/删/改监听的 fd 及其事件
      ↓
epoll_wait()    →  阻塞等待；有 fd 就绪时内核将其加入就绪链表并唤醒
```

#### 水平触发（LT，Level Triggered） vs 边缘触发（ET，Edge Triggered）

| | LT（默认） | ET |
|--|------------|-----|
| 触发时机 | 只要缓冲区有数据就持续通知 | 仅在状态变化（新数据到达）时通知一次 |
| 未读完 | 下次 `epoll_wait` 继续通知 | 不再通知，必须一次性读完（循环到 `EAGAIN`） |
| 编程复杂度 | 低 | 高（需配合非阻塞 fd） |
| 适用场景 | 通用场景 | 高性能场景（Nginx） |

#### 为什么 Nginx / Redis 用 epoll

- **连接数多**：Web 服务器/缓存同时维护数万连接，select/poll 的 O(n) 遍历无法承受
- **活跃连接少**：大多数连接在某一时刻并不活跃，epoll 只返回就绪的 fd，避免无效遍历
- **零拷贝开销**：fd 注册一次后常驻内核，无需每次系统调用重新拷贝

---

### 4. 零拷贝（Zero-Copy）

#### 传统 I/O（以读文件发送到网络为例）

```
磁盘 → (DMA拷贝) → 内核读缓冲区
     → (CPU拷贝) → 用户缓冲区       ← read() 返回，上下文切换 ×2
     → (CPU拷贝) → Socket 发送缓冲区
     → (DMA拷贝) → 网卡             ← write() 返回，上下文切换 ×2

共 4 次拷贝（2 次 CPU 拷贝 + 2 次 DMA 拷贝），4 次上下文切换
```

#### mmap + write（3 次拷贝）

```c
void *buf = mmap(fd, ...);   // 内核读缓冲区映射到用户空间（省去一次 CPU 拷贝）
write(socket_fd, buf, len);
```

```
磁盘 → (DMA拷贝) → 内核读缓冲区（与用户空间共享映射）
     → (CPU拷贝) → Socket 发送缓冲区
     → (DMA拷贝) → 网卡

共 3 次拷贝，4 次上下文切换
```

#### sendfile（2 次拷贝，Linux 2.4+ 支持 DMA gather）

```c
sendfile(socket_fd, file_fd, offset, count);
```

```
磁盘 → (DMA拷贝) → 内核读缓冲区
     → (DMA gather拷贝) → 网卡    ← 内核直接将 fd 引用发给网卡，无需 CPU 参与

共 2 次拷贝（均为 DMA），2 次上下文切换（无 CPU 拷贝）
```

#### 零拷贝对比表

| 方式 | CPU 拷贝 | DMA 拷贝 | 上下文切换 | 说明 |
|------|---------|---------|-----------|------|
| 传统 read+write | 2 | 2 | 4 | 基线 |
| mmap+write | 1 | 2 | 4 | 减少一次 CPU 拷贝 |
| sendfile（旧） | 1 | 2 | 2 | 无用户态参与 |
| sendfile（Linux 2.4+） | 0 | 2 | 2 | DMA gather，真正零 CPU 拷贝 |

#### 应用场景

- **Kafka**：消费者拉取消息时用 `sendfile` 将日志文件数据直接发到网络，吞吐量极高
- **Nginx**：静态文件服务启用 `sendfile on`，大文件传输零 CPU 拷贝
- **Java NIO**：`FileChannel.transferTo()` 底层调用 `sendfile`

---

### 5. Reactor 模式

Reactor 是基于 I/O 多路复用的事件驱动设计模式：用一个或多个线程监听事件，将就绪的 I/O 事件分发给对应的 Handler 处理。

#### 单 Reactor 单线程（Redis 6.0 之前）

```
                  ┌─────────────────────────────┐
客户端连接 ──────→ │  Reactor（select/epoll）     │
                  │  ├─ Acceptor（新连接）        │
                  │  └─ Handler（读/业务/写）     │
                  └─────────────────────────────┘
                        （单线程处理一切）
```

- 优点：无锁，模型简单
- 缺点：Handler 阻塞会拖慢整个服务；无法利用多核
- 适用：Redis（业务逻辑本身是纯内存操作，极快）

#### 单 Reactor 多线程

```
                  ┌─────────────────────────────────────────┐
客户端连接 ──────→ │  Reactor（主线程）                       │
                  │  ├─ Acceptor                            │
                  │  └─ Handler（读/写）                    │
                  │       ↕ 分发业务                        │
                  │  Thread Pool（业务逻辑多线程处理）        │
                  └─────────────────────────────────────────┘
```

- 优点：业务逻辑并行，利用多核
- 缺点：单 Reactor 仍是瓶颈（accept + I/O 在同一线程）

#### 主从 Reactor 多线程（Netty、Nginx worker 进程）

```
                  ┌──────────────────────────────────────────────────┐
客户端连接 ──────→ │  Main Reactor（主线程）                           │
                  │  └─ Acceptor（只负责 accept 新连接）              │
                  │         ↓ 注册到 Sub Reactor                     │
                  │  Sub Reactor 1  Sub Reactor 2  Sub Reactor N     │
                  │  （各自的 epoll，负责 I/O 读写）                   │
                  │         ↓                                        │
                  │  Thread Pool（业务逻辑处理）                      │
                  └──────────────────────────────────────────────────┘
```

- 优点：接受连接和 I/O 处理分离，充分利用多核，性能最佳
- 缺点：实现复杂
- 代表：Netty（Boss Group + Worker Group）、Nginx（master + worker）

---

## io_uring 深度解析

`io_uring` 是 Linux 5.1（2019）引入的**异步 I/O 框架**，2023-2025 年已经从"前沿技术"变成**高并发后端面试必问**——尤其是数据库、网关、存储类岗位。

### 为什么需要 io_uring？epoll 还不够吗？

| 痛点（epoll）| 解决（io_uring）|
|-----------|-------------|
| 每次 I/O 操作都要系统调用 | **批量提交**，N 次操作一次 syscall |
| 是 I/O 多路复用（**等待**就绪），不是真异步 | **真正异步**——内核完成读写后才通知 |
| 磁盘 I/O 不能用 epoll | **统一覆盖**网络 + 磁盘 + 文件 |
| read/write 仍要拷贝 | 配合 **`IORING_OP_*` + Registered Buffers** 减少拷贝 |
| 每次都要进出内核态 | **SQPOLL 模式**：内核轮询 SQ，应用提交后无需 syscall |

### SQ/CQ 双环形队列架构

io_uring 的核心数据结构是**共享内存中的两个无锁环形队列**：

```
┌─────────────────────────────────────────────────┐
│              用户态应用程序                       │
│  写入 SQE             读取 CQE                   │
│    ↓                    ↑                       │
│  ┌──────┐  共享 mmap   ┌──────┐                 │
│  │  SQ  │ ←──────────→ │  CQ  │                 │
│  │ 提交 │              │ 完成 │                 │
│  │ 队列 │              │ 队列 │                 │
│  └──────┘              └──────┘                 │
│    ↓                    ↑                       │
└─────────────────────────────────────────────────┘
       ↓                    ↑
┌─────────────────────────────────────────────────┐
│             Linux 内核                          │
│  消费 SQE → 异步执行 I/O → 写入 CQE             │
└─────────────────────────────────────────────────┘
```

- **SQE（Submission Queue Entry）**：应用提交的 I/O 请求（读 / 写 / accept / send 等 200+ 操作）
- **CQE（Completion Queue Entry）**：内核完成后的结果
- **共享内存**：避免 syscall 时数据拷贝
- **无锁设计**：通过 head/tail 索引实现单生产者-单消费者无锁队列

### 三大杀手特性

#### ① Batched Submission：N 操作 1 次 syscall

```c
// 传统 epoll：100 个 read 需要 100 次系统调用
for (int i = 0; i < 100; i++) read(fds[i], bufs[i], size);

// io_uring：100 个 read 准备好后，1 次 io_uring_enter() 全部提交
for (int i = 0; i < 100; i++) {
    sqe = io_uring_get_sqe(ring);
    io_uring_prep_read(sqe, fds[i], bufs[i], size, 0);
}
io_uring_submit(ring);   // 唯一一次 syscall
```

**收益**：syscall 从 100 次降到 1 次，对**高并发短连接场景**（如 API 网关）TPS 提升 30-100%。

#### ② SQPOLL：内核轮询模式（零 syscall）

启用 `IORING_SETUP_SQPOLL` 后内核会**自己轮询 SQ 队列**，应用只管往里写 SQE，**完全不需要 syscall**：

```
应用线程: 写 SQE → 写 SQE → 写 SQE   (用户态，纳秒级)
                      ↓ (共享内存)
内核线程: 轮询 SQ → 执行 I/O → 写 CQE  (始终在内核态)
```

**代价**：内核多一个常驻线程消耗 CPU（典型 ~50-100% 单核）。适合超高频 I/O 场景。

#### ③ Registered Buffers / Files：消除重复注册

`IORING_REGISTER_BUFFERS` 把用户态 buffer **预先注册到内核**，后续 I/O 直接复用，避免每次 read 都做 `get_user_pages()`：

| 模式 | 单次 I/O 开销 | 适用 |
|------|-------------|------|
| 普通 io_uring | ~100ns | 通用 |
| + Registered Buffers | ~50ns | 固定 buffer 池 |
| + Registered Files | ~30ns | 长连接持久 fd |

### io_uring vs epoll 决策表

| 场景 | 推荐 | 原因 |
|------|------|------|
| **传统 Web 服务器**（C10K）| epoll 即可 | 成熟、跨内核版本兼容 |
| **超高 QPS API 网关**（> 50w QPS）| io_uring + SQPOLL | syscall 是瓶颈 |
| **数据库 / 存储系统** | **io_uring 必选** | 磁盘 I/O epoll 没法用 |
| **需要支持 Linux < 5.1 / Windows** | epoll / IOCP | io_uring 仅 Linux 5.1+ |
| **简单应用** | epoll | io_uring API 学习曲线陡 |

### 生产案例

| 项目 | 用法 | 收益 |
|------|------|------|
| **Cloudflare** | 边缘网关切 io_uring | TPS +40% |
| **ScyllaDB** | 全栈 io_uring + SPDK | 比 Cassandra 快 10× |
| **PostgreSQL 17** | 实验性 io_uring AIO | WAL 写入延迟下降 |
| **Tokio**（Rust）| `tokio-uring` 运行时 | 文件 I/O 性能提升 |
| **Netty** | `IOUringEventLoop`（实验）| Java 圈未来方向 |

### Linux 6.x 关键演进

- **6.0**：io_uring multishot（一次提交持续接受多个完成事件，如多次 accept）
- **6.5**：BPF 集成、零拷贝 send/receive 标准化
- **6.7+**：iowq 调度优化，缓解 SQPOLL CPU 占用
- **2024 安全收紧**：默认禁用部分 op，云厂商按需开启

### 面试黄金回答模板

> **"epoll 是 I/O 多路复用——让你**等**很多 fd 就绪后**自己**去 read；io_uring 是真异步——你**告诉内核**要做什么，内核做完通过完成队列通知你。两者的核心差异是 SQ/CQ 双环形队列 + 共享内存 + 批量提交，把每次 I/O 的 syscall 开销从 ~1μs 降到 ~50ns。**
> 
> **在 50w+ QPS 的网关、数据库存储引擎、磁盘 I/O 这三类场景下 io_uring 不可替代；通用 Web 服务器 epoll 仍是默认选择。"**

---

## 面试常问 & 怎么答

**Q1：select、poll、epoll 的区别？**

> 三点抓住：fd 上限、数据结构、遍历效率。
>
> select 用位图，最多 1024 个 fd，每次调用需重置并全量拷贝到内核，O(n) 遍历。poll 用数组解决了上限问题，但仍是 O(n) 遍历。epoll 用红黑树维护监听 fd、就绪链表存就绪事件，fd 只注册一次，`epoll_wait` 直接返回就绪 fd，O(1) 通知，且支持边缘触发（ET）。大量并发连接时 epoll 性能远优于前两者，这也是 Nginx 默认使用 epoll 的原因。

**Q2：什么是零拷贝？Kafka 为什么用 sendfile？**

> 零拷贝是指减少或消除数据在内核/用户空间之间的 CPU 拷贝。传统 read+write 需要 2 次 CPU 拷贝和 4 次上下文切换。`sendfile` 让内核直接将文件数据通过 DMA 发到网卡，Linux 2.4+ 实现了 0 次 CPU 拷贝、2 次上下文切换。
>
> Kafka 的消费者拉取消息本质是读磁盘文件写到网络 socket，正好是 sendfile 的典型场景。用 sendfile 后 CPU 几乎不参与数据搬运，吞吐量可提升数倍，这是 Kafka 高吞吐的重要原因之一。

**Q3：阻塞/非阻塞 和 同步/异步 有什么区别？**

> 两组概念描述的维度不同。
>
> - **阻塞/非阻塞**：描述调用者在**等待数据准备**时是否挂起线程。阻塞就是傻等，非阻塞就是立刻返回 EAGAIN 自己轮询。
> - **同步/异步**：描述**数据拷贝**（从内核到用户空间）由谁完成。同步 I/O 中调用者必须亲自完成拷贝（会阻塞在拷贝阶段）；异步 I/O 中内核完成拷贝后再通知调用者，调用者全程不阻塞。
>
> 因此，非阻塞 I/O 仍是同步的（拷贝阶段阻塞），只有 AIO（如 io_uring）才是真正的异步 I/O。

---

## 看到什么就先想到这类

| 关键词 | 联想方向 |
|--------|---------|
| C10K 问题、高并发连接 | epoll + 非阻塞 I/O + Reactor 模式 |
| Nginx/Redis 为什么快 | epoll（O(1) 事件通知）+ 单线程 Reactor / 零拷贝 |
| Kafka 高吞吐 | sendfile 零拷贝 + 顺序写磁盘 |
| ET 模式、边缘触发 | 必须一次读完（循环到 EAGAIN），需配合非阻塞 fd |
| Java NIO / Netty | I/O 多路复用 + 主从 Reactor 多线程模型 |
| io_uring | Linux 5.1+，真正的异步 I/O，两阶段均不阻塞 |
| mmap | 用户态直接访问内核缓冲区映射，减少一次 CPU 拷贝，也用于共享内存 IPC |
| DMA | 硬件直接内存访问，不占用 CPU，I/O 拷贝的底层机制 |
