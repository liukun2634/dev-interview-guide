---
title: 树形 DP
---

# 树形 DP

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
树形 DP = **后序遍历 + 状态从子节点向父节点汇聚**。关键在于：
1. 明确每个节点需要向父节点"汇报"什么信息（定义返回状态）
2. 区分"返回给父节点的值"与"全局最优答案"——两者往往不同
3. 递归函数返回数组/元组，而非单一值
:::

## 识别信号

遇到以下场景时，优先考虑树形 DP：

- 在树结构上求最优解（最大/最小值）或计数，且答案依赖子树信息
- 题目中出现"相邻节点不能同时选取"、"路径经过某节点"等约束
- 需要综合左右子树的结果来得到当前节点的状态

## 通用思考框架

### 核心思维

> **后序遍历 + 从子节点向父节点汇聚信息**

先递归处理左右子树，拿到子树返回的状态，再计算当前节点的状态，最终返回给父节点。整个过程就是一棵树的后序遍历（左 → 右 → 根）。

### 状态定义思路

关键问题：**"对于当前节点，我需要向父节点汇报什么信息？"** —— 这个信息就是状态。

常见模式：

| 模式 | 状态含义 | 适用场景 |
|------|---------|---------|
| 选 / 不选（两状态） | `dp[0]` = 选当前节点的最优值；`dp[1]` = 不选当前节点的最优值 | 相邻节点有冲突约束（如打家劫舍） |
| 单一度量值 | 当前子树的某种最优度量（如最大深度、最长路径单边） | 路径类问题（如最大路径和） |
| 多状态枚举 | 节点处于多种状态之一（如：有相机/被覆盖/未覆盖） | 覆盖/监控类问题 |

### 转移方程

通用形式：**当前节点的状态 = f(左子节点状态, 右子节点状态, 当前节点值)**

以"选/不选"两状态为例：

$$
\text{selected}[v] = \text{val}[v] + \text{notSelected}[\text{left}] + \text{notSelected}[\text{right}]
$$

$$
\text{notSelected}[v] = \max(\text{selected}[\text{left}], \text{notSelected}[\text{left}]) + \max(\text{selected}[\text{right}], \text{notSelected}[\text{right}])
$$

合并子状态的一般逻辑：
- 若选当前节点 → 子节点**不能选**
- 若不选当前节点 → 子节点**可选可不选**，取较优

### 返回值 vs 全局答案（关键区分！）

这是树形 DP 最容易出错的地方：

**返回给父节点的值 ≠ 最终答案**

以"二叉树最大路径和"为例说明：
- **dfs 返回值**：经过当前节点、向**单侧**延伸的最大路径和（父节点只能从一个方向接入）
- **全局答案**：路径可以在当前节点"拐弯"，即 `左单边 + 当前节点值 + 右单边`

如果把"拐弯路径"作为返回值传给父节点，父节点就无法再向上延伸了，导致答案错误。

**技巧**：使用全局变量（或包装对象）在遍历过程中随时更新最终答案，dfs 函数只负责返回"父节点能使用的局部值"。

```
dfs(node) 返回：能向父节点提供的最优单边路径
全局变量：在 dfs 中，每次计算"以当前节点为拐点"的路径，更新全局最大值
```

### 实现模式

递归函数返回状态数组（或元组），数组下标对应不同状态：

```java
// 通用模板：两状态（选/不选）
int[] dfs(TreeNode node) {
    if (node == null) return new int[]{0, 0}; // base case：空节点两种状态均为 0

    int[] left = dfs(node.left);   // 后序：先处理子树
    int[] right = dfs(node.right);

    int selected    = node.val + left[1] + right[1];                             // 选当前节点
    int notSelected = Math.max(left[0], left[1]) + Math.max(right[0], right[1]); // 不选

    return new int[]{selected, notSelected}; // index 0 = 选, index 1 = 不选
}
```

## 典型例题：打家劫舍 III

[LeetCode 337 - 打家劫舍 III](https://leetcode.cn/problems/house-robber-iii/)

**题意**：在二叉树形结构的房屋中偷窃，直接相连的房屋不能同时被盗，求最大金额。

### 五步法分析

**1. 状态定义**

对每个节点定义两个值，返回给父节点：
- `dp[0]`：**选（偷）当前节点**时，以当前节点为根的子树能获得的最大金额
- `dp[1]`：**不选（不偷）当前节点**时，以当前节点为根的子树能获得的最大金额

**2. 转移方程**

$$
dp[0] = \text{node.val} + \text{left}[1] + \text{right}[1]
$$

$$
dp[1] = \max(\text{left}[0], \text{left}[1]) + \max(\text{right}[0], \text{right}[1])
$$

- 偷当前节点：左右子节点均不能偷
- 不偷当前节点：左右子节点各自取最优

**3. 初始化（base case）**

叶节点的空子树：`null` 节点返回 `[0, 0]`（偷或不偷均为 0）

**4. 遍历顺序**

后序遍历（先处理子树，再计算当前节点）

**5. 返回值**

`max(root[0], root[1])`——根节点偷或不偷取较大值

### Java 实现

```java
class Solution {
    public int rob(TreeNode root) {
        int[] result = dfs(root);
        return Math.max(result[0], result[1]);
    }

    // 返回 int[]{rob, notRob}
    // rob    = 偷当前节点时子树最大收益
    // notRob = 不偷当前节点时子树最大收益
    private int[] dfs(TreeNode node) {
        if (node == null) {
            return new int[]{0, 0};
        }

        int[] left  = dfs(node.left);
        int[] right = dfs(node.right);

        // 偷当前节点：子节点不能偷
        int rob    = node.val + left[1] + right[1];
        // 不偷当前节点：子节点取各自最优
        int notRob = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);

        return new int[]{rob, notRob};
    }
}
```

### 复杂度分析

- **时间复杂度**：$O(n)$，每个节点恰好访问一次
- **空间复杂度**：$O(h)$，递归栈深度，$h$ 为树高；最坏情况（链状树）$O(n)$

## 延伸题目

| 题目 | 链接 | 与典型题的区别 | 关键技巧 |
|------|------|--------------|---------|
| 二叉树最大路径和 | [LC 124](https://leetcode.cn/problems/binary-tree-maximum-path-sum/) | 返回值（单边）vs 全局答案（可拐弯） | dfs 返回单边最大，全局变量记录经过当前节点的最大路径（左单边 + 节点值 + 右单边） |
| 二叉树直径 | [LC 543](https://leetcode.cn/problems/diameter-of-binary-tree/) | 与 LC 124 类似，但计边数而非节点值 | dfs 返回深度，全局记录 `leftDepth + rightDepth` |
| 监控二叉树 | [LC 968](https://leetcode.cn/problems/binary-tree-cameras/) | 三状态 DP | 节点状态：有相机 / 被覆盖 / 未覆盖；后序遍历贪心 + 树形 DP |

## 常见陷阱与调试

**1. 只定义一个状态，实际需要两个**

- 错误表现：偷/不偷问题只用一个 `maxRob` 返回，父节点无法知道当前节点是否被偷
- 修正：返回数组 `[选, 不选]` 两个值

**2. 把"全局答案"当"返回值"传给父节点**

- 错误表现：在路径和问题中，把可以拐弯的路径值向上传递，父节点无法再延伸
- 修正：dfs 只返回单边（父节点可用的值），拐弯路径用全局变量单独记录

**3. 忘记 null 节点的 base case**

- 错误表现：访问 `node.val` 时空指针异常
- 修正：函数第一行处理 `if (node == null) return new int[]{0, 0};`（状态值视题意设为 0 或 Integer.MIN_VALUE）

**4. 空子树的状态值设置错误**

- 对于"最大值"类问题，null 节点的"不选"通常为 0
- 对于"路径和"类问题（含负数），null 节点的单边贡献应为 0（不是 `Integer.MIN_VALUE`），避免负数路径被强制选入
- 修正原则：base case 的返回值要与转移方程的语义保持一致
