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

## C# 基础语法（必备）

### 1. 类型系统：值类型 vs 引用类型

```csharp
// 值类型（栈分配）：基本类型 + struct + enum
int n = 10;
DateTime dt = DateTime.Now;
struct Point { public int X, Y; }

// 引用类型（堆分配）：class + string + 数组 + delegate + interface
class User { public string Name; }
string s = "hello";
int[] arr = { 1, 2, 3 };

// 装箱拆箱（性能敏感避免）
int i = 42;
object o = i;          // 装箱（堆分配 + 复制）
int j = (int)o;        // 拆箱

// ✅ 现代 C# 用泛型避免装箱
List<int> nums;         // 不装箱
```

### 2. 字符串处理

```csharp
// 字符串不可变（每次修改产生新对象）
string s = "Hello";
s += " World";          // 新对象

// 字符串拼接性能
// ❌ 循环用 += → O(n²)
string result = "";
for (int i = 0; i < 1000; i++) result += i;

// ✅ 用 StringBuilder → O(n)
var sb = new StringBuilder();
for (int i = 0; i < 1000; i++) sb.Append(i);
string result = sb.ToString();

// ✅ 字符串插值（C# 6+）
string name = "Alice";
int age = 30;
var s = $"Hello, {name}, age {age}";

// 原始字符串字面量（C# 11+，类似 Python """）
var json = """
{
    "name": "Alice",
    "age": 30
}
""";

// 跨行 + 插值（C# 11+）
var sql = $$"""
SELECT * FROM users WHERE age > {{minAge}}
""";
```

### 3. 集合（必背 4 种）

| 集合 | 用途 | 底层 |
|------|------|------|
| `List<T>` | 动态数组 | 数组 + 自动扩容 |
| `Dictionary<K,V>` | 哈希表 | 桶 + 链表 |
| `HashSet<T>` | 去重集合 | 哈希表 |
| `Queue<T>` / `Stack<T>` | 队列 / 栈 | 环形数组 / 数组 |

```csharp
var list = new List<int> { 1, 2, 3 };
var dict = new Dictionary<string, int> { ["a"] = 1, ["b"] = 2 };
var set = new HashSet<int> { 1, 2, 3 };

// 并发集合（多线程）
var conDict = new ConcurrentDictionary<int, User>();
var conQueue = new ConcurrentQueue<int>();
var conBag = new ConcurrentBag<int>();          // 无序高并发
```

### 4. OOP 与多态

```csharp
// 继承 + 多态
public abstract class Animal {
    public abstract string Sound();
    public virtual string Describe() => $"I make {Sound()}";   // virtual 可重写
}

public class Dog : Animal {
    public override string Sound() => "Woof";
    public override string Describe() => $"Dog: {base.Describe()}";   // base 调父
}

// 接口（推荐组合优于继承）
public interface IRepository<T> {
    Task<T?> FindAsync(int id);
    Task SaveAsync(T entity);
}

public interface ICacheable {
    string CacheKey { get; }
}

public class UserRepository : IRepository<User>, ICacheable {
    public string CacheKey => "users";
    public async Task<User?> FindAsync(int id) { ... }
    public async Task SaveAsync(User user) { ... }
}

// C# 8+ 接口默认方法
public interface ILogger {
    void Log(string msg);
    void LogError(string msg) => Log($"[ERROR] {msg}");   // ★ 默认实现
}
```

### 5. 委托与事件

```csharp
// 委托 = 类型安全的函数指针
public delegate int BinaryOp(int a, int b);
BinaryOp add = (a, b) => a + b;
add(1, 2);              // 3

// Func / Action / Predicate（内置泛型委托）
Func<int, int, int> add = (a, b) => a + b;       // 有返回值
Action<string> log = msg => Console.WriteLine(msg);  // 无返回值
Predicate<int> isPositive = n => n > 0;            // bool 返回

// 事件
public class Button {
    public event EventHandler<ClickEventArgs>? Clicked;

    public void OnClick() {
        Clicked?.Invoke(this, new ClickEventArgs());   // 触发
    }
}

button.Clicked += (sender, args) => Console.WriteLine("clicked");
```

### 6. Nullable Reference Types（C# 8+，2026 必开）

```csharp
#nullable enable

string s = null;        // ⚠️ 编译警告
string? s2 = null;      // ✅ 显式可空

if (s2 != null) {
    Console.WriteLine(s2.Length);    // ✅ 编译器知非空
}

// ! 抑制警告（自负其责）
Console.WriteLine(s2!.Length);

// ?? 空合并 + ??= 赋值
string name = s2 ?? "anonymous";
s2 ??= "default";        // null 时赋值

// ?. 安全调用
int? len = s2?.Length;    // s2 null 时返 null
```

### 7. 异常处理

```csharp
try {
    DoWork();
}
catch (FileNotFoundException ex) when (ex.FileName.EndsWith(".json")) {
    // ★ when 条件过滤（C# 6+）
    Console.WriteLine("JSON file missing");
}
catch (Exception ex) {
    Console.WriteLine($"Error: {ex.Message}");
    throw;                  // ★ 保留堆栈，不要 throw ex
}
finally {
    Cleanup();              // 无论是否异常都执行
}

// using - IDisposable 自动释放
using var fs = File.OpenRead("data.txt");
// 离开作用域自动 Dispose

// using statement
using (var fs = File.OpenRead("data.txt")) {
    // ...
}   // 这里 Dispose

// async 资源（IAsyncDisposable）
await using var conn = new SqlConnection(connStr);
```

### 8. 反射（Reflection）

```csharp
// 拿类型信息
Type type = typeof(User);
PropertyInfo[] props = type.GetProperties();
foreach (var p in props) Console.WriteLine(p.Name);

// 运行时创建对象
object obj = Activator.CreateInstance(type)!;

// 调用方法
MethodInfo method = type.GetMethod("Greet")!;
method.Invoke(obj, new object[] { "Alice" });

// 慢，性能敏感场景用 Source Generator 或 expression tree
```

### 9. 特性（Attributes）— C# 注解

```csharp
// 定义自定义特性
[AttributeUsage(AttributeTargets.Method)]
public class CacheAttribute : Attribute {
    public int TtlSeconds { get; set; } = 300;
}

// 使用
public class UserService {
    [Cache(TtlSeconds = 600)]
    public User GetUser(int id) { ... }
}

// 反射读取
var attr = typeof(UserService)
    .GetMethod("GetUser")!
    .GetCustomAttribute<CacheAttribute>();
Console.WriteLine(attr?.TtlSeconds);     // 600
```

**常用内置特性**：
- `[Obsolete]` — 标记弃用
- `[Serializable]` — 序列化
- `[JsonPropertyName]` — JSON 映射
- `[ApiController]` / `[Route]` / `[HttpGet]` — ASP.NET
- `[Required]` / `[Range]` — 数据验证

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

## .NET CLR 与 GC 深度

### CLR 内存模型

```text
┌──────────────────────────────────────┐
│  Managed Heap（托管堆）                │
│  ┌──────────────────────────────────┐ │
│  │ SOH (Small Object Heap)          │ │
│  │  - Gen 0（新对象）                │ │
│  │  - Gen 1（短暂存活）              │ │
│  │  - Gen 2（长期存活）              │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ LOH (Large Object Heap)          │ │
│  │  - 单对象 > 85KB                  │ │
│  │  - 不压缩，碎片化                 │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ POH (Pinned Object Heap, 5.0+)   │ │
│  │  - GC 钉住对象（互操作）          │ │
│  └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### GC 分代回收

```text
对象创建 → Gen 0
   ↓ Gen 0 GC（短暂 STW）
存活下来 → Gen 1
   ↓ Gen 1 GC（较少）
长期存活 → Gen 2
   ↓ Gen 2 GC（全堆扫描，最慢）
```

**关键事实**：
- ✅ **80% 对象死在 Gen 0**（短命对象多）
- ✅ Gen 2 GC 最贵——要降低 Gen 2 GC 频率
- ✅ Server GC（多线程）vs Workstation GC（单线程）—— 服务端必开 Server GC

### GC 调优（生产必备）

```xml
<!-- .csproj -->
<PropertyGroup>
  <ServerGarbageCollection>true</ServerGarbageCollection>
  <ConcurrentGarbageCollection>true</ConcurrentGarbageCollection>
  <RetainVMGarbageCollection>true</RetainVMGarbageCollection>     <!-- 减少 OS 内存分配 -->
</PropertyGroup>
```

### LOH 陷阱（必背）

```csharp
// ❌ 反复分配大数组 → LOH 碎片化
for (int i = 0; i < 100; i++) {
    var buffer = new byte[100_000];     // > 85KB 进 LOH
    // ...
}

// ✅ 用 ArrayPool 复用
var pool = ArrayPool<byte>.Shared;
var buffer = pool.Rent(100_000);
try {
    // 使用 buffer
} finally {
    pool.Return(buffer);
}
```

### GC 监控

```bash
# 实时 GC 计数
dotnet counters monitor -p <pid> System.Runtime

# 看 Gen 0/1/2 GC 次数 + 堆大小 + 暂停时间
# - gen-0-gc-count
# - gen-1-gc-count
# - gen-2-gc-count
# - time-in-gc (%)
# - gc-heap-size
```

---

## Entity Framework Core（ORM）

### 基础

```csharp
// DbContext
public class AppDbContext : DbContext {
    public DbSet<User> Users => Set<User>();
    public DbSet<Order> Orders => Set<Order>();

    protected override void OnConfiguring(DbContextOptionsBuilder options) {
        options.UseSqlServer(connStr);
    }
}

// 实体
public class User {
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Order> Orders { get; set; } = new();    // 导航属性
}

public class Order {
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public decimal Amount { get; set; }
}
```

### CRUD

```csharp
using var db = new AppDbContext();

// Create
db.Users.Add(new User { Name = "Alice" });
await db.SaveChangesAsync();

// Read
var users = await db.Users.Where(u => u.Name.StartsWith("A")).ToListAsync();
var user = await db.Users.FindAsync(1);            // 按主键

// Update
user.Name = "Alice2";
await db.SaveChangesAsync();

// Delete
db.Users.Remove(user);
await db.SaveChangesAsync();
```

### EF 必踩坑

```csharp
// ❌ N+1 查询
foreach (var user in db.Users) {
    foreach (var order in user.Orders) { ... }    // ★ 每个 user 1 次 SQL
}

// ✅ Include 预加载
var users = await db.Users
    .Include(u => u.Orders)
    .ToListAsync();

// ❌ AsEnumerable 拉全表
db.Users.AsEnumerable().Where(u => u.Age > 18).ToList();

// ✅ SQL 端过滤
db.Users.Where(u => u.Age > 18).ToListAsync();

// ❌ 改 tracked 实体不 SaveChanges
var u = await db.Users.FindAsync(1);
u.Name = "new";
// 忘了 await db.SaveChangesAsync(); ★ 不写库

// ✅ AsNoTracking 只读查询（性能高 30-50%）
var users = await db.Users.AsNoTracking().ToListAsync();

// ✅ 批量更新（EF 7+）
await db.Users.Where(u => u.Active == false)
    .ExecuteDeleteAsync();         // 一条 SQL 删全部
```

---

## ASP.NET Core 工程实战

### 项目结构（推荐）

```text
MyApp/
├── src/
│   ├── MyApp.Api/             ← Web API（Controller / Program.cs）
│   ├── MyApp.Application/      ← 业务逻辑（Service / DTO / Mapping）
│   ├── MyApp.Domain/           ← 领域模型（Entity / Value Object）
│   └── MyApp.Infrastructure/   ← 基础设施（DbContext / 外部 API）
├── tests/
│   ├── MyApp.UnitTests/
│   └── MyApp.IntegrationTests/
└── MyApp.sln
```

### 配置体系

```csharp
// appsettings.json + appsettings.Development.json + 环境变量
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "Default": "Server=...;Database=..."
  },
  "Jwt": {
    "Issuer": "my-app",
    "Audience": "users",
    "SecretKey": "..."
  }
}

// 强类型配置（推荐）
public class JwtSettings {
    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";
    public string SecretKey { get; set; } = "";
}

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

// 注入使用
public class AuthService(IOptions<JwtSettings> options) {
    private readonly JwtSettings _jwt = options.Value;
}
```

### Middleware Pipeline（必懂）

```csharp
// 顺序极重要！
app.UseExceptionHandler();              // 1. 异常兜底
app.UseHttpsRedirection();              // 2. HTTPS 重定向
app.UseStaticFiles();                   // 3. 静态文件
app.UseRouting();                       // 4. 路由
app.UseCors();                          // 5. CORS
app.UseAuthentication();                // 6. 认证
app.UseAuthorization();                 // 7. 授权（必须在 Auth 之后）
app.UseRateLimiter();                   // 8. 限流
app.MapControllers();                   // 9. 路由到控制器
```

### 集成测试

```csharp
public class UserApiTests : IClassFixture<WebApplicationFactory<Program>> {
    private readonly WebApplicationFactory<Program> _factory;

    public UserApiTests(WebApplicationFactory<Program> factory) {
        _factory = factory.WithWebHostBuilder(builder => {
            builder.ConfigureServices(services => {
                // 替换 DB 为 in-memory
                services.RemoveAll<DbContextOptions<AppDbContext>>();
                services.AddDbContext<AppDbContext>(opt =>
                    opt.UseInMemoryDatabase("test"));
            });
        });
    }

    [Fact]
    public async Task GetUser_ReturnsOk() {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/users/1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
```

### 单元测试（xUnit + Moq）

```csharp
public class UserServiceTests {
    [Fact]
    public async Task FindUser_Returns_User() {
        // Arrange
        var mockRepo = new Mock<IUserRepository>();
        mockRepo.Setup(r => r.FindAsync(1))
                .ReturnsAsync(new User { Id = 1, Name = "Alice" });

        var service = new UserService(mockRepo.Object);

        // Act
        var user = await service.FindUserAsync(1);

        // Assert
        Assert.NotNull(user);
        Assert.Equal("Alice", user.Name);
        mockRepo.Verify(r => r.FindAsync(1), Times.Once);
    }
}
```

---

## NuGet 包管理与项目工程

### 常用包（2026 标配）

| 类别 | 包 |
|------|------|
| **Web** | Microsoft.AspNetCore.App |
| **EF Core** | Microsoft.EntityFrameworkCore.SqlServer / .Sqlite / .Npgsql |
| **JSON** | System.Text.Json（默认）/ Newtonsoft.Json（老项目）|
| **Logging** | Serilog / NLog |
| **HTTP Client** | Refit（声明式）/ Polly（重试熔断）|
| **测试** | xUnit / Moq / FluentAssertions / Bogus（mock data）|
| **缓存** | StackExchange.Redis / Microsoft.Extensions.Caching |
| **消息** | MassTransit（RabbitMQ/Kafka 抽象）|
| **API 文档** | Swashbuckle / NSwag |
| **认证** | Microsoft.AspNetCore.Authentication.JwtBearer |
| **校验** | FluentValidation |
| **Mapping** | AutoMapper / Mapster |
| **AI** | Microsoft.SemanticKernel / Microsoft.Extensions.AI |
| **可观测性** | OpenTelemetry.Extensions.Hosting |

### .csproj 实战

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <PublishAot>true</PublishAot>             <!-- Native AOT -->
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
    <PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
  </ItemGroup>
</Project>
```

### .NET CLI

```bash
dotnet new webapi -n MyApp           # 创建项目
dotnet add package Serilog            # 加包
dotnet restore                         # 还原依赖
dotnet build                           # 编译
dotnet run                             # 运行
dotnet test                            # 测试
dotnet publish -r linux-x64 -c Release -p:PublishAot=true   # Native AOT 发布
dotnet ef migrations add InitialCreate # EF 迁移
dotnet ef database update              # 应用迁移
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
