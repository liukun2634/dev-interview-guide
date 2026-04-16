---
title: BFS 与 DFS
---

# BFS 与 DFS

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
BFS 和 DFS 都是在遍历状态空间。DFS 更适合深入搜索和路径枚举，BFS 更适合按层扩展和最短步数问题。
:::

## DFS 适合什么

- 连通块搜索。
- 路径枚举。
- 回溯类问题。

## BFS 适合什么

- 无权图最短路。
- 最少步数。
- 层序遍历。

## 选择标准

| 场景 | 优先方案 |
|------|------|
| 需要最短步数 | BFS |
| 需要枚举所有方案 | DFS |
| 需要逐层扩展 | BFS |
| 需要递归描述结构 | DFS |