---
title: 编程语言
---

# 编程语言章节总览

<span class="dig-tag dig-tag--category">章节导览</span> <span class="dig-tag dig-tag--easy">⭐ 入门</span>

::: tip 💡 章节定位
本章以 Java 为核心，扩展 **C++ / C# / Python / Go / Rust** 六类语言。每种语言按基础、并发或内存、现代特性、工程实践组织。选主力语言依据目标岗位，跨语言学习重点是执行、内存、取消与错误模型，不是背一张永久性能排名。
:::

---

## 🗺️ 全章节地图

### ☕ Java 体系

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [Java 基础](./java-fundamentals) | JVM 分区、GC、HashMap、`synchronized` vs `ReentrantLock`、`volatile` | ⭐⭐⭐⭐⭐ |
| [Java 并发编程](./java-concurrency) | 线程池、AQS、CAS、ThreadLocal、并发容器、异步任务生命周期；新 API 需区分 preview 与正式状态 | ⭐⭐⭐⭐⭐ |
| [Java 集合框架](./java-collections) | `ArrayList` vs `LinkedList`、`ConcurrentHashMap` 1.8 改造、fail-fast vs fail-safe | ⭐⭐⭐⭐⭐ |
| [JVM 深入](./jvm-internals) | 类加载与双亲委派、JMM 与 happens-before、JIT、GC 选型（G1/ZGC/Generational ZGC） | ⭐⭐⭐⭐⭐ |
| [Java 新特性](./java-modern-features) | Lambda/Stream/Optional、Record、虚拟线程 + Pinning JFR、JDK 21-25 路线 | ⭐⭐⭐⭐ |
| [Java 工程实战](./java-engineering) 🆕 | JVM 调优 Checklist、Spring Boot vs Quarkus、GraalVM Native / CRaC、虚拟线程陷阱、答题模板 | ⭐⭐⭐⭐⭐ |
| [Java JMH 基准测试](./java-jmh) | 预热、测量、优化消除、参数与实验可重复性 | ⭐⭐⭐⭐ |

### ⚙️ C++ 体系（5 篇，游戏 / 嵌入式 / 高频交易 / 系统编程）

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [C++ 基础](./cpp-fundamentals) | 类型 / 指针 / 引用 / 类与继承 / 模板 / 异常 / 类型转换 | ⭐⭐⭐⭐⭐ |
| [C++ 内存管理](./cpp-memory-management) | RAII、智能指针（`unique_ptr`/`shared_ptr`/`weak_ptr`）、Move 语义、循环引用 | ⭐⭐⭐⭐⭐ |
| [C++ STL 与现代特性](./cpp-stl-modern) | 容器 / 算法 / 迭代器、Lambda、C++20（Concepts / Coroutines / Modules / Ranges）、C++23 | ⭐⭐⭐⭐ |
| [C++ 并发与工具链](./cpp-toolchain) | `std::thread` / `jthread` / `atomic`、CMake、编译链接、gdb / Sanitizer | ⭐⭐⭐⭐ |
| [C++ 工程实战](./cpp-engineering) | C++ vs Rust 选型、性能优化、UB / 悬空引用、答题模板 | ⭐⭐⭐⭐ |

### 🔷 C# 体系（外企 / Azure / 金融 / Unity / Windows 客户端）

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [C# 基础](./csharp-fundamentals) | 值类型 / 引用类型 / 委托 / 事件 / 异常 / 反射 / 特性 | ⭐⭐⭐⭐⭐ |
| [C# 现代特性](./csharp-modern-features) | async/await、LINQ、Records、模式匹配、.NET 8/9 Native AOT | ⭐⭐⭐⭐ |
| [C# 并发与多线程](./csharp-concurrency) | Task vs ValueTask、锁与同步原语、并发集合、CancellationToken、Parallel/PLINQ | ⭐⭐⭐⭐ |
| [C# 生态](./csharp-ecosystem) | CLR / GC（Workstation/Server）、EF Core、ASP.NET Core / Minimal API、Aspire | ⭐⭐⭐⭐ |
| [C# 工程实战](./csharp-engineering) | C# vs Java 必背对比、AOT 选型、陷阱、答题模板 | ⭐⭐⭐⭐ |

### 🐍 Python 体系（5 篇，AI / 数据 / DevOps / 自动化 / Web）

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [Python 基础](./python-fundamentals) | 数据类型、OOP、装饰器、生成器、异常、`match`、上下文管理 | ⭐⭐⭐⭐⭐ |
| [Python 并发](./python-concurrency) | GIL、`asyncio`、`multiprocessing`、Python 3.13 Free-Threaded（可关 GIL） | ⭐⭐⭐⭐⭐ |
| [Python 现代特性](./python-modern-features) | Type Hints、Pydantic v2（Rust 写）、FastAPI、Polars、`match` 模式匹配 | ⭐⭐⭐⭐⭐ |
| [Python 工程实战](./python-engineering) | uv 包管理、pytest、内存诊断（memray）、日志、性能优化 | ⭐⭐⭐⭐ |
| [Python 生态与选型](./python-ecosystem) | AI 栈、Python vs Java / Go、CPU 密集 → PyO3/Rust 扩展、陷阱 | ⭐⭐⭐⭐ |

### 🟢 Go 体系（4 篇,云原生 / K8s / 微服务 / API 网关 / CLI）

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [Go 基础](./go-fundamentals) | 变量 / 切片 / Map / Struct / Interface / Modules / 测试 / 标准库 | ⭐⭐⭐⭐⭐ |
| [Go 并发编程](./go-concurrency) | **GMP 调度器**、Goroutine、Channel、Context、`sync` 包、GC | ⭐⭐⭐⭐⭐ |
| [Go 现代特性](./go-modern-features) | 错误处理（`errors.Is/As`）、泛型、Go 1.23 Range-over-func、PGO | ⭐⭐⭐⭐ |
| [Go 工程实战](./go-engineering) | 性能优化（`sync.Pool` / 零拷贝）、Go vs Java/Rust、必踩坑、答题模板 | ⭐⭐⭐⭐⭐ |

### 🦀 Rust 体系（4 篇,系统编程 / 替代 C++ / 性能模块 / WASM）

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [Rust 基础](./rust-fundamentals) | 变量、Struct、Enum、Match、集合、Cargo、Edition | ⭐⭐⭐⭐⭐ |
| [Rust 所有权](./rust-ownership) | **Ownership / Borrowing / Lifetime**、智能指针（`Box`/`Rc`/`Arc`/`RefCell`） | ⭐⭐⭐⭐⭐ |
| [Rust 进阶](./rust-traits-async) | `Result`、Trait、async/await、Tokio、`Send + Sync` | ⭐⭐⭐⭐ |
| [Rust 工程实战](./rust-engineering) | Cargo 生态、Edition 2024、Rust vs C++/Go、陷阱、答题模板 | ⭐⭐⭐⭐ |

---

## 🎯 2026 编程语言选型决策

```text
你的岗位是？
│
├─ 国内互联网后端 → Java（必备）
│
├─ AI / 数据 / 机器学习 → Python（绝对主流）
│
├─ 外企 / 金融 / Azure 后端 → C# 或 Java
│
├─ 游戏 / 引擎 / 高频交易 / 嵌入式 → C++
│
├─ 云原生 / Kubernetes / 网络服务 → Go
│
├─ 安全替代 C++ 的新系统编程 → Rust
│
└─ 全栈 / Web 实时 → Node.js (TypeScript) 或 Python (FastAPI)
```

---

## ⚡ 2026 语言生态关键变化

| 语言 | 关键演进 |
|------|---------|
| **Java 21 / 25** | 虚拟线程在 21 正式，monitor pinning 在 24 改进，ScopedValue 在 25 正式；25 的 StructuredTaskScope 仍是 preview |
| **C++ 20 / 23 / 后续标准** | Concepts、Coroutines、Modules、Ranges 要分别核对编译器、标准库与构建系统支持，不能只看 `-std` 参数 |
| **C# / .NET** | async、Channels、Native AOT 与动态 PGO 的收益依赖负载；AOT 还需核对反射、动态代码和库兼容性 |
| **Python** | free-threaded 是解释器构建与扩展兼容性选择，不等于所有 Python 默认没有 GIL；asyncio 仍需避免阻塞事件循环 |
| **Go** | Range-over-func 在 1.23；PGO 的 auto 模式利用可用 profile，不代表没有采样文件也凭空优化 |
| **Rust Edition 2024** | Edition、rustc 版本与库/runtime 版本是不同维度；所有权和 Send/Sync 不自动防逻辑死锁或取消后副作用 |

---

## 🔍 跨语言核心概念对比

### 1. 并发模型

| 语言 | 模型 | 特色 |
|------|------|------|
| **Java** | Thread + **虚拟线程（JDK 21）** + ForkJoinPool | M:N 调度，JDK 24 修复 Pinning |
| **C++** | `std::thread` + `std::jthread` + 协程（C++20） | 接近系统线程 |
| **C#** | `async/await` + `Task` + Channel | 任务并行库（TPL） |
| **Python** | `asyncio` + `multiprocessing` + `threading` | **受 GIL 限制**，3.13 实验性 Free-Threaded |
| **Go** | **Goroutine + Channel (GMP)** | 业界并发标杆 |
| **Rust** | `async/await` + Tokio | **编译期保证 `Send + Sync`** |

### 2. 内存管理

| 语言 | 模型 | 优势 / 劣势 |
|------|------|-----------|
| **Java** | GC（G1 / ZGC / Generational ZGC） | 简单 / GC 暂停（Gen ZGC < 1ms） |
| **C++** | RAII + 智能指针 | 极致性能 / 手动小心 |
| **C#** | GC（Server GC / Workstation） | 简单 / GC 暂停（AOT 可减） |
| **Python** | GC + 引用计数 | 简单 / 慢 / GIL |
| **Go** | GC（低延迟，三色标记） | 简单 / 短暂 STW |
| **Rust** | **所有权 + 借用检查** | **编译期安全 + 零开销** / 学习陡 |

### 3. 性能水平（粗略）

不能把语言按一个不带工作负载的箭头序列排序。JIT 在长时间运行的热点路径上可能优于某些 AOT 构建；Python 数值操作可能主要在 native 库执行；I/O 服务则常被数据库与网络限制。比较应固定算法、数据、硬件、并发、编译选项与延迟目标，再测 CPU、内存、吞吐和尾延迟。

### 4. 启动时间（冷启动 / Serverless 视角）

下表仅是用于讨论的示意量级，不是语言保证；实际启动还包含镜像拉取、依赖初始化、网络和预热，应分别测量进程启动、Ready 与首个成功请求。

| 语言 | 启动时间 |
|------|---------|
| **Go 静态二进制** | < 50ms ⭐⭐⭐⭐⭐ |
| **Rust 静态二进制** | < 50ms ⭐⭐⭐⭐⭐ |
| **C++ 静态二进制** | < 50ms ⭐⭐⭐⭐⭐ |
| **Java GraalVM Native** | 20-100ms ⭐⭐⭐⭐⭐ |
| **C# .NET 8 AOT** | 30-80ms ⭐⭐⭐⭐ |
| **Java CRaC（JDK 21+）** | 50-200ms ⭐⭐⭐⭐ |
| **Python 解释器** | 80-300ms ⭐⭐⭐ |
| **Java JVM（默认）** | 1-5s ⭐⭐ |
| **C# JIT** | 0.5-1.5s ⭐⭐⭐ |

---

## 跨语言面试的共同追问

| 问题 | 应说明的边界 |
|------|--------------|
| 一个请求派生多个任务，失败后谁负责清理？ | 父子任务生命周期、错误聚合、取消传播、等待子任务结束 |
| 取消是否等于任务已停止？ | 多数取消是合作式信号；网络/数据库副作用可能已提交 |
| 谁拥有资源？何时释放？ | RAII、finally/defer、上下文管理器、Dispose/Drop 的同步与异步边界 |
| 线程安全是否等于业务原子？ | 安全容器的多步组合仍可能竞争，必须说明线性化点或事务边界 |
| async 是否表示 CPU 并行？ | 等待模型、线程/进程/runtime 调度以及 CPU 工作放在哪执行 |
| 如何证明“更快”？ | 基线、预热、输入分布、P99、分配与资源成本；参考 JMH 与 profiler |

选择一种主力语言，把同一场景讲透：并行查询两个依赖，任一个失败或总 deadline 到期就取消剩余工作，并限制下游并发。再比较 Java 的任务作用域、Python TaskGroup、Go context/errgroup、.NET Task/CancellationToken 与 Rust runtime 的具体差异，不把相似名称当成相同语义。

## 📚 学习建议（按职业阶段）

### 校招 / 1-3 年（建立基础）

1. 主力语言深度学习（Java 或 Python 选一个 → 把对应 5-6 篇全部吃透）
2. 数据结构 + 算法（[算法章节](../data-structures-and-algorithms/)）
3. 基础类型系统 + OOP + 设计模式

### 3-5 年（横向扩展）

4. **多学一门系统编程语言**（C++ 或 Rust）—— 理解底层
5. **多学一门动态语言**（Python）—— AI / 脚本必备
6. 深入并发 + JVM / CLR 底层 + 工程实战

### 5+ 年（架构 / 资深）

7. **掌握 2-3 门语言**，能根据场景选型
8. 理解每种语言的内存 / 并发 / 性能模型
9. 关注语言演进（C++20-26 / Java 21-25 LTS / .NET 8+ / Python 3.13+ / Rust Edition 2024）

---

## 🛠️ 多语言工程师的核心能力

**不是会写 6 种语言**，而是：

- ✅ 理解 **每种语言适合什么场景**
- ✅ 理解 **内存 / 并发 / 类型系统** 的跨语言原理
- ✅ 能在 **正确语言里写正确代码**（Python 写 AI / 算法、C++ 写引擎、Java 写企业后端、Go 写云原生、Rust 写性能模块）
- ✅ 知道 **何时换语言**（Python CPU 密集 → PyO3 / Rust 扩展；Java 冷启动慢 → GraalVM / CRaC）

---

## 📖 推荐阅读路径

```text
推荐 3 条学习路径（任选其一深入）
│
├─ 路径 A：国内互联网后端
│   Java 基础 → Java 并发 → Java 集合 → JVM 深入 → Java 新特性 → Java 工程实战
│   + Go 基础 + Go 并发（K8s 时代必备）
│
├─ 路径 B：AI / 数据工程
│   Python 基础 → Python 现代特性 → Python 并发 → Python 工程实战 → Python 生态
│   + Rust 基础 + Rust 所有权（写高性能扩展）
│
└─ 路径 C：系统 / 游戏 / 高频
    C++ 基础 → C++ 内存管理 → C++ STL 现代 → C++ 工具链 → C++ 工程实战
    + Rust 全套 4 篇（C++ 替代方案）
```

---

## 🔗 关联章节

- [JVM 底层](./jvm-internals) ↔ [.NET CLR](./csharp-ecosystem) ↔ [Python 解释器](./python-ecosystem)
- [Java 并发](./java-concurrency) ↔ [Go 并发](./go-concurrency) ↔ [操作系统 — 进程线程](../operating-systems/process-and-thread)
- [Python AI 栈](./python-ecosystem) ↔ [AI 技术章节](../ai-technology/)
- [C++ 内存管理](./cpp-memory-management) ↔ [Rust 所有权](./rust-ownership) ↔ [系统设计 — 高性能架构](../system-design/)
- [Java 工程实战](./java-engineering) ↔ [Spring Boot 3 新特性](../web-and-frameworks/spring-boot3-new-features) ↔ [监控与可观测性](../engineering-practice/monitoring-observability)
