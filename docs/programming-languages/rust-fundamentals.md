---
title: Rust 基础
---

# Rust 基础（变量 / Struct / Enum / Match / 集合 / Cargo）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--easy">⭐⭐ 入门</span>

::: tip 💡 章节范围
本页覆盖 **Rust 基础语法**：变量与可变性、字符串（String vs &str）、struct/enum、match 模式匹配、3 大集合、迭代器、函数与闭包、Cargo 项目结构、模块、测试。所有权系统见 [Rust 所有权](./rust-ownership)；Trait 和 async 见 [Rust 进阶](./rust-traits-async)；生态与工程见 [Rust 工程实战](./rust-engineering)。
:::

## Rust 演进时间线

| Edition / 版本 | 年份 | 关键变化 |
|---------------|------|---------|
| **Rust 1.0** | 2015.5 | 正式发布 |
| **Edition 2018** | 2018 | NLL（非词法生命周期）、async/await 预演 |
| **Rust 1.39** | 2019.11 | **🔥 async/await 稳定** |
| **Edition 2021** | 2021 | Disjoint closure capture、IntoIterator for array |
| **Rust 1.65** | 2022 | **GATs（泛型关联类型）** |
| **Rust 1.75** | 2023.12 | **async fn in trait** 稳定 |
| **Edition 2024** | 2024.11 | **🔥 if let chains、let else 更稳、async closure** |
| **Rust 1.84** | 2025.1 | trait 改进、性能优化 |

::: warning ⚠️ 2026 主流版本

> ① 生产稳定：**Edition 2021 / 2024**
> ② **大型项目升 Edition 2024 后**新写法可用：if let chains、async closure
> ③ **async fn in trait**（1.75+）解决了之前必须用 async_trait 宏的痛
> ④ **Polonius**（新借用检查器）仍在开发，能解决一些假阳性

:::

---

## Rust 为什么火

### 2024-2026 关键事件

| 事件 | 意义 |
|------|------|
| **Linux 内核 6.1 接受 Rust**（2022）| **首次允许 C 之外语言进内核** |
| **Microsoft Azure CTO 公开推 Rust** | 大公司战略级背书 |
| **Cloudflare Pingora（Rust）替代 Nginx** | 处理全球 25% HTTP 请求 |
| **Discord、Dropbox、Figma 重要服务用 Rust** | 性能 / 安全双赢 |
| **Python 生态 Rust 化** | Pydantic v2 / uv / ruff / Polars 都是 Rust |
| **Node.js 工具 Rust 化** | Rspack / Turbopack / Biome / SWC 都是 Rust |

### 为什么 Rust 受追捧

```text
传统选择痛点:
  C/C++:  极致性能，但内存安全靠程序员自觉 → 70% CVE 是内存安全漏洞
  Java/Go: 内存安全，但 GC 暂停 + 启动慢 + 内存开销大
  Python:  开发效率高，但性能差 + GIL

Rust 的承诺:
  ✅ 内存安全（编译期保证，无 GC）
  ✅ 性能与 C/C++ 相当（零成本抽象）
  ✅ 并发安全（数据竞争编译期拒绝）
  ✅ 现代语言特性（pattern matching、trait、cargo）
```

---

## Rust 基础（必备）

### 1. 变量与可变性

```rust
// 默认不可变
let x = 5;
// x = 6;                      // ❌ 编译错

// 显式 mut 可变
let mut y = 10;
y = 20;                         // ✅

// shadowing（重新绑定，可改类型）
let s = "5";
let s = s.parse::<i32>().unwrap();      // ★ s 现在是 i32

// 常量（必须显式类型 + 大写）
const MAX_SIZE: usize = 100;

// 字符串字面量（'static lifetime）
let lit: &'static str = "hello";

// 基本类型
let i: i32 = 42;
let u: u64 = 100;
let f: f64 = 3.14;
let b: bool = true;
let c: char = 'A';                       // ★ 4 字节 Unicode
let tup: (i32, f64, bool) = (1, 1.5, true);
let arr: [i32; 5] = [1, 2, 3, 4, 5];

// 元组解构
let (a, b, c) = tup;
let first = tup.0;
```

### 2. 字符串：String vs &str（必背痛点）

```rust
// &str - 字符串切片（不可变引用，UTF-8）
let s: &str = "hello";          // 字面量
let s2: &str = &String::from("hi");

// String - 堆上拥有的字符串（可变 + 增长）
let mut s = String::from("hello");
s.push_str(", world");           // 追加 &str
s.push('!');                     // 追加 char

// 互转
let s1: String = String::from("hello");
let s2: &str = &s1;              // String → &str（隐式）
let s3: String = s2.to_string(); // &str → String

// 函数参数
fn print(s: &str) { println!("{}", s); }   // ★ 接受 String 和 &str 都可

// 字符串拼接
let s = format!("{} {}", "a", "b");           // ★ 推荐
let s = "a".to_string() + " " + "b";           // 不优雅
```

### 3. 结构体与枚举

```rust
// 结构体
struct User {
    name: String,
    age: u32,
}

// 创建
let u = User { name: "Alice".to_string(), age: 30 };
println!("{} {}", u.name, u.age);

// 元组结构体
struct Point(f64, f64);
let p = Point(1.0, 2.0);
println!("{} {}", p.0, p.1);

// 单元结构体（无字段，用于 trait 标记）
struct Marker;

// 方法 - impl 块
impl User {
    // 构造器（按惯例）
    fn new(name: &str, age: u32) -> Self {
        User { name: name.to_string(), age }
    }

    // 不可变方法
    fn greet(&self) -> String {
        format!("Hello, {}", self.name)
    }

    // 可变方法
    fn birthday(&mut self) {
        self.age += 1;
    }

    // 关联函数（类似 static）
    fn default_user() -> Self {
        User::new("anonymous", 0)
    }
}

// 枚举（远强于 C++ enum）
enum Shape {
    Circle(f64),                 // 关联数据
    Rectangle { width: f64, height: f64 },
    Triangle(f64, f64, f64),
}

let s = Shape::Circle(1.0);

// Option<T> - 替代 null
let some: Option<i32> = Some(42);
let none: Option<i32> = None;

if let Some(v) = some {
    println!("{}", v);
}

// Result<T, E> - 错误处理（前面详述）
```

### 4. 模式匹配（match）

```rust
let n = 7;

let desc = match n {
    0           => "zero",
    1 | 2 | 3   => "small",      // 多值
    4..=10      => "medium",      // 范围
    n if n > 100 => "huge",       // guard
    _           => "other",       // 通配（必须）
};

// 解构
let pair = (1, 2);
match pair {
    (0, 0) => println!("origin"),
    (x, 0) => println!("on x-axis at {}", x),
    (0, y) => println!("on y-axis at {}", y),
    (x, y) => println!("at ({}, {})", x, y),
}

// 枚举匹配
match shape {
    Shape::Circle(r)            => 3.14 * r * r,
    Shape::Rectangle { width, height } => width * height,
    Shape::Triangle(a, b, c)    => /* ... */ 0.0,
}

// if let（简化单一匹配）
if let Some(v) = optional {
    println!("{}", v);
}

// while let
while let Some(top) = stack.pop() {
    println!("{}", top);
}

// let else（Rust 1.65+，提前返回）
let Some(v) = optional else {
    return;                       // 没值就退出
};
// v 在这里可用
```

### 5. 集合（Vec / HashMap / HashSet）

```rust
use std::collections::{HashMap, HashSet};

// Vec - 动态数组
let mut v: Vec<i32> = Vec::new();
v.push(1);
v.push(2);

let v = vec![1, 2, 3, 4, 5];      // 宏

v[0];                              // 索引（越界 panic）
v.get(0);                          // 返 Option<&i32>
v.len();
v.iter().sum::<i32>();
v.iter().filter(|&&x| x > 2).collect::<Vec<_>>();

// HashMap
let mut scores: HashMap<String, i32> = HashMap::new();
scores.insert("Alice".to_string(), 95);
scores.insert("Bob".to_string(), 87);

// 查询
if let Some(&score) = scores.get("Alice") {
    println!("{}", score);
}

// 默认值
let count = scores.entry("Carol".to_string()).or_insert(0);
*count += 1;

// 遍历
for (k, v) in &scores {
    println!("{}: {}", k, v);
}

// HashSet
let mut set: HashSet<i32> = HashSet::new();
set.insert(1);
set.insert(2);
set.contains(&1);
```

### 6. 迭代器（Rust 核心抽象）

```rust
let v = vec![1, 2, 3, 4, 5];

// 3 种迭代方式
v.iter()           // 借用 &T
 .for_each(|x| println!("{}", x));

v.iter_mut()       // 可变借用 &mut T
 .for_each(|x| *x *= 2);

let sum: i32 = v.into_iter()  // 消耗所有权 T
                .sum();

// 函数式管道
let result: Vec<i32> = (0..100)
    .filter(|x| x % 2 == 0)        // 偶数
    .map(|x| x * x)                 // 平方
    .take(5)                         // 前 5
    .collect();

// 常用方法
v.iter().sum::<i32>();
v.iter().product::<i32>();
v.iter().count();
v.iter().min();
v.iter().max();
v.iter().fold(0, |acc, x| acc + x);
v.iter().any(|&x| x > 3);
v.iter().all(|&x| x > 0);
v.iter().find(|&&x| x > 2);
v.iter().position(|&x| x == 3);
v.iter().enumerate();              // (i, &T)
v.iter().zip(other.iter());        // 配对
v.iter().chain(other.iter());      // 串联
```

### 7. 函数与闭包

```rust
// 函数
fn add(a: i32, b: i32) -> i32 {
    a + b                          // 末表达式无 ; 即返回
}

// 多返回值用元组
fn divide(a: i32, b: i32) -> (i32, i32) {
    (a / b, a % b)
}
let (q, r) = divide(10, 3);

// 闭包
let add = |a, b| a + b;
let add = |a: i32, b: i32| -> i32 { a + b };

// 捕获模式
let s = String::from("hello");
let print = || println!("{}", s);            // 借用
let consume = move || println!("{}", s);     // ★ move 转移所有权

// 闭包作为参数（3 种 trait）
fn apply<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {
    f(x)
}
fn apply_mut<F: FnMut(i32)>(mut f: F, x: i32) { f(x); }
fn apply_once<F: FnOnce(String)>(f: F, s: String) { f(s); }

// 返回闭包
fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y
}
let add5 = make_adder(5);
add5(10);                                     // 15
```

### 8. Cargo 项目结构（必背）

```text
my-app/
├── Cargo.toml                ← 项目配置 + 依赖
├── Cargo.lock                ← 锁定版本（提交到 git）
├── src/
│   ├── main.rs               ← 二进制入口
│   ├── lib.rs                ← 库入口（可选）
│   ├── bin/                  ← 多个二进制
│   │   └── tool.rs
│   └── modules/
│       └── user.rs
├── tests/                    ← 集成测试
│   └── integration_test.rs
├── benches/                  ← 基准测试
└── examples/                 ← 示例代码
```

### 9. 模块系统

```rust
// src/lib.rs
mod user;                              // 声明子模块（找 user.rs）
mod admin;
pub use user::User;                    // 重新导出

// src/user.rs
pub struct User {
    pub name: String,
    pub age: u32,
}

impl User {
    pub fn new(name: &str, age: u32) -> Self { ... }

    fn internal_helper() { ... }       // 包内
}

// 嵌套模块
mod outer {
    pub mod inner {
        pub fn func() {}
    }
}

outer::inner::func();
```

### 10. 测试（内置）

```rust
// src/lib.rs
pub fn add(a: i32, b: i32) -> i32 { a + b }

#[cfg(test)]                            // ★ 只在测试时编译
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(1, 2), 3);
        assert!(add(0, 0) == 0);
        assert_ne!(add(1, 1), 3);
    }

    #[test]
    #[should_panic]
    fn test_panic() {
        panic!("oops");
    }

    #[test]
    fn test_result() -> Result<(), String> {
        if add(1, 1) != 2 {
            return Err("wrong".into());
        }
        Ok(())
    }
}
```

```bash
cargo test                              # 跑所有测试
cargo test add                          # 名字过滤
cargo test -- --nocapture                # 显示 println
cargo test -- --test-threads=1           # 串行
cargo bench                              # 跑基准（需 criterion）
```

---

