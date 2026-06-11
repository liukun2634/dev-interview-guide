---
title: Radix Tree（压缩 Trie）
---

# Radix Tree（压缩 Trie）— URL 路由与前缀路由的工程标配

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Radix Tree 是 [Trie](./trie) 的**工程版**：把只有一个子节点的整条链合并成一条边（边上存子串），节点数百倍缩减、cache 友好。**URL 路由、IP 路由表、KV 前缀检索都用它**——Gin、Fastify、Spring 5.3+ `PathPattern`、Nginx `location`、etcd、Linux 内核路由都是它的实现。
:::

## 为什么单独讲它

[Trie](./trie) 解决"刷题里的前缀问题"，Radix Tree 解决"工程里的前缀问题"。这两件事的瓶颈不一样：

| 维度 | 算法题 Trie | 工程 Radix Tree |
|------|------|------|
| 输入 | 几百到几万个**短词**（≤ 20 字符）| 几百到几万条**长路径**（URL / IP 段，可达 100+ 字符）|
| 字符集 | 26 字母 / 0-9 数字 | ASCII 全集 + 分隔符 |
| 节点链特点 | 短而稠密 | **大量"独子节点"长链**（`/api/v1/users/...`）|
| 关心 | 实现简洁、能 AC | 单次匹配延迟 < 1μs、cache 命中率 |
| 还要支持 | 前缀查询 / 词频统计 | **参数段 `:id`、通配符 `*path`、优先级匹配** |

**所以面试问"URL 路由怎么实现"时，答 Trie 是入门，答 Radix Tree 才是工程视角**。

## 核心思想：压缩独子链

裸 Trie 一个字符一个节点；Radix Tree **把"只有一个子节点"的整条链合并成一条边**，边上存子串而不是单字符。

```
裸 Trie 存储 "/api/v1/users"（13 个节点）：
/ → a → p → i → / → v → 1 → / → u → s → e → r → s

Radix Tree 存储同样路径（1 个节点）：
/ → "api/v1/users"
```

加入第二条路径 `/api/v1/orders` 后，自动找最长公共前缀分裂：

```
/
└─ "api/v1/"           ← 公共前缀单独成节点
   ├─ "users"
   └─ "orders"
```

三个直接收益：
- **节点数百倍量级缩减**
- **一次字符串前缀比较 == 原来上百次指针跳转**（Java 里 `String.regionMatches` 还可走 SIMD 优化）
- **节点对象紧凑，CPU L1/L2 cache 命中率高**

## 节点结构与匹配复杂度

```java
class RadixNode {
    String prefix;                          // ★ 边上的完整子串，不是单字符
    boolean isEnd;
    Object handler;                         // 路由命中后的处理器
    List<RadixNode> children;
}
```

**匹配复杂度：O(URL 长度)，与注册路由总数无关。** 这是它压倒"线性扫描正则数组"的关键——10 条路由还是 10000 条路由，单次匹配耗时几乎一样。

| 数据结构 | 注册 N 条路由后单次匹配 | 备注 |
|------|------|------|
| 正则数组线性扫描 | O(N × L) | Express、老 Spring AntPathMatcher |
| HashMap 精确匹配 | O(L) | 但不支持参数和通配符 |
| 裸 Trie | O(L) | 节点多、cache 不友好 |
| **Radix Tree** | **O(L)，常数极小** | **生产首选** |

## 例题：从零实现一个支持参数的 URL 路由器

::: warning 🔥 系统设计高频
"实现一个 web 框架的路由器"几乎是后端中高级岗位的标准设计题。能讲清下面三类节点 + 优先级 + 分裂逻辑就能拿满分。
:::

### URL 路由的三类节点

纯字符串 Radix Tree 还不够，URL 路由要区分三种段。主流框架（Gin / httprouter / Echo）的节点类型枚举：

| 节点类型 | 语法 | 例子 | 匹配范围 | 优先级 |
|------|------|------|------|------|
| `STATIC` | 字面量 | `/users/me` | 完全相等 | 最高 |
| `PARAM` | `:name` | `/users/:id` | 吃到下一个 `/` 为止 | 中 |
| `CATCH_ALL` | `*path` | `/files/*filepath` | 吃到字符串末尾 | 最低 |

**匹配时必须按 `STATIC > PARAM > CATCH_ALL` 优先级**——`/users/me` 必须比 `/users/:id` 先命中，否则 `me` 会被当成 `id="me"` 的参数，业务语义全错。

### 节点定义

```java
enum NodeType { STATIC, PARAM, CATCH_ALL }

class RadixNode {
    String prefix;                          // STATIC: 字面前缀；PARAM/CATCH_ALL: 参数名
    NodeType type;
    Handler handler;                        // 仅终止节点非 null
    List<RadixNode> children = new ArrayList<>();

    RadixNode(String prefix, NodeType type) {
        this.prefix = prefix;
        this.type = type;
    }
}
```

### 查找：核心 30 行

```java
public Handler match(RadixNode root, String path, Map<String, String> params) {
    RadixNode node = root;
    int i = 0;

    while (i < path.length()) {
        RadixNode next = null;

        // 1. 优先匹配 STATIC 节点（精确字面）
        for (RadixNode child : node.children) {
            if (child.type == NodeType.STATIC && path.startsWith(child.prefix, i)) {
                next = child;
                i += child.prefix.length();
                break;
            }
        }

        // 2. STATIC 没命中，再试 PARAM（吃到下一个 '/' 为止）
        if (next == null) {
            for (RadixNode child : node.children) {
                if (child.type == NodeType.PARAM) {
                    int end = path.indexOf('/', i);
                    if (end == -1) end = path.length();
                    params.put(child.prefix, path.substring(i, end));   // ★ 抽参数
                    next = child;
                    i = end;
                    break;
                }
            }
        }

        // 3. 还没命中再试 CATCH_ALL（吃到末尾）
        if (next == null) {
            for (RadixNode child : node.children) {
                if (child.type == NodeType.CATCH_ALL) {
                    params.put(child.prefix, path.substring(i));
                    return child.handler;
                }
            }
            return null;                                                // 404
        }
        node = next;
    }
    return node.isEnd() ? node.handler : null;
}
```

### 插入：处理"分裂"

插入是 Radix Tree 最容易写错的地方。插入新路径时，要和已存边做**最长公共前缀比较**，可能要把已有边**拆成两段**。

四种情况：

```
已有 "api/v1/"，新插入：
① "api/v1/users"     → 在尾部追加 "users" 子节点
② "api/v1/"          → 已存在，仅更新 isEnd
③ "api/v2/"          → 与 "api/v1/" 的公共前缀是 "api/v"，
                       把已有节点拆成 "api/v" → ["1/", "2/"]
④ "api"              → "api" 是 "api/v1/" 的前缀，把已有节点拆成 "api" → "/v1/"
                       并标记 "api" 为终止
```

伪代码骨架：

```java
void insert(RadixNode node, String path, Handler handler) {
    for (RadixNode child : node.children) {
        if (child.type != NodeType.STATIC) continue;
        int common = commonPrefixLength(child.prefix, path);

        if (common == 0) continue;                              // 没公共前缀，下一个

        if (common == child.prefix.length()) {                  // 已存边是新路径前缀
            insert(child, path.substring(common), handler);     // 递归进入子节点
            return;
        }

        // ★ 需要分裂已存边
        RadixNode mid = new RadixNode(child.prefix.substring(common), NodeType.STATIC);
        mid.handler = child.handler;
        mid.children = child.children;
        child.prefix = child.prefix.substring(0, common);
        child.handler = null;
        child.children = new ArrayList<>(List.of(mid));

        if (common < path.length()) {
            child.children.add(new RadixNode(path.substring(common), NodeType.STATIC));
            // 把新节点 handler 设上
        } else {
            child.handler = handler;
        }
        return;
    }

    // 没有任何 child 有公共前缀，直接挂一个新节点
    node.children.add(new RadixNode(path, NodeType.STATIC));
}
```

### 必踩坑

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 把 `:id` 当 STATIC 节点 | `/users/123` 永远 404 | 注册时识别 `:`、`*` 前缀，建专门类型节点 |
| 不按优先级匹配 | `/users/me` 被 `:id` 吃掉 | 三阶段顺序：STATIC → PARAM → CATCH_ALL |
| PARAM 不限定到 `/` | `:id` 吃到末尾，多段路径全错位 | `path.indexOf('/', i)` 限定终点 |
| 插入分裂逻辑漏改 children | 老子树丢失 | 分裂时**新建中间节点**承接老 children，老节点保留路径前半段 |
| 多线程并发注册 | Map 损坏、children 错乱 | 注册阶段加锁；运行期只读则 lock-free |

### 复杂度

- **匹配**：O(L)，L 为 URL 长度
- **插入**：O(L²) 最差（分裂时要拷贝），平均 O(L)
- **空间**：O(总路径字符数)

## 业界实现速查

| 框架/系统 | 实现 | 备注 |
|------|------|------|
| **Gin / Echo / Fiber** (Go) | httprouter 风格 Radix Tree | Go 生态事实标准 |
| **Fastify** (Node.js) | find-my-way Radix Tree | 比 Express 快 3-5× |
| **Spring 5.3+** (Java) | `PathPattern` 树（替代老的 `AntPathMatcher` 线性匹配）| 老 Ant 模式 O(n) 扫描 |
| **Nginx** | `location` 前缀树 + 正则数组兜底 | C 实现极致优化 |
| **etcd / Consul** | Radix Tree 存 KV | 同时服务于前缀范围查询 |
| **Linux 内核** | LC-Trie / Compressed Trie | IP 最长前缀匹配 |
| **Redis Streams 7+** | listpack 内部用 Radix Tree | XADD/XRANGE 走前缀 |

## 什么时候**不**用 Radix Tree

- **路由 < 20 条**：HashMap（精确匹配）+ 正则数组已足够，Radix Tree 的常数开销反而拖累
- **路由几乎全是正则**：Radix Tree 不擅长正则，主流方案是"前缀走 Trie、正则走数组兜底"（Nginx 就是这套）
- **海量域名 + DPDK 边缘节点**：用专用 trie 库（如 [poptrie](https://github.com/yasukata/poptrie)）做 SIMD 加速

## 面试常问 & 怎么答

### Radix Tree 和 Trie 的区别

**一句话：Radix Tree 把 Trie 的"独子节点链"合并成一条边**。节省节点数量、提升 cache 命中率。代价是插入要处理"分裂"逻辑、不能像 Trie 一样按字符直接索引（必须做字符串比较）。

### 为什么 URL 路由不用哈希表

哈希表只能做精确匹配，处理不了 `/users/:id` 这种参数路径。Radix Tree 在 O(L) 时间内同时完成"前缀走树"+"参数抽取"+"优先级裁决"。

### 为什么不直接用正则数组

正则数组每次匹配是 O(N × L)，N 是路由数。当 N 增长到 10000，单次匹配延迟从 μs 级涨到 ms 级。Radix Tree 始终 O(L)，与 N 无关。

### Linux 内核为什么不用普通 Radix Tree 做 IP 路由

IP 路由表是"最长前缀匹配"，更新频繁、命中要走中断上下文（极致低延迟）。Linux 用 **LC-Trie**（Level-Compressed Trie）：在 Radix 基础上再把"满载子树"压成数组（一次跳多层），单次查询往往 ≤ 3 次内存访问。

## 看到什么就先想到这类

- "URL 路由 / web 框架 router 实现" → Radix Tree
- "支持参数 `:id` 和通配符 `*path`" → Radix Tree + 三类节点优先级
- "前缀范围查询的 KV 存储" → Radix Tree（etcd 路线）
- "IP 最长前缀匹配 / 路由表" → Radix Tree → LC-Trie
- "海量短词的前缀树" → 普通 [Trie](./trie) 就够
