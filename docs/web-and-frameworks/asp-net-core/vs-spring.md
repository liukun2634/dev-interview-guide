---
title: ASP.NET Core vs Java Spring
---

# ASP.NET Core vs Java Spring

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
ASP.NET Core 与 Spring Boot 是两大生态里**定位完全对等**的框架：都靠"依赖注入 + 约定优于配置 + 统一托管模型"解决 Web 样板问题。差异主要是**语言运行时**和**横切机制实现方式**，而非设计哲学。掌握这张对照表，跨栈面试能快速迁移知识。
:::

---

## 一句话对位

| Spring 概念 | ASP.NET Core 对位 | 说明 |
|------------|------------------|------|
| Spring Framework | .NET 运行时 + DI | 底层容器与编程模型 |
| Spring Boot | ASP.NET Core（Host） | 约定优于配置、自动装配、内嵌服务器 |
| Spring MVC | ASP.NET Core MVC | Controller、模型绑定、过滤器 |
| Spring WebFlux | —（用 async/await 原生异步） | .NET 全栈异步，无独立响应式栈 |
| Spring Cloud | .NET Aspire / Steeltoe / YARP | 微服务编排、网关、配置 |
| Spring Data JPA | Entity Framework Core | 全自动 ORM |
| MyBatis | Dapper | 半自动 SQL 映射 |
| Spring Security | Authentication / Authorization | 认证授权 |
| Tomcat / Netty | Kestrel | 内嵌 Web 服务器 |
| Maven / Gradle | NuGet + `dotnet` CLI | 构建与依赖管理 |

---

## 启动与托管模型

```java
// Spring Boot：组件扫描自动发现 Bean
@SpringBootApplication
public class App {
    public static void main(String[] args) { SpringApplication.run(App.class, args); }
}
```

```csharp
// ASP.NET Core：显式注册服务
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddScoped<IOrderService, OrderService>();
var app = builder.Build();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

| 维度 | Spring Boot | ASP.NET Core |
|------|-------------|--------------|
| Bean 发现 | 组件扫描（`@Component` 自动发现） | **显式注册**（`AddXxx`，无扫描魔法） |
| 配置入口 | 注解 + `application.yml` | `Program.cs` 顶级语句 |
| 自动装配 | `AutoConfiguration.imports` | NuGet 包的 `AddXxx()` 扩展方法 |
| 启动哲学 | 约定为主、注解驱动、有"魔法" | **显式为主**、代码即配置 |

Spring 偏"约定 + 注解扫描"（少写代码但有魔法），ASP.NET Core 偏"显式注册"（多写一行 `AddScoped`，但依赖关系一目了然、易排查）。

---

## 依赖注入对比

| 维度 | Spring IoC | ASP.NET Core DI |
|------|-----------|-----------------|
| 默认作用域 | Singleton | 由注册方法决定 |
| 作用域种类 | singleton / prototype / request / session | Singleton / Scoped / Transient |
| "每请求一个" | `@Scope("request")` | **Scoped**（最常用） |
| 注入方式 | 字段 / 构造器 / Setter | **构造器为主** |
| 按名称限定 | `@Qualifier` | **Keyed Services**（.NET 8+） |
| 循环依赖 | 三级缓存自动解决 | **不支持，直接抛异常** |

最大区别：Spring 默认 Singleton 且能用三级缓存自动解决字段循环依赖；ASP.NET Core 没有默认作用域、循环依赖直接抛异常逼你重构。详见 [依赖注入 DI](./dependency-injection)。

---

## 横切关注点（AOP）对比

实现机制差异最大的地方：

| 横切场景 | Spring | ASP.NET Core |
|---------|--------|--------------|
| 全局请求拦截 | Servlet Filter | **Middleware** |
| Web 层切面 | HandlerInterceptor | **Filter**（5 种） |
| 方法级 AOP | `@Aspect` + 动态代理 | **无内置**，靠 Filter / DispatchProxy / Source Generator |
| 声明式事务 | `@Transactional`（AOP 代理） | EF Core `SaveChanges` 隐式事务 / 手动事务 |
| 声明式缓存 | `@Cacheable`（AOP 代理） | `IMemoryCache` / 装饰器（非注解魔法） |

Spring 的 AOP 建立在**运行时动态代理**之上（也是 `@Transactional` 自调用失效的根因）；ASP.NET Core **没有等价的方法级 AOP 框架**，靠中间件 + 过滤器组合或代理库。详见 [AOP 与拦截](./aop-and-interception)。

---

## Web / 数据访问对比

| 维度 | Spring MVC | ASP.NET Core MVC |
|------|-----------|------------------|
| 前端控制器 | `DispatcherServlet` | 中间件 + Endpoint Routing |
| 控制器 | `@RestController` | `[ApiController]` + `ControllerBase` |
| 路由 | `@GetMapping` | `[HttpGet]` / Minimal API `MapGet` |
| 参数绑定 | `@RequestBody` / `@RequestParam` | `[FromBody]` / `[FromQuery]` |
| 校验 | `@Valid` + Bean Validation | DataAnnotations / FluentValidation |
| 全局异常 | `@ControllerAdvice` | `IExceptionHandler` / 异常中间件 |
| 轻量接口 | 无官方等价 | **Minimal API** |

| 维度 | Spring | ASP.NET Core |
|------|--------|--------------|
| 全自动 ORM | Spring Data JPA / Hibernate | **Entity Framework Core** |
| 半自动 SQL | MyBatis | **Dapper** |
| 迁移 | Flyway / Liquibase | **EF Core Migrations**（内置） |
| 查询 | JPQL 字符串 | **LINQ**（强类型编译期检查） |

---

## 生态与性能对比

| 能力 | Spring 生态 | .NET 生态 |
|------|------------|----------|
| 服务编排 | Spring Cloud | **.NET Aspire** / Steeltoe |
| 网关 | Spring Cloud Gateway | **YARP** |
| 熔断限流 | Sentinel / Resilience4j | **Polly** + Rate Limiting 中间件 |
| 可观测性 | Micrometer + OpenTelemetry | **OpenTelemetry**（一等公民） |

| 维度 | Spring（JVM） | ASP.NET Core（.NET） |
|------|--------------|---------------------|
| 异步模型 | Servlet 阻塞 + 虚拟线程 / WebFlux | **async/await 全栈异步**（语言级） |
| 启动速度 | 较慢（GraalVM Native 可加速） | 快（Native AOT 可再加速） |
| 内存占用 | 较高 | 较低 |
| 原生镜像 | GraalVM Native Image | **Native AOT** |

---

## 速记总表

| 你在 Spring 里用 | 在 ASP.NET Core 里就是 |
|-----------------|----------------------|
| `@Component / @Service` | `AddScoped<IFoo, Foo>()` |
| `@Autowired` | 构造器注入 |
| `@RestController` | `[ApiController]` |
| `@GetMapping` | `[HttpGet]` / `MapGet` |
| `@Transactional` | `DbContext` 事务 / 手动事务 |
| `@ControllerAdvice` | `IExceptionHandler` / 异常中间件 |
| Servlet Filter | Middleware |
| HandlerInterceptor | MVC Filter |
| `application.yml` | `appsettings.json` |
| Spring Profiles | `ASPNETCORE_ENVIRONMENT` |
| Tomcat | Kestrel |
| Maven / Gradle | `dotnet` CLI + NuGet |

---

## 面试常问 & 怎么答

### Q1: ASP.NET Core 和 Spring Boot 怎么选？

两者设计哲学一致、能力对等（都靠 DI + 约定优于配置 + 内嵌服务器），技术上无绝对高下。选型看**团队语言栈和云生态**：已有 Java 团队、大数据栈选 Spring；偏 Windows/Azure、追求更低内存和更快冷启动、团队熟 C# 选 ASP.NET Core。

### Q2: 两者依赖注入最大的区别？

三点：Spring 靠**组件扫描**自动发现 Bean，ASP.NET Core 要**显式 `AddXxx` 注册**；Spring 默认 Singleton，ASP.NET Core 无默认作用域；Spring 三级缓存自动解决字段循环依赖，ASP.NET Core **直接抛异常**逼你重构。

### Q3: 为什么 ASP.NET Core 没有 `@Transactional`？

因为它**没有内置方法级 AOP**（不做运行时动态代理）。事务用 EF Core 的 `DbContext`（`SaveChanges` 隐式事务或显式 `BeginTransaction`）或装饰器封装。这也避免了 Spring `@Transactional` 自调用失效那类坑。

### Q4: Spring 各组件在 .NET 里对应什么？

Spring Boot ≈ ASP.NET Core Host；Spring MVC ≈ ASP.NET Core MVC；JPA ≈ EF Core，MyBatis ≈ Dapper；Spring Security ≈ Authentication/Authorization；Tomcat ≈ Kestrel；Spring Cloud ≈ Aspire/YARP/Polly；Maven ≈ `dotnet` CLI + NuGet。

## 看到什么就先想到这类

- 出现"ASP.NET Core vs Spring Boot 怎么选"。
- 出现组件扫描 vs 显式注册、循环依赖处理差异。
- 出现"为什么没有 @Transactional""EF Core 怎么管事务"。
- 出现 Spring 概念要求给出 .NET 对位（Kestrel / EF Core / Dapper / YARP）。
