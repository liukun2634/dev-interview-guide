# 系统设计章节整理与丰富 — 设计文档

**日期**: 2026-04-20
**目标读者**: 5年+ 高级架构面试
**范围**: 后端分布式 + 数据密集型 + 热门面试案例

---

## 1. 结构方针

保持一级扁平目录不变（`/docs/system-design/`），在现有 8 个页面基础上新增 4 页，共 12 页。案例题和面试题嵌入各技术专题页面，不建子目录。

## 2. 总章 index.md 改造

当前 index.md 仅有简单表格和学习顺序。改造后包含：

1. **系统设计知识全景图** — 分类展示所有核心概念及其关系（分布式理论、存储、计算、网络、可靠性、可观测性）
2. **核心概念速查表** — 20-30 个高频概念（一致性哈希、读写分离、分库分表、CDN、DNS、反向代理、服务发现、熔断降级、消息幂等等），每个一句话定义 + 链接到对应页面
3. **面试考察维度** — 高级面试官关注的 5 个维度（需求分析能力、架构抽象能力、技术深度、权衡取舍、沟通表达）
4. **学习路径** — 按层次给出推荐阅读顺序（理论→组件→架构→案例）

## 3. 页面清单

| # | 文件名 | 状态 | 核心内容 |
|---|--------|------|----------|
| 1 | `index.md` | 丰富 | 全景图、概念速查、面试维度、学习路径 |
| 2 | `system-design-methodology.md` | 保留微调 | 六步框架（已完整），短链案例保留 |
| 3 | `distributed-theory.md` | 丰富 | CAP/BASE、一致性模型、Paxos/Raft、一致性哈希，加入 ZooKeeper/etcd 实战选型 |
| 4 | `distributed-transaction.md` | 丰富 | 2PC/3PC/TCC/Saga，加入 Seata 框架对比和电商下单案例 |
| 5 | `high-availability.md` | 丰富 | SLA、冗余设计、故障转移，加入故障演练和容灾案例 |
| 6 | `caching-strategies.md` | 丰富 | 读写策略、一致性方案，加入 Redis 集群架构、缓存穿透/击穿/雪崩完整解法 |
| 7 | `rate-limiting.md` | 丰富 | 限流/熔断/降级，加入分布式限流（Redis + Lua）和 Sentinel/Hystrix/Resilience4j 对比 |
| 8 | `message-queue.md` | 丰富 | Kafka/RocketMQ/RabbitMQ，加入消息顺序性、幂等消费、死信队列、事务消息 |
| 9 | `microservices.md` | 丰富 | 微服务治理，加入 Service Mesh、可观测性（Tracing/Metrics/Logging）、容器编排 |
| 10 | `database-selection.md` | **新增** | 存储选型：关系型/NoSQL/NewSQL/时序数据库，分库分表策略，读写分离，数据迁移 |
| 11 | `api-design.md` | **新增** | API 设计：RESTful/gRPC/GraphQL 对比，API 网关，版本管理，鉴权方案 |
| 12 | `search-and-recommendation.md` | **新增** | 搜索引擎（ES 架构、倒排索引）、推荐系统架构（召回→粗排→精排→重排） |
| 13 | `real-world-cases.md` | **新增** | 综合案例集：秒杀系统、即时通讯、Feed 流、短视频推荐 |

## 4. 每页内容结构

沿用项目 framework-first 风格，每个技术专题页面包含：

1. **概念** — 是什么、为什么重要
2. **核心原理** — 关键理论和机制（深度讲解，含架构图）
3. **技术选型与对比** — 主流方案横向对比表
4. **架构图与数据流** — ASCII 架构图展示典型部署
5. **实战案例** — 嵌入 1-2 个面试常见场景
6. **面试常问 & 怎么答** — 高频面试题 + 参考回答
7. **看到什么就先想到这类** — 触发词速查表

## 5. Sidebar 配置

```typescript
'/system-design/': [
  {
    text: '系统设计',
    collapsed: false,
    items: [
      { text: '章节概览', link: '/system-design/' },
      { text: '系统设计方法论', link: '/system-design/system-design-methodology' },
      { text: '分布式理论', link: '/system-design/distributed-theory' },
      { text: '分布式事务', link: '/system-design/distributed-transaction' },
      { text: '高可用架构', link: '/system-design/high-availability' },
      { text: '缓存策略', link: '/system-design/caching-strategies' },
      { text: '限流与熔断', link: '/system-design/rate-limiting' },
      { text: '消息队列', link: '/system-design/message-queue' },
      { text: '微服务架构', link: '/system-design/microservices' },
      { text: '存储选型', link: '/system-design/database-selection' },
      { text: 'API 设计', link: '/system-design/api-design' },
      { text: '搜索与推荐', link: '/system-design/search-and-recommendation' },
      { text: '综合案例', link: '/system-design/real-world-cases' },
    ],
  },
],
```

## 6. 各页面详细内容规划

### 6.1 index.md — 总章

**知识全景图分类：**

| 领域 | 核心概念 |
|------|----------|
| 分布式理论 | CAP/BASE、一致性模型、共识算法、分布式时钟 |
| 存储与数据 | SQL/NoSQL 选型、分库分表、读写分离、数据一致性、缓存 |
| 计算与服务 | 微服务、Service Mesh、Serverless、容器编排 |
| 通信与协议 | RPC/REST/gRPC、消息队列、API 网关、服务发现 |
| 可靠性工程 | 高可用、限流熔断降级、故障转移、灾备 |
| 可观测性 | 分布式追踪、指标监控、日志聚合、告警 |

**核心概念速查（20-30 个）：**
- 一致性哈希、虚拟节点
- 读写分离、主从复制
- 分库分表、ShardingKey 选择
- CDN、DNS、反向代理
- 服务发现、注册中心
- 熔断、降级、限流
- 消息幂等、Exactly-Once
- CAP 三选二、BASE
- Paxos、Raft、ZAB
- 分布式锁、Redlock
- 分布式 ID（Snowflake）
- 负载均衡（轮询/加权/一致性哈希）
- 蓝绿部署、金丝雀发布
- CQRS、Event Sourcing
- Bloom Filter、HyperLogLog
- 时序数据库、列式存储
- 倒排索引、分词
- OAuth2、JWT、SSO

### 6.2 distributed-theory.md — 丰富方向

现有内容：CAP/BASE、一致性模型、Paxos/Raft/ZAB、一致性哈希（已较完整）

补充：
- **分布式时钟**：Lamport Clock、Vector Clock、HLC，解决事件排序问题
- **FLP 不可能定理**：一句话理解 + 工程意义
- **ZooKeeper vs etcd 选型对比**：架构差异、CP 模型、Watch 机制、适用场景
- **实战案例**：用 ZooKeeper 实现分布式锁和配置中心
- **面试题**：CAP 能否同时满足三个？Raft 的 Leader 选举过程？一致性哈希为什么需要虚拟节点？

### 6.3 distributed-transaction.md — 丰富方向

现有内容：2PC/3PC/TCC/Saga/本地消息表/事务消息

补充：
- **Seata 框架**：AT/TCC/Saga/XA 四种模式对比、适用场景
- **电商下单案例**：订单→库存→支付的跨服务事务，分别用 TCC 和 Saga 实现
- **最终一致性实战**：本地消息表 + 定时补偿的完整流程图
- **面试题**：TCC 和 Saga 的核心区别？如何处理 TCC 的悬挂问题？

### 6.4 high-availability.md — 丰富方向

现有内容：SLA、冗余设计、故障转移、限流熔断降级、负载均衡

补充：
- **故障演练**：Chaos Engineering 理念、Netflix Chaos Monkey
- **容灾架构**：同城双活、异地多活（两地三中心）、数据同步方案
- **优雅降级策略**：功能降级 vs 数据降级 vs 体验降级，附决策树
- **实战案例**：某支付系统的异地多活方案
- **面试题**：如何设计一个 99.99% 可用的系统？异地多活最大的挑战是什么？

### 6.5 caching-strategies.md — 丰富方向

现有内容：读写策略、缓存更新、一致性方案

补充：
- **Redis 集群架构**：单机→主从→Sentinel→Cluster 演进路线
- **缓存三大问题完整解法**：穿透（布隆过滤器+空值缓存）、击穿（互斥锁+逻辑过期）、雪崩（错开 TTL+多级缓存）
- **多级缓存架构**：本地缓存（Caffeine）→ 分布式缓存（Redis）→ DB
- **缓存与数据库一致性**：延迟双删、Canal 监听 binlog 方案
- **实战案例**：电商商品详情页的多级缓存方案
- **面试题**：如何保证缓存和数据库的最终一致性？Redis Cluster 的 Hash Slot 机制？

### 6.6 rate-limiting.md — 丰富方向

现有内容：令牌桶/漏桶、熔断状态机、降级策略

补充：
- **分布式限流**：Redis + Lua 脚本实现滑动窗口，附代码
- **框架对比**：Sentinel vs Hystrix vs Resilience4j，功能/性能/社区
- **自适应限流**：根据系统负载（CPU/线程池）动态调整阈值
- **实战案例**：API 网关层的多维限流（用户级、IP 级、接口级）
- **面试题**：令牌桶和漏桶的区别？如何实现分布式环境下的精确限流？

### 6.7 message-queue.md — 丰富方向

现有内容：Kafka/RocketMQ/RabbitMQ、消息可靠性、顺序消息

补充：
- **消息顺序性深入**：全局有序 vs 分区有序、RocketMQ 的 MessageQueueSelector
- **幂等消费**：消息去重表、业务幂等键设计、Redis 去重方案
- **死信队列与重试**：重试策略（指数退避）、死信处理流程
- **事务消息**：RocketMQ 半消息机制完整流程图
- **Kafka 深入**：ISR 机制、acks 配置、Consumer Rebalance
- **实战案例**：订单超时取消的延迟消息方案
- **面试题**：如何保证消息不丢失？Kafka 为什么吞吐量高？

### 6.8 microservices.md — 丰富方向

现有内容：服务注册发现、API 网关、服务通信、数据一致性

补充：
- **Service Mesh**：Istio 架构、Sidecar 模式、流量管理
- **可观测性三大支柱**：Distributed Tracing（Jaeger/Zipkin）、Metrics（Prometheus）、Logging（ELK）
- **容器与编排**：Docker 网络、K8s Service 与 Ingress、Pod 生命周期
- **服务拆分原则**：DDD 限界上下文、数据库拆分时机
- **实战案例**：单体到微服务的渐进式拆分路径
- **面试题**：微服务的优缺点？服务之间如何做数据一致性？

### 6.9 database-selection.md — 新增

- **关系型数据库**：MySQL InnoDB 架构、索引原理（B+ 树）、事务隔离级别、MVCC
- **NoSQL**：Redis（数据结构选型）、MongoDB（文档模型）、HBase（列式存储、适用场景）
- **NewSQL**：TiDB/CockroachDB 架构、分布式事务实现
- **时序数据库**：InfluxDB/TimescaleDB，监控和 IoT 场景
- **分库分表**：ShardingSphere、垂直拆分 vs 水平拆分、分片键选择、扩容方案
- **读写分离**：主从复制延迟、路由策略、数据一致性保障
- **数据迁移**：双写方案、影子表方案、不停机迁移流程
- **选型决策树**：根据数据模型、访问模式、一致性要求、规模选型
- **面试题**：MySQL 和 MongoDB 什么时候该用哪个？分库分表后如何做跨分片查询？

### 6.10 api-design.md — 新增

- **RESTful 设计**：资源建模、HTTP 方法语义、状态码、HATEOAS
- **gRPC**：Protobuf 定义、流式传输、与 REST 的适用场景对比
- **GraphQL**：Schema 设计、N+1 问题、适用场景（BFF 层）
- **API 网关**：Kong/Spring Cloud Gateway/Envoy 对比、核心功能（路由/限流/鉴权/日志）
- **版本管理**：URI 版本 vs Header 版本 vs 查询参数，向后兼容策略
- **鉴权方案**：OAuth2 四种模式、JWT 结构与刷新机制、SSO 方案
- **API 幂等性**：幂等键设计、Token 防重复提交
- **面试题**：REST vs gRPC 怎么选？如何设计一个对外开放的 API 平台？

### 6.11 search-and-recommendation.md — 新增

- **搜索引擎架构**：Elasticsearch 集群架构、倒排索引原理、分词器选择
- **搜索优化**：相关性打分（TF-IDF/BM25）、多字段权重、高亮、自动补全
- **搜索基础设施**：索引设计、分片策略、冷热数据分离、近实时索引
- **推荐系统架构**：召回→粗排→精排→重排 四阶段 Pipeline
- **召回策略**：协同过滤（UserCF/ItemCF）、基于内容、热门/新品兜底
- **特征工程**：用户画像、物品特征、上下文特征、实时特征
- **实战案例**：电商商品搜索系统、短视频推荐 Feed 流
- **面试题**：ES 和 MySQL 全文索引的区别？推荐系统如何解决冷启动问题？

### 6.12 real-world-cases.md — 新增

每个案例用方法论页的六步框架展开（需求→估算→高层→详细→扩展→权衡）：

1. **秒杀系统** — 高并发写、库存扣减、防超卖、流量削峰、CDN 静态化
2. **即时通讯系统** — WebSocket 长连接、消息存储、已读未读、群聊扩散、离线推送
3. **Feed 流/时间线** — Push vs Pull vs 混合模型、FanOut 策略、Redis Timeline
4. **短视频推荐系统** — 推荐 Pipeline、ABTest、实时特征、内容审核

## 7. 不在范围内

- 不创建子目录
- 不涉及前端/移动端系统设计
- 不改动其他章节
- 不改变现有页面的 framework-first 写作风格
