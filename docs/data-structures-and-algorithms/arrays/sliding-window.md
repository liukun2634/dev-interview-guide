---
title: 滑动窗口
---

# 滑动窗口

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
滑动窗口是双指针的特化形式，专门处理**连续子数组/子串**问题。核心操作是：右指针扩张窗口纳入新元素，左指针收缩窗口剔除旧元素，在窗口满足/不满足条件的临界点更新答案。
:::

## 核心思路

**什么时候用滑动窗口？**
- 题目要求连续子数组或子串
- 求最长/最短/满足条件的连续区间
- 窗口内的状态可以通过增删边界元素高效维护（O(1) 更新）

**为什么有效？** 暴力枚举所有子数组是 O(n²)，滑动窗口让左右指针各自单向移动，总移动次数 O(n)。

## 可变窗口模板

窗口大小不固定，左右指针根据条件伸缩：

```java
public int slidingWindow(int[] nums) {
    int left = 0;
    int result = 0;
    // 维护窗口状态的变量（如 sum、频率数组、HashMap 等）

    for (int right = 0; right < nums.length; right++) {
        // 1. 右指针元素纳入窗口，更新窗口状态

        // 2. 当窗口不满足条件时，收缩左指针
        while (窗口不满足条件) {
            // 左指针元素移出窗口，更新窗口状态
            left++;
        }

        // 3. 此时窗口满足条件，更新答案
        result = Math.max(result, right - left + 1);  // 求最长
        // result = Math.min(result, right - left + 1); // 求最短
    }
    return result;
}
```

**模板说明：**
- 求**最长**：窗口合法时更新答案，不合法时收缩
- 求**最短**：窗口满足条件时立刻更新答案并收缩，尝试找更短的

## 固定窗口模板

窗口大小固定为 k：

```java
public int fixedWindow(int[] nums, int k) {
    int result = 0;
    // 窗口状态变量

    for (int i = 0; i < nums.length; i++) {
        // 纳入右边界元素

        if (i >= k) {
            // 移出左边界元素（i - k 位置）
        }

        if (i >= k - 1) {
            // 窗口填满，更新答案
        }
    }
    return result;
}
```

## 例题 1：[无重复字符的最长子串（LeetCode 3）](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)

### 题目描述

给定一个字符串 `s`，找出不含重复字符的最长子串的长度。

### 思路分析

1. 用滑动窗口维护一个无重复字符的区间 `[left, right]`
2. 右指针扩张时，如果新字符已在窗口中出现，收缩左指针直到窗口内无重复
3. 用 `int[128]` 记录每个字符在窗口中的出现次数

### 完整代码

```java
public int lengthOfLongestSubstring(String s) {
    int[] freq = new int[128];  // ASCII 字符频率
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        freq[c]++;

        // 窗口内有重复字符，收缩左指针
        while (freq[c] > 1) {
            freq[s.charAt(left)]--;
            left++;
        }

        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

### 复杂度分析

- **时间**：O(n)，left 和 right 各最多移动 n 次
- **空间**：O(1)，freq 数组大小固定 128

## 例题 2：[最小覆盖子串（LeetCode 76）](https://leetcode.cn/problems/minimum-window-substring/)

### 题目描述

给定字符串 `s` 和 `t`，找出 `s` 中包含 `t` 所有字符的最小子串。

### 思路分析

1. 先统计 `t` 中每个字符的频率（need）
2. 用滑动窗口扫描 `s`，维护窗口内各字符的频率（window）
3. 当窗口满足覆盖条件时（所有需要的字符都够了），尝试收缩左指针找更短的
4. 用 `valid` 变量记录已经满足的字符种类数

### 完整代码

```java
public String minWindow(String s, String t) {
    Map<Character, Integer> need = new HashMap<>();
    Map<Character, Integer> window = new HashMap<>();
    for (char c : t.toCharArray()) {
        need.merge(c, 1, Integer::sum);
    }

    int left = 0, valid = 0;
    int start = 0, minLen = Integer.MAX_VALUE;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (need.containsKey(c)) {
            window.merge(c, 1, Integer::sum);
            if (window.get(c).equals(need.get(c))) {
                valid++;
            }
        }

        // 窗口已覆盖 t 的所有字符，尝试收缩
        while (valid == need.size()) {
            if (right - left + 1 < minLen) {
                minLen = right - left + 1;
                start = left;
            }
            char d = s.charAt(left);
            if (need.containsKey(d)) {
                if (window.get(d).equals(need.get(d))) {
                    valid--;
                }
                window.merge(d, -1, Integer::sum);
            }
            left++;
        }
    }
    return minLen == Integer.MAX_VALUE ? "" : s.substring(start, start + minLen);
}
```

### 复杂度分析

- **时间**：O(|s| + |t|)，两个指针各遍历 s 一次，统计 t 一次
- **空间**：O(|字符集|)，HashMap 存储字符频率

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [209](https://leetcode.cn/problems/minimum-size-subarray-sum/) | 长度最小的子数组 | 中等 | 可变窗口求最短，sum >= target 时收缩 |
| [438](https://leetcode.cn/problems/find-all-anagrams-in-a-string/) | 找到字符串中所有字母异位词 | 中等 | 固定窗口大小 = t.length，比较频率数组 |
| [567](https://leetcode.cn/problems/permutation-in-string/) | 字符串的排列 | 中等 | 和 438 思路相同，判断窗口内是否是排列 |
| [424](https://leetcode.cn/problems/longest-repeating-character-replacement/) | 替换后的最长重复字符 | 中等 | 窗口长度 - 最多频率字符 <= k 时合法 |
| [904](https://leetcode.cn/problems/fruit-into-baskets/) | 水果成篮 | 中等 | 窗口内最多两种元素，用 HashMap 维护 |
| [239](https://leetcode.cn/problems/sliding-window-maximum/) | 滑动窗口最大值 | 困难 | 固定窗口 + 单调队列维护最大值 |

## 面试常问 & 怎么答

### 滑动窗口和双指针有什么区别？

滑动窗口是双指针的一种特化。双指针泛指用两个位置变量解题（左右、快慢），滑动窗口特指维护一个**连续区间**，重点在于窗口状态的增量更新。判断标准：如果题目关注的是区间内元素的某种聚合状态（频率、和、种类数），通常用滑动窗口。

### 什么时候用 while 收缩、什么时候用 if？

- 求**最短**满足条件的子数组：用 `while`，因为满足条件后要持续收缩找更短的
- 求**最长**满足条件的子数组：用 `while`，在不满足条件时收缩到满足为止
- 关键是判断条件和收缩方向对应好

## 看到什么就先想到这类

- "最长/最短连续子数组/子串"→ 滑动窗口
- "包含所有字符的最小子串"→ 滑动窗口 + HashMap
- "不含重复的最长子串"→ 滑动窗口 + 频率数组
- "固定大小的窗口统计"→ 固定窗口模板
- "至多 k 种元素的最长子数组"→ 滑动窗口 + HashMap
