---
title: 最短路
---

# 最短路

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
最短路问题的关键不是记算法名字，而是先识别图的边权特征：无权图优先 BFS，非负权图优先 Dijkstra，存在负权边时再考虑 Bellman-Ford 一类方法。
:::

## 常见分类

| 图类型 | 常见方法 |
|------|------|
| 无权图 | BFS |
| 非负权图 | Dijkstra |
| 有负权边 | Bellman-Ford / SPFA |

## 学习顺序

1. 先掌握 BFS 求最少步数。
2. 再理解优先队列版 Dijkstra。
3. 最后区分什么时候会被负权边破坏。

## 高频题型

- 网络延迟时间。
- 最小体力消耗路径。
- 单词接龙。