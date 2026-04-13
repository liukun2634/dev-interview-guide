---
title: 消息队列
---

# 消息队列 Message Queue

<span class="dig-tag dig-tag--category">系统设计与工程实践</span>
<span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span>
<span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
消息队列（Message Queue）是分布式系统中实现服务解耦、异步处理和削峰填谷的核心中间件。掌握消息队列的核心概念（Producer、Consumer、Broker、Topic、Partition）、两种消息模型（点对点 vs 发布订阅）、三种投递语义（At-most-once / At-least-once / Exactly-once）以及 Kafka 的架构原理，是系统设计面试的高频考点。
:::

## 为什么需要消息队列？

在分布式系统中，服务之间的直接调用会导致强耦合、性能瓶颈和可用性问题。消息队列通过引入中间层来解决这些问题。

### 1. 服务解耦 (Decoupling)

没有消息队列时，上游服务需要知道所有下游服务的接口并逐一调用：

```
订单服务 ──► 库存服务
   │
   ├──► 积分服务
   │
   ├──► 通知服务
   │
   └──► 物流服务     ← 新增一个下游就要修改订单服务代码
```

引入消息队列后，上游只需发送一条消息，下游按需订阅：

```
订单服务 ──► MQ ──► 库存服务
              ├──► 积分服务
              ├──► 通知服务
              └──► 物流服务     ← 新增下游无需修改订单服务
```

### 2. 异步处理 (Async Processing)

同步调用：用户下单 → 扣库存（50ms）→ 发积分（50ms）→ 发短信（100ms） = **200ms**

异步消息：用户下单 → 扣库存（50ms）→ 发消息到 MQ（5ms） = **55ms**
积分、短信等由消费者异步处理，用户无需等待。

### 3. 削峰填谷 (Peak Shaving)

```
请求量
  ▲
  │    ┌──────┐
  │    │ 峰值  │
  │    │10000 │        消息队列作为缓冲
  │    │ QPS  │        ┌─────────────────────
  │    │      │        │ 消费者以固定速率处理
  │────┘      └────────│ 如 2000 QPS
  │                    └─────────────────────
  └───────────────────────────────────────► 时间
```

秒杀场景下，瞬时请求写入 MQ，消费者以稳定速率处理，避免数据库被瞬时流量压垮。

## 核心概念

| 概念 | 说明 |
|------|------|
| **Producer（生产者）** | 消息的发送方，负责将消息发送到 Broker |
| **Consumer（消费者）** | 消息的接收方，负责从 Broker 拉取或接收消息并处理 |
| **Broker（代理/服务端）** | 消息队列服务器，负责存储和转发消息 |
| **Topic（主题）** | 消息的逻辑分类，Producer 将消息发送到指定 Topic |
| **Partition（分区）** | Topic 的物理分片，用于并行处理和水平扩展 |
| **Consumer Group（消费者组）** | 一组消费者共同消费一个 Topic，每条消息只被组内一个消费者处理 |
| **Offset（偏移量）** | 消息在分区中的位置标识，消费者通过 Offset 追踪消费进度 |

## 消息模型

### 点对点模型 (Point-to-Point)

每条消息只能被**一个消费者**消费，消费后即从队列中移除。

```
Producer ──► Queue ──► Consumer A（消费消息 1）
                  ──► Consumer B（消费消息 2）
                  ──► Consumer A（消费消息 3）
```

适用场景：任务分发、工单处理（每个任务只需处理一次）。

### 发布/订阅模型 (Pub/Sub)

每条消息可以被**多个订阅者**消费，每个订阅者独立接收完整的消息副本。

```
Producer ──► Topic ──► Consumer Group A（订单处理）
                  ├──► Consumer Group B（日志记录）
                  └──► Consumer Group C（数据分析）
```

Kafka 采用的就是 Pub/Sub 模型，通过 Consumer Group 实现灵活的消费模式：
- **不同 Group** 订阅同一 Topic → 每个 Group 都能收到全量消息（广播）
- **同一 Group** 内的多个 Consumer → 分担消费（负载均衡）

## 消息投递语义

| 语义 | 说明 | 可能的问题 | 实现难度 |
|------|------|-----------|---------|
| **At-most-once** | 消息最多投递一次，可能丢失 | 消息丢失 | 低 |
| **At-least-once** | 消息至少投递一次，不会丢失但可能重复 | 消息重复 | 中 |
| **Exactly-once** | 消息恰好投递一次，不丢不重 | 无 | 高 |

### At-most-once（最多一次）

Producer 发送消息后不等待确认，Consumer 收到消息后先提交 Offset 再处理。如果处理失败，消息不会重新投递。

```
Producer ──发送──► Broker（不等 ACK）
Consumer ──► 提交 Offset ──► 处理消息（失败则消息丢失）
```

适用场景：日志采集、监控指标上报（允许少量数据丢失）。

### At-least-once（至少一次）

Producer 发送消息后等待 Broker 的 ACK 确认，失败则重试。Consumer 先处理消息再提交 Offset，如果提交 Offset 前崩溃，重启后会重新消费。

```
Producer ──发送──► Broker ──ACK──► Producer（确认收到）
Consumer ──► 处理消息 ──► 提交 Offset（处理完才提交）
```

适用场景：大多数业务场景（订单、支付），配合幂等性保证不重复处理。

### Exactly-once（恰好一次）

最难实现的语义，通常通过幂等 Producer + 事务性消费来实现。Kafka 0.11+ 支持幂等 Producer 和事务（Transactional API），但有性能开销。

> 实际工程中，大多数系统采用 **At-least-once + 业务幂等** 的方案，兼顾可靠性和性能。

## Kafka 架构详解

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     Kafka Cluster                        │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│  │ Broker 0  │   │ Broker 1  │   │ Broker 2  │             │
│  │           │   │           │   │           │             │
│  │ Topic-A   │   │ Topic-A   │   │ Topic-A   │             │
│  │ P0(Leader)│   │ P1(Leader)│   │ P2(Leader)│             │
│  │ P1(Replica│   │ P2(Replica│   │ P0(Replica│             │
│  └──────────┘   └──────────┘   └──────────┘             │
│                                                          │
│  ┌─────────────────────────────────────────┐             │
│  │             ZooKeeper / KRaft            │             │
│  │   （集群元数据管理、Leader 选举）           │             │
│  └─────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘

Producer ──►  Broker（根据 Partition 策略路由）

Consumer Group A:
  Consumer 1 ← P0
  Consumer 2 ← P1
  Consumer 3 ← P2
```

### Partition 与 Offset

每个 Partition 是一个有序的、不可变的消息序列，新消息追加到末尾。Offset 是消息在 Partition 中的唯一编号。

```
Partition 0:
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │  ← Offset
└───┴───┴───┴───┴───┴───┴───┴───┘
                          ▲
                     Consumer 当前消费位置

Partition 1:
┌───┬───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 3 │ 4 │  ← Offset
└───┴───┴───┴───┴───┘
              ▲
         Consumer 当前消费位置
```

### Consumer Group Rebalance

当 Consumer Group 中的成员数量发生变化时（消费者加入或离开），Kafka 会触发 **Rebalance（重平衡）**，重新分配 Partition 与 Consumer 的绑定关系。

```
Rebalance 前：                    Rebalance 后（Consumer 3 离开）：
┌──────────┐                     ┌──────────┐
│Consumer 1│← P0                 │Consumer 1│← P0, P2
│Consumer 2│← P1                 │Consumer 2│← P1
│Consumer 3│← P2  (下线)         └──────────┘
└──────────┘
```

**Rebalance 的缺点：**
- 重平衡期间整个 Consumer Group 暂停消费（Stop The World）
- 频繁 Rebalance 会影响吞吐量
- 可能导致消息重复消费（Offset 还未提交就发生了 Rebalance）

**优化方案：**
- 增大 `session.timeout.ms` 和 `heartbeat.interval.ms`，减少误判消费者离线
- 使用 Kafka 2.3+ 的 **Cooperative Sticky Assignor**，支持增量 Rebalance，减少影响范围

## 消息顺序性

### 分区级别有序

Kafka 保证**同一 Partition 内的消息是有序的**。要保证某类消息的顺序，需要将它们路由到同一个 Partition。

```java
// 通过指定 key 保证同一订单的消息进入同一 Partition
producer.send(new ProducerRecord<>("order-topic", orderId, message));
// Kafka 默认按 key 的 hash 值 % partition 数来选择分区
```

### 全局有序的挑战

全局有序要求 Topic 只设 1 个 Partition，但这意味着只能有 1 个 Consumer，完全丧失了并行消费的能力，**吞吐量极低**。

> 实际工程中，大多数场景只需要**业务维度的有序**（如同一用户的操作有序），通过 Partition Key 即可实现，不需要全局有序。

## 死信队列与重试机制

### 死信队列 (Dead Letter Queue, DLQ)

当消息消费失败且达到最大重试次数后，将消息转移到**死信队列**，避免阻塞正常消息的消费。

```
正常 Topic ──► Consumer ──处理失败──► 重试队列（最多 3 次）
                                         │
                                    重试仍失败
                                         ▼
                                    死信队列 (DLQ)
                                         │
                                    人工排查 / 告警
```

### 重试机制设计

```java
@KafkaListener(topics = "order-topic")
public void consume(ConsumerRecord<String, String> record) {
    int maxRetries = 3;
    int retryCount = getRetryCount(record); // 从 Header 获取重试次数

    try {
        processOrder(record.value());
    } catch (Exception e) {
        if (retryCount < maxRetries) {
            // 发送到重试 Topic，携带重试次数
            sendToRetryTopic(record, retryCount + 1);
        } else {
            // 超过最大重试次数，发送到死信队列
            sendToDeadLetterQueue(record);
            log.error("消息处理失败，已发送至 DLQ: {}", record.value());
        }
    }
}
```

**重试策略建议：**
- 使用**指数退避**（Exponential Backoff）：第 1 次重试等 1s，第 2 次等 4s，第 3 次等 16s
- 设置合理的最大重试次数（通常 3~5 次）
- 死信队列需要配套监控告警和人工处理机制

## 消息幂等性

由于 At-least-once 语义下消息可能重复投递，消费者必须保证**幂等处理**（处理多次和处理一次的结果相同）。

### 方案一：数据库唯一约束

```java
// 利用数据库唯一索引防止重复插入
try {
    orderMapper.insert(order); // orderId 设置唯一索引
} catch (DuplicateKeyException e) {
    log.info("订单已存在，忽略重复消息: {}", order.getOrderId());
}
```

### 方案二：Redis 去重

```java
public boolean processMessage(String messageId, String payload) {
    // SETNX: 如果 key 不存在则设置，返回 true；已存在则返回 false
    Boolean isNew = redis.opsForValue()
        .setIfAbsent("msg:dedup:" + messageId, "1", 24, TimeUnit.HOURS);

    if (Boolean.FALSE.equals(isNew)) {
        log.info("重复消息，跳过处理: {}", messageId);
        return false;
    }

    // 首次处理
    doProcess(payload);
    return true;
}
```

### 方案三：幂等性 Key（Idempotency Key）

Producer 为每条消息生成全局唯一的幂等 Key，Consumer 处理前检查是否已处理过。

```java
// Producer 端
String idempotencyKey = UUID.randomUUID().toString();
ProducerRecord<String, String> record = new ProducerRecord<>("topic", key, value);
record.headers().add("idempotency-key", idempotencyKey.getBytes());

// Consumer 端
String idempotencyKey = new String(record.headers().lastHeader("idempotency-key").value());
if (idempotencyStore.exists(idempotencyKey)) {
    return; // 已处理，跳过
}
idempotencyStore.save(idempotencyKey);
processMessage(record.value());
```

## 主流消息队列对比

| 特性 | Kafka | RabbitMQ | RocketMQ |
|------|-------|----------|----------|
| **开发语言** | Scala/Java | Erlang | Java |
| **单机吞吐量** | 百万级 TPS | 万级 TPS | 十万级 TPS |
| **消息延迟** | ms 级 | us 级（微秒） | ms 级 |
| **消息可靠性** | 高（副本机制） | 高（镜像队列） | 高（同步刷盘） |
| **消息顺序** | Partition 级别有序 | 不保证 | Queue 级别有序 |
| **事务消息** | 支持（Kafka Transactions） | 不支持原生事务 | 支持（半消息机制） |
| **延迟消息** | 不原生支持 | 支持（TTL + DLX） | 原生支持 |
| **消息回溯** | 支持（按 Offset 回溯） | 不支持 | 支持（按时间回溯） |
| **社区生态** | 大数据生态丰富 | 插件丰富 | 阿里巴巴开源 |
| **典型场景** | 日志、大数据流处理、事件溯源 | 企业级消息集成、复杂路由 | 电商、金融交易 |

**选型建议：**
- **大数据/日志流处理** → Kafka（高吞吐、持久化、与 Flink/Spark 生态集成好）
- **企业应用/复杂路由** → RabbitMQ（灵活的路由机制、低延迟、协议标准化）
- **电商/金融** → RocketMQ（事务消息、延迟消息、阿里巴巴大规模验证）

## 常见误区

::: warning 易错点
1. **消息丢失的三个环节：** Producer 到 Broker（网络丢包）、Broker 存储（宕机未刷盘）、Consumer 消费（提交 Offset 后处理失败）。每个环节都需要针对性方案
2. **Exactly-once 不等于端到端恰好一次：** Kafka 的 Exactly-once 仅限于 Kafka 内部（Producer → Broker → Consumer），涉及外部系统（如数据库）时，仍需业务幂等保证
3. **Partition 数量不是越多越好：** 过多的 Partition 会增加 Broker 端文件句柄数、延长 Rebalance 时间、增加端到端延迟
4. **Consumer Lag 积压需要关注：** 消费者处理速度跟不上生产速度时，消息会积压。需要监控 Consumer Lag，及时扩容消费者或优化处理逻辑
5. **重试队列要设置上限：** 无限重试会导致消息堆积和资源浪费，超过最大重试次数必须进入死信队列
:::

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 如何保证消息不丢失？从 Producer、Broker、Consumer 三个环节分析</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>2. Kafka 如何保证消息的顺序性？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 消费者收到重复消息怎么办？如何实现幂等消费？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### Q1: 如何保证消息不丢失

从三个环节分别保障：

**Producer 端：**
- 使用同步发送（`producer.send().get()`）或带回调的异步发送
- 设置 `acks=all`（等待所有 ISR 副本确认），确保消息写入多个副本
- 配置合理的重试次数（`retries`）和重试间隔

**Broker 端：**
- 设置 `replication.factor >= 3`（至少 3 个副本）
- 设置 `min.insync.replicas >= 2`（至少 2 个副本确认写入）
- 配合 `acks=all`，确保 ISR 中有足够副本同步后才返回成功
- `unclean.leader.election.enable=false`，防止落后的副本成为 Leader 导致数据丢失

**Consumer 端：**
- 关闭自动提交 Offset（`enable.auto.commit=false`）
- 消息处理成功后再手动提交 Offset
- 配合幂等消费，防止重复处理

### Q2: Kafka 如何保证消息顺序性

Kafka 保证的是 **Partition 级别的有序性**，而非全局有序。

**实现方式：** 将需要保序的消息发送到同一 Partition，通过指定同一个 key（如 orderId、userId）：

```java
producer.send(new ProducerRecord<>("topic", orderId, message));
```

Kafka 默认使用 key 的 hash 值对 Partition 数取模来选择分区，同一 key 的消息一定进入同一 Partition。

**注意事项：**
- 如果 Partition 数量发生变化（扩容），hash 映射会改变，历史消息的顺序关系可能被打破
- 同一 Partition 只能被同一 Consumer Group 中的一个 Consumer 消费，天然保证顺序
- 如果需要全局有序，只能设置 1 个 Partition，但吞吐量会大幅下降

### Q3: 如何实现幂等消费

由于网络抖动、Consumer Rebalance 等原因，消息可能被重复投递。消费者需要保证**幂等性** —— 处理多次和处理一次的结果相同。

**常用方案：**

| 方案 | 原理 | 适用场景 |
|------|------|---------|
| 数据库唯一约束 | 利用唯一索引防止重复插入 | 订单创建、用户注册 |
| Redis 去重 | SETNX 记录已处理的 messageId | 通用场景，高性能 |
| 幂等 Key | Producer 生成唯一 Key，Consumer 处理前检查 | 跨系统消息去重 |
| 状态机 | 业务状态只能单向流转（如待支付→已支付），重复消费不影响 | 订单状态变更 |

**最佳实践：** 采用 At-least-once 投递语义 + 业务侧幂等处理，是兼顾可靠性和性能的主流方案。

## 延伸阅读

- [Kafka 官方文档 - Design](https://kafka.apache.org/documentation/#design)
- [RabbitMQ 官方教程](https://www.rabbitmq.com/tutorials)
- [RocketMQ 设计理念](https://rocketmq.apache.org/docs/)
- 《Kafka 权威指南》第 4 章：Kafka 消费者
- 《企业集成模式》（Enterprise Integration Patterns）
