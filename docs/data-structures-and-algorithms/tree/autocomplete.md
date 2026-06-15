---
title: 搜索自动补全
---

# 搜索自动补全（LC642）— Trie + Top-K + 频次工程化

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
**Trie 存所有候选 + 每节点挂 Top-K 频次堆 + 在线热度更新**——这是搜索引擎、IDE 自动补全、IM @ 提示的统一底层。LC642 是面试压缩到 30 分钟的版本，会写它就能聊 Lucene、Elasticsearch suggester、谷歌搜索框、淘宝搜索栏。
:::

## 为什么单独讲它

自动补全是少数**算法（Trie + 堆 + 选型）+ 工程（拼音 / 模糊 / 排序）+ 产品（实时性 / 个性化）三层都能聊**的题。会 LC642 是底线；面试官加追问就开始考工程。

### 三层场景

| 场景 | 时延要求 | 候选规模 | 排序依据 |
|------|------|------|------|
| **IDE 自动补全**（VS Code）| < 50ms | 项目内 1w 标识符 | 词频 + 上下文 |
| **IM @ 提示** | < 100ms | 联系人 < 1000 | 频次 + 最近交互 |
| **搜索引擎建议** | < 200ms | 百亿 query | **多因子**：搜索量 + 实时热度 + 个性化 + 拼写纠正 |
| **电商搜索栏** | < 200ms | 商品库百万级 | 销量 + 个性化 + 类目偏好 |

## LC642 题目剖析

**题目**：设计自动补全系统，支持：
- `input(char c)`：用户输入一个字符（'#' 表示句子结束）
- 返回**当前已输入前缀**下、**热度 Top 3** 的历史句子
- 排序规则：**频次降序**，频次相同按字典序升序

```
历史：[("i love you", 5), ("island", 3), ("ironman", 2), ("i love leetcode", 2)]

input('i') → ["i love you", "island", "i love leetcode"]
input(' ') → ["i love you", "i love leetcode"]
input('a') → []
input('#') → []  且把 "i a" 这条句子频次 +1（首次出现频次 = 1）
```

## 数据结构设计

```
Trie 节点：
{
    children: Map<Character, TrieNode>,
    sentences: Map<String, Integer>,           // ★ 经过此节点的所有句子 → 频次
}
```

**关键决策**：每节点维护"经过的句子→频次"映射，搜索时遍历它再取 Top 3。

**为什么不在每节点存 Top-K 堆**：堆**写时维护贵**，但只有少数前缀真正被搜索。**惰性 Top-K**（搜索时才排序）实际比预先维护快。

## 完整代码（必背手撕）

```java
class AutocompleteSystem {
    private final TrieNode root = new TrieNode();
    private TrieNode currentNode = root;                // ★ 跟踪当前输入位置
    private StringBuilder currentInput = new StringBuilder();

    static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        Map<String, Integer> counts = new HashMap<>(); // 经过此节点的句子 → 频次
    }

    public AutocompleteSystem(String[] sentences, int[] times) {
        for (int i = 0; i < sentences.length; i++) {
            insert(sentences[i], times[i]);
        }
    }

    private void insert(String sentence, int count) {
        TrieNode node = root;
        for (char c : sentence.toCharArray()) {
            node = node.children.computeIfAbsent(c, k -> new TrieNode());
            node.counts.merge(sentence, count, Integer::sum);    // ★ 每个节点都记
        }
    }

    public List<String> input(char c) {
        if (c == '#') {                                         // 句子结束
            insert(currentInput.toString(), 1);                 // 入库 +1
            currentInput = new StringBuilder();
            currentNode = root;
            return List.of();
        }

        currentInput.append(c);
        if (currentNode != null) {
            currentNode = currentNode.children.get(c);          // ★ 沿 Trie 下走
        }
        if (currentNode == null) return List.of();              // 无候选

        // ★ Top 3：频次降序，相同按字典序升序
        return currentNode.counts.entrySet().stream()
            .sorted((a, b) -> {
                if (!a.getValue().equals(b.getValue())) {
                    return b.getValue() - a.getValue();          // 频次降
                }
                return a.getKey().compareTo(b.getKey());         // 字典升
            })
            .limit(3)
            .map(Map.Entry::getKey)
            .toList();
    }
}
```

**复杂度**：
- `input(c)`：O(K)，K = 当前前缀下的候选数；排序 O(K log K)
- 空间：O(总字符数 × 句子数)（每节点都记句子）

## 工程优化：Top-K 大顶堆 vs Trie 节点存 Top-K

| 方案 | 写时 | 读时 | 适合 |
|------|------|------|------|
| **每节点存所有句子**（上面）| O(L) 插入 | O(K log K) 排序 | LC642，候选数 < 100 |
| **每节点维护 Top-K 堆** | O(L log K) 插入 | **O(K)** 直接读 | 候选数巨大、读多写少 |
| **离线全量预排序** | 离线 | **O(1)** 读 | Lucene Suggester、Elasticsearch |

**生产推荐**：**预排序 + Trie**——写时全量重建 Top-K 列表（小时级离线 job），读时直接拿。

### Top-K 堆维护写法

```java
class TrieNodeOptimized {
    Map<Character, TrieNode> children = new HashMap<>();
    // ★ 维护 Top-K 句子（PriorityQueue 小顶堆，size = K）
    PriorityQueue<Entry> topK;
    Map<String, Integer> counts = new HashMap<>();          // 全量频次还要记

    void addSentence(String s, int delta) {
        int newCount = counts.merge(s, delta, Integer::sum);
        // 更新 topK：如果堆里有这条句子，更新；否则比较是否进堆
        // ... （省略 50 行边界处理）
    }
}
```

**代价**：插入时间从 O(L) → O(L log K)。**收益**：读取 O(K) 而非 O(N log K)，N=该前缀下所有候选数。**只在候选规模巨大时值**。

## 工业级搜索建议系统

LC642 是玩具版。真实搜索框（Google / 百度 / 淘宝）要解决：

### 1. 拼音 / 首字母匹配

中文搜索"shouji" → 手机、淘宝 → "tb" 对应淘宝

```java
// 索引时同时存：原词、全拼、首字母
trie.insert("淘宝");                  // 原词
trie.insert("taobao");                // 全拼
trie.insert("tb");                    // 首字母
// 都指向同一商品 ID
```

**实现**：HanLP / Pinyin4j 转拼音，建多个 Trie 或合并到一个 Trie。

### 2. 模糊匹配（错字纠正）

"shoji" 应该返回 "手机"（少了个 u）

| 算法 | 原理 | 适用 |
|------|------|------|
| **编辑距离 Trie**（Levenshtein automaton）| 在 Trie 上同时维护编辑距离 | 工业标配 |
| **DFA（确定性有限自动机）**| 预编译错字模式 | Lucene 内部 |
| **BK 树** | 按编辑距离组织字典 | 词典纠错 |
| **拼写检查神经网络** | 端到端学习 | 谷歌 2018+ |

### 3. 个性化（千人千面）

同样输入"apple"，年轻人想要 iPhone，妈妈想要水果。

| 信号 | 权重 |
|------|------|
| 用户历史搜索 | 高 |
| 类目偏好 | 高 |
| 地理位置 | 中（"附近"）|
| 时间（早上/晚上）| 低 |
| 实时点击 | 高 |

**实现**：Trie 召回 Top 100 → 在线模型（LR / GBDT / DNN）重排 Top 10。

### 4. 实时热度

突发热搜（"周杰伦演唱会"）必须**秒级**进入候选。

```
        ┌──────────────────────────┐
   ──── │  Kafka（实时点击/搜索流）│ ────
        └──────────┬───────────────┘
                   │
        ┌──────────▼───────────────┐
        │  Flink（按 query 聚合） │   ← 每分钟更新一次频次
        └──────────┬───────────────┘
                   │
        ┌──────────▼───────────────┐
        │  Redis ZSet 热度榜       │   ← 在线读
        └──────────────────────────┘
```

**热度衰减**：频次按时间衰减（衰减系数 0.95/小时），昨天的热搜不再压榜。

### 5. 高可用与性能

| 维度 | 方案 |
|------|------|
| **召回时延** | Trie 全内存，**单次召回 < 5ms** |
| **海量数据** | 分片 Trie（按首字母 / hash 分 16 片）|
| **离线全量** | 每日凌晨重建 Trie 全量 |
| **在线增量** | Kafka 实时流增量更新热度 |
| **降级** | Trie 故障降到 ES suggester 兜底 |

## 业界实现对比

| 系统 | 算法 | 特点 |
|------|------|------|
| **Lucene SuggestComponent** | FST (Finite State Transducer) | 极致空间压缩，离线构建 |
| **Elasticsearch Completion Suggester** | FST + 内存 | 全内存，毫秒级 |
| **Redis ZSet** | 跳表 + 字典 | 实时排行，按 score 取 Top-K |
| **谷歌搜索框** | 多级缓存 + ML 排序 | 千人千面 + 错字 + 实时 |
| **VS Code IntelliSense** | Trie + Frecency（频次 × 最近）| 项目内 |
| **HanLP / Pinyin4j** | Trie + 拼音转换 | 中文场景标配 |

### Lucene FST 一句话

**FST（Finite State Transducer）= 把 Trie 后缀共享压缩成 DAG**。同样存 1w 词的字典：
- Trie：约 5MB
- FST：约 500KB（**10x 压缩**）

代价是构建慢（一次性离线），查询同样快（O(L)）。**Elasticsearch 倒排索引的 term dictionary 就用 FST**。

## 关键陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| Trie 每节点存所有句子 | 内存炸（1w 句子 × 平均长度 20 = 20w 字符 × 多份）| 长前缀只在叶子存，或用 FST |
| Top-K 排序用 `sort()` | O(K log K) | **PriorityQueue 维护 Top-K，O(K log 3) = O(K)** |
| 频次相同按插入顺序 | 不稳定，用户感受混乱 | **明确字典序兜底**（LC642 也要求）|
| 不做拼音 | 中文搜索体验差 | 同时建拼音 / 首字母 Trie |
| 没有衰减 | 老热搜永远占位 | 频次 × `decay^age` |
| 召回完直接返回 | 没有个性化 / 重排 | Trie 召回 100 → ML 排序 10 |
| 实时热搜更新慢 | 突发事件 30 分钟才显示 | Kafka + Flink **分钟级** |

## 复杂度

| 操作 | 朴素 | Top-K 堆 | FST |
|------|------|------|------|
| 插入 | O(L) | O(L log K) | 离线 |
| 查询 | O(K log K) | **O(K)** | O(L) |
| 空间 | O(总字符 × 句子数) | O(总字符 × K) | **极省（10x 压缩）** |

L = 句子长度，K = Top-K 大小，N = 候选数。

## 面试常问 & 怎么答

### 为什么用 Trie 不用 HashMap

HashMap 只能精确匹配，**Trie 天然支持前缀匹配**——这正是自动补全的本质。每次输入字符 O(1) 沿子节点下走，已扫到的子树就是所有候选。

### Top-K 怎么取，为什么不用 sort

`sort` 是 O(K log K)，候选大时慢。**PriorityQueue 维护大小 K 的小顶堆**：遍历候选，堆未满直接 offer，满了和堆顶比，只有 > 堆顶才替换——O(N log K)。K=3 时几乎是 O(N)。

### 候选数极大时怎么办

**每节点维护 Top-K 列表**（写时 O(L log K) 维护）。但更工业的方案是**离线全量预构建 + Lucene FST 压缩**，读时 O(L) 拿现成的，全量重建每天一次。

### 中文搜索怎么处理

**索引时拆三份**：原词、全拼（HanLP/Pinyin4j 转）、首字母。三份都进 Trie，指向同一 ID。查询时根据用户输入类型路由到对应 Trie。

### 怎么纠正错字

**Levenshtein automaton + Trie**：在 Trie DFS 时同时维护编辑距离，距离 < 阈值的都召回。Lucene FuzzyQuery 内部就是这么干的。简单场景可以用 BK 树。

### 实时热搜怎么做

**Lambda 架构**：离线 Trie（每日重建全量频次）+ Redis ZSet（Kafka/Flink 分钟级聚合实时点击）。召回时双源合并，热搜立刻进入候选。

### LC642 频次相同时怎么排

**字典序升序**。一般人会忘，要主动说出来——`(a, b) -> a.equals(b) ? a.compareTo(b) : b - a`。

## 看到什么就先想到这类

| 信号 | 套用 |
|------|------|
| 前缀匹配 + 多结果 | Trie |
| Top-K + 频次 / 热度 | Trie 节点存 Top-K 或 PriorityQueue |
| 中文输入 | 拼音 / 首字母多 Trie |
| 错字容错 | Levenshtein Trie / FuzzyQuery |
| 海量字典内存吃紧 | FST 压缩（Lucene/ES）|
| 实时热搜 | Lambda：离线 Trie + Redis ZSet |
| 千人千面 | Trie 召回 + ML 排序 |
| IDE 标识符补全 | 项目内 Trie + Frecency（频次 × 最近）|
