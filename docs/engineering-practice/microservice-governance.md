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

## Service Mesh 与 Istio

Service Mesh 是 2025-2026 年大厂微服务架构面试的**必考主题**。它解决了"治理能力散落在每个业务代码里"的痛点——把熔断、限流、重试、灰度等全部下沉到**基础设施层**。

### 核心思想：Sidecar 模式

```
┌─────────────────────────────────────────┐
│         传统（治理在 SDK 里）             │
│  [Spring Cloud SDK] ←嵌入业务代码         │
│  熔断/重试/链路追踪/服务发现 = 业务包      │
│  升级 SDK = 全公司升级                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Service Mesh（治理在 Sidecar）       │
│  ┌──────┐    拦截    ┌─────────┐         │
│  │业务 A│ ←────────→ │ Envoy A │         │
│  └──────┘            └─────────┘         │
│      ↓ 业务零感知       ↓                │
│  ┌─────────┐         ┌─────────┐         │
│  │ Envoy B │ ←────── │业务 B   │         │
│  └─────────┘         └─────────┘         │
│  治理逻辑在 sidecar  ↑ 业务包零依赖       │
└─────────────────────────────────────────┘
```

### Istio 架构（控制面 + 数据面）

```
┌──────────────────────────────────────┐
│         控制面（Control Plane）        │
│  ┌─────────────────────────────────┐ │
│  │  Istiod                          │ │
│  │  ├── Pilot:   下发路由/流量规则   │ │
│  │  ├── Citadel: 证书签发（mTLS）   │ │
│  │  └── Galley:  配置校验           │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
           ↓ xDS 协议
┌──────────────────────────────────────┐
│       数据面（Data Plane）            │
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │Envoy A │ │Envoy B │ │Envoy C │   │
│  └────────┘ └────────┘ └────────┘   │
└──────────────────────────────────────┘
```

### Istio 核心 CRD（面试必背）

| CRD | 作用 | 一句话理解 |
|-----|------|----------|
| **VirtualService** | 流量路由规则 | "什么流量去哪个版本"（按 header / weight / path 路由）|
| **DestinationRule** | 目标服务策略 | "到了这个服务后，怎么连接/负载均衡/熔断" |
| **Gateway** | 入口流量配置 | 集群入口的"南北向"流量配置 |
| **ServiceEntry** | 外部服务接入 | 把外部服务（如 RDS、SaaS API）纳入 Mesh 管理 |
| **PeerAuthentication** | mTLS 策略 | 强制服务间双向 TLS |
| **AuthorizationPolicy** | 访问控制 | 谁能调用谁，类似 RBAC |

### 实战配置示例

#### 灰度发布（按 Header + 按 Weight）

```yaml
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: orders
spec:
  hosts: [orders.default.svc.cluster.local]
  http:
  # 规则 1：带特定 header 的灰度用户 → v2
  - match:
    - headers:
        x-user-type:
          exact: beta
    route:
    - destination: { host: orders, subset: v2 }
  # 规则 2：剩余流量 90/10 切流
  - route:
    - destination: { host: orders, subset: v1 }
      weight: 90
    - destination: { host: orders, subset: v2 }
      weight: 10
---
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: orders
spec:
  host: orders
  trafficPolicy:
    connectionPool:
      tcp: { maxConnections: 100 }
      http: { http2MaxRequests: 1000 }
    outlierDetection:        # 熔断
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
  subsets:
  - name: v1
    labels: { version: v1 }
  - name: v2
    labels: { version: v2 }
```

### Service Mesh vs Spring Cloud

这是 2025 年最常被追问的对比：

| 维度 | Spring Cloud | Service Mesh（Istio）|
|------|-------------|---------------------|
| **治理位置** | 业务代码（SDK 嵌入）| Sidecar（业务无感知）|
| **多语言支持** | 主要 Java | **全语言**（任何语言都享受治理）|
| **升级成本** | 全公司升级 SDK | 升 Envoy/Istio，业务无感 |
| **运行时开销** | 进程内调用，零额外 | **+2-5ms 延迟**（Sidecar 跳两次）|
| **学习曲线** | 中（Java 程序员熟悉）| 高（需懂 K8s + Envoy + xDS）|
| **运维门槛** | 中 | **高**（Istiod 自身就是个分布式系统）|
| **典型选型** | Java 单语言、中小团队 | 多语言、规模化、K8s 重度用户 |

### 何时不该上 Istio

::: warning ⚠️ 别为了 "云原生" 而 Service Mesh

**不该上的信号**：
- 服务数 < 30，且都是 Java
- 团队没专职 SRE/Platform 工程师
- 业务对延迟敏感（每请求 +2-5ms 不可接受）
- 已用 Spring Cloud 多年，治理体系已成熟

**渐进路线**：从 **Spring Cloud → 边缘网关（Higress / Apache APISIX）→ Istio Ambient Mode（无 Sidecar 模式）→ 完整 Istio**，每一步都拿到价值。

:::

### Sidecar Mode vs Ambient Mode（2024 新趋势）

| 模式 | 部署 | 优势 | 局限 |
|------|------|------|------|
| **Sidecar Mode**（传统）| 每个 Pod 注入 Envoy | 隔离强、规则细 | 资源开销大、启动慢 |
| **Ambient Mode**（2024 GA）| 节点级 ztunnel + 命名空间 Waypoint | 资源减半、平滑接入 | 部分高级功能仍演进中 |

**面试加分点**：能说出"Istio 2024 推出的 Ambient Mode 用节点级代理替代 Sidecar，把资源开销降低 50%+"——这是了解前沿动态的信号。

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
4. **隔离**：使用线程池或信号量隔离不同服务的资源（Sentinel 信号量隔离 / Hystrix 线程池隔离，⚠️ **Hystrix 2018 年起停止维护**，新项目一律选 Sentinel）

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
- **"熔断/circuit breaker"** → Sentinel 状态机（Hystrix 已停维，仅遇到旧项目需了解）
- **"降级/fallback"** → 返回默认值/缓存
- **"服务注册/发现"** → Nacos/Eureka
- **"配置中心"** → Nacos Config/Apollo
- **"服务雪崩"** → 限流 + 熔断 + 降级组合拳
