---
title: 链表基础与高频技巧
---

# 链表基础与高频技巧

<span class="dig-tag dig-tag--category">链表</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
链表题的难点不在算法，而在指针操作顺序。掌握三个核心技巧——**虚拟头节点**、**反转三步法**、**快慢指针**，就能覆盖大部分链表面试题。修改 `next` 前一定先保存后继节点。
:::

## 核心思路

**什么时候用链表技巧？**
- 需要反转整条或部分链表
- 需要找链表中点、倒数第 K 个节点
- 需要判断链表是否有环、找环入口
- 需要合并、拆分链表
- 操作可能改变头节点（用虚拟头节点简化边界处理）

**为什么有效？** 链表不支持随机访问，但插入删除是 O(1)。快慢指针利用速度差在一次遍历中完成"找中点""判环"等操作。

## 虚拟头节点

当操作可能修改头节点时，创建一个 dummy 节点指向 head，最后返回 `dummy.next`：

```java
ListNode dummy = new ListNode(0);
dummy.next = head;
// ... 操作链表
return dummy.next;
```

## 反转链表模板（迭代）

```java
public ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;  // 1. 先保存后继
        curr.next = prev;           // 2. 反转指针
        prev = curr;                // 3. 前驱前进
        curr = next;                // 4. 当前前进
    }
    return prev;
}
```

**要点：** 每次循环只改一个指针方向，四步固定顺序不会错。

## 快慢指针模板

```java
// 找链表中点（偶数长度时返回前一个中点）
ListNode slow = head, fast = head;
while (fast.next != null && fast.next.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
// slow 就是中点

// 判断是否有环
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) return true;  // 有环
}
return false;  // 无环
```

## 例题 1：[反转链表（LeetCode 206）](https://leetcode.cn/problems/reverse-linked-list/)

### 题目描述

给定单链表的头节点 `head`，反转链表并返回反转后的头节点。

### 思路分析

1. 维护三个指针：prev（初始 null）、curr（初始 head）、next（临时保存）
2. 每步把 curr.next 指向 prev，然后三个指针各前进一步
3. 遍历结束时 prev 就是新的头节点

### 完整代码

```java
public ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}
```

### 复杂度分析

- **时间**：O(n)，遍历一次链表
- **空间**：O(1)

## 例题 2：[环形链表 II（LeetCode 142）](https://leetcode.cn/problems/linked-list-cycle-ii/)

### 题目描述

给定链表头节点 `head`，如果链表中有环，返回环的入口节点；否则返回 null。

### 思路分析

1. 快慢指针判环：slow 走 1 步，fast 走 2 步，如果相遇则有环
2. 找环入口：相遇后，让一个指针从 head 出发，另一个从相遇点出发，都走 1 步，再次相遇就是环入口
3. **数学证明**：设头到入口距离 a，入口到相遇点 b，环长 c。相遇时 slow 走了 a+b，fast 走了 a+b+kc。因为 fast = 2×slow，所以 a+b = kc，即 a = kc-b = (k-1)c + (c-b)。从 head 和相遇点同时走，经过 a 步会在入口相遇

### 完整代码

```java
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            // 找环入口
            ListNode p = head;
            while (p != slow) {
                p = p.next;
                slow = slow.next;
            }
            return p;
        }
    }
    return null;
}
```

### 复杂度分析

- **时间**：O(n)
- **空间**：O(1)

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [206](https://leetcode.cn/problems/reverse-linked-list/) | 反转链表 | 简单 | 迭代三步法，最基础的链表操作 |
| [92](https://leetcode.cn/problems/reverse-linked-list-ii/) | 反转链表 II | 中等 | 反转指定区间，需要定位 + 穿针引线 |
| [21](https://leetcode.cn/problems/merge-two-sorted-lists/) | 合并两个有序链表 | 简单 | 虚拟头节点 + 双指针归并 |
| [141](https://leetcode.cn/problems/linked-list-cycle/) | 环形链表 | 简单 | 快慢指针判断是否有环 |
| [19](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/) | 删除链表的倒数第 N 个结点 | 中等 | 快慢指针，fast 先走 N 步 |
| [148](https://leetcode.cn/problems/sort-list/) | 排序链表 | 中等 | 归并排序，找中点 + 合并 |
| [160](https://leetcode.cn/problems/intersection-of-two-linked-lists/) | 相交链表 | 简单 | 双指针走完自己走对方，相遇即交点 |
| [23](https://leetcode.cn/problems/merge-k-sorted-lists/) | 合并 K 个升序链表 | 困难 | 优先队列 / 分治归并 |
| [25](https://leetcode.cn/problems/reverse-nodes-in-k-group/) | K 个一组翻转链表 | 困难 | 分段反转，先数 K 个再反转 |

## 面试常问 & 怎么答

### 递归反转和迭代反转怎么选？

面试中优先写迭代，因为空间 O(1)。递归写法更简洁但空间 O(n)（栈深度），链表很长时会栈溢出。面试官如果追问递归写法，说明想考你对递归的理解，两种都要会。

### 为什么快慢指针能找到环入口？

设头到入口距离 a，入口到相遇点 b，环长 c。fast 走了 2(a+b)，也走了 a+b+kc，所以 a = kc-b。从 head 和相遇点同速走，恰好在入口相遇。

### 链表题为什么要用虚拟头节点？

当删除或插入操作可能影响头节点时，没有 dummy 就需要特判 `head == null` 和操作头节点的情况。加一个 dummy 节点统一处理，代码更简洁不容易出错。

## 看到什么就先想到这类

- "反转链表"→ 迭代三步法 / 递归
- "链表中点 / 倒数第 K 个"→ 快慢指针
- "判环 / 找环入口"→ 快慢指针 + 数学推导
- "合并有序链表"→ 虚拟头节点 + 双指针
- "操作可能改变头节点"→ 虚拟头节点
- "链表排序"→ 归并排序（找中点 + 合并）
