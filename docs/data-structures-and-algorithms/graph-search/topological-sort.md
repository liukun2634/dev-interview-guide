---
title: 拓扑排序
---

# 拓扑排序

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
拓扑排序求有向无环图（DAG）中满足依赖关系的线性顺序。核心方法是 **BFS（Kahn 算法）**：维护入度数组，每次取入度为 0 的节点。如果最终处理的节点数 < 总节点数，说明有环。
:::

---

## 识别信号

**有这些特征时，优先考虑拓扑排序：**

- 题目出现"先修/先后顺序/依赖关系"等描述
- 问能否完成所有任务（即判断有向图是否有环）
- 问满足依赖关系的执行顺序（课程顺序、编译顺序、构建顺序）
- 从已知顺序反推字符/节点之间的关系（火星词典）

**反例——以下情况不需要拓扑排序：**

- 无向图的连通性问题 → 用 BFS/DFS 或 Union-Find
- 有向图的最短/最长路径（非依赖关系）→ Dijkstra / Bellman-Ford
- 仅判断图是否连通，没有依赖顺序需求 → DFS/BFS 遍历即可
- 题目约束是"无向"的，即使有先后描述 → 拓扑排序不适用

---

## 通用思考框架

### 第一步：确认是 DAG 上的依赖问题

- 关键词："先修"、"先后"、"依赖"、"能否完成"→ 考虑拓扑排序
- **必须是有向图**。无向图没有拓扑序，不要尝试拓扑排序
- **必须检测环**。有环的有向图（不是 DAG）不存在拓扑序，要作为失败情况处理

### 第二步：建图并计算入度

- **边的方向要想清楚**：题目说"b 是 a 的先修课"→ 边是 `b → a`（b 先，a 后）
- **常见错误**：把边方向搞反，建成 `a → b`，导致入度计算错误，最终顺序完全反
- 建图的同时统计每个节点的 `indegree[]`，不要分两次遍历

```java
for (int[] pre : prerequisites) {
    // pre[1] 是先修课，pre[0] 是后续课
    graph.get(pre[1]).add(pre[0]);  // 边：先修 → 后续
    indegree[pre[0]]++;             // 后续课入度加一
}
```

### 第三步：选择算法

**BFS Kahn 算法（面试推荐）**

- 直观：每次取"没有前置依赖"的节点（入度为 0）
- 天然检测环：处理完后 `count < n` 就说明有环，无需额外代码
- 代码结构清晰，面试中不容易写错

**DFS 后序拓扑排序**

- 原理：后序遍历的逆序即拓扑序
- 需要三色标记（未访问/访问中/已完成）才能正确检测环，代码更复杂
- 除非题目有特殊需要，面试中优先选 BFS Kahn

**Kahn 算法模板：**

```java
public List<Integer> topologicalSort(int numNodes, int[][] edges) {
    // 建图 + 统计入度
    List<List<Integer>> graph = new ArrayList<>();
    int[] indegree = new int[numNodes];
    for (int i = 0; i < numNodes; i++) graph.add(new ArrayList<>());
    for (int[] edge : edges) {
        graph.get(edge[0]).add(edge[1]);
        indegree[edge[1]]++;
    }

    // 入度为 0 的节点入队
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numNodes; i++) {
        if (indegree[i] == 0) queue.offer(i);
    }

    // BFS
    List<Integer> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int next : graph.get(node)) {
            if (--indegree[next] == 0) {
                queue.offer(next);
            }
        }
    }

    // 处理节点数 < 总数 → 有环
    return order.size() == numNodes ? order : new ArrayList<>();
}
```

### 第四步：检查结果

- `处理节点数 < 总节点数` → 图中有环 → 返回失败（空数组/false）
- 拓扑序**不唯一**：某步有多个入度为 0 的节点时，选不同节点产生不同合法序
- 需要字典序最小的拓扑序？→ 把 `Queue` 换成 `PriorityQueue`（小根堆）

---

## DFS 三色标记版（面试进阶设问）

Kahn 在 90% 场景均适用，但以下三种场景**需要 DFS 后序版**，面试中起码要能说出：

- 需要同时输出拓扑序**和**环上具体节点（调试依赖环）
- 递归天然适合的场景（如表达式求值的拓扑顺序）
- 在递归中顺便计算其它属性（如深度/独立集）

**三色标记是什么：**
- `0 = WHITE`：未访问
- `1 = GRAY`：访问中（在当前 DFS 路径上）
- `2 = BLACK`：已完成（本节点及其后代都处理完）

**为什么要三色**：只用 visited 布尔数组无法区分“环”和“交叉路径”。`A → B → C` 和 `A → C` 同时存在时，C 被访问两次但没环。只有**遇到 GRAY 节点才是环**（在当前路径上遇到自己的祖先）。

```java
public List<Integer> topologicalSortDFS(int n, int[][] edges) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
    for (int[] e : edges) graph.get(e[0]).add(e[1]);

    int[] color = new int[n];                // 0 白 / 1 灰 / 2 黑
    Deque<Integer> stack = new ArrayDeque<>(); // ★ 后序压栈，最后逆序即拓扑序

    for (int i = 0; i < n; i++) {
        if (color[i] == 0 && !dfs(i, graph, color, stack)) {
            return new ArrayList<>();         // 有环
        }
    }
    return new ArrayList<>(stack);            // ★ Deque 迭代顺序 = 压栈逆序 = 拓扑序
}

private boolean dfs(int u, List<List<Integer>> graph, int[] color, Deque<Integer> stack) {
    color[u] = 1;                             // 标为 GRAY：进入当前路径
    for (int v : graph.get(u)) {
        if (color[v] == 1) return false;      // ★ 遇到 GRAY = 环
        if (color[v] == 0 && !dfs(v, graph, color, stack)) return false;
        // color[v] == 2 时直接跳过（已处理）
    }
    color[u] = 2;                             // 标为 BLACK：后代都走完
    stack.push(u);                            // 后序压栈
    return true;
}
```

## 字典序最小拓扑序（[LC 1203](https://leetcode.cn/problems/sort-items-by-groups-respecting-dependencies/) 类题高频考点）

题目要求输出**字典序最小**的拓扑序时，只需一个改动：

```java
// 小改动：将 Queue 换成 PriorityQueue
PriorityQueue<Integer> queue = new PriorityQueue<>();      // ★ 小根堆
// for (int i = 0; i < n; i++) if (indegree[i] == 0) queue.offer(i);
// while (!queue.isEmpty()) { int u = queue.poll(); ... }
```

复杂度从 O(V+E) 变为 O((V+E) log V)，换取“任何时刻优先选最小编号节点”的性质。面试会考这一点。

---

## 典型例题：课程表（[LeetCode 207](https://leetcode.cn/problems/course-schedule/)）

**题目：** 你需要修 `numCourses` 门课，给定先修关系 `prerequisites[i] = [a, b]` 表示学 a 之前要先学 b。判断能否修完所有课程。

**1. 识别：** 出现"先修关系" + "能否完成所有课程" → 检测有向图是否有环 → 拓扑排序。

**2. 建图：** `pre[1]` 是先修课，`pre[0]` 是后续课，边方向：`pre[1] → pre[0]`，同时计算 `indegree[pre[0]]++`。

**3. 算法：** BFS Kahn，每次取入度为 0 的课程，处理后减少后续课的入度。

**4. 检查：** `count == numCourses` 说明所有课都能被处理，无环，返回 `true`；否则有环，返回 `false`。

```java
public boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    int[] indegree = new int[numCourses];
    for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());

    for (int[] pre : prerequisites) {
        graph.get(pre[1]).add(pre[0]);
        indegree[pre[0]]++;
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (indegree[i] == 0) queue.offer(i);
    }

    int count = 0;
    while (!queue.isEmpty()) {
        int course = queue.poll();
        count++;
        for (int next : graph.get(course)) {
            if (--indegree[next] == 0) {
                queue.offer(next);
            }
        }
    }

    return count == numCourses;
}
```

- **时间复杂度：** $O(V + E)$
- **空间复杂度：** $O(V + E)$

---

## 延伸题目

| 题号 | 题名 | 难度 | 关键差异 | 一句话提示 |
|------|------|------|------|------|
| [210](https://leetcode.cn/problems/course-schedule-ii/) | 课程表 II | 中等 | 需返回具体顺序而非 true/false | 和 207 逻辑相同，改为记录并返回 order 数组 |
| [269](https://leetcode.cn/problems/alien-dictionary/) | 火星词典 | 困难 | 需从单词顺序反推字符大小关系，先建图 | 相邻单词比较首个不同字符，建有向边，再拓扑排序 |
| [329](https://leetcode.cn/problems/longest-increasing-path-in-a-matrix/) | 矩阵中的最长递增路径 | 困难 | 矩阵上的隐式 DAG，求最长路径 | 拓扑排序按层推进统计最大深度，或记忆化 DFS |
| [1462](https://leetcode.cn/problems/course-schedule-iv/) | 课程表 IV | 中等 | 需判断任意两课程是否存在先后可达关系 | 拓扑排序 + 可达性集合传播（或 Floyd-Warshall） |

---

## 常见陷阱与调试

**陷阱 1：边方向搞反**

`prerequisites[i] = [a, b]` 中 b 是先修课，边应是 `b → a`。新手常建成 `a → b`，导致入度统计全部错误，排序结果完全相反。调试方法：画出 2-3 个节点的小例子，手动验证入度是否符合预期。

**陷阱 2：忘记环检测**

处理完 BFS 后忘记判断 `count < numNodes`，直接返回 `order`。当图有环时，环上的节点入度永远不会降为 0，不会入队，返回的结果是不完整的，却没有任何报错提示。

**陷阱 3：DFS 环检测不用三色标记**

用 DFS 拓扑排序时，仅用 `visited[]` 布尔数组无法区分"正在访问的祖先"和"已完成的节点"，会产生误判。正确做法是三色标记：0 = 未访问，1 = 访问中（在当前 DFS 路径上），2 = 已完成。遇到状态为 1 的节点才是真正的环。

---

## 面试常问 & 怎么答

### BFS 拓扑排序和 DFS 后序拓扑排序怎么选？

BFS（Kahn 算法）更直观，能同时判断有无环（处理节点数 < 总数就有环），面试中优先用 BFS。DFS 后序需要额外维护状态检测环（三色标记），代码更复杂。

### 拓扑排序的结果唯一吗？

不唯一。如果某一步有多个入度为 0 的节点，选择不同节点会产生不同的拓扑序。如果要求字典序最小的拓扑序，把 Queue 换成 PriorityQueue。

---

## 看到什么就先想到这类

- "课程依赖/任务先后顺序" → 拓扑排序
- "判断有向图是否有环" → 拓扑排序（处理节点数 < 总数）
- "编译/构建顺序" → 拓扑排序
- "从顺序推导关系" → 建图 + 拓扑排序
