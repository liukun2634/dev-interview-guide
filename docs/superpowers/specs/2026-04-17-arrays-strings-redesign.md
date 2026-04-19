# 数组与字符串章节重构设计

## 目标

重构 `docs/data-structures-and-algorithms/arrays/` 章节，从面试复习角度重新组织内容。第一篇为概念与技巧总览，后续每个算法专题统一为：技巧讲解 → 通用模板 → 例题（思路+完整 Java 代码+复杂度）→ 推荐练习题目。

## 文件结构

| 文件 | 标题 | 内容 |
|---|---|---|
| `index.md` | 数组与字符串 | 概念与技巧总览：数据结构特性、Java 常用操作（数组遍历、ArrayList 扩容、String 不可变性、StringBuilder）、区间问题分类决策树、各专题导航 |
| `two-pointers.md` | 双指针 | 左右指针 + 快慢指针；模板；例题：两数之和 II（LeetCode 167）、删除有序数组重复项（LeetCode 26）；推荐题目 |
| `sliding-window.md` | 滑动窗口 | 可变窗口 + 固定窗口；模板；例题：最长无重复子串（LeetCode 3）、最小覆盖子串（LeetCode 76）；推荐题目 |
| `prefix-sum-difference.md` | 前缀和与差分 | 前缀和 + 差分数组；模板；例题：和为 K 的子数组（LeetCode 560）、航班预订统计（LeetCode 1109）；推荐题目 |
| `binary-search.md`（新增） | 二分查找 | 标准二分 + 左右边界；模板；例题：搜索旋转排序数组（LeetCode 33）、在排序数组中查找元素的第一个和最后一个位置（LeetCode 34）；推荐题目 |

## index.md 内容

保留现有 Java 基础知识（数组声明/遍历/工具方法、ArrayList 对比与扩容、字符串不可变性、String/StringBuilder/StringBuffer 对比、字符频率统计），去掉与专题重叠的操作模式（原地修改、反转移到双指针），新增区间问题分类决策树：

```
遇到数组/字符串问题
├── 有序 + 查找/边界 → 二分查找
├── 左右边界同时移动 → 双指针
├── 连续区间最长/最短 → 滑动窗口
├── 区间和/区间统计 → 前缀和
└── 批量区间增减 → 差分数组
```

## 每个专题页面统一结构

```markdown
# 标题
tags + tip box（一句话核心要点）

## 核心思路
什么时候用、为什么有效、关键判断条件

## 通用模板
Java 代码模板 + 模板各部分说明注释

## 例题 1：[题名]（LeetCode xxx）
### 题目描述
简述题意和约束条件
### 思路分析
分步讲解解题思路
### 完整代码
Java 完整可运行代码
### 复杂度分析
时间 + 空间

## 例题 2：[题名]（LeetCode xxx）
（同上格式）

## 推荐练习
| 题号 | 题名 | 难度 | 一句话提示 |
（6-8 题）

## 面试常问 & 怎么答
## 看到什么就先想到这类
```

## Sidebar 更新

```typescript
{
  text: '数组与字符串',
  collapsed: false,
  items: [
    { text: '概念与技巧', link: '/data-structures-and-algorithms/arrays/' },
    { text: '双指针', link: '/data-structures-and-algorithms/arrays/two-pointers' },
    { text: '滑动窗口', link: '/data-structures-and-algorithms/arrays/sliding-window' },
    { text: '前缀和与差分', link: '/data-structures-and-algorithms/arrays/prefix-sum-difference' },
    { text: '二分查找', link: '/data-structures-and-algorithms/arrays/binary-search' },
  ],
}
```

## 例题选择

| 专题 | 例题 1 | 例题 2 |
|---|---|---|
| 双指针 | LeetCode 167 两数之和 II（左右指针经典） | LeetCode 26 删除有序数组重复项（快慢指针经典） |
| 滑动窗口 | LeetCode 3 最长无重复子串（可变窗口入门） | LeetCode 76 最小覆盖子串（可变窗口进阶） |
| 前缀和与差分 | LeetCode 560 和为 K 的子数组（前缀和+哈希） | LeetCode 1109 航班预订统计（差分数组经典） |
| 二分查找 | LeetCode 33 搜索旋转排序数组（变体二分） | LeetCode 34 查找元素的第一个和最后一个位置（左右边界） |

## 约束

- 所有代码用 Java
- 不贴完整题目原文（版权），只简述题意
- 每个推荐练习表 6-8 题，标注难度和一句话提示
- 保持站点现有的 tag 系统和 tip box 风格
