---
title: 网络安全
---

# 网络安全

## 概念

网络安全是面试高频话题，主要考查常见攻击方式及其防御。核心知识点：XSS、CSRF、中间人攻击、SQL 注入、TLS/SSL。

## XSS（跨站脚本攻击）

### 原理

攻击者向网页注入恶意脚本（JavaScript），当其他用户访问该页面时脚本执行，可以窃取 Cookie、劫持会话、篡改页面。

### 三种类型

| 类型 | 方式 | 存储位置 | 示例 |
|------|------|----------|------|
| 反射型 | URL 参数中注入脚本 | 不存储 | `search?q=<script>alert(1)</script>` |
| 存储型 | 提交恶意内容存入数据库 | 数据库 | 评论中嵌入 `<script>` |
| DOM 型 | 客户端 JS 直接操作 DOM | 不经过服务器 | `document.innerHTML = location.hash` |

**危害程度：** 存储型 > 反射型 > DOM 型

### 防御

| 方法 | 说明 |
|------|------|
| 输出编码 | 将 `<` `>` `"` `'` 转义为 HTML 实体 |
| CSP（Content Security Policy） | 限制页面可加载的脚本来源 |
| HttpOnly Cookie | Cookie 加 HttpOnly 标志，JS 无法读取 |
| 输入校验 | 服务端对用户输入做白名单过滤 |

```http
# CSP 示例
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com
```

## CSRF（跨站请求伪造）

### 原理

攻击者构造恶意请求，利用用户已登录的身份（Cookie 自动携带）执行未授权操作。

```
1. 用户登录 bank.com（浏览器存了 Cookie）
2. 用户访问恶意页面 evil.com
3. evil.com 构造请求：<img src="https://bank.com/transfer?to=attacker&amount=10000">
4. 浏览器自动携带 bank.com 的 Cookie → 转账成功！
```

### 防御

| 方法 | 说明 |
|------|------|
| CSRF Token | 表单中嵌入随机 Token，服务端验证 |
| SameSite Cookie | `Set-Cookie: SameSite=Strict` 阻止跨站携带 Cookie |
| Referer/Origin 检查 | 验证请求来源 |
| 双重 Cookie | Cookie + 请求参数中同时携带 Token |

**SameSite 属性：**
- `Strict`：完全禁止跨站携带 Cookie（最安全，但从外部链接进入也不携带）
- `Lax`：允许 GET 导航请求携带（默认值，兼顾安全和可用性）
- `None`：允许跨站携带（需配合 Secure，即 HTTPS）

### XSS vs CSRF

| 对比项 | XSS | CSRF |
|--------|-----|------|
| 攻击方式 | 注入脚本到目标网站 | 利用用户身份发送请求 |
| 信任对象 | 用户信任网站（网站被注入恶意代码） | 网站信任用户（用户的请求被伪造） |
| 需要 | 目标网站有注入漏洞 | 用户已登录目标网站 |
| 防御核心 | 输出编码 + CSP | CSRF Token + SameSite |

## SQL 注入

### 原理

攻击者通过输入恶意 SQL 片段，篡改查询逻辑：

```sql
-- 正常查询
SELECT * FROM users WHERE username = 'alice' AND password = '123456'

-- 注入攻击（密码输入: ' OR 1=1 --)
SELECT * FROM users WHERE username = 'alice' AND password = '' OR 1=1 --'
-- OR 1=1 永真，-- 注释掉后面的内容，绕过密码验证
```

### 防御

| 方法 | 说明 |
|------|------|
| 参数化查询 | ✅ 最有效。用 `?` 占位符，数据库区分代码和数据 |
| ORM 框架 | JPA/MyBatis 的 `#{}` 自动参数化 |
| 输入校验 | 对用户输入做白名单或格式校验 |
| 最小权限 | 数据库账号只给必要权限 |

```java
// ✅ 参数化查询（安全）
PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
stmt.setInt(1, userId);

// ❌ 字符串拼接（危险）
String sql = "SELECT * FROM users WHERE id = " + userId;
```

## 中间人攻击（MITM）

### 原理

攻击者在客户端和服务端之间拦截和篡改通信：

```
客户端 ←→ 攻击者 ←→ 服务端
```

攻击者可以窃听明文通信、篡改数据、伪造身份。

### 防御

| 方法 | 说明 |
|------|------|
| HTTPS | 加密传输，攻击者无法解密 |
| 证书验证 | 浏览器验证服务端证书，防止伪造 |
| HSTS | 强制 HTTPS，防止降级攻击 |
| 证书钉扎（Certificate Pinning） | APP 内置服务端证书指纹，防止 CA 被攻破 |

```http
# HSTS — 告诉浏览器未来只用 HTTPS 访问
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## CORS（跨域资源共享）

### 同源策略

浏览器安全策略：协议 + 域名 + 端口三者完全相同才是同源。不同源的请求默认被阻止。

```
https://example.com:443  vs  http://example.com:80    ← 不同源（协议不同）
https://example.com      vs  https://api.example.com   ← 不同源（域名不同）
https://example.com      vs  https://example.com:8080  ← 不同源（端口不同）
```

### CORS 机制

服务端通过响应头允许跨域：

```http
Access-Control-Allow-Origin: https://frontend.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### 简单请求 vs 预检请求

| 类型 | 条件 | 流程 |
|------|------|------|
| 简单请求 | GET/POST/HEAD + 常见 Header | 直接发送，浏览器检查响应头 |
| 预检请求 | PUT/DELETE 或自定义 Header | 先发 OPTIONS 预检 → 通过后发实际请求 |

```
预检流程：
客户端 → OPTIONS /api/users → 服务端返回允许的方法和头部
客户端 → PUT /api/users → 实际请求
```

## 面试常问 & 怎么答

### Q1: XSS 和 CSRF 的区别？

XSS 是向网站注入恶意脚本（用户信任网站），防御靠输出编码和 CSP；CSRF 是利用用户已登录的身份伪造请求（网站信任用户），防御靠 CSRF Token 和 SameSite Cookie。XSS 能偷 Cookie，CSRF 只能借用 Cookie。

### Q2: 如何防止 SQL 注入？

最有效的方法是参数化查询（PreparedStatement），让数据库区分代码和数据。ORM 框架的 #{} 也是参数化。永远不要用字符串拼接 SQL。

### Q3: HTTPS 如何防止中间人攻击？

HTTPS 通过 TLS 加密通信内容（攻击者无法解密），通过证书验证服务端身份（攻击者无法伪造）。配合 HSTS 防止降级到 HTTP。

### Q4: CORS 是什么？为什么需要？

CORS 是浏览器的跨域安全机制。同源策略禁止跨域请求，CORS 允许服务端声明哪些源可以访问。前后端分离（前端 3000 端口，后端 8080 端口）就是不同源，需要 CORS 配置。

### Q5: 什么是 HSTS？

HSTS（HTTP Strict Transport Security）告诉浏览器该网站只能通过 HTTPS 访问。即使用户输入 http:// 或被重定向到 HTTP，浏览器也会自动改为 HTTPS，防止 SSL 剥离攻击。

## 看到什么就先想到这类

- 出现 XSS、脚本注入、CSP。
- 出现 CSRF、跨站请求伪造、SameSite。
- 出现 SQL 注入、参数化查询。
- 出现中间人攻击、HSTS、证书钉扎。
- 出现跨域、CORS、同源策略、预检请求。
