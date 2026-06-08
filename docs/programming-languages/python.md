---
title: Python 现代特性
---

# Python 现代特性（3.12 / 3.13 Free-Threaded + 类型 + 异步）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**2026 Python 已成 AI / 数据 / 自动化 / DevOps 第一语言**。面试**必问**：**GIL 与 Python 3.13 Free-Threaded（首次正式可关 GIL）**、**asyncio 与 await**、**类型提示 / Pydantic v2 / FastAPI**、**uv 替代 pip**（Rust 写、快 10×）、**Polars 替代 pandas**（Rust 写、快 30×）。能讲清"GIL 为什么存在 / 3.13 怎么去掉 GIL"、"asyncio 不是多线程"、"为什么 uv / Polars 都是 Rust 写"立刻区分初/中/高级。
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

## GIL 与 Free-Threaded（2026 必背 Top 题）

### GIL（Global Interpreter Lock）是什么

**GIL** = CPython 全局互斥锁——**任何时刻只允许 1 个 OS 线程执行 Python 字节码**。

```text
4 核 CPU + 4 个 Python 线程

❌ 表现：
   只有 1 个线程在跑 Python 代码
   其他 3 个等待 GIL
   → CPU 密集多线程 = 没用，反而上下文切换损耗

✅ 但 IO 密集型仍有用：
   等 IO 时释放 GIL
   → 网络服务多线程仍有意义
```

### GIL 的影响

| 任务类型 | 多线程效果 | 替代方案 |
|----------|-----------|---------|
| **CPU 密集**（计算 / 加密 / 图像处理）| **完全没用** | `multiprocessing` / Numpy（C 层释放 GIL）/ Cython / Rust 扩展 |
| **IO 密集**（网络 / 文件）| **有效**（IO 等待时让出 GIL）| 也可用 asyncio |
| **混合** | 部分有效 | 视情况 |

### Python 3.13 Free-Threaded — 史上最大变革

**2024.10 Python 3.13 实验性支持 No-GIL build**——首次正式可禁用 GIL！

```bash
# 编译时启用
./configure --disable-gil
make
python3.13t                    # ★ 'python3.13t' 才是 Free-Threaded 版

# 或直接装 free-threaded 版
pyenv install 3.13.0t
```

```python
# 运行时确认
import sys
print(sys._is_gil_enabled())   # False = Free-Threaded
```

**性能对比**（多核 CPU 密集）：

| 场景 | 标准 GIL | Free-Threaded |
|------|----------|----------------|
| 4 线程 CPU 密集 | 1× | **3.5-4×**（接近线性）|
| asyncio Web 服务（IO 为主）| 1× | 1.0-1.1×（无明显差异）|
| 单线程 | 1× | **0.9×**（略有开销）|

::: warning ⚠️ Free-Threaded 当前限制（2026 上半年）

> ① **生态适配中**：NumPy / Pandas / PyTorch 部分支持，但很多 C 扩展未适配
> ② **单线程性能略降**（5-10%）—— 引用计数原子化代价
> ③ **GC 行为改变**——并发 GC，可能改变内存使用模式
> ④ **Python 3.14 是关键过渡**（生态全面适配）
> ⑤ **Python 3.15 (2026.10) 计划成 supported feature**，不再实验

:::

---

## asyncio — 异步 IO 核心

### asyncio 不是多线程

```text
asyncio = 单线程 + 协作式多任务（cooperative multitasking）

  ┌──────────────────────────────────────┐
  │  Event Loop（单线程）                  │
  │                                        │
  │  Task 1: ─── await sleep(2) ─────     │
  │                  ↓ 让出                │
  │  Task 2:        ─── 执行 ──── await db │
  │                                  ↓     │
  │  Task 3:                       ─── 执行 │
  └──────────────────────────────────────┘

  GIL 不影响——本就单线程
```

### 基础语法

```python
import asyncio

async def fetch(url: str) -> str:
    print(f"start {url}")
    await asyncio.sleep(2)            # ★ 非阻塞睡眠
    print(f"done {url}")
    return f"data from {url}"

# ❌ 同步顺序执行: 4 秒
async def main_seq():
    a = await fetch("A")
    b = await fetch("B")

# ✅ 并发执行: 2 秒
async def main_concurrent():
    results = await asyncio.gather(
        fetch("A"),
        fetch("B"),
    )

# 运行
asyncio.run(main_concurrent())
```

### asyncio 关键 API

```python
# 创建任务（立即执行）
task = asyncio.create_task(fetch("A"))

# 等待多个
results = await asyncio.gather(t1, t2, t3)

# 超时控制
async with asyncio.timeout(5):       # Python 3.11+
    await long_operation()

# 取消任务
task.cancel()
try:
    await task
except asyncio.CancelledError:
    pass

# 信号量（限流）
sem = asyncio.Semaphore(10)
async def limited_fetch(url):
    async with sem:                   # 最多 10 并发
        return await fetch(url)
```

### TaskGroup（Python 3.11+，必背）

```python
# ✅ 结构化并发（异常自动传播 + 自动取消其他任务）
async def main():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch("A"))
        t2 = tg.create_task(fetch("B"))
        t3 = tg.create_task(fetch("C"))
    # 离开 with 时所有任务必完成
    # 任一异常 → 其他自动取消 + 抛出 ExceptionGroup
    print(t1.result(), t2.result(), t3.result())
```

**比 gather() 强在**：异常处理更安全 + 结构化生命周期。

### asyncio 常见陷阱

```python
# ❌ 阻塞调用阻塞整个 Event Loop
async def bad():
    time.sleep(2)                     # ★ 同步 sleep 阻塞 loop！其他 task 都等
    requests.get("...")               # ★ 同步 HTTP 阻塞！

# ✅ 用异步库
async def good():
    await asyncio.sleep(2)
    async with httpx.AsyncClient() as c:
        await c.get("...")

# ✅ 同步代码用 to_thread 跑
async def callBlocking():
    result = await asyncio.to_thread(blocking_function, arg1)
```

---

## 类型提示（Type Hints）

### 基础语法

```python
# Python 3.9+
def greet(name: str, age: int = 0) -> str:
    return f"Hello {name}, {age}"

# 集合类型（3.9+ 用内置类型，不再 typing.List）
def process(users: list[dict[str, int]]) -> tuple[int, int]:
    ...

# 联合类型（3.10+，| 替代 Union）
def parse(value: str | int) -> int | None:
    ...

# Optional = Union[T, None] 的简写
def find(id: int) -> User | None:        # ★ 推荐
    ...
```

### 高级类型

```python
from typing import Literal, TypedDict, Protocol, Self, override

# Literal - 字面值类型
def set_level(level: Literal["debug", "info", "error"]):
    ...

# TypedDict - 字典 schema
class UserDict(TypedDict):
    name: str
    age: int

# Protocol - 鸭子类型 + 静态检查
class Drawable(Protocol):
    def draw(self) -> None: ...

# Self（Python 3.11+）- 父类返回自身类型
class Builder:
    def add(self, x) -> Self:        # ★ 子类返回子类型，不需泛型
        ...
        return self

# @override（Python 3.12+）
class Child(Parent):
    @override
    def method(self): ...            # ★ 父类拼写错会报错
```

### mypy / pyright 静态检查

```bash
# mypy（最老牌）
pip install mypy
mypy app.py

# pyright（微软出品，VS Code 自带）
pip install pyright
pyright app.py
```

**生产建议**：
- ✅ **新项目强制类型** + **CI 集成 mypy/pyright**
- ✅ **配合 Pydantic 做运行时校验**
- ⚠️ 类型不影响运行时（仅静态分析），运行时校验靠 Pydantic / attrs

---

## Pydantic v2 — 类型驱动数据校验

**Pydantic v2（2023.7）用 Rust 重写底层，性能 5-50× v1**——FastAPI / 大量数据管道的核心。

```python
from pydantic import BaseModel, Field, EmailStr, field_validator
from datetime import datetime

class User(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=50)
    email: EmailStr
    age: int = Field(ge=0, le=150)
    created_at: datetime = Field(default_factory=datetime.now)
    tags: list[str] = []

    @field_validator('name')
    @classmethod
    def name_must_not_be_anonymous(cls, v: str) -> str:
        if v.lower() == 'anonymous':
            raise ValueError('name cannot be anonymous')
        return v

# 自动校验 + 类型转换
u = User(id="42", name="Alice", email="a@b.com", age="30")
#   ↑ 字符串自动转 int
print(u.model_dump())                # 转字典
print(u.model_dump_json())           # JSON

# 校验失败抛 ValidationError
try:
    User(id=1, name="", email="bad", age=-1)
except ValidationError as e:
    print(e.errors())                # 详细错误信息
```

**生产应用**：
- ✅ **FastAPI** 请求/响应自动校验
- ✅ **配置管理**（pydantic-settings）
- ✅ **数据管道** 入口校验
- ✅ **API client** 响应建模

---

## FastAPI — 2026 最火 Python Web 框架

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class UserCreate(BaseModel):
    name: str
    email: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

@app.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate):    # ★ Pydantic 自动校验
    new_user = await db.create_user(user.model_dump())
    return new_user

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await db.find_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

**FastAPI 核心优势**：
- ✅ **类型驱动**：参数 / 请求体 / 响应全靠类型提示
- ✅ **自动 OpenAPI / Swagger**（/docs 直接看 API）
- ✅ **原生 async**
- ✅ **性能接近 Node.js / Go**（Starlette + Uvicorn）

**vs Flask / Django**：

| 框架 | 强项 | 弱项 | 2026 选型 |
|------|------|------|----------|
| **FastAPI** | 类型 + 异步 + 性能 + OpenAPI | 较新，少量边角 | **新 API 项目首选** |
| **Flask** | 极简、灵活 | 同步、生态老 | 老项目维护 |
| **Django** | 全功能 ORM/ Admin / 认证 | 重、同步为主（4.x+ 部分异步）| 内容管理、传统 Web App |
| **Litestar** | FastAPI 替代品、更强 | 生态较小 | 高级用户 |

---

## 2026 必学新工具（Rust 写的 Python 工具爆发）

### uv — 替代 pip / poetry（Astral 出品）

**uv 2024.2 发布**：**Rust 写的 Python 包管理器，10-100× pip 速度**。

```bash
# 安装
pip install uv               # 或 curl -LsSf https://astral.sh/uv/install.sh | sh

# 创建项目（替代 poetry init）
uv init my-app && cd my-app

# 添加依赖
uv add fastapi pydantic 'sqlalchemy[asyncio]'

# 安装所有依赖（替代 pip install -r requirements.txt）
uv sync                       # ★ 100× 快于 pip

# 锁文件 uv.lock（替代 poetry.lock）

# 运行
uv run python app.py

# 管理 Python 版本（替代 pyenv）
uv python install 3.13
uv python pin 3.13            # 项目锁定版本
```

::: tip 💡 uv vs poetry vs pip

> ① **速度**：uv > poetry > pip（uv 装 100 个包可能 1 秒，pip 要 1 分钟）
> ② **统一**：uv 一个工具替代 pip + poetry + pyenv + virtualenv + pip-tools
> ③ **2026 趋势**：**新项目首选 uv**，老项目慢慢迁

:::

### ruff — 替代 black + flake8 + isort

**Rust 写的 linter + formatter，100× 旧工具速度**：

```bash
uv add ruff --dev

# 格式化（替代 black）
ruff format .

# 检查（替代 flake8 + isort + pyupgrade + ...）
ruff check . --fix
```

### Polars — 替代 pandas（多核 + Rust）

```python
import polars as pl

# Polars - Rust 写、多核、lazy evaluation
df = pl.read_csv("huge.csv")
result = (df
    .filter(pl.col("age") > 18)
    .group_by("city")
    .agg(pl.col("salary").mean())
    .sort("salary", descending=True)
)
print(result)
```

**Polars vs Pandas**（2026 benchmark）：

| 维度 | Pandas | **Polars** |
|------|--------|-----------|
| **底层** | NumPy + Python | **Rust + Arrow** |
| **多核** | 单核 | **多核并行** |
| **Lazy** | 立即执行 | **支持惰性 + 优化** |
| **内存** | 高 | **低 2-5×** |
| **性能** | 1× | **5-30×** |
| **API** | 老牌 | **更现代** |
| **生态** | 巨大（10年沉淀）| 快速追赶 |
| **2026 趋势** | 仍是主流 | **新项目首选** |

### DuckDB + Polars 黄金组合

```python
import duckdb
import polars as pl

# DuckDB - 嵌入式 OLAP 数据库
con = duckdb.connect()

# 直接查 Parquet（不需要先加载）
result = con.execute("""
    SELECT city, AVG(salary) as avg_salary
    FROM 'data/users.parquet'
    WHERE age > 18
    GROUP BY city
""").pl()                          # ★ 直接返回 Polars DataFrame
```

**2026 数据科学栈**：**uv + Polars + DuckDB + Pydantic + FastAPI**——全是高性能工具替代老路线。

---

## 虚拟环境与包管理

### 历史演进

```text
2008 - pip          基础包安装
2011 - virtualenv   隔离环境
2012 - venv         标准库 (PEP 405)
2017 - pipenv       Pipfile + lock
2018 - poetry       项目管理 + lock + 发布
2024 - uv           Rust 写、10-100× 速度 ← 2026 推荐
```

### venv（标准库，仍然适合简单场景）

```bash
# 创建
python -m venv .venv

# 激活
source .venv/bin/activate                # Linux/Mac
.venv\Scripts\activate                    # Windows

# 退出
deactivate

# 装包
pip install fastapi pydantic
pip freeze > requirements.txt

# 复现
pip install -r requirements.txt
```

### uv（2026 推荐，前面已讲）

```bash
uv init my-app && cd my-app
uv add fastapi 'sqlalchemy[asyncio]'
uv sync
uv run python app.py
uv python install 3.13
uv python pin 3.13
```

### pyproject.toml（PEP 621，现代标准）

```toml
[project]
name = "my-app"
version = "0.1.0"
description = "My awesome app"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.110",
    "pydantic>=2.6",
    "sqlalchemy>=2.0",
]

[project.optional-dependencies]
dev = ["pytest", "mypy", "ruff"]

[project.scripts]
my-app = "my_app.cli:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.mypy]
strict = true
```

---

## 测试（pytest 事实标准）

### 基础

```python
# test_user.py
import pytest
from app.user import User

def test_user_create():
    u = User("Alice", 30)
    assert u.name == "Alice"
    assert u.age == 30

def test_user_greet():
    u = User("Alice", 30)
    assert u.greet() == "Hello, I'm Alice"

# 参数化测试
@pytest.mark.parametrize("age,expected", [
    (10, "minor"),
    (20, "adult"),
    (65, "adult"),
])
def test_age_group(age, expected):
    assert User("X", age).age_group == expected

# 异常测试
def test_invalid_age():
    with pytest.raises(ValueError, match="invalid age"):
        User("X", -1)
```

### Fixture（必背）

```python
@pytest.fixture
def db():
    """每个测试函数前后执行"""
    conn = connect()
    yield conn
    conn.close()

@pytest.fixture(scope="session")        # session / module / class / function
def expensive_resource():
    resource = create_expensive_thing()
    yield resource
    resource.cleanup()

def test_query(db):
    assert db.query("SELECT 1") == 1
```

### 异步测试

```python
import pytest

@pytest.mark.asyncio
async def test_async_fetch():
    result = await fetch_data("url")
    assert result is not None
```

### Mock

```python
from unittest.mock import Mock, AsyncMock, patch

def test_user_service():
    mock_db = Mock()
    mock_db.find_user.return_value = User("Alice", 30)
    
    service = UserService(mock_db)
    user = service.get_user(1)
    
    assert user.name == "Alice"
    mock_db.find_user.assert_called_once_with(1)

# patch 装饰器
@patch("app.user.requests.get")
def test_fetch(mock_get):
    mock_get.return_value.json.return_value = {"name": "Alice"}
    result = fetch_user(1)
    assert result["name"] == "Alice"
```

### 运行

```bash
pytest                              # 跑所有 test_*.py
pytest tests/test_user.py            # 单文件
pytest -k "test_user"                # 按名字过滤
pytest -v                            # 详细
pytest -x                            # 第一个失败就停
pytest --cov=app --cov-report=html   # 覆盖率（需 pytest-cov）
pytest -n auto                       # 并行（需 pytest-xdist）
```

---

## 日志与调试

### logging（标准库）

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)
logger.info("started")
logger.warning("low memory: %s MB", 200)
logger.error("failed", exc_info=True)            # 包含 stack trace

# 结构化日志（生产推荐 structlog）
import structlog

log = structlog.get_logger()
log.info("user.login", user_id=42, ip="1.2.3.4")
# {"event": "user.login", "user_id": 42, "ip": "1.2.3.4", "timestamp": "..."}
```

### pdb / ipdb（断点调试）

```python
def buggy():
    x = 10
    y = 20
    breakpoint()                          # ★ Python 3.7+ 内置（默认调 pdb）
    z = x + y
    return z

# pdb 命令：
# n - 下一行 / s - 步入 / c - 继续 / l - 列出代码
# p var - 打印变量 / pp var - 美打 / q - 退出
```

### 性能分析

```python
import cProfile
import pstats

# 函数级 profile
cProfile.run("slow_function()", "profile.out")
stats = pstats.Stats("profile.out").sort_stats("cumtime")
stats.print_stats(20)

# 行级（line_profiler）
@profile                                  # ★ 用 kernprof -l 跑
def hot_function(): ...

# 内存（memray，2024 主流）
pip install memray
memray run script.py
memray flamegraph memray-script.bin       # 生成内存火焰图
```

---

## Python 内存模型与 GC

### 引用计数（主要回收机制）

```python
import sys

a = [1, 2, 3]
sys.getrefcount(a)                        # 2（变量 + getrefcount 参数）

b = a
sys.getrefcount(a)                        # 3

del b
sys.getrefcount(a)                        # 2
```

**特点**：
- ✅ 引用 = 0 立即回收（确定性）
- ❌ 无法处理**循环引用** → 需要 GC 兜底

### 循环 GC（generational）

```text
3 代分代:
   Gen 0 - 新对象（频繁扫描）
   Gen 1 - 存活的提升
   Gen 2 - 长期存活
```

```python
import gc

gc.collect()                              # 手动触发
gc.disable()                              # 高性能场景禁用
gc.set_threshold(700, 10, 10)             # 调阈值
gc.get_stats()                            # 看统计
```

### 内存泄漏排查

```python
# tracemalloc（标准库）
import tracemalloc

tracemalloc.start()
# ... 业务代码 ...
snapshot = tracemalloc.take_snapshot()
top = snapshot.statistics("lineno")[:10]
for stat in top:
    print(stat)

# objgraph 看对象引用图
import objgraph
objgraph.show_most_common_types()
objgraph.show_backrefs([obj], filename="refs.png")
```

---

## Python 性能优化

### 1. C 扩展 / Numba / Cython

```python
# Numba - JIT 编译 Python 函数到机器码
from numba import jit

@jit(nopython=True)            # ★ 编译为原生码
def sum_array(arr):
    total = 0
    for x in arr:
        total += x
    return total
# 性能可达原生 Python 100×
```

### 2. multiprocessing / concurrent.futures

```python
from concurrent.futures import ProcessPoolExecutor

def cpu_heavy(n):
    return sum(i*i for i in range(n))

# 4 核 CPU 密集 → 用进程池绕过 GIL
with ProcessPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(cpu_heavy, [10_000_000] * 4))
```

### 3. Python 3.13 Free-Threaded（前面讲过）

### 4. Rust 扩展（PyO3）

**2026 Python 性能优化的新王道**——用 Rust 写 CPU 密集模块。

```rust
// src/lib.rs (Rust)
use pyo3::prelude::*;

#[pyfunction]
fn fast_sum(numbers: Vec<i64>) -> i64 {
    numbers.iter().sum()
}

#[pymodule]
fn my_module(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(fast_sum, m)?)?;
    Ok(())
}
```

```python
# Python 调用
from my_module import fast_sum
fast_sum([1, 2, 3, 4, 5])     # Rust 速度
```

**代表项目**：Pydantic v2、ruff、uv、Polars、cryptography、tokenizers（HuggingFace）。

---

## Python 在 AI 时代的核心地位

### 主要 AI / 数据库栈

| 类别 | 工具 |
|------|------|
| **深度学习** | PyTorch（绝对主流）/ TensorFlow / JAX |
| **LLM** | transformers（HF）/ vLLM / LlamaIndex / LangChain |
| **数值计算** | NumPy 2.x / SciPy / Polars |
| **可视化** | matplotlib / Plotly / Altair |
| **Notebook** | Jupyter / Marimo（2024 新）|
| **机器学习** | scikit-learn / XGBoost / LightGBM |
| **MLOps** | MLflow / Weights & Biases / Ray |

详见 [AI 章节](../ai-technology/)。

---

## Python vs Java vs Go vs Node.js（必背对比）

| 维度 | **Python** | Java | Go | Node.js |
|------|-----------|------|------|---------|
| **强项** | **AI / 数据 / 自动化 / 脚本** | 企业后端 | **云原生 / 网络** | Web / 实时 |
| **性能** | 慢（GIL）| 高 | 高 | 中 |
| **并发** | asyncio（单线程）+ multiprocessing | 虚拟线程 + ForkJoin | **Goroutine** | Event Loop |
| **类型** | 可选类型提示 | 强类型 | 强类型 | TypeScript 补 |
| **学习曲线** | **最低** | 中 | 低 | 低 |
| **包管理** | uv / pip | Maven / Gradle | go mod | npm / pnpm |
| **典型岗位** | AI 工程师 / 数据 / DevOps / 脚本 | 后端 / 移动 | 云原生 / 基础设施 | 全栈 / 实时 |

---

## Python 常见陷阱（必背）

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **mutable 默认参数** | 跨调用共享 | 用 `None` + 内部初始化 |
| **闭包延迟绑定** | 循环变量都是最后值 | 用默认参数捕获 |
| **`__init__` 不能 return** | TypeError | 用工厂方法 / `__new__` |
| **CPU 密集用 threading** | GIL 拦截，没用 | 用 multiprocessing / Rust 扩展 |
| **同步代码进 asyncio** | 阻塞 event loop | `asyncio.to_thread` / 用异步库 |
| **pip + system Python** | 污染系统 | 用 uv / venv |
| **`is` vs `==`** | 缓存数字混淆 | `is` 仅 None / True / False |
| **circular import** | 导入失败 | 重构 / 延迟导入 |
| **f-string 用户输入** | 注入风险 | 用参数化 |

### Mutable 默认参数经典坑

```python
# ❌ 致命陷阱
def add(item, items=[]):      # ★ items 列表跨调用共享！
    items.append(item)
    return items

print(add(1))     # [1]
print(add(2))     # [1, 2]  ← !
print(add(3))     # [1, 2, 3]  ← !!

# ✅ 修复
def add(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

---

## 黄金答题模板（必背）

> **面试官：现代 Python 你最熟的特性是哪些？**
>
> **答**：**6 大重点**：
>
> ① **GIL 与 Free-Threaded（2026 热点）**——GIL 让 CPU 密集多线程没用，但 IO 密集仍 OK；**Python 3.13 (2024.10) 首次实验性 No-GIL build**（`python3.13t`），CPU 密集多核可达 3.5-4× 提速；生态适配中，3.15 (2026.10) 计划成 supported feature；CPU 密集仍主推 multiprocessing / Rust 扩展（PyO3）。
>
> ② **asyncio**——**单线程协作式多任务**，不是多线程；用 TaskGroup（3.11+）做结构化并发；同步代码混进异步用 `asyncio.to_thread`；用 httpx 替代 requests、aiomysql 替代 mysql 等异步库；最大坑是同步阻塞调用搞死 event loop。
>
> ③ **类型提示 + Pydantic v2**——3.9+ 用 `list[int]` 替代 `List[int]`，3.10+ `int | str` 替代 `Union`；运行时校验用 Pydantic v2（**Rust 写底层，5-50× v1**）；FastAPI 类型驱动整套。
>
> ④ **FastAPI**——类型驱动 + 异步 + 自动 OpenAPI + 性能接近 Node/Go，**2026 新 API 项目首选**；老项目维护 Flask；CMS 用 Django。
>
> ⑤ **uv + ruff + Polars + DuckDB（Rust 写的新工具爆发）**——uv 替代 pip/poetry（100× 速度）；ruff 替代 black+flake8；Polars 替代 pandas（5-30× 速度 + 多核）；DuckDB 嵌入式 OLAP；**2026 数据栈：uv + Polars + DuckDB + Pydantic + FastAPI**。
>
> ⑥ **PyO3 / Rust 扩展**——性能优化新王道，主流项目（Pydantic / ruff / Polars / cryptography）都是 Rust 写底层。
>
> **必踩坑**：① mutable 默认参数；② threading 做 CPU 密集；③ 同步代码进 asyncio；④ pip + system Python；⑤ f-string 用户输入注入。

---

## 看到什么就先想到这类

- **"CPU 密集多线程没用"** → GIL → multiprocessing / PyO3 Rust / 3.13 Free-Threaded
- **"asyncio 阻塞了"** → 用了同步库 → 换异步库或 to_thread
- **"FastAPI 慢"** → 检查同步 endpoints / 阻塞调用
- **"pandas 内存爆"** → 换 Polars
- **"pip 慢"** → 换 uv
- **"linter 不统一"** → ruff（替代 black + flake8 + isort）
- **"数据类型校验"** → Pydantic v2
- **"API 文档"** → FastAPI 自动 OpenAPI
- **"高性能模块"** → PyO3 写 Rust 扩展
- **"3.13 Free-Threaded"** → CPU 密集多核场景值得试，生态适配中
- **"asyncio 多任务取消"** → TaskGroup（3.11+）
- **"Optional 类型"** → `int | None`（3.10+）
- **"运行时类型校验"** → Pydantic 不是 mypy
- **"Python vs Go"** → AI / 脚本 / 数据选 Python；网络 / 云原生选 Go
- **"AI 工程"** → Python 几乎是唯一选择
