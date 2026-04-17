---
title: 编程语言
---

# 编程语言

本章聚焦 Java 面试核心知识体系，从语言基础到 JVM 底层，从并发编程到现代特性，系统覆盖 Java 岗位面试高频考点。

## 怎么使用这一章

1. 先看 Java 基础，建立 JVM 内存、GC、HashMap、锁机制的基本认知。
2. 再看并发编程和集合框架，这是中高级面试的重点。
3. 然后看 JVM 深入，理解类加载、JMM、调优等底层机制。
4. 最后看 Java 新特性，了解现代 Java 的演进方向。

## 分类地图

| 主题 | 概念 | 核心知识点 |
|------|------|------|
| [Java 基础](./java-fundamentals) | JVM 内存结构、GC、核心数据结构与锁 | JVM 分区、GC 算法与收集器、HashMap 底层、synchronized vs ReentrantLock、volatile |
| [Java 并发编程](./java-concurrency) | 多线程编程的工具与机制 | 线程池、AQS、CAS、ThreadLocal、并发容器、CompletableFuture |
| [Java 集合框架](./java-collections) | 集合体系与线程安全容器 | ArrayList vs LinkedList、ConcurrentHashMap、fail-fast/fail-safe |
| [JVM 深入](./jvm-internals) | JVM 底层机制与调优 | 类加载与双亲委派、JMM 与 happens-before、JIT 编译、JVM 调优与 OOM 排查 |
| [Java 新特性](./java-modern-features) | Java 8 到 21 的重要演进 | Lambda/Stream/Optional、Record/Sealed Class、虚拟线程、模式匹配 |

## 建议顺序

1. 先看 [Java 基础](./java-fundamentals)，打牢 JVM 和核心 API 的底座。
2. 再看 [Java 并发编程](./java-concurrency) 和 [Java 集合框架](./java-collections)，中高级面试必考。
3. 然后看 [JVM 深入](./jvm-internals)，补全类加载、内存模型和调优能力。
4. 最后看 [Java 新特性](./java-modern-features)，展示对现代 Java 的了解。
