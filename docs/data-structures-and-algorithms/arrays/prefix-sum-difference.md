---
title: 前缀和与差分
---

# 前缀和与差分

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
前缀和解决"快速求任意区间和"的问题，差分解决"批量区间增减"的问题。两者互为逆运算：对差分数组求前缀和得到原数组，对原数组求差分得到差分数组。
:::

## 前缀和

### 核心思路

预处理一个前缀和数组 `prefix`，使得任意区间 `[l, r]` 的和可以 O(1) 求出。

**什么时候用？** 需要多次查询不同区间的和（或计数）。

### 通用模板

```java
// 构建前缀和（0-indexed，prefix 长度 n+1）
int[] prefix = new int[nums.length + 1];
for (int i = 0; i < nums.length; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
}

// 查询区间 [l, r] 的和（0-indexed）
int rangeSum = prefix[r + 1] - prefix[l];
```

**为什么 prefix 长度是 n+1？** `prefix[0] = 0` 作为哨兵，避免 `l == 0` 时的特判。`prefix[i]` 表示 `nums[0..i-1]` 的和。

### 前缀和 + 哈希表

当题目问"和为 k 的子数组个数"时，用哈希表记录每个前缀和出现的次数：

```java
// 模板：前缀和 + 哈希表统计
Map<Integer, Integer> map = new HashMap<>();
map.put(0, 1);  // 前缀和为 0 出现 1 次（空前缀）
int prefixSum = 0, count = 0;

for (int num : nums) {
    prefixSum += num;
    // 如果 prefixSum - k 出现过，说明存在和为 k 的子数组
    count += map.getOrDefault(prefixSum - k, 0);
    map.merge(prefixSum, 1, Integer::sum);
}
```

## 差分数组

### 核心思路

差分数组 `diff[i] = nums[i] - nums[i-1]`。对区间 `[l, r]` 整体加 val，只需：
- `diff[l] += val`
- `diff[r + 1] -= val`

最后对 diff 求前缀和还原数组。

**什么时候用？** 多次对不同区间做整体加减操作。

### 通用模板

```java
// 构建差分数组
int[] diff = new int[n + 1];  // 多一位防越界

// 对区间 [l, r] 整体加 val
diff[l] += val;
if (r + 1 < n) {
    diff[r + 1] -= val;
}

// 还原数组：对 diff 求前缀和
int[] result = new int[n];
result[0] = diff[0];
for (int i = 1; i < n; i++) {
    result[i] = result[i - 1] + diff[i];
}
```

## 例题 1：[和为 K 的子数组（LeetCode 560）](https://leetcode.cn/problems/subarray-sum-equals-k/)

### 题目描述

给定整数数组 `nums` 和整数 `k`，统计数组中和为 `k` 的连续子数组个数。

### 思路分析

1. 暴力枚举所有子数组是 O(n²)，用前缀和 + 哈希表优化到 O(n)
2. 设 `prefixSum[i]` 为前 i 个元素的和，子数组 `[j, i]` 的和为 `prefixSum[i] - prefixSum[j]`
3. 要找和为 k 的子数组，等价于找之前有多少个 j 满足 `prefixSum[j] == prefixSum[i] - k`
4. 用 HashMap 边遍历边记录每个前缀和出现的次数

### 完整代码

```java
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> map = new HashMap<>();
    map.put(0, 1);
    int prefixSum = 0, count = 0;

    for (int num : nums) {
        prefixSum += num;
        count += map.getOrDefault(prefixSum - k, 0);
        map.merge(prefixSum, 1, Integer::sum);
    }
    return count;
}
```

### 复杂度分析

- **时间**：O(n)，遍历一次数组
- **空间**：O(n)，HashMap 最多存 n 个前缀和

## 例题 2：[航班预订统计（LeetCode 1109）](https://leetcode.cn/problems/corporate-flight-bookings/)

### 题目描述

有 `n` 个航班，编号 1 到 n。给定预订列表 `bookings`，其中 `bookings[i] = [first, last, seats]` 表示从航班 first 到航班 last 的每个航班预订了 seats 个座位。返回每个航班的总预订座位数。

### 思路分析

1. 每次预订是对区间 `[first, last]` 整体加 seats，典型的差分数组应用
2. 对差分数组做 first 位置 +seats、last+1 位置 -seats
3. 最后求前缀和还原每个航班的总预订数

### 完整代码

```java
public int[] corpFlightBookings(int[][] bookings, int n) {
    int[] diff = new int[n + 1];  // 多一位防越界

    for (int[] booking : bookings) {
        int first = booking[0] - 1;  // 转为 0-indexed
        int last = booking[1] - 1;
        int seats = booking[2];
        diff[first] += seats;
        if (last + 1 < n) {
            diff[last + 1] -= seats;
        }
    }

    // 求前缀和还原结果
    int[] result = new int[n];
    result[0] = diff[0];
    for (int i = 1; i < n; i++) {
        result[i] = result[i - 1] + diff[i];
    }
    return result;
}
```

### 复杂度分析

- **时间**：O(n + m)，m 为预订次数，n 为航班数
- **空间**：O(n)，差分数组

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [303](https://leetcode.cn/problems/range-sum-query-immutable/) | 区域和检索 - 数组不可变 | 简单 | 前缀和最基础应用，构建后 O(1) 查询 |
| [304](https://leetcode.cn/problems/range-sum-query-2d-immutable/) | 二维区域和检索 | 中等 | 二维前缀和，容斥原理求矩形区域和 |
| [523](https://leetcode.cn/problems/continuous-subarray-sum/) | 连续的子数组和 | 中等 | 前缀和 + 哈希表，判断余数是否出现过 |
| [974](https://leetcode.cn/problems/subarray-sums-divisible-by-k/) | 和可被 K 整除的子数组 | 中等 | 前缀和取模 + 哈希表统计同余个数 |
| [370](https://leetcode.cn/problems/range-addition/) | 区间加法 | 中等 | 差分数组经典题 |
| [1094](https://leetcode.cn/problems/car-pooling/) | 拼车 | 中等 | 差分数组，检查每站人数是否超载 |

## 面试常问 & 怎么答

### 前缀和为什么要多开一位？

`prefix[0] = 0` 作为哨兵，表示"一个元素都没有时和为 0"。这样查询区间 `[0, r]` 的和就是 `prefix[r+1] - prefix[0]`，不需要对 `l == 0` 做特判。

### 前缀和和差分是什么关系？

互为逆运算。对原数组求差分得到差分数组，对差分数组求前缀和还原回原数组。前缀和解决"快速查询"，差分解决"快速更新"。

## 看到什么就先想到这类

- "多次查询区间和"→ 前缀和
- "和为 k 的子数组个数"→ 前缀和 + 哈希表
- "二维矩形区域和"→ 二维前缀和
- "批量区间加减操作"→ 差分数组
- "区间增加后求最终状态"→ 差分 + 前缀和还原
