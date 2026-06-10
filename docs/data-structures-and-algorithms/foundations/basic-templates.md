---
title: 基础算法模板
---

# 基础算法模板

<span class="dig-tag dig-tag--category">基础知识</span> <span class="dig-tag dig-tag--easy">⭐ 入门</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
本页收录 **面试和刷题最高频的 10 个基础模板**：二分查找、双指针、滑动窗口、前缀和/差分、单调栈、BFS、DFS、回溯、并查集、拓扑排序。**记不住没关系，但要做到"看到题目特征 → 30 秒内联想到模板"**。所有代码都用 Java，可直接复制使用。需要 KMP / 线段树 / 树状数组 等更高阶模板请看 [高阶算法模板](./advanced-templates)。
:::

## 一图速查：什么时候用哪个模板

```
有序数组 / 答案有单调性             → 二分查找（O(log n)）
头尾或快慢指针扫描                  → 双指针（O(n)）
连续子数组/子串的极值                → 滑动窗口（O(n)）
区间和反复查询                      → 前缀和 / 差分（O(1) 查询）
找"下一个更大/更小"                 → 单调栈（O(n)）
最短路径 / 最少步数 / 层序遍历       → BFS（O(V+E)）
连通性 / 遍历整个图 / 拓扑           → DFS（O(V+E)）
"所有方案 / 全排列 / 组合"           → 回溯（O(指数)）
集合合并查询是否同组                 → 并查集（α(n) 近 O(1)）
任务依赖排序 / 有向无环图            → 拓扑排序（O(V+E)）
```

| 模板 | 时间复杂度 | 识别信号 | 典型题 |
|------|----------|--------|--------|
| **二分查找** | O(log n) | 有序 / 答案区间有单调性 | 搜索旋转排序数组、第 K 小 |
| **双指针** | O(n) | 两端逼近 / 快慢扫描 | 三数之和、移除元素、链表中环 |
| **滑动窗口** | O(n) | 连续子数组/子串极值 | 最长无重复子串、最小覆盖子串 |
| **前缀和 / 差分** | O(n) 预处理 + O(1) 查询 | 区间和反复查 | 区间和为 K、矩阵区域和 |
| **单调栈** | O(n) | "下一个更大/更小" | 每日温度、接雨水、柱状图最大矩形 |
| **BFS** | O(V+E) | 最短/最少 / 层序 | 二叉树层序、岛屿最近距离、最少步数 |
| **DFS** | O(V+E) | 走完全部 / 连通分量 | 岛屿数量、路径总和、克隆图 |
| **回溯** | O(指数) | 全排列 / 所有组合 / 棋盘 | 全排列、子集、N 皇后 |
| **并查集** | O(α(n)) ≈ O(1) | 合并 + 同组判断 | 朋友圈、冗余连接 |
| **拓扑排序** | O(V+E) | 依赖顺序 / DAG | 课程表、任务调度 |

---

## 二分查找

### 识别信号

- 数组 / 答案 **有序** 或 **答案区间有单调性**
- 数据规模 ≥ 10⁵，O(n) 还不够，要 O(log n)
- 出现"找第一个 / 最后一个满足条件的位置"

### 模板代码（Java）—— 闭区间写法

```java
// 标准二分：找 target 的位置；找不到返回 -1
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;          // [left, right] 闭区间
    while (left <= right) {
        int mid = left + (right - left) / 2;        // 防溢出
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

// 找第一个 >= target 的位置（lower_bound）
public int lowerBound(int[] nums, int target) {
    int left = 0, right = nums.length;              // [left, right) 半开
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] >= target) right = mid;
        else left = mid + 1;
    }
    return left;                                    // 找不到返回 nums.length
}
```

### 二分答案模板（数据范围 → 答案空间）

```java
// 例：在 [lo, hi] 内找到满足 check(x) 的最小 x
int lo = 1, hi = max;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (check(mid)) hi = mid;                       // 可以更小
    else lo = mid + 1;                              // 必须更大
}
return lo;
```

### 典型坑

- `(left + right) / 2` 在 left/right 都很大时溢出，必用 `left + (right - left) / 2`
- 闭/开区间写法**不能混用**，确定一种用熟
- 死循环：`while (left < right)` 配 `left = mid` 时必然死循环

---

## 双指针

### 识别信号

- 有序数组找两数 / 三数之和
- "原地修改" 删除 / 去重 / 移动
- 链表找中点 / 判断环 → **快慢指针**

### 模板代码

#### 对撞指针（两端逼近）

```java
public int[] twoSum(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return new int[]{left, right};
        else if (sum < target) left++;
        else right--;
    }
    return new int[]{-1, -1};
}
```

#### 快慢指针（原地修改）

```java
// 去除重复元素，返回新长度
public int removeDuplicates(int[] nums) {
    int slow = 0;
    for (int fast = 1; fast < nums.length; fast++) {
        if (nums[fast] != nums[slow]) {
            slow++;
            nums[slow] = nums[fast];
        }
    }
    return slow + 1;
}
```

#### 链表判环（Floyd 龟兔赛跑）

```java
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}
```

---

## 滑动窗口

### 识别信号

- "**连续** 子数组 / 子串" 的最长 / 最短 / 最大 / 最小
- 字符串中 "覆盖所有字符" / "无重复" / "至多 K 个"

### 模板代码（万能框架）

```java
public int slidingWindow(String s) {
    Map<Character, Integer> window = new HashMap<>();
    int left = 0, right = 0;
    int result = 0;

    while (right < s.length()) {
        char c = s.charAt(right);
        right++;
        // ① 加入窗口的更新
        window.merge(c, 1, Integer::sum);

        // ② 判断窗口是否需要收缩
        while (/* 窗口不满足条件 */) {
            char d = s.charAt(left);
            left++;
            // ③ 离开窗口的更新
            window.merge(d, -1, Integer::sum);
            if (window.get(d) == 0) window.remove(d);
        }

        // ④ 更新答案（位置看求最长还是最短）
        result = Math.max(result, right - left);
    }
    return result;
}
```

### 典型例：最长无重复子串

```java
public int lengthOfLongestSubstring(String s) {
    Set<Character> window = new HashSet<>();
    int left = 0, max = 0;
    for (int right = 0; right < s.length(); right++) {
        while (window.contains(s.charAt(right))) {
            window.remove(s.charAt(left++));
        }
        window.add(s.charAt(right));
        max = Math.max(max, right - left + 1);
    }
    return max;
}
```

---

## 前缀和 / 差分

### 识别信号

- 多次询问 "区间 `[l, r]` 的和" → 前缀和
- 多次操作 "区间 `[l, r]` 都加 `v`" → 差分
- 二维：矩阵子区域和 → 二维前缀和

### 一维前缀和

```java
int n = nums.length;
int[] prefix = new int[n + 1];                      // prefix[0] = 0
for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];

// 查询 [l, r] 区间和（闭区间）—— O(1)
int sum = prefix[r + 1] - prefix[l];
```

### 一维差分

```java
// 原数组 a，构造差分数组 d：d[i] = a[i] - a[i-1]
int[] d = new int[n + 1];
for (int i = 0; i < n; i++) d[i + 1] = nums[i] - (i == 0 ? 0 : nums[i - 1]);

// 区间 [l, r] 每个元素 +v —— O(1)
d[l] += v;
d[r + 1] -= v;

// 还原：a[i] = d[0] + d[1] + ... + d[i]
int[] result = new int[n];
result[0] = d[0];
for (int i = 1; i < n; i++) result[i] = result[i - 1] + d[i];
```

### 二维前缀和（矩阵子区域和）

```java
int[][] prefix = new int[m + 1][n + 1];
for (int i = 0; i < m; i++)
    for (int j = 0; j < n; j++)
        prefix[i + 1][j + 1] = prefix[i][j + 1] + prefix[i + 1][j] - prefix[i][j] + matrix[i][j];

// 查询子矩阵 (r1, c1) - (r2, c2) 的和
int sum = prefix[r2 + 1][c2 + 1] - prefix[r1][c2 + 1] - prefix[r2 + 1][c1] + prefix[r1][c1];
```

---

## 单调栈

### 识别信号

- "下一个更大/更小元素"
- "柱状图最大矩形"、"接雨水"、"每日温度"
- 需要在 O(n) 内维护一组"单调"元素

### 模板代码

```java
// 求每个元素右边第一个更大元素的下标；不存在则 -1
public int[] nextGreater(int[] nums) {
    int n = nums.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    Deque<Integer> stack = new ArrayDeque<>();      // 栈里存下标
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            res[stack.pop()] = i;
        }
        stack.push(i);
    }
    return res;
}
```

**记忆口诀**：找右侧第一个更大用**单调递减栈**（递减破时弹出并结算），找右侧第一个更小用**单调递增栈**。

---

## BFS（广度优先搜索）

### 识别信号

- 最短路径 / 最少步数 / 最少操作
- 二叉树层序遍历
- 多源最近距离（如腐烂橘子）

### 模板代码（图 / 二维网格）

```java
public int bfs(int[][] grid, int sr, int sc) {
    int m = grid.length, n = grid[0].length;
    int[][] dirs = {{-1,0},{1,0},{0,-1},{0,1}};
    Queue<int[]> queue = new ArrayDeque<>();
    boolean[][] visited = new boolean[m][n];

    queue.offer(new int[]{sr, sc});
    visited[sr][sc] = true;
    int step = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();                    // ★ 分层处理：当前层节点数
        for (int i = 0; i < size; i++) {
            int[] cur = queue.poll();
            // if (满足终点条件) return step;
            for (int[] d : dirs) {
                int nx = cur[0] + d[0], ny = cur[1] + d[1];
                if (nx < 0 || nx >= m || ny < 0 || ny >= n) continue;
                if (visited[nx][ny] || grid[nx][ny] == 1) continue;
                visited[nx][ny] = true;
                queue.offer(new int[]{nx, ny});
            }
        }
        step++;
    }
    return -1;
}
```

---

## DFS（深度优先搜索）

### 识别信号

- 走遍所有 / 连通分量 / 树的所有路径
- 不要求最短，只要"能不能到达 / 多少种走法"

### 模板代码（递归式）

```java
public void dfs(int[][] grid, int i, int j, boolean[][] visited) {
    int m = grid.length, n = grid[0].length;
    if (i < 0 || i >= m || j < 0 || j >= n) return;
    if (visited[i][j] || grid[i][j] == 0) return;
    visited[i][j] = true;
    dfs(grid, i + 1, j, visited);
    dfs(grid, i - 1, j, visited);
    dfs(grid, i, j + 1, visited);
    dfs(grid, i, j - 1, visited);
}

// 调用：统计岛屿数量
public int numIslands(int[][] grid) {
    int count = 0;
    boolean[][] visited = new boolean[grid.length][grid[0].length];
    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == 1 && !visited[i][j]) {
                dfs(grid, i, j, visited);
                count++;
            }
        }
    }
    return count;
}
```

**栈式 DFS**（递归层数太深爆栈时用）：把递归改成 `Deque<int[]>` 显式栈即可。

---

## 回溯（Backtracking）

### 识别信号

- "所有 / 全部 / 列举出 ..." 排列、组合、子集
- N 皇后、数独、单词搜索

### 模板代码（万能框架）

```java
List<List<Integer>> result = new ArrayList<>();

public void backtrack(int[] nums, List<Integer> path, boolean[] used) {
    if (path.size() == nums.length) {               // ① 结束条件
        result.add(new ArrayList<>(path));          // ★ 深拷贝
        return;
    }
    for (int i = 0; i < nums.length; i++) {         // ② 选择列表
        if (used[i]) continue;
        // 剪枝：去重时一般加 if (i > 0 && nums[i]==nums[i-1] && !used[i-1]) continue;
        path.add(nums[i]);                          // ③ 做选择
        used[i] = true;
        backtrack(nums, path, used);                // ④ 递归
        path.remove(path.size() - 1);               // ⑤ 撤销选择
        used[i] = false;
    }
}
```

**记忆**：**做选择 → 递归 → 撤销选择**，三件套缺一不可。

---

## 并查集（Union-Find / DSU）

### 识别信号

- "判断两点是否连通 / 同组"
- "动态合并集合"（朋友圈、冗余连接、岛屿数量 II）
- Kruskal 最小生成树

### 模板代码（路径压缩 + 按秩合并）

```java
class UnionFind {
    int[] parent, rank;
    int count;                                      // 连通分量数

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    public int find(int x) {                        // 路径压缩
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    public boolean union(int x, int y) {            // 按秩合并
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank[px] < rank[py]) { parent[px] = py; }
        else if (rank[px] > rank[py]) { parent[py] = px; }
        else { parent[py] = px; rank[px]++; }
        count--;
        return true;
    }
}
```

**复杂度**：单次操作 O(α(n))，n ≤ 10⁹ 时 α(n) ≤ 4，**可视作 O(1)**。

---

## 拓扑排序（Kahn 算法 / BFS 版）

### 识别信号

- "**有依赖** 顺序" 排课、任务调度、编译依赖
- 输入是 DAG（有向无环图），要么求顺序，要么判环

### 模板代码

```java
public int[] topoSort(int n, int[][] edges) {
    List<List<Integer>> g = new ArrayList<>();
    for (int i = 0; i < n; i++) g.add(new ArrayList<>());
    int[] inDeg = new int[n];
    for (int[] e : edges) {                         // e: [from, to]
        g.get(e[0]).add(e[1]);
        inDeg[e[1]]++;
    }

    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (inDeg[i] == 0) queue.offer(i);

    int[] order = new int[n];
    int idx = 0;
    while (!queue.isEmpty()) {
        int cur = queue.poll();
        order[idx++] = cur;
        for (int next : g.get(cur)) {
            if (--inDeg[next] == 0) queue.offer(next);
        }
    }

    if (idx < n) return new int[0];                 // 有环
    return order;
}
```

---

## 面试怎么用这页

1. **看到题先识别信号**：把题目关键词（"连续"、"最短"、"所有方案"、"区间和"、"下一个更大" ...）映射到模板。
2. **先讲思想再写代码**：面试官想听你为什么用这个模板，不是要你默写 50 行 Java。
3. **能讲清复杂度**：每个模板都有明确的复杂度，能算出来才能选对。
4. **写代码先写注释框架**：比如二分先写 "闭区间 [l, r]"、滑窗先写 "扩张 / 收缩 / 更新"。
5. **跑两个小例子手推**：尤其是边界（空数组、单元素、target 在端点）。

---

## 看到什么就先想到这类

| 题目特征 | 第一时间想到 |
|---------|------------|
| **有序数组找元素 / 位置** | 二分查找 |
| **"答案有单调性"**（猜答案 + 验证）| 二分答案 |
| **两数之和 (有序) / 三数之和** | 对撞双指针 |
| **链表找中点 / 判环 / 倒数第 K** | 快慢指针 |
| **最长无重复子串 / 最小覆盖子串** | 滑动窗口 |
| **区间和反复查询 (静态)** | 一维前缀和 |
| **区间加 + 最终结果** | 差分数组 |
| **下一个更大 / 接雨水 / 柱状图** | 单调栈 |
| **最短路径 / 最少步数** | BFS |
| **岛屿数量 / 连通分量** | DFS 或并查集 |
| **全排列 / 子集 / N 皇后** | 回溯 |
| **判断两点连通 / 朋友圈** | 并查集 |
| **任务依赖排序 / 课程表** | 拓扑排序 |
| **字符串匹配 / 最长回文** | 见 [高阶算法模板](./advanced-templates) — KMP / Manacher |
| **区间改 + 区间查** | 见 [高阶算法模板](./advanced-templates) — 树状数组 / 线段树 |

---

## 关联章节

- [算法技巧](./algorithm-patterns) — 题目特征到方法的映射总表
- [一般流程](./problem-solving-workflow) — 做题的固定顺序
- [高阶算法模板](./advanced-templates) — KMP / Manacher / 树状数组 / 线段树
- [Java 环境配置](./java-problem-solving-basics) — Java 输入输出 / 集合 API
- [数组与字符串](../arrays/) — 二分 / 双指针 / 滑窗 / 前缀和 专题题集
- [图与搜索](../graph-search/) — BFS / DFS / 拓扑 / 并查集 专题题集
