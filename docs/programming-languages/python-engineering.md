---
title: Python 工程实战
---

# Python 工程实战（uv / pytest / 日志调试 / 内存 GC）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 章节范围
本页覆盖 **Python 工程实战**：2026 Rust 写的新工具（uv / ruff / Polars / DuckDB）、虚拟环境 + 包管理（venv / uv / pyproject.toml PEP 621）、pytest（fixture 4 scopes + asyncio + Mock + 覆盖率 + 并行）、日志（logging + structlog）+ 调试（pdb / cProfile / memray）、Python 内存模型（引用计数 + 3 代循环 GC + tracemalloc）。语法基础见 [Python 基础](./python-fundamentals)。
:::

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

