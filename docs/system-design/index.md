---
title: 系统设计
---

# 系统设计

本章覆盖分布式系统核心理论与系统设计面试方法论，从分布式理论基础到高可用架构，从具体技术方案到面试实战。

## 怎么使用这一章

1. 先看系统设计方法论，掌握面试答题框架。
2. 再看分布式理论，建立 CAP/BASE/一致性的认知底座。
3. 然后看分布式事务和高可用架构，这是中高级面试重点。
4. 最后结合缓存、限流、消息队列、微服务等具体方案，做到融会贯通。

## 分类地图

| 主题 | 概念 | 核心知识点 |
|------|------|------|
| [系统设计方法论](./system-design-methodology) | 系统设计面试的标准步骤与思维框架 | 需求澄清→容量估算→高层设计→详细设计→扩展优化，附短链接系统案例 |
| [分布式理论](./distributed-theory) | 分布式系统的理论基石 | CAP/BASE、一致性模型、Paxos/Raft/ZAB、一致性哈希 |
| [分布式事务](./distributed-transaction) | 跨服务数据一致性方案 | 2PC/3PC、TCC、Saga、本地消息表、事务消息 |
| [高可用架构](./high-availability) | 保障系统持续可用的设计原则 | SLA、冗余设计、故障转移、限流熔断降级、负载均衡 |
| [缓存策略](./caching-strategies) | 缓存的使用模式与一致性 | 读写策略、缓存更新、一致性方案 |
| [限流与熔断](./rate-limiting) | 流量控制与故障隔离 | 令牌桶/漏桶、熔断状态机、降级策略 |
| [消息队列](./message-queue) | 异步解耦与削峰填谷 | Kafka/RocketMQ/RabbitMQ、消息可靠性、顺序消息 |
| [微服务架构](./microservices) | 服务拆分与治理 | 服务注册发现、API 网关、服务通信、数据一致性 |

## 建议顺序

1. 先看 [系统设计方法论](./system-design-methodology)，掌握面试框架。
2. 再看 [分布式理论](./distributed-theory)，打牢理论基础。
3. 然后看 [分布式事务](./distributed-transaction) 和 [高可用架构](./high-availability)。
4. 最后看 [缓存策略](./caching-strategies)、[限流与熔断](./rate-limiting)、[消息队列](./message-queue)、[微服务架构](./microservices)。
