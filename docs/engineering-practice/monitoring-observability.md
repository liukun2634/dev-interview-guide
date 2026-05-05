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
