---
title: DP 优化技巧
---

# DP 优化技巧

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
当朴素 DP 因转移方程中的窗口 min/max 或区间求和导致超时时，分别用单调队列、单调栈、二分查找、前缀和将复杂度从 $O(n^2)$ 或 $O(nk)$ 压缩到 $O(n \log n)$ 乃至 $O(n)$。
:::

---

## 识别信号

遇到以下特征时，说明朴素 DP 需要优化：

- **朴素 DP 超时**：时间复杂度 $O(n^2)$ 或 $O(nk)$，数据规模 $n \ge 10^5$，需要优化到 $O(n \log n)$ 或 $O(n)$
- **转移方程含滑动窗口**：`dp[i] = min/max(dp[j]) + cost`，且 $j$ 限制在 $[i-k,\, i-1]$ 这样的固定范围内 → 单调队列
- **需要左/右第一个更大/更小元素**：枚举"以某元素为最值"的区间 → 单调栈
- **转移方程含区间求和**：`dp[i] = sum(dp[j..i-1]) + cost` → 前缀和
- **求最长递增子序列（LIS）类问题**：贪心维护尾部数组 + 二分 → $O(n \log n)$

---

## 优化技巧一：单调队列优化

### 适用场景

转移方程形如：

$$dp[i] = \min_{j \in [i-k,\, i-1]} \bigl(dp[j]\bigr) + \text{cost}(i)$$

$j$ 的候选范围是一个随 $i$ 滑动的**固定大小窗口**，朴素做法每次枚举窗口内所有 $j$，复杂度 $O(nk)$。

### 核心思想

维护一个**单调递增（求 min）或单调递减（求 max）的双端队列**，队列中存储下标。

- 队头始终是当前窗口内的最优下标；
- 每次 $i$ 右移时，先从队头弹出过期元素（下标 $< i-k$），再从队尾弹出不可能成为最优的元素，最后将 $i-1$ 入队；
- 每个元素至多入队、出队各一次，总复杂度 $O(n)$。

### 典型例题：跳跃游戏 VI — [LeetCode 1696](https://leetcode.cn/problems/jump-game-vi/)

**题意**：给定整数数组 `nums`，从下标 0 出发，每次可以跳 1 到 k 步，到达下标 n-1，求路径上元素之和的最大值。

**五步法**：

1. **定义状态**：`dp[i]` = 到达下标 `i` 的最大得分。
2. **转移方程**：$dp[i] = \max_{j \in [\max(0,\,i-k),\,i-1]} dp[j] + \text{nums}[i]$
3. **初始化**：`dp[0] = nums[0]`
4. **遍历顺序**：从左到右
5. **优化**：用单调递减队列维护窗口 $[\max(0,i-k),\,i-1]$ 内 `dp` 的最大值

```java
import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public int maxResult(int[] nums, int k) {
        int n = nums.length;
        int[] dp = new int[n];
        dp[0] = nums[0];

        // 单调递减队列，存下标，队头是当前窗口内 dp 值最大的下标
        Deque<Integer> deque = new ArrayDeque<>();
        deque.offerLast(0);

        for (int i = 1; i < n; i++) {
            // 1. 弹出队头过期元素（下标已不在窗口 [i-k, i-1] 内）
            while (!deque.isEmpty() && deque.peekFirst() < i - k) {
                deque.pollFirst();
            }

            // 2. 队头即为窗口内 dp 最大值的下标
            dp[i] = dp[deque.peekFirst()] + nums[i];

            // 3. 维护单调性：从队尾弹出所有 dp 值 <= dp[i] 的下标
            //    它们在未来也不可能优于 i（i 的 dp 更大且下标更靠右）
            while (!deque.isEmpty() && dp[deque.peekLast()] <= dp[i]) {
                deque.pollLast();
            }

            // 4. 将当前下标入队
            deque.offerLast(i);
        }

        return dp[n - 1];
    }
}
```

**复杂度**：时间 $O(n)$，空间 $O(n)$（dp 数组）+ $O(k)$（队列）。

---

## 优化技巧二：单调栈优化

### 适用场景

需要快速回答：**当前元素左侧（或右侧）第一个比它更大（或更小）的元素在哪里**。
常见于"枚举以某元素为区间最值"的 DP，将 $O(n^2)$ 的暴力枚举压缩到 $O(n)$。

### 核心思想

按**从左到右扫描、为弹出元素结算右边界**的写法：找右侧第一个严格更大值，用从栈底到栈顶非递增的栈；找右侧第一个严格更小值，用非递减的栈。相等元素是否弹出，由所求边界的严格性决定，不能只背“递增/递减”而不说明方向。

- 遍历每个元素，若当前元素破坏单调性，则不断弹栈——被弹出的元素以当前元素为"右边界最值"；
- 每个元素至多入栈、出栈各一次，总复杂度 $O(n)$。

### 典型例题：子数组的最小值之和 — [LeetCode 907](https://leetcode.cn/problems/sum-of-subarray-minimums/)

**题意**：给定整数数组 `arr`，求所有连续子数组的最小值之和（对 $10^9+7$ 取模）。

**核心思路**：对于每个元素 `arr[i]`，计算它作为最小值的子数组数量。

设 `leftBoundary[i]` = 左侧第一个**严格小于** `arr[i]` 的下标（不存在则为 -1），
`rightBoundary[i]` = 右侧第一个**小于等于** `arr[i]` 的下标（不存在则为 n）。

则以 `arr[i]` 为最小值的子数组数量为：

$$\operatorname{count}(i) = (i - \operatorname{leftBoundary}[i]) \times (\operatorname{rightBoundary}[i] - i)$$

**注意**：左侧用严格小于、右侧用小于等于，是为了避免重复计算相等元素的情况。

下面代码的 `left[i]`、`right[i]` 已经存储两侧**距离**，不是边界下标，因此最后直接相乘。左端点有 `i-leftBoundary[i]` 种选择，右端点有 `rightBoundary[i]-i` 种选择，乘法来自两侧可以独立选择。

### 用 `[2,2]` 验证相等元素的归属

三个子数组分别是下标区间 `[0,0]`、`[1,1]`、`[0,1]`，答案应为 6。采用“左严格小于、右小于等于”时，把包含多个相同最小值的区间交给**最右边**那个最小值：

| 下标 | 左边界 | 右边界 | 左距离 × 右距离 | 负责的子数组 |
|------|--------|--------|-----------------|--------------|
| 0 | -1 | 1 | `1 × 1` | `[0,0]` |
| 1 | -1 | 2 | `2 × 1` | `[1,1]`、`[0,1]` |

若两侧都找严格小于，`[0,1]` 会被两者各算一次，结果 8；若两侧都找小于等于，它又不会被任何一方认领，结果 4。也可以反过来“左小于等于、右严格小于”，让最左边元素负责，但必须成对调整。

```java
class Solution {
    public int sumSubarrayMins(int[] arr) {
        int n = arr.length;
        final int MOD = 1_000_000_007;

        int[] left = new int[n];   // left[i]: 左侧第一个严格小于 arr[i] 的距离
        int[] right = new int[n];  // right[i]: 右侧第一个小于等于 arr[i] 的距离

        // 单调递增栈，求 left
        int[] stack = new int[n];
        int top = -1;
        for (int i = 0; i < n; i++) {
            // 弹出所有 >= arr[i] 的元素（保证左侧是严格小于）
            while (top >= 0 && arr[stack[top]] >= arr[i]) {
                top--;
            }
            left[i] = top >= 0 ? i - stack[top] : i + 1;
            stack[++top] = i;
        }

        // 单调递增栈，求 right
        top = -1;
        for (int i = n - 1; i >= 0; i--) {
            // 弹出所有 > arr[i] 的元素（保证右侧是小于等于，避免重复）
            while (top >= 0 && arr[stack[top]] > arr[i]) {
                top--;
            }
            right[i] = top >= 0 ? stack[top] - i : n - i;
            stack[++top] = i;
        }

        long ans = 0;
        for (int i = 0; i < n; i++) {
            ans = (ans + (long) arr[i] * left[i] % MOD * right[i]) % MOD;
        }
        return (int) ans;
    }
}
```

**复杂度**：时间 $O(n)$，空间 $O(n)$。

---

## 优化技巧三：二分查找优化

### 适用场景

经典场景：**最长递增子序列（LIS）**。
朴素 DP 每次需要枚举所有更小的前驱，复杂度 $O(n^2)$；利用贪心 + 二分可优化到 $O(n \log n)$。

### 核心思想

维护一个 `tails` 数组，其中 `tails[len-1]` 表示**长度为 `len` 的递增子序列中末尾元素的最小值**。

- **`tails` 数组始终保持严格递增**：取长度为 `len+1`、结尾最小的递增子序列，删去末元素后得到长度 `len` 的递增子序列。`tails[len-1]` 不大于这个前缀的末元素，而该末元素严格小于 `tails[len]`，所以 `tails[len-1] < tails[len]`。
- 遍历每个新元素 `x`：
  - 若 `x > tails[len-1]`，直接追加，LIS 长度 +1；
  - 否则，在 `tails` 中二分查找第一个 $\ge x$ 的位置 `pos`，用 `x` 替换 `tails[pos]`（贪心：相同长度的子序列，末尾越小越有利于后续扩展）。

### 典型例题：最长递增子序列的 O(n log n) 解法 — [LeetCode 300](https://leetcode.cn/problems/longest-increasing-subsequence/)

```java
import java.util.Arrays;

class Solution {
    public int lengthOfLIS(int[] nums) {
        // tails[i] 表示长度为 i+1 的 LIS 的最小末尾元素
        int[] tails = new int[nums.length];
        int len = 0; // 当前 LIS 最大长度

        for (int x : nums) {
            // 在 tails[0..len-1] 中二分查找第一个 >= x 的位置
            // （求严格递增：用 >=；求不降序列：用 >）
            int lo = 0, hi = len;
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (tails[mid] < x) {
                    lo = mid + 1;
                } else {
                    hi = mid;
                }
            }
            // lo == hi 即为插入位置
            tails[lo] = x;
            if (lo == len) {
                len++; // x 比所有尾部都大，LIS 长度增加
            }
        }

        return len;
    }
}
```

**为什么 `tails` 始终有序？**

每次操作只有两种结果：
1. 在末尾追加一个比 `tails[len-1]` 更大的值，有序性显然保持；
2. 替换某位置的值：存在左邻时有 `tails[pos-1] < x`；存在右邻时有 `x <= 旧 tails[pos] < tails[pos+1]`，所以替换后仍严格递增。首尾位置没有的邻居不参与比较。

**复杂度**：时间 $O(n \log n)$，空间 $O(n)$。

**使用 `Arrays.binarySearch` 的简洁写法**（仅供参考，手写二分更直观）：

```java
class Solution {
    public int lengthOfLIS(int[] nums) {
        int[] tails = new int[nums.length];
        int len = 0;
        for (int x : nums) {
            // binarySearch 找不到时返回 -(insertion point) - 1
            int pos = Arrays.binarySearch(tails, 0, len, x);
            if (pos < 0) pos = -(pos + 1); // 转为插入位置
            tails[pos] = x;
            if (pos == len) len++;
        }
        return len;
    }
}
```

---

### 从长度到实际 LIS：记录前驱

`tails` 只保存每个长度的最佳结尾，不保证这些结尾来自同一条子序列。例如依次处理 `[3,5,7,1,2]`，最终 `tails=[1,2,7]`，但 7 在原数组中位于 1、2 之前，不能把它当作答案输出；合法 LIS 是 `[3,5,7]`。

增加两个数组：`tailIndex[length-1]` 保存该长度最佳结尾的原下标；`previous[index]` 固定记录当前元素加入时的前驱下标。后续可以替换 `tailIndex`，但不会改写已经建立的前驱链。

```java
public int[] longestIncreasingSubsequence(int[] nums) {
    if (nums.length == 0) return new int[0];
    int[] tailIndex = new int[nums.length];
    int[] previous = new int[nums.length];
    Arrays.fill(previous, -1);
    int length = 0;
    for (int index = 0; index < nums.length; index++) {
        int left = 0, right = length;
        while (left < right) {
            int middle = left + (right - left) / 2;
            if (nums[tailIndex[middle]] < nums[index]) left = middle + 1;
            else right = middle;
        }
        if (left > 0) previous[index] = tailIndex[left - 1];
        tailIndex[left] = index;
        if (left == length) length++;
    }
    int[] result = new int[length];
    int current = tailIndex[length - 1];
    for (int position = length - 1; position >= 0; position--) {
        result[position] = nums[current];
        current = previous[current];
    }
    return result;
}
```

每条前驱边都指向更早的下标、更小的值，恢复出的序列因此既保持原顺序又严格递增。二分阶段 O(n log n)，恢复 O(n)，额外空间 O(n)。多个最优解存在时返回其中一个，不保证字典序最小。

## 优化技巧四：前缀和优化

### 适用场景

转移方程中包含对 `dp` 数组的**区间求和**，例如：

$$dp[i] = \sum_{j=0}^{i-1} dp[j] + \text{cost}(i)$$

朴素做法每次 $O(n)$ 求和，整体 $O(n^2)$；利用前缀和可将每次查询降为 $O(1)$，整体 $O(n)$。

### 核心思想

在计算 `dp[i]` 的同时，维护前缀和数组 `prefSum`，其中：

$$\text{prefSum}[i] = \sum_{j=0}^{i-1} dp[j]$$

则区间 $[l, r)$ 的 `dp` 求和可以 $O(1)$ 完成：

$$\sum_{j=l}^{r-1} dp[j] = \text{prefSum}[r] - \text{prefSum}[l]$$

### 典型例题：正整数的有序拆分计数

**问题模型**：给定非负整数 `n`，把它写成若干正整数之和，顺序不同算不同方案，答案对 `1_000_000_007` 取模。`n=0` 的空序列算一种；`n=3` 有 `[3]`、`[1,2]`、`[2,1]`、`[1,1,1]` 四种。

设 `dp[total]` 为和恰好为 `total` 的有序序列数。按**最后一个数**分类：若此前的和为 `previous`，最后一个数唯一确定为 `total-previous`，所以不同分类互斥且覆盖所有答案：

$$dp[0]=1,\qquad dp[total]=\sum_{previous=0}^{total-1}dp[previous]\quad(total\ge1)$$

不需要额外 `+1`，单个数 `[total]` 已经由 `dp[0]` 计入。朴素实现枚举所有此前的和是 O(n²)；维护 `prefSum[total]=sum(dp[0..total-1])`，转移只需 O(1)。

```java
class PrefixSumDPExample {
    public long countWays(int n) {
        if (n < 0) throw new IllegalArgumentException("n must be nonnegative");
        final long MOD = 1_000_000_007L;
        long[] dp = new long[n + 1];
        long[] prefSum = new long[n + 2];
        dp[0] = 1;
        prefSum[1] = 1;
        for (int total = 1; total <= n; total++) {
            dp[total] = prefSum[total];
            prefSum[total + 1] = (prefSum[total] + dp[total]) % MOD;
        }
        return dp[n];
    }
}
```

`dp[0..4] = [1,1,2,4,8]`，`prefSum[1..5] = [1,2,4,8,16]`，注意两个数组错开一位。总时间 O(n)、空间 O(n)；此模型只查整个前缀，可进一步只保留累计和，压到 O(1) 空间。若转移查询的是任意历史区间，则通常仍需保留前缀数组。

**独立校验**：对 `n>=1`，把 n 个 1 排开，n-1 个间隙各选“切开/合并”，方案数应为 `2^(n-1)`，取模后与 DP 对照。这是验证递推的另一条推导，不是再抄一遍同样的循环。

**实战提示**：在 [LeetCode 1871 跳跃游戏 VII](https://leetcode.cn/problems/jump-game-vii/) 中，前缀和将区间可达性查询从 $O(n \cdot \text{maxJump})$ 降到 $O(n)$。

---

## 延伸题目

| 题目 | 难度 | 优化技巧 | 链接 |
|------|------|------|------|
| 滑动窗口最大值 | 中等 | 单调队列 | [LC 239](https://leetcode.cn/problems/sliding-window-maximum/) |
| 最长递增子序列 | 中等 | 二分查找（patience sorting） | [LC 300](https://leetcode.cn/problems/longest-increasing-subsequence/) |
| 跳跃游戏 VI | 中等 | 单调队列优化 DP | [LC 1696](https://leetcode.cn/problems/jump-game-vi/) |
| 子数组的最小值之和 | 中等 | 单调栈（贡献法） | [LC 907](https://leetcode.cn/problems/sum-of-subarray-minimums/) |
| 俄罗斯套娃信封问题 | 困难 | 二维 LIS + 二分查找 | [LC 354](https://leetcode.cn/problems/russian-doll-envelopes/) |
| 跳跃游戏 VII | 中等 | 前缀和优化 DP | [LC 1871](https://leetcode.cn/problems/jump-game-vii/) |

**LC 354 俄罗斯套娃** 是 LIS 的二维变体：先对宽度升序排序，宽度相同时对高度**降序**排序，然后对高度序列求 LIS。降序排序的目的是防止同一宽度下的多个高度被算入同一递增序列。

---

## 常见陷阱与调试

**1. 单调队列：忘记弹出过期队头**

```java
// ❌ 只维护了单调性，没有清除超出窗口的旧元素
// ✅ 每次使用队头前先检查：
while (!deque.isEmpty() && deque.peekFirst() < i - k) {
    deque.pollFirst();
}
```

**2. 单调栈：相等元素处理不一致导致重复计数**

在求"子数组最小值"类问题时，左边界用**严格小于**（`>=` 时弹出），右边界用**小于等于**（`>` 时弹出），保证每个子数组只被一个最小值统计到。

**3. LIS 二分：严格递增 vs 非严格递增**

- 严格递增 LIS：查找第一个 $\ge x$ 的位置（`lo` 从 `tails[mid] < x` 时右移）
- 非严格不降序列：查找第一个 $> x$ 的位置（`lo` 从 `tails[mid] <= x` 时右移）

**4. 前缀和下标偏移**

`prefSum[i]` 通常定义为 `dp[0..i-1]` 之和，即比 `dp` 数组多一位，下标 0 初始化为 0。更新时先用 `prefSum[i]` 计算 `dp[i]`，再更新 `prefSum[i+1] = prefSum[i] + dp[i]`，保证不用未初始化的值。

**5. 取模运算中的乘法溢出**

在求子数组最值之和类问题中，`arr[i] * left[i] * right[i]` 容易溢出 `int`，需要强制转换为 `long`：

```java
ans = (ans + (long) arr[i] * left[i] % MOD * right[i]) % MOD;
```
