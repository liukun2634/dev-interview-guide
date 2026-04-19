---
title: 二叉树
---

# 二叉树

<span class="dig-tag dig-tag--category">数据结构</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
二叉树面试题的核心是递归思维。90% 的二叉树题可以归结为一个问题：对于当前节点，我需要从左右子树获取什么信息，然后如何组合出答案？
:::

## 识别信号

拿到题目时，先看题目描述属于哪类信号，快速锁定解法：

| 题目信号 | 推荐方法 | 原因 |
|---------|---------|------|
| "逐层处理" / "最短距离" / "每层的…" | BFS 层序 | 队列天然按层展开 |
| "路径和" / "最大深度" / "子树性质" | DFS 后序（自底向上） | 需要先知道子树结果再处理当前节点 |
| "构建树" / "序列化/反序列化" | DFS 前序（自顶向下） | 根节点先行，方便重建结构 |
| "BST 相关" / "第 K 小" / "有序" | 中序遍历 | BST 中序结果天然有序 |

## 通用思考框架

### 两种递归思路

解二叉树题时，先判断用哪种递归方式：

**1. 分解思路（分治）**

把问题拆成"左子树的答案"和"右子树的答案"，合并得到当前节点的答案。函数有返回值。

```
当前答案 = combine(solve(root.left), solve(root.right))
```

适用条件：当前节点的答案**只依赖**子树返回的结果，不需要路径上的全局状态。

**2. 遍历思路（回溯）**

用一个外部变量记录答案，遍历整棵树的过程中不断更新它。函数通常无返回值（或返回 void）。

```
void traverse(node) {
    // 更新全局答案
    traverse(node.left);
    traverse(node.right);
}
```

适用条件：需要追踪从根到当前节点的路径、或跨子树的累计状态。

> **选择口诀**：答案只看子树结果 → 分解；需要追踪路径/全局状态 → 遍历。

### 四种遍历的选择

| 遍历方式 | 访问顺序 | 适用场景 | 典型题 |
|---------|---------|---------|-------|
| 前序 | 根 → 左 → 右 | 需要先处理根再处理子树 | 序列化、构建树 |
| 中序 | 左 → 根 → 右 | BST 题（结果有序） | 验证 BST、第 K 小 |
| 后序 | 左 → 右 → 根 | 需要先知道子树信息再处理根 | 最大深度、路径和、平衡判断 |
| 层序 | 逐层从左到右 | 按层处理、最短距离 | 层序遍历、右视图 |

## 基本概念

### 节点定义（Java）

```java
public class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }

    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
```

### 常见类型

| 类型 | 定义 | 特点 |
|------|------|------|
| **满二叉树** Full Binary Tree | 每个非叶节点都有两个子节点 | 节点数为 $2^h - 1$，$h$ 为高度 |
| **完全二叉树** Complete Binary Tree | 除最后一层外，其他层节点数达到最大，且最后一层节点靠左排列 | 堆结构的基础 |
| **二叉搜索树** BST | 左子树所有节点 < 根节点 < 右子树所有节点 | 平均查找效率 $O(\log n)$ |
| **AVL 树** | 自平衡 BST，任意节点左右子树高度差 ≤ 1 | 保证 $O(\log n)$ 的最坏情况 |

## 遍历模板

### 前序遍历（根 → 左 → 右）

```java
// 递归
List<Integer> result = new ArrayList<>();

void preorder(TreeNode root) {
    if (root == null) return;
    result.add(root.val);   // 先访问根
    preorder(root.left);
    preorder(root.right);
}

// 迭代（栈）
List<Integer> preorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;

    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.add(node.val);
        // 先压右再压左，保证左先出栈
        if (node.right != null) stack.push(node.right);
        if (node.left != null) stack.push(node.left);
    }
    return result;
}
```

### 中序遍历（左 → 根 → 右）

```java
// 递归
void inorder(TreeNode root) {
    if (root == null) return;
    inorder(root.left);
    result.add(root.val);   // 中间访问根
    inorder(root.right);
}

// 迭代（栈 + curr 指针）
List<Integer> inorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        // 一路向左压栈
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }
        curr = stack.pop();
        result.add(curr.val);
        curr = curr.right;  // 转向右子树
    }
    return result;
}
```

::: info
**BST 中序遍历的结果是升序序列**，这是验证/利用 BST 有序性的核心手段。
:::

### 后序遍历（左 → 右 → 根）

```java
// 递归
void postorder(TreeNode root) {
    if (root == null) return;
    postorder(root.left);
    postorder(root.right);
    result.add(root.val);   // 最后访问根
}

// 迭代（改造前序：根→右→左，然后反转结果）
List<Integer> postorderIterative(TreeNode root) {
    LinkedList<Integer> result = new LinkedList<>();
    if (root == null) return result;

    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.addFirst(node.val);  // 头插，相当于反转
        if (node.left != null) stack.push(node.left);
        if (node.right != null) stack.push(node.right);
    }
    return result;
}
```

### 层序遍历（BFS）

```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size();   // 当前层节点数
        List<Integer> level = new ArrayList<>();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}
```

::: info
层序遍历使用**队列（Queue）**而非栈。用 `levelSize = queue.size()` 在每层开始时"锁定"当前层的节点数，是控制逐层处理的标准技巧。
:::

## 典型例题：二叉树的最大深度

[LeetCode 104 - 二叉树的最大深度](https://leetcode.cn/problems/maximum-depth-of-binary-tree/)

**题目**：给定一棵二叉树，返回其最大深度（根节点到最远叶节点的最长路径上的节点数）。

### 分解思路（推荐）

树的深度 = `1 + max(左子树深度, 右子树深度)`，空树深度为 0。这是典型的**后序分解**。

```java
public int maxDepth(TreeNode root) {
    // base case：空节点深度为 0
    if (root == null) return 0;

    int leftDepth = maxDepth(root.left);
    int rightDepth = maxDepth(root.right);

    // 当前节点的深度 = 子树最大深度 + 1
    return 1 + Math.max(leftDepth, rightDepth);
}
// 时间复杂度：O(n)，每个节点访问一次
// 空间复杂度：O(h)，h 为树高，递归栈深度
```

### 遍历思路（BFS 计层数）

也可以用层序遍历：每处理完一层深度 +1，最终层数即为最大深度。

```java
public int maxDepthBFS(TreeNode root) {
    if (root == null) return 0;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    int depth = 0;

    while (!queue.isEmpty()) {
        int levelSize = queue.size();
        depth++;
        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }
    return depth;
}
```

## 延伸题目

| 题目 | 链接 | 与典型题的区别 | 关键技巧 |
|------|------|--------------|---------|
| 层序遍历 | [LC 102](https://leetcode.cn/problems/binary-tree-level-order-traversal/) | BFS 模板直接应用 | Queue + levelSize 控制每层 |
| 翻转二叉树 | [LC 226](https://leetcode.cn/problems/invert-binary-tree/) | 前序遍历，每个节点交换左右子 | 递归先 swap 再递归两侧 |
| 对称二叉树 | [LC 101](https://leetcode.cn/problems/symmetric-tree/) | 双指针递归，同时从两侧比较 | 比较左.left vs 右.right，左.right vs 右.left |
| 验证 BST | [LC 98](https://leetcode.cn/problems/validate-binary-search-tree/) | 需要传递整棵子树的 min/max 范围 | 递归传边界 `(min, max)`，不能只比父子 |
| 从前序与中序构造二叉树 | [LC 105](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) | 前序确定根，中序划分左右子树 | HashMap 存中序位置，避免每次线性查找 |
| 二叉树的右视图 | [LC 199](https://leetcode.cn/problems/binary-tree-right-side-view/) | BFS 取每层最后一个节点 | 层序遍历变体，`i == levelSize - 1` 时记录 |
| 平衡二叉树 | [LC 110](https://leetcode.cn/problems/balanced-binary-tree/) | 后序遍历 + 提前剪枝 | 返回 -1 表示已不平衡，避免重复计算高度 |

## 常见陷阱与调试

| 错误 | 症状 | 解决方法 |
|------|------|---------|
| 忘记空节点检查 | NullPointerException / 栈溢出 | 递归函数第一行加 `if (root == null) return ...` |
| 混淆遍历顺序 | 结果顺序错误，BST 题值不有序 | 记住"根"的位置：**前**序=根在前，**中**序=根居中，**后**序=根在后 |
| 层序用了栈而非队列 | 遍历结果是深度优先而非按层 | 层序必须用 `Queue`（FIFO），不能用 `Stack`（LIFO） |
| BST 验证只比父子关系 | 某些非法 BST 被误判为合法 | 递归时传递 `(long min, long max)` 范围边界，不能只看相邻两层 |
| 分解思路用了全局变量 | 变量在多次调用间互相污染 | 分解思路应通过**返回值**传递信息，全局变量留给遍历思路 |
