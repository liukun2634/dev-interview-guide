---
title: 二叉树 Binary Tree
---

# 二叉树 Binary Tree

<span class="dig-tag dig-tag--category">数据结构</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
二叉树是每个节点最多有两个子节点的树形结构。面试中二叉树题目占比极高，核心在于**递归思维**与**四种遍历方式**的灵活运用。掌握 DFS（深度优先）和 BFS（广度优先）是解题关键。
:::

## 基本概念

### 定义

二叉树（Binary Tree）是一种树形数据结构，每个节点最多拥有**两个子节点**，分别称为**左子节点（left child）**和**右子节点（right child）**。

### 常见类型

| 类型 | 定义 | 特点 |
|------|------|------|
| **满二叉树** Full Binary Tree | 每个非叶节点都有两个子节点 | 节点数为 $2^h - 1$，$h$ 为高度 |
| **完全二叉树** Complete Binary Tree | 除最后一层外，其他层节点数达到最大，且最后一层节点靠左排列 | 堆结构的基础 |
| **二叉搜索树** BST | 左子树所有节点 < 根节点 < 右子树所有节点 | 平均查找效率 $O(\log n)$ |
| **AVL 树** | 自平衡 BST，任意节点左右子树高度差 ≤ 1 | 保证 $O(\log n)$ 的最坏情况 |

### 节点定义（TypeScript）

```typescript
class TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null

  constructor(val: number, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val
    this.left = left
    this.right = right
  }
}
```

---

## 四种遍历方式

### 前序遍历 Pre-order（根 → 左 → 右）

```typescript
// Recursive approach
function preorder(root: TreeNode | null): number[] {
  const result: number[] = []

  function dfs(node: TreeNode | null): void {
    if (!node) return
    result.push(node.val)   // visit root first
    dfs(node.left)
    dfs(node.right)
  }

  dfs(root)
  return result
}

// Iterative approach using stack
function preorderIterative(root: TreeNode | null): number[] {
  if (!root) return []
  const result: number[] = []
  const stack: TreeNode[] = [root]

  while (stack.length) {
    const node = stack.pop()!
    result.push(node.val)
    // push right first so left is processed first
    if (node.right) stack.push(node.right)
    if (node.left) stack.push(node.left)
  }

  return result
}
```

### 中序遍历 In-order（左 → 根 → 右）

```typescript
// Recursive approach
function inorder(root: TreeNode | null): number[] {
  const result: number[] = []

  function dfs(node: TreeNode | null): void {
    if (!node) return
    dfs(node.left)
    result.push(node.val)   // visit root in middle
    dfs(node.right)
  }

  dfs(root)
  return result
}

// Iterative approach
function inorderIterative(root: TreeNode | null): number[] {
  const result: number[] = []
  const stack: TreeNode[] = []
  let curr: TreeNode | null = root

  while (curr || stack.length) {
    // go all the way left
    while (curr) {
      stack.push(curr)
      curr = curr.left
    }
    curr = stack.pop()!
    result.push(curr.val)
    curr = curr.right
  }

  return result
}
```

::: info
**BST 中序遍历的结果是升序序列**，这是验证/利用 BST 性质的常用手段。
:::

### 后序遍历 Post-order（左 → 右 → 根）

```typescript
// Recursive approach
function postorder(root: TreeNode | null): number[] {
  const result: number[] = []

  function dfs(node: TreeNode | null): void {
    if (!node) return
    dfs(node.left)
    dfs(node.right)
    result.push(node.val)   // visit root last
  }

  dfs(root)
  return result
}

// Iterative approach: reverse of modified pre-order (root, right, left)
function postorderIterative(root: TreeNode | null): number[] {
  if (!root) return []
  const result: number[] = []
  const stack: TreeNode[] = [root]

  while (stack.length) {
    const node = stack.pop()!
    result.unshift(node.val) // prepend to get left-right-root order
    if (node.left) stack.push(node.left)
    if (node.right) stack.push(node.right)
  }

  return result
}
```

### 层序遍历 Level-order（BFS）

```typescript
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return []
  const result: number[][] = []
  const queue: TreeNode[] = [root]

  while (queue.length) {
    const levelSize = queue.length
    const currentLevel: number[] = []

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!
      currentLevel.push(node.val)
      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }

    result.push(currentLevel)
  }

  return result
}
```

::: info
层序遍历使用**队列（Queue）**而非栈，每一轮循环处理当前层的所有节点，是解决"按层处理"类题目的标准模板。
:::

---

## 常见陷阱

1. **空节点处理**：递归函数必须在第一行检查 `if (!node) return`，遗漏会导致空指针错误。
2. **混淆遍历顺序**：前序、中序、后序的区别在于根节点的访问时机，建议记住"根"的位置（前/中/后）。
3. **层序遍历用错数据结构**：层序需要队列（FIFO），不能用栈（LIFO）。
4. **BST 性质的范围约束**：BST 要求左子树中**所有**节点 < 根，而非仅左子节点 < 根。验证 BST 时需传递 min/max 边界，而非仅比较父子关系。

---

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 二叉树的层序遍历（LeetCode 102）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 二叉树的最大深度（LeetCode 104）</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">简单</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 验证二叉搜索树（LeetCode 98）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

## 面试真题详解

### Q1：二叉树的层序遍历（LeetCode 102）

**题目**：给定一棵二叉树，返回其节点值的层序遍历结果（即逐层从左到右访问所有节点）。

**解题思路**：BFS 标准模板。用一个队列维护待访问节点，每轮处理一整层，记录层大小 `levelSize` 控制内层循环。

```typescript
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return []
  const result: number[][] = []
  const queue: TreeNode[] = [root]

  while (queue.length) {
    const levelSize = queue.length
    const level: number[] = []

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!
      level.push(node.val)
      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }

    result.push(level)
  }

  return result
}
// Time: O(n), Space: O(n)
```

---

### Q2：二叉树的最大深度（LeetCode 104）

**题目**：给定一棵二叉树，求其最大深度（从根节点到最远叶节点的最长路径上的节点数）。

**解题思路**：经典递归。树的深度 = `1 + max(左子树深度, 右子树深度)`，空节点深度为 0。

```typescript
function maxDepth(root: TreeNode | null): number {
  // base case: empty tree has depth 0
  if (!root) return 0

  const leftDepth = maxDepth(root.left)
  const rightDepth = maxDepth(root.right)

  return 1 + Math.max(leftDepth, rightDepth)
}
// Time: O(n), Space: O(h) where h is tree height
```

::: tip
也可以用 BFS 解：层序遍历时统计层数，每处理完一层深度 +1，最终层数即为最大深度。
:::

---

### Q3：验证二叉搜索树（LeetCode 98）

**题目**：给定一棵二叉树，判断其是否为有效的二叉搜索树。

**常见错误**：只检查节点与其直接父节点的大小关系，忽略了 BST 对整棵子树的约束。

**正确思路**：递归时传递合法的值域 `[min, max]`，每个节点必须严格在该范围内。

```typescript
function isValidBST(root: TreeNode | null): boolean {
  function validate(node: TreeNode | null, min: number, max: number): boolean {
    if (!node) return true

    // node value must be strictly within (min, max)
    if (node.val <= min || node.val >= max) return false

    // left subtree: all values must be < node.val
    // right subtree: all values must be > node.val
    return validate(node.left, min, node.val) &&
           validate(node.right, node.val, max)
  }

  return validate(root, -Infinity, Infinity)
}
// Time: O(n), Space: O(h)
```

---

## 延伸阅读

- [LeetCode 102 - Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/)
- [LeetCode 104 - Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/)
- [LeetCode 98 - Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/)
- [LeetCode 94 - Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/)
