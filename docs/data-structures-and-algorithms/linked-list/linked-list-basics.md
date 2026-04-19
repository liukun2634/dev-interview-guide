---
title: 链表基础与高频技巧
---

# 链表基础与高频技巧

<span class="dig-tag dig-tag--category">链表</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
链表题的难点不在算法，而在指针操作顺序。掌握三个核心技巧——**虚拟头节点**、**反转四步法**、**快慢指针**，就能覆盖大部分链表面试题。修改 `next` 前一定先保存后继节点。
:::

---

## 识别信号

**看到这些特征，优先考虑链表技巧：**

- 题目要求反转整条或部分链表
- 需要找链表中点、倒数第 K 个节点
- 需要判断链表是否有环、找环入口
- 需要合并多条有序链表、链表排序
- 操作可能改变头节点（删除头、插入头）

**反过来，这些场景用数组更合适：**

- 需要按下标随机访问元素
- 频繁查询某个值是否存在
- 数据量小、局部性要求高（数组缓存更友好）

---

## 通用思考框架

拿到链表题，按以下四步推导，不要上来就写代码。

### 第一步：判断是否需要虚拟头节点

**判断标准：** 操作是否可能修改或删除头节点？

- 删除节点（含头节点）→ 需要 dummy
- 在头部插入节点 → 需要 dummy
- 纯遍历 / 只读操作 → 不需要 dummy

Dummy 节点的价值：它充当"哨兵"，使"删除/插入头节点"和"删除/插入中间节点"的逻辑完全一致，消除所有特判。

```java
ListNode dummy = new ListNode(0);
dummy.next = head;
// ... 操作链表，始终用 prev.next 定位要操作的节点
return dummy.next;  // 注意：返回 dummy.next，不是 dummy
```

### 第二步：确定操作类型

链表题归纳为三类，认清类型就知道套哪个框架：

**1. 指针重排类（反转、交换）**

> 关键：改 `next` 前先保存后继，否则后面的节点就丢了。

反转链表的四步固定顺序——顺序错了就会断链：

```java
ListNode prev = null, curr = head;
while (curr != null) {
    ListNode next = curr.next;  // 1. 先保存后继（最关键）
    curr.next = prev;           // 2. 反转指针
    prev = curr;                // 3. prev 前进
    curr = next;                // 4. curr 前进
}
return prev;  // prev 是新头节点
```

**2. 快慢指针类（中点、环、倒数第 K 个）**

> 关键：利用速度差，一次遍历完成两件事。fast 走 2 步、slow 走 1 步，当 fast 走到末尾时，slow 恰好在中点。

找链表中点（偶数长度返回前一个中点，适合归并排序）：

```java
ListNode slow = head, fast = head;
while (fast.next != null && fast.next.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
// slow 就是中点
```

判断是否有环（fast 追 slow，有环必然相遇）：

```java
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) return true;  // 有环
}
return false;  // 无环
```

**3. 合并 / 拆分类**

> 关键：虚拟头节点 + 双指针归并，每次比较两个候选节点，选小的接到结果链表上。

```java
ListNode dummy = new ListNode(0), tail = dummy;
while (l1 != null && l2 != null) {
    if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
    else                  { tail.next = l2; l2 = l2.next; }
    tail = tail.next;
}
tail.next = (l1 != null) ? l1 : l2;
return dummy.next;
```

### 第三步：画图确定指针移动顺序

链表操作最容易出错的地方是指针移动顺序。动手之前，先在纸上或脑中画出：

- 操作前：`prev → curr → next → ...`
- 操作后：`prev ← curr   next → ...`

对于反转，每一轮循环只改一条边；对于快慢指针，画出"fast 每轮走 2 格、slow 走 1 格"的格子图，有助于确认 null 检查的写法。

### 第四步：检查边界条件

写完代码后，代入以下场景过一遍：

| 边界场景 | 需要检查的问题 |
|----------|----------------|
| 空链表（`head == null`） | while 循环能否直接跳过？返回值是否正确？ |
| 单节点 | prev/next 操作会不会越界？ |
| 两个节点 | 奇偶中点判断是否正确？ |
| 偶数长度 vs 奇数长度 | 找中点时，`fast.next` 和 `fast.next.next` 的终止条件是否符合预期？ |
| 无环 vs 有环 | fast 到达 null 时能否正常退出？ |

---

## 典型例题：环形链表 II（LeetCode 142）

[题目链接](https://leetcode.cn/problems/linked-list-cycle-ii/) · 难度：中等

**题目：** 给定链表头节点 `head`，如果链表有环，返回环的入口节点；否则返回 `null`。

### 套用框架分析

**第一步：虚拟头节点？**

本题只做遍历和指针追踪，不修改链表结构，不需要 dummy 节点。

**第二步：操作类型？**

判环 + 找入口 → 快慢指针类。

**第三步：关键洞察——为什么相遇后从 head 出发能找到入口？**

设头节点到环入口的距离为 $a$，入口到相遇点的距离为 $b$，环长为 $c$。

- slow 走的路程：$a + b$
- fast 走的路程：$a + b + kc$（多绕了 $k$ 圈）
- 因为 fast 速度是 slow 的 2 倍：$2(a+b) = a + b + kc$

化简得：

$$a = kc - b = (k-1)c + (c - b)$$

这意味着：从 **head** 出发走 $a$ 步，等价于从 **相遇点** 出发沿环走 $(k-1)$ 整圈再走 $(c-b)$ 步——两者恰好在环入口相遇。

**第四步：边界条件**

- 无环：fast 走到 null，直接返回 null。
- 空链表或单节点无环：while 条件 `fast != null && fast.next != null` 直接为 false，安全退出。

### 完整代码

```java
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            // 从 head 和相遇点同速出发，相遇即入口
            ListNode p = head;
            while (p != slow) {
                p = p.next;
                slow = slow.next;
            }
            return p;
        }
    }
    return null;  // 无环
}
```

### 复杂度分析

- **时间**：O(n)，检测环最多走 O(n)，找入口再走 O(n)
- **空间**：O(1)，只用常数个指针

---

## 延伸题目

| 题号 | 题名 | 难度 | 关键差异 | 一句话提示 |
|------|------|------|----------|------------|
| [206](https://leetcode.cn/problems/reverse-linked-list/) | 反转链表 | 简单 | 反转全链表，最基础模板 | 四步固定顺序：保存后继 → 反转 → prev 前进 → curr 前进 |
| [92](https://leetcode.cn/problems/reverse-linked-list-ii/) | 反转链表 II | 中等 | 只反转指定区间 | 先定位区间左边界，再反转，最后穿针引线接回原链表 |
| [21](https://leetcode.cn/problems/merge-two-sorted-lists/) | 合并两个有序链表 | 简单 | 合并类入门 | 虚拟头节点 + 双指针归并，每次取较小值接上 |
| [141](https://leetcode.cn/problems/linked-list-cycle/) | 环形链表 | 简单 | 只判断有无环，无需找入口 | 快慢指针，相遇即有环，fast 到 null 即无环 |
| [19](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/) | 删除链表的倒数第 N 个结点 | 中等 | 倒数定位，需要 dummy | fast 先走 N 步，再 fast/slow 同速走，slow 停在待删节点的前驱 |
| [148](https://leetcode.cn/problems/sort-list/) | 排序链表 | 中等 | 链表上的归并排序 | 快慢指针找中点切链 + 递归归并，合并用 LC21 的逻辑 |
| [160](https://leetcode.cn/problems/intersection-of-two-linked-lists/) | 相交链表 | 简单 | 两条链表找交点 | 双指针各走完自己再走对方，路程相等时必然在交点相遇 |
| [23](https://leetcode.cn/problems/merge-k-sorted-lists/) | 合并 K 个升序链表 | 困难 | 多路归并 | 优先队列维护 K 个头节点的最小值，或分治两两归并 |
| [25](https://leetcode.cn/problems/reverse-nodes-in-k-group/) | K 个一组翻转链表 | 困难 | 分段反转，余数部分不反转 | 先数够 K 个节点再反转，不够则保持原样 |

---

## 常见陷阱与调试

**1. 没有保存 `next` 就修改了 `curr.next`**

```java
// 错误：curr.next 被覆盖后，后续节点丢失
curr.next = prev;
curr = curr.next;  // 此时 curr.next 已经是 prev，不是原来的 next！

// 正确：先保存
ListNode next = curr.next;
curr.next = prev;
curr = next;
```

**2. 快慢指针的 null 检查顺序写反**

```java
// 错误：先访问 fast.next，如果 fast 是 null 就 NPE
while (fast.next != null && fast != null)

// 正确：先判断 fast 本身不为 null
while (fast != null && fast.next != null)
```

**3. 返回了 dummy 而不是 dummy.next**

使用虚拟头节点后，结果链表从 `dummy.next` 开始，返回 `dummy` 是错误的。

**4. "fast 先走 K 步"的起点搞错**

LC19（删除倒数第 N 个节点）中，fast 和 slow 都应该从 **dummy** 出发，而非 head。这样 slow 最终停在待删节点的前驱，可以直接执行 `slow.next = slow.next.next`。

---

## 面试常问 & 怎么答

### 递归反转和迭代反转怎么选？

面试中优先写迭代，因为空间 O(1)。递归写法更简洁但空间 O(n)（系统调用栈的深度等于链表长度），链表很长时会栈溢出。面试官如果追问递归写法，说明想考你对递归的理解，两种都要会。

### 为什么快慢指针能找到环入口？

设头到入口距离 $a$，入口到相遇点 $b$，环长 $c$。fast 速度是 slow 的两倍，所以 $2(a+b) = a+b+kc$，化简得 $a = kc-b$。从 head 和相遇点同速走，恰好在入口相遇（相遇点到入口的距离恰好等于头节点到入口的距离模 $c$）。

### 链表题为什么要用虚拟头节点？

当删除或插入操作可能影响头节点时，没有 dummy 就需要特判 `head == null` 和操作头节点的情况。加一个 dummy 节点统一处理，代码更简洁不容易出错。返回时记得返回 `dummy.next`。

---

## 看到什么就先想到这类

- "反转链表" → 迭代四步法 / 递归
- "链表中点 / 倒数第 K 个" → 快慢指针
- "判环 / 找环入口" → 快慢指针 + 数学推导
- "合并有序链表" → 虚拟头节点 + 双指针
- "操作可能改变头节点" → 虚拟头节点
- "链表排序" → 归并排序（找中点 + 合并）
