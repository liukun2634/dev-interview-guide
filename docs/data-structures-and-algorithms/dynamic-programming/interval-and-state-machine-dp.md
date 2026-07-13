---
title: 区间与状态机 DP
---

# 区间与状态机 DP

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
- **区间 DP**：答案与连续区间相关，大区间由小区间合并/分割得到；遍历顺序必须**从短区间到长区间**
- **状态机 DP**：每个时刻处于某个"状态"，先画状态转移图，图画好了方程自然就写出来了
- 两类问题都有固定的**建模套路**，掌握框架后可以快速识别并套用
:::

---

## Part 1：区间 DP

### 识别信号

遇到以下特征，优先考虑区间 DP：

- 问题的答案与**一段连续区间** `[l, r]` 相关
- **大区间的最优解**可以通过枚举某个分割点，由**若干小区间的最优解**合并或分割得到
- 典型描述：合并石子、戳气球、括号合法性、矩阵链乘法、多边形剖分

---

### 通用思考框架

#### 第一步：定义状态

```
dp[l][r] = 区间 [l, r] 上问题的最优解（最大值/最小值/方案数等）
```

`l` 和 `r` 分别是区间的左右端点（通常下标从 1 开始，方便处理边界）。

#### 第二步：状态转移——枚举分割点 k

区间 DP 的核心操作是**枚举分割点 k**，将 `[l, r]` 拆分为 `[l, k]` 和 `[k+1, r]` 两个子区间：

```
dp[l][r] = max/min over k in [l, r-1] of { dp[l][k] + dp[k+1][r] + cost(l, k, r) }
```

有时候更自然的思路是**"最后一次操作"思维**：想象对区间 `[l, r]` 执行一系列操作，**最后一次**操作涉及哪个元素/位置？

**为什么"最后操作"思维有效？**

假设最后操作作用在 `k` 上：
- 在执行最后一步之前，`k` 把区间分成了 `[l, k-1]` 和 `[k+1, r]` 两部分
- 这两部分的操作已经**相互独立**地完成了
- 因此子问题 `dp[l][k-1]` 和 `dp[k+1][r]` 不会相互干扰，可以分别求最优

这是区间 DP 有别于线性 DP 的关键：线性 DP 从左到右逐步扩展，而区间 DP **从内向外**层层包裹。

#### 第三步：遍历顺序——区间长度从小到大

```java
for (int len = 2; len <= n; len++) {       // 枚举区间长度
    for (int l = 1; l + len - 1 <= n; l++) { // 枚举左端点
        int r = l + len - 1;               // 确定右端点
        for (int k = l; k < r; k++) {      // 枚举分割点
            dp[l][r] = max(dp[l][r], dp[l][k] + dp[k+1][r] + cost);
        }
    }
}
```

**为什么必须从短区间到长区间？**

`dp[l][r]` 的值依赖于 `dp[l][k]` 和 `dp[k+1][r]`，而这两个子区间的长度都**严格小于** `r - l + 1`。因此，当我们计算长度为 `len` 的区间时，所有长度小于 `len` 的区间必须已经计算完毕。

如果按行或按列遍历，会出现计算 `dp[l][r]` 时子区间还没被填好的情况，导致错误结果。

#### 第四步：初始化

长度为 1 的区间（单个元素）是边界条件，通常直接赋值：

```java
for (int i = 1; i <= n; i++) {
    dp[i][i] = base_value; // 根据题意，可能是 0、元素值等
}
```

#### 第五步：时间与空间复杂度

- **时间复杂度**：O(n³)——三层循环（区间长度 × 左端点 × 分割点）
- **空间复杂度**：O(n²)——二维 dp 数组

---

### 典型例题：戳气球

[LeetCode 312](https://leetcode.cn/problems/burst-balloons/)

**题目描述**：有 n 个气球，编号 0 到 n-1，每个气球上有数字 `nums[i]`。戳破气球 i 可以得到 `nums[i-1] * nums[i] * nums[i+1]` 枚硬币（边界外视为 1）。求戳破所有气球能获得的最多硬币数。

#### 五步法分析

**第一步：找到"最后操作"的关键洞察**

直觉上我们想枚举"第一个戳哪个气球"，但这行不通——戳破气球 i 后，i-1 和 i+1 会变成相邻，子问题边界会动态变化，子问题之间**不独立**。

正确做法：**枚举哪个气球最后被戳破**。

为什么这样有效？如果气球 k 是区间 `[l, r]` 中**最后一个**被戳破的，那么在戳 k 之前，`[l, k-1]` 和 `[k+1, r]` 的气球都已经戳完了。此时 k 的邻居正好是 `nums[l-1]`（左边界外）和 `nums[r+1]`（右边界外），**不再变动**。子问题因此独立。

**第二步：添加虚拟气球**

在两端各添加一个值为 1 的虚拟气球，避免边界讨论：

```java
int[] balloons = new int[n + 2];
balloons[0] = balloons[n + 1] = 1;
for (int i = 1; i <= n; i++) balloons[i] = nums[i - 1];
```

**第三步：状态定义**

```
dp[l][r] = 戳破开区间 (l, r) 内所有气球能获得的最大硬币数
```

注意这里用**开区间**，`l` 和 `r` 是不会被戳的边界气球（虚拟或真实）。这样转移时 `balloons[l]` 和 `balloons[r]` 始终是固定的边界。

**第四步：状态转移**

枚举开区间 `(l, r)` 中**最后一个被戳破的气球** k：

```
dp[l][r] = max over k in (l, r) of {
    dp[l][k] + balloons[l] * balloons[k] * balloons[r] + dp[k][r]
}
```

解释：
- `dp[l][k]`：先将 `(l, k)` 内的气球全部戳完
- `balloons[l] * balloons[k] * balloons[r]`：最后戳 k，此时左邻是 l，右邻是 r
- `dp[k][r]`：再将 `(k, r)` 内的气球全部戳完

**第五步：遍历顺序与初始化**

- 初始化：`dp[i][i+1] = 0`（开区间内没有气球，硬币为 0），已由数组初始化覆盖
- 遍历：区间长度从 2 到 n+1（开区间长度），从小到大

**Java 实现：**

```java
class Solution {
    public int maxCoins(int[] nums) {
        int n = nums.length;
        // 添加虚拟气球
        int[] b = new int[n + 2];
        b[0] = b[n + 1] = 1;
        for (int i = 1; i <= n; i++) b[i] = nums[i - 1];

        // dp[l][r] = 开区间 (l, r) 内所有气球戳完的最大硬币
        int[][] dp = new int[n + 2][n + 2];

        // 枚举开区间长度（至少为 2，即内部有气球）
        for (int len = 2; len <= n + 1; len++) {
            for (int l = 0; l + len <= n + 1; l++) {
                int r = l + len;
                // 枚举最后一个被戳破的气球 k
                for (int k = l + 1; k < r; k++) {
                    int coins = b[l] * b[k] * b[r] + dp[l][k] + dp[k][r];
                    dp[l][r] = Math.max(dp[l][r], coins);
                }
            }
        }

        return dp[0][n + 1];
    }
}
```

**复杂度分析：**
- 时间：O(n³)——三层枚举
- 空间：O(n²)——dp 数组

---

### 延伸题目

| 题目 | 链接 | 与典型题的区别 | 关键技巧 |
|------|------|--------------|---------|
| 石子合并 | 经典题（POJ 1995 等） | 合并型：将相邻堆合并为一堆，求最小/最大代价 | 分割点枚举，合并代价 = 两堆总数量（用前缀和 O(1) 查询） |
| 多边形三角剖分最低得分 | [LC 1039](https://leetcode.cn/problems/minimum-score-triangulation-of-polygon/) | 三角形划分：固定一条边，枚举第三个顶点 k | 环形结构→固定顶点 0，枚举区间 `[l, r]` 和三角形顶点 k，`dp[l][r] = min(dp[l][k] + dp[k][r] + val[l]*val[k]*val[r])` |

---

### 合并型例题：石子合并

戳气球是"分割型"（枚举最后一个操作），石子合并是**"合并型"**区间 DP 的代表：把相邻子区间合并成大区间，代价与区间和相关，是区间 DP + 前缀和的经典搭配。

**题目**：`n` 堆石子排成一列，每次只能合并**相邻两堆**，代价为两堆石子数之和。求把所有石子合并成一堆的**最小总代价**。

#### 五步法分析

**第一步：状态定义**

$$dp[l][r] = \text{把区间 } [l, r] \text{ 内的石子合并成一堆的最小代价}$$

**第二步：转移方程（枚举最后一次合并的分界点）**

无论怎么合并，**最后一步**总是把 `[l, k]` 合成的一堆和 `[k+1, r]` 合成的一堆合并，这最后一合的代价是整个 `[l, r]` 的石子总和（与 `k` 无关）：

$$dp[l][r] = \min_{l \le k < r} \bigl( dp[l][k] + dp[k+1][r] \bigr) + \text{sum}(l, r)$$

其中 `sum(l, r)` 用**前缀和** $O(1)$ 查询。

**第三步：初始化** — `dp[i][i] = 0`（单堆无需合并）。

**第四步：遍历顺序** — 区间长度从短到长。

**第五步：答案** — `dp[0][n-1]`。

#### Java 实现

```java
class Solution {
    public int mergeStones(int[] stones) {
        int n = stones.length;
        int[] prefix = new int[n + 1];
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + stones[i];

        int[][] dp = new int[n][n];      // dp[i][i] = 0 已由默认值满足
        for (int len = 2; len <= n; len++) {
            for (int l = 0; l + len - 1 < n; l++) {
                int r = l + len - 1;
                dp[l][r] = Integer.MAX_VALUE;
                int sum = prefix[r + 1] - prefix[l];   // 区间 [l, r] 石子总和
                for (int k = l; k < r; k++) {
                    dp[l][r] = Math.min(dp[l][r], dp[l][k] + dp[k + 1][r] + sum);
                }
            }
        }
        return dp[0][n - 1];
    }
}
```

**复杂度**：时间 $O(n^3)$，空间 $O(n^2)$。

#### 干跑验证

以 `stones = [4, 1, 1]`（`prefix = [0,4,5,6]`）：

| 区间 | sum | 枚举 k | dp |
|:---:|:---:|:---|:---:|
| `[0,1]` | 5 | k=0: 0+0+5 | 5 |
| `[1,2]` | 2 | k=1: 0+0+2 | 2 |
| `[0,2]` | 6 | k=0: dp[0][0]+dp[1][2]+6=0+2+6=8；k=1: dp[0][1]+dp[2][2]+6=5+0+6=11 | 8 |

`dp[0][2] = 8`（先合 `[1,1]`代价2，再与4合，代价6，总8）。

::: tip 🔑 分割型 vs 合并型
> - **分割型**（戳气球 312）：枚举"最后操作的那个点 k"，代价与 `k` 相关（三数相乘）。
> - **合并型**（石子合并）：枚举"最后合并的分界点 k"，代价与 `k` 无关（固定为区间和），用前缀和加速。
> - 两者骨架一致，区别只在 `cost(l,k,r)` 的写法。识别时问：最后一步的代价取决于分界点吗？
:::

---

## Part 2：状态机 DP

### 识别信号

遇到以下特征，优先考虑状态机 DP：

- 问题涉及**一系列决策**（如买卖、持有、冷却等），每个时刻处于某个**有限状态**之一
- 不同状态之间有**明确的转移规则**（哪些状态可以互相切换，切换的条件和代价）
- 典型描述：股票买卖系列、任务调度、游戏状态切换

---

### 通用思考框架

#### 第一步：先画状态转移图

这是状态机 DP 最核心的一步，**图画好了，方程自然就写出来了**。

- **节点** = 所有可能的状态
- **有向边** = 合法的状态转移
- **边上的标签** = 转移的代价（收益为正，损失为负）

示例（通用股票状态机）：

```
        buy(-price)          sell(+price)
not_holding  ──────────→  holding  ──────────→  not_holding
     ↑                                               │
     └───────────────────── rest ───────────────────┘
```

画图的过程迫使你**枚举所有状态**和**所有合法转移**，不会遗漏。

#### 第二步：状态定义

```
dp[i][s] = 处理到第 i 天，处于状态 s 时，能获得的最大/最小收益
```

`s` 是状态编号，通常用常量或枚举表示，使代码可读。

#### 第三步：建模技巧——将约束转化为状态或转移代价

| 约束类型 | 建模方法 |
|---------|---------|
| 冷冻期（卖出后 k 天不能买） | 增加"冷冻"状态，冷冻期结束后才能转移到"可买"状态 |
| 交易次数限制（最多 k 次） | 增加交易次数维度：`dp[i][j][s]`，j 表示已完成 j 次交易 |
| 每次交易有手续费 | 在"卖出"转移的代价上减去 fee |
| 必须先买后卖 | 由"持有"状态的存在自然保证，不需要额外约束 |

#### 第四步：股票系列统一框架

所有股票问题都是以下通用状态机的**特殊情形**：

**核心状态：**
- `holding`：当前持有股票
- `not_holding`：当前不持有股票，且可以买入
- `frozen`（可选）：刚卖出，处于冷冻期，不能立即买入

**核心转移：**

```
not_holding[i] = max(
    not_holding[i-1],          // rest：继续不持有
    frozen[i-1]                // 冷冻期结束，恢复可买（可选）
)

holding[i] = max(
    holding[i-1],              // rest：继续持有
    not_holding[i-1] - price[i] // buy：花钱买入
)

frozen[i] = holding[i-1] + price[i]  // sell：卖出，进入冷冻（可选）

not_holding[i] = max(
    not_holding[i-1],
    holding[i-1] + price[i]   // sell（无冷冻时）
)
```

通过调整这个框架的参数，即可覆盖所有股票变体。

---

### 典型例题：买卖股票含冷冻期

[LeetCode 309](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-with-cooldown/)

**题目描述**：每天可以买入或卖出一支股票，卖出后第二天进入**冷冻期**，不能买入。求最大利润。

#### 五步法分析

**第一步：画状态转移图**

三个状态：
- `0`：`not_holding`——不持股，且**可以**买入
- `1`：`holding`——持有股票
- `2`：`frozen`——冷冻期（刚卖出，今天不能买）

```
        buy(-price)
   0  ─────────────→  1
   ↑                  │
   │    sell(+price)  │
   │  ←──────────────  
   2  ←──────────────
        sell(+price)
   
   0 → 0 (rest)
   1 → 1 (rest)
   2 → 0 (冷冻期结束)
```

文字描述转移关系：
- `not_holding` → `holding`：买入，花费 `price[i]`
- `holding` → `frozen`：卖出，获得 `price[i]`
- `frozen` → `not_holding`：冷冻结束，无代价
- `not_holding` → `not_holding`：休息
- `holding` → `holding`：休息

**第二步：状态定义**

```
dp[i][0] = 第 i 天结束后，处于 not_holding 状态的最大利润
dp[i][1] = 第 i 天结束后，处于 holding 状态的最大利润
dp[i][2] = 第 i 天结束后，处于 frozen 状态的最大利润
```

**第三步：状态转移方程**

根据状态图直接写出：

```
dp[i][0] = max(dp[i-1][0], dp[i-1][2])   // 继续不持有 或 冷冻期结束
dp[i][1] = max(dp[i-1][1], dp[i-1][0] - prices[i])  // 继续持有 或 今天买入
dp[i][2] = dp[i-1][1] + prices[i]         // 今天卖出，进入冷冻
```

**第四步：初始化**

```
dp[0][0] = 0        // 第 0 天不持有，利润为 0
dp[0][1] = -prices[0]  // 第 0 天买入，利润为负
dp[0][2] = Integer.MIN_VALUE / 2  // 第 0 天不可能处于冷冻状态
```

**第五步：答案**

最终答案是 `max(dp[n-1][0], dp[n-1][2])`（不持有股票的两种状态取最大）。

**Java 实现：**

```java
class Solution {
    public int maxProfit(int[] prices) {
        int n = prices.length;
        // dp[i][0]: not_holding, dp[i][1]: holding, dp[i][2]: frozen
        int[][] dp = new int[n][3];

        dp[0][0] = 0;
        dp[0][1] = -prices[0];
        dp[0][2] = Integer.MIN_VALUE / 2; // 不可达状态

        for (int i = 1; i < n; i++) {
            dp[i][0] = Math.max(dp[i-1][0], dp[i-1][2]); // rest 或 冷冻解除
            dp[i][1] = Math.max(dp[i-1][1], dp[i-1][0] - prices[i]); // rest 或 买入
            dp[i][2] = dp[i-1][1] + prices[i]; // 卖出
        }

        return Math.max(dp[n-1][0], dp[n-1][2]);
    }
}
```

**空间优化到 O(1)：**

注意 `dp[i]` 只依赖 `dp[i-1]`，可以用滚动变量替代数组：

```java
class Solution {
    public int maxProfit(int[] prices) {
        int notHold = 0;
        int hold = -prices[0];
        int frozen = Integer.MIN_VALUE / 2;

        for (int i = 1; i < prices.length; i++) {
            int newNotHold = Math.max(notHold, frozen);
            int newHold    = Math.max(hold, notHold - prices[i]);
            int newFrozen  = hold + prices[i];
            notHold = newNotHold;
            hold    = newHold;
            frozen  = newFrozen;
        }

        return Math.max(notHold, frozen);
    }
}
```

注意：必须用临时变量保存旧值，不能原地更新，否则会用到本轮已更新的状态。

**复杂度分析：**
- 时间：O(n)
- 空间：O(1)（优化后）

---

### 延伸题目

| 题目 | 链接 | 与典型题的区别 | 关键技巧 |
|------|------|--------------|---------|
| 买卖股票 I | [LC 121](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/) | 只能交易一次 | 状态机退化为两状态；也可简化为维护前缀最小值 O(n) |
| 买卖股票 II | [LC 122](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-ii/) | 无限次交易，无冷冻 | 两状态（持有/不持有），无冷冻无次数限制 |
| 买卖股票 III | [LC 123](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-iii/) | 最多 2 次交易 | 增加交易次数维度：`dp[i][k][s]`，k ∈ {0,1,2} |
| 买卖股票 IV | [LC 188](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-iv/) | 最多 k 次交易 | III 的泛化；当 k ≥ n/2 时退化为无限次（按 II 处理，防止 TLE） |
| 含手续费 | [LC 714](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/) | 每次卖出有手续费 | 在"卖出"转移时减去 fee 即可：`notHold = max(notHold, hold + price - fee)` |

---

### 终极模板：最多 k 次交易的三维状态机

上面的冷冻期是"无次数限制"的变体。股票系列的**终极形态**是 LC 188（最多 k 次交易）——把"已用多少次交易"也建成一个状态维度，LC 121/122/123 都是它的特例（k=1 / k=∞ / k=2）。

#### 状态设计：加一个"交易次数"维度

$$dp[i][j][s] = \text{前 } i \text{ 天、已完成 } j \text{ 次买入、当前持股状态 } s\;(0\text{=不持},1\text{=持有})\text{ 的最大利润}$$

> **关键约定**：规定"**买入**"时 `j++`（也可约定卖出时，二选一但全程统一），一次完整交易 = 一买一卖。

#### 转移方程

$$dp[i][j][0] = \max\bigl(dp[i-1][j][0],\; dp[i-1][j][1] + price[i]\bigr) \quad(\text{休息 或 卖出})$$
$$dp[i][j][1] = \max\bigl(dp[i-1][j][1],\; dp[i-1][j-1][0] - price[i]\bigr) \quad(\text{休息 或 买入，买入时 } j-1 \to j)$$

#### 关键优化：k 过大时退化

> 一次交易至少占 2 天，所以当 $k \ge n/2$ 时，限制形同虚设——**退化为无限次交易**（LC 122），直接贪心求和，否则 `dp[i][k][s]` 的 $O(nk)$ 会 TLE / MLE。

```java
class Solution {
    public int maxProfit(int k, int[] prices) {
        int n = prices.length;
        if (n == 0) return 0;
        if (k >= n / 2) return maxProfitInf(prices);   // 退化：无限次

        // dp[j][s]：滴动掉 i 维；j 买入次数，s 持股状态
        int[][] dp = new int[k + 1][2];
        for (int j = 0; j <= k; j++) dp[j][1] = Integer.MIN_VALUE / 2;

        for (int price : prices) {
            for (int j = k; j >= 1; j--) {             // j 倒序，避免本轮重复使用
                dp[j][0] = Math.max(dp[j][0], dp[j][1] + price);       // 卖出
                dp[j][1] = Math.max(dp[j][1], dp[j - 1][0] - price);   // 买入，j-1→j
            }
        }
        return dp[k][0];
    }

    private int maxProfitInf(int[] prices) {           // LC 122：无限次贪心
        int profit = 0;
        for (int i = 1; i < prices.length; i++)
            if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
        return profit;
    }
}
```

::: tip 🔑 股票问题统一视角
> 所有股票题都是同一个状态机的参数变体，记住这张表就能举一反三：
>
> | 题 | 交易次数 k | 额外约束 | 建模 |
> |------|:---:|------|------|
> | LC 121 | 1 | — | 两状态，或前缀最小值 |
> | LC 122 | ∞ | — | 两状态 / 贪心 |
> | LC 123 | 2 | — | 三维，k=2 |
> | LC 188 | k | — | 三维，k≥n/2 退化 |
> | LC 309 | ∞ | 冷冻期 | 加 frozen 状态 |
> | LC 714 | ∞ | 手续费 | 卖出减 fee |
:::

---

## 常见陷阱与调试

::: tip 💡 高频错误总结

**区间 DP：**

1. **遍历顺序错误**：按行/列遍历而非按区间长度遍历，导致依赖的子区间尚未计算。
   - 调试方法：打印 dp 数组，检查小区间是否先于大区间被填充。

2. **分割点范围越界**：`k` 的范围是 `[l, r-1]`（闭区间分割）或 `(l, r)`（开区间分割），混淆会导致空区间计算。
   - 记住：分割点必须使两个子区间都**非空**。

3. **忽略添加虚拟边界**：戳气球类题目不加边界气球，转移时越界访问。
   - 凡是涉及"相邻元素乘积"的区间 DP，考虑在两端补虚拟元素。

4. **前缀和未预处理**：石子合并类题目每次计算区间和是 O(n)，导致总复杂度变成 O(n⁴)。
   - 提前计算前缀和，让区间和查询降至 O(1)。

**状态机 DP：**

5. **不可达状态初始化为 0**：例如第 0 天冷冻状态不可能出现，应初始化为极小值（`Integer.MIN_VALUE / 2`），否则会产生非法转移路径。
   - 用 `MIN_VALUE / 2` 而非 `MIN_VALUE`，防止加法时整数溢出。

6. **空间优化时原地更新**：用滚动变量优化空间时，直接覆盖旧值导致同一轮循环内后续状态用到了已更新的值。
   - 始终用临时变量保存本轮所有旧值，更新完毕后再赋值。

7. **买卖次数定义模糊**："一次交易"是指一次买+一次卖，不要把"买"和"卖"分别计数。

8. **忘记处理 k ≥ n/2 的退化情形**（LC 188）：k 很大时按通用框架会超时，应特判为无限次交易。
:::
