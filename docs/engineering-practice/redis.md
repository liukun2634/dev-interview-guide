---
title: Redis 实战
---

# Redis 实战

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Redis 是基于内存的键值存储，单线程 + IO 多路复用实现高性能。**工程上 Redis 远不止"缓存"**——它同时承担**分布式锁、限流、延迟队列、消息队列、会话共享、二级缓存协调、防超卖、幂等 Token、地理位置查询、UV 统计** 等 10+ 类分布式原语的角色。面试重点：5 种数据结构的场景选型、缓存三问、分布式锁（Redisson 看门狗）、Lua 原子脚本、延迟队列 ZSet vs Stream。
:::

---

## 核心概念

### 5 种数据结构

| 类型 | 底层实现 | 典型场景 | 常用命令 |
|------|----------|----------|----------|
| **String** | SDS（简单动态字符串） | 缓存对象、计数器、分布式锁 | `SET` / `GET` / `INCR` / `EXPIRE` |
| **Hash** | ziplist（小）/ hashtable（大） | 存储对象字段、用户信息 | `HSET` / `HGET` / `HMGET` / `HDEL` |
| **List** | quicklist（ziplist 链） | 消息队列、最新动态、分页列表 | `LPUSH` / `RPOP` / `LRANGE` / `LLEN` |
| **Set** | intset（纯整数）/ hashtable | 去重、标签、共同好友 | `SADD` / `SMEMBERS` / `SINTER` / `SCARD` |
| **ZSet** | ziplist（小）/ skiplist + hashtable | 排行榜、延迟队列、Top-K | `ZADD` / `ZRANGE` / `ZREVRANK` / `ZSCORE` |

### 持久化对比

| 方式 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **RDB** | 定时快照，fork 子进程将内存数据以二进制写入 `.rdb` 文件 | 文件紧凑、恢复速度快、对主线程影响小 | 两次快照之间的数据会丢失 |
| **AOF** | 将每条写命令追加到 `.aof` 日志文件，重启时重放 | 数据更完整（最多丢失 1 秒）、可读性强 | 文件较大、恢复速度慢 |
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

推荐顺序：**先更新 DB，再删缓存**。若删缓存失败，可通过消息队列重试或订阅 MySQL binlog 异步删除。

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

**RedLock**：为解决单点 Redis 故障，Antirez 提出 RedLock 算法，向 N 个独立 Redis 实例申请锁，超过半数成功才算获锁。实际生产中因时钟漂移等问题存在争议，多数场景用单机 Redis + Redisson 即可满足需求。

### 3. 缓存穿透 / 击穿 / 雪崩

| 问题 | 描述 | 解决方案 |
|------|------|----------|
| **缓存穿透** | 查询一个**不存在**的 key，每次都穿透缓存直达 DB，大量此类请求会压垮 DB | ① 缓存空值（设置较短 TTL）② 布隆过滤器（Bloom Filter）在缓存层前拦截非法 key |
| **缓存击穿** | 某个**热点 key 过期**瞬间，大量并发请求同时穿透到 DB | ① 互斥锁：只允许一个请求重建缓存，其余等待 ② 逻辑过期：缓存永不过期，异步更新值 |
| **缓存雪崩** | **大量 key 在同一时间过期**，或 Redis 实例宕机，请求全部打到 DB | ① TTL 加随机偏移（如 `TTL = 基础时间 + random(0, 300s)`）② Redis 高可用（哨兵/集群）③ 限流降级熔断 |

### 4. 二级缓存（Caffeine + Redis）

**为什么需要二级缓存？** Redis 网络 RTT 通常 **0.5-2ms**，本地内存访问 **纳秒级**——**相差 6 个数量级**。对于读密集且热点集中的场景（如商品详情、配置信息），增加一层 **本地缓存（L1）+ Redis（L2）** 能让 99% 的请求不出 JVM。

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

    // L1：Caffeine 本地缓存（W-TinyLFU 算法，命中率比 LRU 高 10-30%）
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

**坑**：节点 A 更新数据后清掉自己的 L1 + Redis，**节点 B 的 L1 仍是旧数据**。解决：用 **Redis Pub/Sub** 或 **Redisson Topic** 广播失效事件。

```java
// 更新方
@Transactional
public void update(Product p) {
    repo.save(p);
    redis.delete("product:" + p.id());
    redis.convertAndSend("cache-invalidate", p.id());   // ★ 广播
}

// 各节点订阅
@PostConstruct
void subscribe() {
    redis.listenerContainer().addMessageListener(
        (msg, pattern) -> local.invalidate(Long.parseLong(new String(msg.getBody()))),
        new ChannelTopic("cache-invalidate")
    );
}
```

| 方案 | 一致性 | 实现复杂度 | 适合 |
|------|--------|----------|------|
| **L1 短 TTL（如 30s）** | 最终一致（容忍 30s 旧数据）| 极简 | 容忍延迟的查询 |
| **Pub/Sub 失效广播** | 准实时（秒级） | 中 | 配置、字典 |
| **Redisson RLocalCachedMap** | 准实时 + 内置 | 低（一行注解） | Redisson 用户首选 |
| **Canal 监听 binlog + 广播** | 最强（避免缓存与 DB 不一致根源）| 高 | 金融级 |

::: warning ⚠️ Caffeine 关键调优
- **`maximumSize`** vs **`maximumWeight`**——按对象数 vs 按内存权重
- **`expireAfterWrite`** vs **`expireAfterAccess`**——前者防止热数据占位过久，**生产推荐 Write**
- **`refreshAfterWrite` + `CacheLoader`**——后台异步刷新，请求拿到旧值不阻塞
- 命中率监控：`local.stats().hitRate()`，**正常应 > 95%**
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

**生产推荐**：用 `GenericJackson2JsonRedisSerializer`——支持多态 + JSON 可读 + 不依赖类版本：

```java
@Bean
RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory cf) {
    var template = new RedisTemplate<String, Object>();
    template.setConnectionFactory(cf);
    template.setKeySerializer(new StringRedisSerializer());
    template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
    return template;
}
```

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

> 四个关键点：① **纯内存操作**，读写在纳秒级；② **单线程无锁竞争**，避免上下文切换和锁开销；③ **IO 多路复用（epoll）**，用少量线程处理大量并发连接；④ **高效数据结构**（SDS、跳表、压缩列表等），操作时间复杂度低。

**Q：Redis 6.0 引入多线程，是否还是单线程？**

> Redis 6.0 引入**网络 IO 多线程**，用多个 IO 线程并行处理网络读写（`read`/`write` 系统调用），提升网络吞吐；但**命令解析和执行仍在主线程**（单线程），保持无锁的简单性。所以说"Redis 是单线程"在命令执行层面仍然成立。

**Q：什么是大 key 问题，如何处理？**

> 大 key 指 String 类型 value 超过 **10 KB**，或集合类型元素超过 **5000 个**。危害：① 单次操作耗时长，阻塞主线程；② 网络传输慢；③ 内存分配不均匀（集群场景）。
>
> 处理方式：① **拆分**：Hash 大 key 按 field 分成多个小 key；② **异步删除**：用 `UNLINK` 替代 `DEL`，后台线程删除；③ **定期扫描**：用 `redis-cli --bigkeys` 或 `SCAN` + `DEBUG OBJECT` 识别大 key。

**Q：什么是热 key 问题，如何处理？**

> 热 key 指极少数 key 承受绝大多数请求，导致单个 Redis 节点 CPU 飙升。处理方式：① **两级缓存**：应用本地缓存（Caffeine/Guava Cache）+ Redis，减少 Redis 访问；② **key 加后缀分散 slot**：将热 key 复制为 `key#1`、`key#2` … `key#N`，随机读取，分散到不同节点。

---

## 常见陷阱

| 陷阱 | 原因 | 正确做法 |
|------|------|----------|
| 缓存与 DB 双写不一致 | 先更新缓存再更新 DB，并发下缓存值可能被覆盖为旧值 | 先更新 DB 再删缓存，配合延迟双删 |
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

**滑动窗口限流（Lua脚本保证原子性）：**

```lua
-- KEYS[1]: 限流key（如 "rate:user:123"）
-- ARGV[1]: 窗口内最大请求数
-- ARGV[2]: 时间窗口（毫秒）
-- ARGV[3]: 当前时间戳（毫秒）
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- 移除窗口外的旧请求（score < now - window）
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
-- 统计当前窗口内请求数
local count = redis.call('ZCARD', key)

if count < limit then
    -- 未超限：将本次请求加入有序集合
    redis.call('ZADD', key, now, now .. '-' .. math.random())
    redis.call('PEXPIRE', key, window)
    return 1  -- 允许通过
else
    return 0  -- 限流拒绝
end
```

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
| **Stream** | ✅ | ✅ | ✅ | **可靠消息队列** |

#### Spring Boot 完整生产者 / 消费者代码

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
    public static OrderEvent fromMap(Map<Object, Object> m) {
        return new OrderEvent(
            (String) m.get("orderId"),
            Long.parseLong((String) m.get("userId")),
            new BigDecimal((String) m.get("amount")),
            Instant.parse((String) m.get("createdAt"))
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
    private static final int MAX_LEN = 100_000;   // 限制 Stream 长度，防止无限增长

    private final StringRedisTemplate redis;

    /** 投递订单事件，返回消息 ID */
    public RecordId publish(OrderEvent event) {
        // MAXLEN ~ 近似裁剪（性能比精确裁剪好）
        ObjectRecord<String, Map<String, String>> record = StreamRecords
            .objectBacked(event.toMap())
            .withStreamKey(STREAM_KEY);

        RecordId id = redis.opsForStream()
            .add(record, RedisStreamCommands.XAddOptions.maxlen(MAX_LEN).approximateTrimming(true));

        log.info("Published order {} → stream id={}", event.orderId(), id);
        return id;
    }
}
```

##### 3. 消费者配置（Consumer Group）

```java
@Configuration
@RequiredArgsConstructor
public class OrderStreamConsumerConfig {

    private static final String STREAM_KEY  = "stream:orders";
    private static final String GROUP_NAME  = "order-group";
    private static final String CONSUMER    = "consumer-" + UUID.randomUUID();

    private final StringRedisTemplate redis;
    private final RedisConnectionFactory connectionFactory;
    private final OrderEventHandler handler;

    /** 创建 Consumer Group（应用启动时调用一次，已存在会抛异常被忽略） */
    @PostConstruct
    public void initGroup() {
        try {
            redis.opsForStream().createGroup(STREAM_KEY, ReadOffset.from("0"), GROUP_NAME);
        } catch (RedisSystemException e) {
            // BUSYGROUP: Consumer Group name already exists
            log.info("Consumer group {} already exists", GROUP_NAME);
        }
    }

    /** Spring Data Redis 提供的 StreamMessageListenerContainer */
    @Bean(destroyMethod = "stop")
    public StreamMessageListenerContainer<String, ObjectRecord<String, Map<String, String>>>
            container() {

        var options = StreamMessageListenerContainer
            .StreamMessageListenerContainerOptions.builder()
            .pollTimeout(Duration.ofSeconds(2))            // 阻塞拉取超时
            .batchSize(10)                                 // 一次最多拉 10 条
            .targetType(Map.class)                         // 自动反序列化
            .errorHandler(e -> log.error("Stream listener error", e))
            .executor(Executors.newFixedThreadPool(4))     // 业务线程池（自定义）
            .build();

        var container = StreamMessageListenerContainer.create(connectionFactory, options);

        // 注册监听器：从 ">" 读取新消息（auto-ack=false 手动 ACK）
        container.receive(
            Consumer.from(GROUP_NAME, CONSUMER),
            StreamOffset.create(STREAM_KEY, ReadOffset.lastConsumed()),
            handler                                        // ★ 消息处理器
        );

        container.start();
        log.info("Stream consumer started: group={}, consumer={}", GROUP_NAME, CONSUMER);
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
        implements StreamListener<String, ObjectRecord<String, Map<String, String>>> {

    private static final String STREAM_KEY = "stream:orders";
    private static final String GROUP_NAME = "order-group";
    private static final int MAX_RETRY = 3;

    private final StringRedisTemplate redis;
    private final OrderService orderService;

    @Override
    public void onMessage(ObjectRecord<String, Map<String, String>> record) {
        RecordId id = record.getId();
        try {
            OrderEvent event = OrderEvent.fromMap(record.getValue());

            // ✅ 业务幂等：用 SETNX 防止重复消费
            String idemKey = "idem:order:" + event.orderId();
            Boolean firstTime = redis.opsForValue().setIfAbsent(idemKey, "1", Duration.ofHours(24));
            if (Boolean.FALSE.equals(firstTime)) {
                log.warn("Order {} already processed, skip", event.orderId());
                ack(id);
                return;
            }

            orderService.handle(event);                    // ★ 真正业务
            ack(id);                                        // ✅ 处理成功才 ACK
        } catch (Exception e) {
            log.error("Failed to process message {}: {}", id, e.getMessage(), e);
            // 不 ACK → 消息留在 PEL（Pending List），下一轮重试或被 reclaim
        }
    }

    private void ack(RecordId id) {
        redis.opsForStream().acknowledge(STREAM_KEY, GROUP_NAME, id);
    }
}
```

##### 5. 死信处理（PEL 重试 + 转移到 DLQ）

**长时间未 ACK 的消息会停留在 PEL（Pending Entry List）**。生产必须有定时任务扫描 + 重试或转死信队列：

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class StreamDlqScheduler {

    private static final String STREAM_KEY = "stream:orders";
    private static final String GROUP_NAME = "order-group";
    private static final String DLQ_KEY    = "stream:orders:dlq";
    private static final Duration IDLE_THRESHOLD = Duration.ofMinutes(5);
    private static final long MAX_DELIVERY_COUNT = 5;

    private final StringRedisTemplate redis;

    /** 每分钟扫描一次 PEL，处理"卡死"的消息 */
    @Scheduled(fixedDelay = 60_000)
    public void reclaimPending() {
        PendingMessages pending = redis.opsForStream()
            .pending(STREAM_KEY, GROUP_NAME, Range.unbounded(), 100);

        for (PendingMessage msg : pending) {
            // 超过最大重试次数 → 投递到 DLQ + 从 PEL 移除
            if (msg.getTotalDeliveryCount() >= MAX_DELIVERY_COUNT) {
                moveToDlq(msg.getId());
                redis.opsForStream().acknowledge(STREAM_KEY, GROUP_NAME, msg.getId());
                continue;
            }

            // 长时间未 ACK → claim 给当前消费者，触发重新投递
            if (msg.getElapsedTimeSinceLastDelivery().compareTo(IDLE_THRESHOLD) > 0) {
                redis.opsForStream().claim(STREAM_KEY, GROUP_NAME,
                    "consumer-reclaimer", IDLE_THRESHOLD, msg.getId());
                log.warn("Reclaimed stuck message {}", msg.getId());
            }
        }
    }

    private void moveToDlq(RecordId id) {
        List<MapRecord<String, Object, Object>> records = redis.opsForStream()
            .range(STREAM_KEY, Range.just(id.getValue()));

        records.forEach(r -> redis.opsForStream().add(StreamRecords
            .mapBacked(r.getValue().entrySet().stream()
                .collect(Collectors.toMap(e -> e.getKey().toString(), e -> e.getValue().toString())))
            .withStreamKey(DLQ_KEY)));

        log.error("Moved message {} to DLQ after {} retries", id, MAX_DELIVERY_COUNT);
    }
}
```

##### 6. 关键配置 / 实战要点

| 要点 | 说明 |
|------|------|
| **`XADD MAXLEN ~ N`** | 限制 Stream 长度，**`~` 是近似裁剪**，性能比精确好 10× |
| **`pollTimeout`** | Spring container 阻塞 XREAD 时长；2-5s 平衡延迟与连接开销 |
| **业务幂等** | 用 `SETNX` 或唯一索引；**不能依赖 ACK 防重**（消费成功未 ACK 时仍会重投） |
| **PEL 监控** | 必须设告警：PEL 积压 > 阈值时报警，否则消息会"消失在 PEL 里" |
| **消费者命名** | 每个消费者实例名应唯一（如 hostname-pid）；删除节点要 `XGROUP DELCONSUMER` |
| **Cluster 限制** | Stream 是单 key 数据结构，**单 Stream 吞吐受单 slot 限制**；高吞吐场景按业务拆 N 个 Stream |
| **vs Kafka** | Stream 适合 **10K-100K TPS、单数据中心**；**百万级 TPS / 跨数据中心 / 严格顺序仍选 Kafka** |

::: warning ⚠️ Stream 4 大生产坑
1. **忘记设置 MAXLEN** → 长跑业务 Stream 无限增长，Redis OOM
2. **没监控 PEL** → 业务异常的消息悄悄堆积在 PEL，看监控以为消费正常
3. **依赖 ACK 防重** → ACK 是"通知 Redis 我处理完了"，**不防消费成功未 ACK 的二次投递** → 业务必须独立幂等
4. **消费者下线没清理** → `XINFO CONSUMERS` 会看到大量僵尸消费者，影响负载均衡
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
**缺点**：① 轮询有延迟（1s 精度）；② 单线程处理，**消费速度受限于轮询频率**；③ 没有 ACK 机制，消费失败要自己重投。

#### 方案 2：Stream + 短 TTL 触发

利用 Stream 消费组 + `XADD` 时手动指定 `MINID` 或定时把"到期消息"投递到工作 Stream：

```bash
# 把延迟消息预先投递到"待激活" Stream（带时间戳元数据）
XADD delay-pending * orderId 123 triggerAt 1717689600000

# 后台调度器：把到期消息搬到"工作" Stream
# 1) XRANGE delay-pending - + 取出所有
# 2) 过滤 triggerAt <= now()
# 3) XADD work-stream * ... 转发；XDEL delay-pending <id> 删除
```

**优点**：复用 Stream 消费组、ACK、PEL 机制；多消费者天然并行。
**缺点**：实现比 ZSet 复杂；需要一个"搬运"线程。

#### 方案对比与选型

| 方案 | 精度 | 持久化 | 多消费者并行 | 消息可见性 | ACK 重试 | 适合场景 |
|------|------|--------|------------|----------|---------|---------|
| **Redis ZSet** | 秒级 | ✅ | ❌（单线程轮询） | ✅ | ❌（自己实现） | 中小流量、单实例 |
| **Redis Stream** | 秒级 | ✅ | ✅ | ✅ | ✅ | 高吞吐、多消费者 |
| **RocketMQ 定时消息** | **毫秒级** | ✅ | ✅ | ⚠️ | ✅ | 大流量、生产 |
| **RabbitMQ TTL + DLX** | 秒级 | ✅ | ✅ | ⚠️ | ✅ | RabbitMQ 用户 |
| **JDK DelayQueue** | 毫秒级 | ❌ | ❌ | ✅ | ❌ | 单 JVM 内 |

::: warning ⚠️ 延迟队列 3 大坑
1. **轮询频率与精度的权衡**——1s 一次省 CPU 但延迟 1s；100ms 一次精准但 QPS × 10
2. **大量消息堆积时 ZSet 变慢**——单 key 超过 10 万条建议**按 hash 分片**到多个 ZSet
3. **消费失败的重投** —— ZSet 方案要手动重 `ZADD`，建议增加 `retryCount` 字段防止无限循环
:::

详见 [消息队列 · RocketMQ 延迟级别](./message-queue#可靠投递与丢消息排查)。

---

### Lua 原子脚本：分布式原语的瑞士军刀

::: tip 💡 为什么 Redis 要支持 Lua
Redis 命令本身是单条原子，但**多条命令组合**（如"GET → 判断 → DEL"）就不原子了。`MULTI/EXEC` 事务**不支持中间逻辑分支**。**Lua 脚本是 Redis 提供的唯一"复合原子操作"机制**——脚本在 Redis 内单线程执行，**期间不会被其他命令打断**。
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

```lua
-- KEYS[1]: stock key, ARGV[1]: 扣减数量
local stock = tonumber(redis.call('GET', KEYS[1]) or "0")
if stock >= tonumber(ARGV[1]) then
    return redis.call('DECRBY', KEYS[1], ARGV[1])
else
    return -1   -- 库存不足
end
```

##### 3. 滑动窗口限流（前面 ZSet 实现）

详见上文 [Redis 限流实现](#redis-限流实现)。

##### 4. 令牌桶限流

```lua
-- KEYS[1]: 桶 key
-- ARGV[1]: 桶容量；ARGV[2]: 每秒补充速率；ARGV[3]: 当前秒
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local data = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(data[1]) or capacity
local last = tonumber(data[2]) or now

-- 按时间差补充令牌（不超过容量）
tokens = math.min(capacity, tokens + (now - last) * rate)

if tokens >= 1 then
    tokens = tokens - 1
    redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', now)
    redis.call('EXPIRE', KEYS[1], 60)
    return 1   -- 通过
else
    redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', now)
    return 0   -- 拒绝
end
```

##### 5. 幂等 Token 校验（防重复提交）

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
-- mylib.lua
#!lua name=mylib

redis.register_function('decr_stock', function(keys, args)
    local stock = tonumber(redis.call('GET', keys[1]) or "0")
    if stock >= tonumber(args[1]) then
        return redis.call('DECRBY', keys[1], args[1])
    end
    return -1
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
| **`EVAL` 每次重发脚本浪费带宽** | 大脚本每次都传一遍 | 用 `EVALSHA` + 缓存 SHA |
| **跨 Cluster 节点的 keys 必须同 slot** | Cluster 模式下 Lua 操作的 key 不在同 slot 会报错 | 用 `{tag}` 哈希标签：`{user:123}:lock` |
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
**生产推荐Redisson**：自动实现看门狗续期（默认每10秒续30秒），支持可重入锁、公平锁、读写锁。**RedLock争议**：Martin Kleppmann指出在时钟漂移场景下不安全，大多数场景单Redis实例+Redisson已足够。

**Q: Redis的过期键删除策略是什么？**

A: **两种策略结合**：① **惰性删除**——访问key时检查是否过期，过期则删除返回nil。优点：CPU友好；缺点：已过期但未访问的key持续占用内存；② **定期删除**——每100ms随机抽取设了过期时间的key（默认每次20个），删除其中已过期的。若超过25%已过期，继续扫描直到低于25%。两种结合兼顾CPU和内存，配合内存淘汰策略（allkeys-lru等），在内存不足时主动淘汰最合适的key。

**Q: Redis为什么单线程还这么快？**

A: 四个原因：① **纯内存操作**——内存访问约100ns，磁盘约10ms，快10万倍；② **单线程无锁**——无需互斥锁和上下文切换，CPU利用率高；③ **I/O多路复用**——epoll模型，单线程处理大量并发连接，非阻塞；④ **简单高效的数据结构**——大多数命令O(1)。注意：Redis 6.0+引入多线程处理**网络I/O**（解析请求和返回响应），但**命令执行仍是单线程**，保证数据安全。
