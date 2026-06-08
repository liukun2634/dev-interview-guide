---
title: RESTful API 设计
---

# RESTful API 设计

<span class="dig-tag dig-tag--category">Web 与框架</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
REST（Representational State Transfer）是一种基于 HTTP 协议的 API 设计风格，其核心是以**资源**为中心，用标准 HTTP 方法（GET/POST/PUT/PATCH/DELETE）表达操作，用 HTTP 状态码表达结果。良好的 RESTful 设计让 API 直观、可预测、易维护。
:::

## REST 六大核心原则

Roy Fielding 在其博士论文中定义了 REST 架构风格的六条约束：

| 原则 | 说明 |
|------|------|
| **统一接口（Uniform Interface）** | 资源通过统一的 URI 标识，用标准 HTTP 方法操作 |
| **无状态（Stateless）** | 每个请求包含所有必要信息，服务端不保存客户端状态（Session 存客户端或 Token 中） |
| **可缓存（Cacheable）** | 响应标明是否可缓存，GET 响应通常可缓存 |
| **客户端-服务器分离（Client-Server）** | 前后端解耦，各自演进 |
| **分层系统（Layered System）** | 客户端不知道（也不需要知道）是否通过中间层（负载均衡、网关） |
| **按需代码（Code on Demand，可选）** | 服务端可发送可执行代码给客户端（如 JavaScript） |

> **面试重点：** 前三条最重要，尤其是**无状态**是区分 RESTful 与传统 Session 架构的关键。

## HTTP 方法的语义

| 方法 | 操作语义 | 幂等？ | 安全？ | 请求体 |
|------|---------|-------|-------|-------|
| **GET** | 获取资源 | ✅ 是 | ✅ 是 | 无 |
| **POST** | 创建资源 / 执行操作 | ❌ 否 | ❌ 否 | 有 |
| **PUT** | 全量替换资源 | ✅ 是 | ❌ 否 | 有 |
| **PATCH** | 部分更新资源 | ❌ 否（可设计为幂等） | ❌ 否 | 有 |
| **DELETE** | 删除资源 | ✅ 是 | ❌ 否 | 无 |
| **HEAD** | 获取响应头（不返回 body） | ✅ 是 | ✅ 是 | 无 |
| **OPTIONS** | 查询支持的方法（CORS 预检） | ✅ 是 | ✅ 是 | 无 |

**幂等（Idempotent）：** 执行多次与执行一次的结果相同。DELETE `/users/1` 执行两次，用户仍然是被删除状态。

**安全（Safe）：** 不修改服务端状态（只读操作）。

## URI 设计规范

### 好的 URI 设计

```
# 使用名词（资源），不用动词
GET  /users           # 获取用户列表
GET  /users/123       # 获取单个用户
POST /users           # 创建用户
PUT  /users/123       # 全量更新用户
PATCH /users/123      # 部分更新用户
DELETE /users/123     # 删除用户

# 嵌套资源表达从属关系
GET  /users/123/orders        # 用户 123 的所有订单
GET  /users/123/orders/456    # 用户 123 的订单 456

# 过滤、排序、分页用查询参数
GET /users?role=admin&sort=created_at&order=desc&page=2&limit=20
```

### 常见错误设计

```
# 错误：URI 里出现动词
POST /createUser       ← 错误，POST /users 才是 RESTful
GET  /getUser/123      ← 错误，GET /users/123
POST /deleteUser/123   ← 错误，DELETE /users/123

# 错误：URI 包含操作而非资源
GET /user/123/activate ← 可接受，但更 RESTful 是 PATCH /users/123 { status: "active" }

# 错误：大小写和格式不统一
/UserProfile    ← 用 /user-profiles（小写，连字符分隔）
/user_profile   ← 用 /user-profiles（连字符，而非下划线）
```

## HTTP 状态码

合理使用状态码是 RESTful API 设计质量的体现：

| 状态码 | 含义 | 使用场景 |
|-------|------|---------|
| **200 OK** | 请求成功 | GET、PUT、PATCH 成功返回数据 |
| **201 Created** | 创建成功 | POST 创建资源后，附带 Location 头指向新资源 |
| **204 No Content** | 成功，无返回体 | DELETE 或 PUT 不需要返回内容时 |
| **400 Bad Request** | 请求参数错误 | 字段格式错误、缺少必填字段 |
| **401 Unauthorized** | 未认证 | 未携带 Token 或 Token 无效 |
| **403 Forbidden** | 无权限 | 已认证但无权访问该资源 |
| **404 Not Found** | 资源不存在 | 用户/订单 ID 不存在 |
| **409 Conflict** | 冲突 | 用户名已存在、版本冲突 |
| **422 Unprocessable Entity** | 业务规则校验失败 | 账户余额不足等业务逻辑错误 |
| **429 Too Many Requests** | 限流 | API 调用超过速率限制 |
| **500 Internal Server Error** | 服务器内部错误 | 未预期的异常 |
| **503 Service Unavailable** | 服务不可用 | 服务器维护或过载 |

## 请求与响应示例

### 创建用户

```http
POST /api/v1/users
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com",
  "role": "admin"
}
```

```http
HTTP/1.1 201 Created
Location: /api/v1/users/789
Content-Type: application/json

{
  "id": 789,
  "username": "alice",
  "email": "alice@example.com",
  "role": "admin",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 错误响应统一格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request body contains invalid data",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  },
  "requestId": "req_abc123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## API 版本管理

当 API 需要破坏性变更时，需要进行版本控制：

**方式一：URI 路径版本号（最常用）**
```
/api/v1/users
/api/v2/users
```

**方式二：请求头版本号**
```http
GET /api/users
Accept: application/vnd.myapp.v2+json
```

**方式三：查询参数**
```
GET /api/users?version=2
```

> 推荐 **URI 版本号**：最直观，缓存友好，浏览器/抓包工具直接可见。

## PUT vs PATCH 的关键区别

```json
// 当前用户数据
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "age": 25
}
```

```http
// PUT：全量替换，未提供的字段可能被清空
PUT /users/1
{ "name": "Alice Smith" }

// 结果（email 和 age 被删除！）
{ "id": 1, "name": "Alice Smith" }
```

```http
// PATCH：部分更新，只修改提供的字段
PATCH /users/1
{ "name": "Alice Smith" }

// 结果（email 和 age 保留）
{ "id": 1, "name": "Alice Smith", "email": "alice@example.com", "age": 25 }
```

## RESTful API 认证

### Bearer Token（最常用）

```http
GET /api/v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JWT（JSON Web Token）** 是 Bearer Token 的常见实现：
```
Header.Payload.Signature
{alg, typ} . {user_id, role, exp} . HMAC_SHA256(header+payload, secret)
```

优点：无状态，服务器不存 Session；缺点：Token 下发后无法主动撤销（需配合黑名单或 Redis）。

### 认证 vs 授权

- **认证（Authentication）：** 你是谁？验证身份（用户名+密码 / OAuth）
- **授权（Authorization）：** 你能做什么？验证权限（RBAC 角色权限、资源所有权）

## 常见误区

::: warning 易错点
1. **GET 请求不应有副作用**（不改变服务器状态），满足"安全性"；但有些框架允许 GET 带请求体，标准上不推荐
2. **401 vs 403 的区别：** 401 表示"谁都不知道"（未认证），403 表示"知道你是谁，但不允许你做这件事"（无权限）
3. **POST 不幂等**：重复提交会创建多个资源。前端需要防重提（按钮 disable、幂等 Token）
4. **PATCH 的幂等性：** PATCH 是否幂等取决于实现。绝对值修改（`{ "name": "Alice" }`）是幂等的；增量修改（`{ "balance": "+100" }`）不是幂等的
:::

## API 文档：OpenAPI 3.1 + springdoc-openapi

::: tip 💡 2026 标准
**Swagger 2 / springfox 已停止维护**，新项目统一用 **springdoc-openapi**（基于 OpenAPI 3.1，原生支持 Spring Boot 3 / Jakarta）。
:::

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.6.0</version>
</dependency>
```

启动后自动暴露：
- **`/v3/api-docs`** — JSON 格式的 OpenAPI 3.1 规范
- **`/swagger-ui.html`** — 交互式调试界面

```java
@Operation(summary = "查询用户", description = "按 ID 查找用户")
@ApiResponse(responseCode = "200", description = "找到")
@ApiResponse(responseCode = "404", description = "不存在")
@GetMapping("/users/{id}")
UserDto get(@Parameter(description = "用户 ID") @PathVariable Long id) { ... }
```

| 工具 | 状态 | 备注 |
|------|------|------|
| **springdoc-openapi** | ✅ 主流 | OpenAPI 3.1、Boot 3 友好 |
| ~~springfox~~ | ❌ EOL（2020 后无更新） | 不要用于新项目 |
| **OpenAPI Generator** | ✅ 主流 | 反向生成客户端 SDK（Java/TS/Go） |
| **Stoplight / Postman** | ✅ 协作 | 团队 API 设计与 mock |

## REST vs GraphQL vs gRPC：协议选型矩阵

API 设计不只有 REST。**2024-2026 大厂普遍三套并存**：对外 REST，前端聚合 GraphQL，内部 RPC 用 gRPC。

| 维度 | REST | GraphQL | gRPC |
|------|------|---------|------|
| **传输** | HTTP/1.1 + JSON | HTTP + JSON | **HTTP/2 + Protobuf** |
| **数据形状** | 后端固定，前端可能"过取/欠取" | **前端按需查询** | 强类型 schema，IDL 定义 |
| **流式** | SSE / 长轮询 | Subscriptions（WS） | **原生四种 RPC 模式**（一/双向流） |
| **浏览器友好** | ✅ 一等公民 | ✅ Apollo / urql | ⚠️ 需 grpc-web 代理 |
| **服务发现/LB** | 标准 K8s Service | 标准 | **客户端 LB**（gRPC LB 自带，无 sidecar 也行） |
| **典型场景** | 对外 Open API、CRUD | BFF 聚合、移动端弱网 | **内部高性能微服务**、多语言 RPC |
| **生态代表** | Spring MVC、Express | Apollo、Hasura | Spring gRPC、Envoy |

**心智模型**：「**对外 REST（通用），前端 GraphQL（聚合），内部 gRPC（性能）**」。详见 [HTTP/HTTPS · gRPC 基于 HTTP/2](../../computer-networks/http-https#grpc基于-http2-的高性能-rpc)。

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. RESTful API 的设计原则是什么？什么是无状态？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. PUT 和 PATCH 有什么区别？什么是幂等性？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. HTTP 状态码 401 和 403 有什么区别？</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">简单</span>
  </div>
</div>

### Q1: RESTful 设计原则

**核心三条（必背）：**
1. **以资源为中心**：URI 标识资源（名词），用 HTTP 方法（动词）表操作
2. **无状态**：每个请求包含所有必要信息，服务端不维护 Session（适合水平扩展）
3. **统一接口**：使用标准 HTTP 方法，用状态码表达结果

**无状态的意义：** 任意节点都能处理请求，便于水平扩展（加机器）和故障恢复，不需要 Session 粘性路由。

### Q2: PUT vs PATCH

- **PUT**：全量替换，请求体必须包含完整的资源描述，缺少的字段会被清空或默认值覆盖
- **PATCH**：部分更新，只传需要修改的字段，其余保持不变

**幂等性：** 执行多次和执行一次结果相同。PUT 是幂等的（每次都是同一个完整替换），PATCH 是否幂等取决于操作语义。

### Q3: 401 vs 403

- **401 Unauthorized（实为 Unauthenticated）：** 请求未携带身份凭证（Token 缺失/过期），服务器不知道你是谁（需要登录）
- **403 Forbidden：** 服务器知道你是谁，但你没有权限执行该操作（账号权限不足）

记忆技巧：401 是"门卫不认识你（需要先证明身份）"，403 是"门卫认识你但不放你进去（你没有通行证）"。

## 延伸阅读

- [RESTful API 设计规范 - Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md)
- [HTTP API Design Guide - Heroku](https://github.com/interagent/http-api-design)
- [Roy Fielding 博士论文：Architectural Styles and the Design of Network-based Software Architectures](https://ics.uci.edu/~fielding/pubs/dissertation/top.htm)
