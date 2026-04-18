---
title: 图建模与遍历
---

# 图建模与遍历

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
图题第一步不是写 DFS/BFS，而是先**建模**：节点是什么、边是什么、有无方向、有无权重。建模对了，遍历就是套模板。Java 中最常用邻接表 `List<List<Integer>>` 表示图。
:::

## 核心思路

**什么时候用图？**
- 元素之间有"连接/关系"且不是简单的线性或树形结构
- 岛屿/网格问题（隐式图，四方向邻接）
- 依赖关系、先后顺序（有向图）
- 最短路径、连通性问题

**两种常见表示：**

| 表示 | 适合场景 | 空间 |
|------|------|------|
| 邻接表 | 稀疏图（边少），大部分面试题 | O(V + E) |
| 邻接矩阵 | 稠密图（边多），需要 O(1) 判断两点是否相连 | O(V²) |

## 邻接表建图模板

```java
// 无权有向图
List<List<Integer>> graph = new ArrayList<>();
for (int i = 0; i < n; i++) {
    graph.add(new ArrayList<>());
}
for (int[] edge : edges) {
    graph.get(edge[0]).add(edge[1]);
    // 无向图再加：graph.get(edge[1]).add(edge[0]);
}

// 有权图用 int[] 或 Map
List<List<int[]>> graph = new ArrayList<>();
for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
for (int[] edge : edges) {
    // edge = [from, to, weight]
    graph.get(edge[0]).add(new int[]{edge[1], edge[2]});
}
```

## 网格图遍历模板

很多题的图是隐式的（二维网格），不需要显式建邻接表：

```java
int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

private void dfs(int[][] grid, int i, int j, boolean[][] visited) {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) return;
    if (visited[i][j] || grid[i][j] == 0) return;
    visited[i][j] = true;
    for (int[] d : dirs) {
        dfs(grid, i + d[0], j + d[1], visited);
    }
}
```

## 例题 1：[所有可能的路径（LeetCode 797）](https://leetcode.cn/problems/all-paths-from-source-to-target/)

### 题目描述

给定有向无环图 `graph`，其中 `graph[i]` 是从节点 i 可以到达的所有节点列表。找出从节点 0 到节点 n-1 的所有路径。

### 思路分析

1. DAG 上求所有路径，用 DFS + 回溯
2. 从节点 0 出发，每次遍历当前节点的所有邻接点
3. 到达节点 n-1 时收集当前路径

### 完整代码

```java
public List<List<Integer>> allPathsSourceTarget(int[][] graph) {
    List<List<Integer>> result = new ArrayList<>();
    List<Integer> path = new ArrayList<>();
    path.add(0);
    dfs(graph, 0, path, result);
    return result;
}

private void dfs(int[][] graph, int node, List<Integer> path, List<List<Integer>> result) {
    if (node == graph.length - 1) {
        result.add(new ArrayList<>(path));
        return;
    }
    for (int next : graph[node]) {
        path.add(next);
        dfs(graph, next, path, result);
        path.remove(path.size() - 1);
    }
}
```

### 复杂度分析

- **时间**：O(2^n × n)，最坏情况路径数指数级
- **空间**：O(n)，递归深度

## 例题 2：[克隆图（LeetCode 133）](https://leetcode.cn/problems/clone-graph/)

### 题目描述

给定无向连通图中一个节点的引用，返回该图的深拷贝。每个节点包含一个值和邻居列表。

### 思路分析

1. 用 HashMap 记录已克隆的节点（原节点 → 克隆节点）
2. DFS 遍历，遇到已克隆的节点直接返回
3. 遇到未克隆的节点，创建克隆并递归克隆邻居

### 完整代码

```java
public Node cloneGraph(Node node) {
    if (node == null) return null;
    Map<Node, Node> visited = new HashMap<>();
    return dfs(node, visited);
}

private Node dfs(Node node, Map<Node, Node> visited) {
    if (visited.containsKey(node)) return visited.get(node);

    Node clone = new Node(node.val);
    visited.put(node, clone);
    for (Node neighbor : node.neighbors) {
        clone.neighbors.add(dfs(neighbor, visited));
    }
    return clone;
}
```

### 复杂度分析

- **时间**：O(V + E)
- **空间**：O(V)

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [797](https://leetcode.cn/problems/all-paths-from-source-to-target/) | 所有可能的路径 | 中等 | DAG 上 DFS 枚举路径 |
| [133](https://leetcode.cn/problems/clone-graph/) | 克隆图 | 中等 | DFS/BFS + HashMap 深拷贝 |
| [841](https://leetcode.cn/problems/keys-and-rooms/) | 钥匙和房间 | 中等 | DFS/BFS 判断能否访问所有节点 |
| [1971](https://leetcode.cn/problems/find-if-path-exists-in-graph/) | 寻找图中是否存在路径 | 简单 | BFS/DFS/并查集判断连通性 |
| [207](https://leetcode.cn/problems/course-schedule/) | 课程表 | 中等 | 建有向图 + 拓扑排序/DFS判环 |

## 面试常问 & 怎么答

### 邻接表和邻接矩阵怎么选？

面试中 90% 用邻接表。邻接矩阵只有在需要 O(1) 判断两点是否相连、或节点数很少（如 Floyd 算法）时才用。邻接表空间 O(V+E)，邻接矩阵空间 O(V²)。

### 图和树的区别？

树是无环连通图，n 个节点恰好 n-1 条边。图可以有环、可以不连通、可以有向。图遍历需要 visited 数组防止重复访问，树不需要。

## 看到什么就先想到这类

- "节点之间有连接关系"→ 建图
- "二维网格/矩阵"→ 隐式图，四方向遍历
- "依赖/先后顺序"→ 有向图
- "权重/距离/代价"→ 带权图
- "深拷贝图"→ DFS/BFS + HashMap
