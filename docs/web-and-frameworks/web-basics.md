---
title: Web 基础
---

# Web 基础

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--easy">⭐ 入门</span> <span class="dig-tag dig-tag--medium">🔥 中频</span>

::: tip 💡 核心要点
Servlet 是 Java Web 的基石，Spring MVC 本质上是对 Servlet 的封装。掌握 **Servlet 生命周期**、**Filter vs Interceptor**、**Cookie/Session/Token 选型** 是理解后面所有 Spring 框架的前提。2026 还要补 **BFF 架构** 和 **HTTP/3 + Servlet 6** 现状。
:::

---

## 概念

- Web 应用的请求处理依赖 Servlet 容器（如 Tomcat），容器负责管理 Servlet 的生命周期和请求分发。
- Filter 和 Listener 是 Servlet 规范提供的扩展机制，Spring Security 的过滤器链就建立在 Filter 之上。
- HTTP 是无状态协议，Cookie、Session、Token 是三种维持用户状态的方案。

## Servlet 生命周期

Servlet 容器（Tomcat）管理 Servlet 的完整生命周期：

| 阶段 | 方法 | 说明 |
|------|------|------|
| 加载与实例化 | 构造方法 | 容器启动或首次请求时创建 Servlet 实例（单例） |
| 初始化 | `init(ServletConfig)` | 只调用一次，读取配置、初始化资源 |
| 处理请求 | `service(request, response)` | 每次请求调用，根据 HTTP 方法分派到 doGet/doPost 等 |
| 销毁 | `destroy()` | 容器关闭时调用，释放资源 |

**关键点：** Servlet 是单例的，多个请求共享同一个实例，因此 Servlet 中不应有可变的实例变量（线程安全问题）。

## Servlet 容器工作原理

Tomcat 处理一个请求的流程：

1. 监听端口，接收 TCP 连接
2. 解析 HTTP 请求，创建 `HttpServletRequest` 和 `HttpServletResponse` 对象
3. 根据 URL 匹配对应的 Servlet（通过 web.xml 或注解 `@WebServlet`）
4. 调用 Filter 链（如果有）
5. 调用 Servlet 的 `service()` 方法
6. Servlet 写入响应内容
7. 容器将响应发送给客户端

## Filter 与 Listener

### Filter 链机制

Filter 在请求到达 Servlet 之前和响应返回客户端之前执行，形成链式调用：

```
客户端 → Filter1 → Filter2 → Filter3 → Servlet → Filter3 → Filter2 → Filter1 → 客户端
```

典型用途：编码设置、日志记录、权限校验、跨域处理。

### Filter vs Spring Interceptor

| 对比项 | Filter | Interceptor |
|--------|--------|-------------|
| 规范 | Servlet 规范 | Spring MVC 框架 |
| 作用范围 | 所有请求（包括静态资源） | 只作用于 DispatcherServlet 处理的请求 |
| 执行时机 | 在 Servlet 之前 | 在 Handler（Controller）前后 |
| 访问 Spring 容器 | 不能直接注入 Bean | 可以访问 Spring 容器 |
| 典型场景 | 编码、安全过滤 | 登录校验、日志、权限 |

### Listener

监听 Servlet 容器中的事件：

- `ServletContextListener`：应用启动和关闭时触发，常用于初始化全局资源
- `HttpSessionListener`：Session 创建和销毁时触发，可用于在线用户统计
- `ServletRequestListener`：请求创建和销毁时触发

## HTTP 请求响应要点

### 常用 HTTP 方法

| 方法 | 语义 | 幂等 | 安全 |
|------|------|------|------|
| GET | 获取资源 | 是 | 是 |
| POST | 创建资源 / 提交数据 | 否 | 否 |
| PUT | 全量替换 | 是 | 否 |
| DELETE | 删除资源 | 是 | 否 |

### 状态码分类

| 范围 | 含义 | 常见 |
|------|------|------|
| 1xx | 信息性 | 100 Continue |
| 2xx | 成功 | 200 OK、201 Created、204 No Content |
| 3xx | 重定向 | 301 永久、302 临时、304 未修改 |
| 4xx | 客户端错误 | 400 Bad Request、401 Unauthorized、403 Forbidden、404 Not Found |
| 5xx | 服务器错误 | 500 Internal Server Error、502 Bad Gateway、503 Service Unavailable |

### 常用 Header

| Header | 说明 |
|--------|------|
| Content-Type | 请求/响应体的 MIME 类型（application/json、text/html） |
| Authorization | 认证凭证（Bearer Token） |
| Cache-Control | 缓存策略 |
| Set-Cookie / Cookie | 服务端设置 / 客户端携带 Cookie |
| X-Forwarded-For | 经过代理时的真实客户端 IP |

## Cookie vs Session vs Token

| 对比项 | Cookie | Session | Token (JWT) |
|--------|--------|---------|-------------|
| 存储位置 | 客户端浏览器 | 服务端内存/Redis | 客户端（localStorage/Cookie） |
| 安全性 | 较低（可被篡改） | 较高（数据在服务端） | 中等（签名防篡改，但不加密） |
| 跨域 | 受同源策略限制 | 依赖 Cookie 传递 Session ID | 天然支持跨域（Header 携带） |
| 服务端压力 | 无 | 需存储所有用户状态 | 无（无状态） |
| 水平扩展 | 支持 | 需要共享 Session（Redis） | 天然支持（任何节点都能验证） |
| 主动失效 | 设置过期时间 | 服务端销毁 | 无法主动失效（需配合黑名单） |

**为什么现在更倾向 Token？**
- 前后端分离架构下，前端可能是 Web、App、小程序，Token 方案统一且不依赖 Cookie
- 微服务架构下，Session 共享复杂，Token 天然无状态，适合水平扩展
- 但 Token 也有缺点：无法主动撤销、payload 不宜存敏感数据、刷新机制需要额外设计

## BFF（Backend For Frontend）下的会话与认证

::: tip 💡 2026 新趋势
**JWT 不是万能解药**。2024-2026 大厂前端架构普遍走向 **BFF + HTTP-Only Cookie + Session ID**（如 Next.js + iron-session、SvelteKit、Nuxt），核心理由是：Token 放 localStorage **天然受 XSS 影响**，而 HTTP-Only Cookie 浏览器 JS 无法读取。
:::

| 方案 | 适用场景 | 安全弱点 |
|------|---------|---------|
| **JWT in localStorage** | 纯 SPA、移动 App、跨域 API | XSS 直接拖走 token；无法主动撤销 |
| **JWT in HTTP-Only Cookie** | SSR 站点、Same-Site | 需要防 CSRF；体积大占 Cookie 配额 |
| **Session ID + Redis（BFF 模式）** | Next.js / SvelteKit / Nuxt 全栈 | 需要 BFF 节点；同源部署最佳 |
| **OAuth2 PKCE + 后端 Cookie** | SPA + 第三方登录 | 实现复杂，但**官方推荐**（取代 Implicit Flow） |

**心智模型**：「**Token 适合 API**，**Cookie 适合页面**」——BFF 把 Token 留在服务端，对浏览器只下发 HTTP-Only Cookie，兼得安全性与水平扩展能力。详见 [Spring Security · OAuth2](./spring-security#oauth2-四种授权模式必背)。

## HTTP/3、Servlet 6 与现代 Web

::: warning ⚠️ 2026 必知
**Servlet API 6.0（Jakarta EE 10）已是 Spring Boot 3.x 默认**，JSP 已边缘化（新项目几乎不用）。Tomcat 10.1+ 实验性支持 HTTP/3 over QUIC（基于 Netty）；Spring WebFlux + Reactor Netty 是目前最容易跑通 HTTP/3 的栈。
:::

| 主题 | 现状（2026） | 面试要点 |
|------|------------|---------|
| **HTTP/2** | Tomcat 10+ 默认开启、所有主流浏览器原生支持 | 多路复用、Server Push 已废弃 |
| **HTTP/3 (QUIC)** | Tomcat 实验、Netty 稳定、CDN 全面支持 | UDP 基础、0-RTT、连接迁移 |
| **JSP / JSTL** | **新项目不再使用**；Thymeleaf / 前后端分离取代 | 面试只考"知道存在过即可" |
| **Servlet 6.0 异步** | `AsyncContext` 仍可用，但**虚拟线程**让其大幅简化 | Boot 3.2+ 一行 `spring.threads.virtual.enabled=true` |
| **WebSocket** | Jakarta WebSocket 2.1，Spring `@MessageMapping` + STOMP | 双向通信、心跳保活 |

## 为什么 Spring 要封装 Servlet

原生 Servlet 开发的痛点：

1. **模板代码多** — 每个 Servlet 都要继承 HttpServlet、重写 doGet/doPost
2. **参数解析繁琐** — 手动 `request.getParameter()`，类型转换、校验全靠自己
3. **缺少 IoC 支持** — 对象依赖关系手动管理，无法注入
4. **路由分散** — URL 映射在 web.xml 或注解中，缺乏统一管理
5. **异常处理困难** — 没有全局异常处理机制

Spring MVC 通过 DispatcherServlet 统一入口 + 注解驱动解决了这些问题。

## 面试常问 & 怎么答

### Q1: Servlet 的生命周期？

Servlet 是单例的，容器启动或首次请求时创建实例，调用 `init()` 初始化；每次请求调用 `service()` 方法（分派到 doGet/doPost）；容器关闭时调用 `destroy()` 销毁。因为是单例，要注意线程安全。

### Q2: Filter 和 Interceptor 的区别？

Filter 是 Servlet 规范的，作用于所有请求（包括静态资源），在 Servlet 之前执行；Interceptor 是 Spring MVC 的，只作用于 Controller 请求，可以访问 Spring 容器。执行顺序是 Filter → DispatcherServlet → Interceptor → Controller。

### Q3: Cookie、Session、Token 各自的优缺点？

Cookie 存客户端，容量小且受同源策略限制；Session 存服务端，安全但不利于水平扩展（需 Redis 共享）；Token（JWT）无状态，天然支持分布式和跨域，但无法主动撤销。现在前后端分离 + 微服务架构下更倾向 Token。

### Q4: 为什么现在更倾向用 JWT 而不是 Session？

两个原因：一是前后端分离后前端形态多样（Web、App、小程序），JWT 通过 Header 携带，不依赖 Cookie；二是微服务架构下 Session 共享需要额外基础设施（Redis），JWT 无状态，任何节点都能验证。

## 看到什么就先想到这类

- 出现 Servlet、Filter、Listener、web.xml。
- 出现 Cookie、Session、Token、JWT 的对比。
- 出现 HTTP 方法、状态码、Header 基础问题。
- 出现"Spring 为什么要封装 / Spring MVC 和 Servlet 的关系"。
