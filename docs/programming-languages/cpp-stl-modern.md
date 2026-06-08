---
title: C++ STL 与现代特性
---

# C++ STL 与现代特性（容器 / Lambda / C++20 / C++23）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span>

::: tip 💡 章节范围
本页覆盖 **C++ 标准库与新版语言特性**：STL 容器（vector/map/unordered_map/set + emplace 等性能要点）、Ranges（C++20）、Lambda 与函数式、C++20 关键特性（Concepts / Coroutines / Modules / format / Ranges）、C++23 新特性（std::expected / std::print / 多维下标）。内存管理见 [C++ 内存管理](./cpp-memory-management)。
:::

## STL 必知必会

### 5 大容器类型

| 类型 | 代表 | 底层 | 复杂度 |
|------|------|------|--------|
| **顺序容器** | `vector` / `array` / `deque` / `list` | 动态数组 / 双端队列 / 链表 | vector 尾部 push O(1)，中间插 O(n) |
| **关联容器** | `set` / `map` / `multiset` / `multimap` | **红黑树** | 查/插/删 O(log n) |
| **无序关联** | `unordered_set` / `unordered_map` | **哈希表** | 平均 O(1)，最坏 O(n) |
| **容器适配器** | `stack` / `queue` / `priority_queue` | 基于其他容器 | - |
| **C++20 新** | `span` / `mdspan` | 视图（非拥有）| - |

### vector 关键性能

```cpp
std::vector<int> v;
v.reserve(1000);                    // ★ 预分配，避免反复 realloc
for (int i = 0; i < 1000; ++i) {
    v.push_back(i);                 // 摊销 O(1)
    v.emplace_back(i);              // ★ 原地构造，比 push_back 少一次拷贝/move
}
```

::: tip 💡 emplace_back vs push_back

> `push_back(obj)`：先构造 obj 再 move 进去
> `emplace_back(args...)`：在 vector 内部直接构造，**少一次构造/move**
> 性能敏感场景优先 emplace_*

:::

### unordered_map vs map（C++ 版"HashMap vs TreeMap"）

| 维度 | `std::map` | `std::unordered_map` |
|------|-----------|---------------------|
| **底层** | 红黑树 | 哈希表 |
| **有序** | ✅ key 升序 | ❌ |
| **查询** | O(log n) | 平均 O(1) |
| **内存** | 较低 | 较高（哈希桶 + 链表）|
| **稳定性** | 迭代器稳定 | rehash 后失效 |
| **选型** | 需要有序 / 范围查询 | 纯 KV 高频查 |

### Ranges（C++20，必学）

**STL 算法 + 管道操作，类 Python / Rust iterator**：

```cpp
#include <ranges>
#include <vector>

std::vector<int> v = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

// ✨ 函数式管道（取偶数 → 平方 → 取前 3 个）
auto result = v
    | std::views::filter([](int x) { return x % 2 == 0; })
    | std::views::transform([](int x) { return x * x; })
    | std::views::take(3);

for (int x : result) {
    std::cout << x << " ";          // 4 16 36
}
```

**Ranges 优势**：
- ✅ **lazy evaluation**（仅最终遍历时计算）
- ✅ 类型安全 + 编译期错误清晰
- ✅ 替代繁琐的 `begin()/end()` 二参数 API

---

## Lambda 与函数式

```cpp
// 基础
auto add = [](int a, int b) { return a + b; };

// 捕获
int x = 10;
auto by_value   = [x]() { return x; };       // 按值捕获
auto by_ref     = [&x]() { return x; };       // 按引用捕获
auto by_all_val = [=]() { return x; };        // 全部按值
auto by_all_ref = [&]() { return x; };        // 全部按引用
auto init       = [y = 100]() { return y; };  // C++14 init capture

// 泛型 lambda（C++14）
auto generic = [](auto a, auto b) { return a + b; };
generic(1, 2);          // 推导 int
generic(1.5, 2.5);      // 推导 double

// 模板 lambda（C++20）
auto typed = []<typename T>(T a, T b) { return a + b; };
```

::: warning ⚠️ Lambda 按引用捕获悬挂引用

> Lambda 异步执行时如果按引用捕获了局部变量，**变量销毁后 lambda 才执行 → 悬挂引用**：
>
> ```cpp
> void bad() {
>     int x = 10;
>     std::thread t([&x]() {
>         std::cout << x;          // ★ 可能在 x 销毁后访问
>     });
>     t.detach();
> }
> ```
>
> 修复：按值捕获，或用 `std::shared_ptr` 共享所有权。

:::

---

## C++20 重要特性（必背）

### 1. Concepts — 替代 SFINAE

```cpp
// ❌ C++17 之前：SFINAE 模板技巧（晦涩）
template<typename T,
         typename = std::enable_if_t<std::is_integral_v<T>>>
T add(T a, T b) { return a + b; }

// ✅ C++20 Concepts：可读性飞跃
template<std::integral T>
T add(T a, T b) { return a + b; }

// 或用 requires 子句
template<typename T>
requires std::integral<T> && (sizeof(T) >= 4)
T add(T a, T b) { return a + b; }

// 编译错误信息清晰
add("hello", "world");  // ❌ 报错: 'const char*' does not satisfy 'integral'
```

### 2. Coroutines（协程）

**C++20 提供协程关键字**（`co_await` / `co_yield` / `co_return`），但**标准库支持有限**——通常配合 **cppcoro / Boost.Asio** 用：

```cpp
#include <coroutine>

// 简化生成器示例（实际需自定义 promise_type）
generator<int> fib() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;          // ★ 暂停 + 返回 a
        auto tmp = a;
        a = b;
        b = tmp + b;
    }
}

for (int n : fib() | std::views::take(10)) {
    std::cout << n << " ";   // 0 1 1 2 3 5 8 13 21 34
}
```

**适用场景**：异步 I/O、生成器、协作多任务（替代回调地狱）。

### 3. Modules — 替代 `#include`

```cpp
// math.cppm（模块接口文件）
export module math;
export int add(int a, int b) { return a + b; }
export double pi = 3.14159;

// main.cpp
import math;
int main() {
    std::cout << add(1, 2);
    std::cout << pi;
}
```

**优势**：
- ✅ 编译速度 **5-10×**（不再重复 parse 头文件）
- ✅ 真正隔离（不污染宏命名空间）
- ⚠️ **生态尚未成熟**（CMake 支持中、第三方库少）

### 4. std::format — 类 Python f-string

```cpp
#include <format>

auto s = std::format("Hello, {}! You are {} years old.", "Alice", 30);

// 格式化数字
std::format("{:.2f}", 3.14159);          // "3.14"
std::format("{:>10}", "right");          // 右对齐
std::format("{:0>5}", 42);                // "00042"
```

替代 `printf` / `iostream`，**类型安全 + 编译期检查**。

### 5. Ranges（前面已讲）

---

## C++23 关键新特性

### std::expected — 错误处理革命

```cpp
#include <expected>

std::expected<User, std::string> findUser(int id) {
    if (id < 0) return std::unexpected("invalid id");
    return User{id, "Alice"};
}

auto result = findUser(42);
if (result) {
    std::cout << result->name;          // 成功
} else {
    std::cerr << result.error();         // 错误信息
}
```

**比异常好在**：
- ✅ **零开销** abstraction
- ✅ 强制调用方处理错误（不能忽略）
- ✅ 适合嵌入式 / 实时系统（很多禁用异常）

### std::print（C++23）

```cpp
#include <print>
std::print("Hello, {}!\n", "World");       // 类 Python print
std::println("x = {}", 42);                 // 自动加换行
```

### 多维下标

```cpp
matrix[i, j] = 1.0;       // C++23 起合法
//           ↑ 之前必须 matrix[i][j]
```

---

