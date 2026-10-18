---
title: Tarjan 强连通分量
---

# Tarjan 强连通分量（SCC）与依赖图分析

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 中频高分</span>

::: tip 💡 核心要点
**Tarjan 用一次 DFS 找出有向图所有强连通分量**，时间 O(V+E)。关键不是背 low 的更新语句，而是区分 DFS 递归栈与“尚未归属分量”的 SCC 栈。依赖分析、递归调用分组、2-SAT 都可以使用 SCC；应用模型不等于某个框架必然采用 Tarjan 实现。
:::

## 为什么单独讲它

普通 DFS / BFS 可以用于有向图和无向图，但一次搜索只能直接告诉我们从起点能到达谁；**有向图**里“互相可达”是更强的条件：

```
有向图：A → B → C → A，D → C
  SCC #1: {A, B, C}  ← 互相可达
  SCC #2: {D}        ← D → C 但 C → D 不通
```

**典型应用场景：**

| 场景 | SCC 干啥 |
|------|------|
| **Bean 依赖图分析** | 多节点 SCC 或带自环的单节点 SCC 表示循环，不代表 Spring 源码的检测方式 |
| **编译器死代码消除** | 函数调用图的 SCC 是"互相调用"的函数组；不被入口可达的 SCC 整个删 |
| **SQL 优化器（视图展开）** | 视图相互引用的 SCC 必须一起处理 |
| **社交网络派系发现** | 互相关注的用户群 = SCC |
| **2-SAT 问题** | 把布尔逻辑约束变图，SCC 求解 |
| **网页 PageRank 前置处理** | SCC 缩点后变 DAG，加速迭代 |

## 强连通分量定义

**SCC（Strongly Connected Component）**：有向图中按包含关系极大的互相可达节点集合。“极大”表示不能再加入其他节点而仍保持互相可达，不是只找节点数最多的那一个分量。

**缩点**：把每个 SCC 缩成一个点，得到的图叫**缩点图（Condensation Graph）**——一定是 **DAG（有向无环图）**。这是 SCC 算法的最大价值——把复杂的有向图问题简化成 DAG 问题。

## Tarjan 算法核心三件套

### 1) DFS 时间戳 `dfn[u]`

记录节点 u 被 DFS 第一次访问的时间。

### 2) 追溯值 `low[u]`

对本页这套递推，`low[u]` 汇总：从 u 沿 DFS 树边下降零条或多条，再至多经过一条指向 SCC 栈内已访问节点的非树边，能够取得的最小发现时间；也包含 `dfn[u]` 本身。它**不是沿任意路径可达的最小时间戳**。
- 初始 `low[u] = dfn[u]`
- 遇到子节点 v 时：
  - v **未访问** → 递归 DFS(v) → `low[u] = min(low[u], low[v])`
    - v **已访问且仍在 SCC 栈中** → `low[u] = min(low[u], dfn[v])`
    - v 已经出 SCC 栈 → 它的分量已完成，忽略这条边

### 3) SCC 栈维护“尚未归属分量的节点”

DFS 进入节点就压入 SCC 栈，但函数返回时不一定弹出。递归栈记录尚未返回的函数调用，SCC 栈记录已经发现但尚未确定分量的节点。两者生命周期不同，`inStack` 不能用“是否仍在递归路径上”代替。

**判定 SCC 的关键时刻**：DFS 回退时若 `dfn[u] == low[u]`，u 就是该 SCC 的"根"（最早发现的节点），从栈顶弹出直到 u 全部属于这个 SCC。

### 一个能区分两种栈的反例

图为 `A->B, B->C, C->A, A->D, D->B`，从 A 出发先访问 B，再访问 D：

| 时刻 | 递归栈（调用顺序） | SCC 栈（入栈顺序） | 关键更新 |
|------|-------------------|--------------------|----------|
| C 发现回边 C->A | `A,B,C` | `A,B,C` | `low[C]=dfn[A]=1` |
| B 返回，开始访问 D | `A,D` | `A,B,C,D` | B、C 尚未归属分量 |
| D 遇到 D->B | `A,D` | `A,B,C,D` | B 在 SCC 栈中，`low[D]=dfn[B]=2` |
| A 回退 | `A` | `A,B,C,D` | A 为根，统一弹出四个节点 |

D 实际能经过 B、C 到 A，但 `low[D]` 是 2，不是 1。这同时说明：low 不是任意可达性的最小值；同一 SCC 的 low 也未必相等。树孩子通过 `low[child]` 汇总整个子树，已访问栈内邻居则直接使用 `dfn[neighbor]`，两种情况不应混写。

为什么 `low[u]==dfn[u]` 时能弹栈？此时 u 的所有出边与 DFS 子树已经处理完，尚未弹出的子树节点不能追溯到比 u 更早的未完成节点，u 就是这一组的最早发现点。若缩点图还有环，环上的各分量会互相可达，本应属于一个 SCC，因此缩点结果必为 DAG。

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
            } else if (inStack[v]) {
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
| DFS 递归爆栈（深图） | StackOverflowError | 深度不可控时，用显式调用栈模拟递归，与 SCC 栈分别维护 |
| `dfn` 用 0 表示未访问 | 跟时间戳 0 冲突 | **时间戳从 1 开始**（`++dfsClock`），或者 dfn 初始化为 -1 |
| 找到一个 SCC 不弹完 | 一个 SCC 跨多次 | `do-while` 直到弹出根节点 |
| 多次跑 Tarjan 时没重置状态 | 残留数据导致结果错乱 | 每次 new 一个新对象，或 reset 所有数组 |

## 复杂度

- **时间**：O(V + E)，每个节点和边各访问一次
- **空间**：O(V) — dfn, low, inStack, stack
- **DFS 递归深度**：O(V)，最坏单链图爆栈

## 依赖图循环检测实例

下面是对**已知完整依赖图**的教学分析工具，不是 Spring 启动流程的源码复刻。除了多节点 SCC，单节点也可能有 `A->A` 自环：

```java
public boolean hasDirectedCycle(List<List<Integer>> graph) {
    Tarjan tarjan = new Tarjan(graph.size(), graph);
    for (List<Integer> component : tarjan.findSCCs()) {
        if (component.size() > 1) return true;
        int vertex = component.get(0);
        if (graph.get(vertex).contains(vertex)) return true;
    }
    return false;
}
```

若只判断是否存在环，DFS 三色标记或 Kahn 拓扑排序就足够；需要返回所有相互依赖的组时，SCC 才更合适。Spring 的循环创建检查与单例提前暴露需要按具体版本、作用域和配置看源码，不能由这段模拟推断它使用 Tarjan。

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

## 应用建模

| 系统 | 用法 |
|------|------|
| **Bean 依赖分析工具** | 对完整依赖图分组；与框架创建期检查区分 |
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

两者都是 O(V+E)。Tarjan 不需要反图，Kosaraju 则把步骤拆得更直观；是否更快取决于实现、图存储与常数，不能说生产代码都使用某一种。

### `low[u]` 到底是什么

按本页定义，沿树边下降，再至多走一条到栈内已访问节点的非树边，取得的最小发现时间。当 `dfn[u]==low[u]` 时，从当前 SCC 栈顶到 u 构成一个完整分量；已弹出的分量不包括在内。

### 为什么只对"在栈中"的节点更新 low

SCC 栈中的节点尚未归属分量，可能已经不在递归路径上。已弹出的节点属于已完成的分量，不能再拿它的时间戳更新当前节点的 low，否则会破坏当前分量的根判定。

### Spring 循环依赖怎么处理

Spring 用**三级缓存**：
- `singletonObjects`：已实例化 + 完全初始化的 bean
- `earlySingletonObjects`：已实例化但未完全初始化（露出半成品引用）
- `singletonFactories`：bean 工厂

在允许循环引用等条件下，某些单例 setter / 字段注入循环可通过提前暴露引用处理；构造器循环通常无法这样解决。这是对象创建机制问题，不应等同于 Tarjan 的 SCC 栈；SCC 可用于另建工具分析依赖图。

### 实际写代码递归深度怎么办

DFS 深度可能 O(V)，10w 节点爆栈。生产用**迭代版**（用 `Deque` 模拟函数栈），或者跑前 `-Xss10m` 调大线程栈。

## 看到什么就先想到这类

- "有向图找环 / 循环依赖" → Tarjan SCC
- "Bean 依赖图相互依赖分组" → SCC；创建期循环引用处理另看框架机制
- "函数调用图死代码消除" → Tarjan SCC + 入口可达性
- "互相关注的用户群" → SCC
- "缩点变 DAG 后做 DP" → Tarjan + 拓扑排序
- "2-SAT 问题" → Tarjan
- "面试问'Tarjan 是什么'" → 一套算法（SCC / 割点 / LCA / Link-Cut Tree），最常考是 SCC
