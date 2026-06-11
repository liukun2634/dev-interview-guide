---
title: 前缀和与差分
---

# 前缀和与差分

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
前缀和解决"快速求任意区间和"的问题，差分解决"批量区间增减"的问题。两者互为逆运算：对差分数组求前缀和得到原数组，对原数组求差分得到差分数组。
:::

---

## 识别信号

**适合使用前缀和的场景：**
- 需要多次查询不同区间的元素之和（区间不可变）
- 统计"和为 k 的子数组个数"等计数问题
- 查询二维矩形区域的元素之和

**适合使用差分数组的场景：**
- 需要对多个区间批量执行加减操作，最后查看最终状态
- 操作次数远多于查询次数

**反例——不适合用这两种方法：**
- 数组频繁被单点修改且同时需要区间查询 → 考虑线段树或树状数组
- 只查询一次区间和 → 直接遍历即可，无需预处理
- 既有大量区间更新又有大量区间查询 → 考虑线段树（超出本文范围）

---

## 通用思考框架

### 第一步：判断是"查询"还是"更新"

拿到题目后，先问自己两个问题：

1. **操作的主体是什么？** 是对区间求和/计数（查询），还是对区间整体加减（更新）？
2. **操作次数多不多？** 如果只做一次，暴力即可；如果重复做很多次，才需要预处理。

| 场景 | 方向 |
|------|------|
| 多次区间查询，数组不变 | 前缀和 |
| 多次区间更新，最后查状态 | 差分数组 |
| 又要大量更新又要大量查询 | 线段树（超出本文范围，面试中说明即可） |

### 第二步：前缀和的设计方法论

**为什么 prefix 长度要是 n+1？**

`prefix[0] = 0` 是一个哨兵（sentinel），代表"空前缀的和为 0"。有了它，查询区间 `[l, r]` 的和统一写成 `prefix[r+1] - prefix[l]`，不需要对 `l == 0` 做任何特判，代码更整洁，也不容易出错。

**1D 前缀和的构建与查询：**

```java
// 构建前缀和（0-indexed，prefix 长度 n+1）
int[] prefix = new int[nums.length + 1];
for (int i = 0; i < nums.length; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
}

// 查询区间 [l, r] 的和（0-indexed，闭区间）
int rangeSum = prefix[r + 1] - prefix[l];
```

**前缀和 + HashMap 模式（用于"计数"类问题）：**

当题目变成"统计满足条件的子数组个数"时，单纯的前缀和数组不够用——我们需要快速知道某个前缀和之前出现过几次。这时引入 HashMap：

```java
// 模板：前缀和 + 哈希表统计（以"和为 k 的子数组个数"为例）
Map<Integer, Integer> map = new HashMap<>();
map.put(0, 1);  // 关键：空前缀的和为 0，初始化为出现 1 次
int prefixSum = 0, count = 0;

for (int num : nums) {
    prefixSum += num;
    // 如果 prefixSum - k 出现过，说明存在一段和为 k 的子数组
    count += map.getOrDefault(prefixSum - k, 0);
    map.merge(prefixSum, 1, Integer::sum);
}
```

**2D 前缀和（矩形区域和）：**

二维情况使用容斥原理：`prefix[i][j]` 表示左上角 `(0,0)` 到 `(i-1,j-1)` 的矩形区域元素之和（同样多开一行一列做哨兵）。

```java
// 构建二维前缀和
int[][] prefix = new int[m + 1][n + 1];
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        prefix[i][j] = matrix[i-1][j-1]
            + prefix[i-1][j]
            + prefix[i][j-1]
            - prefix[i-1][j-1];  // 容斥：左上角被加了两次，减掉一次
    }
}

// 查询左上角 (r1,c1) 到右下角 (r2,c2) 的矩形区域和（0-indexed）
int area = prefix[r2+1][c2+1]
         - prefix[r1][c2+1]
         - prefix[r2+1][c1]
         + prefix[r1][c1];  // 容斥：左上角被减了两次，加回一次
```

### 第三步：差分数组的设计方法论

差分数组是前缀和的逆运算。定义 `diff[i] = nums[i] - nums[i-1]`（`diff[0] = nums[0]`）。其核心优势：

- 对原数组区间 `[l, r]` 整体加 `val`，只需修改差分数组的两个端点，O(1) 完成
- 所有区间操作结束后，对差分数组求一遍前缀和即可还原最终数组

```java
// 构建差分数组（多申请一位，防止 r+1 越界）
int[] diff = new int[n + 1];

// 对区间 [l, r] 整体加 val（O(1)）
diff[l] += val;
diff[r + 1] -= val;  // r+1 可能等于 n，多申请的那一位正好承接这个操作

// 还原数组：对 diff 求前缀和
int[] result = new int[n];
result[0] = diff[0];
for (int i = 1; i < n; i++) {
    result[i] = result[i - 1] + diff[i];
}
```

**为什么这样有效？** 当你对 diff 求前缀和时，`diff[l] += val` 的效果会从位置 `l` 一路"传播"到数组末尾；而 `diff[r+1] -= val` 则从位置 `r+1` 开始"抵消"这个传播。两者叠加，恰好只有区间 `[l, r]` 被加上了 val。

**2D 差分（[LC 2536](https://leetcode.cn/problems/increment-submatrices-by-one/) 等高频考点）**

2D 差分把 1D 的"两端打标记"扩展到"矩形四角打标记"。对左上 `(r1,c1)` 到右下 `(r2,c2)` 的子矩阵整体加 `val`：

```java
int[][] diff = new int[m + 1][n + 1];        // ★ 多开一行一列，承接 r2+1 / c2+1

// 子矩阵 [r1..r2] × [c1..c2] 整体加 val，O(1)
void add(int r1, int c1, int r2, int c2, int val) {
    diff[r1][c1]     += val;
    diff[r2+1][c1]   -= val;                 // 下边界抵消向下传播
    diff[r1][c2+1]   -= val;                 // 右边界抵消向右传播
    diff[r2+1][c2+1] += val;                 // ★ 容斥：右下角被减了两次，补回来
}

// 还原：对 diff 做 2D 前缀和
int[][] result = new int[m][n];
for (int i = 0; i < m; i++) {
    for (int j = 0; j < n; j++) {
        diff[i][j] += (i > 0 ? diff[i-1][j] : 0) + (j > 0 ? diff[i][j-1] : 0)
                    - (i > 0 && j > 0 ? diff[i-1][j-1] : 0);
        result[i][j] = diff[i][j];
    }
}
```

**口诀对照（与 2D 前缀和符号正好相反）：**

| 操作 | 左上 | 下侧 | 右侧 | 右下 |
|------|------|------|------|------|
| 2D 前缀和（构建） | `+matrix` | `+pre[i-1]` | `+pre[j-1]` | `-pre[i-1][j-1]` |
| 2D 前缀和（查询） | `+pre` | `-pre` | `-pre` | `+pre` |
| **2D 差分（打标记）** | **`+val`** | **`-val`** | **`-val`** | **`+val`** |

### 第四步：选择合适的变体

```
题目涉及区间操作？
    ├── 主要是"查询区间和/计数"
    │       ├── 普通区间和查询  →  1D / 2D 前缀和
    │       └── 统计满足条件的子数组数量  →  前缀和 + HashMap
    └── 主要是"批量区间更新，最后看结果"
            └── 差分数组
```

---

## 典型例题：和为 K 的子数组（LeetCode 560）

[题目链接](https://leetcode.cn/problems/subarray-sum-equals-k/)

给定整数数组 `nums` 和整数 `k`，统计数组中和为 `k` 的连续子数组个数。

### 第一步：识别

- 操作类型：统计满足条件的子数组个数（查询 + 计数）
- 暴力枚举所有子数组是 O(n²)，需要优化
- "子数组和" + "计数" → 前缀和 + HashMap 模式

### 第二步：设计

设 `prefixSum[i]` 为前 i 个元素之和。子数组 `[j, i]` 的和为：

$$\text{prefixSum}[i] - \text{prefixSum}[j] = k$$

变形得：

$$\text{prefixSum}[j] = \text{prefixSum}[i] - k$$

因此，遍历到位置 i 时，只需查询"之前有多少个位置 j 满足 prefixSum[j] = prefixSum[i] - k"。用 HashMap 维护每个前缀和出现的次数，即可 O(1) 完成这个查询。

**关键初始化**：`map.put(0, 1)`。这代表"空前缀（0 个元素）的和为 0，出现了 1 次"。没有这个初始化，当子数组从下标 0 开始时会漏计。

### 第三步：代码

```java
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> map = new HashMap<>();
    map.put(0, 1);  // 空前缀：和为 0，初始出现 1 次
    int prefixSum = 0, count = 0;

    for (int num : nums) {
        prefixSum += num;
        // 查询之前是否有 prefixSum[j] == prefixSum - k
        count += map.getOrDefault(prefixSum - k, 0);
        // 将当前前缀和加入 map（先查询再更新，避免把自己算进去）
        map.merge(prefixSum, 1, Integer::sum);
    }
    return count;
}
```

### 复杂度分析

- **时间**：O(n)，遍历一次数组，每次 HashMap 操作 O(1)
- **空间**：O(n)，HashMap 最多存 n 个不同的前缀和

---

## 延伸题目

| 题号 | 题名 | 难度 | 关键差异 | 一句话提示 |
|------|------|------|------|------|
| [303](https://leetcode.cn/problems/range-sum-query-immutable/) | 区域和检索 - 数组不可变 | 简单 | 前缀和最基础应用，无 HashMap | 构建后 O(1) 查询任意区间和 |
| [304](https://leetcode.cn/problems/range-sum-query-2d-immutable/) | 二维区域和检索 | 中等 | 二维前缀和，容斥原理 | 求矩形区域和，注意四个角的加减符号 |
| [523](https://leetcode.cn/problems/continuous-subarray-sum/) | 连续的子数组和 | 中等 | 前缀和取模 + HashMap，判断是否存在而非计数 | 余数相同则两前缀和之差能被 k 整除 |
| [974](https://leetcode.cn/problems/subarray-sums-divisible-by-k/) | 和可被 K 整除的子数组 | 中等 | 与 523 类似但要计数所有满足的子数组 | 前缀和取模 + 哈希表统计同余个数 |
| [370](https://leetcode.cn/problems/range-addition/) | 区间加法 | 中等 | 差分数组经典裸题 | 多次区间 +val 后求最终数组 |
| [1094](https://leetcode.cn/problems/car-pooling/) | 拼车 | 中等 | 差分数组，有容量约束 | 对乘客上下车区间做差分，检查每站人数是否超载 |
| [1109](https://leetcode.cn/problems/corporate-flight-bookings/) | 航班预订统计 | 中等 | 差分数组，1-indexed 输入需转换 | 每次预订是区间 +seats，差分 + 前缀和还原每个航班总数 |

---

## 常见陷阱与调试

**1. 忘记初始化 `map.put(0, 1)`**

这是前缀和 + HashMap 模式中最常见的错误。如果子数组从下标 0 开始（即 prefixSum[i] 本身等于 k），但 map 里没有记录"和为 0 出现过"，就会漏掉这些子数组。

**2. 区间查询的下标偏移错误**

正确写法是 `prefix[r + 1] - prefix[l]`（0-indexed 闭区间 [l, r]）。常见错误是写成 `prefix[r] - prefix[l]`（少了右移一位）或 `prefix[r] - prefix[l - 1]`（没有使用 n+1 长度的哨兵设计，且 l=0 时越界）。

**3. 二维前缀和容斥符号写反**

构建时：`prefix[i][j] = matrix[i-1][j-1] + prefix[i-1][j] + prefix[i][j-1] - prefix[i-1][j-1]`

查询时：`area = prefix[r2+1][c2+1] - prefix[r1][c2+1] - prefix[r2+1][c1] + prefix[r1][c1]`

可以用韦恩图帮助记忆：两个大矩形减掉两次，左上角小矩形加回来一次。

---

## 面试常问 & 怎么答

### 前缀和为什么要多开一位？

`prefix[0] = 0` 作为哨兵，表示"一个元素都没有时和为 0"。这样查询区间 `[0, r]` 的和就是 `prefix[r+1] - prefix[0]`，不需要对 `l == 0` 做特判，代码统一整洁。

### 前缀和和差分是什么关系？

互为逆运算。对原数组逐差得到差分数组；对差分数组求前缀和还原回原数组。前缀和适合"多次查询、不修改"，差分适合"多次修改、最后查状态"。

---

## 看到什么就先想到这类

- "多次查询区间和" → 前缀和
- "和为 k 的子数组个数" → 前缀和 + 哈希表
- "二维矩形区域和" → 二维前缀和
- "批量区间加减操作" → 差分数组
- "区间增加后求最终状态" → 差分 + 前缀和还原
