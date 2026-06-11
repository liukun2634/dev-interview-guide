---
title: LFU 缓存
---

# LFU 缓存（LeetCode 460）— 比 LRU 高一档的工程缓存

<span class="dig-tag dig-tag--category">哈希</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
**LFU = Least Frequently Used，按访问频率淘汰**。比 LRU 更精准，但**实现复杂度高一档**。面试常作为 LRU 的进阶追问出现——LRU 是"一个哈希表 + 一条双向链表"，**LFU 必须用"两个哈希表 + 一组双向链表"**，否则无法做到 O(1)。
:::

## 为什么单独讲它

[LRU](../hash-table#典型例题：lru-缓存必背手撕题) 解决"最近用过的就是热数据"，但**最近用过 ≠ 真的常用**——一个偶然进来的冷 key 会挤掉一个被高频访问的热 key。LFU 用"访问次数"做依据：

| 维度 | LRU | LFU |
|------|------|------|
| 淘汰依据 | 最久未访问 | **访问次数最少** |
| 数据结构 | 1 个 HashMap + 1 条双向链表 | **2 个 HashMap + N 条双向链表** |
| 复杂度 | O(1) get / put | O(1) get / put |
| 命中率 | 中 | **高**（典型 +10-20%） |
| 代码量 | 60 行 | **130 行** |
| 适用场景 | 通用、缓存层、Redis | **Redis 4.0+ `allkeys-lfu`、热点感知 CDN** |

**面试常问"为什么 LRU 不够"**：考虑一个场景——电商商品详情缓存，某商品突然被爬虫疯狂访问 1 万次，但只在那一秒。LRU 会把它捧上去、把其他正常热销商品挤掉。LFU 会因为它"频率"虚高被记一下，但热销商品也有累积频率不会被踢。**Redis 4.0 之所以新增 `allkeys-lfu`，就是因为线上经常被爬虫和异常流量打穿 LRU**。

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

        // ★ 如果老链表空了，且这就是 minFreq → minFreq 必须 +1
        if (oldList.isEmpty() && oldFreq == minFreq) {
            minFreq++;
        }

        node.freq++;
        freqToList.computeIfAbsent(node.freq, k -> new DLinkedList()).addFirst(node);
    }
}
```

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 不维护 `minFreq` 变量 | 淘汰时要 O(n) 扫所有 freq 找最小 | 实时维护 minFreq |
| 老链表空了不更新 `minFreq` | 下次淘汰扫空链表，逻辑死循环 | `if (oldList.isEmpty() && oldFreq == minFreq) minFreq++` |
| 插入新节点忘记重置 minFreq | 新 key 频率=1 但 minFreq 是 5，淘汰错对象 | 插入新节点固定 `minFreq = 1` |
| 同频率不维护内部顺序 | 同 freq 的 key 淘汰顺序乱 | 每个 freq 一条双向链表，头插尾淘 |
| `capacity == 0` 不特判 | 直接进入 put 逻辑会 NPE | 第一行 `if (capacity == 0) return` |

## 复杂度

- **`get`**：O(1) — HashMap 查找 + 链表节点移动
- **`put`**：O(1) — 同上
- **空间**：O(capacity) — keyToNode + 所有链表节点之和 ≤ capacity

## 业界应用

| 系统 | 用 LFU 的方式 |
|------|------|
| **Redis 4.0+** | `maxmemory-policy allkeys-lfu` / `volatile-lfu` —— 用**对数概率计数**模拟 LFU，省内存 |
| **Caffeine** | **W-TinyLFU**（混合 LRU + LFU），用 **Count-Min Sketch** 估算频率，吞吐量比 ConcurrentHashMap+锁 高一个量级 |
| **CDN 边缘缓存** | Cloudflare / Fastly 内部使用变种 LFU 跟踪热点资源 |
| **数据库 Buffer Pool** | PostgreSQL 9.0+ 用 ARC（Adaptive Replacement Cache），LRU + LFU 混合 |

## Redis 的"近似 LFU"：为什么不用标准 LFU

标准 LFU 要给每个 key 维护 freq 计数器，64 位 Redis 每 key 多 8 字节 → 1 亿 key 多 800MB。Redis 实际做法：

- **8 位计数器**（最多到 255）+ **对数概率递增**：访问越多次，递增越慢，自然抗"瞬时爆发"
- **后台衰减**：定期把所有计数器除以 2，给老热点让位

**面试问"为什么 Redis 不用我们刚才写的 LFU"**：内存代价 + 锁竞争 + 衰减需求。线上系统不需要"精确淘汰最少频率"，而是"大概淘汰冷数据，且抗异常流量"。

## 面试常问 & 怎么答

### LFU vs LRU 怎么选

- **业务流量稳定、突发少** → LRU 够用，代码简单（Memcached 默认）
- **有爬虫 / 异常流量 / 长尾热点** → LFU 抗污染（Redis `allkeys-lfu`）
- **极致性能 + 内存紧张** → Caffeine W-TinyLFU（生产首选）

### 为什么需要两个 HashMap

- **keyToNode**：让 `get(key)` 是 O(1)（不用扫链表）
- **freqToList**：让"淘汰最小频率"是 O(1)（不用扫所有 key 比较 freq）

只用一个 HashMap 会让某个操作退化到 O(n)。

### 标准 LFU 有什么问题，工业上怎么改

- **冷启动突刺**：新 key 频率=1，立刻被淘汰；老 key 即使早就不热，频率高仍然占着位置
- **改进方案**：
  - **LFU + 时间衰减**：周期性把所有 freq 除以 2（Redis 做法）
  - **W-TinyLFU**：Window 段用 LRU（应对突刺）+ Main 段用 LFU + Count-Min Sketch（省内存）（Caffeine 做法）
  - **ARC**：自适应在 LRU 和 LFU 之间动态切换权重（PostgreSQL 做法）

## 看到什么就先想到这类

- "比 LRU 更准" / "抗爬虫的缓存" → LFU
- "Redis `allkeys-lfu` 怎么实现" → 近似 LFU + 对数概率计数
- "Caffeine 为什么快" → W-TinyLFU + Count-Min Sketch
- "缓存命中率上不去" → 评估换 LFU / W-TinyLFU
- "LRU 已经会，再写一个进阶题" → LFU 是直接对照题
