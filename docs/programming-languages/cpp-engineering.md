---
title: C++ 工程实战
---

# C++ 工程实战（C++ vs Java/Go/Rust / 陷阱 / 答题模板）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span>

::: tip 💡 章节范围
本页覆盖 **C++ 面试与选型**：C++ vs Java/Go/Rust 对比、必踩坑、黄金答题模板、看到什么就先想到这类速查。语法基础见 [C++ 基础](./cpp-fundamentals)；内存管理见 [C++ 内存管理](./cpp-memory-management)。
:::

## C++ vs Java/Go/Rust（必背对比）

| 维度 | C++ | Java | Go | Rust |
|------|-----|------|------|------|
| **内存管理** | 手动 + RAII + smart ptr | GC | GC | **所有权 + 借用检查（编译期）** |
| **并发** | std::thread + future | Thread + virtual thread + ForkJoinPool | **Goroutine + channel（GMP）** | async/await + Tokio |
| **性能** | **最高** | 高 | 中高 | 与 C++ 接近 |
| **学习曲线** | 陡 | 中 | 平缓 | **最陡** |
| **强项** | 系统编程 / 游戏 / 高频交易 | 企业后端 / Android | 云原生 / 网络服务 | **系统编程 / 替代 C++** |
| **2026 趋势** | 仍是高性能首选 | 虚拟线程 + Spring AI | K8s / Docker 生态 | **大幅替代 C++ 新项目** |

::: tip 💡 C++ 仍然不可替代的场景

> ① **超低延迟**（高频交易 < 1µs）
> ② **游戏引擎**（Unreal / Unity 底层）
> ③ **嵌入式 / 实时系统**
> ④ **现有大型 C++ codebase**（Chromium / LLVM / DBMS）
> ⑤ **HPC / 科学计算**（与 CUDA 集成）
>
> **新项目 2026 越来越多选 Rust**（同样性能 + 内存安全）。

:::

---

## C++ 常见陷阱（必背）

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **裸 new/delete** | 内存泄漏 / double-free | 用 unique_ptr / make_unique |
| **shared_ptr 循环引用** | 永远不释放 | 用 weak_ptr 打破 |
| **lambda 按引用捕获悬挂** | UB | 按值或 shared_ptr 共享 |
| **std::move 后用源对象** | UB | move 后只能析构 / 重新赋值 |
| **vector 越界用 []** | UB 不报错 | 用 at() 抛异常或 -D_GLIBCXX_DEBUG |
| **未捕获的异常** | std::terminate | 顶层 try-catch |
| **rule of three/five 不全** | 浅拷贝 + double-free | RAII + Rule of Zero |
| **多线程不用 atomic** | data race UB | std::atomic / mutex |
| **范围 for 修改容器** | 迭代器失效 | 用索引或显式 erase |

---

## 黄金答题模板（必背）

> **面试官：你对 Modern C++ 怎么理解？**
>
> **答**：Modern C++（C++11 起）核心是 **3 件事**：
>
> ① **RAII + 智能指针** —— 资源生命周期绑定对象，`unique_ptr`（独占）/ `shared_ptr`（共享，但慎用）/ `weak_ptr`（破循环引用）；**裸 new/delete 在现代 C++ 应该消失**；
>
> ② **Move 语义** —— 通过右值引用（`T&&`）让大对象返回 / 容器移入移出从 O(n) 变 O(1)；`std::move` 只是类型转换，`std::forward` 用于完美转发；遵循 **Rule of Zero**（用 RAII 成员让编译器自动处理）；
>
> ③ **泛型与函数式** —— Lambda + STL 算法 + C++20 Ranges 让代码声明式、可组合。
>
> **C++20 关键演进**：① **Concepts** 替代晦涩 SFINAE；② **Coroutines** 关键字（生态配合 cppcoro / Asio）；③ **Modules** 编译速度 5-10×（生态尚未成熟）；④ **Ranges** 函数式管道；⑤ **std::format** 类型安全格式化。
>
> **C++23 必懂**：**std::expected** 错误处理革命（零开销 + 强制处理）+ `std::print`。
>
> **2026 视角**：**Rust 在新项目大幅替代 C++**——同样性能 + 编译期内存安全；但**游戏 / 高频交易 / 嵌入式 / 大型存量 codebase 仍是 C++ 主场**。
>
> **必踩坑**：① shared_ptr 循环引用（用 weak_ptr）；② lambda 按引用捕获悬挂；③ move 后用源对象 UB；④ 不写 Rule of Five 的浅拷贝崩。

---

## 看到什么就先想到这类

- **"new / delete"** → 用 unique_ptr / make_unique 替代
- **"循环引用泄漏"** → weak_ptr
- **"大对象返回慢"** → Move 语义（NRVO 也能自动）
- **"模板编译错误一屏"** → C++20 Concepts
- **"异步代码回调地狱"** → C++20 Coroutines
- **"头文件编译慢"** → C++20 Modules
- **"格式化字符串安全"** → std::format / std::print
- **"错误处理不想用异常"** → std::expected
- **"原子操作"** → std::atomic + memory_order
- **"线程忘记 join"** → std::jthread
- **"STL 算法管道"** → C++20 Ranges
- **"emplace_back vs push_back"** → emplace 少一次构造
- **"unordered_map 还是 map"** → unordered 默认（除非需有序）
- **"C++ vs Rust"** → 新项目 Rust 安全更好；存量 / 极致性能仍 C++
