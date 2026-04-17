---
title: 操作系统
---

# 操作系统

本章覆盖操作系统核心原理，从进程与线程到内存管理、I/O 模型、CPU 调度和文件系统，系统讲解后端面试必考知识点。

## 怎么使用这一章

1. 先看进程与线程，建立对并发执行、上下文切换、IPC 的基本认知。
2. 再看内存管理，理解虚拟内存、分页和页面置换。
3. 然后看 I/O 模型，掌握 select/poll/epoll 和零拷贝——这是高频面试题。
4. 最后看 CPU 调度和文件系统，补全操作系统知识体系。

## 分类地图

| 主题 | 概念 | 核心知识点 |
|------|------|------|
| [进程与线程](./process-and-thread) | 操作系统的执行单元与并发模型 | 进程状态、进程 vs 线程、上下文切换、IPC、死锁 |
| [内存管理](./memory-management) | 虚拟内存与物理内存的映射管理 | 虚拟内存、分页/分段、TLB、页面置换算法、mmap、malloc |
| [I/O 模型](./io-model) | 五种 I/O 模型与高性能网络编程 | 阻塞/非阻塞、select/poll/epoll、零拷贝、Reactor 模式 |
| [CPU 调度](./cpu-scheduling) | 进程调度算法与 Linux 实现 | FCFS/SJF/RR/MLFQ、Linux CFS、优先级反转 |
| [文件系统](./file-system) | 磁盘数据组织与文件管理 | inode、硬链接/软链接、文件描述符、磁盘调度、Page Cache |

## 建议顺序

1. 先看 [进程与线程](./process-and-thread)，打牢并发基础。
2. 再看 [内存管理](./memory-management)，理解虚拟内存和分页机制。
3. 然后看 [I/O 模型](./io-model)，这是后端面试的高频考点。
4. 最后看 [CPU 调度](./cpu-scheduling) 和 [文件系统](./file-system)，补全体系。
