---
title: Python 现代特性
---

# Python 现代特性（Type Hints / Pydantic v2 / FastAPI）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 章节范围
本页覆盖 **现代 Python 类型驱动开发**：类型提示（Python 3.9+ 的内置泛型语法 / 3.10+ 联合类型 / Literal / TypedDict / Protocol / Self / @override）、Pydantic v2（Rust 写底层，5-50× v1）、FastAPI（类型驱动 + 异步 + 自动 OpenAPI）。语法基础见 [Python 基础](./python-fundamentals)。
:::

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

