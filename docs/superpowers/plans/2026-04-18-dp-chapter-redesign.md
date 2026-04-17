# DP Chapter Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the entire Dynamic Programming chapter (7 files) with framework-first pedagogy, Java code, and one detailed example per type plus extended problem tables.

**Architecture:** Replace all existing DP markdown files with 7 new ones following a unified structure. Update VitePress sidebar config. Delete `classic-problems.md`.

**Tech Stack:** VitePress, Markdown, Java code blocks

**Spec:** `docs/superpowers/specs/2026-04-18-dp-chapter-redesign.md`

---

## File Structure

All files under `docs/data-structures-and-algorithms/dynamic-programming/`:

| File | Action | Responsibility |
|------|--------|----------------|
| `index.md` | Rewrite | DP 总论与解题方法论 |
| `linear-dp.md` | Rewrite | 线性 DP + 网格 DP |
| `knapsack-dp.md` | Create | 背包 DP |
| `sequence-dp.md` | Create | 序列与回文 DP |
| `interval-and-state-machine-dp.md` | Create | 区间 DP + 状态机 DP |
| `tree-dp.md` | Rewrite | 树形 DP |
| `advanced-dp.md` | Create | 状压 DP + 计数 DP |
| `classic-problems.md` | Delete | Content redistributed |
| `state-compression-dp.md` | Delete | Replaced by advanced-dp.md |
| `interval-dp.md` | Delete | Replaced by interval-and-state-machine-dp.md |

Also modify: `docs/.vitepress/config.ts` (sidebar)

## Formatting Conventions (from existing files)

- Frontmatter: `---\ntitle: 标题\n---`
- H1 repeats title
- Tags line: `<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>`
- Tip boxes: `::: tip 💡 核心要点\n...\n:::`
- Code blocks: ` ```java `
- Extended problem tables use standard markdown tables
- LeetCode links format: `[LeetCode 198](https://leetcode.cn/problems/house-robber/)`

## Unified Per-File Structure

Each file (except index.md) follows:

```
---
title: [标题]
---

# [标题]

<tags>

::: tip 核心要点
...
:::

## 识别信号

## 通用思考框架
### 状态定义
### 转移方程
### 初始化与边界
### 遍历顺序
### 空间优化

## 典型例题：[题名]
### 题目描述
### 思考过程
### 代码实现
### 复杂度分析

## 延伸题目

| 题目 | 链接 | 与典型题的区别 | 关键技巧 |

## 常见陷阱与调试
```

---

### Task 1: Write `index.md` — DP 总论与解题方法论

**Files:**
- Rewrite: `docs/data-structures-and-algorithms/dynamic-programming/index.md`

- [ ] **Step 1: Write index.md**

Write the complete `index.md` with the following content (rewrite, not edit — the old file is short and completely different in structure):

```markdown
---
title: 动态规划
---

# 动态规划

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--hot">🔥 核心章节</span>

::: tip 💡 核心要点
动态规划的核心不是背公式，而是学会一套**通用的思考流程**：面对任何 DP 题，都能从状态定义出发，一步步推出转移方程、初始化、遍历顺序和返回值。掌握这个流程，比刷 100 道题更有用。
:::

## 什么是动态规划

动态规划（Dynamic Programming, DP）的本质是：**把一个大问题拆成若干重叠的子问题，每个子问题只计算一次，把结果存起来复用。**

### 与贪心的区别

贪心算法在每一步做局部最优选择，一旦选了就不回头。DP 则考虑所有子问题的最优组合——当前的最优选择可能依赖于"如果我之前做了不同的选择，现在会怎样"。

**判断标准**：如果你能证明局部最优一定导致全局最优，用贪心；否则用 DP。

### 与分治的区别

分治也是把问题拆成子问题，但分治的子问题**互不重叠**（如归并排序的左右两半）。DP 的子问题**大量重叠**（如斐波那契的 f(3) 被算了无数次）。

### 两个前提条件

一个问题能用 DP 解，必须同时满足：

1. **重叠子问题**：不同的递归分支会反复计算相同的子问题
2. **最优子结构**：大问题的最优解可以由子问题的最优解推导出来

## 如何识别 DP 题

面试中拿到一道题，以下信号提示你可能需要 DP：

| 题目问的是 | DP 类型 | 例子 |
|-----------|---------|------|
| 最大/最小/最长/最短 | 最优化 DP | 最长递增子序列、最小路径和 |
| 有多少种方式/方案 | 计数 DP | 爬楼梯、零钱兑换 II |
| 是否可能/能否达到 | 可行性 DP | 分割等和子集、跳跃游戏 |

**验证方法**：尝试写出暴力递归，画递归树。如果发现大量重复节点 → 确认是 DP。

## 解题五步法

这是整个 DP 章节最核心的方法论。面对任何 DP 题，都按这五步走：

### 第一步：定义状态

> 用一句自然语言说清楚 `dp[i]`（或 `dp[i][j]`）**到底代表什么**。

这是最关键的一步，状态定义错了，后面全错。

**思考技巧**：问自己"我需要知道哪些信息，才能做出当前位置的决策？"这些信息就是状态的维度。

- 如果只需要知道"到第 i 个位置为止"的信息 → 一维 `dp[i]`
- 如果还需要知道"剩余容量"或"到第 j 个字符为止" → 二维 `dp[i][j]`
- 如果还有"当前处于第 k 种状态" → 三维 `dp[i][j][k]`

**常见陷阱**：`dp[i]` 表示"前 i 个元素的最优解"和"以第 i 个元素结尾的最优解"是完全不同的定义，会导致完全不同的转移方程。

### 第二步：推导转移方程

> 问自己：`dp[i]` 可以从哪些更小的状态得到？做了什么**决策**？

转移方程就是把"决策"翻译成代码。

**思考方法**：站在第 i 个位置，思考"我有哪些选择"：
- 选或不选当前元素 → `dp[i] = max(dp[i-2] + nums[i], dp[i-1])`
- 从哪个前驱转移过来 → `dp[i] = min(dp[j] + cost) for all valid j`
- 匹配或不匹配 → `dp[i][j]` 根据 `s[i] == t[j]` 分两种情况

### 第三步：确定初始化

> 找到最小的、不能再拆分的子问题，直接赋值。

初始化就是转移方程的"递归基"。

**常见模式**：
- `dp[0] = 0` 或 `dp[0] = 1`（空集/起点）
- `dp[0][j] = ...`, `dp[i][0] = ...`（第一行/第一列）
- 全部初始化为 `Integer.MAX_VALUE` 或 `Integer.MIN_VALUE`（求最小/最大值时）

**关键问题**：`dp` 数组长度是 `n` 还是 `n + 1`？这取决于你的状态定义是从 0 开始还是从 1 开始。

### 第四步：确定遍历顺序

> 原则：计算 `dp[i]` 时，它依赖的所有状态必须已经算好。

从转移方程的依赖关系反推遍历方向：
- 依赖 `dp[i-1]` → 从小到大遍历
- 依赖 `dp[i+1]` → 从大到小遍历
- 依赖 `dp[i-1][j-1]` → 两层循环都从小到大
- 0/1 背包一维优化 → 容量从大到小（防止同一物品被重复使用）

### 第五步：确定返回值

返回值不一定是 `dp[n]`：
- 如果 `dp[i]` 定义为"前 i 个元素的最优解" → 返回 `dp[n]`
- 如果 `dp[i]` 定义为"以第 i 个元素结尾的最优解" → 返回 `max(dp[0..n-1])`
- 双串 DP → 通常返回 `dp[m][n]`

### 用爬楼梯演示五步法

以 [LeetCode 70 - 爬楼梯](https://leetcode.cn/problems/climbing-stairs/) 为例，完整走一遍：

**题目**：每次可以爬 1 或 2 个台阶，问爬到第 n 阶有多少种方法。

**第一步：定义状态**
`dp[i]` = 爬到第 i 阶的方法数。

**第二步：转移方程**
到第 i 阶，要么从第 i-1 阶爬 1 步，要么从第 i-2 阶爬 2 步：
$$dp[i] = dp[i-1] + dp[i-2]$$

**第三步：初始化**
`dp[0] = 1`（站在地面，1 种方式），`dp[1] = 1`（爬 1 阶只有 1 种方式）。

**第四步：遍历顺序**
`dp[i]` 依赖 `dp[i-1]` 和 `dp[i-2]`，从小到大遍历。

**第五步：返回值**
`dp[n]`。

```java
public int climbStairs(int n) {
    if (n <= 1) return 1;
    int[] dp = new int[n + 1];
    dp[0] = 1;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}
```

## 自顶向下 vs 自底向上

DP 有两种实现方式，本质相同，形式不同：

### 记忆化递归（自顶向下）

从大问题出发，递归拆解，用数组或哈希表缓存已计算的子问题。

```java
public int climbStairs(int n) {
    int[] memo = new int[n + 1];
    Arrays.fill(memo, -1);
    return dfs(n, memo);
}

private int dfs(int n, int[] memo) {
    if (n <= 1) return 1;
    if (memo[n] != -1) return memo[n];
    memo[n] = dfs(n - 1, memo) + dfs(n - 2, memo);
    return memo[n];
}
```

**优点**：思路自然（先想大问题怎么拆），只计算需要的子问题。
**缺点**：递归栈开销，不方便做空间优化。

### 递推表（自底向上）

从最小子问题出发，逐步填表，直到算出目标。

**优点**：没有递归栈开销，方便做空间优化。
**缺点**：需要想清楚遍历顺序，可能计算不需要的子问题。

**面试建议**：先用记忆化递归理清思路，确认状态和转移没问题后，再改写成递推表。

## 空间优化技巧

### 观察依赖范围

空间优化的核心是观察转移方程依赖了多少历史状态：

| 依赖范围 | 优化方式 | 例子 |
|---------|---------|------|
| 只依赖前 1-2 个状态 | 用 2-3 个变量滚动 | 爬楼梯、斐波那契 |
| 只依赖上一行 | 两行数组交替 | 网格路径、LCS |
| 二维依赖整列 | 一维数组 + 遍历方向控制 | 0/1 背包 |

### 一维压缩的遍历方向

当把二维 DP 压缩到一维时，遍历方向至关重要：
- **0/1 背包**：容量倒序遍历（保证每件物品只用一次）
- **完全背包**：容量正序遍历（允许重复使用）

### 何时不做空间优化

如果题目要求输出具体方案（路径、操作序列），需要回溯 dp 表 → 保留完整的二维表。

## 常见错误与调试方法

| 错误 | 症状 | 调试方法 |
|------|------|---------|
| 状态定义模糊 | 转移方程写不出来，或写出来但结果不对 | 打印 dp 表，检查每个值是否符合你的自然语言定义 |
| 初始化遗漏 | dp 表前几个值就不对 | 手算前 3-5 个值，与 dp 表对照 |
| 遍历顺序错误 | 用到了还没算好的状态，结果偏小或偏大 | 在转移前打印依赖的状态，确认它们已更新 |
| Off-by-one | 数组越界或最后一个状态没算到 | 明确 dp 数组长度是 n 还是 n+1，画图确认下标范围 |

## DP 题型全景图

掌握了五步法之后，接下来按题型深入。每种类型有自己的状态定义套路和转移模式，但五步法的思考流程是通用的。

| 类型 | 核心特征 | 详细页面 |
|------|---------|---------|
| 线性 DP + 网格 DP | 状态沿一维/二维线性推进 | [线性与网格 DP](./linear-dp) |
| 背包 DP | 物品 + 容量限制 + 选择决策 | [背包 DP](./knapsack-dp) |
| 序列与回文 DP | 字符串匹配、子序列、回文结构 | [序列与回文 DP](./sequence-dp) |
| 区间 DP + 状态机 DP | 区间合并分割 / 多状态转移 | [区间与状态机 DP](./interval-and-state-machine-dp) |
| 树形 DP | 子树信息汇聚到父节点 | [树形 DP](./tree-dp) |
| 状压 DP + 计数 DP | 集合位掩码 / 方案计数 | [状压与计数 DP](./advanced-dp) |
```

- [ ] **Step 2: Commit**

```bash
git add docs/data-structures-and-algorithms/dynamic-programming/index.md
git commit -m "docs: rewrite DP index with comprehensive methodology guide"
```

---

### Task 2: Write `linear-dp.md` — 线性 DP + 网格 DP

**Files:**
- Rewrite: `docs/data-structures-and-algorithms/dynamic-programming/linear-dp.md`

- [ ] **Step 1: Write linear-dp.md**

Write the complete file following the unified structure. Key content:

**线性 DP section:**
- 识别信号：一维数组/序列，每个位置做决策，答案随位置线性推进
- 通用框架详细展开：
  - 状态定义：`dp[i]` = 考虑到第 i 个元素时的最优解/方案数。强调"前 i 个" vs "以 i 结尾"的区别
  - 转移方程：依赖 `dp[i-1]` 或 `dp[i-1], dp[i-2]` 或 `dp[0..i-1]` 中满足条件的
  - 决策模型：选或不选当前元素
  - 空间优化：大多可压缩到 O(1) 或 O(k)
- 典型例题：打家劫舍 LC 198 完整讲解（五步法演示 + Java 代码）
- 延伸题目表：LC 70, LC 213, LC 53, LC 91, LC 55/45

**网格 DP section:**
- 识别信号：二维矩阵上从某点到某点
- 通用框架：`dp[i][j]` 来自上方和左方，第一行/列初始化，障碍物处理，反向 DP
- 典型例题：最小路径和 LC 64 完整讲解
- 延伸题目表：LC 62/63, LC 174, LC 221

- [ ] **Step 2: Commit**

```bash
git add docs/data-structures-and-algorithms/dynamic-programming/linear-dp.md
git commit -m "docs: rewrite linear DP with framework-first approach"
```

---

### Task 3: Write `knapsack-dp.md` — 背包 DP

**Files:**
- Create: `docs/data-structures-and-algorithms/dynamic-programming/knapsack-dp.md`

- [ ] **Step 1: Write knapsack-dp.md**

Key content:
- 识别信号：一组物品 + 容量限制 + 求最优/计数/可行性
- 通用框架详细展开：
  - 0/1 背包模板：状态、转移、**为什么一维时倒序遍历**（画图说明）
  - 完全背包模板：与 0/1 的唯一区别（正序），**为什么正序允许重复选取**
  - 如何判断 0/1 vs 完全：物品能否重复使用
  - 三种问法的转移差异：最优化用 max/min，计数用 +=，可行性用 ||
  - 多重背包与分组背包简述
- 典型例题：分割等和子集 LC 416 完整讲解（从"这题为什么是背包"开始引导思考）
- 延伸题目表：LC 494, LC 322, LC 518, LC 474, 多重/分组背包

- [ ] **Step 2: Commit**

```bash
git add docs/data-structures-and-algorithms/dynamic-programming/knapsack-dp.md
git commit -m "docs: add knapsack DP chapter"
```

---

### Task 4: Write `sequence-dp.md` — 序列与回文 DP

**Files:**
- Create: `docs/data-structures-and-algorithms/dynamic-programming/sequence-dp.md`

- [ ] **Step 1: Write sequence-dp.md**

Key content:

**子序列/双串 DP section:**
- 识别信号：两个字符串/数组的匹配、比较、变换
- 通用框架：
  - 单串 `dp[i]` vs 双串 `dp[i][j]` 的状态设计
  - 转移推导核心逻辑：**看最后一个元素的匹配情况**，匹配从对角线来，不匹配从上方/左方来
  - "子序列"可以不连续 vs "子数组"必须连续 → 转移方程差异
  - 路径回溯技巧
- 典型例题：编辑距离 LC 72 完整讲解（三种操作 → 三个转移方向）
- 延伸题目表：LC 300, LC 1143, LC 115, LC 718

**回文 DP section:**
- 识别信号：回文相关
- 通用框架：
  - 两种状态定义（是否回文 / 最长回文长度）
  - 转移核心：从两端收缩，看 s[i] 和 s[j]
  - 遍历顺序：长度从短到长
  - 与中心扩展法的对比
- 典型例题：最长回文子序列 LC 516 完整讲解
- 延伸题目表：LC 5, LC 132

- [ ] **Step 2: Commit**

```bash
git add docs/data-structures-and-algorithms/dynamic-programming/sequence-dp.md
git commit -m "docs: add sequence and palindrome DP chapter"
```

---

### Task 5: Write `interval-and-state-machine-dp.md` — 区间 DP + 状态机 DP

**Files:**
- Create: `docs/data-structures-and-algorithms/dynamic-programming/interval-and-state-machine-dp.md`

- [ ] **Step 1: Write interval-and-state-machine-dp.md**

Key content:

**区间 DP section:**
- 识别信号：答案与一个区间相关，大区间由小区间合并/分割
- 通用框架：
  - 状态 `dp[l][r]` = 区间 [l,r] 的最优解
  - 转移核心：**枚举分割点 k**，或者思考"最后一次操作"
  - 遍历顺序：**区间长度从小到大**
  - 初始化：长度为 1 的区间
  - 复杂度通常 O(n³)
- 典型例题：戳气球 LC 312 完整讲解（"最后一次操作"逆向思维）
- 延伸题目表：石子合并, LC 1039

**状态机 DP section:**
- 识别信号：每个时刻处于某个状态，状态间有转移规则
- 通用框架：
  - 核心方法：**先画状态转移图**（节点=状态，边=合法转移，边上标代价）
  - 状态定义 `dp[i][s]` = 第 i 天处于状态 s 的最优解
  - 建模技巧：把约束（冷冻期、次数、手续费）建模为状态维度或转移代价
  - 股票系列的统一框架：持有/不持有 + 额外维度
- 典型例题：买卖股票含冷冻期 LC 309 完整讲解（三状态转移图）
- 延伸题目表：LC 121, LC 122, LC 123, LC 188, LC 714

- [ ] **Step 2: Commit**

```bash
git add docs/data-structures-and-algorithms/dynamic-programming/interval-and-state-machine-dp.md
git commit -m "docs: add interval and state machine DP chapter"
```

---

### Task 6: Write `tree-dp.md` — 树形 DP

**Files:**
- Rewrite: `docs/data-structures-and-algorithms/dynamic-programming/tree-dp.md`

- [ ] **Step 1: Write tree-dp.md**

Key content:
- 识别信号：在树结构上求最优/计数，答案依赖子树信息
- 通用框架：
  - 核心思维：**后序遍历 + 从子节点向父节点汇聚信息**
  - 状态定义思路：问自己"当前节点需要向父节点汇报什么信息？"→ 这就是状态
  - 转移：当前节点 dp 值 = f(左子 dp, 右子 dp)
  - **返回值 vs 全局答案的区分**：返回给父节点的值 ≠ 最终答案（路径和问题）
  - 实现：递归函数返回状态数组
- 典型例题：打家劫舍 III LC 337 完整讲解（选/不选 + 后序遍历）
- 延伸题目表：LC 124, LC 543, LC 968

- [ ] **Step 2: Commit**

```bash
git add docs/data-structures-and-algorithms/dynamic-programming/tree-dp.md
git commit -m "docs: rewrite tree DP with framework-first approach"
```

---

### Task 7: Write `advanced-dp.md` — 状压 DP + 计数 DP

**Files:**
- Create: `docs/data-structures-and-algorithms/dynamic-programming/advanced-dp.md`

- [ ] **Step 1: Write advanced-dp.md**

Key content:

**状压 DP section:**
- 识别信号：n ≤ 20，需追踪"哪些元素已被选过"
- 通用框架：
  - 用 n 位二进制整数表示集合，位运算操作详解
  - 状态 `dp[mask]` 或 `dp[mask][i]`
  - 转移：枚举下一个元素
  - 常用位运算速查表
  - 复杂度 O(2ⁿ × n)，n > 20 不适用
- 典型例题：最短 Hamilton 路径完整讲解
- 延伸题目表：LC 473, LC 526

**计数 DP section:**
- 识别信号：求方案数、组合数
- 通用框架：
  - 与最优化 DP 的区别：转移用 += 而非 max/min
  - **组合 vs 排列**：外层物品 → 组合（LC 518），外层容量 → 排列（LC 377）
  - 初始化 `dp[0] = 1`
  - 避免重复计数的枚举顺序
- 典型例题：不同的二叉搜索树 LC 96 完整讲解（Catalan 数）
- 延伸题目表：LC 279, LC 377, LC 343

- [ ] **Step 2: Commit**

```bash
git add docs/data-structures-and-algorithms/dynamic-programming/advanced-dp.md
git commit -m "docs: add state compression and counting DP chapter"
```

---

### Task 8: Delete old files and update sidebar

**Files:**
- Delete: `docs/data-structures-and-algorithms/dynamic-programming/classic-problems.md`
- Delete: `docs/data-structures-and-algorithms/dynamic-programming/state-compression-dp.md`
- Delete: `docs/data-structures-and-algorithms/dynamic-programming/interval-dp.md`
- Modify: `docs/.vitepress/config.ts` (sidebar section around lines 114-123)

- [ ] **Step 1: Delete old files**

```bash
git rm docs/data-structures-and-algorithms/dynamic-programming/classic-problems.md
git rm docs/data-structures-and-algorithms/dynamic-programming/state-compression-dp.md
git rm docs/data-structures-and-algorithms/dynamic-programming/interval-dp.md
```

- [ ] **Step 2: Update sidebar config**

In `docs/.vitepress/config.ts`, replace the dynamic programming sidebar section (around lines 114-123):

Old:
```typescript
{
  text: '动态规划',
  collapsed: false,
  items: [
    { text: '概念与处理', link: '/data-structures-and-algorithms/dynamic-programming/' },
    { text: '线性 DP', link: '/data-structures-and-algorithms/dynamic-programming/linear-dp' },
    { text: '区间 DP', link: '/data-structures-and-algorithms/dynamic-programming/interval-dp' },
    { text: '树形 DP', link: '/data-structures-and-algorithms/dynamic-programming/tree-dp' },
    { text: '状态压缩 DP', link: '/data-structures-and-algorithms/dynamic-programming/state-compression-dp' },
    { text: '典型动态规划问题', link: '/data-structures-and-algorithms/dynamic-programming/classic-problems' },
  ],
},
```

New:
```typescript
{
  text: '动态规划',
  collapsed: false,
  items: [
    { text: 'DP 总论与解题方法论', link: '/data-structures-and-algorithms/dynamic-programming/' },
    { text: '线性与网格 DP', link: '/data-structures-and-algorithms/dynamic-programming/linear-dp' },
    { text: '背包 DP', link: '/data-structures-and-algorithms/dynamic-programming/knapsack-dp' },
    { text: '序列与回文 DP', link: '/data-structures-and-algorithms/dynamic-programming/sequence-dp' },
    { text: '区间与状态机 DP', link: '/data-structures-and-algorithms/dynamic-programming/interval-and-state-machine-dp' },
    { text: '树形 DP', link: '/data-structures-and-algorithms/dynamic-programming/tree-dp' },
    { text: '状压与计数 DP', link: '/data-structures-and-algorithms/dynamic-programming/advanced-dp' },
  ],
},
```

- [ ] **Step 3: Commit**

```bash
git add -A docs/data-structures-and-algorithms/dynamic-programming/
git add docs/.vitepress/config.ts
git commit -m "docs: remove old DP files and update sidebar for new chapter structure"
```

---

### Task 9: Verify site builds and all links work

- [ ] **Step 1: Run dev server and verify**

```bash
npm run docs:dev
```

Check that:
1. All 7 DP pages render correctly
2. Sidebar shows new structure
3. Internal links between pages work (index.md → each sub-page)
4. Code blocks render with Java syntax highlighting
5. No broken links from deleted files

- [ ] **Step 2: Fix any issues found**

- [ ] **Step 3: Final commit if fixes needed**

```bash
git add -A
git commit -m "docs: fix DP chapter rendering issues"
```
