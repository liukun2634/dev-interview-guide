---
title: 最短路
---

# 最短路

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
最短路算法的选择取决于边权：**无权图用 BFS**，**非负权图用 Dijkstra**，有负权边才考虑 Bellman-Ford。面试中 90% 考的是 Dijkstra（优先队列版）。
:::

## 核心思路

| 图类型 | 算法 | 时间复杂度 |
|------|------|------|
| 无权图 | BFS | O(V + E) |
| 非负权图 | Dijkstra（优先队列） | O((V + E) log V) |
| 有负权边 | Bellman-Ford | O(V × E) |
| 全源最短路 | Floyd | O(V³) |

**面试中重点掌握：** BFS（已在 BFS/DFS 页讲过）和 Dijkstra。

## Dijkstra 模板（优先队列版）

```java
public int[] dijkstra(List<List<int[]>> graph, int src, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // {距离, 节点}
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, src});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];

        if (d > dist[u]) continue;  // 已经找到更短路径，跳过

        for (int[] edge : graph.get(u)) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}
```

**要点：**
- `if (d > dist[u]) continue;` 是关键优化，跳过已过时的条目
- 不需要 visited 数组，靠距离比较实现相同效果
- 不能处理负权边（贪心假设"当前最小距离是最终距离"会被负权破坏）

## 例题 1：[网络延迟时间（LeetCode 743）](https://leetcode.cn/problems/network-delay-time/)

### 题目描述

有 `n` 个节点，给定有向边列表 `times[i] = [u, v, w]`（从 u 到 v 耗时 w）。从节点 `k` 发出信号，返回所有节点都接收到信号的最短时间，不可能则返回 -1。

### 思路分析

1. 从 k 出发求到所有点的最短路 → Dijkstra
2. 答案是所有最短距离的最大值
3. 如果有点不可达（距离仍为 INF），返回 -1

### 完整代码

```java
public int networkDelayTime(int[][] times, int n, int k) {
    List<List<int[]>> graph = new ArrayList<>();
    for (int i = 0; i <= n; i++) graph.add(new ArrayList<>());
    for (int[] t : times) {
        graph.get(t[0]).add(new int[]{t[1], t[2]});
    }

    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, k});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];
        if (d > dist[u]) continue;

        for (int[] edge : graph.get(u)) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }

    int ans = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        ans = Math.max(ans, dist[i]);
    }
    return ans;
}
```

### 复杂度分析

- **时间**：O((V + E) log V)
- **空间**：O(V + E)

## 例题 2：[K 站中转内最便宜的航班（LeetCode 787）](https://leetcode.cn/problems/cheapest-flights-within-k-stops/)

### 题目描述

有 `n` 个城市和若干航班 `flights[i] = [from, to, price]`。找到从 `src` 到 `dst` 最多经过 `k` 站中转的最便宜价格，不存在返回 -1。

### 思路分析

1. 带有"最多 K 步"限制的最短路，标准 Dijkstra 不能直接用
2. 用 BFS 按层（步数）扩展，或用 Bellman-Ford 只松弛 K+1 轮
3. Bellman-Ford 思路更简洁：每轮对所有边松弛一次，共 K+1 轮

### 完整代码

```java
public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // 最多 k 次中转 = 最多 k+1 条边
    for (int i = 0; i <= k; i++) {
        int[] temp = dist.clone();  // 用上一轮的距离松弛
        for (int[] f : flights) {
            int from = f[0], to = f[1], price = f[2];
            if (dist[from] != Integer.MAX_VALUE && dist[from] + price < temp[to]) {
                temp[to] = dist[from] + price;
            }
        }
        dist = temp;
    }

    return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
```

### 复杂度分析

- **时间**：O(k × E)，E 为航班数
- **空间**：O(n)

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [743](https://leetcode.cn/problems/network-delay-time/) | 网络延迟时间 | 中等 | Dijkstra 模板题 |
| [787](https://leetcode.cn/problems/cheapest-flights-within-k-stops/) | K 站中转内最便宜的航班 | 中等 | 限制步数的最短路，Bellman-Ford |
| [1631](https://leetcode.cn/problems/path-with-minimum-effort/) | 最小体力消耗路径 | 中等 | Dijkstra，权重是相邻格差的绝对值 |
| [778](https://leetcode.cn/problems/swim-in-rising-water/) | 水位上升的泳池中游泳 | 困难 | Dijkstra / 二分 + BFS |
| [127](https://leetcode.cn/problems/word-ladder/) | 单词接龙 | 困难 | 无权图 BFS 最短路 |
| [1514](https://leetcode.cn/problems/path-with-maximum-probability/) | 概率最大的路径 | 中等 | 改造 Dijkstra，最大概率而非最短距离 |

## 面试常问 & 怎么答

### Dijkstra 为什么不能处理负权边？

Dijkstra 基于贪心：每次取距离最小的未处理节点，认为它的最短距离已确定。但负权边可能让一个已确定的节点的距离变得更短，破坏贪心假设。

### Dijkstra 的 `if (d > dist[u]) continue` 是什么作用？

优先队列中可能有同一个节点的多个过时条目（距离更新后旧条目还在队列里）。这行跳过过时条目，避免重复处理。没有这行也能得到正确结果，但时间复杂度会退化。

### BFS 和 Dijkstra 的关系？

BFS 是 Dijkstra 在所有边权为 1 时的特例。BFS 用普通队列（FIFO），Dijkstra 用优先队列（按距离排序）。无权图用 BFS 更简单高效。

## 看到什么就先想到这类

- "无权图最短路/最少步数"→ BFS
- "有权图最短路（非负）"→ Dijkstra
- "限制步数/中转次数的最短路"→ Bellman-Ford / BFS 按层
- "所有点对最短路"→ Floyd
- "最小体力/最小代价路径"→ Dijkstra 变形
