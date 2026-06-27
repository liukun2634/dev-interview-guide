---
title: ASP.NET Core 依赖注入
---

# ASP.NET Core 依赖注入（DI）

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
依赖注入是 ASP.NET Core 的**地基**——日志、配置、EF Core、鉴权全部通过内置 DI 容器装配。三个核心考点：**三种生命周期（Singleton / Scoped / Transient）怎么选**、**怎么注册**、**Captive Dependency 陷阱**。与 Spring IoC 的最大区别是"显式注册 + 不自动解决循环依赖 + 容器不做 AOP 代理"。
:::

---

## 为什么需要 DI

和 Spring 一样，DI 解决"硬编码依赖 → 难测试、难替换"的问题：

```csharp
// ❌ 硬编码：自己 new，无法替换、无法 mock
public class OrderService
{
    private readonly SqlOrderRepository _repo = new();
}

// ✅ 注入：依赖接口，由容器注入实现
public class OrderService(IOrderRepository repo)
{
    private readonly IOrderRepository _repo = repo;
}
```

ASP.NET Core 内置轻量 DI 容器（`Microsoft.Extensions.DependencyInjection`），开箱即用，无需像旧 ASP.NET 那样引入 Autofac。

---

## 三种生命周期

| 生命周期 | 注册方法 | 实例数量 | 类比 Spring | 典型用途 |
|---------|---------|---------|------------|---------|
| **Singleton** | `AddSingleton` | 整个应用一个 | `singleton` | 无状态工具、配置、缓存、连接池 |
| **Scoped** | `AddScoped` | 每个请求一个 | `@Scope("request")` | 业务服务、`DbContext`、工作单元 |
| **Transient** | `AddTransient` | 每次解析一个 | `prototype` | 轻量无状态、用完即弃 |

```csharp
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddTransient<IIdGenerator, SnowflakeIdGenerator>();
```

选择口诀：

```
跨请求共享 / 创建昂贵（连接池、缓存）  → Singleton
依赖请求上下文 / 需要 DbContext       → Scoped   ← 业务层默认
完全无状态 / 很轻 / 想隔离每次调用      → Transient
```

**业务 Service 默认 Scoped**——契合"每请求一个工作单元"语义，也和 `DbContext` 生命周期一致。

---

## Captive Dependency 陷阱

::: warning ⚠️ 长生命周期不能持有短生命周期
**Singleton 不能直接依赖 Scoped / Transient**，否则短生命周期对象被"囚禁"成长生命周期：`DbContext`（Scoped）被 Singleton 持有 → 跨请求复用同一上下文 → **并发崩溃 + 数据错乱**。
:::

允许方向（从长到短才安全）：

```
Singleton  →  只能依赖 Singleton
Scoped     →  可依赖 Scoped / Singleton
Transient  →  可依赖任意
```

正确做法：Singleton 里需要 Scoped 时，注入 `IServiceScopeFactory` 手动开作用域：

```csharp
public class CacheWarmer(IServiceScopeFactory scopeFactory)
{
    public async Task WarmAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // 在这个作用域内安全使用 db，离开 using 时 Scoped 服务被释放
    }
}
```

开发环境下 `ServiceProvider` 默认开启 **Scope 校验**（`ValidateScopes`），检测到 Singleton 注入 Scoped 会在启动期直接抛异常。

---

## 注册方式

```csharp
// 1) 按接口注册（最常用）
builder.Services.AddScoped<IOrderService, OrderService>();

// 2) 注册具体类型
builder.Services.AddScoped<OrderService>();

// 3) 工厂注册（自定义构造逻辑）
builder.Services.AddSingleton<IPaymentGateway>(sp =>
    new StripeGateway(sp.GetRequiredService<IConfiguration>()["Stripe:ApiKey"]!));

// 4) 多实现 → 注入 IEnumerable<T> 拿到全部
builder.Services.AddScoped<INotifier, EmailNotifier>();
builder.Services.AddScoped<INotifier, SmsNotifier>();
public class NotificationService(IEnumerable<INotifier> notifiers) { }

// 5) TryAdd —— 已存在则跳过（库作者常用）
builder.Services.TryAddScoped<IOrderService, OrderService>();

// 6) Keyed Services（.NET 8+，按键区分，对标 @Qualifier）
builder.Services.AddKeyedScoped<INotifier, EmailNotifier>("email");
public class OrderHandler([FromKeyedServices("email")] INotifier n) { }
```

---

## 注入方式

构造器注入是唯一正统方式（C# 12 主构造器更简洁）：

```csharp
public class OrderController(IOrderService orderService) : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) => Ok(await orderService.GetAsync(id));
}
```

Minimal API 直接在处理函数参数注入；少数场景用 `[FromServices]` 按方法注入。

需要**手动构造**一个不在容器里的类型、但又想注入它的依赖时，用 `ActivatorUtilities`：

```csharp
var handler = ActivatorUtilities.CreateInstance<ReportHandler>(sp, extraArg);
```

---

## 释放（Disposal）语义

容器会自动 `Dispose` 它创建的、实现了 `IDisposable` 的服务，时机与生命周期绑定：

| 生命周期 | 释放时机 |
|---------|---------|
| Transient / Scoped | 所属 **Scope** 结束时（请求结束 / `using scope` 离开） |
| Singleton | **应用关闭**时（根容器释放） |

::: warning ⚠️ 两个释放坑
- **你自己 new 的对象，容器不负责释放**——容器只管它自己创建的实例。
- **不要把 Scoped 的 `IDisposable` 注入 Singleton**——既是 Captive Dependency，又会延迟到应用关闭才释放，造成资源泄漏。
:::

---

## 与 Spring IoC 的关键差异

| 维度 | Spring IoC | ASP.NET Core DI |
|------|-----------|-----------------|
| Bean 发现 | 组件扫描自动发现 | **显式 `AddXxx` 注册** |
| 默认作用域 | Singleton | 由注册方法决定（无默认） |
| 字段注入 | 支持 `@Autowired` 字段 | **不支持**，只构造器 |
| 循环依赖 | 三级缓存自动解决 | **直接抛异常，鼓励重构** |
| 按名称限定 | `@Qualifier` | Keyed Services（.NET 8+） |
| AOP 代理 | 容器创建时插入代理 | 容器**不做代理**（需额外手段） |

为什么不自动解决循环依赖？ASP.NET Core 团队认为它通常是**设计缺陷**信号，自动"绕过"会掩盖问题，直接抛异常逼你引入中间抽象或事件解耦，长期更健康——这和 Spring"尽量帮你跑起来"的取向不同。

---

## 面试常问 & 怎么答

### Q1: 三种生命周期有什么区别？怎么选？

Singleton 整个应用一个、Scoped 每请求一个、Transient 每次解析新建。无状态工具/缓存用 Singleton，业务 Service 和 `DbContext` 用 Scoped，轻量临时对象用 Transient。**业务层默认 Scoped** 是最常见答案。

### Q2: Singleton 能不能注入 Scoped 服务？

不能直接注入，这叫 **Captive Dependency**：Scoped 对象被长生命周期的 Singleton 一直持有，变相变单例，导致 `DbContext` 跨请求复用、并发出错。正确做法是注入 `IServiceScopeFactory`，用时 `CreateScope()` 手动开作用域。开发环境默认 Scope 校验会直接抛异常。

### Q3: `DbContext` 为什么必须是 Scoped？

它非线程安全，且按请求做"工作单元"（变更跟踪、事务）。注册 Singleton 被多请求共享会并发崩溃、数据错乱；注册 Transient 会让同一请求多个仓储拿到不同上下文、丢失统一事务。Scoped 正好一请求一个。

### Q4: 容器什么时候释放服务？

容器自动 `Dispose` 它创建的 `IDisposable` 服务：Transient/Scoped 在所属 Scope 结束时释放，Singleton 在应用关闭时释放。注意你自己 new 的对象容器不管；别把 Scoped 的 `IDisposable` 注入 Singleton（资源泄漏）。

### Q5: 和 Spring IoC 最大的不同是什么？

三点：① **显式注册**（`AddXxx`，无组件扫描魔法）；② **不自动解决循环依赖**（直接抛异常，逼你重构）；③ **容器不做 AOP 代理**（没有 `@Transactional` 那种方法拦截）。

## 看到什么就先想到这类

- 出现 `AddSingleton` / `AddScoped` / `AddTransient`、生命周期选择。
- 出现 Captive Dependency、`IServiceScopeFactory`、Scope 校验。
- 出现 `IEnumerable<T>` 注入、Keyed Services、`ActivatorUtilities`、Disposal。
- 出现"和 Spring IoC 有什么不同""为什么不自动解决循环依赖"。
