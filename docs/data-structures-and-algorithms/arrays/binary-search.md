---
title: 二分查找
---

# 二分查找

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
二分查找的核心是**缩小搜索区间**：每次通过中间值的判断，排除一半不可能的区间。关键是明确区间定义（左闭右闭 vs 左闭右开）和循环终止条件，写错一个边界就可能死循环或漏解。
:::

---

## 识别信号

**有这些特征时，优先考虑二分查找：**

- 有序数组中查找某个值或位置
- 题目要求 O(log n) 时间复杂度
- 答案具有单调性（越大越满足 / 越小越满足条件）
- 旋转排序数组、部分有序结构
- "找第一个满足条件的" / "找最后一个满足条件的"

**反例——这些情况不适用：**

- 数组无序且不能排序（考虑哈希表）
- 需要返回所有满足条件的元素（考虑双指针或滑动窗口）
- 单调性不存在（每次 mid 判断无法排除一半区间）

---

## 通用思考框架

> 做任何二分题，按以下四步走，不会出错。

### 第一步：确认单调性

**问自己：这道题有没有"排除一半"的依据？**

- 数组全局有序 → 直接二分
- 数组旋转有序 → 至少一半有序，可以判断 target 在哪半
- 答案空间单调（check(x) 为真则 check(x+1) 也为真）→ 二分答案
- 局部单调（峰值问题）→ 比较 mid 和邻居来决定方向

**如果找不到单调性，就不能用二分。** 强行用会导致漏解或死循环。

---

### 第二步：选择区间定义

这是最容易出错的一步。**区间定义决定了后续所有边界写法，必须选定一种并贯穿始终。**

| | 左闭右闭 `[left, right]` | 左闭右开 `[left, right)` |
|---|---|---|
| **初始化** | `right = nums.length - 1` | `right = nums.length` |
| **循环条件** | `left <= right` | `left < right` |
| **左移右边界** | `right = mid - 1` | `right = mid` |
| **右移左边界** | `left = mid + 1` | `left = mid + 1` |
| **退出时** | `left > right`，区间为空 | `left == right`，区间为空 |
| **适合场景** | 精确查找、旋转数组 | 查找边界（lower/upper bound）|

**选哪个？** 精确查找用左闭右闭；查找"第一个/最后一个满足条件"的边界问题用左闭右开更自然。

---

### 第三步：确定查找目标

明确你要找的是什么，对应不同模板：

**目标一：精确匹配（标准二分）**

找 target 是否存在，返回下标或 -1。

```java
public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;  // [left, right] 左闭右闭
    while (left <= right) {                  // left==right 时区间还有一个元素，不能跳过
        int mid = left + (right - left) / 2; // 防溢出，等价于 (left+right)/2
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;   // mid 已检查且不是答案，排除它，区间变为 [mid+1, right]
        } else {
            right = mid - 1;  // mid 已检查且不是答案，排除它，区间变为 [left, mid-1]
        }
    }
    return -1;  // 循环结束说明区间为空，未找到
}
```

**为什么 `left = mid + 1` 而不是 `left = mid`？** 因为 `nums[mid] != target`，mid 本身已经被排除，如果写 `left = mid` 当 left==mid 时会死循环。

---

**目标二：左边界（第一个 >= target 的位置，lower_bound）**

```java
public int lowerBound(int[] nums, int target) {
    int left = 0, right = nums.length;  // [left, right) 左闭右开，right 可以是 length（表示"所有元素都 < target"）
    while (left < right) {              // left==right 时区间为空，退出
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) {
            left = mid + 1;  // mid 肯定不是答案（比 target 小），排除
        } else {
            right = mid;     // mid 可能是答案（>= target），保留，但右边界收缩到 mid
        }
    }
    return left;  // left == right，就是第一个 >= target 的位置
}
```

**为什么 `right = mid` 而不是 `right = mid - 1`？** 因为 `nums[mid] >= target`，mid 本身可能是答案，不能排除，只能把右边界收到 mid。

---

**目标三：右边界（最后一个 <= target 的位置，upper_bound - 1）**

```java
public int upperBound(int[] nums, int target) {
    int left = 0, right = nums.length;  // [left, right) 左闭右开
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] <= target) {
            left = mid + 1;  // mid 满足条件，但还要往右找更靠右的答案
        } else {
            right = mid;     // mid 不满足条件，排除
        }
    }
    return left - 1;  // left 是第一个 > target 的位置，所以 left-1 是最后一个 <= target 的位置
}
```

**决策口诀：**
- 找"是否存在" → 标准二分（左闭右闭）
- 找"第一个满足条件" → lower_bound（左闭右开，`right=mid`）
- 找"最后一个满足条件" → upper_bound（左闭右开，`left=mid+1`，返回 `left-1`）

---

### 第四步：处理特殊情况

**情况一：旋转数组**

旋转后不是全局有序，但二分后 `[left, mid]` 和 `[mid+1, right]` 中**必有一段是有序的**。先判断哪段有序，再判断 target 是否落在有序段内，据此决定往哪边走。

```
if (nums[left] <= nums[mid])  →  左段 [left, mid] 有序
else                          →  右段 [mid+1, right] 有序
```

**情况二：二分答案**

不在数组上二分，而是在"答案的可能范围"上二分。需要定义一个 `check(x)` 函数，验证答案为 x 时是否可行。答案空间必须有单调性（可行则更大的也可行，或反之）。

```java
int lo = minPossible, hi = maxPossible;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (check(mid)) {
        hi = mid;      // mid 可行，尝试更小（找最小可行值）
    } else {
        lo = mid + 1;  // mid 不可行，必须更大
    }
}
return lo;
```

**情况三：二维矩阵**

对于行列均有序的矩阵（LeetCode 74），将下标 `k` 映射到二维：`row = k / cols`，`col = k % cols`。把 `m×n` 矩阵展开成长度 `m*n` 的一维数组做标准二分。

---

## 典型例题：搜索旋转排序数组（[LeetCode 33](https://leetcode.cn/problems/search-in-rotated-sorted-array/)）

### 识别

- 数组"部分有序"（旋转后破坏全局顺序）
- 要求 O(log n) → 必须二分
- 不能直接用标准二分，需要额外判断哪半边有序

### 区间定义

选**左闭右闭** `[left, right]`：这是精确查找（找 target 下标或返回 -1），左闭右闭更直观。

### 关键洞察

任取一个 mid，将数组分为左段 `[left, mid]` 和右段 `[mid+1, right]`。**旋转点只能在其中一段内**，所以另一段必然是连续有序的。

- `nums[left] <= nums[mid]`：左段有序，旋转点在右段
- 否则：右段有序，旋转点在左段

判断 target 是否在有序段的范围内，是则缩到有序段，否则去另一段。

### 完整代码

```java
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;

        // 左段 [left, mid] 有序
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) {
                right = mid - 1;  // target 在有序左段内
            } else {
                left = mid + 1;   // target 在右段（含旋转点）
            }
        }
        // 右段 [mid+1, right] 有序
        else {
            if (nums[mid] < target && target <= nums[right]) {
                left = mid + 1;   // target 在有序右段内
            } else {
                right = mid - 1;  // target 在左段（含旋转点）
            }
        }
    }
    return -1;
}
```

### 复杂度

- **时间**：O(log n)，每次排除一半
- **空间**：O(1)

---

## 延伸题目

| 题号 | 题名 | 难度 | 关键差异 | 一句话提示 |
|------|------|------|----------|------------|
| [704](https://leetcode.cn/problems/binary-search/) | 二分查找 | 简单 | 最纯粹的标准二分，无变形 | 直接套左闭右闭模板 |
| [34](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/) | 排序数组中查找元素的第一个和最后一个位置 | 中等 | 需要同时找左边界和右边界 | 两次 lower_bound，第二次找 target+1 再减 1 |
| [35](https://leetcode.cn/problems/search-insert-position/) | 搜索插入位置 | 简单 | 找"第一个 >= target"的位置，不存在也要给插入位置 | 直接返回 lower_bound 结果 |
| [74](https://leetcode.cn/problems/search-a-2d-matrix/) | 搜索二维矩阵 | 中等 | 二维结构需要下标转换 | 将 k 映射为 `row=k/cols`，`col=k%cols` |
| [153](https://leetcode.cn/problems/find-minimum-in-rotated-sorted-array/) | 寻找旋转排序数组中的最小值 | 中等 | 不找具体值，找旋转点 | 比较 `nums[mid]` 和 `nums[right]` 决定方向 |
| [162](https://leetcode.cn/problems/find-peak-element/) | 寻找峰值 | 中等 | 无全局有序，靠局部单调性 | 比较 `nums[mid]` 和 `nums[mid+1]`，往上坡方向走 |
| [875](https://leetcode.cn/problems/koko-eating-bananas/) | 爱吃香蕉的珂珂 | 中等 | 二分答案，不在数组上二分 | 速度越大越可能完成，check(speed) 验证可行性 |
| [69](https://leetcode.cn/problems/sqrtx/) | x 的平方根 | 简单 | 二分答案，找最大满足条件的值 | 找最大的 k 满足 k² <= x，用 upper_bound 思路 |

---

## 常见陷阱与调试

**陷阱一：`left + right` 整数溢出**

```java
// 错误：left + right 可能超过 Integer.MAX_VALUE
int mid = (left + right) / 2;

// 正确：等价变形，避免溢出
int mid = left + (right - left) / 2;
```

**陷阱二：混用两种区间定义**

同一道题里，初始化用了左闭右开（`right = nums.length`），循环条件却写了 `left <= right`，或者更新时混用了 `right = mid` 和 `right = mid - 1`。**选定一种区间定义后，所有相关写法必须配套，不能混搭。**

**陷阱三：死循环（mid 不变导致区间无法收缩）**

```java
// 危险：当 left == mid 时，left = mid 不更新，死循环
if (nums[mid] < target) left = mid;

// 正确：每次至少移动一步
if (nums[mid] < target) left = mid + 1;
```

使用左闭右开模板时，`right = mid` 是安全的（因为循环条件 `left < right` 保证 mid < right）。但 `left = mid` 在 left == mid 时不会推进，必须写成 `left = mid + 1`。

---

## 面试常问 & 怎么答

### `left <= right` 和 `left < right` 怎么选？

取决于区间定义。**左闭右闭** `[left, right]` 用 `left <= right`，因为 `left == right` 时区间还有一个元素。**左闭右开** `[left, right)` 用 `left < right`，因为 `left == right` 时区间为空。选定一种，整道题保持一致即可。

### 为什么写 `mid = left + (right - left) / 2`？

防止 `left + right` 超过 int 最大值导致溢出。在 Java 中 int 最大约 21 亿，两个大数相加会溢出成负数。

### 二分查找一定要数组有序吗？

不一定是全局有序。只要能通过 mid 的判断排除一半区间就行。例如旋转数组（部分有序）、峰值查找（局部单调）、二分答案（答案空间单调）。

---

## 看到什么就先想到这类

- "有序数组 + 查找" → 标准二分
- "第一个/最后一个满足条件的位置" → 左边界/右边界二分
- "旋转排序数组" → 二分，判断哪半边有序
- "最小化最大值/最大化最小值" → 二分答案
- "O(log n) 要求" → 几乎一定是二分
