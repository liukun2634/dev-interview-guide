---
title: C# 工程实战
---

# C# 工程实战（.NET vs Java / 陷阱 / 答题模板）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span>

::: tip 💡 章节范围
本页覆盖 **C# / .NET 面试与选型**：.NET vs Java 对比、必踩坑、黄金答题模板、看到什么就先想到这类速查。语法基础见 [C# 基础](./csharp-fundamentals)；生态见 [C# 生态](./csharp-ecosystem)。
:::

## .NET vs Java（必背对比）

| 维度 | **.NET 8/9** | **Java 21+** |
|------|-------------|---------------|
| **运行时** | CLR（CoreCLR）| JVM（HotSpot / GraalVM）|
| **GC** | Server GC + Background | G1 / ZGC / Generational ZGC |
| **AOT 编译** | **Native AOT 成熟** | GraalVM Native Image |
| **快速启动** | **Native AOT < 50ms** | CRaC / GraalVM < 100ms |
| **协程 / 虚拟线程** | async/await（任务级）| **Virtual Thread（JDK 21）** |
| **响应式** | Channels / Rx.NET | Reactor / RxJava |
| **Web 框架** | ASP.NET Core / Minimal API | Spring Boot / Quarkus / Micronaut |
| **ORM** | Entity Framework Core / Dapper | Hibernate / MyBatis |
| **包管理** | NuGet | Maven / Gradle |
| **开源生态** | 微软 + 社区（GitHub 主流）| Apache + Eclipse + 各厂 |
| **典型客户** | 金融 / 企业 / 游戏（Unity）| 互联网 / 移动 / 大数据 |
| **国内市场** | 较小 | **主流** |

### .NET 优势场景

- ✅ **企业 / 金融**（与 SQL Server / Azure 深度集成）
- ✅ **Unity 游戏开发**（C# 是 Unity 脚本语言）
- ✅ **桌面应用**（WPF / WinUI / MAUI 跨平台）
- ✅ **Azure 云原生**（首席公民）
- ✅ **Windows 客户端开发**

### Java 优势场景

- ✅ **大型互联网后端**（Spring 生态成熟）
- ✅ **Android**
- ✅ **大数据**（Hadoop / Spark / Flink 都是 Java）
- ✅ **国内招聘市场**

---

## C# 常见陷阱（必背）

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **async void** | 异常无法捕获 | 用 `async Task` |
| **`.Result` / `.Wait()`** | 死锁 | 全链路 await |
| **库代码忘 ConfigureAwait(false)** | 老框架死锁 | 库强制加 |
| **EF AsEnumerable() 全表拉** | 内存爆炸 | 让 SQL 端过滤 |
| **N+1 查询** | 性能灾难 | `.Include()` / `.Select()` |
| **`Task.Run` 包同步代码** | 没用 + 增加线程切换 | 真异步用真异步 API |
| **catch (Exception) 吞掉** | 看不到错误 | 至少 log，throw 时用 `throw;` |
| **Dispose 忘了** | 资源泄漏 | `using` / `using var` / IAsyncDisposable |
| **string 拼接循环** | O(n²) | StringBuilder |
| **大对象进入 LOH** | 堆碎片 | 用 ArrayPool / Span |

---

## 黄金答题模板（必背）

> **面试官：现代 C# / .NET 你最熟的特性是哪些？**
>
> **答**：**4 大核心 + 2 大新方向**：
>
> **核心**：
> ① **async/await** —— **不是多线程，是任务化**；await 之前同步执行；库代码必须 ConfigureAwait(false) 防死锁；`async void` 禁用（除事件处理器）；同步代码调异步用 `.Result` 必死锁；
>
> ② **LINQ** —— **`IEnumerable<T>` 内存执行 vs `IQueryable<T>` 翻译为 SQL**；EF 反模式是 `AsEnumerable()` 后过滤会拉全表；
>
> ③ **Record** —— 值相等 + init-only 不可变 + `with` 副本表达式，**DTO / 值对象首选**；
>
> ④ **Pattern Matching + Primary Constructor + Collection Expressions** —— C# 10-12 语法糖大幅减少样板代码。
>
> **新方向**：
> ⑤ **Native AOT**（.NET 8 成熟）—— 编译期生成原生码，**启动 < 50ms + 内存减 50%**，Serverless / 容器场景革命；代价是反射受限、第三方库需适配；
>
> ⁥ **Channels + `Span<T>`** —— Go-like channel 做异步生产消费 + 零分配解析，高性能服务必备。
>
> **vs Java**：
> - **金融 / 企业 / Azure / Unity / Windows** → .NET 优势
> - **大型互联网 / Android / 大数据 / 国内招聘** → Java 优势
> - **2026 趋势**：.NET 10 LTS + Aspire（云原生编排）+ AI 集成大幅提升
>
> **必踩坑**：① async void / .Result 死锁；② EF AsEnumerable 全表拉；③ N+1 查询；④ 库代码忘 ConfigureAwait(false)；⑤ Dispose 忘了用 using。

---

## 看到什么就先想到这类

- **"async 死锁"** → ConfigureAwait(false) + 全链路 await
- **"async void"** → 改 async Task（除事件）
- **"EF 慢"** → 查 N+1、避免 AsEnumerable、用 Include / Select
- **"不可变 DTO"** → record
- **"高性能解析"** → `Span<T>` + stackalloc
- **"零启动 / Serverless"** → Native AOT
- **"生产者消费者"** → Channel（不是 BlockingCollection）
- **"模式匹配"** → switch expression + 列表模式
- **"减少样板"** → Primary Constructor + Collection Expressions
- **"DI 注入"** → AddSingleton / AddScoped / AddTransient
- **"Minimal API"** → 微服务 / 简单 API
- **".NET vs Java"** → 看团队栈 + 云平台（Azure 选 .NET）
- **"GC 调优"** → dotnet-counters + ServerGC + ConcurrentDictionary
- **"内存泄漏"** → dotnet-dump + dotMemory
