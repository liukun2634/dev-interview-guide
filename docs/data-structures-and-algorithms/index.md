---
title: 数据结构与算法
---

# 数据结构与算法

这一章按照更正规的学习路径重构为“总览 -> 一级分类 -> 二级专题”的架构。目标不是把题目简单堆起来，而是让你按知识依赖关系逐层推进：先学分析方法，再学经典数据结构，最后进入算法思想与进阶技巧。

## 架构原则

| 原则 | 说明 |
|------|------|------|
| 先方法后题型 | 先建立复杂度、递归、状态设计等分析方式，再学具体专题 |
| 先结构后思想 | 先掌握数组、链表、树、图等结构，再进入 DP、贪心、回溯 |
| 先基础后进阶 | 每个一级分类先有导览页，再进入具体二级专题 |

## 一级分类地图

| 一级分类 | 学习目标 | 当前二级专题 |
|------|------|------|
| [基础方法](./foundations/) | 建立复杂度、递归、递推意识 | [复杂度与递归](./foundations/complexity-recursion) |
| [数组与字符串](./arrays/) | 掌握线性扫描、区间维护、基础技巧 | [数组与字符串基础](./arrays/array-basics)、[双指针](./arrays/two-pointers)、[滑动窗口](./arrays/sliding-window)、[前缀和与差分](./arrays/prefix-sum-difference) |
| [链表](./linked-list/) | 理解指针操作、原地重连、快慢指针 | [链表基础](./linked-list/linked-list-basics) |
| [栈与队列](./stack-queue/) | 理解先进后出、先进先出与单调结构前置知识 | [栈与队列基础](./stack-queue/stack-queue-basics) |
| [哈希](./hash/) | 掌握映射、计数、去重、空间换时间 | [哈希表](./hash-table) |
| [树与堆](./tree/) | 掌握递归、遍历、层序、优先级结构 | [二叉树](./binary-tree)、[二叉搜索树](./tree/binary-search-tree)、[堆与优先队列](./tree/heap-priority-queue)、[Trie 字典树](./tree/trie)、[并查集](./tree/union-find) |
| [图与搜索](./graph-search/) | 建立图建模、二分、回溯搜索框架 | [图基础](./graph-search/graph-basics)、[BFS 与 DFS](./graph-search/bfs-dfs)、[二分查找](./graph-search/binary-search)、[拓扑排序](./graph-search/topological-sort)、[最短路](./graph-search/shortest-path)、[回溯](./graph-search/backtracking) |
| [动态规划](./dynamic-programming/) | 掌握状态定义、转移、优化套路 | [线性 DP](./dynamic-programming/linear-dp)、[区间 DP](./dynamic-programming/interval-dp)、[树形 DP](./dynamic-programming/tree-dp)、[状态压缩 DP](./dynamic-programming/state-compression-dp) |
| [贪心与技巧](./greedy-techniques/) | 建立局部最优、位运算、构造类问题意识 | [贪心算法](./greedy-techniques/greedy)、[位运算技巧](./greedy-techniques/bitwise) |

## 推荐学习顺序

1. 从 [基础方法](./foundations/) 开始，先把复杂度和递归想清楚。
2. 按顺序学习 [数组与字符串](./arrays/)、[链表](./linked-list/)、[栈与队列](./stack-queue/)、[哈希](./hash/)，建立线性结构基础。
3. 再学习 [树与堆](./tree/) 和 [图与搜索](./graph-search/)，训练递归、遍历和搜索建模。
4. 最后系统进入 [动态规划](./dynamic-programming/) 与 [贪心与技巧](./greedy-techniques/)，形成算法思想层面的完整框架。

## 为什么这样分

### 基础方法放在最前面

很多人学算法的误区，是一上来就刷题，不先建立分析语言。复杂度、递归、递推这些内容虽然抽象，但它们决定了你后续能不能看懂树、搜索、DP。

### 数据结构与算法思想分层

数组、链表、栈、队列、哈希、树、堆、图属于“结构层”；二分、回溯、动态规划、贪心属于“方法层”。这样分层后，学习顺序更稳定，扩展专题也更自然。

### 导览页先于专题页

每个一级分类都先有导览页，用来说明这类问题的能力目标、典型套路和后续专题。这样结构上更像一门系统课程，而不是零散文章集合。
