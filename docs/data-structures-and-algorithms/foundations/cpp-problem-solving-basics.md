---
title: C++ 刷题基础命令
---

# C++ 刷题基础命令

<span class="dig-tag dig-tag--category">通用方法</span> <span class="dig-tag dig-tag--easy">⭐ 入门</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
C++ 刷题的优势在于 STL 很强，但前提是你真的会用。`vector`、`sort`、`unordered_map`、`deque`、`priority_queue`、`lower_bound` 这几个工具要做到见题就能写出来。
:::

## 概念

- C++ 刷题最重要的是 STL 组合能力，而不是自己手写所有基础结构。
- 绝大多数面试题需要的都是 `vector`、字符串、哈希表、队列、堆、二分库函数。
- 如果是笔试或 ACM 模式，快读设置也要变成默认动作。

## 怎么处理

1. 开题先写好标准模板，至少包含 `bits/stdc++.h`、快读和常用类型别名。
2. 数组类问题优先用 `vector`，哈希类问题优先想 `unordered_map` 或 `unordered_set`。
3. 排序、二分、前缀和、堆这些工具优先用 STL，不要重复造轮子。
4. 每做完一题，把这题实际用到的 STL 记到自己的清单里。

## 高频命令

### 输入输出模板

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    cout << n << '\n';
    return 0;
}
```

### vector 与排序

```cpp
vector<int> nums = {4, 2, 7, 1};
sort(nums.begin(), nums.end());
reverse(nums.begin(), nums.end());
int pos = lower_bound(nums.begin(), nums.end(), 4) - nums.begin();
```

### 字符串处理

```cpp
string s = "abcde";
char ch = s[2];
string sub = s.substr(1, 3);
reverse(s.begin(), s.end());
```

### 哈希表与集合

```cpp
unordered_map<int, int> countMap;
countMap[3]++;
bool exists = countMap.count(3);

unordered_set<int> seen;
seen.insert(5);
bool hasFive = seen.count(5);
```

### 队列、双端队列、栈

```cpp
queue<int> q;
q.push(1);
q.push(2);
int front = q.front();
q.pop();

deque<int> dq;
dq.push_back(3);
dq.push_front(1);
dq.pop_back();

stack<int> st;
st.push(5);
int top = st.top();
st.pop();
```

### 优先队列

```cpp
priority_queue<int> maxHeap;
maxHeap.push(5);
maxHeap.push(1);
int largest = maxHeap.top();

priority_queue<int, vector<int>, greater<int>> minHeap;
minHeap.push(5);
minHeap.push(1);
int smallest = minHeap.top();
```

## 典型实例

| 场景 | 常用命令 | 典型题 |
|------|------|------|
| 排序后二分 | `sort`, `lower_bound` | 搜索插入位置、区间查找 |
| 频次统计 | `unordered_map` | 两数之和、前 K 个高频元素 |
| 滑动窗口 | `deque` | 滑动窗口最大值 |
| Top K | `priority_queue` | 第 K 大元素、合并有序流 |

## 刷题时最容易错的点

1. 忘记 `ios::sync_with_stdio(false); cin.tie(nullptr);`，大输入场景变慢。
2. 把 `map` 和 `unordered_map` 混用，却不清楚复杂度差别。
3. 不会写最小堆模板，结果题目一变就卡住。
4. `lower_bound` 返回的是迭代器，不是下标本身。