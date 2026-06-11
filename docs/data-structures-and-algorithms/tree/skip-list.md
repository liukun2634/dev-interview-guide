---
title: 跳表 SkipList
---

# 跳表 SkipList（LeetCode 1206）— Redis ZSet 的核心数据结构

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
跳表用**多层链表 + 随机层数**模拟平衡树，查找 / 插入 / 删除均摊 **O(log n)**。它是 **Redis ZSet 唯一选择**、LevelDB MemTable 的写入索引、Java `ConcurrentSkipListMap` 的底层。比红黑树/AVL 更容易写、更容易并发化，是工程界绕开自平衡复杂性的经典解法。
:::

## 为什么单独讲它

跳表跟前面 [Trie](./trie) / [Radix Tree](./radix-tree) 一样，**算法刷题里不太考但工程里反复出现**。面试问"Redis ZSet 为什么用跳表而不是红黑树/B+Tree"、"为什么 ConcurrentSkipListMap 比 TreeMap 高并发"，都要能答上来。

### 跳表 vs 红黑树 / B+Tree

| 维度 | **跳表** | 红黑树 | B+Tree |
|------|------|------|------|
| 查找 / 插入 / 删除 | **均摊 O(log n)** | O(log n) | O(log n) |
| 实现难度 | **极简**（约 80 行）| **极难**（旋转 4 种 + 颜色规则） | 难（分裂合并）|
| 范围查询 | **极快**（底层就是有序链表）| 中（中序遍历） | 极快（叶子双向链表）|
| 并发友好 | **高**（细粒度锁 / lock-free）| 低（旋转影响大范围） | 中 |
| 内存开销 | 每节点平均 2 个指针（O(n)） | 每节点固定 2 指针 + 1 颜色位 | 每节点 m 个指针（页大）|
| 适用场景 | **内存有序集合**（Redis ZSet / Java SkipListMap）| 通用平衡树（Linux 进程调度 CFS / Java TreeMap）| **磁盘索引**（MySQL B+Tree） |

**Redis 选跳表的真实原因**（Redis 作者 antirez 原话整理）：
1. **代码简单**，60 行 vs 红黑树 300+ 行，bug 概率低一个数量级
2. **范围查询是 ZSet 主要操作**（`ZRANGE` / `ZRANGEBYSCORE`），跳表底层就是有序链表，天然适合
3. **内存开销可调**：层数概率 `p` 可调，红黑树平均每节点固定 2 指针 + 颜色位
4. **跳表没有"旋转操作"**，不会因为一次写入触发大范围内存移动，并发改造容易

## 数据结构设计

跳表是"**多层有序链表 + 随机抽样上层**"。最底层是完整有序链表，每往上一层抽出一部分节点作为"快速通道"。

```
Level 3:  HEAD ──────────────────────────────────────→ 30 ──────→ NULL
Level 2:  HEAD ──────────→ 10 ──────────→ 25 ──────→ 30 ──────→ NULL
Level 1:  HEAD → 5 ───→ 10 ──→ 17 ──→ 25 ───→ 28 → 30 ───→ NULL
Level 0:  HEAD → 5 → 8 → 10 → 17 → 22 → 25 → 28 → 30 → 42 → NULL  ← 完整链表
```

**查找 27**：从最高层往右扫，遇到 `> 27` 就下沉，直到 Level 0 找到 28。每层期望走 O(1) 步，总共 O(log n) 层。

### 关键设计点

- **节点层数**：用随机数决定，`p = 0.5` 时每节点平均 2 层（geometric distribution）
- **MAX_LEVEL**：通常 16-32，对应 65k - 40 亿元素
- **HEAD 哨兵节点**：层数永远等于 MAX_LEVEL，简化边界处理

## 完整代码（必背手撕）

```java
class SkipList {
    private static final int MAX_LEVEL = 16;            // 65k 元素够用
    private static final double P = 0.5;
    private final Random rand = new Random();

    private static class Node {
        int val;
        Node[] next;                                    // ★ 每节点有一个指针数组
        Node(int v, int level) {
            val = v;
            next = new Node[level];
        }
    }

    private final Node head = new Node(-1, MAX_LEVEL);
    private int curLevel = 1;                           // 当前实际最高层

    /** 查找：从高层往下，每层向右走到 < target 的最后一个节点 */
    public boolean search(int target) {
        Node curr = head;
        for (int i = curLevel - 1; i >= 0; i--) {
            while (curr.next[i] != null && curr.next[i].val < target) {
                curr = curr.next[i];                    // 同层右走
            }
            // curr.next[i] 现在 >= target，下沉
        }
        Node candidate = curr.next[0];
        return candidate != null && candidate.val == target;
    }

    /** 插入：记录每层的"插入位置前驱"，新节点接进去 */
    public void add(int num) {
        Node[] update = new Node[MAX_LEVEL];            // ★ 每层的前驱节点
        Node curr = head;
        for (int i = curLevel - 1; i >= 0; i--) {
            while (curr.next[i] != null && curr.next[i].val < num) {
                curr = curr.next[i];
            }
            update[i] = curr;                           // ★ 记下来
        }

        int level = randomLevel();                      // 给新节点抽个层数
        if (level > curLevel) {
            for (int i = curLevel; i < level; i++) {
                update[i] = head;                       // 新增层的前驱都是 head
            }
            curLevel = level;
        }

        Node newNode = new Node(num, level);
        for (int i = 0; i < level; i++) {               // ★ 每层都接上
            newNode.next[i] = update[i].next[i];
            update[i].next[i] = newNode;
        }
    }

    /** 删除：跟插入类似，记录前驱再断链 */
    public boolean erase(int num) {
        Node[] update = new Node[MAX_LEVEL];
        Node curr = head;
        for (int i = curLevel - 1; i >= 0; i--) {
            while (curr.next[i] != null && curr.next[i].val < num) {
                curr = curr.next[i];
            }
            update[i] = curr;
        }

        Node target = curr.next[0];
        if (target == null || target.val != num) return false;

        for (int i = 0; i < curLevel; i++) {
            if (update[i].next[i] != target) break;     // ★ 高层可能没有 target
            update[i].next[i] = target.next[i];
        }

        // 缩减空层
        while (curLevel > 1 && head.next[curLevel - 1] == null) {
            curLevel--;
        }
        return true;
    }

    /** 随机层数：连续抛硬币，正面继续 */
    private int randomLevel() {
        int level = 1;
        while (level < MAX_LEVEL && rand.nextDouble() < P) {
            level++;
        }
        return level;
    }
}
```

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| `update[]` 不记录前驱 | 插入/删除时无法接链 | 查找过程中**每层都记下前驱**到 update[] |
| 删除时假定每层都有 target | 高层可能不存在 target（节点层数 < MAX_LEVEL）| `if (update[i].next[i] != target) break` |
| 新增层数不更新 head 数组 | 高层 head.next[i] = null，但 curLevel 已增 | 新增层时把 `update[i] = head` |
| 不收缩空层 | curLevel 越长越大，浪费查找成本 | 删除后检查 `head.next[top] == null` 就 `curLevel--` |
| `p` 设太大（如 0.9） | 节点平均层数高，内存爆炸 | **生产用 0.25-0.5**（Redis 用 0.25）|

## 复杂度

- **查找 / 插入 / 删除**：期望 O(log n)，最坏 O(n)（运气极差）
- **空间**：期望 O(n)，因为节点平均层数 = `1/(1-p)`，p=0.5 时为 2 层

## 业界应用

| 系统 | 用法 |
|------|------|
| **Redis ZSet** | 内部就是 SkipList + HashMap 双结构（HashMap 做 `ZSCORE` O(1)，SkipList 做范围查询） |
| **LevelDB / RocksDB MemTable** | 写入缓冲区用 SkipList，因为 lock-free 友好 |
| **Java ConcurrentSkipListMap** | 标准库实现，比 `Collections.synchronizedMap(TreeMap)` 高并发性能高一个量级 |
| **HBase** | MemStore 内部也是 SkipList |
| **Lucene** | 索引压缩里用 SkipList 加速跳过倒排链表的不需要文档 |

## Redis ZSet 为什么是 SkipList + HashMap 双结构

```
HashMap:    member → score          // ZSCORE / ZADD 重复检测 O(1)
SkipList:   按 score 排序的 member  // ZRANGE / ZRANGEBYSCORE 范围 O(log n + m)
```

**两个结构同步更新**。看似冗余，但实际：
- 没 HashMap，`ZSCORE` 要扫 SkipList → O(log n)
- 没 SkipList，`ZRANGE` 要全表排序 → O(n log n)
- 内存代价：每 member 多一个 HashMap 项，约 50-80 字节，但换来**所有操作都 O(1) / O(log n)**

## 面试常问 & 怎么答

### Redis 为什么不用红黑树

- **复杂度差不多但代码量差 5 倍**（80 vs 400+ 行）
- **范围查询红黑树慢**：要中序遍历，cache miss 多；跳表底层就是顺序链表，cache 友好
- **并发友好**：跳表细粒度锁（每节点一锁）就能写得通，红黑树旋转影响范围大很难做无锁
- **作者哲学**：antirez 说过"我宁愿写跳表，因为它没让我感到聪明"

### 跳表 vs B+Tree 谁更好

**看在哪里**：
- **内存**：跳表 ≈ B+Tree（B+Tree 节点扇出大但每节点开销大）
- **磁盘**：B+Tree 完胜（一节点对应一磁盘页，IO 次数远少于跳表）
- **范围查询**：B+Tree 叶子双向链表 > 跳表底层链表（差不多，B+Tree 略好）
- **MySQL 用 B+Tree**：磁盘存储；**Redis 用跳表**：纯内存

### ConcurrentSkipListMap 怎么实现无锁

JDK 用 **CAS + 标记节点**：
- 删除节点不立即断链，先把 `value` 设为特殊标记
- 插入用 CAS 修改 `next` 指针
- 查找时遇到标记节点协助清理

吞吐量远高于 `synchronized(TreeMap)`，但**单线程性能反而不如 TreeMap**（CAS 开销）。

### 为什么 p = 0.5 是常用值

期望层数 = `1/(1-p)`：
- p=0.5 → 平均 2 层 → 内存正常，查找 log₂ n
- p=0.25 → 平均 1.33 层 → 内存省，但查找 log₄ n × 4 ≈ log₂ n × 2（Redis 选这个，省内存优先）
- p=0.9 → 平均 10 层 → 内存爆炸

## 看到什么就先想到这类

- "Redis ZSet 怎么实现 / 为什么用跳表" → SkipList + HashMap 双结构
- "支持范围查询 + O(log n) 插入" → 跳表（内存）/ B+Tree（磁盘）
- "高并发有序 Map" → ConcurrentSkipListMap
- "实现一个比红黑树简单的平衡结构" → SkipList
- "LevelDB MemTable 是什么" → SkipList（也是 lock-free 友好的原因）
