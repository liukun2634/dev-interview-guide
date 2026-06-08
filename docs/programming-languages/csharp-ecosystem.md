---
title: C# 生态
---

# C# 生态（CLR / GC / ASP.NET Core / EF Core / NuGet）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 章节范围
本页覆盖 **.NET 生态完整体系**：ASP.NET Core 核心模式（DI + Middleware）、性能调优、CLR + GC 深度（SOH/LOH/POH + 3 代）、Entity Framework Core、ASP.NET Core 工程实战、NuGet 包管理。语法见 [C# 基础](./csharp-fundamentals)；现代特性见 [C# 现代特性](./csharp-modern-features)。
:::

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

