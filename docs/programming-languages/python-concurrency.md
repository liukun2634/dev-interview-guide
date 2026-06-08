---
title: Python 并发
---

# Python 并发（GIL / asyncio / Free-Threaded）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 章节范围
本页覆盖 **Python 并发模型**：GIL 原理、Python 3.13 Free-Threaded（首次正式可关 GIL）、asyncio + await + TaskGroup（3.11+）、IO 密集 vs CPU 密集选型、multiprocessing。语法基础见 [Python 基础](./python-fundamentals)。
:::

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

