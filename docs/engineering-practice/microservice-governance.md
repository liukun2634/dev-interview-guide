---
title: 微服务治理
---

# 微服务治理

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--advanced">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
微服务治理解决分布式系统的稳定性问题。面试重点：限流算法对比、熔断状态机、服务注册发现机制、服务雪崩的预防。
:::

---

## 核心概念

### 1. 微服务拆分原则

微服务拆分没有固定公式，但有三条核心原则：

- **单一职责**：每个服务只负责一件事，修改原因应该只有一个。
- **高内聚低耦合**：服务内部功能紧密相关，服务之间依赖尽量少。
- **按业务域拆分（DDD）**：以领域驱动设计为指导，围绕业务边界划定服务边界，避免技术驱动拆分。

常见反模式：按技术层（Controller/Service/DAO）拆分，导致一个业务请求跨越多个服务，耦合反而更严重。

---

### 2. 服务注册与发现

```
  ┌───────────────────────────────────────────┐
  │              注册中心 (Registry)            │
  │   服务A: 192.168.1.10:8080               │
  │   服务B: 192.168.1.11:8081               │
  └──────────┬──────────────────┬─────────────┘
             │ 注册/心跳          │ 拉取服务列表
             ↓                  ↓
      ┌────────────┐      ┌────────────┐
      │  服务提供者  │      │  服务消费者  │
      │  (Provider) │      │ (Consumer) │
      └────────────┘      └────────────┘
                               │
                               │ 直接调用
                               ↓
                        ┌────────────┐
                        │  服务提供者  │
                        └────────────┘
```

**Nacos vs Eureka vs Consul 对比**

| 特性 | Nacos | Eureka | Consul |
|------|-------|--------|--------|
| 一致性模型 | AP + CP（可切换） | AP | CP |
| 配置中心 | 支持（内置） | 不支持 | 支持（KV存储） |
| 健康检查 | TCP/HTTP/心跳 | 客户端心跳 | Agent健康检查 |
| 生态 | Spring Cloud Alibaba | Spring Cloud Netflix | HashiCorp生态 |

> Nacos 默认走 AP（注册中心场景），也可切换为 CP（配置中心场景），灵活性最高，国内使用最广泛。

---

### 3. 限流算法对比

| 算法 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| 固定窗口 | 单位时间内计数，超限拒绝 | 实现简单 | 窗口边界突刺流量（两个窗口叠加可达2倍阈值） |
| 滑动窗口 | 按时间滑动的多个小窗口计数 | 解决边界突刺，精度高 | 内存占用略高 |
| 漏桶 | 请求进入桶，以固定速率流出 | 严格控制输出速率，削峰平谷 | 无法处理突发流量，对响应时间要求高 |
| 令牌桶 | 匀速生成令牌，请求消耗令牌 | 允许适度突发（桶内积累的令牌） | 实现比固定窗口复杂 |

> 面试结论：生产环境优选**令牌桶**（Sentinel、Guava RateLimiter 默认实现），兼顾平滑限流与突发处理。

---

### 4. 熔断器状态机

```
     成功率恢复
  ┌──────────────┐
  ↓              │
关闭 ──失败率达阈值──→ 打开 ──超时后──→ 半开
  ↑                               │
  └────── 试探请求成功 ─────────────┘
```

- **关闭（Closed）**：正常状态，放行所有请求，统计失败率。
- **打开（Open）**：失败率超过阈值，直接拒绝所有请求，快速失败。
- **半开（Half-Open）**：熔断超时后，放行少量试探请求：
  - 试探成功 → 恢复关闭状态
  - 试探失败 → 重新打开

---

## 典型场景与最佳实践

### 场景一：限流

使用 Sentinel 的 `@SentinelResource` 注解对资源进行限流保护，并指定降级处理方法：

```java
@SentinelResource(value = "getOrder", blockHandler = "handleBlock")
public Order getOrder(Long id) {
    return orderService.getById(id);
}

public Order handleBlock(Long id, BlockException e) {
    return Order.defaultOrder();
}
```

配置说明：
- `value`：资源名称，与 Sentinel 控制台/规则配置对应
- `blockHandler`：触发限流/熔断时的处理方法，方法签名须在原参数末尾增加 `BlockException`

---

### 场景二：熔断

Sentinel 熔断规则的三种策略：

| 策略 | 说明 |
|------|------|
| 慢调用比例 | 响应时间超过阈值的调用占比达到设定值时熔断 |
| 异常比例 | 异常请求占比达到阈值时熔断 |
| 异常数 | 统计周期内异常总数达到阈值时熔断 |

典型配置（通过代码或控制台均可）：

```java
DegradeRule rule = new DegradeRule("getOrder")
    .setGrade(CircuitBreakerStrategy.ERROR_RATIO.getType())
    .setCount(0.5)        // 50% 异常率触发熔断
    .setTimeWindow(10)    // 熔断持续 10 秒
    .setMinRequestAmount(5); // 最少 5 次请求才统计
```

---

### 场景三：降级

三种常见降级策略：

1. **返回默认值**：接口不可用时返回约定的兜底数据（如空列表、默认配置）
2. **读缓存**：主链路失败时从本地缓存或 Redis 获取上一次的结果
3. **简化逻辑**：关闭非核心计算（如个性化推荐），返回通用结果

使用 Feign + Sentinel 实现 fallback：

```java
@FeignClient(name = "order-service", fallback = OrderFallback.class)
public interface OrderClient {
    @GetMapping("/orders/{id}")
    Order getOrder(@PathVariable Long id);
}

@Component
public class OrderFallback implements OrderClient {
    @Override
    public Order getOrder(Long id) {
        // 返回缓存或默认值
        return Order.defaultOrder();
    }
}
```

---

### 场景四：超时与重试

**超时**：每次远程调用必须设置超时时间，防止线程被长时间占用。

**重试策略 — 指数退避**：

```
第1次失败 → 等待 1s → 重试
第2次失败 → 等待 2s → 重试
第3次失败 → 等待 4s → 重试
第4次失败 → 等待 8s → 放弃（最大重试次数）
```

Spring Retry 示例：

```java
@Retryable(
    value = RemoteCallException.class,
    maxAttempts = 4,
    backoff = @Backoff(delay = 1000, multiplier = 2)
)
public Order getOrderWithRetry(Long id) {
    return orderClient.getOrder(id);
}
```

> **重要原则**：只对**幂等接口**配置重试（GET、DELETE），非幂等操作（如扣款、下单）禁止重试，否则会导致重复操作。

---

## 面试常问 & 怎么答

**Q：四种限流算法的区别和适用场景？**

固定窗口实现最简单但有边界突刺问题；滑动窗口解决了突刺但内存略高；漏桶严格控制输出速率适合对下游限速；令牌桶允许突发流量适合对上游接口限流。生产中 Sentinel 和 Guava 默认用令牌桶。

---

**Q：熔断器三个状态怎么转换？**

正常时处于**关闭**状态，持续统计失败率；当失败率超过阈值，切换为**打开**状态，所有请求直接失败；经过熔断时间窗口后，切换为**半开**状态，放行少量探测请求：成功则回到关闭，失败则重新打开。

---

**Q：什么是服务雪崩？怎么防？**

服务雪崩：一个服务的故障导致调用方线程被耗尽，进而拖垮整条调用链，引起级联崩溃。

预防组合拳：
1. **限流**：控制入口流量，防止超载
2. **熔断**：下游出问题时快速失败，不阻塞线程
3. **降级**：熔断后返回兜底数据，保证核心链路可用
4. **隔离**：使用线程池或信号量隔离不同服务的资源（Hystrix 线程隔离）

---

**Q：注册中心选 AP 还是 CP？**

**注册中心优先选 AP**。原因：注册中心短暂的数据不一致（有节点信息稍旧）比完全不可用的代价小得多。服务发现的核心诉求是"能找到服务"，而不是"实时精确"。Eureka 是纯 AP，Nacos 默认也是 AP。只有在强一致性场景（如分布式锁、分布式配置）才考虑 CP（ZooKeeper、etcd）。

---

## 常见陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|----------|
| 熔断阈值设太低 | 正常流量波动就触发熔断，误伤正常请求 | 根据历史监控数据设置合理阈值，通常异常率 > 50% 才触发 |
| 非幂等接口配重试 | 重复扣款、重复下单等数据异常 | 只对幂等接口（GET/DELETE）配置重试，POST/PUT 慎重处理 |
| 限流只在网关层 | 内部服务间调用绕过网关，限流形同虚设 | 关键服务自身也要配置限流，实现多层防护 |

---

## 看到什么就先想到这类

- **"限流/QPS控制"** → 令牌桶/滑动窗口
- **"熔断/circuit breaker"** → Sentinel/Hystrix 状态机
- **"降级/fallback"** → 返回默认值/缓存
- **"服务注册/发现"** → Nacos/Eureka
- **"配置中心"** → Nacos Config/Apollo
- **"服务雪崩"** → 限流 + 熔断 + 降级组合拳
