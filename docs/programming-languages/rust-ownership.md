---
title: Rust 所有权
---

# Rust 所有权系统（Ownership / Borrowing / Lifetime / 智能指针）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐⭐ 中高</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 章节范围
本页覆盖 **Rust 核心 — 内存安全 + 零开销 4 大支柱**：所有权 3 规则、借用规则、Lifetime 与省略规则、智能指针 4 件套（Box/Rc/Arc/RefCell/Mutex/RwLock + 决策树）。语法基础见 [Rust 基础](./rust-fundamentals)。
:::

## 所有权（Ownership）— Rust 灵魂

### 3 大规则（必背）

```text
1. Rust 中的每个值都有一个所有者（owner）
2. 同一时间只能有一个所有者
3. 当所有者离开作用域 → 值被自动 drop
```

### 示例

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;                        // ★ 所有权移动（move）
    // println!("{}", s1);              // ❌ 编译错: s1 已失效
    println!("{}", s2);                  // ✅
}                                        // ← s2 离开作用域，String 被 drop
```

```rust
// 函数传参也是所有权转移
fn take(s: String) {
    println!("{}", s);
}                                        // ← s 在这 drop

fn main() {
    let s = String::from("hello");
    take(s);
    // println!("{}", s);                // ❌ s 已被移走
}
```

### Copy vs Move

```rust
// 实现 Copy trait 的类型（基本类型、不可变引用、定长数组）→ 复制而非移动
let x = 5;
let y = x;                              // ★ Copy
println!("{} {}", x, y);                 // ✅ 都能用

// 非 Copy 类型（String、Vec、HashMap）→ Move
let s = String::from("hello");
let t = s;
// println!("{}", s);                    // ❌
```

---

## 借用（Borrowing）— & 引用

```rust
fn calculate_length(s: &String) -> usize {     // ★ 借用，不拥有
    s.len()
}                                                // ← s 离开，但不 drop String

fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s);              // ★ 传引用
    println!("{} length is {}", s, len);         // ✅ s 仍可用
}
```

### 借用规则（必背）

```text
1. 同一时间，可以有 1 个可变引用 (&mut T)
   或者 任意多个不可变引用 (&T)
   ★ 但不能同时有可变和不可变
2. 引用必须始终有效（防止悬挂）
```

```rust
let mut s = String::from("hello");

// ❌ 同时多个可变引用
let r1 = &mut s;
let r2 = &mut s;                        // ❌ 编译错
println!("{} {}", r1, r2);

// ❌ 不可变 + 可变混用
let r1 = &s;
let r2 = &s;
let r3 = &mut s;                        // ❌
println!("{} {} {}", r1, r2, r3);

// ✅ 修复: 让前面的引用先死
let r1 = &s;
let r2 = &s;
println!("{} {}", r1, r2);               // r1 r2 在这后不再使用
let r3 = &mut s;                         // ✅ NLL 允许
println!("{}", r3);
```

::: tip 💡 借用检查器价值

> ① 编译期就抓到 **数据竞争**（多线程同时读写同一数据）
> ② 编译期就抓到 **use-after-free**（用了已 drop 的数据）
> ③ 编译期就抓到 **double-free**（重复释放）
> ④ **零运行时开销**（vs Java GC 暂停 / C++ smart pointer 引用计数）

:::

---

## Lifetime（生命周期）

### 为什么需要

```rust
// ❌ 悬挂引用
fn dangle() -> &String {                // ★ 返回引用
    let s = String::from("hello");
    &s                                  // ★ 但 s 函数结束就 drop
}                                       // → 返回的引用悬挂

// ✅ 改返回拥有的值
fn no_dangle() -> String {
    String::from("hello")
}
```

### 生命周期标注

```rust
// 'a 是生命周期参数（编译期约束）
fn longest<'a>(s1: &'a str, s2: &'a str) -> &'a str {
    if s1.len() > s2.len() { s1 } else { s2 }
}
//                            ↑ 返回值的生命周期 = 输入参数中较短的那个
```

### 生命周期省略规则（编译器自动推导）

```rust
// 三大规则:
// 1. 每个引用参数都有自己的生命周期
// 2. 单输入引用 → 输出生命周期 = 输入
// 3. self 是 &self / &mut self → 输出生命周期 = self

// 这两个等价（编译器自动推导）
fn first_word(s: &str) -> &str { ... }
fn first_word<'a>(s: &'a str) -> &'a str { ... }
```

### 静态生命周期

```rust
let s: &'static str = "hello";          // ★ 'static = 程序整个生命周期
                                         // ★ 字符串字面量天生 'static
```

---

## 智能指针（Smart Pointer）

### 4 大主流

| 指针 | 用途 | 线程安全 | 引用计数 |
|------|------|---------|---------|
| **`Box<T>`** | 堆分配单一所有权 | ✅（受所有权约束）| 无 |
| **`Rc<T>`** | 单线程引用计数 | ❌ | ✅ |
| **`Arc<T>`** | 多线程引用计数（原子）| ✅ | ✅ |
| **`RefCell<T>`** | 单线程内部可变性（运行时借用检查）| ❌ | 无 |
| **`Mutex<T>` / `RwLock<T>`** | 多线程内部可变性 | ✅ | 无 |

### 决策树

```text
单一所有权 + 堆? → Box
共享所有权 + 单线程? → Rc
共享所有权 + 多线程? → Arc
单线程内部可变? → RefCell
多线程内部可变? → Mutex / RwLock

经典组合:
  Rc<RefCell<T>>     单线程共享 + 可变
  Arc<Mutex<T>>      多线程共享 + 互斥可变
  Arc<RwLock<T>>     多线程共享 + 读写锁
```

### 示例

```rust
use std::rc::Rc;
use std::cell::RefCell;
use std::sync::{Arc, Mutex};

// Rc + RefCell（单线程）
let shared = Rc::new(RefCell::new(0));
let cloned = Rc::clone(&shared);
*shared.borrow_mut() += 1;              // 修改值
println!("{}", cloned.borrow());         // 1

// Arc + Mutex（多线程）
let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];
for _ in 0..10 {
    let c = Arc::clone(&counter);
    handles.push(std::thread::spawn(move || {
        let mut num = c.lock().unwrap();
        *num += 1;
    }));
}
for h in handles { h.join().unwrap(); }
println!("{}", *counter.lock().unwrap());  // 10
```

---

