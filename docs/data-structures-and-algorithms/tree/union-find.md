---
title: 并查集
---

# 并查集

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
并查集擅长处理“动态连通性”问题。它关心的是两个元素是否属于同一个集合，以及如何快速合并两个集合。
:::

## 核心操作

- `find(x)`：找到元素所属集合的代表元。
- `union(a, b)`：把两个集合合并。

## 两个关键优化

- 路径压缩：降低 find 的树高。
- 按秩合并：优先把小树挂到大树上。

## 高频题型

| 题型 | 代表问题 |
|------|------|
| 连通块统计 | 省份数量 |
| 成环检测 | 冗余连接 |
| 等价关系合并 | 账户合并 |