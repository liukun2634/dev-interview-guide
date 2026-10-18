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
| **Token / Idempotency-Key** | 持久幂等记录 + 数据库事务，Redis 可作缓存 | 通用请求去重与结果重放 | 需绑定身份和参数，外部副作用需单独对账 |

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

### 方案三：Token / Idempotency-Key（持久去重与结果重放）

**同一次业务意图的重试复用同一个 key，新业务意图才使用新 key。** key 可以由客户端生成，也可以预先申请，不应在每次网络重试前重新生成。服务端将它绑定到已认证的租户、用户、操作类型和请求指纹。

::: warning Redis 去重不是业务事务
“Redis 标记 PROCESSING → 创建订单 → Redis 写 DONE”存在崩溃窗口：订单已提交但 DONE 尚未写入，TTL 过期后重试会再次创建。Lua 只能保证 Redis 内部原子性，不能原子提交数据库订单；续租或延长 TTL 都不能消除这个窗口。
:::

#### 本地数据库操作：幂等记录与订单同事务提交

以 MySQL/InnoDB 为例，新增持久幂等记录。这里的 `PROCESSING` 只存在于创建订单的未提交事务中，**不会先独立提交占位记录再执行业务**。

```sql
CREATE TABLE idempotency_requests (
    tenant_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    operation VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    request_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    status VARCHAR(16) NOT NULL,
    order_id BIGINT,
    http_status SMALLINT,
    response_json JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, user_id, operation, idempotency_key)
) ENGINE=InnoDB;
```

`request_hash` 根据验证并规范化后的业务字段、API 版本计算，例如订单业务号、商品、数量、金额和币种；排除 Trace ID 等传输字段。同 key 不同指纹返回 409，不复用旧响应。租户和用户从认证上下文取得，不信任请求体自行指定。

**事务流程（伪代码，所有数据库操作使用同一主库连接和事务）：**

```text
校验身份、操作权限、key 格式和请求参数
scope = (tenant_id, user_id, operation, idempotency_key)
request_hash = hash(规范化业务参数)

BEGIN
    尝试插入 scope、request_hash、PROCESSING
    同 scope 主键冲突时仅保留原记录，不覆盖指纹或结果
    SELECT 幂等记录 FOR UPDATE
    指纹不同 -> ROLLBACK，返回 409
    已为 DONE -> 复核结果访问权限，结束事务后重放原响应

    按稳定业务号创建订单，受数据库业务唯一键保护
    若业务号已存在，校验归属与原始业务参数，仅复用同一业务意图
    保存 order_id、原 HTTP 状态码、响应和 DONE
COMMIT

返回原始业务响应；可选地异步填充 Redis 缓存
```

沿用前文 `orders(user_id, out_trade_no)` 唯一键时，要求 `user_id` 全局唯一；多租户本地用户编号则必须把 `tenant_id` 同时加入订单查找条件和唯一键。业务号在重试中保持不变。查询后插入本身不具备原子性，必须由唯一约束兜底；并发唯一键冲突或死锁时回滚整个事务，再有界重试并读取已提交记录，不能捕获任意数据库异常后直接继续。

同一 scope 的并发请求会在唯一键或行锁处等待；等待超时可返回处理中/稍后重试，但不能绕开锁创建另一个订单。本地示例只包含短事务数据库操作，不在持锁期间请求 LLM、支付接口或等待用户确认。

| 故障注入点 | 持久状态 | 同 key 重试结果 |
|------|------|------|
| 写订单后、COMMIT 前进程崩溃 | 订单和幂等记录一起回滚 | 可以重新执行，不留下半份成功 |
| COMMIT 成功、HTTP 响应丢失 | 订单与 DONE 同时存在 | 读取主库记录，重放原状态码与响应 |
| Redis 写入失败或缓存过期 | 数据库记录仍然存在 | 回源持久幂等记录，不再次创建 |
| COMMIT 结果未知 | 可能已提交，不能直接判为失败 | 在主库按原 scope 查询/重试，由同一约束串行判定 |
| 同 key 改变订单金额 | 原指纹不匹配 | 409，不创建订单、不返回他人的结果 |

这依赖数据库配置所提供的持久性与故障转移保证。如果已确认提交可能在主从切换后丢失，应用不能仅靠幂等表宣称端到端零重复，应匹配所需的 RPO 和业务对账策略。

#### 外部支付或退款：稳定动作 ID + Outbox + 对账

外部副作用不能与本地数据库做普通单库事务。此时用本地事务写入动作账本和 Outbox，由 Worker 以**持久化的稳定 action_id**调用下游；下游需原子支持幂等并允许按动作 ID 查询结果。

| 状态 | 行为 |
|------|------|
| PENDING / SUBMITTED | 返回同一任务或动作 ID，不新建业务动作 |
| SUCCEEDED | 从持久回执返回已确认结果 |
| UNKNOWN | 超时不等于失败；按原 action_id 查询，契约允许时以原键重试 |
| FAILED | 只有权威结果确认失败才进入此状态 |

若下游既无幂等支持也无法查询业务状态，应转人工对账或改造接口，不能自动换一个 key 重试。Outbox 保证意图可恢复，不单独保证外部业务恰好执行一次。

#### 保留期与缓存边界

- **缓存 TTL 只影响性能**，不能决定是否重新执行业务；命中也要验证身份、请求指纹和当前访问权限，只缓存已提交的结果。
- **持久幂等记录保留期**由客户端重试窗口、业务生命周期和审计要求决定，不是“最长耗时乘 5”。长期操作要保留业务唯一键或去重墓碑，明确超期 key 的拒绝策略；一旦连去重信息也删除，就不能承诺识别任意时间后的重复请求。
- **不同 key 的重复业务请求**仍由稳定业务号的唯一约束兜底；业务参数哈希不是业务意图 ID，两次合法购买可以有相同商品和金额。
- **回归测试**至少覆盖并发同 key、同 key 不同参数、提交前后崩溃、缓存清空、不同用户复用相同 key，以及外部调用成功但回执丢失。

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

客户端和网关用于减少误点及重复流量，业务持久约束才保证幂等。图中的参数哈希只能作为短时防抖信号，不能替代业务意图 ID；两次合法购买可以具有相同请求体。即使客户端或 Redis 不可用，也不能绕过数据库幂等记录和业务唯一键。

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

> 三个常用方案：①创建型用稳定业务号 + 数据库唯一索引；②状态流转用状态机 + CAS；③通用接口将 Idempotency-Key 绑定认证身份、操作和请求指纹，幂等记录与本地业务同事务提交，重复请求读取已提交结果。Redis 只作缓存，不能解决业务提交后的崩溃窗口。外部支付/退款另用持久动作 ID、下游幂等和未知结果对账。

**Q：怎么处理 Redis 热点 Key？**

> 先识别（hotkeys 命令 / 代理层统计 / 流式 TopK），再按场景选解法：①最通用是**本地缓存（Caffeine + 短 TTL）**，把流量挡在应用层；②计数器类用**Key 拆分**（分 10 片，写按 hash 路由，读随机选）；③缓存击穿用**互斥锁**或**逻辑过期**；④极端场景做**物理隔离**（大 V 用户走独立 Redis 实例）。本地缓存是 80% 场景的首选。

**Q：为什么 Redis Cluster 解决不了热点 Key？**

> Cluster 按 Key 的 CRC16 哈希分片，**同一个 Key 永远在一个节点上**。所以 Cluster 解决的是"多 Key 总流量大"的问题，解决不了"单 Key 流量大"的问题。必须从业务侧拆 Key 或加本地缓存。

**Q：幂等性的 Idempotency-Key 该谁生成？TTL 多久？**

> 客户端生成或服务端预发均可，关键是同一业务意图的重试复用原 key，同 key 改参数要拒绝。缓存 TTL 只影响性能；持久幂等记录按重试窗口、业务生命周期和审计要求保留。超期行为要有明确契约，长期去重依赖稳定业务唯一键或墓碑，不能根据“最长耗时乘 5”承诺不重复执行。
