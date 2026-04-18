---
title: 回溯
---

# 回溯

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
回溯 = DFS + 撤销选择。本质是在决策树上穷举，通过**剪枝**减少搜索量。全排列、组合、子集、棋盘搜索都用同一套模板：做选择 → 递归 → 撤销选择。
:::

## 核心思路

**什么时候用回溯？**
- 求所有排列、组合、子集
- 棋盘搜索（N 皇后、数独）
- 分割字符串（回文分割、IP 地址）
- 题目要求"所有方案/所有可能"

**为什么有效？** 系统地穷举所有可能，通过剪枝跳过不可能的分支，比暴力枚举更高效。

## 回溯模板

```java
List<List<Integer>> result = new ArrayList<>();

public void backtrack(int[] nums, List<Integer> path, /* 其他状态 */) {
    // 终止条件：收集答案
    if (满足条件) {
        result.add(new ArrayList<>(path));  // 注意要 new 一份
        return;
    }

    for (int i = start; i < nums.length; i++) {
        // 剪枝（可选）
        if (不合法) continue;

        path.add(nums[i]);          // 做选择
        backtrack(nums, path, ...); // 递归
        path.remove(path.size()-1); // 撤销选择
    }
}
```

**三类经典问题的区别：**

| 问题 | 特点 | 关键处理 |
|------|------|------|
| 子集 | 每个元素选或不选 | 每个节点都收集答案 |
| 组合 | 选 k 个元素 | path 长度 = k 时收集 |
| 排列 | 所有元素排序 | 用 visited 数组标记已用元素 |

## 例题 1：[全排列（LeetCode 46）](https://leetcode.cn/problems/permutations/)

### 题目描述

给定不含重复数字的数组 `nums`，返回其所有可能的全排列。

### 思路分析

1. 排列问题：每个元素都可能在任意位置，用 visited 标记已使用的元素
2. path 长度等于 nums 长度时收集答案
3. 每次从头遍历 nums，跳过已使用的元素

### 完整代码

```java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    boolean[] used = new boolean[nums.length];
    backtrack(nums, new ArrayList<>(), used, result);
    return result;
}

private void backtrack(int[] nums, List<Integer> path, boolean[] used,
                       List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, path, used, result);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

### 复杂度分析

- **时间**：O(n × n!)，共 n! 个排列，每个排列复制 O(n)
- **空间**：O(n)，递归深度 + path

## 例题 2：[子集（LeetCode 78）](https://leetcode.cn/problems/subsets/)

### 题目描述

给定不含重复元素的整数数组 `nums`，返回该数组所有可能的子集。

### 思路分析

1. 子集问题：每个元素选或不选，每个递归节点都是一个合法子集
2. 用 start 控制遍历起点，避免重复（`[1,2]` 和 `[2,1]` 是同一个子集）
3. 每次递归直接收集当前 path

### 完整代码

```java
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> path,
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(path));  // 每个节点都收集

    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(nums, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

### 复杂度分析

- **时间**：O(n × 2^n)，共 2^n 个子集
- **空间**：O(n)，递归深度

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [46](https://leetcode.cn/problems/permutations/) | 全排列 | 中等 | 排列模板，used 数组标记 |
| [47](https://leetcode.cn/problems/permutations-ii/) | 全排列 II | 中等 | 含重复元素，排序 + 跳过相同元素 |
| [78](https://leetcode.cn/problems/subsets/) | 子集 | 中等 | 子集模板，每个节点收集 |
| [90](https://leetcode.cn/problems/subsets-ii/) | 子集 II | 中等 | 含重复元素，排序后同层去重 |
| [39](https://leetcode.cn/problems/combination-sum/) | 组合总和 | 中等 | 元素可重复使用，start 不变 |
| [40](https://leetcode.cn/problems/combination-sum-ii/) | 组合总和 II | 中等 | 元素不重复使用，同层去重 |
| [51](https://leetcode.cn/problems/n-queens/) | N 皇后 | 困难 | 按行放皇后，检查列和对角线 |
| [79](https://leetcode.cn/problems/word-search/) | 单词搜索 | 中等 | 网格回溯，标记已访问 |
| [131](https://leetcode.cn/problems/palindrome-partitioning/) | 分割回文串 | 中等 | 枚举分割位置，检查回文 |

## 面试常问 & 怎么答

### 含重复元素时怎么去重？

先排序，然后在同一层中跳过和前一个相同的元素：`if (i > start && nums[i] == nums[i-1]) continue;`。这里 `i > start` 保证只跳过同层的重复，不影响不同层的选择。

### 组合和排列的代码区别在哪？

组合用 `start` 参数控制起点，每次从 `start` 开始遍历，保证不回头。排列用 `used` 数组标记，每次从 0 开始遍历，跳过已使用的元素。

### 回溯的时间复杂度怎么分析？

排列问题：O(n!)。子集/组合问题：O(2^n)。本质是决策树的叶子节点数。剪枝可以减少实际搜索量，但最坏复杂度不变。

## 看到什么就先想到这类

- "所有排列"→ 回溯 + used 数组
- "所有子集/组合"→ 回溯 + start 参数
- "分割字符串的所有方式"→ 回溯 + 枚举分割点
- "棋盘放置（N 皇后/数独）"→ 回溯 + 约束检查
- "含重复元素的排列/子集/组合"→ 排序 + 同层去重
