---
title: BFS 与 DFS
---

# BFS 与 DFS

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
DFS 和 BFS 都是遍历状态空间的方式。**DFS** 用栈（递归），适合连通性、路径枚举、回溯类问题。**BFS** 用队列，适合最短路径（无权图）、层序遍历、最少步数问题。
:::

---

## 识别信号

看到这些关键词时，优先考虑对应算法：

| 关键词 / 场景 | 优先考虑 | 反例 / 注意 |
|---|---|---|
| 最短路径、最少步数、最少操作次数 | BFS | 有权图不能用 BFS，要用 Dijkstra |
| 按层扩展、层序遍历 | BFS | — |
| 从多个源点同时扩散 | 多源 BFS | — |
| 连通块数量、判断连通性 | DFS 或 BFS | 两者都行，DFS 代码更短 |
| 枚举所有路径 / 所有方案 | DFS + 回溯 | BFS 不方便记录完整路径 |
| 能否到达某节点 | DFS 或 BFS | 只判断连通性，两者都可以 |

---

## 通用思考框架

拿到图搜索题，按以下四步拆解，不要上来就写代码。

### 第一步：判断用 BFS 还是 DFS

**"最短路 / 最少步数 / 按层"→ BFS**

> **为什么**：BFS 按距离由近到远逐层扩展，在无权图中第一次到达某节点时，走过的步数一定是最短的。DFS 不具备这个性质——它可能先沿着一条很长的路走到底，再回溯。

**"连通性 / 所有路径 / 枚举"→ DFS**

> **为什么**：DFS 天然沿深度方向推进，配合递归调用栈就能实现回溯，枚举所有路径时只需在递归返回时撤销选择即可。BFS 要记录路径需要额外存储每个节点的前驱，代码复杂度高很多。

**两者都能解决连通性问题——DFS 代码更简洁，BFS 内存占用通常更多（队列需要存储整层节点）。**

| 场景 | 选择 | 原因 |
|---|---|---|
| 无权图最短路 / 最少步数 | BFS | 第一次到达即最短，DFS 做不到 |
| 连通块 / 岛屿数量 | DFS 或 BFS | 都可，DFS 代码更简洁 |
| 枚举所有路径 / 方案 | DFS | 回溯天然契合递归；BFS 路径记录复杂 |
| 层序遍历 | BFS | 天然按层扩展 |
| 多源同时扩散 | 多源 BFS | 所有源点同时入队，等价于虚拟超级源点 |

### 第二步：确定搜索空间

搜索空间决定了"邻居"怎么定义：

- **显式图**（给了边列表 / 邻接表）→ 直接遍历 `neighbors`
- **网格**（二维数组）→ 上下左右四方向（有时是八方向）
- **状态空间**（单词接龙、密码锁）→ 每次变一个字符 / 一个数字，抽象出"相邻状态"

搜索空间确定后，写出邻居生成逻辑，其余框架都一样。

### 第三步：设计 visited 策略

**BFS：在入队时标记，而不是出队时。**

> **为什么**：如果出队时才标记，同一个节点可能被多次加入队列。假设节点 A 的两个邻居 B、C 都指向节点 D，BFS 扩展 B 时把 D 入队，扩展 C 时 D 还没出队、尚未标记，于是 D 被再次入队。出队时标记会导致重复处理，浪费时间和空间。

**DFS：进入节点时标记；若需要枚举所有路径，离开时撤销标记（回溯）。**

**网格题：可以直接修改输入**（如把 `'1'` 改成 `'0'`）来节省额外 visited 数组的空间。

### 第四步：处理层级信息（BFS 专用）

需要知道"当前走了几步"时，用 `size = queue.size()` 控制每层边界：

```java
while (!queue.isEmpty()) {
    int size = queue.size();   // 当前层的节点数
    for (int k = 0; k < size; k++) {
        int[] curr = queue.poll();
        // 处理 curr，把下一层邻居入队
    }
    step++;  // 处理完一整层才 +1
}
```

**多源 BFS**：把所有初始源点全部先入队，再启动统一的 BFS 循环。等价于引入一个虚拟超级源点同时连接所有真实源点，保证所有源点"同时出发"。

---

### DFS 模板（网格 / 图）

```java
int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

private void dfs(char[][] grid, int i, int j) {
    // 越界或已访问 / 不满足条件，直接返回
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) return;
    if (grid[i][j] != '1') return;
    grid[i][j] = '0';  // 入口处标记已访问（修改原地，省空间）
    for (int[] d : dirs) {
        dfs(grid, i + d[0], j + d[1]);
    }
    // 若需要回溯枚举所有路径，在这里恢复：grid[i][j] = '1';
}
```

### BFS 模板（带层级计数）

```java
int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

public int bfs(int[][] grid, int startI, int startJ) {
    int m = grid.length, n = grid[0].length;
    Queue<int[]> queue = new LinkedList<>();
    boolean[][] visited = new boolean[m][n];

    // 入队时立刻标记，防止重复入队
    queue.offer(new int[]{startI, startJ});
    visited[startI][startJ] = true;
    int step = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();           // 当前层节点数
        for (int k = 0; k < size; k++) {
            int[] curr = queue.poll();
            // 若到达终点，直接 return step;
            for (int[] d : dirs) {
                int ni = curr[0] + d[0], nj = curr[1] + d[1];
                if (ni >= 0 && ni < m && nj >= 0 && nj < n
                        && !visited[ni][nj] && grid[ni][nj] == 1) {
                    visited[ni][nj] = true;   // 入队时标记
                    queue.offer(new int[]{ni, nj});
                }
            }
        }
        step++;
    }
    return step;
}
```

---

## 典型例题：腐烂的橘子（[LeetCode 994](https://leetcode.cn/problems/rotting-oranges/)）

选这道题作为主例，因为它包含 BFS 最核心的两个难点：**多源 BFS** 和 **层级计数**。

### 题目描述

在 m × n 网格中，`0` 空格，`1` 新鲜橘子，`2` 腐烂橘子。每分钟腐烂橘子会腐烂四方向相邻的新鲜橘子。返回使所有橘子腐烂所需的最少分钟数，不可能则返回 -1。

### 逐步套框架

**第一步：判断算法**

题目要"最少分钟数"，即最短距离，选 **BFS**。腐烂源头有多个，选 **多源 BFS**。

**第二步：搜索空间**

网格，四方向扩展。邻居 = 四个相邻格子中值为 `1` 的格子。

**第三步：visited 策略**

直接修改网格：腐烂时把 `1` 改为 `2`，省掉额外 visited 数组。入队时立刻修改（入队即标记）。

**第四步：层级信息**

每处理完一层 = 过了 1 分钟。注意：BFS 结束时 `minutes` 会多加一次（最后一层处理完但没有新节点入队），返回时需减 1；或者改为"出队后才计数"。本实现选择最后减 1。

### 完整代码

```java
public int orangesRotting(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    Queue<int[]> queue = new LinkedList<>();
    int fresh = 0;

    // 多源 BFS：所有初始腐烂橘子同时入队
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 2) queue.offer(new int[]{i, j});
            else if (grid[i][j] == 1) fresh++;
        }
    }

    if (fresh == 0) return 0;  // 没有新鲜橘子，直接返回 0

    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
    int minutes = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int k = 0; k < size; k++) {
            int[] curr = queue.poll();
            for (int[] d : dirs) {
                int ni = curr[0] + d[0], nj = curr[1] + d[1];
                if (ni >= 0 && ni < m && nj >= 0 && nj < n && grid[ni][nj] == 1) {
                    grid[ni][nj] = 2;  // 入队时标记（修改为腐烂）
                    fresh--;
                    queue.offer(new int[]{ni, nj});
                }
            }
        }
        minutes++;
    }

    // minutes 最后一次 ++ 是在队列已空后发生的，需减 1
    return fresh == 0 ? minutes - 1 : -1;
}
```

### 复杂度分析

- **时间**：O(m × n)，每个格子最多入队一次
- **空间**：O(m × n)，队列最多存储所有格子

---

## 延伸题目

| 题号 | 题名 | 难度 | 关键差异 | 一句话提示 |
|---|---|---|---|---|
| [200](https://leetcode.cn/problems/number-of-islands/) | 岛屿数量 | 中等 | 连通块计数，单源即可 | DFS 标记整块，遇到 `'1'` 就计数 +1 |
| [733](https://leetcode.cn/problems/flood-fill/) | 图像渲染 | 简单 | DFS/BFS 填充，注意新旧颜色相同的边界情况 | 先判断 `newColor == oldColor`，相同直接返回 |
| [695](https://leetcode.cn/problems/max-area-of-island/) | 岛屿的最大面积 | 中等 | DFS 返回连通块大小，取最大值 | DFS 返回 `int`，累加面积 |
| [542](https://leetcode.cn/problems/01-matrix/) | 01 矩阵 | 中等 | 多源 BFS，从所有 `0` 出发求最近距离 | 把所有 `0` 先入队，`1` 的位置初始化为 `Integer.MAX_VALUE` |
| [1091](https://leetcode.cn/problems/shortest-path-in-binary-matrix/) | 二进制矩阵中的最短路径 | 中等 | BFS 八方向，起点终点可能是 `1` | 先特判起点或终点为 `1` 的情况 |
| [127](https://leetcode.cn/problems/word-ladder/) | 单词接龙 | 困难 | 状态空间 BFS，每步变一个字母 | 用 `Set<String>` 存字典，每次枚举 26 个字母替换 |

---

## 常见陷阱与调试

**BFS：visited 在出队时标记（而非入队时）**

同一节点会被多次入队，导致时间复杂度退化。调试特征：BFS 明显比预期慢，或输出结果偏大。修复：将 `visited[ni][nj] = true` 移到 `queue.offer(...)` 之前。

**DFS：大网格下递归栈溢出**

递归深度最坏为 O(m × n)，1000×1000 的网格可能触发 StackOverflowError。面试中提到这个风险即可加分；若面试官追问，说明可改为显式栈的迭代 DFS。

**多源 BFS：忘记把所有源点初始入队**

只入队部分源点会导致"扩散不同步"，某些源点的扩散会晚几步开始，计算出的距离偏大。修复：初始化阶段遍历整个数组，把**所有**满足条件的源点都加入队列。

---

## 面试常问 & 怎么答

### DFS 会爆栈吗？

会。递归深度等于最长路径长度，网格题最坏 O(m×n)。如果担心栈溢出，可以改用显式栈的迭代 DFS，或者用 BFS 代替。面试中一般递归 DFS 即可，提到风险加分。

### BFS 的 visited 应该在入队还是出队时标记？

**入队时标记**。如果出队时才标记，同一个节点可能被多次入队，浪费时间和空间。这是 BFS 最常见的优化点。

### 多源 BFS 是什么？

普通 BFS 从一个起点开始，多源 BFS 从多个起点同时开始（全部先入队），按层同时扩展。等价于引入一个虚拟超级源点同时连接所有真实源点。典型题：腐烂的橘子、01 矩阵。

---

## 看到什么就先想到这类

- "最短路径 / 最少步数（无权图）"→ BFS
- "岛屿 / 连通块数量"→ DFS 或 BFS
- "层序遍历"→ BFS
- "路径枚举 / 所有方案"→ DFS + 回溯
- "从多个源点同时扩展"→ 多源 BFS
