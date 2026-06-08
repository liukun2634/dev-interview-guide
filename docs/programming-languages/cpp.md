---
title: C++ 现代特性
---

# C++ 现代特性（C++11/14/17/20/23）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**Modern C++ ≠ C with Class**。2026 大厂面试**必问**：**RAII 与智能指针**、**Move 语义与右值引用**、**Lambda 与函数式**、**模板元编程 / Concepts**、**C++20 协程**、**C++23 std::expected**。能讲清"为什么 unique_ptr 不能拷贝"、"完美转发"、"Concepts 怎么替代 SFINAE" 立刻区分初/中/高级。
:::

## C++ 标准演进（必背时间线）

| 标准 | 年份 | 关键特性 |
|------|------|---------|
| **C++98 / C++03** | 1998 / 2003 | 模板、STL、异常 |
| **C++11**（"现代 C++ 起点"）| 2011 | **auto / lambda / 智能指针 / move / nullptr / range-for / constexpr / std::thread** |
| **C++14** | 2014 | 泛型 lambda、make_unique、变量模板 |
| **C++17** | 2017 | **结构化绑定 / std::optional / std::variant / std::filesystem / if constexpr** |
| **C++20** | 2020 | **Concepts / Modules / Coroutines / Ranges / std::format** |
| **C++23** | 2023 | **std::expected / std::print / 多维下标 / Deducing this** |
| **C++26** | 预计 2026 | **Reflection / Pattern Matching / Senders & Receivers** |

::: warning ⚠️ 国内项目实际版本

> ① **大型项目主流仍在 C++14 / C++17**（GCC 9+ 普及）
> ② **C++20 Modules 编译器支持仍不稳**（MSVC 最好 / GCC 14+ / Clang 19+）
> ③ **新项目首选 C++20 Concepts / Ranges**
> ④ 面试问 "你用什么标准"——**讲熟悉 C++17/20 + 关注 C++23**

:::

---

## C++ 基础（必备）

### 1. 基本类型与初始化

```cpp
// 基本类型
int n = 42;
double d = 3.14;
char c = 'A';
bool b = true;
std::string s = "hello";       // ★ 不是基本类型，是 std::string

// 4 种初始化（必背）
int a = 5;                      // 拷贝初始化
int b(5);                       // 直接初始化
int c{5};                       // ★ 列表初始化（C++11，推荐）
int d = {5};                    // 拷贝列表初始化

// 列表初始化优势：禁止窄化转换
int x{3.14};                    // ❌ 编译错（避免精度丢失）
int y = 3.14;                   // ⚠️ 通过但截断

// auto 自动推导（C++11）
auto i = 42;                    // int
auto v = std::vector<int>{1,2,3};
auto p = std::make_unique<User>("Alice");

// constexpr 编译期常量
constexpr int N = 100;
constexpr auto fib(int n) -> int {
    return n < 2 ? n : fib(n-1) + fib(n-2);
}
constexpr int x = fib(10);      // ★ 编译期计算
```

### 2. 指针与引用

```cpp
int n = 10;

// 指针
int* p = &n;                    // 指针指向 n
*p = 20;                        // 解引用赋值
p = nullptr;                    // ★ C++11，不用 NULL/0

// 引用（不能为空，不能重新绑定）
int& r = n;                     // r 是 n 的别名
r = 30;                         // n 也变 30
// int& r2;                     // ❌ 必须初始化

// const 修饰
const int* p1 = &n;             // 指向常量（不能改值）
int* const p2 = &n;             // 常量指针（不能改地址）
const int* const p3 = &n;       // 两者都不能

// 引用 vs 指针
// - 引用必须初始化、不可空、不可重新绑定
// - 指针可以为空、可重新指向
// 函数参数优先用引用（不需检查 null）
void modify(int& x) { x = 100; }
void modify_ptr(int* x) {       // 需检查
    if (x) *x = 100;
}
```

### 3. 类与继承

```cpp
// 基础类
class User {
public:                           // 公开成员
    User(std::string name, int age)
        : name_(std::move(name)), age_(age) {}     // ★ 成员初始化列表

    std::string name() const { return name_; }     // ★ const 成员函数
    int age() const { return age_; }

    virtual std::string greet() const {            // ★ virtual 允许子类重写
        return "Hello, I'm " + name_;
    }

    virtual ~User() = default;                      // ★ 基类必须有虚析构

private:                          // 私有成员
    std::string name_;
    int age_;
};

// 继承
class Admin : public User {
public:
    Admin(std::string name, int age, std::vector<std::string> perms)
        : User(std::move(name), age), perms_(std::move(perms)) {}

    std::string greet() const override {            // ★ override 显式标记
        return User::greet() + " (admin)";
    }

private:
    std::vector<std::string> perms_;
};

// 抽象类（纯虚函数）
class Animal {
public:
    virtual std::string sound() const = 0;          // ★ = 0 纯虚
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    std::string sound() const override { return "Woof"; }
};
```

### 4. 访问控制 + 友元

```cpp
class Box {
public:                       // 公开（外部可访问）
    void open();
protected:                    // 子类可访问
    int internalState;
private:                      // 仅自己
    int secret;

    friend class Inspector;   // ★ 友元类可访问 private
    friend std::ostream& operator<<(std::ostream&, const Box&);  // 友元函数
};
```

### 5. 操作符重载

```cpp
class Complex {
public:
    Complex(double r, double i) : r_(r), i_(i) {}

    // 成员函数重载
    Complex operator+(const Complex& o) const {
        return {r_ + o.r_, i_ + o.i_};
    }

    bool operator==(const Complex& o) const {
        return r_ == o.r_ && i_ == o.i_;
    }

    // C++20 spaceship operator（自动生成 < > <= >= ==）
    auto operator<=>(const Complex& o) const = default;

    // friend 重载（左操作数非自身类）
    friend std::ostream& operator<<(std::ostream& os, const Complex& c) {
        return os << c.r_ << "+" << c.i_ << "i";
    }

private:
    double r_, i_;
};
```

### 6. 模板基础

```cpp
// 函数模板
template<typename T>
T max(T a, T b) {
    return a > b ? a : b;
}
max(1, 2);                          // T = int
max(1.5, 2.5);                       // T = double
max<int>(1, 2);                      // 显式指定

// 类模板
template<typename T>
class Stack {
public:
    void push(T value) { data_.push_back(value); }
    T pop() { auto v = data_.back(); data_.pop_back(); return v; }
private:
    std::vector<T> data_;
};

Stack<int> s;
s.push(1);
s.push(2);

// 变参模板（C++11）
template<typename... Args>
void print(Args... args) {
    ((std::cout << args << " "), ...);    // C++17 fold expression
    std::cout << "\n";
}
print(1, "hello", 3.14, 'c');
```

### 7. 命名空间

```cpp
namespace mylib {
    class Helper { /* ... */ };
    void log(const std::string& msg);

    // 嵌套
    namespace internal {
        void detail();
    }
}

// 使用
mylib::Helper h;
mylib::internal::detail();

// using 简化
using namespace std;        // ⚠️ 头文件中禁用
using std::cout;            // ✅ 只导入特定符号
using std::string;
```

### 8. 异常处理

```cpp
class FileError : public std::runtime_error {
public:
    FileError(const std::string& path)
        : std::runtime_error("file error: " + path), path_(path) {}
    const std::string& path() const { return path_; }
private:
    std::string path_;
};

try {
    if (!found) throw FileError("/path/to/file");
}
catch (const FileError& e) {
    std::cerr << "FileError on " << e.path() << ": " << e.what() << "\n";
}
catch (const std::exception& e) {           // ★ 一定捕获 const 引用
    std::cerr << "Other: " << e.what() << "\n";
}
catch (...) {                                // 兜底捕获所有
    std::cerr << "unknown\n";
}

// noexcept - 标记不抛异常（编译器可优化）
void safe() noexcept { /* ... */ }

// 析构必须 noexcept
class File {
public:
    ~File() noexcept { /* 默认 noexcept(true) */ }
};
```

### 9. 类型转换

```cpp
// 4 种 C++ 风格转换
int n = 42;

// static_cast - 编译期类型安全转换
double d = static_cast<double>(n);
int* p = static_cast<int*>(some_void_ptr);

// dynamic_cast - 运行时多态转换（基类指针 → 派生类）
Animal* a = new Dog();
Dog* d = dynamic_cast<Dog*>(a);    // ★ 失败返 nullptr

// const_cast - 移除 const
const int* cp = &n;
int* np = const_cast<int*>(cp);    // ⚠️ 危险

// reinterpret_cast - 重新解释二进制位
int* p = reinterpret_cast<int*>(0x1234);    // ⚠️ 最危险

// ❌ C 风格强转（避免）
double d = (double)n;
```

---

## RAII（Resource Acquisition Is Initialization）— C++ 灵魂

**RAII** = **资源生命周期绑定到对象生命周期**。构造时获取，析构时释放。

```cpp
// ❌ C 风格：手动管理资源，易泄漏
void bad() {
    FILE* f = fopen("data.txt", "r");
    if (some_error) {
        return;            // ★ 忘记 fclose() → 泄漏
    }
    // ...
    fclose(f);
}

// ✅ RAII：构造打开，析构关闭，永不泄漏
class File {
public:
    File(const char* path) : f_(fopen(path, "r")) {
        if (!f_) throw std::runtime_error("open failed");
    }
    ~File() { if (f_) fclose(f_); }       // ★ 自动调用
    File(const File&) = delete;             // 禁止拷贝
    File& operator=(const File&) = delete;
private:
    FILE* f_;
};

void good() {
    File f("data.txt");        // ★ 任何路径退出都自动 fclose
    if (some_error) return;
    // ...
}                              // ★ 离开作用域 → 析构 → fclose
```

**RAII 应用**：
- ✅ **智能指针**（unique_ptr / shared_ptr）
- ✅ **lock_guard / unique_lock**（mutex 自动锁/解锁）
- ✅ **std::fstream**（文件自动关闭）
- ✅ **std::vector / std::string**（内存自动释放）

**RAII 是 C++ 远优于 C 的根本原因**——异常安全 + 资源安全自然实现。

---

## 智能指针（必背 3 件套）

### unique_ptr — 独占所有权

```cpp
#include <memory>

// 创建（C++14 起优先 make_unique）
auto p = std::make_unique<User>("Alice", 30);
p->name();        // 像普通指针

// 转移所有权（移动）
std::unique_ptr<User> p2 = std::move(p);
// p 现在为空，p2 持有

// ❌ 拷贝禁止
// std::unique_ptr<User> p3 = p;   // 编译错误

// 作为函数参数（明确转移）
void process(std::unique_ptr<User> u) { /* u 持有 */ }
process(std::move(p2));
```

**为什么 unique_ptr 不能拷贝**：保证**严格单一所有权**——避免 double-free。

### shared_ptr — 共享所有权（引用计数）

```cpp
auto p1 = std::make_shared<User>("Alice", 30);
{
    auto p2 = p1;          // 引用计数 +1（现在 2）
    auto p3 = p1;          // 引用计数 +1（现在 3）
}                          // p2 p3 离开 → 引用计数 -2（现在 1）
// p1 离开 → 引用计数 0 → 析构

std::cout << p1.use_count();  // 看引用计数
```

::: warning ⚠️ shared_ptr 三大坑

> ① **循环引用**：A→B、B→A 都用 shared_ptr → 永远不释放 → 用 **weak_ptr** 打破
> ② **性能开销**：引用计数原子操作 vs unique_ptr 零开销
> ③ **滥用**：默认应该用 unique_ptr，**只有真正需要共享才用 shared_ptr**

:::

### weak_ptr — 不影响生命周期的弱引用

```cpp
auto sp = std::make_shared<User>("Alice", 30);
std::weak_ptr<User> wp = sp;

// 使用时必须 lock() 转 shared_ptr
if (auto p = wp.lock()) {
    p->name();              // 安全使用
} else {
    // 对象已被销毁
}
```

**典型场景**：观察者模式、缓存、解决循环引用。

### 智能指针决策树

```text
需要共享所有权？
├─ No  → unique_ptr（默认）
└─ Yes → 是否会导致循环引用？
         ├─ No  → shared_ptr
         └─ Yes → weak_ptr（打破循环）
```

---

## Move 语义与右值引用（面试 Top 必背）

### 为什么需要 Move

```cpp
// ❌ C++98：拷贝大对象
std::vector<int> create() {
    std::vector<int> v(10'000'000);
    return v;                          // ★ 大对象返回 = 内存复制 10M 个 int
}
auto v = create();                     // 又是 10M 个 int 复制

// ✅ C++11 Move："窃取"而非"复制"
// 只搬指针 + 长度 + 容量 = 3 个变量，O(1)
```

### 左值 vs 右值

```cpp
int a = 5;          // a 是左值（有名字、有地址）
int b = a + 1;      // (a + 1) 是右值（无名字临时值）
foo(a);             // 传左值
foo(a + 1);         // 传右值

// 左值引用
int& ref = a;       // OK
int& ref2 = a + 1;  // ❌ 左值引用不能绑右值

// 右值引用（C++11）
int&& rref = a + 1;     // OK，rref 绑右值
int&& rref2 = a;        // ❌ 右值引用不能绑左值

// 强制转右值
int&& rref3 = std::move(a);   // ★ move 只是类型转换，不真正"移动"
```

### Move 构造 / Move 赋值

```cpp
class Buffer {
public:
    Buffer(size_t n) : data_(new int[n]), size_(n) {}
    ~Buffer() { delete[] data_; }

    // 拷贝构造（深拷贝）
    Buffer(const Buffer& o) : data_(new int[o.size_]), size_(o.size_) {
        std::copy(o.data_, o.data_ + size_, data_);
    }

    // ★ Move 构造（窃取资源）
    Buffer(Buffer&& o) noexcept
        : data_(o.data_), size_(o.size_) {     // 直接接管指针
        o.data_ = nullptr;                      // ★ 关键: 让源对象处于"可析构"状态
        o.size_ = 0;
    }

    // ★ Move 赋值
    Buffer& operator=(Buffer&& o) noexcept {
        if (this != &o) {
            delete[] data_;                     // 释放自己
            data_ = o.data_;                    // 接管
            size_ = o.size_;
            o.data_ = nullptr;
            o.size_ = 0;
        }
        return *this;
    }

private:
    int* data_;
    size_t size_;
};
```

### Rule of Zero / Three / Five

```text
Rule of Zero（最佳）:
  类只用 RAII 成员（unique_ptr / vector / string）
  → 不需要自定义析构 / 拷贝 / move → 编译器全自动

Rule of Three（C++98）:
  自定义析构 → 也必须自定义拷贝构造 + 拷贝赋值

Rule of Five（C++11+）:
  自定义析构 → 必须自定义 5 个: 拷贝构造/赋值 + Move 构造/赋值 + 析构
```

### 完美转发（Perfect Forwarding）

```cpp
// 通用工厂函数
template<typename T, typename... Args>
std::unique_ptr<T> make_unique(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
    //                              ↑ 完美转发：保留左/右值属性
}

// 左值传左值，右值传右值
make_unique<User>(name, 30);              // name 左值 → 拷贝构造 User
make_unique<User>("Alice", 30);            // 字符串字面量 → 移动构造 User
```

**`std::forward` vs `std::move`**：
- `std::move`：**无条件**转右值
- `std::forward`：**条件**转右值（保留原值类别）

---

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

## C++ 内存模型与并发

### `std::atomic`

```cpp
std::atomic<int> counter{0};

// 多线程安全递增
counter.fetch_add(1, std::memory_order_relaxed);
counter++;                                       // 同上

// CAS
int expected = 5, desired = 10;
if (counter.compare_exchange_strong(expected, desired)) {
    // 成功: counter 从 5 改为 10
}
```

### 内存顺序（必背）

| 顺序 | 含义 | 性能 |
|------|------|------|
| `relaxed` | 仅原子性，不保证顺序 | 最快 |
| `acquire` / `release` | 单向同步（"获取" / "释放"）| 中 |
| `acq_rel` | 双向 | - |
| `seq_cst`（默认）| 顺序一致性，强保证 | **最慢** |

```cpp
// 经典: release 写 + acquire 读
std::atomic<bool> ready{false};
int data = 0;

// Thread 1
data = 42;
ready.store(true, std::memory_order_release);

// Thread 2
while (!ready.load(std::memory_order_acquire));
// ★ 这里 data 必定看到 42（release-acquire 同步）
```

### std::jthread（C++20）

```cpp
std::jthread t([]() {
    // 工作
});
// 析构时自动 join，不需手动管理（解决 std::thread 忘记 join 崩溃问题）
```

---

## C++ 编译链接与构建系统

### 编译流程（必背）

```text
.cpp 源码
   ↓ 预处理（cpp / g++ -E）
.i 展开宏 + #include
   ↓ 编译（cc1 / g++ -S）
.s 汇编代码
   ↓ 汇编（as / g++ -c）
.o 目标文件（机器码）
   ↓ 链接（ld / g++）
可执行文件 / 库
```

```bash
# 单步看每个产物
g++ -E hello.cpp -o hello.i        # 预处理
g++ -S hello.cpp -o hello.s        # 汇编
g++ -c hello.cpp -o hello.o        # 目标文件
g++ hello.o -o hello                # 链接

# 一步到位
g++ -std=c++20 -O2 -g -Wall -Wextra hello.cpp -o hello
#       ↑标准    ↑优化 ↑调试 ↑严格警告
```

### 头文件 vs 实现

```cpp
// user.h（声明）
#pragma once                                  // ★ 比 #ifndef 简洁
#include <string>

class User {
public:
    User(std::string name);
    std::string greet() const;
private:
    std::string name_;
};

// user.cpp（实现）
#include "user.h"
User::User(std::string name) : name_(std::move(name)) {}
std::string User::greet() const { return "Hello, " + name_; }

// main.cpp
#include "user.h"
int main() {
    User u("Alice");
    return 0;
}
```

### 静态库 vs 动态库

```bash
# 静态库 .a（Linux）/ .lib（Windows）
g++ -c utils.cpp -o utils.o
ar rcs libutils.a utils.o

# 动态库 .so（Linux）/ .dll（Windows）/ .dylib（Mac）
g++ -shared -fPIC utils.cpp -o libutils.so

# 链接使用
g++ main.cpp -L. -lutils -o main           # -L 路径 -l 库名（去 lib 前缀）

# 运行时找动态库
LD_LIBRARY_PATH=. ./main                    # Linux
```

### CMake（事实标准构建工具）

```cmake
# CMakeLists.txt
cmake_minimum_required(VERSION 3.20)
project(MyApp LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)               # ★ 禁 GNU 扩展

# 可执行文件
add_executable(my-app
    src/main.cpp
    src/user.cpp
)

# 库
add_library(utils STATIC
    src/utils.cpp
)
target_include_directories(utils PUBLIC include)
target_link_libraries(my-app PRIVATE utils)

# 第三方依赖（fmt / spdlog 等）
find_package(fmt CONFIG REQUIRED)
target_link_libraries(my-app PRIVATE fmt::fmt)

# 编译选项
target_compile_options(my-app PRIVATE
    -Wall -Wextra -Wpedantic
    $<$<CONFIG:Release>:-O3>
    $<$<CONFIG:Debug>:-g -O0>
)
```

```bash
# 构建
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j8

# 运行
./build/my-app
```

### 包管理：vcpkg / Conan

```bash
# vcpkg（Microsoft）
vcpkg install fmt spdlog nlohmann-json

# 配合 CMake
cmake -DCMAKE_TOOLCHAIN_FILE=path/to/vcpkg/scripts/buildsystems/vcpkg.cmake -S . -B build

# Conan（Python 实现，最流行）
# conanfile.txt
[requires]
fmt/10.2.0
spdlog/1.13.0
boost/1.84.0
[generators]
CMakeDeps
CMakeToolchain
```

---

## C++ 调试与性能分析

### gdb / lldb（命令行调试）

```bash
g++ -g -O0 main.cpp -o main           # ★ -g 必须，-O0 避免优化丢符号
gdb ./main

(gdb) break main.cpp:42                 # 断点
(gdb) run                                # 启动
(gdb) next        / n                    # 下一行
(gdb) step        / s                    # 步入
(gdb) continue    / c                    # 继续
(gdb) print var   / p var                # 打印
(gdb) backtrace   / bt                   # 调用栈
(gdb) watch var                          # 监视变量
(gdb) info locals                        # 局部变量
(gdb) thread apply all bt                # 所有线程栈
(gdb) quit / q
```

### Sanitizer（地址 / 数据竞争）

```bash
# AddressSanitizer - 检测内存错误（数组越界、UAF、内存泄漏）
g++ -fsanitize=address -fno-omit-frame-pointer -g main.cpp -o main
./main          # 自动报告

# ThreadSanitizer - 检测数据竞争
g++ -fsanitize=thread -g main.cpp -o main

# UBSan - 未定义行为（如有符号溢出）
g++ -fsanitize=undefined -g main.cpp -o main
```

### 性能 profile

```bash
# perf（Linux）
g++ -O2 -g main.cpp -o main
perf record -g ./main
perf report                              # 火焰图首选

# valgrind/callgrind
valgrind --tool=callgrind ./main
kcachegrind callgrind.out.<pid>

# valgrind/memcheck - 检测内存错误（比 ASan 慢但更详细）
valgrind --leak-check=full --show-leak-kinds=all ./main
```

### 静态分析

```bash
clang-tidy main.cpp -- -std=c++20
cppcheck main.cpp
include-what-you-use main.cpp            # 检查头文件依赖
```

---

## 2026 C++ 必装工具链

| 工具 | 用途 |
|------|------|
| **clang-format** | 代码格式化（必装）|
| **clang-tidy** | 静态分析 + 自动修复 |
| **clangd** | LSP，IDE/VSCode 智能提示 |
| **ccache** | 编译缓存，重编译快 5-10× |
| **mold** | 现代链接器（Rust 写，10× ld 速度）|
| **lldb** | 调试器（Clang 系）|
| **CMake** | 构建系统标准 |
| **vcpkg / Conan** | 包管理 |
| **Catch2 / GoogleTest** | 单元测试 |
| **fmt / spdlog** | 格式化 / 日志 |
| **nlohmann/json** | JSON 库 |
| **Boost** | 大杂烩，部分进入标准 |
| **{fmt}** | std::format 的实现源（更稳定）|

---

## C++ vs Java/Go/Rust（必背对比）

| 维度 | C++ | Java | Go | Rust |
|------|-----|------|------|------|
| **内存管理** | 手动 + RAII + smart ptr | GC | GC | **所有权 + 借用检查（编译期）** |
| **并发** | std::thread + future | Thread + virtual thread + ForkJoinPool | **Goroutine + channel（GMP）** | async/await + Tokio |
| **性能** | **最高** | 高 | 中高 | 与 C++ 接近 |
| **学习曲线** | 陡 | 中 | 平缓 | **最陡** |
| **强项** | 系统编程 / 游戏 / 高频交易 | 企业后端 / Android | 云原生 / 网络服务 | **系统编程 / 替代 C++** |
| **2026 趋势** | 仍是高性能首选 | 虚拟线程 + Spring AI | K8s / Docker 生态 | **大幅替代 C++ 新项目** |

::: tip 💡 C++ 仍然不可替代的场景

> ① **超低延迟**（高频交易 < 1µs）
> ② **游戏引擎**（Unreal / Unity 底层）
> ③ **嵌入式 / 实时系统**
> ④ **现有大型 C++ codebase**（Chromium / LLVM / DBMS）
> ⑤ **HPC / 科学计算**（与 CUDA 集成）
>
> **新项目 2026 越来越多选 Rust**（同样性能 + 内存安全）。

:::

---

## C++ 常见陷阱（必背）

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **裸 new/delete** | 内存泄漏 / double-free | 用 unique_ptr / make_unique |
| **shared_ptr 循环引用** | 永远不释放 | 用 weak_ptr 打破 |
| **lambda 按引用捕获悬挂** | UB | 按值或 shared_ptr 共享 |
| **std::move 后用源对象** | UB | move 后只能析构 / 重新赋值 |
| **vector 越界用 []** | UB 不报错 | 用 at() 抛异常或 -D_GLIBCXX_DEBUG |
| **未捕获的异常** | std::terminate | 顶层 try-catch |
| **rule of three/five 不全** | 浅拷贝 + double-free | RAII + Rule of Zero |
| **多线程不用 atomic** | data race UB | std::atomic / mutex |
| **范围 for 修改容器** | 迭代器失效 | 用索引或显式 erase |

---

## 黄金答题模板（必背）

> **面试官：你对 Modern C++ 怎么理解？**
>
> **答**：Modern C++（C++11 起）核心是 **3 件事**：
>
> ① **RAII + 智能指针** —— 资源生命周期绑定对象，`unique_ptr`（独占）/ `shared_ptr`（共享，但慎用）/ `weak_ptr`（破循环引用）；**裸 new/delete 在现代 C++ 应该消失**；
>
> ② **Move 语义** —— 通过右值引用（`T&&`）让大对象返回 / 容器移入移出从 O(n) 变 O(1)；`std::move` 只是类型转换，`std::forward` 用于完美转发；遵循 **Rule of Zero**（用 RAII 成员让编译器自动处理）；
>
> ③ **泛型与函数式** —— Lambda + STL 算法 + C++20 Ranges 让代码声明式、可组合。
>
> **C++20 关键演进**：① **Concepts** 替代晦涩 SFINAE；② **Coroutines** 关键字（生态配合 cppcoro / Asio）；③ **Modules** 编译速度 5-10×（生态尚未成熟）；④ **Ranges** 函数式管道；⑤ **std::format** 类型安全格式化。
>
> **C++23 必懂**：**std::expected** 错误处理革命（零开销 + 强制处理）+ `std::print`。
>
> **2026 视角**：**Rust 在新项目大幅替代 C++**——同样性能 + 编译期内存安全；但**游戏 / 高频交易 / 嵌入式 / 大型存量 codebase 仍是 C++ 主场**。
>
> **必踩坑**：① shared_ptr 循环引用（用 weak_ptr）；② lambda 按引用捕获悬挂；③ move 后用源对象 UB；④ 不写 Rule of Five 的浅拷贝崩。

---

## 看到什么就先想到这类

- **"new / delete"** → 用 unique_ptr / make_unique 替代
- **"循环引用泄漏"** → weak_ptr
- **"大对象返回慢"** → Move 语义（NRVO 也能自动）
- **"模板编译错误一屏"** → C++20 Concepts
- **"异步代码回调地狱"** → C++20 Coroutines
- **"头文件编译慢"** → C++20 Modules
- **"格式化字符串安全"** → std::format / std::print
- **"错误处理不想用异常"** → std::expected
- **"原子操作"** → std::atomic + memory_order
- **"线程忘记 join"** → std::jthread
- **"STL 算法管道"** → C++20 Ranges
- **"emplace_back vs push_back"** → emplace 少一次构造
- **"unordered_map 还是 map"** → unordered 默认（除非需有序）
- **"C++ vs Rust"** → 新项目 Rust 安全更好；存量 / 极致性能仍 C++
