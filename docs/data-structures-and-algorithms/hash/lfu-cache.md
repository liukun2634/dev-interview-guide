---
title: LFU 缓存
---

# LFU 缓存（LeetCode 460）— 比 LRU 高一档的工程缓存

<span class="dig-tag dig-tag--category">哈希</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
**LFU = Least Frequently Used，按访问频率淘汰**。本页采用“key 到节点、频次到链表”两个映射，同频时按 LRU 淘汰，实现期望 O(1) 的 get / put。性能与空间保证依赖三个不变量：每个节点只属于一个频次桶、minFreq 指向最小非空桶、空桶及时删除。
:::

## 为什么单独讲它

[LRU](../hash-table#典型例题-lru-缓存-必背手撕题) 解决"最近用过的就是热数据"，但**最近用过 ≠ 真的常用**——一个偶然进来的冷 key 会挤掉一个被高频访问的热 key。LFU 用"访问次数"做依据：

| 维度 | LRU | LFU |
|------|------|------|
| 淘汰依据 | 最久未访问 | **访问次数最少** |
| 数据结构 | 1 个 HashMap + 1 条双向链表 | **2 个 HashMap + N 条双向链表** |
| 复杂度 | O(1) get / put | O(1) get / put |
| 命中率 | 适合近期访问能预测未来的负载 | 适合频次能预测未来的负载，不能保证固定提升比例 |
| 代码量 | 60 行 | **130 行** |
| 适用场景 | 通用、缓存层、Redis | **Redis 4.0+ `allkeys-lfu`、热点感知 CDN** |

**面试常问“为什么 LRU 不够”**：大量只访问一次的新 key 可能逐步挤出旧热点，LFU 可在这类扫描负载中保护累计频次较高的数据。但某 key 短时间被访问 1 万次后再也不用，纯累计 LFU 也可能长期保留它。因此是否加衰减、是否在准入阶段过滤，比笼统宣称“LFU 抗所有异常流量”更重要。

## 数据结构设计

LFU 比 LRU 多一个维度（频率），所以多一层映射。**关键洞察**：

1. **freq 相同的 key 之间也要排序**（先访问的先淘汰，类似 LRU 的次序）→ 每个 freq 维护一条独立的双向链表
2. **要快速找到"最小 freq"**，否则淘汰要 O(n) 扫描 → 用 `minFreq` 变量实时维护
3. **由 key 找 node**、**由 freq 找链表头**，都需要 O(1) → 两个 HashMap

```
keyToNode:  key → Node{ key, value, freq }     // 通过 key 拿到节点
freqToList: freq → DoublyLinkedList<Node>      // 通过 freq 拿到这个频率的链表
minFreq:    int                                // 当前最小频率（淘汰用）
```

**示意图：**

```
keyToNode:                          freqToList:
  A → (A, val, 3)                     1: [E ←→ F]              ← 最旧的在尾
  B → (B, val, 2)                     2: [B ←→ D ←→ C]
  C → (C, val, 2)                     3: [A]
  D → (D, val, 2)                     ↑
  E → (E, val, 1)                     minFreq = 1
  F → (F, val, 1)

淘汰：从 freqToList[minFreq] 尾部弹出 → 弹出 F
访问 B：把 B 从 freqToList[2] 移除，加到 freqToList[3] 头部，B.freq=3
```

## 完整代码（必背手撕）

```java
class LFUCache {
    private static class Node {
        int key, value, freq;
        Node prev, next;
        Node(int k, int v) { key = k; value = v; freq = 1; }
    }

    private static class DLinkedList {
        Node head, tail;
        int size;
        DLinkedList() {
            head = new Node(0, 0);
            tail = new Node(0, 0);
            head.next = tail;
            tail.prev = head;
        }
        void addFirst(Node node) {                       // ★ 头插：保证同 freq 内"最新在前"
            node.prev = head;
            node.next = head.next;
            head.next.prev = node;
            head.next = node;
            size++;
        }
        void remove(Node node) {
            node.prev.next = node.next;
            node.next.prev = node.prev;
            size--;
        }
        Node removeLast() {                              // ★ 淘汰尾部（同 freq 中最旧）
            if (size == 0) return null;
            Node last = tail.prev;
            remove(last);
            return last;
        }
        boolean isEmpty() { return size == 0; }
    }

    private final int capacity;
    private int minFreq;                                 // ★ 当前最小频率
    private final Map<Integer, Node> keyToNode;
    private final Map<Integer, DLinkedList> freqToList;

    public LFUCache(int capacity) {
        if (capacity < 0) throw new IllegalArgumentException("capacity must be nonnegative");
        this.capacity = capacity;
        this.minFreq = 0;
        this.keyToNode = new HashMap<>();
        this.freqToList = new HashMap<>();
    }

    public int get(int key) {
        Node node = keyToNode.get(key);
        if (node == null) return -1;
        increaseFreq(node);                              // ★ 命中即频率 +1
        return node.value;
    }

    public void put(int key, int value) {
        if (capacity == 0) return;

        Node node = keyToNode.get(key);
        if (node != null) {                              // 已存在：更新值 + 频率 +1
            node.value = value;
            increaseFreq(node);
            return;
        }

        // 不存在：先检查淘汰
        if (keyToNode.size() == capacity) {
            DLinkedList minList = freqToList.get(minFreq);
            Node evicted = minList.removeLast();         // ★ 淘汰 minFreq 链表尾部
            keyToNode.remove(evicted.key);
            if (minList.isEmpty()) freqToList.remove(minFreq);
        }

        // 插入新节点：freq=1
        Node newNode = new Node(key, value);
        keyToNode.put(key, newNode);
        freqToList.computeIfAbsent(1, k -> new DLinkedList()).addFirst(newNode);
        minFreq = 1;                                     // ★ 新节点 freq=1，重置 minFreq
    }

    private void increaseFreq(Node node) {
        int oldFreq = node.freq;
        DLinkedList oldList = freqToList.get(oldFreq);
        oldList.remove(node);

        if (oldList.isEmpty()) {
            freqToList.remove(oldFreq);
            if (oldFreq == minFreq) minFreq++;
        }

        node.freq++;
        freqToList.computeIfAbsent(node.freq, k -> new DLinkedList()).addFirst(node);
    }
}
```

## 用不变量解释三个关键动作

**为什么 minFreq 只加一，不需要搜索下一个桶？** 正在访问的节点一定从 `oldFreq` 移到 `oldFreq+1`。如果它清空了最小桶，其他节点的频次都至少为 `oldFreq+1`，而被移动节点马上证明这个新频次确实存在。此论证依赖“只增加一次频次”，不能直接推广到任意减频、删除最小桶或批量衰减。

**为什么新插入后直接设 minFreq=1？** 新 key 的频次规定为 1，其他节点都至少为 1。容量满时淘汰与新插入属于同一次 put；中间不需要单独扫描新最小频次。

**为什么必须删除空桶？** 非空桶数量不超过驻留 key 数，但历史频次的数量没有这个限制。容量为 1 时，重复 get 同一个 key 1000 次，如果不删除空桶，就有 1001 条链表和 2002 个哨兵节点。修复后只保留当前频次的一个桶，频次的数值很大不代表需要存储中间所有桶。

容量为 2 的操作序列：

| 操作 | 频次桶（同频从新到旧） | minFreq | 说明 |
|------|----------------------|---------|------|
| `put(1,10); put(2,20)` | `1:[2,1]` | 1 | 新 key 放桶头 |
| `get(1)` | `1:[2], 2:[1]` | 1 | 最小桶仍非空 |
| `put(3,30)` | `1:[3], 2:[1]` | 1 | 淘汰频次最低的 2 |
| `get(3)` | `2:[3,1]` | 2 | 删除空桶 1，最小频次加一 |
| `put(4,40)` | `1:[4], 2:[3]` | 1 | 同频时淘汰更旧的 1 |

实现按 LC460 的有限操作次数使用 int 频次，不是线程安全缓存。长期运行时还需解决计数溢出或采用明确的衰减策略；不能让 int 回绕后悄悄改变淘汰顺序。

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 不维护 `minFreq` 变量 | 淘汰时要 O(n) 扫所有 freq 找最小 | 实时维护 minFreq |
| 保留历史空桶 | 容量不变但内存随访问次数增长 | 升频和淘汰后，空链表立刻从映射删除 |
| 老链表空了不更新 `minFreq` | 下次淘汰扫空链表，逻辑死循环 | `if (oldList.isEmpty() && oldFreq == minFreq) minFreq++` |
| 插入新节点忘记重置 minFreq | 新 key 频率=1 但 minFreq 是 5，淘汰错对象 | 插入新节点固定 `minFreq = 1` |
| 同频率不维护内部顺序 | 同 freq 的 key 淘汰顺序乱 | 每个 freq 一条双向链表，头插尾淘 |
| `capacity == 0` 不特判 | 直接进入 put 逻辑会 NPE | 第一行 `if (capacity == 0) return` |

## 复杂度

- **`get`**：O(1) — HashMap 查找 + 链表节点移动
- **`put`**：O(1) — 同上
- **空间**：O(capacity) — 实际节点不超过容量，非空桶不超过实际节点数，每桶只有两个哨兵；不保留历史空桶。HashMap 操作按期望/摊销 O(1) 分析。

## 业界应用

| 系统 | 用 LFU 的方式 |
|------|------|
| **Redis 4.0+** | `maxmemory-policy allkeys-lfu` / `volatile-lfu` —— 用**对数概率计数**模拟 LFU，省内存 |
| **Caffeine** | **W-TinyLFU** 使用频率估计做准入，结合窗口 LRU 与分段 LRU；不等同于本页精确 LFU |
| **CDN 边缘缓存** | Cloudflare / Fastly 内部使用变种 LFU 跟踪热点资源 |
| **数据库 Buffer Pool** | 不应由缓存用途反推算法；PostgreSQL 使用 CLOCK-sweep 类机制，不是此处的精确 LFU 或 ARC |

## Redis 的"近似 LFU"：为什么不用标准 LFU

以 [Redis 7.2 的 evict.c](https://github.com/redis/redis/blob/7.2/src/evict.c) 中 `LFULogIncr`、`LFUDecrAndReturn` 的实际代码为准，而不是只看历史注释：

- 复用对象的 24 位 LRU 字段：16 位记录分钟时间，8 位记录频次估计；不是给每个 key 固定新增 8 字节。
- 访问时以随当前计数递减的概率增加计数，最大为 255；它是热度估计，不是实际命中次数。
- 按 `lfu-decay-time` 计算经过了多少个衰减周期，计数减去周期数，最低为 0。访问更新或淘汰候选评估时惰性计算，不是后台遍历全部 key 除以二。
- 淘汰通过采样候选近似选择低频 key，不维护本页的全量精确频次桶。

例如计数为 10，衰减周期为 1 分钟，经过 3 个完整周期后估计为 7，而不是 `10/2/2/2`。如果衰减周期配置为 0，该实现不进行这项时间衰减。LFU 与 LRU 是可配置策略，并非 Redis 4.0 后统一以 LFU 替代 LRU。

## 面试常问 & 怎么答

### LFU vs LRU 怎么选

- **业务流量稳定、突发少** → LRU 够用，代码简单（Memcached 默认）
- **有爬虫 / 异常流量 / 长尾热点** → LFU 抗污染（Redis `allkeys-lfu`）
- **极致性能 + 内存紧张** → Caffeine W-TinyLFU（生产首选）

### 为什么需要两个 HashMap

- **keyToNode**：让 `get(key)` 是 O(1)（不用扫链表）
- **freqToList**：让"淘汰最小频率"是 O(1)（不用扫所有 key 比较 freq）

这是本页实现满足常数时间操作的一种结构，不是映射数量的下界证明；也可以用有序链接的频次桶和节点到桶的引用组织数据。关键是能直接定位节点、同频顺序以及最小非空桶。

### 标准 LFU 有什么问题，工业上怎么改

- **冷启动突刺**：新 key 频率=1，立刻被淘汰；老 key 即使早就不热，频率高仍然占着位置
- **改进方案**：
    - **LFU + 时间衰减**：可用不同老化规则；Redis 7.2 按经过的周期惰性扣减，不能与全量除二混同
    - **W-TinyLFU**：窗口 LRU 配合频率估计准入，主缓存使用分段 LRU，不是直接换成精确 LFU
    - **ARC**：通过近期/频繁访问列表及历史列表自适应调整，不应将它归为 PostgreSQL 当前的 Buffer Pool 实现

## 看到什么就先想到这类

- "比 LRU 更准" / "抗爬虫的缓存" → LFU
- "Redis `allkeys-lfu` 怎么实现" → 近似 LFU + 对数概率计数
- "Caffeine 为什么快" → W-TinyLFU + Count-Min Sketch
- "缓存命中率上不去" → 评估换 LFU / W-TinyLFU
- "LRU 已经会，再写一个进阶题" → LFU 是直接对照题
