---
title: C++ 并发与工具链
---

# C++ 并发与工具链（atomic / CMake / 编译链接 / 调试）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span>

::: tip 💡 章节范围
本页覆盖 **C++ 并发原语 + 工程构建工具链**：内存模型与并发（std::atomic / memory_order / std::jthread）、编译流程（预处理/编译/汇编/链接）、静态库 vs 动态库、CMake、vcpkg/Conan 包管理、gdb/lldb 调试、Sanitizer（ASan/TSan/UBSan）、perf/valgrind 性能、2026 现代工具链（mold/ccache/clangd）。语法基础见 [C++ 基础](./cpp-fundamentals)。
:::

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

