---
title: 令牌桶 / 漏桶手撕
---

# 令牌桶 / 漏桶 / 滑动窗口手撕 — 限流算法的算法级实现

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
**令牌桶允许突发、漏桶强制平滑、滑动窗口精准计数**——三种限流算法各自适合不同场景。面试时**「设计 RateLimiter」是高频题**，能写出三种算法的 10-20 行 Java 实现 + 讲清楚 lazy 计算（懒计算）技巧就是高分。
:::

## 为什么单独讲它

`docs/system-design/rate-limiting.md` 从系统设计角度讲了限流的边界场景、分布式权衡。**这里专门讲算法实现**——面试官常问"现在白板上写一个 RateLimiter"。

### 三种算法对比

| 算法 | 突发流量 | 平滑性 | 内存 | 适用 |
|------|------|------|------|------|
| **令牌桶 Token Bucket** | ✅ **允许突发**（桶里有积存就能爆发） | 中 | O(1) | 限制 QPS 但允许偶尔爆发：API 网关、Guava RateLimiter |
| **漏桶 Leaky Bucket** | ❌ 强制平滑 | ✅ 强制按固定速率出 | O(队列大小) | 必须平滑输出：消息推送、写入数据库 |
| **固定窗口计数** | ❌ 突发风险（窗口边界双倍流量） | 差 | O(1) | 简单但有边界问题 |
| **滑动窗口计数** | ✅ 精准平滑 | ✅ | O(N) | 精准限流：广告投放、风控 |
| **滑动窗口日志** | ✅ 最精准 | ✅ | **O(请求数)** 高内存 | 极致精度但贵：金融交易 |

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

    public TokenBucket(long capacity, double refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;             // ★ 初始装满
        this.lastRefillTime = System.nanoTime();
    }

    public synchronized boolean tryAcquire(int permits) {
        refill();                           // ★ 懒计算补充
        if (tokens >= permits) {
            tokens -= permits;
            return true;
        }
        return false;
    }

    private void refill() {
        long now = System.nanoTime();
        double elapsedSec = (now - lastRefillTime) / 1e9;
        tokens = Math.min(capacity, tokens + elapsedSec * refillRate);  // ★ 上限 capacity
        lastRefillTime = now;
    }
}

// 使用：QPS 100，桶容量 200（允许 2 秒爆发）
TokenBucket limiter = new TokenBucket(200, 100);
if (limiter.tryAcquire(1)) { handleRequest(); } else { reject(); }
```

**特点**：
- 初始 200 令牌 → 瞬时可以发 200 个请求（**允许突发**）
- 之后稳定 100 QPS（按补充速率）
- Guava `RateLimiter.create(qps)` 就是这个算法的成熟实现

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

**与令牌桶反向**：令牌桶是"取得令牌就能发"，漏桶是"必须按固定速率出"。**强制平滑**，不允许突发。

```java
class LeakyBucket {
    private final long capacity;
    private final double leakRate;          // 每秒漏掉个数
    private double water;                   // 当前水量
    private long lastLeakTime;

    public LeakyBucket(long capacity, double leakRate) {
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

**实际工业实现**（如 Nginx `limit_req`）通常用**队列**版本：请求进来排队，处理线程按固定速率从队列取出。

### 令牌桶 vs 漏桶面试一句话

> "**令牌桶看入口、漏桶看出口**。令牌桶限制"最多每秒进 N 个"但允许突发；漏桶限制"最多每秒出 N 个"，强制平滑输出。Web API 用令牌桶（用户能接受偶尔爆发），下游写库用漏桶（防止压垮 DB）。"

## 算法 3：滑动窗口计数（Sliding Window Counter）

**问题**：固定窗口（如"每分钟 100 次"）在边界有**双倍流量**风险——59 秒发 100 次 + 下一秒 0 秒又发 100 次 = 2 秒内 200 次。

**解法**：维护**多个小窗口**，加权平均计数。

```java
class SlidingWindowCounter {
    private final int windowSizeMs;          // 主窗口大小（如 1000ms）
    private final int limit;                 // 每窗口限额
    private final int subWindowCount;        // 切分小窗口数（如 10）
    private final long[] counters;           // 小窗口计数环形数组
    private final long[] windowStart;        // 每个小窗口的起始时间

    public SlidingWindowCounter(int windowSizeMs, int limit, int subWindowCount) {
        this.windowSizeMs = windowSizeMs;
        this.limit = limit;
        this.subWindowCount = subWindowCount;
        this.counters = new long[subWindowCount];
        this.windowStart = new long[subWindowCount];
    }

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        int subWindowSize = windowSizeMs / subWindowCount;
        int idx = (int) ((now / subWindowSize) % subWindowCount);

        // ★ 当前小窗口过期了，重置
        if (now - windowStart[idx] >= windowSizeMs) {
            counters[idx] = 0;
            windowStart[idx] = now;
        }

        // ★ 统计最近 windowSizeMs 内的总数
        long total = 0;
        for (int i = 0; i < subWindowCount; i++) {
            if (now - windowStart[i] < windowSizeMs) {
                total += counters[i];
            }
        }

        if (total + 1 <= limit) {
            counters[idx]++;
            return true;
        }
        return false;
    }
}
```

**精度 vs 内存**：子窗口数越多越精准（10 个就基本看不出边界问题），内存也越多。生产 5-10 个常用。

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 用 `System.currentTimeMillis()` 计算令牌 | 精度不够 + NTP 时钟回拨时数学异常 | 用 `System.nanoTime()`（单调递增）|
| 令牌数用 `int`/`long` | 0.5 个令牌存不下，低速率限流不准 | 用 `double` 表示令牌数 |
| 多线程不加锁 | 令牌超发 | `synchronized` 或 `AtomicReference` + CAS |
| 后台线程定时补令牌 | 浪费线程 + 时间分辨率受限于 sleep 精度 | **懒计算**——请求来时按时间差算补充 |
| 分布式集群每节点独立计数 | 集群总 QPS = 单节点 × N，超额 | 中央化用 Redis + Lua，或令牌桶按节点数预分配 |
| 漏桶用 `Thread.sleep` 模拟出 | 高 QPS 下线程切换爆炸 | 队列 + 定时调度（Disruptor / Netty 时间轮）|

## 复杂度

- **令牌桶 / 漏桶懒计算版**：O(1) per tryAcquire
- **滑动窗口计数**：O(子窗口数)（10 个左右常数级）
- **空间**：O(1) 或 O(子窗口数)

## 业界实现对照

| 实现 | 用的算法 |
|------|------|
| **Guava `RateLimiter.create(qps)`** | 令牌桶 + WarmUp 平滑启动版本 |
| **Bucket4j**（Java 开源）| 令牌桶 + 分布式 |
| **Nginx `limit_req`** | 漏桶（队列版） |
| **Sentinel** | 令牌桶 + 滑动窗口 + 自适应限流（系统负载 / RT）|
| **Spring Cloud Gateway** | 令牌桶（基于 Redis Lua）|
| **Envoy / Istio** | 令牌桶（local + global 两级） |
| **AWS API Gateway** | 令牌桶（X-Ratelimit-* HTTP 头返回剩余令牌）|

## 分布式限流（面试加分）

单机限流上面三种算法够用。**多节点集群**要解决"全集群总和限流"，常见方案：

### 1. Redis + Lua（中央化）

```lua
-- limit.lua：原子执行 = 拿令牌 + 判断是否超额
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local count = redis.call('INCR', key)
if count == 1 then
    redis.call('EXPIRE', key, 1)            -- 1 秒滑动窗口
end
return count <= limit and 1 or 0
```

**特点**：精准但单点 Redis 性能瓶颈。

### 2. 令牌桶预分配（去中心化）

每个节点向中心拉一批令牌（如 100），用完再拉。**Sentinel 的集群限流**就是这种。

### 3. 两级限流

- **本地令牌桶**：拦住绝大部分流量（90%）
- **中央 Redis 限流**：精准兜底（10%）

这是 Envoy / Istio 的做法，吞吐 + 精度兼得。

## 面试常问 & 怎么答

### 令牌桶和漏桶到底什么区别

**令牌桶看入口（允许突发）、漏桶看出口（强制平滑）**。一个限"最多每秒进 N 个"，一个限"最多每秒出 N 个"。Web 网关用令牌桶；写下游 DB 用漏桶。

### Guava RateLimiter 是什么算法

令牌桶 + **WarmUp 平滑启动**——刚启动时令牌补充速率慢，避免冷启动突刺。SmoothBursty 模式允许积存令牌应对突发，SmoothWarmingUp 强制平滑。

### 为什么不用 Thread.sleep 实现漏桶

`Thread.sleep` 精度差（OS 时钟分辨率几 ms）、高 QPS 下大量线程阻塞。生产用**时间轮 / Disruptor / Netty 调度器**做调度。

### 分布式集群限流怎么做

三档：
1. **最简**：每节点本地限流（QPS / 节点数）→ 总和可能不准
2. **精准**：Redis + Lua 中央化 → 性能瓶颈
3. **生产**：本地令牌桶兜大头 + 中央校准（Sentinel / Envoy 做法）

### 滑动窗口为什么比固定窗口好

固定窗口有"**边界双倍流量**"问题：窗口结束最后一秒发满 + 下一秒又能发满。滑动窗口用多个小子窗口模拟连续滑动，**任意时刻往前看 1 秒**都不超额。

## 看到什么就先想到这类

- "设计 RateLimiter" → 令牌桶（默认）
- "Guava RateLimiter 怎么实现" → 令牌桶 + 懒计算
- "Nginx limit_req 是什么算法" → 漏桶
- "允许突发流量" → 令牌桶
- "必须平滑输出" → 漏桶
- "精准限流不要边界问题" → 滑动窗口计数
- "分布式集群限流" → Redis Lua / 令牌桶预分配 / 两级限流
