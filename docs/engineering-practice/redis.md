---
title: Redis 实战
---

# Redis 实战

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Redis 是以内存为主要工作集的键值存储，常规命令执行以串行为核心，网络 I/O、持久化和后台释放等可以并行。工程上它不仅能做缓存，也能支持锁、限流、会话和消息处理；但**命令原子性、复制确认、磁盘持久化、业务幂等是四种不同的保证**。本页从数据结构与执行模型，深入到故障转移、缓存一致性、Stream 恢复、Lua 边界和生产诊断。
:::

阅读路线：基础与可靠性 → 缓存/锁/会话 → 限流与 Stream → 延迟任务与 Lua → 性能排障。数据结构的更完整原理可对照 [数据库 · Redis](../databases/redis)，架构层的取舍可对照 [缓存策略](../system-design/caching-strategies)。

---

## 核心概念

### 5 种数据结构

| 类型 | 底层实现 | 典型场景 | 常用命令 |
|------|----------|----------|----------|
| **String** | SDS（简单动态字符串） | 缓存对象、计数器、分布式锁 | `SET` / `GET` / `INCR` / `EXPIRE` |
| **Hash** | 小对象紧凑编码（Redis 7 常见为 listpack）/ hashtable | 对象字段、用户信息 | `HSET` / `HGET` / `HMGET` / `HDEL` |
| **List** | quicklist 等编码，内部节点随版本可使用 listpack | 最新动态、有边界的队列 | `LPUSH` / `RPOP` / `LRANGE` / `LLEN` |
| **Set** | intset / hashtable，部分版本支持小集合 listpack | 去重、标签、共同好友 | `SADD` / `SISMEMBER` / `SINTER` / `SCARD` |
| **ZSet** | 小对象 listpack / skiplist + hashtable | 排行榜、延迟任务、Top-K | `ZADD` / `ZRANGE` / `ZREVRANK` / `ZSCORE` |

编码随版本、元素大小和配置阈值变化，用 `OBJECT ENCODING` 与 `MEMORY USAGE` 观察实际对象，不把旧版 ziplist 当成所有版本的实现。类型选型还要看**访问粒度**：只读两个字段时 `HMGET` 通常比取整个大 JSON 更合适；`HGETALL`、`SMEMBERS` 和大范围 `LRANGE` 都可能产生很大的执行和响应成本。

### 持久化对比

| 方式 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **RDB** | `BGSAVE` 通常 fork 子进程生成快照 | 紧凑，便于备份和恢复 | 故障可能丢失快照之后的写入；fork 与写时复制有成本 |
| **AOF** | 记录写操作，重启时重建数据；Redis 7 引入多部件 AOF | 可按 fsync 策略降低丢失窗口 | `everysec` 通常以约 1 秒为风险量级，不是所有故障下的硬上界；重写和磁盘也影响延迟 |
| **混合持久化** | AOF 重写时先写 RDB 快照，再追加增量 AOF 命令（Redis 4.0+） | 兼顾恢复速度与数据完整性 | 可读性下降，需 Redis 4.0+ 支持 |

### 内存淘汰策略

| 策略 | 说明 |
|------|------|
| `volatile-lru` | 从设置了过期时间的 key 中，淘汰最近最少使用的 |
| `volatile-ttl` | 从设置了过期时间的 key 中，淘汰剩余 TTL 最短的 |
| `volatile-random` | 从设置了过期时间的 key 中，随机淘汰 |
| `volatile-lfu` | 从设置了过期时间的 key 中，淘汰访问频率最低的（Redis 4.0+） |
| `allkeys-lru` | 从所有 key 中，淘汰最近最少使用的（**最常用**） |
| `allkeys-random` | 从所有 key 中，随机淘汰 |
| `allkeys-lfu` | 从所有 key 中，淘汰访问频率最低的（Redis 4.0+） |
| `noeviction` | 不淘汰，内存满后写操作直接报错（默认值） |

### 执行模型：为什么一个慢命令会拖慢其他请求？

客户端等待时间可拆成：连接获取/建连 + 网络往返 + 服务端排队 + 命令执行 + 响应传输。常规命令串行执行意味着，一个大集合运算、长 Lua 或巨大响应可能拖慢同节点上的其他 key；“单线程”不等于 Redis 进程只有一个线程，也不意味着所有命令都是 O(1)。

| 手段 | 解决什么问题 | 不提供什么保证 |
|------|--------------|----------------|
| Pipeline | 批量发送减少 RTT 与系统调用 | 不提供事务隔离；断线后各条命令结果可能不同 |
| `MULTI/EXEC` | 执行阶段不被其他客户端命令插入 | 运行时单条命令错误不会回滚此前命令，也不会阻止后续命令执行 |
| `WATCH` + 事务 | 乐观 CAS，被观察的 key 变化则放弃 EXEC | 冲突后需重新读取、计算并有限重试，不适合无限自旋 |
| Lua / Functions | 服务端执行带分支的复合操作，避免并发交错 | 不跨数据库做事务，不自动回滚，不保证复制与落盘已经完成 |

**业务结果未知**：客户端 `INCR` 超时，可能是命令没到、已执行但响应丢失，也可能在排队。直接重试可能多加一次。能否重试要由业务幂等决定，不能由“网络异常”四个字决定。

### 主从、Sentinel 与 Cluster：三个不同层次

| 方案 | 管什么 | 关键限制 |
|------|--------|----------|
| 主从复制 | 把一个主节点的数据复制到副本，可分担读 | 通常异步；副本读可能落后，复制本身不负责完整的自动故障切换 |
| Sentinel | 监测、判定故障、协调提升副本并发现新主 | 不做数据分片；客户端必须支持主地址变化和连接重建 |
| Redis Cluster | 16384 个 slot 的分片、路由和各分片故障转移 | 单 key 仍只在一个分片；跨 slot 的多 key 操作受限制 |

**复制恢复过程**：副本记录复制 ID 和偏移量，断线后用 PSYNC 尝试部分重同步。若所需历史仍在 replication backlog 中，可补发增量；否则需要全量同步，传输快照并衔接期间增量写入。backlog 应根据峰值复制字节速率 × 希望覆盖的断线时间估算，再留余量，而不是只按 key 数设置。

**Sentinel 的两个门槛不能混淆**：配置的 `quorum` 用于确认主节点客观下线；发起故障转移还要取得 Sentinel 多数派授权。Sentinel 应跨故障域部署。它不是代理，请求仍由客户端直接发往 Redis 主节点。

**Cluster 客户端路由**：通常按 `CRC16(key) mod 16384` 计算 slot；`{order:123}:stock` 与 `{order:123}:result` 使用相同 hash tag，可放在同一 slot。`MOVED` 提示 slot 的归属变化，应刷新路由；迁移中的 `ASK` 需要针对本次请求使用目标节点与 `ASKING`，不能永久改写整张路由。把所有 key 都写成 `{global}:...` 会把整个业务集中到一个分片。

### 持久化和复制分别挡住哪一种故障？

```text
主节点执行 SET，并返回 OK
    -> 异步传播到副本
    -> AOF 缓冲写入操作系统
    -> 根据策略 fsync 到持久化介质
```

这是不同里程碑的示意，不表示所有配置都遵循相同返回时序。必须问清“成功”是主内存接受、副本接收，还是磁盘确认。

1. **`appendfsync always/everysec/no`**：在延迟与数据丢失窗口间取舍；`no` 交给操作系统刷盘。`everysec` 的约 1 秒只描述典型预期，磁盘阻塞、系统故障和相关配置会改变结果。
2. **fork 与 COW**：生成 RDB/AOF 重写子进程时有 fork 暂停，父进程继续写会复制被修改的内存页。高写入期可能产生明显额外内存与 I/O 压力，不能把 `maxmemory` 设成机器全部内存。
3. **`WAIT`**：在同一连接上等待此前写入被指定数量副本确认，返回实际确认数；超时不会撤销已执行的写入。它不是共识提交，也不能保证故障转移一定选中包含该写入的副本。
4. **`WAITAOF`（Redis 7.2+）**：提供等待 AOF 刷盘确认的能力，需满足相应 AOF 配置；不能把磁盘确认等同于业务跨系统事务。
5. **限写保护**：`min-replicas-to-write` 与 `min-replicas-max-lag` 可在健康副本不足时拒写，但只是降低风险，不把异步复制变成线性一致协议。

因此缓存丢失可以回源，订单账本丢失却不能靠“稍后重试”修好。先定义 Redis 中的数据是否可重建，再选择持久化、淘汰策略、备份、故障转移和业务补偿方案。

---

## 典型场景与最佳实践

### 1. 缓存策略（Cache Aside 旁路缓存）

Cache Aside 是最常用的缓存模式：**读时先查缓存，未命中再查 DB 并回写；写时先更新 DB，再删除缓存**。

**为什么是"删缓存"而不是"更新缓存"？**

更新缓存存在两个问题：
- **写写并发**：两个线程同时更新 DB，后写入的线程先更新缓存，先写入的线程后更新缓存，导致缓存值与 DB 不一致。
- **无效计算**：缓存中的值可能在更新后很长时间才被读取，提前计算浪费资源。

删除缓存则简单清晰，下次读时再由 DB 重新填充。

**延迟双删**（应对先删缓存再更新 DB 的并发脏读问题）：

```
1. 删除缓存
2. 更新数据库
3. 延迟一段时间（如 500ms，覆盖可能的读请求回写时间）
4. 再次删除缓存
```

推荐顺序：**先提交 DB 事务，再删缓存**。不是在 `@Transactional` 方法内部执行完 `save()` 就认为已提交。删除失败需由持久化的 Outbox/CDC 或任务记录重试；只在内存里排一个任务，进程崩溃仍会丢。

**更新后删除也不是强一致**：读请求 A 缓存未命中并读到旧版本；写请求 B 提交新版本并删缓存；A 最后回填旧版本。这是“旧值晚到”，不是删除失败。延迟双删只是缩小窗口，固定 500ms 无法覆盖任意慢查询或暂停。可根据业务选择短 TTL、提交后可靠失效、版本化回填或绕过缓存；要求库存/余额判断准确时，应在权威存储中用事务和条件更新裁决。

更完整的并发时序与方案边界见 [缓存策略](../system-design/caching-strategies)。

### 2. 分布式锁

**基本实现**：使用 `SET key value NX EX seconds` 原子命令，NX 保证互斥，EX 保证锁自动过期防止死锁。

**释放锁必须保证原子性**：先 GET 验证是否是自己的锁，再 DEL，两步操作非原子，需用 Lua 脚本：

```java
// 分布式锁 — 释放锁的 Lua 脚本
String luaScript =
    "if redis.call('get', KEYS[1]) == ARGV[1] then " +
    "  return redis.call('del', KEYS[1]) " +
    "else " +
    "  return 0 " +
    "end";
```

**Redisson WatchDog（看门狗）**：Redisson 客户端会启动后台线程，在锁持有期间每隔 `lockWatchdogTimeout / 3`（默认 10 秒）自动续期，防止业务未执行完锁就过期。使用 `lock()` 方法时自动开启，使用带超时的 `tryLock(waitTime, leaseTime, unit)` 时不开启。

**RedLock**：向多个独立 Redis 实例申请带有效期的锁，在多数成功且剩余有效期足够时视为获锁；其正确性依赖时间和故障假设，不能仅凭“多数派”类比 Raft。选锁之前先区分：重复执行只是浪费计算，还是会破坏资金、库存等业务不变量。

#### 租约失效：看门狗也挡不住暂停后的旧持有者

```text
A 获得 10 秒租约 -> A 暂停 15 秒，续期也未运行
B 获得新租约 -> B 写资源
A 恢复 -> A 仍继续执行旧逻辑
```

Lua 比较随机 token 再删除，只能防 A 误删 B 的锁，不能防 A 继续写业务资源。看门狗也无法在进程长暂停或网络隔离时保证续期。

**Fencing token** 是递增的租约序号，由可靠协调者产生；受保护的数据库或存储必须保存已接受序号并拒绝更旧的写入。只有客户端检查 token 不够，异步复制 Redis 上一个可能回退的 `INCR` 也不能直接当作可靠 fencing 序列。支持事务的业务往往可直接用唯一约束、版本号 CAS 或数据库锁维护不变量。

### 3. 缓存穿透 / 击穿 / 雪崩

| 问题 | 描述 | 解决方案 |
|------|------|----------|
| **缓存穿透** | 查询一个**不存在**的 key，每次都穿透缓存直达 DB，大量此类请求会压垮 DB | ① 缓存空值（设置较短 TTL）② 布隆过滤器（Bloom Filter）在缓存层前拦截非法 key |
| **缓存击穿** | 某个**热点 key 过期**瞬间，大量并发请求同时穿透到 DB | ① 互斥锁：只允许一个请求重建缓存，其余等待 ② 逻辑过期：缓存永不过期，异步更新值 |
| **缓存雪崩** | **大量 key 在同一时间过期**，或 Redis 实例宕机，请求全部打到 DB | ① TTL 加随机偏移（如 `TTL = 基础时间 + random(0, 300s)`）② Redis 高可用（哨兵/集群）③ 限流降级熔断 |

### 4. 二级缓存（Caffeine + Redis）

**为什么需要二级缓存？** 本地命中可省去网络、协议和序列化成本，适合热点集中的可缓存读。实际收益取决于对象大小、访问分布和一致性要求，不能用一次 CPU 内存访问的纳秒延迟代替整个本地缓存调用时间，也不能预先保证 99% 命中率。

```
请求 → L1 本地缓存（Caffeine） ──命中→ 返回（< 1μs）
          ↓ miss
       L2 Redis ──命中→ 回填 L1 → 返回（~1ms）
          ↓ miss
       DB → 回填 L2 + L1 → 返回
```

#### 典型实现：Spring + Caffeine + Redis

```java
@Service
public class ProductService {

    // L1：Caffeine 本地缓存
    private final Cache<Long, Product> local = Caffeine.newBuilder()
        .maximumSize(10_000)                       // 最多 1 万条
        .expireAfterWrite(5, TimeUnit.MINUTES)     // 写入后 5 分钟过期
        .recordStats()                             // 开启统计
        .build();

    @Autowired private RedisTemplate<String, Product> redis;
    @Autowired private ProductRepository repo;

    public Product get(Long id) {
        // L1
        Product p = local.getIfPresent(id);
        if (p != null) return p;

        // L2
        p = redis.opsForValue().get("product:" + id);
        if (p != null) {
            local.put(id, p);                      // 回填 L1
            return p;
        }

        // DB
        p = repo.findById(id).orElse(null);
        if (p != null) {
            redis.opsForValue().set("product:" + id, p, Duration.ofMinutes(30));
            local.put(id, p);
        }
        return p;
    }
}
```

#### 数据一致性：L1 失效广播

**坑**：节点 A 更新后只清自己的 L1 + Redis，节点 B 仍可能读旧数据；在 DB 提交前删缓存，还可能让别的节点重新读到未更新的数据。推荐按下面的事务边界实现：

```text
同一数据库事务：更新商品 + 插入携带 productId/version 的 Outbox 事件
提交成功后：派发器读取 Outbox，删除 Redis 缓存，发布失效通知
各应用节点：接收通知，清理相应 L1；失败通知由派发器重试
节点断线重连：清空受影响 L1 或重新校验版本
兜底：L1 使用有限 TTL；监控 Outbox 延迟和广播连接状态
```

Spring 中 `@TransactionalEventListener(AFTER_COMMIT)` 可以避免提交前失效，但不是持久化消息：提交后、回调前崩溃仍有空隙。`RedisMessageListenerContainer` 是独立的订阅组件，不是 `RedisTemplate` 的方法。Pub/Sub 不保存离线消息；Outbox 能保证重试发布，不能保证每个离线 L1 都收到，所以仍需 TTL 和重连恢复。

| 方案 | 一致性 | 实现复杂度 | 适合 |
|------|--------|----------|------|
| **L1 短 TTL（如 30s）** | 限制一次写入后的驻留时间，但上游也可能是旧值 | 低 | 可容忍有界驻留的查询 |
| **Pub/Sub 失效广播** | 在线节点低延迟失效，离线可能漏通知 | 中 | 配置、字典，配合 TTL |
| **Redisson RLocalCachedMap** | 封装本地缓存同步；重连与失效策略需配置 | 中 | 采用相应 Map API 的应用 |
| **CDC + 可靠事件 + 版本检查** | 降低失效丢失与乱序风险，仍需处理旧值回填 | 高 | 对陈旧窗口有明确要求的查询 |

::: warning ⚠️ Caffeine 关键调优
- **`maximumSize`** vs **`maximumWeight`**——按对象数 vs 按内存权重
- **`expireAfterWrite`** vs **`expireAfterAccess`**——前者防止热数据占位过久，**生产推荐 Write**
- **`refreshAfterWrite` + `CacheLoader`**——后台异步刷新，请求拿到旧值不阻塞
- 命中率监控：`local.stats().hitRate()`，按接口和热点分布建立基线，同时观察回源量与陈旧窗口。
:::

### 5. 会话共享与 Spring Session

**问题**：传统 `HttpSession` 存在单机 JVM 内存，多节点集群无法共享 → 用户每次请求路由到不同节点都要重新登录。**解决**：用 Redis 作为 Session 存储，所有节点共享。

#### Spring Session + Redis：4 步集成

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  session:
    store-type: redis
    timeout: 30m
    redis:
      namespace: spring:session    # key 前缀
      flush-mode: on_save          # 何时刷到 Redis（on_save / immediate）
  data:
    redis:
      host: redis.prod
      port: 6379
```

**接入即生效**——`HttpSession` API 不需要改动，业务无感知。

```java
@RestController
public class LoginController {

    @PostMapping("/login")
    public String login(HttpSession session, @RequestBody User user) {
        // 业务代码不变，但 session 已经存在 Redis 中
        session.setAttribute("userId", user.id());
        return "ok";
    }
}
```

#### 序列化坑（生产 Top 1）

| 序列化方式 | 优点 | 缺点 |
|----------|------|------|
| **JDK 序列化**（默认）| 兼容性最好 | 体积大；类升级容易 `InvalidClassException` |
| **JSON（Jackson2JsonRedisSerializer）** | 体积小、可读 | **不支持继承多态**，要写额外配置 |
| **Protostuff / Kryo** | 最快、最小 | 不可读、需注册类 |

**序列化选择**：固定 DTO 可用明确类型的 JSON 序列化器；使用 `GenericJackson2JsonRedisSerializer` 时要考虑类型元数据、允许的类型范围和版本兼容。JSON 不代表任意类变更都兼容，不应对不可信数据开放无限制多态反序列化。Spring Session 使用命名 Bean `springSessionDefaultRedisSerializer`，不是任意一个业务 `RedisTemplate`：

```java
@Bean
RedisSerializer<Object> springSessionDefaultRedisSerializer() {
    return new GenericJackson2JsonRedisSerializer();
}
```

这是 Spring Data Redis 3.x 常见 API 的示意。改序列化格式前需处理存量 Session，可使用新 namespace 分阶段迁移或接受重新登录；滚动发布时必须验证新旧实例都能解析过渡期数据。

#### Spring Session vs Tomcat Session vs JWT

| 方案 | 状态存储 | 跨节点共享 | 主动注销 | 适合 |
|------|---------|----------|---------|------|
| **Tomcat 集群 Session** | 各节点 + 复制 | ✅（性能差） | ✅ | 老系统 |
| **Spring Session + Redis** | Redis | ✅ | ✅ | **微服务、企业应用首选** |
| **JWT（无状态）** | 客户端 | ✅（天然无状态） | ❌（需要黑名单） | 跨域 API、SPA |

详见 [Web 基础 · Cookie vs Session vs Token](../web-and-frameworks/web-basics#cookie-vs-session-vs-token)。

---

## 面试常问 & 怎么答

**Q：Redis 为什么这么快？**

> 以内存工作集减少磁盘访问，常规命令串行执行简化共享状态竞争，配合 I/O 多路复用和适配场景的数据结构。端到端延迟仍包含排队、网络和序列化；慢命令、大响应和持久化压力都可能拉高 P99，不能回答成“每个请求都是纳秒级”。

**Q：Redis 6.0 引入多线程，是否还是单线程？**

> Redis 6.0 引入可配置的网络 I/O 线程；读取、解析与响应工作的分配随版本和配置变化。理解的重点是常规命令执行仍以串行为核心，不应把网络线程数当作同一 key 可并行写入的数量。

**Q：什么是大 key 问题，如何处理？**

> 大 key 没有适合所有业务的固定阈值，要同时看字节数、元素数、命令复杂度和访问频率。危害包括阻塞执行、巨大响应、迁移成本及分片内存不均。
>
> 处理方式：按访问模式拆分，使用分页/批量上限，以 `UNLINK` 降低同步释放成本；低峰限速使用 `SCAN`、`MEMORY USAGE`、`HLEN`/`SCARD` 等采样。`SCAN` 不是一致性快照，也不是零开销，不应在生产遍历使用 `KEYS *` 或随意开启 `DEBUG`。

**Q：什么是热 key 问题，如何处理？**

> 热 key 指极少数 key 承受绝大多数请求，导致单个 Redis 节点 CPU 飙升。处理方式：① **两级缓存**：应用本地缓存（Caffeine/Guava Cache）+ Redis，减少 Redis 访问；② **key 加后缀分散 slot**：将热 key 复制为 `key#1`、`key#2` … `key#N`，随机读取，分散到不同节点。

---

## 常见陷阱

| 陷阱 | 原因 | 正确做法 |
|------|------|----------|
| 缓存与 DB 双写不一致 | 提交前失效、删除丢失、旧值晚到都可能发生 | 提交后可靠失效，按陈旧窗口选择 TTL、版本检查或绕过缓存 |
| 分布式锁不设过期时间 | 持锁进程崩溃后锁永不释放，造成死锁 | 必须设 `EX`，业务时间不确定时用 Redisson WatchDog 续期 |
| 大 key 用 `DEL` 删除 | `DEL` 同步删除，key 越大阻塞主线程越久 | 改用 `UNLINK` 异步删除，或先 `HSCAN`/`SSCAN` 拆分再删 |
| 所有 key 使用相同 TTL | 批量缓存同时过期，请求瞬间全部打到 DB | TTL 加随机偏移（`baseTime + random(0, N)`），错峰过期 |

---

## 看到什么就先想到这类

- **"缓存/高性能读取"** → Redis String / Hash
- **"读密集 + 热点集中"** → 二级缓存（Caffeine L1 + Redis L2）
- **"排行榜/Top-K"** → Redis ZSet
- **"分布式锁"** → `SETNX` + Lua + Redisson
- **"计数器/限流"** → Redis `INCR` / Lua 滑动窗口 / 令牌桶
- **"去重/共同好友"** → Redis Set
- **"缓存穿透/击穿/雪崩"** → 布隆过滤器 / 互斥锁 / TTL 随机
- **"会话共享 / 多节点登录"** → Spring Session + Redis
- **"订单超时关闭 / 延迟通知"** → Redis 延迟队列（ZSet / Stream）
- **"防超卖 / 防重复提交"** → Lua 原子脚本（库存扣减 / 幂等 Token）
- **"多节点本地缓存不一致"** → Redis Pub/Sub 失效广播 / Redisson RLocalCachedMap

---

## 深度补充

### Redis 限流实现

**滑动窗口限流**：`KEYS[1]` 为窗口 key，参数依次为正整数上限、窗口毫秒数、可信网关提供的统一时基毫秒时间、逻辑请求唯一 ID。相同 ID 在同一有效窗口内重试不重复计数；不同请求即使同一毫秒到达也必须使用不同 ID。

```lua
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requestId = ARGV[4]

if not limit or limit < 1 or limit ~= math.floor(limit) or
   not window or window < 1 or window ~= math.floor(window) or
   not now or not requestId or requestId == '' then
    return redis.error_reply('INVALID_ARGUMENT')
end

redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
if redis.call('ZSCORE', key, requestId) then
    return 1
end
if redis.call('ZCARD', key) >= limit then
    return 0
end
redis.call('ZADD', key, now, requestId)
redis.call('PEXPIRE', key, window)
return 1
```

窗口定义为 `(now - window, now]`。请求 ID 必须由可信入口生成或校验，不能让调用方复用同一 ID 无限绕过限流。跨节点时钟偏差、Redis 故障后放行还是拒绝、租户 key 基数与脚本耗时，都属于限流方案的一部分。

| 限流算法 | Redis实现 | 优点 | 缺点 |
|---------|---------|------|------|
| 固定窗口 | INCR + EXPIRE | 简单 | 窗口边界突刺问题 |
| 滑动窗口 | ZSet + ZREMRANGEBYSCORE | 精确，无突刺 | 内存随请求量增长 |
| 令牌桶 | Lua脚本模拟 | 允许突发流量 | 实现相对复杂 |

---

### Redis Stream 消息队列

Redis 5.0 新增 Stream 类型，支持持久化、消费者组、消息ACK：

```bash
# 生产者：添加消息（* 表示自动生成ID）
XADD orders * user_id 123 amount 99.9

# 创建消费者组（从头开始消费：0，从现在开始：$）
XGROUP CREATE orders order-group 0 MKSTREAM

# 消费者读取（> 表示读取未投递给该组的新消息）
XREADGROUP GROUP order-group consumer1 COUNT 1 STREAMS orders >

# 确认消息已处理
XACK orders order-group <message-id>

# 查看未确认（pending）消息
XPENDING orders order-group - + 10
```

**与其他方案对比：**

| 方案 | 持久化 | 消费组 | ACK确认 | 推荐场景 |
|------|--------|--------|---------|---------|
| List + BLPOP | ✅（RDB/AOF） | ❌ | ❌ | 简单任务队列 |
| Pub/Sub | ❌ | ❌ | ❌ | 实时广播通知 |
| **Stream** | 取决于 RDB/AOF 与复制配置 | ✅ | ✅ | 需要自行实现恢复与幂等的消息处理 |

#### Spring Boot 生产者 / 消费者关键实现

以下按 Spring Data Redis 3.x 的 `StringRedisTemplate` 与 `MapRecord` 展示关键结构，省略 imports、业务仓储和连接配置。消息至少包含稳定的业务事件标识；这里约定一个订单只产生一次“创建订单”事件，以 `orderId` 去重。若存在支付、退款等多种事件，必须单独增加 `eventId`，不能全部按订单号去重。

##### 1. 消息载体

```java
public record OrderEvent(String orderId, Long userId, BigDecimal amount, Instant createdAt) {
    public Map<String, String> toMap() {
        return Map.of(
            "orderId",   orderId,
            "userId",    userId.toString(),
            "amount",    amount.toPlainString(),
            "createdAt", createdAt.toString()
        );
    }
    public static OrderEvent fromMap(Map<String, String> fields) {
        return new OrderEvent(
            fields.get("orderId"),
            Long.parseLong(fields.get("userId")),
            new BigDecimal(fields.get("amount")),
            Instant.parse(fields.get("createdAt"))
        );
    }
}
```

##### 2. 生产者（Producer）

```java
@Service
@RequiredArgsConstructor
public class OrderEventProducer {

    private static final String STREAM_KEY = "stream:orders";

    private final StringRedisTemplate redis;

    public RecordId publish(OrderEvent event) {
        RecordId id = redis.opsForStream().add(STREAM_KEY, event.toMap());
        if (id == null) {
            throw new IllegalStateException("Missing stream record id");
        }
        return id;
    }
}
```

不要在订单事件发布时盲目裁剪到固定 10 万条：消费者停顿时可能删掉未处理正文。保留策略应覆盖最大消费延迟、重试和回放窗口，并监控容量；业务 DB 与 XADD 之间仍需 Outbox 解决双写空隙。发送超时结果未知时，使用相同业务事件标识重试，由消费端去重。

##### 3. 消费者配置（Consumer Group）

部署初始化先执行 `XGROUP CREATE stream:orders order-group 0 MKSTREAM`。并发初始化只忽略明确的 `BUSYGROUP`，权限、网络、类型错误必须使初始化失败，不能统统当成“组已存在”。

```java
@Configuration
@RequiredArgsConstructor
public class OrderStreamConsumerConfig {

    private static final String STREAM_KEY  = "stream:orders";
    private static final String GROUP_NAME  = "order-group";
    private static final String CONSUMER    = "consumer-" + UUID.randomUUID();

    private final RedisConnectionFactory connectionFactory;
    private final OrderEventHandler handler;

    @Bean(destroyMethod = "stop")
    public StreamMessageListenerContainer<String, MapRecord<String, String, String>>
            container() {

        var options = StreamMessageListenerContainer
            .StreamMessageListenerContainerOptions.builder()
            .pollTimeout(Duration.ofSeconds(2))
            .batchSize(10)
            .build();

        var container = StreamMessageListenerContainer.create(connectionFactory, options);

        container.receive(
            Consumer.from(GROUP_NAME, CONSUMER),
            StreamOffset.create(STREAM_KEY, ReadOffset.lastConsumed()),
            handler
        );

        container.start();
        return container;
    }
}
```

##### 4. 消息处理器 + 手动 ACK + 重试

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventHandler
    implements StreamListener<String, MapRecord<String, String, String>> {

    private static final String STREAM_KEY = "stream:orders";
    private static final String GROUP_NAME = "order-group";
    private final StringRedisTemplate redis;
    private final OrderService orderService;

    @Override
    public void onMessage(MapRecord<String, String, String> record) {
        RecordId id = record.getId();
        try {
            OrderEvent event = OrderEvent.fromMap(record.getValue());
            orderService.handleIdempotently(event);
            ack(id);
        } catch (Exception failure) {
            log.error("Failed to process message {}", id, failure);
        }
    }

    private void ack(RecordId id) {
        redis.opsForStream().acknowledge(STREAM_KEY, GROUP_NAME, id);
    }
}
```

`handleIdempotently` 是业务实现必须满足的契约：**消费去重记录和业务修改在同一个本地数据库事务中提交**，并通过 Spring 事务代理调用，方法正常返回时事务已经提交。以 PostgreSQL 为例，核心流程如下，参数由应用绑定：

```sql
BEGIN;
INSERT INTO consumed_event (consumer_group, event_id)
VALUES (:consumer_group, :event_id)
ON CONFLICT (consumer_group, event_id) DO NOTHING
RETURNING event_id;
```

`consumed_event` 需要 `(consumer_group, event_id)` 唯一约束。应用检查返回行：首次插入则继续执行业务 SQL 并提交；未插入说明已有已提交处理结果，跳过副作用后提交。任何业务异常都回滚整个事务。若还要发短信或调用支付平台，不能纳入这个本地事务，需进一步使用 Outbox、外部幂等键和对账。

```text
业务失败、事务回滚 -> 去重记录也回滚，不 ACK，允许重试
事务提交、ACK 前崩溃 -> 再投递命中去重记录，跳过业务后 ACK
ACK 超时 -> 结果未知，重复 ACK 可接受，业务仍受持久去重保护
```

**反例**：先 `SETNX idem=1` 再处理业务，业务失败后下一次消费看到标记就 ACK，会丢失业务效果；反过来先执行副作用再写标记，又存在重复执行窗口。单独的 Redis 标记不能原子覆盖数据库业务。

##### 5. 死信处理（PEL 重试 + 转移到 DLQ）

**PEL 不是自动重试队列**。用 `>` 读取只会获取未分配的新消息；失败消息要显式读取当前消费者的 pending，或接管其他消费者的 pending：

```text
定时恢复循环（Redis 6.2+）：
  XAUTOCLAIM stream:orders order-group <本实例恢复消费者名> 300000 <cursor> COUNT 100
  保存返回的新 cursor；到 0-0 表示本轮扫描结束
  对返回的每条消息立即调用同一套幂等业务处理逻辑
  成功提交业务事务后 XACK；失败则保留 pending
  达到重试/事件年龄上限后，进入死信转移流程
```

`XCLAIM`/`XAUTOCLAIM` 改变所有权并返回消息，**不会自动调用 Spring listener**。只执行 claim 而丢掉返回值，会让消息在 PEL 里继续停留。扫描不能永远只看前 100 条，否则后面的超时消息可能一直得不到处理。

**接管与死信的四个边界**：

1. 最小 idle 时间应高于正常处理时长并留余量；旧消费者可能只是慢而非死亡，接管后仍可能同时执行，因此业务幂等不可省。
2. `XPENDING` 的 delivery count 是投递/接管次数，不等于准确的业务执行失败次数。永久错误、瞬时错误和长耗时应分别处理。
3. 转死信必须先保证 DLQ 中存在可追踪记录，再 ACK 原消息；两步之间崩溃会重复 DLQ 记录，需按原始事件标识去重。同 slot 场景可用有界脚本把检查 pending、XADD DLQ 与 XACK 组合，但仍要预校验类型并考虑执行错误不回滚。
4. 若正文已被裁剪，只剩 pending 引用，应告警并从权威事件记录恢复，不要把“查不到消息”当作已处理。删除消费者前，先接管并处理它的 pending。

监听容器的订阅因连接等异常停止时，还需受控重新注册或恢复；只有日志回调不等于已实现重连恢复。恢复线程要有独立限速、退避与死信告警，避免旧积压抢占全部新请求容量。

##### 6. 关键配置 / 实战要点

| 要点 | 说明 |
|------|------|
| **`XADD MAXLEN ~ N`** | `~` 是近似裁剪，不保证精确长度；传统裁剪可删除未消费/未 ACK 的正文，需先设计保留窗口 |
| **`pollTimeout`** | Spring container 阻塞 XREAD 时长；2-5s 平衡延迟与连接开销 |
| **业务幂等** | 去重唯一约束与业务修改同事务；不能依赖 ACK 或提前 SETNX 防重 |
| **PEL 监控** | 必须设告警：PEL 积压 > 阈值时报警，否则消息会"消失在 PEL 里" |
| **消费者命名** | 每个实例名应唯一；先恢复 pending，再清理旧消费者，不可直接删除有未处理消息的消费者 |
| **Cluster 限制** | Stream 是单 key 数据结构，**单 Stream 吞吐受单 slot 限制**；高吞吐场景按业务拆 N 个 Stream |
| **vs Kafka** | 比较保留时长、磁盘成本、复制语义、回放、分区与运维生态；吞吐需压测，两者都不自动提供跨所有分区的全局业务顺序 |

::: warning ⚠️ Stream 4 大生产坑
1. **没有保留与容量策略** → 不裁剪会持续增长，盲目 MAXLEN 又可能删掉待处理事件
2. **没监控 PEL** → 业务异常的消息悄悄堆积在 PEL，看监控以为消费正常
3. **依赖 ACK 防重** → ACK 是"通知 Redis 我处理完了"，**不防消费成功未 ACK 的二次投递** → 业务必须独立幂等
4. **直接清理离线消费者** → 未恢复的 pending 可能变得不可接管，应先处理积压再清理元数据
:::

---

### 延迟队列：ZSet vs Stream 两种实现

**经典场景**：订单 30 分钟未支付自动关闭、定时推送通知、延迟重试。**Redis 实现 2 种**：

#### 方案 1：ZSet（score = 触发时间戳）

```java
@Component
public class DelayQueue {

    private static final String KEY = "delay:orders";

    // 投递延迟消息
    public void offer(String orderId, long delayMs) {
        long triggerAt = System.currentTimeMillis() + delayMs;
        redis.opsForZSet().add(KEY, orderId, triggerAt);
    }

    // 轮询消费（用一个线程，1s 拉一批）
    @Scheduled(fixedDelay = 1000)
    public void poll() {
        long now = System.currentTimeMillis();
        // 取出所有 score ≤ now 的元素，原子性 ZRANGEBYSCORE + ZREM
        String lua = "local r = redis.call('ZRANGEBYSCORE', KEYS[1], 0, ARGV[1], 'LIMIT', 0, 100); " +
                     "if #r > 0 then redis.call('ZREM', KEYS[1], unpack(r)) end; return r;";
        List<String> ready = redis.execute(
            RedisScript.of(lua, List.class), Collections.singletonList(KEY), String.valueOf(now));
        ready.forEach(this::handleOrder);
    }
}
```

**优点**：实现简单、消息可见性强（`ZRANGE` 直接看队列）、可改优先级（score 即优先级）。
**边界**：上述代码是尽力执行示例。Lua 只保证多个轮询器不会同时取走同一成员；取出删除后、业务处理前进程崩溃，任务会丢，来不及“失败重投”。多个轮询器可以并行，但同一个 ZSet 仍受单分片约束，端到端延迟还包含排队与业务执行时间。

#### 方案 2：ZSet 到期索引 + Stream 可靠消费

**Stream 不原生提供任意延迟投递**。`MINID` 是裁剪边界，不是到期触发器；key TTL 通知也不是可靠任务投递。让 ZSet 只负责“何时到期”，Stream 负责“交给谁执行以及如何恢复”：

```text
投递：ZADD {delay:03}:due <dueAt> <taskId>
调度：有界 Lua 查询到期成员，先 XADD {delay:03}:work，再 ZREM due
消费：XREADGROUP -> 数据库幂等处理 -> XACK
恢复：XAUTOCLAIM 接管超时任务，失败重试或转 DLQ
兜底：扫描权威数据库中已到期但未完成的任务，补投相同 taskId
```

到期索引与工作 Stream 在同一 hash tag 中，脚本先校验 key 类型与参数，并限制单批数量。先添加后移除可使中途错误偏向重复而不是静默丢失，但 Lua 不提供回滚，故障切换也可能丢未复制写入，仍需稳定 taskId、消费幂等和数据库补偿。

另一种实现是 `due -> processing` 双 ZSet：领取时原子转入带可见性截止时间的 processing，完成后删除，超时后重投。它需要自行实现租约、ACK 和重试，不能简单地先 ZREM 再执行业务。

#### 方案对比与选型

| 方案 | 精度 | 持久化 | 多消费者并行 | 消息可见性 | ACK 重试 | 适合场景 |
|------|------|--------|------------|----------|---------|---------|
| **Redis ZSet** | 取决于轮询与积压 | 按 Redis 配置 | 可多轮询器领取 | ✅ | 需自行实现 | 可重建任务或配 processing 租约 |
| **ZSet + Stream** | 取决于调度与积压 | 按 Redis 配置 | ✅ | ✅ | 需恢复循环 | 已有 Redis 且能维护可靠性逻辑 |
| **RocketMQ 定时消息** | 取决于版本、配置和负载 | ✅ | ✅ | 需管理工具 | ✅ | 需要专门消息系统的场景 |
| **RabbitMQ TTL + DLX** | 秒级 | ✅ | ✅ | ⚠️ | ✅ | RabbitMQ 用户 |
| **JDK DelayQueue** | 毫秒级 | ❌ | ❌ | ✅ | ❌ | 单 JVM 内 |

::: warning ⚠️ 延迟队列 3 大坑
1. **轮询频率与精度的权衡**——1s 一次省 CPU 但延迟 1s；100ms 一次精准但 QPS × 10
2. **单分片积压**：按热点分布、命令耗时和到期延迟决定是否分片，不能只按固定 10 万条阈值判断。
3. **支付与超时关闭竞争**：消费者必须条件更新 `PENDING -> CLOSED`，已支付订单应无操作返回；任务到达不代表订单一定能关闭。
:::

详见 [消息队列 · 延迟消息实现订单超时取消](../system-design/message-queue#实战案例-延迟消息实现订单超时取消)。

---

### Lua 原子脚本：分布式原语的瑞士军刀

::: tip 💡 为什么 Redis 要支持 Lua
单条命令与跨多条命令的业务判断要分开讨论。Lua/Functions 可在服务端执行“读 → 判断 → 写”，不被其他客户端命令插入；`MULTI/EXEC`、`WATCH` 和专用原子命令也能解决相应问题。这里的原子主要指不交错，**不意味着异常时自动回滚已完成写入**。因此先校验参数和 key 类型，再修改数据，并限制脚本工作量。
:::

#### 五个经典 Lua 脚本（必背）

##### 1. 释放分布式锁（必背）

```lua
-- KEYS[1]: lock key, ARGV[1]: 锁的 unique value（防误删他人锁）
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
else
    return 0
end
```

##### 2. 库存扣减（防超卖）

参数 `ARGV[1]` 为正整数数量，示例限制库存与数量不超过十亿，避免 Lua 数值精度和无界业务输入。返回 `-1` 表示库存不足，缺失或格式错误则报错，不能把未初始化库存直接当作零。

```lua
local quantity = tonumber(ARGV[1])
if not quantity or quantity < 1 or quantity > 1000000000 or
   quantity ~= math.floor(quantity) then
    return redis.error_reply('INVALID_QUANTITY')
end
local stored = redis.call('GET', KEYS[1])
if not stored then
    return redis.error_reply('STOCK_NOT_INITIALIZED')
end
local stock = tonumber(stored)
if not string.match(stored, '^%d+$') or not stock or stock > 1000000000 then
    return redis.error_reply('INVALID_STOCK')
end
if stock < quantity then
    return -1
end
return redis.call('DECRBY', KEYS[1], quantity)
```

这只能保证当前 Redis 主节点上的一次条件扣减。请求超时重试、主从切换与 DB 落单失败仍要处理，完整订单需要预留状态、稳定 requestId、幂等落库与释放补偿，见 [高并发写架构](../system-design/high-concurrency-write)。

##### 3. 滑动窗口限流（前面 ZSet 实现）

详见上文 [Redis 限流实现](#redis-限流实现)。

##### 4. 令牌桶限流

`ARGV` 依次为桶容量、每秒补充速率、可信时基的当前秒数。容量至少为 1，速率必须为正；空闲过期时间不能短于从空桶补满所需时间。

```lua
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
if not capacity or capacity < 1 or not rate or rate <= 0 or not now then
    return redis.error_reply('INVALID_ARGUMENT')
end

local data = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(data[1]) or capacity
local last = tonumber(data[2]) or now
now = math.max(now, last)
tokens = math.min(capacity, tokens + (now - last) * rate)

local allowed = 0
if tokens >= 1 then
    tokens = tokens - 1
    allowed = 1
end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', KEYS[1], math.max(1, math.ceil(capacity / rate)))
return allowed
```

若容量 100、速率每秒 1 个，固定 60 秒过期会让空桶在尚未补满时突然恢复 100 个 token；上例按补满时间设置 TTL。时间回拨时不倒扣 token，但跨节点时基和 Redis 故障后的降级仍需设计。

##### 5. 幂等 Token 校验（防重复提交）

下例只实现一次性凭证消费，不是完整业务幂等：删除 token 后业务失败会阻止正常重试。创建订单等接口应保存请求摘要、处理状态和可重放结果，详见 [幂等性与热点 Key 设计](../system-design/hot-key-and-idempotency)。

```lua
-- KEYS[1]: token key
-- 一次性 token：存在则返回 1（首次）+ 删除；不存在返回 0（已使用过）
if redis.call('EXISTS', KEYS[1]) == 1 then
    redis.call('DEL', KEYS[1])
    return 1
else
    return 0
end
```

#### Spring Data Redis 调用 Lua

```java
@Bean
public DefaultRedisScript<Long> stockDecrScript() {
    var script = new DefaultRedisScript<Long>();
    script.setLocation(new ClassPathResource("scripts/stock-decr.lua"));
    script.setResultType(Long.class);
    return script;
}

@Autowired private DefaultRedisScript<Long> stockDecrScript;

public boolean tryDecr(String sku, int qty) {
    Long result = redis.execute(stockDecrScript,
        Collections.singletonList("stock:" + sku),
        String.valueOf(qty));
    return result != null && result >= 0;
}
```

#### Functions（Redis 7+ 替代 EVAL 的下一代方案）

Redis 7.0 推出 **Functions** —— 类似 Lua 但**支持服务端持久化**、模块化、可热加载：

```lua
#!lua name=mylib

redis.register_function('decr_stock', function(keys, args)
    local quantity = tonumber(args[1])
    if not quantity or quantity < 1 or quantity > 1000000000 or
       quantity ~= math.floor(quantity) then
        return redis.error_reply('INVALID_QUANTITY')
    end
    local stored = redis.call('GET', keys[1])
    if not stored then
        return redis.error_reply('STOCK_NOT_INITIALIZED')
    end
    local stock = tonumber(stored)
    if not string.match(stored, '^%d+$') or not stock or stock > 1000000000 then
        return redis.error_reply('INVALID_STOCK')
    end
    if stock < quantity then
        return -1
    end
    return redis.call('DECRBY', keys[1], quantity)
end)
```

```bash
redis-cli FUNCTION LOAD "$(cat mylib.lua)"
redis-cli FCALL decr_stock 1 stock:sku001 5
```

**Lua vs Functions 速选**：
- **简单脚本** → 仍用 Lua `EVAL` / `EVALSHA`
- **企业脚本治理** → 用 Functions（脚本库可持久化到 RDB/AOF）

#### Lua 4 大坑

| 坑 | 说明 | 应对 |
|----|------|-----|
| **脚本太长阻塞主线程** | 单线程模型下，Lua 也是阻塞执行 | 单脚本控制在毫秒级；禁止全表扫描 |
| **`EVALSHA` 缓存不存在** | 重启、故障转移或缓存清理后可能 `NOSCRIPT` | 使用客户端支持的加载/回退逻辑；Pipeline 中不能假设可在中途补发 |
| **多 key 不在同一 slot** | 即使恰好位于同一物理节点，也不代表可跨 slot 执行脚本 | 显式通过 KEYS 传递所有访问 key，合理使用 hash tag，避免全业务单热点 |
| **Lua 不支持 `redis.call('SUBSCRIBE')`** | 阻塞命令在脚本里不能用 | 用其他机制（如 Stream） |

---

### 高频面试Q&A

**Q: 如何用Redis实现一个可靠的分布式锁？**

A: **基础实现**：`SET key value NX EX timeout`（原子操作：不存在时设置+同时设置超时）。释放时必须用Lua脚本保证原子判断+删除（防止误删他人的锁）：
```lua
if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
else
    return 0
end
```
Redisson 可封装续期、释放与可重入等细节，但不能消除进程暂停、租约过期和异步复制故障切换的窗口。若重复执行会破坏不变量，必须由受保护资源执行 fencing、版本检查或数据库事务；锁框架不能替代业务正确性设计。

**Q: Redis的过期键删除策略是什么？**

A: 访问时检查过期与后台主动过期循环相结合，主动清理受时间预算、版本和配置影响，不应死记固定抽样个数或比例。过期删除是 TTL 语义，内存淘汰是 maxmemory 压力下的选择策略；key 到期不表示内存立即被释放，也不保证到期通知准时可靠。

**Q: Redis为什么单线程还这么快？**

A: 四个原因：① **纯内存操作**——内存访问约100ns，磁盘约10ms，快10万倍；② **单线程无锁**——无需互斥锁和上下文切换，CPU利用率高；③ **I/O多路复用**——epoll模型，单线程处理大量并发连接，非阻塞；④ **简单高效的数据结构**——大多数命令O(1)。注意：Redis 6.0+引入多线程处理**网络I/O**（解析请求和返回响应），但**命令执行仍是单线程**，保证数据安全。

## 生产诊断：从症状走到证据

### 延迟升高，先查哪一层？

| 证据 | 可能原因 | 下一步 |
|------|----------|--------|
| 客户端耗时高，SLOWLOG 无明显增长 | 连接池等待、网络、TLS、客户端 GC、事件循环阻塞、服务端排队 | 拆分连接等待与命令 RTT，对齐应用和节点时间线 |
| 特定命令执行时间高 | 大集合、长 Lua、一次返回过多内容 | 查看命令类型与 key 大小，缩小批次和返回范围 |
| 延迟随 BGSAVE/AOF rewrite 出现 | fork、COW、磁盘竞争 | 查看 fork 时间、COW 峰值、磁盘延迟与写入速率 |
| 某一个 Cluster 主节点饱和 | 热 key、slot 分布不均或单大 Stream | 按节点分组，看 CPU、网络和业务 key 分布 |
| 命中率骤降且 DB 压力上升 | 集中到期、淘汰、故障切换或预热不足 | 查看 expired/evicted 增量、内存策略，先限制回源并发 |

`SLOWLOG` 主要记录命令执行耗时，不包含客户端排队和网络往返；没有慢日志不能证明 Redis 调用链路正常。不要一开始就增大客户端超时，这会让更多请求占住连接和线程。

以下命令使用已配置好 ACL/TLS 的连接执行；不在命令行明文携带密码，慢日志可能含业务参数，输出要脱敏：

```text
INFO stats
INFO memory
INFO persistence
INFO replication
INFO commandstats
SLOWLOG GET 20
LATENCY LATEST
MEMORY USAGE product:123
OBJECT ENCODING product:123
XINFO GROUPS stream:orders
XPENDING stream:orders order-group
```

`LATENCY` 事件记录取决于是否配置相应监控；`INFO` 累计计数应看时间窗口内增量，不直接拿实例启动以来总量比较。`MONITOR` 会增加开销并暴露命令内容，不作为常开诊断工具。

### 内存预算为什么不能只算 value 大小？

预算应包含 key/value、对象头、字典和紧凑编码开销、过期索引、内存分配碎片、客户端缓冲、复制 backlog，以及持久化期间的额外 COW 内存。`used_memory`、RSS 与按 maxmemory 计算的内存并不完全相同；查看 `mem_not_counted_for_evict` 等指标解释差异，不能只看碎片比率就认定泄漏。

例如 1000 万个对象的序列化 value 平均 500B，裸 value 约 5GB；真实预算还要根据样本的 `MEMORY USAGE`、key 长度和编码评估，再为副本、复制缓冲和重写峰值留空间。平均值会掩盖少量大对象，应记录大小分位数和最大值。

**把缓存与可靠状态分开治理**：可重建缓存可用 allkeys-lru/lfu；会话、租约、去重记录和未消费事件若被提前淘汰，影响的是业务语义。独立实例/集群能隔离淘汰与故障策略，仅换 key 前缀或逻辑 DB 并不能隔离内存压力。`noeviction` 也不是无限可靠，写入失败必须被业务显式处理。

### 上线前的故障演练

| 注入点 | 应观察到的行为 | 不应出现的行为 |
|--------|----------------|----------------|
| 扣库存响应丢失 | 同 requestId 查询/重放结果，权威库存保持不变量 | 客户端无条件重复扣减 |
| 主节点切换 | 连接拓扑刷新，失败按预算退避，业务对账 | 把新主就绪等同于全部已确认写入仍存在 |
| 消费业务提交后、ACK 前崩溃 | 接管后命中持久去重，不再执行副作用 | Redis 标记丢失导致重复扣款 |
| L1 订阅断线 | TTL 或重连清理使旧缓存最终失效 | 认为 Pub/Sub 能自动回放离线事件 |
| Redis 整体不可用 | 有界回源、降级或按风险拒绝服务 | 所有实例同时无限回源 DB |

## 官方参考

- [Redis 事务与 WATCH](https://redis.io/docs/latest/develop/using-commands/transactions/)
- [Redis Stream：消费者组、接管与消息安全](https://redis.io/docs/latest/develop/data-types/streams/)
- [Redis 持久化](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
- [Redis 复制](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)
