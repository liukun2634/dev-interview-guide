---
title: ASP.NET Core 请求管道与鉴权
---

# ASP.NET Core 请求管道与鉴权

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
请求进入 Kestrel 后，依次流经**中间件管道 → 路由 → 鉴权 → Endpoint（Controller / Minimal API）→ 模型绑定校验**。面试最核心的是说清 `UseRouting → UseAuthentication → UseAuthorization → MapXxx` 的顺序和原因——顺序错了鉴权直接失效。其次是认证（你是谁）与授权（你能不能）的分工。
:::

> 前置：请求先经过（可选）反向代理与 **Kestrel** 服务器，才进入这里的中间件管道。服务器层见 [托管与服务器](./hosting-and-servers)。

---

## 中间件管道：洋葱模型

中间件按注册顺序串成洋葱，请求进入时正序执行、响应返回时逆序执行，**顺序错了会导致鉴权失效或异常无法捕获**。官方推荐顺序：

```csharp
var app = builder.Build();

app.UseExceptionHandler("/error");   // 最外层兜底异常
app.UseHsts();                       // 安全头
app.UseHttpsRedirection();           // HTTPS 重定向
app.UseStaticFiles();                // 静态文件（命中即短路）
app.UseRouting();                    // 路由匹配 Endpoint
app.UseCors();                       // 跨域
app.UseAuthentication();             // 认证：解析你是谁
app.UseAuthorization();              // 授权：判断你能不能
app.UseOutputCache();                // 输出缓存
app.MapControllers();                // 执行 Endpoint

app.Run();
```

::: warning ⚠️ 三条铁律
1. `UseRouting` 在 `UseAuthorization` **之前**——先知道命中哪个 Endpoint，才能读它的 `[Authorize]` 策略。
2. `UseAuthentication` 在 `UseAuthorization` **之前**——先确定身份，才能判断权限。
3. `UseExceptionHandler` 放**最外层**——才能兜住后续所有中间件的异常。
:::

### 自定义中间件与短路

中间件可以**短路**（不调用 `next`，直接返回），也可以条件分支：

```csharp
// 内联中间件：前置 + 后置
app.Use(async (ctx, next) =>
{
    var sw = Stopwatch.StartNew();
    await next();                                   // 不调用 next 即短路
    ctx.Response.Headers["X-Elapsed"] = $"{sw.ElapsedMilliseconds}ms";
});

// 条件分支：只对某类路径启用一段子管道
app.MapWhen(c => c.Request.Path.StartsWithSegments("/admin"),
    branch => branch.UseMiddleware<AdminAuditMiddleware>());

// 终端中间件：命中即结束，不再往后传
app.Run(async ctx => await ctx.Response.WriteAsync("fallback"));
```

`Use`（可继续传递）、`Map`/`MapWhen`（分支）、`Run`（终端）是中间件三种基本形态。

---

## 路由（Endpoint Routing）

`UseRouting` 先匹配出目标 Endpoint，`MapXxx` 再执行。Controller 用特性路由：

```csharp
[ApiController]
[Route("api/[controller]")]              // → api/orders
public class OrdersController : ControllerBase
{
    [HttpGet("{id:int}")]                // GET api/orders/123
    public IActionResult Get(int id) => Ok();

    [HttpGet]                            // GET api/orders?status=paid
    public IActionResult List([FromQuery] string? status) => Ok();

    [HttpPost]                           // POST api/orders
    public IActionResult Create([FromBody] CreateOrderDto dto) => Created("", dto);
}
```

`{id:int}` 是**路由约束**，类型不匹配直接 404，无效请求不进业务层。常用约束还有 `{id:guid}`、`{slug:alpha}`、`{page:min(1)}`。

---

## Controller vs Minimal API

两种编程模型，按场景选：

```csharp
// Controller：分层清晰，适合复杂业务、大团队
[ApiController]
[Route("api/[controller]")]
public class ProductsController(IProductService svc) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> Get(int id)
        => await svc.GetAsync(id) is { } p ? Ok(p) : NotFound();
}

// Minimal API：样板极少，适合微服务、BFF、轻量接口
var products = app.MapGroup("/api/products");
products.MapGet("/{id:int}", async (int id, IProductService svc)
    => await svc.GetAsync(id) is { } p ? Results.Ok(p) : Results.NotFound());
```

| 维度 | Controller | Minimal API |
|------|-----------|-------------|
| 样板代码 | 较多 | 极少 |
| 切面机制 | 完整 5 种 Filter | Endpoint Filter（`AddEndpointFilter`） |
| 适合场景 | 复杂业务、大团队、丰富约定 | 微服务、BFF、高性能轻接口 |
| 对标 | Spring MVC Controller | 类 Express 极简风格 |

Minimal API 的切面是**端点过滤器**：

```csharp
products.MapPost("/", Create)
    .AddEndpointFilter(async (ctx, next) =>
    {
        // 前置校验
        var result = await next(ctx);
        // 后置处理
        return result;
    });
```

---

## 模型绑定与校验

参数从哪来由特性决定：

| 特性 | 来源 | 对标 Spring |
|------|------|------------|
| `[FromBody]` | 请求体 JSON | `@RequestBody` |
| `[FromQuery]` | 查询字符串 | `@RequestParam` |
| `[FromRoute]` | 路由段 | `@PathVariable` |
| `[FromHeader]` | 请求头 | `@RequestHeader` |
| `[FromForm]` | 表单 | `@RequestParam`（表单） |
| `[FromServices]` | DI 容器 | —（自动注入） |

校验用 DataAnnotations，`[ApiController]` 会自动校验并在失败时返回 400 + `ProblemDetails`：

```csharp
public class CreateOrderDto
{
    [Required] public string CustomerName { get; set; } = "";
    [Range(1, 999)] public int Quantity { get; set; }
    [EmailAddress] public string? Email { get; set; }
}
```

无需手写 `if (!ModelState.IsValid)`。复杂规则常用 **FluentValidation** 替代特性。

---

## 认证（你是谁）

认证解析请求凭证、确定身份。最常见是 **JWT Bearer**：

```csharp
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
```

| 认证方案 | 用途 |
|---------|------|
| JWT Bearer | API / 前后端分离（无状态） |
| Cookie | 传统服务端渲染网站（有状态会话） |
| OAuth2 / OpenID Connect | 第三方登录、SSO |

---

## 授权（你能不能）

认证之后，授权判断有没有权限。基于角色最简单，基于策略最灵活：

```csharp
// 基于角色
[Authorize(Roles = "Admin")]
[HttpDelete("{id:int}")]
public IActionResult Delete(int id) => NoContent();

// 基于策略（推荐）
builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
    o.AddPolicy("Over18", p => p.RequireAssertion(
        ctx => int.TryParse(ctx.User.FindFirst("Age")?.Value, out var a) && a >= 18));
});

[Authorize(Policy = "Over18")]
[HttpGet("vip")]
public IActionResult Vip() => Ok();
```

复杂权限可实现 `IAuthorizationHandler` 自定义 Requirement（如资源所有权校验）。

| 概念 | 问题 | 中间件 | Spring 对位 |
|------|------|--------|------------|
| 认证 Authentication | 你是谁？ | `UseAuthentication` | `AuthenticationManager` |
| 授权 Authorization | 你能做什么？ | `UseAuthorization` | `AccessDecisionManager` |

---

## 异常处理与配置

**统一异常**：除了 `UseExceptionHandler`，.NET 8+ 推荐实现 `IExceptionHandler` 把不同异常映射为不同 `ProblemDetails`：

```csharp
public class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            KeyNotFoundException => (404, "Not Found"),
            ValidationException  => (400, "Validation Failed"),
            _                    => (500, "Server Error")
        };
        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsJsonAsync(new ProblemDetails { Title = title }, ct);
        return true;
    }
}
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
```

**配置体系**是分层覆盖的，后加载覆盖先加载，对标 Spring Profiles：

```
appsettings.json → appsettings.{Env}.json → User Secrets → 环境变量 → 命令行（优先级最高）
```

```csharp
// 强类型配置绑定（对标 @ConfigurationProperties）
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
public class TokenService(IOptions<JwtOptions> options) { /* options.Value */ }
```

环境通过 `ASPNETCORE_ENVIRONMENT`（Development / Staging / Production）切换。

---

## 工程化必知

| 能力 | ASP.NET Core 方案 |
|------|------------------|
| 健康检查 | `AddHealthChecks()` + `MapHealthChecks("/health")` |
| 限流 | Rate Limiting 中间件（.NET 7+） |
| 输出缓存 | Output Caching 中间件（.NET 7+） |
| 可观测性 | OpenTelemetry（Trace / Metrics / Logs 一等公民） |
| 弹性 | Polly（重试、熔断、超时、舱壁） |
| API 文档 | Swagger / OpenAPI（.NET 9 内置 OpenAPI） |

---

## 面试常问 & 怎么答

### Q1: 中间件顺序为什么重要？

中间件是洋葱模型，按注册顺序进、逆序出，顺序错会导致功能失效。三条铁律：`UseExceptionHandler` 放最外层才能兜住后续异常；`UseRouting` 在 `UseAuthorization` 之前（先知道命中哪个 Endpoint 才能读其授权策略）；`UseAuthentication` 在 `UseAuthorization` 之前（先确认身份才能判断权限）。

### Q2: `UseRouting` / `UseAuthentication` / `UseAuthorization` 的顺序？

固定 **Routing → Authentication → Authorization**：先路由匹配出 Endpoint，再认证解析"你是谁"，最后授权判断"你能不能"。顺序错了授权读不到 Endpoint 元数据或拿不到身份。

### Q3: Controller 和 Minimal API 怎么选？

Controller 样板多但支持完整 5 种 Filter、约定丰富，适合复杂业务大团队；Minimal API 样板极少、性能略优、切面用 Endpoint Filter，适合微服务、BFF、轻接口。对位上 Controller ≈ Spring MVC，Minimal API ≈ Express 极简风格。

### Q4: 认证和授权的区别？

认证确认**你是谁**（解析 JWT/Cookie 得到身份），授权判断**你能不能**访问（角色/策略）。中间件分别是 `UseAuthentication` 和 `UseAuthorization`，对位 Spring 的 `AuthenticationManager` 和 `AccessDecisionManager`。

### Q5: `[ApiController]` 做了什么？

四件事：自动模型校验（失败返回 400 + `ProblemDetails`）、自动推断参数绑定来源、统一错误格式、要求特性路由。省掉了手写 `if (!ModelState.IsValid)`。

### Q6: 全局异常怎么统一处理？

`UseExceptionHandler` 做兜底；.NET 8+ 推荐实现 `IExceptionHandler` 把不同异常映射为不同 `ProblemDetails` 状态码，配合 `AddExceptionHandler` 注册，比 Spring 的 `@ControllerAdvice` 更靠管道层。

## 看到什么就先想到这类

- 出现 `Use...` 中间件顺序、洋葱模型、`UseExceptionHandler`。
- 出现 `UseRouting` / `UseAuthentication` / `UseAuthorization` 顺序。
- 出现 Controller vs Minimal API、`[ApiController]`、`AddEndpointFilter`。
- 出现 JWT Bearer、Policy 授权、`IExceptionHandler`、配置优先级。
