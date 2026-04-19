---
title: 滑动窗口
---

# 滑动窗口

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
滑动窗口是双指针的特化形式，专门处理**连续子数组/子串**问题。核心操作是：右指针扩张窗口纳入新元素，左指针收缩窗口剔除旧元素，在窗口满足/不满足条件的临界点更新答案。
:::

---

## 识别信号

**以下信号提示可以使用滑动窗口：**

- 题目明确要求**连续**子数组或子串
- 求满足某条件的**最长 / 最短**连续区间
- 窗口内的状态可以通过增删边界元素**高效维护**（O(1) 更新），如求和、字符频率、种类数
- 固定窗口大小，对每个位置计算统计值

**以下情形不适合滑动窗口（反例）：**

- 子序列可以**不连续** → 用动态规划（如最长公共子序列 LCS）
- 需要回头检查已移出窗口的元素 → 窗口状态无法增量维护
- 答案依赖全局排序或分治结构 → 考虑排序 + 二分或归并

---

## 通用思考框架

> 这是本文最核心的部分。做题前先按四步走，而不是直接套模板。

### 第一步：确认是否满足滑动窗口前提

两个必须同时满足的前提：

1. **连续性**：题目关注的区间必须是连续子数组或子串。如果允许跳跃，滑动窗口无效。
2. **可增量维护性**：当右指针纳入一个新元素、或左指针移出一个旧元素时，窗口状态能在 O(1) 时间内更新。

**判断方法**：问自己"如果我把窗口右边加一个元素，或左边移走一个元素，我能快速知道新窗口的状态吗？"  
- 求和 → 加/减一个数，可以 ✓  
- 判断有无重复 → 维护频率数组，加减一次，可以 ✓  
- 求窗口内中位数 → 需要重新排序，不可以 ✗

### 第二步：选择窗口类型

| 类型 | 特征 | 典型题型 |
|------|------|------|
| **可变窗口** | 窗口大小随条件伸缩 | 求最长/最短满足条件的子串 |
| **固定窗口** | 窗口大小固定为 k | 对每个长度为 k 的区间求统计值 |

**决策标准**：题目是否给出了固定的窗口大小 k？
- 给了 → 固定窗口
- 没给 → 可变窗口

### 第三步：设计窗口状态

问自己：**窗口内需要知道什么信息？**

| 需要知道 | 用什么维护 | 备注 |
|------|------|------|
| 元素之和 | `int sum` | 纳入加，移出减 |
| 字符出现次数 | `int[128] freq` 或 `int[26] freq` | ASCII 字符用 128 |
| 任意元素种类及计数 | `HashMap<Integer, Integer>` | 种类多或值域大时用 |
| 已满足的字符种类数 | `int valid` 计数器 | 配合 need/window 两个 Map 使用 |
| 窗口内最大值 | 单调递减队列 `Deque` | O(1) 获取最大值 |

**状态设计原则**：只存必要信息，越简单越好。能用数组不用 HashMap，能用整数不用数组。

### 第四步：确定收缩条件与答案更新时机

这一步是最容易出 bug 的地方，需要仔细区分两种情形：

**求最长（不合法则收缩）：**

```
右指针扩张 → 更新状态 → 窗口不合法？→ while 收缩左指针 → 窗口合法时更新答案（最大化）
```

收缩到窗口重新合法为止，然后记录当前窗口长度。答案在窗口合法时（while 循环之后）更新。

**求最短（合法则收缩）：**

```
右指针扩张 → 更新状态 → 窗口合法？→ while 更新答案（最小化）+ 收缩左指针 → 继续扩张
```

只要窗口合法就先记录答案，再收缩尝试找更短的。答案在窗口合法时（while 循环内部）更新。

**关键区别**：
- 求最长 → 先收缩到合法，再更新答案（答案在 `while` **外**）
- 求最短 → 先更新答案，再收缩（答案在 `while` **内**）

---

**可变窗口模板：**

```java
public int slidingWindow(int[] nums) {
    int left = 0;
    int result = 0;
    // 窗口状态变量（sum / freq[] / HashMap 等）

    for (int right = 0; right < nums.length; right++) {
        // 第一步：右指针元素纳入窗口，更新窗口状态
        // add(nums[right]);

        // 第二步：收缩条件（求最长：不合法时收缩；求最短：合法时收缩并更新答案）
        while (/* 窗口需要收缩 */) {
            // 求最短时在这里更新答案：
            // result = Math.min(result, right - left + 1);

            // 左指针移出窗口，更新状态
            // remove(nums[left]);
            left++;
        }

        // 第三步：求最长时在这里更新答案（窗口此时合法）
        result = Math.max(result, right - left + 1);
    }
    return result;
}
```

**固定窗口模板：**

```java
public int fixedWindow(int[] nums, int k) {
    int result = 0;
    // 窗口状态变量

    for (int i = 0; i < nums.length; i++) {
        // 第一步：纳入右边界元素 nums[i]
        // add(nums[i]);

        // 第二步：超出窗口大小时，移出左边界元素
        if (i >= k) {
            // remove(nums[i - k]);
        }

        // 第三步：窗口满 k 个元素后更新答案
        if (i >= k - 1) {
            // update result
        }
    }
    return result;
}
```

注意 `i >= k` 和 `i >= k - 1` 的区分：
- `i >= k`：窗口已经多出一个元素，需要移出（**先移出再统计**时使用）
- `i >= k - 1`：窗口恰好填满 k 个元素（索引 `i - k + 1` 到 `i`），可以统计答案

---

## 典型例题：无重复字符的最长子串（[LeetCode 3](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)）

给定一个字符串 `s`，找出不含重复字符的最长子串的长度。

### 套用四步框架

**第一步：确认前提**
- 连续性：题目求子串，连续 ✓
- 可增量维护：用频率数组记录字符出现次数，纳入/移出各 O(1) ✓

**第二步：选择窗口类型**
- 没有固定大小 → 可变窗口
- 求"最长" → 不合法时收缩，合法后更新答案

**第三步：设计窗口状态**
- 需要知道窗口内是否有重复字符
- 用 `int[128] freq` 记录每个字符的出现次数，`freq[c] > 1` 即为重复

**第四步：收缩条件与答案更新时机**
- 收缩条件：`freq[c] > 1`（刚纳入的字符 c 出现了两次）
- 收缩目标：移出左边界字符直到 `freq[c] == 1`
- 答案更新：在 `while` 之后，此时窗口无重复，记录最大长度

### 完整代码

```java
public int lengthOfLongestSubstring(String s) {
    int[] freq = new int[128];  // ASCII 字符频率
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        freq[c]++;  // 纳入右边界

        // 窗口内有重复字符，收缩左指针（求最长：收缩到合法）
        while (freq[c] > 1) {
            freq[s.charAt(left)]--;
            left++;
        }

        // 窗口此时无重复，更新最大长度
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

### 复杂度分析

- **时间**：O(n)，`left` 和 `right` 各最多移动 n 次，总操作 O(2n)
- **空间**：O(1)，`freq` 数组大小固定 128，与输入规模无关

---

## 延伸题目

| 题号 | 题名 | 难度 | 关键差异 | 一句话提示 |
|------|------|------|------|------|
| [76](https://leetcode.cn/problems/minimum-window-substring/) | 最小覆盖子串 | 困难 | 求最短，答案更新在 while 内；需要 need/window 两个 Map + valid 计数器 | valid == need.size() 时收缩并记录最短 |
| [209](https://leetcode.cn/problems/minimum-size-subarray-sum/) | 长度最小的子数组 | 中等 | 求最短，窗口状态只需一个 sum | sum >= target 时收缩并记录最短 |
| [438](https://leetcode.cn/problems/find-all-anagrams-in-a-string/) | 找到字符串中所有字母异位词 | 中等 | 固定窗口大小 = p.length()；需收集所有合法起点 | 比较 window 频率数组与 need 频率数组是否相等 |
| [567](https://leetcode.cn/problems/permutation-in-string/) | 字符串的排列 | 中等 | 与 438 思路完全相同，仅返回 boolean | 固定窗口 + valid 计数器判断是否覆盖 |
| [424](https://leetcode.cn/problems/longest-repeating-character-replacement/) | 替换后的最长重复字符 | 中等 | 收缩条件非直觉：窗口长度 - 窗口内最多频率字符数 > k | 维护 maxFreq，收缩条件 right - left + 1 - maxFreq > k |
| [904](https://leetcode.cn/problems/fruit-into-baskets/) | 水果成篮 | 中等 | 窗口内最多两种元素；与"至多 k 种元素的最长子数组"同构 | HashMap 维护种类数，size > 2 时收缩 |
| [239](https://leetcode.cn/problems/sliding-window-maximum/) | 滑动窗口最大值 | 困难 | 固定窗口 + 需要 O(1) 获取最大值；窗口状态用单调递减队列 | 队列头部始终是当前窗口最大值的索引 |

---

## 常见陷阱与调试

**陷阱 1：混淆 while 收缩的时机（求最长 vs 求最短）**

```java
// 求最长（错误写法：在 while 内更新答案）
while (invalid) {
    result = Math.max(result, right - left + 1);  // ❌ 此时窗口不合法
    left++;
}

// 求最短（错误写法：在 while 外更新答案）
while (valid) {
    left++;
}
result = Math.min(result, right - left + 1);  // ❌ 已经过度收缩
```

记住：**合法时才记录答案**。求最长时合法在 while 后；求最短时合法在 while 内。

**陷阱 2：收缩时忘记更新窗口状态**

```java
while (freq[c] > 1) {
    left++;  // ❌ 忘记 freq[s.charAt(left)]--，导致状态与窗口不一致
}

// 正确：
while (freq[c] > 1) {
    freq[s.charAt(left)]--;  // 先更新状态
    left++;                  // 再移动指针
}
```

**陷阱 3：固定窗口的边界条件（`i >= k` vs `i >= k - 1`）**

```java
// 窗口大小为 k，索引从 0 开始
if (i >= k) {
    remove(nums[i - k]);  // 移出左边界：i - k 正好是要移出的那个元素
}
if (i >= k - 1) {
    update(result);  // 窗口刚好填满（第 k 个元素索引为 k-1）
}
```

---

## 面试常问 & 怎么答

### 滑动窗口和双指针有什么区别？

滑动窗口是双指针的一种特化。双指针泛指用两个位置变量解题（左右、快慢），滑动窗口特指维护一个**连续区间**，重点在于窗口状态的增量更新。判断标准：如果题目关注的是区间内元素的某种聚合状态（频率、和、种类数），通常用滑动窗口。

### 什么时候用 while 收缩、什么时候用 if？

滑动窗口的收缩几乎总是用 `while`，而非 `if`：
- 求**最短**：满足条件后要持续收缩，`while` 确保收缩到不满足为止
- 求**最长**：不满足条件时要持续收缩，`while` 确保收缩到重新满足为止

用 `if` 只收缩一次通常是错的，因为移出一个元素后可能仍需继续收缩。

---

## 看到什么就先想到这类

- "最长/最短**连续**子数组/子串" → 滑动窗口
- "包含所有字符的最小子串" → 滑动窗口 + HashMap（need/window + valid 计数器）
- "不含重复的最长子串" → 滑动窗口 + 频率数组
- "固定大小 k 的窗口统计" → 固定窗口模板
- "至多 k 种元素的最长子数组" → 滑动窗口 + HashMap（size > k 时收缩）
- "替换/操作至多 k 次后的最长" → 可变窗口，收缩条件涉及 k
