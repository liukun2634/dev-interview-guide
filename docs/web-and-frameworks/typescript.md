---
title: TypeScript 5.x 类型系统深度
---

# TypeScript 5.x 类型系统深度

<span class="dig-tag dig-tag--category">前端工程化</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
2026 年 **TypeScript 5.5+ 已是前端标配**。面试不再问"什么是 TypeScript"，而是问 **泛型约束 / 条件类型 / 模板字面量 / `infer`** 这些深度用法，以及 **5.x 新特性**（const 类型参数、装饰器 GA、推导改进）。能讲清 `as const` / `satisfies` / `infer` 三件套立刻区分初/中/高级。
:::

## 类型系统核心特性（必背）

### 1. 类型推导 vs 类型注解

TypeScript 设计哲学：**能推导就别注解**。

```typescript
// ✅ 推导出 string[]
const names = ['Alice', 'Bob'];

// ❌ 多余的注解
const names: string[] = ['Alice', 'Bob'];

// ✅ 函数参数必须注解，返回值通常推导
function add(a: number, b: number) {
  return a + b;  // 推导返回 number
}

// ⚠️ 公共 API 建议显式返回值（防 breaking change）
export function getUser(id: string): User { /* ... */ }
```

### 2. 字面量类型 + 联合类型 + 交叉类型

```typescript
// 字面量类型
type Status = 'pending' | 'success' | 'error';
type Direction = 'up' | 'down' | 'left' | 'right';

// 联合类型
type Id = string | number;

// 交叉类型（合并）
type Person = { name: string };
type Worker = { jobTitle: string };
type Employee = Person & Worker;  // { name: string; jobTitle: string }
```

### 3. 泛型（Generics）— 类型的"函数"

```typescript
// 基础泛型
function identity<T>(value: T): T {
  return value;
}
identity<string>('hi');     // 显式
identity(42);                // 推导 T = number

// 泛型约束
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
getProp({ name: 'A', age: 1 }, 'name');  // ✅ string
getProp({ name: 'A', age: 1 }, 'xx');    // ❌ 编译报错
```

### 4. 工具类型（必背）

```typescript
type User = { id: string; name: string; age: number; admin: boolean };

// Partial: 全部可选
type UserPatch = Partial<User>;
// { id?: string; name?: string; age?: number; admin?: boolean }

// Required: 全部必需
type StrictUser = Required<UserPatch>;

// Pick: 选取部分字段
type UserBasic = Pick<User, 'id' | 'name'>;

// Omit: 排除部分字段
type CreateUserDto = Omit<User, 'id'>;

// Readonly: 全部只读
type ImmutableUser = Readonly<User>;

// Record: 键值映射
type StatusMap = Record<'pending' | 'success' | 'error', string>;

// ReturnType / Parameters
type T1 = ReturnType<() => string>;       // string
type T2 = Parameters<(a: string, b: number) => void>;  // [string, number]

// Awaited（4.5+）
type T3 = Awaited<Promise<Promise<string>>>;  // string

// NonNullable
type T4 = NonNullable<string | null | undefined>;  // string
```

---

## 进阶 — `infer` / 条件类型 / 模板字面量（必背）

### 条件类型（Conditional Types）

```typescript
type IsString<T> = T extends string ? true : false;

type T1 = IsString<'hello'>;  // true
type T2 = IsString<42>;        // false

// 实际应用：根据类型挑选不同行为
type ApiResponse<T> = T extends Error
  ? { success: false; error: T }
  : { success: true; data: T };
```

### `infer` —— 类型中"声明变量"

```typescript
// 提取数组元素类型
type ElementOf<T> = T extends (infer U)[] ? U : never;
type T1 = ElementOf<string[]>;     // string
type T2 = ElementOf<number[]>;     // number

// 提取 Promise 的 resolve 类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type T3 = UnwrapPromise<Promise<User>>;  // User

// 提取函数参数类型 / 返回类型（标准库内部就这么实现）
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;
```

### 模板字面量类型（Template Literal Types）

```typescript
type Greeting = `hello, ${string}`;
const ok: Greeting = 'hello, world';  // ✅
const bad: Greeting = 'hi';            // ❌

// 字符串操作
type EventName<T extends string> = `on${Capitalize<T>}`;
type T1 = EventName<'click'>;  // 'onClick'

// 联合类型分发
type Direction = 'top' | 'right' | 'bottom' | 'left';
type CSSProperty = `padding-${Direction}`;
// 'padding-top' | 'padding-right' | 'padding-bottom' | 'padding-left'

// 提取路由参数（小型类型体操）
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
    ? Param
    : never;

type T2 = ExtractParams<'/user/:id/post/:postId'>;  // 'id' | 'postId'
```

### 映射类型（Mapped Types）

```typescript
// 把所有字段变可选（自己实现 Partial）
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// 把所有字段加 readonly
type MyReadonly<T> = {
  [K in keyof T]: Readonly<T[K]>;
};

// Key 重映射（4.1+）
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }
```

---

## TypeScript 5.x 新特性深度（2026 必背）

### TS 5.0：装饰器 GA + const 类型参数

#### 1. 装饰器 GA（ECMAScript 标准）

**重要**：TS 5.0 装饰器是 **Stage 3 ECMA 标准**，与之前的 `experimentalDecorators` 完全不同。

```typescript
// ✅ TS 5.0 装饰器（Stage 3 标准）
function loggable<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  ctx: ClassMethodDecoratorContext
) {
  return function (this: This, ...args: Args): Return {
    console.log(`[${String(ctx.name)}] called with`, args);
    return target.call(this, ...args);
  };
}

class Service {
  @loggable
  greet(name: string) {
    return `Hello, ${name}`;
  }
}
```

::: warning ⚠️ 不要混用

> 老的 `experimentalDecorators` 与新装饰器**语义/类型/元数据完全不同**。Angular / TypeORM 等仍依赖旧版，迁移需等库升级。

:::

#### 2. const 类型参数 — 替代 `as const`

```typescript
// TS 4.x: 必须显式 as const
function tuple<T extends readonly unknown[]>(...args: T): T {
  return args;
}
const t1 = tuple('a', 1, true);       // (string | number | boolean)[]
const t2 = tuple('a' as const, 1 as const, true as const);  // ['a', 1, true]

// ✅ TS 5.0: const 类型参数
function tuple<const T extends readonly unknown[]>(...args: T): T {
  return args;
}
const t3 = tuple('a', 1, true);  // ['a', 1, true] 自动推导为元组！
```

### TS 5.2：`using` 声明（资源管理）

```typescript
// ⚠️ ES2026 提案：自动释放资源
class FileHandle {
  [Symbol.dispose]() {
    console.log('closing file');
  }
}

function readFile() {
  using file = new FileHandle();   // ★ 离开作用域自动调 dispose
  // ...
}  // 此处自动关闭

// 异步版
class DBConnection {
  async [Symbol.asyncDispose]() { await this.close(); }
}

async function query() {
  await using conn = new DBConnection();
  // ...
}  // 自动 await 异步释放
```

### TS 5.3 / 5.4：`NoInfer` + import 属性

```typescript
// NoInfer<T>: 阻止某个泛型从特定位置推导
function createStreetLight<C extends string>(
  colors: C[],
  defaultColor?: NoInfer<C>   // ★ 不允许从这里影响 C 的推导
) { /* ... */ }

createStreetLight(['red', 'yellow', 'green'], 'red');     // ✅
createStreetLight(['red', 'yellow', 'green'], 'blue');    // ❌ 报错
// 没有 NoInfer 时 'blue' 会污染 C，导致误推 'red'|'yellow'|'green'|'blue'

// import 属性（替代旧 assert）
import data from './data.json' with { type: 'json' };
```

### TS 5.5：推导改进 + 编辑器性能

| 改进 | 收益 |
|------|------|
| **类型谓词推导**（type predicate inference） | `arr.filter(x => x != null)` 自动推导为 `NonNullable<T>[]` |
| **正则字面量类型检查** | `/[a-z+/` 编译期检测语法错 |
| **JSDoc `@import`** | JS 项目也能 import 类型 |
| **Isolated declarations** | DTS 生成速度大幅提升（Bun/Deno 友好）|

```typescript
// TS 5.5: filter 自动推导
const xs: (string | null)[] = ['a', null, 'b'];
const ys = xs.filter(x => x != null);
// 之前: (string | null)[]
// ✅ 5.5+: string[]
```

---

## `as const` / `satisfies` / `infer` 三件套（面试必背）

### `as const` —— 字面量字面量化

```typescript
// 不加 as const
const config = { mode: 'dark', size: 12 };
// type: { mode: string; size: number }  ← 太宽

// ✅ as const
const config = { mode: 'dark', size: 12 } as const;
// type: { readonly mode: 'dark'; readonly size: 12 }
```

### `satisfies` —— 校验类型但保留窄类型

**TS 4.9 新增**，解决"既要校验又不想丢字面量"的痛。

```typescript
type Config = Record<string, string | number>;

// ❌ 用 as Config —— 丢失字面量
const c1 = { mode: 'dark', size: 12 } as Config;
c1.mode.toUpperCase();   // ✅ 但 c1.mode 是 string|number 联合

// ❌ 用 : Config —— 同样丢失
const c2: Config = { mode: 'dark', size: 12 };
c2.mode.toUpperCase();   // 报错: string|number 没有 toUpperCase

// ✅ satisfies —— 校验通过 + 保留字面量
const c3 = { mode: 'dark', size: 12 } satisfies Config;
c3.mode.toUpperCase();   // ✅ c3.mode 是 string
c3.size.toFixed(2);       // ✅ c3.size 是 number
```

### `infer` —— 见前面进阶部分

### 三者组合示例

```typescript
// 定义 routes 配置 + 自动提取 path 类型
const routes = {
  home: '/home',
  user: '/user/:id',
  post: '/post/:id/comment/:commentId',
} as const satisfies Record<string, string>;

type RoutePath = typeof routes[keyof typeof routes];
// '/home' | '/user/:id' | '/post/:id/comment/:commentId'

// 提取参数
type ExtractParams<T extends string> =
  T extends `${string}:${infer P}/${infer R}`
    ? P | ExtractParams<R>
    : T extends `${string}:${infer P}`
    ? P
    : never;

type UserParams = ExtractParams<typeof routes.user>;  // 'id'
type PostParams = ExtractParams<typeof routes.post>;  // 'id' | 'commentId'
```

---

## 实用类型体操（Type Challenge）

### DeepPartial（递归可选）

```typescript
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

### Tuple 转 Union

```typescript
type T1 = ['a', 'b', 'c'][number];  // 'a' | 'b' | 'c'
```

### Union 转 Intersection（高阶）

```typescript
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void
    ? I
    : never;

type T1 = UnionToIntersection<{ a: 1 } | { b: 2 }>;
// { a: 1 } & { b: 2 }
```

### Awaited 递归 Promise

```typescript
type MyAwaited<T> = T extends Promise<infer U>
  ? MyAwaited<U>   // 递归
  : T;
```

---

## tsconfig.json 关键配置（生产建议）

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",                    // 现代浏览器/Node 20+
    "module": "NodeNext",                  // 或 "ESNext" + bundler
    "moduleResolution": "NodeNext",
    "strict": true,                        // ★ 必开
    "noUncheckedIndexedAccess": true,      // ★ 强烈建议：数组下标自动加 undefined
    "exactOptionalPropertyTypes": true,    // 区分 ?:undefined 和 ?
    "noImplicitOverride": true,            // 重写必须 override
    "verbatimModuleSyntax": true,          // import type 强制
    "isolatedModules": true,               // 兼容 Babel/SWC
    "esModuleInterop": true,
    "skipLibCheck": true,                  // 跳过库的类型检查（加速）
    "allowImportingTsExtensions": true,    // 5.0+: 可 import './x.ts'
  }
}
```

::: warning ⚠️ `strict` 实际包含 7 个子选项

> `strict: true` 等价于：`strictNullChecks` + `noImplicitAny` + `strictFunctionTypes` + `strictBindCallApply` + `strictPropertyInitialization` + `noImplicitThis` + `alwaysStrict`。**所有新项目第一天就打开。**

:::

---

## 常见陷阱（面试 Top 必踩）

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **滥用 `any`** | 类型保护失效 | 改 `unknown` + 类型守卫 |
| **滥用 `as`** | 类型欺骗，运行时崩 | 用 `is` 类型谓词或 `zod` 校验 |
| **`enum` 反模式** | 编译产物臃肿 + 不支持 tree-shake | 用 `as const` 对象或 union 字面量 |
| **`interface` vs `type`** 选错 | 扩展性 / 性能差异 | 公共 API 用 `interface`（可声明合并），内部联合/工具类型用 `type` |
| **`!` 非空断言** | 真实 null 时 crash | 用 `??` / `?.` 或显式判 |
| **`Object.keys` 推导是 `string[]`** | 期望 `keyof T` | `(Object.keys(obj) as Array<keyof typeof obj>)` |
| **`Array.includes` 类型过窄** | `arr.includes(x)` 在 x 类型不匹配时报错 | TS 5.0+ 用 `const T extends readonly string[]` |

```typescript
// ❌ 危险：as 欺骗
const user = JSON.parse(text) as User;   // 不校验，运行时可能崩

// ✅ 用 zod 运行时校验
import { z } from 'zod';
const UserSchema = z.object({ id: z.string(), name: z.string() });
const user = UserSchema.parse(JSON.parse(text));   // 校验失败抛异常
```

---

## interface vs type —— 必背区别

| 维度 | `interface` | `type` |
|------|------------|--------|
| **声明合并** | ✅（同名自动合并）| ❌ |
| **联合 / 元组 / 字面量** | ❌ | ✅ |
| **`extends` 继承** | ✅ 直观 | 用 `&` 交叉 |
| **性能** | TS 内部优化好（命名引用）| 复杂条件类型可能慢 |
| **建议** | **公共 API / 类约束** | **联合 / 工具类型 / 类型计算** |

```typescript
// ✅ interface 自动合并 —— 扩展第三方类型
interface Window {
  myCustomGlobal: string;
}

// ✅ type 联合
type Result = { success: true; data: User } | { success: false; error: string };
```

---

## 黄金答题模板（必背）

> **面试官：TypeScript 你最熟的是哪些高级特性？**
>
> **答**：3 件套：① **`as const`** 把字面量字面量化；② **`satisfies`**（4.9+）校验类型但**保留窄类型**——比 `:Type` 和 `as Type` 都好用；③ **`infer`** 在条件类型中"声明变量"，是类型体操核心。
>
> 5.x 关键新东西：① **装饰器 GA**（Stage 3 标准，与旧 `experimentalDecorators` 不兼容）；② **const 类型参数** 替代 `as const`；③ **`using` 资源管理**（5.2，类似 RAII）；④ **`NoInfer`**（5.4）防止泛型从某位置污染推导；⑤ **filter 类型谓词推导**（5.5）`arr.filter(x => x != null)` 自动是 `NonNullable<T>[]`。
>
> 生产配置必开 `strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes`。运行时校验用 zod / valibot——TypeScript 编译期类型不能替代运行时校验。

---

## 看到什么就先想到这类

- **"既校验又保留窄类型"** → `satisfies`
- **"字面量字面量化"** → `as const`
- **"从类型中提取子类型"** → `infer`
- **"类型重映射"** → mapped type with `as` clause
- **"字符串模板匹配"** → 模板字面量 + `infer`
- **"全部可选"** → `Partial<T>`
- **"递归可选"** → 自定义 `DeepPartial<T>`
- **"重写 ECMA 装饰器"** → TS 5.0+ Stage 3 标准
- **"运行时类型校验"** → zod / valibot（TS 编译期不够）
- **"数组下标安全"** → `noUncheckedIndexedAccess`
