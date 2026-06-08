---
title: Dubbo 3 / Apache Dubbo
---

# Apache Dubbo 3

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频（国内必考）</span>

::: tip 💡 核心要点
**国内大厂（阿里、京东、美团、字节内部门户、滴滴）面试 100% 问 Dubbo**——它是国内 RPC 事实标准。Dubbo 3 三大变化：① **Triple 协议**（HTTP/2 + Protobuf，**gRPC 互通**）取代 Dubbo 私有协议；② **应用级服务注册**（替代接口级，注册中心压力降 90%）；③ **云原生支持**（K8s Service Discovery、Istio 集成）。**面试黄金回答**：「**Dubbo = RPC 框架 + 服务治理**，与 Spring Cloud 的区别是'Spring Cloud 是工具箱、Dubbo 是一体化框架'」。
:::

---

## Dubbo 是什么

> **Apache Dubbo** = 高性能 Java RPC 框架 + 服务治理平台。**阿里 2008 年开源，2018 年捐给 Apache 顶级项目**，2022 年发布 3.0。

### 一句话定位

> 「**Java 微服务的 RPC + 治理一体化方案**——RPC 调用 + 服务注册 + 负载均衡 + 流量治理 + 监控全打包**」**

### Dubbo vs Spring Cloud vs gRPC

| 维度 | **Dubbo 3** | **Spring Cloud (Alibaba)** | **gRPC** |
|------|-------------|---------------------------|---------|
| **定位** | 一体化 RPC 框架 | 工具箱（拼装式微服务）| 纯 RPC 协议 + Stub |
| **协议** | Triple（HTTP/2 + Protobuf）/ Dubbo（私有 TCP）| HTTP/REST（Feign）| HTTP/2 + Protobuf |
| **服务发现** | Nacos / ZK / Consul | Nacos / Eureka | 客户端 LB / xDS |
| **流量治理** | **内置**（路由、限流、降级、灰度）| Sentinel / Resilience4j | 需 Istio / Envoy |
| **跨语言** | **Triple 协议跨语言**（Java/Go/Rust/Node）| HTTP 天然跨语言 | 极强（10+ 语言）|
| **性能** | Triple 协议接近 gRPC | HTTP/1.1 慢一截 | **最快** |
| **典型用户** | 阿里、京东、美团、字节、滴滴 | Spring 系企业 | Google、Netflix、外企 |
| **生态** | 国内强、海外弱 | **全球最大** | Google + CNCF 生态 |
| **学习曲线** | 中（注解 + XML 两套）| 低 | 中（要写 .proto）|

::: tip 💡 一句话区分
- **Spring Cloud**：「**工具箱**」——拼装 Nacos + Feign + Sentinel + Gateway
- **Dubbo**：「**一体化**」——一个框架解决所有（甚至自带网关 Higress）
- **gRPC**：「**纯协议**」——只解决"如何通信"，治理靠 Istio
:::

---

## Dubbo 3 三大核心变化

### 1. Triple 协议（替代 Dubbo 协议）

Dubbo 2.x 用**私有 TCP 协议**（Dubbo Protocol），**跨语言难、不能穿越 K8s Service Mesh**。Dubbo 3 推出 **Triple 协议**：

```
Triple = HTTP/2 + Protobuf + gRPC 协议兼容
   ↓
✅ gRPC 客户端可直接调用 Dubbo Triple 服务
✅ Dubbo 客户端可直接调用 gRPC 服务
✅ 可穿越 Envoy / Istio（HTTP/2 标准协议）
✅ 支持 Streaming RPC（一/双向流）
```

```java
// Dubbo 3 Triple 协议示例
@DubboService(protocol = "tri")     // ← 标记使用 Triple
public class OrderServiceImpl implements OrderService {
    @Override
    public Order findById(Long id) { ... }
}

// 客户端
@DubboReference(protocol = "tri")
private OrderService orderService;
Order o = orderService.findById(123L);   // 底层走 HTTP/2 + Protobuf
```

| 协议 | 端口 | 协议层 | 适合 |
|------|------|--------|------|
| **dubbo**（默认 2.x）| 20880 | 私有 TCP | 高性能、纯 Dubbo 集群 |
| **tri**（推荐 3.x）| 50051 | HTTP/2 | **跨语言、K8s、Service Mesh** |
| **rest** | 80 | HTTP/1.1 | 暴露 HTTP API 给浏览器 / 老系统 |

### 2. 应用级服务注册（替代接口级）

**Dubbo 2.x 的痛点**：注册中心存储**每个接口的提供者**——一个应用 100 个接口 × 100 个实例 = 1 万条注册数据 → ZK / Nacos 压力爆炸。

```
Dubbo 2.x 接口级注册：
  注册中心存储：
    /dubbo/com.example.OrderService → [provider-1, provider-2, ...]
    /dubbo/com.example.UserService  → [provider-1, provider-2, ...]
    /dubbo/com.example.ItemService  → [provider-1, provider-2, ...]
    ...（每个接口一条）
  总数据量：接口数 × 实例数

Dubbo 3 应用级注册（与 Spring Cloud / K8s 对齐）：
  注册中心只存：
    /services/order-app → [provider-1, provider-2, ...]
  元数据中心存接口列表（一次性拉取）
  总数据量：应用数 × 实例数（少 1-2 个数量级）
```

| 对比 | 接口级（Dubbo 2.x） | 应用级（Dubbo 3）|
|------|-------------------|----------------|
| 注册中心数据量 | 接口数 × 实例数 | 应用数 × 实例数 |
| 与 Spring Cloud / K8s 兼容 | ❌ | ✅ |
| 元数据存储 | 注册中心 | **元数据中心（Nacos / 内置）** |
| 适用规模 | 中小集群 | **大规模 + K8s** |

### 3. 云原生支持

- **K8s Service Discovery**：Dubbo 3 可直接用 K8s Service 作为注册中心
- **Istio / Envoy 集成**：Triple 协议天然穿越 Service Mesh
- **Higress 网关**：Dubbo 团队推出的云原生网关，支持 Triple / HTTP / gRPC 多协议

---

## Dubbo 核心架构

```
┌─────────────────────────────────────────────────────────┐
│                  注册中心（Nacos / ZK）                   │
│  ① Provider 启动注册   ② Consumer 启动订阅                │
└────────────┬────────────────────────┬───────────────────┘
             │ register                │ subscribe / notify
             ↓                         ↑
        ┌─────────┐                ┌─────────┐
        │Provider │                │Consumer │
        │ (服务端) │ ← RPC 调用 ←  │ (客户端) │
        └─────────┘                └─────────┘
             │                         ↑
             │ ③ monitor metrics       │
             ↓                         │
┌────────────────────────────────────────────────────────┐
│            监控中心（Prometheus / 控制台）              │
└────────────────────────────────────────────────────────┘
```

### 调用流程（一次 RPC 的完整 9 步）

```
1. Consumer 启动 → 订阅 Provider 列表 → 缓存在本地
2. Consumer 调用 OrderService.findById(123)
3. 走代理（ProxyFactory）→ 生成 Invocation 对象
4. Cluster 层：选择一组 Invoker
5. LoadBalance 层：按策略选一个 Invoker（轮询 / 随机 / 一致性哈希）
6. Filter 链：监控 / 鉴权 / 限流 / 日志（可扩展）
7. Protocol 层：序列化（Hessian / Protobuf）+ 选择协议（Triple / Dubbo / REST）
8. Transport 层：Netty 发送
9. Provider 收到 → 反序列化 → 执行业务 → 序列化 → 返回
```

### 核心组件分层（Dubbo SPI）

| 层 | 接口 | 职责 |
|----|------|------|
| **Service** | `@DubboService` / `@DubboReference` | 业务接口暴露/引用 |
| **Config** | ServiceConfig / ReferenceConfig | 配置封装 |
| **Proxy** | ProxyFactory | 生成代理（JDK / Javassist） |
| **Registry** | RegistryFactory | 注册中心（Nacos / ZK） |
| **Cluster** | Cluster | 容错策略（Failover / Failfast / Failsafe）|
| **Monitor** | MonitorFactory | 监控数据上报 |
| **Protocol** | Protocol | 协议（Triple / Dubbo / REST） |
| **Exchange** | Exchanger | 请求-响应模式 |
| **Transport** | Transporter | Netty / Mina（默认 Netty） |
| **Serialize** | Serialization | Hessian2 / Protobuf / Kryo / JSON |

**面试黄金答法**：「**Dubbo 的核心 SPI 分 10 层，每层都可替换 → 这是它能成为'一体化框架'的关键**」。

---

## 集群容错（必背 6 种）

```java
@DubboReference(cluster = "failover")   // 指定容错策略
private OrderService orderService;
```

| 策略 | 含义 | 适用 |
|------|------|------|
| **Failover**（默认） | 失败自动切换其他 Provider 重试 | 读操作（幂等） |
| **Failfast** | 失败立即报错 | **写操作（避免重复插入）** |
| **Failsafe** | 失败忽略（吞掉异常）| 旁路日志、监控 |
| **Failback** | 失败定时重发 | 异步消息通知 |
| **Forking** | 并行调用多个 Provider，一个成功就返回 | **强读一致 + 容忍资源消耗** |
| **Broadcast** | 广播给所有 Provider | 缓存刷新、状态同步 |

::: warning ⚠️ 容错策略选错的真实事故
**默认 Failover 用在"写订单"接口**：网络抖动重试 3 次 → 数据库出现 3 条订单。**写操作一定要改 `Failfast`** + 上游做幂等。
:::

---

## 负载均衡策略

| 策略 | 含义 | 适用 |
|------|------|------|
| **Random**（默认） | 加权随机 | 一般场景 |
| **RoundRobin** | 加权轮询 | 实例同构 |
| **LeastActive** | 最少活跃数 | **慢调用 / 长耗时差异大** |
| **ShortestResponse** | 最短响应时间（Dubbo 3 新增） | 实例性能不均衡 |
| **ConsistentHash** | 一致性哈希 | **同一用户路由同一 Provider**（保证缓存命中） |

---

## 服务降级与限流

### 优雅降级（Mock）

```java
// 接口
public interface OrderService {
    Order findById(Long id);
}

// 自定义降级实现
public class OrderServiceMock implements OrderService {
    @Override
    public Order findById(Long id) {
        return Order.empty();  // 返回兜底数据
    }
}

// 引用配置
@DubboReference(mock = "com.example.OrderServiceMock")
private OrderService orderService;
```

### 限流（与 Sentinel 集成）

```java
@SentinelResource(value = "findById", blockHandler = "handleBlock")
@Override
public Order findById(Long id) { ... }

public Order handleBlock(Long id, BlockException ex) {
    return Order.empty();
}
```

详见 [Spring Cloud · Sentinel](./spring-cloud-overview#熔断与限流)。

---

## Dubbo 3 + Spring Boot 实战

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.apache.dubbo</groupId>
    <artifactId>dubbo-spring-boot-starter</artifactId>
    <version>3.3.0</version>
</dependency>
<dependency>
    <groupId>org.apache.dubbo</groupId>
    <artifactId>dubbo-registry-nacos</artifactId>
    <version>3.3.0</version>
</dependency>
```

```yaml
# application.yml
dubbo:
  application:
    name: order-service
    qos-enable: true       # 内置 QoS 命令行（telnet 22222）
  protocol:
    name: tri              # ★ Triple 协议
    port: 50051
  registry:
    address: nacos://127.0.0.1:8848
  consumer:
    timeout: 3000
    retries: 0             # ★ 写操作要禁用重试
```

```java
// 服务端
@SpringBootApplication
@EnableDubbo               // ★ 关键注解
public class OrderApp {
    public static void main(String[] args) { SpringApplication.run(OrderApp.class, args); }
}

@DubboService             // 暴露服务
public class OrderServiceImpl implements OrderService {
    @Override
    public Order findById(Long id) { return orderRepo.findById(id).orElse(null); }
}

// 客户端
@RestController
public class OrderController {
    @DubboReference        // 引用远程服务
    private OrderService orderService;

    @GetMapping("/orders/{id}")
    public Order get(@PathVariable Long id) {
        return orderService.findById(id);
    }
}
```

---

## SPI 机制：Dubbo 灵魂

Dubbo 的所有扩展都基于 SPI（Service Provider Interface）。**面试常考"Dubbo SPI 和 Java SPI 区别"**。

| 维度 | Java SPI | **Dubbo SPI** |
|------|----------|---------------|
| 配置文件 | `META-INF/services/` | `META-INF/dubbo/` |
| 实例化 | **加载全部并实例化** | **按 name 加载**（懒加载）|
| 默认值 | 不支持 | `@SPI("dubbo")` 指定默认 |
| AOP（Wrapper） | ❌ | ✅ 自动包装一层 |
| IoC | ❌ | ✅ 自动注入其他扩展 |
| 自适应（@Adaptive）| ❌ | ✅ **运行时根据 URL 参数动态选择实现** |

```java
@SPI("dubbo")               // 默认实现是 dubbo
public interface Protocol {
    @Adaptive("protocol")   // ★ 根据 URL.protocol 参数动态选实现
    <T> Exporter<T> export(Invoker<T> invoker);
}

// META-INF/dubbo/org.apache.dubbo.rpc.Protocol
dubbo=org.apache.dubbo.rpc.protocol.dubbo.DubboProtocol
tri=org.apache.dubbo.rpc.protocol.tri.TripleProtocol
rest=org.apache.dubbo.rpc.protocol.rest.RestProtocol
```

**Adaptive 的含义**：调用 `protocol.export(invoker)` 时，Dubbo 看 invoker 的 URL → `protocol=tri` → 自动选 TripleProtocol。**这是 Dubbo 高扩展性的核心**。

---

## 服务化最佳实践（生产经验）

| 实践 | 建议 |
|------|------|
| **粒度** | 服务接口设计**粗粒度**——一次调用做完一件事，避免多次远程调用累计延迟 |
| **超时** | **客户端必设 timeout**（默认 1s，太短）；按业务调整（3-10s） |
| **重试** | **写操作 retries=0**；读操作 1-2 次 |
| **幂等** | 写接口必须幂等（用唯一 token / 数据库唯一索引） |
| **接口版本** | 用 `@DubboService(version = "1.0.0")`；老版本与新版本并存灰度 |
| **分组** | 多个实现共存（A 团队 / B 团队），用 `group` 区分 |
| **异常** | 业务异常用自定义异常，**不要直接抛 RuntimeException**（序列化丢栈） |
| **接口包** | 接口单独打 jar 包（api-jar），不依赖任何实现，**避免循环依赖** |
| **优雅停机** | `dubbo.application.shutwait=10000`（默认 10s），等正在处理的请求完成 |

---

## Dubbo 与 Service Mesh：未来路线

::: tip 💡 2026 趋势
Dubbo 团队明确路线：「**Dubbo + Proxyless Mesh**」——**应用本身集成 xDS 协议（与 Envoy 同源）**，无需 Sidecar，**直接对接 Istio 控制面**。这避免了 Sidecar 的性能损耗，又拿到 Service Mesh 的流量治理能力。
:::

| 路线 | 含义 |
|------|------|
| **Dubbo + 注册中心**（传统） | Nacos / ZK；Dubbo 自治理 |
| **Dubbo + Sidecar Mesh**（过渡） | Dubbo 业务 + Envoy Sidecar 代理流量 |
| **Dubbo + Proxyless Mesh**（未来） | Dubbo 内嵌 xDS Client，直连 Istiod 控制面 |

详见 [Service Mesh 与 Istio](../engineering-practice/microservice-governance#service-mesh-与-istio)。

---

## 面试常问 & 怎么答

### Q1: Dubbo 和 Spring Cloud 怎么选？

**核心区别**：① Dubbo 是**一体化 RPC 框架**，Spring Cloud 是**工具箱**；② Dubbo 默认 TCP 协议（性能高），Spring Cloud 默认 HTTP（生态强）；③ Dubbo 国内生态强，Spring Cloud 全球生态强。**选择**：① 已用 Spring 全家桶 + 简单微服务 → Spring Cloud；② 大规模 RPC + 跨语言 + 国内大厂 → Dubbo；③ Triple 协议时代两者可混用（Dubbo 暴露 Triple 给 Spring Cloud 调）。

### Q2: Dubbo 3 的 Triple 协议是什么？

Triple = **HTTP/2 + Protobuf + gRPC 协议兼容**。解决 Dubbo 2.x 私有协议的三个痛点：① 跨语言难（私有协议无 SDK）；② 不能穿越 Envoy/Istio（HTTP/2 是 Mesh 标准）；③ 不支持 Streaming RPC。Triple 与 gRPC 互通——**Dubbo 客户端可调 gRPC 服务，gRPC 客户端可调 Dubbo 服务**。

### Q3: Dubbo 3 应用级注册解决了什么问题？

Dubbo 2.x 接口级注册的痛点：**注册中心数据量 = 接口数 × 实例数**。一个应用 100 个接口 × 100 实例 = 1 万条 → ZK 写压力爆炸。Dubbo 3 改为**应用级注册**：注册中心只存"应用名 → 实例 IP 列表"，接口列表放**元数据中心**（Nacos 或内置），数据量降 1-2 个数量级。**额外好处**：与 Spring Cloud / K8s 服务发现模型对齐，便于互通。

### Q4: Dubbo 的 SPI 和 Java SPI 区别？

四点区别：① **懒加载**（Java SPI 一次性全部加载，Dubbo 按 name 按需）；② **支持默认值**（`@SPI("xxx")`）；③ **支持 IoC**（扩展点之间自动注入）；④ **支持 AOP**（Wrapper 自动包装）。**最强大的是 `@Adaptive`**——运行时根据 URL 参数动态选实现，让 `Protocol.export()` 一个接口同时支持 Dubbo / Triple / REST 多协议。

### Q5: Dubbo 集群容错策略有哪些？

六种（必背）：**Failover**（默认，失败重试其他实例，**仅适合读**）、**Failfast**（失败立即报错，**适合写**）、**Failsafe**（吞掉异常，旁路日志）、**Failback**（失败定时重发，异步通知）、**Forking**（并行调用多个，最快返回）、**Broadcast**（广播所有 Provider，缓存刷新）。**生产事故 Top 1**：写订单接口默认 Failover → 网络抖动重试 3 次 → 3 条订单。

### Q6: Dubbo 调用流程？

九步：① Consumer 启动订阅 Provider 列表（注册中心 → 本地缓存）；② 调用代理方法 → 生成 Invocation；③ Cluster 层选 Invoker；④ LoadBalance 选实例；⑤ Filter 链（监控/鉴权/限流）；⑥ Protocol 层序列化；⑦ Netty 发送；⑧ Provider 反序列化 + 执行业务；⑨ 序列化返回。**关键扩展点**：Cluster、LoadBalance、Filter、Protocol、Serialization、Transport 全部 SPI 可替换。

---

## 看到什么就先想到这类

- **"RPC 框架选型 + 国内"** → Dubbo 3
- **"高性能 RPC + 跨语言"** → Triple 协议 / gRPC
- **"Dubbo 注册中心数据爆炸"** → 应用级注册（Dubbo 3 默认）
- **"Dubbo 写接口数据重复"** → Failover → 改 Failfast；接口幂等
- **"Dubbo 服务降级"** → mock + 自定义 Mock 实现
- **"Dubbo SPI"** → `@SPI("默认")` + `@Adaptive(参数名)`
- **"Dubbo 与 Spring Cloud 共存"** → Triple 协议互通 + 共享 Nacos
- **"Dubbo 灰度发布"** → 接口 version + 路由规则
- **"Dubbo 优雅停机"** → `dubbo.application.shutwait`
- **"Service Mesh + Dubbo"** → Proxyless Mesh（Dubbo 直连 Istio 控制面）

## 延伸阅读

- 📄 [Spring Cloud 速查](./spring-cloud-overview) — Nacos / Gateway / Sentinel / Seata
- 📄 [微服务架构](../system-design/microservices) — 服务拆分与治理
- 📄 [Service Mesh 与 Istio](../engineering-practice/microservice-governance#service-mesh-与-istio)
- 📄 [HTTP/HTTPS · gRPC](../computer-networks/http-https#grpc基于-http2-的高性能-rpc)
- 🔗 [dubbo.apache.org](https://dubbo.apache.org)
- 🔗 [higress.io](https://higress.io) — Dubbo 团队推出的云原生网关
