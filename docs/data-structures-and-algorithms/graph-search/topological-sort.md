---
title: 拓扑排序
---

# 拓扑排序

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
拓扑排序适用于有向无环图。它本质上是在求一个满足依赖关系的线性顺序，因此课程依赖、任务编排、构建顺序问题都很常见。
:::

## 两种常见做法

### 入度法（Kahn）

- 先把所有入度为 0 的节点入队。
- 每弹出一个节点，就删掉它的出边并更新邻接点入度。

### DFS 后序法

- 用 DFS 遍历。
- 后序加入答案，再反转结果。

## 高频题型

- 课程表。
- 课程表 II。
- 字典序问题中的依赖排序。