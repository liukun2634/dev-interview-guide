---
title: 堆与优先队列
---

# 堆与优先队列

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
堆的核心能力是 O(log n) 插入、O(1) 查看极值、O(log n) 删除极值。面试中凡是出现"第 K 大/小"、"动态维护最值"、"多路合并"，优先想到堆（Java 中用 `PriorityQueue`）。
:::

---

## 识别信号

**看到这些关键词，想到堆：**

- "第 K 大 / 第 K 小"
- "前 K 个高频 / 最大 / 最小"
- "合并 K 个有序序列 / 链表"
- "数据流 / 动态插入，随时查最值或中位数"
- "贪心：每次取代价最小的任务"

**反例——堆不是最优选择的情况：**

- **静态数组求第 K 大**：数据量不大时直接排序 O(n log n) 更简单；数据量大时快速选择（QuickSelect）期望 O(n) 更快。
- **一次性排序后顺序访问**：先排序再遍历，不需要维护动态结构。
- **K 接近 n**：小根堆大小为 K，若 K ≈ n，堆相比排序没有优势。

---

## 通用思考框架

### 第一步：确认需要"动态维护极值"

问自己：**数据是静态的还是会动态增加？**

- **静态 Top-K**（给你完整数组）→ 排序或 QuickSelect 即可，不一定需要堆。
- **动态 / 流式 Top-K**（边插入边查询）→ 必须用堆。

**为什么动态场景选堆而不是每次重新排序？**

每次插入新元素后重排：O(n log n)。
堆的每次插入：O(log k)。
当数据持续流入时，堆的优势随 n 增大而增大。

---

### 第二步：选择堆的类型和大小

| 场景 | 堆类型 | 堆大小 | 原因 |
|------|--------|--------|------|
| 第 K 大 | 小根堆 | K | 堆中维护最大的 K 个数，堆顶（最小值）就是第 K 大 |
| 第 K 小 | 大根堆 | K | 堆中维护最小的 K 个数，堆顶（最大值）就是第 K 小 |
| 中位数 | 大根堆 + 小根堆 | 各 n/2 | 左半部分用大根堆，右半部分用小根堆，中位数在堆顶 |
| 多路归并 | 小根堆 | K（路数）| 每次从 K 个候选中取全局最小值 |

**为什么第 K 大用小根堆？**

直觉：我们要"留下最大的 K 个"。用小根堆，堆顶是这 K 个里最小的那个，也就是"第 K 大"。每次新元素进来，如果比堆顶大，就替换堆顶（淘汰第 K+1 大），保证堆里始终是最大的 K 个。

**为什么中位数用两个堆？**

将所有数分成两半：左半部分（较小的一半）用大根堆，右半部分（较大的一半）用小根堆。两个堆的大小差不超过 1，中位数就在某个堆顶，O(1) 查询。

**Java PriorityQueue 用法：**

```java
// 小根堆（默认）
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// 大根堆
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

// 自定义比较器（按数组第一个元素排序）
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);

minHeap.offer(val);        // 入堆 O(log n)
int top = minHeap.peek();  // 查看堆顶 O(1)
int val = minHeap.poll();  // 弹出堆顶 O(log n)
int size = minHeap.size();
```

---

### 第三步：确定堆中存什么

堆里不一定只存数值，根据需要选择存储内容：

| 场景 | 存储内容 | 示例 |
|------|----------|------|
| 只需要值 | `int` 直接存 | 第 K 大元素 |
| 需要还原位置 | `[value, index]` | 滑动窗口最大值 |
| 多路归并 | `[value, listIndex, nodeIndex]` | 合并 K 个链表 |
| 按频率排序 | 存 key，比较器查 Map | 前 K 高频元素 |

**自定义比较器注意事项：**

避免用 `(a, b) -> a - b` 处理 `Integer` 类型——当 a 和 b 差值超过 `Integer.MAX_VALUE` 时会溢出。安全写法：

```java
// 不安全（可能溢出）
PriorityQueue<Integer> pq = new PriorityQueue<>((a, b) -> a - b);

// 安全写法
PriorityQueue<Integer> pq = new PriorityQueue<>(Integer::compare);
```

---

### 第四步：确定入堆/出堆时机

不同场景的入堆出堆策略不同：

**Top-K 模板（offer 后超限就 poll）：**

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

**多路归并（poll 后 offer 后继节点）：**

```java
// 初始化：所有链表的头节点入堆
// 每次 poll 出最小节点，若该节点有 next，将 next offer 入堆
```

**中位数维护（每次插入后平衡两个堆）：**

```java
// 插入 → 先入大根堆 → 将大根堆堆顶移到小根堆（保证左 ≤ 右）
// 若两堆大小差 > 1，将较大堆的堆顶移到较小堆
```

---

## 典型例题：数组中的第 K 个最大元素（[LeetCode 215](https://leetcode.cn/problems/kth-largest-element-in-an-array/)）

给定整数数组 `nums` 和整数 `k`，返回数组中第 `k` 个最大的元素（不是第 k 个不同的元素）。

### 用框架拆解

**第一步：识别** → 题目直接说"第 K 大"，数据静态，可以排序，但堆是标准考点，用堆演示。

**第二步：堆类型** → 第 K 大 → size-K **小根堆**。原因：维护最大的 K 个数，堆顶（最小值）就是第 K 大。

**第三步：存什么** → 直接存 `int` 数值，无需附加信息。

**第四步：时机** → 遍历每个元素，`offer` 后若 `size > k` 则 `poll`，保证堆中始终是最大的 K 个。

### 完整代码

```java
public int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) {
            minHeap.poll();  // 淘汰最小值，保留最大的 k 个
        }
    }
    return minHeap.peek();  // 堆顶即为第 k 大
}
```

### 复杂度分析

- **时间**：O(n log k)，每个元素入堆 O(log k)，共 n 次
- **空间**：O(k)，堆最多存 k 个元素

---

## 延伸题目

| 题号 | 题名 | 难度 | 关键差异 | 一句话提示 |
|------|------|------|----------|------------|
| [347](https://leetcode.cn/problems/top-k-frequent-elements/) | 前 K 个高频元素 | 中等 | 需要先统计频率，堆按频率比较 | HashMap 统计频率 + 小根堆按频率维护 K 个 |
| [23](https://leetcode.cn/problems/merge-k-sorted-lists/) | 合并 K 个升序链表 | 困难 | 堆中存节点，poll 后 offer 其 next | 小根堆每次取 K 个链表头中的最小值 |
| [295](https://leetcode.cn/problems/find-median-from-data-stream/) | 数据流的中位数 | 困难 | 两个堆协同维护，每次插入后平衡 | 大根堆存左半、小根堆存右半，中位数在堆顶 |
| [703](https://leetcode.cn/problems/kth-largest-element-in-a-stream/) | 数据流中的第 K 大元素 | 简单 | 动态流式版本的 LC215 | 小根堆固定大小 K，每次 add 后返回堆顶 |
| [378](https://leetcode.cn/problems/kth-smallest-element-in-a-sorted-matrix/) | 有序矩阵中第 K 小的元素 | 中等 | 矩阵多路归并，存 [value, row, col] | 小根堆多路归并，poll 后 offer 右侧或下方元素 |
| [692](https://leetcode.cn/problems/top-k-frequent-words/) | 前 K 个高频单词 | 中等 | 频率相同时按字典序，比较器需处理两个维度 | 自定义比较器：频率降序，频率相同则字典序升序 |

---

## 常见陷阱与调试

**陷阱 1：比较器用 `a - b` 导致 Integer 溢出**

```java
// 危险！当 a = Integer.MIN_VALUE, b = 1 时，a - b 溢出为正数
PriorityQueue<Integer> pq = new PriorityQueue<>((a, b) -> a - b);

// 正确写法
PriorityQueue<Integer> pq = new PriorityQueue<>(Integer::compare);
// 或
PriorityQueue<Integer> pq = new PriorityQueue<>((a, b) -> Integer.compare(a, b));
```

**陷阱 2：忘记 PriorityQueue 默认是小根堆**

`new PriorityQueue<>()` 是小根堆，`poll()` 弹出最小值。若需要大根堆，必须传入 `Collections.reverseOrder()` 或自定义比较器。面试中最常见的错误之一：题目要第 K 大，写成了大根堆，逻辑完全反了。

**陷阱 3：不理解"为什么第 K 大用小根堆"**

直觉：小根堆堆顶是堆中最小值。维护 K 个最大值的堆，堆顶就是"这 K 个里最小的"，即第 K 大。如果用大根堆，堆顶是最大值，要找第 K 大还得弹出 K-1 次，空间 O(n) 且多余操作多。

---

## 面试常问 & 怎么答

### 为什么求第 K 大用小根堆而不是大根堆？

用大根堆需要把所有元素入堆再弹 K-1 次，空间 O(n)。用小根堆只维护 K 个元素，空间 O(k)，堆操作也更快（O(log k) vs O(log n)）。

### PriorityQueue 底层是什么结构？

Java 的 `PriorityQueue` 底层是数组实现的**完全二叉树**（二叉堆）。`offer` 是上浮（sift up），`poll` 是下沉（sift down），都是 O(log n)。不是线程安全的，多线程用 `PriorityBlockingQueue`。

### 堆排序和用堆求 Top-K 的区别？

堆排序是对整个数组排序，时间 O(n log n)。Top-K 只需要维护大小为 K 的堆，时间 O(n log k)。当 K 远小于 n 时，Top-K 更高效。

---

## 看到什么就先想到这类

- "第 K 大/小" → 小根堆/大根堆维护 K 个元素
- "前 K 个高频/最大" → 频率统计 + 堆
- "合并 K 个有序序列" → 小根堆多路归并
- "数据流中求中位数" → 大根堆 + 小根堆
- "动态取最优/最小代价" → 堆（贪心场景）
