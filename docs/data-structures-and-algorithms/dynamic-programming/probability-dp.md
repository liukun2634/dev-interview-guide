---
title: 概率与期望 DP
---

# 概率与期望 DP

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--low">💧 低频</span>

::: tip 💡 核心要点
概率 DP 计算事件发生的概率，期望 DP 计算随机代价的平均值。**推进方向由状态含义和依赖决定**：到达概率常从起点传播，未来成功概率与剩余期望常从后继递推；有环时还要处理联立方程，而不是仅靠交换循环方向。
:::

---

## 识别信号

- 题目涉及随机事件、概率分布或期望值计算
- 关键词出现：**概率**、**期望**、**随机**、**骰子**、**均匀分布**、**随机游走**
- 求某个事件发生的概率（如"棋子最终留在棋盘上的概率"）
- 求从初始状态到达目标状态的期望步数、期望代价或期望轮数
- 状态之间的转移带有概率权重，而非确定性跳转

---

## 通用思考框架

### 到达概率（正向传播）

$dp[i]$ 表示到达状态 $i$ 的概率，从初始状态出发，沿转移方向**正向**累积：

$$dp[j] \mathrel{+}= dp[i] \times p_{i \to j}$$

- 初始状态概率为 1，其余为 0
- 每一步将当前状态的概率按转移权重分配到后继状态
- 最终答案是目标状态的概率之和

### 剩余期望（依赖后继）

$dp[i]$ 表示从状态 $i$ 出发到达目标的期望步数/代价，从目标状态出发，**逆向**向起始状态推：

$$dp[i] = \sum_{j} p_{i \to j} \times (dp[j] + cost_{i \to j})$$

- 目标状态的期望代价为 0（已到达，无需额外代价）
- 每个状态的期望 = 所有可能转移的（后继期望 + 本步代价）的概率加权和
- 最终答案是初始状态的 $dp$ 值

### 方向对比总结

| 类型 | 方向 | 初始值 | 转移含义 |
|------|------|--------|----------|
| 到达状态的概率 | 正向（起点 → 终点） | 起点概率 = 1 | 概率向后继状态扩散 |
| 从状态出发的成功概率 | 依赖后继，常逆向或记忆化 | 成功终态 = 1，失败终态 = 0 | 对后继成功概率加权 |
| 从状态出发的剩余期望 | 依赖后继，常逆向或解方程 | 目标期望 = 0 | 对本步代价与后继期望加权 |

### 浮点数注意事项

- 统一使用 `double`，避免用 `float`（精度不足）
- 题目若要求误差在 $10^{-5}$ 以内，`double` 通常足够
- 正向分布只有在完整保留所有结果（含失败吸收态）时，每一层总概率才等于 1；仅保存棋盘内状态时总量可以减少。各状态的“未来成功概率”不是同一分布，不能把它们相加要求等于 1。

---

## 典型例题：骑士在棋盘上的概率 [LeetCode 688](https://leetcode.cn/problems/knight-probability-in-chessboard/)

### 题目描述

在 $n \times n$ 的棋盘上，骑士从位置 $(r, c)$ 出发，每次随机等概率选择 8 个马步方向之一移动，共移动 $k$ 步。求骑士最终仍留在棋盘上的概率。

### 五步法分析

**第一步：定义状态**

$dp[step][i][j]$ = 骑士在第 $step$ 步时位于格子 $(i, j)$ 的概率。

**第二步：状态转移**

骑士从 $(i, j)$ 出发，以均等概率 $\frac{1}{8}$ 跳向每个合法方向 $(ni, nj)$：

$$dp[step+1][ni][nj] \mathrel{+}= dp[step][i][j] \times \frac{1}{8}$$

这是**正向概率 DP**：从当前状态将概率分发给后继状态。

**第三步：初始条件**

$$dp[0][r][c] = 1.0$$

骑士初始以概率 1 位于起点 $(r, c)$。

**第四步：计算顺序**

按步数从 $0$ 到 $k-1$ 逐步推进，每步遍历所有格子，将概率扩散到下一步的合法位置。

**第五步：提取答案**

第 $k$ 步时，所有仍在棋盘内的格子概率之和即为答案：

$$\text{answer} = \sum_{i=0}^{n-1} \sum_{j=0}^{n-1} dp[k][i][j]$$

### Java 完整代码

```java
class Solution {
    public double knightProbability(int n, int k, int row, int column) {
        // 马的 8 个跳跃方向
        int[][] dirs = {
            {-2, -1}, {-2, 1}, {-1, -2}, {-1, 2},
            { 2, -1}, { 2, 1}, { 1, -2}, { 1, 2}
        };

        // dp[i][j] 表示当前步骑士位于 (i, j) 的概率
        double[][] dp = new double[n][n];
        dp[row][column] = 1.0;

        for (int step = 0; step < k; step++) {
            double[][] next = new double[n][n];
            for (int i = 0; i < n; i++) {
                for (int j = 0; j < n; j++) {
                    if (dp[i][j] == 0) continue; // 剪枝：概率为 0 无需扩散
                    for (int[] dir : dirs) {
                        int ni = i + dir[0];
                        int nj = j + dir[1];
                        if (ni >= 0 && ni < n && nj >= 0 && nj < n) {
                            // 正向概率转移：将概率的 1/8 分配给后继状态
                            next[ni][nj] += dp[i][j] / 8.0;
                        }
                        // 跳出棋盘的部分概率自然消失，无需处理
                    }
                }
            }
            dp = next;
        }

        // 累加所有格子的概率，即为留在棋盘上的总概率
        double result = 0.0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                result += dp[i][j];
            }
        }
        return result;
    }
}
```

**复杂度分析：**
- 时间复杂度：$O(k \times n^2 \times 8) = O(k \cdot n^2)$
- 空间复杂度：$O(n^2)$（滚动数组优化后只需两层）

---

## 从状态定义理解方向

### 同一题的逆向定义：剩余 steps 步还活着的概率

定义 `survive(steps,row,column)` 为从当前位置出发，再走 `steps` 步仍未离开棋盘的概率。棋盘外返回 0；棋盘内 `steps=0` 返回 1；其余对 8 个方向的后继成功概率取平均。必须先判棋盘外，再判步数为 0，否则最后一步越界也会被记成成功。

```java
class KnightSurvival {
    private double[][][] memo;
    private final int[][] moves = {
        {-2, -1}, {-2, 1}, {-1, -2}, {-1, 2},
        {2, -1}, {2, 1}, {1, -2}, {1, 2}
    };

    public double knightProbabilityBackward(int size, int steps, int row, int column) {
        memo = new double[steps + 1][size][size];
        for (double[][] layer : memo) {
            for (double[] line : layer) Arrays.fill(line, -1.0);
        }
        return survive(size, steps, row, column);
    }

    private double survive(int size, int steps, int row, int column) {
        if (row < 0 || row >= size || column < 0 || column >= size) return 0.0;
        if (steps == 0) return 1.0;
        if (memo[steps][row][column] >= 0) return memo[steps][row][column];
        double probability = 0.0;
        for (int[] move : moves) {
            probability += survive(size, steps - 1, row + move[0], column + move[1]) / 8.0;
        }
        memo[steps][row][column] = probability;
        return probability;
    }
}
```

输入约定：`size>=1`、`steps>=0`，起点位于棋盘内。时间 O(steps × size²)，记忆化空间 O(steps × size²)，递归栈 O(steps)。即使棋盘上能绕圈，每次递归都会减少剩余步数，扩展状态图仍是 DAG。

在 3×3 棋盘左上角走一步，8 个方向中只有 2 个合法：正向把两份 `1/8` 分到两个位置，逆向计算两项 `1/8 × 1`，结果都为 `1/4`；走两步都得到 `1/16`。不能改为除以“合法方向数”，那会改变随机过程。

### 期望为什么需要方程：直到第一次成功

每次独立尝试以概率 `p` 成功，求包含成功那次在内的期望尝试次数 `E`。失败后回到同一个状态，因此：

$$E = 1 + (1-p)E,\qquad E=\frac{1}{p}\quad(0<p\le1)$$

公平骰子直到首次出现 6 的期望次数为 6。若 `p=0`，期望无穷，不能直接除以 0，更不能把重复访问状态当作已完成。一般有环模型写成 `E=c+QE`；在这些非终态最终以概率 1 被吸收等条件下，才有相应有限解。值迭代也需要收敛依据和误差控制。

## 延伸题目

| 题目 | 链接 | 类型 | 关键思路 |
|------|------|------|----------|
| 新 21 点 | [LC 837](https://leetcode.cn/problems/new-21-game/) | 概率 DP | 正向推进，用前缀和优化转移 $O(n)$ |
| 分汤 | [LC 808](https://leetcode.cn/problems/soup-servings/) | 概率 DP | 状态为剩余汤量，大数据时概率趋近 1 可剪枝 |
| 抛掷硬币 | [LC 1230](https://leetcode.cn/problems/toss-strange-coins/) | 概率 DP | $dp[i][j]$ = 前 $i$ 枚硬币恰好 $j$ 枚正面的概率 |
| 首次掷出 6 的期望次数 | 本页方程示例 | 期望方程 | 失败后回到原状态，解 `E=1+(5/6)E` |

---

## 常见陷阱与调试

**1. 不按状态依赖确定计算顺序**

“到达当前状态的概率”依赖前驱分布；“从当前状态出发的成功概率或剩余期望”依赖后继。先写状态语义和递推式，再决定拓扑顺序或记忆化；不要把“概率正向、期望逆向”当成普遍定理。

**2. 浮点精度问题**

使用 `float` 在多步累加后误差会超出题目要求，统一使用 `double`。若题目允许整数分数表示，也可用分子分母分别维护，但通常 `double` 已足够。

**3. 概率之和不为 1（状态遗漏）**

正常情况下，所有可达状态的概率之和应等于初始概率 1.0。如果中途发现概率之和小于 1，说明有部分概率"泄漏"到了非法状态（如本题跳出棋盘），这是正常现象；若发现概率之和大于 1，则说明转移公式有误，存在重复计数。

**4. 期望 DP 中忘记加每步代价**

期望 DP 的转移公式是 $dp[i] = \sum p_{i \to j} \times (dp[j] + cost)$，其中 $cost$ 通常为 1（走这一步本身的代价）。漏掉 `+1` 是高频错误，会导致期望值偏小。

**5. 环状依赖（期望 DP 有环）**

若完整状态图存在环，先判断能否增加剩余步数等维度使依赖无环；否则建立方程组，并检查是否存在不吸收的闭合状态集、期望是否有限。高斯消元或值迭代不能替代这些存在性与收敛条件。
