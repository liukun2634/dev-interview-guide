---
title: 设计 Twitter
---

# 设计 Twitter（LeetCode 355）— 最小可面试的 Feed 流系统

<span class="dig-tag dig-tag--category">哈希</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
**关注关系（`HashMap<userId, Set<followeeId>>`）+ 用户推文列表（`HashMap<userId, List<Tweet>>`）+ 拉取时小顶堆/大顶堆多路归并**。这是面试官把"系统设计 Twitter Feed"压缩到 30 分钟手撕代码的版本，会写它，**讲推 / 拉 / 推拉结合三种模型**就能聊半小时。
:::

## 为什么单独讲它

这是少数**数据结构题 + 系统设计题混合**的题：核心数据结构能写出来即可拿分；但面试官几乎一定会追问"如果 follower 几亿怎么办" → 这时你要能说出**推模型 / 拉模型 / 推拉结合**的权衡。

### 系统设计视角的两大模型

| 模型 | 写时 | 读时 | 代价 |
|------|------|------|------|
| **拉模型（Pull）** | 推文写入自己的 timeline | 读取时**实时聚合所有关注者**的 timeline | **写轻读重**；适合关注少 / 大 V 系统 |
| **推模型（Push / Fan-out）** | 写入时立即**推送到所有 follower 的收件箱** | 直接读自己收件箱 | **写重读轻**；适合普通用户 / 写少读多 |
| **推拉结合（Hybrid）** | 普通用户用推、大 V（>10w follower）用拉 | 读时收件箱 + 大 V 实时聚合 | **生产标准**，Twitter / 微博都是 |

**LC 355 的代码就是"拉模型"的最小实现**——发推文存自己列表，拉 timeline 时实时合并关注列表的推文，用堆按时间排序取前 10。

## 数据结构设计

```
followees:  Map<Integer, Set<Integer>>          // 谁关注了谁
                userId → set of followee ids

tweets:     Map<Integer, List<Tweet>>           // 每个用户的推文（按时间正序）
                userId → list of Tweet(id, timestamp)

timestamp:  全局自增 long                       // ★ 时间戳必须全局，否则跨用户排序失效
```

**为什么时间戳要全局**：如果每个用户自己维护时间戳，不同用户的推文之间无法比较先后。最简方案：一个静态 `AtomicLong`，每条推文 `getAndIncrement`。

## 完整代码（必背手撕）

```java
class Twitter {
    private static class Tweet {
        int id;
        long time;
        Tweet(int i, long t) { id = i; time = t; }
    }

    private static long globalTime = 0;                  // ★ 全局时间戳
    private final Map<Integer, List<Tweet>> tweets = new HashMap<>();
    private final Map<Integer, Set<Integer>> followees = new HashMap<>();

    public void postTweet(int userId, int tweetId) {
        tweets.computeIfAbsent(userId, k -> new ArrayList<>())
              .add(new Tweet(tweetId, globalTime++));
    }

    public List<Integer> getNewsFeed(int userId) {
        // ★ 关注列表 + 自己
        Set<Integer> users = new HashSet<>(followees.getOrDefault(userId, Set.of()));
        users.add(userId);

        // ★ 小顶堆做多路归并的相反：用大顶堆按时间倒序，取前 10
        PriorityQueue<Tweet> pq = new PriorityQueue<>((a, b) -> Long.compare(b.time, a.time));

        for (int u : users) {
            List<Tweet> list = tweets.get(u);
            if (list == null) continue;
            // ★ 优化：每个用户只看最后 10 条，其余不可能进前 10
            int start = Math.max(0, list.size() - 10);
            for (int i = start; i < list.size(); i++) {
                pq.offer(list.get(i));
            }
        }

        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < 10 && !pq.isEmpty(); i++) {
            result.add(pq.poll().id);
        }
        return result;
    }

    public void follow(int followerId, int followeeId) {
        if (followerId == followeeId) return;            // ★ 不能关注自己
        followees.computeIfAbsent(followerId, k -> new HashSet<>()).add(followeeId);
    }

    public void unfollow(int followerId, int followeeId) {
        Set<Integer> set = followees.get(followerId);
        if (set != null) set.remove(followeeId);
    }
}
```

## 优化：多路归并代替全堆

上面"每个用户取最后 10 条全部进堆"在关注数极多时仍然慢。**真正的多路归并**：

```java
// 每个用户当成一条按时间倒序的链表，K 路归并取前 10
public List<Integer> getNewsFeed(int userId) {
    Set<Integer> users = new HashSet<>(followees.getOrDefault(userId, Set.of()));
    users.add(userId);

    // 堆里存 (Tweet, 用户列表, 当前下标)
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Long.compare(
            tweets.get(b[1]).get(b[2]).time,
            tweets.get(a[1]).get(a[2]).time));

    for (int u : users) {
        List<Tweet> list = tweets.get(u);
        if (list != null && !list.isEmpty()) {
            pq.offer(new int[]{0, u, list.size() - 1});  // 从最新开始
        }
    }

    List<Integer> result = new ArrayList<>();
    while (!pq.isEmpty() && result.size() < 10) {
        int[] curr = pq.poll();
        int u = curr[1], idx = curr[2];
        result.add(tweets.get(u).get(idx).id);
        if (idx > 0) {                                  // 推下一条（更早的）
            pq.offer(new int[]{0, u, idx - 1});
        }
    }
    return result;
}
```

复杂度从 O(N × 10) 降到 O(K × log K + 10 × log K)，K = 关注数。**这是合并 K 个有序链表（LC23）的同构题**。

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 时间戳不全局 | 跨用户排序失效 | 静态 `AtomicLong` 或 `volatile long` |
| `follow` 不检查 `followerId == followeeId` | 自己关注自己出现两次 | 直接 return |
| `getNewsFeed` 漏掉自己的推文 | 看不到自己刚发的 | 把自己 `add` 进 users 集合 |
| 把所有推文都进堆 | 用户发了 1 万条，堆爆炸 | **每个用户只看最后 10 条**（足以覆盖前 10）|
| 用 `LinkedList<Tweet>` | `list.get(i)` 是 O(n) | 用 `ArrayList` |

## 复杂度

- **`postTweet`**：O(1) 均摊
- **`getNewsFeed`**（多路归并版）：O(K log K + 10 log K)，K = 关注数
- **`follow` / `unfollow`**：O(1)
- **空间**：O(总推文数 + 总关注边数)

## 业界 Feed 流的三大模型

### 1. 拉模型（Pull / Fan-out on Read）

- **写时**：推文只入自己的 outbox
- **读时**：当前用户拉取所有关注者的 outbox，实时排序合并
- **代价**：**写很轻、读很重**。100 关注 → 读时要拉 100 个用户的最新数据
- **何时用**：关注数少（IM / 小社交）、写多读少、用户重度大 V

### 2. 推模型（Push / Fan-out on Write）

- **写时**：把推文复制写入所有 follower 的 inbox
- **读时**：直接读自己的 inbox
- **代价**：**写很重、读很轻**。一条推文有 10w follower → 写 10w 次
- **何时用**：写少读多、follower 普遍少（< 1w）的普通用户

### 3. 推拉结合（Hybrid，Twitter / 微博生产方案）

```
普通用户（< 1w follower）→ 推模型，写入 follower inbox
大 V（> 1w follower）  → 拉模型，follower 在读时实时聚合
读 Feed 时：
  本地 inbox（普通用户推过来）
  + 实时拉取关注的大 V outbox
  → 合并排序
```

**这是面试时被追问"几亿用户怎么办"的标准答案**。Twitter 早期纯推、被特朗普这种几千万 follower 的账号打爆后改成 Hybrid。

## 面试常问 & 怎么答

### 推模型怎么处理"大 V 写一条要扇出 10w 次"

**异步写**：写自己 outbox 后立即返回，扇出走 MQ（Kafka）异步消费。读 inbox 时如果还没扇出完，就退化到"实时聚合"兜底。

### 怎么避免"取消关注后历史推文还出现在 Feed"

**推模型不删历史**（删起来太贵），Feed 端按"当前是否还关注"二次过滤。这是为什么"取消关注后还能看到旧推文"是产品共识。

### Feed 流怎么分页

按 timestamp 游标分页（cursor-based），不要用 offset：
- offset 在数据变化时（新推文）位置不稳，容易跳过 / 重复
- cursor (lastTimestamp) 稳定，是流式 Feed 的标准做法

### 时间线推送的延迟容忍

**Feed 不是强一致**：用户能接受"刚发的推文 5 秒后才出现在所有 follower 时间线"。这给了"异步扇出 + 最终一致"巨大的工程空间。

## 看到什么就先想到这类

- "设计 Twitter / 微博 / 朋友圈 Feed" → 推/拉/推拉结合
- "合并多个有序列表取 Top K" → 小顶堆 K 路归并（LC23 同构）
- "时间线分页" → cursor-based timestamp
- "大 V 扇出爆炸" → 推拉结合 + 异步 MQ 扇出
- "feed 排序按时间" → 全局时间戳 + 多路归并堆
