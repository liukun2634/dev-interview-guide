---
title: 数位 DP
---

# 数位 DP

<span class="dig-tag dig-tag--category">动态规划</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--medium">🔥 中频</span>

::: tip 💡 核心要点
**数位 DP** 通过逐位构造数字 + 记忆化搜索，在 $O(\log N \times \text{状态数})$ 时间内统计 $[1, N]$（或 $[L, R]$）范围内满足特定数位条件的整数个数，适用于 $N$ 高达 $10^{18}$ 的超大范围问题。
:::

---

## 识别信号

- 统计 $[1, N]$ 或 $[L, R]$ 范围内**满足某种数位条件**的整数个数
- 关键词：各位数字之和、各位数字互不相同、不含某个数字、相邻数位满足某种关系（如不递减、差值不超过 k）
- 数据范围**极大**（$N$ 可达 $10^{18}$），直接枚举不可行
- 条件只与数字的"每一位上的数值"有关，而非数字的算术性质（如整除）

---

## 通用思考框架

### 核心思想

把数字 $X$ 的各位分别看成一个序列（从高位到低位），**逐位填入数字，同时维护若干约束状态**。

对于一个 $d$ 位数，每一位的取值范围是 $0$–$9$，但最高位受到上界 $N$ 的限制：

- 若前面所有位都**恰好等于** $N$ 的对应位，当前位最多只能取到 $N$ 的对应位（称为处于 **tight / limit** 状态）
- 否则当前位可以自由取 $0$–$9$

用记忆化搜索（`dfs`）实现这一过程，把所有无 `limit` 约束的状态结果缓存起来，相同子问题直接复用。

### 前缀差分

区间 $[L, R]$ 的问题统一转化为：

$$\text{count}(R) - \text{count}(L - 1)$$

其中 $\text{count}(X)$ 表示 $[0, X]$（或 $[1, X]$）中满足条件的整数个数。

### 关键参数

| 参数 | 含义 | 说明 |
|------|------|------|
| `pos` | 当前处理到第几位（从高位到低位） | 从 `0` 开始，到 `len-1` 结束 |
| `limit` | 当前位是否受上界约束（tight） | `true` 时当前位最多取 `bound[pos]`；`false` 时可取 `0`–`9` |
| `isNum` | 是否已开始填入有效数字（处理前导零） | `false` 表示还在前导零阶段，可以继续跳过当前位 |
| `state` | 与题目相关的额外状态 | 如已用数字的 bitmask、各位数字之和等 |

**`limit` 的传递规则**：只有当前层 `limit == true` **且** 当前位取到了 `bound[pos]`，下一层的 `limit` 才为 `true`；否则下一层的 `limit` 为 `false`。

**`isNum` 的作用**：当 `isNum == false` 时，有两种选择：
1. 继续跳过（前导零延续），此时 `isNum` 仍为 `false` 传入下一层
2. 从 `1` 开始填数字（注意不是从 `0`，否则仍是前导零）

### 记忆化的注意事项

> **`limit == true` 的状态不应缓存（或将 `limit` 作为缓存 key 的一部分）**

原因：`limit == true` 的状态与上界 $N$ 紧密相关，不同的 $N$ 会导致不同的结果，无法复用。而 `limit == false` 的状态与 $N$ 无关，可以安全缓存。

最常见的做法：仅在 `!limit` 时读写缓存（如下模板所示）。

### 通用记忆化搜索模板（Java）

```java
class Solution {
    private int[] digits;   // 上界 N 的各位数字（从高位到低位）
    private int[][] memo;   // 记忆化数组，memo[pos][state]

    public int solve(int n) {
        digits = Integer.toString(n).chars()
                        .map(c -> c - '0').toArray();
        int len = digits.length;
        // memo 大小根据 state 的范围确定，-1 表示未计算
        memo = new int[len][STATE_SIZE];
        for (int[] row : memo) Arrays.fill(row, -1);
        return dfs(0, INITIAL_STATE, true, false);
    }

    /**
     * @param pos    当前处理的位下标（从高位 0 开始）
     * @param state  与题目相关的状态
     * @param limit  当前位是否受上界约束
     * @param isNum  是否已经开始填入有效数字（处理前导零）
     * @return       从当前位往后，满足条件的数字个数
     */
    private int dfs(int pos, int state, boolean limit, boolean isNum) {
        // 递归终止：已处理完所有位
        if (pos == digits.length) {
            // isNum == false 说明整个数都是前导零，即数字 0，根据题意决定是否计数
            return isNum ? (满足条件 ? 1 : 0) : 0;
        }

        // 读缓存（只缓存 limit == false 的状态）
        if (!limit && isNum && memo[pos][state] != -1) {
            return memo[pos][state];
        }

        int res = 0;

        // 选项一：继续保持前导零（跳过当前位）
        if (!isNum) {
            res += dfs(pos + 1, INITIAL_STATE, false, false);
        }

        // 选项二：在当前位填入数字
        int lo = isNum ? 0 : 1;          // 前导零阶段从 1 开始，否则从 0
        int hi = limit ? digits[pos] : 9; // 受限时上界为 digits[pos]
        for (int d = lo; d <= hi; d++) {
            res += dfs(pos + 1, nextState(state, d), limit && d == digits[pos], true);
        }

        // 写缓存
        if (!limit && isNum) {
            memo[pos][state] = res;
        }
        return res;
    }
}
```

---

## 典型例题：统计特殊整数 [LeetCode 2376](https://leetcode.cn/problems/count-special-integers/)

**题目描述**：如果一个正整数的每一个数位都是**互不相同**的，我们称它是**特殊整数**。给定正整数 $n$，统计区间 $[1, n]$ 内特殊整数的数目。

### 五步法

#### 第一步：状态定义

用 `dfs(pos, mask, limit, isNum)` 表示：当前处理到第 `pos` 位，已使用的数字集合为 `mask`（10位二进制，第 $k$ 位为 1 表示数字 $k$ 已使用），前缀是否受上界约束为 `limit`，是否已开始填数字为 `isNum`，从此往后能构成的特殊整数数目。

- `pos` 范围：$[0, \text{len})$
- `mask` 范围：$[0, 2^{10})$，即 $[0, 1024)$
- 记忆化数组：`memo[pos][mask]`，大小为 $10 \times 1024$

#### 第二步：转移方程

在第 `pos` 位填入数字 $d$（$d \notin \text{mask}$）：

$$\text{dfs}(\text{pos}, \text{mask}, \text{limit}, \text{isNum}) = \sum_{d} \text{dfs}(\text{pos}+1,\ \text{mask} \mid (1 \ll d),\ \text{limit} \wedge d = \text{digits}[\text{pos}],\ \text{true})$$

其中 $d$ 的枚举范围：
- 下界：`isNum` 为 `false` 时从 1 开始（避免前导零），否则从 0 开始
- 上界：`limit` 为 `true` 时不超过 `digits[pos]`，否则到 9

#### 第三步：初始化

- `memo` 全部初始化为 $-1$（表示未计算）
- 初始调用：`dfs(0, 0, true, false)`

#### 第四步：遍历顺序

记忆化搜索天然处理遍历顺序，不需要手动控制。

#### 第五步：返回值

- 当 `pos == len`（已填完所有位）时：
  - `isNum == true`：构成了一个有效数字，返回 1（本身就满足各位互不相同）
  - `isNum == false`：整个数为 0，不计入，返回 0
- 否则继续递归

### 完整 Java 代码

```java
class Solution {
    private int[] digits;
    private int[][] memo;

    public int countSpecialNumbers(int n) {
        // 将 n 拆分为各位数字
        String s = Integer.toString(n);
        digits = new int[s.length()];
        for (int i = 0; i < s.length(); i++) {
            digits[i] = s.charAt(i) - '0';
        }

        // memo[pos][mask]: pos 位, 已用数字集合为 mask 时的答案
        // -1 表示未计算
        memo = new int[digits.length][1 << 10];
        for (int[] row : memo) Arrays.fill(row, -1);

        return dfs(0, 0, true, false);
    }

    /**
     * @param pos    当前处理的位下标（0 = 最高位）
     * @param mask   已使用数字的 bitmask（第 k 位为 1 表示数字 k 已用）
     * @param limit  当前位是否受上界约束（tight）
     * @param isNum  是否已开始填入有效数字（用于处理前导零）
     * @return       从当前位往后能构成的特殊整数数目
     */
    private int dfs(int pos, int mask, boolean limit, boolean isNum) {
        // 所有位已填完
        if (pos == digits.length) {
            return isNum ? 1 : 0; // isNum=false 表示数字 0，不计入
        }

        // 读缓存（只在非 limit 且已开始填数字时缓存）
        if (!limit && isNum && memo[pos][mask] != -1) {
            return memo[pos][mask];
        }

        int res = 0;

        // 选项一：继续保持前导零（跳过当前位，isNum 保持 false）
        if (!isNum) {
            res += dfs(pos + 1, 0, false, false);
        }

        // 选项二：在当前位填入数字 d
        int lo = isNum ? 0 : 1; // 前导零阶段不能填 0（否则仍是前导零）
        int hi = limit ? digits[pos] : 9;
        for (int d = lo; d <= hi; d++) {
            // 数字 d 未被使用过，才能填入
            if (((mask >> d) & 1) == 0) {
                res += dfs(pos + 1, mask | (1 << d), limit && d == digits[pos], true);
            }
        }

        // 写缓存
        if (!limit && isNum) {
            memo[pos][mask] = res;
        }
        return res;
    }
}
```

**时间复杂度**：$O(\log N \times 2^{10} \times 10)$，**空间复杂度**：$O(\log N \times 2^{10})$

> **验证**：`n = 20` → 特殊整数为 1–9（9个）加上 10–20 中各位不同的数（10, 12, 13, 14, 15, 16, 17, 18, 19, 20），共 19 个。

---

## 延伸题目

| 题目 | 链接 | 与典型题的区别 | 关键技巧 |
|------|------|--------------|---------|
| 数字 1 的个数 | [LC 233](https://leetcode.cn/problems/number-of-digit-one/) | 统计所有数中 1 出现的总次数 | `state` 记录当前数中 1 已出现的次数，终态求和而非计数 |
| 不含连续 1 的非负整数 | [LC 600](https://leetcode.cn/problems/non-negative-integers-without-consecutive-ones/) | 限制相邻两位不能同时为 1（二进制） | 按二进制逐位处理，`state` 记录上一位是否为 1 |
| 最大为 N 的数字组合 | [LC 902](https://leetcode.cn/problems/numbers-at-most-n-given-digit-set/) | 只能使用给定数字集合中的数字 | `lo` 从给定集合中枚举，注意处理位数少于 N 的合法数 |
| 至少有 1 位重复的数字 | [LC 1012](https://leetcode.cn/problems/numbers-with-repeated-digits/) | 与 LC 2376 互补 | 直接用"总数 - 特殊整数数目"，即 `n - countSpecialNumbers(n)` |

---

## 常见陷阱与调试

1. **忘记前缀差分**：处理 $[L, R]$ 区间时，务必拆成 $\text{count}(R) - \text{count}(L-1)$；若直接对区间搜索，`limit` 逻辑会变得复杂且容易出错。

2. **前导零处理不当**：
   - 缺少 `isNum` 参数时，数字 0（全是前导零）会被错误计入
   - 前导零阶段 `lo` 应从 1 开始，而非 0；否则 `0xxx` 会被当成有效数字处理，`mask` 中的 0 被提前标记，导致后续位无法使用 0

3. **`limit` 参数传递错误**：下一层 `limit` 的正确写法是 `limit && d == digits[pos]`，即只有当前层受限**且**当前位取到了上界，下一层才受限。写成 `d == digits[pos]` 会漏掉 `limit == false` 的判断，导致越界。

4. **把 `limit == true` 的状态也缓存了**：`limit == true` 时结果依赖于具体的上界 `digits`，不同调用之间不可复用。若无条件写入 `memo`，当同一 `(pos, mask)` 组合以不同 `limit` 值被调用时会读到错误的缓存，产生答案偏小的 bug。正确做法：只在 `!limit && isNum` 时读写缓存，或将 `limit` 加入缓存 key（但会增大空间消耗）。

5. **位数不同的数字处理**：当构造的数字位数少于 $N$ 的位数时，这些数一定小于 $N$，不受 `limit` 约束。`isNum == false` 的跳过分支（前导零延续）正是为了自然处理这一点，不要手动把短位数的情况单独列举，容易引入重复计数。
