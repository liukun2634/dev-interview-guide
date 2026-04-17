---
title: 二分查找
---

# 二分查找

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
二分查找的核心是**缩小搜索区间**：每次通过中间值的判断，排除一半不可能的区间。关键是明确区间定义（左闭右闭 vs 左闭右开）和循环终止条件，写错一个边界就可能死循环或漏解。
:::

## 核心思路

**什么时候用二分查找？**
- 有序数组中查找目标值
- 有序数组中查找满足条件的边界（第一个 >= x 的位置、最后一个 <= x 的位置）
- 答案具有单调性，可以"二分答案"

**为什么有效？** 将 O(n) 的线性查找降到 O(log n)，每次排除一半。

## 标准二分模板（左闭右闭）

查找目标值是否存在：

```java
public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;  // [left, right]
    while (left <= right) {                   // 区间非空时继续
        int mid = left + (right - left) / 2;  // 防溢出
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;   // target 在右半部分
        } else {
            right = mid - 1;  // target 在左半部分
        }
    }
    return -1;  // 未找到
}
```

**要点：**
- `left <= right`：左闭右闭区间，`left == right` 时区间仍有一个元素需要检查
- `mid = left + (right - left) / 2`：防止 `(left + right)` 整数溢出
- `left = mid + 1` / `right = mid - 1`：mid 已经检查过，排除它

## 查找左边界模板

查找第一个 >= target 的位置（lower bound）：

```java
public int lowerBound(int[] nums, int target) {
    int left = 0, right = nums.length;  // [left, right) 左闭右开
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) {
            left = mid + 1;  // mid 不是答案，排除
        } else {
            right = mid;     // mid 可能是答案，保留
        }
    }
    return left;  // left == right，就是第一个 >= target 的位置
}
```

## 查找右边界模板

查找最后一个 <= target 的位置（upper bound - 1）：

```java
public int upperBound(int[] nums, int target) {
    int left = 0, right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] <= target) {
            left = mid + 1;  // mid 可能是答案，但还要往右找
        } else {
            right = mid;
        }
    }
    return left - 1;  // 最后一个 <= target 的位置
}
```

## 例题 1：[搜索旋转排序数组（LeetCode 33）](https://leetcode.cn/problems/search-in-rotated-sorted-array/)

### 题目描述

整数数组 `nums` 按升序排列后在某个位置旋转（如 `[4,5,6,7,0,1,2]`）。给定一个目标值 `target`，如果存在返回下标，否则返回 -1。要求 O(log n)。

### 思路分析

1. 虽然数组被旋转了，但二分后 `[left, mid]` 和 `[mid, right]` 一定有一半是有序的
2. 先判断哪半边有序，再判断 target 是否在有序的那半边
3. 如果在，就在有序半边继续二分；否则去另一半

### 完整代码

```java
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;

        // 左半段有序
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) {
                right = mid - 1;  // target 在左半段
            } else {
                left = mid + 1;   // target 在右半段
            }
        }
        // 右半段有序
        else {
            if (nums[mid] < target && target <= nums[right]) {
                left = mid + 1;   // target 在右半段
            } else {
                right = mid - 1;  // target 在左半段
            }
        }
    }
    return -1;
}
```

### 复杂度分析

- **时间**：O(log n)
- **空间**：O(1)

## 例题 2：[在排序数组中查找元素的第一个和最后一个位置（LeetCode 34）](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/)

### 题目描述

给定一个升序整数数组 `nums` 和目标值 `target`，找出目标值在数组中的开始位置和结束位置。不存在返回 `[-1, -1]`。要求 O(log n)。

### 思路分析

1. 分别用左边界和右边界二分
2. 左边界：找第一个 >= target 的位置，检查是否等于 target
3. 右边界：找第一个 > target 的位置减 1

### 完整代码

```java
public int[] searchRange(int[] nums, int target) {
    int first = lowerBound(nums, target);
    // 检查 first 是否有效且等于 target
    if (first == nums.length || nums[first] != target) {
        return new int[]{-1, -1};
    }
    // 最后一个 target = 第一个 > target 的位置 - 1
    int last = lowerBound(nums, target + 1) - 1;
    return new int[]{first, last};
}

private int lowerBound(int[] nums, int target) {
    int left = 0, right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;
}
```

### 复杂度分析

- **时间**：O(log n)，两次二分
- **空间**：O(1)

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [704](https://leetcode.cn/problems/binary-search/) | 二分查找 | 简单 | 最基础的标准二分模板练习 |
| [35](https://leetcode.cn/problems/search-insert-position/) | 搜索插入位置 | 简单 | 就是 lower_bound |
| [74](https://leetcode.cn/problems/search-a-2d-matrix/) | 搜索二维矩阵 | 中等 | 把二维展开为一维做二分 |
| [153](https://leetcode.cn/problems/find-minimum-in-rotated-sorted-array/) | 寻找旋转排序数组中的最小值 | 中等 | 二分，比较 mid 和 right |
| [162](https://leetcode.cn/problems/find-peak-element/) | 寻找峰值 | 中等 | 二分，比较 mid 和 mid+1 的大小 |
| [875](https://leetcode.cn/problems/koko-eating-bananas/) | 爱吃香蕉的珂珂 | 中等 | 二分答案，验证速度是否可行 |
| [69](https://leetcode.cn/problems/sqrtx/) | x 的平方根 | 简单 | 二分答案，找最大的 k 满足 k² <= x |

## 面试常问 & 怎么答

### `left <= right` 和 `left < right` 怎么选？

取决于区间定义。**左闭右闭** `[left, right]` 用 `left <= right`，因为 `left == right` 时区间还有一个元素。**左闭右开** `[left, right)` 用 `left < right`，因为 `left == right` 时区间为空。选定一种，整道题保持一致即可。

### 为什么写 `mid = left + (right - left) / 2`？

防止 `left + right` 超过 int 最大值导致溢出。在 Java 中 int 最大约 21 亿，两个大数相加会溢出成负数。

### 二分查找一定要数组有序吗？

不一定是全局有序。只要能通过 mid 的判断排除一半区间就行。例如旋转数组（部分有序）、峰值查找（局部单调）、二分答案（答案空间单调）。

## 看到什么就先想到这类

- "有序数组 + 查找"→ 标准二分
- "第一个/最后一个满足条件的位置"→ 左边界/右边界二分
- "旋转排序数组"→ 二分，判断哪半边有序
- "最小化最大值/最大化最小值"→ 二分答案
- "O(log n) 要求"→ 几乎一定是二分
