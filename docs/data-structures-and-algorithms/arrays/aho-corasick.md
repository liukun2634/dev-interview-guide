---
title: AC 自动机
---

# AC 自动机（Aho-Corasick）— 敏感词过滤的工业标配

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
AC 自动机 = **Trie + KMP 的 fail 指针**，解决"**在一段文本里同时找 N 个模式串**"问题。一次扫描 O(n + m + z)，n=文本长、m=模式串总长、z=匹配次数。**敏感词过滤、IDS 入侵检测、爬虫黑名单、广告关键词命中都用它**，是后端 + 安全岗位的必懂算法。
:::

## 为什么单独讲它

### 朴素方案的痛

「N 个敏感词，扫一段文本判断有没有命中」——大多数人第一反应：
- **N 次 KMP**：O(N × (n+m))，每个词扫一遍。词库 10w 条、文本 1KB → 1 亿次操作，**单条评论审核要秒级**
- **正则 `|` 拼接**：O(N × n) 退化，且词太多正则编译都崩
- **Trie 暴力**：每次从文本不同起点出发走 Trie，O(n × maxLen) 仍然慢

### AC 自动机的精髓

**Trie 提供"多模式共享前缀"，fail 指针提供"失配后不退到起点的捷径"**——一次扫描就把所有命中找出来。复杂度 O(n + m + z)，**跟模式串数量 N 无关**。

| 方案 | 预处理 | 单次查询 | 适用 |
|------|------|------|------|
| N 次 KMP | O(m) | O(N × n) | 极少量模式串 |
| Trie 暴力 | O(m) | O(n × maxLen) | 模式串短 + 文本少 |
| **AC 自动机** | **O(m)** | **O(n + z)** | **生产首选** |
| Bloom Filter + 二次验证 | O(m) | 概率算法 | 海量模式串 + 容忍误判 |

## 三步构建

### Step 1：建 Trie

把所有模式串插入 Trie，叶子节点标记"这是某个模式串的结尾"。

```
模式串：{ "he", "she", "his", "hers" }

       root
        │
   ┌────┴────┐
   h         s
   │         │
   e[*]      h
   │         │
   r         e[*]
   │
   s[*]

         h
         │
         i
         │
         s[*]

[*] 表示该节点是某模式串的终点
```

### Step 2：构建 fail 指针（核心难点）

`fail[u]` = "**u 节点代表的字符串的最长后缀，且这个后缀也是 Trie 中某个前缀**"——KMP 的 next 数组在 Trie 上的推广。

**BFS 层序构建**：

```
- root 的 fail 指向 root 自己
- root 的所有孩子的 fail 都指向 root
- 对于其它节点 u（父节点 p，走 'c' 字符到达 u）：
  - 沿 p.fail 一路往上找
  - 第一个有 'c' 子节点的祖先 q，u.fail = q.children['c']
  - 一路找不到 → u.fail = root
```

### Step 3：匹配 = 在自动机上"边走边跳"

```
text 指针 i 从 0 走到末尾，AC 节点 curr 从 root 开始：
  while curr 没有 text[i] 的孩子 且 curr != root:
      curr = curr.fail               ← 失配跳转
  curr = curr.children[text[i]]      ← 接受字符前进
  收集 curr 节点（沿 fail 链）的所有终止标记 → 命中模式串
```

## 完整代码（推荐 BFS 构建版）

```java
class AhoCorasick {
    static class Node {
        Map<Character, Node> children = new HashMap<>();
        Node fail;
        List<String> output = new ArrayList<>();      // ★ 这里收集所有以本节点结尾的模式串
    }

    private final Node root = new Node();

    /** 1) 插入所有模式串到 Trie */
    public void addPattern(String pattern) {
        Node curr = root;
        for (char c : pattern.toCharArray()) {
            curr = curr.children.computeIfAbsent(c, k -> new Node());
        }
        curr.output.add(pattern);
    }

    /** 2) BFS 构建 fail 指针 */
    public void build() {
        Queue<Node> queue = new ArrayDeque<>();
        for (Node child : root.children.values()) {
            child.fail = root;                        // ★ 一级节点的 fail 都指 root
            queue.offer(child);
        }
        while (!queue.isEmpty()) {
            Node u = queue.poll();
            for (Map.Entry<Character, Node> e : u.children.entrySet()) {
                char c = e.getKey();
                Node v = e.getValue();

                // ★ 沿父节点的 fail 链找有 'c' 子节点的祖先
                Node f = u.fail;
                while (f != null && !f.children.containsKey(c)) f = f.fail;
                v.fail = (f == null) ? root : f.children.get(c);

                // ★ 合并 fail 节点的 output（这样匹配时不用沿 fail 链收集）
                v.output.addAll(v.fail.output);
                queue.offer(v);
            }
        }
    }

    /** 3) 在 text 中查找所有命中 */
    public List<int[]> search(String text) {
        List<int[]> matches = new ArrayList<>();      // [endPos, patternIdx] 或自定义
        Node curr = root;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            // ★ 失配则跳 fail，直到找到能走的孩子或回到 root
            while (curr != root && !curr.children.containsKey(c)) curr = curr.fail;
            if (curr.children.containsKey(c)) curr = curr.children.get(c);
            // 收集命中
            for (String pat : curr.output) {
                matches.add(new int[]{i - pat.length() + 1, i});
            }
        }
        return matches;
    }
}

// 用法
AhoCorasick ac = new AhoCorasick();
ac.addPattern("he"); ac.addPattern("she"); ac.addPattern("his"); ac.addPattern("hers");
ac.build();
ac.search("ahishers");  // 命中: his[1,3], she[3,5], he[4,5], hers[4,7]
```

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 没合并 fail 链 output | 匹配时漏报"是 fail 链上某模式串的"命中 | 构建时 `v.output.addAll(v.fail.output)` 提前合并 |
| `children` 用数组（仅 26 字母） | 中文 / Unicode 失败 | 用 `HashMap<Character, Node>` 或更省内存的 `Int2ObjectMap` |
| fail 链没走到底 | 漏掉命中 | while 循环必须 `while (curr != root && ...)` |
| 不区分大小写 / 全半角 | 敏感词被绕过：`F*uck`、`Ｆuｃk` | 文本和模式串先做归一化（lower + 全角转半角 + 去标点） |
| 模式串极多（千万级） | 内存爆炸 | 换 **Double-Array Trie**（Java HanLP 使用）或 **AC 自动机的双数组版** |

## 复杂度

- **构建**：O(m)，m = 所有模式串总长
- **查询**：O(n + z)，n = 文本长度，z = 命中次数；**与模式串数量 N 无关**
- **空间**：O(m × |Σ|)（HashMap 版较省，数组版较费）

## 业界应用

| 系统 | 场景 |
|------|------|
| **抖音 / 微信 / 微博内容审核** | 敏感词库扫描（涉政、辱骂、广告词、违禁品） |
| **Snort / Suricata IDS** | 网络入侵检测的多签名匹配 |
| **ClamAV 反病毒** | 病毒特征库扫描 |
| **网页爬虫** | URL/Domain 黑名单匹配 |
| **HanLP / Jieba 分词器** | 词典匹配（变种用双数组 Trie）|
| **DPI 深度包检测** | 防火墙 / 运营商流量审计 |
| **Google AdWords** | 广告关键词触发 |

## 工程实战：敏感词过滤的额外考量

代码只是基础。真正落地敏感词过滤还要：

```
1. 输入归一化
   - 全角 → 半角 ("Ｆ" → "F")
   - 繁体 → 简体
   - 去掉空格 / 标点 / 特殊符号
   - 同音字替换（"傻" / "傻×" / "煞"）

2. 模式串预处理
   - 拼音版（"sb" → "傻*"）
   - 拆字（"日 月" → "明"）
   - 跳字（"d_o_g" → "dog"），用通配符自动机变体

3. 性能优化
   - 双数组 Trie 替代 HashMap：内存省 5x，查询快 3x
   - 模式串按频率分两个自动机：热门词独立 + 冷门词长尾

4. 准召率运营
   - 黑名单 + 白名单（"草莓"白名单避免误杀）
   - 上下文规则（前后 N 字符判断）
   - 用户级置信度（小号优先打标，大号 review 后处理）
```

## 面试常问 & 怎么答

### AC 自动机为什么比 N 次 KMP 快

KMP 是单模式串，N 个就要扫 N 遍。AC 自动机把所有模式串塞进一个 Trie，**一次扫描同时找所有匹配**，复杂度跟模式串数量 N 无关。

### fail 指针和 KMP 的 next 数组什么关系

**fail = next 在 Trie 上的推广**。next[i] 是"模式串前 i 个字符的最长公共前后缀"；fail[u] 是"Trie 节点 u 代表的字符串的最长后缀（且这个后缀也是 Trie 中某条路径）"。本质都是失配时不退到起点的优化。

### 怎么处理"汉字 + 中文敏感词"

- `children` 用 `HashMap<Character, Node>`（Java char 直接覆盖 BMP 内的汉字）
- 超出 BMP 的字符（emoji 等）用 `int codepoint` + `Map<Integer, Node>`
- 输入文本做归一化（全角 → 半角、繁体 → 简体）

### 模式串千万级怎么办

标准 HashMap 版内存爆炸。换 **双数组 Trie（Double-Array Trie）**：
- 用两个 int 数组 `base[]` + `check[]` 紧凑表示
- 内存 5-10x 减少，查询快 3-5x
- HanLP、MeCab、Kuromoji 都用这个

### 怎么实现"动态加敏感词不停服"

构建 fail 指针是 O(m)，新词进来时**整树重建**代价高。两种方案：
- **双 buffer**：当前自动机线上服务，新词在 buffer 自动机加，定时 swap
- **分段自动机**：高频词主自动机 + 低频词增量自动机，查询时遍历两个

## 看到什么就先想到这类

- "敏感词过滤 / 关键词命中 / 违禁词检测" → AC 自动机
- "在一段文本里同时找 N 个模式串" → AC 自动机
- "防火墙规则匹配 / IDS 签名匹配" → AC 自动机 / 变种
- "反病毒特征扫描" → AC 自动机
- "广告关键词触发" → AC 自动机
- "面试官追问'比 KMP 快多少'" → 跟 N 无关的 O(n+z) vs KMP 的 O(N×n)
