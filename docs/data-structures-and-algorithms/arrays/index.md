---
title: 数组与字符串
---

# 数组与字符串

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--easy">⭐ 入门</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
数组和字符串是面试出现频率最高的题型载体。本篇先建立数据结构基础和 Java 常用操作，再给出区间问题的分类决策树，帮你快速判断后续该用哪个专题的方法。
:::

---

## 识别信号

当题目满足以下特征时，优先考虑数组与字符串相关技巧：

- 输入是**一维数组、字符串或矩阵**
- 问题涉及**连续区间**（子数组、子串）的统计或优化
- 需要**原地操作**（删除、去重、分区）且空间 O(1)
- 出现"有序"关键词，暗示可以利用排序性质
- 字符频率统计、异位词判断等字符串匹配类问题

**反例**：如果问题涉及非连续的子序列选取且有最优子结构，优先考虑动态规划；如果涉及层级关系或依赖图，优先考虑树/图。

## 数组基础

### 什么是数组

数组是一块**连续的内存空间**，通过下标直接访问任意元素，时间复杂度 O(1)。

```java
int[] nums = new int[5];           // [0, 0, 0, 0, 0]
int[] nums2 = {1, 2, 3, 4, 5};    // 直接赋值
int[] nums3 = new int[]{1, 2, 3}; // 显式创建
```

### 核心操作与复杂度

| 操作 | 时间复杂度 | 说明 |
|------|------|------|
| 按下标访问 `nums[i]` | O(1) | 连续内存，直接计算偏移 |
| 修改 `nums[i] = x` | O(1) | 同上 |
| 尾部追加 | O(1) 均摊 | ArrayList 动态扩容 |
| 头部/中间插入 | O(n) | 后续元素全部后移 |
| 头部/中间删除 | O(n) | 后续元素全部前移 |
| 查找（无序） | O(n) | 线性扫描 |
| 查找（有序） | O(log n) | 二分查找 |

### 遍历方式

```java
int[] nums = {10, 20, 30, 40, 50};

// 经典 for — 需要下标时用这个
for (int i = 0; i < nums.length; i++) {
    System.out.println("index=" + i + ", value=" + nums[i]);
}

// 增强 for — 只需要值时更简洁
for (int num : nums) {
    System.out.println(num);
}

// 倒序遍历
for (int i = nums.length - 1; i >= 0; i--) {
    System.out.println(nums[i]);
}
```

### 数组 vs ArrayList

```java
// 原生数组：固定长度，性能好，支持基本类型
int[] arr = new int[10];

// ArrayList：动态扩容，API 丰富，只能存对象类型
List<Integer> list = new ArrayList<>();
list.add(1);          // 尾部追加 O(1) 均摊
list.get(0);          // 按下标访问 O(1)
list.add(0, 99);      // 头部插入 O(n)
list.remove(0);       // 头部删除 O(n)
```

**ArrayList 扩容机制**（高频考点）：
- 默认初始容量 10
- 扩容为原来的 1.5 倍：`newCapacity = oldCapacity + (oldCapacity >> 1)`
- 扩容时调用 `Arrays.copyOf`，有内存复制开销
- 如果预估数据量，用 `new ArrayList<>(expectedSize)` 避免多次扩容

### 常用工具方法

```java
import java.util.Arrays;

int[] nums = {3, 1, 4, 1, 5, 9};

Arrays.sort(nums);                    // 原地排序 O(n log n)
Arrays.fill(nums, 0);                 // 填充
int[] copy = Arrays.copyOf(nums, nums.length);  // 复制
boolean eq = Arrays.equals(nums, copy);         // 比较
System.out.println(Arrays.toString(nums));       // 打印
int idx = Arrays.binarySearch(nums, 4);          // 二分查找（须有序）
```

### 二维数组

```java
int[][] grid = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};
int rows = grid.length;      // 3
int cols = grid[0].length;   // 3

for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        System.out.print(grid[i][j] + " ");
    }
}
```

## 字符串基础

### String 不可变性

Java 中 `String` 是**不可变对象**，每次修改都会创建新对象。

```java
String a = "hello";
String b = "hello";
String c = new String("hello");

System.out.println(a == b);      // true — 常量池同一对象
System.out.println(a == c);      // false — c 在堆上
System.out.println(a.equals(c)); // true — 内容相同
```

**为什么设计成不可变？** 线程安全、hashCode 可缓存、安全性、常量池复用。

### 常用操作

```java
String s = "Hello, World";

s.length();                          // 12
s.charAt(0);                         // 'H'
s.substring(0, 5);                   // "Hello" 左闭右开
s.indexOf("World");                  // 7，找不到返回 -1
s.contains("World");                 // true

s.toLowerCase();                     // "hello, world"
s.trim();                            // 去除首尾空格
s.replace("World", "Java");         // "Hello, Java"

String[] parts = "a,b,c".split(","); // ["a", "b", "c"]
String joined = String.join("-", parts); // "a-b-c"

// 字符串 ↔ 字符数组（刷题高频）
char[] chars = s.toCharArray();
String fromChars = new String(chars);

// 字符串 ↔ 数字
int num = Integer.parseInt("123");
String str = String.valueOf(123);
```

### String vs StringBuilder vs StringBuffer

| 类 | 可变性 | 线程安全 | 性能 | 使用场景 |
|------|------|------|------|------|
| String | 不可变 | 安全 | 拼接慢 | 少量操作 |
| StringBuilder | 可变 | 不安全 | 快 | **刷题首选** |
| StringBuffer | 可变 | 安全 | 较慢 | 多线程拼接 |

```java
// 循环拼接用 StringBuilder，避免 O(n²)
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);
}
String result = sb.toString();

// 常用操作
sb.append("hello");
sb.insert(5, ",");
sb.delete(5, 6);
sb.reverse();
sb.charAt(0);
sb.setCharAt(0, 'H');
sb.deleteCharAt(sb.length() - 1);  // 去掉末尾字符
```

### 字符频率统计

很多字符串题的本质是字符数组 + 频率统计：

```java
// 用 int[26] 统计小写字母频率
String s = "aabbbcccc";
int[] freq = new int[26];
for (char c : s.toCharArray()) {
    freq[c - 'a']++;
}

// 判断字母异位词（LeetCode 242）
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] count = new int[26];
    for (int i = 0; i < s.length(); i++) {
        count[s.charAt(i) - 'a']++;
        count[t.charAt(i) - 'a']--;
    }
    for (int c : count) {
        if (c != 0) return false;
    }
    return true;
}
```

## 区间问题分类决策树

遇到数组或字符串问题，先判断属于哪种类型：

```
遇到数组/字符串问题
│
├── 有序数组 + 查找/边界 ──────────→ 二分查找
│
├── 两个位置同时移动 ─────────────→ 双指针
│   ├── 从两端向中间 → 左右指针
│   └── 同向移动 → 快慢指针
│
├── 连续区间满足某条件 ───────────→ 滑动窗口
│   ├── 求最长/最短 → 可变窗口
│   └── 固定大小 → 固定窗口
│
├── 快速求区间和/区间统计 ────────→ 前缀和
│
└── 批量区间增减操作 ─────────────→ 差分数组
```

## 专题导航

| 专题 | 适用场景 | 关键差异 | 典型题 |
|------|------|------|------|
| [双指针](./two-pointers) | 左右靠拢、快慢同步、原地修改 | 利用有序性或分区语义压缩搜索空间 | 两数之和 II |
| [滑动窗口](./sliding-window) | 最长/最短连续区间 | 窗口状态可增量更新，左右指针单向移动 | 最长无重复子串 |
| [前缀和与差分](./prefix-sum-difference) | 区间和统计、批量区间更新 | 前缀和做查询 O(1)，差分做更新 O(1)，互为逆运算 | 和为 K 的子数组 |
| [二分查找](./binary-search) | 有序数组查找、边界定位 | 依赖单调性，每次排除一半搜索空间 | 搜索旋转数组 |
| [Fisher-Yates 洗牌（工程）](./shuffle) | 等概率随机排列 | 5 行代码考“等概率”的严谨证明 | 抽奖 / A/B 分流 / 抽样 || [AC 自动机（工程）](./aho-corasick) | 同时查找 N 个模式串 | Trie + KMP fail 指针，与 N 无关的 O(n+z) | 敏感词过滤 / IDS |
| [RoaringBitmap（工程）](./roaring-bitmap) | 大数据精确去重 / 集合运算 | 分桶 + 三种 container 自适应编码 | ES / ClickHouse / Druid 的底层 |
| [GeoHash 附近搜索（工程）](./geohash) | 地理位置查询 | 二维 → 一维字符串，前缀匹配 + 9 格子扫描 | Redis GEO / 附近的人 / 派单 |
| [令牌桶/漏桶手撕（工程）](./rate-limiter) | 限流算法实现 | 令牌桶允许突发、漏桶强制平滑、滑动窗口精准 | Guava RateLimiter / Nginx limit_req / Sentinel |
## 面试常问 & 怎么答

### 数组和链表的区别？

| 维度 | 数组 | 链表 |
|------|------|------|
| 内存 | 连续分配 | 离散分配 |
| 随机访问 | O(1) | O(n) |
| 插入/删除（中间） | O(n) | O(1)（已有节点引用时） |
| 缓存友好性 | 好（局部性原理） | 差 |

### String 的 `==` 和 `equals` 区别？

`==` 比较引用地址，`equals` 比较内容。字符串比较**永远用 `equals`**。

### 为什么刷题用 StringBuilder？

循环中 `+` 拼接字符串，每次创建新 String，总时间 O(n²)。StringBuilder 在内部 buffer 上追加，总时间 O(n)。

## 看到什么就先想到这类

- "子数组 / 子串 / 连续区间"→ 滑动窗口或前缀和
- "有序数组 + 查找目标"→ 二分查找
- "原地删除 / 原地去重"→ 快慢指针
- "字母频率 / 异位词"→ int[26] 计数数组
- "反转"→ 双指针左右交换
- "大量字符串拼接"→ StringBuilder
