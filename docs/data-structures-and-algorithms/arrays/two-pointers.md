---
title: 双指针
---

# 双指针

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
双指针的本质是用两个位置变量维护一个相对关系。左右指针从两端向中间靠拢，快慢指针从同侧同向移动。关键是明确两个指针分别承担什么语义、什么时候移动哪一个。
:::

## 核心思路

**什么时候用双指针？**
- 有序数组上找满足条件的配对 → 左右指针
- 原地删除/去重/分区 → 快慢指针
- 回文串判断 → 左右指针
- 链表找环/中点 → 快慢指针

**为什么有效？** 双指针将 O(n²) 的暴力枚举降到 O(n)，因为每个指针最多遍历一次数组，两个指针的总移动次数不超过 2n。

## 左右指针模板

两个指针分别从数组两端出发，向中间靠拢：

```java
public void leftRightPointer(int[] nums) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        // 根据条件判断移动哪个指针
        if (满足条件) {
            // 记录结果
            left++;   // 或 right--
        } else if (需要更大的值) {
            left++;
        } else {
            right--;
        }
    }
}
```

## 快慢指针模板

两个指针从同一侧出发，slow 维护有效区域，fast 负责扫描：

```java
public int fastSlowPointer(int[] nums) {
    int slow = 0;  // slow 指向有效区域的边界
    for (int fast = 0; fast < nums.length; fast++) {
        if (nums[fast] 满足保留条件) {
            nums[slow] = nums[fast];
            slow++;
        }
    }
    return slow;  // 有效区域的长度
}
```

## 例题 1：[两数之和 II（LeetCode 167）](https://leetcode.cn/problems/two-sum-ii-input-array-is-sorted/)

### 题目描述

给定一个按升序排列的整数数组 `numbers`，找到两个数使得它们的和等于目标值 `target`。返回两个数的下标（1-indexed）。

### 思路分析

1. 数组有序，用左右指针从两端出发
2. `sum = numbers[left] + numbers[right]`
3. 如果 sum == target，找到答案
4. 如果 sum < target，说明需要更大的数，left 右移
5. 如果 sum > target，说明需要更小的数，right 左移

### 完整代码

```java
public int[] twoSum(int[] numbers, int target) {
    int left = 0, right = numbers.length - 1;
    while (left < right) {
        int sum = numbers[left] + numbers[right];
        if (sum == target) {
            return new int[]{left + 1, right + 1};  // 1-indexed
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return new int[]{-1, -1};  // 题目保证有解，不会走到这里
}
```

### 复杂度分析

- **时间**：O(n)，left 和 right 各最多移动 n 次
- **空间**：O(1)

## 例题 2：[删除有序数组中的重复项（LeetCode 26）](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/)

### 题目描述

给定一个升序排列的数组 `nums`，原地删除重复元素，使每个元素只出现一次，返回删除后数组的新长度。

### 思路分析

1. slow 指向最后一个不重复元素的位置
2. fast 从左到右扫描每个元素
3. 当 `nums[fast] != nums[slow]` 时，说明遇到新元素，slow 前进一步，把新元素放到 slow 位置

### 完整代码

```java
public int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    int slow = 0;
    for (int fast = 1; fast < nums.length; fast++) {
        if (nums[fast] != nums[slow]) {
            slow++;
            nums[slow] = nums[fast];
        }
    }
    return slow + 1;
}
```

### 复杂度分析

- **时间**：O(n)，fast 遍历一次数组
- **空间**：O(1)，原地操作

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [125](https://leetcode.cn/problems/valid-palindrome/) | 验证回文串 | 简单 | 左右指针，跳过非字母数字字符 |
| [11](https://leetcode.cn/problems/container-with-most-water/) | 盛最多水的容器 | 中等 | 左右指针，每次移动较短的那一边 |
| [15](https://leetcode.cn/problems/3sum/) | 三数之和 | 中等 | 排序后固定一个数，剩下两个用左右指针 |
| [27](https://leetcode.cn/problems/remove-element/) | 移除元素 | 简单 | 快慢指针，跳过等于 val 的元素 |
| [283](https://leetcode.cn/problems/move-zeroes/) | 移动零 | 简单 | 快慢指针把非零元素前移，剩余填零 |
| [344](https://leetcode.cn/problems/reverse-string/) | 反转字符串 | 简单 | 左右指针交换 |
| [88](https://leetcode.cn/problems/merge-sorted-array/) | 合并两个有序数组 | 简单 | 从后往前的双指针，避免覆盖 |

## 面试常问 & 怎么答

### 双指针和暴力枚举的区别？

暴力枚举是两层循环 O(n²)。双指针利用数组的有序性或单调性，让两个指针各自单向移动，总共只扫描 O(n)。前提是问题具有单调性——当一个指针移动后，另一个指针不需要回退。

### 快慢指针的 slow 指什么？

**slow 永远指向已处理区域的边界**。`[0, slow)` 或 `[0, slow]` 是有效区域（取决于具体题目定义），fast 负责探索未处理部分。面试时先说清楚 slow 的语义，代码就不容易写错。

## 看到什么就先想到这类

- "有序数组 + 两数之和/配对"→ 左右指针
- "原地删除/去重/移动"→ 快慢指针
- "回文串判断"→ 左右指针
- "反转数组/字符串"→ 左右指针交换
- "合并两个有序数组"→ 从后往前双指针
