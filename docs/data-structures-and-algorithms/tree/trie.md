---
title: Trie 字典树
---

# Trie 字典树

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Trie 用树结构存储字符串前缀，每条边对应一个字符。凡是涉及"前缀匹配、词典检索、字符串集合查询"，Trie 都优于 HashSet/HashMap。核心操作只有 insert、search、startsWith 三个。
:::

## 核心思路

**什么时候用 Trie？**
- 前缀匹配查询（判断是否有以某前缀开头的单词）
- 单词集合查询（比 HashSet 更省空间，共享前缀）
- 自动补全、敏感词过滤
- 结合 DFS 在矩阵中搜索多个单词

**Trie vs HashMap：** HashMap 只能整词查找 O(L)，不支持前缀查询。Trie 支持前缀查询，且多个单词共享前缀节点，空间更优。

## Trie 实现模板

```java
class Trie {
    private Trie[] children = new Trie[26];
    private boolean isEnd = false;

    // 插入单词
    public void insert(String word) {
        Trie node = this;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) {
                node.children[i] = new Trie();
            }
            node = node.children[i];
        }
        node.isEnd = true;
    }

    // 查找单词是否存在
    public boolean search(String word) {
        Trie node = searchPrefix(word);
        return node != null && node.isEnd;
    }

    // 查找是否有以 prefix 开头的单词
    public boolean startsWith(String prefix) {
        return searchPrefix(prefix) != null;
    }

    private Trie searchPrefix(String prefix) {
        Trie node = this;
        for (char c : prefix.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) return null;
            node = node.children[i];
        }
        return node;
    }
}
```

**要点：** `children[26]` 对应 26 个小写字母。`isEnd` 标记是否有单词在此结束。如果字符集不只是小写字母，可以用 `HashMap<Character, Trie>` 代替数组。

## 例题 1：[实现 Trie（LeetCode 208）](https://leetcode.cn/problems/implement-trie-prefix-tree/)

### 题目描述

实现 Trie 类，支持 `insert(word)`、`search(word)` 和 `startsWith(prefix)` 三个操作。

### 思路分析

1. 每个节点包含 26 个子节点指针和一个结束标记
2. insert：沿字符路径走，没有则创建，最后标记结束
3. search：沿字符路径走，到达末尾且 isEnd 为 true
4. startsWith：沿字符路径走，能走到末尾即可

### 完整代码

```java
class Trie {
    private Trie[] children = new Trie[26];
    private boolean isEnd = false;

    public void insert(String word) {
        Trie node = this;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) {
                node.children[i] = new Trie();
            }
            node = node.children[i];
        }
        node.isEnd = true;
    }

    public boolean search(String word) {
        Trie node = searchPrefix(word);
        return node != null && node.isEnd;
    }

    public boolean startsWith(String prefix) {
        return searchPrefix(prefix) != null;
    }

    private Trie searchPrefix(String prefix) {
        Trie node = this;
        for (char c : prefix.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) return null;
            node = node.children[i];
        }
        return node;
    }
}
```

### 复杂度分析

- **时间**：每个操作 O(L)，L 为字符串长度
- **空间**：O(T)，T 为所有插入字符串的字符总数

## 例题 2：[单词搜索 II（LeetCode 212）](https://leetcode.cn/problems/word-search-ii/)

### 题目描述

给定 m×n 字符网格 `board` 和单词列表 `words`，返回所有同时在网格和列表中出现的单词。单词必须按相邻单元格的字母顺序构成，同一单元格不能重复使用。

### 思路分析

1. 把所有单词插入 Trie
2. 从网格每个位置出发 DFS，沿 Trie 路径搜索
3. 走到 isEnd 为 true 的节点时，收集该单词
4. 剪枝：Trie 中没有对应子节点就不继续搜索

### 完整代码

```java
class Solution {
    private List<String> result = new ArrayList<>();
    private char[][] board;
    private int m, n;

    public List<String> findWords(char[][] board, String[] words) {
        this.board = board;
        m = board.length;
        n = board[0].length;

        // 构建 Trie
        Trie root = new Trie();
        for (String word : words) root.insert(word);

        // 从每个位置出发 DFS
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                dfs(i, j, root, new StringBuilder());
            }
        }
        return result;
    }

    private void dfs(int i, int j, Trie node, StringBuilder sb) {
        if (i < 0 || i >= m || j < 0 || j >= n) return;
        char c = board[i][j];
        if (c == '#' || node.children[c - 'a'] == null) return;

        node = node.children[c - 'a'];
        sb.append(c);

        if (node.isEnd) {
            result.add(sb.toString());
            node.isEnd = false;  // 避免重复收集
        }

        board[i][j] = '#';  // 标记已访问
        dfs(i + 1, j, node, sb);
        dfs(i - 1, j, node, sb);
        dfs(i, j + 1, node, sb);
        dfs(i, j - 1, node, sb);
        board[i][j] = c;    // 恢复
        sb.deleteCharAt(sb.length() - 1);
    }
}

class Trie {
    Trie[] children = new Trie[26];
    boolean isEnd = false;

    void insert(String word) {
        Trie node = this;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) node.children[i] = new Trie();
            node = node.children[i];
        }
        node.isEnd = true;
    }
}
```

### 复杂度分析

- **时间**：O(m × n × 4^L)，L 为最长单词长度，Trie 剪枝大幅减少实际搜索量
- **空间**：O(T + L)，T 为 Trie 节点数，L 为递归深度

## 推荐练习

| 题号 | 题名 | 难度 | 一句话提示 |
|------|------|------|------|
| [208](https://leetcode.cn/problems/implement-trie-prefix-tree/) | 实现 Trie | 中等 | Trie 基础实现，必须会写 |
| [211](https://leetcode.cn/problems/design-add-and-search-words-data-structure/) | 添加与搜索单词 | 中等 | Trie + DFS 处理通配符 `.` |
| [648](https://leetcode.cn/problems/replace-words/) | 单词替换 | 中等 | Trie 查找最短前缀 |
| [720](https://leetcode.cn/problems/longest-word-in-dictionary/) | 词典中最长的单词 | 中等 | Trie + BFS/DFS 找可逐步构建的最长词 |
| [14](https://leetcode.cn/problems/longest-common-prefix/) | 最长公共前缀 | 简单 | 可用 Trie，也可直接比较 |

## 面试常问 & 怎么答

### Trie 的空间复杂度怎么样？

每个节点有 26 个指针，如果单词集合稀疏会浪费空间。优化方式：用 HashMap 代替固定数组，或使用压缩 Trie（合并只有一个子节点的路径）。实际面试中用数组实现即可。

### Trie 和 HashMap 分别什么时候用？

只需要整词查找用 HashMap（O(1) 查找）。需要前缀查询用 Trie。需要在大量字符串中找公共前缀、自动补全、按字典序遍历时 Trie 更合适。

## 看到什么就先想到这类

- "前缀匹配 / startsWith"→ Trie
- "单词搜索 / 矩阵中找多个单词"→ Trie + DFS
- "自动补全 / 字典查找"→ Trie
- "最长公共前缀"→ Trie / 直接比较
