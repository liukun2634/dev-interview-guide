---
title: 堆与优先队列
---

# 堆与优先队列

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
堆的核心能力是 O(log n) 插入、O(1) 查看极值、O(log n) 删除极值。面试中凡是出现"第 K 大/小"、"动态维护最值"、"多路合并"，优先想到堆（Java 中用 `PriorityQueue`）。
:::

## 核心思路

**什么时候用堆？**
- 求第 K 大/小元素（维护大小为 K 的堆）
- 前 K 个高频元素
- 多路归并（K 个有序链表/数组合并）
- 动态数据流中求中位数
- 贪心问题中需要每次取最优的元素

**Java PriorityQueue 用法：**

```java
// 小根堆（默认）
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// 大根堆
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

// 自定义比较器
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);

minHeap.offer(val);        // 入堆 O(log n)
int top = minHeap.peek();  // 查看堆顶 O(1)
int val = minHeap.poll();  // 弹出堆顶 O(log n)
int size = minHeap.size();
```

## Top-K 问题模板

求第 K 大的元素，用大小为 K 的**小根堆**：

```java
// 维护大小为 k 的小根堆，堆顶就是第 k 大
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
for (int num : nums) {
    minHeap.offer(num);
    if (minHeap.size() > k) {
        minHeap.poll();  // 弹出最小的，留下最大的 k 个
    }
}
return minHeap.peek();  // 堆顶是第 k 大
```

**为什么用小根堆求第 K 大？** 维护 K 个最大的元素，堆顶（最小值）就是第 K 大。比维护大根堆弹 K-1 次更高效。

## 例题 1：[数组中的第 K 个最大元素（LeetCode 215）](https://leetcode.cn/problems/kth-largest-element-in-an-array/)

### 题目描述

给定整数数组 `nums` 和整数 `k`，返回数组中第 `k` 个最大的元素。

### 思路分析

1. 维护一个大小为 K 的小根堆
2. 遍历数组，每个元素入堆；堆大小超过 K 时弹出堆顶
3. 最终堆顶就是第 K 大

### 完整代码

```java
public int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) {
            minHeap.poll();
        }
    }
    return minHeap.peek();
}
```

### 复杂度分析

- **时间**：O(n log k)，每个元素入堆 O(log k)
- **空间**：O(k)

## 例题 2：[前 K 个高频元素（LeetCode 347）](https://leetcode.cn/problems/top-k-frequent-elements/)

### 题目描述

给定整数数组 `nums` 和整数 `k`，返回出现频率前 `k` 高的元素。

### 思路分析

1. 先用 HashMap 统计每个元素出现的频率
2. 维护大小为 K 的小根堆（按频率排序），保留频率最高的 K 个元素
3. 堆中的元素就是答案

### 完整代码

```java
public int[] topKFrequent(int[] nums, int k) {
    // 统计频率
    Map<Integer, Integer> freq = new HashMap<>();
    for (int num : nums) {
        freq.merge(num, 1, Integer::sum);
    }

    // 小根堆，按频率排序
    PriorityQueue<Integer> minHeap = new PriorityQueue<>(
        (a, b) -> freq.get(a) - freq.get(b)
    );

    for (int num : freq.keySet()) {
        minHeap.offer(num);
        if (minHeap.size() > k) {
            minHeap.poll();
        }
    }

    int[] result = new int[k];
    for (int i = 0; i < k; i++) {
        result[i] = minHeap.poll();
    }
    return result;
}
```

### 复杂度分析

- **时间**：O(n log k)，n 为数组长度
- **空间**：O(n)，HashMap 存储频率

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [215](https://leetcode.cn/problems/kth-largest-element-in-an-array/) | 数组中的第K个最大元素 | 中等 | 小根堆维护 K 个最大值 |
| [347](https://leetcode.cn/problems/top-k-frequent-elements/) | 前 K 个高频元素 | 中等 | 频率统计 + 小根堆 |
| [23](https://leetcode.cn/problems/merge-k-sorted-lists/) | 合并 K 个升序链表 | 困难 | 小根堆每次取最小的链表头 |
| [295](https://leetcode.cn/problems/find-median-from-data-stream/) | 数据流的中位数 | 困难 | 大根堆 + 小根堆，维护两半 |
| [703](https://leetcode.cn/problems/kth-largest-element-in-a-stream/) | 数据流中的第 K 大元素 | 简单 | 小根堆，动态维护 |
| [378](https://leetcode.cn/problems/kth-smallest-element-in-a-sorted-matrix/) | 有序矩阵中第 K 小的元素 | 中等 | 小根堆多路归并 / 二分 |
| [692](https://leetcode.cn/problems/top-k-frequent-words/) | 前K个高频单词 | 中等 | 频率 + 字典序排序的堆 |

## 面试常问 & 怎么答

### 为什么求第 K 大用小根堆而不是大根堆？

用大根堆需要把所有元素入堆再弹 K-1 次，空间 O(n)。用小根堆只维护 K 个元素，空间 O(k)，堆操作也更快（O(log k) vs O(log n)）。

### PriorityQueue 底层是什么结构？

Java 的 `PriorityQueue` 底层是数组实现的**完全二叉树**（二叉堆）。`offer` 是上浮（sift up），`poll` 是下沉（sift down），都是 O(log n)。不是线程安全的，多线程用 `PriorityBlockingQueue`。

### 堆排序和用堆求 Top-K 的区别？

堆排序是对整个数组排序，时间 O(n log n)。Top-K 只需要维护大小为 K 的堆，时间 O(n log k)。当 K 远小于 n 时，Top-K 更高效。

## 看到什么就先想到这类

- "第 K 大/小"→ 小根堆/大根堆维护 K 个元素
- "前 K 个高频/最大"→ 频率统计 + 堆
- "合并 K 个有序序列"→ 小根堆多路归并
- "数据流中求中位数"→ 大根堆 + 小根堆
- "动态取最优/最小代价"→ 堆（贪心场景）
