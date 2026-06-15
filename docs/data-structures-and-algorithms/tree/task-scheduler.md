---
title: 任务调度器
---

# 任务调度器（LC621 + Cron 设计）— 贪心 + 时间堆 + 分布式协调

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 经典</span>

::: tip 💡 核心要点
**LC621 是单机贪心 + 桶模式，Cron 是时间堆 + 时间轮，分布式调度是 Leader 选举 + 分片**——这三件事是同一个题型的算法 / 工程 / 分布式三层升级版。从白板 10 行写到 Quartz / XXL-Job / Airflow 一气呵成。
:::

## 为什么单独讲它

任务调度是面试中**纵深可控**的题——既能考算法（LC621），也能考工程（手撕 ScheduledExecutorService），还能聊分布式（Quartz cluster / XXL-Job）。一道题能聊 5 分钟，也能聊 30 分钟。

### 三层升级版

| 层次 | 题目 | 核心技术 |
|------|------|------|
| **算法层** | LC621 CPU 任务调度（同任务有冷却期）| 贪心 + 桶模式 / 大顶堆 |
| **工程层** | 实现一个 Java 单机调度器 | 时间堆 / 时间轮 / DelayQueue |
| **分布式层** | 设计公司级定时任务平台 | Leader 选举 + 分片 + 故障转移 |

## 算法层：LC621 任务调度器

**题目**：给定一个 char 数组表示任务，相同任务之间必须间隔 n 个时间单位（冷却）。求完成所有任务的最少时间。

```
tasks = ["A","A","A","B","B","B"], n = 2
执行：A B idle A B idle A B  → 共 8 个时间单位
```

### 解法 1：桶模式（数学解，O(1) 空间）

**关键洞察**：出现次数最多的任务（设为 max），形成 (max-1) 个"桶"，每个桶大小 (n+1)，最后一个桶只放出现次数 = max 的任务。

```
桶图示（A 出现 3 次，n=2）：
┌─────┬───┬───┐  ┌─────┬───┬───┐  ┌─────┐
│  A  │ B │   │  │  A  │ B │   │  │  A B│
└─────┴───┴───┘  └─────┴───┴───┘  └─────┘
   <─ n+1 ─>      <─ n+1 ─>       last
```

```java
public int leastInterval(char[] tasks, int n) {
    int[] count = new int[26];
    for (char c : tasks) count[c - 'A']++;
    Arrays.sort(count);
    int maxFreq = count[25];                            // 出现最多的次数
    int sameMaxCount = 0;                               // 出现次数 = maxFreq 的任务数
    for (int i = 25; i >= 0 && count[i] == maxFreq; i--) sameMaxCount++;

    // ★ (maxFreq-1) 个完整桶 × (n+1) + 最后一桶 sameMaxCount 个
    // ★ 如果桶能填满（任务种类多），就是 tasks.length 本身
    return Math.max(tasks.length, (maxFreq - 1) * (n + 1) + sameMaxCount);
}
```

**复杂度**：O(N) 计数 + O(26 log 26)，**O(1) 额外空间**。

### 解法 2：大顶堆模拟（通用，扩展性好）

每轮取出 n+1 个出现次数最多的任务执行，余下次数 -1 重新入堆。

```java
public int leastInterval(char[] tasks, int n) {
    int[] count = new int[26];
    for (char c : tasks) count[c - 'A']++;

    PriorityQueue<Integer> pq = new PriorityQueue<>(Comparator.reverseOrder());
    for (int c : count) if (c > 0) pq.offer(c);

    int time = 0;
    while (!pq.isEmpty()) {
        List<Integer> temp = new ArrayList<>();
        int slots = n + 1;
        while (slots > 0 && !pq.isEmpty()) {
            temp.add(pq.poll());                        // 取 n+1 个不同任务
            slots--;
        }
        for (int t : temp) {
            if (t - 1 > 0) pq.offer(t - 1);             // 还有次数就还回去
        }
        // ★ 队列空了就实际用了多少；非空说明有 idle，整个 n+1 时长
        time += pq.isEmpty() ? temp.size() : (n + 1);
    }
    return time;
}
```

**复杂度**：O(N log 26) ≈ O(N)。**适用扩展**：任务有不同冷却时间、有优先级时只能用堆模式。

### 两种解法对比

| 维度 | 桶模式 | 大顶堆 |
|------|------|------|
| 复杂度 | O(1) 空间，最优 | O(K) K=任务种类 |
| 代码量 | 10 行 | 25 行 |
| 扩展性 | 死的，只解原题 | **可加优先级 / 不同冷却 / 任务依赖** |
| 面试建议 | **先桶模式拿分**，再说堆模式可扩展 | |

## 工程层：单机调度器

### 选型决策树

| 需求 | 选择 | 不选的原因 |
|------|------|------|
| 一次性延迟任务 | `ScheduledExecutorService.schedule` | DelayQueue 要自己取 |
| 周期性 ms 级 | `ScheduledThreadPoolExecutor` | 简单 |
| 海量定时（10w+ 任务）| **时间轮 HashedWheelTimer**（Netty）| ScheduledExecutorService 是 O(log n) 入堆 |
| 任务可被取消 / 调整 | `DelayQueue<Delayed>` | 灵活 |
| 持久化任务 | Quartz 单机 | 自己写要 WAL |

### 时间堆（ScheduledExecutorService）

JDK 内置的 `ScheduledThreadPoolExecutor` 底层就是 **DelayedWorkQueue**（小顶堆）：

```
                  ┌────────────────────┐
   schedule() ──> │  小顶堆（按时间） │ ← 堆顶就是最近要执行的
                  └─────────┬──────────┘
                            ▼
                  ┌────────────────────┐
                  │  Worker Thread     │   ← take() 阻塞等堆顶到期
                  │  执行 -> 周期任务  │
                  │       重新入堆     │
                  └────────────────────┘
```

**复杂度**：每次 schedule / 执行 O(log n)。**问题**：**海量任务时入堆慢**，淘宝订单 30 分钟自动取消、IM 心跳几百万级用这个会炸。

### 时间轮（HashedWheelTimer）— 海量定时神器

**核心思想**：把时间切成 N 个槽（如 512 槽，每槽 100ms = 51.2 秒一圈），任务按到期时间 mod N 落入对应槽。

```
槽 0   槽 1   槽 2   ...   槽 511
  │      │      │            │
  ▼      ▼      ▼            ▼
[T1]   [T5]   [T2,T9]      [T7]   ← 每个槽是个链表
                              ▲
                            指针每 tick 前进一格
```

**为什么快**：
- 添加任务：**O(1)**（直接落槽，不像堆要 O(log n)）
- 删除任务：**O(1)**（链表节点直接删）
- 触发：**O(本槽任务数)**

**多层时间轮（kafka / netty 4.x）**：秒级轮 + 分钟级轮 + 小时级轮级联，比小米手机闹钟、Linux 内核 jiffies 都是这个原理。

```java
HashedWheelTimer timer = new HashedWheelTimer(
    100, TimeUnit.MILLISECONDS,                         // tick 间隔 100ms
    512                                                 // 槽数 512
);
timer.newTimeout(timeout -> System.out.println("fire"),
                 5, TimeUnit.SECONDS);
```

**精度限制**：tick 100ms 意味着任务可能延迟 0–100ms 执行——做心跳、订单超时**完全够**，做精确到 ms 的金融交易就不行（用 ScheduledExecutorService 或硬件时钟）。

### DelayQueue 手撕（如果面试官真要你写）

```java
class TaskScheduler {
    private final DelayQueue<DelayedTask> queue = new DelayQueue<>();
    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    static class DelayedTask implements Delayed {
        Runnable task;
        long executeTime;                               // 绝对时间 nanos

        @Override
        public long getDelay(TimeUnit unit) {
            return unit.convert(executeTime - System.nanoTime(), TimeUnit.NANOSECONDS);
        }

        @Override
        public int compareTo(Delayed o) {
            return Long.compare(this.executeTime, ((DelayedTask) o).executeTime);
        }
    }

    public void schedule(Runnable task, long delay, TimeUnit unit) {
        DelayedTask dt = new DelayedTask();
        dt.task = task;
        dt.executeTime = System.nanoTime() + unit.toNanos(delay);
        queue.offer(dt);
    }

    public void start() {
        new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    DelayedTask t = queue.take();        // ★ 阻塞到堆顶任务到期
                    executor.submit(t.task);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }, "scheduler-poller").start();
    }
}
```

## 分布式层：公司级调度平台

### 三大模式

| 模式 | 代表 | 适用 |
|------|------|------|
| **Quartz 集群** | quartz-scheduler | 已有 Quartz 项目 / 简单集群 |
| **XXL-Job 中央调度** | 大众点评开源 | 中国互联网公司主流 |
| **Airflow DAG 工作流** | Apache Airflow | 数据 ETL、ML pipeline |
| **K8s CronJob** | Kubernetes | 容器化、无状态任务 |

### XXL-Job 架构（最常被问）

```
       ┌─────────────────────────┐
       │   XXL-Job Admin (HA)    │  ← 调度中心（多实例，DB Lock 选主）
       └──────────┬──────────────┘
                  │ HTTP RPC 触发
       ┌──────────┼──────────┐
       ▼          ▼          ▼
   ┌──────┐  ┌──────┐  ┌──────┐
   │Exec 1│  │Exec 2│  │Exec 3│   ← 执行器（业务方部署）
   │ Bean │  │ Bean │  │ Bean │
   └──────┘  └──────┘  └──────┘
                  │
                  ▼
              ┌──────┐
              │ MySQL│   ← 任务定义 / 日志 / 锁
              └──────┘
```

**XXL-Job 关键设计**：

| 问题 | 方案 |
|------|------|
| **多调度中心防重复触发** | MySQL `for update` 抢锁，只有抢到的才调度 |
| **任务路由策略** | 第一个 / 最后一个 / 轮询 / 随机 / 一致性 Hash / 最不繁忙 / 故障转移 / 忙碌转移 |
| **任务失败重试** | 失败次数配置，按路由再选 |
| **任务超时** | 设置 timeout，超时强制中断 |
| **分片广播** | 一个任务拆给多个执行器并行（如 100w 数据分 10 片）|
| **执行日志** | 日志按 jobId 落本地 + 上报中心 |
| **失败告警** | 邮件 / 钉钉 / Webhook |

### 分布式调度的核心难题：抢主

任何分布式调度（Quartz / XXL-Job / Elastic-Job）都要解决**多调度节点不要重复触发同一任务**：

| 方案 | 实现 | 优缺点 |
|------|------|------|
| **DB 行锁**（XXL-Job）| `SELECT ... FOR UPDATE` 抢同一行 | 简单但 DB 压力 |
| **Redis 分布式锁** | SETNX + TTL | 高性能但 Redis 故障要处理 |
| **ZK / etcd 临时节点** | 第一个创建节点的当 leader | 强一致，故障切换快 |
| **Raft / Paxos** | 内置共识 | 复杂度高，仅大厂自研 |

### Airflow vs XXL-Job 选型

| 维度 | Airflow | XXL-Job |
|------|------|------|
| 任务类型 | **DAG 工作流**（任务间有依赖）| 独立定时任务 |
| 触发 | 周期 + 上游完成 | 周期触发 |
| 适用 | 数据 ETL、ML pipeline | 业务定时任务、报表生成 |
| 重试 | 单任务重试 | 整任务重试 |
| 生态 | 200+ 算子（Hive/Spark/K8s）| Java 业务集成 |

## 时间堆 vs 时间轮决策表

| 维度 | 时间堆（ScheduledExecutorService） | 时间轮（HashedWheelTimer）|
|------|------|------|
| 添加 | O(log n) | **O(1)** |
| 删除 | O(log n) | **O(1)** |
| 触发精度 | μs 级 | tick 间隔（通常 100ms）|
| 适用任务数 | < 1w | **10w+ 海量**（订单超时、心跳）|
| 代表 | JDK / Quartz | Netty / Kafka / Dubbo / 京东闪购 |

**面试金句**：少量精确定时用堆，海量低精度定时用时间轮。Netty 写网络框架自带 HashedWheelTimer 是因为它要管百万连接的心跳超时——堆扛不住。

## 关键陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| `ScheduledExecutorService` 任务抛异常没 catch | **整个调度被阻塞**，后续任务不执行 | 任务里 `try-catch` 兜底，或用 `scheduleAtFixedRate` 注意 |
| 任务执行时间 > 周期间隔 | `scheduleAtFixedRate` 会堆积，`scheduleWithFixedDelay` 不会 | 业务关心**完成间隔**用 WithFixedDelay |
| 时区错误 | UTC vs 本地，定时任务凌晨触发不一致 | **统一用 UTC + ZoneId** |
| 多机不抢主 | 重复执行（发券 / 扣款）| **必须分布式锁 + 抢主**（Quartz/XXL-Job 自带）|
| 任务漂移 | 长期运行后偏离原计划时间 | `scheduleAtFixedRate` 按绝对时间，**不漂移** |
| Cron `0 0 0 ? * * *` 写错 | `?` 和 `*` 的区别 | 用 [crontab.guru](https://crontab.guru) 验证 |
| 任务卡死没超时 | 占用 worker 线程 | 必须设 timeout + 中断机制 |

## 复杂度速查

| 操作 | DelayQueue | ScheduledExecutorService | HashedWheelTimer |
|------|------|------|------|
| 添加任务 | O(log n) | O(log n) | **O(1)** |
| 取出最近任务 | O(log n) | O(log n) | **O(1)** |
| 删除任务 | O(n) | O(log n) | **O(1)** |
| 精度 | μs | μs | tick（通常 100ms）|
| 适合 | 业务延时 | 通用 | 海量定时 |

## 面试常问 & 怎么答

### LC621 怎么解

**先桶模式拿分**：max 频次任务形成 (max-1) 个 (n+1) 大小的桶，加上最后一桶 sameMaxCount 个。再补一句"也可以用大顶堆模拟，更灵活，支持优先级 / 不同冷却扩展"。

### 时间堆和时间轮怎么选

少量精确定时用堆（JDK ScheduledExecutorService）；海量低精度定时（10w+ 订单超时、IM 心跳）用 HashedWheelTimer。**Kafka、Netty、Dubbo 都用时间轮就是这个原因**。

### Quartz 集群怎么防止重复触发

MySQL 表 `QRTZ_LOCKS` 抢行锁（`SELECT ... FOR UPDATE`），只有抢到的实例才能触发。**XXL-Job 同理**。也可以用 ZK / etcd 临时节点抢主。

### scheduleAtFixedRate 和 scheduleWithFixedDelay 区别

- `AtFixedRate`：按**绝对时间**周期触发，任务执行超时会堆积补跑
- `WithFixedDelay`：上次执行**完成后**等 delay 再跑，永不堆积

业务关心"每天 1 点跑一次"用 AtFixedRate；关心"两次执行之间间隔 10 分钟"用 WithFixedDelay。

### XXL-Job 的分片广播是啥

一个任务拆成 N 份并行（如 100w 订单清算分 10 片，每片 10w）。执行器收到 `shardIndex / shardTotal`，按 `id % total == index` 取自己那部分。**比单机分批快 N 倍**。

### Cron 表达式 ? 和 * 区别

`?` 只能用在 **day-of-month** 和 **day-of-week**，表示"不关心"——因为这两个字段冲突，比如 `0 0 12 ? * MON` 表示每周一 12 点，day-of-month 必须填 `?`。其他字段一律 `*`。

## 看到什么就先想到这类

| 信号 | 套用 |
|------|------|
| 任务 + 冷却时间 / 间隔 | LC621 桶模式 / 大顶堆 |
| 一次性 / 周期性定时 | DelayQueue / ScheduledExecutorService |
| 海量连接超时 / 心跳 | HashedWheelTimer 时间轮 |
| 多机定时不重复 | Quartz cluster / XXL-Job / ZK 抢主 |
| 任务有依赖关系（DAG）| Airflow / DAGs |
| 任务很大要并行 | XXL-Job 分片广播 / Spark |
| K8s 环境 | CronJob + Job |
