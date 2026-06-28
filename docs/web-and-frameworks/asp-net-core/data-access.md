---
title: ASP.NET Core 数据访问与事务
---

# ASP.NET Core 数据访问与事务

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
.NET 数据访问两条主线：**EF Core**（全自动 ORM，对标 JPA/Hibernate）和 **Dapper**（半自动 SQL 映射，对标 MyBatis）。面试核心是讲清 **EF Core 的变更跟踪 + 工作单元（`SaveChanges` 一次提交）**、**事务怎么管（隐式事务 vs 显式 `BeginTransaction`）**、**并发控制（乐观锁 `[ConcurrencyCheck]` / `rowversion`）** 和 **迁移（Migrations）**。
:::

> 前置：`DbContext` 是 **Scoped** 生命周期、非线程安全，原因见 [依赖注入 DI](./dependency-injection)。

---

## EF Core vs Dapper

| 维度 | **EF Core** | **Dapper** |
|------|-------------|-----------|
| 定位 | 全自动 ORM | 半自动 micro-ORM |
| 写 SQL | LINQ 自动翻译 | **手写 SQL** |
| 变更跟踪 | ✅ 自动 | ❌ 无 |
| 迁移 | ✅ 内置 Migrations | ❌ 自己管 |
| 性能 | 好（有跟踪开销） | **极快**（贴近 ADO.NET） |
| 适合 | CRUD、领域模型、快速开发 | 复杂查询、报表、高性能读 | 
| 对标 Java | Spring Data JPA / Hibernate | MyBatis |

实战常**混用**：写操作和领域 CRUD 用 EF Core，复杂报表/高频读用 Dapper。

---

## EF Core 基础：DbContext 与实体

```csharp
// 实体
public class Order
{
    public int Id { get; set; }
    public string CustomerName { get; set; } = "";
    public decimal Amount { get; set; }
    public OrderStatus Status { get; set; }
    public List<OrderItem> Items { get; set; } = [];
}

// DbContext —— 工作单元 + 查询入口（对标 JPA EntityManager）
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Order>(e =>
        {
            e.HasKey(o => o.Id);
            e.Property(o => o.Amount).HasPrecision(18, 2);
            e.HasMany(o => o.Items).WithOne().HasForeignKey(i => i.OrderId);
            e.HasIndex(o => o.CustomerName);
        });
    }
}

// 注册（Scoped，连接串从配置读）
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
```

---

## CRUD 与 LINQ 查询

```csharp
public class OrderService(AppDbContext db)
{
    // 查询：LINQ 编译期类型安全，自动翻译成 SQL
    public Task<Order?> GetAsync(int id) =>
        db.Orders.Include(o => o.Items)          // JOIN 加载子集合
                 .FirstOrDefaultAsync(o => o.Id == id);

    public Task<List<Order>> ListPaidAsync(int page, int size) =>
        db.Orders.AsNoTracking()                 // 只读查询关闭跟踪，更快
                 .Where(o => o.Status == OrderStatus.Paid)
                 .OrderByDescending(o => o.Id)
                 .Skip((page - 1) * size).Take(size)
                 .ToListAsync();

    // 新增：变更跟踪 + SaveChanges 一次性提交（工作单元）
    public async Task<int> CreateAsync(Order order)
    {
        db.Orders.Add(order);
        await db.SaveChangesAsync();             // 这里才真正写库
        return order.Id;
    }

    // 更新：查出来改字段，SaveChanges 自动生成 UPDATE
    public async Task PayAsync(int id)
    {
        var order = await db.Orders.FindAsync(id);
        if (order is null) return;
        order.Status = OrderStatus.Paid;          // 改属性
        await db.SaveChangesAsync();              // 跟踪器对比快照，只更新变化列
    }
}
```

::: tip AsNoTracking 的意义
默认查询会把实体放进**变更跟踪器**（为了后续 `SaveChanges` 能感知改动），但只读场景这是浪费。`AsNoTracking()` 跳过跟踪，查询更快、内存更省——只读列表一律加上。
:::

---

## 事务：隐式 vs 显式

### 隐式事务（最常用）

**一次 `SaveChanges` 调用本身就是一个事务**——所有改动要么全成功、要么全回滚，无需手动开事务：

```csharp
db.Orders.Add(order);
db.OrderItems.Add(item);
await db.SaveChangesAsync();   // order + item 在同一个隐式事务里提交
```

### 显式事务（跨多次 SaveChanges / 跨 DbContext）

需要把**多个 `SaveChanges` 或多个操作**绑进一个事务时，用显式事务：

```csharp
await using var tx = await db.Database.BeginTransactionAsync();
try
{
    order.Status = OrderStatus.Paid;
    await db.SaveChangesAsync();             // 第一次

    await db.Database.ExecuteSqlAsync(        // 原生 SQL 也在同一事务
        $"UPDATE Inventory SET Stock = Stock - 1 WHERE ProductId = {productId}");

    await tx.CommitAsync();                   // 一起提交
}
catch
{
    await tx.RollbackAsync();                 // 任一步失败全部回滚
    throw;
}
```

### 指定隔离级别

```csharp
await using var tx = await db.Database.BeginTransactionAsync(
    System.Data.IsolationLevel.Serializable);  // 最严格，防幻读
```

| 隔离级别 | 解决 | 对标 |
|---------|------|------|
| ReadCommitted（默认） | 脏读 | SQL Server 默认 |
| RepeatableRead | + 不可重复读 | MySQL InnoDB 默认 |
| Serializable | + 幻读 | 最严格、最慢 |

::: warning ⚠️ 和 Spring `@Transactional` 的区别
ASP.NET Core **没有声明式事务注解**（无 `@Transactional`）。事务要么靠 `SaveChanges` 隐式提交，要么手动 `BeginTransaction`。想要"一行注解开事务"的效果，需自己用拦截器/装饰器封装（见 [AOP 与拦截](./aop-and-interception)）。
:::

---

## 并发控制（乐观锁）

防止"后写覆盖先写"，EF Core 用**并发令牌**实现乐观锁。最常用 SQL Server 的 `rowversion`：

```csharp
public class Product
{
    public int Id { get; set; }
    public int Stock { get; set; }

    [Timestamp]                              // rowversion 并发令牌
    public byte[] RowVersion { get; set; } = [];
}

// 更新时 EF 自动在 WHERE 加上 RowVersion 比对
try
{
    product.Stock--;
    await db.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException)
{
    // 期间被别人改过 → RowVersion 不匹配 → 抛异常
    // 处理：重试 / 提示用户 / 合并
}
```

生成的 SQL 类似：`UPDATE Product SET Stock=@s, RowVersion=... WHERE Id=@id AND RowVersion=@old`，影响行数为 0 即冲突。也可用 `[ConcurrencyCheck]` 把任意字段当令牌。

---

## 迁移（Migrations）

EF Core 内置**代码优先迁移**（对标 Flyway/Liquibase，但与实体强绑定）：

```bash
dotnet ef migrations add AddOrderIndex   # 对比模型差异生成迁移类
dotnet ef database update                # 应用到数据库
dotnet ef migrations remove              # 撤销最后一个（未应用时）
dotnet ef database update PreviousName   # 回滚到指定迁移
```

生产环境推荐**生成幂等 SQL 脚本**交由 DBA/流水线执行，而非应用启动时自动迁移：

```bash
dotnet ef migrations script --idempotent -o migrate.sql
```

---

## Dapper：高性能手写 SQL

复杂查询或高频读用 Dapper，直接基于 `IDbConnection` 扩展方法：

```csharp
public class OrderReportRepository(IConfiguration cfg)
{
    private IDbConnection Conn() =>
        new SqlConnection(cfg.GetConnectionString("Default"));

    // 多表 JOIN 报表，手写 SQL 性能最优
    public async Task<List<OrderDto>> TopCustomersAsync(decimal min)
    {
        using var conn = Conn();
        return (await conn.QueryAsync<OrderDto>(
            """
            SELECT o.CustomerName, SUM(o.Amount) AS Total
            FROM Orders o
            WHERE o.Amount >= @min
            GROUP BY o.CustomerName
            ORDER BY Total DESC
            """,
            new { min })).ToList();
    }

    // 参数化查询天然防 SQL 注入
    public Task<Order?> GetAsync(int id)
    {
        using var conn = Conn();
        return conn.QuerySingleOrDefaultAsync<Order>(
            "SELECT * FROM Orders WHERE Id = @id", new { id });
    }
}
```

Dapper 也支持事务：把 `IDbTransaction` 传给 `Execute/Query` 即可。

---

## 仓储模式：要不要用

EF Core 的 `DbSet` 本身已经是仓储、`DbContext` 已经是工作单元，**简单项目直接用 `DbContext` 即可，不必再套一层 Repository**。需要时（隔离持久化、便于测试、切换 ORM）再封装：

```csharp
public interface IOrderRepository
{
    Task<Order?> GetAsync(int id);
    Task AddAsync(Order order);
}

public class OrderRepository(AppDbContext db) : IOrderRepository
{
    public Task<Order?> GetAsync(int id) => db.Orders.FindAsync(id).AsTask();
    public async Task AddAsync(Order order) { db.Orders.Add(order); await db.SaveChangesAsync(); }
}
```

---

## 面试常问 & 怎么答

### Q1: EF Core 和 Dapper 怎么选？

EF Core 是全自动 ORM（LINQ 翻译 SQL、变更跟踪、迁移内置），适合 CRUD 和领域模型、开发快；Dapper 是半自动 micro-ORM（手写 SQL、性能贴近 ADO.NET），适合复杂查询/报表/高频读。实战常混用：写和领域 CRUD 用 EF Core，复杂报表用 Dapper。对标 Java 就是 JPA vs MyBatis。

### Q2: EF Core 的事务怎么管？

两种：① **隐式事务**——一次 `SaveChanges` 本身就是事务，多个实体改动要么全提交要么全回滚；② **显式事务**——`db.Database.BeginTransaction()` 把多次 `SaveChanges` 或原生 SQL 绑进一个事务，手动 `Commit/Rollback`。需要时可指定隔离级别。

### Q3: ASP.NET Core 有 `@Transactional` 吗？

没有声明式事务注解。事务靠 `SaveChanges` 隐式提交或手动 `BeginTransaction`。想要"一行注解开事务"的效果要自己用拦截器/装饰器封装——这是和 Spring 的明显区别。

### Q4: EF Core 怎么做并发控制？

乐观锁：给实体加并发令牌（SQL Server 用 `[Timestamp] byte[] RowVersion`），EF 在 UPDATE 的 WHERE 自动带上令牌比对，期间被改过则影响行数为 0、抛 `DbUpdateConcurrencyException`，再做重试或提示。也可用 `[ConcurrencyCheck]` 把普通字段当令牌。

### Q5: `AsNoTracking()` 有什么用？

默认查询会把实体放进变更跟踪器（为 `SaveChanges` 感知改动），只读场景是浪费。`AsNoTracking()` 跳过跟踪，查询更快、内存更省，只读列表一律加。

### Q6: 生产环境怎么做数据库迁移？

不建议应用启动时自动 `database update`。推荐 `dotnet ef migrations script --idempotent` 生成幂等 SQL，交由 DBA 或 CI/CD 流水线在受控窗口执行，可回滚、可审计。

## 看到什么就先想到这类

- 出现 `DbContext`、`DbSet`、`SaveChanges`、变更跟踪、工作单元。
- 出现 `AsNoTracking`、`Include`、LINQ 翻译 SQL。
- 出现 `BeginTransaction`、隔离级别、`DbUpdateConcurrencyException`、`RowVersion`。
- 出现 EF Core Migrations、Dapper、仓储模式、EF Core vs Dapper 选型。
