---
title: Spring Security
---

# Spring Security

Spring 的安全框架，核心是基于 Servlet Filter 的过滤器链。理解过滤器链架构是掌握 Spring Security 的关键。

## 概念

- Spring Security 本质是一组 Servlet Filter，在请求到达 Controller 之前完成认证和授权。
- 认证（Authentication）解决"你是谁"，授权（Authorization）解决"你能做什么"。
- Spring Boot 自动配置了 Spring Security 的默认行为 — 所有请求需要认证、提供表单登录和 HTTP Basic。

## 过滤器链架构

```
HTTP 请求 → DelegatingFilterProxy → FilterChainProxy → SecurityFilterChain → Controller
```

### 核心组件

| 组件 | 职责 |
|------|------|
| DelegatingFilterProxy | Servlet Filter，桥接到 Spring 管理的 FilterChainProxy |
| FilterChainProxy | 管理多个 SecurityFilterChain，根据 URL 匹配选择 |
| SecurityFilterChain | 一条过滤器链，包含多个安全相关的 Filter |

### 核心过滤器（按顺序）

| 过滤器 | 职责 |
|--------|------|
| SecurityContextPersistenceFilter | 从 Session 恢复 SecurityContext（登录状态） |
| UsernamePasswordAuthenticationFilter | 处理表单登录（/login POST） |
| BasicAuthenticationFilter | 处理 HTTP Basic 认证 |
| BearerTokenAuthenticationFilter | 处理 Bearer Token（JWT/OAuth2） |
| ExceptionTranslationFilter | 捕获认证/授权异常，返回 401/403 |
| AuthorizationFilter | 最终的授权检查（替代旧版 FilterSecurityInterceptor） |

## 认证流程

```
请求 → AuthenticationFilter → AuthenticationManager → AuthenticationProvider → UserDetailsService → 数据库
                                                                                    ↓
                                                                            UserDetails（用户信息）
                                                                                    ↓
                                                                            密码校验（PasswordEncoder）
                                                                                    ↓
                                                                            认证成功 → SecurityContext
```

### 核心接口

| 接口 | 职责 |
|------|------|
| AuthenticationManager | 认证入口，委托给 Provider |
| AuthenticationProvider | 执行具体的认证逻辑 |
| UserDetailsService | 加载用户信息（通常从数据库查询） |
| UserDetails | 用户信息的封装（用户名、密码、权限） |
| PasswordEncoder | 密码加密和校验（推荐 BCrypt） |

### 自定义认证

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired private UserRepository userRepo;
    
    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在"));
        
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())     // 数据库中存的是加密后的密码
                .roles(user.getRoles().toArray(new String[0]))
                .build();
    }
}
```

## JWT（JSON Web Token）认证实现思路

前后端分离项目不用 Session，用 JWT：

```
登录 → 验证用户名密码 → 生成 JWT → 返回给客户端
                                        ↓
后续请求 → Header: Authorization: Bearer <token>
                                        ↓
JwtAuthenticationFilter → 解析 Token → 验证签名和有效期 → 设置 SecurityContext
```

```java
// 自定义 JWT 过滤器
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                     HttpServletResponse response, 
                                     FilterChain chain) throws ServletException, IOException {
        String token = extractToken(request);  // 从 Header 取 Token
        
        if (token != null && jwtProvider.validateToken(token)) {
            String username = jwtProvider.getUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            // 设置认证信息到 SecurityContext
            var auth = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        
        chain.doFilter(request, response);  // 继续过滤器链
    }
    
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
```

## OAuth2（Open Authorization 2.0）登录简述

Spring Security OAuth2 Client 支持第三方登录（GitHub、Google 等）：

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          github:
            client-id: xxx
            client-secret: xxx
```

核心流程：用户点击"GitHub 登录" → 重定向到 GitHub 授权页 → 用户授权 → GitHub 回调携带 code → Spring Security 用 code 换取 access_token → 获取用户信息 → 创建本地认证。

## OAuth2 四种授权模式（必背）

**OAuth2 是 2025-2026 年面试中第三方登录、开放平台、统一鉴权场景的必问题**。能讲清楚四种 grant_type 的区别 + 谁用谁，立刻显出深度。

### 四种模式速查

| 模式 | grant_type | 适用 | 是否需要 client_secret | 是否需要用户参与 |
|------|-----------|------|---------------------|----------------|
| **授权码模式** | `authorization_code` | **Web 应用**（最安全、最常用）| ✅ | ✅ |
| **客户端凭证** | `client_credentials` | **服务端 → 服务端**（机器调机器，无用户）| ✅ | ❌ |
| **密码模式** | `password` | **可信第一方应用**（如官方 APP）| ✅ | ✅ |
| **隐式授权** | `implicit` | **纯前端 SPA**（已被 OAuth 2.1 弃用）| ❌ | ✅ |

### 授权码模式完整流程（最重要）

```
用户                浏览器              第三方应用（Client）         OAuth Server (如 GitHub)
                     ↓
                  点击"GitHub 登录"
                     ↓
   ←─────  302 重定向: GET /authorize?response_type=code&client_id=...&redirect_uri=...&scope=...
                     ↓
                                                                       用户登录 + 同意授权
                     ←──────────────  302 重定向到 redirect_uri?code=xxx
                                          ↓
                                    后端用 code 换 token:
                                    POST /token  body={code, client_id, client_secret, redirect_uri}
                                                                       ←── 验证 code + 颁发 token
                                          ↓
                                    返回 access_token + refresh_token
                                          ↓
                                    后端用 token 调 API: GET /api/user
                                                                       ←── 返回用户信息
                                          ↓
                                    本地创建 Session / 颁发自己的 JWT
```

::: tip 💡 为什么不直接给 token，要换两步？

> 1. **token 不能经过浏览器**（URL 历史、Referer 头会泄露）→ code 经浏览器，token 走后端 POST
> 2. **client_secret 保密**：服务端才有，浏览器不应触碰
> 3. **可撤销性**：code 一次性使用 + 短期失效（10 分钟）

:::

### PKCE：移动端 / SPA 的安全升级

**PKCE（Proof Key for Code Exchange）** 是 OAuth 2.1 强制要求的扩展，**专门替代危险的隐式授权**：

```
1. Client 生成随机 code_verifier (43-128 字符)
2. 计算 code_challenge = BASE64URL(SHA256(code_verifier))
3. 授权请求: /authorize?code_challenge=xxx&code_challenge_method=S256&...
4. 换 token 请求: /token?code=...&code_verifier=原始字符串
5. 服务端验证 SHA256(code_verifier) == code_challenge
```

**关键安全收益**：即使攻击者拦截到 code，**没有 code_verifier 也换不到 token**。

### 客户端凭证：服务端到服务端

```
后端服务 A 想调用后端服务 B 的 API（没有用户参与）

POST /token
  grant_type=client_credentials
  client_id=service-a
  client_secret=xxxx

→ 返回 access_token，A 用它调 B 的 API
```

适合**微服务间鉴权**、**OpenAPI 平台调用**。Spring Security 用 `ClientCredentialsOAuth2AuthorizedClientProvider`。

## JWT 顶门 5 大坑（必背）

JWT 是 2025-2026 年最容易被深挖的话题，**能讲出 5 大坑** 立刻区分初级和中级：

### 坑 1：算法混淆攻击（algorithm confusion）

```
攻击者把 JWT header 改为 {"alg": "none"}  → 服务端可能跳过验签
攻击者把 RS256 改为 HS256  → 用公钥当对称密钥伪造签名
```

**防御**：
- **强制指定 algorithm 白名单**（如 `setAllowedAlgorithms("RS256")`）
- 永远拒绝 `alg: none`

### 坑 2：JWT 不能主动撤销

> JWT 是**无状态自包含的**——签发后服务端无法让它在过期前失效。这与 Session 的"服务端删除即失效"形成鲜明对比。

**生产解决方案**：

| 方案 | 原理 | 代价 |
|------|------|------|
| **短期 token + Refresh Token** | access_token 15 分钟过期，refresh_token 7 天 | 增加一次刷新调用 |
| **黑名单（Redis）** | 登出/重置密码时把 jti 写入 Redis，验签后查 | 失去无状态优势 |
| **版本号** | User 表存 jwt_version，token 中带 version，不匹配则拒绝 | 改密码后所有 token 失效 |

::: warning ⚠️ 永远不要让 JWT 过期时间 > 1 小时

> 长 JWT + 无法撤销 = 灾难。**最佳实践：access_token 15 分钟 + refresh_token 滚动续期**。

:::

### 坑 3：敏感信息泄露

JWT payload 是 **Base64 编码（不是加密）** —— 任何人都能解码看到。

```
错误: JWT payload = {"userId": 123, "password": "xxx", "ssn": "..."}
            ↓ 任何拿到 token 的人都能解码看到
正确: payload 只放 userId、roles 这类可公开标识符
```

### 坑 4：客户端存储位置

| 存储位置 | 安全性 | XSS 风险 | CSRF 风险 |
|---------|-------|---------|----------|
| **localStorage** | 低 | **JS 可读 → 易被 XSS 偷** | 无 |
| **HttpOnly Cookie** | 高 | JS 读不到 | 有 → 配 SameSite |
| **内存（Vuex/Redux）** | 中 | 关闭页面就丢 | 无 |

**推荐**：access_token 内存 + refresh_token HttpOnly Secure SameSite=Strict Cookie。

### 坑 5：refresh token 自身的安全

```
refresh_token 一旦泄露 = 7 天的 access_token 工厂
```

**防护**：
- **Refresh Token Rotation**：每次刷新都换新 refresh_token，旧的失效
- **检测重放**：旧 refresh_token 再被使用 = token 被盗 → 全部撤销
- **绑定客户端指纹**（IP / User-Agent）

## 授权模型

### URL 级别授权

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()       // 公开接口
                .requestMatchers("/api/admin/**").hasRole("ADMIN")   // 需要 ADMIN 角色
                .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated()                         // 其余需要认证
            )
            .csrf(csrf -> csrf.disable())           // 前后端分离通常禁用 CSRF
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))  // 无状态（JWT）
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

### 方法级别授权

```java
@EnableMethodSecurity   // 开启方法级安全
@Configuration
public class SecurityConfig { }

@Service
public class UserService {
    
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long id) { ... }
    
    @PreAuthorize("#userId == authentication.principal.id")
    public UserDTO getUser(Long userId) { ... }  // 只能查自己
    
    @PreAuthorize("hasAuthority('user:write')")
    public void updateUser(UserDTO dto) { ... }  // 需要特定权限
}
```

### RBAC 模型

```
用户 → 角色 → 权限
User → ADMIN → user:read, user:write, user:delete
User → USER  → user:read
```

Spring Security 中：
- `hasRole("ADMIN")` 检查角色（自动加 ROLE_ 前缀）
- `hasAuthority("user:write")` 检查具体权限

## CORS 与 CSRF

### CORS（跨域资源共享）

前后端分离下前端和后端通常不同域，需要配置 CORS：

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:3000"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

### CSRF（跨站请求伪造）

- **传统应用（Session + Cookie）：** 必须开启 CSRF 防护，Spring Security 默认开启
- **前后端分离（JWT）：** 通常禁用 — JWT 通过 Header 携带，不受 CSRF 攻击影响

```java
http.csrf(csrf -> csrf.disable());  // JWT 方案下禁用
```

## 面试常问 & 怎么答

### Q1: Spring Security 的过滤器链执行流程？

请求经过 DelegatingFilterProxy 进入 FilterChainProxy，按顺序执行 SecurityFilterChain 中的 Filter：先恢复 SecurityContext（登录状态），然后各认证 Filter（表单/JWT/Basic）尝试认证，ExceptionTranslationFilter 捕获异常，最后 AuthorizationFilter 做授权检查。认证成功的信息存在 SecurityContext 中。

### Q2: 认证和授权的区别？

认证是验证"你是谁"（用户名密码、JWT、OAuth2），结果是确认身份；授权是验证"你能做什么"（角色、权限检查），结果是允许或拒绝操作。401 是认证失败，403 是授权失败。

### Q3: JWT 和 Session 的优缺点？

Session：服务端存储，安全（可主动失效），但不利于水平扩展（需 Redis 共享）。JWT：客户端存储，无状态天然支持分布式，但无法主动撤销（需配合黑名单），payload 不宜存敏感数据。前后端分离 + 微服务架构更适合 JWT。

### Q4: 如何实现 RBAC？

用户关联角色，角色关联权限。Spring Security 中用 hasRole() 检查角色，hasAuthority() 检查具体权限。URL 级别用 requestMatchers 配置，方法级别用 @PreAuthorize 注解。

## 看到什么就先想到这类

- 出现认证、授权、登录、权限。
- 出现 JWT、Token、OAuth2。
- 出现 SecurityFilterChain、过滤器链。
- 出现 RBAC、角色、@PreAuthorize。
- 出现 CORS、CSRF、跨域。
