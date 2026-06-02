---
title: Spring Boot 3 新特性
---

# Spring Boot 3 新特性

Spring 6 / Spring Boot 3 引入了多项重要变化。这些新特性是近年面试中的新增热点。

## 概念

- Spring Boot 3 基于 Spring Framework 6，最低要求 JDK 17。
- 最大的基础变化是从 javax 迁移到 jakarta 命名空间。
- 核心新能力：GraalVM Native Image、虚拟线程、声明式 HTTP 客户端、Observability 体系。

## Jakarta EE 迁移

### javax → jakarta

Spring 6 / Boot 3 全面迁移到 Jakarta EE：

| 原包名 | 新包名 | 影响 |
|--------|--------|------|
| javax.servlet.* | jakarta.servlet.* | Servlet、Filter、HttpServletRequest |
| javax.persistence.* | jakarta.persistence.* | JPA 注解（@Entity、@Table 等） |
| javax.validation.* | jakarta.validation.* | 校验注解（@NotNull、@Valid 等） |
| javax.annotation.* | jakarta.annotation.* | @PostConstruct、@PreDestroy |
| javax.mail.* | jakarta.mail.* | 邮件发送 |

**迁移要做的事：**
1. 全局替换 import（IDE 批量替换 `javax.` → `jakarta.`，注意排除 `javax.crypto`、`javax.net` 等 Java SE 包）
2. 升级第三方库到支持 Jakarta 的版本
3. Tomcat 10+（内置支持 Jakarta）

**为什么要迁移？** Oracle 将 Java EE 转让给 Eclipse 基金会，因商标原因 javax 不能继续使用，改为 jakarta。

## GraalVM Native Image

### AOT 编译 vs JIT 编译

| 对比项 | JIT（传统 JVM） | AOT（Native Image） |
|--------|-----------------|---------------------|
| 编译时机 | 运行时动态编译热点代码 | 构建时提前编译为本地机器码 |
| 启动速度 | 慢（需要加载类、JIT 编译） | ✅ 毫秒级启动 |
| 内存占用 | 高（JVM 开销） | ✅ 低（无 JVM 运行时） |
| 峰值性能 | ✅ 高（JIT 持续优化） | 较低（没有运行时优化） |
| 构建速度 | 快 | 慢（AOT 编译耗时） |
| 包大小 | JAR + JVM | 单个可执行文件 |

### 优势与限制

**优势：**
- 毫秒级启动（50-100ms vs 传统 2-5s）
- 内存占用降低 3-5 倍
- 适合 Serverless（冷启动快）和容器化部署（镜像小）

**限制：**
- 反射需要提前声明（GraalVM 无法分析运行时反射）
- 动态代理受限（需要预配置）
- 部分库不兼容（依赖大量反射的库）
- 构建时间长（分钟级）
- 峰值性能不如 JIT

**适用场景：**

| 场景 | 适合 | 原因 |
|------|------|------|
| Serverless / FaaS | ✅ | 冷启动快 |
| CLI 工具 | ✅ | 即开即用 |
| 微服务（轻量） | ✅ | 内存小、启动快 |
| 长运行服务（计算密集） | ❌ | JIT 峰值性能更好 |
| 大量使用反射的应用 | ❌ | 兼容性问题多 |

### Spring Boot 构建 Native Image

```bash
# Maven
mvn -Pnative spring-boot:build-image

# Gradle
gradle nativeCompile
```

Spring Boot 3 内置了 AOT 引擎，自动处理大部分反射和代理的 GraalVM 配置，大幅降低了 Native Image 的使用门槛。

## 虚拟线程（Project Loom）

### 虚拟线程 vs 平台线程

| 对比项 | 平台线程（传统） | 虚拟线程（JDK 21） |
|--------|-----------------|-------------------|
| 底层 | 1:1 映射 OS 线程 | 多个虚拟线程复用少量 OS 线程 |
| 创建成本 | 高（~1MB 栈空间） | ✅ 低（~几 KB） |
| 数量上限 | 数千（受 OS 限制） | ✅ 数百万 |
| 适用场景 | CPU 密集型 | ✅ I/O 密集型 |
| 调度 | OS 调度 | JVM 调度 |

### Spring Boot 配置

```yaml
# application.yml — 一行开启
spring:
  threads:
    virtual:
      enabled: true
```

开启后，Spring MVC 的请求处理线程、@Async 任务、Tomcat 的线程都会使用虚拟线程。

### 适用场景

**适合：** I/O 密集型服务（Web 请求处理、数据库查询、HTTP 调用、文件读写）

**不适合：** CPU 密集型计算（虚拟线程在 CPU 计算时没有优势）

### 注意事项

```java
// ❌ 避免 synchronized — 会 pin 住载体线程
synchronized (lock) {
    // I/O 操作时载体线程被占用，无法调度其他虚拟线程
    dbQuery();
}

// ✅ 用 ReentrantLock 替代
private final ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    dbQuery();
} finally {
    lock.unlock();
}
```

**为什么 synchronized 有问题？** 虚拟线程在 synchronized 块中执行 I/O 时会"pin"住底层的载体线程（OS 线程），导致载体线程无法服务其他虚拟线程。ReentrantLock 不存在这个问题。

## 声明式 HTTP 客户端（@HttpExchange）

Spring 6 引入的原生声明式 HTTP 客户端，类似 OpenFeign：

```java
// 定义接口
public interface UserClient {
    
    @GetExchange("/users/{id}")
    UserDTO getUser(@PathVariable Long id);
    
    @PostExchange("/users")
    UserDTO createUser(@RequestBody CreateUserRequest request);
    
    @DeleteExchange("/users/{id}")
    void deleteUser(@PathVariable Long id);
}

// 配置（使用 RestClient 作为底层）
@Configuration
public class ClientConfig {
    @Bean
    public UserClient userClient(RestClient.Builder builder) {
        RestClient restClient = builder.baseUrl("http://user-service:8080/api").build();
        return HttpServiceProxyFactory
                .builderFor(RestClientAdapter.create(restClient))
                .build()
                .createClient(UserClient.class);
    }
}
```

### HTTP 客户端对比

| 客户端 | 风格 | 响应模型 | 说明 |
|--------|------|----------|------|
| RestTemplate | 命令式 | 同步 | 旧版，维护模式，不推荐新项目使用 |
| WebClient | 响应式 | 同步 / 异步 | 功能强大，适合响应式或需要非阻塞的场景 |
| RestClient（Boot 3.2+） | 命令式 | 同步 | RestTemplate 的现代替代，流式 API |
| @HttpExchange | 声明式 | 同步 / 异步 | 接口 + 注解，类似 OpenFeign，Spring 原生 |
| OpenFeign | 声明式 | 同步 | Spring Cloud 生态，功能成熟 |

**推荐：** 新项目用 RestClient（简单调用）或 @HttpExchange（声明式），不再用 RestTemplate。

## Observability 体系

Spring Boot 3 统一了可观测性方案：

### 三大支柱

| 支柱 | 工具 | 说明 |
|------|------|------|
| Metrics（指标） | Micrometer | 请求延迟、吞吐量、错误率 |
| Tracing（链路追踪） | Micrometer Tracing | 请求在微服务间的调用链（替代 Spring Cloud Sleuth） |
| Logging（日志） | SLF4J + Logback | 结构化日志，关联 Trace ID |

### Micrometer Observation API

统一的观测 API — 一次注册，同时获得 Metrics 和 Tracing：

```java
// Spring Boot 3 自动为 HTTP 请求、数据库调用等创建 Observation
// 只需引入依赖即可自动获得指标和链路追踪
```

```yaml
# application.yml
management:
  tracing:
    sampling:
      probability: 1.0    # 采样率（生产环境通常 0.1-0.5）
  observations:
    http:
      server:
        requests:
          name: http.server.requests   # 默认指标名
```

### 集成方案

- **Metrics：** Micrometer → Prometheus → Grafana
- **Tracing：** Micrometer Tracing → Zipkin / Grafana Tempo
- **Logging：** Logback → ELK / Loki

**Sleuth 迁移：** Spring Cloud Sleuth 在 Boot 3 中被 Micrometer Tracing 替代。核心概念不变（Trace ID、Span ID），但依赖和配置方式改变。

## ProblemDetail（RFC 9457）

Spring Boot 3 支持标准化的 HTTP 错误响应格式：

```java
// 开启 ProblemDetail
spring.mvc.problemdetails.enabled=true
```

```json
{
  "type": "https://example.com/errors/insufficient-balance",
  "title": "余额不足",
  "status": 422,
  "detail": "账户余额 100.00，转账金额 500.00",
  "instance": "/api/transfers/123"
}
```

可以通过 @ExceptionHandler 返回 ProblemDetail 对象，实现统一且标准化的错误响应。

## Spring AI（2024-2025 重磅新成员）

Spring AI 是 Spring 官方在 2024 年正式 GA 的 AI 集成框架，**让 Java 后端能像调 JPA 一样调 LLM**。2025-2026 年 Java 后端面试**"你怎么在 Spring 里接 LLM？"** 已成为高频问题。

### 为什么需要 Spring AI

| 痛点（裸调 LLM SDK）| Spring AI 解决 |
|------------------|-------------|
| 切 OpenAI / Anthropic / DeepSeek 各家 SDK 不同 | **统一 `ChatClient` 抽象**，切模型改配置即可 |
| RAG 要手写 Embedding + 向量库 + 检索 + Prompt 拼接 | **`VectorStore` + `RetrievalAugmentationAdvisor` 一行接入** |
| Function Calling 各家协议不同 | **`@Tool` 注解 + 自动注册**，跟 `@RestController` 一样 |
| 流式输出要手写 SSE | **`Flux<ChatResponse>` 原生集成 WebFlux** |
| Prompt 模板散落代码各处 | **`PromptTemplate` + 资源文件管理** |

### 核心抽象

```
┌─────────────────────────────────────────┐
│         ChatClient（统一入口）            │
│  .prompt().user("Hello").call().content() │
└─────────────────────────────────────────┘
            │
   ┌────────┼────────┬────────┐
   ↓        ↓        ↓        ↓
┌──────┐┌──────┐┌──────┐┌──────┐
│OpenAI││Claude││DeepSk││Ollama│ ← 切换只改 application.yml
└──────┘└──────┘└──────┘└──────┘
            │
   ┌────────┼────────┬─────────┐
   ↓        ↓        ↓         ↓
┌────────┐┌──────────┐┌──────────┐┌──────────┐
│Embedding││VectorStor││ChatMemory││ToolCallba│
│  Model  ││ (RAG)    ││ (历史)   ││ck (函数) │
└────────┘└──────────┘└──────────┘└──────────┘
```

### 最小示例

```yaml
# application.yml — 切模型只改这里
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-4o
```

```java
@RestController
@RequiredArgsConstructor
public class ChatController {
    private final ChatClient chatClient;  // 自动注入

    @GetMapping("/chat")
    public String chat(@RequestParam String message) {
        return chatClient.prompt()
                .user(message)
                .call()
                .content();
    }

    // 流式 SSE
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> stream(@RequestParam String message) {
        return chatClient.prompt()
                .user(message)
                .stream()
                .content();
    }
}
```

### RAG 一行接入

```java
@Bean
ChatClient chatClient(ChatClient.Builder builder,
                     VectorStore vectorStore) {
    return builder
        .defaultAdvisors(
            // 自动从 vectorStore 检索 → 注入到 Prompt → 调 LLM
            new QuestionAnswerAdvisor(vectorStore, SearchRequest.builder().topK(5).build())
        )
        .build();
}
```

**业务方调用没有任何变化**，但每次请求会自动检索向量库 + 注入上下文——这就是 Spring AI 抽象的威力。

### Tool Calling（@Tool 注解）

```java
@Service
public class OrderTools {
    @Tool(description = "查询订单状态")
    public String getOrderStatus(@ToolParam(description = "订单 ID") String orderId) {
        return orderService.findById(orderId).getStatus();
    }
}

// 注册到 ChatClient
String response = chatClient.prompt()
        .user("帮我查订单 ORD-123 的状态")
        .tools(orderTools)        // ← LLM 自动决定何时调用
        .call()
        .content();
```

LLM 会自动识别"查订单状态"意图 → 解析参数 → 调用方法 → 把结果整合进回答。**完全没有手写 if/else 派发**。

### Spring AI vs LangChain4j 对比

2025 年 Java 圈两大 AI 框架的取舍：

| 维度 | **Spring AI** | LangChain4j |
|------|--------------|-------------|
| **背景** | Spring 官方 | 社区，借鉴 Python LangChain |
| **生态融合** | 与 Spring Boot/Cloud 深度集成 | 独立框架，可在任何 Java 项目 |
| **学习曲线** | 低（Spring 用户秒上手）| 中（独立的 API 风格）|
| **抽象成熟度** | 简洁、Spring 风格 | 概念多（Chain、Agent、Memory 完整移植 LangChain）|
| **适合** | **Spring Boot 项目首选** | 非 Spring 项目、需要复杂 Chain 编排 |

### 何时不用 Spring AI 直接裸调 SDK

| 场景 | 原因 |
|------|------|
| **超高性能需求**（每毫秒延迟敏感）| Spring AI 多一层抽象，~1-2ms 开销 |
| **使用框架未支持的新特性** | 等 Spring AI 跟进可能要数月 |
| **极简一次性脚本** | 引入整套 Spring AI 太重 |

### 面试黄金回答

> **"Spring AI 是 2024 GA 的官方 AI 框架，核心抽象是 ChatClient + VectorStore + ToolCallback，让 Java 后端接 LLM 像写 @RestController 一样自然。**关键价值是统一了 OpenAI / Claude / DeepSeek 的差异、把 RAG 抽象成一个 Advisor、Tool Calling 用 @Tool 注解自动注册**。Spring Boot 项目我会用 Spring AI；如果是非 Spring 项目或需要复杂的 Agent 编排，会选 LangChain4j。"**

详见 [AI 技术 — RAG](../ai-technology/rag) 和 [AI Agent](../ai-technology/ai-agents)。

## 面试常问 & 怎么答

### Q1: Spring Boot 3 有哪些重大变化？

四个核心变化：1) Jakarta 迁移（javax → jakarta）；2) GraalVM Native Image 支持（毫秒级启动、低内存）；3) 虚拟线程支持（JDK 21，I/O 密集型服务性能提升）；4) Observability 统一（Micrometer Tracing 替代 Sleuth）。基础要求从 Java 8 提升到 Java 17。

### Q2: GraalVM Native Image 的优势和限制？

优势：毫秒级启动（50-100ms）、内存降低 3-5 倍、适合 Serverless。限制：反射和动态代理需要预声明、部分库不兼容、构建时间长、峰值性能不如 JIT。适合 Serverless 和轻量微服务，不适合 CPU 密集型长运行服务。

### Q3: 虚拟线程和平台线程的区别？

平台线程 1:1 映射 OS 线程，创建成本高（~1MB），受 OS 限制只能数千个。虚拟线程由 JVM 调度，创建成本极低（~几 KB），可以创建数百万个。适合 I/O 密集型服务。注意避免在虚拟线程中使用 synchronized（会 pin 住载体线程），用 ReentrantLock 替代。

## 看到什么就先想到这类

- 出现 Jakarta、javax → jakarta 迁移。
- 出现 Native Image、AOT、GraalVM。
- 出现虚拟线程、Project Loom、JDK 21。
- 出现 @HttpExchange、声明式 HTTP 客户端。
- 出现 Observability、Micrometer、Tracing。
