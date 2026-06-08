---
title: C++ 基础
---

# C++ 基础（类型 / 指针 / 类 / 模板 / 异常 / 转换）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--easy">⭐⭐ 入门</span>

::: tip 💡 章节范围
本页覆盖 **C++ 基础语法**：标准演进时间线（C++11-23）、类型系统、4 种初始化、指针 vs 引用、const 三种位置、类与继承、virtual/override、操作符重载（含 spaceship）、模板（含变参 + fold expression）、namespace、异常 + noexcept、4 种 C++ 风格类型转换。RAII + 智能指针 + Move 见 [C++ 内存管理](./cpp-memory-management)；STL + Lambda + C++20/23 见 [C++ STL 与现代特性](./cpp-stl-modern)；并发与工具链见 [C++ 并发与工具链](./cpp-toolchain)；选型对比见 [C++ 工程实战](./cpp-engineering)。
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

