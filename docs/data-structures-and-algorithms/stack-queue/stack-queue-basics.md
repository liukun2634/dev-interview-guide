---
title: 栈与队列基础与高频技巧
---

# 栈与队列基础与高频技巧

<span class="dig-tag dig-tag--category">栈与队列</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
栈处理"最近、配对、回退"关系，队列处理"按层、按序推进"。当需要在线维护最值时，引入**单调栈**（找下一个更大/更小元素）和**单调队列**（滑动窗口最值）。
:::

---

## 识别信号

看到以下关键词，优先考虑栈或队列：

- **"括号匹配 / 嵌套结构 / 配对"** → 栈
- **"下一个更大 / 下一个更小元素"** → 单调栈
- **"柱状图面积 / 接雨水"** → 单调栈（找左右边界）
- **"滑动窗口最大值 / 最小值"** → 单调队列
- **"层序遍历 / BFS"** → 队列
- **"表达式求值 / 计算器 / 逆波兰"** → 栈

**反例（不适用）：** 全局排序、二分查找、DP 状态转移——这些与"相邻关系"无关，不需要单调结构。

---

## 通用思考框架

### 第一步：判断核心关系是"最近回退"还是"先进先出"

| 关系特征 | 数据结构 | 典型场景 |
|---|---|---|
| "最近的、配对的、嵌套的" | 栈 | 括号匹配、DFS、表达式求值 |
| "按层、按序、先到先处理" | 队列 | BFS、任务调度 |

**判断技巧：** 问自己"当我处理当前元素时，我需要回头看最近的那个，还是最早的那个？"最近的 → 栈；最早的 → 队列。

### 第二步：判断是否需要单调结构

```
普通栈  → 括号匹配、表达式求值、DFS 非递归
单调栈  → "下一个更大/更小元素"、柱状图面积（需要找左右边界）
普通队列 → BFS 层序遍历
单调队列 → 滑动窗口最大/最小值
```

**单调结构的本质：** 维护一个"有用候选者"不变量。以单调递减栈为例，栈中保留的都是"还没找到右边更大元素的候选者"——一旦当前元素比栈顶大，栈顶的答案就确定了，可以出栈。这个不变量保证了每个元素最多入栈出栈各一次，总体 O(n)。

### 第三步：确定栈/队列中存什么

- **存下标（推荐）**：当需要计算距离（如天数差、宽度）时，或需要通过下标访问原数组值时。
- **存值**：仅当只需要比较大小、不需要位置信息时才考虑。

**单调栈的不变量：**
- 单调递减栈（从底到顶）：用于找"下一个更大元素"，栈顶是当前最小候选者。
- 单调递增栈（从底到顶）：用于找"下一个更小元素"，栈顶是当前最大候选者。

**触发弹出的条件 / 弹出时做什么：**
- 弹出条件：`当前元素 > 栈顶对应值`（递减栈）
- 弹出时：栈顶元素的答案就是当前元素（或当前下标减去栈顶下标）

### 第四步：确定遍历方向

| 目标 | 遍历方向 | 原因 |
|---|---|---|
| 找右边第一个更大元素 | 从左到右 | 当前元素是"右边的那个更大值" |
| 找左边第一个更大元素 | 从右到左 | 当前元素是"左边的那个更大值" |
| 环形数组 | 遍历两遍（或取模） | 模拟"绕一圈" |

---

### 代码基础：栈的用法

```java
// Java 中推荐用 ArrayDeque，而不是 Stack（Stack 继承 Vector，方法有 synchronized，单线程下性能差）
Deque<Integer> stack = new ArrayDeque<>();
stack.push(val);           // 入栈（压栈顶）
int top = stack.peek();    // 查看栈顶，不弹出
int val = stack.pop();     // 出栈
boolean empty = stack.isEmpty();
```

### 代码模板：单调栈（找下一个更大元素）

```java
public int[] nextGreaterElement(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();  // 存下标

    for (int i = 0; i < n; i++) {
        // 当前元素比栈顶大 → 栈顶的"下一个更大元素"就是 nums[i]
        while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) {
            result[stack.pop()] = nums[i];
        }
        stack.push(i);
    }
    // 循环结束后栈中剩余的下标：右边没有更大元素，result 保持 -1
    return result;
}
```

### 代码模板：单调队列（滑动窗口最大值）

```java
public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // 存下标，队列单调递减

    for (int i = 0; i < n; i++) {
        // 移除超出窗口左边界的元素（从队首）
        while (!deque.isEmpty() && deque.peekFirst() <= i - k) {
            deque.pollFirst();
        }
        // 维护单调递减：移除所有比当前值小的元素（从队尾），它们不可能是窗口最大值
        while (!deque.isEmpty() && nums[deque.peekLast()] <= nums[i]) {
            deque.pollLast();
        }
        deque.offerLast(i);
        // 窗口形成后，队首就是当前窗口最大值的下标
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }
    return result;
}
```

---

## 典型例题：每日温度（LeetCode 739）

[题目链接](https://leetcode.cn/problems/daily-temperatures/)

给定数组 `temperatures`，返回数组 `answer`，其中 `answer[i]` 是第 `i` 天之后需要等几天才能等到更暖的温度。如果之后没有更暖的日子，`answer[i] = 0`。

### 1. 识别

"等到更暖的温度" = "找右边第一个比当前温度更大的元素" → 单调栈模板题。

### 2. 栈中存什么

需要计算天数差（下标差），所以存**下标**。栈维护单调递减的温度序列（从底到顶）。

### 3. 何时弹出

`temperatures[i] > temperatures[stack.peek()]`：当前温度比栈顶温度高，说明栈顶那天等到了更暖的日子。

### 4. 弹出时做什么

设栈顶下标为 `j`，则 `answer[j] = i - j`（等了 `i - j` 天）。

### 5. 完整代码

```java
public int[] dailyTemperatures(int[] temperatures) {
    int n = temperatures.length;
    int[] answer = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();  // 存下标

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
            int j = stack.pop();
            answer[j] = i - j;  // 等了 i-j 天
        }
        stack.push(i);
    }
    // 栈中剩余的下标：之后没有更暖的天，answer 保持默认值 0
    return answer;
}
```

**时间复杂度：** O(n)，每个元素最多入栈出栈各一次，均摊 O(1)。

**空间复杂度：** O(n)。

---

## 延伸题目

| 题号 | 题名 | 难度 | 关键差异 | 一句话提示 |
|---|---|---|---|---|
| [20](https://leetcode.cn/problems/valid-parentheses/) | 有效的括号 | 简单 | 普通栈，配对匹配 | 入栈对应的右括号，遇右括号直接 pop 比较 |
| [155](https://leetcode.cn/problems/min-stack/) | 最小栈 | 中等 | 辅助栈同步记录最小值 | 两个栈：一个正常栈，一个记录当前最小值 |
| [232](https://leetcode.cn/problems/implement-queue-using-stacks/) | 用栈实现队列 | 简单 | 两栈模拟队列 | 输入栈 + 输出栈，均摊 O(1) |
| [496](https://leetcode.cn/problems/next-greater-element-i/) | 下一个更大元素 I | 简单 | 单调栈 + HashMap | 先对 nums2 建单调栈映射，再查询 nums1 |
| [84](https://leetcode.cn/problems/largest-rectangle-in-histogram/) | 柱状图中最大的矩形 | 困难 | 单调栈找左右边界 | 对每根柱，找左右第一个更矮的柱 |
| [239](https://leetcode.cn/problems/sliding-window-maximum/) | 滑动窗口最大值 | 困难 | 单调队列，需移除过期元素 | 双端队列维护单调递减，队首即窗口最大值 |
| [394](https://leetcode.cn/problems/decode-string/) | 字符串解码 | 中等 | 栈保存嵌套上下文 | 遇 `[` 时将当前结果和倍数压栈，遇 `]` 时弹出拼接 |
| [150](https://leetcode.cn/problems/evaluate-reverse-polish-notation/) | 逆波兰表达式求值 | 中等 | 栈处理后缀表达式 | 遇数字入栈，遇运算符弹出两个操作数计算后入栈 |

---

## 常见陷阱与调试

- **用了 `Stack` 而不是 `ArrayDeque`：** Java 的 `Stack` 继承自 `Vector`，方法都加了 `synchronized`，单线程下有不必要的性能开销，面试中直接用 `ArrayDeque`。
- **单调栈：搞混"下一个更大"和"上一个更大"的遍历方向：** 找"右边"从左到右遍历；找"左边"从右到左遍历。方向搞反会导致答案完全错误。
- **忘记处理循环结束后栈中的剩余元素：** 循环结束后栈里还有元素，说明这些位置右边没有符合条件的答案，应保持默认值（通常是 -1 或 0）。初始化 `Arrays.fill(result, -1)` 可以避免额外处理。
- **单调队列：忘记从队首移除过期元素：** 滑动窗口问题中，每次新增元素前必须先检查队首是否超出窗口左边界，否则会把过期的最大值带入计算。

---

## 面试常问 & 怎么答

### 为什么用 ArrayDeque 而不是 Stack？

Java 的 `Stack` 继承自 `Vector`，所有方法都加了 `synchronized`，单线程场景下有不必要的性能开销。`ArrayDeque` 是非同步的，作为栈和队列都比 `Stack`/`LinkedList` 更快。

### 单调栈的时间复杂度为什么是 O(n)？

虽然有嵌套的 while 循环，但每个元素最多入栈一次、出栈一次，总操作次数不超过 2n，所以均摊 O(n)。

### 单调栈和单调队列的区别？

单调栈只在一端（栈顶）操作，适合找"下一个更大/更小元素"。单调队列两端都可以操作（双端队列），适合维护滑动窗口的最值，需要从队首移除过期元素。

---

## 看到什么就先想到这类

- "括号匹配 / 嵌套结构" → 栈
- "下一个更大/更小元素" → 单调栈
- "柱状图面积 / 接雨水" → 单调栈
- "滑动窗口最大值/最小值" → 单调队列
- "表达式求值 / 计算器" → 栈
- "用栈实现队列 / 用队列实现栈" → 两个栈/队列互相倒
