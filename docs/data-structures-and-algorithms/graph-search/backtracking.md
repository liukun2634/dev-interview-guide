---
title: 回溯
---

# 回溯

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
回溯 = DFS + 撤销选择。本质是在决策树上穷举，通过**剪枝**减少搜索量。排列、组合、子集、棋盘搜索都遵循同一套思考框架：先识别类型 → 画搜索树 → 定终止条件 → 设计剪枝。
:::

## 识别信号

**适合用回溯的场景：**
- 题目要求"所有方案"、"所有可能"、"枚举所有"
- 求所有排列、组合、子集
- 棋盘搜索（N 皇后、数独）
- 分割字符串（回文分割、IP 地址）
- 网格路径（单词搜索）

**反例：什么时候用 DP 而不是回溯？**
- 只需要方案**数量**，不需要具体方案 → DP（如爬楼梯、零钱兑换）
- 只需要最优方案，不需要所有方案 → DP（如背包问题、最长公共子序列）
- 问题有重叠子结构，回溯会重复计算 → DP 更高效

> 判断依据：如果输出是"有多少种"或"最优是多少"，优先考虑 DP；如果输出是"列出所有"，用回溯。

---

## 通用思考框架

### 第一步：判断问题类型

| 类型 | 特征 | 控制方式 | 典型题 |
|------|------|----------|--------|
| **排列** | 顺序有意义，`[1,2]` ≠ `[2,1]` | `used[]` 标记已用元素，每次从 0 开始遍历 | LC46、LC47 |
| **组合/子集** | 顺序无意义，`[1,2]` = `[2,1]` | `start` 参数控制遍历起点，不回头 | LC78、LC39 |
| **分割** | 将字符串切成若干段 | 枚举切割点，`start` 表示当前段起点 | LC131 |
| **棋盘搜索** | 逐行/逐格放置，约束检查 | 行号控制层数，列冲突/对角线冲突剪枝 | LC51、LC37 |

**为什么各类型的遍历控制不同？**
- 排列：同一个元素可以出现在不同位置，但每个元素只能用一次，所以要用 `used[]` 全局标记，每次从头扫描。
- 组合/子集：选元素时不关心顺序，一旦选了第 `i` 个，后续只能选 `i` 之后的，用 `start` 天然避免重复。
- 分割：每一层代表一个切割决策，`start` 是当前段的起始位置，枚举这段的结束位置。
- 棋盘：每一行只放一个棋子，层数 = 行号，每层枚举列位置。

### 第二步：设计搜索树

搜索树直接决定代码结构：
- **每一层**代表什么决策？（树的深度）
- **每一层的分支**是什么？（for 循环的范围）

做法：用小例子手画决策树。例如 `nums = [1,2,3]` 的排列问题：

```
                    []
        /           |           \
      [1]          [2]          [3]
    /    \        /   \        /   \
  [1,2] [1,3] [2,1] [2,3] [3,1] [3,2]
   |      |     |     |     |     |
[1,2,3][1,3,2][2,1,3][2,3,1][3,1,2][3,2,1]
```

搜索树画出来后，`for` 循环的范围、递归参数、终止条件都清晰可见。

### 第三步：确定终止条件和收集时机

| 类型 | 终止/收集条件 | 说明 |
|------|--------------|------|
| 排列 | `path.size() == n` | 所有元素都用了才是完整排列 |
| 子集 | 每次递归都收集 | 每个节点本身就是合法子集 |
| 组合 | `path.size() == k` | 凑够 k 个才收集 |
| 分割 | `startIndex == s.length()` | 切割位置到达字符串末尾，说明分割完毕 |

### 第四步：设计剪枝

剪枝决定算法的实际性能。没有剪枝的回溯在最坏情况下和暴力枚举一样慢。

**常见剪枝模式：**

**1. 含重复元素去重（同层去重）**
```java
// 前提：先对数组排序
if (i > start && nums[i] == nums[i-1]) continue;
```
为什么是 `i > start` 而不是 `i > 0`？
- `i > 0`：只要不是第一个元素就跳过 → 会误删不同层的合法选择
- `i > start`：只跳过**同一层**中和上一个相同的元素 → 正确去重

**2. 组合总和剪枝（提前终止）**
```java
// 前提：数组已排序
if (remaining < 0) return;  // 或：if (nums[i] > remaining) break;
```

**3. 棋盘约束剪枝（N 皇后）**
```java
if (col[j] || diag1[row-j+n-1] || diag2[row+j]) continue;
```

**4. 回溯通用模板（含剪枝位置）**
```java
List<List<Integer>> result = new ArrayList<>();

public void backtrack(int[] nums, List<Integer> path, int start /* 或 boolean[] used */) {
    // 收集答案（终止条件或每次递归）
    if (满足终止条件) {
        result.add(new ArrayList<>(path));  // 必须 new 一份，不能直接加引用
        return;
    }

    for (int i = start; i < nums.length; i++) {  // 排列用 i = 0
        // 剪枝
        if (不合法条件) continue;

        path.add(nums[i]);              // 做选择
        backtrack(nums, path, i + 1);   // 递归（排列传 used，组合传 i+1 或 i）
        path.remove(path.size() - 1);   // 撤销选择
    }
}
```

---

## 典型例题：全排列（LeetCode 46）

**题目：** 给定不含重复数字的数组 `nums`，返回其所有可能的全排列。

**第一步：识别** → "所有排列" → 回溯，排列类型（顺序有意义）

**第二步：搜索树** → 每一层选一个未用过的数字，深度 = `nums.length`，每层有 n 个分支，用 `used[]` 过滤已选

**第三步：终止** → `path.size() == nums.length`，所有位置填满时收集

**第四步：剪枝** → `if (used[i]) continue`（跳过已用元素），无重复元素不需要同层去重

```java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    boolean[] used = new boolean[nums.length];
    backtrack(nums, new ArrayList<>(), used, result);
    return result;
}

private void backtrack(int[] nums, List<Integer> path, boolean[] used,
                       List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));  // new 一份，避免引用问题
        return;
    }
    for (int i = 0; i < nums.length; i++) {  // 排列：每次从 0 开始
        if (used[i]) continue;               // 跳过已用元素
        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, path, used, result);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

**复杂度：**
- 时间：$O(n \times n!)$，共 $n!$ 个排列，每个排列复制 $O(n)$
- 空间：$O(n)$，递归深度 + path

---

## 延伸题目

| 题号 | 题名 | 难度 | 关键差异 | 一句话提示 |
|------|------|------|----------|------------|
| [47](https://leetcode.cn/problems/permutations-ii/) | 全排列 II | 中等 | 含重复元素 | 排序 + `i > 0 && nums[i] == nums[i-1] && !used[i-1]` 去重 |
| [78](https://leetcode.cn/problems/subsets/) | 子集 | 中等 | 每个节点都是答案 | 每次递归直接收集 path，用 start 控制不回头 |
| [90](https://leetcode.cn/problems/subsets-ii/) | 子集 II | 中等 | 含重复元素的子集 | 排序 + `i > start && nums[i] == nums[i-1]` 同层去重 |
| [39](https://leetcode.cn/problems/combination-sum/) | 组合总和 | 中等 | 元素可重复使用 | 递归传 `i`（不是 `i+1`），remaining < 0 时剪枝 |
| [40](https://leetcode.cn/problems/combination-sum-ii/) | 组合总和 II | 中等 | 元素不可重复，有重复元素 | 递归传 `i+1`，同层去重 |
| [51](https://leetcode.cn/problems/n-queens/) | N 皇后 | 困难 | 棋盘约束搜索 | 按行放皇后，用列/对角线数组做 O(1) 冲突检查 |
| [79](https://leetcode.cn/problems/word-search/) | 单词搜索 | 中等 | 网格四向回溯 | 标记已访问（修改原数组或用 visited），四方向递归 |
| [131](https://leetcode.cn/problems/palindrome-partitioning/) | 分割回文串 | 中等 | 分割类型 | 枚举切割终点，先判断回文再递归 |

---

## 常见陷阱与调试

**1. 收集答案时忘记 `new ArrayList<>(path)`**
```java
// 错误：加入的是引用，最终所有结果都是空列表
result.add(path);

// 正确：加入副本
result.add(new ArrayList<>(path));
```
`path` 在回溯过程中会不断增删元素，如果直接加入引用，最终 result 里所有列表都指向同一个被清空的 path。

**2. 去重条件写错：`i > 0` vs `i > start`**
```java
// 错误：i > 0 会跳过不同层的合法选择
if (i > 0 && nums[i] == nums[i-1]) continue;

// 正确：i > start 只跳过同层重复
if (i > start && nums[i] == nums[i-1]) continue;
```
`i > 0` 的含义是"只要不是第一个元素"，会把不同层中选相同值的情况也错误地过滤掉。`i > start` 限定在当前层内比较。

**3. 排列和组合混淆：used[] vs start 参数**
- 排列：顺序有意义，需要全局标记 `used[]`，for 循环从 0 开始
- 组合/子集：顺序无意义，用 `start` 控制不回头，for 循环从 `start` 开始
- 误用的现象：排列用了 `start` 会漏解；组合用了 `used[]` 会产生重复

---

## 面试常问 & 怎么答

### 含重复元素时怎么去重？

先排序，然后在同一层中跳过和前一个相同的元素：`if (i > start && nums[i] == nums[i-1]) continue;`。这里 `i > start` 保证只跳过同层的重复，不影响不同层的选择。

### 组合和排列的代码区别在哪？

组合用 `start` 参数控制起点，每次从 `start` 开始遍历，保证不回头。排列用 `used` 数组标记，每次从 0 开始遍历，跳过已使用的元素。

### 回溯的时间复杂度怎么分析？

排列问题：$O(n!)$。子集/组合问题：$O(2^n)$。本质是决策树的叶子节点数。剪枝可以减少实际搜索量，但最坏复杂度不变。

---

## 看到什么就先想到这类

- "所有排列" → 回溯 + `used` 数组
- "所有子集/组合" → 回溯 + `start` 参数
- "分割字符串的所有方式" → 回溯 + 枚举分割点
- "棋盘放置（N 皇后/数独）" → 回溯 + 约束检查
- "含重复元素的排列/子集/组合" → 排序 + 同层去重
