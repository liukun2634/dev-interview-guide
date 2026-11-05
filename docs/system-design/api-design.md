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

**幂等性**：同一请求重复执行的预期业务效果与执行一次相同，不代表响应字节、状态码或访问日志完全不变，也不代表首次执行没有副作用。HTTP 方法的幂等语义仍需服务端实现遵守。

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
1. 在租户/用户/操作作用域中计算 key 与规范化请求摘要
2. 通过数据库唯一约束原子竞争 key，不用“先查不存在”代替并发裁决
3. 业务修改、幂等记录、结果或持久操作 ID 在同一事务提交
4. 已完成的相同请求重放结果；相同 key 不同摘要返回明确冲突
5. 正在处理或结果未知时返回可查询状态，使用同一 key 查询/重试
```

Redis 可以缓存结果，但不能单独原子覆盖数据库业务。去重保留时间应覆盖客户端重试和业务回放窗口；过期后重复请求的语义也必须写进契约。详细失败时序见 [幂等性与热点 Key 设计](./hot-key-and-idempotency)。

**基于 Token 的防重复提交**

```
1. 客户端提交前先请求 /token 获取一次性令牌
2. 提交时携带令牌
3. 服务端原子消费令牌，再进入独立设计的业务处理协议
4. 令牌不存在 → 拒绝（重复请求）
```

一次性 token 只防重复使用，不解决业务失败后如何合法重试；先执行再删除还有并发窗口。对支付、下单，优先使用可持久查询和重放的幂等协议，不把一次性按钮令牌等同于业务幂等。

### 8. 身份、授权与数据范围

**OAuth2 负责授权委托，OIDC 增加身份层，JWT 只是令牌格式**。Access Token 可以不是 JWT，ID Token 的目标是客户端，不应随意拿它访问任意资源 API。JWT 校验至少涉及受信算法、签名/密钥、issuer、audience、有效期及业务约束，不能仅解析 payload 或只检查签名。

| 攻击/失败场景 | 服务端必须做的检查 |
|---------------|--------------------|
| 用户把 `/orders/123` 改成别人的订单号 | 查询与操作都按主体、租户和对象权限约束，不只验证“已登录” |
| 前端隐藏管理员字段，但请求手动加入 | 使用允许写入的 DTO/字段白名单，不能任意绑定角色、价格或 ownerId |
| token 被撤销但签名仍有效 | 明确短有效期、会话版本、拒绝列表或 introspection 的撤销延迟 |
| 密钥轮换时旧 token 暂时失效 | 使用受控 JWKS 缓存和轮换窗口；未知 kid 可受限刷新，不任意取外部 URL |
| Cookie 鉴权接口被跨站触发 | 按风险采用 SameSite、CSRF token、Origin 等；CORS 不是鉴权或 CSRF 的通用替代 |

公开客户端通常使用 Authorization Code + PKCE，并按协议校验 state；OIDC 还涉及 nonce 等绑定。PKCE 防授权码拦截，不提供“页面发生 XSS 后仍绝对安全”的保证。长期 token 不应出现在普通 URL、日志或错误响应中。

### 9. 幂等不等于防止并发覆盖

两位用户都读取版本 7，分别修改不同字段；即使各自 PUT 是幂等的，后一写仍可能覆盖前一写。可使用资源版本 ETag 和 `If-Match`：

```http
PATCH /products/123
If-Match: "version-7"
Content-Type: application/json

{"name":"new name"}
```

服务端用版本条件更新，当前版本不再是 7 则返回 `412 Precondition Failed`，客户端重新读取并合并；不能先 GET 判断版本后再无条件 UPDATE。Idempotency-Key 解决同一操作重复执行，If-Match 解决不同操作基于旧版本竞争，二者可以同时使用。

### 10. 游标分页与异步任务的契约

时间线可用稳定排序 `(created_at DESC, id DESC)` 和对应复合索引。下一页根据上页末尾的二元组查询，而不只传一个可能重复的时间戳：

```sql
SELECT id, created_at, title
FROM posts
WHERE tenant_id = :tenant_id
  AND (created_at < :cursor_time
       OR (created_at = :cursor_time AND id < :cursor_id))
ORDER BY created_at DESC, id DESC
LIMIT :page_size;
```

游标应绑定过滤条件、排序、版本和租户，并防篡改；Base64 编码不等于签名。页大小要有上限。游标提高遍历稳定性，但排序字段改变、删除和新插入仍会影响结果；需要固定快照时另行设计快照水位/导出任务，不能声称游标天然提供一致性快照。

长任务可返回 `202 Accepted` 和操作资源地址，暴露 `PENDING/RUNNING/SUCCEEDED/FAILED`、结果、错误和到期策略。只有已可靠受理才返回 202；取消请求是状态转移申请，不保证已提交外部副作用被撤销。GET 轮询与 Webhook 都要有退避和终态定义。

### 11. Webhook：签名之后还有什么？

发送方以稳定 eventId 至少一次投递，失败指数退避，达到期限进入可重放的失败记录。接收方限制 body 大小，按约定的原始字节验证签名、时间窗口和重放标识，再可靠写入 inbox 后确认接收；重复事件幂等处理。

签名密钥轮换需要过渡期，比较签名应使用标准库的安全比较能力；不要自己发明加密算法。合法签名不代表事件顺序正确，应校验对象版本/状态。回调目标还要考虑 SSRF、重定向、DNS 解析结果和网络出口限制，不能直接请求用户提供的任意内网地址。

**面试验收**：至少说明一次请求超时、一次重复事件、一次权限范围错误、一次旧版本客户端、一次分页期间的数据变化分别如何处理。用 [契约与集成测试](../engineering-practice/testing-and-delivery) 验证，而不是只展示正常的 200 响应。

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
> **JWT**：可以离线验证的令牌格式，仍需校验 issuer/audience/有效期与对象级权限；系统也可能为撤销保留状态。短有效期、会话版本或拒绝列表能提供不同的撤销时效，不是“用了 JWT 就完全无状态”。
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
