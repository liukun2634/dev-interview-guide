---
title: 监控与可观测性
---

# 监控与可观测性

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
可观测性由 Metrics、Logs、Traces 三大支柱构成，目标不只是知道"系统挂了"，而是能回答"为什么挂、哪里慢、影响了多少用户"。面试重点：三大支柱的区别、Prometheus 数据模型、四大黄金指标、SLI/SLO/SLA。
:::

---

## 核心概念

### 三大支柱对比

| 支柱 | 特点 | 典型工具 | 适合回答 |
|------|------|----------|----------|
| **Metrics（指标）** | 数值时序数据，聚合效率高，存储紧凑 | Prometheus、InfluxDB、Datadog | 系统整体健康度、趋势分析、告警触发 |
| **Logs（日志）** | 离散文本事件，信息最丰富，存储大 | ELK（Elasticsearch + Logstash + Kibana）、Loki | 错误详情、业务事件、审计追踪 |
| **Traces（链路追踪）** | 跨服务请求路径，关联上下文 | Jaeger、SkyWalking、Zipkin | 调用链耗时、跨服务依赖、慢接口定位 |

### Prometheus 4 种 Metric 类型

| 类型 | 语义 | 典型场景 | 注意事项 |
|------|------|----------|----------|
| **Counter** | 只增不减的累计计数 | HTTP 请求总量、错误总数 | 重启归零，配合 `rate()` 使用 |
| **Gauge** | 可增可减的瞬时值 | 当前 JVM 堆内存、在线用户数 | 直接读取当前值 |
| **Histogram** | 分桶统计 + 累计计数 + 总和 | 请求耗时分布、响应体大小 | 支持计算 P95/P99 分位数 |
| **Summary** | 客户端计算分位数 | 精确分位数场景 | 无法跨实例聚合，建议优先用 Histogram |

### Prometheus 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Prometheus 生态                           │
│                                                                 │
│  ┌──────────────┐    scrape     ┌──────────────────────────┐   │
│  │  应用实例 A   │ ──────────── │                          │   │
│  │  /metrics    │               │    Prometheus Server     │   │
│  └──────────────┘               │                          │   │
│                                 │  ┌────────┐ ┌─────────┐  │   │
│  ┌──────────────┐    scrape     │  │ TSDB   │ │  Rule   │  │   │
│  │  应用实例 B   │ ──────────── │  │ 时序库  │ │ Engine  │  │   │
│  │  /metrics    │               │  └────────┘ └─────────┘  │   │
│  └──────────────┘               │                          │   │
│                                 └──────┬───────────┬───────┘   │
│  ┌──────────────┐    push              │           │           │
│  │  短任务       │ ──────────────       │           │           │
│  │  Pushgateway │               ┌──────▼──────┐ ┌──▼────────┐ │
│  └──────────────┘               │   Grafana   │ │AlertManager│ │
│                                 │   可视化看板  │ │ 告警通知   │ │
│                                 └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### ELK Stack 架构

```
┌──────────────────────────────────────────────────────────────────┐
│                          ELK 日志体系                             │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌────────────┐  │
│  │  应用服务  │   │  应用服务  │   │  应用服务   │   │  应用服务  │  │
│  │  日志文件  │   │  日志文件  │   │  日志文件   │   │  日志文件  │  │
│  └────┬─────┘   └────┬─────┘   └─────┬─────┘   └─────┬──────┘  │
│       │              │               │               │          │
│  ┌────▼──────────────▼───────────────▼───────────────▼──────┐   │
│  │                   Filebeat（轻量日志采集）                   │   │
│  └───────────────────────────┬───────────────────────────────┘   │
│                              │                                   │
│                     ┌────────▼────────┐                         │
│                     │    Logstash     │                         │
│                     │  解析 / 过滤 /  │                         │
│                     │  字段提取 / 转换 │                         │
│                     └────────┬────────┘                         │
│                              │                                   │
│                     ┌────────▼────────┐                         │
│                     │ Elasticsearch   │                         │
│                     │  全文索引 / 存储  │                         │
│                     └────────┬────────┘                         │
│                              │                                   │
│                     ┌────────▼────────┐                         │
│                     │     Kibana      │                         │
│                     │  查询 / 可视化   │                         │
│                     └─────────────────┘                         │
└──────────────────────────────────────────────────────────────────┘
```

### 分布式链路追踪

链路追踪的核心模型：一次完整请求为一个 **Trace**，Trace 由多个 **Span** 组成，Span 之间存在父子关系。

```
Trace ID: abc-123
│
├── Span: API Gateway（0ms ~ 150ms）
│     │
│     ├── Span: Order Service（5ms ~ 80ms）
│     │     │
│     │     ├── Span: MySQL 查询（10ms ~ 40ms）
│     │     └── Span: Redis 查询（42ms ~ 50ms）
│     │
│     └── Span: Inventory Service（85ms ~ 140ms）
│           │
│           └── Span: gRPC 调用（90ms ~ 135ms）
```

- **TraceId**：全局唯一，贯穿整条请求链路
- **SpanId**：当前操作的唯一标识
- **ParentSpanId**：父 Span 标识，构建调用树

### 四大黄金指标

| 指标 | 含义 | 度量方式 | 示例 |
|------|------|----------|------|
| **Latency（延迟）** | 处理请求所需时间 | P50 / P95 / P99 | 接口响应时间 99 分位 < 500ms |
| **Traffic（流量）** | 系统承载的请求量 | QPS / TPS / 带宽 | 每秒 10,000 次 HTTP 请求 |
| **Errors（错误率）** | 失败请求占比 | 5xx 错误率 / 异常率 | HTTP 5xx 错误率 < 0.1% |
| **Saturation（饱和度）** | 资源使用程度 | CPU / 内存 / 队列积压 | CPU 使用率 < 70%，队列积压 < 1000 |

### SLI / SLO / SLA 对比

| 概念 | 全称 | 含义 | 示例 |
|------|------|------|------|
| **SLI** | Service Level Indicator | 衡量服务质量的具体度量指标 | 过去 30 天 HTTP 成功率 = 99.95% |
| **SLO** | Service Level Objective | 对 SLI 设定的内部目标值 | HTTP 成功率 ≥ 99.9%（月度） |
| **SLA** | Service Level Agreement | 与用户签订的合同承诺，违约有赔偿 | 可用性 ≥ 99.5%，否则退款 |

> **错误预算（Error Budget）**：SLO 允许的最大故障时间。月度 SLO 99.9% 意味着每月允许约 43 分钟不可用。

---

## 典型场景与最佳实践

### 场景一：Prometheus + Grafana 监控 Spring Boot 应用

**接入方式：** Spring Boot Actuator + Micrometer 自动暴露 `/actuator/prometheus` 端点。

```yaml
# pom.xml 依赖
# spring-boot-starter-actuator
# micrometer-registry-prometheus

# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

**AlertManager 告警规则示例：**

```yaml
groups:
- name: app-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "错误率超过 1%"
  - alert: HighLatency
    expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 3m
    labels:
      severity: warning
    annotations:
      summary: "P99 延迟超过 1 秒"
  - alert: InstanceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "实例 {{ $labels.instance }} 已下线"
```

**Grafana 看板建议：**
- 使用 Grafana 官方 JVM Micrometer Dashboard（ID: 4701）
- 关键面板：QPS 趋势、P99 延迟、JVM 堆内存、GC 次数、线程池队列积压

---

### 场景二：ELK 日志体系建设

**日志最佳实践 — JSON 结构化 + TraceId 透传：**

```json
{
  "timestamp": "2026-04-20T10:30:00.123Z",
  "level": "ERROR",
  "traceId": "abc123def456",
  "spanId": "7890abcd",
  "service": "order-service",
  "userId": "u_12345",
  "message": "订单创建失败",
  "exception": "java.sql.SQLException: Duplicate entry",
  "duration": 45
}
```

**Logstash 解析配置：**

```ruby
filter {
  json {
    source => "message"
  }
  date {
    match => ["timestamp", "ISO8601"]
    target => "@timestamp"
  }
  if [level] == "ERROR" {
    mutate {
      add_tag => ["error"]
    }
  }
}
```

**Kibana 常用查询：**
- 按 TraceId 查全链路日志：`traceId: "abc123def456"`
- 查某用户最近错误：`userId: "u_12345" AND level: "ERROR"`
- 统计某接口错误数：`message: "订单创建失败" AND @timestamp: [now-1h TO now]`

---

### 场景三：告警设计原则

**告警分级（P0 ~ P3）：**

| 级别 | 含义 | 响应时间 | 通知方式 | 示例 |
|------|------|----------|----------|------|
| **P0** | 核心业务完全不可用 | 立即响应（5 分钟内） | 电话 + 短信 + 钉钉 | 支付服务宕机、数据库主库不可用 |
| **P1** | 核心功能严重降级 | 15 分钟内 | 短信 + 钉钉 | 错误率 > 5%、P99 > 3s |
| **P2** | 非核心功能异常 | 1 小时内 | 钉钉/邮件 | 推荐服务超时、后台任务失败 |
| **P3** | 潜在风险，无立即影响 | 工作时间处理 | 邮件/工单 | 磁盘使用率 > 80%、连接池使用率高 |

**告警抑制与静默：**
- **抑制（Inhibit）**：父告警触发时，自动压制子告警。如服务器宕机时，压制该服务器上所有应用告警。
- **静默（Silence）**：计划发布/变更窗口期间，临时关闭指定告警，避免误报。
- **告警疲劳（Alert Fatigue）**：告警过多导致值班人员忽视，解决方案：合理阈值 + 分级过滤 + 告警聚合。

**健康的告警体系指标：**
- 告警噪音比 < 10%（即每 10 条告警中，真实需要处理的 ≥ 9 条）
- P0/P1 告警平均响应时间 < 10 分钟
- 每周告警总数在可消化范围内（值班人员不超载）

---

## OpenTelemetry 深度

OpenTelemetry（OTel）是 CNCF 顶级项目，2024-2025 年已经成为**可观测领域的事实标准**——统一了 Logs / Metrics / Traces 三大支柱的采集协议。

### 为什么需要 OTel

| 痛点（没 OTel）| 解决（有 OTel）|
|------------|------------|
| 接 Datadog 改一套 SDK，接 New Relic 又改一套 | **一次埋点，多后端导出**（OTLP 协议）|
| Logs/Metrics/Traces 数据孤岛 | 三支柱**共享 TraceID/SpanID** 自动关联 |
| 跨语言、跨服务的链路追踪格式不统一 | **W3C TraceContext** 标准化跨服务传递 |
| Java 应用必须改代码加埋点 | **Java Auto-Instrumentation Agent** 零代码侵入 |

### 核心组件

```
┌──────────────────────────────────────────┐
│  应用 (业务代码 + OTel SDK)               │
│  ├── Tracer / Meter / Logger              │
│  └── Auto-Instrumentation Agent           │
└──────────────────────────────────────────┘
                  ↓ OTLP (gRPC/HTTP)
┌──────────────────────────────────────────┐
│  OTel Collector（可独立部署）              │
│  ├── Receivers: 接收 OTLP / Prometheus    │
│  ├── Processors: 过滤 / 采样 / 批处理     │
│  └── Exporters: 推送给 Backend            │
└──────────────────────────────────────────┘
                  ↓
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Jaeger   │ │Prometheus│ │ Datadog  │
   └──────────┘ └──────────┘ └──────────┘
```

### Trace Propagation：跨服务如何串起来

Trace 能跨服务关联的关键是**Context 通过 HTTP Header 自动传播**。W3C TraceContext 标准定义了两个 Header：

```http
GET /api/order HTTP/1.1
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
            ↑ ver  ↑ trace-id (16 字节)            ↑ span-id     ↑ flags
tracestate: rojo=00f067aa0ba902b7,congo=t61rcWkgMzE
```

- **traceparent**：标识当前请求所在的 trace / span（必传）
- **tracestate**：厂商扩展信息，用于把不同厂商的 Trace 系统连起来

::: tip 💡 面试加分点

能说出**"OTel 用 W3C TraceContext 取代 Zipkin B3 / Jaeger uber-trace-id，成为跨厂商兼容的标准"**——这是了解 2024-2025 趋势的信号。Spring Boot 3 / Spring Cloud 2024 已默认使用 W3C 格式。

:::

### Baggage：跨服务传透的业务数据

Baggage 是和 TraceContext 平行的另一个 Header，用于把**业务上下文**（如 userId、tenantId、experimentId）一路透传到所有下游服务：

```http
baggage: userId=u12345,tenantId=acme,experimentGroup=B
```

**典型用途**：
- **A/B 测试**：用户落在哪个实验组，整条链路都能看到
- **多租户**：把 tenantId 传到 DB 调用做行级隔离
- **业务染色**：在日志/Trace 里按业务维度过滤

::: warning ⚠️ Baggage 不是免费的

Baggage 默认会**附加到所有出向 HTTP 请求**——一个 50 字段的 Baggage 会让每个请求多 1-2KB。生产中要明示**白名单**字段，避免无脑全传。

:::

### 采样策略（生产必懂）

100% 全采集会让 Trace 存储成本爆炸（一个中型服务一天能产生 TB 级 Trace）。OTel 支持三种采样策略：

| 策略 | 时机 | 优势 | 局限 |
|------|------|------|------|
| **Head-based**（头部采样）| Trace 起点决定 | 简单、零开销 | 慢请求/异常无法保证采到 |
| **Tail-based**（尾部采样）| Span 全收完后决定 | 能精准采"慢请求/错误请求"| Collector 需缓存全 Trace |
| **Probabilistic**（概率采样）| 固定百分比 | 实现最简 | 关键 Trace 可能漏 |

**生产推荐**：**头部低采样率（1-5%）+ 尾部规则补充（错误必采、慢请求必采、特定用户必采）**——Datadog / Honeycomb / Tempo 都这么做。

### Java Auto-Instrumentation 零代码接入

OTel Java Agent 通过 Bytecode Instrumentation **不改一行代码**就能采集 Spring、JDBC、HTTP Client、Kafka 等 100+ 库的 Trace：

```bash
java -javaagent:opentelemetry-javaagent.jar \
     -Dotel.service.name=order-service \
     -Dotel.exporter.otlp.endpoint=http://collector:4317 \
     -jar app.jar
```

**何时还需要手动埋点**：业务关键节点（核心算法步骤、关键状态机切换）—— Auto 只采集框架边界，业务内部需要 `Tracer.spanBuilder("step-name").startSpan()` 手工补充。

### OTel Collector 端到端架构（生产必备）

**OTel Collector 是 2026 可观测性中枢——所有遥测数据的"瑞士军刀"。**

```text
   ┌─────────────────────────────────────────────────┐
   │                  App / SDK                       │
   │   (Java Agent / Python OTel SDK / Go SDK)       │
   └──────────────────┬──────────────────────────────┘
                      │ OTLP gRPC/HTTP
                      ↓
   ┌─────────────────────────────────────────────────┐
   │            OTel Agent Collector                  │
   │            (DaemonSet on each Node)              │
   │   ┌──────────┐  ┌──────────┐  ┌──────────┐    │
   │   │ Receivers │→ │Processors │→ │ Exporters │    │
   │   └──────────┘  └──────────┘  └──────────┘    │
   │   • otlp        • batch        • otlp           │
   │   • prom        • memory_limiter • prometheus    │
   │   • filelog     • attributes    • otlphttp       │
   └──────────────────┬──────────────────────────────┘
                      │ OTLP
                      ↓
   ┌─────────────────────────────────────────────────┐
   │       Gateway Collector (Deployment)             │
   │   • tail_sampling                                │
   │   • resource detection                           │
   │   • span metrics                                 │
   └──────────────────┬──────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
   ┌──────┐      ┌──────┐      ┌──────┐
   │Tempo │      │Mimir │      │ Loki │
   │Trace │      │Metric│      │ Log  │
   └──────┘      └──────┘      └──────┘
                      ↓
                  ┌──────┐
                  │Grafana│  ← 统一查询入口
                  └──────┘
```

**两层 Collector 架构（生产推荐）**：

| 层 | 部署形态 | 职责 |
|----|---------|------|
| **Agent**（节点级 DaemonSet）| 每个 K8s Node 一个 | 就近接收应用 OTLP、批处理、限流 |
| **Gateway**（集中 Deployment）| 集群级 N 个副本 | Tail Sampling、富化、路由、写后端 |

**为什么要两层**：
- ① Agent 离应用近，**网络稳定**，应用挂了 Agent 也能托底（disk queue）
- ② Gateway 是 stateful 的（Tail Sampling 需缓存完整 Trace），独立扩展
- ③ 应用只对接 Agent 一种 endpoint，更换后端不影响业务

### Tail-based Sampling 实战配置

**头部采样的根本痛点**：决定采不采时还不知道这条 Trace 会不会出错/慢——结果错误链路常被采漏。

**Tail Sampling 解决**：等所有 Span 收完再决策。

```yaml
# OTel Gateway Collector 配置
processors:
  tail_sampling:
    decision_wait: 30s          # 等 30 秒收齐 Trace
    num_traces: 100000          # 内存缓存 trace 数
    policies:
      # ★ 错误必采
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }

      # ★ 慢请求必采（> 1s）
      - name: latency
        type: latency
        latency: { threshold_ms: 1000 }

      # ★ 特定用户必采（VIP 排障）
      - name: vip-users
        type: string_attribute
        string_attribute:
          key: user.id
          values: [vip_001, vip_002]

      # ★ 其余 1% 概率采样
      - name: random
        type: probabilistic
        probabilistic: { sampling_percentage: 1 }
```

::: warning ⚠️ Tail Sampling 的两个陷阱

> ① **内存爆炸**：所有 Span 入内存等齐 → 1M QPS 集群可能 100GB+ 内存。**对策**：多副本 Gateway + 按 TraceID hash 路由（同 trace 必到同实例）。
> ② **跨实例 Trace 拆分**：默认 OTel Collector **不会**自动把同 trace 的 span 路由到同实例 → 决策会错。**对策**：用 `loadbalancingexporter` 按 traceID 路由。

:::

### Exemplars：指标 → Trace 一键跳转（2024 必知）

**问题**：监控看到 P99 飙到 5 秒，但不知道是**哪条具体请求**导致的。

**Exemplars** = 在 Histogram 指标中**附加一条代表性 Trace 的 TraceID**——Grafana 里点指标点即可跳到对应 Trace。

```text
P99 latency 监控曲线
   ↑
5s ●          ← 这个高点附了 traceID=abc123
   │   ●     ← 这个附了 traceID=xyz456
1s ●●●●●●●●●
   └─────────→
   点 5s 那个点 → Grafana 自动打开 Tempo 显示 trace abc123 的全链路
```

```yaml
# Prometheus 必须开启 Exemplar 支持
storage:
  exemplars:
    max_exemplars: 100000   # 内存中保留 N 条

# Spring Boot 应用配置
management:
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true     # 必须用 histogram（不是 summary）
```

**生产价值**：以前是"看指标 → 猜原因 → 查 Trace"三步，现在是"看指标 → 点 → Trace"一步。

### Span Metrics（Span 自动转指标）

OTel Collector 的 `spanmetrics` connector **自动从 Trace 计算 RED 指标**（Rate / Errors / Duration）——不需要应用代码加埋点：

```yaml
connectors:
  spanmetrics:
    histogram:
      explicit:
        buckets: [10ms, 50ms, 100ms, 500ms, 1s, 5s]

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [spanmetrics, otlp/tempo]  # 同时写 metric 和 trace
    metrics/spans:
      receivers: [spanmetrics]
      exporters: [prometheus]
```

**收益**：每个服务自动有 `http_server_requests_count` / `http_server_request_duration_seconds_bucket` 指标，无需在应用里加 Micrometer。

### eBPF Tracing：零代码全栈观测（2026 兴起）

**OpenTelemetry + eBPF** 让 Trace 采集**完全跳过应用 SDK**——内核直接抓 syscalls。

| 工具 | 特色 |
|------|------|
| **Pixie**（New Relic 开源）| K8s 集群一键安装，自动出 HTTP / MySQL / Redis trace |
| **Beyla**（Grafana 2024）| **Go / Java / Rust / Python 零修改**，eBPF 抓 HTTP/gRPC |
| **OpenTelemetry eBPF Profiler** | 持续 profiling，CPU/内存火焰图 |

**与 SDK 方案对比**：

| 维度 | SDK 接入 | eBPF |
|------|---------|------|
| **代码改动** | 引入 SDK + 配置 | **零改动** |
| **支持语言** | 看 SDK 覆盖 | **不限语言** |
| **业务上下文** | ✅ 应用知道用户/订单 | ❌ 只看协议层 |
| **性能开销** | 1-5% | < 1% |
| **部署位置** | 应用内 | 内核态 |

**2026 趋势**：**SDK + eBPF 混合**——SDK 抓业务上下文，eBPF 补全网络层和未被 instrument 的依赖。

---

## SRE 实践：Error Budget / Runbook / 复盘

可观测性的终极目标不是看监控，而是**用数据驱动可靠性决策**。SRE（Site Reliability Engineering）把这套方法论体系化了。

### Error Budget 驱动发布节奏

错误预算 = `1 - SLO`，是 SRE 最核心的"预算管理"工具：

```
月度 SLO 99.9% (可用性)
→ Error Budget = 0.1% = 43.2 分钟 不可用 / 月

预算用法:
  剩余 > 50% → 大胆发版、做实验
  剩余 20-50% → 正常发版、加强 Review
  剩余 < 20% → 冻结 risky 变更，只允许修复
  剩余 < 0%  → 冻结所有发版直到下月，全员复盘
```

::: tip 💡 SRE 黄金一句

> **"如果团队从不烧光 Error Budget，说明 SLO 设高了（过度浪费可靠性）；如果总是烧光，说明 SLO 设低了或工程能力不足。"**

:::

### 四大黄金信号 vs 用户视角 SLI

Google SRE 提出的"四大黄金信号"（Latency / Traffic / Errors / Saturation）是**服务端视角**——关注实例健康。真正能衡量"用户感受"的是**用户视角 SLI**：

| 视角 | 例子 | 谁会看 |
|------|------|--------|
| **服务端 SLI** | 实例 P99 延迟、CPU 使用率 | 运维 / 平台团队 |
| **用户视角 SLI** | 用户首屏时间、订单创建成功率 | 业务方 / 产品 |
| **业务 SLI** | 每分钟成交单量、支付成功率 | 老板 / 财务 |

**生产建议**：SLO 定在**用户视角 SLI**而非服务端 SLI——服务端 99.99% 但用户首屏 5 秒，业务依然是失败的。

### Runbook（运维手册）

Runbook 是把"故障处理经验"固化为**可执行步骤**的文档。一个好 Runbook 应包含：

```
1. 触发条件: 告警名称 / 表现
2. 影响范围: 哪些用户/业务受影响
3. 严重程度: P0-P3 分级
4. 诊断步骤: 看哪几个面板、查哪几条日志
5. 缓解步骤: 紧急止血操作（限流、回滚、切流）
6. 根因排查: 进阶分析步骤
7. 升级路径: 什么情况通知谁
8. 历史记录: 类似故障的过往复盘链接
```

**演进方向**：从 Markdown → 半自动化（一键执行的脚本）→ **完全自动化**（AIOps + LLM Agent 自动诊断 + 修复）。2025-2026 年这是 SRE 岗位的新热点：**用 LLM 把 Runbook 变成 Agent 的 Skill**。

### 事故复盘（Postmortem）

SRE 文化的核心：**Blameless Postmortem（无责复盘）**。

| 错误的复盘 | 正确的复盘 |
|----------|----------|
| "张三 push 错代码导致故障" | "缺少 Pre-commit Hook 拦截这类错误" |
| 关注**谁错了** | 关注**系统/流程为何让人能犯错** |
| 让人不敢承担 | 让人愿意分享真实信息 |

**复盘模板必含**（参考 Google SRE Book）：
1. **时间线**：精确到分钟，每个动作 + 影响
2. **根因（5 Why）**：连续问 5 个为什么直到结构性原因
3. **影响评估**：业务损失（金额/用户数）+ Error Budget 消耗
4. **What went well / wrong**：避免只盯坏的
5. **Action Items**：每条带 Owner + Deadline + Issue 链接

---

## 面试常问 & 怎么答

**Q：可观测性三大支柱是什么？各自的适用场景？**

> Metrics、Logs、Traces。Metrics 适合趋势监控和触发告警，成本低、查询快；Logs 适合问题诊断，信息最详细但存储成本高；Traces 适合定位跨服务调用中的性能瓶颈。三者互补：Metrics 发现异常 → Traces 定位到哪个服务 → Logs 查看具体错误。

**Q：Prometheus 为什么采用 Pull 模型？和 Push 有什么区别？**

> Pull 模型由 Prometheus 主动拉取，优点是：服务端可控制采集频率、便于发现下线实例（拉不到数据即告警）、应用侧无需关心监控服务地址。Push 模型由应用主动推送，适合短生命周期任务（批处理作业），Prometheus 通过 Pushgateway 支持 Push。实际场景中 Pull 是主流，Push 作为补充。

**Q：线上出现慢接口，如何排查？**

> 排查路径：Metrics → Traces → Logs。
> 1. 先看 Grafana 看板，确认哪个接口 P99 异常升高，确定时间范围。
> 2. 用 Jaeger/SkyWalking 查该接口的 Trace，找到耗时最长的 Span（是数据库、缓存还是下游服务）。
> 3. 根据 TraceId 在 Kibana 查对应日志，看是否有慢 SQL 打印、锁等待、连接池耗尽等报错。
> 4. 结合具体原因优化：加索引、加缓存、异步化、或扩容。

**Q：SLI、SLO、SLA 的区别？**

> SLI 是具体度量指标（如可用性 = 成功请求数 / 总请求数）；SLO 是内部对 SLI 设定的目标（如可用性 ≥ 99.9%）；SLA 是对外签订的合同承诺，违约需要赔偿。通常 SLA < SLO，留出 Buffer。错误预算 = 1 - SLO，是团队控制发布节奏的重要依据：预算充足可以多发版，预算消耗殆尽则冻结变更。

---

## 常见陷阱

| 陷阱 | 问题描述 | 正确做法 |
|------|----------|----------|
| **告警疲劳（Alert Fatigue）** | 告警过多、阈值不合理，值班人员习惯性忽略 | 合理设定阈值 + 分级管理 + 告警聚合 + 定期复盘告警质量 |
| **日志不带 TraceId** | 日志散乱，无法关联同一请求的完整上下文 | 接入分布式追踪框架（如 SkyWalking），统一日志格式，通过 MDC 透传 TraceId |
| **只看平均值不看分位数** | 平均延迟 50ms 看似正常，但 P99 可能高达 5s，影响大量用户 | 监控和告警使用 P95/P99 分位数，Histogram 类型配合 `histogram_quantile()` 计算 |

---

## 看到什么就先想到这类

- **"监控 / 告警 / 指标"** → Prometheus + Grafana
- **"日志收集 / 分析"** → ELK Stack（Filebeat + Logstash + Elasticsearch + Kibana）
- **"请求链路 / 调用链"** → Jaeger / SkyWalking / Zipkin
- **"P99 / 延迟分布"** → Histogram / Summary，`histogram_quantile(0.99, ...)`
- **"SLO / 可用性目标"** → 四大黄金指标 + 错误预算
- **"短生命周期任务监控"** → Pushgateway
- **"日志关联排查"** → TraceId + Kibana 全文检索
