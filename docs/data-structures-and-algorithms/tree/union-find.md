---
title: 并查集
---

# 并查集

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
并查集处理**动态连通性**问题：判断两个元素是否属于同一集合，以及合并两个集合。加上**路径压缩**和**按秩合并**两个优化后，单次操作接近 O(1)。
:::

## 核心思路

**什么时候用并查集？**
- 判断两个节点是否连通
- 统计连通分量个数
- 检测图中是否有环
- 等价关系合并（账户合并、同义词合并）

**为什么不用 BFS/DFS？** 并查集支持动态添加边并实时查询连通性，而 BFS/DFS 每次查询都要重新遍历。

## 并查集模板

```java
class UnionFind {
    private int[] parent;
    private int[] rank;
    private int count;  // 连通分量个数

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;  // 初始时每个元素是自己的根
        }
    }

    // 查找根节点（带路径压缩）
    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);  // 路径压缩
        }
        return parent[x];
    }

    // 合并两个集合（按秩合并）
    public void union(int x, int y) {
        int rootX = find(x), rootY = find(y);
        if (rootX == rootY) return;
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }
        count--;
    }

    // 判断是否连通
    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    public int getCount() {
        return count;
    }
}
```

**要点：**
- **路径压缩**：find 时把路径上所有节点直接指向根，压平树
- **按秩合并**：小树挂到大树上，防止退化为链表
- 两个优化同时使用，单次操作均摊 O(α(n)) ≈ O(1)

## 例题 1：[省份数量（LeetCode 547）](https://leetcode.cn/problems/number-of-provinces/)

### 题目描述

有 `n` 个城市，给定 `n×n` 的邻接矩阵 `isConnected`，`isConnected[i][j] = 1` 表示城市 i 和 j 直接相连。返回省份数量（连通分量个数）。

### 思路分析

1. 初始化 n 个独立集合
2. 遍历邻接矩阵上三角，有连接就 union
3. 最终 count 就是省份数量

### 完整代码

```java
public int findCircleNum(int[][] isConnected) {
    int n = isConnected.length;
    UnionFind uf = new UnionFind(n);

    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (isConnected[i][j] == 1) {
                uf.union(i, j);
            }
        }
    }
    return uf.getCount();
}
```

### 复杂度分析

- **时间**：O(n² α(n)) ≈ O(n²)
- **空间**：O(n)

## 例题 2：[冗余连接（LeetCode 684）](https://leetcode.cn/problems/redundant-connection/)

### 题目描述

树是一个没有环的连通无向图。给定一个有 n 个节点的树多加了一条边，找到这条多余的边并返回。如果有多个答案，返回最后出现的那条边。

### 思路分析

1. 逐条添加边，用并查集判断两端是否已连通
2. 如果添加前两端已经连通，这条边就是多余的（会形成环）
3. 按顺序遍历，最后一条形成环的边就是答案

### 完整代码

```java
public int[] findRedundantConnection(int[][] edges) {
    int n = edges.length;
    UnionFind uf = new UnionFind(n + 1);  // 节点编号从 1 开始

    for (int[] edge : edges) {
        if (uf.connected(edge[0], edge[1])) {
            return edge;  // 已连通，这条边多余
        }
        uf.union(edge[0], edge[1]);
    }
    return new int[0];
}
```

### 复杂度分析

- **时间**：O(n α(n)) ≈ O(n)
- **空间**：O(n)

## 例题 3：[除法求值（LeetCode 399）](https://leetcode.cn/problems/evaluate-division/) — 带权并查集

::: warning 🔥 必懂变体
带权并查集是并查集最重要的扩展，处理"**等价关系 + 比值/距离**"问题。LC 399 是经典考察题。
:::

### 题目描述

给定一系列除法等式（如 `a/b = 2.0`、`b/c = 3.0`）和若干查询（如 `a/c = ?`），求每个查询的结果。如果无法确定，返回 `-1.0`。

### 为什么标准并查集不够

标准并查集只能回答"a、b 是否在同一集合"，但本题要回答"a 和 b 的**比值**是多少"。需要在并查集的"指向父节点"边上**额外记录权值**。

### 核心设计

- `parent[x]`：x 的父节点（同标准并查集）
- `weight[x]`：x → parent[x] 的权值，语义是 **`x / parent[x] = weight[x]`**
- `find(x)`：路径压缩时同步累乘权值，使 `weight[x]` 变为 **`x / root = ?`**
- `union(x, y, value)`：把两棵树连起来时，按 "x/y = value" 计算根之间的权值

**示意图：**

```
初始：a/b=2，b/c=3 后，所有节点都挂在根 c 下
      a → b → c
weight[a]=2 (a/b=2)
weight[b]=3 (b/c=3)
路径压缩后：a 直接指向 c，weight[a] 更新为 6 (a/c=6)
```

### 完整代码

```java
class WeightedUnionFind {
    private int[] parent;
    private double[] weight;     // ★ weight[x] = x / parent[x]

    public WeightedUnionFind(int n) {
        parent = new int[n];
        weight = new double[n];
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            weight[i] = 1.0;     // 初始时自己 / 自己 = 1
        }
    }

    // 路径压缩 + 权值累乘
    public int find(int x) {
        if (parent[x] != x) {
            int origParent = parent[x];
            parent[x] = find(parent[x]);          // 递归找根
            weight[x] *= weight[origParent];      // ★ 累乘：x/root = (x/origParent) * (origParent/root)
        }
        return parent[x];
    }

    // 合并：已知 x / y = value
    public void union(int x, int y, double value) {
        int rootX = find(x), rootY = find(y);
        if (rootX == rootY) return;
        parent[rootX] = rootY;
        // ★ 关系推导：x/rootX = w[x]，y/rootY = w[y]，x/y = value
        //   => rootX/rootY = (x/y) * (y/rootY) / (x/rootX) = value * w[y] / w[x]
        weight[rootX] = value * weight[y] / weight[x];
    }

    // 查询 x / y
    public double query(int x, int y) {
        if (find(x) != find(y)) return -1.0;
        return weight[x] / weight[y];             // ★ x/root ÷ y/root = x/y
    }
}
```

### 主函数：字符串到 ID 的映射

LC 399 的变量是字符串，需要先把字符串映射成整数 ID（这是**所有"字符串并查集"题的标准模式**）：

```java
public double[] calcEquation(List<List<String>> equations, double[] values,
                              List<List<String>> queries) {
    Map<String, Integer> id = new HashMap<>();
    for (List<String> eq : equations) {
        id.putIfAbsent(eq.get(0), id.size());     // ★ 字符串 → 唯一 ID
        id.putIfAbsent(eq.get(1), id.size());
    }

    WeightedUnionFind uf = new WeightedUnionFind(id.size());
    for (int i = 0; i < equations.size(); i++) {
        uf.union(id.get(equations.get(i).get(0)),
                 id.get(equations.get(i).get(1)),
                 values[i]);
    }

    double[] result = new double[queries.size()];
    for (int i = 0; i < queries.size(); i++) {
        Integer a = id.get(queries.get(i).get(0));
        Integer b = id.get(queries.get(i).get(1));
        result[i] = (a == null || b == null) ? -1.0 : uf.query(a, b);
    }
    return result;
}
```

### 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| `find` 路径压缩前没存旧 parent | `weight[x] *= weight[parent[x]]` 用到的是**已被改写**的 weight | 必须先保存 `int origParent = parent[x]` 再递归 |
| `union` 公式记反 | 比值全错 | 推导一遍 `rootX/rootY = value * w[y] / w[x]`，背公式不如背推导 |
| 查询不存在的变量 | NPE 或返回错误值 | 主函数中 `id.get` 后判 `null` |
| 浮点比较用 `==` | 由于精度问题判等失败 | 用 `Math.abs(a-b) < 1e-9` |

### 复杂度分析

- **时间**：每次 `find` / `union` / `query` 均摊 O(α(n)) ≈ O(1)
- **空间**：O(n)

### 追问：和 BFS / DFS 比有什么优势

BFS/DFS 每次查询都要从源点遍历到目标点，O(V+E)。带权并查集在**多次查询**场景下均摊 O(1) 查询，总复杂度 O((n+q) α(n)) 远优于 BFS 的 O(q(V+E))。

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [547](https://leetcode.cn/problems/number-of-provinces/) | 省份数量 | 中等 | 并查集统计连通分量 |
| [684](https://leetcode.cn/problems/redundant-connection/) | 冗余连接 | 中等 | 并查集检测环 |
| [200](https://leetcode.cn/problems/number-of-islands/) | 岛屿数量 | 中等 | 并查集 / BFS / DFS 都可以 |
| [721](https://leetcode.cn/problems/accounts-merge/) | 账户合并 | 中等 | 并查集合并等价关系 |
| [1319](https://leetcode.cn/problems/number-of-operations-to-make-network-connected/) | 连通网络的操作次数 | 中等 | 统计连通分量数 - 1 |
| [399](https://leetcode.cn/problems/evaluate-division/) | 除法求值 | 中等 | 带权并查集 / BFS |
| [765](https://leetcode.cn/problems/couples-holding-hands/) | 情侣牵手 | 困难 | 并查集统计需要交换的环 |

## 面试常问 & 怎么答

### 路径压缩和按秩合并分别有什么用？

路径压缩让 find 操作把路径上所有节点直接指向根，下次查找 O(1)。按秩合并保证小树挂到大树上，防止树退化成链表。两者结合使单次操作均摊 O(α(n))，α 是反阿克曼函数，实际可视为常数。

### 并查集和 BFS/DFS 判断连通性有什么区别？

BFS/DFS 是一次性遍历，适合静态图。并查集支持动态添加边并实时查询连通性，不需要每次重新遍历。如果边是逐条添加的（在线查询），并查集更优。

### 并查集能处理有向图吗？

标准并查集只能处理无向图的连通性。有向图的连通性（强连通分量）需要用 Tarjan 或 Kosaraju 算法。

## 看到什么就先想到这类

- "判断两个节点是否连通"→ 并查集
- "连通分量个数"→ 并查集（或 BFS/DFS）
- "加一条边会不会成环"→ 并查集
- "等价关系合并"→ 并查集
- "动态添加边 + 查询连通性"→ 并查集（而非 BFS/DFS）
