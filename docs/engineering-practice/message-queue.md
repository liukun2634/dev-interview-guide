---
title: 消息队列
---

# 消息队列

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
消息队列实现异步解耦和削峰填谷。面试重点：消息模型（点对点 vs 发布订阅）、如何保证不丢失、如何保证顺序、如何幂等消费、Kafka 高吞吐原理。
:::

---

## 核心概念

### 消息模型对比

| 模型 | 点对点（P2P） | 发布/订阅（Pub/Sub） |
|------|--------------|---------------------|
| 消费者数量 | 一条消息只被一个消费者消费 | 一条消息被所有订阅者消费 |
| 代表产品 | RabbitMQ（Queue） | Kafka、RocketMQ、RabbitMQ（Exchange/fanout） |
| 适用场景 | 任务分发、负载均衡 | 事件广播、日志收集、多系统通知 |
| 消息持久性 | 消费后即删除 | 消费后可保留（取决于配置） |

---

### 主流消息队列对比

| 特性 | Kafka | RabbitMQ | RocketMQ |
|------|-------|----------|----------|
| 吞吐量 | 极高（百万级 TPS） | 中等（万级 TPS） | 高（十万级 TPS） |
| 端到端延迟 | 毫秒级（批量） | 微秒～毫秒 | 毫秒级 |
| 消息模型 | 发布/订阅 | P2P + Pub/Sub | 发布/订阅 |
| 消息回溯 | 支持（按 Offset 重放） | 不支持 | 支持（按时间/Offset） |
| 实现语言 | Scala/Java | Erlang | Java |
| 适用场景 | 日志、流处理、大数据 | 业务解耦、RPC 异步 | 金融交易、顺序消息 |

---

### Kafka 核心概念

```
Producer → Topic ─┬─ Partition 0 → Consumer Group A (Consumer 1)
                   ├─ Partition 1 → Consumer Group A (Consumer 2)
                   └─ Partition 2 → Consumer Group A (Consumer 3)
                                  → Consumer Group B (Consumer 1)
```

| 概念 | 说明 |
|------|------|
| **Topic** | 消息的逻辑分类，生产者向 Topic 发送消息 |
| **Partition** | Topic 的物理分片，是并行消费的基本单位；同一 Partition 内消息有序 |
| **Consumer Group** | 一组消费者共同消费一个 Topic；同组内每个 Partition 只分配给一个消费者 |
| **Offset** | 消息在 Partition 中的位置序号，消费者通过提交 Offset 记录消费进度 |
| **Broker** | Kafka 服务节点，一个集群由多个 Broker 组成 |
| **ISR（In-Sync Replicas）** | 与 Leader 保持同步的副本集合，用于保证高可用和数据不丢失 |

---

## 典型场景与最佳实践

### 1. 异步解耦

同步调用中，订单服务需依次等待库存、积分、通知服务响应，耗时叠加且强耦合。引入消息队列后：

```
用户下单
  └─ 订单服务（写 DB + 发消息）→ 消息队列
                                    ├─ 库存服务（异步扣减）
                                    ├─ 积分服务（异步发放）
                                    └─ 通知服务（异步发短信/邮件）
```

- 订单服务只需将消息投递成功即可返回，响应时间从 300ms+ 降至 50ms 以内。
- 各下游服务故障不影响主流程，独立扩缩容。

---

### 2. 可靠投递（三环节）

消息从生产到消费经历三个环节，每个环节都可能丢失：

| 环节 | 风险 | 解决方案 |
|------|------|----------|
| **生产者 → Broker** | 网络抖动，消息未到达 | `acks=all`（等待所有 ISR 副本确认）+ 失败重试 |
| **Broker 存储** | 宕机导致内存消息丢失 | 开启持久化（`log.flush.interval`）+ 多副本 ISR |
| **Broker → 消费者** | 消费失败但 Offset 已提交 | 关闭自动提交，**手动提交 Offset**（消费成功后再提交） |

```java
// 生产者：acks=all 保证写入所有副本
props.put("acks", "all");
props.put("retries", 3);

// 消费者：手动提交 Offset
consumer.poll(Duration.ofMillis(100)).forEach(record -> {
    process(record);           // 先处理
    consumer.commitSync();     // 再提交
});
```

---

### 3. 幂等消费

由于重试机制，消息可能被重复投递，消费端必须做幂等处理：

| 方案 | 实现方式 | 适用场景 |
|------|----------|----------|
| **DB 唯一键** | 以消息 ID 为唯一键，重复插入直接忽略 | 插入类操作 |
| **Redis SETNX** | `SET msg_id 1 NX EX 86400`，已存在则跳过 | 高并发去重 |
| **业务状态机** | 检查当前状态是否允许流转，非预期状态直接丢弃 | 订单/工作流 |

```python
# Redis 去重示例
def consume(message):
    key = f"consumed:{message.id}"
    if redis.set(key, 1, nx=True, ex=86400):
        do_business_logic(message)   # 首次消费
    # else: 已消费，幂等跳过
```

---

### 4. 消息积压处理

消息积压通常表现为消费速度远低于生产速度，处理思路：

1. **紧急扩容**：增加消费者实例（需同步增加 Partition 数，否则多余消费者空闲）。
2. **增加 Partition**：提升并行度（注意：Partition 只能增不能减）。
3. **消息转移 + 批量消费**：将积压消息转移到临时 Topic，用专用消费者批量处理后写回。
4. **降级策略**：非核心消息（如日志、统计）可临时丢弃，优先保障核心链路。

---

### 5. Exactly-Once 语义 — Kafka 事务消息（必背追问）

**面试 Top 追问**："Kafka 怎么实现 Exactly-Once？"——这是高级岗位**必考**，能讲清楚 PID + Epoch + Transaction Coordinator 三件套，立刻区分初中高级。

#### 三种语义对比

| 语义 | 含义 | 实现方式 |
|------|------|---------|
| **At-Most-Once** | 最多一次（可能丢）| 自动提交 + acks=0 |
| **At-Least-Once** | 至少一次（可能重复）| acks=all + 手动提交（默认推荐+幂等消费）|
| **Exactly-Once** | 恰好一次 | **幂等生产者 + 事务**（Kafka 0.11+）|

#### 1. 幂等生产者（Idempotent Producer）— 解决生产端重发重复

```properties
enable.idempotence=true     # 开启幂等（必须 acks=all）
acks=all
retries=Integer.MAX_VALUE
max.in.flight.requests.per.connection<=5
```

**底层原理**：
- 每个 Producer 分配唯一 **PID（Producer ID）**
- 每条消息带 **序号 SequenceNumber**（单调递增）
- Broker 端按 `<PID, Partition>` 维度维护 `lastSeqNumber`
- 如果新消息序号 = lastSeq + 1 → 接受
- 如果新消息序号 ≤ lastSeq → **丢弃**（重复）
- 如果新消息序号 > lastSeq + 1 → 报 `OutOfOrderSequenceException`

::: tip 💡 幂等生产者的局限

> 幂等只保证**单 Producer + 单 Partition + 单 Session** 内不重复。跨 Partition 或 Producer 重启后 PID 变化 → 失效。要跨 Partition 不重复必须用**事务**。

:::

#### 2. 事务消息（Transactional Producer）— 跨 Partition 原子性

```java
Properties props = new Properties();
props.put("transactional.id", "order-tx-1");   // ★ 必须设置
props.put("enable.idempotence", "true");

KafkaProducer<String,String> producer = new KafkaProducer<>(props);
producer.initTransactions();

try {
    producer.beginTransaction();
    producer.send(new ProducerRecord<>("orders", "order-1"));
    producer.send(new ProducerRecord<>("inventory", "deduct-1"));   // 跨 Partition / Topic
    producer.commitTransaction();    // ✅ 全部成功
} catch (Exception e) {
    producer.abortTransaction();     // ❌ 全部回滚
}
```

**底层组件**：

| 组件 | 作用 |
|------|------|
| **Transaction Coordinator** | 每个 Broker 一个，管理事务状态 |
| **`__transaction_state` Topic** | 持久化事务状态（类似事务日志）|
| **PID + Producer Epoch** | Epoch 防止"僵尸 Producer"（被网络隔离后苏醒继续提交）|
| **Control Message** | COMMIT / ABORT 标记消息，写入每个涉及的 Partition |

**Epoch 防僵尸机制（类似 Fencing Token）**：

```
T1: Producer-A 拿到 PID=100, Epoch=0，开始事务
T2: Producer-A GC 假死 30 秒
T3: 同 transactional.id 重启 → Coordinator 给 Epoch=1，A 的 Epoch=0 失效
T4: A 苏醒提交 → Broker 报 InvalidProducerEpochException 拒绝
```

#### 3. 消费端配置（Read Committed）

```properties
# 消费者必须设置：只读已提交的事务消息
isolation.level=read_committed
```

不设置默认是 `read_uncommitted`，会读到**未提交甚至已回滚**的事务消息。

#### 4. 端到端 Exactly-Once（Consume-Process-Produce）

**最经典场景**：从 Topic A 消费 → 处理 → 写入 Topic B + 提交 Offset，三件事必须原子：

```java
producer.beginTransaction();
producer.send(transformedRecord);     // 写 Topic B
// ★ 在事务中提交消费 Offset
producer.sendOffsetsToTransaction(
    Map.of(new TopicPartition("A", 0), new OffsetAndMetadata(offset)),
    "consumer-group-1"
);
producer.commitTransaction();
```

**关键 API**：`sendOffsetsToTransaction` 把消费 Offset 写入事务，确保"消费 + 处理 + 生产"三位一体。

::: warning ⚠️ Exactly-Once 性能代价

> 事务消息**吞吐下降 20-30%**（多了 Coordinator 通信和 Control Message）。生产实践：**普通业务用幂等生产者 + 消费端幂等**（At-Least-Once + 业务去重）就够；只有金融/计费这种**绝对不能重复**的场景才上事务。

:::

#### 5. RocketMQ 事务消息 vs Kafka 事务

| 维度 | Kafka 事务 | RocketMQ 事务消息 |
|------|----------|----------------|
| **解决问题** | 多 Partition / Topic 原子写 + 消费 Offset 原子提交 | **本地事务 + 发送消息**原子（分布式事务）|
| **实现方式** | Transaction Coordinator + Control Message | **二阶段消息**：先发半消息 → 执行本地事务 → 提交 / 回滚 |
| **典型场景** | 流处理 ETL（Kafka Streams）| 业务系统：扣款 + 发消息通知 |
| **回查机制** | 无 | ✅ 有事务状态回查（防 Producer crash）|

**RocketMQ 事务消息时序**：

```
1. Producer 发送 half message → Broker（消费者不可见）
2. Producer 执行本地事务（扣款）
3. Producer 根据本地事务结果 commit/rollback 给 Broker
4. 若 3 超时未收到 → Broker 主动回查 Producer 本地事务状态
5. commit → 消息对消费者可见；rollback → 删除半消息
```

### 黄金答题模板（必背）

> **面试官：Kafka 怎么实现 Exactly-Once？**
>
> **答**：分两层：① **幂等生产者**（`enable.idempotence=true`）—— PID + SequenceNumber 防单 Producer 单 Partition 重发；② **事务消息**（`transactional.id`）—— Transaction Coordinator + Control Message + Producer Epoch（防僵尸），实现跨 Partition / Topic 原子写，配合 `sendOffsetsToTransaction` 把消费 Offset 原子提交。消费端必须设 `isolation.level=read_committed`。代价是吞吐降 20-30%，所以**普通业务用 At-Least-Once + 消费端幂等就够**，金融场景再上事务。RocketMQ 走的是另一条路——**二阶段消息 + 状态回查**，解决"本地事务 + 发消息"的分布式事务问题。

---

## 面试常问 & 怎么答

**如何保证消息不丢失？**

> 从三个环节分别保证：①生产者使用 `acks=all` + 重试；②Broker 开启持久化 + 多副本 ISR 同步；③消费者关闭自动提交，业务处理成功后手动提交 Offset。

---

**如何保证消息顺序？**

> Kafka 仅保证单个 Partition 内有序。实现全局/局部有序的方式：将需要顺序消费的消息（如同一订单的所有事件）路由到同一 Partition——通过相同的 Key（`producer.send(topic, key, value)`），Kafka 会将相同 Key 的消息分配到同一 Partition。

---

**Kafka 为什么吞吐量高？**

> 四个关键设计：
> 1. **顺序写磁盘**：消息追加写入，磁盘顺序 I/O 速度接近内存。
> 2. **零拷贝（sendfile）**：数据从磁盘直接通过 DMA 传输到网卡，跳过用户态拷贝。
> 3. **分区并行**：多 Partition 支持多消费者并行消费，横向扩展。
> 4. **批量发送 + 压缩**：消息批量打包，并使用 Snappy/LZ4/GZIP 压缩，减少网络 I/O。

---

**消费者重平衡（Rebalance）是什么？**

> 当 Consumer Group 内成员发生变化（新增/下线消费者）或 Topic 的 Partition 数变化时，Kafka 会触发重平衡，重新将 Partition 分配给各消费者。重平衡期间所有消费者暂停消费，可能造成短暂延迟。减少重平衡影响的方法：合理设置 `session.timeout.ms` 和 `max.poll.interval.ms`，避免消费者因处理时间过长被误判为下线。

---

## 常见陷阱

| 陷阱 | 后果 | 解决方案 |
|------|------|----------|
| 使用自动提交 Offset | 消费失败但 Offset 已提交，消息永久丢失 | 改为手动提交，确保业务处理成功后再提交 |
| 消费者单条处理耗时过长 | 超过 `max.poll.interval.ms` 触发重平衡，反复消费同一批消息 | 调大 `max.poll.interval.ms` 或缩小 `max.poll.records`，将耗时操作异步化 |
| 未做幂等处理 | 重试或重平衡导致重复消费，数据重复写入 | 使用唯一键、Redis 去重或业务状态机实现幂等 |

---

## 看到什么就先想到这类

- **"异步/解耦/削峰"** → 消息队列
- **"事件驱动/广播通知"** → 发布订阅
- **"消息不丢失"** → 三环节保证（生产者确认 + Broker 持久化 + 手动提交 Offset）
- **"消息顺序"** → 同 Key 同 Partition
- **"重复消费"** → 幂等性设计（唯一键/SETNX/状态机）
- **"高吞吐日志/流处理"** → Kafka
