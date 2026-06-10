---
title: 数据结构与算法
---

# 数据结构与算法

这一章按问题类型组织，但第一章会先从基础知识开始，把刷题前必须统一的流程、算法技巧、复杂度直觉和 Java 落地能力先讲清楚。

## 怎么使用这一章

1. 先进入某一类问题页面，看清它解决什么问题。
2. 再看这一类的通用处理步骤，先建立判断框架。
3. 最后进入典型实例页，把做法和触发信号对应起来。

## 分类地图

| 类别 | 概念 | 怎么处理 | 典型实例 |
|------|------|------|------|
| [基础知识](./foundations/) | 刷题流程、算法技巧、复杂度直觉和 Java 落地能力是所有题型的共同底座 | 先建立做题顺序，再根据题目特征和数据范围判断方法与复杂度 | [一般流程](./foundations/problem-solving-workflow)、[算法技巧](./foundations/algorithm-patterns)、[Java 环境配置](./foundations/java-problem-solving-basics) |
| [数组与字符串](./arrays/) | 处理顺序扫描、连续区间、字符统计问题 | 先判断是单点扫描、区间维护还是区间统计 | [线性扫描与区间处理](./arrays/array-basics)、[双指针](./arrays/two-pointers)、[滑动窗口](./arrays/sliding-window) |
| [链表](./linked-list/) | 处理节点重连、反转、快慢指针问题 | 先画指针关系，再决定删除、插入还是反转 | [链表题处理框架](./linked-list/linked-list-basics) |
| [栈与队列](./stack-queue/) | 处理最近元素、配对关系、层次推进问题 | 先判断需要的是回退顺序还是推进顺序 | [顺序结构处理框架](./stack-queue/stack-queue-basics) |
| [哈希](./hash/) | 处理去重、计数、映射、前缀状态匹配问题 | 先设计 key 和 value，再判断是否值得空间换时间 | [哈希表](./hash-table) |
| [树与堆](./tree/) | 处理层级关系、递归返回值、局部最值维护问题 | 先判断是遍历、递归返回值还是优先级维护 | [二叉树](./binary-tree)、[二叉搜索树](./tree/binary-search-tree)、[堆与优先队列](./tree/heap-priority-queue) |
| [图与搜索](./graph-search/) | 处理状态空间、路径搜索、依赖关系问题 | 先建模节点和边，再判断 BFS、DFS、二分或回溯 | [图建模与遍历](./graph-search/graph-basics)、[BFS 与 DFS](./graph-search/bfs-dfs)、[回溯](./graph-search/backtracking) |
| [动态规划](./dynamic-programming/) | 处理重叠子问题和最优子结构问题 | 先定义状态，再写转移、初始化和遍历顺序 | [线性 DP](./dynamic-programming/linear-dp)、[区间 DP](./dynamic-programming/interval-dp)、[典型动态规划问题](./dynamic-programming/classic-problems) |
| [贪心与技巧](./greedy-techniques/) | 处理局部最优、按位表达、结构压缩问题 | 先判断能否证明局部最优推出全局最优 | [贪心算法](./greedy-techniques/greedy)、[位运算技巧](./greedy-techniques/bitwise) |

## 每一类页面都看什么

- `概念`：回答这一类问题到底在处理什么。
- `怎么处理`：给出最短可复用的判断步骤和处理框架。
- `典型实例`：给出适合先看的专题或代表题型，用来落地。

## 建议顺序

1. 先看 [基础知识](./foundations/)，把一般流程、算法技巧、Java 环境和 AI 时代刷题的基本判断先讲清楚。
2. 再看 [数组与字符串](./arrays/)、[链表](./linked-list/)、[栈与队列](./stack-queue/)、[哈希](./hash/)，先把线性结构吃透。
3. 然后进入 [树与堆](./tree/) 和 [图与搜索](./graph-search/)，训练非线性建模和搜索。
4. 最后进入 [动态规划](./dynamic-programming/) 和 [贪心与技巧](./greedy-techniques/)，处理更抽象的方法题。
