---
title: 幂等性与热点 Key 设计
---

# 幂等性与热点 Key 设计

<span class="dig-tag dig-tag--category">系统设计</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 必问</span>

::: tip 💡 核心要点
**幂等性**和**热点 Key 处理**是大厂系统设计面试的"两块横向通用基础知识"——几乎任何案例（秒杀、订单、支付、IM）追问到细节都会落到这两点。**幂等性的本质是：在不可靠的网络下，对"重复请求"做出和"单次请求"一样的副作用**；**热点 Key 的本质是：突破单实例的吞吐物理上限**。这一页把两个主题的所有常见解法、决策表、和真实坑点系统化整理。
:::

## 第一部分：幂等性深度

### 为什么所有 POST 接口都要做幂等

```
客户端: 提交订单 → 网络抖动超时 → 客户端 retry
                                      ↓
服务端: 实际收到 2 次"创建订单"请求 → 不做幂等 → 创建 2 个订单 → 客户被扣 2 次款
```

**触发重复请求的场景**：
1. **客户端重试**：网络超时、500 错误自动重试
2. **网关重试**：API 网关 / 负载均衡器超时重试
3. **MQ 至少一次投递**：Kafka / RocketMQ 默认是 at-least-once
4. **用户行为**：用户重复点击、刷新页面
5. **分布式事务补偿**：Saga / TCC 的反向操作

### 五大幂等性实现方案

| 方案 | 实现位置 | 优势 | 局限 |
|------|---------|------|------|
| **唯一索引** | 数据库 | 最简单、强一致 | 只适合"写一次"场景，重复请求会报错需捕获 |
| **悲观锁 SELECT FOR UPDATE** | 数据库 | 强一致 | 性能差、易死锁 |
| **乐观锁 / 版本号** | 数据库 | 高并发友好 | 需业务字段配合 |
| **状态机 + CAS** | 数据库 | 适合多状态流转 | 状态设计要严密 |
| **Token / Idempotency-Key** | Redis | **通用方案、性能最好** | 需客户端配合 |

### 方案一：唯一索引（最简单）

**业务唯一键**（如订单号 + 用户ID）做唯一索引：

```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    out_trade_no VARCHAR(64) NOT NULL,
    amount DECIMAL(10,2),
    UNIQUE KEY uk_user_trade (user_id, out_trade_no)
);
```

```java
try {
    orderMapper.insert(order);
} catch (DuplicateKeyException e) {
    // 幂等：把已存在的订单返回给客户端，表现得跟成功一样
    return orderMapper.selectByUserAndTradeNo(userId, outTradeNo);
}
```

::: tip 💡 关键决策

**异常被吞了吗？** 不能简单 `catch DuplicateKeyException return`——必须**查出已存在记录返给客户端**，否则客户端拿到错误码会继续重试。

:::

### 方案二：状态机 + CAS（最适合订单/支付）

订单的核心特征是**状态流转**（待支付 → 已支付 → 已发货 → 已完成），用状态机 + CAS UPDATE 天然幂等：

```sql
-- 把订单从"待支付"改为"已支付"
UPDATE orders
SET status = 'PAID', paid_at = NOW(), version = version + 1
WHERE id = ?
  AND status = 'PENDING'           -- 关键：只有状态正确才更新
  AND version = ?;                  -- 关键：版本号防 ABA
```

```java
int affected = orderMapper.markAsPaid(orderId, expectedVersion);
if (affected == 0) {
    // 已经被其他请求改过 → 幂等：直接返回当前状态
    Order current = orderMapper.selectById(orderId);
    if ("PAID".equals(current.getStatus())) return success();  // 重复请求
    else throw new IllegalStateException("订单状态非法");
}
return success();
```

**为什么这个方案优雅**：
- 同一请求重复执行 → 第二次 `affected == 0`，但状态已是目标状态 → 当成功返回
- 并发场景下也只有一个能修改成功，天然防双扣

### 方案三：Token / Idempotency-Key（通用最强）

Stripe、淘宝、支付宝都用这个方案。**让客户端在每次请求前申请一个唯一 Token，服务端用 Redis 去重**：

```
1. 客户端 → 服务端: GET /api/idempotency-token
                ← 返回 token = "abc123..."

2. 客户端 → 服务端: POST /api/orders
                Header: Idempotency-Key: abc123
                Body: { ... }

3. 服务端处理:
   ① Redis SET nx idemkey:abc123 → 同时存"处理中"状态
   ② 成功执行业务
   ③ Redis 更新为 {"status": "done", "response": <result>}
   ④ 后续重复请求 → Redis 命中 → 直接返回缓存的 response
```

#### 关键 Lua 脚本（保证原子性）

```lua
-- KEYS[1] = idemkey:abc123, ARGV[1] = ttl(秒)
local v = redis.call('GET', KEYS[1])
if v then
    return v                             -- 已存在 → 返回缓存结果（可能是"处理中"或最终结果）
else
    redis.call('SET', KEYS[1], 'PROCESSING', 'EX', ARGV[1])
    return 'NEW'                          -- 第一次进来
end
```

```java
public OrderResponse createOrder(String idempotencyKey, OrderRequest req) {
    String cached = redis.eval(LUA_SET_NX, idempotencyKey, "300");

    if ("NEW".equals(cached)) {
        // 首次请求：执行业务 + 写回结果
        OrderResponse resp = doCreateOrder(req);
        redis.setex(idempotencyKey, 300, JSON.toJSONString(resp));
        return resp;
    } else if ("PROCESSING".equals(cached)) {
        // 上一次请求还在处理中
        throw new ConflictException("请求处理中，请稍后");
    } else {
        // 命中已完成的结果，直接返回
        return JSON.parseObject(cached, OrderResponse.class);
    }
}
```

#### Token 方案的关键细节（生产踩过的坑）

::: warning ⚠️ 三个常见错误

1. **TTL 设太短** → 用户慢，重试时缓存过期了，重复创建
2. **TTL 设太长** → 客户端如果复用 token 会被误判重复
3. **没区分"处理中"和"已完成"** → 第二次请求拿到 "PROCESSING" 不知道该等还是该报错

**最佳实践**：TTL = 业务最长可能耗时 × 5，状态机区分 NEW / PROCESSING / DONE。

:::

### 方案选型决策表

| 业务场景 | 推荐方案 | 原因 |
|---------|---------|------|
| **创建型**（订单、用户、文章）| 唯一索引 + 业务唯一键 | 简单可靠 |
| **状态流转**（支付、审批）| 状态机 + CAS | 天然幂等，无需额外组件 |
| **通用 POST API**（开放给前端/第三方）| Idempotency-Key | 业界标准，灵活 |
| **MQ 消费者**（防重复消费）| 消费表 + 唯一索引 | 业务侧自己防 |
| **TCC / Saga 补偿** | 状态机 + 反向操作幂等 | 框架自带 |

### 防重复提交：客户端 + 网关 + 业务三层防线

```
┌───────────────────────────────────────┐
│  Layer 1: 客户端按钮 disable（防误点） │  ← 60% 攻击被挡
├───────────────────────────────────────┤
│  Layer 2: 网关 Redis SETNX（防重试）   │  ← 30% 被挡
│  KEY: idem:{userId}:{path}:{md5(body)} │
│  TTL: 5 秒（防止用户卡顿后误判）       │
├───────────────────────────────────────┤
│  Layer 3: 业务层强幂等（防穿透）       │  ← 兜底
│  唯一索引 / 状态机 / Idempotency-Key   │
└───────────────────────────────────────┘
```

三层缺一不可：客户端能挡掉绝大部分误点，网关挡住重试，业务层是真正的最后防线。

---

## 第二部分：热点 Key 处理

### 什么是热点 Key

> 单个 Redis Key 的 QPS **远高于**其他 Key（如 10w+ QPS），单实例的 CPU / 网络带宽成为瓶颈。

**经典场景**：
- 秒杀商品的库存 Key
- 热搜话题的浏览数 Key
- 大 V 用户的关注数 Key（明星突然结婚 → 粉丝列表）
- 配置中心的 Key

### 为什么 Redis 也扛不住

单 Redis 实例的物理上限：
- **网络带宽**：千兆网卡 ≈ 12w QPS（每请求 1KB）
- **CPU**：单核 ≈ 10w QPS
- **Cluster 也救不了**：Cluster 按 Key 哈希分片，**同一个 Key 永远只在一个节点**

### 识别热点 Key（先发现，再处理）

| 方法 | 原理 | 工具 |
|------|------|------|
| **代码埋点** | 业务侧统计访问频次 | 自研 SDK + Prometheus |
| **Redis monitor** | 实时观察请求 | `redis-cli monitor`（仅排查，生产慎用）|
| **Redis hotkeys 命令** | LFU 淘汰策略下统计 | `redis-cli --hotkeys`（需 LFU 策略）|
| **代理层统计** | Twemproxy / Codis 网关 | 拦截并统计 |
| **流计算** | TopK 算法 | Flink + HeavyKeeper |

### 五大解法

#### 方案一：本地缓存（最常用，效果最好）

**多级缓存**：本地（Caffeine） → Redis → DB

```
应用 1 [Caffeine] ─┐
应用 2 [Caffeine] ─┼─→ Redis ─→ DB
应用 3 [Caffeine] ─┘
       ↑
   本地缓存命中后，根本不打 Redis
```

```java
// 二级缓存模板
@Service
public class ProductService {
    private final Cache<Long, Product> local = Caffeine.newBuilder()
        .maximumSize(1000)
        .expireAfterWrite(Duration.ofSeconds(5))  // 关键：短 TTL
        .build();

    public Product getProduct(Long id) {
        return local.get(id, key -> {
            Product p = redisGet(key);
            return p != null ? p : dbGet(key);
        });
    }
}
```

**关键权衡**：
- **TTL 不能太长**：N 个实例最多有 N 份不一致数据，TTL 越短越接近一致
- **缓存失效广播**（更严格场景）：发布订阅 / MQ 通知各节点失效

#### 方案二：热点 Key 拆分（适合计数类）

把热点 Key **手动分片**到多个 Key：

```
原: stock:item_999  → 单 Key 10w QPS
拆: stock:item_999:0 → 1w QPS
    stock:item_999:1 → 1w QPS
    ...
    stock:item_999:9 → 1w QPS
```

读取时随机选一个分片，**写入时按 hash 路由**：

```java
public long getStock(long itemId) {
    int shard = ThreadLocalRandom.current().nextInt(10);
    return redis.get("stock:" + itemId + ":" + shard);
}

public boolean deduct(long itemId, long userId) {
    int shard = (int) (userId % 10);    // 按用户哈希避免单个用户竞争同一分片
    return redis.decr("stock:" + itemId + ":" + shard) >= 0;
}
```

**适用场景**：
- ✅ 计数器、库存（同质数据可拆）
- ❌ 对象数据（一份完整数据不能拆）

#### 方案三：读写分离 + 多副本

对**读热点**，给 Redis Key 开多个副本：

```
写入: Redis Master   (1 个，处理写)
读取: Redis Slave 1, 2, 3, ..., N  (N 个，处理读)
        ↑ 客户端按用户 hash 选副本
```

阿里 Tair 的"热点 Key 自动扩散"就是这个思路。**生产中实现复杂**，更常用方案一替代。

#### 方案四：互斥锁防击穿

热点 Key 过期瞬间**只让一个请求重建**，其他请求等待：

```java
public Product getWithMutex(long id) {
    Product p = redis.get("product:" + id);
    if (p != null) return p;

    // Key 失效了：互斥锁防止 N 个请求同时打 DB
    String lockKey = "lock:product:" + id;
    if (redis.setnx(lockKey, "1", 10, TimeUnit.SECONDS)) {
        try {
            p = dbGet(id);
            redis.setex("product:" + id, 60, p);
            return p;
        } finally {
            redis.delete(lockKey);
        }
    } else {
        // 没抢到锁：稍等一下重读缓存
        Thread.sleep(50);
        return getWithMutex(id);
    }
}
```

#### 方案五：逻辑过期（不设 TTL，最稳）

**永不让 Key 过期，把过期时间写在 value 里**，后台异步刷新：

```java
class CachedValue<T> {
    T value;
    long expireAt;  // 业务过期时间
}

public Product getWithLogicalExpire(long id) {
    CachedValue<Product> cached = redis.get("product:" + id);
    if (cached == null) return rebuild(id);      // 完全没有：同步建

    if (cached.expireAt > System.currentTimeMillis()) {
        return cached.value;                      // 未过期：直接返回
    }
    // 逻辑过期：返回旧值 + 异步刷新
    executor.submit(() -> rebuild(id));
    return cached.value;
}
```

**最适合**：可短暂返回旧数据的强热点场景（如商品详情、配置）。

### 热点 Key 解法决策表

| 场景 | 推荐方案 |
|------|---------|
| **读热点 + 可容忍秒级旧数据** | 本地缓存（Caffeine + Redis）|
| **计数器 / 库存（高并发写）** | Key 拆分 |
| **缓存击穿（热点 Key 突然过期）** | 互斥锁 / 逻辑过期 |
| **强一致 + 高并发** | 物理隔离（独立 Redis 实例 + 内存数据库）|
| **超大 V 用户的关注/粉丝** | 异步推 + 大 V 列表特殊处理（拉模式）|

### 热点商品 / 大 V 的特殊处理（业务侧设计）

::: tip 💡 真实案例：明星结婚导致热搜挂掉

2024 年某明星突然结婚 → 关注用户列表 Key 瞬间 50w QPS → Redis 单实例 CPU 100%。

**事后应对**（最佳实践组合）：
1. **本地缓存兜底**：所有读经过 Caffeine，把 99% 流量挡在应用层
2. **粉丝列表分页 + Bloom Filter**：不一次返回完整列表
3. **大 V 标识 + 特殊路径**：粉丝数 > 100w 的用户走独立 Redis 实例
4. **降级**：热点期间返回缓存数据，禁止实时更新

:::

---

## 横向通用：两个主题的协同

幂等性和热点 Key **经常一起出现**：

| 场景 | 同时涉及 |
|------|---------|
| **秒杀** | 库存是热点 Key + 防止用户重复下单需要幂等 |
| **支付** | 商户号是热点 Key + 防止重复扣款需要幂等 |
| **点赞** | 热点视频的点赞数 Key + 防止刷点赞需要幂等 |

**通用架构模板**：

```
[客户端按钮 disable]
        ↓
[网关 Idempotency-Key 去重]
        ↓
[本地缓存 Caffeine 拦截读热点]
        ↓
[Redis 拆分 Key + Lua 原子操作]
        ↓
[业务层状态机 + CAS]
        ↓
[DB 唯一索引兜底]
```

---

## 面试常问 & 怎么答

**Q：怎么实现 POST 接口的幂等？**

> 三个常用方案：①创建型用业务唯一键 + 数据库唯一索引（最简单）；②状态流转型用状态机 + CAS UPDATE（订单/支付天然适用）；③通用方案是 Idempotency-Key——客户端请求前申请 token，服务端 Redis 缓存请求结果，重复请求直接返回缓存。生产中三层防线：客户端 disable + 网关 Redis SETNX + 业务层强幂等。

**Q：怎么处理 Redis 热点 Key？**

> 先识别（hotkeys 命令 / 代理层统计 / 流式 TopK），再按场景选解法：①最通用是**本地缓存（Caffeine + 短 TTL）**，把流量挡在应用层；②计数器类用**Key 拆分**（分 10 片，写按 hash 路由，读随机选）；③缓存击穿用**互斥锁**或**逻辑过期**；④极端场景做**物理隔离**（大 V 用户走独立 Redis 实例）。本地缓存是 80% 场景的首选。

**Q：为什么 Redis Cluster 解决不了热点 Key？**

> Cluster 按 Key 的 CRC16 哈希分片，**同一个 Key 永远在一个节点上**。所以 Cluster 解决的是"多 Key 总流量大"的问题，解决不了"单 Key 流量大"的问题。必须从业务侧拆 Key 或加本地缓存。

**Q：幂等性的 Idempotency-Key 该谁生成？TTL 多久？**

> **客户端生成**（UUID 即可），服务端不应主动给 token——主动给 token 增加一次往返延迟。TTL 设置为**业务最长可能耗时 × 5**：太短会让慢请求重试时缓存失效导致重复执行；太长会让客户端正常复用 token 时被误判重复。Stripe 默认 24 小时，多数业务 1-5 分钟够。
