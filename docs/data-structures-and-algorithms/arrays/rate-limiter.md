---
title: 令牌桶 / 漏桶手撕
---

# 令牌桶 / 漏桶 / 滑动窗口手撕 — 限流算法的算法级实现

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
先定义保证，再选实现：**令牌桶约束长期速率与突发预算；计量型漏桶判断是否放行，队列整形器才控制出队节奏；滑动日志精确计数，子桶计数需要明确误差方向**。原子性、窗口精度、输出平滑性是三件不同的事。
:::

## 为什么单独讲它

[限流系统设计](../../system-design/rate-limiting) 讨论分布式权衡；本页聚焦可手推、可测试的单机算法。代码使用 `java.util` 的集合及 `java.util.function.LongSupplier`；注入的时钟必须以纳秒计、单调前进，生产默认使用 `System.nanoTime()`，测试则手动推进，不依赖 sleep。

### 三种算法对比

| 算法 | 突发流量 | 平滑性 | 内存 | 适用 |
|------|------|------|------|------|
| **令牌桶 Token Bucket** | ✅ **允许突发**（桶里有积存就能爆发） | 中 | O(1) | 限制 QPS 但允许偶尔爆发：API 网关、Guava RateLimiter |
| **计量型漏桶** | 水量未满时可立即接收多个请求 | 不控制出队 | O(1) | 到达流量的准入判断 |
| **漏桶队列整形器** | 入口可排队，满队列拒绝 | 控制相邻出队间隔 | O(队列容量) | 平滑输出到下游 |
| **固定窗口计数** | ❌ 突发风险（窗口边界双倍流量） | 差 | O(1) | 简单但有边界问题 |
| **保守子桶计数** | 仍可瞬时用尽窗口额度 | 不保证均匀；可能误拒绝 | O(子桶数) | 不允许超额、可以接受边界误拒绝 |
| **滑动窗口日志** | 仍可瞬时用尽窗口额度 | 精确计数，不保证均匀 | O(limit) | 精确约束任意滚动时间窗 |

## 算法 1：令牌桶（Token Bucket）

**心智模型**：

```
    ┌──────────┐
    │  令牌桶  │   ← 容量 capacity，初始装满
    │ ●●●●●●●● │   ← 后台按速率 rate (个/秒) 不断滴入新令牌
    │ ●●●●●●○○ │      满了就溢出（丢弃）
    └────┬─────┘
         │
         ▼ 请求来时尝试拿一个令牌
    [accept] / [reject]
```

**懒计算技巧（核心优化）**：不开后台线程往桶里滴令牌，而是**每次请求来时根据"上次更新到现在过了多久"按速率算出应补多少令牌**。这样实现是 O(1)、零线程开销。

```java
class TokenBucket {
    private final long capacity;            // 桶容量
    private final double refillRate;        // 每秒补充令牌数
    private double tokens;                  // 当前令牌数（用 double 防补充不精确）
    private long lastRefillTime;            // 上次补充时间（纳秒）
    private final LongSupplier clock;

    public TokenBucket(long capacity, double refillRate) {
        this(capacity, refillRate, System::nanoTime);
    }

    public TokenBucket(long capacity, double refillRate, LongSupplier clock) {
        if (capacity <= 0 || capacity > (1L << 53)
                || !Double.isFinite(refillRate) || refillRate <= 0) {
            throw new IllegalArgumentException("invalid capacity or refill rate");
        }
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;             // ★ 初始装满
        this.clock = Objects.requireNonNull(clock);
        this.lastRefillTime = clock.getAsLong();
    }

    public synchronized boolean tryAcquire(int permits) {
        if (permits <= 0) throw new IllegalArgumentException("permits must be positive");
        refill();                           // ★ 懒计算补充
        if (tokens >= permits) {
            tokens -= permits;
            return true;
        }
        return false;
    }

    private void refill() {
        long now = clock.getAsLong();
        double elapsedSec = (now - lastRefillTime) / 1e9;
        tokens = Math.min(capacity, tokens + elapsedSec * refillRate);  // ★ 上限 capacity
        lastRefillTime = now;
    }
}

// 使用：补充速率 100/秒，初始突发预算 200
TokenBucket limiter = new TokenBucket(200, 100);
if (limiter.tryAcquire(1)) { handleRequest(); } else { reject(); }
```

**特点**：
- 初始 200 令牌 → 瞬时可以发 200 个请求（**允许突发**）
- 持续耗尽后，长期可用速率由每秒补充 100 个决定；空闲可以积累到容量上限
- Guava 可作为成熟限速工具，但其预订时间、等待与初始积存语义不等同于这段“初始满桶、立即拒绝”的示例

**为什么不是“任意一秒最多 100 次”？** 在理想令牌计量下，任意长度为 T 秒的区间，可消耗的预算至多为 `capacity + refillRate*T`，因为初始最多有 capacity，期间最多再生成 rate*T。桶容量决定突发，速率决定长期供给，两者必须分开讲。double 版仍有浮点舍入，严格计费或极小时间粒度场景应使用有界整数/定点实现。

## 算法 2：漏桶（Leaky Bucket）

**心智模型**：

```
    请求进来
       │
       ▼
    ┌──────────┐
    │  漏桶    │   ← 容量 capacity（满了拒绝）
    │  ████    │
    │  ████    │
    └────┬─────┘
         │
         ▼ 固定速率 rate 个/秒流出
    [处理]
```

### 计量型漏桶：这段代码不负责平滑出队

水量按时间减少，请求使水量增加，满了就拒绝。容量为 3 时，即使时间完全没有推进，下面的 `tryAcquire()` 也能连续返回 3 次 true。因此它是准入计量器，不是固定速率执行器。

```java
class LeakyBucket {
    private final long capacity;
    private final double leakRate;          // 每秒漏掉个数
    private double water;                   // 当前水量
    private long lastLeakTime;

    public LeakyBucket(long capacity, double leakRate) {
        if (capacity <= 0 || !Double.isFinite(leakRate) || leakRate <= 0) {
            throw new IllegalArgumentException("invalid capacity or leak rate");
        }
        this.capacity = capacity;
        this.leakRate = leakRate;
        this.water = 0;
        this.lastLeakTime = System.nanoTime();
    }

    public synchronized boolean tryAcquire() {
        leak();                             // ★ 先漏水
        if (water + 1 <= capacity) {
            water++;
            return true;
        }
        return false;                       // 桶满了
    }

    private void leak() {
        long now = System.nanoTime();
        double elapsedSec = (now - lastLeakTime) / 1e9;
        water = Math.max(0, water - elapsedSec * leakRate);
        lastLeakTime = now;
    }
}
```

若容量、速率相同，并把 `tokens=capacity-water`，计量型漏桶与初始满令牌桶在这个单请求模型下有对应的准入行为。区别不在名字，而在是否把请求放进队列并安排释放时间。

### 队列整形器：相邻出队至少间隔 intervalNanos

```java
class LeakyBucketShaper {
    private final int capacity;
    private final long intervalNanos;
    private final LongSupplier clock;
    private final Deque<Runnable> queue = new ArrayDeque<>();
    private long lastRelease;
    private boolean released;

    public LeakyBucketShaper(int capacity, long intervalNanos) {
        this(capacity, intervalNanos, System::nanoTime);
    }

    public LeakyBucketShaper(int capacity, long intervalNanos, LongSupplier clock) {
        if (capacity <= 0 || intervalNanos <= 0) throw new IllegalArgumentException("invalid bounds");
        this.capacity = capacity;
        this.intervalNanos = intervalNanos;
        this.clock = Objects.requireNonNull(clock);
    }

    public synchronized boolean tryEnqueue(Runnable task) {
        Objects.requireNonNull(task);
        if (queue.size() == capacity) return false;
        queue.addLast(task);
        return true;
    }

    public synchronized Runnable pollReady() {
        if (queue.isEmpty()) return null;
        long now = clock.getAsLong();
        if (released && now - lastRelease < intervalNanos) return null;
        released = true;
        lastRelease = now;
        return queue.removeFirst();
    }
}
```

外部单消费者定时调用 `pollReady()`，在锁外执行返回的任务；没有就等待下一次调度，不忙等。首个任务可立即出队，下一次至少相隔 intervalNanos；即使调度延迟，也不在同一时刻补发一批积压任务。这里保证的是**出队间隔**，不保证外部线程池中任务的开始或完成时刻，也不是完整线程生命周期管理器。

例如 interval=100ms，时刻 0 入队 A、B、C；0ms 只取出 A，再取返回 null；99ms 仍为 null；100ms 才取 B。计量器同一时刻三个 true，与这个整形器的一次出队，是不同的可测试保证。

### 令牌桶 vs 漏桶面试一句话

> 令牌桶与计量型漏桶决定是否接收；队列整形器决定何时释放。要保护下游，还应区分速率限制、并发限制和任务实际耗时。

## 算法 3：滑动窗口计数（Sliding Window Counter）

**问题**：固定窗口（如"每分钟 100 次"）在边界有**双倍流量**风险——59 秒发 100 次 + 下一秒 0 秒又发 100 次 = 2 秒内 200 次。

### 保守子桶：保留所有与当前窗口相交的桶

把长度 W 的主窗口分成 B 段，桶宽为 W/B。当前滚动窗口可能横跨 **B+1 个桶**，所以不能只用 B 个槽覆盖掉最老的那个。这里整桶计入最老的相交桶：不会少算有效请求，但可能多算已过期请求，造成保守误拒绝；不是加权估计，也不是精确日志。

```java
class SlidingWindowCounter {
    private final int limit;
    private final int subWindowCount;
    private final long bucketNanos;
    private final long origin;
    private final LongSupplier clock;
    private final long[] counters;
    private final long[] bucketIds;

    public SlidingWindowCounter(int windowSizeMs, int limit, int subWindowCount) {
        this(windowSizeMs, limit, subWindowCount, System::nanoTime);
    }

    public SlidingWindowCounter(int windowSizeMs, int limit, int subWindowCount, LongSupplier clock) {
        if (windowSizeMs <= 0 || limit <= 0 || subWindowCount <= 0
                || subWindowCount > windowSizeMs || windowSizeMs % subWindowCount != 0) {
            throw new IllegalArgumentException("window must split into positive whole millisecond buckets");
        }
        this.limit = limit;
        this.subWindowCount = subWindowCount;
        this.bucketNanos = (long) (windowSizeMs / subWindowCount) * 1_000_000;
        this.clock = Objects.requireNonNull(clock);
        this.origin = clock.getAsLong();
        this.counters = new long[subWindowCount + 1];
        this.bucketIds = new long[subWindowCount + 1];
        Arrays.fill(bucketIds, -1);
    }

    public synchronized boolean tryAcquire() {
        long elapsed = clock.getAsLong() - origin;
        if (elapsed < 0) throw new IllegalStateException("clock moved backwards");
        long currentBucket = elapsed / bucketNanos;
        int slot = (int) (currentBucket % counters.length);
        if (bucketIds[slot] != currentBucket) {
            counters[slot] = 0;
            bucketIds[slot] = currentBucket;
        }
        long total = 0;
        for (int index = 0; index < counters.length; index++) {
            if (bucketIds[index] >= 0 && currentBucket - bucketIds[index] <= subWindowCount) {
                total += counters[index];
            }
        }
        if (total < limit) {
            counters[slot]++;
            return true;
        }
        return false;
    }
}
```

**为什么不会超额？** 真正位于 `(now-W,now]` 的请求，其桶号必然位于 `currentBucket-B` 到 `currentBucket`，这些桶都还在 B+1 个槽中。整桶计数是实际窗口请求数的上界，只有上界小于 limit 才接收，故不会少算。桶号按固定边界对齐，不用某桶首次请求的时间充当桶边界。

例如限额 2 次/1000ms、桶宽 100ms，1000ms 和 1099ms 各接收一次。2000ms 不能整体丢弃 `[1000,1100)`，因为 1099ms 那次仍有效。本实现保留旧桶，所以 2000ms、2001ms 都保守拒绝；旧代码覆盖该桶后两次都放行，导致滚动一秒内有 3 次成功请求。

保守版本可能把过期请求额外保留至多一个桶宽，不能承诺与精确窗口完全一致。B 越大，时间量化误差越小，单次扫描与存储代价也越大。

### 精确滑动日志：记录每一次已放行请求

```java
class SlidingWindowLog {
    private final long windowNanos;
    private final int limit;
    private final LongSupplier clock;
    private final Deque<Long> accepted = new ArrayDeque<>();

    public SlidingWindowLog(int windowSizeMs, int limit) {
        this(windowSizeMs, limit, System::nanoTime);
    }

    public SlidingWindowLog(int windowSizeMs, int limit, LongSupplier clock) {
        if (windowSizeMs <= 0 || limit <= 0) throw new IllegalArgumentException("invalid bounds");
        this.windowNanos = (long) windowSizeMs * 1_000_000;
        this.limit = limit;
        this.clock = Objects.requireNonNull(clock);
    }

    public synchronized boolean tryAcquire() {
        long now = clock.getAsLong();
        while (!accepted.isEmpty() && now - accepted.peekFirst() >= windowNanos) {
            accepted.removeFirst();
        }
        if (accepted.size() >= limit) return false;
        accepted.addLast(now);
        return true;
    }
}
```

窗口定义为 `(now-W,now]`，所以恰好经过 W 的旧请求应删除；拒绝请求不入队。同一时间的多次请求保留多个时间戳，不能用一个时间戳作为唯一 key 而覆盖。对上述四个时刻，精确日志返回 `true,true,true,false`，因为 2000ms 时只有 1000ms 的那次刚好过期。

日志中最多 limit 项，每项最多入队、出队一次，单次最坏 O(limit)、均摊 O(1)，空间 O(limit)。它约束任意窗口的数量，但仍允许在同一瞬间接收 limit 个请求，不等于输出均匀。

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 用墙上时钟计算令牌 | 校时回拨可能打乱时间差 | 用单调时钟，如 nanoTime |
| 令牌数用 `int`/`long` | 0.5 个令牌存不下，低速率限流不准 | 用 `double` 表示令牌数 |
| 多线程不加锁 | 令牌超发 | 同步块或 CAS，覆盖整个判断与更新 |
| 后台线程定时补令牌 | 浪费线程 + 时间分辨率受限于 sleep 精度 | **懒计算**——请求来时按时间差算补充 |
| 分布式集群每节点独立计数 | 集群总 QPS = 单节点 × N，超额 | 中央化用 Redis + Lua，或令牌桶按节点数预分配 |
| 漏桶用 `Thread.sleep` 模拟出 | 高 QPS 下线程切换爆炸 | 队列 + 定时调度（Disruptor / Netty 时间轮）|

## 复杂度

- **令牌桶 / 计量型漏桶**：单次时间 O(1)，空间 O(1)
- **队列整形器**：单次入队/取队均摊 O(1)，空间 O(capacity)
- **保守子桶计数**：单次时间 O(B)，空间 O(B)，并非独立于参数的 O(1)
- **滑动日志**：单次最坏 O(limit)、均摊 O(1)，空间 O(limit)

## 业界实现对照

| 实现 | 用的算法 |
|------|------|
| **Guava `RateLimiter.create(qps)`** | 默认 SmoothBursty；带 warmup 参数的重载才使用 SmoothWarmingUp |
| **Bucket4j**（Java 开源）| 令牌桶 + 分布式 |
| **Nginx `limit_req`** | 漏桶式限速；是否延迟或立即放行突发取决于 burst、nodelay、delay 等配置 |
| **Sentinel** | 令牌桶 + 滑动窗口 + 自适应限流（系统负载 / RT）|
| **Spring Cloud Gateway** | 令牌桶（基于 Redis Lua）|
| **Envoy / Istio** | 令牌桶（local + global 两级） |
| **AWS API Gateway** | 令牌桶式的 rate / burst 限制，具体配额语义按产品文档核对 |

## 分布式限流（面试加分）

单机限流上面三种算法够用。**多节点集群**要解决"全集群总和限流"，常见方案：

### 1. Redis + Lua（中央化）

```lua
-- 固定时长计数，TTL 从首请求起算
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local count = redis.call('INCR', key)
if count == 1 then
    redis.call('EXPIRE', key, 1)
end
return count <= limit and 1 or 0
```

这是**固定时长窗口计数**，不是令牌桶，也不是滚动窗口。Lua 保证操作原子，不会把固定窗口变成滑动窗口；窗口结束前后仍可能集中放行接近两倍限额。示例计数包含拒绝的尝试，要求 key 类型、limit 和 TTL 均由服务端控制。

若要 Redis 上的精确滑动日志，可用有序集合按时间清理、计数、插入，并用 Lua 原子执行。成员必须包含唯一请求标识，否则同毫秒请求会覆盖；还需处理时钟来源、保留时间与内存上限。

### 2. 令牌桶预分配（去中心化）

每个节点向中心申请一批预算，中心在授予时先扣减，再由节点本地消费。必须定义预算有效期、节点故障时的浪费或回收，以及重试幂等；这是通用设计模式，不应不加限定地归为某个产品的默认实现。

### 3. 两级限流

- **本地令牌桶**：先拒绝明显超量的请求，减轻中心压力
- **中央限额**：对所有通过本地且没有预分配预算覆盖的请求继续检查

不能只抽取 10% 请求检查中心，却声称严格约束全量。要减少中心调用，需要有已扣减的预分配预算，或明确接受近似误差。故障时 fail-open / fail-closed 也会改变全局保证。

## 面试常问 & 怎么答

### 令牌桶和漏桶到底什么区别

先问“漏桶”指计量器还是队列整形器。计量器只决定放行，可能连续放行；队列整形器控制出队时间。令牌桶则明确用 rate 与 capacity 分别描述长期供给和突发预算，不能把 rate 当作任意滚动一秒的硬上限。

### Guava RateLimiter 是什么算法

默认 `create(qps)` 是 SmoothBursty；显式带预热期的重载才是 SmoothWarmingUp。它们还包含未来时间预订和等待语义，不应把本页满桶即放行的简化代码当作 Guava 的逐行实现。

### 为什么不用 Thread.sleep 实现漏桶

`Thread.sleep` 精度差（OS 时钟分辨率几 ms）、高 QPS 下大量线程阻塞。生产用**时间轮 / Disruptor / Netty 调度器**做调度。

### 分布式集群限流怎么做

三档：
1. **最简**：每节点本地限流（QPS / 节点数）→ 总和可能不准
2. **精准**：Redis + Lua 中央化 → 性能瓶颈
3. **减少中心调用**：本地过滤 + 中央检查，或预先扣减后分发预算；不能用少量抽样替代严格的全量计量

### 滑动窗口为什么比固定窗口好

精确滑动日志消除了固定窗口边界重置问题；子桶计数存在时间量化，要明确是可能超发的估计，还是本页这种可能误拒绝的保守上界。两者都不等于按固定间隔出队。

## 看到什么就先想到这类

- "设计 RateLimiter" → 令牌桶（默认）
- "Guava RateLimiter 怎么实现" → 令牌桶 + 懒计算
- "Nginx limit_req 是什么算法" → 漏桶
- "允许突发流量" → 令牌桶
- "必须控制出队间隔" → 队列整形器
- "精准限流不要窗口量化误差" → 滑动日志
- "分布式集群限流" → Redis Lua / 令牌桶预分配 / 两级限流
