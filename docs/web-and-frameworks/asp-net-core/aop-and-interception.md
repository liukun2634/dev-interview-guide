---
title: ASP.NET Core AOP 与拦截机制
---

# ASP.NET Core AOP 与拦截机制

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--medium">🔥🔥 中频</span>

::: tip 💡 核心要点
和 Spring 不同，**ASP.NET Core 没有内置的方法级 AOP 框架**（没有 `@Aspect`、没有 `@Transactional` 那种动态代理）。它把横切关注点分两层：**全局用中间件（Middleware）、MVC 内部用过滤器（Filter）**。真正的"方法拦截"要靠 `DispatchProxy`、Castle DynamicProxy、装饰器或编译期 Source Generator。面试关键是讲清"为什么没有 AOP，以及用什么替代"。
:::

---

## 横切关注点的三个层次

ASP.NET Core 把"不改业务代码插入通用逻辑"分到不同层次：

| 层次 | 机制 | 粒度 | Spring 对位 |
|------|------|------|------------|
| 全局 | **Middleware** | 每个 HTTP 请求 | Servlet Filter |
| Web 切面 | **Filter** | 每个 Action | HandlerInterceptor |
| 方法级 | 代理 / 拦截器 / Source Generator | 任意方法 | `@Aspect` 动态代理 |

前两层是框架内置、最常用；方法级需要自己引入手段（见后文）。

---

## 中间件：全局横切

中间件是洋葱模型，请求进入和响应返回各执行一次，适合**与具体 Controller 无关**的全局逻辑：异常兜底、请求日志、CORS、HTTPS 重定向、鉴权、限流。

```csharp
public class TimingMiddleware(RequestDelegate next, ILogger<TimingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        await next(context);                  // 调用后续管道
        sw.Stop();
        logger.LogInformation("{Path} 耗时 {Ms}ms",
            context.Request.Path, sw.ElapsedMilliseconds);
    }
}
app.UseMiddleware<TimingMiddleware>();

// 或内联
app.Use(async (ctx, next) => { /* 前置 */ await next(); /* 后置 */ });
```

---

## 过滤器：MVC 切面

过滤器运行在 MVC/Endpoint **内部**，能访问 `Controller`、`Action` 参数、`ModelState`，适合模型校验、授权策略、结果包装。五种过滤器按固定顺序执行：

```
Authorization（授权：最先，决定能不能进）
   → Resource（资源：缓存短路、最早接触请求）
   → [模型绑定] → Action（Action 前后：校验、计时）
   → [执行 Action] → Exception（捕获 Action 异常）
   → Result（结果前后：包装响应、统一格式）
```

```csharp
public class LogActionFilter(ILogger<LogActionFilter> logger) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(
        ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        var sw = Stopwatch.StartNew();
        await next();                         // 执行 Action
        sw.Stop();
        logger.LogInformation("{Action} 耗时 {Ms}ms",
            ctx.ActionDescriptor.DisplayName, sw.ElapsedMilliseconds);
    }
}
```

三种作用范围与注入方式：

```csharp
builder.Services.AddControllers(o => o.Filters.Add<LogActionFilter>()); // 全局
[ServiceFilter(typeof(LogActionFilter))]                                // 控制器/Action 级
```

- `[ServiceFilter]`：过滤器自身从 DI 解析（**能注入依赖**，推荐）
- `[TypeFilter]`：DI 解析构造参数，过滤器本身不需注册
- 直接 `[MyFilter]`：过滤器若需依赖则不能直接 new

---

## 中间件 vs 过滤器

| 维度 | 中间件 | 过滤器 |
|------|--------|--------|
| 所在层 | 全局 HTTP 管道 | MVC / Endpoint 内部 |
| 能否访问 Action / 模型 | ❌ 看不到 MVC 上下文 | ✅ 能访问 Action、参数、ModelState |
| 触发范围 | 每个请求（含静态文件） | 仅匹配到的 MVC Action |
| 典型用途 | 日志、CORS、鉴权、限流、异常兜底 | 模型校验、授权策略、结果包装 |
| Spring 对位 | Servlet Filter | HandlerInterceptor |

**记忆要点**：需要"看见 Controller / Action / 模型"用 **Filter**；与业务无关的全局逻辑用 **Middleware**。

---

## 方法级 AOP 的四种替代

Spring 的 `@Transactional` / `@Cacheable` 靠动态代理拦截方法。ASP.NET Core 没有内置等价物，四种替代：

```csharp
// 方案 1：DispatchProxy（.NET 内置代理）
public class LoggingProxy<T> : DispatchProxy where T : class
{
    private T _target = default!;
    public static T Create(T target)
    {
        var proxy = (Create<T, LoggingProxy<T>>() as LoggingProxy<T>)!;
        proxy._target = target;
        return (proxy as T)!;
    }
    protected override object? Invoke(MethodInfo? m, object?[]? args)
    {
        // 前置 → 调用 → 后置
        return m?.Invoke(_target, args);
    }
}

// 方案 4：装饰器模式（最显式，配合 Scrutor）
public class CachingOrderService(IOrderService inner, IMemoryCache cache) : IOrderService
{
    public Task<Order?> GetAsync(int id)
        => cache.GetOrCreateAsync($"order:{id}", _ => inner.GetAsync(id));
}
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.Decorate<IOrderService, CachingOrderService>();
```

| 方案 | 特点 | 适用 |
|------|------|------|
| **DispatchProxy** | .NET 内置、无第三方 | 轻量拦截 |
| **Castle DynamicProxy** | 最接近 Spring AOP，配 Autofac | 复杂拦截器链 |
| **Source Generator** | 编译期生成、无反射、AOT 友好 | 现代首选趋势 |
| **装饰器 + Scrutor** | 最显式、零魔法 | 单个服务的缓存/重试 |

---

## 为什么不内置 AOP

1. **显式优于隐式**：动态代理是"魔法"，会导致 `@Transactional` 自调用失效这类隐蔽坑；ASP.NET Core 倾向让横切逻辑显式可见。
2. **AOT 友好**：运行时动态代理依赖反射，与 Native AOT 不兼容；编译期 Source Generator 是更现代方向。
3. **管道已够用**：HTTP 层横切用中间件 + 过滤器已覆盖绝大多数场景，真正需要方法级 AOP 的情况较少。

---

## 面试常问 & 怎么答

### Q1: ASP.NET Core 有 AOP 吗？

没有 Spring 那种内置的**方法级 AOP 框架**（无 `@Aspect`、无 `@Transactional` 动态代理）。横切分两层：全局用中间件、MVC 用过滤器；方法拦截靠 `DispatchProxy`、Castle DynamicProxy、装饰器或 Source Generator。

### Q2: 中间件和过滤器有什么区别？

中间件在全局 HTTP 管道、看不到 MVC 上下文，适合日志、CORS、鉴权、限流、异常兜底；过滤器在 MVC 内部、能访问 Action 与模型，适合校验、授权、结果包装。一句话：要"看见 Controller/Action"用过滤器，否则用中间件。对位 Spring 是 Servlet Filter vs HandlerInterceptor。

### Q3: 五种过滤器的执行顺序？

Authorization → Resource → Action → Exception → Result。授权最先（决定能不能进），Resource 可缓存短路，Action 包裹方法执行，Exception 捕获 Action 异常，Result 包裹结果生成。

### Q4: 怎么实现类似 `@Transactional` 的方法拦截？

四种：`DispatchProxy`（内置）、Castle DynamicProxy 拦截器（最接近 Spring）、装饰器 + Scrutor `Decorate`、或直接用 EF Core 的 `DbContext` 事务封装。现代趋势是 Source Generator 编译期生成，避免反射、AOT 友好。

### Q5: 为什么 ASP.NET Core 不内置 AOP？

三个原因：显式优于隐式（避免自调用失效那类坑）、AOT 友好（反射代理不兼容 Native AOT）、管道已够用（中间件 + 过滤器覆盖大多数横切）。

## 看到什么就先想到这类

- 出现 Middleware、`Use...`、洋葱模型。
- 出现 Filter、`IAsyncActionFilter`、`[ServiceFilter]`、过滤器执行顺序。
- 出现 `DispatchProxy`、Castle DynamicProxy、装饰器、Source Generator。
- 出现"ASP.NET Core 有没有 AOP""怎么做方法拦截"。
