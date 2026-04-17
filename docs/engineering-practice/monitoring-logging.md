---
title: 监控与日志
---

# 监控与日志

## 概念

**监控（Monitoring）** 是对系统运行状态的持续观测，目标是在问题发生时及时发现并告警。**日志（Logging）** 是系统运行过程中产生的事件记录，用于事后排查和审计。**链路追踪（Tracing）** 则是对一次请求在分布式系统中完整调用链的记录。

三者共同构成**可观测性（Observability）**体系——不只是知道系统"挂了"，而是能回答"为什么挂"、"哪里慢"、"影响了多少用户"。

可观测性的核心价值：

- **主动发现**：在用户投诉前发现异常
- **快速定位**：缩短 MTTR（平均恢复时间）
- **容量规划**：基于历史数据预测资源瓶颈
- **业务洞察**：从技术指标映射到业务影响

---

## 核心原理

### 1. 可观测性三大支柱

| 支柱 | 特点 | 典型工具 |
|------|------|----------|
| **Metrics（指标）** | 聚合数值，适合趋势分析和告警 | Prometheus、InfluxDB |
| **Logging（日志）** | 离散事件，适合详细排查 | ELK Stack、Loki |
| **Tracing（链路追踪）** | 请求全链路，适合分布式定位 | Jaeger、Zipkin、SkyWalking |

三者互补而非替代。实际排查流程通常是：指标告警触发 → 日志定位错误细节 → 链路追踪确认调用瓶颈。

---

### 2. 监控体系

#### Prometheus

Prometheus 是目前最主流的指标监控方案，采用 **Pull 模型**——由 Prometheus Server 主动拉取各服务暴露的 `/metrics` 端点，而非服务主动推送。

Pull 模型的优势：
- 服务端无感知，采集频率由监控系统控制
- 便于发现服务宕机（拉不到数据即为异常）
- 配置集中管理

**四种指标类型：**

```
Counter（计数器）
  - 只增不减，重启归零
  - 适合：请求总数、错误总数、任务完成数
  - 示例：http_requests_total

Gauge（仪表盘）
  - 可增可减的瞬时值
  - 适合：当前连接数、内存使用量、队列长度
  - 示例：memory_usage_bytes

Histogram（直方图）
  - 采样并统计分布，按桶（bucket）划分
  - 适合：请求延迟分布、响应体大小
  - 自动生成 _bucket、_sum、_count 三个时间序列
  - 可计算百分位（需在服务端聚合）

Summary（摘要）
  - 直接在客户端计算百分位数（如 p50/p95/p99）
  - 适合：精确百分位需求，但不支持跨实例聚合
```

**PromQL 核心语法示例：**

```promql
# 最近 5 分钟请求错误率
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# p99 延迟（Histogram）
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# 某服务内存使用超过 80%
(container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.8
```

#### Grafana

Grafana 负责指标的可视化与告警：

- **仪表盘**：将 PromQL 查询结果以折线图、热力图、表格等形式展示
- **告警规则**：基于查询表达式设置阈值，触发时通知（钉钉/企微/PagerDuty）
- **数据源**：支持 Prometheus、Loki、InfluxDB、Elasticsearch 等多种后端

#### 监控维度划分

```
基础设施监控
  CPU 使用率、内存、磁盘 I/O、网络带宽、节点存活

应用监控
  JVM 堆内存、GC 频率、线程池大小、数据库连接池、缓存命中率

业务监控
  订单成功率、支付转化率、用户登录失败次数、核心接口 SLA
```

#### RED 方法 vs USE 方法

**RED 方法**（适合面向用户的服务）：

| 维度 | 含义 | 示例指标 |
|------|------|----------|
| **R**ate | 每秒请求数 | `rate(requests_total[1m])` |
| **E**rror | 错误率 | 5xx 比例 |
| **D**uration | 延迟分布 | p50/p95/p99 |

**USE 方法**（适合基础设施资源）：

| 维度 | 含义 | 示例 |
|------|------|------|
| **U**tilization | 资源利用率 | CPU 使用率 70% |
| **S**aturation | 饱和度（排队等待） | CPU 运行队列长度 |
| **E**rrors | 错误数 | 磁盘读写错误次数 |

---

### 3. 日志体系

#### 日志级别

```
TRACE   最细粒度，逐行追踪，生产环境不开启
DEBUG   调试信息，开发/测试环境使用
INFO    关键业务节点，如"订单创建成功"
WARN    可恢复的异常，如重试、降级触发
ERROR   需要人工介入的错误，必须配合堆栈
FATAL   系统级致命错误，进程即将退出
```

生产环境通常设置为 INFO 级别，只在排查问题时临时调低。

#### ELK Stack

ELK 是目前最成熟的日志采集、存储、查询方案：

```
E — Elasticsearch   分布式搜索引擎，存储和检索日志
L — Logstash        日志处理管道，解析/过滤/转换
K — Kibana          Web UI，日志查询、可视化、仪表盘
```

#### 日志采集架构

```
应用进程
  ↓ 写文件 / stdout
Filebeat（轻量采集器，部署在每台机器）
  ↓ 推送
Kafka（削峰缓冲，防止 ES 写入压力过大）
  ↓ 消费
Logstash（解析 JSON、字段提取、脱敏）
  ↓ 写入
Elasticsearch
  ↓ 查询
Kibana
```

引入 Kafka 的原因：日志量在流量高峰时可能突增 10 倍以上，Kafka 作为缓冲层可以保护 Elasticsearch 不被压垮，同时 Logstash 可以按消费能力平滑处理。

#### 结构化日志

**非结构化（不推荐）：**
```
2024-01-15 10:23:45 ERROR User login failed for user123 from 192.168.1.1
```

**结构化 JSON（推荐）：**
```json
{
  "timestamp": "2024-01-15T10:23:45.123Z",
  "level": "ERROR",
  "service": "auth-service",
  "traceId": "abc123def456",
  "userId": "user123",
  "event": "login_failed",
  "reason": "invalid_password",
  "clientIp": "192.168.1.1",
  "duration_ms": 45
}
```

结构化日志的优势：直接被 Elasticsearch 解析为字段，支持精确查询和聚合统计。

#### 日志最佳实践

- **不打敏感信息**：密码、手机号、身份证、银行卡号必须脱敏或不记录
- **用 traceId 串联**：每个请求生成唯一 traceId，通过 MDC（日志上下文）自动注入所有日志行，跨服务调用通过 HTTP Header 传递
- **日志分级分文件**：error 单独落一个文件，便于告警脚本监控
- **避免日志爆炸**：循环内日志加采样或频率限制
- **记录关键业务节点**：请求入口、外部调用、状态变更、异常分支

---

### 4. 链路追踪

#### 核心概念

```
Trace（链路）
  一次完整的用户请求，从入口到所有下游调用的全局视图
  由全局唯一的 traceId 标识

Span（跨度）
  链路中的一个操作单元（一次 RPC 调用、一次 DB 查询）
  包含：操作名、开始时间、持续时间、标签（tags）、日志

SpanContext（跨度上下文）
  在服务间传递的最小信息集合
  包含：traceId + spanId + 采样标志
  通过 HTTP Header（W3C TraceContext: traceparent）或消息队列元数据传递
```

一个典型的 Trace 结构：

```
[前端 API Gateway] ──── traceId: abc123 ────────────────────────────── 总耗时: 230ms
  ├── [用户服务] span: get_user           5ms
  ├── [订单服务] span: create_order      180ms
  │     ├── [数据库] span: db_insert      120ms   ← 瓶颈
  │     └── [库存服务] span: deduct_stock  50ms
  └── [消息服务] span: send_notification  10ms
```

#### OpenTelemetry

OpenTelemetry（OTel）是 CNCF 推出的可观测性标准，统一了 Metrics/Logs/Traces 的数据模型和采集 SDK：

- **厂商中立**：一套 SDK，数据可导出至 Jaeger、Prometheus、Datadog 等任意后端
- **自动插桩**：对主流框架（Spring Boot、gRPC、数据库驱动）提供零代码自动埋点
- **统一语义规范**：标准化字段名（如 `http.method`、`db.statement`）

#### 主流工具对比

| 工具 | 特点 | 适用场景 |
|------|------|----------|
| **Jaeger** | CNCF 项目，与 OTel 原生集成 | 云原生、Kubernetes 环境 |
| **Zipkin** | Twitter 开源，简单轻量 | 中小规模系统 |
| **SkyWalking** | Apache 项目，国内社区活跃，支持 Java Agent 无侵入 | 国内 Java 技术栈 |

#### 采样策略

全量采集成本极高，生产环境必须采样：

```
头部采样（Head-based Sampling）
  在请求入口决定是否采样，简单高效
  缺点：出问题时可能刚好没采到

尾部采样（Tail-based Sampling）
  收集完整 Trace 后，根据结果决定是否保留
  可保留所有错误和慢请求，但内存占用高

常见策略：
  - 正常请求：1% 采样
  - 错误请求：100% 保留
  - 慢请求（>1s）：100% 保留
```

---

### 5. 告警设计

#### 告警分级

| 级别 | 含义 | 响应要求 | 示例 |
|------|------|----------|------|
| **P0** | 核心业务中断，直接影响营收 | 立即响应，5 分钟内 | 支付接口全部 5xx |
| **P1** | 核心功能异常，部分用户受影响 | 15 分钟内 | 下单成功率跌破 95% |
| **P2** | 非核心功能降级或潜在风险 | 工作时间内处理 | 推荐服务响应变慢 |
| **P3** | 优化项，不影响用户体验 | 下个迭代排期 | 某日志量异常增长 |

#### 告警收敛

原始告警不加处理会产生大量噪音，需要三类机制：

```
抑制（Inhibition）
  高级别告警触发时，自动压制相关低级别告警
  示例：数据库宕机时，抑制所有依赖该库的服务超时告警

聚合（Aggregation）
  同类告警合并为一条通知
  示例：同一集群 50 个 Pod 同时 OOM，聚合为"XX 集群内存告警 ×50"

静默（Silence）
  变更窗口期间临时屏蔽预期内的告警
  示例：发布部署期间静默重启相关告警 10 分钟
```

Prometheus Alertmanager 原生支持以上三种机制。

#### On-call 流程

```
1. 告警触发 → 通知一线 On-call（钉钉/短信/电话）
2. 一线确认 → 判断影响范围，决定是否升级
3. 超时未确认 → 自动升级至备份 On-call 或 Team Lead
4. 处理中 → 及时更新状态，避免重复响应
5. 故障恢复 → 发布故障复盘（Post-mortem）
6. 复盘跟进 → 根因分析、改进措施、防止复发
```

---

## 面试常问 & 怎么答

**Q1: 你们的监控体系是怎么搭建的？**

答题思路：按三大支柱分层回答，体现完整性。

> 我们的监控体系分三层。指标层用 Prometheus + Grafana，覆盖基础设施（CPU/内存/网络）、应用（JVM/线程池/缓存命中率）和业务（下单成功率/接口 SLA）三个维度，告警走 Alertmanager 接钉钉群。日志层用 ELK，日志经 Filebeat 采集后经 Kafka 缓冲再到 Elasticsearch，全部用 JSON 结构化格式，每条日志携带 traceId。链路追踪用 SkyWalking，Java 服务用 Agent 无侵入接入，可以在 Kibana 查完日志后直接跳转到对应 Trace 看调用链。告警按 P0-P3 分级，核心业务 5 分钟响应，配有 Alertmanager 聚合和抑制规则降低噪音。

---

**Q2: 线上出问题了怎么排查？日志和链路追踪怎么配合？**

答题思路：给出清晰的排查 SOP，体现工具协同。

> 标准排查流程：首先看 Grafana 大盘，确认是哪个服务、哪个接口的指标异常（错误率/延迟），缩小范围。然后到 Kibana 按 traceId 或 service + time 范围搜日志，找到具体的 ERROR 堆栈或异常分支。如果是分布式链路问题（某个下游慢），再去 SkyWalking 输入 traceId 查完整调用链，看哪个 Span 耗时最长。traceId 是关键纽带——日志里有 traceId，Trace 系统里也有，可以双向跳转。日志适合看"发生了什么"，链路追踪适合看"哪里慢了多少"，两者结合能快速定位根因。

---

**Q3: Prometheus 和 ELK 分别解决什么问题？**

答题思路：从数据模型和使用场景本质区分，避免泛泛而谈。

> 两者解决的是不同维度的问题。Prometheus 处理的是**时序指标**，数据高度聚合（如"最近 1 分钟的 QPS"），存储成本低，适合趋势分析、告警和容量规划，但不保留原始事件细节。ELK 处理的是**离散日志事件**，每条日志保留完整上下文，适合根因排查和审计，但存储成本高、不适合做实时聚合告警。实际使用中往往互补：Prometheus 告警发现"有问题"，ELK 日志告诉你"具体哪里出了什么问题"。类比来说，Prometheus 是体检报告的汇总数值，ELK 是每次就诊的详细病历记录。

---

## 看到什么就先想到这类

| 触发词 | 关联知识点 |
|--------|-----------|
| 系统变慢、接口超时 | RED 方法 → Prometheus 查 Duration 指标 → SkyWalking 找慢 Span |
| 排查线上 Bug | traceId 串联 → Kibana 搜日志 → 看 ERROR 堆栈 |
| CPU/内存飙高 | USE 方法 → 基础设施监控 → 容量规划 |
| 日志量暴增 | 日志级别配置、采样、日志爆炸防护 |
| 告警风暴 | 告警收敛 → 抑制/聚合/静默 → Alertmanager |
| 分布式系统调用链 | OpenTelemetry → Trace/Span → Jaeger/SkyWalking |
| 发布变更期间告警 | 静默（Silence）机制 |
| 数据不一致/审计 | 结构化日志 + 日志保留策略 + Elasticsearch |
| 第三方接口依赖 | 链路追踪中的外部 Span + 超时/错误率监控 |
| 用户投诉但监控没报警 | 业务监控盲区 → 补充业务层指标 → 告警阈值复盘 |
