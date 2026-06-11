---
title: 二叉搜索树
---

# 二叉搜索树

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
二叉搜索树的核心性质是**中序遍历有序**。验证、查找、范围查询等问题都在利用这条性质。掌握递归遍历 + 上下界验证两种思路，BST 题就能稳定解决。
:::

## 核心思路

**什么时候用 BST 性质？**
- 验证一棵树是否是合法 BST
- 在 BST 中查找、插入、删除节点
- 查找第 K 小/大元素
- 查找最近公共祖先（利用有序性剪枝）

**核心性质：**
- 左子树所有节点值 < 根节点
- 右子树所有节点值 > 根节点
- 中序遍历结果是严格递增序列

## BST 查找模板

```java
public TreeNode searchBST(TreeNode root, int val) {
    while (root != null) {
        if (val == root.val) return root;
        else if (val < root.val) root = root.left;
        else root = root.right;
    }
    return null;
}
```

## BST 插入模板

```java
public TreeNode insertIntoBST(TreeNode root, int val) {
    if (root == null) return new TreeNode(val);
    if (val < root.val) root.left = insertIntoBST(root.left, val);
    else root.right = insertIntoBST(root.right, val);
    return root;
}
```

## 中序遍历模板

```java
// 迭代版中序遍历（用于 BST 第 K 小等问题）
public void inorder(TreeNode root) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;
    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }
        curr = stack.pop();
        // 处理 curr.val（此时是有序的）
        curr = curr.right;
    }
}
```

## 例题 1：[验证二叉搜索树（LeetCode 98）](https://leetcode.cn/problems/validate-binary-search-tree/)

### 题目描述

给定二叉树的根节点 `root`，判断其是否是一个有效的二叉搜索树。

### 思路分析

1. 不能只检查每个节点和左右子节点的关系，要检查所有左子树节点 < 根 < 所有右子树节点
2. 用上下界递归：每个节点有一个合法的取值范围 `(lower, upper)`
3. 往左子树走时更新上界，往右子树走时更新下界

### 完整代码

```java
public boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean validate(TreeNode node, long lower, long upper) {
    if (node == null) return true;
    if (node.val <= lower || node.val >= upper) return false;
    return validate(node.left, lower, node.val)
        && validate(node.right, node.val, upper);
}
```

### 复杂度分析

- **时间**：O(n)，每个节点访问一次
- **空间**：O(h)，h 为树高，递归栈深度

## 例题 2：[二叉搜索树中第 K 小的元素（LeetCode 230）](https://leetcode.cn/problems/kth-smallest-element-in-a-bst/)

### 题目描述

给定一个二叉搜索树的根节点 `root` 和整数 `k`，返回树中第 `k` 小的元素（1-indexed）。

### 思路分析

1. BST 中序遍历是递增序列，第 K 小就是中序遍历的第 K 个元素
2. 用迭代中序遍历，遍历到第 K 个就返回，不需要遍历完整棵树

### 完整代码

```java
public int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }
        curr = stack.pop();
        if (--k == 0) return curr.val;
        curr = curr.right;
    }
    return -1;  // 不会到这里
}
```

### 复杂度分析

- **时间**：O(H + k)，H 为树高
- **空间**：O(H)

## 例题 3：[删除二叉搜索树中的节点（LeetCode 450）](https://leetcode.cn/problems/delete-node-in-a-bst/)

::: warning 🔥 必背手撕题
BST 删除是面试高频题，能否分清三种情况、能否正确处理"双子树用后继替换"是核心考点。
:::

### 题目描述

给定 BST 的根节点 `root` 和值 `key`，删除 BST 中 `key` 对应的节点，并保持 BST 性质，返回根节点的引用。

### 三种情况的分类

删除 BST 节点比插入难，根本原因是**删完之后还得保持 BST 性质**。把要删的节点分三类讨论：

| 情况 | 子树形态 | 处理方式 | 原理 |
|------|------|------|------|
| **① 叶子** | 无左无右 | 直接返回 `null` | 删了不影响任何子树 |
| **② 单子树** | 只有左 / 只有右 | 用唯一的子树替换当前节点 | 单子树本身就是合法 BST |
| **③ 双子树** | 左右都有 | 找**中序后继**（右子树最左）替换 val，再递归删除后继 | 后继是右子树中**最小**的，替换后仍满足"左 < 根 < 右" |

**为什么用后继不用前驱？** 用前驱（左子树最右）也行，效果对称。约定俗成用后继，因为推导更直观。

### 完整代码

```java
public TreeNode deleteNode(TreeNode root, int key) {
    if (root == null) return null;

    if (key < root.val) {
        root.left = deleteNode(root.left, key);     // 去左子树删
    } else if (key > root.val) {
        root.right = deleteNode(root.right, key);   // 去右子树删
    } else {
        // ★ 找到要删的节点
        if (root.left == null) return root.right;   // 情况①②：叶子返回 null；只有右子树返回右
        if (root.right == null) return root.left;   // 情况②：只有左子树返回左

        // 情况③：双子树，找中序后继（右子树最左节点）
        TreeNode successor = root.right;
        while (successor.left != null) {
            successor = successor.left;
        }
        root.val = successor.val;                   // ★ 替换 val（不真删当前节点）
        root.right = deleteNode(root.right, successor.val);  // ★ 在右子树中递归删除后继
    }
    return root;
}
```

### 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 直接 `return null` 删节点 | 子树没接回，结构断了 | 必须 `root.left = deleteNode(...)`，**用返回值接住** |
| 找后继时从 `root` 出发 | 找成自己 | 必须从 `root.right` 出发再一路往左 |
| 双子树时不递归删除后继 | 后继的 val 出现两次 | 替换 val 后必须再递归把后继节点删掉 |
| 忘记 `if (root == null)` 终止 | 空树或递归到底时 NPE | 第一行必须判空返回 |

### 复杂度分析

- **时间**：O(H)，H 为树高（平均 O(log n)，最差 O(n)）
- **空间**：O(H)，递归栈

### 追问：能否不替换 val，直接重连节点

可以，但代码复杂得多——要找到后继节点和它的父节点，重新串接 4 条指针。**面试中"替换 val 法"是首选**，代码短、不易错。只有当节点 val 是大对象、复制代价高时才考虑重连指针法。

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [700](https://leetcode.cn/problems/search-in-a-binary-search-tree/) | 二叉搜索树中的搜索 | 简单 | BST 查找基础练习 |
| [701](https://leetcode.cn/problems/insert-into-a-binary-search-tree/) | 二叉搜索树中的插入操作 | 中等 | 递归找到空位插入 |
| [450](https://leetcode.cn/problems/delete-node-in-a-bst/) | 删除二叉搜索树中的节点 | 中等 | 分三种情况，双子树时用后继替换 |
| [108](https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/) | 将有序数组转换为二叉搜索树 | 简单 | 取中间元素为根，递归建树 |
| [235](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-search-tree/) | 二叉搜索树的最近公共祖先 | 中等 | 利用 BST 有序性，比通用 LCA 简单 |
| [538](https://leetcode.cn/problems/convert-bst-to-greater-tree/) | 把二叉搜索树转换为累加树 | 中等 | 反向中序遍历（右→根→左）累加 |

## 面试常问 & 怎么答

### 验证 BST 为什么不能只比较父子节点？

`[5, 1, 6, null, null, 3, 7]` 中节点 3 在 6 的左子树（3 < 6 ✓），但 3 也在 5 的右子树（3 < 5 ✗）。必须保证左子树**所有**节点小于根，用上下界递归才正确。

### BST 的查找/插入/删除时间复杂度？

平均 O(log n)，最差 O(n)（退化为链表）。要保证 O(log n) 需要自平衡（AVL 树、红黑树），但面试中一般不要求实现自平衡。

### 删除 BST 节点的三种情况？

1. **叶子节点**：直接删除。2. **只有一个子树**：用子树替换当前节点。3. **有两个子树**：找中序后继（右子树最左节点）替换当前节点值，然后删除后继。详细代码见上面例题 3。

## 看到什么就先想到这类

- "验证是否是 BST"→ 上下界递归 / 中序遍历判断递增
- "BST 第 K 小/大"→ 中序遍历
- "BST 最近公共祖先"→ 利用有序性分叉
- "有序数组/链表转 BST"→ 取中间元素递归建树
- "BST 中查找/插入/删除"→ 根据大小走左右子树
