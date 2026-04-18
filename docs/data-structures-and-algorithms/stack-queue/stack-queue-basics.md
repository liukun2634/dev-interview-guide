---
title: 栈与队列基础与高频技巧
---

# 栈与队列基础与高频技巧

<span class="dig-tag dig-tag--category">栈与队列</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
栈处理"最近、配对、回退"关系，队列处理"按层、按序推进"。当需要在线维护最值时，引入**单调栈**（找下一个更大/更小元素）和**单调队列**（滑动窗口最值）。
:::

## 核心思路

**什么时候用栈？**
- 括号匹配、表达式求值（配对 / 回退）
- 找下一个更大/更小元素（单调栈）
- 函数调用模拟、DFS 非递归实现

**什么时候用队列？**
- BFS 层序遍历
- 滑动窗口最大值（单调队列 / 双端队列）
- 任务调度、消息队列模型

## 栈的基本用法

```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(val);           // 入栈
int top = stack.peek();    // 查看栈顶
int val = stack.pop();     // 出栈
boolean empty = stack.isEmpty();
```

> Java 中推荐用 `ArrayDeque` 而不是 `Stack`，因为 `Stack` 继承自 `Vector`，方法都加了 `synchronized`，性能差。

## 单调栈模板

找每个元素右边第一个比它大的元素（Next Greater Element）：

```java
public int[] nextGreaterElement(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();  // 存下标

    for (int i = 0; i < n; i++) {
        // 当前元素比栈顶大，栈顶元素的答案就是当前元素
        while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) {
            result[stack.pop()] = nums[i];
        }
        stack.push(i);
    }
    return result;
}
```

**要点：** 栈内元素从底到顶单调递减。每个元素最多入栈出栈各一次，总体 O(n)。

## 单调队列模板

滑动窗口最大值（维护一个单调递减的双端队列）：

```java
public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // 存下标

    for (int i = 0; i < n; i++) {
        // 移除超出窗口的元素
        while (!deque.isEmpty() && deque.peekFirst() <= i - k) {
            deque.pollFirst();
        }
        // 维护单调递减：移除所有比当前值小的元素
        while (!deque.isEmpty() && nums[deque.peekLast()] <= nums[i]) {
            deque.pollLast();
        }
        deque.offerLast(i);
        // 窗口形成后记录最大值
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }
    return result;
}
```

## 例题 1：[有效的括号（LeetCode 20）](https://leetcode.cn/problems/valid-parentheses/)

### 题目描述

给定只包含 `()`、`{}`、`[]` 的字符串 `s`，判断字符串是否有效。有效条件：左括号必须用相同类型的右括号闭合，且顺序正确。

### 思路分析

1. 遇到左括号，入栈对应的右括号
2. 遇到右括号，检查栈顶是否匹配
3. 最后栈为空则有效

### 完整代码

```java
public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(') stack.push(')');
        else if (c == '{') stack.push('}');
        else if (c == '[') stack.push(']');
        else {
            if (stack.isEmpty() || stack.pop() != c) {
                return false;
            }
        }
    }
    return stack.isEmpty();
}
```

### 复杂度分析

- **时间**：O(n)
- **空间**：O(n)

## 例题 2：[每日温度（LeetCode 739）](https://leetcode.cn/problems/daily-temperatures/)

### 题目描述

给定数组 `temperatures`，返回一个数组 `answer`，其中 `answer[i]` 是第 `i` 天之后需要等几天才能等到更暖的温度。如果之后没有更暖的日子，`answer[i] = 0`。

### 思路分析

1. 典型的"找右边第一个更大元素"→ 单调栈
2. 栈内存下标，从底到顶对应温度单调递减
3. 遍历到比栈顶温度高的元素时，弹出栈顶并计算天数差

### 完整代码

```java
public int[] dailyTemperatures(int[] temperatures) {
    int n = temperatures.length;
    int[] answer = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
            int j = stack.pop();
            answer[j] = i - j;
        }
        stack.push(i);
    }
    return answer;
}
```

### 复杂度分析

- **时间**：O(n)，每个元素最多入栈出栈各一次
- **空间**：O(n)

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [20](https://leetcode.cn/problems/valid-parentheses/) | 有效的括号 | 简单 | 栈匹配，入栈对应右括号更优雅 |
| [155](https://leetcode.cn/problems/min-stack/) | 最小栈 | 中等 | 辅助栈同步记录最小值 |
| [232](https://leetcode.cn/problems/implement-queue-using-stacks/) | 用栈实现队列 | 简单 | 两个栈倒腾，均摊 O(1) |
| [496](https://leetcode.cn/problems/next-greater-element-i/) | 下一个更大元素 I | 简单 | 单调栈 + HashMap 映射 |
| [84](https://leetcode.cn/problems/largest-rectangle-in-histogram/) | 柱状图中最大的矩形 | 困难 | 单调栈找左右边界，经典难题 |
| [239](https://leetcode.cn/problems/sliding-window-maximum/) | 滑动窗口最大值 | 困难 | 单调队列维护窗口最大值 |
| [394](https://leetcode.cn/problems/decode-string/) | 字符串解码 | 中等 | 栈处理嵌套括号，保存上下文 |
| [150](https://leetcode.cn/problems/evaluate-reverse-polish-notation/) | 逆波兰表达式求值 | 中等 | 栈处理后缀表达式 |

## 面试常问 & 怎么答

### 为什么用 ArrayDeque 而不是 Stack？

Java 的 `Stack` 继承自 `Vector`，所有方法都加了 `synchronized`，单线程场景下有不必要的性能开销。`ArrayDeque` 是非同步的，作为栈和队列都比 `Stack`/`LinkedList` 更快。

### 单调栈的时间复杂度为什么是 O(n)？

虽然有嵌套的 while 循环，但每个元素最多入栈一次、出栈一次，总操作次数不超过 2n，所以均摊 O(n)。

### 单调栈和单调队列的区别？

单调栈只在一端（栈顶）操作，适合找"下一个更大/更小元素"。单调队列两端都可以操作（双端队列），适合维护滑动窗口的最值，需要从队首移除过期元素。

## 看到什么就先想到这类

- "括号匹配 / 嵌套结构"→ 栈
- "下一个更大/更小元素"→ 单调栈
- "柱状图面积 / 接雨水"→ 单调栈
- "滑动窗口最大值/最小值"→ 单调队列
- "表达式求值 / 计算器"→ 栈
- "用栈实现队列 / 用队列实现栈"→ 两个栈/队列互相倒
