---
title: ASP.NET 概览
---

# ASP.NET 概览

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
ASP.NET Core 是微软的现代跨平台 Web 框架，定位等同于 Java 世界的 Spring Boot。四个支柱：**统一中间件管道、内置依赖注入、高性能 Kestrel 服务器、Minimal API / MVC 双编程模型**。面试主线是讲清一个请求如何从 Kestrel 流经中间件、鉴权、到达 Endpoint——这比孤立背 API 重要得多。
:::

---

## 本专题导航

按"**建立全局 → 理解运行机制 → 进阶与跨栈对比**"组织，建议自上而下读：

| 页面 | 核心内容 | 面试频率 |
|------|---------|---------|
| 概览（本页） | 定位、生态、架构、请求旅程、版本演进 | 🔥🔥🔥 |
| [托管与服务器](./hosting-and-servers) | Kestrel / HTTP.sys / IIS / 反向代理 / 部署 | 🔥🔥🔥 |
| [请求管道与鉴权](./request-pipeline) | 中间件、路由、Controller vs Minimal API、认证授权 | 🔥🔥🔥 |
| [依赖注入 DI](./dependency-injection) | 三种生命周期、注册方式、Scope 陷阱、vs Spring IoC | 🔥🔥🔥 |
| [数据访问与事务](./data-access) | EF Core / Dapper、事务、并发控制、迁移 | 🔥🔥🔥 |
| [AOP 与拦截](./aop-and-interception) | 中间件 / 过滤器 / 代理 / Source Generator | 🔥🔥 |
| [对比 Java Spring](./vs-spring) | 启动、容器、Web、数据访问、生态全面对照 | 🔥🔥🔥 |

---

## ASP.NET Core 是什么

ASP.NET Core 是 .NET 平台上开源、跨平台的 Web 框架，可在 Windows / Linux / macOS 运行。它和 Spring Boot 要解决的根本问题完全一致：**用统一的托管模型、依赖注入和约定优于配置，把 Web 应用的样板代码降到最低。**

它能构建多种应用，对应不同技术栈：

| 应用类型 | 用到的技术 | 类比 Spring |
|---------|-----------|------------|
| Web API（前后端分离） | Controller / Minimal API | Spring MVC `@RestController` |
| 服务端渲染网站 | Razor Pages / MVC Views | Spring MVC + Thymeleaf |
| 实时通信 | SignalR | Spring WebSocket / STOMP |
| 全栈 Web UI | Blazor（Server / WASM） | 无直接对位（偏前端） |
| 高性能 RPC | gRPC | Spring gRPC / Dubbo |
| 后台任务 / 微服务 | Worker Service + .NET Aspire | Spring Boot + Spring Cloud |

### 它和"老 ASP.NET"的区别

面试常问"ASP.NET Core 和 ASP.NET 有什么不同"，三个关键词：**跨平台、统一管道、内置 DI**。

| 维度 | 旧 ASP.NET（.NET Framework） | ASP.NET Core |
|------|----------------------------|--------------|
| 平台 | 仅 Windows + IIS | 跨平台（Linux 容器友好） |
| 运行时 | .NET Framework | .NET 统一运行时 |
| 管道 | `HttpModule` / `HttpHandler` | 统一中间件管道 |
| DI | 需第三方（Autofac 等） | **框架内置 DI** |
| 性能 | 一般 | Kestrel + 异步，TechEmpower 第一梯队 |

一句话：**ASP.NET Core 是把整个框架推倒重写的跨平台高性能版本**，不是简单升级。

---

## 技术栈与生态全景

ASP.NET Core 是一整套生态。下表一次铺清"你会用到什么"，方便建立全局观：

| 领域 | 技术 / 库 | 作用 | Java 对位 |
|------|----------|------|----------|
| Web 服务器 | **Kestrel** / HTTP.sys / IIS | 收发 HTTP 请求 | Tomcat / Netty |
| 编程模型 | **MVC** / **Minimal API** / Razor Pages | 写接口和页面 | Spring MVC |
| 依赖注入 | **内置 DI 容器** | 装配对象 | Spring IoC |
| ORM（全自动） | **Entity Framework Core** | 实体映射、迁移 | Spring Data JPA |
| 数据访问（半自动） | **Dapper** | 手写 SQL 映射 | MyBatis |
| 鉴权 | Authentication / Authorization | JWT / Cookie / OAuth | Spring Security |
| 实时 | **SignalR** | WebSocket 实时推送 | Spring WebSocket |
| 配置 | `IConfiguration` + `appsettings.json` | 分层配置 | `@ConfigurationProperties` |
| 日志 | `ILogger` + Serilog | 结构化日志 | SLF4J / Logback |
| 可观测性 | **OpenTelemetry** | Trace / Metrics / Logs | Micrometer |
| 弹性 | **Polly** | 重试 / 熔断 / 超时 | Resilience4j |
| 反向代理 / 网关 | **YARP** | 自定义网关 | Spring Cloud Gateway |
| 云原生编排 | **.NET Aspire** | 多服务编排、可观测 | Spring Cloud |
| 后台任务 | **BackgroundService** | 定时 / 消费 | `@Scheduled` |
| API 文档 | Swagger / 内置 OpenAPI | 接口文档 | springdoc |

被问"ASP.NET Core 生态"时，按"**服务器 → 编程模型 → DI → 数据 → 鉴权 → 实时 → 可观测 → 云原生**"这条线讲，覆盖面广且有条理。

---

## 整体架构

ASP.NET Core 应用本质是一个 **Host（主机）**，自下而上托管这些分层：

```
              公网请求
                 ↓
【可选】反向代理 Nginx / IIS / YARP（生产推荐）
                 ↓ 内网转发
┌──────────────────────────────────────────────┐
│  应用代码  Controller / Minimal API / Razor    │
├──────────────────────────────────────────────┤
│  横切层    Middleware（全局）+ Filter（MVC 级） │
├──────────────────────────────────────────────┤
│  DI 容器   Singleton / Scoped / Transient      │
├──────────────────────────────────────────────┤
│  Host      配置 / 日志 / 生命周期 / 后台服务    │
├──────────────────────────────────────────────┤
│  Web 服务器 Kestrel / HTTP.sys / IIS           │
│            HTTP/1.1 · HTTP/2 · HTTP/3          │
└──────────────────────────────────────────────┘
```

| 层 | 职责 | 对标 Spring |
|----|------|------------|
| 反向代理 | TLS、限流、负载均衡（可选） | Nginx / Gateway |
| Web 服务器 | 网络 I/O、解析 HTTP | Tomcat / Netty |
| Host | 组装配置、日志、DI、生命周期 | `ApplicationContext` |
| DI 容器 | 管理对象创建与依赖 | Spring IoC |
| 中间件 + 过滤器 | 横切关注点 | Filter + Interceptor + AOP |
| 应用代码 | 具体业务 | Controller / Service |

> 服务器这一层（Kestrel / HTTP.sys / IIS / 反向代理）初学者最易忽略、面试又常问，单独成页：[托管与服务器](./hosting-and-servers)。

---

## 请求处理全景

理解 ASP.NET Core 的最佳方式，是跟踪一个 HTTP 请求的完整旅程：

```
客户端 ─HTTP→ Kestrel（解析协议）
                 ↓
       中间件管道（按注册顺序，洋葱模型）
       UseExceptionHandler → UseHttpsRedirection → UseRouting
       → UseAuthentication → UseAuthorization → MapXxx
                 ↓
       MVC 过滤器（Authorization→Resource→Action→Exception→Result）
                 ↓
       模型绑定 + 校验 → Controller / Minimal API
                 ↓ 调用 Service（DI 注入）→ EF Core / Dapper → DB
                 ↑ 结果 → JSON 序列化
       ↑ 中间件回程（响应阶段）→ Kestrel 写回
客户端
```

三个必记关键点：

- 中间件是**洋葱模型**：每个中间件在请求进入、响应返回时各执行一次。
- **路由在认证之前**：先知道命中哪个 Endpoint，才能读它要求什么权限。
- **过滤器在中间件之后**：过滤器是 MVC/Endpoint 内部更细粒度的切面。

> 每一步在 [请求管道与鉴权](./request-pipeline) 展开。

---

## 最小示例与项目结构

.NET 6+ 用顶级语句的 `Program.cs`，把"配置容器"和"配置管道"写在一起，骨架永远是**建容器 → 配管道 → 跑起来**：

```csharp
var builder = WebApplication.CreateBuilder(args);

// ① 配置 DI 容器（对标 @Configuration / @Bean）
builder.Services.AddControllers();
builder.Services.AddScoped<IOrderService, OrderService>();

var app = builder.Build();

// ② 配置中间件管道（顺序敏感）
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// ③ 注册 Endpoint
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
```

典型分层目录与常用 CLI：

```
MyApi/
├── Program.cs            # 入口：建容器 + 配管道
├── appsettings.json      # 配置（对标 application.yml）
├── Controllers/          # API 入口
├── Services/             # 业务逻辑
├── Models/ (Entities/)   # 领域模型 / EF 实体
├── Data/                 # DbContext + 迁移
└── Dtos/                 # 数据传输对象
```

```bash
dotnet new webapi -n MyApi    # 创建 Web API 项目
dotnet add package <Pkg>      # 加 NuGet 依赖（对标 Maven）
dotnet watch run              # 热重载运行
dotnet publish -c Release     # 发布部署产物
dotnet ef migrations add Init # EF Core 生成迁移
dotnet ef database update     # 应用迁移到数据库
```

---

## 版本演进时间线

.NET 自 5.0 起合并 .NET Core 与 .NET Framework，统一为"**.NET**"，每年 11 月发一个大版本：偶数年（8.0）为 LTS（3 年支持），奇数年为 STS（18 个月）。

| 版本 | 时间 | 类型 | 关键变化 |
|------|------|------|---------|
| .NET Core 1.0 | 2016.06 | — | 首个跨平台版本，重写托管模型、内置 DI、中间件管道 |
| 2.x | 2017–2018 | LTS | Razor Pages、SignalR Core、HttpClientFactory |
| 3.x | 2019 | LTS | Endpoint Routing、gRPC、Worker Service、Blazor Server |
| 5.0 | 2020.11 | STS | **统一品牌为 .NET**、C# 9 |
| **6.0** | 2021.11 | **LTS** | **🔥 Minimal API**、统一 `WebApplication`、顶级语句、C# 10 |
| 7.0 | 2022.11 | STS | Rate Limiting、Output Caching、C# 11 |
| **8.0** | 2023.11 | **LTS** | **🔥 Blazor 统一渲染**、Keyed Services、Native AOT for API、C# 12 |
| 9.0 | 2024.11 | STS | Hybrid Cache、内置 OpenAPI、C# 13 |
| **10.0** | 2025.11 | **LTS** | Aspire 云原生收敛、Minimal API 验证增强、C# 14 |

::: warning ⚠️ 版本高频追问
- **".NET 5 之后为什么不叫 Core 了？"** → 5.0 合并两条线，去掉"Core"避免歧义。
- **"Minimal API 哪个版本引入？"** → .NET 6，对标 Express 的轻量体验。
- **"LTS 怎么选？"** → 生产优先偶数 LTS（6 / 8 / 10）。
- **"Native AOT 是什么？"** → 提前编译为原生镜像，启动快、内存小，类似 Spring 的 GraalVM Native Image。
:::

---

## 核心术语速查

第一次接触容易被名词绕晕，一张表讲清：

| 术语 | 一句话解释 | 类比 |
|------|-----------|------|
| **Host** | 组装服务器、DI、配置、日志并启动的"总管" | `ApplicationContext` |
| **Kestrel** | 默认跨平台 Web 服务器 | Tomcat |
| **Middleware** | HTTP 管道上的处理环节（洋葱模型） | Servlet Filter |
| **Endpoint** | 可被路由命中的处理单元 | 一个 Controller 方法 |
| **Minimal API** | 用极少代码写 HTTP 接口 | —（无直接对位） |
| **Filter** | MVC 内部切面 | HandlerInterceptor |
| **DI 生命周期** | Singleton / Scoped / Transient | singleton / request / prototype |
| **DbContext** | EF Core 的工作单元 + 查询入口 | JPA `EntityManager` |
| **`appsettings.json`** | 主配置文件 | `application.yml` |
| **`ASPNETCORE_ENVIRONMENT`** | 当前环境 | Spring Profiles |

---

## 何时选择 ASP.NET Core

| 适合 ASP.NET Core | 更适合别的方案 |
|------------------|---------------|
| 团队熟 C# / .NET | 团队是 Java / Go / Node 栈 |
| 追求高性能、低内存、快冷启动 | 依赖某些 Java 专属中间件生态 |
| Windows / Azure 云环境 | 深度绑定 Hadoop / Spark 大数据栈 |
| 需要全栈（Blazor）或实时（SignalR） | 纯前端用 React / Vue 已足够 |

被问"和 Spring Boot 怎么选"时，标准答法：**两者设计哲学一致、能力对等，选型主要看团队语言栈和云生态**，技术上没有绝对高下。详见 [对比 Java Spring](./vs-spring)。

---

## 面试常问 & 怎么答

### Q1: ASP.NET Core 和老 ASP.NET 的核心区别？

三个关键词：**跨平台、统一中间件管道、内置 DI**。老 ASP.NET 只能在 Windows + IIS 上跑、用 `HttpModule/HttpHandler`、要靠第三方做 DI；ASP.NET Core 是推倒重写的跨平台高性能版本，Linux 容器友好，性能进入 TechEmpower 第一梯队。

### Q2: 一个请求在 ASP.NET Core 里怎么流转？

Kestrel 解析 HTTP → 中间件管道（洋葱模型，按注册顺序进、逆序出）→ 路由匹配 Endpoint → 认证 → 授权 → MVC 过滤器 → 模型绑定校验 → Controller/Minimal API → Service（DI）→ EF Core/Dapper → DB，再原路返回序列化为 JSON。关键是"路由在认证前、过滤器在中间件后"。

### Q3: Program.cs 的基本结构是什么？

三段：`CreateBuilder` 后**配置 DI 容器**（`builder.Services.AddXxx`）→ `Build()` 后**配置中间件管道**（`app.UseXxx`，顺序敏感）→ **注册 Endpoint**（`MapControllers` / `MapGet`）→ `app.Run()`。记成"建容器 → 配管道 → 跑起来"。

### Q4: ASP.NET Core 和 Spring Boot 怎么选？

设计哲学一致、能力对等，选型看团队栈和云生态：熟 C#、偏 Windows/Azure、要更低内存和更快冷启动选 ASP.NET Core；已有 Java 团队、大数据栈选 Spring。技术上无绝对高下。

## 看到什么就先想到这类

- 出现 `WebApplication.CreateBuilder`、`Program.cs` 顶级语句。
- 出现 Kestrel、中间件管道、Endpoint Routing。
- 出现 Minimal API vs Controller、EF Core / Dapper、SignalR。
- 出现 ".NET Core 和 ASP.NET 区别""和 Spring Boot 怎么选"。
