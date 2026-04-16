---
title: 复杂度与递归
---

# 复杂度与递归

<span class="dig-tag dig-tag--category">基础方法</span> <span class="dig-tag dig-tag--easy">⭐ 基础</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
复杂度回答的是“解法值不值得用”，递归回答的是“问题能不能自然拆开”。这两个能力是后续所有专题的共同前置知识。
:::

## 复杂度分析看什么

### 时间复杂度

- 看主循环执行多少次。
- 看递归树展开了多少层。
- 看每层做了多少工作。

### 空间复杂度

- 额外数组、哈希表、栈的大小。
- 递归调用栈是否会额外占空间。

## 递归分析模板

1. 函数定义是什么。
2. 递归终止条件是什么。
3. 当前层做什么。
4. 子问题返回后如何合并。

## 常见误区

1. 只会背 $O(n)$、$O(\log n)$，不会解释来源。
2. 递归只会写，不会说函数语义。
3. 忽略递归栈空间，把空间复杂度说错。

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 个基础追问</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 这个解法的时间复杂度和空间复杂度分别是多少？</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">基础</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 递归为什么一定会结束？</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">基础</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 递归能不能改成迭代？代价是什么？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>