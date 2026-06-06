---
title: Spring Cloud 速查
---

# Spring Cloud 速查

微服务基础设施的 Spring 实现。本节为轻量速查，覆盖核心组件和面试常考点。深度内容参见 [微服务架构](../system-design/microservices)。

## 概念

::: warning ⚠️ 2026 必知

> **Spring Cloud Netflix（Eureka / Zuul 1 / Hystrix / Ribbon）已于 2021 年进入 maintenance mode**，仅社区维护、不再接受新特性。**新项目必选 Spring Cloud Alibaba（Nacos / Gateway / Sentinel）或 Kubernetes Native 方案**。面试提 Netflix 组件需同时说清迁移路径。

:::

- Spring Cloud 是一套微服务基础设施的解决方案，提供服务注册发现、网关、熔断限流、配置中心等能力。
- 主流技术栈已从 Netflix 全家桶（Eureka、Zuul、Hystrix）迁移到 Alibaba 体系（Nacos、Gateway、Sentinel）。
- Spring Cloud 本身是规范和抽象，具体实现由 Spring Cloud Netflix、Spring Cloud Alibaba 等提供。

## 服务注册与发现

### Nacos vs Eureka

| 对比项 | Nacos | Eureka |
|--------|-------|--------|
| 功能 | ✅ 注册发现 + 配置管理 | 只有注册发现 |
| 一致性模型 | AP / CP 可切换 | AP（最终一致） |
| 健康检查 | 服务端主动检测 + 客户端心跳 | 客户端心跳 |
| 控制台 | ✅ 自带 Web UI | 简单的状态页 |
| 维护状态 | ✅ 活跃维护 | Netflix 停止维护（2.x 闭源后开源社区维护） |
| 推荐度 | ✅ 推荐 | 不推荐新项目使用 |

**AP vs CP：**
- AP（可用性优先）：注册信息可能短暂不一致，但服务不会中断。适合大多数微服务场景。
- CP（一致性优先）：注册信息严格一致，但网络分区时可能不可用。适合对一致性要求高的场景。
- Nacos 默认 AP，可以切换为 CP（临时实例用 AP，持久实例用 CP）。

### 服务注册与发现流程

```
服务启动 → 注册到 Nacos（IP、端口、元数据）
                    ↓
消费者 → 从 Nacos 获取服务列表 → 负载均衡选择实例 → 发起调用
                    ↓
服务下线 → Nacos 检测到心跳停止 → 从服务列表移除
```

## API 网关

### Spring Cloud Gateway

Spring Cloud Gateway 是 Spring 官方的网关实现，基于 WebFlux（非阻塞），替代了 Zuul：

| 对比项 | Spring Cloud Gateway | Zuul 1.x |
|--------|---------------------|-----------|
| 性能模型 | ✅ 非阻塞（WebFlux / Netty） | 阻塞（Servlet） |
| 性能 | ✅ 高 | 较低 |
| 长连接 | ✅ 支持 WebSocket | 不支持 |
| 维护状态 | ✅ 活跃 | Netflix 停止维护 |

### 核心概念

| 概念 | 说明 | 示例 |
|------|------|------|
| Route（路由） | 路由规则，匹配请求转发到目标 | 将 /api/user/** 转发到 user-service |
| Predicate（断言） | 匹配条件 | Path、Method、Header、Query 等 |
| Filter（过滤器） | 请求/响应处理 | 添加 Header、限流、鉴权、日志 |

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service        # lb:// 表示从注册中心获取并负载均衡
          predicates:
            - Path=/api/user/**         # 路径匹配
          filters:
            - StripPrefix=1             # 去掉第一段路径前缀
            - AddRequestHeader=X-Request-Source, gateway
```

### 网关的典型职责

- 路由转发 — 将请求分发到对应的微服务
- 负载均衡 — 配合服务发现实现
- 统一鉴权 — 在网关层校验 Token
- 限流熔断 — 保护后端服务
- 日志监控 — 统一的请求日志和指标收集
- 跨域处理 — 统一配置 CORS

## 熔断与限流

### 为什么需要熔断？

微服务调用链中，一个服务不可用会导致级联故障（雪崩效应）：

```
A → B → C（故障） → B 线程被阻塞 → A 线程被阻塞 → 全部不可用
```

熔断器在检测到下游故障时快速失败，避免资源耗尽。

### 熔断器状态机

```
Closed（正常）→ 失败率超过阈值 → Open（熔断，快速失败）
                                        ↓
                                  等待一段时间
                                        ↓
                                Half-Open（放行少量请求试探）
                                        ↓
                            成功 → Closed  /  失败 → Open
```

### Sentinel vs Resilience4j

| 对比项 | Sentinel | Resilience4j |
|--------|----------|-------------|
| 来源 | 阿里巴巴 | 开源社区 |
| 功能 | ✅ 限流 + 熔断 + 热点 + 系统保护 | 熔断 + 重试 + 限流 + 隔离 |
| 控制台 | ✅ 实时监控 Dashboard | 无（依赖外部监控） |
| 规则配置 | ✅ 动态规则（可运行时修改） | 静态配置为主 |
| 生态 | Spring Cloud Alibaba | Spring Cloud 官方推荐 |
| 适用 | 国内微服务主流 | 轻量项目 |

### Sentinel 限流策略

| 策略 | 说明 |
|------|------|
| QPS 限流 | 每秒请求数超过阈值则拒绝 |
| 线程数限流 | 并发线程数超过阈值则拒绝 |
| 热点参数限流 | 针对某个参数值限流（如 userId） |
| 系统保护 | 根据系统指标（CPU、负载）自动限流 |

## 分布式配置中心

### Nacos Config

将配置从应用中抽离，集中管理，支持运行时动态更新：

```yaml
# bootstrap.yml（配置中心的配置在 bootstrap 中，优先于 application.yml 加载）
spring:
  application:
    name: user-service
  cloud:
    nacos:
      config:
        server-addr: localhost:8848
        file-extension: yml
```

### 配置热更新

```java
@RestController
@RefreshScope  // 标注这个注解的 Bean 在配置变更时会重新创建
public class ConfigController {
    
    @Value("${app.feature-flag:false}")
    private boolean featureFlag;
    
    @GetMapping("/config")
    public boolean getFlag() {
        return featureFlag;  // Nacos 中修改配置后自动更新
    }
}
```

**原理：** Nacos 客户端长轮询监听配置变更 → 检测到变化 → 发布 RefreshEvent → Spring 销毁 @RefreshScope 的 Bean 并重新创建。

#### Nacos 长轮询：HTTP 实现"实时推送"的秘密

::: tip 💡 配置中心怎么做到"秒级感知"

> Nacos **没有用 WebSocket / TCP 长连接**，只用 HTTP，但能秒级感知配置变化——核心是**长轮询（Long Polling）**：
>
> ```
> 客户端 → Nacos: GET /listener   (超时 30 秒)
>          ↓
>   Nacos 服务端 hold 住请求, 不立刻返回
>          ↓
>   ① 30 秒内有变更 → 立刻 return 200 + 变更通知
>   ② 30 秒内无变更 → 超时返回，客户端立刻再发起下一次长轮询
> ```
>
> 优势：兼容企业防火墙（只允许 HTTP）、服务端无需维护连接、客户端断网自愈。Apollo / Nacos / etcd watch 本质都是长轮询变种。

:::

## Seata：阿里开源的分布式事务框架

**Seata 是 2025-2026 年 Spring Cloud Alibaba 面试必问**——能讲清 AT / TCC / Saga / XA 四种模式的差异和适用场景，立刻区分初级和中高级。

### Seata 整体架构

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Service A   │    │  Service B   │    │  Service C   │
│ (RM 资源管理) │    │ (RM)         │    │ (RM)         │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └──────┬────────────┴───────────────────┘
              ↓
       ┌─────────────────┐
       │ TC 事务协调器     │  ← 独立部署的 Seata Server
       │ (Transaction    │
       │  Coordinator)   │
       └─────────────────┘

TM (Transaction Manager): 全局事务发起者，标记 @GlobalTransactional 的服务
RM (Resource Manager):    业务服务，管理本地资源（DB/MQ）
TC (Transaction Coord):   全局事务的"裁判"，独立部署
```

### 四种事务模式深度对比

| 模式 | 一致性 | 性能 | 业务侵入 | 适用 |
|------|-------|------|---------|------|
| **AT**（默认）| **最终一致** | 高 | 极低（注解即可）| **80% 场景首选**，关系型数据库 |
| **TCC** | **强一致** | 中 | 高（需实现 Try/Confirm/Cancel）| 金融、严格强一致 |
| **Saga** | 最终一致 | 高 | 中（需实现补偿）| 长流程、跨多个服务调用链 |
| **XA** | 强一致 | 低 | 低 | 必须 XA 兼容 DB（少用）|

### AT 模式工作原理（最常考）

**AT = Automatic Transaction**，本质是 **"两阶段提交 + 自动回滚 SQL"**：

```
@GlobalTransactional       ← TM 注解触发
public void placeOrder() {
    orderService.create();   ← RM A
    stockService.deduct();   ← RM B  ← 任一失败 → 全局回滚
    couponService.use();     ← RM C
}

第 1 阶段（业务 SQL 执行）:
  ① TM 向 TC 申请全局事务 XID
  ② RM 拦截业务 SQL:
     ├─ 解析 SQL → 算出"前镜像"（UPDATE 前的数据）
     ├─ 执行业务 SQL
     ├─ 算出"后镜像"（UPDATE 后的数据）
     ├─ 把前后镜像写入 undo_log 表（同一本地事务）
     └─ 本地事务提交（业务 SQL + undo_log 一起提交）
  ③ RM 向 TC 注册分支事务

第 2 阶段:
  分支全部成功 → TC 通知 RM 异步删除 undo_log
  任何分支失败 → TC 通知 RM 用 undo_log 反向生成回滚 SQL → 执行
```

::: warning ⚠️ AT 模式"读已提交"陷阱

> AT 是**异步两阶段**——第 1 阶段已经提交本地事务，**其他事务可以读到中间状态**！如果业务需要严格"读已提交不回退"，必须用 `SELECT ... FOR UPDATE` 走 Seata 的全局锁。

:::

### TCC 模式：金融场景的强一致方案

```java
@TwoPhaseBusinessAction(name = "deductStock", commitMethod = "commit", rollbackMethod = "rollback")
public boolean tryDeduct(@BusinessActionContextParameter String userId, int qty) {
    // Try: 冻结库存（preFreeze += qty）
    stockRepo.preFreeze(userId, qty);
    return true;
}

public boolean commit(BusinessActionContext ctx) {
    // Confirm: 真正扣库存
    stockRepo.confirmDeduct(...);
    return true;
}

public boolean rollback(BusinessActionContext ctx) {
    // Cancel: 释放冻结
    stockRepo.releasePreFreeze(...);
    return true;
}
```

**TCC 必须解决的 3 个工程问题**：
1. **空回滚**：Try 还没执行就回滚 → Cancel 收到全局事务 ID 但没业务记录 → 必须能识别"未执行过 Try"直接返回成功
2. **悬挂**：Cancel 比 Try 先到（网络抖动）→ Try 后到时要识别"已 Cancel 过"直接放弃
3. **幂等**：Confirm/Cancel 都可能被重试 → 必须实现幂等

### 选型决策

::: tip 💡 一句话定位

> **"AT 是 80% 项目首选"**（关系型 DB、注解即可、自动生成回滚）；**"TCC 用在金融"**（强一致 + 资源冻结，但开发量 3×）；**"Saga 用在长流程"**（多服务长链路，配合状态机）；**"XA 几乎不用"**（性能差、DB 支持差）。

:::

### Seata vs 本地消息表 vs RocketMQ 事务消息

| 方案 | 实现复杂度 | 性能 | 跨多服务 | 适用 |
|------|---------|------|-------|------|
| **Seata AT** | **低**（注解）| 高 | ✅ | 通用首选 |
| **本地消息表** | 中 | 高 | ❌ 只单服务事件投递 | 简单事件驱动 |
| **RocketMQ 事务消息** | 中 | 高 | ❌ 同上 | RocketMQ 用户 |
| **TCC** | 高 | 中 | ✅ | 金融强一致 |

详见 [分布式事务](../system-design/distributed-transaction)。

## 服务调用

### OpenFeign

声明式 HTTP 客户端，定义接口 + 注解即可调用其他微服务：

```java
@FeignClient(name = "user-service")  // 服务名（从注册中心解析）
public interface UserClient {
    
    @GetMapping("/api/users/{id}")
    UserDTO getUser(@PathVariable Long id);
    
    @PostMapping("/api/users")
    UserDTO createUser(@RequestBody CreateUserRequest request);
}

// 使用 — 像调用本地方法一样
@Service
public class OrderService {
    @Autowired private UserClient userClient;
    
    public void createOrder(Long userId) {
        UserDTO user = userClient.getUser(userId); // 实际发 HTTP 请求
    }
}
```

### 负载均衡

Spring Cloud LoadBalancer（替代 Ribbon）提供客户端负载均衡：

- 从注册中心获取服务实例列表
- 按策略选择实例（轮询、随机等）
- 发起 HTTP 请求

`lb://user-service` 中的 `lb://` 前缀就是触发负载均衡的标识。

## 面试常问 & 怎么答

### Q1: Nacos 和 Eureka 的区别？

三个核心区别：1) Nacos 同时支持注册发现和配置管理，Eureka 只有注册发现；2) Nacos 支持 AP/CP 切换，Eureka 只支持 AP；3) Nacos 有完善的控制台，Eureka 基本只有状态页。另外 Eureka 已经停止官方维护。

### Q2: Gateway 和 Zuul 的区别？

Gateway 基于 WebFlux（非阻塞），性能高，支持 WebSocket；Zuul 1.x 基于 Servlet（阻塞），性能较低。Gateway 是 Spring 官方推荐，Zuul 已停止维护。Gateway 的核心模型是 Route + Predicate + Filter。

### Q3: 什么是熔断？

当检测到下游服务故障（失败率超过阈值）时，熔断器切换到 Open 状态，后续请求直接快速失败，不再调用下游。等待一段时间后进入 Half-Open 状态，放行少量请求试探，成功则恢复，失败则继续熔断。目的是防止级联故障（雪崩效应）。

### Q4: Sentinel 的限流策略有哪些？

四种：QPS 限流（每秒请求数）、线程数限流（并发线程数）、热点参数限流（针对特定参数值）、系统保护（根据 CPU/负载自动限流）。Sentinel 的优势是支持动态规则和实时监控 Dashboard。

## 看到什么就先想到这类

- 出现服务注册、Nacos、Eureka。
- 出现网关、Gateway、路由。
- 出现熔断、限流、Sentinel、雪崩。
- 出现配置中心、@RefreshScope、热更新。
- 出现 Feign、服务调用、负载均衡。
