---
title: 哈希表 Hash Table
---

# 哈希表 Hash Table

<span class="dig-tag dig-tag--category">数据结构</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
哈希表通过**哈希函数**将键映射到固定大小的数组下标，实现平均 $O(1)$ 的增删改查。核心挑战在于**哈希冲突**的处理——链地址法与开放地址法是两种主流方案。Java 的 `HashMap` 在链表长度超过 8 时会转化为**红黑树**，将最坏情况从 $O(n)$ 优化到 $O(\log n)$。
:::

## 基本概念

哈希表（Hash Table），也称散列表，是基于**键值对（key-value）**的数据结构。它通过哈希函数将任意键转换为一个数组下标，从而在 $O(1)$ 时间内完成数据的存取。

### 时间复杂度

| 操作 | 平均情况 | 最坏情况（大量冲突） |
|------|----------|----------------------|
| 查找 | $O(1)$ | $O(n)$ |
| 插入 | $O(1)$ | $O(n)$ |
| 删除 | $O(1)$ | $O(n)$ |

> 最坏情况出现在哈希函数设计不良，导致大量键映射到同一桶（bucket）时。

---

## 哈希函数

哈希函数的目标是将任意键均匀分布到数组的各个位置，减少冲突。一个简单的整数哈希函数：

```typescript
function hash(key: number, tableSize: number): number {
  // modulo operation maps key to a valid array index
  return ((key % tableSize) + tableSize) % tableSize
}
```

对于字符串键，常用多项式滚动哈希：

```typescript
function hashString(key: string, tableSize: number): number {
  const PRIME = 31
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    // treat each character as a digit in base-31 number
    hash = (hash * PRIME + key.charCodeAt(i)) % tableSize
  }
  return hash
}
```

---

## 冲突解决

### 方法一：链地址法 Separate Chaining

每个数组槽位存储一个链表（或其他容器），哈希到同一位置的键值对追加到链表中。

```typescript
class HashTable<K, V> {
  private buckets: Array<Array<[K, V]>>
  private size: number
  private count: number

  constructor(size = 16) {
    this.size = size
    this.count = 0
    // initialize each bucket as an empty array (linked list simulation)
    this.buckets = Array.from({ length: size }, () => [])
  }

  private getIndex(key: K): number {
    const str = String(key)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % this.size
    }
    return hash
  }

  set(key: K, value: V): void {
    const index = this.getIndex(key)
    const bucket = this.buckets[index]
    const existing = bucket.find(([k]) => k === key)

    if (existing) {
      existing[1] = value  // update existing key
    } else {
      bucket.push([key, value])  // insert new key
      this.count++
    }
  }

  get(key: K): V | undefined {
    const index = this.getIndex(key)
    const bucket = this.buckets[index]
    return bucket.find(([k]) => k === key)?.[1]
  }

  delete(key: K): boolean {
    const index = this.getIndex(key)
    const bucket = this.buckets[index]
    const pos = bucket.findIndex(([k]) => k === key)

    if (pos === -1) return false
    bucket.splice(pos, 1)
    this.count--
    return true
  }
}
```

### 方法二：开放地址法 Open Addressing

冲突发生时，在数组中探测下一个空槽。常见探测策略：

- **线性探测**（Linear Probing）：`index = (index + 1) % size`
- **二次探测**（Quadratic Probing）：`index = (index + i²) % size`
- **双重哈希**（Double Hashing）：使用第二个哈希函数计算步长

```typescript
// Linear probing example
function linearProbe(table: (string | null)[], key: string, size: number): number {
  let index = hashString(key, size)
  while (table[index] !== null && table[index] !== key) {
    index = (index + 1) % size  // probe next slot
  }
  return index
}
```

---

## Java HashMap 内部实现

Java 8 的 `HashMap` 综合了链地址法与红黑树：

1. **底层结构**：数组（`Node[]`）+ 链表 + 红黑树
2. **链表转红黑树**：当某个桶的链表长度 ≥ 8 且数组长度 ≥ 64 时，链表转为红黑树，查找从 $O(n)$ 降至 $O(\log n)$
3. **红黑树转链表**：当节点数 ≤ 6 时退化回链表
4. **扩容（Rehash）**：当 `元素数量 / 数组长度 > 负载因子（0.75）` 时，数组扩容为原来的 2 倍，所有键重新哈希

```
初始：数组大小 16，负载因子 0.75
→ 元素数 > 12 时触发扩容 → 数组大小变为 32
→ 每次扩容都是 2 倍，保持 2 的幂次，便于位运算取模（index = hash & (n-1)）
```

---

## 常见陷阱

1. **键的可变性问题**：用可变对象（如数组、对象）作为哈希表的键时，若对象内容改变，哈希值也会变，导致找不到对应的值。应优先使用不可变类型（字符串、数字）作为键。
2. **负载因子与性能**：负载因子过高（元素太多）会增加冲突，降低性能；过低会浪费内存。Java `HashMap` 默认 0.75 是经过验证的平衡点。
3. **整数溢出**：在计算哈希值时，中间结果可能溢出，需使用取模操作控制范围，或在 Java/C++ 中使用无符号整数。
4. **删除操作的陷阱（开放地址法）**：线性探测中不能直接删除元素（会断开探测链），需标记为"已删除"的墓碑（tombstone）状态。

---

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 两数之和（LeetCode 1）</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">简单</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 字母异位词分组（LeetCode 49）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. LRU 缓存（LeetCode 146）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

## 面试真题详解

### Q1：两数之和（LeetCode 1）

**题目**：给定整数数组 `nums` 和目标值 `target`，返回数组中两个数之和等于 `target` 的下标。

**解题思路**：遍历数组，用哈希表存储"已见过的数及其下标"。对于每个数 `nums[i]`，检查 `target - nums[i]` 是否已在表中。

```typescript
function twoSum(nums: number[], target: number): number[] {
  // map: value -> index
  const seen = new Map<number, number>()

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]

    if (seen.has(complement)) {
      return [seen.get(complement)!, i]
    }

    seen.set(nums[i], i)
  }

  return []
}
// Time: O(n), Space: O(n)
// Compared to brute force O(n²) — hash table trades space for time
```

---

### Q2：字母异位词分组（LeetCode 49）

**题目**：给定字符串数组，将所有字母异位词（包含相同字母，顺序不同）分组后返回。

**解题思路**：对每个单词的字符排序后作为哈希表的键，相同键的单词属于同一组。

```typescript
function groupAnagrams(strs: string[]): string[][] {
  // key: sorted characters of word, value: list of anagrams
  const map = new Map<string, string[]>()

  for (const str of strs) {
    // sorting chars gives a canonical form for anagram detection
    const key = str.split('').sort().join('')

    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)!.push(str)
  }

  return Array.from(map.values())
}
// Time: O(n * k log k) where k is max string length
// Space: O(n * k)
```

---

### Q3：LRU 缓存（LeetCode 146）

**题目**：设计一个满足 LRU（最近最少使用）策略的缓存结构，`get` 和 `put` 操作均为 $O(1)$。

**解题思路**：哈希表 + 双向链表。哈希表提供 $O(1)$ 查找，双向链表维护访问顺序（最近访问的移到头部，满时删除尾部）。

```typescript
class DLinkedNode {
  key: number
  val: number
  prev: DLinkedNode | null = null
  next: DLinkedNode | null = null

  constructor(key = 0, val = 0) {
    this.key = key
    this.val = val
  }
}

class LRUCache {
  private capacity: number
  private map: Map<number, DLinkedNode>
  private head: DLinkedNode  // dummy head
  private tail: DLinkedNode  // dummy tail

  constructor(capacity: number) {
    this.capacity = capacity
    this.map = new Map()
    // sentinel nodes to avoid null checks
    this.head = new DLinkedNode()
    this.tail = new DLinkedNode()
    this.head.next = this.tail
    this.tail.prev = this.head
  }

  private addToFront(node: DLinkedNode): void {
    node.prev = this.head
    node.next = this.head.next
    this.head.next!.prev = node
    this.head.next = node
  }

  private removeNode(node: DLinkedNode): void {
    node.prev!.next = node.next
    node.next!.prev = node.prev
  }

  get(key: number): number {
    if (!this.map.has(key)) return -1
    const node = this.map.get(key)!
    // move to front: mark as recently used
    this.removeNode(node)
    this.addToFront(node)
    return node.val
  }

  put(key: number, value: number): void {
    if (this.map.has(key)) {
      const node = this.map.get(key)!
      node.val = value
      this.removeNode(node)
      this.addToFront(node)
    } else {
      if (this.map.size >= this.capacity) {
        // evict least recently used (node before tail)
        const lru = this.tail.prev!
        this.removeNode(lru)
        this.map.delete(lru.key)
      }
      const newNode = new DLinkedNode(key, value)
      this.map.set(key, newNode)
      this.addToFront(newNode)
    }
  }
}
// get: O(1), put: O(1), Space: O(capacity)
```

---

## 延伸阅读

- [LeetCode 1 - Two Sum](https://leetcode.com/problems/two-sum/)
- [LeetCode 49 - Group Anagrams](https://leetcode.com/problems/group-anagrams/)
- [LeetCode 146 - LRU Cache](https://leetcode.com/problems/lru-cache/)
- [Java HashMap 源码分析（OpenJDK）](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java)
