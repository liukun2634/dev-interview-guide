---
title: C# 与 .NET 现代特性
---

# C# 与 .NET 现代特性（.NET 8/9 + C# 12/13）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**.NET 已从微软专属变全平台开源**。2026 大厂（尤其外企 / Azure 系）面试**必问**：**async/await 与 ConfigureAwait**、**LINQ 与 `IEnumerable<T>` vs `IQueryable<T>`**、**Record 与不可变模型**、**Channels 与 Pipeline**、**.NET 8 AOT 编译**、**Minimal API**。能讲清"async 不是多线程"、"`Span<T>` 零分配"、"为什么 .NET 8 LTS 是分水岭"立刻区分初/中/高级。
:::

## .NET 演进时间线

| 版本 | 年份 | 关键变化 |
|------|------|---------|
| **.NET Framework 4.8** | 2019 | 末代 Windows-only |
| **.NET Core 3.1** | 2019 | 跨平台 LTS |
| **.NET 5** | 2020 | 统一品牌（去掉 "Core"）|
| **.NET 6** | 2021 | LTS、Minimal API、Hot Reload |
| **.NET 7** | 2022 | Native AOT、性能爆炸 |
| **.NET 8** | 2023 | **LTS**、AOT 完善、Blazor United、Channel |
| **.NET 9** | 2024 | OpenAPI 原生、Aspire 集成、AI 集成 |
| **.NET 10** | 2025.11 | LTS、性能继续提升 |

::: warning ⚠️ 2026 重点版本

> ① **.NET 8 LTS** 是当前生产主流（支持到 2026.11）
> ② **.NET 10 LTS** 是新项目首选（支持到 2028.11）
> ③ **.NET Framework 4.x** 仅维护老项目，新项目禁用
> ④ **C# 12+ Primary Constructor / Collection Expressions** 是必备语法

:::

---

## C# 关键现代语法

### 1. async / await — 异步核心

```csharp
// ❌ 同步阻塞 IO
public string FetchData() {
    using var client = new HttpClient();
    var response = client.GetStringAsync("https://api.example.com").Result;  // 阻塞线程
    return response;
}

// ✅ 异步非阻塞
public async Task<string> FetchDataAsync() {
    using var client = new HttpClient();
    return await client.GetStringAsync("https://api.example.com");
}

// 多个异步并行
public async Task<List<string>> FetchManyAsync() {
    var tasks = urls.Select(url => client.GetStringAsync(url));
    return (await Task.WhenAll(tasks)).ToList();
}
```

::: warning ⚠️ async/await 三大坑（必背）

> ① **async 不是多线程** —— await 之前是同步执行，await 之后才让出线程
> ② **ConfigureAwait(false)** —— 库代码必加，避免死锁（详见下）
> ③ **async void 禁用** —— 除非事件处理器；其他用 `async Task`

:::

#### ConfigureAwait 死锁案例

```csharp
// ❌ Web/UI 同步代码调异步 → 死锁
public string Bad() {
    return FetchDataAsync().Result;
    // ASP.NET Framework / WPF: 主线程等 Task 完成
    // Task 完成需要回主线程 → 永远死锁
}

// ✅ 库代码全加 ConfigureAwait(false)
public async Task<string> Good() {
    var data = await client.GetStringAsync("...").ConfigureAwait(false);
    return data;
}
```

**ASP.NET Core 不存在此问题**（无 SynchronizationContext），但**库代码仍应加** ConfigureAwait(false) 兼容老框架。

### 2. LINQ（Language Integrated Query）

```csharp
var users = new List<User> { ... };

// 方法语法
var result = users
    .Where(u => u.Age > 18)
    .OrderByDescending(u => u.Score)
    .Select(u => new { u.Name, u.Email })
    .Take(10)
    .ToList();

// 查询语法
var result2 = (from u in users
               where u.Age > 18
               orderby u.Score descending
               select new { u.Name, u.Email })
              .Take(10).ToList();
```

#### IEnumerable vs IQueryable（必背区别）

| 维度 | `IEnumerable<T>` | `IQueryable<T>` |
|------|------------------|-----------------|
| **执行位置** | **内存中**（LINQ to Objects）| **可翻译为 SQL**（LINQ to Entities）|
| **延迟执行** | ✅ | ✅ |
| **拉数据时机** | 调用时间下面再过滤 | **数据库端过滤** |
| **典型用法** | 内存集合 | Entity Framework / Dapper |

```csharp
// ❌ EF 反模式：先拉全表再过滤
db.Users.AsEnumerable().Where(u => u.Age > 18).ToList();
// SQL: SELECT * FROM Users   ← 全表拉到内存！

// ✅ EF 正确：SQL 端过滤
db.Users.Where(u => u.Age > 18).ToList();
// SQL: SELECT * FROM Users WHERE Age > 18
```

### 3. Records（C# 9+）— 不可变数据类

```csharp
// 一行定义不可变模型 + 自动生成 Equals / GetHashCode / ToString / Deconstruct
public record User(string Name, int Age);

var u1 = new User("Alice", 30);
var u2 = new User("Alice", 30);

Console.WriteLine(u1 == u2);              // True（值相等）
Console.WriteLine(u1);                     // User { Name = Alice, Age = 30 }

// with 表达式 - 创建修改副本
var u3 = u1 with { Age = 31 };

// 解构
var (name, age) = u1;
```

**Record vs Class**：

| 维度 | `class` | `record` |
|------|---------|---------|
| **相等性** | 引用相等 | **值相等**（按字段对比）|
| **不可变** | 需手动 | **默认 init-only** |
| **with 表达式** | ❌ | ✅ |
| **典型用法** | 行为 + 状态 | **DTO / 值对象 / 不可变模型** |

### 4. Pattern Matching（模式匹配）— C# 10+

```csharp
// 属性模式
string Describe(object obj) => obj switch {
    null                      => "null",
    int n when n < 0          => "negative",
    int n                      => $"int {n}",
    string { Length: 0 }       => "empty string",
    string s                   => $"string '{s}'",
    User { Age: > 18 } u       => $"adult {u.Name}",
    User u                     => $"minor {u.Name}",
    _                          => "unknown"
};

// 列表模式（C# 11+）
int[] arr = { 1, 2, 3, 4, 5 };
var description = arr switch {
    []                          => "empty",
    [var first]                 => $"single {first}",
    [var first, .., var last]   => $"first {first}, last {last}",
    _                           => "many"
};
```

### 5. Primary Constructor（C# 12）

```csharp
// ❌ 老写法
public class UserService {
    private readonly ILogger<UserService> _logger;
    private readonly IDbContext _db;

    public UserService(ILogger<UserService> logger, IDbContext db) {
        _logger = logger;
        _db = db;
    }
}

// ✅ C# 12 主构造器
public class UserService(ILogger<UserService> logger, IDbContext db) {
    public User Find(int id) {
        logger.LogInformation("Finding {Id}", id);
        return db.Users.Find(id);
    }
}
```

### 6. Collection Expressions（C# 12）

```csharp
int[] arr        = [1, 2, 3, 4];                  // 数组
List<int> list   = [1, 2, 3, 4];                  // List
Span<int> span   = [1, 2, 3];                     // Span
Dictionary<string, int> dict = ["a"=>1, "b"=>2]; // C# 13

// 展开 spread
int[] all = [.. arr, 5, .. list];                 // ★ 拼接
```

### 7. nullable reference types（C# 8+，2026 必开）

```csharp
#nullable enable

string s = null;        // ❌ 编译警告
string? s2 = null;      // ✅ 显式声明可空

if (s2 != null) {
    Console.WriteLine(s2.Length);  // ✅ 编译器知道非空
}
Console.WriteLine(s2.Length);      // ❌ 警告 - 可能 null

// 强制非空（自行负责）
Console.WriteLine(s2!.Length);     // ! 抑制警告
```

---

## .NET 8/9 重大改进

### 1. Native AOT（提前编译）

**问题**：传统 .NET = JIT 编译 = 启动慢 + 内存大（不适合 Lambda / 容器）

**Native AOT**：编译期生成原生机器码，启动 < 50ms，内存减少 50%+

```bash
# 启用 AOT
dotnet publish -r linux-x64 -c Release -p:PublishAot=true
# 输出: 单一原生二进制（无需 .NET runtime）
```

**Native AOT vs JIT**：

| 维度 | JIT（传统）| **Native AOT** |
|------|----------|---------------|
| **启动时间** | 500ms-3s | **< 50ms** |
| **二进制大小** | 需 runtime（~100MB）| **单文件 ~10-50MB** |
| **内存占用** | 高（JIT 编译器在内存）| **减 50-70%** |
| **峰值性能** | JIT 优化后高 | **稍低**（无运行时优化）|
| **反射** | ✅ | **❌ 受限** |
| **运行时代码生成** | ✅ | **❌** |
| **典型场景** | 长期服务 | **Serverless / CLI / 容器** |

::: warning ⚠️ Native AOT 限制

> ① **反射受限**——Newtonsoft.Json 不行，必须用 System.Text.Json 源生成器
> ② **Assembly.Load / Reflection.Emit 不可用**
> ③ **第三方库需适配**（标 `[DynamicallyAccessedMembers]`）
> ④ ASP.NET Core 8 起官方支持 AOT（但部分中间件不兼容）

:::

### 2. Minimal API

```csharp
// ❌ MVC 风格：Controller + Startup
// 50+ 行配置

// ✅ Minimal API（.NET 6+）—— 一个文件搞定
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDb>();

var app = builder.Build();

app.MapGet("/users/{id}", async (int id, AppDb db) =>
    await db.Users.FindAsync(id) is { } u ? Results.Ok(u) : Results.NotFound());

app.MapPost("/users", async (User user, AppDb db) => {
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Created($"/users/{user.Id}", user);
});

app.Run();
```

**适用**：微服务 / 简单 API；复杂业务仍推 Controller。

### 3. Channels（生产者-消费者）

```csharp
using System.Threading.Channels;

var channel = Channel.CreateBounded<int>(100);    // 容量 100

// 生产者
_ = Task.Run(async () => {
    for (int i = 0; i < 1000; i++) {
        await channel.Writer.WriteAsync(i);
    }
    channel.Writer.Complete();
});

// 消费者
await foreach (var item in channel.Reader.ReadAllAsync()) {
    Console.WriteLine(item);
}
```

**Channel vs Queue**：
- ✅ **异步原生**（无阻塞，await 让出线程）
- ✅ **背压控制**（有界 channel 满了 writer 等待）
- ✅ **类似 Go channel** 但更类型安全

### 4. `Span<T>` / `Memory<T>` — 零分配

```csharp
// ❌ 老写法：每次 Substring 都分配
string s = "Hello, World!";
string part = s.Substring(7, 5);            // ★ 新堆分配

// ✅ Span<T>：零分配（仅指针 + 长度）
ReadOnlySpan<char> span = s.AsSpan(7, 5);
foreach (var c in span) {                    // 直接遍历底层内存
    // ...
}

// 配合 stackalloc 完全栈分配
Span<byte> buffer = stackalloc byte[256];    // 栈上分配
```

**适用**：高性能解析（JSON / HTTP / 协议）、避免 GC 压力。

---

## ASP.NET Core 核心模式

### 依赖注入（DI 原生）

```csharp
// Program.cs
builder.Services.AddSingleton<ICacheService, RedisCacheService>();   // 单例
builder.Services.AddScoped<IUserService, UserService>();              // 每请求一例
builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();      // 每次注入新实例

// 控制器构造器注入
public class UserController(IUserService userService) : ControllerBase {
    [HttpGet("{id}")]
    public async Task<User> Get(int id) => await userService.GetAsync(id);
}
```

### 中间件管道

```csharp
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

// 自定义中间件
public class RequestLoggingMiddleware {
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger) {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext ctx) {
        var sw = Stopwatch.StartNew();
        await _next(ctx);
        _logger.LogInformation("{Method} {Path} - {StatusCode} in {Elapsed}ms",
            ctx.Request.Method, ctx.Request.Path, ctx.Response.StatusCode, sw.ElapsedMilliseconds);
    }
}
```

---

## .NET 性能调优（生产必备）

### 1. dotnet-trace + PerfView + dotMemory

```bash
# 抓取 CPU profile
dotnet trace collect -p <pid> --duration 00:00:30

# 抓 GC 统计
dotnet counters monitor -p <pid> System.Runtime

# 内存 dump
dotnet dump collect -p <pid>
dotnet dump analyze core_xxxx_xxx
```

### 2. ConcurrentDictionary / ImmutableArray

```csharp
// 高并发场景用并发集合
var dict = new ConcurrentDictionary<int, User>();
dict.TryAdd(1, user);
dict.GetOrAdd(1, _ => new User());           // 原子获取/添加
```

### 3. ValueTask vs Task

```csharp
// 高频路径用 ValueTask 减分配
public async ValueTask<int> GetFromCacheAsync(string key) {
    if (cache.TryGet(key, out var value)) return value;       // 同步路径无堆分配
    return await db.QueryAsync(key);
}
```

---

## .NET vs Java（必背对比）

| 维度 | **.NET 8/9** | **Java 21+** |
|------|-------------|---------------|
| **运行时** | CLR（CoreCLR）| JVM（HotSpot / GraalVM）|
| **GC** | Server GC + Background | G1 / ZGC / Generational ZGC |
| **AOT 编译** | **Native AOT 成熟** | GraalVM Native Image |
| **快速启动** | **Native AOT < 50ms** | CRaC / GraalVM < 100ms |
| **协程 / 虚拟线程** | async/await（任务级）| **Virtual Thread（JDK 21）** |
| **响应式** | Channels / Rx.NET | Reactor / RxJava |
| **Web 框架** | ASP.NET Core / Minimal API | Spring Boot / Quarkus / Micronaut |
| **ORM** | Entity Framework Core / Dapper | Hibernate / MyBatis |
| **包管理** | NuGet | Maven / Gradle |
| **开源生态** | 微软 + 社区（GitHub 主流）| Apache + Eclipse + 各厂 |
| **典型客户** | 金融 / 企业 / 游戏（Unity）| 互联网 / 移动 / 大数据 |
| **国内市场** | 较小 | **主流** |

### .NET 优势场景

- ✅ **企业 / 金融**（与 SQL Server / Azure 深度集成）
- ✅ **Unity 游戏开发**（C# 是 Unity 脚本语言）
- ✅ **桌面应用**（WPF / WinUI / MAUI 跨平台）
- ✅ **Azure 云原生**（首席公民）
- ✅ **Windows 客户端开发**

### Java 优势场景

- ✅ **大型互联网后端**（Spring 生态成熟）
- ✅ **Android**
- ✅ **大数据**（Hadoop / Spark / Flink 都是 Java）
- ✅ **国内招聘市场**

---

## C# 常见陷阱（必背）

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **async void** | 异常无法捕获 | 用 `async Task` |
| **`.Result` / `.Wait()`** | 死锁 | 全链路 await |
| **库代码忘 ConfigureAwait(false)** | 老框架死锁 | 库强制加 |
| **EF AsEnumerable() 全表拉** | 内存爆炸 | 让 SQL 端过滤 |
| **N+1 查询** | 性能灾难 | `.Include()` / `.Select()` |
| **`Task.Run` 包同步代码** | 没用 + 增加线程切换 | 真异步用真异步 API |
| **catch (Exception) 吞掉** | 看不到错误 | 至少 log，throw 时用 `throw;` |
| **Dispose 忘了** | 资源泄漏 | `using` / `using var` / IAsyncDisposable |
| **string 拼接循环** | O(n²) | StringBuilder |
| **大对象进入 LOH** | 堆碎片 | 用 ArrayPool / Span |

---

## 黄金答题模板（必背）

> **面试官：现代 C# / .NET 你最熟的特性是哪些？**
>
> **答**：**4 大核心 + 2 大新方向**：
>
> **核心**：
> ① **async/await** —— **不是多线程，是任务化**；await 之前同步执行；库代码必须 ConfigureAwait(false) 防死锁；`async void` 禁用（除事件处理器）；同步代码调异步用 `.Result` 必死锁；
>
> ② **LINQ** —— **`IEnumerable<T>` 内存执行 vs `IQueryable<T>` 翻译为 SQL**；EF 反模式是 `AsEnumerable()` 后过滤会拉全表；
>
> ③ **Record** —— 值相等 + init-only 不可变 + `with` 副本表达式，**DTO / 值对象首选**；
>
> ④ **Pattern Matching + Primary Constructor + Collection Expressions** —— C# 10-12 语法糖大幅减少样板代码。
>
> **新方向**：
> ⑤ **Native AOT**（.NET 8 成熟）—— 编译期生成原生码，**启动 < 50ms + 内存减 50%**，Serverless / 容器场景革命；代价是反射受限、第三方库需适配；
>
> ⁥ **Channels + `Span<T>`** —— Go-like channel 做异步生产消费 + 零分配解析，高性能服务必备。
>
> **vs Java**：
> - **金融 / 企业 / Azure / Unity / Windows** → .NET 优势
> - **大型互联网 / Android / 大数据 / 国内招聘** → Java 优势
> - **2026 趋势**：.NET 10 LTS + Aspire（云原生编排）+ AI 集成大幅提升
>
> **必踩坑**：① async void / .Result 死锁；② EF AsEnumerable 全表拉；③ N+1 查询；④ 库代码忘 ConfigureAwait(false)；⑤ Dispose 忘了用 using。

---

## 看到什么就先想到这类

- **"async 死锁"** → ConfigureAwait(false) + 全链路 await
- **"async void"** → 改 async Task（除事件）
- **"EF 慢"** → 查 N+1、避免 AsEnumerable、用 Include / Select
- **"不可变 DTO"** → record
- **"高性能解析"** → `Span<T>` + stackalloc
- **"零启动 / Serverless"** → Native AOT
- **"生产者消费者"** → Channel（不是 BlockingCollection）
- **"模式匹配"** → switch expression + 列表模式
- **"减少样板"** → Primary Constructor + Collection Expressions
- **"DI 注入"** → AddSingleton / AddScoped / AddTransient
- **"Minimal API"** → 微服务 / 简单 API
- **".NET vs Java"** → 看团队栈 + 云平台（Azure 选 .NET）
- **"GC 调优"** → dotnet-counters + ServerGC + ConcurrentDictionary
- **"内存泄漏"** → dotnet-dump + dotMemory
