# System Design Chapter Restructuring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the system design chapter with framework-first content, normalize all pages to the project's standard structure, and add 4 new pages covering storage selection, API design, search & recommendation, and real-world case studies.

**Architecture:** Flat directory structure under `docs/system-design/`. Each page follows the framework-first template: 概念 → 核心原理 → 技术选型与对比 → 架构图与数据流 → 面试常问 & 怎么答 → 看到什么就先想到这类. Existing pages are enriched with missing sections per spec; new pages are written from scratch.

**Tech Stack:** VitePress (Markdown), no code changes — pure documentation.

**Content writing guidelines:** This is a documentation-only project. There are no tests to write or run. Each task produces one or more Markdown files. "Verify" means visually checking the file renders correctly with `npm run docs:dev` (optional — the writer can skip if confident). All content is in Chinese (matching existing pages). Each page should follow the framework-first structure shown in the existing DSA chapters but adapted for system design topics.

**Page template for reference (all pages should follow this structure):**

```markdown
---
title: 页面标题
---

# 页面标题

## 概念
（是什么、为什么重要）

## 核心原理
（关键理论和机制，深度讲解，含架构图）

### 子节标题
...

## 技术选型与对比
（主流方案横向对比表）

## 面试常问 & 怎么答
（高频面试题 + 参考回答，每题包含"答题思路"）

## 看到什么就先想到这类
（触发词速查表）
```

---

### Task 1: Update sidebar config and index.md

**Files:**
- Modify: `docs/.vitepress/config.ts:182-198` (sidebar system-design section)
- Modify: `docs/system-design/index.md`

- [ ] **Step 1: Update sidebar config**

In `docs/.vitepress/config.ts`, replace the `/system-design/` sidebar section (lines 182-198) with:

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

- [ ] **Step 2: Rewrite index.md**

Replace the entire content of `docs/system-design/index.md` with a comprehensive overview containing:

1. **系统设计知识全景图** — A table categorizing all concepts across 6 domains (分布式理论, 存储与数据, 计算与服务, 通信与协议, 可靠性工程, 可观测性)
2. **核心概念速查表** — 20-30 high-frequency concepts with one-line definitions and links to the relevant page
3. **面试考察维度** — 5 dimensions senior interviewers evaluate (需求分析能力, 架构抽象能力, 技术深度, 权衡取舍, 沟通表达)
4. **分类地图** — Updated table with all 12 pages (existing 8 + new 4)
5. **建议顺序** — Learning path: 理论→组件→架构→案例

Concepts to include in the speed lookup table (each with one-line definition + link):
- 一致性哈希/虚拟节点, 读写分离/主从复制, 分库分表/ShardingKey, CDN/DNS/反向代理, 服务发现/注册中心, 熔断/降级/限流, 消息幂等/Exactly-Once, CAP/BASE, Paxos/Raft/ZAB, 分布式锁/Redlock, 分布式ID(Snowflake), 负载均衡算法, 蓝绿部署/金丝雀发布, CQRS/Event Sourcing, Bloom Filter/HyperLogLog, 时序数据库/列式存储, 倒排索引/分词, OAuth2/JWT/SSO

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/config.ts docs/system-design/index.md
git commit -m "docs: update system-design sidebar and enrich index overview"
```

---

### Task 2: Enrich distributed-theory.md

**Files:**
- Modify: `docs/system-design/distributed-theory.md`

Current content already covers: CAP/BASE, consistency models, Paxos, Raft, ZAB, consistent hashing. Already has 面试常问 and 看到什么就先想到这类 sections.

- [ ] **Step 1: Add missing sections**

Append the following new sections before the existing 面试常问 section:

1. **分布式时钟** (new section after 一致性哈希):
   - Lamport Clock: scalar logical clock, incremented on each event, sent with messages
   - Vector Clock: one counter per node, detects concurrent events (used by DynamoDB, Riak)
   - HLC (Hybrid Logical Clock): combines physical time + logical counter, used by CockroachDB
   - Table comparing the three: what each detects (causality vs concurrency), space complexity, use cases

2. **FLP 不可能定理** (brief, after distributed clocks):
   - One-sentence statement: in an asynchronous system with even one faulty process, no deterministic consensus algorithm can guarantee termination
   - Engineering implication: all real consensus algorithms (Paxos, Raft) rely on timeouts/randomization to make progress — they work in practice because true asynchrony is rare

3. **ZooKeeper vs etcd 选型对比** (new section after FLP):
   - Architecture comparison table: ZK (Java, ZAB, tree data model, ephemeral nodes, watches) vs etcd (Go, Raft, flat key-value, lease, watch with revision)
   - Performance characteristics, operational complexity, ecosystem
   - Decision guide: when to use which
   - Practical example: implementing distributed lock with ZooKeeper (create ephemeral sequential node, watch predecessor)

- [ ] **Step 2: Add new interview questions**

Add to the existing 面试常问 section:

- **Q4: 分布式时钟有哪些？解决什么问题？** — Lamport/Vector/HLC comparison, event ordering problem
- **Q5: ZooKeeper 和 etcd 怎么选？** — Protocol, data model, ecosystem, operational differences

- [ ] **Step 3: Update 看到什么就先想到这类 table**

Add entries:
- 事件排序/因果关系 → 分布式时钟（Lamport/Vector Clock）
- K8s 元数据 / 服务发现 → etcd（Raft）
- 临时节点 / Watch 机制 → ZooKeeper（ZAB）

- [ ] **Step 4: Commit**

```bash
git add docs/system-design/distributed-theory.md
git commit -m "docs: enrich distributed-theory with clocks, FLP, ZK vs etcd"
```

---

### Task 3: Enrich distributed-transaction.md

**Files:**
- Modify: `docs/system-design/distributed-transaction.md`

Current content already covers: 2PC, 3PC, TCC (with three anomalies), Saga, local message table, RocketMQ transaction messages, comparison table. Already has 面试常问 and 看到什么就先想到这类.

- [ ] **Step 1: Add Seata framework section**

Add a new section "9. Seata 框架" after the comparison table (section 8):

- Brief intro: Seata is an open-source distributed transaction framework from Alibaba, supporting 4 modes
- Table comparing Seata's 4 modes (AT, TCC, Saga, XA):
  - AT mode: automatic rollback via undo log, low business intrusion, default mode
  - TCC mode: business-level try/confirm/cancel, same as general TCC
  - Saga mode: state machine orchestration, long transactions
  - XA mode: standard XA protocol, strong consistency
- When to use which mode: AT for general CRUD, TCC for financial, Saga for long-running workflows, XA for legacy DB integration

- [ ] **Step 2: Add e-commerce order case study**

Add a new section "实战案例：电商下单跨服务事务" after Seata:

- Scenario: Order creation → Inventory deduction → Payment deduction across 3 services
- TCC implementation walkthrough:
  - Try: create order (status=CREATING), freeze inventory, freeze balance
  - Confirm: update order (status=CREATED), deduct frozen inventory, deduct frozen balance  
  - Cancel: delete order, unfreeze inventory, unfreeze balance
- Saga implementation walkthrough:
  - T1: create order → T2: deduct inventory → T3: deduct balance
  - Compensations: C3→C2→C1 if any step fails
- ASCII flow diagram for each approach
- Comparison: TCC gives stronger consistency but requires 3 interfaces per service; Saga is simpler but has visible intermediate states

- [ ] **Step 3: Add new interview question**

Add Q4 to 面试常问:
- **Q4: TCC 和 Saga 的核心区别是什么？电商下单用哪个？**

- [ ] **Step 4: Commit**

```bash
git add docs/system-design/distributed-transaction.md
git commit -m "docs: enrich distributed-transaction with Seata and e-commerce case"
```

---

### Task 4: Enrich high-availability.md

**Files:**
- Modify: `docs/system-design/high-availability.md`

Current content already covers: SLA, redundancy (master-slave, multi-active), fault detection, failover (Sentinel, MHA, split-brain), fault tolerance (rate limiting, circuit breaker, degradation, retry, timeout), load balancing, disaster recovery. Already has 面试常问 and 看到什么就先想到这类.

- [ ] **Step 1: Add chaos engineering section**

Add "故障演练与混沌工程" section after 容灾与恢复 (section 7):

- Chaos Engineering principles (from Netflix): steady state hypothesis, introduce real-world events, run in production, minimize blast radius
- Netflix Chaos Monkey / Simian Army: random instance termination
- Other tools: ChaosBlade (Alibaba), LitmusChaos (K8s), Gremlin
- Practical process: define steady state metrics → design experiment → run → analyze → fix

- [ ] **Step 2: Expand multi-region active-active detail**

Expand the existing 多活架构 subsection within section 2 (冗余设计) with:

- Data synchronization challenges: cross-region replication latency, conflict resolution
- Routing strategies: user-ID based sharding, geo-DNS, traffic manager
- Data conflict resolution: last-write-wins, vector clocks, application-level merge
- Case study: payment system active-active (single-write region for financial data, read replicas globally, async replication for non-critical data)

- [ ] **Step 3: Add degradation decision tree**

Expand the existing 降级 subsection within section 5 (容错机制) with a decision tree:

- 功能降级: disable non-critical features (recommendations, comments, analytics)
- 数据降级: return cached/stale data instead of real-time data
- 体验降级: show simplified UI, reduce image quality, disable animations
- Decision criteria: which type based on failure scope and business impact

- [ ] **Step 4: Add new interview questions**

Add to 面试常问:
- **Q4: 如何设计一个 99.99% 可用的系统？** — Structured answer covering redundancy, failover, fault tolerance, monitoring
- **Q5: 异地多活最大的挑战是什么？** — Data consistency, routing, conflict resolution

- [ ] **Step 5: Commit**

```bash
git add docs/system-design/high-availability.md
git commit -m "docs: enrich high-availability with chaos engineering and multi-region"
```

---

### Task 5: Enrich caching-strategies.md

**Files:**
- Modify: `docs/system-design/caching-strategies.md`

Current content already covers: three cache problems (penetration, breakdown, avalanche) with Java code, Cache Aside / Read Through / Write Through / Write Behind, Redis expiration and eviction policies. Has HTML-style interview questions and 常见误区.

- [ ] **Step 1: Restructure to framework-first format**

Restructure the page to match the standard template:
- Remove old HTML-style `<span class="dig-tag">` tags and `<div class="dig-questions">` blocks
- Restructure sections to: 概念 → 核心原理 → 技术选型与对比 → 面试常问 & 怎么答 → 看到什么就先想到这类
- Keep all existing content but reorganize into the new structure

- [ ] **Step 2: Add Redis cluster architecture section**

Add within 核心原理:

- Redis architecture evolution: standalone → master-slave → Sentinel → Cluster
- Redis Cluster: 16384 hash slots, slot allocation, MOVED/ASK redirection
- When to use each tier: standalone for dev, Sentinel for HA single-master, Cluster for horizontal scaling
- ASCII diagram showing Redis Cluster with 3 masters + 3 replicas

- [ ] **Step 3: Add multi-level caching architecture**

Add within 核心原理:

- L1 local cache (Caffeine): in-process, microsecond access, limited by JVM heap
- L2 distributed cache (Redis): shared across instances, millisecond access
- L3 database: persistent, slowest
- Data flow diagram: request → L1 hit? → L2 hit? → DB query → backfill L2 → backfill L1
- Consistency between levels: L1 invalidation via pub/sub or broadcast

- [ ] **Step 4: Add cache-DB consistency deep dive**

Add within 核心原理:

- 延迟双删 (delayed double deletion): update DB → delete cache → sleep 500ms → delete cache again
- Canal binlog listener: Canal monitors MySQL binlog → publishes change events → consumer deletes cache
- ASCII diagram for Canal-based approach
- Comparison table: which approach for which consistency requirement

- [ ] **Step 5: Add 面试常问 & 怎么答 and 看到什么就先想到这类**

Restructure existing Q&A into standard format. Add:
- **Q4: 如何保证缓存和数据库的最终一致性？** — Cache Aside + delayed double deletion + Canal
- **Q5: Redis Cluster 的 Hash Slot 机制是什么？** — 16384 slots, CRC16 hash, slot migration

Add 看到什么就先想到这类 table (currently missing):
- 读多写少/热点数据 → Cache Aside + Redis
- 缓存不一致/脏数据 → 延迟双删 / Canal binlog
- Redis 宕机/单点 → Sentinel / Cluster
- 大量 key 同时过期 → TTL 随机化 + 多级缓存
- 布隆过滤器 → 缓存穿透防护

- [ ] **Step 6: Commit**

```bash
git add docs/system-design/caching-strategies.md
git commit -m "docs: restructure caching-strategies with Redis cluster and multi-level caching"
```

---

### Task 6: Enrich rate-limiting.md

**Files:**
- Modify: `docs/system-design/rate-limiting.md`

Current content already covers: 4 rate limiting algorithms with Java code, Redis+Lua distributed rate limiting, circuit breaker with Resilience4j, bulkhead pattern. Very comprehensive. Has HTML-style tags.

- [ ] **Step 1: Restructure to framework-first format**

- Remove old HTML-style `<span class="dig-tag">` tags and `<div class="dig-questions">` blocks
- Restructure to: 概念 → 核心原理 → 技术选型与对比 → 面试常问 & 怎么答 → 看到什么就先想到这类
- Keep all existing content but reorganize

- [ ] **Step 2: Add framework comparison table**

Add a 技术选型与对比 section:

| 维度 | Sentinel | Hystrix | Resilience4j |
|------|----------|---------|--------------|
| 维护状态 | 阿里活跃维护 | Netflix 停止维护 | 活跃维护 |
| 限流 | 支持（QPS/线程数） | 不支持 | 支持（RateLimiter） |
| 熔断 | 支持 | 支持 | 支持 |
| 降级 | 支持 | 支持 | 支持 |
| 热点参数限流 | 支持 | 不支持 | 不支持 |
| 系统自适应限流 | 支持 | 不支持 | 不支持 |
| 控制台 | 有（Sentinel Dashboard） | 有（Hystrix Dashboard） | 无（依赖 Actuator） |
| 依赖 | 轻量 | 依赖 Archaius | 轻量，Java 8+ |
| 推荐场景 | Spring Cloud Alibaba 项目 | 遗留项目维护 | Spring Boot / 新项目 |

- [ ] **Step 3: Add adaptive rate limiting section**

Add within 核心原理:

- Concept: dynamically adjust rate limit threshold based on system load (CPU, thread pool utilization, response time)
- Sentinel's system adaptive protection: monitors system metrics, automatically triggers protection when load exceeds threshold
- TCP BBR-inspired algorithm: finds the optimal throughput point
- When to use: backend services that need to protect themselves without pre-configured thresholds

- [ ] **Step 4: Add multi-dimension API gateway rate limiting case**

Add as 实战案例:

- API gateway rate limiting dimensions: per-user, per-IP, per-endpoint, global
- Implementation: Redis key design for each dimension (`rate:user:{userId}`, `rate:ip:{ip}`, `rate:api:{path}`)
- Priority and combination: global → per-endpoint → per-user → per-IP
- ASCII diagram showing gateway rate limiting flow

- [ ] **Step 5: Restructure 面试常问 and add 看到什么就先想到这类**

Restructure existing Q&A. Add 看到什么就先想到这类 table (currently missing):
- 秒杀/突发流量 → 令牌桶（允许突发）
- 匀速消费/流量整形 → 漏桶
- 微服务间调用故障 → 熔断器（Resilience4j）
- 分布式全局限流 → Redis + Lua
- 系统自适应保护 → Sentinel 系统规则
- 资源隔离/线程池 → 舱壁模式

- [ ] **Step 6: Commit**

```bash
git add docs/system-design/rate-limiting.md
git commit -m "docs: restructure rate-limiting with framework comparison and adaptive limiting"
```

---

### Task 7: Enrich message-queue.md

**Files:**
- Modify: `docs/system-design/message-queue.md`

Current content already covers: why MQ, core concepts, message models, delivery semantics, Kafka architecture (partitions, offsets, consumer groups, rebalance), message ordering, DLQ, idempotency, MQ comparison table. Very comprehensive. Has HTML-style tags.

- [ ] **Step 1: Restructure to framework-first format**

- Remove HTML-style tags
- Restructure to: 概念 → 核心原理 → 技术选型与对比 → 面试常问 & 怎么答 → 看到什么就先想到这类

- [ ] **Step 2: Add Kafka ISR deep dive**

Add within Kafka 架构详解:

- ISR (In-Sync Replicas): set of replicas that are fully caught up with the leader
- `acks` configuration impact:
  - `acks=0`: fire and forget, fastest, may lose data
  - `acks=1`: leader confirms, balanced
  - `acks=all`: all ISR replicas confirm, safest
- `min.insync.replicas`: minimum ISR size required for writes to succeed
- What happens when ISR shrinks: if ISR < min.insync.replicas, producer gets NotEnoughReplicasException
- `unclean.leader.election.enable`: whether out-of-sync replicas can become leader (data loss risk)

- [ ] **Step 3: Add RocketMQ transaction message detail**

Add a dedicated subsection within 核心原理:

- ASCII flow diagram of the half-message mechanism (more detailed than what's in distributed-transaction.md):
  1. Producer sends half message → Broker stores in internal topic (not visible to consumers)
  2. Broker returns send result
  3. Producer executes local transaction
  4. Producer sends commit/rollback based on local transaction result
  5. If producer crashes: Broker checks back (回查) after timeout
- Code example showing RocketMQ TransactionListener implementation in Java

- [ ] **Step 4: Add delayed message case study**

Add as 实战案例:

- Scenario: order timeout cancellation (30 minutes)
- RocketMQ approach: delayed message levels (1s, 5s, 10s, 30s, 1m, 2m, 3m, 4m, 5m, 6m, 7m, 8m, 9m, 10m, 20m, 30m, 1h, 2h)
- Redis approach: ZSET with score = expiry timestamp, polling worker
- Kafka approach: topic with TTL + delayed consumer
- Comparison table: which approach for which scenario

- [ ] **Step 5: Restructure 面试常问 and add 看到什么就先想到这类**

Keep existing Q&A, restructure format. Add:
- **Q4: Kafka 为什么吞吐量高？** — Sequential disk I/O, zero-copy, batching, partition parallelism, page cache
- Add 看到什么就先想到这类 table (currently missing)

- [ ] **Step 6: Commit**

```bash
git add docs/system-design/message-queue.md
git commit -m "docs: restructure message-queue with Kafka ISR and delayed message case"
```

---

### Task 8: Enrich microservices.md

**Files:**
- Modify: `docs/system-design/microservices.md`

Current content already covers: monolith vs microservices, core principles, service communication (REST/gRPC/MQ), service discovery, API gateway, BFF, distributed transactions, Service Mesh, CAP. Has HTML-style tags.

- [ ] **Step 1: Restructure to framework-first format**

- Remove HTML-style tags
- Restructure to: 概念 → 核心原理 → 技术选型与对比 → 面试常问 & 怎么答 → 看到什么就先想到这类

- [ ] **Step 2: Add observability three pillars**

Add a new section "可观测性三大支柱" within 核心原理:

- **Distributed Tracing**: Jaeger / Zipkin / SkyWalking
  - Concept: trace a request across multiple services, each service adds a span
  - Key components: TraceID, SpanID, parent SpanID
  - OpenTelemetry as the standard
- **Metrics**: Prometheus + Grafana
  - RED method: Rate, Errors, Duration (for request-based services)
  - USE method: Utilization, Saturation, Errors (for resources)
  - Key metrics: QPS, P99 latency, error rate, CPU/memory
- **Logging**: ELK stack (Elasticsearch + Logstash + Kibana) or EFK (Fluentd)
  - Structured logging with correlation IDs
  - Log levels and when to use each

- [ ] **Step 3: Add container orchestration basics**

Add a new section "容器与编排" within 核心原理:

- Docker: image, container, Dockerfile basics, networking modes (bridge, host, overlay)
- Kubernetes core concepts:
  - Pod: smallest deployable unit, one or more containers
  - Service: stable network endpoint, ClusterIP / NodePort / LoadBalancer
  - Ingress: HTTP routing, TLS termination
  - Deployment: declarative updates, rolling update, rollback
- Pod lifecycle: Pending → Running → Succeeded/Failed
- Health checks: liveness probe, readiness probe, startup probe

- [ ] **Step 4: Add DDD service splitting principles**

Add a new section "服务拆分原则" within 核心原理:

- DDD bounded context: each service maps to one bounded context
- Splitting signals: when to split (team growth, independent release cadence, different scaling needs)
- Anti-patterns: splitting by technical layer (UI service, logic service, data service) instead of by domain
- Migration path: strangler fig pattern (gradually extract services from monolith)

- [ ] **Step 5: Add monolith-to-microservices case study**

Add as 实战案例:

- Phase 1: identify bounded contexts in the monolith (user, order, product, payment)
- Phase 2: extract the first service (usually the one with clearest boundary and highest change frequency)
- Phase 3: introduce API gateway, service discovery
- Phase 4: gradually extract remaining services
- Key lesson: don't big-bang rewrite; incremental extraction reduces risk

- [ ] **Step 6: Add new interview questions and 看到什么就先想到这类**

Add to 面试常问:
- **Q4: 微服务的优缺点？什么时候不应该用微服务？** — Small team, simple domain, early-stage product
- **Q5: 如何做服务拆分？拆分粒度怎么把握？** — DDD bounded context, team size, change frequency

Add 看到什么就先想到这类 (currently missing):
- 单体应用变慢/部署困难 → 微服务拆分（DDD 限界上下文）
- 服务间调用追踪 → 分布式追踪（Jaeger/Zipkin）
- K8s 部署/扩缩容 → Pod/Service/Deployment
- 零侵入服务治理 → Service Mesh（Istio + Envoy）
- 多端差异化 API → BFF 模式

- [ ] **Step 7: Commit**

```bash
git add docs/system-design/microservices.md
git commit -m "docs: restructure microservices with observability, K8s, and DDD splitting"
```

---

### Task 9: Create database-selection.md (NEW)

**Files:**
- Create: `docs/system-design/database-selection.md`

- [ ] **Step 1: Write the complete page**

Create `docs/system-design/database-selection.md` following the framework-first template. Content:

**概念:**
- Why storage selection matters: wrong DB choice leads to scaling nightmares
- Core decision factors: data model, consistency requirements, access patterns, scale

**核心原理:**

1. **关系型数据库 (RDBMS)**:
   - MySQL InnoDB architecture: buffer pool, redo log, undo log, doublewrite buffer
   - Index principles: B+ tree structure, clustered vs secondary index, covering index
   - Transaction isolation levels: Read Uncommitted → Read Committed → Repeatable Read → Serializable
   - MVCC: how InnoDB implements consistent reads without locking

2. **NoSQL**:
   - Redis: data structure selection guide (String for cache, Hash for objects, ZSet for rankings, Set for dedup, List for queues)
   - MongoDB: document model, when to use (schema flexibility, rapid prototyping, content management)
   - HBase: column-family store, LSM tree, suitable for high-write-throughput time-series/log data

3. **NewSQL**:
   - TiDB: MySQL-compatible, Raft-based, horizontal scaling
   - CockroachDB: PostgreSQL-compatible, distributed SQL
   - When to consider: need ACID + horizontal scaling

4. **时序数据库**:
   - InfluxDB / TimescaleDB: optimized for time-series data
   - Use cases: monitoring metrics, IoT sensor data

5. **分库分表**:
   - Vertical split: separate tables by business domain
   - Horizontal split: shard by sharding key
   - ShardingSphere: middleware approach
   - Sharding key selection: high cardinality, even distribution, query alignment
   - Expansion: doubling strategy (4→8 shards)

6. **读写分离**:
   - Master-slave replication delay and mitigation
   - Routing strategies: force read from master for critical reads after write
   - Data consistency guarantees

7. **数据迁移**:
   - Dual-write approach: write to both old and new DB, compare, cutover
   - Shadow table approach: CDC (Change Data Capture) to replicate
   - Zero-downtime migration process: dual-write → verify → switch reads → stop dual-write

**选型决策树:**

| 需求 | 推荐 |
|------|------|
| 强事务 + 关系模型 | MySQL / PostgreSQL |
| 灵活 Schema + 文档模型 | MongoDB |
| 高性能缓存 + 数据结构 | Redis |
| 海量写入 + 列式查询 | HBase |
| ACID + 水平扩展 | TiDB / CockroachDB |
| 时序数据 + 聚合查询 | InfluxDB / TimescaleDB |

**面试常问 & 怎么答:**
- Q1: MySQL 和 MongoDB 什么时候该用哪个？
- Q2: 分库分表后如何做跨分片查询？
- Q3: 如何做不停机数据迁移？

**看到什么就先想到这类:**
- OLTP/事务 → MySQL/PostgreSQL
- Schema 灵活/嵌套文档 → MongoDB
- 排行榜/计数器/缓存 → Redis
- 海量写入/日志 → HBase
- 数据量太大/单库瓶颈 → 分库分表
- 读写比很高 → 读写分离

- [ ] **Step 2: Commit**

```bash
git add docs/system-design/database-selection.md
git commit -m "docs: add database-selection page covering storage selection and sharding"
```

---

### Task 10: Create api-design.md (NEW)

**Files:**
- Create: `docs/system-design/api-design.md`

- [ ] **Step 1: Write the complete page**

Create `docs/system-design/api-design.md` following the framework-first template. Content:

**概念:**
- API as the contract between services and between frontend/backend
- Good API design: consistent, versioned, secure, documented

**核心原理:**

1. **RESTful 设计**:
   - Resource modeling: nouns not verbs (`/users/{id}` not `/getUser`)
   - HTTP method semantics: GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE
   - Status codes: 2xx success, 4xx client error, 5xx server error (list common ones with meanings)
   - HATEOAS: hypermedia links in responses (brief mention, not commonly used in practice)

2. **gRPC**:
   - Protobuf definition example (.proto file)
   - Streaming modes: unary, server streaming, client streaming, bidirectional
   - HTTP/2 multiplexing: multiple requests over single connection
   - When to use: internal service-to-service high-frequency calls

3. **GraphQL**:
   - Schema definition, query/mutation
   - N+1 problem and DataLoader solution
   - When to use: BFF layer, mobile apps (client-driven queries, reduce over-fetching)
   - When NOT to use: simple CRUD APIs, server-to-server

4. **API 网关**:
   - Comparison: Kong vs Spring Cloud Gateway vs Envoy
   - Core functions: routing, rate limiting, auth, logging, protocol translation
   - Decision guide: Kong for standalone gateway, SCG for Spring ecosystem, Envoy for service mesh

5. **版本管理**:
   - URI versioning (`/api/v1/users`) — most common, simple
   - Header versioning (`Accept: application/vnd.api.v1+json`) — cleaner URLs
   - Query parameter (`?version=1`) — rarely used
   - Backward compatibility strategies: additive changes are safe, breaking changes need new version

6. **鉴权方案**:
   - OAuth2 four grant types: authorization code, implicit, client credentials, resource owner password
   - JWT structure: header.payload.signature, access token + refresh token flow
   - SSO: single sign-on across multiple applications
   - Token refresh: short-lived access token (15min) + long-lived refresh token (7 days)

7. **API 幂等性**:
   - Idempotency key design: client generates UUID, server checks before processing
   - Token-based dedup: server issues token, client submits with token, server invalidates after use
   - Which HTTP methods are inherently idempotent: GET, PUT, DELETE (yes), POST (no)

**面试常问 & 怎么答:**
- Q1: REST vs gRPC 怎么选？
- Q2: 如何设计一个对外开放的 API 平台？(versioning, auth, rate limiting, documentation)
- Q3: JWT 和 Session 的区别？各自适用场景？

**看到什么就先想到这类:**
- 对外 API/前后端通信 → REST
- 服务间高性能调用 → gRPC
- 客户端灵活查询/BFF → GraphQL
- 统一入口/鉴权限流 → API 网关
- 防重复提交 → 幂等性设计
- 用户登录/权限 → OAuth2 + JWT

- [ ] **Step 2: Commit**

```bash
git add docs/system-design/api-design.md
git commit -m "docs: add api-design page covering REST, gRPC, GraphQL, and auth"
```

---

### Task 11: Create search-and-recommendation.md (NEW)

**Files:**
- Create: `docs/system-design/search-and-recommendation.md`

- [ ] **Step 1: Write the complete page**

Create `docs/system-design/search-and-recommendation.md` following the framework-first template. Content:

**概念:**
- Search and recommendation are core infrastructure for content/e-commerce platforms
- Search: user has intent, system returns relevant results
- Recommendation: user has no explicit intent, system proactively suggests

**核心原理:**

1. **搜索引擎架构 (Elasticsearch)**:
   - Cluster architecture: nodes, indices, shards, replicas
   - Inverted index: term → document list (with positions)
   - Document indexing flow: index → analyze (tokenize) → build inverted index
   - Near real-time search: refresh interval (default 1s), flush to disk

2. **搜索优化**:
   - Relevance scoring: TF-IDF basics, BM25 (Elasticsearch default)
   - Multi-field search with boosting: title^3, body^1
   - Analyzers and tokenizers: standard, IK (Chinese), pinyin
   - Features: highlighting, auto-complete (completion suggester), fuzzy search

3. **搜索基础设施**:
   - Index design: mapping, field types, nested vs flattened
   - Shard strategy: shard sizing (10-50GB per shard), over-sharding costs
   - Hot-warm-cold architecture: ILM (Index Lifecycle Management)
   - Data sync: MySQL → Canal → Kafka → ES consumer

4. **推荐系统架构**:
   - Four-stage pipeline: 召回 → 粗排 → 精排 → 重排
   - ASCII pipeline diagram
   - Each stage's role: recall (thousands → hundreds), coarse ranking (hundreds → tens), fine ranking (tens → final order), re-ranking (diversity, business rules)

5. **召回策略**:
   - Collaborative filtering: UserCF (similar users like similar items), ItemCF (similar items bought together)
   - Content-based: match item features to user profile
   - Hot/new items: fallback for cold-start
   - Multi-channel recall: merge results from multiple strategies

6. **特征工程**:
   - User features: demographics, browsing history, purchase history
   - Item features: category, tags, price, popularity
   - Context features: time, location, device
   - Real-time features: recent clicks, session behavior (updated via Flink/Kafka)

**实战案例:**
- E-commerce product search: MySQL → Canal → Kafka → ES, search API with filters, sorting, pagination
- Short video recommendation Feed: recall (multi-channel) → ranking (deep learning model) → re-ranking (diversity, seen filter)

**面试常问 & 怎么答:**
- Q1: ES 和 MySQL 全文索引的区别？
- Q2: 推荐系统如何解决冷启动问题？ (new user: popular items, demographics; new item: content-based, explore/exploit)
- Q3: 倒排索引的原理？为什么搜索速度快？

**看到什么就先想到这类:**
- 全文搜索/关键词匹配 → Elasticsearch + 倒排索引
- 搜索相关性/排序 → BM25 / TF-IDF
- 个性化推荐/Feed 流 → 召回→排序 Pipeline
- 冷启动 → 热门/内容推荐兜底
- 实时特征 → Flink + Kafka
- 数据同步到 ES → Canal + Kafka

- [ ] **Step 2: Commit**

```bash
git add docs/system-design/search-and-recommendation.md
git commit -m "docs: add search-and-recommendation page covering ES and recommendation pipeline"
```

---

### Task 12: Create real-world-cases.md (NEW)

**Files:**
- Create: `docs/system-design/real-world-cases.md`

- [ ] **Step 1: Write the complete page**

Create `docs/system-design/real-world-cases.md`. This page uses the six-step methodology from `system-design-methodology.md` to walk through 4 system design cases. Each case follows: 需求澄清 → 容量估算 → 高层设计 → 详细设计 → 扩展与优化 → 权衡讨论.

**Page structure:**

```markdown
---
title: 综合案例
---

# 综合案例

本页使用[系统设计方法论](./system-design-methodology)中的六步框架，完整走读四个高频面试案例。
每个案例独立成节，可直接跳转到感兴趣的系统。

## 案例一：秒杀系统
## 案例二：即时通讯系统
## 案例三：Feed 流 / 时间线
## 案例四：短视频推荐系统
```

**Case 1: 秒杀系统**
- Requirements: high concurrent writes, flash sale for limited inventory
- Capacity: 100K concurrent users, 10K QPS writes, 100K QPS reads
- High-level: CDN (static pages) → Nginx → rate limiter → order service → inventory service (Redis atomic decrement) → MQ → DB
- Detailed design:
  - Inventory pre-load to Redis: `DECR stock:{itemId}`
  - Lua script for atomic check-and-decrement
  - Order creation via MQ (async, decouple from user response)
  - Anti-cheat: per-user rate limit, CAPTCHA, token bucket
- Scaling: Redis cluster for inventory, MQ for order processing, DB only for persistence
- Tradeoffs: eventual consistency (user sees "success" but order may fail), over-sell prevention vs throughput

**Case 2: 即时通讯系统 (IM)**
- Requirements: 1-on-1 chat, group chat, online status, message history, push notifications
- Capacity: 10M DAU, average 50 messages/user/day, P99 delivery < 200ms
- High-level: Client ↔ WebSocket Gateway ↔ Message Service ↔ Message Store (Cassandra/HBase) + Push Service
- Detailed design:
  - WebSocket connection management: connection registry (userId → gatewayId + connectionId) in Redis
  - Message delivery: sender → gateway → message service → lookup recipient's gateway → push
  - Group chat: fan-out on write (small groups) vs fan-out on read (large groups)
  - Offline push: if recipient not connected, push via APNs/FCM
  - Message storage: write-optimized store (HBase), per-conversation message list
  - Read receipts: async update, batch delivery
- Scaling: gateway horizontal scaling, message service stateless, storage sharded by conversationId
- Tradeoffs: fan-out on write (faster read, expensive write for large groups) vs fan-out on read

**Case 3: Feed 流 / Timeline**
- Requirements: Twitter-like timeline, user posts content, followers see in their feed
- Capacity: 100M DAU, 1 post/user/day average, 20 feed reads/user/day
- High-level: Post Service → Fan-out Service → Timeline Cache (Redis) → Feed Service
- Detailed design:
  - Push model (fan-out on write): when user posts, push to all followers' timelines in Redis
  - Pull model (fan-out on read): when user reads feed, pull from all followed users' recent posts
  - Hybrid model: push for regular users, pull for celebrities (>100K followers)
  - Redis timeline: ZSET per user, score = timestamp, trim to most recent 1000
  - Celebrity handling: lazy loading + cache
- Scaling: fan-out workers with MQ, Redis cluster for timelines
- Tradeoffs: push (fast read, slow write for popular users) vs pull (slow read, simple write)

**Case 4: 短视频推荐系统**
- Requirements: personalized video feed, infinite scroll, engagement optimization
- Capacity: 50M DAU, 100 videos viewed/user/day
- High-level: Client → API Gateway → Recommendation Service (recall → rank → rerank) → Video Service → CDN
- Detailed design:
  - Recall: multi-channel (collaborative filtering, content-based, trending, geo-local)
  - Ranking: ML model (user features + video features + context features)
  - Re-ranking: diversity (avoid similar videos), business rules (boost new creators), seen filter
  - A/B testing: traffic splitting, metric comparison (watch time, completion rate, like rate)
  - Real-time features: recent watch history via Flink, updated in Redis
  - Content moderation: async pipeline (upload → moderate → index)
- Scaling: recommendation service stateless, feature store in Redis, model serving with GPU
- Tradeoffs: engagement vs diversity, real-time vs batch features, recommendation quality vs latency

- [ ] **Step 2: Commit**

```bash
git add docs/system-design/real-world-cases.md
git commit -m "docs: add real-world-cases with flash sale, IM, feed, and video recommendation"
```

---

### Task 13: Final review and cleanup

**Files:**
- Review: all modified and created files in `docs/system-design/`

- [ ] **Step 1: Verify all pages exist and links work**

Run the dev server and check:
```bash
cd docs && npx vitepress dev
```
Visit each page in the sidebar and verify no broken links.

- [ ] **Step 2: Verify consistency across pages**

Check that:
- All pages follow the same structure (概念 → 核心原理 → 面试常问 → 看到什么就先想到这类)
- Cross-references between pages use correct relative links
- No duplicate content across pages (e.g., CAP theory should be referenced, not repeated)
- Index.md concept speed lookup links point to correct pages

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A docs/system-design/
git commit -m "docs: final cleanup for system-design chapter restructuring"
```
