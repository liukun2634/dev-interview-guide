---
title: Java环境配置
---

# Java环境配置

<span class="dig-tag dig-tag--category">基础知识</span> <span class="dig-tag dig-tag--easy">⭐ 入门</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
如果你准备用 Java 刷题，先不要急着做复杂题。先把环境、输入输出模板、数组、字符串、哈希表、队列、堆、排序这些基础能力配齐，否则很多题会卡在语法和 API 上，而不是卡在算法上。
:::

## 概念

- Java 刷题最重要的不是记住所有库，而是先配好最低可用环境，再记住最常用的那一批命令。
- 面试和 LeetCode 场景里，最常见的是数组操作、字符串处理、集合类、排序、优先队列。
- 如果是 ACM 输入输出模式，还要把快读快写的模板准备好。

## 怎么处理

1. 先准备一份固定模板，至少包含 `Arrays`、`List`、`Map`、`Deque`、`PriorityQueue`。
2. 刷题时尽量优先用你熟悉的标准库写法，不要一上来自己造轮子。
3. 如果题目是 ACM 模式，优先用 `BufferedReader` 或 `BufferedInputStream`，不要默认上 `Scanner`。
4. 每做完一道题，把这题用到的 Java API 补进自己的命令清单。

## 高频命令

### 简单输入模板（Scanner，学习/小数据用）

**Scanner** 是 JDK 自带的最易用输入工具，**学习算法、刷小数据题、面试白板**首选。语法直白、几乎不会写错；**唯一缺点是慢**（内部基于正则切分），数据量 ≥ 10⁵ 时才需要换 BufferedReader。

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // 1. 读单个值
        int n = sc.nextInt();                 // 读一个 int
        long x = sc.nextLong();               // 读一个 long
        double d = sc.nextDouble();           // 读一个 double
        String word = sc.next();              // 读一个单词（按空白分隔）
        String line = sc.nextLine();          // 读一整行（含空格，到换行符）

        // 2. 读一行数组（空格分隔）
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

        // 3. 读 n 行
        for (int i = 0; i < n; i++) {
            int a = sc.nextInt(), b = sc.nextInt();
            System.out.println(a + b);
        }

        // 4. 读到 EOF（ACM 多组数据）
        while (sc.hasNextInt()) {
            int v = sc.nextInt();
            // ...
        }

        sc.close();
    }
}
```

**Scanner 常见坑**：

- `nextInt()` 之后再 `nextLine()`，会读到空字符串（因为 `nextInt` 不消费换行）。混用时在 `nextInt` 后多调一次 `sc.nextLine()` 吃掉换行。
- 大数据（10⁵ 行以上）必超时，立即换下面的 BufferedReader 模板。

### 快读快写模板（BufferedReader / PrintWriter，大数据/ACM 必备）

数据量 ≥ 10⁵ 时，`Scanner` 会从 "刚刚好" 变 "TLE"。换 `BufferedReader + StringTokenizer + PrintWriter` 通常能快 10 倍以上。

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        PrintWriter writer = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));

        // 读第一行：n m
        StringTokenizer st = new StringTokenizer(reader.readLine());
        int n = Integer.parseInt(st.nextToken());
        int m = Integer.parseInt(st.nextToken());

        // 读 n 行数组
        int[] arr = new int[n];
        st = new StringTokenizer(reader.readLine());
        for (int i = 0; i < n; i++) arr[i] = Integer.parseInt(st.nextToken());

        // 输出（必须 flush 否则可能丢数据）
        writer.println(n + m);
        writer.flush();
    }
}
```

**选型一句话**：

| 场景 | 用哪个 |
|------|------|
| LeetCode / 力扣 / 函数式输入 | **都不用**，方法签名直接给参数 |
| 学习算法 / ACM 小数据（< 10⁵）| **Scanner** |
| ACM 大数据（≥ 10⁵）/ 牛客 / Codeforces | **BufferedReader + PrintWriter** |

### 数组与排序

```java
int[] nums = {4, 2, 7, 1};
Arrays.sort(nums);
int index = Arrays.binarySearch(nums, 7);
int[] copy = Arrays.copyOf(nums, nums.length);
Arrays.fill(copy, -1);
```

### 字符串处理

```java
String s = "abcde";
char ch = s.charAt(2);
String sub = s.substring(1, 4);
char[] arr = s.toCharArray();
String joined = new String(arr);
StringBuilder builder = new StringBuilder();
builder.append("ab").append(12);
String result = builder.toString();
```

### 哈希表与计数

```java
Map<Integer, Integer> countMap = new HashMap<>();
countMap.put(3, countMap.getOrDefault(3, 0) + 1);
boolean contains = countMap.containsKey(3);
int count = countMap.getOrDefault(5, 0);
```

### 栈、队列、双端队列

```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);
stack.push(2);
int top = stack.pop();

Deque<Integer> queue = new ArrayDeque<>();
queue.offer(10);
queue.offer(20);
int front = queue.poll();
```

### 堆与优先队列

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5);
minHeap.offer(1);
int smallest = minHeap.poll();

PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a, b) -> b - a);
maxHeap.offer(5);
maxHeap.offer(1);
int largest = maxHeap.poll();
```

## 典型实例

| 场景 | 常用命令 | 典型题 |
|------|------|------|
| 频次统计 | `HashMap`, `getOrDefault` | 两数之和、字母异位词分组 |
| 单调栈 | `ArrayDeque` | 每日温度、接雨水 |
| Top K | `PriorityQueue` | 数组中的第 K 个最大元素 |
| 原地处理数组 | `Arrays.sort`, `Arrays.fill` | 合并区间、删除重复项 |

## 刷题时最容易错的点

1. 把 `Stack` 当默认栈来用，实际更推荐 `ArrayDeque`。
2. 大输入场景还在用 `Scanner`，结果超时。
3. 写 `PriorityQueue` 比较器时忽略整数溢出风险。
4. 只会用集合，不知道什么时候应该退回原生数组。