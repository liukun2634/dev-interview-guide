---
title: 限流与熔断
---

# 限流与熔断 Rate Limiting & Circuit Breaker

<span class="dig-tag dig-tag--category">系统设计</span>
<span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span>
<span class="dig-tag dig-tag--hot">🔥🔥 高频</span>

::: tip 💡 核心要点
限流（Rate Limiting）保护服务免受流量洪峰冲击，熔断（Circuit Breaker）在下游服务不可用时快速失败、防止级联故障。两者是分布式系统高可用保障的核心机制，也是系统设计面试的高频考点。掌握常见限流算法（固定窗口、滑动窗口、令牌桶、漏桶）的原理和区别，以及熔断器的状态机模型，是回答此类问题的关键。
:::

## 为什么需要限流？

在分布式系统中，突发流量（秒杀活动、爬虫、恶意攻击）可能在瞬间打垮服务。限流的目标是：

- **保护服务稳定性：** 防止超出系统处理能力的请求压垮服务
- **公平分配资源：** 避免少数用户或调用方消耗过多资源
- **防御恶意攻击：** 抵御 DDoS、CC 攻击等异常流量
- **降低成本：** 控制下游 API 的调用量，避免超额账单

**限流的常见维度：**
- 用户级别（每用户每秒 N 次请求）
- IP 级别（每 IP 每分钟 N 次请求）
- 接口级别（某接口全局 QPS 上限）
- 服务级别（整体入口流量上限）

## 四大限流算法

### 1. 固定窗口 (Fixed Window)

将时间划分为固定长度的窗口（如每秒），在每个窗口内维护一个计数器，计数器达到阈值则拒绝请求。

```
时间轴：
|---- 窗口 1 (00:00-00:01) ----|---- 窗口 2 (00:01-00:02) ----|
     请求计数: 98/100                请求计数: 0/100
     （允许通过）                     （重新计数）
```

```java
public class FixedWindowRateLimiter {
    private final int maxRequests;
    private final long windowSizeMs;
    private long windowStart;
    private int counter;

    public FixedWindowRateLimiter(int maxRequests, long windowSizeMs) {
        this.maxRequests = maxRequests;
        this.windowSizeMs = windowSizeMs;
        this.windowStart = System.currentTimeMillis();
        this.counter = 0;
    }

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        if (now - windowStart >= windowSizeMs) {
            // 进入新窗口，重置计数
            windowStart = now;
            counter = 0;
        }
        if (counter < maxRequests) {
            counter++;
            return true;
        }
        return false; // 限流
    }
}
```

**优点：** 简单高效，内存占用小。

**缺点：** 存在**临界突刺问题** —— 在窗口交界处（如 00:59 发 100 个请求 + 01:00 发 100 个请求），实际 1 秒内通过了 200 个请求，超出预期限制。

### 2. 滑动窗口 (Sliding Window)

将固定窗口进一步细分为多个小窗口，统计当前时间向前滑动一个窗口长度内的请求总数，解决固定窗口的临界突刺问题。

```
时间分为 10 个子窗口（每个 100ms）:
|s1|s2|s3|s4|s5|s6|s7|s8|s9|s10|s1'|s2'|...
         ↑                   ↑
    滑动窗口起点          当前时间
    ←── 统计这个范围内的请求总数 ──→
```

```java
public class SlidingWindowRateLimiter {
    private final int maxRequests;
    private final long windowSizeMs;
    private final int subWindowCount;
    private final long subWindowSizeMs;
    private final int[] subWindows;
    private long currentSubWindowStart;
    private int currentSubWindowIndex;

    public SlidingWindowRateLimiter(int maxRequests, long windowSizeMs, int subWindowCount) {
        this.maxRequests = maxRequests;
        this.windowSizeMs = windowSizeMs;
        this.subWindowCount = subWindowCount;
        this.subWindowSizeMs = windowSizeMs / subWindowCount;
        this.subWindows = new int[subWindowCount];
        this.currentSubWindowStart = System.currentTimeMillis();
        this.currentSubWindowIndex = 0;
    }

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        // 滑动到当前子窗口，清除过期的子窗口
        while (now - currentSubWindowStart >= subWindowSizeMs) {
            currentSubWindowStart += subWindowSizeMs;
            currentSubWindowIndex = (currentSubWindowIndex + 1) % subWindowCount;
            subWindows[currentSubWindowIndex] = 0;
        }
        // 统计整个窗口内的请求数
        int total = 0;
        for (int count : subWindows) {
            total += count;
        }
        if (total < maxRequests) {
            subWindows[currentSubWindowIndex]++;
            return true;
        }
        return false;
    }
}
```

**优点：** 解决固定窗口的临界突刺问题，限流更平滑。

**缺点：** 需要维护多个子窗口计数，内存占用相对更大。

### 3. 令牌桶 (Token Bucket)

系统以固定速率往桶中放入令牌，每个请求需要取走一个令牌。桶满时多余的令牌被丢弃。桶空时请求被拒绝。

```
令牌生成器 ──► ┌─────────────┐
  (固定速率)    │  令牌桶       │
               │  容量=100     │ ──► 取走令牌 → 请求通过
               │  当前=73      │
               └─────────────┘
                      ↑
               桶满时令牌溢出丢弃
```

```java
public class TokenBucketRateLimiter {
    private final int maxTokens;       // 桶容量
    private final double refillRate;   // 每秒填充令牌数
    private double currentTokens;
    private long lastRefillTime;

    public TokenBucketRateLimiter(int maxTokens, double refillRate) {
        this.maxTokens = maxTokens;
        this.refillRate = refillRate;
        this.currentTokens = maxTokens;
        this.lastRefillTime = System.currentTimeMillis();
    }

    public synchronized boolean tryAcquire() {
        refill();
        if (currentTokens >= 1) {
            currentTokens -= 1;
            return true;
        }
        return false;
    }

    private void refill() {
        long now = System.currentTimeMillis();
        double elapsed = (now - lastRefillTime) / 1000.0;
        currentTokens = Math.min(maxTokens, currentTokens + elapsed * refillRate);
        lastRefillTime = now;
    }
}
```

**优点：** 允许**突发流量**（桶中有存量令牌时可以瞬间消耗），同时保证长期平均速率不超过上限。

**缺点：** 突发流量可能在短时间内消耗所有令牌，造成后续请求全被拒绝。

> Google Guava 的 `RateLimiter` 就是基于令牌桶算法实现的。

### 4. 漏桶 (Leaky Bucket)

请求被放入桶中，桶以**固定速率**处理请求。桶满时新请求被拒绝。不管请求到达的速度如何波动，处理速率始终恒定。

```
请求涌入 ──► ┌─────────────┐
             │  漏桶         │
             │  容量=100     │ ──► 以固定速率漏出处理
             │  当前=45      │     （匀速消费）
             └──────┬──────┘
                    │
              恒定速率流出
```

```java
public class LeakyBucketRateLimiter {
    private final int capacity;       // 桶容量
    private final double leakRate;    // 每秒漏出速率
    private double currentWater;
    private long lastLeakTime;

    public LeakyBucketRateLimiter(int capacity, double leakRate) {
        this.capacity = capacity;
        this.leakRate = leakRate;
        this.currentWater = 0;
        this.lastLeakTime = System.currentTimeMillis();
    }

    public synchronized boolean tryAcquire() {
        leak();
        if (currentWater < capacity) {
            currentWater += 1;
            return true;
        }
        return false; // 桶满，拒绝
    }

    private void leak() {
        long now = System.currentTimeMillis();
        double elapsed = (now - lastLeakTime) / 1000.0;
        double leaked = elapsed * leakRate;
        currentWater = Math.max(0, currentWater - leaked);
        lastLeakTime = now;
    }
}
```

**优点：** 输出速率严格恒定，适合对下游调用要求匀速的场景。

**缺点：** 无法利用突发处理能力，即使系统空闲也不会提速。

### 四种算法对比

| 算法 | 突发流量 | 平滑度 | 实现复杂度 | 典型应用 |
|------|---------|--------|-----------|---------|
| 固定窗口 | 有突刺 | 低 | 简单 | 简单计数场景 |
| 滑动窗口 | 较平滑 | 中 | 中等 | Sentinel、Nginx |
| 令牌桶 | 允许突发 | 高 | 中等 | Guava RateLimiter、API Gateway |
| 漏桶 | 严格匀速 | 最高 | 中等 | 流量整形、消息队列消费 |

## 分布式限流（Redis 实现）

单机限流只能保护单个实例。在微服务场景下，通常需要**全局限流**，使用 Redis 作为中心化计数器。

**Redis + Lua 实现滑动窗口限流：**

```lua
-- KEYS[1]: 限流的 key（如 rate_limit:user:1001）
-- ARGV[1]: 窗口大小（毫秒）
-- ARGV[2]: 最大请求数
-- ARGV[3]: 当前时间戳（毫秒）

local key = KEYS[1]
local windowMs = tonumber(ARGV[1])
local maxCount = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- 移除窗口外的数据
redis.call('ZREMRANGEBYSCORE', key, 0, now - windowMs)

-- 统计当前窗口内的请求数
local count = redis.call('ZCARD', key)

if count < maxCount then
    -- 未超限，添加当前请求
    redis.call('ZADD', key, now, now .. ':' .. math.random(10000))
    redis.call('PEXPIRE', key, windowMs)
    return 1  -- 允许
else
    return 0  -- 限流
end
```

```java
// Java 调用 Lua 脚本
public boolean isAllowed(String userId, int maxRequests, long windowMs) {
    String key = "rate_limit:" + userId;
    long now = System.currentTimeMillis();
    Long result = redisTemplate.execute(
        rateLimitScript,
        Collections.singletonList(key),
        String.valueOf(windowMs),
        String.valueOf(maxRequests),
        String.valueOf(now)
    );
    return result != null && result == 1L;
}
```

> 使用 Lua 脚本的目的是保证**原子性** —— 读取计数和更新计数在同一次 Redis 操作中完成，避免并发竞争。

## 熔断器模式 Circuit Breaker Pattern

当下游服务故障时，如果继续发送请求，会导致：
1. 调用方线程被阻塞，资源耗尽
2. 故障沿调用链向上传播，引发**级联故障（Cascading Failure）**

熔断器模式的核心思想：**快速失败，保护自身**。

### 三个状态

```
                     失败率超过阈值
    ┌─────────┐   ─────────────────►   ┌──────────┐
    │  Closed  │                        │   Open   │
    │ (正常通行) │   ◄───────────────────  │ (快速失败) │
    └────┬────┘      恢复成功            └────┬─────┘
         │                                    │
         │           超时后进入                  │
         │      ┌──────────────┐              │
         │      │  Half-Open   │◄─────────────┘
         │      │ (试探性放行)   │   等待超时
         │      └──────┬───────┘
         │             │
         └─────────────┘
           试探请求成功
           → 回到 Closed
           试探请求失败
           → 回到 Open
```

| 状态 | 描述 | 行为 |
|------|------|------|
| **Closed（关闭）** | 正常状态 | 所有请求正常通过，同时监控失败率 |
| **Open（打开）** | 熔断状态 | 所有请求直接失败，返回降级响应，不调用下游 |
| **Half-Open（半开）** | 探测恢复 | 允许少量请求通过以探测下游是否恢复 |

### Resilience4j 实现

```java
// 1. 配置熔断器
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)              // 失败率达到 50% 时触发熔断
    .waitDurationInOpenState(Duration.ofSeconds(30)) // 熔断 30 秒后进入 Half-Open
    .slidingWindowSize(10)                 // 统计最近 10 次调用
    .minimumNumberOfCalls(5)               // 至少 5 次调用才开始计算失败率
    .permittedNumberOfCallsInHalfOpenState(3) // Half-Open 时允许 3 个探测请求
    .build();

CircuitBreaker circuitBreaker = CircuitBreaker.of("orderService", config);

// 2. 使用熔断器包装调用
Supplier<Order> supplier = CircuitBreaker.decorateSupplier(
    circuitBreaker,
    () -> orderServiceClient.getOrder(orderId)
);

// 3. 结合降级处理
Try<Order> result = Try.ofSupplier(supplier)
    .recover(CallNotPermittedException.class, e -> {
        // 熔断器打开时的降级逻辑
        log.warn("Circuit breaker is open, returning fallback");
        return Order.defaultOrder();
    })
    .recover(Exception.class, e -> {
        log.error("Order service call failed", e);
        return Order.defaultOrder();
    });
```

**Spring Boot 集成（application.yml）：**
```yaml
resilience4j:
  circuitbreaker:
    instances:
      orderService:
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        sliding-window-size: 10
        minimum-number-of-calls: 5
        permitted-number-of-calls-in-half-open-state: 3
```

```java
@Service
public class OrderService {

    @CircuitBreaker(name = "orderService", fallbackMethod = "getOrderFallback")
    public Order getOrder(Long orderId) {
        return restTemplate.getForObject("/orders/" + orderId, Order.class);
    }

    private Order getOrderFallback(Long orderId, Throwable t) {
        log.warn("Fallback for order {}: {}", orderId, t.getMessage());
        return Order.defaultOrder();
    }
}
```

## 舱壁模式 Bulkhead Pattern

舱壁模式借鉴了船舶设计 —— 船体被隔舱板分为多个独立隔舱，一个隔舱进水不会导致整艘船沉没。

在微服务中，舱壁模式通过**资源隔离**防止某个下游服务的故障耗尽调用方的所有资源。

```
┌────────────────────────────────────────┐
│              服务 A                      │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ 线程池 1   │  │ 线程池 2   │  │ 线程池 3│ │
│  │ 调用服务 B │  │ 调用服务 C │  │ 调用DB │ │
│  │ max=10   │  │ max=5    │  │ max=20 │ │
│  └──────────┘  └──────────┘  └────────┘ │
│                                          │
│  服务 B 故障 → 只有线程池 1 受影响          │
│  服务 C、DB 调用正常运行                   │
└────────────────────────────────────────┘
```

两种实现方式：
- **线程池隔离（Thread Pool）：** 每个下游服务使用独立线程池，彼此互不影响。隔离性强但线程切换有开销。
- **信号量隔离（Semaphore）：** 使用信号量控制并发数，无线程切换开销，但无法设置超时。

## 常见误区

::: warning 易错点
1. **令牌桶 vs 漏桶混淆：** 令牌桶允许突发流量（桶中有积攒的令牌可瞬间消耗），漏桶输出严格匀速。面试中务必区分清楚
2. **固定窗口的临界突刺问题：** 窗口交界处可能瞬间通过 2 倍阈值的请求，生产环境建议使用滑动窗口或令牌桶
3. **单机限流 ≠ 分布式限流：** 微服务多实例部署时，每台机器 100 QPS 限制意味着全局可能有 N×100 QPS，应使用 Redis 做全局限流
4. **熔断器不是限流器：** 限流是主动限制请求速率；熔断是被动保护 —— 当下游故障达到阈值才会触发。两者互补，不能替代
5. **熔断需要配合降级：** 熔断打开后必须返回合理的降级响应（默认值、缓存数据等），不能简单返回错误给用户
:::

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 请比较令牌桶和漏桶算法的区别，分别适用于什么场景？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 如何在分布式系统中实现全局限流？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 熔断器的三个状态是什么？什么时候触发状态转换？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### Q1: 令牌桶 vs 漏桶

| 对比维度 | 令牌桶 (Token Bucket) | 漏桶 (Leaky Bucket) |
|---------|----------------------|---------------------|
| 核心思想 | 以固定速率生成令牌，请求消耗令牌 | 请求进入桶中，以固定速率处理 |
| 突发流量 | **允许** —— 桶中有存量令牌可瞬间消耗 | **不允许** —— 始终匀速输出 |
| 输出速率 | 可变，最大速率=桶容量（瞬间），长期速率=令牌生成速率 | 恒定，始终等于漏出速率 |
| 适用场景 | API 网关（允许短暂突发）、Guava RateLimiter | 流量整形、消息队列消费端（需匀速处理） |
| 实际应用 | Nginx limit_req（实际是漏桶变体）、Spring Cloud Gateway | 流量整形、网络 QoS |

**回答要点：** 如果系统需要利用空闲时期积累的处理能力来应对短时突发，选令牌桶；如果需要严格控制输出速率保护下游，选漏桶。

### Q2: 分布式全局限流

**方案一：Redis + Lua 脚本（主流）**
- 使用 Redis 的 Sorted Set 实现滑动窗口（按时间戳排序）
- 用 Lua 脚本保证"清除过期记录 → 计数 → 添加请求"三步操作的原子性
- 适合大多数 Web 应用的全局限流场景

**方案二：Redis + 令牌桶**
- 使用 Redis 存储令牌数量和上次填充时间
- 每次请求先计算应补充的令牌数，再尝试消耗
- 适合需要允许突发流量的场景

**方案三：专用限流中间件**
- Sentinel（阿里巴巴）：支持流控、熔断、热点参数限流，带控制台
- Envoy / Istio：基于 Service Mesh 的限流，对应用无侵入

**注意事项：**
- Redis 集群部署时要考虑节点间数据同步延迟（非强一致）
- 高并发场景下 Redis 本身可能成为瓶颈，需评估 Redis 的 QPS 承载能力
- 可以采用本地限流 + 全局限流两级策略，本地限流先拦截大部分超限请求，减轻 Redis 压力

### Q3: 熔断器的三个状态

**Closed（关闭/正常）→ Open（打开/熔断）→ Half-Open（半开/探测）**

状态转换规则：
1. **Closed → Open：** 在滑动窗口内，调用失败率达到阈值（如 50%），且调用次数达到最小统计数量（如至少 5 次调用），自动切换到 Open 状态
2. **Open → Half-Open：** 熔断器打开后，经过一段等待时间（如 30 秒），自动进入 Half-Open 状态
3. **Half-Open → Closed：** 在半开状态，放行少量探测请求（如 3 个），如果全部成功（或成功率达标），切换回 Closed
4. **Half-Open → Open：** 探测请求失败率仍然超过阈值，重新回到 Open 状态

**面试加分点：**
- 熔断通常配合**降级（Fallback）**使用，返回缓存数据、默认值或友好提示
- 与**重试（Retry）**配合时要注意：熔断打开后不应重试，否则违背快速失败的目的
- Resilience4j 中可以配置 `slowCallRateThreshold` 和 `slowCallDurationThreshold` 来处理响应时间过长的情况（慢调用熔断）

## 延伸阅读

- [Resilience4j 官方文档](https://resilience4j.readme.io/docs/circuitbreaker)
- [Sentinel Wiki - 流量控制](https://github.com/alibaba/Sentinel/wiki/%E6%B5%81%E9%87%8F%E6%8E%A7%E5%88%B6)
- [Google Guava RateLimiter 源码分析](https://github.com/google/guava/blob/master/guava/src/com/google/common/util/concurrent/RateLimiter.java)
- 《微服务设计模式》第 3 章：进程间通信
