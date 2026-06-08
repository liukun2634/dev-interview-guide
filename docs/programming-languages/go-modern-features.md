---
title: Go 现代特性
---

# Go 现代特性（错误处理 / Generics 1.18+ / Range-over-func 1.23+）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span>

::: tip 💡 章节范围
本页覆盖 **Go 1.18+ 关键演进**：错误处理哲学（errors.Is/As/wrap）、泛型与 slices/maps 标准库、Go 1.23+ Range-over-func 迭代器。Go 1.22-1.24 完整时间线见 [Go 基础](./go-fundamentals#go-演进时间线)。
:::

## 错误处理（Go 哲学）

```go
// Go 1.13+ 错误包装
func operation() error {
    if err := step(); err != nil {
        return fmt.Errorf("step failed: %w", err)   // ★ %w 包装
    }
    return nil
}

// 解包
var pathErr *fs.PathError
if errors.As(err, &pathErr) {                       // ★ 类型断言
    fmt.Println(pathErr.Path)
}

if errors.Is(err, fs.ErrNotExist) {                 // ★ 哨兵错误
    fmt.Println("file not found")
}
```

::: warning ⚠️ Go 错误处理痛点

> Go 没有异常 → 大量 `if err != nil` 重复代码：
>
> ```go
> result, err := step1()
> if err != nil { return err }
> result2, err := step2(result)
> if err != nil { return err }
> // ...
> ```
>
> **Go 团队 2020 否决了 try 提案，2026 仍是这样**——是 Go 语言最大的争议点。

:::

---

## Go 1.18+ 泛型

```go
// 定义泛型函数
func Map[T, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}

// 使用
nums := []int{1, 2, 3}
doubled := Map(nums, func(n int) int { return n * 2 })

// 类型约束
type Number interface {
    int | float64 | int64       // ★ 联合类型
}

func Sum[T Number](nums []T) T {
    var sum T
    for _, n := range nums {
        sum += n
    }
    return sum
}
```

### 泛型实战：slices / maps 标准库

```go
import "slices"
import "maps"

// Go 1.21+ 泛型 slices 包
nums := []int{3, 1, 4, 1, 5, 9, 2, 6}
slices.Sort(nums)                    // ★ 类型安全
idx, found := slices.BinarySearch(nums, 5)
max := slices.Max(nums)

// 泛型 maps 包
m := map[string]int{"a": 1, "b": 2}
keys := slices.Sorted(maps.Keys(m))
```

---

## Go 1.23+ Range-over-func（迭代器）

```go
// 定义迭代器
func Range(start, end int) func(yield func(int) bool) {
    return func(yield func(int) bool) {
        for i := start; i < end; i++ {
            if !yield(i) {
                return                // ★ 消费者 break
            }
        }
    }
}

// 使用 - 像普通 for range
for i := range Range(0, 10) {
    fmt.Println(i)
}
```

**意义**：实现自定义集合、惰性序列、生成器——之前 Go 没有这能力，必须用 channel + goroutine。

---

