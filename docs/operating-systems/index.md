---
title: 操作系统
---

# 操作系统

本章覆盖操作系统核心原理，按 **进程与并发 / 内存与存储 / I/O 与系统调用 / 虚拟化与容器** 四大板块组织，系统讲解后端面试必考知识点。

## 怎么使用这一章

1. 先看进程与线程，建立对并发执行、上下文切换、IPC 的基本认知。
2. 再看同步与锁原理，理解 CAS / futex / RCU——这是并发面试的底层基石。
3. 然后看内存管理与 I/O 模型，掌握虚拟内存和 select/poll/epoll、零拷贝——高频考点。
4. 最后补齐系统调用、文件系统与容器隔离，形成完整体系。

## 分类地图

### 进程与并发

| 主题 | 概念 | 核心知识点 |
|------|------|------|
| [进程与线程](./process-and-thread) | 操作系统的执行单元与并发模型 | 进程状态、进程 vs 线程、上下文切换、IPC、死锁 |
| [CPU 调度](./cpu-scheduling) | 进程调度算法与 Linux 实现 | FCFS/SJF/RR/MLFQ、Linux CFS/EEVDF、优先级反转 |
| [🔥 同步与锁原理](./synchronization) | 锁的底层实现与无锁编程 | CAS、内存屏障、自旋锁、futex、读写锁、RCU、信号量 |

### 内存与存储

| 主题 | 概念 | 核心知识点 |
|------|------|------|
| [内存管理](./memory-management) | 虚拟内存与物理内存的映射管理 | 虚拟内存、分页/分段、TLB、页面置换、mmap、malloc、NUMA、HugePage、OOM |
| [文件系统](./file-system) | 磁盘数据组织与文件管理 | inode、硬链接/软链接、文件描述符、磁盘调度、Page Cache |

### I/O 与系统调用

| 主题 | 概念 | 核心知识点 |
|------|------|------|
| [I/O 模型](./io-model) | 五种 I/O 模型与高性能网络编程 | 阻塞/非阻塞、select/poll/epoll、零拷贝、Reactor、io_uring、Netty |
| [🔥 系统调用与中断](./syscall-interrupt) | 用户态/内核态切换与中断机制 | Ring 0/3、syscall、vDSO、硬中断/软中断、上下半部、NAPI |

### 虚拟化与容器

| 主题 | 概念 | 核心知识点 |
|------|------|------|
| [🔥 容器隔离原理](./containers-and-isolation) | 容器的内核实现机制 | Namespace、cgroup v2、Capabilities、seccomp、OverlayFS |

## 建议顺序

1. 先看 [进程与线程](./process-and-thread)，打牢并发基础。
2. 再看 [同步与锁原理](./synchronization)，吃透 CAS / futex / RCU。
3. 然后看 [内存管理](./memory-management) 与 [I/O 模型](./io-model)，这是后端面试的高频考点。
4. 最后看 [系统调用与中断](./syscall-interrupt)、[文件系统](./file-system) 和 [容器隔离原理](./containers-and-isolation)，补全体系。
