---
title: 工程实践
---

# 工程实践

本章覆盖生产环境中的核心工程能力，包括设计模式、版本控制、监控与日志、容器化和分布式 ID 等实战技能。

## 怎么使用这一章

1. 先看设计模式，掌握面试最常考的 8 个模式及其在 Spring 中的应用。
2. 再看 Git 工作流，理解团队协作的分支策略和合并方式。
3. 然后看监控与日志，了解可观测性体系的搭建。
4. 最后看 Docker 和分布式 ID，补全基础设施知识。

## 分类地图

| 主题 | 概念 | 核心知识点 |
|------|------|------|
| [设计模式](./design-patterns) | 面试高频设计模式与 SOLID 原则 | 单例/工厂/策略/观察者/代理/模板方法/责任链/建造者 |
| [Git 工作流](./git-workflow) | 版本控制与团队协作 | Git Flow/GitHub Flow/Trunk-Based、merge vs rebase、冲突解决 |
| [监控与日志](./monitoring-logging) | 可观测性三大支柱 | Prometheus/Grafana、ELK Stack、链路追踪、告警设计 |
| [Docker 容器化](./docker) | 容器化技术与部署 | 镜像/容器/Dockerfile、Docker Compose、容器编排 |
| [分布式 ID 生成](./distributed-id) | 全局唯一 ID 方案 | UUID/雪花算法/号段模式 |

## 建议顺序

1. 先看 [设计模式](./design-patterns)，面试必考。
2. 再看 [Git 工作流](./git-workflow)，日常工作必备。
3. 然后看 [监控与日志](./monitoring-logging)，生产环境核心能力。
4. 最后看 [Docker 容器化](./docker) 和 [分布式 ID 生成](./distributed-id)。
