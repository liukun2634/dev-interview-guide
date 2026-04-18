---
title: 贪心算法
---

# 贪心算法

<span class="dig-tag dig-tag--category">贪心与技巧</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
贪心的关键不在于"每次选最优"，而在于能论证**局部最优 → 全局最优**。常见论证方法：交换论证（假设存在更优解，交换后不会更差）。贪心题没有统一模板，但有常见模式：排序后贪心、区间贪心、跳跃贪心。
:::

## 核心思路

**什么时候用贪心？**
- 每一步的选择对后续影响可控
- 动态规划能做但状态太重，贪心可以简化
- 区间调度、资源分配、构造最优序列

**贪心 vs 动态规划：** 贪心每步只看当前最优，不回头。DP 记录所有子问题的最优解。如果贪心能证明正确性，优先用贪心（更简单更快）。

## 常见贪心模式

### 区间贪心

按**结束时间**排序，优先选结束早的（给后续留更多空间）：

```java
// 求最多不重叠区间数
public int maxNonOverlapping(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);  // 按结束时间排序
    int count = 0, end = Integer.MIN_VALUE;
    for (int[] interval : intervals) {
        if (interval[0] >= end) {  // 不重叠
            count++;
            end = interval[1];
        }
    }
    return count;
}
```

### 跳跃贪心

维护当前能到达的最远位置：

```java
// 判断能否到达终点
public boolean canJump(int[] nums) {
    int maxReach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;  // 到不了这里
        maxReach = Math.max(maxReach, i + nums[i]);
    }
    return true;
}
```

## 例题 1：[分发饼干（LeetCode 455）](https://leetcode.cn/problems/assign-cookies/)

### 题目描述

每个孩子有一个胃口值 `g[i]`，每块饼干有一个尺寸 `s[j]`。当 `s[j] >= g[i]` 时可以满足孩子 i。求最多能满足几个孩子。

### 思路分析

1. 排序：孩子按胃口从小到大，饼干按尺寸从小到大
2. 贪心：用最小的能满足的饼干去满足胃口最小的孩子
3. 双指针遍历两个数组

### 完整代码

```java
public int findContentChildren(int[] g, int[] s) {
    Arrays.sort(g);
    Arrays.sort(s);
    int child = 0, cookie = 0;
    while (child < g.length && cookie < s.length) {
        if (s[cookie] >= g[child]) {
            child++;  // 满足了一个孩子
        }
        cookie++;  // 无论是否满足，这块饼干都用掉了
    }
    return child;
}
```

### 复杂度分析

- **时间**：O(n log n + m log m)，排序为主
- **空间**：O(1)（不计排序空间）

## 例题 2：[跳跃游戏（LeetCode 55）](https://leetcode.cn/problems/jump-game/)

### 题目描述

给定非负整数数组 `nums`，每个元素代表在该位置可以跳的最大长度。判断能否到达最后一个位置。

### 思路分析

1. 维护当前能到达的最远位置 `maxReach`
2. 遍历数组，每个位置更新 `maxReach = max(maxReach, i + nums[i])`
3. 如果某个位置 `i > maxReach`，说明到不了这里，返回 false

### 完整代码

```java
public boolean canJump(int[] nums) {
    int maxReach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;
        maxReach = Math.max(maxReach, i + nums[i]);
    }
    return true;
}
```

### 复杂度分析

- **时间**：O(n)
- **空间**：O(1)

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [455](https://leetcode.cn/problems/assign-cookies/) | 分发饼干 | 简单 | 排序 + 双指针贪心 |
| [55](https://leetcode.cn/problems/jump-game/) | 跳跃游戏 | 中等 | 维护最远可达位置 |
| [45](https://leetcode.cn/problems/jump-game-ii/) | 跳跃游戏 II | 中等 | 贪心求最少跳跃次数 |
| [134](https://leetcode.cn/problems/gas-station/) | 加油站 | 中等 | 累计净油量，贪心选起点 |
| [435](https://leetcode.cn/problems/non-overlapping-intervals/) | 无重叠区间 | 中等 | 按结束时间排序，区间贪心 |
| [763](https://leetcode.cn/problems/partition-labels/) | 划分字母区间 | 中等 | 记录每个字母最后出现位置，贪心分割 |
| [122](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-ii/) | 买卖股票的最佳时机 II | 中等 | 所有上涨段都买入，贪心 |
| [406](https://leetcode.cn/problems/queue-reconstruction-by-height/) | 根据身高重建队列 | 中等 | 按身高降序排列后逐个插入 |

## 面试常问 & 怎么答

### 怎么证明贪心是对的？

最常用的是**交换论证**：假设存在一个不同于贪心的最优解，交换其中一步为贪心选择，证明结果不会更差。如果面试时不确定能否用贪心，可以先说思路再提"可以用交换论证证明"。

### 贪心和动态规划怎么选？

如果问题有**最优子结构**且贪心选择性质成立（局部最优→全局最优），用贪心。如果贪心不成立（比如 0-1 背包），就必须用 DP。面试时如果不确定，先尝试贪心，发现反例再转 DP。

### 区间问题为什么按结束时间排序？

按结束时间排序后，优先选结束早的区间，给后续区间留出最多空间。按开始时间排序不行，因为开始早但结束晚的区间会占用太多空间。

## 看到什么就先想到这类

- "区间调度/最多不重叠区间"→ 按结束时间排序贪心
- "跳跃到终点/最少跳跃次数"→ 维护最远可达位置
- "分配资源使满足数最多"→ 排序后匹配
- "能否到达/覆盖/完成"→ 贪心模拟
- "买卖股票（不限次数）"→ 所有上涨段贪心
