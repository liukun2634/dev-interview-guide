---
title: 博弈 DP
---

# 博弈 DP

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--medium">🔥 中频</span>

::: tip 💡 核心要点
博弈 DP 的本质是 MinMax 思想：轮到我时取净收益最大的选择，轮到对手时对手同样最优——用 `dp[i][j]` 表示先手在区间 `[i,j]` 上的净收益（先手得分 − 后手得分），即可统一两个玩家的最优行为。
:::

---

## 识别信号

- **两个玩家轮流操作**，双方都采取最优策略（没有随机性）
- 题目问的是**先手是否必赢**，或**先手与后手的最大得分差**
- 关键词：博弈、轮流取、最优策略、先手必胜/后手必胜
- 典型场景：从数组两端轮流取数、Nim 取石子、棋盘类两人对弈

---

## 通用思考框架

### MinMax 核心思想

> 轮到我（先手）时，我选择让自己**净收益最大**的操作；轮到对手时，对手同样最优，因此对手也会让他自己的净收益最大——这等价于让**我的净收益最小**。

将两个玩家的行为统一到一个量上，可以避免分别维护两个人的得分数组。

### 状态定义常见模式

**模式一：净收益（推荐）**

$$
dp[i][j] = \text{在区间 } [i,j] \text{ 中，先手能获得的最大净收益（先手得分} - \text{后手得分）}
$$

转移方程（以区间两端取数为例）：

$$
dp[i][j] = \max\bigl(\text{nums}[i] - dp[i+1][j],\; \text{nums}[j] - dp[i][j-1]\bigr)
$$

**解释：**
- 取左端 $\text{nums}[i]$：接下来对手在 $[i+1, j]$ 上先手，对手的净收益是 $dp[i+1][j]$，所以**我的净收益** $= \text{nums}[i] - dp[i+1][j]$
- 取右端 $\text{nums}[j]$：类似地，**我的净收益** $= \text{nums}[j] - dp[i][j-1]$
- 我取两种情况中较大的那个

**判断先手是否获胜：**
$$
dp[0][n-1] \geq 0 \implies \text{先手必赢（或平局）}
$$

**模式二：分别定义先手/后手得分（适合某些变体）**

$$
\text{first}[i][j] = \text{在区间 } [i,j] \text{ 中先手的最优得分}
$$
$$
\text{second}[i][j] = \text{在区间 } [i,j] \text{ 中后手的最优得分}
$$

两者满足：$\text{first}[i][j] + \text{second}[i][j] = \sum_{k=i}^{j} \text{nums}[k]$，因此净收益模式本质上等价。

### 区间 DP 遍历顺序

博弈 DP 通常是**区间 DP**，必须按**区间长度从小到大**枚举，确保计算 $dp[i][j]$ 时 $dp[i+1][j]$ 和 $dp[i][j-1]$ 已经就绪。

```
for (int len = 1; len <= n; len++) {
    for (int i = 0; i + len - 1 < n; i++) {
        int j = i + len - 1;
        // 计算 dp[i][j]
    }
}
```

### Sprague-Grundy 定理简介（Nim 游戏）

对于 **Nim 游戏**及一类组合游戏，有更直接的数学结论：

- 每个局面有一个 **Grundy 值**（也叫 nimber）
- 多个**独立子游戏**组合时，总 Grundy 值 $= $ 各子游戏 Grundy 值的**异或**
- 若总 Grundy 值 $= 0$，后手必赢；否则先手必赢

**标准 Nim 游戏**（多堆石子，每次从一堆取任意数量）：

$$
\text{先手必赢} \iff \text{nums}[0] \oplus \text{nums}[1] \oplus \cdots \oplus \text{nums}[n-1] \neq 0
$$

这类题目直接用数学结论，**不需要 DP**。

---

## 典型例题：预测赢家 [LeetCode 486](https://leetcode.cn/problems/predict-the-winner/)

### 题目描述

给你一个整数数组 `nums`。玩家 1 和玩家 2 轮流从数组**两端**取数，取完后该数从数组中移除。两人都采取最优策略。若玩家 1 能获得**大于等于**玩家 2 的分数，返回 `true`，否则返回 `false`。

**示例：**
- `nums = [1, 5, 2]` → `false`（玩家 2 必赢）
- `nums = [1, 5, 233, 7]` → `true`（玩家 1 能赢）

---

### 五步法

**第一步：定义状态**

$$
dp[i][j] = \text{在子数组 nums}[i..j] \text{ 中，先手能获得的最大净收益（先手得分} - \text{后手得分）}
$$

最终答案：`dp[0][n-1] >= 0` 时玩家 1 获胜。

**第二步：状态转移**

先手可以取左端或右端：

$$
dp[i][j] = \max\!\bigl(\text{nums}[i] - dp[i+1][j],\;\text{nums}[j] - dp[i][j-1]\bigr)
$$

**第三步：初始化**

当 $i = j$ 时，区间只有一个元素，先手直接取走，净收益就是该元素本身：

$$
dp[i][i] = \text{nums}[i]
$$

**第四步：遍历顺序**

区间长度从 1 到 $n$，外层枚举长度，内层枚举起点。

**第五步：提取答案**

`dp[0][n-1] >= 0`

---

### Java 代码

```java
class Solution {
    public boolean predictTheWinner(int[] nums) {
        int n = nums.length;
        // dp[i][j] = 在 nums[i..j] 中先手能获得的最大净收益
        int[][] dp = new int[n][n];

        // 初始化：区间长度为 1
        for (int i = 0; i < n; i++) {
            dp[i][i] = nums[i];
        }

        // 按区间长度从小到大枚举
        for (int len = 2; len <= n; len++) {
            for (int i = 0; i + len - 1 < n; i++) {
                int j = i + len - 1;
                // 取左端 nums[i]：对手在 [i+1,j] 先手，净收益 dp[i+1][j]
                // 取右端 nums[j]：对手在 [i,j-1] 先手，净收益 dp[i][j-1]
                dp[i][j] = Math.max(
                    nums[i] - dp[i + 1][j],
                    nums[j] - dp[i][j - 1]
                );
            }
        }

        // 先手净收益 >= 0 说明玩家 1 得分 >= 玩家 2
        return dp[0][n - 1] >= 0;
    }
}
```

**复杂度分析：**
- 时间复杂度：$O(n^2)$，需要填满二维 DP 表
- 空间复杂度：$O(n^2)$，存储二维 DP 表（可用滚动数组优化至 $O(n)$）

---

### 干跑验证

以 `nums = [1, 5, 2]` 为例：

| $dp[i][j]$ | $j=0$ | $j=1$ | $j=2$ |
|:-----------:|:-----:|:-----:|:-----:|
| $i=0$       |   1   |  -4   |   2   |
| $i=1$       |   —   |   5   |   3   |
| $i=2$       |   —   |   —   |   2   |

- $dp[0][1] = \max(1 - dp[1][1], 5 - dp[0][0]) = \max(1-5, 5-1) = \max(-4, 4) = 4$

  等等，重新算：$\max(\text{nums}[0] - dp[1][1], \text{nums}[1] - dp[0][0]) = \max(1-5, 5-1) = \max(-4, 4) = 4$

  实际 $dp[0][1] = 4$（先手取 5，净收益 4）

- $dp[1][2] = \max(5 - dp[2][2], 2 - dp[1][1]) = \max(5-2, 2-5) = \max(3, -3) = 3$

- $dp[0][2] = \max(\text{nums}[0] - dp[1][2], \text{nums}[2] - dp[0][1]) = \max(1-3, 2-4) = \max(-2, -2) = -2$

$dp[0][2] = -2 < 0$，返回 `false`，玩家 1 输，与预期一致。

---

## 前后手例题：石子游戏 III [LeetCode 1406](https://leetcode.cn/problems/stone-game-iii/)

上一题从**两端**取，本题从**前端**顺序取，且每次可取 1~3 堆，是"前后手轮流从头部拿"的经典模型，最终需要判断先手（Alice）与后手（Bob）谁的总分更高。

### 题目描述

有 `n` 堆石子排成一列，`stoneValue[i]` 为第 `i` 堆的价值（可为负）。Alice 先手、Bob 后手轮流从**最前面**取 1、2 或 3 堆。两人都最优。返回 `"Alice"`、`"Bob"` 或 `"Tie"`。

**示例：** `stoneValue = [1, 2, 3, 7]` → `"Bob"`（Alice 无论怎么取，Bob 都能赢）

---

### 五步法

**第一步：定义状态**

因为只从前端取，一维即可。用**后缀净收益**统一前后手：

$$
dp[i] = \text{仅剩 stoneValue}[i..n-1] \text{ 时，当前先手能获得的最大净收益（先手} - \text{后手）}
$$

**第二步：状态转移**

当前先手取前 `k`（`k=1,2,3`）堆，拿到这 `k` 堆之和 `sum`，随后对手在 `stoneValue[i+k..]` 上成为新的先手，其净收益是 $dp[i+k]$，故我的净收益是 $sum - dp[i+k]$：

$$
dp[i] = \max_{1 \le k \le 3,\; i+k \le n} \left( \sum_{t=i}^{i+k-1} \text{stoneValue}[t] - dp[i+k] \right)
$$

**第三步：初始化**

$dp[n] = 0$（没有石子，净收益为 0）。

**第四步：遍历顺序**

`i` 从 `n-1` 倒推到 `0`（因为 $dp[i]$ 依赖后面的 $dp[i+k]$）。

**第五步：提取答案**

$dp[0] > 0$ → Alice，$< 0$ → Bob，$= 0$ → Tie。

---

### Java 代码

```java
class Solution {
    public String stoneGameIII(int[] stoneValue) {
        int n = stoneValue.length;
        // dp[i] = 剩 stoneValue[i..n-1] 时先手的最大净收益
        int[] dp = new int[n + 1];

        for (int i = n - 1; i >= 0; i--) {
            int sum = 0;
            dp[i] = Integer.MIN_VALUE;
            // 当前先手取前 k 堆（k = 1,2,3）
            for (int k = 1; k <= 3 && i + k <= n; k++) {
                sum += stoneValue[i + k - 1];
                // 取完这 k 堆，对手在 [i+k..] 先手，其净收益 dp[i+k]
                dp[i] = Math.max(dp[i], sum - dp[i + k]);
            }
        }

        if (dp[0] > 0) return "Alice";
        if (dp[0] < 0) return "Bob";
        return "Tie";
    }
}
```

**复杂度分析：**
- 时间复杂度：$O(n)$，每个状态最多枚举 3 种取法
- 空间复杂度：$O(n)$，可用 3 个滚动变量优化到 $O(1)$

---

### 干跑验证

以 `stoneValue = [1, 2, 3, 7]`（$n=4$）为例，$dp[4]=0$：

| $i$ | 可取组合（sum − dp[i+k]） | $dp[i]$ |
|:---:|:---|:---:|
| 3 | $7-dp[4]=7$ | 7 |
| 2 | $3-dp[3]=-4$，$5-dp[4]=5$ | 5 |
| 1 | $2-dp[2]=-3$，$5-dp[3]=-2$，$12-dp[4]=12$ | 12 |
| 0 | $1-dp[1]=-11$，$3-dp[2]=-2$，$6-dp[3]=-1$ | -1 |

$dp[0] = -1 < 0$ → 返回 `"Bob"`，与预期一致。

::: tip 🔑 前后手对比
- **两端取（486/877）**：状态是二维区间 `dp[i][j]`，先手可选左右两端。
- **前端取（1406）**：状态是一维后缀 `dp[i]`，先手只能从头连续取若干堆。
- 二者转移公式形态一致：`我的净收益 = 我拿到的分 − 对手接手后的净收益`，这正是前后手博弈 DP 的统一核心。
:::

---

## 延伸题目

| 题目 | 链接 | 难度 | 关键思路 |
|------|------|------|----------|
| 石子游戏 | [LC 877](https://leetcode.cn/problems/stone-game/) | 中等 | 与 486 相同框架；数学上先手必赢（数组长度为偶数） |
| 我能赢吗 | [LC 464](https://leetcode.cn/problems/can-i-win/) | 中等 | 状态压缩 + 博弈记忆化，`dp[mask]` 表示当前可用数字集合下先手是否必赢 |
| Nim 游戏 | [LC 292](https://leetcode.cn/problems/nim-game/) | 简单 | 纯数学结论：$n \% 4 \neq 0$ 先手必赢，无需 DP |
| 石子游戏 II | [LC 1140](https://leetcode.cn/problems/stone-game-ii/) | 中等 | `dp[i][m]` 表示从第 `i` 堆开始、当前 `M=m` 时先手的最大得分，加入后缀和优化 |
| 石子游戏 III | [LC 1406](https://leetcode.cn/problems/stone-game-iii/) | 困难 | `dp[i]` 表示从第 `i` 堆开始先手的最大净收益，每次可取 1~3 堆 |

---

## 常见陷阱与调试

**陷阱一：混淆"先手得分"与"净收益"**

如果用 `dp[i][j]` 表示先手的**绝对得分**（而非净收益），转移时需要同时维护后手得分，逻辑更繁琐且容易出错。推荐始终使用**净收益**定义，统一两个玩家的行为。

**陷阱二：忽视对手也是最优策略**

不能假设对手会犯错或随机选择。净收益公式中，取 $\text{nums}[i]$ 后对手得到 $dp[i+1][j]$ 的净收益，我的净收益是 $\text{nums}[i] - dp[i+1][j]$，这正是"对手最优"的体现。

**陷阱三：区间 DP 遍历顺序错误**

必须**按区间长度从小到大**枚举。若按左端点 `i` 从大到小枚举，则计算 `dp[i][j]` 时 `dp[i][j-1]` 可能还未计算（因为 `j-1 > i` 时 `dp[i][j-1]` 对应的左端点仍是 `i`，但长度更小，需先算）。

错误写法：
```java
// 错误：按 i 从大到小，j 从小到大，遍历顺序不保证依赖已算
for (int i = n - 1; i >= 0; i--) {
    for (int j = i; j < n; j++) {
        // dp[i][j-1] 可能已算，但 dp[i+1][j] 依赖 i+1 > i，此时已算 ✓
        // 实际上按 i 从大到小也可以，但初学者易混淆，推荐按长度枚举
    }
}
```

推荐写法（按长度枚举，语义最清晰）：
```java
for (int len = 2; len <= n; len++) {
    for (int i = 0; i + len - 1 < n; i++) {
        int j = i + len - 1;
        dp[i][j] = Math.max(nums[i] - dp[i + 1][j], nums[j] - dp[i][j - 1]);
    }
}
```

**陷阱四：Nim 游戏误用 DP**

LC 292（Nim 游戏）只有一堆石子，每次取 1~3 个，直接用 $n \% 4 \neq 0$ 判断，不需要也不应该写 DP。遇到 Nim 类题目，先判断是否有数学结论。

**陷阱五：状压博弈忘记记忆化**

LC 464（我能赢吗）的状态空间是 $2^{20}$，必须用 `Map<Integer, Boolean>` 或 `Boolean[]` 数组做记忆化，否则朴素递归会超时。
