---
title: 背包 DP
---

# 背包 DP

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
背包问题的本质是：一组物品 + 容量限制 + 选择决策。0/1 背包和完全背包是起点；变体还要检查是否恰好装满、怎样区分方案、是否分组以及状态规模。循环方向来自“本次转移应读取哪一层”，不能只背正序或倒序。
:::

## 识别信号

看到以下特征时，优先考虑背包 DP：

- 给定一组"物品"（数字、字符串、物体），每个物品有某种"代价"或"重量"
- 存在一个"容量上限"或"目标值"（如背包容量、目标和、硬币总额）
- 需要从中**选取若干个**来满足某种条件（最优、计数、可行性）
- 题目中出现"恰好等于"、"不超过"、"凑成"、"装满"等字眼

常见变形信号：

| 信号词 | 可能的背包类型 |
|--------|--------------|
| 每个元素只能用一次 | 0/1 背包 |
| 硬币/物品无限量 | 完全背包 |
| 每种物品有数量限制 | 多重背包 |
| 从若干组中各选一个 | 分组背包 |

## 通用思考框架

### 第一步：建立背包视角

拿到题目，先做一次"翻译"：

1. **物品是什么？** — 数组中的每个元素
2. **重量/代价是什么？** — 元素的值（或某种属性）
3. **背包容量是什么？** — 目标值、上限、约束
4. **问的是什么？** — 最大价值？方案数？能否恰好装满？

只要能完成这四步翻译，题目就变成了标准背包问题。

---

### 第二步：0/1 背包 vs 完全背包

这是最关键的区分：

- **每个物品最多用一次** → 0/1 背包
- **每个物品可以用无限次** → 完全背包

判断时问自己："同一个元素能重复选取吗？"

---

### 第三步：0/1 背包模板

**二维 DP（直觉版）**

定义状态：`dp[i][j]` = 考虑前 `i` 个物品，背包容量为 `j` 时的最优值

转移方程：
```
dp[i][j] = max(
    dp[i-1][j],              // 不选第 i 个物品
    dp[i-1][j-w[i]] + v[i]  // 选第 i 个物品（需要 j >= w[i]）
)
```

关键观察：第 `i` 行只依赖第 `i-1` 行，可以压缩为一维。

**一维 DP（滚动数组）**

```java
int[] dp = new int[capacity + 1];
for (int i = 0; i < n; i++) {
    for (int j = capacity; j >= w[i]; j--) {  // 注意：倒序！
        dp[j] = Math.max(dp[j], dp[j - w[i]] + v[i]);
    }
}
```

**为什么必须倒序遍历容量？**

这是 0/1 背包最容易犯错的地方，我们通过例子彻底讲清楚。

假设有一个物品，重量 `w=2`，价值 `v=3`，背包容量为 5。

当前 dp 数组（处理该物品前）：`dp = [0, 0, 0, 0, 0, 0]`

**如果正序遍历（错误）：**

```
j=2: dp[2] = max(dp[2], dp[0] + 3) = 3   → dp = [0, 0, 3, 0, 0, 0]
j=3: dp[3] = max(dp[3], dp[1] + 3) = 3   → dp = [0, 0, 3, 3, 0, 0]
j=4: dp[4] = max(dp[4], dp[2] + 3) = 6   ← 用了已经更新的 dp[2]！
```

`dp[4]` 计算时用到的 `dp[2]` 已经**包含了这个物品**（在 `j=2` 时更新过），
相当于这个物品被使用了两次！这就变成了完全背包。

**如果倒序遍历（正确）：**

```
j=5: dp[5] = max(dp[5], dp[3] + 3) = 3   ← dp[3] 还未更新，来自上一轮
j=4: dp[4] = max(dp[4], dp[2] + 3) = 3   ← dp[2] 还未更新，来自上一轮
j=3: dp[3] = max(dp[3], dp[1] + 3) = 3
j=2: dp[2] = max(dp[2], dp[0] + 3) = 3
```

倒序时，`dp[j-w[i]]` 总是来自"还没处理当前物品"的状态，等价于二维 dp 中的 `dp[i-1][j-w[i]]`。

**核心记忆法：** 0/1 背包倒序 = 每个物品只用一次；完全背包正序 = 允许重复使用。

---

### 第四步：完全背包模板

在重量严格为正、目标同为最大价值的这组一维模板中，代码差异是容量改为正序；本质差异是“选当前物品”读取本层而不是上一层。计数、恰好装满或零重量情况，还必须重新检查语义和初始化。

```java
int[] dp = new int[capacity + 1];
for (int i = 0; i < n; i++) {
    for (int j = w[i]; j <= capacity; j++) {  // 注意：正序！
        dp[j] = Math.max(dp[j], dp[j - w[i]] + v[i]);
    }
}
```

**为什么正序可以重复使用？**

正序时，计算 `dp[j]` 用到的 `dp[j-w[i]]` 已经在本轮（处理当前物品时）被更新过，
即 `dp[j-w[i]]` **已经包含了当前物品**，天然允许当前物品被再次选取。

---

### 第五步：三种问法的转移差异

同一个背包骨架，根据问题类型，转移方程和初始化都不同：

**最优化问题（求最大/最小值）**

```java
// 求最大值
dp[j] = Math.max(dp[j], dp[j - w[i]] + v[i]);
// 初始化：dp[0] = 0，其余可为 0（不要求装满）
//         或 dp[0] = 0，其余为 Integer.MIN_VALUE（要求恰好装满）

// 求最小值
dp[j] = Math.min(dp[j], dp[j - w[i]] + v[i]);
// 初始化：dp[0] = 0，其余为 Integer.MAX_VALUE（要求恰好装满时）
```

**计数问题（求方案数）**

```java
dp[j] += dp[j - w[i]];
// 初始化：dp[0] = 1（空集是一种方案），其余为 0
```

**可行性问题（能否恰好装满）**

```java
dp[j] = dp[j] || dp[j - w[i]];
// 初始化：dp[0] = true，其余为 false
```

三种问法的对应关系：

| 问法 | 转移操作 | dp[0] 初始值 | 其他初始值 |
|------|---------|------------|-----------|
| 最大价值 | `max` | 0 | 0 |
| 最小代价（恰好装满） | `min` | 0 | `MAX_VALUE` |
| 方案数 | `+=` | 1 | 0 |
| 可行性（能否装满） | `\|\|` | `true` | `false` |

---

### 第六步：多重背包 & 分组背包（进阶）

**多重背包**：每种物品有数量限制 `c[i]`

朴素做法是把每种物品展开为 `c[i]` 个独立物品，转化为 0/1 背包。
但这样复杂度高，可以用**二进制拆分**优化：

将数量 `c` 拆分为 `1, 2, 4, ..., 2^k, c - (2^(k+1) - 1)` 组，
每组作为一个"打包物品"，数量变为 O(log c)，显著降低复杂度。

**分组背包**：物品分为若干组，每组最多选一个

```java
for (int g = 0; g < groups; g++) {         // 外层：枚举组
    int[] previous = dp.clone();
    for (int j = capacity; j >= 0; j--) {  // 中层：倒序容量（0/1 语义）
        for (int k : group[g]) {           // 内层：枚举组内物品
            if (j >= w[k])
                dp[j] = Math.max(dp[j], previous[j - w[k]] + v[k]);
        }
    }
}
```

组在最外层，每个候选都从**上一组快照**读取，才能保证同组最多选一个。重量严格为正时，特定倒序原地写法也可成立；若重量允许为 0，仅靠倒序仍会读取本组刚写入的 `dp[j]`，把同组多个物品一起选入。快照写法兼容非负重量，也让容量方向不再影响这个约束。

---

## 代码模板库（Java，可直接套）

下面给出高频背包题的可复用代码模板，建议按「问法 -> 模板」快速匹配。

### 模板 1：0/1 背包求最大价值

```java
// n 个物品，w[i] 重量，v[i] 价值，容量 capacity
public int knapsack01MaxValue(int[] w, int[] v, int capacity) {
    int n = w.length;
    int[] dp = new int[capacity + 1];

    for (int i = 0; i < n; i++) {
        for (int j = capacity; j >= w[i]; j--) { // 倒序：每个物品只用一次
            dp[j] = Math.max(dp[j], dp[j - w[i]] + v[i]);
        }
    }
    return dp[capacity];
}
```

### 模板 2：0/1 背包计数（恰好装满的方案数）

```java
// 从 nums 中每个数最多选一次，凑出 target 的方案数（如 LC 494 转化后）
public int knapsack01CountWays(int[] nums, int target) {
    if (target < 0) return 0;

    int[] dp = new int[target + 1];
    dp[0] = 1; // 空集方案

    for (int num : nums) {
        for (int j = target; j >= num; j--) { // 倒序
            dp[j] += dp[j - num];
        }
    }
    return dp[target];
}
```

### 模板 3：完全背包求最小值（零钱兑换）

```java
// 每个硬币可无限使用，凑出 amount 的最少硬币数（如 LC 322）
public int completeKnapsackMinCoins(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, Integer.MAX_VALUE);
    dp[0] = 0;

    for (int coin : coins) {
        for (int j = coin; j <= amount; j++) { // 正序：允许重复使用 coin
            if (dp[j - coin] != Integer.MAX_VALUE) {
                dp[j] = Math.min(dp[j], dp[j - coin] + 1);
            }
        }
    }
    return dp[amount] == Integer.MAX_VALUE ? -1 : dp[amount];
}
```

### 模板 4：完全背包计数（组合数）

```java
// 组合数：外层物品，内层容量（如 LC 518）
public int completeKnapsackCountCombinations(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    dp[0] = 1;

    for (int coin : coins) {
        for (int j = coin; j <= amount; j++) {
            dp[j] += dp[j - coin];
        }
    }
    return dp[amount];
}
```

### 模板 5：完全背包计数（排列数）

```java
// 排列数：外层容量，内层物品（如 LC 377）
public int completeKnapsackCountPermutations(int[] nums, int target) {
    int[] dp = new int[target + 1];
    dp[0] = 1;

    for (int j = 1; j <= target; j++) {
        for (int num : nums) {
            if (j >= num) {
                dp[j] += dp[j - num];
            }
        }
    }
    return dp[target];
}
```

### 模板 6：分组背包（每组最多选一个）

```java
// groups[g] 是第 g 组物品下标列表
public int groupKnapsackMaxValue(List<List<Integer>> groups, int[] w, int[] v, int capacity) {
    int[] dp = new int[capacity + 1];

    for (List<Integer> group : groups) {
        int[] previous = dp.clone();
        for (int j = capacity; j >= 0; j--) { // 组内最多选一个，仍是倒序
            for (int idx : group) {
                if (j >= w[idx]) {
                    dp[j] = Math.max(dp[j], previous[j - w[idx]] + v[idx]);
                }
            }
        }
    }
    return dp[capacity];
}
```

该模板允许每组不选、重量为 0，容量与重量必须非负，数组和物品下标需有效，价值累加需落在 int 范围内。反例：同组两个零重量物品价值为 3 和 5，容量为 0 时答案应为 5，而不是 8。若要求每组恰好选一个，则需要把新一层初始化为不可达，不能直接保留“不选”分支。

### 模板 7：多重背包（二进制拆分优化）

```java
// 每种物品 i：重量 w[i]、价值 v[i]、数量 cnt[i]
public int multipleKnapsackBinarySplit(int[] w, int[] v, int[] cnt, int capacity) {
    List<Integer> newW = new ArrayList<>();
    List<Integer> newV = new ArrayList<>();

    // 二进制拆分：cnt -> 1,2,4,...,rest
    for (int i = 0; i < w.length; i++) {
        int c = cnt[i], k = 1;
        while (k <= c) {
            newW.add(k * w[i]);
            newV.add(k * v[i]);
            c -= k;
            k <<= 1;
        }
        if (c > 0) {
            newW.add(c * w[i]);
            newV.add(c * v[i]);
        }
    }

    // 转为 0/1 背包
    int[] dp = new int[capacity + 1];
    for (int i = 0; i < newW.size(); i++) {
        int weight = newW.get(i), value = newV.get(i);
        for (int j = capacity; j >= weight; j--) {
            dp[j] = Math.max(dp[j], dp[j - weight] + value);
        }
    }
    return dp[capacity];
}
```

### 模板 8：二维费用 0/1 背包（One and Zero）

```java
// 两个容量维度：最多 m 个 0、n 个 1（如 LC 474）
public int twoDimensional01Knapsack(String[] strs, int m, int n) {
    int[][] dp = new int[m + 1][n + 1];

    for (String s : strs) {
        int zero = 0, one = 0;
        for (char ch : s.toCharArray()) {
            if (ch == '0') zero++;
            else one++;
        }

        // 两个维度都要倒序，保证每个字符串只用一次
        for (int i = m; i >= zero; i--) {
            for (int j = n; j >= one; j--) {
                dp[i][j] = Math.max(dp[i][j], dp[i - zero][j - one] + 1);
            }
        }
    }
    return dp[m][n];
}
```

### 速查：循环方向与问法

| 类型 | 内层容量方向 | 典型问法 |
|------|------------|---------|
| 0/1 背包 | 倒序 `j = cap...w` | 最大值 / 可行性 / 计数 |
| 完全背包 | 正序 `j = w...cap` | 最小硬币数 / 组合数 |
| 分组背包 | 从上一组快照读取，容量可正序或倒序 | 每组最多选一个 |
| 二维 0/1 背包 | 两个维度都倒序 | 两种资源限制 |

---

## 典型例题：分割等和子集

[LeetCode 416](https://leetcode.cn/problems/partition-equal-subset-sum/)

**题目**：给定一个只包含正整数的非空数组，判断是否可以将这个数组分割成两个子集，使得两个子集的元素和相等。

### 为什么这是背包问题？

**思维转化**：两个子集和相等，意味着每个子集的和 = 总和 / 2。

问题变为：**能否从数组中选出若干个数，使它们的和恰好等于 `total / 2`？**

完成背包翻译：
- 物品：数组中的每个数
- 重量/代价：数字的值
- 背包容量：`total / 2`
- 问法：能否恰好装满？→ **可行性 0/1 背包**

### 五步法解题

**第一步：特判**

总和为奇数时，无法平分，直接返回 `false`。
任何单个数大于 `total / 2`，也直接返回 `false`。

**第二步：定义状态**

`dp[j]` = 能否从数组中选出若干个数，使其和恰好为 `j`

**第三步：初始化**

`dp[0] = true`（和为 0，选空集，可行）
其余 `dp[j] = false`

**第四步：转移方程**

可行性 0/1 背包，倒序遍历：
```
dp[j] = dp[j] || dp[j - nums[i]]
```

**第五步：返回结果**

`return dp[target]`

### Java 代码

```java
public boolean canPartition(int[] nums) {
    int total = 0;
    for (int num : nums) total += num;

    // 特判：总和为奇数
    if (total % 2 != 0) return false;

    int target = total / 2;

    // 特判：存在单个数大于 target
    for (int num : nums) {
        if (num > target) return false;
    }

    boolean[] dp = new boolean[target + 1];
    dp[0] = true;  // 空集，和为 0，可行

    for (int num : nums) {
        // 0/1 背包：倒序遍历，确保每个数只用一次
        for (int j = target; j >= num; j--) {
            dp[j] = dp[j] || dp[j - num];
        }
    }

    return dp[target];
}
```

### 复杂度分析

- **时间复杂度**：O(n × target)，其中 n 为数组长度，target = total / 2
- **空间复杂度**：O(target)，一维滚动数组

---

## 典型例题：目标和 {#target-sum}

[LeetCode 494](https://leetcode.cn/problems/target-sum/) 给非负整数数组的每个元素添加正号或负号，统计最终和为 target 的方案数。例子 `[1,1,1,1,1]`、target 为 3，答案是 5：恰好挑一个位置使用负号。

### 把正负号转成选子集

设所有元素总和为 total，分配正号的元素和为 positive，负号的元素和为 negative，则：

$$positive + negative = total,\qquad positive - negative = target$$

因此 `positive = (total + target) / 2`。问题变成：每个数组位置最多选一次，统计和恰好等于 positive 的子集数。

先检查 `abs(target) <= total`，再检查 `total + target` 是偶数；否则不可能构造合法子集。数组元素按**位置**区分，相同数值不应去重，因为选择不同位置对应不同的符号表达式。

```java
public int findTargetSumWays(int[] nums, int target) {
    int total = 0;
    for (int number : nums) total += number;
    if (Math.abs((long) target) > total) return 0;
    if ((total + target) % 2 != 0) return 0;

    int capacity = (total + target) / 2;
    int[] ways = new int[capacity + 1];
    ways[0] = 1;
    for (int number : nums) {
        for (int sum = capacity; sum >= number; sum--) {
            ways[sum] += ways[sum - number];
        }
    }
    return ways[capacity];
}
```

代码按 LC 494 的非负数、数组长度和总和约束设计，int 可以容纳总和与方案数；扩展输入范围时需重新估算容量与计数上界。时间 $O(n\cdot capacity)$，空间 $O(capacity)$。它是关于数值容量的伪多项式算法，不代表 total 极大时仍然可行。

### 零为什么必须保留

处理元素 0 时，转移成为 `ways[sum] += ways[sum]`：正零和负零是两种符号选择，所以所有已有方案数翻倍，容量 0 也必须参与更新。

`[0,0,1]`、target 为 1 的答案是 4；全为 0、target 为 0 时答案是 $2^n$。若容量循环写成 `sum > 0`，或者先过滤掉 0，就会漏计。倒序使每个位置只处理一次，而不是禁止同一轮读取自身的所有情况；零元素需要按题意解释这种自读。

## 计数技巧：循环顺序为什么改变答案 {#counting-order}

以数值互异的正整数 `{1,2}`、目标和 3 为例：组合只有 `1+1+1`、`1+2` 两种；排列还把 `2+1` 作为第三种。

**物品在外层**时，每一轮只加入一种新面额，方案按“允许使用到哪种面额”分类。`1+2` 只会在处理面额 2 时形成，不会再以 `2+1` 生成一遍，所以模板 4 统计组合。

**目标和在外层**时，内层枚举的是“最后加入哪个数”。尾元素不同就是互斥分支：末尾为 1 的方案来自目标 2，末尾为 2 的方案来自目标 1，所以模板 5 统计排列。

不是 `for` 自带“组合”或“排列”属性，而是循环顺序对应了不同的状态层次与方案划分。写 `+=` 前先回答：**同一份答案能否从两条路径被重复生成？**

### 三个不能直接套模板的情况

1. **重复面额**：若两个 1 代表同一种无限硬币，输入应先去重；若代表两个独立的限量物品，则不能去重。先定义方案身份，再处理重复。
2. **零或负数可无限使用**：可能产生无限多种表示或循环依赖，正整数完全背包的正序模板不再直接成立。LC 322、518、377 的正数约束不是可省略的细节。
3. **多重背包计数**：二进制拆分通常用于最优值或可行性，不能机械复用于计数。数量 5 拆成 `1、2、2` 后，选择两个物品有两种“包”的选法，却是同一种原始数量；需要按每种物品的使用次数分类计数。

### 恰好装满与不超过容量

只有一个重量 2、价值 5 的物品，容量 3 时，“不超过容量”的最优价值是 5，“恰好装满”却不可达。前者可以把每个容量初值设为 0，后者只能让容量 0 可达，其余设为负无穷或单独保存可达性。

使用极值哨兵时应先检查前驱可达，再做加法；不要依赖 `Integer.MIN_VALUE + value` 或 `Integer.MAX_VALUE + cost` 恰好没有溢出。计数模板中的 int 也只适用于已知计数上界，不能未经题意允许就取模。

## 延伸题目

| 题目 | 链接 | 与典型题的区别 | 关键技巧 |
|------|------|--------------|---------|
| 目标和 | [LeetCode 494](https://leetcode.cn/problems/target-sum/) | 0/1 背包计数变体 | 数学转换：`sum(P) = (target + total) / 2`，转为计数背包 |
| 零钱兑换 | [LeetCode 322](https://leetcode.cn/problems/coin-change/) | 完全背包求最小值 | 初始化为 `Integer.MAX_VALUE`，转移前判断溢出 |
| 零钱兑换 II | [LeetCode 518](https://leetcode.cn/problems/coin-change-ii/) | 完全背包计数 | 组合数：外层物品内层容量；排列数则反之（见 LC 377） |
| 一和零 | [LeetCode 474](https://leetcode.cn/problems/ones-and-zeroes/) | 二维费用 0/1 背包 | 两个容量维度（0 的个数、1 的个数），都倒序遍历 |

**目标和（LC 494）的关键推导：**

设选"+"号的数之和为 P，选"-"号的数之和为 N，则：
- `P + N = total`
- `P - N = target`
- 解得：`P = (total + target) / 2`

问题转化为：**从数组中选出若干个数，和恰好为 `(total + target) / 2` 的方案数**。
这正是 0/1 背包计数问题，`dp[j] += dp[j - num]`，初始化 `dp[0] = 1`。

---

## 常见陷阱与调试

**陷阱 1：0/1 背包误用正序遍历**

症状：求最大价值时结果偏大，相当于每个物品被重复使用了。
检查：内层循环是否为 `j = capacity; j >= w; j--`。

**陷阱 2：完全背包误用倒序遍历**

症状：每种物品最多只用了一次，无法得到正确的最小硬币数。
检查：内层循环是否为 `j = w; j <= capacity; j++`。

**陷阱 3：初始化错误**

- 求最小值且要求恰好装满：除 `dp[0] = 0` 外其余应初始化为 `Integer.MAX_VALUE`，转移时需防止 `MAX_VALUE + v` 溢出（判断 `dp[j-w] != Integer.MAX_VALUE`）。
- 计数问题：`dp[0] = 1`，不是 0。
- 可行性问题：`dp[0] = true`，不是 `false`。

**陷阱 4：整数溢出**

零钱兑换等求最小值的题中，`Integer.MAX_VALUE + 1` 会溢出为负数：

```java
if (dp[j - coin] != Integer.MAX_VALUE) {
    dp[j] = Math.min(dp[j], dp[j - coin] + 1);
}
```

**陷阱 5：target 为负数或奇数时未特判**

分割等和子集、目标和等题，计算 target 后需先检查合法性（非负、偶数要求等），否则数组越界或结果错误。

**调试思路**：

1. 用小规模例子手动推导 dp 数组的变化过程
2. 对比一维和二维 dp 的计算结果是否一致
3. 检查循环边界：外层是物品，内层是容量，方向是否正确
4. 检查初始化：`dp[0]` 的值是否符合"空集"的语义
