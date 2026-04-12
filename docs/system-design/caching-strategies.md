---
title: 缓存策略
---

# 缓存策略 Caching Strategies

<span class="dig-tag dig-tag--category">系统设计</span>
<span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span>
<span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
缓存是提升系统性能的核心手段，但引入缓存会带来缓存穿透、缓存击穿、缓存雪崩三大经典问题，以及缓存与数据库的一致性挑战。掌握这三大问题的成因和解决方案是系统设计面试的必备知识。
:::

## 为什么需要缓存？

数据库磁盘 I/O 是系统的主要瓶颈，内存读写速度比磁盘快 **10 万倍以上**。缓存（如 Redis）通过将热点数据存储在内存中，大幅减少数据库查询压力。

**缓存的适用场景：**
- 读多写少的热点数据（商品详情、用户资料）
- 计算开销大但变化不频繁的数据（排行榜、统计数据）
- Session 存储、Token 验证

## 三大缓存问题

### 缓存穿透 (Cache Penetration)

**问题：** 查询一个**数据库中也不存在**的 key，每次都穿透缓存直打数据库。恶意攻击者可以利用大量不存在的 ID 进行 DDoS 攻击。

```
请求 id=99999（不存在）
    │
    ▼
Redis 未命中（缓存中无此 key）
    │
    ▼
查询 MySQL（数据库中也没有）
    ├── 返回空
    ▼
不缓存，下次同样穿透
```

**解决方案：**

**方案一：缓存空值**
```java
public User getUser(Long id) {
    String cacheKey = "user:" + id;
    String cached = redis.get(cacheKey);
    
    if (cached != null) {
        if ("NULL".equals(cached)) return null; // 缓存的空值
        return JSON.parseObject(cached, User.class);
    }
    
    User user = userMapper.selectById(id);
    if (user == null) {
        // 缓存空值，TTL 设置短一些（防止正常数据迟迟不被缓存）
        redis.setex(cacheKey, 60, "NULL");
    } else {
        redis.setex(cacheKey, 3600, JSON.toJSONString(user));
    }
    return user;
}
```

**方案二：布隆过滤器 (Bloom Filter)**

系统启动时将所有合法 ID 加入布隆过滤器，请求前先过滤器判断：
```java
// 初始化：将所有合法 ID 加入布隆过滤器
BloomFilter<Long> bloomFilter = BloomFilter.create(Funnels.longFunnel(), 1_000_000, 0.001);
userIds.forEach(bloomFilter::put);

public User getUser(Long id) {
    if (!bloomFilter.mightContain(id)) {
        return null; // 必定不存在，直接返回
    }
    // 继续查缓存/数据库
}
```

> 布隆过滤器的误判率（false positive）可以调整，但没有误判（false negative），即如果返回"不存在"则一定不存在。

### 缓存击穿 (Cache Breakdown / Hotspot Invalid)

**问题：** 一个**热点 key** 在高并发时突然过期，大量请求同时穿透缓存直打数据库，导致数据库瞬间压力剧增。

```
热点 key 过期
    │
    ├── 请求 1 ──► Redis miss ──► MySQL 查询中...
    ├── 请求 2 ──► Redis miss ──► MySQL 查询中...
    ├── 请求 3 ──► Redis miss ──► MySQL 查询中...  ← 数据库压力剧增
    └── ...
```

**解决方案：**

**方案一：互斥锁（串行化重建）**
```java
public User getUser(Long id) {
    String cacheKey = "user:" + id;
    User user = redis.get(cacheKey);
    
    if (user != null) return user;
    
    // 缓存未命中，尝试获取分布式锁
    String lockKey = "lock:user:" + id;
    if (redis.setnx(lockKey, "1", 10)) { // 10s 超时防止死锁
        try {
            // Double check：可能其他线程已经重建缓存
            user = redis.get(cacheKey);
            if (user == null) {
                user = userMapper.selectById(id);
                redis.setex(cacheKey, 3600, JSON.toJSONString(user));
            }
        } finally {
            redis.del(lockKey);
        }
    } else {
        // 没抢到锁，短暂等待后重试
        Thread.sleep(50);
        return getUser(id);
    }
    return user;
}
```

**方案二：逻辑过期（不设置 TTL）**

在缓存值中存入过期时间，后台异步刷新：
```java
public class CacheValue {
    private Object data;
    private LocalDateTime expireTime; // 逻辑过期时间
}

public User getUser(Long id) {
    CacheValue cacheValue = redis.get("user:" + id);
    
    if (cacheValue == null) return null; // 真实不存在
    
    if (cacheValue.getExpireTime().isAfter(LocalDateTime.now())) {
        return (User) cacheValue.getData(); // 未过期
    }
    
    // 逻辑过期，触发异步重建，但本次返回旧数据
    asyncRebuildCache(id);
    return (User) cacheValue.getData(); // 返回旧数据（可接受短暂旧值）
}
```

### 缓存雪崩 (Cache Avalanche)

**问题：** 大量 key **同时过期**，或 Redis 服务**宕机**，导致大量请求全部打到数据库，引发数据库崩溃的雪崩效应。

```
00:00 大量 key 同时过期（例如系统启动时批量设置了相同 TTL）
    │
    ├── 所有请求 ──► Redis Miss ──► 全部打数据库
    │                                    │
    │                              数据库过载崩溃
    │                                    │
    └────────── 整个系统不可用 ─────────────┘
```

**解决方案：**

**方案一：TTL 随机化**
```java
// 基础过期时间 + 随机扰动，避免同时过期
int baseTTL = 3600;
int randomOffset = new Random().nextInt(600); // 0~600 秒随机扰动
redis.setex(cacheKey, baseTTL + randomOffset, value);
```

**方案二：多级缓存**
```
L1: 本地缓存（Caffeine/Guava，内存级，毫秒访问）
L2: 分布式缓存（Redis）
L3: 数据库
```
Redis 宕机时，L1 本地缓存仍能吸收大量流量。

**方案三：Redis 高可用**
- 哨兵模式（Sentinel）：主节点故障自动切换
- 集群模式（Cluster）：数据分片 + 副本，单节点故障不影响整体

**方案四：熔断 + 降级**
```java
// 启用熔断器（如 Resilience4j）
CircuitBreaker circuitBreaker = CircuitBreaker.ofDefaults("db");
// 数据库访问失败率超阈值时自动熔断，返回降级数据
```

## 缓存更新策略

如何保证缓存与数据库的数据一致性？

| 策略 | 操作顺序 | 一致性 | 性能 | 适用场景 |
|------|---------|--------|------|---------|
| **Cache Aside（旁路缓存）** | 读：先缓存后 DB；写：先更新 DB，再删缓存 | 较好 | 好 | 最常用，读多写少 |
| **Read Through** | 缓存层代理读取，缓存未命中自动从 DB 加载 | 好 | 好 | 统一缓存逻辑 |
| **Write Through** | 缓存层代理写入，同步更新 DB 和缓存 | 强一致 | 写入较慢 | 写入不频繁 |
| **Write Behind（Write Back）** | 先写缓存，异步批量刷新 DB | 弱一致 | 写入极快 | 允许短暂不一致 |

### Cache Aside 详解（最常用）

```
读流程：
  请求 → 查 Redis → 命中则返回
                  → 未命中 → 查 DB → 写入 Redis → 返回

写流程：
  请求 → 更新 DB → 删除 Redis 缓存（而非更新）
```

**为什么写操作是删除缓存而不是更新缓存？**

更新缓存容易出现并发问题：
1. 线程 A 更新 DB（新值）
2. 线程 B 更新 DB（更新值）
3. 线程 B 更新缓存（B 的值）
4. 线程 A 更新缓存（A 的旧值写入）→ 缓存与 DB 不一致

删除缓存是幂等操作，不存在这个问题。

### 先删缓存还是先更新数据库？

**正确顺序：先更新 DB，再删除缓存（Cache Aside 模式）**

先删缓存的问题：
1. 删除缓存
2. 其他线程读取缓存（未命中），查 DB 将旧值写入缓存
3. 当前线程更新 DB
4. 结果：缓存是旧值，DB 是新值 → 不一致

> 在高并发场景，还可以配合**延迟双删**（更新 DB 后，过一段时间再删一次缓存）进一步降低不一致窗口期。

## Redis 过期策略与内存淘汰

### 过期 key 的删除机制

- **惰性删除（Lazy Expiration）：** 访问时才检查是否过期，节省 CPU 但内存可能积累
- **定期删除（Periodic Expiration）：** 每隔一段时间随机检查一批 key，过期则删除

两种机制结合使用，保证内存和性能的平衡。

### 内存淘汰策略（maxmemory-policy）

| 策略 | 说明 |
|------|------|
| `noeviction` | 不淘汰，内存满时写操作报错（默认） |
| `allkeys-lru` | 对所有 key 按 LRU 淘汰 |
| `volatile-lru` | 只对设置了过期时间的 key 按 LRU 淘汰 |
| `allkeys-lfu` | 按访问频率淘汰（Redis 4.0+） |
| `volatile-ttl` | 优先淘汰剩余 TTL 最短的 key |
| `allkeys-random` | 随机淘汰 |

**推荐：** 缓存场景用 `allkeys-lru` 或 `allkeys-lfu`。

## 常见误区

::: warning 易错点
1. **分清三大问题：** 穿透=查不存在的数据；击穿=热点 key 过期；雪崩=大量 key 同时过期或服务宕机
2. **Cache Aside 不能保证强一致**，在更新 DB 后删缓存之前，仍有短窗口其他线程读到旧值。若需强一致，考虑 Write Through 或分布式锁
3. **布隆过滤器有误判（false positive）但无漏判（false negative）**，适合"一定不存在"的快速判断
4. **逻辑过期方案**：用户可能短暂看到旧数据（eventual consistency），适合对一致性要求不高的场景（如热搜榜单）
:::

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 什么是缓存穿透、缓存击穿、缓存雪崩？分别如何解决？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 如何保证缓存与数据库的数据一致性？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>3. Redis 的过期策略和内存淘汰策略是什么？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### Q1: 三大缓存问题

| 问题 | 成因 | 核心解决方案 |
|------|------|------------|
| **穿透** | 查询 DB 中不存在的 key | 缓存空值 / 布隆过滤器 |
| **击穿** | 单个热点 key 过期，大量并发直打 DB | 互斥锁重建 / 逻辑过期不设 TTL |
| **雪崩** | 大量 key 同时过期 / Redis 宕机 | TTL 随机化 / 多级缓存 / Redis 高可用 |

### Q2: 缓存与 DB 一致性

**Cache Aside 模式（主流方案）：**
- 读：先查缓存，未命中则查 DB 并写入缓存
- 写：先更新 DB，**再删除（而非更新）缓存**

**选择删除而非更新缓存**是因为：更新操作在并发时会出现写写冲突（最后一个写入可能是旧值），而删除是幂等操作。

对一致性要求更高时，可以结合 Canal（监听 MySQL binlog）实现异步缓存删除，或使用分布式事务（TCC）。

### Q3: Redis 过期和淘汰机制

**过期删除：** 惰性删除（访问时检查）+ 定期随机扫描，两种结合。

**内存淘汰：** 当内存达到 maxmemory 限制时触发。推荐缓存场景使用 `allkeys-lru`（对所有 key 按最近最少使用原则淘汰），业务系统只淘汰有过期时间的 key 可用 `volatile-lru`。

## 延伸阅读

- [Redis 官方文档 - Expiration](https://redis.io/docs/manual/keyspace-notifications/)
- [Caching Strategies and How to Choose the Right One](https://codeahoy.com/2017/08/11/caching-strategies-and-how-to-choose-the-right-one/)
- 《Redis 设计与实现》第 9 章：数据库
