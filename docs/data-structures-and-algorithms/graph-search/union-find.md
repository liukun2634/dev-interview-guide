---
title: 并查集
---

# 并查集

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
并查集是一种用于高效处理"动态连通性"问题的数据结构。核心操作两个：**find**（查询所属集合）和 **union**（合并两个集合），通过路径压缩和按秩合并优化到近 $O(1)$。
:::

---

## 识别信号

**看到这些特征时，优先考虑并查集：**

- "判断两个元素是否在同一集合/连通分量"
- "合并两个集合/连通分量"
- 边不断加入，需要**动态判断连通性**（静态图直接用 BFS/DFS）
- "冗余连接"——找出让图成环的那条边
- 关键词：**连通分量、集合合并、动态连通**

**反例——以下情况不需要并查集：**

- 图是静态的，只需查询一次连通性 → DFS/BFS 更直接
- 需要找最短路径 → Dijkstra / BFS
- 有向图的依赖关系 → 拓扑排序

---

## 通用思考框架

### 第一步：理解核心数据结构

并查集用两个数组维护每个节点的归属：

- **`parent[]` 数组**：`parent[i]` 表示节点 `i` 的父节点；根节点满足 `parent[root] == root`
- **`rank[]` 数组**：用于按秩合并，记录树的"高度上界"，防止树退化为链
- **初始化**：每个节点自成一组，`parent[i] = i`，`rank[i] = 0`

```
初始状态（5 个节点）：
parent: [0, 1, 2, 3, 4]
rank:   [0, 0, 0, 0, 0]
每个节点是自己的根 → 5 个连通分量
```

### 第二步：两个核心操作

**`find(x)`**：沿 `parent` 链找到根节点。

- 不加优化：最坏 $O(n)$（树退化为链时）
- 加路径压缩：`parent[x] = find(parent[x])`，把沿途所有节点直接挂到根下

```
路径压缩示意：
查询前：x → a → b → root
查询后：x → root，a → root，b → root（全部直接挂到根）
```

**`union(x, y)`**：找到 `x` 和 `y` 的根，按秩合并——把秩（高度）小的树挂到大的树下面，避免树变高。

**`isConnected(x, y)`**：判断 `find(x) == find(y)` 即可。

### 第三步：路径压缩为什么重要

不做路径压缩，极端场景（所有 union 都是链式的）下树会退化为链：

$$
0 \to 1 \to 2 \to 3 \to \cdots \to n
$$

此时 `find(0)` 需要遍历 $n$ 步，复杂度 $O(n)$。

加上路径压缩后，每次 `find` 都会把访问过的节点直接接到根节点，摊销后单次操作复杂度降到 $O(\alpha(n))$，其中 $\alpha$ 是阿克曼函数的反函数——实际应用中不超过 4，可以视为常数。

### 第四步：完整模板代码

```java
class UnionFind {
    int[] parent, rank;
    int count; // 连通分量数

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    // 带路径压缩的 find
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    // 按秩合并，返回是否发生了合并（false 表示已连通）
    boolean union(int x, int y) {
        int rootX = find(x), rootY = find(y);
        if (rootX == rootY) return false; // 已连通，无需合并
        if (rank[rootX] < rank[rootY]) {
            int t = rootX; rootX = rootY; rootY = t;
        }
        parent[rootY] = rootX;
        if (rank[rootX] == rank[rootY]) rank[rootX]++;
        count--;
        return true;
    }

    boolean isConnected(int x, int y) {
        return find(x) == find(y);
    }
}
```

---

## 典型例题

### LC 547 · 省份数量

> 有 `n` 个城市，`isConnected[i][j] == 1` 表示城市 `i` 和城市 `j` 直接相连。求省份数量（即连通分量数）。

[题目链接 →](https://leetcode.cn/problems/number-of-provinces/)

**分析：**

1. 题目本质是"统计连通分量数"，并查集初始化时 `count = n`，每成功合并一次 `count--`
2. 遍历矩阵上三角（避免重复），对每条边调用 `union`
3. 最终 `uf.count` 即为省份数量

**时间复杂度：** $O(n^2 \cdot \alpha(n))$，遍历矩阵 $O(n^2)$，每次 `union` 均摊 $O(\alpha(n))$

**空间复杂度：** $O(n)$

```java
class Solution {
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

        return uf.count;
    }

    static class UnionFind {
        int[] parent, rank;
        int count;

        UnionFind(int n) {
            parent = new int[n];
            rank = new int[n];
            count = n;
            for (int i = 0; i < n; i++) parent[i] = i;
        }

        int find(int x) {
            if (parent[x] != x) parent[x] = find(parent[x]);
            return parent[x];
        }

        boolean union(int x, int y) {
            int rootX = find(x), rootY = find(y);
            if (rootX == rootY) return false;
            if (rank[rootX] < rank[rootY]) {
                int t = rootX; rootX = rootY; rootY = t;
            }
            parent[rootY] = rootX;
            if (rank[rootX] == rank[rootY]) rank[rootX]++;
            count--;
            return true;
        }
    }
}
```

**关键点：**

- 初始化 `count = n`，每次合并成功 `count--`，最终直接返回 `count`，不需要额外统计
- 本题也可以用 DFS/BFS 求连通分量，但并查集代码更短，且天然支持后续动态加边

---

## 延伸题目

| 题目 | 难度 | 并查集要点 |
|---|---|---|
| [LC 200 · 岛屿数量](https://leetcode.cn/problems/number-of-islands/) | 🟡 中等 | 二维网格转一维索引 `i * cols + j`，向右/向下合并避免重复 |
| [LC 684 · 冗余连接](https://leetcode.cn/problems/redundant-connection/) | 🟡 中等 | 遍历边，第一条 `union` 返回 `false`（已连通）的边即为答案 |
| [LC 721 · 账户合并](https://leetcode.cn/problems/accounts-merge/) | 🟡 中等 | 字符串并查集，用 `Map<String, Integer>` 把邮件映射到 ID |
| [LC 128 · 最长连续序列](https://leetcode.cn/problems/longest-consecutive-sequence/) | 🟡 中等 | 通常用 HashSet $O(n)$ 解，但可以用并查集理解"连续数字合并" |
| [LC 1319 · 连通网络的操作次数](https://leetcode.cn/problems/number-of-operations-to-make-network-connected/) | 🟡 中等 | 多余的线缆数 ≥ 连通分量数 - 1 时才可行 |
| [LC 990 · 等式方程的可满足性](https://leetcode.cn/problems/satisfiability-of-equality-equations/) | 🟡 中等 | 两轮遍历：先处理 `==` 建集合，再检查 `!=` 是否矛盾 |

---

## 常见陷阱与调试

**1. `find` 没有路径压缩 → TLE**

```java
// 错误：没有路径压缩
int find(int x) {
    while (parent[x] != x) x = parent[x]; // 链状树时 O(n)
    return x;
}

// 正确：路径压缩
int find(int x) {
    if (parent[x] != x) parent[x] = find(parent[x]); // 递归压缩
    return parent[x];
}
```

**2. `union` 忘记检查是否已同根 → `count` 多减**

```java
// 错误：没有检查是否已连通
void union(int x, int y) {
    parent[find(x)] = find(y);
    count--; // x 和 y 已经连通时也减了，count 偏小
}

// 正确：先检查
boolean union(int x, int y) {
    int rootX = find(x), rootY = find(y);
    if (rootX == rootY) return false; // 已连通，直接返回
    parent[rootY] = rootX;
    count--;
    return true;
}
```

**3. 二维网格转一维索引搞错**

```java
// 正确：(i, j) → i * cols + j，不是 i * rows + j
int idx(int i, int j, int cols) {
    return i * cols + j;
}
```

**4. 忘记初始化 `parent[i] = i`**

并查集初始化时必须让每个节点指向自己，否则 `find` 会访问随机内存（Java 中 `int[]` 默认为 0，会导致所有节点都指向节点 0，逻辑完全错误）。

---

## 面试常问 & 怎么答

**Q：并查集的时间复杂度是多少？**

> 路径压缩 + 按秩合并后，`find` 和 `union` 的均摊复杂度是 $O(\alpha(n))$，其中 $\alpha$ 是阿克曼函数的反函数。$\alpha(n)$ 在所有实际输入下不超过 4，可以认为是常数，即近似 $O(1)$。

**Q：路径压缩和按秩合并分别解决什么问题？**

> - **路径压缩**：缩短查找链。查询时把沿途节点直接挂到根节点，下次查同一节点只需 1 步
> - **按秩合并**：防止树退化为链。合并时把矮树挂到高树下，控制树的高度上界为 $O(\log n)$
> - 两者单独使用都能降低复杂度，合用可达到 $O(\alpha(n))$

**Q：并查集和 DFS/BFS 判断连通性有什么区别？**

> - **DFS/BFS**：适合静态图、一次性查询所有连通分量。时间复杂度 $O(V + E)$，但不支持动态加边
> - **并查集**：适合**动态加边 + 多次查询**的场景。每次 `union` 和 `find` 均摊 $O(\alpha(n))$，远优于每次都重跑 DFS/BFS

**Q：什么时候用并查集而不是 DFS？**

> - 边不断加入的场景（在线算法）：每条新边到来时，$O(1)$ 判断是否会成环，或更新连通分量数
> - 需要反复查询连通性的场景：预处理建好并查集，每次查询 $O(\alpha(n))$，比每次跑 DFS $O(V+E)$ 快很多
> - 只关心"同组/不同组"，不需要具体路径：并查集代码更简洁

---

## 看到什么就先想到这类

| 看到 / 遇到 | 先想到 |
|---|---|
| "是否连通"、"连通分量数" + 边动态加入 | 并查集，`count` 初始化为节点数，每次合并 `count--` |
| "找到成环的那条边" | 遍历边，第一条 `union` 返回 `false` 的即为答案 |
| 二维网格 + 连通块 | 并查集或 DFS，用 `i * cols + j` 转一维索引 |
| 字符串/账户归属同一组 | 建 `Map<String, Integer>` 映射到整数 ID，再用并查集 |
| 先处理等号再验证不等号 | 两轮遍历并查集（LC 990 模式） |
