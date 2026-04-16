---
title: 状态压缩 DP
---

# 状态压缩 DP

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
状态压缩 DP 适合“元素总数不大，但选择集合很多”的问题。它用一个二进制整数表示“哪些元素已被选过”，从而把集合状态转成可枚举的整数状态。
:::

## 为什么能压缩

如果元素个数是 `n`，那么一个集合状态可以用 `n` 位二进制表示：

- 第 `k` 位为 `1`，表示第 `k` 个元素已选择。
- 第 `k` 位为 `0`，表示第 `k` 个元素未选择。

因此总状态数是 $2^n$，适合 `n <= 20` 左右的问题。

## 常见套路

### 1. 集合型最短路 / 最优值

`dp[mask]` 表示达到集合 `mask` 时的最优答案。

### 2. 位置 + 集合

`dp[mask][i]` 表示已经访问过集合 `mask`，并且当前停在 `i` 的最优答案。

这是旅行商问题、最短哈密顿路径的典型状态。

## 示例框架

```typescript
function tsp(dist: number[][]): number {
  const n = dist.length
  const total = 1 << n
  const dp = Array.from({ length: total }, () => new Array(n).fill(Infinity))
  dp[1][0] = 0

  for (let mask = 0; mask < total; mask++) {
    for (let u = 0; u < n; u++) {
      if (dp[mask][u] === Infinity) continue
      for (let v = 0; v < n; v++) {
        if ((mask & (1 << v)) !== 0) continue
        const nextMask = mask | (1 << v)
        dp[nextMask][v] = Math.min(dp[nextMask][v], dp[mask][u] + dist[u][v])
      }
    }
  }

  return Math.min(...dp[total - 1])
}
```

## 面试时要强调的点

1. 为什么可以用位运算表示状态。
2. 当前转移是在“加入一个新元素”还是“删掉一个元素”。
3. 状态数和时间复杂度分别是多少。

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道进阶</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 旅行商问题 / 最短哈密顿路径</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 火柴拼正方形（LeetCode 473）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 优美的排列（LeetCode 526）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>