---
title: Tarjan 强连通分量
---

# Tarjan 强连通分量（SCC）— 检测 Spring 循环依赖的算法

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 中频高分</span>

::: tip 💡 核心要点
**Tarjan = 一次 DFS 找出有向图所有强连通分量**，时间 O(V+E)。**强连通分量（SCC）**：分量内任意两点互相可达。**Spring 循环依赖检测、编译器死代码消除、SQL 优化器、社交网络派系发现**全用它。比 Kosaraju 算法（两次 DFS）更高效，是图论里"看着难、用一次会终身受用"的算法。
:::

## 为什么单独讲它

普通 DFS / BFS 找的是无向图连通性。**有向图**里"互相可达"是更强的条件：

```
有向图：A → B → C → A，D → C
  SCC #1: {A, B, C}  ← 互相可达
  SCC #2: {D}        ← D → C 但 C → D 不通
```

**典型应用场景：**

| 场景 | SCC 干啥 |
|------|------|
| **Spring 循环依赖检测** | Bean 依赖图找环 → SCC 大小 > 1 即有循环依赖 |
| **编译器死代码消除** | 函数调用图的 SCC 是"互相调用"的函数组；不被入口可达的 SCC 整个删 |
| **SQL 优化器（视图展开）** | 视图相互引用的 SCC 必须一起处理 |
| **社交网络派系发现** | 互相关注的用户群 = SCC |
| **2-SAT 问题** | 把布尔逻辑约束变图，SCC 求解 |
| **网页 PageRank 前置处理** | SCC 缩点后变 DAG，加速迭代 |

## 强连通分量定义

**SCC（Strongly Connected Component）**：有向图的最大子图，使其中任意两点 u, v 都有路径 u → v 和 v → u。

**缩点**：把每个 SCC 缩成一个点，得到的图叫**缩点图（Condensation Graph）**——一定是 **DAG（有向无环图）**。这是 SCC 算法的最大价值——把复杂的有向图问题简化成 DAG 问题。

## Tarjan 算法核心三件套

### 1) DFS 时间戳 `dfn[u]`

记录节点 u 被 DFS 第一次访问的时间。

### 2) 追溯值 `low[u]`

`low[u]` = "从 u 出发，沿任意边能回到的**最早 dfn 值**"。
- 初始 `low[u] = dfn[u]`
- 遇到子节点 v 时：
  - v **未访问** → 递归 DFS(v) → `low[u] = min(low[u], low[v])`
  - v **在栈中**（说明 v 是 u 的祖先或同 SCC）→ `low[u] = min(low[u], dfn[v])`

### 3) 栈维护"当前 DFS 路径上的节点"

DFS 进入节点就压栈，发现一个完整 SCC 时弹出。

**判定 SCC 的关键时刻**：DFS 回退时若 `dfn[u] == low[u]`，u 就是该 SCC 的"根"（最早发现的节点），从栈顶弹出直到 u 全部属于这个 SCC。

## 算法过程图解

```
图：1 → 2 → 3 → 1，3 → 4，4 → 5 → 4

DFS 从 1 开始：
   1 入栈, dfn=1, low=1
   2 入栈, dfn=2, low=2
   3 入栈, dfn=3, low=3
      3 → 1：1 在栈中 → low[3] = min(3, dfn[1]=1) = 1
      3 → 4：
        4 入栈, dfn=4, low=4
        5 入栈, dfn=5, low=5
          5 → 4：4 在栈中 → low[5] = min(5, dfn[4]=4) = 4
        回到 4，low[4] = min(low[4], low[5]) = 4
        ★ dfn[4]==low[4]=4 → 弹出 SCC {5, 4}
      回到 3，low[3] = min(low[3], low[4]) = min(1, 4) = 1
   回到 2，low[2] = min(low[2], low[3]) = min(2, 1) = 1
回到 1，low[1] = min(low[1], low[2]) = min(1, 1) = 1
★ dfn[1]==low[1]=1 → 弹出 SCC {3, 2, 1}

结果：两个 SCC：{1, 2, 3} 和 {4, 5}
```

## 完整代码

```java
class Tarjan {
    private final int n;
    private final List<List<Integer>> graph;
    private final int[] dfn;
    private final int[] low;
    private final boolean[] inStack;
    private final Deque<Integer> stack = new ArrayDeque<>();
    private int dfsClock = 0;
    private final List<List<Integer>> sccList = new ArrayList<>();   // 结果

    public Tarjan(int n, List<List<Integer>> graph) {
        this.n = n;
        this.graph = graph;
        this.dfn = new int[n];
        this.low = new int[n];
        this.inStack = new boolean[n];
    }

    public List<List<Integer>> findSCCs() {
        for (int i = 0; i < n; i++) {
            if (dfn[i] == 0) dfs(i);                    // ★ 0 表示未访问
        }
        return sccList;
    }

    private void dfs(int u) {
        dfn[u] = low[u] = ++dfsClock;                   // ★ 时间戳同步初始化
        stack.push(u);
        inStack[u] = true;

        for (int v : graph.get(u)) {
            if (dfn[v] == 0) {                          // 未访问
                dfs(v);
                low[u] = Math.min(low[u], low[v]);
            } else if (inStack[v]) {                    // ★ 关键：只看在栈中的节点（同 DFS 路径）
                low[u] = Math.min(low[u], dfn[v]);
            }
            // 已访问但不在栈：属于其它 SCC，忽略
        }

        if (dfn[u] == low[u]) {                         // ★ u 是 SCC 的根
            List<Integer> scc = new ArrayList<>();
            int v;
            do {
                v = stack.pop();
                inStack[v] = false;
                scc.add(v);
            } while (v != u);
            sccList.add(scc);
        }
    }
}

// 用法
List<List<Integer>> graph = new ArrayList<>();
for (int i = 0; i < 5; i++) graph.add(new ArrayList<>());
graph.get(0).add(1); graph.get(1).add(2); graph.get(2).add(0);
graph.get(2).add(3); graph.get(3).add(4); graph.get(4).add(3);

Tarjan tarjan = new Tarjan(5, graph);
List<List<Integer>> sccs = tarjan.findSCCs();
// 结果：[[4, 3], [2, 1, 0]]（弹栈顺序）
```

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| `inStack[]` 标记忘了维护 | 已弹出的节点又被算进 low，结果错误 | 弹栈时立刻 `inStack[v] = false` |
| 处理 v 时不区分"在栈中"和"已访问" | 把不同 SCC 的节点混算 | 必须 `if (inStack[v])` 才更新 low |
| DFS 递归爆栈（深图） | StackOverflowError | 改迭代版（用显式栈模拟）—— 工业级实现都改成迭代 |
| `dfn` 用 0 表示未访问 | 跟时间戳 0 冲突 | **时间戳从 1 开始**（`++dfsClock`），或者 dfn 初始化为 -1 |
| 找到一个 SCC 不弹完 | 一个 SCC 跨多次 | `do-while` 直到弹出根节点 |
| 多次跑 Tarjan 时没重置状态 | 残留数据导致结果错乱 | 每次 new 一个新对象，或 reset 所有数组 |

## 复杂度

- **时间**：O(V + E)，每个节点和边各访问一次
- **空间**：O(V) — dfn, low, inStack, stack
- **DFS 递归深度**：O(V)，最坏单链图爆栈

## Spring 循环依赖检测实例

Spring 启动时构建 BeanDefinition 依赖图，**Tarjan 找 SCC 大小 > 1 的就是循环依赖**：

```java
// 模拟 Spring 检测
List<List<Integer>> beanGraph = buildDependencyGraph();   // bean → 依赖的 bean
Tarjan tarjan = new Tarjan(beans.size(), beanGraph);
for (List<Integer> scc : tarjan.findSCCs()) {
    if (scc.size() > 1) {
        throw new BeanCreationException(
            "Circular dependency detected: " + scc.stream()
                .map(i -> beanNames[i]).collect(Collectors.toList())
        );
    }
}
```

**实际 Spring** 用三级缓存（earlySingletonObjects）部分支持循环依赖（setter / field 注入可以，构造器注入不行）。检测部分用的就是图遍历 + 路径栈检测 + Tarjan 思想。

## 进阶：缩点 + 拓扑序解决更难问题

很多复杂问题：先 Tarjan 缩点 → 再在缩点图（DAG）上拓扑排序 + DP。

```java
// 步骤
1. Tarjan 找所有 SCC
2. 每个 SCC 编号 sccId[u]
3. 构建缩点图：原图边 (u, v) 若 sccId[u] != sccId[v]，缩点图加边 (sccId[u], sccId[v])
4. 缩点图是 DAG，拓扑序处理
```

**经典题**：洛谷 P2341「受欢迎的牛」、LeetCode 上等价题用 Tarjan 缩点 + 统计出度为 0 的 SCC。

## Tarjan 算法的三兄弟

Tarjan 不止 SCC 一个算法，**Tarjan 大神发明了一整套**：

| 算法 | 用途 | 复杂度 |
|------|------|------|
| **Tarjan SCC** | 强连通分量 | O(V+E) |
| **Tarjan 求割点 / 桥** | 无向图割点 / 关键边 | O(V+E) |
| **Tarjan LCA** | 最近公共祖先（离线） | O((N+Q) α(N)) |
| **Link-Cut Tree** | 动态树问题 | O(log N) 摊销 |

面试常问"Tarjan 是什么"，其实是这一整套算法体系。

## 业界应用

| 系统 | 用法 |
|------|------|
| **Spring Framework** | BeanDefinition 循环依赖检测 |
| **GCC / LLVM** | 函数调用图 SCC → 死代码消除、过程间优化 |
| **PostgreSQL / Oracle** | 视图依赖图 SCC |
| **Make / Bazel** | 构建目标的循环依赖检测 |
| **Kafka Streams** | DAG 拓扑构建前的循环检查 |
| **Linkerd / Istio** | Service Mesh 服务调用图分析（环路 = 设计反模式告警）|
| **网页 PageRank** | 缩点后在 DAG 上迭代，比原图快 |
| **2-SAT 问题** | Codeforces / OI 标配 |

## 面试常问 & 怎么答

### Tarjan 比 Kosaraju 好在哪

- **Kosaraju**：两次 DFS（一次原图、一次反图），逻辑直观
- **Tarjan**：**一次 DFS**，常数小

实现复杂度差不多，但 Tarjan 不需要建反图，节省空间。**生产代码都用 Tarjan**。

### `low[u]` 到底是什么

"u 在 DFS 子树（或同 SCC）中能追溯到的最早 dfn 值"。当 `dfn[u] == low[u]` 时，说明 u 是这个 SCC 中第一个被访问的节点（"根"），u 以及之后压栈的节点构成一个完整 SCC。

### 为什么只对"在栈中"的节点更新 low

栈中节点 = 当前 DFS 路径 + 同 SCC 未弹出的节点。**已弹出的节点属于已发现的别的 SCC，不能合并进来**。如果忽略 `inStack[]` 检查，两个独立 SCC 会被错误地合并。

### Spring 循环依赖怎么处理

Spring 用**三级缓存**：
- `singletonObjects`：已实例化 + 完全初始化的 bean
- `earlySingletonObjects`：已实例化但未完全初始化（露出半成品引用）
- `singletonFactories`：bean 工厂

setter / 字段注入的循环依赖能解，**构造器注入不行**（构造器调用时对方还没实例化）。检测部分用 DFS 路径栈，与 Tarjan 思想一致。

### 实际写代码递归深度怎么办

DFS 深度可能 O(V)，10w 节点爆栈。生产用**迭代版**（用 `Deque` 模拟函数栈），或者跑前 `-Xss10m` 调大线程栈。

## 看到什么就先想到这类

- "有向图找环 / 循环依赖" → Tarjan SCC
- "Spring Bean 循环依赖" → Tarjan + 三级缓存
- "函数调用图死代码消除" → Tarjan SCC + 入口可达性
- "互相关注的用户群" → SCC
- "缩点变 DAG 后做 DP" → Tarjan + 拓扑排序
- "2-SAT 问题" → Tarjan
- "面试问'Tarjan 是什么'" → 一套算法（SCC / 割点 / LCA / Link-Cut Tree），最常考是 SCC
