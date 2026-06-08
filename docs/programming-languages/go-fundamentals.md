---
title: Go 基础
---

# Go 基础（变量 / 切片 / Map / Struct / Interface / Modules）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--easy">⭐⭐ 入门</span>

::: tip 💡 章节范围
本页覆盖 **Go 语言基础语法**：变量、基本类型、数组与切片、Map、Struct、Interface、函数、控制流、包与 Modules、测试、标准库。深度并发原理见 [Go 并发](./go-concurrency)；现代特性（泛型/迭代器/错误处理）见 [Go 现代特性](./go-modern-features)；性能与工程实战见 [Go 工程实战](./go-engineering)。
:::

## Go 演进时间线

| 版本 | 年份 | 关键特性 |
|------|------|---------|
| **Go 1.0** | 2012 | 标准库稳定 |
| **Go 1.5** | 2015 | **自举编译（Go 写 Go）** + 并发 GC |
| **Go 1.11** | 2018 | **Go Modules**（取代 GOPATH）|
| **Go 1.18** | 2022 | **🔥 泛型（Generics）** + Workspace |
| **Go 1.21** | 2023 | min/max/clear 内置、structured logging（slog）|
| **Go 1.22** | 2024 | **for-range 语义修复**（每次新变量）、`http.ServeMux` 路由增强 |
| **Go 1.23** | 2024.8 | **🔥 Range-over-func 迭代器** + 增强 GC |
| **Go 1.24** | 2025.2 | **泛型类型别名 GA**、Swiss Table map（更快 30%）|

::: warning ⚠️ 2026 主流版本

> ① 生产稳定：**Go 1.22 / 1.23**
> ② **Go 1.22 之前的 for 循环变量复用** 是经典坑（必须知道）
> ③ 国内大厂普遍 1.21+
> ④ 字节、滴滴、Bilibili、PingCAP 都是 Go 重度使用

:::

---

## Go 基础（必备）

### 1. 变量与基本类型

```go
// 变量声明 4 种
var x int = 10        // 完整声明
var y = 20            // 类型推导
z := 30                // ★ 短声明（最常用，仅函数内）
const Pi = 3.14        // 常量

// 零值
var i int       // 0
var s string    // ""
var b bool      // false
var p *int      // nil
var sl []int    // nil
var m map[string]int  // nil

// 基本类型
int / int8 / int16 / int32 / int64
uint / uint8(byte) / uint16 / uint32 / uint64
float32 / float64
complex64 / complex128
bool / string
rune        // = int32（Unicode code point）
byte        // = uint8

// 类型转换（必显式）
var i int = 42
var f float64 = float64(i)     // ★ Go 没有隐式转换
```

### 2. 数组 / 切片 / Map（必背）

```go
// 数组（定长，值类型）
var arr [5]int = [5]int{1, 2, 3, 4, 5}
arr2 := [...]int{1, 2, 3}             // 让编译器算长度

// Slice（动态数组，引用类型）
s := []int{1, 2, 3}
s = append(s, 4, 5)                   // ★ append（返回新 slice）
s2 := make([]int, 0, 100)              // 长 0、容量 100

// Slice 关键属性
fmt.Println(len(s), cap(s))            // 长度 / 容量

// Slice 切片
s[1:3]                                 // [s[1], s[2]]
s[:2]                                  // [s[0], s[1]]
s[2:]                                  // 从 s[2] 到末尾

// ⚠️ 共享底层数组陷阱
a := []int{1, 2, 3, 4, 5}
b := a[1:3]                            // b 共享 a 的底层
b[0] = 99                              // ★ a[1] 也变 99

// ✅ 安全拷贝
c := slices.Clone(a)                    // Go 1.21+
// 或
c := make([]int, len(a))
copy(c, a)

// Map
m := map[string]int{"a": 1, "b": 2}
m["c"] = 3
v, ok := m["a"]                        // ★ ok 判断 key 是否存在
delete(m, "a")
for k, v := range m { ... }            // ★ 遍历顺序随机
```

### 3. struct 与方法

```go
// struct
type User struct {
    Name string
    Age  int
}

u := User{Name: "Alice", Age: 30}
u2 := &User{Name: "Bob", Age: 25}      // 指针

// 方法（receiver）
// 值 receiver - 不修改原对象
func (u User) Greet() string {
    return "Hello, " + u.Name
}

// 指针 receiver - 可修改原对象
func (u *User) IncAge() {
    u.Age++
}

u.Greet()                              // 自动 (&u).Greet() 或 u.Greet()
u.IncAge()                             // 自动 (&u).IncAge()

// 嵌入（组合优于继承）
type Admin struct {
    User                               // ★ 匿名字段（嵌入）
    Permissions []string
}

a := Admin{User: User{Name: "X"}, Permissions: []string{"r","w"}}
a.Greet()                              // ★ 直接调用嵌入的方法
```

### 4. interface（鸭子类型）

```go
// 接口定义
type Animal interface {
    Sound() string
    Name() string
}

// 隐式实现（不需要 implements 关键字）
type Dog struct { name string }
func (d Dog) Sound() string { return "Woof" }
func (d Dog) Name() string { return d.name }

// 多态
var a Animal = Dog{name: "Rex"}
a.Sound()                              // "Woof"

// 空接口（接受任何类型，类似 Java Object）
var x any = 42                          // Go 1.18+ any = interface{}
var y interface{} = "hello"            // 老写法

// 类型断言
if v, ok := x.(int); ok {              // ★ 安全形式
    fmt.Println(v + 1)
}

// 类型 switch
switch v := x.(type) {
case int:    fmt.Println("int", v)
case string: fmt.Println("string", v)
default:     fmt.Println("unknown")
}
```

### 5. 函数与多返回值

```go
// 多返回值（Go 哲学）
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("divide by zero")
    }
    return a / b, nil
}

result, err := divide(10, 2)
if err != nil { ... }

// 命名返回值
func compute() (x, y int, err error) {
    x = 10
    y = 20
    return                              // ★ naked return
}

// 可变参数
func sum(nums ...int) int {
    total := 0
    for _, n := range nums { total += n }
    return total
}
sum(1, 2, 3, 4)
sum(slice...)                           // 展开 slice

// 一等公民：函数作为参数和返回值
type Greeter func(string) string

func makeGreeter(prefix string) Greeter {
    return func(name string) string {
        return prefix + " " + name
    }
}

hi := makeGreeter("Hi")
hi("Alice")                             // "Hi Alice"

// 闭包
func counter() func() int {
    count := 0
    return func() int {
        count++
        return count
    }
}
c := counter()
c(); c(); c()                           // 1, 2, 3
```

### 6. 控制流

```go
// if 可以有初始化语句
if v, err := compute(); err == nil {
    fmt.Println(v)
}

// for（唯一的循环语句）
for i := 0; i < 10; i++ { ... }
for i < 10 { i++ }                      // while 风格
for { ... }                             // 死循环
for i, v := range slice { ... }
for k, v := range map { ... }
for v := range channel { ... }

// switch 自带 break，可以匹配任意类型
switch day {
case "Mon", "Tue":                      // ★ 多值
    fmt.Println("weekday")
case "Sat", "Sun":
    fmt.Println("weekend")
    fallthrough                          // ★ 显式贯穿（少用）
default:
    fmt.Println("unknown")
}

// 无表达式 switch（替代 if-else 链）
switch {
case n < 0:  fmt.Println("negative")
case n == 0: fmt.Println("zero")
case n > 0:  fmt.Println("positive")
}
```

### 7. 包与导入

```go
// 包名 = 目录名（约定）
package mylib

// 导入
import (
    "fmt"
    "net/http"

    "github.com/gin-gonic/gin"          // 第三方
    
    myutil "github.com/me/utils"         // 起别名
    _ "github.com/go-sql-driver/mysql"   // ★ 仅 init（不直接用 API）
)

// 大写开头 = 导出（public）
// 小写开头 = 包内（private）
func PublicFunc() {}
func privateFunc() {}

// init 函数（包加载时自动调用）
func init() {
    fmt.Println("package loaded")
}
```

### 8. Go Modules（依赖管理）

```bash
# 创建项目
go mod init github.com/me/my-app

# 添加依赖
go get github.com/gin-gonic/gin@latest
go get github.com/gin-gonic/gin@v1.9.1

# 升级 / 整理
go get -u ./...                         # 升级所有
go mod tidy                             # 清理未用 + 添加缺失
go mod vendor                           # 拷贝依赖到 vendor/

# 替换（开发本地包）
# go.mod:
# replace github.com/me/lib => ../lib
```

### 9. 测试（标准库 testing）

```go
// foo_test.go
package foo

import "testing"

func TestAdd(t *testing.T) {
    got := Add(1, 2)
    want := 3
    if got != want {
        t.Errorf("Add(1, 2) = %d; want %d", got, want)
    }
}

// 表格测试（Go 习惯）
func TestAddTable(t *testing.T) {
    tests := []struct{
        a, b, want int
    }{
        {1, 2, 3},
        {0, 0, 0},
        {-1, 1, 0},
    }
    for _, tt := range tests {
        t.Run(fmt.Sprintf("%d+%d", tt.a, tt.b), func(t *testing.T) {
            if got := Add(tt.a, tt.b); got != tt.want {
                t.Errorf("got %d, want %d", got, tt.want)
            }
        })
    }
}

// Benchmark
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(1, 2)
    }
}

// 测试主流库
// - github.com/stretchr/testify/assert  (断言)
// - github.com/stretchr/testify/mock     (mock)
// - github.com/golang/mock/mockgen       (生成 mock)
```

```bash
go test ./...                           # 跑所有
go test -v ./...                        # 详细
go test -run TestAdd                    # 按名过滤
go test -race ./...                     # ★ 数据竞争检测
go test -cover ./...                    # 覆盖率
go test -bench=. -benchmem               # 跑 benchmark
go test -cpuprofile=cpu.prof -memprofile=mem.prof ./...
```

### 10. 标准库精华

```go
// fmt - 格式化
fmt.Println("hello")
fmt.Printf("%s: %d\n", name, age)
fmt.Sprintf("...")                       // 返字符串
fmt.Errorf("wrap: %w", err)              // 错误包装

// strings / strconv
strings.Contains(s, "x")
strings.Split(s, ",")
strings.Join([]string{"a","b"}, "-")
strconv.Itoa(42)                         // int → string
strconv.Atoi("42")                       // string → int

// os / io / bufio
file, err := os.Open("data.txt")
scanner := bufio.NewScanner(file)
for scanner.Scan() { fmt.Println(scanner.Text()) }

// encoding/json
json.Marshal(obj)                        // → []byte
json.Unmarshal(data, &obj)               // ← []byte
type User struct {
    Name string `json:"name"`            // tag 重命名
    Age  int    `json:"age,omitempty"`
}

// time
time.Now()
time.Sleep(time.Second)
time.Since(start)
ticker := time.NewTicker(time.Second)
```

---

