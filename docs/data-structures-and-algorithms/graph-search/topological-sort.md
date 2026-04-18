---
title: 拓扑排序
---

# 拓扑排序

<span class="dig-tag dig-tag--category">图与搜索</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
拓扑排序求有向无环图（DAG）中满足依赖关系的线性顺序。核心方法是 **BFS（Kahn 算法）**：维护入度数组，每次取入度为 0 的节点。如果最终处理的节点数 < 总节点数，说明有环。
:::

## 核心思路

**什么时候用拓扑排序？**
- 课程依赖、任务编排（有先后顺序约束）
- 判断有向图是否有环
- 确定编译顺序、构建顺序

**为什么有效？** 入度为 0 的节点没有依赖，可以先执行。执行后删除它的出边，新的入度为 0 的节点又可以执行，直到全部完成或发现有环。

## BFS 拓扑排序模板（Kahn 算法）

```java
public List<Integer> topologicalSort(int numNodes, int[][] edges) {
    // 建图 + 统计入度
    List<List<Integer>> graph = new ArrayList<>();
    int[] indegree = new int[numNodes];
    for (int i = 0; i < numNodes; i++) graph.add(new ArrayList<>());
    for (int[] edge : edges) {
        graph.get(edge[0]).add(edge[1]);
        indegree[edge[1]]++;
    }

    // 入度为 0 的节点入队
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numNodes; i++) {
        if (indegree[i] == 0) queue.offer(i);
    }

    // BFS
    List<Integer> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int next : graph.get(node)) {
            if (--indegree[next] == 0) {
                queue.offer(next);
            }
        }
    }

    // 如果处理的节点数 < 总数，说明有环
    return order.size() == numNodes ? order : new ArrayList<>();
}
```

**要点：** 最终 `order.size() < numNodes` 就是有环。这也是判断 DAG 的标准方法。

## 例题 1：[课程表（LeetCode 207）](https://leetcode.cn/problems/course-schedule/)

### 题目描述

你需要修 `numCourses` 门课，给定先修关系 `prerequisites[i] = [a, b]` 表示学 a 之前要先学 b。判断能否修完所有课程。

### 思路分析

1. 建有向图：b → a（b 是 a 的前置）
2. 用 BFS 拓扑排序
3. 如果能处理完所有节点，说明无环，可以修完

### 完整代码

```java
public boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    int[] indegree = new int[numCourses];
    for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());

    for (int[] pre : prerequisites) {
        graph.get(pre[1]).add(pre[0]);
        indegree[pre[0]]++;
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (indegree[i] == 0) queue.offer(i);
    }

    int count = 0;
    while (!queue.isEmpty()) {
        int course = queue.poll();
        count++;
        for (int next : graph.get(course)) {
            if (--indegree[next] == 0) {
                queue.offer(next);
            }
        }
    }

    return count == numCourses;
}
```

### 复杂度分析

- **时间**：O(V + E)
- **空间**：O(V + E)

## 例题 2：[课程表 II（LeetCode 210）](https://leetcode.cn/problems/course-schedule-ii/)

### 题目描述

返回你为了修完所有课程应该按照什么顺序修课。如果不可能，返回空数组。

### 思路分析

1. 和课程表 I 一样用 BFS 拓扑排序
2. 区别是需要记录排序结果并返回
3. 有环时返回空数组

### 完整代码

```java
public int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    int[] indegree = new int[numCourses];
    for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());

    for (int[] pre : prerequisites) {
        graph.get(pre[1]).add(pre[0]);
        indegree[pre[0]]++;
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (indegree[i] == 0) queue.offer(i);
    }

    int[] order = new int[numCourses];
    int idx = 0;
    while (!queue.isEmpty()) {
        int course = queue.poll();
        order[idx++] = course;
        for (int next : graph.get(course)) {
            if (--indegree[next] == 0) {
                queue.offer(next);
            }
        }
    }

    return idx == numCourses ? order : new int[0];
}
```

### 复杂度分析

- **时间**：O(V + E)
- **空间**：O(V + E)

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [207](https://leetcode.cn/problems/course-schedule/) | 课程表 | 中等 | BFS 拓扑排序判断有无环 |
| [210](https://leetcode.cn/problems/course-schedule-ii/) | 课程表 II | 中等 | 拓扑排序输出顺序 |
| [269](https://leetcode.cn/problems/alien-dictionary/) | 火星词典 | 困难 | 从单词顺序推导字符顺序，建图 + 拓扑排序 |
| [329](https://leetcode.cn/problems/longest-increasing-path-in-a-matrix/) | 矩阵中的最长递增路径 | 困难 | 拓扑排序 / 记忆化 DFS |
| [1462](https://leetcode.cn/problems/course-schedule-iv/) | 课程表 IV | 中等 | 拓扑排序 + 可达性传播 |

## 面试常问 & 怎么答

### BFS 拓扑排序和 DFS 后序拓扑排序怎么选？

BFS（Kahn 算法）更直观，能同时判断有无环（处理节点数 < 总数就有环），面试中优先用 BFS。DFS 后序需要额外维护状态检测环（三色标记），代码更复杂。

### 拓扑排序的结果唯一吗？

不唯一。如果某一步有多个入度为 0 的节点，选择不同节点会产生不同的拓扑序。如果要求字典序最小的拓扑序，把 Queue 换成 PriorityQueue。

## 看到什么就先想到这类

- "课程依赖/任务先后顺序"→ 拓扑排序
- "判断有向图是否有环"→ 拓扑排序（处理节点数 < 总数）
- "编译/构建顺序"→ 拓扑排序
- "从顺序推导关系"→ 建图 + 拓扑排序
