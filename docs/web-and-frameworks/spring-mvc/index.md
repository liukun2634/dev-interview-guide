---
title: Spring MVC
---

# Spring MVC

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Spring MVC 是 Spring 对 Servlet 的封装，以 DispatcherServlet 为核心前端控制器，用注解驱动代替手写 Servlet。**理解一个请求从进入到返回的完整流程**是掌握 Spring MVC 的关键——面试几乎必问。
:::

---

## 整体架构

```
HTTP 请求
  ↓
Filter 链（Servlet 层：编码、CORS、安全）
  ↓
DispatcherServlet（前端控制器，Spring MVC 入口）
  ├── HandlerMapping（找到哪个 Controller 方法处理）
  ├── HandlerAdapter（适配不同类型的 Handler）
  ↓
Interceptor 链 preHandle（Spring MVC 层拦截）
  ↓
Controller 方法执行
  ├── 参数绑定（@RequestParam / @PathVariable / @RequestBody）
  ├── 数据校验（@Valid / @Validated）
  ↓
返回值处理
  ├── @ResponseBody → HttpMessageConverter → JSON
  ├── 返回视图名 → ViewResolver → 渲染 HTML
  ↓
Interceptor 链 postHandle / afterCompletion
  ↓
HTTP 响应
```

## 核心概念速查

| 概念 | 职责 | 面试要点 |
|------|------|---------|
| DispatcherServlet | 前端控制器，分发所有请求 | 请求处理流程的起点 |
| HandlerMapping | URL → Controller 方法的映射 | RequestMappingHandlerMapping |
| HandlerAdapter | 调用 Handler 的适配器 | 统一不同类型 Handler 的调用方式 |
| Interceptor | Handler 前后的拦截逻辑 | 与 Filter 的区别（Servlet 层 vs MVC 层） |
| HttpMessageConverter | 请求/响应体的序列化反序列化 | Jackson 处理 JSON |
| @ControllerAdvice | 全局异常/数据绑定处理 | @ExceptionHandler 集中处理异常 |

## Filter vs Interceptor 对比

这是面试高频对比题：

| 对比项 | Filter | Interceptor |
|--------|--------|-------------|
| 所属层 | Servlet 规范 | Spring MVC |
| 执行时机 | DispatcherServlet **之前** | DispatcherServlet **之后**、Controller **之前** |
| 能否访问 Spring 容器 | 不能（除非特殊处理） | 能（本身是 Spring Bean） |
| 能否获取 Handler 信息 | 不能 | 能（参数包含 HandlerMethod） |
| 典型用途 | 编码转换、CORS、安全过滤 | 权限校验、日志、登录检查 |

**执行顺序**：Filter → DispatcherServlet → Interceptor preHandle → Controller → Interceptor postHandle → Interceptor afterCompletion → Filter

## 虚拟线程下的 Spring MVC（Boot 3.2+ 必读）

::: warning ⚠️ 2026 高频追问
"Spring MVC 加了虚拟线程是不是就和 WebFlux 一样了？" —— **不一样**。MVC 仍是同步阻塞编程模型，虚拟线程只是把"每请求一线程"的代价**从 MB 级降到 KB 级**，让传统写法直接吃到高并发红利，但**编程模型完全不变**。
:::

| 主题 | 平台线程时代 | 虚拟线程时代 |
|------|------------|------------|
| 并发上限 | 几百到几千（线程栈 1MB） | 几十万（虚拟线程栈 KB 级） |
| `ThreadLocal` | 安全且高效 | **仍可用，但要警惕泄漏**（频繁创建销毁） |
| `SecurityContextHolder` | `ThreadLocal` 实现，正常 | 仍工作，但 `@Async` 跨线程需显式传 |
| `synchronized` | 普通锁 | **触发 Pinning**（JDK 24+ 已修复多数） |
| `RequestContextHolder` | `ThreadLocal` | 仍生效，单请求生命周期内安全 |
| 阻塞 IO（JDBC / HttpClient） | 占线程 | **释放载体线程**，吞吐量飞跃 |

**一行开启**：
```yaml
spring:
  threads:
    virtual:
      enabled: true   # Boot 3.2+，Tomcat / @Async / Scheduled 全部走虚拟线程
```

**心智模型**：「**JDK 21 + Boot 3.2 后，'Servlet 容器扛不住高并发'这个老论据已经站不住脚——WebFlux 的相对优势主要剩'流式数据' + '背压控制'**」。详见 [Spring WebFlux · 虚拟线程时代的选型](./webflux#虚拟线程时代-webflux-还有必要吗boot-32-必读)。

## HandlerExceptionResolver：异常处理责任链

`@ControllerAdvice` + `@ExceptionHandler` 背后是一条 **HandlerExceptionResolver 链**，按顺序匹配，匹配成功就停止：

```
异常抛出 → resolveException 责任链 ──┐
  ① ExceptionHandlerExceptionResolver  ← @ExceptionHandler（最常用）
  ② ResponseStatusExceptionResolver    ← @ResponseStatus（含 ResponseStatusException）
  ③ DefaultHandlerExceptionResolver    ← Spring 内置（如 HttpMessageNotReadable → 400）
  ④ 自定义 HandlerExceptionResolver
```

| Resolver | 触发 | 典型场景 |
|----------|------|---------|
| `ExceptionHandlerExceptionResolver` | `@ExceptionHandler` 方法匹配异常类型 | 业务异常 → 自定义 JSON 错误体 |
| `ResponseStatusExceptionResolver` | 异常类标了 `@ResponseStatus` 或抛 `ResponseStatusException` | 简单的"业务码 + HTTP 码"映射 |
| `DefaultHandlerExceptionResolver` | Spring 框架自身的 30+ 种异常 | `MethodArgumentNotValidException` → 400 |
| 自定义 | 实现 `HandlerExceptionResolver` + `@Order` | 接入告警、统一日志 |

**ProblemDetail（Spring 6 / Boot 3）**：官方推荐用 RFC 9457 标准错误响应：
```java
@ExceptionHandler(BusinessException.class)
ProblemDetail handle(BusinessException ex) {
    var pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
    pd.setProperty("errorCode", ex.getCode());
    pd.setProperty("traceId", MDC.get("traceId"));
    return pd;
}
```

## 详细专题

| 专题 | 核心知识点 | 面试频率 | 详细页面 |
|------|-----------|---------|---------|
| 请求处理流程 | DispatcherServlet 完整流程、拦截器链、参数绑定、@Valid 校验、全局异常处理 | 🔥🔥🔥 | [请求处理流程](./request-flow) |
| RESTful API | REST 六大原则、HTTP 方法语义、状态码规范、版本管理、认证方式 | 🔥🔥🔥 | [RESTful API](./restful-api) |
| Spring WebFlux | Mono/Flux、响应式编程、Event Loop、R2DBC、SSE/WebSocket、与 MVC 对比 | 🔥🔥 | [Spring WebFlux](./webflux) |

## 面试常问 & 怎么答

### Q1: Spring MVC 的请求处理流程？

请求进入 DispatcherServlet → HandlerMapping 找到对应的 Handler（Controller 方法）→ HandlerAdapter 执行 Handler → 返回 ModelAndView → ViewResolver 解析视图 → 渲染响应。前后端分离下不走 ViewResolver，直接通过 @ResponseBody 返回 JSON。

### Q2: 拦截器和 Filter 的区别？

Filter 是 Servlet 规范的，在 DispatcherServlet 之前执行，作用于所有请求；Interceptor 是 Spring MVC 的，在 Handler 前后执行，可以访问 Spring 容器。执行顺序：Filter → DispatcherServlet → Interceptor → Controller。

### Q3: @Controller 和 @RestController 的区别？

@RestController = @Controller + @ResponseBody。@Controller 的方法默认返回视图名称；@RestController 的方法直接返回数据（JSON），不走 ViewResolver。前后端分离项目统一用 @RestController。

### Q4: 参数校验怎么做？@Valid 和 @Validated 的区别？

使用 JSR-303 注解（@NotNull、@Size 等）标注字段，Controller 参数前加 @Valid 或 @Validated 触发校验。区别：@Valid 是 JSR 标准注解，支持嵌套校验；@Validated 是 Spring 扩展，支持分组校验（groups）。面试中答出"分组校验"这个区别就够了。

## 看到什么就先想到这类

- 出现 Controller、@RequestMapping、DispatcherServlet → 请求处理流程
- 出现拦截器、HandlerInterceptor → Filter vs Interceptor 对比
- 出现参数校验、@Valid、@Validated → 数据绑定与校验
- 出现全局异常处理、@ControllerAdvice → 异常处理机制
- 出现 RESTful、HTTP 方法、状态码 → REST 设计原则
