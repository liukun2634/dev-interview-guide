---
title: 数组与字符串基础
---

# 数组与字符串基础

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--easy">⭐ 基础</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
数组与字符串题的关键不是记住某一道题，而是先建立统一框架：**遍历顺序、区间定义、辅助信息、边界处理**。只要这四步清楚，很多线性结构题都能快速归类。
:::

## 线性结构题的四个观察点

### 1. 元素之间是否有顺序关系

- 如果数组有序，优先考虑双指针、二分。
- 如果数组无序，但目标是相对大小关系，先考虑排序再处理。

### 2. 问题是否围绕连续区间

- 连续子数组问题通常考虑滑动窗口或前缀和。
- 连续子串问题通常考虑滑动窗口、字符计数。
- 非连续选择问题往往更接近动态规划。

### 3. 是否需要快速查历史信息

- 查“某个值是否出现过”时，优先考虑哈希表。
- 查“某个前缀状态是否出现过”时，常见解法是前缀和 + 哈希。

### 4. 是否要求原地操作

- 原地删除、去重、分区通常都要用快慢指针。
- 原地题常见难点是“哪些位置已经处理完”。

## 常见技巧

| 技巧 | 典型作用 | 代表题型 |
|------|------|------|
| 双指针 | 收缩或扩张区间 | 删除重复项、两数之和 II |
| 滑动窗口 | 维护满足条件的连续子数组 | 最长无重复子串 |
| 字符计数 | 维护频次与匹配关系 | 字母异位词、最小覆盖子串 |
| 前缀和 | 快速求任意区间和 | 和为 K 的子数组 |
| 差分 | 批量区间更新 | 航班预订统计 |

## 面试时的回答框架

1. 先明确这是“单点问题”还是“区间问题”。
2. 再说明是否需要有序性。
3. 最后给出维护变量，例如窗口左右边界、当前和、最优答案。

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道基础</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 删除有序数组中的重复项（LeetCode 26）</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">简单</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 长度最小的子数组（LeetCode 209）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 和为 K 的子数组（LeetCode 560）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>