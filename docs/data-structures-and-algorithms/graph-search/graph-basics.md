---
title: 图建模与遍历
---

# 图建模与遍历

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
图题第一步不是写 DFS/BFS，而是先**建模**：节点是什么、边是什么、有无方向、有无权重。建模对了，遍历就是套模板。Java 中最常用邻接表 `List<List<Integer>>` 表示图。
:::

## 识别信号

**出现以下信号时，考虑图建模：**
- 元素之间有"连接/关系"，且不是简单的线性或父子树形结构
- 二维网格/矩阵，需要区域遍历（岛屿、迷宫）
- 依赖关系、先后顺序（课程先修、任务调度）
- 权重/距离/代价（最短路径、最低费用）
- 需要判断连通性或是否存在路径

**反例——不要过度建图：**
- 题目结构是纯树（无环、有唯一父节点）→ 直接用树遍历，不需要 visited
- 只是简单的父子层级关系 → 递归/栈即可，无需邻接表
- 线性序列 + 双指针/滑动窗口就能解决 → 不需要图

**树 vs 图的关键区别：** 树是无环连通图，n 个节点恰好 n-1 条边；图可以有环、可以不连通、可以有向。图遍历必须维护 visited 防止重复访问，树通常不需要。

---

## 通用思考框架

### 第一步：识别节点和边

问自己三个问题：

1. **节点是什么？** 具体实体（城市、课程、房间）或抽象状态（坐标 (i,j)、字符串、棋盘局面）
2. **边是什么？** 两个节点之间的"关系"或"可达性"
3. **有向还是无向？有权还是无权？**
   - 有向：依赖、先修、单向连通
   - 无向：双向可达、邻接关系
   - 有权：距离、费用、时间

**显式图 vs 隐式图：**
- **显式图**：题目直接给出边列表或邻接关系（如 `int[][] edges`、`int[][] graph`）
- **隐式图**：节点/边没有显式给出，需要从题意推导。最常见是二维网格（四方向邻居就是边）或状态空间（每次操作产生新状态即为边）

### 第二步：选择图的表示方式

**决策表：**

| 表示方式 | 适合场景 | 空间复杂度 | 判断两点是否相连 |
|----------|----------|------------|------------------|
| 邻接表 `List<List<Integer>>` | 稀疏图（边少）、大部分面试题 | O(V + E) | O(degree) |
| 邻接矩阵 `boolean[][]` | 稠密图（边多）、V 较小、Floyd 算法 | O(V²) | O(1) |
| 隐式图（网格直接遍历） | 二维网格、不需要建结构 | O(1) 额外空间 | 边界判断 |

**选择原则：** 面试中 90% 用邻接表。只有在需要 O(1) 判断两点是否相连，或节点数极少（如 Floyd-Warshall）时才考虑邻接矩阵。

**邻接表建图模板：**

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

// 有权图用 int[] 存 [邻居, 权重]
List<List<int[]>> graph = new ArrayList<>();
for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
for (int[] edge : edges) {
    // edge = [from, to, weight]
    graph.get(edge[0]).add(new int[]{edge[1], edge[2]});
}
```

**隐式图（网格）遍历模板：**

```java
int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

private void dfs(char[][] grid, int i, int j, boolean[][] visited) {
    // 边界检查 + 终止条件
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) return;
    if (visited[i][j] || grid[i][j] == '0') return;
    visited[i][j] = true;
    for (int[] d : dirs) {
        dfs(grid, i + d[0], j + d[1], visited);
    }
}
```

### 第三步：选择遍历方式

**DFS 优先考虑：**
- 判断连通性（能否从 A 到 B）
- 路径枚举（所有路径、全排列）
- 环检测
- 拓扑排序

**BFS 优先考虑：**
- 无权图最短路径（保证最先到达即最短）
- 按层扩展（层序遍历、最少步数）
- 多源扩展（多个起点同时出发）

**决策原则：** 需要"最短"或"最少步数"→ 优先 BFS；需要枚举路径或检测环 → 优先 DFS。两者在连通性判断上等价，选更直觉的写法即可。

> DFS 和 BFS 的具体模板见各自专题页面，本页只关注如何选择。

### 第四步：处理 visited 和状态管理

**三种常用方式：**

**1. 独立 boolean[] visited 数组（推荐，最通用）**
```java
boolean[] visited = new boolean[n];
// 进入节点时标记，退出时视需要是否取消标记
visited[node] = true;
```

**2. 直接修改输入（适合网格，省空间）**
```java
// 岛屿问题：访问后把 '1' 改为 '0'，避免重复计算
grid[i][j] = '0'; // 无需额外 visited 数组
```

**3. 三色标记（有向图环检测专用）**
```java
// 0 = 未访问，1 = 访问中（在递归栈里），2 = 已完成
int[] color = new int[n];
// 遇到 color[node] == 1 → 存在环
// 遇到 color[node] == 2 → 已安全处理过，直接跳过
```

**选择原则：**
- 图（有环风险）→ 必须标记 visited，否则死循环
- 网格且可修改 → 直接改原数组，省内存
- 有向图判环 → 三色标记，区分"访问中"和"已完成"
- 需要回溯（枚举所有路径）→ 进入时标记，退出时取消标记

---

## 典型例题：克隆图（LeetCode 133）

[克隆图（LeetCode 133）](https://leetcode.cn/problems/clone-graph/)

**题目描述：** 给定无向连通图中一个节点的引用，返回该图的深拷贝。每个节点包含一个值和邻居列表。

### 1. 识别

- **节点**：每个 `Node` 对象
- **边**：`node.neighbors` 列表，无向图（邻居关系对称）
- **目标**：遍历所有节点，逐一深拷贝

### 2. 表示

图已以邻接表形式给出（`Node.neighbors`），无需额外建图结构，直接基于原图遍历。

### 3. 遍历

选择 DFS。路径枚举不需要，连通性无要求，只需遍历所有可达节点 → DFS 写法更简洁。

### 4. 关键设计：HashMap 身兼两职

```
Map<Node, Node> visited（原节点 → 克隆节点）
```

- **作为 visited 集合**：`containsKey(node)` 判断是否已处理，防止无限递归（无向图有环）
- **作为映射表**：直接返回已创建的克隆节点，邻居连接时复用

这两个职责合二为一，是本题的核心技巧。

### 5. 完整代码

```java
public Node cloneGraph(Node node) {
    if (node == null) return null;
    Map<Node, Node> visited = new HashMap<>();
    return dfs(node, visited);
}

private Node dfs(Node node, Map<Node, Node> visited) {
    if (visited.containsKey(node)) return visited.get(node);

    Node clone = new Node(node.val);
    visited.put(node, clone);          // 先放入 map，再递归邻居（防止环导致死循环）
    for (Node neighbor : node.neighbors) {
        clone.neighbors.add(dfs(neighbor, visited));
    }
    return clone;
}
```

**复杂度：**
- 时间：O(V + E)，每个节点和边各访问一次
- 空间：O(V)，HashMap 和递归栈

---

## 延伸题目

| 题号 | 题名 | 难度 | 关键差异 | 一句话提示 |
|------|------|------|----------|------------|
| [797](https://leetcode.cn/problems/all-paths-from-source-to-target/) | 所有可能的路径 | 中等 | DAG，枚举所有路径需回溯 | DFS + 回溯，到达终点收集路径 |
| [841](https://leetcode.cn/problems/keys-and-rooms/) | 钥匙和房间 | 中等 | 从 0 号房间出发，判断能否访问全部节点 | DFS/BFS 遍历 + 统计已访问数量 |
| [1971](https://leetcode.cn/problems/find-if-path-exists-in-graph/) | 寻找图中是否存在路径 | 简单 | 只判断连通性，无需路径本身 | BFS/DFS/并查集三种方式均可 |
| [207](https://leetcode.cn/problems/course-schedule/) | 课程表 | 中等 | 有向图判环，无环则可完成所有课程 | 建有向图 + 拓扑排序或三色 DFS 判环 |

---

## 常见陷阱与调试

**1. 忘记标记 visited → 有环图无限循环**

现象：代码在有环图上运行时栈溢出或死循环。  
修复：进入节点前先检查并标记 visited，且要在递归邻居之前放入（见 LC133 注释）。

**2. 无向图漏加反向边**

```java
// 错误：只加了单向
graph.get(u).add(v);

// 正确：无向图需要双向
graph.get(u).add(v);
graph.get(v).add(u);
```

**3. 网格边界检查顺序错误**

```java
// 错误：先访问再检查边界，可能 ArrayIndexOutOfBounds
if (grid[i][j] == '0' || i < 0 || ...) return;

// 正确：先检查边界，再访问元素
if (i < 0 || i >= rows || j < 0 || j >= cols) return;
if (grid[i][j] == '0') return;
```

**4. 有向图误用无向图思路**

有向图建邻接表只加单向边；判环需要三色标记，不能只用 boolean visited（已完成节点被多次访问是正常的）。

---

## 面试常问 & 怎么答

### 邻接表和邻接矩阵怎么选？

面试中 90% 用邻接表。邻接矩阵只有在需要 O(1) 判断两点是否相连、或节点数很少（如 Floyd 算法）时才用。邻接表空间 O(V+E)，邻接矩阵空间 O(V²)。

### 图和树的区别？

树是无环连通图，n 个节点恰好 n-1 条边。图可以有环、可以不连通、可以有向。图遍历需要 visited 数组防止重复访问，树不需要。

---

## 看到什么就先想到这类

- "节点之间有连接关系" → 建图
- "二维网格/矩阵" → 隐式图，四方向遍历
- "依赖/先后顺序" → 有向图
- "权重/距离/代价" → 带权图
- "深拷贝图" → DFS/BFS + HashMap
