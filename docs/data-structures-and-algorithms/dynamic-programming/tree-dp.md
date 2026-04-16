---
title: 树形 DP
---

# 树形 DP

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
树形 DP 的本质是：把每个节点当成一个决策点，让子树返回一组状态，然后在当前节点做合并。真正的难点不是代码，而是**定义每个节点需要返回什么信息**。
:::

## 树形 DP 的分析模板

1. 把原问题转成“以某个节点为根时，答案如何表示”。
2. 设计节点返回值，例如“选当前节点 / 不选当前节点”两种状态。
3. 根据左右子树返回结果，在当前节点做状态合并。

## 经典例子：打家劫舍 III

对于每个节点，维护两个状态：

- `selected`：选当前节点时的最大收益。
- `notSelected`：不选当前节点时的最大收益。

```typescript
function rob(root: TreeNode | null): number {
  function dfs(node: TreeNode | null): [number, number] {
    if (!node) return [0, 0]

    const [leftSelected, leftNotSelected] = dfs(node.left)
    const [rightSelected, rightNotSelected] = dfs(node.right)

    const selected = node.val + leftNotSelected + rightNotSelected
    const notSelected = Math.max(leftSelected, leftNotSelected) + Math.max(rightSelected, rightNotSelected)

    return [selected, notSelected]
  }

  const [selected, notSelected] = dfs(root)
  return Math.max(selected, notSelected)
}
```

## 常见题型

| 类型 | 题目特征 |
|------|------|
| 选或不选 | 每个节点有互斥选择 |
| 子树最优 | 当前答案依赖所有子节点 |
| 路径统计 | 需要从子树回传路径信息 |
| 直径/高度 | 需要同时维护“经过当前节点”和“子树内部”答案 |

## 易错点

1. 只定义一个状态，信息不够导致无法转移。
2. 分不清“返回给父节点的信息”和“全局答案”。
3. 把树题写成暴力递归，没有缓存或状态合并。

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道进阶</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 打家劫舍 III（LeetCode 337）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 二叉树中的最大路径和（LeetCode 124）</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 二叉树直径（LeetCode 543）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>