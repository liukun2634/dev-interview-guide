---
title: 数据流中位数
---

# 数据流中位数（LeetCode 295）— 双堆配合的工程范本

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
**两个堆配合维护"中位数附近"的数据**：大顶堆存较小的一半、小顶堆存较大的一半，中位数就藏在两个堆顶。每次插入 O(log n)，求中位数 O(1)。**金融行情、监控告警、A/B 测试**都用这个套路。
:::

## 为什么单独讲它

跟 [LRU](../hash-table#典型例题：lru-缓存必背手撕题) 一样，这是 "**单一数据结构办不到、必须两个配合**" 的典型题。面试官真正想考的是：**你能不能想到一个比"排序后取中间"更聪明的办法**。

| 方案 | addNum | findMedian | 适用 |
|------|------|------|------|
| 数组排序 | O(n log n) | O(1) | n < 100 |
| 二分插入有序数组 | O(n) | O(1) | 小数据，简单 |
| **双堆** | **O(log n)** | **O(1)** | **生产首选** |
| Multiset / TreeMap | O(log n) | O(log n) | 也能用，但更复杂 |

**双堆的核心洞察**：求中位数不需要全局排序，**只需要"中间附近的位置"**。把数据切成两半：左半部分最大值（大顶堆顶）+ 右半部分最小值（小顶堆顶）= 中位数所在的两个候选。

## 数据结构设计

```
                   small (大顶堆)        large (小顶堆)
                   存较小的一半          存较大的一半
                       ↓                     ↓
                   [5, 3, 2]           [7, 8, 12]
                    ↑ 堆顶              ↑ 堆顶
                    5                   7
                       └────── 中位数 = (5+7)/2 ──────┘

数据流: 12, 5, 8, 3, 2, 7 一个个进来
```

**两个不变量**（必须时刻成立）：

1. **`small` 中所有元素 ≤ `large` 中所有元素**（左半 ≤ 右半）
2. **`small.size() == large.size()` 或 `small.size() == large.size() + 1`**（总数偶数时平分，奇数时左半多一个）

只要这两个不变量成立，中位数就是：
- 奇数总数 → `small.peek()`（即偏左半的堆顶）
- 偶数总数 → `(small.peek() + large.peek()) / 2.0`

## 完整代码（必背手撕）

```java
class MedianFinder {
    private final PriorityQueue<Integer> small;         // ★ 大顶堆：左半部分
    private final PriorityQueue<Integer> large;         // ★ 小顶堆：右半部分

    public MedianFinder() {
        small = new PriorityQueue<>(Comparator.reverseOrder());
        large = new PriorityQueue<>();
    }

    public void addNum(int num) {
        // ★ 关键技巧：先无脑加到一边，再"过一遍另一边"保证有序
        small.offer(num);
        large.offer(small.poll());                      // small 的最大值 → large

        // ★ 维护 size：让 small.size() ∈ {large.size(), large.size() + 1}
        if (small.size() < large.size()) {
            small.offer(large.poll());
        }
    }

    public double findMedian() {
        if (small.size() > large.size()) {
            return small.peek();                        // 奇数：偏左半的堆顶
        }
        return (small.peek() + large.peek()) / 2.0;     // 偶数：两个堆顶平均
    }
}
```

### 为什么这样写最简洁

天真版本是"如果 num < small.peek() 就放 small，否则放 large"，然后再 rebalance。但要写好多 `if`：

```java
// ❌ 天真版（容易写错边界）
public void addNum(int num) {
    if (small.isEmpty() || num <= small.peek()) {
        small.offer(num);
    } else {
        large.offer(num);
    }
    // 然后 rebalance...
}
```

**简洁版**：**永远先加到 small，然后把 small 的最大值送给 large**——这一步天然保证了"left ≤ right"。之后只需要看 size 平衡。一共 4 行。

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 大顶堆写成 `new PriorityQueue<>()` | Java 默认是小顶堆，逻辑反掉 | `Comparator.reverseOrder()` 或 `(a, b) -> b - a` |
| `(small.peek() + large.peek()) / 2` | int 除法丢精度 | `/ 2.0` 或 `((long)a + b) / 2.0` 防溢出 |
| 用 `a - b` 自定义比较器 | `Integer.MIN_VALUE - 1` 溢出 | `Integer.compare(a, b)` |
| 不维护 size 不变量 | findMedian 拿错堆顶 | size 关系必须 `small ∈ {large, large+1}` |
| 直接 `findMedian` 不判空堆 | NPE | 题目保证有数据；面试可加 `if (small.isEmpty()) return 0` |

## 复杂度

- **`addNum`**：O(log n) — 两次堆操作
- **`findMedian`**：O(1) — 只看堆顶
- **空间**：O(n) — 存所有数据

## 进阶变体

### 1. 求 K 分位数（不只是中位数）

把"两个堆"扩展为"两个堆按比例"：左堆放 k%、右堆放 (1-k)%。每次插入后调整两边 size 满足比例。

### 2. 滑动窗口中位数（LC480）

每移动一个位置就要插入一个、删除一个。**朴素双堆删除 O(n)**，不够快。解法：

- **延迟删除（lazy deletion）**：用 HashMap 记录"待删除"，poll 时遇到就忽略，O(log n) 均摊
- **`TreeMap<Integer, Integer>`**：键存值、值存频次，能 O(log n) 删任意元素

### 3. 大数据量（流式 / 分布式）

n 上亿时双堆内存爆炸。生产用 **t-digest** 或 **HdrHistogram**：用近似算法换 O(1) 空间 + 极小误差。Prometheus / Datadog 监控分位数都用 t-digest。

## 业界应用

| 场景 | 中位数干嘛用 |
|------|------|
| **金融行情** | VWAP（成交量加权均价）、分钟级中位价格 |
| **监控告警** | API 延迟的 p50 / p99 分位数（不能用平均值，平均值被极值带偏）|
| **A/B 测试** | 实验组 vs 对照组的转化率分位数对比 |
| **风控反作弊** | 用户行为时间间隔的中位数检测异常 |
| **推荐系统** | 物品评分中位数（抗虚假高分刷量）|

**为什么生产场景几乎只看分位数不看平均值**：平均值被异常值带飞（一个 100 秒的慢请求能把 99 个 100ms 的平均值拉到 1 秒）；**中位数 / p99 反映真实用户体验**。

## 面试常问 & 怎么答

### 为什么不用排序

排序 O(n log n)，每加一个数都要重排，n 个数总 O(n² log n)。双堆只 O(n log n) 一次性维护。

### 大顶堆和小顶堆为什么这么分

**核心心智模型**："左半 ≤ 右半"是不变量。**左半的最大值**（大顶堆顶）和**右半的最小值**（小顶堆顶）就是中位数的两个候选。如果反过来（小顶堆放左半），堆顶就是左半最小值，根本拿不到中位数。

### 滑动窗口中位数怎么删

朴素双堆不支持 O(log n) 删任意元素。两种工业解法：

1. **延迟删除**：HashMap 记"待删"，每次 poll 时检查是否在待删列表
2. **TreeMap**：键-频次结构，能 O(log n) 删任意位置

### 大数据量（亿级）怎么办

双堆内存 O(n)，亿级时几个 G。生产用近似算法：

- **t-digest**：开源算法，把数据聚类成多个 centroid，能算任意分位数，常数空间
- **HdrHistogram**：固定桶数组，O(1) 插入和查询，专门给监控用
- 误差 < 1%，比"排序取中位"省几个数量级的内存

## 看到什么就先想到这类

- "数据流中位数 / 分位数" → 双堆
- "维护两半数据的边界" → 双堆 / TreeMap
- "API 监控的 p50 / p99" → t-digest / HdrHistogram（生产）/ 双堆（小规模）
- "滑动窗口最值 / 中位数" → 双堆 + 延迟删除 / 单调队列（最值）
- "金融行情中位价" → 双堆
