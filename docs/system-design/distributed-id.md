---
title: 分布式 ID 生成
---

# 分布式 ID 生成 Distributed ID Generation

<span class="dig-tag dig-tag--category">系统设计</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--hot">🔥🔥 高频</span>

::: tip 💡 核心要点
分布式系统中，传统数据库自增主键无法满足多节点唯一 ID 的需求。Snowflake（雪花算法）凭借其高性能、趋势递增和可排序的特性，成为业界最主流的分布式 ID 生成方案。理解其比特位结构、时钟回拨问题的处理方式是系统设计面试的高频考点。
:::

## 为什么需要分布式 ID？

单体架构中，数据库自增主键（AUTO_INCREMENT）足以保证唯一性。但在分布式场景下：

- **分库分表：** 数据水平拆分到多个数据库实例，各实例的自增 ID 会互相冲突
- **微服务架构：** 多个服务各自生成 ID，无法依赖单一数据库序列
- **数据合并：** 不同分片的数据需要合并时，ID 必须全局唯一
- **消息追踪：** 分布式链路中需要唯一的 traceId 串联请求

**对分布式 ID 的核心要求：**

| 要求 | 说明 |
|------|------|
| 全局唯一 | 任何节点、任何时刻生成的 ID 不重复 |
| 趋势递增 | ID 整体递增（有利于数据库 B+ 树索引，减少页分裂） |
| 高性能 | 每秒可生成数十万甚至百万级 ID |
| 高可用 | ID 生成服务不能成为单点故障 |
| 信息安全 | 不暴露业务量（如果 ID 连续递增，竞争对手可推算订单量） |

## 方案一：UUID

UUID（Universally Unique Identifier）是 128 位的通用唯一标识符，格式如 `550e8400-e29b-41d4-a716-446655440000`。

```java
String id = UUID.randomUUID().toString();
// 输出：550e8400-e29b-41d4-a716-446655440000
```

| 优点 | 缺点 |
|------|------|
| 本地生成，无网络开销 | **无序**，作为主键写入 B+ 树导致大量页分裂，性能差 |
| 实现简单，无需中心化服务 | 字符串占用 36 字节（含连字符），存储空间大 |
| 全局唯一性极高 | 不具备业务含义，不可排序 |
| 无单点故障 | 不适合作为数据库主键索引 |

> **结论：** UUID 适合不需要排序的场景（如文件名、Session ID），**不适合作为数据库主键**。

## 方案二：数据库自增

### 单数据库自增

使用一个专用数据库表生成全局唯一 ID：

```sql
CREATE TABLE id_generator (
    id BIGINT NOT NULL AUTO_INCREMENT,
    stub CHAR(1) NOT NULL DEFAULT '',
    PRIMARY KEY (id),
    UNIQUE KEY uk_stub (stub)
) ENGINE=InnoDB;

-- 每次获取 ID
REPLACE INTO id_generator (stub) VALUES ('a');
SELECT LAST_INSERT_ID();
```

**问题：** 单数据库是**单点故障**，且并发能力受限于数据库写入性能。

### 双数据库步长模式

两台数据库分别生成奇数和偶数 ID：

```
数据库 A：起始值=1，步长=2  → 生成 1, 3, 5, 7, 9, ...
数据库 B：起始值=2，步长=2  → 生成 2, 4, 6, 8, 10, ...
```

```sql
-- 数据库 A
SET @@auto_increment_offset = 1;
SET @@auto_increment_increment = 2;

-- 数据库 B
SET @@auto_increment_offset = 2;
SET @@auto_increment_increment = 2;
```

**优点：** 避免了单点故障，提升可用性和吞吐量。

**缺点：** 扩展困难 —— 增加第三个节点时无法简单修改步长，需要数据迁移。只适合节点数固定的场景。

## 方案三：Snowflake 雪花算法（核心重点）

Snowflake 是 Twitter 开源的分布式 ID 生成算法，生成 64 位（long 类型）的唯一 ID。

### 比特位结构

```
0 | 0000000 00000000 00000000 00000000 00000000 0 | 00000 | 00000 | 000000000000
│                     41 位                       │  5位  │  5位  │    12 位
│                                                 │       │       │
符号位                时间戳                     数据中心  机器ID    序列号
(固定0)    (毫秒级，相对于自定义纪元)              ID
```

| 部分 | 位数 | 说明 |
|------|------|------|
| 符号位 | 1 bit | 固定为 0（正数） |
| 时间戳 | 41 bit | 毫秒级时间戳，相对于自定义纪元的偏移量。可使用约 69 年（2^41 ms ≈ 69.7 年） |
| 数据中心 ID | 5 bit | 支持 32 个数据中心（0~31） |
| 机器 ID | 5 bit | 每个数据中心支持 32 台机器（0~31） |
| 序列号 | 12 bit | 同一毫秒内的计数器，支持每台机器每毫秒生成 4096 个 ID（0~4095） |

**理论极限：** 单机每秒可生成 4096 × 1000 = **409.6 万**个 ID。

### Java 实现

```java
public class SnowflakeIdGenerator {

    // 自定义纪元（2020-01-01 00:00:00 UTC）
    private static final long EPOCH = 1577836800000L;

    // 各部分位数
    private static final int DATA_CENTER_BITS = 5;
    private static final int MACHINE_BITS = 5;
    private static final int SEQUENCE_BITS = 12;

    // 最大值
    private static final long MAX_DATA_CENTER_ID = ~(-1L << DATA_CENTER_BITS); // 31
    private static final long MAX_MACHINE_ID = ~(-1L << MACHINE_BITS);         // 31
    private static final long MAX_SEQUENCE = ~(-1L << SEQUENCE_BITS);           // 4095

    // 左移位数
    private static final int MACHINE_SHIFT = SEQUENCE_BITS;                     // 12
    private static final int DATA_CENTER_SHIFT = SEQUENCE_BITS + MACHINE_BITS;  // 17
    private static final int TIMESTAMP_SHIFT = SEQUENCE_BITS + MACHINE_BITS + DATA_CENTER_BITS; // 22

    private final long dataCenterId;
    private final long machineId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    public SnowflakeIdGenerator(long dataCenterId, long machineId) {
        if (dataCenterId < 0 || dataCenterId > MAX_DATA_CENTER_ID) {
            throw new IllegalArgumentException("Data center ID out of range: " + dataCenterId);
        }
        if (machineId < 0 || machineId > MAX_MACHINE_ID) {
            throw new IllegalArgumentException("Machine ID out of range: " + machineId);
        }
        this.dataCenterId = dataCenterId;
        this.machineId = machineId;
    }

    public synchronized long nextId() {
        long currentTimestamp = System.currentTimeMillis();

        // 时钟回拨检测
        if (currentTimestamp < lastTimestamp) {
            long offset = lastTimestamp - currentTimestamp;
            if (offset <= 5) {
                // 回拨幅度小，等待追上
                try {
                    Thread.sleep(offset << 1);
                    currentTimestamp = System.currentTimeMillis();
                    if (currentTimestamp < lastTimestamp) {
                        throw new RuntimeException("Clock moved backwards after waiting. Refusing to generate ID.");
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Thread interrupted during clock drift wait", e);
                }
            } else {
                throw new RuntimeException(
                    "Clock moved backwards by " + offset + " ms. Refusing to generate ID."
                );
            }
        }

        if (currentTimestamp == lastTimestamp) {
            // 同一毫秒，序列号递增
            sequence = (sequence + 1) & MAX_SEQUENCE;
            if (sequence == 0) {
                // 序列号溢出，等待下一毫秒
                currentTimestamp = waitNextMillis(lastTimestamp);
            }
        } else {
            // 新的毫秒，序列号重置
            sequence = 0L;
        }

        lastTimestamp = currentTimestamp;

        // 组装 64 位 ID
        return ((currentTimestamp - EPOCH) << TIMESTAMP_SHIFT)
                | (dataCenterId << DATA_CENTER_SHIFT)
                | (machineId << MACHINE_SHIFT)
                | sequence;
    }

    private long waitNextMillis(long lastTimestamp) {
        long timestamp = System.currentTimeMillis();
        while (timestamp <= lastTimestamp) {
            timestamp = System.currentTimeMillis();
        }
        return timestamp;
    }
}
```

**使用示例：**
```java
// 数据中心 1，机器 1
SnowflakeIdGenerator idGen = new SnowflakeIdGenerator(1, 1);

long id = idGen.nextId();
System.out.println(id);  // 输出：如 168923456789012345
```

### 从 ID 中解析信息

Snowflake ID 可以反向解析出生成时间、数据中心和机器信息：

```java
public static void parseId(long id) {
    long timestamp = (id >> 22) + EPOCH;
    long dataCenterId = (id >> 17) & 0x1F;
    long machineId = (id >> 12) & 0x1F;
    long sequence = id & 0xFFF;

    System.out.println("Timestamp: " + new Date(timestamp));
    System.out.println("DataCenter: " + dataCenterId);
    System.out.println("Machine: " + machineId);
    System.out.println("Sequence: " + sequence);
}
```

## 方案四：Leaf —— 美团分布式 ID 方案

Leaf 是美团开源的分布式 ID 生成系统，提供两种模式：

### Leaf-Segment（号段模式）

预先从数据库批量获取一段 ID（如一次取 1000 个），在内存中分配，减少数据库访问。

```
┌────────────────────┐
│   Leaf 服务         │
│                      │
│  当前号段: 1001-2000 │ ──► 依次分配 1001, 1002, ...
│  下一号段: 2001-3000 │ ──► 当前号段用到 10% 时，异步加载下一号段
│                      │
└─────────┬──────────┘
          │ 号段用完时
          ▼
    ┌──────────┐
    │ 数据库     │  UPDATE leaf_alloc SET max_id = max_id + step
    │ leaf_alloc │
    └──────────┘
```

**双缓冲优化：** 当前号段消耗到一定比例（如 10%）时，异步加载下一号段到内存，实现无阻塞切换。

### Leaf-Snowflake

基于 Snowflake 算法，使用 ZooKeeper 自动分配 workerId（机器 ID），解决了手动配置机器 ID 的运维困难。

**启动流程：**
1. 服务启动时向 ZooKeeper 注册临时节点
2. ZooKeeper 分配唯一的 workerId（0~1023）
3. 使用分配到的 workerId 运行 Snowflake 算法

## 时钟回拨问题 Clock Drift

Snowflake 依赖系统时钟的单调递增，如果发生时钟回拨（NTP 时间同步、手动调整系统时间），可能导致 ID 重复。

### 时钟回拨的原因

- **NTP 同步：** 服务器从 NTP 服务器同步时间时，可能向前或向后调整
- **闰秒处理：** 操作系统插入闰秒时可能导致时间跳变
- **虚拟机迁移：** 虚拟机热迁移后，目标物理机的时钟可能不同步

### 解决方案

| 方案 | 描述 | 适用场景 |
|------|------|---------|
| **等待追上** | 回拨幅度小（几毫秒）时，等待系统时钟追上 lastTimestamp | 小幅度回拨 |
| **抛出异常** | 回拨幅度大时直接拒绝生成 ID，告警运维介入 | 大幅度回拨 |
| **扩展位预留** | 在 ID 中预留 2~3 位作为时钟序列号，每次回拨时递增 | 需要更高可用性 |
| **使用单调时钟** | 使用 `System.nanoTime()`（单调递增，不受 NTP 影响）代替 `currentTimeMillis` | 对可用性要求极高 |

**Leaf-Snowflake 的处理方式：**
```
启动时检查 → 从 ZooKeeper 读取上次上报的时间戳
    │
    ├── 当前时间 >= 上次时间 → 正常启动
    │
    └── 当前时间 < 上次时间 → 时钟回拨
         │
         ├── 差值 < 阈值（如 5ms） → 等待
         │
         └── 差值 > 阈值 → 启动失败，告警
```

## 各方案全面对比

| 方案 | 唯一性 | 有序性 | 性能 | 可用性 | 实现复杂度 | 适用场景 |
|------|--------|--------|------|--------|-----------|---------|
| UUID | 极高 | 无序 | 高（本地） | 极高 | 简单 | 文件名、非 DB 主键 |
| 数据库自增 | 高 | 严格递增 | 低 | 低（单点） | 简单 | 小规模、单库 |
| 数据库步长 | 高 | 趋势递增 | 中 | 中 | 中等 | 固定节点数 |
| **Snowflake** | 高 | 趋势递增 | **极高** | 高 | 中等 | **大多数分布式场景** |
| Leaf-Segment | 高 | 趋势递增 | 高 | 高 | 较高 | 大规模、高可用 |
| Leaf-Snowflake | 高 | 趋势递增 | 极高 | 高 | 较高 | 大规模、自动运维 |

## 常见误区

::: warning 易错点
1. **UUID 不适合做数据库主键：** UUID 无序写入 B+ 树索引时会导致大量页分裂和随机 I/O，性能比自增 ID 差 3~5 倍。面试中切勿建议用 UUID 做订单号主键
2. **Snowflake 不保证严格递增：** 不同机器生成的 ID 只是"趋势递增"（同一毫秒内不同机器 ID 不同），不是严格单调递增。只有单机内同一毫秒才保证递增
3. **时钟回拨不能忽略：** 生产环境必须处理时钟回拨问题，否则会生成重复 ID，导致数据库主键冲突和数据丢失
4. **机器 ID 分配要可靠：** 手动配置机器 ID 容易出错（重复配置）。推荐使用 ZooKeeper 或 Redis 自动分配，或者基于 IP/MAC 地址哈希
5. **序列号从 0 开始的隐患：** 如果每毫秒的请求量很少，序列号总是 0，生成的 ID 都是偶数（最低位为 0），分库分表取模时数据会倾斜。可以考虑随机初始序列号
:::

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. Snowflake 算法的比特位结构是什么？为什么这样设计？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 分布式 ID 生成有哪些常见方案？各有什么优缺点？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. Snowflake 的时钟回拨问题是什么？如何解决？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### Q1: Snowflake 比特位结构

**64 位结构：1 bit 符号位 + 41 bit 时间戳 + 5 bit 数据中心 + 5 bit 机器 + 12 bit 序列号**

设计考量：
- **1 位符号位：** 固定为 0，保证生成的 ID 为正数（Java long 类型最高位是符号位）
- **41 位时间戳：** 存储的是相对于自定义纪元（如 2020-01-01）的毫秒偏移量，可以使用约 69.7 年。使用相对时间戳而非绝对时间戳是为了最大化利用空间
- **5+5 位机器标识：** 共 10 位，支持 1024 个节点。拆分为数据中心和机器 ID 是为了方便多机房部署管理
- **12 位序列号：** 同一节点同一毫秒内最多生成 4096 个 ID。超出则等待下一毫秒

**为什么时间戳放在最高位？** 保证生成的 ID 整体趋势递增 —— 时间越晚，ID 值越大。这对 B+ 树索引至关重要，追加写入比随机插入性能高数倍。

### Q2: 分布式 ID 方案对比

| 方案 | 特点 | 推荐度 |
|------|------|--------|
| **UUID** | 本地生成、无序、128 位字符串。不适合做 DB 主键 | ★★ |
| **数据库自增** | 简单可靠但有单点问题，性能受限于数据库 | ★★ |
| **Snowflake** | 64 位 long，趋势递增，性能极高（400万/秒），是业界主流方案 | ★★★★★ |
| **Leaf-Segment** | 号段模式，双缓冲优化，依赖数据库但访问频率极低 | ★★★★ |
| **Redis INCR** | 利用 Redis 的原子自增命令，性能好但强依赖 Redis 可用性 | ★★★ |

**面试建议回答：** 先说需求分析（全局唯一、趋势递增、高性能），然后按方案逐一分析优缺点，最后总结"大多数场景优先选择 Snowflake 或其变种（如 Leaf-Snowflake），需要严格递增可考虑 Leaf-Segment"。

### Q3: 时钟回拨问题

**问题本质：** Snowflake 用当前时间戳作为 ID 的一部分，如果系统时钟被向前拨回（NTP 同步、闰秒等），可能生成与之前相同的 `(时间戳 + 序列号)` 组合，导致 ID 重复。

**解决方案层级：**

1. **检测拒绝（基础）：** 每次生成 ID 时比较 `currentTimestamp` 和 `lastTimestamp`，如果回拨则抛异常。简单但会导致服务暂时不可用

2. **短暂等待（优化）：** 回拨幅度在阈值内（如 5ms），busy-wait 等待时钟追上。对轻微回拨透明处理

3. **扩展位预留（高级）：** 从机器 ID 或序列号中借几位作为"时钟序列号"。每次检测到回拨就递增这几位，相当于切换到一个新的 ID 空间，避免冲突。百度的 UidGenerator 采用类似思路

4. **外部时间源（架构级）：** 使用 ZooKeeper/etcd 存储节点时间戳，启动时校验。美团 Leaf 会在启动时对比 ZooKeeper 中记录的上次时间戳来决定是否启动服务

## 延伸阅读

- [Twitter Snowflake 原始设计](https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake)
- [Leaf —— 美团点评分布式 ID 生成系统](https://tech.meituan.com/2017/04/21/mt-leaf.html)
- [百度 UidGenerator](https://github.com/baidu/uid-generator)
- 《高并发系统设计 40 问》第 7 讲：分布式 ID
