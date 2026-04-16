---
title: Trie 字典树
---

# Trie 字典树

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Trie 用树结构显式存储字符串前缀。凡是出现“前缀匹配、词典检索、字符串集合统计”，Trie 都是很典型的建模方式。
:::

## 为什么用 Trie

- 哈希表适合整词查找。
- Trie 更适合前缀查找与按字符逐层匹配。

## 典型应用

| 场景 | 说明 |
|------|------|
| 前缀检索 | 判断某个前缀是否存在 |
| 单词统计 | 统计以某前缀开头的单词数 |
| 字典匹配 | 自动补全、敏感词过滤 |

## 代表题型

- 实现 Trie。
- 单词搜索 II。
- 替换单词。