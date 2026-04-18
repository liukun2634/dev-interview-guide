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
