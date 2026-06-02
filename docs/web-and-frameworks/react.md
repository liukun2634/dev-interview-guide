---
title: React
---

# React

<span class="dig-tag dig-tag--category">Web 与框架</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
React 是 Facebook 开源的声明式 UI 库，核心哲学是 **UI = f(state)**：给定相同的状态，始终渲染相同的界面。现代 React 以**函数组件 + Hooks** 为主流，通过虚拟 DOM 和 Fiber 架构实现高效的 UI 更新。掌握 Hooks、虚拟 DOM 原理和性能优化是面试核心考点。
:::

---

## 核心概念

### 1. 组件化思想

React 的核心哲学：**UI = f(state)**。给定相同输入（props + state），组件总是渲染相同的输出。

#### 函数组件 vs 类组件

现代 React（16.8+）推荐**函数组件 + Hooks**，类组件逐渐退出历史舞台。

```tsx
// 函数组件（推荐）
function Greeting({ name }: { name: string }) {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Hello, {name}!</p>
      <button onClick={() => setCount(c => c + 1)}>点击 {count} 次</button>
    </div>
  )
}

// 类组件（了解即可）
class GreetingClass extends React.Component<{ name: string }, { count: number }> {
  state = { count: 0 }
  render() {
    return (
      <div>
        <p>Hello, {this.props.name}!</p>
        <button onClick={() => this.setState(s => ({ count: s.count + 1 }))}>
          点击 {this.state.count} 次
        </button>
      </div>
    )
  }
}
```

| 对比项 | 函数组件 | 类组件 |
|--------|----------|--------|
| 语法 | 简洁，纯函数风格 | 需要继承 `React.Component` |
| 状态管理 | `useState` Hook | `this.state` + `setState` |
| 生命周期 | `useEffect` 模拟 | 显式生命周期方法 |
| 逻辑复用 | 自定义 Hook（优雅） | HOC / Render Props（复杂） |
| `this` 问题 | 无 | 需要手动绑定 |
| 性能 | 更易优化（无实例化开销） | 相对较重 |

#### JSX 本质

JSX 是 `React.createElement()` 的语法糖，编译后变成普通 JS 对象：

```tsx
// JSX 写法
const element = <h1 className="title">Hello</h1>

// 编译后等价于（React 17+ 用新 JSX Transform，不需要手动 import React）
const element = React.createElement('h1', { className: 'title' }, 'Hello')

// 最终生成的 JS 对象（虚拟 DOM 节点）
const element = {
  type: 'h1',
  props: { className: 'title', children: 'Hello' },
  key: null,
  ref: null,
}
```

#### Props vs State

| 对比项 | Props | State |
|--------|-------|-------|
| 来源 | 父组件传入 | 组件内部管理 |
| 是否可变 | 只读（不可直接修改） | 可通过 setter 修改 |
| 修改触发 | 父组件重渲染 | `setState` / `useState` setter |
| 典型场景 | 配置、数据传入 | 用户交互、内部数据 |

---

### 2. 虚拟 DOM 与 Diff 算法

#### 虚拟 DOM 是什么

虚拟 DOM（Virtual DOM）是用 **JavaScript 对象**描述真实 DOM 结构的轻量级树。React 维护两棵虚拟 DOM 树：当前树（current）和新树（workInProgress），通过对比两棵树的差异来最小化真实 DOM 操作。

```
状态变化 → 生成新的虚拟 DOM → Diff 比较 → 计算最小变更 → 更新真实 DOM
```

#### 为什么需要虚拟 DOM

直接操作真实 DOM 的问题：
- DOM 操作触发**回流（reflow）**和**重绘（repaint）**，代价高昂
- 频繁小粒度的 DOM 操作性能差
- 虚拟 DOM 可批量合并操作，减少真实 DOM 访问次数

> 注意：虚拟 DOM 并非"快"的银弹，其真正价值是提供了**声明式编程模型**和**跨平台能力**（React Native）。

#### Diff 策略

React 的 Diff 算法基于三个假设（启发式算法，将 O(n³) 降低到 O(n)）：

1. **同层比较**：不跨层级移动节点，只比较同一层的节点
2. **类型决定复用**：节点类型不同直接销毁重建（`div` → `span`）
3. **key 标识身份**：有 key 时通过 key 识别节点，实现高效复用

```tsx
// 没有 key：顺序比较，增删导致大量无效更新
// 有 key：通过 key 精准匹配节点，减少 DOM 操作
const list = items.map(item => (
  <li key={item.id}>{item.name}</li>  // ✅ 使用稳定唯一 id 作为 key
))
```

#### Fiber 架构

React 16 引入 Fiber 重写了协调（Reconciliation）引擎：

- **旧架构（Stack Reconciler）**：递归处理，一旦开始不可中断，大树更新会阻塞主线程
- **Fiber 架构**：将渲染工作拆成小单元（fiber 节点），利用浏览器空闲时间（`requestIdleCallback` 思想）分片执行，支持**中断、恢复、优先级调度**
- 分两个阶段：
  - **Render 阶段**（可中断）：构建 Fiber 树，计算变更
  - **Commit 阶段**（不可中断）：将变更一次性应用到真实 DOM

---

### 3. React Hooks（重点）

Hooks 是 React 16.8 引入的特性，让函数组件拥有状态和生命周期能力。

#### useState — 状态管理

```tsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  const [user, setUser] = useState<{ name: string } | null>(null)

  // 基于当前值更新（推荐用函数形式，避免闭包陷阱）
  const increment = () => setCount(prev => prev + 1)

  // 更新对象状态：必须返回新对象，不能直接修改
  const updateUser = () => setUser({ name: 'Alice' })

  return <button onClick={increment}>Count: {count}</button>
}
```

**关键点：** `setState` 不会直接修改当前 state，而是触发重渲染，在下一次渲染中使用新值。React 18 中 setState 默认批量更新（Automatic Batching）。

#### useEffect — 副作用

替代类组件的 `componentDidMount`、`componentDidUpdate`、`componentWillUnmount`：

```tsx
import { useEffect, useState } from 'react'

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 副作用：数据请求
    let cancelled = false
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setUser(data)  // 防止组件卸载后 setState
      })

    // cleanup 函数：组件卸载或依赖变化前执行
    return () => { cancelled = true }
  }, [userId])  // 依赖数组：userId 变化时重新执行

  return <div>{user?.name}</div>
}
```

| 依赖数组 | 执行时机 |
|----------|----------|
| 不传 | 每次渲染后都执行（慎用） |
| `[]` 空数组 | 仅在组件挂载后执行一次 |
| `[dep1, dep2]` | 挂载后执行，dep 变化时重新执行 |

#### useRef — 持久引用

```tsx
import { useRef, useEffect } from 'react'

function FocusInput() {
  // 1. 访问 DOM 节点
  const inputRef = useRef<HTMLInputElement>(null)

  // 2. 存储不触发重渲染的可变值（如计时器 id）
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    inputRef.current?.focus()  // 组件挂载后自动聚焦

    timerRef.current = window.setInterval(() => {
      console.log('tick')
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return <input ref={inputRef} />
}
```

**关键区别：** `useRef` 的值变化**不会触发重渲染**，适合存储计时器、上一次的 props 值等。

#### useMemo / useCallback — 性能优化

```tsx
import { useMemo, useCallback, useState } from 'react'

function ExpensiveComponent({ items, onItemClick }: {
  items: number[]
  onItemClick: (id: number) => void
}) {
  // useMemo：缓存计算结果，items 不变则不重新计算
  const total = useMemo(() => {
    console.log('重新计算 total')
    return items.reduce((sum, item) => sum + item, 0)
  }, [items])

  // useCallback：缓存函数引用，避免子组件不必要的重渲染
  const handleClick = useCallback((id: number) => {
    onItemClick(id)
  }, [onItemClick])

  return <div>Total: {total}</div>
}
```

| Hook | 缓存对象 | 适用场景 |
|------|----------|----------|
| `useMemo` | 计算结果（值） | 昂贵的计算逻辑 |
| `useCallback` | 函数引用 | 传给子组件的回调，配合 `React.memo` 使用 |

#### useContext — 跨组件状态共享

```tsx
import { createContext, useContext, useState } from 'react'

// 1. 创建 Context
const ThemeContext = createContext<'light' | 'dark'>('light')

// 2. Provider 提供值
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  return (
    <ThemeContext.Provider value={theme}>
      <DeepChild />
    </ThemeContext.Provider>
  )
}

// 3. 任意子孙组件消费，无需逐层传 props
function DeepChild() {
  const theme = useContext(ThemeContext)
  return <div className={`theme-${theme}`}>主题：{theme}</div>
}
```

#### 自定义 Hook — 逻辑复用

自定义 Hook 是以 `use` 开头的函数，可以调用其他 Hooks，实现逻辑的跨组件复用：

```tsx
// 自定义 Hook：封装数据请求逻辑
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(url)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e); setLoading(false) })
  }, [url])

  return { data, loading, error }
}

// 复用
function UserList() {
  const { data, loading } = useFetch<User[]>('/api/users')
  if (loading) return <div>加载中...</div>
  return <ul>{data?.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

#### Hooks 规则

1. **只在顶层调用 Hook**：不能在条件、循环或嵌套函数中调用（因为 React 依靠调用顺序识别 Hook）
2. **只在函数组件或自定义 Hook 中调用**：不能在普通 JS 函数中调用

```tsx
// ❌ 错误：条件语句中使用 Hook
function Bad({ condition }: { condition: boolean }) {
  if (condition) {
    const [state, setState] = useState(0)  // 违反规则！
  }
}

// ✅ 正确：Hook 始终在顶层
function Good({ condition }: { condition: boolean }) {
  const [state, setState] = useState(0)
  // 条件可以在 Hook 内部处理
  useEffect(() => {
    if (condition) { /* ... */ }
  }, [condition])
}
```

---

### 4. 状态管理

#### 状态分层原则

```
组件内状态 (useState)
  ↓ 多个组件共享，提升到父组件（状态提升）
父组件 + props 传递
  ↓ 跨多层组件
Context API（适合低频更新：主题、语言、用户信息）
  ↓ 状态复杂、更新频繁、组件间通信复杂
外部状态管理库（Redux、Zustand、MobX 等）
```

#### 状态管理库对比

| 库 | 核心思想 | 复杂度 | 适用场景 |
|----|----------|--------|----------|
| **Redux** | 单一数据源、纯函数 Reducer、严格单向数据流 | 高（样板代码多） | 大型应用、需要时间旅行调试 |
| **Redux Toolkit** | Redux 官方推荐方案，大幅减少样板代码 | 中 | Redux 现代用法 |
| **Zustand** | 极简 store，无 Provider，直接订阅 | 低 | 中小型应用，快速上手 |
| **MobX** | 响应式编程，自动追踪依赖 | 中 | 习惯 OOP 风格的团队 |
| **Recoil** | 原子化状态，Facebook 出品 | 中 | 细粒度状态订阅 |
| **Jotai** | 原子化状态，比 Recoil 更轻量 | 低 | 原子化状态管理 |

```tsx
// Zustand 示例（极简）
import { create } from 'zustand'

interface CountStore {
  count: number
  increment: () => void
}

const useCountStore = create<CountStore>(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}))

function Counter() {
  const { count, increment } = useCountStore()
  return <button onClick={increment}>{count}</button>
}
```

---

### 5. React Router（v6）

单页应用（SPA）通过**浏览器 History API**（`pushState` / `replaceState`）实现路由切换，不真正发起页面请求。

#### 核心 API

```tsx
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom'

// 应用根部配置路由
function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/users">用户列表</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/users/:id" element={<UserDetail />} />
        {/* 路由守卫：未登录跳转到 /login */}
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

// 动态路由参数
function UserDetail() {
  const { id } = useParams<{ id: string }>()
  return <div>用户 ID: {id}</div>
}

// 编程式导航
function LoginButton() {
  const navigate = useNavigate()
  return <button onClick={() => navigate('/dashboard')}>登录</button>
}

// 路由守卫
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  return isLoggedIn ? children : <Navigate to="/login" replace />
}
```

---

### 6. 性能优化

#### React.memo — 避免不必要的重渲染

```tsx
// 父组件重渲染时，子组件 props 未变则跳过重渲染
const ExpensiveChild = React.memo(function ExpensiveChild({
  data,
  onClick,
}: {
  data: string
  onClick: () => void
}) {
  console.log('ExpensiveChild 渲染')
  return <div onClick={onClick}>{data}</div>
})

function Parent() {
  const [count, setCount] = useState(0)

  // ❌ 每次 Parent 渲染都会创建新函数，导致 ExpensiveChild 重渲染
  // const handleClick = () => console.log('clicked')

  // ✅ useCallback 缓存函数引用
  const handleClick = useCallback(() => console.log('clicked'), [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <ExpensiveChild data="hello" onClick={handleClick} />
    </div>
  )
}
```

#### 代码分割 — React.lazy + Suspense

```tsx
import { lazy, Suspense } from 'react'

// 路由级别的代码分割：只在需要时加载对应 chunk
const UserDashboard = lazy(() => import('./pages/UserDashboard'))
const Settings = lazy(() => import('./pages/Settings'))

function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <Routes>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  )
}
```

#### 虚拟列表 — 大数据量渲染

渲染 10000 条数据时，只渲染可视区域内的节点：

```tsx
// 使用 react-window 或 react-virtual 库
import { FixedSizeList } from 'react-window'

function BigList({ items }: { items: string[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{items[index]}</div>
  )

  return (
    <FixedSizeList height={600} itemCount={items.length} itemSize={40} width="100%">
      {Row}
    </FixedSizeList>
  )
}
```

---

## 典型场景与最佳实践

### 表单处理：受控 vs 非受控组件

```tsx
// 受控组件：表单数据由 React state 管理（推荐）
function ControlledForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({ name, email })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="姓名"
      />
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="邮箱"
      />
      <button type="submit">提交</button>
    </form>
  )
}

// 非受控组件：通过 ref 直接访问 DOM（适合文件上传等特殊场景）
function UncontrolledForm() {
  const nameRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(nameRef.current?.value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={nameRef} defaultValue="" placeholder="姓名" />
      <button type="submit">提交</button>
    </form>
  )
}
```

| 对比项 | 受控组件 | 非受控组件 |
|--------|----------|------------|
| 数据来源 | React state | DOM 自身 |
| 实时验证 | 容易 | 需要手动触发 |
| 典型场景 | 大多数表单场景 | 文件上传、集成第三方库 |

### 数据请求与 cleanup

```tsx
// 推荐使用 React Query 或 SWR，避免手写 useEffect 请求
import useSWR from 'swr'

function UserProfile({ id }: { id: number }) {
  const { data, error, isLoading } = useSWR(`/api/users/${id}`, fetcher)

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>请求失败</div>
  return <div>{data.name}</div>
}
```

### 组件通信模式

| 通信方向 | 方式 |
|----------|------|
| 父 → 子 | props 传递 |
| 子 → 父 | 父组件传递回调函数（props callback） |
| 兄弟组件 | 状态提升到共同父组件 |
| 跨层级 | Context API |
| 全局复杂状态 | Redux / Zustand 等状态库 |

### React Server Components (RSC) 与 Next.js 15

React Server Components（RSC）是 **React 18.x / 19** 引入、**Next.js 13 App Router** 开始大规模生产化的核心范式变革。2025-2026 年前端面试**"什么是 RSC、它和 SSR 有什么区别"**是必问题。

#### Server Component vs Client Component vs SSR

| 维度 | 传统 Client Component | SSR（Server-Side Rendering）| **Server Component（RSC）** |
|------|---------------------|--------------------------|-------------------------|
| **运行位置** | 浏览器 | 服务端首次渲染 + 浏览器 hydration | **始终在服务端**（每次请求都跑）|
| **JS 包含** | ✅ 打包到 bundle | ✅ 打包到 bundle | **❌ 零 JS 发到浏览器** |
| **能用 hooks** | ✅ 全部 | ✅ 全部 | ❌（**无 useState/useEffect**）|
| **能直接读数据库** | ❌（要经 API）| ❌ | **✅ 直接 SQL/ORM 调用** |
| **能用 async/await** | ❌（要 hooks）| ❌ | **✅ 函数本身可以 async** |
| **能保留交互状态** | ✅ | ✅（hydration 后）| ❌（每次重渲染）|

```tsx
// Server Component（默认）
async function PostList() {
  // 直接在组件里查数据库——无需 API Route
  const posts = await db.post.findMany();
  return <ul>{posts.map(p => <PostItem key={p.id} post={p} />)}</ul>;
}

// Client Component（需要 'use client' 显式声明）
'use client';
export function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);  // ← 能用 hooks
  return <button onClick={() => setLiked(!liked)}>{liked ? '❤️' : '🤍'}</button>;
}
```

#### RSC 解决了什么

| 痛点（传统 SSR + CSR）| RSC 怎么解 |
|------------------|----------|
| 客户端 bundle 越来越大（React 应用 200KB+ 起步）| 服务端组件不打包到 bundle |
| 组件查数据要走 API 层（API → DB → API → UI）| **组件直接读数据库**，消除中间 API |
| Waterfall 数据请求 | 服务端并行解决 |
| 敏感数据（API Key、用户隐私）泄露风险 | **服务端代码永不发到浏览器** |
| Hydration 慢 + 闪烁 | **Streaming + Partial Hydration** |

#### Next.js 15 关键能力（2024-2025）

| 能力 | 解决问题 | 用法 |
|------|---------|------|
| **App Router** | RSC 默认架构 | `app/` 目录、文件即路由 |
| **Server Actions** | 表单提交无需手写 API | `'use server'` 标记函数，前端直接调 |
| **Partial Pre-rendering（PPR）** | 静态壳 + 动态内容流式塞入 | 一个页面既能 CDN 缓存又有实时内容 |
| **Turbopack**（Rust 写的打包器）| 替代 Webpack，dev 启动快 700× | `next dev --turbo` |
| **`use cache` 指令** | 细粒度缓存控制 | 标记任意函数/组件结果可缓存 |
| **Streaming + Suspense** | 首屏快、其他部分逐步流式渲染 | `<Suspense fallback={...}>` |

#### Server Actions 实战

替代了 99% 的 `useState + fetch + try/catch` 表单代码：

```tsx
// app/actions.ts
'use server';
export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  await db.post.create({ data: { title } });
  revalidatePath('/posts');     // 自动失效缓存
}

// app/page.tsx
import { createPost } from './actions';

export default function NewPostPage() {
  return (
    <form action={createPost}>          {/* ← 直接传 server function */}
      <input name="title" />
      <button>发布</button>
    </form>
  );
}
```

::: tip 💡 面试加分点

能讲清 **"Server Action 本质是 Next.js 帮你自动生成了 POST 端点 + 序列化 + 调用 + revalidate"** ——这个抽象层级的理解会让面试官觉得你跟得上前沿。

:::

#### RSC 边界规则（最常踩的坑）

```
Server Component ─可以引入→ Client Component （会被打包到 bundle）
Client Component ─不能引入→ Server Component （编译报错）
Client Component ─可以接收 RSC 渲染结果作为 children/props
```

错误示例（最常见）：

```tsx
// ❌ 错误：Client Component 不能直接 import Server Component
'use client';
import ServerThing from './server-thing';  // 编译报错

// ✅ 正确：作为 children 传入
'use client';
export function Layout({ children }) {
  return <div>{children}</div>;            // children 可以是任何东西
}
// 在 Server Component 中组合：<Layout><ServerThing /></Layout>
```

#### 何时**不**用 RSC

| 场景 | 原因 |
|------|------|
| **纯静态站点** | Vite + 静态 SPA 更简单 |
| **完全离线优先 PWA** | Service Worker 主导，服务端组件意义不大 |
| **重度交互应用**（如 Figma、在线 IDE）| 几乎所有组件都是 Client，RSC 没有收益 |
| **不想锁 Next.js 生态** | RSC 目前主要落地在 Next.js / Remix v3 |

#### 面试黄金回答

> **"RSC 是 React 把'查数据 + 渲染 HTML'下沉到服务端的范式，**核心收益是零 JS Bundle + 直接访问数据库 + 消除 API 中间层**。它和 SSR 的区别是 SSR 还需要 hydration（同一份代码跑两次），RSC 服务端代码永远不发到浏览器。Next.js 15 配合 Server Actions 和 Partial Pre-rendering 让 RSC 落地到生产，是 2025 年 React 项目的默认选择。"**

---

## 面试常问 & 怎么答

**Q1：虚拟 DOM 是什么？为什么需要它？**

虚拟 DOM 是用 JS 对象描述 UI 结构的轻量级树。需要它的原因：直接操作真实 DOM 代价高（触发回流重绘），虚拟 DOM 通过 Diff 算法计算最小变更集，批量更新真实 DOM。更重要的是，它提供了**声明式编程模型**（你描述"应该是什么"，React 决定"怎么做到"），以及**跨平台能力**（同一套组件逻辑可运行在 Web 和 Native 上）。

---

**Q2：React 的 key 有什么作用？为什么不能用 index？**

key 是 React 在列表 Diff 时识别节点身份的标识符。当列表项重排或增删时，React 通过 key 判断哪些节点可以复用，哪些需要销毁重建。

使用 index 作为 key 的问题：当列表顺序发生变化（插入、删除、排序），index 对应的元素变了，React 会误以为是"同一个节点内容变了"，导致组件状态错乱（比如受控输入框显示错误的值）、不必要的 DOM 操作。

**结论**：key 应使用数据的唯一稳定标识（如 `id`），只有列表是静态不变的情况下才可以用 index。

---

**Q3：useEffect 的依赖数组是什么？空数组和不传的区别？**

依赖数组告诉 React "当哪些值发生变化时重新执行这个 effect"。

- **不传**：每次组件渲染后都执行，通常会导致性能问题或无限循环
- **`[]` 空数组**：只在组件挂载（mount）后执行一次，相当于 `componentDidMount`
- **`[dep1, dep2]`**：挂载后执行，且在 `dep1` 或 `dep2` 变化时重新执行

cleanup 函数在下一次 effect 执行前或组件卸载时调用，用于清除订阅、计时器等。

---

**Q4：useState 的更新是同步还是异步？**

`useState` 的更新是**异步批量**的，不是立即同步更新 state 值。调用 `setState` 后，当前执行上下文中读取的 state 仍是旧值，要在下次渲染中才能读到新值。

React 18 引入 **Automatic Batching**，即使在 `setTimeout`、原生事件处理器中的多次 `setState` 也会被批量合并为一次渲染（React 17 只在事件处理函数中批量）。

```tsx
const [count, setCount] = useState(0)

const handleClick = () => {
  setCount(count + 1)
  console.log(count)  // 仍然是旧值 0，不是 1
}

// 如果需要基于最新值更新，用函数形式
const handleClickSafe = () => {
  setCount(prev => prev + 1)  // ✅ 始终基于最新值
}
```

---

**Q5：React 的生命周期（Hooks 对应关系）？**

| 类组件生命周期 | Hooks 等价写法 |
|----------------|----------------|
| `componentDidMount` | `useEffect(() => { ... }, [])` |
| `componentDidUpdate` | `useEffect(() => { ... }, [dep])` |
| `componentWillUnmount` | `useEffect(() => { return () => { cleanup } }, [])` |
| `shouldComponentUpdate` | `React.memo` + `useMemo` |
| `getDerivedStateFromProps` | 在渲染函数中直接计算（或 `useMemo`） |

---

**Q6：类组件和函数组件的区别？**

核心区别：函数组件是**纯函数**，每次渲染都是一次独立的函数调用，**闭包捕获当时的 props 和 state**；类组件通过 `this` 访问最新值，`this.props`/`this.state` 始终指向最新值。

这导致一个经典差异：函数组件中的 event handler 会"记住"创建时的 state 值（闭包），而类组件中的 handler 通过 `this.state` 总能读到最新值。

---

**Q7：什么是受控组件和非受控组件？**

- **受控组件**：表单元素的值由 React state 控制，每次用户输入都触发 `onChange` 更新 state，input 的 `value` 始终来自 state。优点：可以实时验证、格式化输入。
- **非受控组件**：表单元素维护自己的内部状态，通过 `ref` 在需要时读取值（类似传统 DOM 操作）。适合文件上传等场景。

---

**Q8：React 如何做性能优化？**

1. **减少不必要的重渲染**：`React.memo`（组件级）、`useMemo`（值缓存）、`useCallback`（函数缓存）
2. **状态合理分层**：避免状态放太高，Context 拆分细粒度（只让关心的组件订阅）
3. **代码分割**：`React.lazy` + `Suspense` 按路由/功能懒加载
4. **虚拟列表**：大数据量列表使用 `react-window` / `react-virtual`
5. **避免内联对象/函数**：`<Child style={ { color: 'red' } } />` 每次渲染都是新对象，配合 `React.memo` 会失效
6. **生产构建**：确保使用 production build（移除 DevTools、断言等）

---

**Q9：useCallback 和 useMemo 的区别？**

```tsx
// useMemo：缓存计算结果（值）
const expensiveValue = useMemo(() => compute(a, b), [a, b])

// useCallback：缓存函数引用（本质是 useMemo 的语法糖）
const handleClick = useCallback(() => doSomething(a), [a])
// 等价于：
const handleClick = useMemo(() => () => doSomething(a), [a])
```

**使用时机**：
- `useMemo`：计算代价高、或需要稳定引用的对象（配合 `React.memo` 的子组件）
- `useCallback`：传给子组件的回调函数，且子组件用了 `React.memo`

> 过度使用 `useMemo`/`useCallback` 反而有性能负担，先 profile，再优化。

---

**Q10：Context 的缺点是什么？什么时候用 Redux？**

**Context 的缺点**：
- **性能问题**：Context value 变化时，所有消费该 Context 的组件都会重渲染（即使只用了其中一部分数据）
- **调试困难**：不像 Redux 有 DevTools 支持时间旅行调试
- **不适合高频更新**：如鼠标位置、实时计数等，会导致大量组件频繁重渲染

**使用 Redux 的时机**：
- 全局状态量大、更新频繁
- 多个组件需要响应同一状态变化
- 需要中间件处理异步逻辑（redux-thunk / redux-saga）
- 需要时间旅行调试、状态持久化等高级功能

> 现代项目更多选择 **Zustand**（轻量）或 **Redux Toolkit**（大型项目），直接用原始 Redux 的场景已较少。

---

## 常见陷阱

| 陷阱 | 问题描述 | 解决方案 |
|------|----------|----------|
| **useEffect 闭包陷阱** | effect 中读取的 state/props 是创建时的旧值，而非最新值 | 将变量加入依赖数组；或使用 `useRef` 存储最新值 |
| **直接修改 state** | `state.list.push(item)` 不会触发重渲染，因为引用未变 | 始终返回新对象/数组：`setState([...prev, item])` |
| **key 使用 index** | 列表重排时组件状态错乱（如 input 值对应错误） | 使用数据的唯一稳定 id 作为 key |
| **useEffect 无限循环** | 依赖项中包含每次渲染都会重建的对象/函数 | 用 `useMemo`/`useCallback` 稳定引用；或重新检查依赖项 |
| **在条件语句中使用 Hook** | 违反 Hooks 规则，React 无法保证 Hook 调用顺序一致 | 始终在函数顶层调用 Hook，条件逻辑放 Hook 内部 |
| **忘记 cleanup** | 组件卸载后仍然 `setState`，导致内存泄漏和控制台警告 | 在 useEffect 返回 cleanup 函数取消订阅/请求 |
| **不必要的重渲染** | 父组件 props 未变但子组件仍重渲染 | `React.memo` 包裹子组件 + `useCallback` 稳定回调引用 |

---

## 看到什么就先想到这类

| 关键词/场景 | 联想到 |
|-------------|--------|
| "UI 不更新" | 是否直接修改了 state（没返回新对象）；key 是否有问题 |
| "重复渲染/性能" | `React.memo` + `useCallback` + `useMemo`；是否有不稳定引用 |
| "获取最新 state" | useEffect 闭包陷阱 → 检查依赖数组；或用 `useRef` 存最新值 |
| "组件间共享状态" | 状态提升 → Context → 状态管理库，根据更新频率和复杂度选择 |
| "大列表卡顿" | 虚拟列表（react-window / react-virtual） |
| "首屏加载慢" | 代码分割 React.lazy + Suspense；路由懒加载 |
| "表单" | 受控组件 useState 管理；复杂表单用 react-hook-form |
| "数据请求" | 避免裸 useEffect，优先用 SWR / React Query |
| "路由跳转" | useNavigate；权限控制用 PrivateRoute 包裹 |
| "跨层传值" | useContext；避免 props drilling |
