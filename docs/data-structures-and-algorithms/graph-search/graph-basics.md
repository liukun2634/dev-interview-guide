---
title: 图建模与遍历
---

# 图建模与遍历

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
图题最先要做的不是写 DFS/BFS，而是先把问题抽象成“节点是什么、边是什么、是否有方向、是否有权重”。建模对了，遍历才有意义。
:::

## 图的常见表示

- 邻接表：最常见，适合稀疏图。
- 邻接矩阵：适合点少、边多的场景。

## 基本遍历

### DFS

适合：连通性判断、路径枚举、拓扑型递归搜索。

### BFS

适合：最短步数、按层扩展、状态转换最短路。

## 典型题型

| 题型 | 代表题 |
|------|------|
| 岛屿问题 | LeetCode 200 |
| 课程表 | LeetCode 207 |
| 最短步数 | 单词接龙、开锁问题 |