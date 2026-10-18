---
title: 最短路
---

# 最短路

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
先判断图结构、边权和额外约束：等权图用 BFS，0/1 权图可用 0-1 BFS，一般非负权图用 Dijkstra；含负权时考虑 Bellman-Ford，DAG 则可按拓扑序递推。不要只记算法名，要能解释为什么当前取出的状态可以确定。
:::

## 识别信号

**看到这些，想到最短路：**

- "从 A 到 B 的最短/最快/最便宜路径"
- "所有节点都能接收到信号的最短时间"（= 单源最短路的最大值）
- "网格中从左上到右下的最小代价"（边权 = 两格差值/格子权重）
- "图中两点之间的最少中转次数"

**容易混淆的变体：**

| 场景 | 特点 | 用什么 |
|------|------|------|
| 无权图，求最少步数 | 边权均为 1，BFS 天然按层扩展更简单 | BFS |
| 无环图（DAG）求最短路 | 有拓扑序，可 DP，O(V+E) 优于 Dijkstra | 拓扑排序 + DP |
| 求最短路径条数 | 仍需先识别哪些转移保持最短距离，不能枚举任意可达路径计数 | 等权图 BFS + 计数；严格正权图 Dijkstra + 计数 |

---

## 通用思考框架

### 第一步：判断边权类型

这是选算法的核心依据。

| 边权情况 | 算法 | 时间复杂度 | 选择理由 |
|------|------|------|------|
| 无权（或全为 1） | BFS | O(V + E) | 队列天然保证"按层扩展"，最先到达即最短 |
| 边权仅为 0 或 1 | 0-1 BFS | O(V + E) | 0 权边进队首，1 权边进队尾 |
| 非负权 | Dijkstra（优先队列） | O((V + E) log V) | 贪心：每次取当前最近节点，非负权保证不会被后续边"变短" |
| 含负权边 | Bellman-Ford | O(V × E) | 无源点可达负环时 V-1 轮可收敛，额外一轮检测可达负环 |
| 全源最短路 | Floyd | O(V³) | 动态规划枚举中间节点，适合节点少（V ≤ 200）的场景 |

边权不全相同不代表必须 Dijkstra：0/1 权图、DAG、含负权图都有各自更合适的处理方式。等权且权值为正时，最少边数与最小代价等价；BFS 即可。

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

- 只有源点能到达负环、且负环还能到达目标时，该目标的最短路才会无下界。与查询无关的负环不影响它。
- **Bellman-Ford 能检测**：如果第 V 轮（本应收敛）仍有边被松弛，说明存在负权环。
- **Dijkstra 无法处理负权边**，更不能检测负权环。

### 第三步：Dijkstra 的实现要点（面试重点）

Dijkstra 是面试最高频的最短路算法，必须能默写并解释每一行。

**核心数据结构：**
- `dist[]`：记录源点到每个节点的当前最短距离，通用模板用 `long`，`Long.MAX_VALUE` 表示不可达。
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
public long[] dijkstra(List<List<int[]>> graph, int source, int size) {
    return dijkstra(graph, source, new int[size]);
}

public long[] dijkstra(List<List<int[]>> graph, int source, int[] parent) {
    if (parent.length != graph.size()) throw new IllegalArgumentException("size mismatch");
    long[] distance = new long[graph.size()];
    Arrays.fill(distance, Long.MAX_VALUE);
    Arrays.fill(parent, -1);
    distance[source] = 0;
    PriorityQueue<long[]> queue = new PriorityQueue<>(Comparator.comparingLong(state -> state[0]));
    queue.offer(new long[]{0, source});
    while (!queue.isEmpty()) {
        long[] state = queue.poll();
        int vertex = (int) state[1];
        if (state[0] != distance[vertex]) continue;
        for (int[] edge : graph.get(vertex)) {
            int next = edge[0], weight = edge[1];
            if (weight < 0) throw new IllegalArgumentException("negative edge");
            long candidate = distance[vertex] + weight;
            if (candidate < distance[next]) {
                distance[next] = candidate;
                parent[next] = vertex;
                queue.offer(new long[]{candidate, next});
            }
        }
    }
    return distance;
}
```

邻接表的边为 `{目标节点, 非负 int 权重}`，节点编号在 `[0,graph.size())`。使用 `long` 是因为有限路径长度相加也可能溢出 `int`，与是否从 INF 出发无关。

**贪心证明**：设刚取出的非过时节点为 u，若还存在一条更短路径，沿该路径找到第一个未确定的节点 x。它的前驱已确定并松弛过 x；非负后缀保证 `dist[x]` 不大于那条更短路径的总长，于是堆本应先取 x 而不是 u，矛盾。负边会破坏这一步不等式。

### 恢复一条最短路径

调用带 `parent` 参数的重载。每次距离严格变小时记录前驱；从目标倒着走到 `-1`，再反转即可：

```java
public List<Integer> restorePath(int[] parent, long[] distance, int target) {
    List<Integer> path = new ArrayList<>();
    if (distance[target] == Long.MAX_VALUE) return path;
    for (int current = target; current != -1; current = parent[current]) {
        path.add(current);
    }
    Collections.reverse(path);
    return path;
}
```

参数必须来自同一次 Dijkstra，目标编号合法。源点到自己的路径是 `[source]`，不可达返回空列表。相等距离不改前驱，尤其不要在零权环上互相改写前驱；若要计数所有最短路径，应单独设计 `ways` 状态。含零权环时还必须先明确计数的是可重复节点的 walk 还是简单路径，前者可能有无穷多条。

### 0-1 BFS：用双端队列代替堆

当前最小距离为 d 时，0 权边产生距离 d 的候选，放队首；1 权边产生 d+1 的候选，放队尾。这样保持按距离处理的次序，不需要通用堆排序。首次入队并不代表最终最短，仍然按松弛更新距离。

```java
public int[] zeroOneBfs(List<List<int[]>> graph, int source) {
    int[] distance = new int[graph.size()];
    Arrays.fill(distance, Integer.MAX_VALUE);
    distance[source] = 0;
    Deque<int[]> queue = new ArrayDeque<>();
    queue.addFirst(new int[]{0, source});
    while (!queue.isEmpty()) {
        int[] state = queue.removeFirst();
        int vertex = state[1];
        if (state[0] != distance[vertex]) continue;
        for (int[] edge : graph.get(vertex)) {
            int next = edge[0], weight = edge[1];
            if (weight != 0 && weight != 1) throw new IllegalArgumentException("expected 0/1 weight");
            int candidate = distance[vertex] + weight;
            if (candidate < distance[next]) {
                distance[next] = candidate;
                int[] entry = {candidate, next};
                if (weight == 0) queue.addFirst(entry);
                else queue.addLast(entry);
            }
        }
    }
    return distance;
}
```

对 `S->A(1), S->B(0), B->A(0)`：普通按边数 BFS 会先发现 S->A，但最小代价是 S->B->A 的 0。0-1 BFS 处理 S 后队列为 `[(0,B),(1,A)]`，处理 B 后变为 `[(0,A),(1,A)]`，最后跳过 A 的旧条目。Dijkstra 也能得到 0，只是使用堆安排相同的距离优先级。

非过时节点按最短距离处理，每条出边只需扫描一次，产生的条目总数 O(E)，因此时间 O(V+E)，上述保留旧条目的实现额外空间 O(V+E)。可用它与 Dijkstra 在随机 0/1 图上对拍。

### 第四步：Bellman-Ford 的实现要点

Bellman-Ford 不依赖贪心，通过反复松弛所有边来求最短路。

**核心原理：** 没有相关负环时，总能选一条至多 V-1 条边的最短简单路径，因此 V-1 轮足够。每轮对所有边尝试松弛；步数有限制时则必须明确每一轮只多允许一条边。

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

**检测负权环：** 从单源出发完成 V-1 轮后，第 V 轮仍可松弛说明存在源点可达的负环。若要检测整张图，可以加一个到所有节点均有零权边的超级源点。

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

    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(state -> state[0]));
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

LC743 的节点与权重上界使路径长度能放入 `int`；通用题目不应直接照搬这个数值假设，应使用前面的 `long` 模板。

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

Dijkstra 只从有限距离出发，避免的是“INF 加法”；两个有限的 int 相加仍可能溢出，例如 `2_000_000_000 + 2_000_000_000`。通用实现使用 long 距离，Bellman-Ford 还必须跳过不可达状态。仅判断不等于 INF 不能解决有限值溢出。

**陷阱 2：忘写 `if (d > dist[u]) continue`**

在非负权、严格松弛的前提下，不跳过旧条目仍能得到正确距离，但会反复扫描出边。冗余成本取决于每个节点的旧条目数与出度，不能只写成 O(E log E)。即使跳过旧条目，懒删除堆也可能有 O(E) 条记录；简单图常写 O((V+E)log V)，允许大量平行边时用 O(V+E log(E+1)) 更精确。

**陷阱 3：对含负权边的图使用 Dijkstra**

负权边使 Dijkstra 的一次确定证明失效。某些允许反复入队的实现可能在无负环时仍算对，但不再有原来的复杂度保证，也不能安全提前结束。不要以少量样例通过为依据继续套用，改用适合负权的算法。

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
- "边权只有 0 和 1" → 0-1 BFS
- "有权图最短路（非负）" → Dijkstra
- "限制步数 / 中转次数的最短路" → Bellman-Ford / BFS 按层
- "所有点对最短路" → Floyd
- "最小体力 / 最小代价路径（最小化最大边权）" → Dijkstra 变形
- "图中有负权边" → Bellman-Ford
