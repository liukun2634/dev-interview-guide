---
title: 缓存策略
---

# 缓存策略 Caching Strategies

## 概念

缓存是提升系统性能的核心手段，通过将热点数据存储在内存中，大幅减少数据库查询压力。数据库磁盘 I/O 是系统的主要瓶颈，内存读写速度比磁盘快 **10 万倍以上**。

**缓存的适用场景：**
- 读多写少的热点数据（商品详情、用户资料）
- 计算开销大但变化不频繁的数据（排行榜、统计数据）
- Session 存储、Token 验证

引入缓存会带来三大经典问题（穿透、击穿、雪崩）以及缓存与数据库的一致性挑战，掌握其成因和解决方案是系统设计面试的必备知识。

---

## 核心原理

### 三大缓存问题

#### 缓存穿透 (Cache Penetration)

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

> 布隆过滤器的误判率（false positive）可以调整，但没有漏判（false negative），即如果返回"不存在"则一定不存在。

**Bloom Filter 误判率与空间 Trade-off**

布隆过滤器的误判率 $p$ 与位数组大小 $m$、元素数量 $n$、哈希函数个数 $k$ 的关系：

$$p = \left(1 - e^{-kn/m}\right)^k$$

最优哈希函数个数：$k = \frac{m}{n} \ln 2$

| 元素数量 $n$ | 误判率 $p$ | 位数组大小 $m$ | 每元素占用 | 哈希函数数 $k$ |
|-------------|-----------|---------------|-----------|--------------|
| 100 万 | 1% | 9.6 MB | ~10 bits | 7 |
| 100 万 | 0.1% | 14.4 MB | ~15 bits | 10 |
| 100 万 | 0.01% | 19.2 MB | ~20 bits | 13 |
| 1 亿 | 1% | 960 MB | ~10 bits | 7 |

**选型建议**：缓存穿透防护场景，误判率设为 0.1%（即万分之一的请求仍会穿透到 DB），100 万 key 仅需约 14 MB 内存，性价比极高。误判率设得太低（如 0.001%）会显著增加内存占用和哈希计算开销，通常没有必要。

#### 缓存击穿 (Cache Breakdown / Hotspot Invalid)

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

#### 缓存雪崩 (Cache Avalanche)

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

**方案二：多级缓存**（详见下节）

Redis 宕机时，L1 本地缓存仍能吸收大量流量。

**方案三：Redis 高可用**（详见 Redis 集群架构节）
- 哨兵模式（Sentinel）：主节点故障自动切换
- 集群模式（Cluster）：数据分片 + 副本，单节点故障不影响整体

**方案四：熔断 + 降级**
```java
// 启用熔断器（如 Resilience4j）
CircuitBreaker circuitBreaker = CircuitBreaker.ofDefaults("db");
// 数据库访问失败率超阈值时自动熔断，返回降级数据
```

---

### Redis 集群架构演进

#### 架构演进路径

```
单机（Standalone）
    │ 性能瓶颈 / 单点故障
    ▼
主从复制（Master-Slave）
    │ 主节点故障需手动切换
    ▼
哨兵模式（Sentinel）
    │ 仍为单主，存储容量有限
    ▼
集群模式（Cluster）
    │ 水平扩展，多主多从
    ▼
（按需）云托管 / Redis Enterprise
```

| 架构 | 高可用 | 水平扩展 | 适用场景 |
|------|--------|----------|---------|
| 单机 | 无 | 无 | 开发/测试环境 |
| 主从 | 手动切换 | 读扩展 | 读多写少，可接受手动运维 |
| Sentinel | 自动故障转移 | 读扩展 | 生产环境单主，中小规模 |
| Cluster | 自动故障转移 | 读写均可扩展 | 大数据量、高吞吐生产环境 |

#### Redis Cluster：Hash Slot 机制

Redis Cluster 将整个键空间划分为 **16384 个 Hash Slot**，每个主节点负责其中一段连续区间。

**Slot 计算：**
```
slot = CRC16(key) % 16384
```

**Slot 分配示例（3 主 3 从）：**

```
┌─────────────────────────────────────────────────────┐
│                   Redis Cluster                     │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Master-1    │  │  Master-2    │  │ Master-3  │ │
│  │ Slot 0-5460  │  │Slot 5461-10922│  │Slot 10923-│ │
│  │              │  │              │  │   16383   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                │       │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌─────▼─────┐ │
│  │  Replica-1   │  │  Replica-2   │  │Replica-3  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
```

**MOVED vs ASK 重定向：**

| 类型 | 触发条件 | 含义 | 客户端行为 |
|------|----------|------|-----------|
| `MOVED` | Slot 已永久迁移到新节点 | 请求发错了节点 | 更新路由表，重发请求 |
| `ASK` | Slot 正在迁移中 | 数据暂时在目标节点 | 仅本次重定向，不更新路由表 |

**Slot 迁移流程**

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Src as 源节点<br/>Master-1
    participant Dst as 目标节点<br/>Master-2
    
    Note over Src,Dst: 开始迁移 Slot 100
    Src->>Src: CLUSTER SETSLOT 100 MIGRATING dst
    Dst->>Dst: CLUSTER SETSLOT 100 IMPORTING src
    
    loop 逐 key 迁移
    Src->>Dst: MIGRATE key（原子迁移单个 key）
    Dst-->>Src: OK
    end
    
    Note over Client: 迁移期间的请求处理
    Client->>Src: GET key_in_slot_100
    alt key 仍在源节点
    Src-->>Client: 返回数据
    else key 已迁移到目标节点
    Src-->>Client: ASK 重定向
    Client->>Dst: ASKING + GET key_in_slot_100
    Dst-->>Client: 返回数据
    end
    
    Note over Src,Dst: 迁移完成
    Src->>Src: CLUSTER SETSLOT 100 NODE dst
    Dst->>Dst: CLUSTER SETSLOT 100 NODE dst
    Note over Client: 后续请求收到 MOVED → 更新路由表
```

**迁移期间的关键保证：**
- 每个 key 的迁移是**原子操作**，不会出现同一 key 在两个节点同时存在
- 源节点先检查本地是否有该 key，有则直接响应，无则返回 `ASK` 让客户端去目标节点查
- 迁移完成后广播 `MOVED`，所有客户端更新路由表

---

### 多级缓存架构

#### 三层缓存结构

```
请求
  │
  ▼
L1: 本地缓存（Caffeine）── 命中 ──► 返回（微秒级）
  │ 未命中
  ▼
L2: 分布式缓存（Redis）── 命中 ──► 回填 L1 ──► 返回（毫秒级）
  │ 未命中
  ▼
L3: 数据库（MySQL）──────────────► 回填 L2 ──► 回填 L1 ──► 返回（百毫秒级）
```

| 层级 | 实现 | 访问延迟 | 容量限制 | 共享范围 |
|------|------|----------|----------|---------|
| L1 本地缓存 | Caffeine | 微秒级（进程内） | JVM 堆内存（通常几百 MB） | 单个实例 |
| L2 分布式缓存 | Redis | 毫秒级（网络 I/O） | 内存（可扩展至 TB 级） | 所有实例共享 |
| L3 数据库 | MySQL | 取决于索引、工作集、锁与 I/O，不能固定写成百毫秒 | 磁盘、IOPS、索引与运维成本约束 | 所有实例共享 |

#### L1 缓存一致性：失效广播

多实例部署时，L1 本地缓存各自独立。下面是简化的客户端伪代码，`updateUser` 中的数据库更新必须已经提交；生产应通过 Outbox/CDC 可靠触发失效，不能把事务内 `update()` 返回当成提交成功。

```java
// 写操作后，发布失效消息
public void updateUser(User user) {
    userMapper.update(user);
    redis.del("user:" + user.getId());          // 删除 L2
    redis.publish("cache:invalidate", "user:" + user.getId()); // 广播 L1 失效
}

// 每个实例订阅失效消息
@PostConstruct
public void subscribeInvalidation() {
    redis.subscribe((channel, message) -> {
        localCache.invalidate(message);         // 删除本地 L1
    }, "cache:invalidate");
}
```

Pub/Sub 只通知在线订阅者，不回放断线期间的消息。L1 需有有限 TTL、重连清理或版本校验；数据库提交后进程崩溃导致通知没发出，也要有可靠事件补偿。具体工程边界见 [Redis 实战](../engineering-practice/redis)。

---

### 缓存更新策略

| 策略 | 操作顺序 | 一致性 | 性能 | 适用场景 |
|------|---------|--------|------|---------|
| **Cache Aside（旁路缓存）** | 读：miss 回源；写：DB 提交后删除缓存 | 需处理失效丢失和旧值回填 | 命中读开销低 | 允许一定陈旧窗口的查询 |
| **Read Through** | 缓存层封装加载逻辑 | 只描述读取职责，不自动增强一致性 | 取决于命中与加载策略 | 统一缓存加载接口 |
| **Write Through** | 通过缓存层同步写底层存储 | 取决于写入串行化、失败处理和旁路访问 | 增加写路径工作 | 有统一写入口的场景 |
| **Write Behind（Write Back）** | 先接收缓存写，再异步刷新存储 | 需可靠日志、顺序及恢复协议 | 可批量合并 | 可容忍延迟且已设计写入可靠性的场景 |

**Cache Aside 读写流程：**

```
读流程：
  请求 → 查 Redis → 命中则返回
                  → 未命中 → 查 DB → 写入 Redis → 返回

写流程：
    请求 → 提交 DB 事务 → 删除 Redis 缓存（失败由可靠事件重试）
```

**为什么写操作是删除缓存而不是更新缓存？**

更新缓存容易出现并发写冲突：
1. 线程 A 更新 DB（新值）
2. 线程 B 更新 DB（更新值）
3. 线程 B 更新缓存（B 的值）
4. 线程 A 更新缓存（A 的旧值写入）→ 缓存与 DB 不一致

删除避免了上述写写覆盖，但仍有“回源读到旧值后晚回填”的读写竞争，不能因此推导出强一致。

---

### 缓存与数据库一致性深度解析

#### 先区分三种失败窗口

| 时间线 | 为什么失效 | 对应措施 |
|--------|------------|----------|
| 事务内删除缓存 → 其他读请求回源 → 原事务才提交 | 回源仍能读到提交前版本 | 在提交后触发失效；不能只把 delete 写在 save 后面 |
| DB 已提交 → 进程崩溃 → 删除没执行 | 失效动作丢失 | 同事务 Outbox 或 CDC，记录进度并重试；TTL 作兜底 |
| 读 A 取到旧版本 → 写 B 提交并删除 → A 回填旧版本 | 旧值晚到，删除本身成功也没用 | 版本化回填/失效水位，限制加载寿命，或严格读绕过缓存 |

```text
时间     读请求 A                       写请求 B
T1       Redis miss
T2       DB 读到 version=7
T3                                     提交 version=8
T4                                     DEL 缓存成功
T5       SET 缓存 version=7
```

这是普通 Cache Aside 无法避免的窗口。失效消费者再次 DEL 可能缩小影响，但若没有后续失效、没有 TTL，旧值可能一直驻留。

#### 方案一：延迟双删（Delayed Double Deletion）

这是缩短某些并发窗口的工程补偿，不是强一致协议。常见演示时序如下，生产不能在请求线程中直接 sleep，也不能把延迟任务仅放在进程内：

```text
删除缓存
提交数据库更新
通过可靠任务在延迟窗口后再次删除
失败重试，配合缓存有限 TTL
```

**时序说明：**
```
T1: 线程 A 删除缓存
T2: 线程 B 读取缓存 miss，查 DB 得到旧值
T3: 线程 A 更新 DB 完成
T4: 线程 B 将旧值写入缓存 ← 产生脏数据
T5: 线程 A 延迟 500ms 后再次删除缓存 ← 清除 T4 写入的脏数据
```

如果读请求因为 GC、网络或慢查询直到 T6 才回填，第二次删除仍会被越过。优先从“提交后删除 + 可靠失效”建立基础，再判断额外延迟删除是否值得引入；时间窗口应来自观测和业务陈旧容忍度，不能宣称 500ms 覆盖全部请求。

#### 方案二：Canal Binlog 监听

适合对一致性要求高、希望与业务代码解耦的场景：

```
MySQL Binlog
    │ 变更事件（INSERT/UPDATE/DELETE）
    ▼
Canal Server（模拟 MySQL Slave 消费 Binlog）
    │ 解析变更记录
    ▼
消息队列（Kafka / RocketMQ）
    │
    ▼
缓存消费者（删除/更新 Redis 缓存）
```

```java
// Canal 消费者示例
@CanalEventListener
public void onUserChange(CanalEntry.Entry entry) {
    String tableName = entry.getHeader().getTableName();
    if ("user".equals(tableName)) {
        // 从 binlog 解析出变更的 user id
        Long userId = extractUserId(entry);
        redis.del("user:" + userId);
    }
}
```

#### 方案对比

| 方案 | 实现复杂度 | 一致性保证 | 延迟 | 适用场景 |
|------|-----------|-----------|------|---------|
| Cache Aside + TTL | 低 | 限制驻留时间，但仍有陈旧窗口 | 回源与删除成本 | 可容忍旧数据的查询 |
| 延迟双删 | 中 | 缩小部分竞态，不提供严格上界 | 延迟任务与额外删除 | 已知读写时序的补充措施 |
| Outbox / Canal CDC | 中到高 | 可靠重试失效，仍需处理乱序与回填 | 取决于消费积压 | 有可靠事件基础设施 |
| 版本化回填 | 高 | 在版本协议和保留条件内拒绝旧写入 | 校验与元数据成本 | 需要控制旧值覆盖的热点对象 |
| 关键读绕过缓存 | 较低 | 取决于权威数据库的读取与事务语义 | 存储读成本 | 库存裁决、余额、权限等关键操作 |

#### 方案三：版本水位与读己之写

一个可讨论的版本协议需要同时覆盖**回填值**和**失效事件**：

1. 数据库同一对象的每次修改产生单调递增业务版本，更新和 Outbox 事件同事务提交。
2. 失效消费者维护“该 key 已知至少到版本 v”的水位，即使缓存正文不存在，也保存版本墓碑；旧事件不能降低水位。
3. 回源得到 `(payload, version)`，使用同 slot 的 Lua/原子操作比较版本，只有不低于水位和已有版本的值才能回填。
4. 水位保留时间必须覆盖在途旧读取与事件回放；若水位被淘汰、过期或在故障转移时回退，保护条件就不再成立。不能只对正文执行 DEL 后声称版本机制仍有效。
5. 删除对象也要产生带版本的墓碑，否则旧查询可能把已删除对象重新回填。

即使如此，**新版本事件尚未到达缓存时，仍可能短暂读到旧值**。若用户提交版本 8 后必须读到至少版本 8，可让读请求携带最小版本，缓存低于该版本时受控读主或等待；无法满足 deadline 就明确返回失败。金额裁决等严格操作应直接使用权威存储的事务语义。

#### TTL、软过期和新鲜度上界

- **物理 TTL**限制该份缓存从写入起的存活时间，不一定限制数据距数据库最新版本的时间。如果从落后副本加载或迟到回填，数据在入缓存前就已陈旧。
- **软过期**允许在 `softExpireAt` 后返回旧值并触发异步刷新；需要 `hardExpireAt` 限制最老可接受时间，刷新失败不能无限延长旧值。
- **负缓存**保护不存在数据的查询，但对象创建后需要主动失效；布隆过滤器更新延迟也可能造成业务层面的误拒绝，不能只讨论数据结构理论上的无漏判。
- **单飞重建**按 key 合并并发 miss，并限制等待队列、锁有效期和加载 deadline；不能让所有请求无限等待同一个失败的重建者。

例如详情描述可容忍 30 秒陈旧，实际成交价不能；两者即使来自同一商品对象，也可选择不同读取路径。先拆业务语义，再谈“整页都走缓存”。

#### 缓存整体不可用：回源预算怎么算？

假设入口 2 万 QPS、正常命中率 95%，正常回源约 1000 QPS；缓存不可用时可能变成 2 万 QPS。若 DB 对该查询的安全容量只有 3000 QPS，且还要为关键写预留资源，就不能放开全部回源。

可采用本地可用旧值、有限并发回源、短队列、快速拒绝和按业务优先级降级。请求合并只解决同 key 的并发，不能解决大量不同 key 的穿透。恢复时也要限制预热和回填速率，避免缓存刚恢复就被全量重建击穿下游。

验收除了 hit rate，还应记录命中/未命中的 P99、回源 QPS 与在途数、加载失败率、失效事件最老年龄、缓存样本版本差异、过期/淘汰速率。命中率很高但一直命中旧值，并不是健康缓存。

---

### Redis 过期策略与内存淘汰

#### 过期 key 的删除机制

- **惰性删除（Lazy Expiration）：** 访问时才检查是否过期，节省 CPU 但内存可能积累
- **定期删除（Periodic Expiration）：** 每隔一段时间随机检查一批 key，过期则删除

两种机制结合使用，保证内存和性能的平衡。

#### 内存淘汰策略（maxmemory-policy）

| 策略 | 说明 |
|------|------|
| `noeviction` | 不淘汰，内存满时写操作报错（默认） |
| `allkeys-lru` | 对所有 key 按 LRU 淘汰 |
| `volatile-lru` | 只对设置了过期时间的 key 按 LRU 淘汰 |
| `allkeys-lfu` | 按访问频率淘汰（Redis 4.0+） |
| `volatile-ttl` | 优先淘汰剩余 TTL 最短的 key |
| `allkeys-random` | 随机淘汰 |

**推荐：** 缓存场景用 `allkeys-lru` 或 `allkeys-lfu`。

---

## 技术选型与对比

| 维度 | Caffeine（L1） | Redis（L2） | Memcached |
|------|---------------|------------|-----------|
| 部署方式 | 进程内（无网络开销） | 独立服务 | 独立服务 |
| 数据结构 | Java 对象 | String/Hash/List/Set/ZSet 等 | 仅 String |
| 持久化 | 无 | RDB / AOF | 无 |
| 集群支持 | 无（本地） | Sentinel / Cluster | 客户端分片 |
| 适用场景 | 超高频热点、降低 Redis 压力 | 分布式共享缓存 | 简单 KV，高并发读 |

---

## 面试常问 & 怎么答

### Q1: 什么是缓存穿透、缓存击穿、缓存雪崩？分别如何解决？

| 问题 | 成因 | 核心解决方案 |
|------|------|------------|
| **穿透** | 查询 DB 中不存在的 key | 缓存空值 / 布隆过滤器 |
| **击穿** | 单个热点 key 过期，大量并发直打 DB | 互斥锁重建 / 逻辑过期不设 TTL |
| **雪崩** | 大量 key 同时过期 / Redis 宕机 | TTL 随机化 / 多级缓存 / Redis 高可用 |

**回答要点：** 先分清三个问题的本质区别，再分别给出对应方案，最好结合场景说明选择依据（如逻辑过期适合热搜榜单等允许短暂旧值的场景）。

### Q2: 如何保证缓存与数据库的数据一致性？

**Cache Aside 模式（主流方案）：**
- 读：先查缓存，未命中则查 DB 并写入缓存
- 写：先更新 DB，**再删除（而非更新）缓存**

选择删除而非更新缓存，是因为更新操作在并发时会出现写写冲突（最后一个写入可能是旧值），而删除是幂等操作。

对一致性要求更高时：
- 先保证提交后失效，再用 Outbox/CDC 重试丢失的删除
- 针对旧值晚到设计版本水位与有界加载；需要读己之写时校验最小版本，关键裁决绕过缓存

### Q3: Redis 的过期策略和内存淘汰策略是什么？

**过期删除：** 惰性删除（访问时检查）+ 定期随机扫描，两种结合。

**内存淘汰：** 当内存达到 `maxmemory` 限制时触发。推荐缓存场景使用 `allkeys-lru`（对所有 key 按最近最少使用原则淘汰），业务系统只淘汰有过期时间的 key 可用 `volatile-lru`。

### Q4: 如何保证缓存和数据库的最终一致性？

**回答框架：**

1. 明确陈旧数据允许多久、是否需要读己之写，分开讨论业务操作。
2. 数据库提交后失效，可靠事件负责失败重试，TTL 负责驻留兜底。
3. 用并发时序验证旧值回填、事件乱序、订阅断线与删除对象的情况，必要时引入版本协议。
4. 为依赖故障和缓存重建设回源预算，并监控传播延迟与版本差异。

**关键点：** 一致性来自完整读写协议与故障假设，不来自 Cache Aside、Write Through 或“用了分布式锁”这些名称。严格要求下可直接绕过缓存，不能把缓存模式本身称为强一致保证。

### Q5: Redis Cluster 的 Hash Slot 机制是什么？

**要点：**
- Redis Cluster 将键空间分为 **16384 个 Hash Slot**
- 每个 key 按 `CRC16(key) % 16384` 映射到对应 Slot
- 每个主节点负责一段 Slot 区间（如 3 主：0–5460 / 5461–10922 / 10923–16383）
- 客户端请求打到错误节点时，节点返回 `MOVED` 或 `ASK` 重定向响应
  - `MOVED`：Slot 已永久迁移，客户端更新路由表后重发
  - `ASK`：Slot 迁移中，仅本次重定向，不更新路由表

**为什么是 16384 而不是更大？** 16384 = 2¹⁴，心跳包中携带 Slot 位图只需 2KB，网络开销可控；同时 Redis 官方建议集群节点不超过 1000 个，16384 个 Slot 已足够分配。

---

## 看到什么就先想到这类

| 关键词 / 场景 | 第一反应 |
|-------------|---------|
| 读多写少 / 热点数据 | Cache Aside + Redis，考虑本地缓存（Caffeine）作 L1 |
| 缓存不一致 / 脏数据 | 提交时序、失效丢失、旧值回填，分别处理 |
| Redis 宕机 / 单点故障 | Sentinel（中小规模自动故障转移）/ Cluster（大规模分片） |
| 大量 key 同时过期 | TTL 随机化 + 多级缓存兜底（L1 本地缓存） |
| 大量无效 key 请求（攻击） | 布隆过滤器拦截 + 缓存空值 |
| 热点 key 过期（高并发） | 互斥锁串行重建 / 逻辑过期异步刷新 |
| 跨实例 L1 缓存失效 | Redis Pub/Sub 广播失效消息 |
| 数据库压力过大 | 多级缓存（L1 Caffeine → L2 Redis → DB）|

---

## 常见误区

::: warning 易错点
1. **分清三大问题：** 穿透=查不存在的数据；击穿=热点 key 过期；雪崩=大量 key 同时过期或服务宕机
2. **模式名称不保证强一致**：Write Through 和分布式锁也需要完整的并发、租约与失败恢复协议，严格业务读可绕过缓存
3. **布隆过滤器有误判（false positive）但无漏判（false negative）**，适合"一定不存在"的快速判断
4. **逻辑过期方案**：用户可能短暂看到旧数据（eventual consistency），适合对一致性要求不高的场景（如热搜榜单）
5. **固定 sleep 不是正确性边界**：慢请求可以越过第二次删除；延迟失效必须可靠调度，并明确仍可能存在的陈旧窗口
:::

---

## 延伸阅读

- [Redis 官方文档 - Expiration](https://redis.io/docs/manual/keyspace-notifications/)
- [Redis Cluster 规范](https://redis.io/docs/reference/cluster-spec/)
- [Caching Strategies and How to Choose the Right One](https://codeahoy.com/2017/08/11/caching-strategies-and-how-to-choose-the-right-one/)
- 《Redis 设计与实现》第 9 章：数据库
