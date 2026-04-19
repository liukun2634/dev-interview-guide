---
title: 最短路
---

# 最短路

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
最短路算法的选择取决于边权：**无权图用 BFS**，**非负权图用 Dijkstra**，有负权边才考虑 Bellman-Ford。面试中 90% 考的是 Dijkstra（优先队列版）。
:::

## 识别信号

**看到这些，想到最短路：**

- "从 A 到 B 的最短/最快/最便宜路径"
- "所有节点都能接收到信号的最短时间"（= 单源最短路的最大值）
- "网格中从左上到右下的最小代价"（边权 = 两格差值/格子权重）
- "图中两点之间的最少中转次数"

**反例——这些不需要最短路算法：**

| 场景 | 为什么不用最短路 | 用什么 |
|------|------|------|
| 无权图，求最少步数 | 边权均为 1，BFS 天然按层扩展更简单 | BFS |
| 无环图（DAG）求最短路 | 有拓扑序，可 DP，O(V+E) 优于 Dijkstra | 拓扑排序 + DP |
| 求最短路径条数 | 不是权重最优问题，而是计数问题 | BFS/DFS + 计数 |

---

## 通用思考框架

### 第一步：判断边权类型

这是选算法的核心依据。

| 边权情况 | 算法 | 时间复杂度 | 选择理由 |
|------|------|------|------|
| 无权（或全为 1） | BFS | O(V + E) | 队列天然保证"按层扩展"，最先到达即最短 |
| 非负权 | Dijkstra（优先队列） | O((V + E) log V) | 贪心：每次取当前最近节点，非负权保证不会被后续边"变短" |
| 含负权边 | Bellman-Ford | O(V × E) | 无贪心假设，暴力松弛 V-1 轮，保证全局收敛 |
| 全源最短路 | Floyd | O(V³) | 动态规划枚举中间节点，适合节点少（V ≤ 200）的场景 |

**选 Dijkstra 而非 BFS 的判断标准**：只要边权不全相同，就需要 Dijkstra。边权全为 1 时 BFS 和 Dijkstra 等价，但 BFS 代码更简单。

### 第二步：确认是否有额外约束

额外约束会改变算法或实现方式，必须在动手前确认。

**约束 1：限制步数 / 中转次数**

- 典型题：LC787（最多 K 次中转）
- 标准 Dijkstra 不行：它只记录最短距离，不记录用了几步。同一节点可能在不同步数下被访问，贪心会错误地跳过"步数小但距离稍大"的路径。
- 正确做法：**Bellman-Ford，只做 K+1 轮松弛**；或 BFS 按步数分层。

**约束 2：最小化最大值 / 最大化最小值**

- 典型题：LC1631（最小体力消耗）、LC778（水位上升游泳）
- 这类题的"边权"不是累加而是取 max/min，可以直接改造 Dijkstra（dist 表示路径上的最大/最小值）。
- 也可以二分答案 + BFS/Dijkstra 验证可行性。

**约束 3：负权环**

- 含负权环时最短路无意义（可以无限绕圈变短）。
- **Bellman-Ford 能检测**：如果第 V 轮（本应收敛）仍有边被松弛，说明存在负权环。
- **Dijkstra 无法处理负权边**，更不能检测负权环。

### 第三步：Dijkstra 的实现要点（面试重点）

Dijkstra 是面试最高频的最短路算法，必须能默写并解释每一行。

**核心数据结构：**
- `dist[]`：记录源点到每个节点的当前最短距离，初始化为 `Integer.MAX_VALUE`。
- 优先队列（小根堆）：存储 `{距离, 节点}`，每次取出距离最小的节点处理。

**关键实现细节：**

1. **`if (d > dist[u]) continue`——为什么必须有这行？**
   同一个节点可能被多次加入优先队列（每次发现更短路径就加一次）。当我们从队列取出 `(d, u)` 时，如果 `d > dist[u]`，说明在此条目入队后已经找到了更短的路径，当前条目是"过时条目"，直接跳过。**没有这行不影响正确性，但时间复杂度会退化**（每个节点的每个旧条目都会被处理）。

2. **不需要 visited 数组——为什么？**
   `if (d > dist[u]) continue` 的效果和 visited 数组等价：一个节点的最优距离确定后，后续弹出的同节点条目都会因 `d > dist[u]` 被跳过，不会重复处理。

3. **为什么 Dijkstra 不能处理负权边？**
   Dijkstra 的贪心假设是：从优先队列弹出节点 u 时，`dist[u]` 已经是最终最短距离。这成立的前提是：所有边权非负，所以之后的路径只会更长，不可能让 `dist[u]` 变小。负权边打破了这个假设——弹出 u 后，仍可能通过某条负权边找到更短路径，导致已"确定"的距离是错的。

**Dijkstra 模板（优先队列版）：**

```java
public int[] dijkstra(List<List<int[]>> graph, int src, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // 小根堆，{距离, 节点}
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, src});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];

        // 跳过过时条目：此条目入队后已找到更短路径
        if (d > dist[u]) continue;

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

### 第四步：Bellman-Ford 的实现要点

Bellman-Ford 不依赖贪心，通过反复松弛所有边来求最短路。

**核心原理：** 最短路最多经过 V-1 条边（无环），因此松弛 V-1 轮必然收敛。每轮对所有边做一次"如果通过这条边能让终点距离变短，就更新"。

**带步数限制（K 次中转 = K+1 条边）的关键：使用 temp 数组**

```java
// 只松弛 K+1 轮（K 次中转）
for (int i = 0; i <= k; i++) {
    int[] temp = dist.clone();  // 关键！基于上一轮的结果松弛
    for (int[] edge : edges) {
        int from = edge[0], to = edge[1], w = edge[2];
        if (dist[from] != Integer.MAX_VALUE && dist[from] + w < temp[to]) {
            temp[to] = dist[from] + w;
        }
    }
    dist = temp;
}
```

**为什么必须用 `temp` 而不是直接更新 `dist`？**
如果直接更新 `dist`，一轮松弛中可能用到"本轮刚更新的距离"继续松弛，相当于一轮走了多步，违反了"每轮最多多走一条边"的约束，会导致答案错误（步数超限）。

**检测负权环：** 完成 V-1 轮后，再做第 V 轮。若仍有边被松弛，说明存在负权环。

---

## 典型例题：网络延迟时间（LeetCode 743）

[题目链接](https://leetcode.cn/problems/network-delay-time/)

### 1. 识别

有 n 个节点，有向边 `times[i] = [u, v, w]`，从节点 k 发出信号，求所有节点都收到信号的最短时间。

- "所有节点都收到" = 从 k 到每个节点的最短路都被走完，答案是 **单源最短路的最大值**。
- 边有权重（耗时），且均为正数 → **Dijkstra**。

### 2. 边权分析

- 权重为正整数，无负权边，无步数限制。
- 标准 Dijkstra 完全适用，无需任何改造。

### 3. 实现思路

1. 建邻接表（有向图）。
2. 从 k 出发跑 Dijkstra，得到 `dist[]`。
3. 答案 = `max(dist[1..n])`；若有节点距离仍为 INF，返回 -1。

### 4. 完整代码

```java
public int networkDelayTime(int[][] times, int n, int k) {
    // 建邻接表，节点编号从 1 开始
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
        if (d > dist[u]) continue;  // 跳过过时条目

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
        if (dist[i] == Integer.MAX_VALUE) return -1;  // 有节点不可达
        ans = Math.max(ans, dist[i]);
    }
    return ans;
}
```

### 5. 复杂度分析

- **时间**：O((V + E) log V)，V = n，E = times.length
- **空间**：O(V + E)，邻接表 + 优先队列

---

## 延伸题目

| 题号 | 题名 | 难度 | 关键差异 | 一句话提示 |
|------|------|------|------|------|
| [787](https://leetcode.cn/problems/cheapest-flights-within-k-stops/) | K 站中转内最便宜的航班 | 中等 | 限制步数，Dijkstra 状态不够用 | Bellman-Ford 松弛 K+1 轮，用 temp 数组防止同轮多跳 |
| [1631](https://leetcode.cn/problems/path-with-minimum-effort/) | 最小体力消耗路径 | 中等 | 边权是两格差的绝对值，dist 表示路径上的最大差值 | Dijkstra 变形，dist 含义改为路径最大边权 |
| [778](https://leetcode.cn/problems/swim-in-rising-water/) | 水位上升的泳池中游泳 | 困难 | 同上，最小化路径最大值 | Dijkstra 或二分 + BFS |
| [127](https://leetcode.cn/problems/word-ladder/) | 单词接龙 | 困难 | 无权图，每次变一个字母 = 一步 | 无权图最短路，BFS 即可，无需 Dijkstra |
| [1514](https://leetcode.cn/problems/path-with-maximum-probability/) | 概率最大的路径 | 中等 | 最大化概率（乘法），非最小化（加法） | Dijkstra 改大根堆，松弛条件改为概率乘积更大 |

---

## 常见陷阱与调试

**陷阱 1：整数溢出**

`dist[u] + w` 中，`dist[u]` 初始为 `Integer.MAX_VALUE` 时加任何正数都会溢出。

```java
// 错误：溢出导致负数，条件永远成立
if (dist[u] + w < dist[v]) { ... }

// 正确：先判断是否为 INF
if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) { ... }
```

Dijkstra 中由于只从已松弛的节点（`dist[u] < INF`）出发，通常不会触发此问题，但 Bellman-Ford 中必须加这个判断。

**陷阱 2：忘写 `if (d > dist[u]) continue`**

不写不影响正确性，但每个过时条目都会被完整处理，时间复杂度从 O((V+E)logV) 退化至 O(E logE)，稠密图下超时。

**陷阱 3：对含负权边的图使用 Dijkstra**

Dijkstra 会给出错误答案，不会报错，很难排查。碰到负权边一定要改用 Bellman-Ford。

**陷阱 4：Bellman-Ford 不使用 temp 数组（有步数限制时）**

不用 temp，一轮内的更新会被同轮后续边使用，导致实际步数超过限制，但没有任何报错，只是答案错误。

---

## 面试常问 & 怎么答

### Dijkstra 为什么不能处理负权边？

Dijkstra 基于贪心：每次从优先队列取出距离最小的节点 u，就认为 `dist[u]` 已经是最终最短距离，不再更新。这成立的前提是所有边权非负——如果某条边权为负，u 之后的路径可能让 `dist[u]` 进一步减小，"最终距离"的判断就是错的，贪心失效。

### Dijkstra 的 `if (d > dist[u]) continue` 是什么作用？

优先队列中可能有同一个节点的多个过时条目（每次找到更短路径就往队列里加一条，旧条目仍在）。弹出 `(d, u)` 时若 `d > dist[u]`，说明之后已经处理过 u 的更优路径，这个条目过时了，直接跳过。不加也能得到正确结果，但会做冗余的松弛，时间上变慢。

### BFS 和 Dijkstra 的关系？

BFS 是 Dijkstra 在所有边权为 1（或无权图）时的特例。BFS 用普通队列（FIFO），天然保证"先入队的节点距离更近"；Dijkstra 用优先队列（按距离排序），处理边权不等的情况。能用 BFS 时不要用 Dijkstra，代码更简单、常数更小。

---

## 看到什么就先想到这类

- "无权图最短路 / 最少步数" → BFS
- "有权图最短路（非负）" → Dijkstra
- "限制步数 / 中转次数的最短路" → Bellman-Ford / BFS 按层
- "所有点对最短路" → Floyd
- "最小体力 / 最小代价路径（最小化最大边权）" → Dijkstra 变形
- "图中有负权边" → Bellman-Ford
