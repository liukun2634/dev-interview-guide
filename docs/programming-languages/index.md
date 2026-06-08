---
title: 编程语言
---

# 编程语言章节总览

<span class="dig-tag dig-tag--category">章节导览</span> <span class="dig-tag dig-tag--easy">⭐ 入门</span>

::: tip 💡 章节定位
本章覆盖 **2026 主流编程语言**——以 Java 体系为核心，扩展 **C++ / C# / Python** 三大主流语言。每种语言深度介绍**现代特性 + 面试高频点 + 跨语言对比**，帮助多语言工程师快速进入对应岗位。
:::

## 章节地图（按面试岗位需求排序）

### 🔥 Java 体系（国内招聘市场主流）

| 主题 | 核心知识点 | 重要度 |
|------|----------|------|
| [Java 基础](./java-fundamentals) | JVM 分区、GC、HashMap、synchronized vs ReentrantLock、volatile | ⭐⭐⭐⭐⭐ |
| [Java 并发编程](./java-concurrency) | 线程池、AQS、CAS、ThreadLocal、并发容器、CompletableFuture、ScopedValue (JDK 21+) | ⭐⭐⭐⭐⭐ |
| [Java 集合框架](./java-collections) | ArrayList vs LinkedList、ConcurrentHashMap 1.8 改造、fail-fast vs fail-safe | ⭐⭐⭐⭐⭐ |
| [JVM 深入](./jvm-internals) | 类加载与双亲委派、JMM 与 happens-before、JIT、GC 选型（G1/ZGC/Generational ZGC）| ⭐⭐⭐⭐⭐ |
| [Java 新特性](./java-modern-features) | Lambda/Stream/Optional、Record、虚拟线程 + Pinning JFR、JDK 21-25 路线 | ⭐⭐⭐⭐ |

### 🔥 其他主流语言（外企 / Azure / 游戏 / AI）

| 主题 | 主要场景 | 重要度 |
|------|---------|------|
| [C++ 现代特性](./cpp) **🆕** | 游戏 / 嵌入式 / 高频交易 / 系统编程 | ⭐⭐⭐⭐ |
| [C# 与 .NET](./csharp) **🆕** | 外企 / Azure / 金融 / Unity / Windows 客户端 | ⭐⭐⭐⭐ |
| [Python 现代特性](./python) **🆕** | AI / 数据科学 / DevOps / 自动化 / Web | ⭐⭐⭐⭐⭐ |
| [Go 现代特性](./go) **🆕** | 云原生 / K8s / 微服务 / API 网关 / CLI | ⭐⭐⭐⭐⭐ |
| [Rust 现代特性](./rust) **🆕** | 系统编程 / 替代 C++ / 性能模块 / WASM | ⭐⭐⭐⭐ |

---

## 2026 编程语言选型决策

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

## 2026 语言生态关键变化

| 语言 | 关键演进 |
|------|---------|
| **Java 21+** | **虚拟线程 GA** + JDK 24 修复 Pinning + Generational ZGC + CRaC 启动加速 |
| **C++ 20/23** | **Concepts / Coroutines / Modules / Ranges**；**Rust 大幅替代新项目** |
| **C# / .NET 8/9** | **Native AOT 成熟**（启动 < 50ms）+ Minimal API + Channels + Aspire 云原生编排 |
| **Python 3.12/3.13** | **🚀 Free-Threaded（首次正式可关 GIL）** + JIT 实验性 + uv/Polars/Pydantic v2 (Rust 写) |
| **Go 1.22+** | Range-over-func 迭代器、PGO 优化、Goroutine 调度改进 |
| **Rust** | 持续在 Linux 内核、浏览器、数据库等关键基础设施替代 C++ |

---

## 跨语言核心概念对比

### 1. 并发模型

| 语言 | 模型 | 特色 |
|------|------|------|
| **Java** | Thread + 虚拟线程（JDK 21）+ ForkJoinPool | M:N 调度 |
| **C++** | std::thread + std::jthread + 协程 (C++20) | 接近系统线程 |
| **C#** | async/await + Task + Channel | 任务并行库（TPL）|
| **Python** | asyncio + multiprocessing + threading | **受 GIL 限制**，3.13 实验性 Free-Threaded |
| **Go** | **Goroutine + Channel (GMP)** | 业界并发标杆 |
| **Rust** | async/await + Tokio | 编译期保证安全 |

### 2. 内存管理

| 语言 | 模型 | 优势 / 劣势 |
|------|------|-----------|
| **Java** | GC（G1 / ZGC）| 简单 / GC 暂停 |
| **C++** | RAII + 智能指针 | 极致性能 / 手动小心 |
| **C#** | GC（Server GC）| 简单 / GC 暂停（AOT 可减） |
| **Python** | GC + 引用计数 | 简单 / 慢 / GIL |
| **Go** | GC（低延迟）| 简单 / 短暂 STW |
| **Rust** | **所有权 + 借用检查** | 编译期安全 + 零开销 / 学习陡 |

### 3. 性能水平（粗略）

```text
C/C++/Rust  >>>  Go/C#/Java (with AOT)  >>>  Java JIT  >>>  Node.js  >>>  Python
极致性能         接近原生 / 编译型              JIT 优化       JIT       解释 + GIL
```

---

## 学习建议（按职业阶段）

### 校招 / 1-3 年（建立基础）

1. 主力语言深度学习（Java 或 Python 选一个）
2. 数据结构 + 算法（[算法章节](../data-structures-and-algorithms/)）
3. 基础类型系统 + OOP + 设计模式

### 3-5 年（横向扩展）

4. **多学一门系统编程语言**（C++ 或 Rust）—— 理解底层
5. **多学一门动态语言**（Python）—— AI / 脚本必备
6. 深入并发 + JVM / CLR 底层

### 5+ 年（架构 / 资深）

7. **掌握 2-3 门语言** 能根据场景选型
8. 理解每种语言的内存 / 并发 / 性能模型
9. 关注语言演进（C++20-26 / Java 21+ / .NET 8+ / Python 3.13+）

---

## 多语言工程师的核心能力

**不是会写 5 种语言**，而是：
- ✅ 理解**每种语言适合什么场景**
- ✅ 理解**内存 / 并发 / 类型系统**的跨语言原理
- ✅ 能在**正确语言里写正确代码**（Python 写算法、C++ 写引擎、Java 写企业后端、Go 写云原生）
- ✅ 知道**何时换语言**（Python CPU 密集时 → PyO3 / Rust 扩展）

---

## 关联章节

- [JVM 底层](./jvm-internals) ↔ [.NET CLR](./csharp) ↔ [Python 解释器](./python)
- [Java 并发](./java-concurrency) ↔ [操作系统 — 进程线程](../operating-systems/process-and-thread)
- [Python AI 栈](./python) ↔ [AI 技术章节](../ai-technology/)
- [C++ 性能](./cpp) ↔ [系统设计 — 高性能架构](../system-design/)
