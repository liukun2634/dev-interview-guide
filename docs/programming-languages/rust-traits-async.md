---
title: Rust 进阶
---

# Rust 进阶（Result / Trait / async / Tokio）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐⭐ 中高</span>

::: tip 💡 章节范围
本页覆盖 **Rust 高阶抽象**：错误处理（Result + ? + anyhow/thiserror）、Trait（接口 + 泛型 + Trait Object + Send/Sync）、async/await + Tokio。所有权基础见 [Rust 所有权](./rust-ownership)。
:::

## 错误处理 — Result + ?

### `Result<T, E>`

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_file(path: &str) -> Result<String, io::Error> {
    let mut f = File::open(path)?;           // ★ ? 等价于 if err return Err
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}

// 等价于
fn read_file_verbose(path: &str) -> Result<String, io::Error> {
    let mut f = match File::open(path) {
        Ok(f) => f,
        Err(e) => return Err(e),
    };
    // ...
    Ok(s)
}
```

### anyhow / thiserror（生产标准）

```rust
// 应用层：anyhow 简化错误
use anyhow::{Result, Context};

fn process() -> Result<()> {
    let data = std::fs::read_to_string("config.toml")
        .context("failed to read config")?;  // ★ 加上下文
    Ok(())
}

// 库层：thiserror 定义错误类型
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),

    #[error("parse error at line {line}")]
    Parse { line: usize },
}
```

---

## Trait — 接口 + 泛型

```rust
trait Animal {
    fn name(&self) -> String;
    fn sound(&self) -> String;

    // 默认实现
    fn introduce(&self) -> String {
        format!("I'm {}, I say {}", self.name(), self.sound())
    }
}

struct Dog { name: String }

impl Animal for Dog {
    fn name(&self) -> String { self.name.clone() }
    fn sound(&self) -> String { "Woof".to_string() }
}

// 泛型 + trait bound
fn greet<T: Animal>(a: &T) {
    println!("{}", a.introduce());
}

// 或用 impl Trait
fn greet2(a: &impl Animal) { ... }

// 多个 trait bound
fn print_clone<T: Animal + Clone + Debug>(a: T) { ... }

// where 子句更清晰
fn complex<T, U>(a: T, b: U)
where
    T: Animal + Clone,
    U: Debug + Send + Sync,
{ ... }
```

### Trait Object（动态分发）

```rust
// 类似多态
fn animals(list: Vec<Box<dyn Animal>>) {
    for a in &list {
        println!("{}", a.introduce());
    }
}

let zoo: Vec<Box<dyn Animal>> = vec![
    Box::new(Dog { name: "Rex".into() }),
    // Box::new(Cat { ... }),
];
animals(zoo);
```

### 关键 Trait（必背）

| Trait | 作用 |
|-------|------|
| `Clone` / `Copy` | 复制 |
| `Debug` / `Display` | 格式化输出 |
| `PartialEq` / `Eq` | 相等比较 |
| `Iterator` | 迭代器 |
| `From` / `Into` | 类型转换 |
| `Drop` | 析构（类似 C++ ~T()）|
| **`Send`** | **能跨线程发送**（编译期检查）|
| **`Sync`** | **能跨线程共享引用** |

```rust
// Send + Sync 自动派生（auto trait）
struct ThreadSafe { x: i32, y: String }   // 自动 Send + Sync

struct ThreadUnsafe { x: Rc<i32> }         // Rc 非 Send + Sync
// → 编译器拒绝跨线程发送
```

---

## async/await + Tokio

### 基础

```rust
async fn fetch(url: &str) -> Result<String> {
    let resp = reqwest::get(url).await?;
    let body = resp.text().await?;
    Ok(body)
}

#[tokio::main]                              // ★ runtime macro
async fn main() {
    let body = fetch("https://example.com").await.unwrap();
    println!("{}", body);
}
```

### 并发执行

```rust
use futures::future::join_all;

let urls = vec!["a", "b", "c"];

// 顺序执行
for url in &urls {
    fetch(url).await?;                      // 串行
}

// 并发执行
let tasks: Vec<_> = urls.iter().map(|u| fetch(u)).collect();
let results = join_all(tasks).await;         // ★ 并发

// 或用 tokio::join!（编译期已知数量）
let (a, b, c) = tokio::join!(
    fetch("a"),
    fetch("b"),
    fetch("c"),
);
```

### Select 多路

```rust
use tokio::select;

select! {
    a = fetch("a") => println!("{:?}", a),
    b = fetch("b") => println!("{:?}", b),
    _ = tokio::time::sleep(Duration::from_secs(1)) => println!("timeout"),
}
```

### Tokio runtime 类型

| Runtime | 用途 |
|---------|------|
| `#[tokio::main]` | 多线程 runtime（默认 = CPU 核数）|
| `#[tokio::main(flavor = "current_thread")]` | 单线程 runtime |
| `tokio::spawn(async {})` | spawn task（必须在 runtime 内）|

::: warning ⚠️ Rust async 痛点（vs Go）

> ① **runtime 不是标准库**——必须选 Tokio（事实标准）/ async-std / smol
> ② **着色问题**（function coloring）——async 函数不能直接调同步函数（block_in_place 解决）
> ③ **async fn in trait** 1.75 才稳定，老代码大量 #[async_trait] 宏
> ④ **生命周期 + async + 借用** 错误最难调
> ⑤ **生态早期碎片化**（async-std 一度有声音，现在 Tokio 一统）

:::

---

