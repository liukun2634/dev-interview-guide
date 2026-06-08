---
title: 请求处理流程
---

# 请求处理流程

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
Spring MVC 一个请求的**完整 8 步流程**：DispatcherServlet → HandlerMapping → HandlerAdapter → Interceptor → Controller → 返回值处理 → ViewResolver → 渲染。面试核心：**HandlerMapping vs HandlerAdapter 各自职责**、**@Valid vs @Validated 分组校验**、**自定义 ArgumentResolver 实现透明参数注入**。
:::

---

## DispatcherServlet 完整流程

一个 HTTP 请求在 Spring MVC 中的处理流程：

```
客户端 → Filter 链 → DispatcherServlet → HandlerMapping → HandlerAdapter → Controller → ViewResolver → 响应
```

### 详细步骤

1. **接收请求** — 所有请求先经过 Servlet Filter 链，然后到达 DispatcherServlet
2. **查找 Handler** — DispatcherServlet 调用 `HandlerMapping` 根据 URL 找到对应的 Handler（Controller 方法）和拦截器链
3. **执行拦截器前置** — 按顺序执行所有 `HandlerInterceptor#preHandle()`，任何一个返回 false 则中断
4. **执行 Handler** — `HandlerAdapter` 负责调用 Controller 方法（处理参数绑定、类型转换等）
5. **执行拦截器后置** — 倒序执行 `HandlerInterceptor#postHandle()`
6. **处理返回值** — 如果是 @ResponseBody，通过 `HttpMessageConverter` 转为 JSON；否则通过 `ViewResolver` 解析视图
7. **执行拦截器完成** — 倒序执行 `HandlerInterceptor#afterCompletion()`（无论是否异常都会执行）
8. **返回响应** — 将结果写入 HttpServletResponse

### HandlerMapping 的匹配规则

- `RequestMappingHandlerMapping`：处理 @RequestMapping 注解的 Controller（最常用）
- 匹配优先级：精确路径 > 路径变量 > 通配符

### HandlerAdapter 的作用

适配不同类型的 Handler：

- `RequestMappingHandlerAdapter`：处理 @RequestMapping 方法（参数解析、返回值处理）
- 负责调用 `HandlerMethodArgumentResolver` 解析参数（@RequestParam、@PathVariable、@RequestBody 等）
- 负责调用 `HandlerMethodReturnValueHandler` 处理返回值

## 拦截器链

```java
@Component
public class AuthInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                             HttpServletResponse response, Object handler) {
        // Controller 执行前 — 登录校验、权限检查
        // 返回 false 中断请求
        String token = request.getHeader("Authorization");
        if (token == null) {
            response.setStatus(401);
            return false;
        }
        return true;
    }
    
    @Override
    public void postHandle(HttpServletRequest request, 
                           HttpServletResponse response, Object handler,
                           ModelAndView modelAndView) {
        // Controller 执行后、视图渲染前
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, 
                                HttpServletResponse response, Object handler,
                                Exception ex) {
        // 请求完成后（无论是否异常）— 资源清理
    }
}
```

**多个拦截器的执行顺序：**

```
preHandle1 → preHandle2 → Controller → postHandle2 → postHandle1 → afterCompletion2 → afterCompletion1
```

前置正序执行，后置和完成倒序执行（类似栈）。

## 参数绑定

| 注解 | 来源 | 示例 |
|------|------|------|
| @RequestParam | 查询参数 / 表单 | `?name=alice` → `@RequestParam String name` |
| @PathVariable | URL 路径变量 | `/users/{id}` → `@PathVariable Long id` |
| @RequestBody | 请求体（JSON） | `@RequestBody UserDTO user` |
| @RequestHeader | 请求头 | `@RequestHeader("Authorization") String token` |
| @CookieValue | Cookie | `@CookieValue("sessionId") String sid` |
| @ModelAttribute | 表单 / 查询参数绑定到对象 | `@ModelAttribute UserForm form` |

**@RequestParam vs @PathVariable：**
- `/users?id=1` → `@RequestParam` — 用于可选的过滤条件
- `/users/1` → `@PathVariable` — 用于定位具体资源

## 数据校验

### @Valid vs @Validated

| 对比项 | @Valid | @Validated |
|--------|--------|------------|
| 来源 | Jakarta Bean Validation | Spring 扩展 |
| 分组校验 | ❌ 不支持 | ✅ 支持 |
| 嵌套校验 | ✅ 支持 | ❌ 需配合 @Valid |
| 使用位置 | 参数、字段 | 参数、类 |

```java
// DTO 定义校验规则
public class CreateUserRequest {
    @NotBlank(message = "用户名不能为空")
    private String username;
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Min(value = 0, message = "年龄不能为负")
    private Integer age;
}

// Controller 中使用
@PostMapping("/users")
public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
    // 校验不通过会抛出 MethodArgumentNotValidException
    return ResponseEntity.ok(userService.create(request));
}
```

### 分组校验

```java
public class UserDTO {
    public interface Create {}
    public interface Update {}
    
    @Null(groups = Create.class)
    @NotNull(groups = Update.class)
    private Long id;
    
    @NotBlank(groups = {Create.class, Update.class})
    private String username;
}

@PostMapping("/users")
public void create(@Validated(UserDTO.Create.class) @RequestBody UserDTO dto) {}

@PutMapping("/users/{id}")
public void update(@Validated(UserDTO.Update.class) @RequestBody UserDTO dto) {}
```

## 全局异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // 参数校验失败
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        List<String> errors = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .toList();
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("VALIDATION_ERROR", errors));
    }
    
    // 业务异常
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException e) {
        return ResponseEntity.status(e.getStatus())
                .body(new ErrorResponse(e.getCode(), e.getMessage()));
    }
    
    // 兜底异常
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAll(Exception e) {
        return ResponseEntity.internalServerError()
                .body(new ErrorResponse("INTERNAL_ERROR", "服务器内部错误"));
    }
}
```

**@ControllerAdvice vs @RestControllerAdvice：** 后者 = @ControllerAdvice + @ResponseBody，返回 JSON 而非视图。

## 面试常问 & 怎么答

### Q1: DispatcherServlet 的工作流程？

请求到达 DispatcherServlet → HandlerMapping 根据 URL 找到 Controller 方法和拦截器链 → 执行拦截器 preHandle → HandlerAdapter 调用 Controller（处理参数绑定）→ 执行拦截器 postHandle → 处理返回值（@ResponseBody 走 HttpMessageConverter 转 JSON，否则走 ViewResolver）→ 执行拦截器 afterCompletion → 返回响应。

### Q2: @Valid 和 @Validated 的区别？

@Valid 是 Jakarta 标准注解，支持嵌套校验；@Validated 是 Spring 扩展，支持分组校验。嵌套对象用 @Valid，需要按场景（创建/更新）用不同规则时用 @Validated 分组。

### Q3: 如何实现全局异常处理？

用 @RestControllerAdvice + @ExceptionHandler。按异常类型定义不同的处理方法：校验异常返回 400、业务异常返回对应状态码、兜底 Exception 返回 500。统一返回格式（ErrorResponse），前端根据 code 做处理。

## 看到什么就先想到这类

- 出现 DispatcherServlet、HandlerMapping、HandlerAdapter。
- 出现 @RequestMapping、@GetMapping、@PostMapping。
- 出现拦截器 preHandle/postHandle/afterCompletion。
- 出现 @Valid、@Validated、校验注解。
- 出现 @ControllerAdvice、@ExceptionHandler。
