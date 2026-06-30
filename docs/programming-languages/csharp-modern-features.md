---
title: C# 现代特性
---

# C# 现代特性（async/await / LINQ / Records / Pattern Matching / .NET 8 AOT）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 章节范围
本页覆盖 **C# 现代语法 + .NET 8/9 重大改进**：async/await + ConfigureAwait、LINQ + IEnumerable vs IQueryable、Records、Pattern Matching、Primary Constructor、Collection Expressions、Native AOT、Minimal API、Channels、Span/Memory。语法基础见 [C# 基础](./csharp-fundamentals)。
:::

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

## 延伸阅读

并发与多线程（Task / async 内幕 / 锁 / 并发集合 / CancellationToken / Parallel）已拆分为独立页：[C# 并发与多线程](./csharp-concurrency)。


