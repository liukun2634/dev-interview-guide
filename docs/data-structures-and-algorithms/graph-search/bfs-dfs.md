---
title: BFS 与 DFS
---

# BFS 与 DFS

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
DFS 和 BFS 都是遍历状态空间的方式。**DFS** 用栈（递归），适合连通性、路径枚举、回溯类问题。**BFS** 用队列，适合最短路径（无权图）、层序遍历、最少步数问题。
:::

## 核心思路

| 场景 | 选择 | 原因 |
|------|------|------|
| 无权图最短路/最少步数 | BFS | BFS 保证第一次到达就是最短 |
| 连通块/岛屿数量 | DFS 或 BFS | 都可以，DFS 代码更简洁 |
| 枚举所有路径/方案 | DFS | 需要回溯，BFS 不方便记录路径 |
| 层序遍历 | BFS | 天然按层扩展 |

## DFS 模板（网格/图）

```java
// 网格 DFS
int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

private void dfs(char[][] grid, int i, int j) {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) return;
    if (grid[i][j] != '1') return;
    grid[i][j] = '0';  // 标记已访问
    for (int[] d : dirs) {
        dfs(grid, i + d[0], j + d[1]);
    }
}
```

## BFS 模板

```java
public int bfs(int[][] grid, int startI, int startJ) {
    int m = grid.length, n = grid[0].length;
    Queue<int[]> queue = new LinkedList<>();
    boolean[][] visited = new boolean[m][n];
    queue.offer(new int[]{startI, startJ});
    visited[startI][startJ] = true;
    int step = 0;

    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int k = 0; k < size; k++) {
            int[] curr = queue.poll();
            // 检查是否到达终点
            for (int[] d : dirs) {
                int ni = curr[0] + d[0], nj = curr[1] + d[1];
                if (ni >= 0 && ni < m && nj >= 0 && nj < n
                    && !visited[ni][nj] && grid[ni][nj] == 1) {
                    visited[ni][nj] = true;
                    queue.offer(new int[]{ni, nj});
                }
            }
        }
        step++;
    }
    return step;
}
```

**要点：** BFS 按层遍历时，用 `size = queue.size()` 控制每层的节点数。visited 在**入队时**标记，而不是出队时，避免重复入队。

## 例题 1：[岛屿数量（LeetCode 200）](https://leetcode.cn/problems/number-of-islands/)

### 题目描述

给定 `m × n` 的二维网格 `grid`，`'1'` 表示陆地，`'0'` 表示水域。计算岛屿数量（上下左右相连的陆地算一个岛屿）。

### 思路分析

1. 遍历网格，遇到 `'1'` 就启动一次 DFS，把整个连通的陆地标记为 `'0'`
2. 每次启动 DFS 就是发现了一个新岛屿，计数 +1

### 完整代码

```java
public int numIslands(char[][] grid) {
    int count = 0;
    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == '1') {
                dfs(grid, i, j);
                count++;
            }
        }
    }
    return count;
}

private void dfs(char[][] grid, int i, int j) {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) return;
    if (grid[i][j] != '1') return;
    grid[i][j] = '0';
    dfs(grid, i + 1, j);
    dfs(grid, i - 1, j);
    dfs(grid, i, j + 1);
    dfs(grid, i, j - 1);
}
```

### 复杂度分析

- **时间**：O(m × n)，每个格子最多访问一次
- **空间**：O(m × n)，最坏递归深度

## 例题 2：[腐烂的橘子（LeetCode 994）](https://leetcode.cn/problems/rotting-oranges/)

### 题目描述

在 m × n 网格中，`0` 空格，`1` 新鲜橘子，`2` 腐烂橘子。每分钟腐烂橘子会腐烂四方向相邻的新鲜橘子。返回使所有橘子腐烂所需的最少分钟数，不可能则返回 -1。

### 思路分析

1. 多源 BFS：先把所有初始腐烂的橘子入队，同时统计新鲜橘子数
2. 按层扩展，每层代表 1 分钟，新鲜橘子被感染后入队
3. BFS 结束后检查是否还有新鲜橘子

### 完整代码

```java
public int orangesRotting(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    Queue<int[]> queue = new LinkedList<>();
    int fresh = 0;

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 2) queue.offer(new int[]{i, j});
            else if (grid[i][j] == 1) fresh++;
        }
    }

    if (fresh == 0) return 0;

    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
    int minutes = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int k = 0; k < size; k++) {
            int[] curr = queue.poll();
            for (int[] d : dirs) {
                int ni = curr[0] + d[0], nj = curr[1] + d[1];
                if (ni >= 0 && ni < m && nj >= 0 && nj < n && grid[ni][nj] == 1) {
                    grid[ni][nj] = 2;
                    fresh--;
                    queue.offer(new int[]{ni, nj});
                }
            }
        }
        minutes++;
    }

    return fresh == 0 ? minutes - 1 : -1;
}
```

### 复杂度分析

- **时间**：O(m × n)
- **空间**：O(m × n)

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [200](https://leetcode.cn/problems/number-of-islands/) | 岛屿数量 | 中等 | DFS/BFS 标记连通块 |
| [994](https://leetcode.cn/problems/rotting-oranges/) | 腐烂的橘子 | 中等 | 多源 BFS，按层扩展 |
| [733](https://leetcode.cn/problems/flood-fill/) | 图像渲染 | 简单 | DFS/BFS 填充连通区域 |
| [695](https://leetcode.cn/problems/max-area-of-island/) | 岛屿的最大面积 | 中等 | DFS 统计连通块大小 |
| [542](https://leetcode.cn/problems/01-matrix/) | 01 矩阵 | 中等 | 多源 BFS，从所有 0 开始扩展 |
| [1091](https://leetcode.cn/problems/shortest-path-in-binary-matrix/) | 二进制矩阵中的最短路径 | 中等 | BFS 八方向最短路 |
| [127](https://leetcode.cn/problems/word-ladder/) | 单词接龙 | 困难 | BFS，每步变一个字母 |

## 面试常问 & 怎么答

### DFS 会爆栈吗？

会。递归深度等于最长路径长度，网格题最坏 O(m×n)。如果担心栈溢出，可以改用显式栈的迭代 DFS，或者用 BFS 代替。面试中一般递归 DFS 即可，提到风险加分。

### BFS 的 visited 应该在入队还是出队时标记？

**入队时标记**。如果出队时才标记，同一个节点可能被多次入队，浪费时间和空间。这是 BFS 最常见的优化点。

### 多源 BFS 是什么？

普通 BFS 从一个起点开始，多源 BFS 从多个起点同时开始（全部先入队），按层同时扩展。典型题：腐烂的橘子、01 矩阵。

## 看到什么就先想到这类

- "最短路径/最少步数（无权图）"→ BFS
- "岛屿/连通块数量"→ DFS 或 BFS
- "层序遍历"→ BFS
- "路径枚举/所有方案"→ DFS + 回溯
- "从多个源点同时扩展"→ 多源 BFS
