---
title: C# 基础
---

# C# 基础（类型 / OOP / 委托 / 异常 / 反射 / 特性）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--easy">⭐⭐ 入门</span>

::: tip 💡 章节范围
本页覆盖 **C# 基础语法**：.NET 演进时间线、类型系统、字符串、集合、OOP、委托与事件、Nullable Reference Types、异常处理、反射、特性。现代语法（async/Records/Pattern Matching）见 [C# 现代特性](./csharp-modern-features)；CLR/GC/EF/ASP.NET Core 见 [C# 生态](./csharp-ecosystem)；选型对比见 [C# 工程实战](./csharp-engineering)。
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

