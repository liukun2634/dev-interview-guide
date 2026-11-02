---
title: 线性与网格 DP
---

# 线性与网格 DP

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
线性 DP 和网格 DP 是最基础的两类 DP。它们的共同特征是：**状态沿着固定方向单调推进**，每个状态只依赖有限个之前的状态。掌握这两类，你就建立了用 DP 思维解决问题的基本直觉。
:::

---

## 第一部分：线性 DP

## 识别信号

当你看到题目具备以下特征时，优先考虑线性 DP：

- 输入是**一维数组或字符串序列**
- 问题要求对序列做**逐位决策**，状态依赖沿位置推进；状态值本身不一定单调
- 状态保存了影响后续选择的必要信息，不必保留到达该状态的完整历史
- 典型问句：最大/最小/方案数，且决策是"选还是不选当前元素"或"从哪个前驱跳过来"

**边界判断**：首尾相邻可能需要分情况处理，例如环形打家劫舍；依赖右侧状态可以从右往左递推，并不因此一定变成区间 DP。真正要检查的是状态之间的依赖和合法计算顺序。

## 通用思考框架

### 状态定义

线性 DP 的状态通常是 `dp[i]`，但同样是"前 i 个元素"，有**两种完全不同的语义**，必须明确区分：

**语义 A：`dp[i]` = 考虑前 i 个元素（可以不选第 i 个）时的最优解**

- 这个定义更"宽松"，第 i 个元素不一定参与最终答案
- 转移时可以选择"不动"：`dp[i] = dp[i-1]`（跳过第 i 个）
- 最终答案直接是 `dp[n]`，不需要遍历所有 i 取最大值
- 适合：打家劫舍。爬楼梯和解码方法也可以按前缀定义状态，但计数的是完整到达或完整解码，不能随意“跳过”元素

**语义 B：`dp[i]` = 以第 i 个元素结尾（必须选第 i 个）时的最优解**

- 这个定义更"严格"，第 i 个元素一定是子序列/子数组的最后一个
- 好处是转移方程更简洁：枚举前驱 j，`dp[i] = max(dp[j] + ...)` for all valid j
- 坏处是答案不是 `dp[n]`，而是 `max(dp[0..n-1])`，因为最优解可能在任意位置结束
- 适合：最大子数组和（Kadane）、最长递增子序列

**如何选择？**

如果题目限制了相邻元素不能都选（如打家劫舍），或者需要"累积"到位置 i 的历史信息，用语义 A。
如果题目问的是"以某元素结尾的最优子结构"（如连续子数组、递增子序列），用语义 B。

### 转移方程

确定了状态定义后，问自己：**站在位置 i，我有哪些决策？每种决策对应从哪个更小的状态转移来？**

线性 DP 常见的决策模型有三种：

**模型一：选或不选当前元素**

```
dp[i] = max(
    dp[i-1],              // 不选第 i 个元素，保持上一个状态
    dp[i-2] + nums[i]     // 选第 i 个元素（跳过 i-1 避免冲突）
)
```

这是打家劫舍的核心逻辑。关键在于：选了第 i 个，上一个只能是 i-2；不选第 i 个，上一个是 i-1。

**模型二：从哪个前驱状态转移**

```
for (int j = 0; j < i; j++) {
    if (condition(j, i)) {
        dp[i] = max(dp[i], dp[j] + value(i));
    }
}
```

枚举所有满足条件的前驱 j，选最优的。这是最长递增子序列（LIS）的思路。时间复杂度通常是 O(n²)，但有时可以用二分优化到 O(n log n)。

**模型三：单步转移（斐波那契型）**

```
dp[i] = dp[i-1] + dp[i-2]   // 爬楼梯：从 i-1 或 i-2 跳一步过来
```

注意：虽然形式相同，但不同题目含义完全不同。转移方程必须配合状态定义才有意义。

### 初始化与边界

初始化是转移方程的"地基"——如果地基错了，整栋楼都塌。

**思考步骤**：

1. 找到最小的合法状态（通常是 `dp[0]` 或 `dp[1]`），手动赋值
2. 检查转移方程在 `i=1` 时是否能正确用到初始值
3. 确认 `dp` 数组的长度：如果下标从 1 开始（`dp[1]` 代表第一个元素），需要 `n+1` 长度

**常见边界陷阱**：

- 打家劫舍：`dp[0]` 和 `dp[1]` 需要特殊处理，因为 `dp[i-2]` 在 i=1 时会越界
- 解码方法：`dp[0] = 1` 表示内部递推的空前缀有一种完成方式；外部空输入是否接受应单独约定，LC 91 的输入为非空字符串

### 遍历顺序

前缀状态依赖较小下标时，从左到右计算；后缀状态依赖较大下标时，从右到左计算。遍历方向来自状态定义，而不是“线性 DP 必须正序”的模板规则。压缩空间前，还要区分依赖的是上一轮旧值还是本轮新值。

### 空间优化

线性 DP 的空间优化通常很简单：**观察转移方程依赖几个历史状态，就保留几个变量**。

| 依赖模式 | 优化方式 |
|---------|---------|
| 只依赖 `dp[i-1]` | 用一个变量 `prev` 滚动 |
| 依赖 `dp[i-1]` 和 `dp[i-2]` | 用两个变量 `prev1`, `prev2` 滚动 |
| 依赖 `dp[0..i-1]` 中满足条件的（如 LIS） | 无法简单压缩，需要辅助数据结构 |

空间从 O(n) 压缩到 O(1) 是面试加分项，但要先确保 O(n) 版本正确，再做优化。

---

## 典型例题：打家劫舍

### 题目描述

[LeetCode 198](https://leetcode.cn/problems/house-robber/) — 给定一个整数数组 `nums`，代表每栋房子的金额。相邻两栋房子不能同时被抢。返回能抢到的最大金额。

**示例**：`nums = [2, 7, 9, 3, 1]`，输出 `12`（抢第 0、2、4 号房子：2+9+1=12）。

### 思考过程（五步法）

**第一步：定义状态**

问自己：到第 i 个房子时，我需要知道什么才能做决策？

答：只需要知道"考虑前 i 个房子时能抢到的最大金额"。用语义 A：

`dp[i]` = 考虑前 i 个房子（下标 0 到 i-1）时能获得的最大金额（不一定抢第 i 个）

> 为什么不用语义 B（以第 i 个结尾）？因为这里的约束是"相邻不能同时选"，是关于前驱的约束，语义 A 能更自然地表达"跳过"这个决策。

**第二步：推导转移方程**

站在第 i 个房子，有两个选择：

- **不抢第 i 个**：和没有这个房子一样，`dp[i] = dp[i-1]`
- **抢第 i 个**：不能抢第 i-1 个，`dp[i] = dp[i-2] + nums[i-1]`（注意下标偏移）

取两者最大值：

$$dp[i] = \max(dp[i-1],\ dp[i-2] + nums[i-1])$$

**第三步：确定初始化**

- `dp[0] = 0`：没有房子，金额为 0
- `dp[1] = nums[0]`：只有一个房子，抢它

**第四步：确定遍历顺序**

`dp[i]` 依赖 `dp[i-1]` 和 `dp[i-2]`，从小到大遍历 `i` 从 2 到 n。

**第五步：确定返回值**

`dp[n]`——前 n 个房子的最优解即为答案。

### 代码实现

```java
public int rob(int[] nums) {
    int n = nums.length;
    if (n == 0) return 0;
    if (n == 1) return nums[0];

    // dp[i] = 考虑前 i 个房子能获得的最大金额
    int[] dp = new int[n + 1];
    dp[0] = 0;
    dp[1] = nums[0];

    for (int i = 2; i <= n; i++) {
        // 不抢第 i 个 vs 抢第 i 个（nums[i-1]，下标从0开始）
        dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i - 1]);
    }

    return dp[n];
}
```

**空间优化版本**（O(1) 空间）：

```java
public int rob(int[] nums) {
    int n = nums.length;
    if (n == 0) return 0;
    if (n == 1) return nums[0];

    int prev2 = 0;       // dp[i-2]
    int prev1 = nums[0]; // dp[i-1]

    for (int i = 2; i <= n; i++) {
        int curr = Math.max(prev1, prev2 + nums[i - 1]);
        prev2 = prev1;
        prev1 = curr;
    }

    return prev1;
}
```

### 复杂度分析

- **时间复杂度**：O(n)，一次线性遍历
- **空间复杂度**：O(n)（原版）/ O(1)（空间优化版）

---

## 典型例题：乘积最大子数组 {#maximum-product}

[LeetCode 152](https://leetcode.cn/problems/maximum-product-subarray/) 要求非空连续子数组的最大乘积。它与最大子数组和的关键区别是：**乘上负数会交换大小关系**，因此只保留最大值会丢掉后续可能变成最优的负数。

### 为什么要同时保存最大与最小

定义 `maxEnding`、`minEnding` 为必须以当前位置结尾的最大、最小乘积。处理 `current` 时有三种来源：从当前元素重新开始、接在旧最大乘积后面、接在旧最小乘积后面。

```text
newMax = max(current, oldMax * current, oldMin * current)
newMin = min(current, oldMax * current, oldMin * current)
answer = max(answer, newMax)
```

以 `[-2, 3, -4]` 为例：

| 当前元素 | 最大结尾乘积 | 最小结尾乘积 | 全局答案 |
|----------|--------------|--------------|----------|
| -2 | -2 | -2 | -2 |
| 3 | 3 | -6 | 3 |
| -4 | 24 | -12 | 24 |

旧的 `-6` 在乘上 `-4` 后变成 24。这里保存最小值不是为了返回最小答案，而是为了让状态对未来选择足够完整。

### Java 实现与边界

输入遵循题目约束：数组非空，相关连续子数组乘积可用 32 位整数表示。若扩展到任意大整数，应改用有明确溢出处理的实现，不能仅将返回值改成 long 就认为所有乘法安全。

```java
public int maxProduct(int[] nums) {
    int maxEnding = nums[0];
    int minEnding = nums[0];
    int best = nums[0];
    for (int index = 1; index < nums.length; index++) {
        int current = nums[index];
        int previousMax = maxEnding;
        int previousMin = minEnding;
        maxEnding = Math.max(current,
                Math.max(previousMax * current, previousMin * current));
        minEnding = Math.min(current,
                Math.min(previousMax * current, previousMin * current));
        best = Math.max(best, maxEnding);
    }
    return best;
}
```

时间 $O(n)$，额外空间 $O(1)$。必须先保存两个旧值再更新；`[-2]` 的答案是 -2，不能把全局答案初始化为 0；遇到 0 时两个结尾状态自然归零，下一项仍可重新开始。用 `[-2, 0, -1]` 可以检查是否错误地把不连续的负数连乘。

## 典型例题：单词拆分 {#word-break}

[LeetCode 139](https://leetcode.cn/problems/word-break/) 给定字符串和词典，判断能否完整拆成词典中的单词，单词可重复使用。例如 `cars` 与 `['car', 'ca', 'rs']` 可以拆成 `ca + rs`；总选最长前缀 `car` 会留下无法处理的 `s`。

### 从最后一个单词倒推

定义 `reachable[end]` 表示前 `end` 个字符能被完整拆分。最后一个单词若是半开区间 `[start, end)`，必须同时满足前缀 `[0, start)` 可拆、这一段属于词典。

`reachable[0] = true` 是空前缀边界；答案是 `reachable[text.length()]`，不能找到一段合法单词就提前返回整个字符串可拆。位置从小到大推进，所有单词非空，因此不会形成位置依赖环。

```java
public boolean wordBreak(String text, List<String> dictionary) {
    Set<String> words = new HashSet<>(dictionary);
    int maxLength = 0;
    for (String word : words) maxLength = Math.max(maxLength, word.length());

    boolean[] reachable = new boolean[text.length() + 1];
    reachable[0] = true;
    for (int end = 1; end <= text.length(); end++) {
        for (int start = Math.max(0, end - maxLength); start < end; start++) {
            if (reachable[start] && words.contains(text.substring(start, end))) {
                reachable[end] = true;
                break;
            }
        }
    }
    return reachable[text.length()];
}
```

需要 `java.util` 中的 List、Set、HashSet。空串扩展返回 true；词典为空时，非空字符串返回 false。实现按 Java UTF-16 下标处理，适用于原题字符范围。

### 复杂度不能漏掉 substring

设最长词长为 $L$，最多检查 $O(nL)$ 个候选；Java 的 substring 复制和首次字符串哈希还需要与候选长度成正比的时间，因此这里预期时间上界为 $O(nL^2)$，另计词典构建。额外空间包含 $O(n)$ 状态、词典和临时子串。

可用 Trie 沿合法前缀扫描，减少重复复制与哈希。但应先把“合法切分点”的 DP 讲清楚，再讨论字符串匹配优化。若要求输出一种拆分，首次置 true 时记录 `parent[end] = start`，随后从末尾回溯；若要求输出全部拆分，输出规模本身可能指数增长。

## 延伸题目

| 题目 | 链接 | 与典型题的区别 | 关键技巧 |
|------|------|--------------|---------|
| 爬楼梯 | [LC 70](https://leetcode.cn/problems/climbing-stairs/) | 最基础线性 DP，两个前驱 | 可压缩为两变量 |
| 打家劫舍 II | [LC 213](https://leetcode.cn/problems/house-robber-ii/) | 环形 → 拆成两个线性子问题 | 分两次 DP：[0, n-2] 和 [1, n-1]，取较大值 |
| 最大子数组和 | [LC 53](https://leetcode.cn/problems/maximum-subarray/) | dp[i] 定义变化：必须以 i 结尾 | Kadane 算法，`dp[i] = max(nums[i], dp[i-1] + nums[i])` |
| 解码方法 | [LC 91](https://leetcode.cn/problems/decode-ways/) | 条件转移，需要判断合法性 | 单字符解码：`nums[i] != '0'`；双字符解码：`10 ≤ val ≤ 26` |
| 跳跃游戏 | [LC 55](https://leetcode.cn/problems/jump-game/) | 可行性 DP | 维护最远可达位置，若当前位置 > 最远则不可达 |
| 跳跃游戏 II | [LC 45](https://leetcode.cn/problems/jump-game-ii/) | 最优化：最少跳跃次数 | 贪心更优：每次在当前覆盖范围内选跳得最远的位置 |

---

## 常见陷阱与调试（线性 DP）

| 陷阱 | 症状 | 解决方法 |
|------|------|---------|
| 混淆语义 A 和语义 B | 答案比正确值小，或最后要多加一个 `max` 遍历 | 重新用自然语言写下 `dp[i]` 的含义，对照样例手算 2-3 个值 |
| 初始化时下标偏移出错 | `dp[1]` 赋的是 `nums[1]` 而不是 `nums[0]` | 画出 dp 数组下标与 nums 下标的对应关系 |
| 空间优化后更新顺序错误 | 用新值覆盖了还需要的旧值 | 先算 `curr`，再更新 `prev2 = prev1`，最后 `prev1 = curr` |
| 环形问题未拆分 | 直接对环形数组做线性 DP，首尾同时被选 | 拆成两个子问题：不含最后一个元素，不含第一个元素 |

---

---

## 第二部分：网格 DP

## 识别信号

当你看到题目具备以下特征时，考虑网格 DP：

- 输入是**二维矩阵**，需要在网格上移动
- 只允许向**有限方向移动**（通常是向右或向下，或从某个方向来）
- 求从起点到终点的**最优路径值**或**路径方案数**
- 典型问句：最小代价路径、有多少条不同路径

**边界判断**：四向自由移动可能产生环，普通路径递推不能直接套用；但若移动要求数值严格增大，依赖图仍然无环，例如矩阵最长递增路径可以使用记忆化搜索。关键是依赖是否有可求解的顺序，而不是几何方向是否单一。

## 通用思考框架

### 状态定义

网格 DP 的状态定义几乎是固定的：

`dp[i][j]` = 到达坐标 (i, j) 时的最优解（最小代价 / 最大收益 / 方案数）

这里没有"以 (i,j) 结尾"和"前 i 行 j 列"的歧义，因为路径本身就是从 (0,0) 出发到 (i,j) 的。

**例外**：地下城游戏（LC 174）需要反向 DP——因为需要知道"到达终点时恰好满足条件"，信息从终点流向起点更自然。

### 转移方程

只能向右和向下移动时，到达 (i,j) 只有两种来路：

$$dp[i][j] = f\bigl(dp[i-1][j],\ dp[i][j-1]\bigr)$$

其中 $f$ 根据题意是 $\min$ / $\max$ / $+$。

**最小路径和**：

$$dp[i][j] = \min(dp[i-1][j], dp[i][j-1]) + grid[i][j]$$

**不同路径（计数）**：$dp[i][j] = dp[i-1][j] + dp[i][j-1]$

**关键**：如果有障碍物，障碍格强制 `dp[i][j] = 0`（计数型）或 `dp[i][j] = Integer.MAX_VALUE`（最优型），跳过正常的转移逻辑。

### 初始化与边界

网格 DP 的初始化比线性 DP 复杂，需要处理**第一行和第一列**：

- **第一行**（`i = 0`）：只能从左边来，`dp[0][j]` 只依赖 `dp[0][j-1]`
- **第一列**（`j = 0`）：只能从上边来，`dp[i][0]` 只依赖 `dp[i-1][0]`

初始化过程实际上是：先手动填好第一行和第一列，再用双层循环填其余格子。

**有障碍物时**：初始化第一行/第一列时，遇到障碍物后面的格子全部无法到达（不能绕过去），要小心"障碍之后的格子"不能被初始化为非零值。

### 遍历顺序

两层循环，外层行从上到下（i 从小到大），内层列从左到右（j 从小到大）。这样计算 `dp[i][j]` 时，`dp[i-1][j]`（上方）和 `dp[i][j-1]`（左方）都已经算好。

**反向 DP**（如地下城游戏）：从右下角到左上角遍历，外层行从大到小，内层列从大到小。

### 空间优化

二维 DP 可以压缩到一维：因为 `dp[i][j]` 只依赖"上一行相同列"和"当前行前一列"，用一个长度为 `n`（列数）的一维数组滚动即可。

```java
// 原来：dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grid[i][j]
// 优化后：dp[j] = min(dp[j], dp[j-1]) + grid[i][j]
//   dp[j]（未更新前）代表上一行的 dp[i-1][j]
//   dp[j-1]（已更新）代表当前行的 dp[i][j-1]
```

注意更新顺序是从左到右，这样 `dp[j-1]` 已经是当前行的值，`dp[j]` 还是上一行的值，恰好符合转移方程的需求。

---

## 典型例题：最小路径和

### 题目描述

[LeetCode 64](https://leetcode.cn/problems/minimum-path-sum/) — 给定一个 m × n 的非负整数网格，找一条从左上角到右下角的路径，使得路径上所有数字之和最小。每次只能向右或向下移动。

**示例**：
```
grid = [[1,3,1],
        [1,5,1],
        [4,2,1]]
```
输出 `7`，路径为 1 → 3 → 1 → 1 → 1。

### 思考过程（五步法）

**第一步：定义状态**

到达 (i,j) 时，我只关心到达这里的最小代价，历史路径不重要（无后效性）。

`dp[i][j]` = 从 (0,0) 到 (i,j) 的路径最小数字和

**第二步：推导转移方程**

到达 (i,j) 只有两种方式：从上方 (i-1,j) 向下，或从左方 (i,j-1) 向右。

$$dp[i][j] = \min(dp[i-1][j],\ dp[i][j-1]) + grid[i][j]$$

**第三步：确定初始化**

- 起点：`dp[0][0] = grid[0][0]`
- 第一行：只能从左边来，`dp[0][j] = dp[0][j-1] + grid[0][j]`
- 第一列：只能从上边来，`dp[i][0] = dp[i-1][0] + grid[i][0]`

**第四步：确定遍历顺序**

外层 i 从 1 到 m-1，内层 j 从 1 到 n-1。

**第五步：确定返回值**

`dp[m-1][n-1]`，即到达右下角的最小路径和。

### 代码实现

```java
public int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dp = new int[m][n];

    // 起点
    dp[0][0] = grid[0][0];

    // 第一列：只能从上方来
    for (int i = 1; i < m; i++) {
        dp[i][0] = dp[i - 1][0] + grid[i][0];
    }

    // 第一行：只能从左方来
    for (int j = 1; j < n; j++) {
        dp[0][j] = dp[0][j - 1] + grid[0][j];
    }

    // 其余格子
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1]) + grid[i][j];
        }
    }

    return dp[m - 1][n - 1];
}
```

**空间优化版本**（O(n) 空间）：

```java
public int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[] dp = new int[n];

    dp[0] = grid[0][0];
    for (int j = 1; j < n; j++) {
        dp[j] = dp[j - 1] + grid[0][j]; // 初始化第一行
    }

    for (int i = 1; i < m; i++) {
        dp[0] += grid[i][0]; // 每行第一列只能从上方来
        for (int j = 1; j < n; j++) {
            // dp[j] 此时还是上一行的值（即 dp[i-1][j]）
            // dp[j-1] 已经是当前行的值（即 dp[i][j-1]）
            dp[j] = Math.min(dp[j], dp[j - 1]) + grid[i][j];
        }
    }

    return dp[n - 1];
}
```

### 复杂度分析

- **时间复杂度**：O(m × n)，填满整个 dp 表
- **空间复杂度**：O(m × n)（原版）/ O(n)（空间优化版）

---

## 典型例题：最大正方形 {#maximal-square}

[LeetCode 221](https://leetcode.cn/problems/maximal-square/) 要求 0/1 矩阵中最大全 1 正方形的面积。这里的状态不是“到达格子的路径”，而是 **以该格子为右下角的正方形最大边长**。

### 为什么是三个邻居的最小值

当前格子为 0 时边长为 0；为 1 时，要扩成边长 `side + 1`，上方、左方、左上方三个已有正方形都至少具有边长 side，才能覆盖新的整个区域。

```text
side[row][column] = 0                                      当前为 0
side[row][column] = 1 + min(上方, 左方, 左上方)              当前为 1
```

取 max 会把某一方向的连续长度误当成一个完整面积。例如矩阵 `[[1,0],[1,1]]` 中，右下角虽然左方和左上方都有 1，上方的 0 仍使最大边长只能为 1。

### 滚动数组保留旧对角线

`dp[column]` 更新前是上方，`dp[column - 1]` 已经是本行左方；左上方需要额外变量 `diagonal` 保存。每行开始时它重置为 0，处理完一格后再把旧上方值交给下一格。

```java
public int maximalSquare(char[][] matrix) {
    if (matrix.length == 0 || matrix[0].length == 0) return 0;
    int columns = matrix[0].length;
    int[] dp = new int[columns + 1];
    int bestSide = 0;
    for (char[] row : matrix) {
        int diagonal = 0;
        for (int column = 1; column <= columns; column++) {
            int upper = dp[column];
            if (row[column - 1] == '1') {
                dp[column] = 1 + Math.min(diagonal,
                        Math.min(upper, dp[column - 1]));
                bestSide = Math.max(bestSide, dp[column]);
            } else {
                dp[column] = 0;
            }
            diagonal = upper;
        }
    }
    return bestSide * bestSide;
}
```

输入为矩形矩阵，元素为 `'0'` 或 `'1'`，面积落在 int 范围内。时间 $O(mn)$，空间 $O(n)$。答案是最大边长的平方，不是右下角那个状态；遇到 0 必须清零，不能继承上一行的正方形。

## 典型例题：地下城游戏 {#dungeon-game}

[LeetCode 174](https://leetcode.cn/problems/dungeon-game/) 中，人物只能向右或下走，进入格子后生命值增加或减少，整个过程必须始终至少为 1，求最小初始生命值。

### 为什么最大路径和不够

同样的最终收益可能对应完全不同的最低生命值。例如矩阵 `[[1,-10,20],[0,0,0]]` 中，上方路线总收益更大，但中途需要扛过 -10；沿下方路线却只需初始生命值 1。只保存路径总和会丢掉途中最低值的限制。

换成反向状态：`need[row][column]` 表示**进入该格子之前**至少需要多少生命，才能从此处到终点且始终存活。

```text
后继最低要求 = min(右侧 need, 下方 need)
当前最低要求 = max(1, 后继最低要求 - 当前格子增益)
终点最低要求 = max(1, 1 - 终点增益)
```

外面的 max 保证“进入格子前”也存活；当前格子提供大量补给时，初始生命不能因此变成 0 或负数。

```java
public int calculateMinimumHP(int[][] dungeon) {
    int rows = dungeon.length;
    int columns = dungeon[0].length;
    int[] need = new int[columns + 1];
    Arrays.fill(need, Integer.MAX_VALUE / 4);
    need[columns - 1] = 1;

    for (int row = rows - 1; row >= 0; row--) {
        for (int column = columns - 1; column >= 0; column--) {
            int next = Math.min(need[column], need[column + 1]);
            need[column] = Math.max(1, next - dungeon[row][column]);
        }
    }
    return need[0];
}
```

需要 `java.util.Arrays`；输入遵循 LC 174 的非空矩形及数值范围，预留的 INF 大于任何合法需求。时间 $O(mn)$，空间 $O(n)$。这里从右下往左上计算，不能照搬最小路径和的正向循环。

单格 `[-5]` 需要 6，单格 `[10]` 需要 1；经典矩阵 `[[-2,-3,3],[-5,-10,1],[10,30,-5]]` 的答案为 7。可以枚举小矩阵所有路径，用“1 减去最低前缀和”得到参考答案，对拍反向 DP。

## 延伸题目

| 题目 | 链接 | 与典型题的区别 | 关键技巧 |
|------|------|--------------|---------|
| 不同路径 | [LC 62](https://leetcode.cn/problems/unique-paths/) | 计数型而非最优型 | `dp[i][j] = dp[i-1][j] + dp[i][j-1]`，第一行第一列全为 1 |
| 不同路径 II | [LC 63](https://leetcode.cn/problems/unique-paths-ii/) | 有障碍物 | 障碍格强制 `dp[i][j] = 0`，且第一行/列遇障碍后续均为 0 |
| 地下城游戏 | [LC 174](https://leetcode.cn/problems/dungeon-game/) | 反向 DP | 从终点往起点推，`dp[i][j]` = 在 (i,j) 出发需要的最小初始血量 |
| 最大正方形 | [LC 221](https://leetcode.cn/problems/maximal-square/) | dp[i][j] 含义不同 | `dp[i][j]` = 以 (i,j) 为右下角的最大全 1 正方形的边长；转移：`min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1` |

---

## 常见陷阱与调试（网格 DP）

| 陷阱 | 症状 | 解决方法 |
|------|------|---------|
| 忘记初始化第一行/第一列 | dp 表第一行或第一列全为 0，最终答案偏小 | 独立循环初始化第一行和第一列，再进双层循环 |
| 障碍物后的第一行/列未置 0 | 有障碍物的题结果偏大（绕过了实际不可通行的路） | 第一行/列遇到障碍后，后续格子全部设为不可达值并 break |
| 空间优化更新顺序错误 | `dp[j-1]` 用了上一行的值而不是当前行 | 一维压缩时，j 必须从左到右遍历，保证 `dp[j-1]` 先更新 |
| 反向 DP 边界条件搞错 | 终点格子初始化有误，导致整体偏移 | 先确定终点的 `dp[m-1][n-1]`，再推最后一行/列，最后推其余格子 |
