---
title: Python 基础
---

# Python 基础（数据类型 / OOP / 装饰器 / 生成器 / 异常 / match）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--easy">⭐⭐ 入门</span>

::: tip 💡 章节范围
本页覆盖 **Python 基础语法**：版本演进、数据类型（list/tuple/dict/set + 推导式 / 生成器表达式）、可变 vs 不可变、字符串 + f-string、OOP（classmethod/staticmethod/property/abstract）、dataclass、装饰器、生成器与迭代器、上下文管理器、异常 + ExceptionGroup、match 模式匹配（3.10+）。GIL / asyncio 见 [Python 并发](./python-concurrency)；类型 + FastAPI 见 [Python 现代特性](./python-modern-features)；工程实战见 [Python 工程实战](./python-engineering)；AI 生态见 [Python 生态](./python-ecosystem)。
:::

## Python 版本演进（必背时间线）

| 版本 | 年份 | 关键变化 |
|------|------|---------|
| **Python 2.7** | 2010 EOL 2020 | 已死，仍有遗留代码 |
| **Python 3.7** | 2018 | f-string、dataclass、async 完善 |
| **Python 3.9** | 2020 | 类型语法简化（`list[int]` 替代 `List[int]`）|
| **Python 3.10** | 2021 | **结构化模式匹配** match/case |
| **Python 3.11** | 2022 | **性能提速 25%**（adaptive interpreter）、异常组 |
| **Python 3.12** | 2023 | f-string 增强、类型参数简化、`Self` 类型 |
| **Python 3.13** | 2024.10 | **🚀 Free-Threaded（可关 GIL）+ JIT 实验性** |
| **Python 3.14** | 2025.10 | Free-Threaded 改进、defer/with 增强 |

::: warning ⚠️ 2026 主流版本

> ① **生产稳定主流**: **Python 3.12 / 3.13**
> ② **Python 3.10+** 必须的（match 模式 + 联合类型 `int | str`）
> ③ **3.13 Free-Threaded** 仍是 **experimental**——生产慎用，但要懂原理
> ④ **AI / 数据科学**: PyTorch 2.x / Numpy 2.x / Polars / DuckDB 都已支持 3.12+

:::

---

## Python 基础（必备）

### 1. 数据类型

```python
# 基本类型
n = 42                    # int（任意精度，无溢出）
f = 3.14                  # float
b = True                  # bool
s = "hello"               # str（不可变）
none = None

# 集合（必背 4 种）
lst = [1, 2, 3]                          # list（动态数组）
tup = (1, 2, 3)                          # tuple（不可变）
dct = {"a": 1, "b": 2}                   # dict（哈希表，3.7+ 保持插入顺序）
st = {1, 2, 3}                           # set（去重）
fz = frozenset([1, 2, 3])                # 不可变 set

# 推导式（必背）
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]
d = {x: x**2 for x in range(5)}
s = {x for x in range(10) if x % 2}

# 生成器表达式（lazy，省内存）
gen = (x**2 for x in range(1_000_000))   # ★ 不一次性算出
sum(x**2 for x in range(1_000_000))      # 流式计算
```

### 2. 可变 vs 不可变（必背）

```python
# 不可变: int / float / bool / str / tuple / frozenset
# 可变:   list / dict / set / 自定义类

# 函数传参 = 传"对象引用"
def append(lst):
    lst.append(99)                       # ★ 修改外部 list

l = [1, 2, 3]
append(l)
print(l)                                  # [1, 2, 3, 99]

# 但赋值新对象不会改外部
def reassign(lst):
    lst = [100]                           # ★ 本地变量重新绑定

reassign(l)
print(l)                                  # [1, 2, 3, 99]（外部未变）

# is vs ==
a = [1, 2, 3]
b = [1, 2, 3]
a == b                                    # True（值相等）
a is b                                    # False（不同对象）

# 小整数缓存（-5 到 256）
x = 100
y = 100
x is y                                    # True（缓存）
x = 1000
y = 1000
x is y                                    # 可能 False（看实现）

# 永远只用 `is` 比较 None / True / False
if x is None: ...                         # ✅
if x == None: ...                         # ❌
```

### 3. 字符串操作

```python
s = "Hello, World"

# 切片
s[0]                                      # 'H'
s[-1]                                     # 'd'
s[0:5]                                    # 'Hello'
s[::-1]                                   # 'dlroW ,olleH'（反转）
s[::2]                                    # 'HloWrd'（每 2 个取 1）

# 方法
s.upper()                                 # 'HELLO, WORLD'
s.split(', ')                             # ['Hello', 'World']
', '.join(['a', 'b', 'c'])                # 'a, b, c'
s.replace('l', 'L')                       # 'HeLLo, WorLd'
s.startswith('Hello')                     # True

# f-string（必背，3.6+）
name = "Alice"
age = 30
f"Hello {name}, age {age}"
f"{name=}, {age=}"                        # "name='Alice', age=30"（3.8+ 调试）
f"{value:.2f}"                            # 格式化
f"{n:,}"                                  # 千分位 1,234,567
```

### 4. OOP（面向对象）

```python
# 类定义
class User:
    """用户类"""
    # 类变量（所有实例共享）
    count = 0

    def __init__(self, name: str, age: int):
        # 实例变量
        self.name = name
        self.age = age
        User.count += 1

    def greet(self) -> str:
        return f"Hello, I'm {self.name}"

    @classmethod                          # 类方法
    def from_dict(cls, d: dict) -> "User":
        return cls(d["name"], d["age"])

    @staticmethod                         # 静态方法
    def is_adult(age: int) -> bool:
        return age >= 18

    @property                             # 属性
    def age_group(self) -> str:
        return "adult" if self.age >= 18 else "minor"

    def __repr__(self) -> str:            # 调试输出
        return f"User({self.name!r}, {self.age})"

    def __eq__(self, other) -> bool:
        return isinstance(other, User) and self.name == other.name

# 继承
class Admin(User):
    def __init__(self, name: str, age: int, permissions: list[str]):
        super().__init__(name, age)
        self.permissions = permissions

# 抽象基类
from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def sound(self) -> str: ...

class Dog(Animal):
    def sound(self) -> str: return "Woof"
```

### 5. dataclass（替代手写 `__init__`）

```python
from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    age: int
    tags: list[str] = field(default_factory=list)

# 自动生成 __init__ / __repr__ / __eq__
u1 = User("Alice", 30)
u2 = User("Alice", 30)
u1 == u2                                  # True

# 不可变 dataclass
@dataclass(frozen=True)
class Point:
    x: float
    y: float

# 现代替代品: Pydantic v2（含运行时校验）
```

### 6. 装饰器（Decorator，必背）

```python
import functools
import time

# 函数装饰器
def timing(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time() - start:.3f}s")
        return result
    return wrapper

@timing
def slow_func():
    time.sleep(1)

slow_func()                               # slow_func took 1.001s

# 带参数装饰器
def retry(times: int = 3):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for i in range(times):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if i == times - 1: raise
                    print(f"retry {i+1}: {e}")
        return wrapper
    return decorator

@retry(times=5)
def unreliable_api(): ...

# 类装饰器
@dataclass                                 # ★ 内置
@functools.lru_cache(maxsize=128)          # ★ 缓存（自动 LRU）
def fib(n: int) -> int:
    return n if n < 2 else fib(n-1) + fib(n-2)
```

### 7. 生成器与迭代器

```python
# 生成器函数（yield）
def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

g = fib()
[next(g) for _ in range(10)]              # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

# 自定义迭代器
class Range:
    def __init__(self, start, end):
        self.current = start
        self.end = end

    def __iter__(self):
        return self

    def __next__(self):
        if self.current >= self.end:
            raise StopIteration
        v = self.current
        self.current += 1
        return v

for x in Range(0, 5): print(x)
```

### 8. 上下文管理器（with 语句）

```python
# 自动资源管理（类似 C++ RAII / C# using）
with open("file.txt") as f:
    data = f.read()
# 离开 with 自动 close

# 自定义
class DBConnection:
    def __enter__(self):
        self.conn = connect()
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.conn.close()
        return False                       # False = 异常继续向上抛

with DBConnection() as conn:
    conn.query(...)

# 装饰器版（contextlib）
from contextlib import contextmanager

@contextmanager
def timer():
    start = time.time()
    yield
    print(f"elapsed {time.time() - start:.3f}s")

with timer():
    slow_work()
```

### 9. 异常处理

```python
try:
    result = risky()
except (ValueError, TypeError) as e:      # 多个异常类型
    print(f"validation: {e}")
except Exception as e:
    print(f"unknown: {e}")
    raise                                  # 重抛
else:
    print("no exception")                  # try 成功才执行
finally:
    cleanup()                              # 无论是否异常都执行

# 自定义异常
class ApiError(Exception):
    def __init__(self, code: int, msg: str):
        super().__init__(msg)
        self.code = code

raise ApiError(404, "not found")

# Exception Groups（Python 3.11+）
try:
    raise ExceptionGroup("multi", [ValueError("v"), TypeError("t")])
except* ValueError as eg:
    print("caught V:", eg.exceptions)
except* TypeError as eg:
    print("caught T:", eg.exceptions)
```

### 10. match 模式匹配（Python 3.10+）

```python
def handle(obj):
    match obj:
        case None:
            return "null"
        case int() if obj < 0:                    # ★ guard
            return "negative"
        case int():
            return f"int {obj}"
        case [first, *rest]:                       # 列表模式
            return f"list head={first}"
        case {"name": name, "age": age}:           # 字典模式
            return f"person {name}/{age}"
        case User(name=name) if age >= 18:         # 类模式
            return f"adult {name}"
        case _:
            return "unknown"
```

---

