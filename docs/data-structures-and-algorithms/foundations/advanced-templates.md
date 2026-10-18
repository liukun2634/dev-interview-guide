---
title: 高阶算法模板
---

# 高阶算法模板

<span class="dig-tag dig-tag--category">基础知识</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 大厂</span>

::: tip 💡 核心要点
本页收录**中大厂、ACM/IOI 出身面试官最爱考的高阶模板**：字符串匹配（KMP / Manacher）、区间数据结构（树状数组 / 线段树）。**记不住代码没关系——重点是知道"什么题该想到它"+ 能讲清思想**。模板代码可以现场推，但识别信号必须秒判。
:::

## 一图速查：什么时候用哪个模板

```
字符串中找模式串    → KMP（O(n+m)）
找最长回文子串      → Manacher（O(n)）
单点修改 + 前缀求和 → 树状数组（O(log n)）
区间修改 + 区间查询 → 线段树 + 懒标记（O(log n)）
带"找下一个"的区间求和 → 线段树二分
```

| 模板 | 时间复杂度 | 空间 | 替代方案 | 典型题 |
|------|----------|------|--------|--------|
| **KMP** | O(n + m) | O(m) | 暴力 O(nm) / 字符串 hash | 找子串、循环节、最小循环节 |
| **Manacher** | O(n) | O(n) | DP O(n²) / 中心扩展 O(n²) | 最长回文子串 |
| **树状数组（BIT）** | O(log n) 单次 | O(n) | 朴素数组 O(n) | 单点改 + 前缀和 / 求逆序对 |
| **线段树** | O(log n) 单次 | O(4n) | 树状数组（功能弱）| 区间改 + 区间查 + 区间最值 |

---

## KMP 字符串匹配

### 识别信号

- "在文本 s 中找模式串 p 第一次/所有出现位置"
- "字符串的最小循环节"
- "字符串旋转后是否等于另一个字符串"

### 核心思想

KMP 的本质是：**失配时主串扫描下标不回退，模式串的已匹配长度沿 next 数组回退**，复用已经比较过的信息。`next[]` 也常被称为 `fail` 或 `lps`，但不同资料的下标约定可能不同，要连同定义一起使用。

`next[i]` = `p[0..i]` 的**真前缀和真后缀的最长公共长度**。

```
p = "ABABC"
next[0] = 0   (A)
next[1] = 0   (AB: 真前缀{A} ∩ 真后缀{B} = 空)
next[2] = 1   (ABA: 真前缀{A,AB} ∩ 真后缀{A,BA} = {A})
next[3] = 2   (ABAB: 公共 = {AB})
next[4] = 0   (ABABC: C 破坏了)
```

### 模板代码（Java）

```java
public class KMP {
    // 构造 next 数组
    public static int[] buildNext(String p) {
        int m = p.length();
        int[] next = new int[m];
        int j = 0;                          // 当前最长匹配前缀长度
        for (int i = 1; i < m; i++) {
            while (j > 0 && p.charAt(i) != p.charAt(j)) {
                j = next[j - 1];            // 关键：失配时跳到次长匹配
            }
            if (p.charAt(i) == p.charAt(j)) j++;
            next[i] = j;
        }
        return next;
    }

    // 主串 s 中找模式串 p 的所有起始位置
    public static List<Integer> search(String s, String p) {
        List<Integer> res = new ArrayList<>();
        if (p.isEmpty()) return res;
        int[] next = buildNext(p);
        int j = 0;
        for (int i = 0; i < s.length(); i++) {
            while (j > 0 && s.charAt(i) != p.charAt(j)) {
                j = next[j - 1];
            }
            if (s.charAt(i) == p.charAt(j)) j++;
            if (j == p.length()) {
                res.add(i - j + 1);
                j = next[j - 1];            // 继续找下一个
            }
        }
        return res;
    }
}
```

### KMP 的隐藏神技

#### ① 最小循环节

> 字符串 `s` 长度 `n`，如果 `n % (n - next[n-1]) == 0`，则 `s` 由长度 `n - next[n-1]` 的循环节构成。

```
s = "abcabcabc"   next = [0,0,0,1,2,3,4,5,6]
n - next[n-1] = 9 - 6 = 3
9 % 3 == 0 → 循环节长度 3 ("abc")
```

#### ② 判断字符串旋转

> 先要求 `s1.length()==s2.length()`，再判断 `s2` 是否为 `s1+s1` 的子串。否则 `"ab"` 也会被误判成 `"abc"` 的旋转。两者都为空时可直接返回 true；非空时用 KMP 在 O(n) 内检查。

### 面试常被追问

| 追问 | 标准答案 |
|------|---------|
| **为什么不用暴力匹配？** | 暴力 O(nm)，每次失配 i 回退到匹配起点+1；KMP 利用 next 数组让 i 永不回退，O(n+m) |
| **KMP 和字符串 Hash 怎么选？** | Hash 实现简单、可处理子串相等的多种查询；KMP 是确定性算法，无哈希冲突风险，单次匹配更快 |
| **next 数组怎么自己推？** | 关键递推：`p[i] == p[j]` 时 `next[i]=j+1`；否则 j 跳到 `next[j-1]`，继续比较 |

---

## Manacher 最长回文子串

### 识别信号

- "最长回文子串长度"（必须连续）
- "回文子串的个数"
- 数据规模 n ≥ 1e5（DP O(n²) 会超时）

### 核心思想

中心扩展法 O(n²) 的瓶颈是：**奇偶长度回文要分别处理 + 每个中心都从头扩展**。

Manacher 做两件事解决：

1. **预处理插入分隔符**：`"aba"` → `"#a#b#a#"`，统一处理奇偶
2. **利用对称性**：已知一个大回文 `[L, R]`，求其内部位置 `i` 的回文半径时，**可以直接复用对称位置 `2C-i` 的结果**，避免重复扩展

### 模板代码（Java）

```java
public class Manacher {
    public static String longestPalindrome(String s) {
        // 1. 预处理：插入 # 把奇偶统一
        StringBuilder sb = new StringBuilder("#");
        for (char c : s.toCharArray()) {
            sb.append(c).append('#');
        }
        char[] t = sb.toString().toCharArray();
        int n = t.length;

        int[] p = new int[n];     // p[i] = 以 i 为中心的回文半径
        int C = 0, R = 0;         // 当前最右回文的中心 C，右边界 R
        int maxLen = 0, maxCenter = 0;

        for (int i = 0; i < n; i++) {
            // 关键：利用对称性初始化 p[i]
            if (i < R) {
                p[i] = Math.min(R - i, p[2 * C - i]);
            }
            // 中心扩展
            while (i - p[i] - 1 >= 0 && i + p[i] + 1 < n
                && t[i - p[i] - 1] == t[i + p[i] + 1]) {
                p[i]++;
            }
            // 更新最右边界
            if (i + p[i] > R) {
                C = i;
                R = i + p[i];
            }
            if (p[i] > maxLen) {
                maxLen = p[i];
                maxCenter = i;
            }
        }

        // 在原串中的起点 = (maxCenter - maxLen) / 2
        int start = (maxCenter - maxLen) / 2;
        return s.substring(start, start + maxLen);
    }
}
```

### 关键不变量

`i` 是插入分隔符后的下标，`p[i]` 是变换串中的回文半径，数值恰好等于对应原串回文的长度；原串起点为 `(i-p[i])/2`。不要把变换串的中心下标直接当成原串下标。

若 `i < R`，镜像位置为 `mirror = 2*C-i`。在已知大回文的范围内，对称关系保证至少能复用 `min(p[mirror], R-i)`：镜像半径更小时，失配也能镜像；镜像碰到或越过左边界时，只能确定到右边界 `R`，外面必须实际比较。因此不能无条件复制镜像半径。

**为什么总时间是 O(n)？** 已知边界内的匹配通过镜像复用；继续成功扩展只会推进最右边界，边界总共前进 O(n) 次，每个中心另有常数次失败判断。

**不能解决什么？** `bbbab` 的最长回文子串是 `bbb`，长度 3；允许跳过字符后，最长回文子序列是 `bbbb`，长度 4。后者没有连续中心扩展的结构，应使用 [回文子序列 DP](../dynamic-programming/sequence-dp)。

### 替代方案对比

| 方法 | 复杂度 | 何时用 |
|------|-------|------|
| **DP** | O(n²) 时间 + O(n²) 空间 | n ≤ 1000，需要拿到所有 (i,j) 是否回文 |
| **中心扩展** | O(n²) 时间 + O(1) 空间 | n ≤ 1000，只要最长 |
| **Manacher** | O(n) 时间 | n ≥ 1e5，**面试加分点** |

---

## 树状数组（Binary Indexed Tree / Fenwick Tree）

### 识别信号

- "单点更新 + 区间求和"
- "求逆序对的个数"
- "动态前缀和"
- 数据规模 n ≥ 1e5 + 频繁更新查询（朴素数组 O(n) 单次太慢）

### 核心思想

把 `n` 个数按 **`lowbit`（最低位的 1）** 分组，每个节点存的是一段区间的和。

```
i = 6 = 110₂
lowbit(6) = 010₂ = 2
→ tree[6] 管辖 [6-2+1, 6] = [5, 6] 这 2 个数

i = 8 = 1000₂
lowbit(8) = 1000₂ = 8
→ tree[8] 管辖 [8-8+1, 8] = [1, 8] 这 8 个数
```

求前缀和 `[1, x]` = 沿着 `x` 不断减去 `lowbit(x)` 跳上去把沿途 `tree[]` 加起来，复杂度 O(log n)。

### 模板代码（Java）

```java
public class BIT {
    private final int[] tree;
    private final int n;

    public BIT(int n) {
        this.n = n;
        this.tree = new int[n + 1];   // 1-indexed
    }

    private int lowbit(int x) { return x & -x; }

    // 单点更新：a[i] += delta
    public void update(int i, int delta) {
        for (; i <= n; i += lowbit(i)) tree[i] += delta;
    }

    // 前缀和：a[1] + ... + a[i]
    public int prefixSum(int i) {
        int sum = 0;
        for (; i > 0; i -= lowbit(i)) sum += tree[i];
        return sum;
    }

    // 区间和 [l, r]
    public int rangeSum(int l, int r) {
        return prefixSum(r) - prefixSum(l - 1);
    }
}
```

### 经典应用：求逆序对

```java
// 离散化 nums 后，从右向左扫描
// 对每个数 x，查询"已经处理过的、严格小于 x 的数有多少个"
public long reversePairs(int[] nums) {
    int[] sorted = nums.clone();
    Arrays.sort(sorted);
    Map<Integer, Integer> rank = new HashMap<>();
    for (int value : sorted) {
        if (!rank.containsKey(value)) {
            rank.put(value, rank.size() + 1);
        }
    }

    BIT bit = new BIT(rank.size());
    long count = 0;
    for (int i = nums.length - 1; i >= 0; i--) {
        int r = rank.get(nums[i]);
        count += bit.prefixSum(r - 1);    // 比 nums[i] 小的已处理元素数
        bit.update(r, 1);
    }
    return count;
}
```

**离散化保留大小关系，不保留数值间距**：`[1,1,1,2]` 只能得到 `1 -> 1, 2 -> 2`，相同值共享排名，排名连续落在 `[1, distinctCount]`。不能用 `putIfAbsent(value, nextRank++)`，因为 Java 会先求实参的值，即使 key 已存在也会自增。

从右向左扫描时，BIT 恰好记录当前元素右侧的频次。查询 `prefixSum(rank-1)` 排除相等元素，随后再插入当前元素，避免把自己算进去。`[2,1,1]` 的查询贡献依次为 `0,0,2`，总数 2；`[1,1,1,2]` 应为 0。逆序对最多有 `n*(n-1)/2` 个，因此总数用 `long`；此处 BIT 存频次，每个节点不超过数组长度。排序与每次操作合计 O(n log n)，额外空间 O(n)。

BIT 的更新下标必须在 `[1,n]`：`update(0, ...)` 中 `lowbit(0)=0` 会导致循环不前进；`prefixSum(0)=0` 则是合法的空前缀查询。

### 树状数组 vs 线段树

| 维度 | 树状数组 | 线段树 |
|------|---------|--------|
| **代码量** | ~10 行 | ~40+ 行 |
| **常数** | 极小 | 较大 |
| **单点改 + 前缀和** | ✅ 首选 | ✅ |
| **区间改 + 区间和** | 两棵 BIT 维护加权差分 | 支持 |
| **区间最值** | 标准求和 BIT 不直接支持一般区间最值与任意修改，特殊限制下有变体 | 通常更直接 |
| **可持久化、可二分** | 部分支持 | **完整支持** |

::: tip 💡 面试黄金一句

> **"只要功能是'单点改 + 前缀求和'，就用树状数组——代码短、常数小、不容易写错；一旦涉及区间最值或区间复杂操作，立刻换线段树。"**

:::

---

## 线段树（Segment Tree）

### 识别信号

- "区间求和 / 区间最大值 / 区间最小值，且有修改操作"
- "区间染色 / 区间加一个数 / 区间赋值"
- 树状数组功能不够 → 必上线段树

### 核心思想

把 `[1, n]` 按中点递归二分，构成高度 O(log n) 的二叉树，每个节点存一段区间的聚合信息（sum / max / min）。它不一定满足“完全二叉树最后一层靠左”的定义。

```
       [1,8]
      /     \
   [1,4]   [5,8]
   / \     /  \
 [1,2][3,4][5,6][7,8]
 ...
```

**懒标记（lazy）**：区间修改时不立刻下推到叶子，而是在节点上打标记，直到下次访问时再下推。这让区间修改也降到 O(log n)。

### 模板代码（区间加 + 区间求和，Java）

```java
public class SegmentTree {
    private final long[] tree, lazy;
    private final int n;

    public SegmentTree(int[] arr) {
        this.n = arr.length;
        this.tree = new long[4 * n];
        this.lazy = new long[4 * n];
        build(1, 0, n - 1, arr);
    }

    private void build(int node, int l, int r, int[] arr) {
        if (l == r) { tree[node] = arr[l]; return; }
        int mid = (l + r) >>> 1;
        build(node * 2, l, mid, arr);
        build(node * 2 + 1, mid + 1, r, arr);
        tree[node] = tree[node * 2] + tree[node * 2 + 1];
    }

    // 把 lazy 下推到子节点
    private void pushDown(int node, int l, int r) {
        if (lazy[node] != 0) {
            int mid = (l + r) >>> 1;
            tree[node * 2]     += lazy[node] * (mid - l + 1);
            tree[node * 2 + 1] += lazy[node] * (r - mid);
            lazy[node * 2]     += lazy[node];
            lazy[node * 2 + 1] += lazy[node];
            lazy[node] = 0;
        }
    }

    // 区间 [ql, qr] 每个元素加 val
    public void rangeAdd(int ql, int qr, int val) {
        rangeAdd(1, 0, n - 1, ql, qr, val);
    }
    private void rangeAdd(int node, int l, int r, int ql, int qr, int val) {
        if (qr < l || r < ql) return;
        if (ql <= l && r <= qr) {
            tree[node] += (long) val * (r - l + 1);
            lazy[node] += val;
            return;
        }
        pushDown(node, l, r);
        int mid = (l + r) >>> 1;
        rangeAdd(node * 2, l, mid, ql, qr, val);
        rangeAdd(node * 2 + 1, mid + 1, r, ql, qr, val);
        tree[node] = tree[node * 2] + tree[node * 2 + 1];
    }

    // 区间求和
    public long rangeSum(int ql, int qr) {
        return rangeSum(1, 0, n - 1, ql, qr);
    }
    private long rangeSum(int node, int l, int r, int ql, int qr) {
        if (qr < l || r < ql) return 0;
        if (ql <= l && r <= qr) return tree[node];
        pushDown(node, l, r);
        int mid = (l + r) >>> 1;
        return rangeSum(node * 2, l, mid, ql, qr)
             + rangeSum(node * 2 + 1, mid + 1, r, ql, qr);
    }
}
```

### 调试要点

::: warning ⚠️ 线段树最容易踩的坑

1. **数组开 `4 * n`** —— 不是 2n，因为最底层可能不是 2 的幂次
2. **`pushDown` 一定要在递归 `rangeAdd / rangeSum` 进子树之前调用**
3. **lazy 累加 vs 覆盖**：区间赋值要分两种 lazy（assign + add）
4. **区间合并的中点处理**：`mid = (l+r) >>> 1`，子区间是 `[l,mid]` 和 `[mid+1,r]`，**不要写错半开区间**

:::

### 进阶变体（点到为止）

| 变体 | 解决问题 |
|------|---------|
| **权值线段树** | "第 k 大的数"、"区间内 [a,b] 范围内的数有几个" |
| **可持久化线段树**（主席树）| 区间第 k 小、历史版本查询 |
| **线段树二分** | "求区间内第一个大于 x 的位置" |
| **动态开点** | 区间值域极大但实际节点少（如 1e9 但只 1e5 个操作）|
| **ZKW 线段树** | 自底向上、常数小，竞赛常用 |

---

## 面试怎么用这页

**95% 的中后端开发面试不会真的让你写线段树**。但能做到下面三点已经超越大多数候选人：

1. **识别**："这题要单点改 + 区间和，我会用树状数组"
2. **讲思想**：能 30 秒讲清 KMP 的 next 数组是什么、Manacher 利用对称性怎么工作、线段树为什么 4n、lazy 标记的作用
3. **承认边界**：被追问"具体实现写一下"时坦白"模板要查，但思路清楚"——比硬写半小时出 bug 强

::: tip 💡 真实面试技巧

> 面试官问到"最长回文子串"，先答 **"如果 n ≤ 1000 我会用中心扩展 O(n²)；如果 n 到 1e5 会用 Manacher O(n) 利用对称性避免重复扩展"**——主动给出复杂度分类，远胜直接写代码。

:::

## 看到什么就先想到这类

| 题目特征 | 模板 |
|---------|------|
| "在 s 中找 p 的所有出现位置" | KMP |
| "字符串最小循环节" | KMP 的 next 数组 |
| "判断 s2 是不是 s1 的旋转" | KMP 查 s2 in s1+s1 |
| "最长回文子串"（n 大）| Manacher |
| "单点改 + 求前缀和" | 树状数组 |
| "求逆序对" | 离散化 + 树状数组 |
| "区间加 + 区间求和" | 线段树 + 懒标记 |
| "区间最值（带修改）" | 线段树 |
| "区间内 ≥ x 的数有几个" | 权值线段树 / 主席树 |
