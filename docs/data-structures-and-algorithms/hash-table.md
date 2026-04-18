---
title: 哈希表
---

# 哈希表

<span class="dig-tag dig-tag--category">数据结构</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
哈希表通过哈希函数将键映射到数组下标，实现 $O(1)$ 增删查。面试中的核心不是实现哈希表，而是学会用哈希表解题的思维框架——设计 key 存什么、value 存什么。
:::

## 识别信号

看到以下特征时，优先考虑哈希表：

| 信号 | 典型使用场景 |
|------|------------|
| 需要 $O(1)$ 查找 | 两数之和、判断元素是否存在 |
| 需要记录"是否见过" | 去重、检测环、滑动窗口 |
| 需要计数 / 分组 | 词频统计、字母异位词分组 |
| 需要建立映射关系 | 同构字符串、字符替换 |
| 需要缓存中间结果 | 动态规划记忆化、LRU 缓存 |

---

## 通用思考框架

### Key / Value 设计方法论

这是解哈希表题的**核心框架**。拿到任何题目，先问三个问题：

1. **"我需要快速查找什么？"** → 那就是 KEY
2. **"查到之后需要什么信息？"** → 那就是 VALUE
3. **"什么时候存入？什么时候查询？"** → 那就是遍历顺序

三道经典题的 Key/Value 设计对比：

| 题目 | Key | Value | 原因 |
|------|-----|-------|------|
| 两数之和 | 数值 | 下标 | 需要找补数，找到后要知道它的位置 |
| 字母异位词分组 | 排序后的字符串 | 原字符串列表 | 需要把"字母相同"的单词归到一组 |
| 频率统计 | 元素本身 | 出现次数 | 需要知道每个元素出现了多少次 |

### 常见 Key 设计技巧

- **直接用值作 key**：两数之和，key = 数值，能直接判断补数是否存在
- **规范化形式作 key**：异位词分组，key = 排序后字符串 / 字符频率编码，把"等价"的元素映射到同一 key
- **字符频率数组编码**：避免排序的 $O(k \log k)$，改用长度 26 的数组转字符串，降到 $O(k)$
- **滑动窗口 + 哈希**：子串问题中，用 HashMap 维护窗口内字符频率，双指针收缩窗口

### HashMap vs HashSet

- 只需判断"是否存在" → 用 **HashSet**
- 还需要存额外信息（下标、计数等）→ 用 **HashMap**

---

## 底层原理（简要）

### 哈希函数

哈希函数将任意键映射到数组下标。Java 中每个对象都有 `hashCode()` 方法，`HashMap` 会在此基础上再做扰动处理（高低位异或），使分布更均匀。好的哈希函数需满足：**计算快、分布均匀、冲突少**。

### 冲突解决

**链地址法（Separate Chaining）**：每个数组槽存一个链表，冲突的键追加到链表中。实现简单，负载因子可以超过 1，删除方便。Java `HashMap` 采用此方案。

**开放地址法（Open Addressing）**：冲突时在数组中探测下一个空槽（线性探测 / 二次探测 / 双重哈希）。内存紧凑，但负载因子不能太高，且删除需要"墓碑"标记，不能直接置空（否则会断开探测链）。

### Java HashMap 内部实现

| 特性 | 说明 |
|------|------|
| 底层结构 | `Node[]` 数组 + 链表 + 红黑树 |
| 链表 → 红黑树 | 链表长度 ≥ 8 **且** 数组长度 ≥ 64 时转树，查找从 $O(n)$ 降至 $O(\log n)$ |
| 红黑树 → 链表 | 节点数 ≤ 6 时退化回链表 |
| 扩容触发 | 元素数量 / 数组长度 > 负载因子 0.75 时，数组扩容为 2 倍并重新哈希 |
| 取模优化 | 数组长度始终为 2 的幂次，用位运算 `index = hash & (n-1)` 代替取模 |

---

## 典型例题：两数之和

[LeetCode 1](https://leetcode.cn/problems/two-sum/) · 简单

**题目**：给定整数数组 `nums` 和目标值 `target`，返回两个数之和等于 `target` 的下标。

**用框架思考**：

1. **"我需要查找什么？"** → 对于当前数 `nums[i]`，需要查找补数 `target - nums[i]` 是否存在
2. **"查到后需要什么？"** → 需要补数的下标，才能返回答案
3. **所以**：key = 数值，value = 下标；**先查后存**（避免用同一个元素两次）

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // key: 数值, value: 下标
        Map<Integer, Integer> seen = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];

            // 先查：补数是否已经见过
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }

            // 后存：把当前数存入，供后续元素查询
            seen.put(nums[i], i);
        }

        return new int[]{};
    }
}
// 时间复杂度：O(n)，空间复杂度：O(n)
// 对比暴力 O(n²)：用空间换时间
```

---

## 延伸题目

| 题目 | 链接 | 与典型题的区别 | 关键技巧 |
|------|------|--------------|---------|
| 字母异位词分组 | [LC 49](https://leetcode.cn/problems/group-anagrams/) | key 设计不同：排序后字符串作 key | 也可用字符频率数组编码，避免排序，降到 $O(k)$ |
| 存在重复元素 II | [LC 219](https://leetcode.cn/problems/contains-duplicate-ii/) | 滑动窗口 + HashSet | 维护大小为 k 的窗口，超出则移除最旧元素 |
| 最长连续序列 | [LC 128](https://leetcode.cn/problems/longest-consecutive-sequence/) | HashSet + 只从序列起点扩展 | 先存所有数，只对没有 `num-1` 的数开始扩展，避免重复 |
| LRU 缓存 | [LC 146](https://leetcode.cn/problems/lru-cache/) | HashMap + 双向链表 | $O(1)$ get/put 需要两种数据结构配合：map 负责查找，链表维护顺序 |
| 前 K 个高频元素 | [LC 347](https://leetcode.cn/problems/top-k-frequent-elements/) | HashMap 计数 + 堆 / 桶排序 | 先统计频率，再取 top-K；桶排序可做到 $O(n)$ |

---

## 常见陷阱与调试

| 错误 | 症状 | 解决方法 |
|------|------|---------|
| 用可变对象作 key | 存入后修改对象，再也找不到对应的值 | 优先用不可变类型（`String`、`Integer`）作 key；自定义对象需正确重写 `hashCode()` 和 `equals()` |
| 先存后查（两数之和） | 当 `target = 2 * nums[i]` 时，同一元素被用了两次 | 改为**先查后存**，确保查询的是之前已存入的元素 |
| 开放地址法中直接删除 | 后续查找时探测链断开，找不到本应存在的元素 | 删除时标记为"墓碑"（tombstone），而非直接置 `null` |
| 忘记处理 null key | `NullPointerException` | `HashMap` 允许一个 null key；`HashTable`（旧版）不允许，二者不要混用 |
| 整数溢出导致哈希错误 | 相同逻辑在大数据时结果不同 | 手写哈希时用 `long` 或及时取模；依赖 `Integer.hashCode()` 时无需担心 |
