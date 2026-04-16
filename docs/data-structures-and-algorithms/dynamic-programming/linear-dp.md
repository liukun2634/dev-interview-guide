---
title: 线性 DP
---

# 线性 DP

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
线性 DP 指状态可以按某个线性顺序推进，常见形式是 `dp[i]` 或 `dp[i][j]`。面试重点通常不是公式本身，而是你能否准确解释**状态定义、转移来源、初始化和遍历顺序**。
:::

## 典型特征

- 状态通常和下标 `i` 绑定。
- 每一步只依赖更小的下标或更短的区间。
- 常见于爬楼梯、打家劫舍、最长递增子序列、编辑距离。

## 常见状态设计

### 一维状态

`dp[i]` 表示处理到第 `i` 个位置时的最优答案。

示例：爬楼梯

```typescript
function climbStairs(n: number): number {
  if (n <= 2) return n
  const dp = new Array(n + 1).fill(0)
  dp[1] = 1
  dp[2] = 2

  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]
  }

  return dp[n]
}
```

### 二维状态

`dp[i][j]` 表示考虑前 `i` 个元素，在某个限制 `j` 下的答案。

常见于背包问题、编辑距离、最长公共子序列。

## 面试中最容易错的点

1. 状态定义不清，导致转移写不出来。
2. 初始化随手乱填，破坏后续计算。
3. 遍历顺序错误，使用了尚未更新完成的状态。
4. 只会背公式，不能解释“为什么这样转移”。

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">4 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 爬楼梯（LeetCode 70）</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">简单</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 打家劫舍（LeetCode 198）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 最长递增子序列（LeetCode 300）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>4. 编辑距离（LeetCode 72）</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
</div>