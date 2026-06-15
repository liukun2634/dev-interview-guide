---
title: 哈希表
---

# 哈希表

<span class="dig-tag dig-tag--category">数据结构</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
哈希表通过哈希函数将键映射到数组下标，实现 $O(1)$ 增删查。面试中的核心不是实现哈希表，而是学会用哈希表解题的思维框架——设计 key 存什么、value 存什么。
:::

## 识别信号

看到以下特征时，优先考虑哈希表：

| 信号 | 典型使用场景 |
|------|------------|
| 需要 $O(1)$ 查找 | 两数之和、判断元素是否存在 |
| 需要记录"是否见过" | 去重、检测环、滑动窗口 |
| 需要计数 / 分组 | 词频统计、字母异位词分组 |
| 需要建立映射关系 | 同构字符串、字符替换 |
| 需要缓存中间结果 | 动态规划记忆化、LRU 缓存 |

---

## 通用思考框架

### Key / Value 设计方法论

这是解哈希表题的**核心框架**。拿到任何题目，先问三个问题：

1. **"我需要快速查找什么？"** → 那就是 KEY
2. **"查到之后需要什么信息？"** → 那就是 VALUE
3. **"什么时候存入？什么时候查询？"** → 那就是遍历顺序

三道经典题的 Key/Value 设计对比：

| 题目 | Key | Value | 原因 |
|------|-----|-------|------|
| 两数之和 | 数值 | 下标 | 需要找补数，找到后要知道它的位置 |
| 字母异位词分组 | 排序后的字符串 | 原字符串列表 | 需要把"字母相同"的单词归到一组 |
| 频率统计 | 元素本身 | 出现次数 | 需要知道每个元素出现了多少次 |

### 常见 Key 设计技巧

- **直接用值作 key**：两数之和，key = 数值，能直接判断补数是否存在
- **规范化形式作 key**：异位词分组，key = 排序后字符串 / 字符频率编码，把"等价"的元素映射到同一 key
- **字符频率数组编码**：避免排序的 $O(k \log k)$，改用长度 26 的数组转字符串，降到 $O(k)$
- **滑动窗口 + 哈希**：子串问题中，用 HashMap 维护窗口内字符频率，双指针收缩窗口

### HashMap vs HashSet

- 只需判断"是否存在" → 用 **HashSet**
- 还需要存额外信息（下标、计数等）→ 用 **HashMap**

---

## 底层原理（简要）

### 哈希函数

哈希函数将任意键映射到数组下标。Java 中每个对象都有 `hashCode()` 方法，`HashMap` 会在此基础上再做扰动处理（高低位异或），使分布更均匀。好的哈希函数需满足：**计算快、分布均匀、冲突少**。

### 冲突解决

**链地址法（Separate Chaining）**：每个数组槽存一个链表，冲突的键追加到链表中。实现简单，负载因子可以超过 1，删除方便。Java `HashMap` 采用此方案。

**开放地址法（Open Addressing）**：冲突时在数组中探测下一个空槽（线性探测 / 二次探测 / 双重哈希）。内存紧凑，但负载因子不能太高，且删除需要"墓碑"标记，不能直接置空（否则会断开探测链）。

### Java HashMap 内部实现

| 特性 | 说明 |
|------|------|
| 底层结构 | `Node[]` 数组 + 链表 + 红黑树 |
| 链表 → 红黑树 | 链表长度 ≥ 8 **且** 数组长度 ≥ 64 时转树，查找从 $O(n)$ 降至 $O(\log n)$ |
| 红黑树 → 链表 | 节点数 ≤ 6 时退化回链表 |
| 扩容触发 | 元素数量 / 数组长度 > 负载因子 0.75 时，数组扩容为 2 倍并重新哈希 |
| 取模优化 | 数组长度始终为 2 的幂次，用位运算 `index = hash & (n-1)` 代替取模 |

#### 为什么 hash 表容量必须是 2 的幂？（**资深面试 Top 8**）

::: tip 💡 这个 "为什么" 同时考察 **位运算理解 + hash 分布理解 + JVM 性能优化**
:::

##### 原因 1：**`hash & (n-1)` 等价 `hash % n`，但快 10×**

只有当 `n` 是 **2 的幂**时：

```
n = 16 (10000)，n-1 = 15 (01111)

hash = 12345 (00000000_00000000_00110000_00111001)
hash & 15 = ...0000_1001 = 9
hash % 16 = 9   ✅ 完全等价

为什么？n=2^k 时，hash % 2^k 等价于"取低 k 位"，而 hash & (2^k - 1) 也是"取低 k 位"
```

**CPU 性能差异**：
- 位运算 `&`：单周期完成
- 模运算 `%`：硬件除法器，**消耗 10-20 个周期**
- **10× 性能差异**——HashMap 这种每秒百万次的热点路径，差异极大

##### 原因 2：**扩容时省去 rehash —— 数据要么留原位、要么移到 `原位 + 老容量`**

```
扩容前 n=16，hash=12345
  index = 12345 & 15 = 9     (二进制末 4 位)

扩容后 n=32，无需重算 hash：
  index = 12345 & 31         (二进制末 5 位，即多看一位)
  
  关键观察：判断"多看的那一位"是 0 还是 1
   - 若 0 → 留原位 9
   - 若 1 → 移到 9 + 16 = 25
```

**JDK 8 HashMap 扩容性能优化的核心**——不需要重算 hash，**只查 hash 的高位 bit 决定去哪**：

```java
// JDK 8 HashMap resize() 源码片段
do {
    next = e.next;
    if ((e.hash & oldCap) == 0) {       // ★ 只判断"多出的一位"
        // 留原位
    } else {
        // 移到 newIndex = oldIndex + oldCap
    }
} while ((e = next) != null);
```

##### 原因 3：**保证 hash 分布均匀**

如果 `n` **不是 2 的幂**（如 `n=15`）：
```
n-1 = 14 (01110)
hash & 14 = ...0xxx0    ← 末位永远是 0
→ 偶数 hash 全部挤在偶数 index，奇数 hash 在偶数 index 撞车
→ 一半的槽位永远用不上 → 严重碰撞
```

**只有 `n=2^k` 时，`hash & (n-1)` 才覆盖所有 n 个槽**。

##### 原因 4：**强制初始化容量也要"圆整"到 2 的幂**

```java
HashMap<String, Object> map = new HashMap<>(13);
// 实际容量：16（自动圆整到下一个 2 的幂）

// 源码（tableSizeFor）：
static final int tableSizeFor(int cap) {
    int n = cap - 1;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
}
```

**给 13 得 16**——这个位运算技巧非常经典。

##### 标准答题模板

> **"HashMap 容量必须是 2 的幂，4 个原因：① **位运算 `hash & (n-1)` 等价 `hash % n` 但快 10×**——单周期 vs 10-20 周期；② **扩容性能**——JDK 8 用 `(hash & oldCap)` 判断高位 bit 决定留原位还是 +oldCap，省去 rehash；③ **hash 分布均匀**——n 不是 2^k 时 `hash & (n-1)` 末位永远是 0，一半槽位浪费；④ **强制初始化**——给 13 自动圆整到 16，源码用经典位运算 tableSizeFor 实现。**
>
> **这 4 点是 JDK HashMap 性能秘籍的核心。"**

---

### 哈希冲突解决方案全景

四种主流冲突解决方案，**面试要能讲出每种的取舍与代表实现**：

| 方案 | 原理 | 代表实现 | 优势 | 局限 |
|------|------|---------|------|------|
| **链地址法** | 每个槽挂一个链表 | Java `HashMap` / `ConcurrentHashMap` | 实现简单、负载因子可超 1、删除方便 | 链表过长退化为 O(n)（Java 8 改为转红黑树）|
| **线性探测** | 冲突时往后挨个找空槽 | Python `dict` / Rust `HashMap` 早期 | **缓存局部性最好**（相邻槽，命中 L1）| 易产生"主聚集"，性能急剧退化 |
| **二次探测** | 探测步长按 1²、2²、3² 增长 | C++ `std::unordered_map` 部分实现 | 缓解主聚集 | 仍有"次聚集" |
| **Robin Hood 哈希** | "劫富济贫"：插入时比较探测距离，远者覆盖近者 | Rust `HashMap` 现代实现 / Swift | **方差极小**，最坏情况优秀 | 实现复杂 |

::: tip 💡 Robin Hood 哈希精髓

> 插入元素 X 时如果遇到已占用槽位的元素 Y，**比较两者的探测距离（distance from preferred slot）**：
> - 如果 X 的探测距离 > Y 的，就**把 Y 踢出去**，让 X 占住这个槽，Y 继续往后找
> - 这样保证所有元素的探测距离尽量平均，避免"有的元素探测 1 次，有的探测 100 次"的极端
> 
> **结果**：负载因子 0.9 时查找性能仍接近 O(1)，比传统线性探测好得多。Rust 标准库选它而不是链地址法，就是因为**缓存友好 + 探测距离均匀**两者兼得。

:::

#### 开放地址法的"删除墓碑"陷阱

```
插入 [A, B, C]：探测序列 A → A 冲突 → 探测 B → B 冲突 → 放到 C
删除 B：如果直接置空 → 查找 C 时探测到 B 空槽 → 误以为 C 不存在
正确做法：B 位置打上"墓碑（tombstone）"标记
        → 查找时跳过墓碑继续探测
        → 插入时可以覆盖墓碑
```

**生产坑**：墓碑过多会让查找退化。需要在墓碑数量超过阈值时**重建哈希表**。

### Bloom Filter：判 "不存在" 神器

**布隆过滤器（Bloom Filter）** 是用极小内存判断"元素是否可能存在"的概率数据结构。**2025-2026 年大厂面试必问**——只要题目涉及"防止缓存穿透"、"过滤无效查询"、"大数据去重"，答案里都该有它。

#### 核心思想

```
N 个 hash 函数 + M 位 bit 数组

插入 x:
  h1(x) = 3  → bit[3] = 1
  h2(x) = 7  → bit[7] = 1
  h3(x) = 12 → bit[12] = 1

查询 y:
  h1(y) = 3  → bit[3] = 1 ✓
  h2(y) = 7  → bit[7] = 1 ✓
  h3(y) = 12 → bit[12] = 0 ✗
  → 一定不存在

查询 z:
  全部 bit 都是 1 → 可能存在（也可能是误判）
```

#### 关键特性

| 操作 | 复杂度 | 误判方向 |
|------|-------|---------|
| 插入 | O(k)，k = hash 函数个数 | — |
| 查询 | O(k) | **可能误判"存在"，绝不漏报"不存在"** |
| 删除 | **不支持**（标准 BF） | 用 Counting Bloom Filter 替代 |

::: warning ⚠️ 一定要记住的方向性

> **Bloom Filter 说"不存在"，那就一定不存在；说"存在"，可能是真存在，也可能误判。**
> 
> 所以 BF 是"**过滤器**"——挡掉 99% 不存在的查询，剩下 1% 走真实数据源验证。

:::

#### 容量与误判率关系

```
m = 位数, n = 元素数, k = hash 函数数
最优 hash 函数数: k = (m/n) × ln(2)
误判率: p ≈ (1 - e^(-kn/m))^k

例: 1 亿元素, 期望误判率 1%
   m ≈ 9.58 亿位 ≈ 120 MB
   k ≈ 7 个 hash 函数
```

**一句话记忆**：**1 亿元素 + 1% 误判率 ≈ 120 MB**。如果业务能接受 5% 误判率，内存可降到约 60 MB。

#### 典型应用

| 场景 | 用法 |
|------|------|
| **缓存穿透防护**（最常考）| 启动时把 DB 所有合法 ID 灌入 BF；查询前先过 BF，不存在直接拒绝 |
| **URL 去重**（爬虫）| 已抓取的 URL 入 BF，遇到新 URL 先查 BF |
| **HBase / RocksDB / LevelDB** | 每个 SSTable 配 BF，**避免读不存在的 key 时的磁盘 IO** |
| **比特币 SPV 节点** | 客户端通过 BF 请求只与自己相关的交易，隐藏隐私 |

#### Java 实现

```java
// Guava 自带，最常用
import com.google.common.hash.BloomFilter;
import com.google.common.hash.Funnels;

BloomFilter<Long> bf = BloomFilter.create(
    Funnels.longFunnel(),
    100_000_000L,        // 预期元素数
    0.01                 // 误判率
);

bf.put(123L);
bf.mightContain(123L);   // true
bf.mightContain(999L);   // false（一定不存在）

// 生产推荐：Redisson / Redis BITSET 跨进程共享
RBloomFilter<String> bloomFilter = redisson.getBloomFilter("ids");
bloomFilter.tryInit(100_000_000L, 0.01);
```

### Count-Min Sketch：估算频次的神器

**Count-Min Sketch**（CMS）是另一个"概率数据结构"，用很小内存**估算元素出现次数**（保证不会少估）：

```
d 个 hash 函数 + w 列计数器矩阵 (d×w)

插入 x:
  for i in [0, d):
    cms[i][hi(x) % w] += 1

查询 x 的频次:
  return min(cms[i][hi(x) % w] for i in [0, d))
  → 取所有 hash 函数对应位置的最小值
```

**为什么取 min**：哈希冲突只会让计数**变多不会变少**，所以最小值最接近真实值。

#### 经典应用

- **Top-K 热点**：Caffeine 的 W-TinyLFU 内部就用 CMS 跟踪访问频次（详见 [Java 并发 — Caffeine](../programming-languages/java-concurrency#caffeine)）
- **DDoS 检测**：估算源 IP 访问频次，超阈值告警
- **Redis hotkey 检测**：阿里、字节内部用它在代理层识别热点

### 跳表 vs B+ Tree vs 红黑树：有序结构的世纪选型

哈希表是"无序" O(1) 结构。当**需要有序访问**（范围查询、TopK、按 key 排序遍历）时，选型在跳表 / B+ Tree / 红黑树之间。这是**Redis ZSet 为什么选跳表、MySQL 为什么选 B+Tree** 的核心问题。

| 维度 | **跳表（Skip List）** | **B+ Tree** | 红黑树 |
|------|--------------------|-----------|--------|
| **查询/插入/删除** | O(log n) 期望 | O(log n) 保证 | O(log n) 保证 |
| **范围查询** | ✅ 链表顺序遍历 | **✅✅ 叶子双向链表，最快** | ❌ 中序遍历，cache 不友好 |
| **节点扇出** | 多层链表，每层节点少 | **几十到几百**（每页一个节点）| 2 |
| **磁盘友好** | ❌（指针多，跳跃式访问）| **✅✅ 高扇出 = 树矮 = 磁盘 IO 少** | ❌ |
| **内存友好** | ✅ 实现简单、并发好做 | ✅ | ✅ |
| **并发改造难度** | **低**（每层加锁即可）| 高（页分裂复杂）| 高 |
| **代表用途** | **Redis ZSet / LevelDB MemTable** | **MySQL / PostgreSQL 索引** | **Java TreeMap / HashMap 链转树** |

#### Redis 为什么用跳表而不是 B+ Tree？

::: tip 💡 真实理由（取自作者 antirez）

1. **内存数据库**，不需要 B+ Tree 的"减少磁盘 IO" 优势
2. **实现简单 50%**，代码量小，bug 少
3. **范围查询性能足够**（直接走最底层链表）
4. **并发改造容易**——Redis 单线程不需要，但备份/复制相关代码也更简单

:::

#### MySQL 为什么用 B+ Tree 而不是跳表？

1. **磁盘 IO 是瓶颈**：B+ Tree 节点扇出几十到几百，**3-4 层就能存千万行**，IO 极少
2. **范围查询性能最好**：叶子节点串成双向链表，范围扫描就是顺序读
3. **只在叶子存数据**：非叶子节点只存索引键，缓存命中率高

#### 红黑树为什么没成为数据库索引？

- **二叉树扇出只有 2**：千万行数据要 24+ 层，磁盘 IO 爆炸
- **节点物理分散**：每个节点一个内存分配，缓存不友好
- **它的强项是内存里的有序结构** → Java `TreeMap`、Linux 内核进程调度

### 横向总结：有序 vs 无序数据结构选型

| 需求 | 选什么 |
|------|------|
| O(1) 等值查询 + 不需要顺序 | **HashMap / HashSet** |
| 有序遍历 + 内存场景 | **TreeMap / 跳表** |
| 有序索引 + 磁盘场景 | **B+ Tree（直接用 DB）** |
| 判"不存在"快速过滤 | **Bloom Filter** |
| 统计 TopK / 热点 | **Count-Min Sketch + 最小堆** |
| 范围统计（单点改 + 前缀和）| **树状数组** |

---

## 典型例题：两数之和

[LeetCode 1](https://leetcode.cn/problems/two-sum/) · 简单

**题目**：给定整数数组 `nums` 和目标值 `target`，返回两个数之和等于 `target` 的下标。

**用框架思考**：

1. **"我需要查找什么？"** → 对于当前数 `nums[i]`，需要查找补数 `target - nums[i]` 是否存在
2. **"查到后需要什么？"** → 需要补数的下标，才能返回答案
3. **所以**：key = 数值，value = 下标；**先查后存**（避免用同一个元素两次）

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // key: 数值, value: 下标
        Map<Integer, Integer> seen = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];

            // 先查：补数是否已经见过
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }

            // 后存：把当前数存入，供后续元素查询
            seen.put(nums[i], i);
        }

        return new int[]{};
    }
}
// 时间复杂度：O(n)，空间复杂度：O(n)
// 对比暴力 O(n²)：用空间换时间
```

---

## 典型例题：LRU 缓存（必背手撕题）

[LeetCode 146](https://leetcode.cn/problems/lru-cache/) · 中等 · 🔥🔥🔥 **大厂面试出现率 Top 5**

**题目**：实现 `LRUCache` 类，支持 `get(key)` 和 `put(key, value)`，要求**两个操作都 O(1)**。容量满时淘汰最久未使用的 key。

### 为什么要 HashMap + 双向链表

这道题是"两种数据结构互补"的经典案例，关键是想清楚**单独用任一种数据结构都做不到 O(1)**：

| 方案 | get | put | 淘汰最久未用 | 问题 |
|------|------|------|------|------|
| 只用 HashMap | O(1) | O(1) | ❌ 无法知道顺序 | 没有访问顺序信息 |
| 只用数组 / ArrayList | O(n) | O(1) 末尾 | O(n) 移到末尾 | 找 key 要遍历 |
| 只用双向链表 | O(n) | O(1) 头插 | O(1) 删尾 | 找 key 要遍历 |
| **HashMap + 双向链表** | **O(1)** | **O(1)** | **O(1)** | ✅ map 定位节点，链表维护顺序 |

**核心设计：**
- **HashMap**：`key → 链表节点`，让我们能 O(1) 拿到节点引用
- **双向链表**：维护"最近访问"的顺序，头部 = 最新，尾部 = 最久未用
- **双向**而非单向：要 O(1) 删除任意节点，必须能直接拿到前驱
- **伪头伪尾哨兵节点**：避免每次 add/remove 都判空，所有操作都变成"在中间"

### 完整代码（必须能默写）

```java
class LRUCache {
    // 双向链表节点
    private static class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) { key = k; value = v; }
    }

    private final int capacity;
    private final Map<Integer, Node> map;
    private final Node head, tail;  // ★ 伪头伪尾，简化边界

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new HashMap<>();
        this.head = new Node(0, 0);
        this.tail = new Node(0, 0);
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        Node node = map.get(key);
        if (node == null) return -1;
        moveToHead(node);                       // ★ 命中即视为"最近使用"
        return node.value;
    }

    public void put(int key, int value) {
        Node node = map.get(key);
        if (node != null) {
            node.value = value;                 // 已存在：更新值 + 移到头
            moveToHead(node);
            return;
        }
        // 不存在：新建插入头部
        Node newNode = new Node(key, value);
        map.put(key, newNode);
        addToHead(newNode);
        if (map.size() > capacity) {
            Node lru = tail.prev;               // ★ 淘汰尾部（最久未用）
            removeNode(lru);
            map.remove(lru.key);                // ★ 别忘了同步删 map
        }
    }

    // ===== 双向链表 3 个原子操作 =====
    private void addToHead(Node node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void moveToHead(Node node) {
        removeNode(node);
        addToHead(node);
    }
}
```

### 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 节点只存 value 不存 key | 淘汰尾节点时无法从 map 删除 | **节点必须存 key**，删除时 `map.remove(node.key)` |
| 用单向链表 | 删除任意节点要 O(n) 找前驱 | 必须双向 |
| 不用伪头伪尾 | 头/尾节点的 add/remove 都要判 null，代码翻倍 | 用 dummy head/tail |
| `get` 命中时忘记 moveToHead | 顺序错乱，淘汰错对象 | 命中也算"最近使用" |
| 更新已有 key 时忘记 moveToHead | 同上 | put 已存在 key 时也要移到头 |

### 追问：直接用 `LinkedHashMap` 行不行

可以，**面试时面试官会先问"会不会自己实现"，答完手撕版本后再提 `LinkedHashMap` 加分**：

```java
class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int capacity;
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);           // ★ accessOrder=true，按访问顺序排
        this.capacity = capacity;
    }
    public int get(int key) { return super.getOrDefault(key, -1); }
    public void put(int key, int value) { super.put(key, value); }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;               // ★ 重写淘汰条件
    }
}
```

`LinkedHashMap` 底层就是"哈希表 + 双向链表"，`accessOrder=true` 让它每次访问后把节点移到链表尾。**面试中通常先写手撕版再提这个**，纯写 LinkedHashMap 会被判定"不会原理"。

### 追问：并发安全的 LRU 怎么做

- **简单方案**：`Collections.synchronizedMap(...)` 或所有方法加 `synchronized`，但吞吐量差
- **生产方案**：[Caffeine](https://github.com/ben-manes/caffeine) — 采用 **W-TinyLFU** 算法（不是纯 LRU），用 ring buffer 缓冲访问记录、异步维护顺序，吞吐量比 `ConcurrentHashMap + 锁`高一个数量级
- **Redis**：用近似 LRU（采样 N 个 key 选最旧的），不保存完整顺序信息，省内存

---

## 延伸题目

| 题目 | 链接 | 与典型题的区别 | 关键技巧 |
|------|------|--------------|---------|
| 字母异位词分组 | [LC 49](https://leetcode.cn/problems/group-anagrams/) | key 设计不同：排序后字符串作 key | 也可用字符频率数组编码，避免排序，降到 $O(k)$ |
| 存在重复元素 II | [LC 219](https://leetcode.cn/problems/contains-duplicate-ii/) | 滑动窗口 + HashSet | 维护大小为 k 的窗口，超出则移除最旧元素 |
| 最长连续序列 | [LC 128](https://leetcode.cn/problems/longest-consecutive-sequence/) | HashSet + 只从序列起点扩展 | 先存所有数，只对没有 `num-1` 的数开始扩展，避免重复 |
| LRU 缓存 | [LC 146](https://leetcode.cn/problems/lru-cache/) | HashMap + 双向链表 | $O(1)$ get/put 需要两种数据结构配合：map 负责查找，链表维护顺序 |
| 前 K 个高频元素 | [LC 347](https://leetcode.cn/problems/top-k-frequent-elements/) | HashMap 计数 + 堆 / 桶排序 | 先统计频率，再取 top-K；桶排序可做到 $O(n)$ |

---

## 常见陷阱与调试

| 错误 | 症状 | 解决方法 |
|------|------|---------|
| 用可变对象作 key | 存入后修改对象，再也找不到对应的值 | 优先用不可变类型（`String`、`Integer`）作 key；自定义对象需正确重写 `hashCode()` 和 `equals()` |
| 先存后查（两数之和） | 当 `target = 2 * nums[i]` 时，同一元素被用了两次 | 改为**先查后存**，确保查询的是之前已存入的元素 |
| 开放地址法中直接删除 | 后续查找时探测链断开，找不到本应存在的元素 | 删除时标记为"墓碑"（tombstone），而非直接置 `null` |
| 忘记处理 null key | `NullPointerException` | `HashMap` 允许一个 null key；`HashTable`（旧版）不允许，二者不要混用 |
| 整数溢出导致哈希错误 | 相同逻辑在大数据时结果不同 | 手写哈希时用 `long` 或及时取模；依赖 `Integer.hashCode()` 时无需担心 |
