---
title: 工程实践
---

# 工程实践

本章覆盖生产环境中的核心工程技术，侧重**概念理解**和**面试应对**。每个主题按统一模板编写：核心概念 → 典型场景 → 面试常问 → 常见陷阱。

## 分类地图

| 主题 | 核心知识点 | 面试热度 |
|------|------|------|
| [设计模式](./design-patterns) | SOLID 原则、8 大高频模式、Spring 应用 | 🔥🔥🔥 |
| [Docker 容器化](./docker) | 容器 vs VM、镜像分层、Dockerfile、Compose | 🔥🔥🔥 |
| [Kubernetes](./kubernetes) | Pod/Service/Deployment、弹性伸缩、滚动更新 | 🔥🔥 |
| [Redis 实战](./redis) | 5 种数据结构、缓存策略、分布式锁、穿透/击穿/雪崩 | 🔥🔥🔥 |
| [消息队列](./message-queue) | Kafka/RabbitMQ、可靠投递、幂等消费、顺序保证 | 🔥🔥🔥 |
| [微服务治理](./microservice-governance) | 限流/熔断/降级、服务注册发现、配置中心 | 🔥🔥 |
| [监控与可观测性](./monitoring-observability) | Metrics/Logs/Traces 三大支柱、Prometheus、ELK | 🔥🔥 |
| [分布式 ID 生成](./distributed-id) | 雪花算法、号段模式、UUID 对比 | 🔥🔥 |

## 建议学习顺序

1. 先看 [设计模式](./design-patterns) 和 [Redis 实战](./redis)，面试出现频率最高。
2. 再看 [Docker 容器化](./docker) 和 [消息队列](./message-queue)，中高级岗位必考。
3. 然后看 [Kubernetes](./kubernetes) 和 [微服务治理](./microservice-governance)，后端进阶必备。
4. 最后看 [监控与可观测性](./monitoring-observability) 和 [分布式 ID 生成](./distributed-id)，补全工程素养。
