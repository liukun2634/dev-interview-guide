# 工程实践章节重写设计

## 目标

用统一的面试导向模板重写整个工程实践章节（8 个主题页 + 1 个索引），侧重**概念理解**和**面试应对**，而非深入实操教程。

## 定位与系统设计章节的区别

- **系统设计章节**：架构视角，回答"大规模系统怎么设计"（如缓存架构、消息队列选型、分布式事务方案）
- **工程实践章节**：实操视角，回答"这个技术怎么用、面试怎么答"（如 Redis 5 种数据结构各用在什么场景、Docker 镜像分层原理、K8s Pod 生命周期）

两者有交叉主题（消息队列、微服务、缓存），但角度不同：系统设计讲"为什么选这个方案"，工程实践讲"这个技术本身怎么工作"。

## 文件结构

```
docs/engineering-practice/
├── index.md                      # 章节总览（重写）
├── design-patterns.md            # 设计模式（重写，540行→按新模板重组）
├── docker.md                     # Docker 容器化（重写，281行→按新模板重组）
├── kubernetes.md                 # Kubernetes（新增）
├── redis.md                      # Redis 实战（新增）
├── message-queue.md              # 消息队列（新增）
├── microservice-governance.md    # 微服务治理（新增）
├── monitoring-observability.md   # 监控与可观测性（重写 monitoring-logging.md）
└── distributed-id.md             # 分布式 ID（重写，393行→按新模板重组）
```

### 删除的文件

- `git-workflow.md`（294 行）— 删除，不再包含
- `monitoring-logging.md`（353 行）— 删除，由 `monitoring-observability.md` 替代

### Sidebar 更新

`config.ts` 中 `'/engineering-practice/'` 的 sidebar 需要更新为新的 9 个条目。

## 每页统一模板

```markdown
---
title: 标题
---

# 标题

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
一句话概括这个技术解决什么问题、面试中的考查重点。
:::

---

## 核心概念

关键术语、原理、架构（面试要能说清楚的内容）。
用表格、ASCII 图、对比表等方式讲清楚。

## 典型场景与最佳实践

### 场景 1：标题
问题 → 方案 → 为什么这样做 → 代码/配置示例

### 场景 2：标题
...

## 面试常问 & 怎么答

### 问题 1？
答案（结构化、有重点）

### 问题 2？
...

## 常见陷阱

| 陷阱 | 症状 | 正确做法 |
|------|------|---------|
| ... | ... | ... |

## 看到什么就先想到这类

- 关键词 → 技术/方案映射
```

## 各页内容规划

### 1. design-patterns.md — 设计模式

重写现有 540 行内容，按新模板重组。

**核心概念：**
- SOLID 原则（每条一句话 + 违反时的症状）
- 23 种模式分三类概览表
- 面试重点 8 个模式

**典型场景（8 个模式，每个模式一个场景）：**

| 模式 | 场景 | Spring 中的应用 |
|------|------|----------------|
| 单例 | 全局配置/连接池 | Spring Bean 默认单例 |
| 工厂方法 | 多种支付方式创建 | BeanFactory |
| 建造者 | 复杂对象构建 | StringBuilder、Lombok @Builder |
| 代理 | AOP 日志/事务 | Spring AOP（JDK/CGLIB 动态代理）|
| 策略 | 多种算法切换 | Comparator、Spring Resource |
| 观察者 | 事件驱动 | ApplicationEvent/Listener |
| 模板方法 | 算法骨架+子类扩展 | JdbcTemplate、AbstractController |
| 责任链 | 请求过滤 | Filter 链、Spring Interceptor |

每个模式：一句话定义 → 类图关系（文字描述） → Java 代码（简短） → Spring 应用 → 面试追问

**面试常问：** 单例线程安全、工厂 vs 抽象工厂、JDK 动态代理 vs CGLIB、策略 vs 状态

### 2. docker.md — Docker 容器化

重写现有 281 行内容。

**核心概念：**
- 容器 vs 虚拟机（保留现有 ASCII 图）
- Namespace（隔离）+ Cgroups（资源限制）
- 镜像分层存储（Union FS）
- Dockerfile 指令（FROM/RUN/COPY/CMD/ENTRYPOINT 区别）

**典型场景：**
1. 编写高效 Dockerfile（多阶段构建、减少层数）
2. Docker Compose 多容器编排（Web + DB + Redis 示例）
3. 容器网络模型（bridge/host/none）

**面试常问：** CMD vs ENTRYPOINT、COPY vs ADD、容器怎么实现隔离、镜像瘦身方法

### 3. kubernetes.md — Kubernetes（新增）

**核心概念：**
- K8s 架构：Master（API Server/Scheduler/Controller Manager/etcd）+ Node（kubelet/kube-proxy/容器运行时）
- 核心资源对象表：Pod/ReplicaSet/Deployment/Service/ConfigMap/Secret/Ingress/HPA

**典型场景：**
1. 无状态应用部署（Deployment + Service + Ingress）
2. 配置管理（ConfigMap/Secret，环境变量 vs 挂载文件）
3. 弹性伸缩（HPA 基于 CPU/内存/自定义指标）
4. 滚动更新与回滚（strategy: RollingUpdate）

**面试常问：** Pod 生命周期、Service 类型（ClusterIP/NodePort/LoadBalancer）、liveness vs readiness 探针、K8s 如何实现服务发现

### 4. redis.md — Redis 实战（新增）

**核心概念：**
- 5 种基础数据结构 + 适用场景表

| 类型 | 底层 | 典型场景 |
|------|------|---------|
| String | SDS | 缓存、计数器、分布式锁 |
| Hash | ziplist/hashtable | 对象存储（用户信息）|
| List | quicklist | 消息队列、最新列表 |
| Set | intset/hashtable | 去重、交集（共同好友）|
| ZSet | skiplist+hashtable | 排行榜、延迟队列 |

- 持久化：RDB vs AOF vs 混合持久化
- 内存淘汰策略（8 种）

**典型场景：**
1. 缓存策略（Cache Aside/Read Through/Write Through/Write Behind）
2. 分布式锁（SETNX + 过期时间 + Lua 原子释放 + Redisson）
3. 缓存穿透/击穿/雪崩（问题 → 方案）

**面试常问：** Redis 为什么快（单线程+IO多路复用+内存）、Redis 6.0 多线程做了什么、大 key 问题怎么处理、热 key 问题

### 5. message-queue.md — 消息队列（新增）

**核心概念：**
- 消息模型：点对点 vs 发布订阅
- Kafka vs RabbitMQ vs RocketMQ 对比表
- Kafka 核心概念：Topic/Partition/Consumer Group/Offset

**典型场景：**
1. 异步解耦（订单→库存→通知）
2. 可靠投递保证（生产者确认 + 持久化 + 消费者手动 ACK）
3. 幂等消费（唯一 ID + 去重表/Redis SETNX）
4. 消息积压处理

**面试常问：** 如何保证消息不丢失、如何保证消息顺序、Kafka 为什么高吞吐（顺序写+零拷贝+分区并行）、消费者重平衡

### 6. microservice-governance.md — 微服务治理（新增）

**核心概念：**
- 微服务拆分原则（单一职责、按业务域）
- 服务注册与发现（Nacos/Eureka/Consul）
- 配置中心（Nacos Config/Apollo）

**典型场景：**
1. 限流（令牌桶/滑动窗口，Sentinel 配置）
2. 熔断（Hystrix/Sentinel 状态机：关闭→打开→半开）
3. 降级（fallback 策略）
4. 超时与重试（指数退避、最大重试次数）
5. 链路追踪（Trace ID 透传）

**面试常问：** 限流算法对比（计数器/滑动窗口/漏桶/令牌桶）、熔断器状态转换、服务雪崩怎么防、注册中心 AP vs CP

### 7. monitoring-observability.md — 监控与可观测性

重写现有 353 行（monitoring-logging.md）。

**核心概念：**
- 可观测性三大支柱（Metrics/Logs/Traces）
- Prometheus 数据模型（Counter/Gauge/Histogram/Summary）
- ELK Stack 架构
- 分布式链路追踪原理（Trace/Span/Parent-Child）

**典型场景：**
1. Prometheus + Grafana 监控搭建（指标采集→存储→可视化→告警）
2. ELK 日志体系（Filebeat→Logstash→Elasticsearch→Kibana）
3. 告警设计（分级、抑制、静默、值班机制）
4. SLI/SLO/SLA 定义

**面试常问：** 四大黄金指标（延迟/流量/错误率/饱和度）、Prometheus Pull vs Push、如何排查线上慢接口、SLI vs SLO vs SLA

### 8. distributed-id.md — 分布式 ID

重写现有 393 行，按新模板重组。

**核心概念：**
- 为什么需要分布式 ID（保留现有内容）
- 方案对比表：UUID / 数据库自增 / 雪花算法 / 号段模式 / Leaf

**典型场景：**
1. 雪花算法详解（64 位结构、时钟回拨处理）
2. 号段模式（数据库批量取号、双 Buffer 优化）
3. 选型决策（对排序性、性能、依赖的权衡）

**面试常问：** 雪花算法时钟回拨怎么处理、UUID 为什么不适合做主键（B+ 树页分裂）、美团 Leaf 方案

### 9. index.md — 章节总览

**内容：**
- 一段话描述章节定位
- 分类地图表（主题 + 核心知识点 + 面试热度）
- 建议学习顺序

## 执行顺序

1. 删除 `git-workflow.md`
2. 重写 `index.md`
3. 重写 `design-patterns.md`
4. 重写 `docker.md`
5. 新增 `kubernetes.md`
6. 新增 `redis.md`
7. 新增 `message-queue.md`
8. 新增 `microservice-governance.md`
9. 重写 `monitoring-observability.md`（删除旧 `monitoring-logging.md`）
10. 重写 `distributed-id.md`
11. 更新 `config.ts` sidebar
12. 构建验证

## 验证

```bash
npx vitepress build docs
```
确认无断链、无构建错误。
