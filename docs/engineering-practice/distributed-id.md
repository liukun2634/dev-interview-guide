---
title: 分布式 ID 生成
---

# 分布式 ID 生成

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
分布式系统中需要全局唯一且趋势递增的 ID。Snowflake（雪花算法）是最主流方案，理解其 64 位结构和时钟回拨处理是面试高频考点。
:::

---

## 核心概念

### 为什么需要分布式 ID

单体架构中，数据库自增主键足以保证唯一性。分布式场景下，以下三类问题使其失效：

- **分库分表**：数据水平拆分到多个实例，各实例自增 ID 互相冲突
- **微服务架构**：多个服务各自生成 ID，无法依赖单一数据库序列
- **数据合并**：不同分片的数据需要合并时，ID 必须全局唯一

### 方案对比

| 方案 | 全局唯一 | 趋势递增 | 性能 | 依赖 | 适用场景 |
|------|---------|---------|------|------|---------|
| UUID | ✅ 极高 | ❌ 无序 | 高（本地） | 无 | 文件名、链路追踪 ID |
| 数据库自增 | ✅ | ✅ 严格递增 | 低 | 数据库（单点） | 小规模单库 |
| 雪花算法 | ✅ | ✅ 趋势递增 | 极高（本地） | 无 | 大多数分布式场景 |
| 号段模式 | ✅ | ✅ 趋势递增 | 高 | 数据库 | 高可用、严格递增 |
| Redis INCR | ✅ | ✅ 趋势递增 | 高 | Redis | 中小规模、强依赖 Redis |

### 雪花算法 64 位结构

```
0 | 00000000 00000000 00000000 00000000 00000000 0 | 00000 00000 | 000000000000
  |<---------- 41 bit 时间戳 ---------->|<-10bit->|<--12 bit-->|
  |           约 69 年                   | 机器ID  |  序列号    |
  |                                      |1024台   |4096/ms    |
```

| 部分 | 位数 | 说明 |
|------|------|------|
| 符号位 | 1 bit | 固定为 0，保证 ID 为正数 |
| 时间戳 | 41 bit | 相对自定义纪元的毫秒偏移，可用约 69 年 |
| 机器 ID | 10 bit | 支持 1024 个节点 |
| 序列号 | 12 bit | 同一毫秒内最多生成 4096 个 ID |

---

## 典型场景与最佳实践

### 场景一：雪花算法详解

**64 位拆分逻辑：** 时间戳放最高有效位，保证 ID 整体趋势递增；机器 ID 区分节点；序列号支撑同一毫秒内的高并发。

```java
public class SnowflakeIdWorker {
    private final long workerId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    private static final long EPOCH = 1609459200000L; // 2021-01-01
    private static final long WORKER_ID_BITS = 10L;
    private static final long SEQUENCE_BITS = 12L;
    private static final long MAX_SEQUENCE = ~(-1L << SEQUENCE_BITS);
    private static final long WORKER_ID_SHIFT = SEQUENCE_BITS;
    private static final long TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;

    public SnowflakeIdWorker(long workerId) {
        this.workerId = workerId;
    }

    public synchronized long nextId() {
        long timestamp = System.currentTimeMillis();
        if (timestamp < lastTimestamp) {
            throw new RuntimeException("时钟回拨，拒绝生成 ID");
        }
        if (timestamp == lastTimestamp) {
            sequence = (sequence + 1) & MAX_SEQUENCE;
            if (sequence == 0) {
                while (timestamp <= lastTimestamp) {
                    timestamp = System.currentTimeMillis();
                }
            }
        } else {
            sequence = 0L;
        }
        lastTimestamp = timestamp;
        return ((timestamp - EPOCH) << TIMESTAMP_SHIFT)
             | (workerId << WORKER_ID_SHIFT)
             | sequence;
    }
}
```

**时钟回拨处理策略：**

| 策略 | 说明 | 适用 |
|------|------|------|
| 等待追上 | 回拨幅度小（≤5ms），busy-wait 等待 | 轻微抖动 |
| 拒绝生成 | 直接抛异常，告警运维介入 | 大幅度回拨 |
| 扩展位 | 从机器 ID 借位作"时钟序列号"，每次回拨递增 | 高可用要求 |

### 场景二：号段模式

一次从数据库批量取一段 ID（如 1000 个），在内存中依次分配，大幅减少 DB 访问。

```
数据库表：id_alloc (biz_tag, max_id, step)
每次申请：UPDATE id_alloc SET max_id = max_id + step WHERE biz_tag = ?
```

**双 Buffer 优化：** 当前号段消耗到 10% 时，异步预加载下一号段到内存，切换时零阻塞。

```
当前 Buffer：[1001, 2000]  使用中
下一 Buffer：[2001, 3000]  用到 10% 时异步加载完毕
```

### 场景三：选型决策

```
不需要有序     → UUID（链路追踪、文件名）
单机小规模     → 数据库自增
高并发有序     → 雪花算法（本地生成，性能最优）
高可用严格递增 → 号段模式（美团 Leaf-Segment）
```

---

## 面试常问 & 怎么答

**Q：雪花算法时钟回拨怎么处理？**

> 三种策略：①小幅度（≤5ms）等待时钟追上；②大幅度直接拒绝生成 ID 并告警；③高可用场景借用 workerId 部分位作时钟序列号，每次回拨递增，切换到新 ID 空间避免冲突。生产环境用 NTP 平滑同步配合策略②兜底。

**Q：UUID 为什么不适合做数据库主键？**

> UUID 无序写入会导致 B+ 树页分裂，随机 I/O 性能比自增 ID 差 3~5 倍；128 位字符串占用 36 字节，远大于 bigint 的 8 字节；可读性差，不利于排查问题。

**Q：美团 Leaf 方案是什么？**

> Leaf 同时支持两种模式：Leaf-Segment（号段模式 + 双 Buffer 解决 DB 单点性能瓶颈）和 Leaf-Snowflake（ZooKeeper 自动分配 workerId，避免手动配置出错）。两种模式可按需选用，无需自己维护基础服务。

---

## 常见陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| workerId 重复 | 不同节点生成相同 ID，主键冲突 | 用 ZooKeeper 或 DB 统一分配 workerId |
| 不处理时钟回拨 | ID 重复，数据丢失 | 至少拒绝生成，生产配合 NTP 平滑同步 |
| 号段用完才申请 | 申请期间阻塞所有 ID 请求 | 双 Buffer，剩余 10% 时提前异步加载 |

---

## 看到什么就先想到这类

- "全局唯一 ID" → 雪花算法
- "分库分表主键" → 雪花 / 号段模式
- "链路追踪 ID" → UUID
- "高并发 ID 生成" → 雪花（本地生成）
- "时钟回拨" → 雪花核心风险点
