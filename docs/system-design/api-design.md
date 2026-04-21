---
title: API 设计
---

# API 设计

## 概念

API（Application Programming Interface）是服务与服务之间、前端与后端之间的**契约**。设计良好的 API 应具备以下特征：

- **一致性**：命名规范、错误格式、响应结构统一
- **版本管理**：向后兼容，平滑升级
- **安全性**：鉴权、限流、数据校验
- **可文档化**：自描述，易于集成（如 OpenAPI/Swagger）

---

## 核心原理

### 1. RESTful 设计

REST（Representational State Transfer）是目前最主流的 API 风格，核心思想是**用资源建模，而非动作**。

**资源建模：名词而非动词**

```
# 错误示范
GET /getUser?id=123
POST /createOrder

# 正确示范
GET /users/123
POST /orders
```

**HTTP 方法语义**

| 方法 | 语义 | 幂等性 |
|------|------|--------|
| GET | 查询资源 | 是 |
| POST | 创建资源 | 否 |
| PUT | 全量更新 | 是 |
| PATCH | 部分更新 | 否（通常） |
| DELETE | 删除资源 | 是 |

**常用状态码**

| 状态码 | 含义 |
|--------|------|
| 200 OK | 请求成功 |
| 201 Created | 资源创建成功 |
| 204 No Content | 成功但无返回体（如 DELETE） |
| 400 Bad Request | 请求参数错误 |
| 401 Unauthorized | 未认证 |
| 403 Forbidden | 已认证但无权限 |
| 404 Not Found | 资源不存在 |
| 409 Conflict | 资源冲突（如重复创建） |
| 422 Unprocessable Entity | 语义错误（参数格式正确但业务不合法） |
| 429 Too Many Requests | 触发限流 |
| 500 Internal Server Error | 服务端错误 |

**HATEOAS（超媒体驱动）**

响应中包含相关操作的链接，让客户端可自发现后续操作。实际工程中较少严格实施，了解概念即可。

```json
{
  "orderId": "789",
  "status": "PAID",
  "_links": {
    "self": { "href": "/orders/789" },
    "cancel": { "href": "/orders/789/cancel" }
  }
}
```

---

### 2. gRPC

gRPC 是 Google 开源的高性能 RPC 框架，基于 **HTTP/2** 和 **Protobuf** 序列化。

**Protobuf 定义示例（.proto 文件）**

```protobuf
syntax = "proto3";

package user;

service UserService {
  // Unary（一元调用）
  rpc GetUser (GetUserRequest) returns (User);

  // Server Streaming（服务端流）
  rpc ListUsers (ListUsersRequest) returns (stream User);

  // Client Streaming（客户端流）
  rpc BatchCreateUsers (stream CreateUserRequest) returns (BatchResult);

  // Bidirectional Streaming（双向流）
  rpc Chat (stream ChatMessage) returns (stream ChatMessage);
}

message GetUserRequest {
  string user_id = 1;
}

message User {
  string user_id = 1;
  string name = 2;
  string email = 3;
}
```

**四种流模式**

| 模式 | 说明 | 典型场景 |
|------|------|---------|
| Unary（一元） | 一请求一响应 | 普通查询、创建 |
| Server Streaming | 一请求，服务端推送多条 | 大文件下载、实时日志 |
| Client Streaming | 客户端发多条，服务端一次响应 | 批量上传 |
| Bidirectional Streaming | 双向持续流 | 实时聊天、音视频 |

**HTTP/2 多路复用**

HTTP/1.1 存在队头阻塞，每个请求需要独占连接。HTTP/2 在单个 TCP 连接上并发多路流，大幅降低延迟，gRPC 因此天然支持高并发场景。

**何时选 gRPC**

- 微服务间内部调用，对性能要求高
- 需要流式传输
- 强类型契约，多语言团队协作
- 不适合：浏览器直接调用（需额外代理层）、对人类可读性要求高的场景

---

### 3. GraphQL

GraphQL 是 Facebook 开源的查询语言，让客户端**精确描述所需数据**，服务端按需返回。

**Schema 定义**

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  orders: [Order!]!
}

type Order {
  id: ID!
  amount: Float!
  status: String!
}

type Query {
  user(id: ID!): User
  users: [User!]!
}

type Mutation {
  createUser(name: String!, email: String!): User!
  updateUser(id: ID!, name: String): User!
}
```

**查询示例**

```graphql
# 只拿需要的字段，避免过度拉取
query {
  user(id: "123") {
    name
    orders {
      amount
      status
    }
  }
}
```

**N+1 问题与 DataLoader**

```
# 查询 10 个用户各自的订单
→ 1 次查询所有用户
→ 10 次分别查询订单（N+1）

# DataLoader 解决方案：批量 + 缓存
→ 收集一批 userId，合并为 1 次 IN 查询
→ 同一请求内重复 id 命中缓存
```

**何时用 GraphQL，何时不用**

| 适合 | 不适合 |
|------|--------|
| BFF（Backend for Frontend）层 | 简单 CRUD 的内部服务 |
| 移动端按需拉取字段 | 文件上传/流式传输 |
| 聚合多个下游服务数据 | 团队对 GraphQL 不熟悉 |
| 前端团队快速迭代 | 对缓存策略要求简单（REST + CDN 更易） |

---

### 4. API 网关

API 网关是系统对外的统一入口，负责路由、鉴权、限流、监控等横切关注点。

**核心功能**

- 路由转发与负载均衡
- 统一鉴权（JWT 验证、OAuth2）
- 限流与熔断
- 请求/响应转换
- 日志与链路追踪
- SSL 终止

**主流方案对比**

| 维度 | Kong | Spring Cloud Gateway | Envoy |
|------|------|----------------------|-------|
| 技术栈 | Nginx + Lua | Java（Spring） | C++（Envoy Proxy） |
| 适用场景 | 多语言微服务、插件生态丰富 | Java/Spring 技术栈 | 服务网格（Istio 等） |
| 性能 | 高 | 中（JVM 开销） | 极高 |
| 配置方式 | Admin API / 声明式 | 代码/配置文件 | xDS 动态配置 |
| 插件生态 | 丰富（认证、限流、日志等） | Spring 生态 | 扩展性强但门槛高 |
| 运维复杂度 | 中 | 低（熟悉 Spring） | 高 |

**选型决策**

- 已有 Spring 技术栈 → Spring Cloud Gateway
- 需要丰富插件、快速落地 → Kong
- 使用服务网格（Istio）或对性能极致要求 → Envoy

---

### 5. 版本管理

API 演进不可避免，版本管理保证**向后兼容**，旧客户端不受影响。

**三种版本策略**

```
# 1. URI 版本（最常见，直观）
GET /v1/users/123
GET /v2/users/123

# 2. 请求头版本
GET /users/123
Accept: application/vnd.myapp.v2+json

# 3. Query 参数
GET /users/123?version=2
```

**向后兼容策略**

- 只新增字段，不删除或重命名已有字段
- 新增字段给默认值，避免强制要求
- 废弃字段用 `deprecated` 标注，给充足迁移期
- 重大变更才升版本号（v1 → v2）
- 同时维护多版本，设置日落（Sunset）时间

---

### 6. 鉴权方案

**OAuth2 四种授权模式**

| 模式 | 适用场景 |
|------|---------|
| Authorization Code（授权码） | 第三方应用代表用户访问（最安全，有回调） |
| Client Credentials（客户端凭证） | 服务间调用，无用户上下文 |
| Resource Owner Password（密码） | 高度信任的自有应用（不推荐，已逐步废弃） |
| Implicit（隐式） | 纯前端 SPA（已废弃，改用带 PKCE 的授权码） |

**JWT 结构**

```
Header.Payload.Signature

# Header（Base64）
{
  "alg": "HS256",
  "typ": "JWT"
}

# Payload（Base64，不加密，勿放敏感信息）
{
  "sub": "user123",
  "name": "张三",
  "roles": ["admin"],
  "iat": 1710000000,
  "exp": 1710003600
}

# Signature = HMAC_SHA256(base64(header) + "." + base64(payload), secret)
```

**Token 刷新流程**

```
1. 登录 → 服务端返回 access_token（短期，如 1h）+ refresh_token（长期，如 30d）
2. 请求携带 access_token
3. access_token 过期 → 客户端用 refresh_token 换取新 access_token
4. refresh_token 过期或吊销 → 重新登录
```

**SSO（单点登录）**

多个系统共享一次登录状态，常见实现：SAML 2.0、OIDC（OpenID Connect，OAuth2 的身份层扩展）。

---

### 7. API 幂等性

**幂等性**：同一请求执行一次与多次，结果相同，不产生副作用。

**HTTP 方法天然幂等性**

| 方法 | 天然幂等？ | 说明 |
|------|-----------|------|
| GET | 是 | 只读 |
| PUT | 是 | 全量覆盖 |
| DELETE | 是 | 删除后再删无变化 |
| POST | 否 | 每次可能创建新资源 |
| PATCH | 否（通常） | 部分更新，多次可能叠加 |

**幂等性 Key 设计**

```
# 客户端生成唯一幂等键，放在请求头
POST /orders
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

# 服务端处理逻辑
1. 检查 Redis/DB 是否存在该 key
2. 存在 → 直接返回上次结果（不重复执行）
3. 不存在 → 执行业务逻辑，保存 key + 结果，设置过期时间
```

**基于 Token 的防重复提交**

```
1. 客户端提交前先请求 /token 获取一次性令牌
2. 提交时携带令牌
3. 服务端验证令牌存在 → 执行 → 删除令牌
4. 令牌不存在 → 拒绝（重复请求）
```

---

## 面试常问 & 怎么答

**Q1：REST vs gRPC 怎么选？**

> 从三个维度判断：调用方、性能要求、团队生态。
>
> 对外 API（浏览器、第三方调用）→ REST，天然支持 HTTP/JSON，可读性强，易文档化。
>
> 内部微服务调用 → gRPC，Protobuf 序列化比 JSON 小 3-10 倍，HTTP/2 多路复用延迟更低，强类型 .proto 文件即文档。
>
> 如果团队是 Java/Spring 全栈且服务不多 → REST 足够，引入 gRPC 增加复杂度未必值得。
>
> 如果有流式需求（实时推送、大文件） → gRPC Streaming 是首选。

**Q2：如何设计一个对外开放的 API 平台？**

> 分层回答：网关层、协议层、安全层、运营层。
>
> **网关层**：统一入口（Kong/Envoy），负责路由、SSL 终止、限流、日志。
>
> **协议层**：对外 REST + OpenAPI 文档，内部可 gRPC；版本管理用 URI 版本（/v1、/v2）。
>
> **安全层**：OAuth2 Client Credentials 给第三方颁发 AppKey/AppSecret，换取 access_token；所有接口强制 HTTPS；敏感数据脱敏返回。
>
> **运营层**：API Key 管理、调用量配额、流量分析、Webhook 通知、开发者门户（文档 + 在线调试）。
>
> **幂等性**：POST 接口要求调用方传 Idempotency-Key，防止网络重试造成重复操作。

**Q3：JWT 和 Session 的区别？各自适用场景？**

> **Session**：服务端有状态，Session 存 Redis/内存，客户端只持有 Session ID（Cookie）。优点：可随时吊销；缺点：服务端需存储，水平扩展需共享存储。
>
> **JWT**：服务端无状态，Token 自包含用户信息，服务端只需验证签名。优点：天然适合分布式、微服务；缺点：Token 颁发后无法主动吊销（只能等过期），需配合黑名单或短过期时间。
>
> **选型**：
> - 传统 Web 应用、需要即时吊销（如踢下线）→ Session
> - 微服务、API 网关鉴权、移动端/跨域 → JWT（短 access_token + refresh_token）
> - 企业内部多系统 → OIDC（JWT + SSO）

---

## 看到什么就先想到这类

| 场景关键词 | 第一反应 |
|-----------|---------|
| 对外 API / 前后端通信 | REST + OpenAPI 文档 |
| 服务间高性能调用 / 微服务内部 | gRPC + Protobuf |
| 客户端灵活查询 / 移动端按需取数 / BFF | GraphQL + DataLoader |
| 统一入口 / 鉴权限流 / 路由 | API 网关（Kong / Spring Cloud Gateway） |
| 防重复提交 / 支付/下单重试 | 幂等性设计（Idempotency-Key） |
| 用户登录 / 第三方授权 / 权限 | OAuth2 + JWT（Authorization Code 流） |
| 多系统单点登录 | OIDC / SAML SSO |
| API 需要演进但不能破坏旧客户端 | URI 版本管理 + 向后兼容策略 |
