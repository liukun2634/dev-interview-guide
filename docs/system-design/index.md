---
title: 系统设计
---

# 系统设计

本章面向 5 年以上工程师与架构师岗位的系统设计面试，覆盖分布式系统核心理论、高可用架构设计、常见技术组件，以及综合案例分析。目标是帮助读者建立完整的系统设计知识体系，在面试中能够结构化地分析和设计复杂系统。

## 系统设计知识全景图

| 领域 | 核心概念 |
|------|----------|
| 分布式理论 | CAP/BASE、一致性模型、共识算法（Paxos/Raft/ZAB）、分布式时钟、一致性哈希 |
| 存储与数据 | SQL/NoSQL/NewSQL 选型、分库分表、读写分离、数据一致性、缓存策略 |
| 计算与服务 | 微服务、Service Mesh、Serverless、容器编排（K8s） |
| 通信与协议 | REST/gRPC/GraphQL、消息队列、API 网关、服务发现 |
| 可靠性工程 | 高可用、限流熔断降级、故障转移、灾备、混沌工程 |
| 可观测性 | 分布式追踪、指标监控（Prometheus）、日志聚合（ELK）、告警 |

## 核心概念速查表

| 概念 | 简释 | 详细页面 |
|------|------|----------|
| 一致性哈希 / 虚拟节点 | 将节点和数据映射到同一哈希环，增减节点时仅迁移相邻区间数据 | [分布式理论](./distributed-theory) |
| CAP / BASE | 分布式系统不可能同时满足一致性、可用性、分区容错性；BASE 是 CAP 在实践中的折中 | [分布式理论](./distributed-theory) |
| Paxos / Raft / ZAB | 三种分布式共识算法，用于在节点故障时就某个值达成一致 | [分布式理论](./distributed-theory) |
| 分布式锁 / Redlock | 利用 Redis 或 ZooKeeper 实现跨进程互斥，Redlock 是基于多节点 Redis 的锁方案 | [分布式理论](./distributed-theory) |
| 读写分离 / 主从复制 | 主库处理写请求，从库同步数据后处理读请求，提升读吞吐量 | [存储选型](./database-selection) |
| 分库分表 / ShardingKey | 按业务维度拆分数据库或表以突破单机容量，ShardingKey 决定数据路由规则 | [存储选型](./database-selection) |
| 时序数据库 / 列式存储 | 针对时间序列数据优化的数据库；列式存储适合分析型查询 | [存储选型](./database-selection) |
| Bloom Filter / HyperLogLog | Bloom Filter 用于快速判断元素是否存在；HyperLogLog 用于近似基数统计 | [缓存策略](./caching-strategies) |
| CDN / DNS / 反向代理 | CDN 将静态资源缓存到边缘节点；DNS 负责域名解析；反向代理负责请求分发和 SSL 终止 | [高可用架构](./high-availability) |
| 负载均衡算法 | 轮询、加权轮询、最少连接、一致性哈希等，用于将流量均衡分配到后端节点 | [高可用架构](./high-availability) |
| 蓝绿部署 / 金丝雀发布 | 蓝绿部署通过切换流量实现零停机上线；金丝雀发布先对小比例用户灰度验证 | [高可用架构](./high-availability) |
| 熔断 / 降级 / 限流 | 熔断在下游故障时快速失败；降级返回兜底响应；限流控制请求速率保护系统 | [限流与熔断](./rate-limiting) |
| 消息幂等 / Exactly-Once | 消息幂等保证重复消费不产生副作用；Exactly-Once 语义确保消息恰好被处理一次 | [消息队列](./message-queue) |
| 服务发现 / 注册中心 | 服务启动时向注册中心注册地址，调用方动态查询实例列表，支持弹性伸缩 | [微服务架构](./microservices) |
| CQRS / Event Sourcing | CQRS 将读写模型分离；Event Sourcing 以事件日志为系统状态的唯一来源 | [微服务架构](./microservices) |
| 分布式 ID（Snowflake） | 全局唯一 ID 生成方案，由时间戳、机器 ID 和序列号组成，保证趋势递增 | [系统设计方法论](./system-design-methodology) |
| 倒排索引 / 分词 | 倒排索引将词映射到文档列表，是全文搜索的核心数据结构；分词是构建索引的前提 | [搜索与推荐](./search-and-recommendation) |
| OAuth2 / JWT / SSO | OAuth2 是授权框架；JWT 是无状态令牌格式；SSO 实现跨系统单点登录 | [API 设计](./api-design) |

## 面试考察维度

高级工程师和架构师岗位的系统设计面试，通常从以下五个维度综合评估：

1. **需求分析能力**：能否主动澄清需求、区分功能性与非功能性需求、识别系统核心矛盾和瓶颈
2. **架构抽象能力**：能否将复杂系统分解为职责清晰的组件，并画出合理的数据流和交互图
3. **技术深度**：对核心技术（缓存、消息队列、数据库、分布式协议）的掌握程度，能否说清楚内部原理
4. **权衡取舍**：能否清晰说明为什么选 A 而不选 B，包括一致性与可用性、性能与成本之间的取舍
5. **沟通表达**：能否结构化地阐述设计思路，主动引导讨论，对追问做出准确回应

## 分类地图

| 主题 | 概念 | 核心知识点 |
|------|------|------|
| [系统设计方法论](./system-design-methodology) | 系统设计面试的标准步骤与思维框架 | 需求澄清→容量估算→高层设计→详细设计→扩展优化，附短链接系统案例 |
| [分布式理论](./distributed-theory) | 分布式系统的理论基石 | CAP/BASE、一致性模型、Paxos/Raft/ZAB、一致性哈希、分布式时钟 |
| [分布式事务](./distributed-transaction) | 跨服务数据一致性方案 | 2PC/3PC、TCC、Saga、本地消息表、事务消息 |
| [高可用架构](./high-availability) | 保障系统持续可用的设计原则 | SLA、冗余设计、故障转移、限流熔断降级、负载均衡、蓝绿部署 |
| [缓存策略](./caching-strategies) | 缓存的使用模式与一致性 | 读写策略、缓存更新、一致性方案、Bloom Filter、HyperLogLog |
| [限流与熔断](./rate-limiting) | 流量控制与故障隔离 | 令牌桶/漏桶、熔断状态机、降级策略、Sentinel/Hystrix |
| [消息队列](./message-queue) | 异步解耦与削峰填谷 | Kafka/RocketMQ/RabbitMQ、消息可靠性、顺序消息、幂等消费 |
| [微服务架构](./microservices) | 服务拆分与治理 | 服务注册发现、API 网关、服务通信、CQRS、Event Sourcing |
| [存储选型](./database-selection) | 数据库技术选型与数据架构 | SQL/NoSQL/NewSQL、分库分表、读写分离、时序数据库、列式存储 |
| [API 设计](./api-design) | 接口设计规范与安全 | REST/gRPC/GraphQL、版本管理、OAuth2/JWT/SSO、API 网关 |
| [搜索与推荐](./search-and-recommendation) | 搜索引擎与推荐系统架构 | 倒排索引、分词、召回与排序、协同过滤、向量检索 |
| [综合案例](./real-world-cases) | 高频系统设计题端到端解析 | 短链接、Feed 流、抢红包、秒杀、分布式文件存储等经典案例 |
| [大厂实战面试题](./interview-cases/) | 腾讯/阿里/美团/字节真实面试题解析 | 微信消息、双十一洪峰、外卖调度、抖音推荐等 14 道工程实战题 |

## 建议顺序

按以下四个层次推进，可以有效建立知识体系：

1. **方法论**：先看 [系统设计方法论](./system-design-methodology)，掌握面试答题框架，避免在没有结构的情况下陷入细节
2. **理论基础**：阅读 [分布式理论](./distributed-theory) 和 [分布式事务](./distributed-transaction)，建立 CAP/BASE/一致性的认知底座
3. **技术组件**：依次学习 [高可用架构](./high-availability)、[缓存策略](./caching-strategies)、[限流与熔断](./rate-limiting)、[消息队列](./message-queue)、[存储选型](./database-selection)、[API 设计](./api-design)
4. **综合应用**：结合 [微服务架构](./microservices)、[搜索与推荐](./search-and-recommendation) 和 [综合案例](./real-world-cases)，做到融会贯通
