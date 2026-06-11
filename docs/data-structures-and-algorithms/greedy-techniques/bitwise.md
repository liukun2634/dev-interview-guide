---
title: 位运算技巧
---

# 位运算技巧

<span class="dig-tag dig-tag--category">贪心与技巧</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
位运算把集合、奇偶性、去重、状态切换压缩成常数级操作。面试中最常考的是异或性质（`a ^ a = 0`）和 `n & (n-1)` 消除最低位 1。掌握这两个技巧能解决大部分位运算题。
:::

## 核心思路

**什么时候用位运算？**
- 找只出现一次的数字（异或）
- 统计二进制中 1 的个数
- 判断是否是 2 的幂
- 状态压缩（用二进制表示集合）

## 常用位运算技巧

| 操作 | 代码 | 作用 |
|------|------|------|
| 判断奇偶 | `x & 1` | 1 奇数，0 偶数 |
| 去掉最低位 1 | `x & (x - 1)` | Brian Kernighan 算法 |
| 保留最低位 1 | `x & (-x)` | lowbit，树状数组常用 |
| 异或去重 | `a ^ a = 0` | 成对抵消，剩下的是单独的 |
| 判断 2 的幂 | `x > 0 && (x & (x-1)) == 0` | 2 的幂只有一个 1 |
| 交换两数 | `a ^= b; b ^= a; a ^= b;` | 不用临时变量（面试少用） |

## 异或性质

```java
// 异或的三个关键性质
// 1. a ^ 0 = a（恒等）
// 2. a ^ a = 0（自反）
// 3. 满足交换律和结合律

// 应用：数组中只有一个数出现一次，其他都出现两次
int result = 0;
for (int num : nums) {
    result ^= num;  // 成对的抵消为 0，剩下单独的
}
```

## n & (n-1) 技巧

```java
// n & (n-1) 每次消除 n 的最低位 1
// 例：n = 12 (1100)
//     n-1 = 11 (1011)
//     n & (n-1) = 8 (1000)  消除了最低位的 1

// 统计 1 的个数
int count = 0;
while (n != 0) {
    n = n & (n - 1);
    count++;
}
```

## x & (-x) 与 lowbit（树状数组基石）

这是上表里“保留最低位 1”的详细展开。面试问“树状数组怎么快速跳到上一个区间”时，答案就是它。

**原理：为什么 `x & (-x)` 能素出最低位 1？**

```
以 x = 12 为例（int，补码表示）：
x  =  00000000 00000000 00000000 00001100
-x =  11111111 11111111 11111111 11110100   (~x + 1)
x & -x = 00000000 00000000 00000000 00000100 = 4 = 最低位 1 的权值
```

补码 `-x = ~x + 1` 的性质：`~x` 把所有位取反，加 1 使得原本 x 的最低位 1 及其右边的 0 **复原**为原样，而更高位全部取反。与原值相与，只有那一位同时为 1。

**三大应用：**

```java
// 1）树状数组（BIT）的核心。lowbit(i) = i 负责管理的区间长度
int lowbit(int x) { return x & -x; }

void update(int i, int delta) {
    for (; i <= n; i += lowbit(i)) tree[i] += delta;   // ★ 向上跳到父亲
}
int query(int i) {
    int sum = 0;
    for (; i > 0; i -= lowbit(i)) sum += tree[i];      // ★ 向下跳到前个区间
    return sum;
}

// 2）枚举二进制中所有 1 的位置（状压 DP 常用）
for (int s = mask; s > 0; s -= s & -s) {
    int bit = s & -s;       // bit 是最低位 1 的权值
    int idx = Integer.numberOfTrailingZeros(bit);  // 转为位置下标
    // process(idx);
}

// 3）枚举状压 DP 中某状态的所有子集
for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
    // sub 是 mask 的一个非空子集
}
```

**口诀：看到 `x & -x` 就要能说出**：“BIT 的 lowbit、枚举位、枚举子集这三个场景都用它。”面试官问到“树状数组为什么能 O(log n)”时，答案就是“lowbit 跳跃 → 每次取掉一个二进制位 → 最多 log n 位”。

## 例题 1：[只出现一次的数字（LeetCode 136）](https://leetcode.cn/problems/single-number/)

### 题目描述

给定非空整数数组 `nums`，除了某个元素只出现一次以外，其余每个元素均出现两次。找出只出现一次的元素。要求线性时间、常数空间。

### 思路分析

1. 异或性质：`a ^ a = 0`，`a ^ 0 = a`
2. 把所有数异或起来，成对的抵消为 0，剩下的就是答案
3. 一次遍历，O(1) 空间

### 完整代码

```java
public int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num;
    }
    return result;
}
```

### 复杂度分析

- **时间**：O(n)
- **空间**：O(1)

## 例题 2：[位 1 的个数（LeetCode 191）](https://leetcode.cn/problems/number-of-1-bits/)

### 题目描述

给定一个无符号整数 `n`，返回其二进制表示中 1 的个数。

### 思路分析

1. 用 `n & (n - 1)` 每次消除最低位的 1
2. 消除几次就有几个 1
3. 比逐位检查更高效（只循环 1 的个数次）

### 完整代码

```java
public int hammingWeight(int n) {
    int count = 0;
    while (n != 0) {
        n = n & (n - 1);
        count++;
    }
    return count;
}
```

### 复杂度分析

- **时间**：O(k)，k 为 1 的个数
- **空间**：O(1)

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [136](https://leetcode.cn/problems/single-number/) | 只出现一次的数字 | 简单 | 全员异或，成对抵消 |
| [191](https://leetcode.cn/problems/number-of-1-bits/) | 位 1 的个数 | 简单 | `n & (n-1)` 消除最低位 1 |
| [231](https://leetcode.cn/problems/power-of-two/) | 2 的幂 | 简单 | `n > 0 && (n & (n-1)) == 0` |
| [268](https://leetcode.cn/problems/missing-number/) | 丢失的数字 | 简单 | 异或 0~n 和数组所有元素 |
| [338](https://leetcode.cn/problems/counting-bits/) | 比特位计数 | 简单 | DP：`dp[i] = dp[i & (i-1)] + 1` |
| [461](https://leetcode.cn/problems/hamming-distance/) | 汉明距离 | 简单 | 异或后数 1 的个数 |
| [137](https://leetcode.cn/problems/single-number-ii/) | 只出现一次的数字 II | 中等 | 逐位统计 mod 3 |
| [260](https://leetcode.cn/problems/single-number-iii/) | 只出现一次的数字 III | 中等 | 异或后按某一位分组 |

## 面试常问 & 怎么答

### 为什么 `n & (n-1)` 能消除最低位的 1？

`n-1` 会把 n 的最低位 1 变成 0，同时把它右边的 0 全变成 1。与 n 做 AND 后，最低位 1 及其右边全部清零，左边不变。例：`1100 & 1011 = 1000`。

### 异或有什么性质？

三个核心性质：①自反 `a ^ a = 0`，②恒等 `a ^ 0 = a`，③交换律结合律。由此推导：数组中所有数异或，成对出现的抵消为 0，只出现一次的留下来。

### 位运算和算术运算的性能差异？

位运算直接对应 CPU 指令，一个时钟周期完成。但在面试中不要为了微优化把清晰的代码改成位运算，除非题目明确要求。位运算的价值在于解决特定问题（如异或去重），而非性能优化。

## 看到什么就先想到这类

- "只出现一次的数字"→ 异或
- "二进制中 1 的个数"→ `n & (n-1)`
- "是否是 2 的幂"→ `n & (n-1) == 0`
- "丢失/重复的数字"→ 异或 / 位统计
- "状态压缩/子集枚举"→ 位掩码
