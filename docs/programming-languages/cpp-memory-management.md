---
title: C++ 内存管理
---

# C++ 内存管理（RAII / 智能指针 / Move 语义）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐⭐ 中高</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 章节范围
本页覆盖 **C++ 灵魂三件套**：RAII（资源获取即初始化）、智能指针（unique_ptr / shared_ptr / weak_ptr + 决策树）、Move 语义与右值引用（左值/右值、Move 构造、Rule of Zero/Three/Five、完美转发）。语法基础见 [C++ 基础](./cpp-fundamentals)。
:::

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

