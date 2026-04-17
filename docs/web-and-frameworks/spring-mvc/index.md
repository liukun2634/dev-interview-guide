---
title: Spring MVC
---

# Spring MVC

Spring 的 Web 请求处理层，基于 Servlet 封装，以 DispatcherServlet 为核心入口。

## 概念

- Spring MVC 是 Spring 对 Servlet 的封装，用注解驱动代替手动编写 Servlet。
- 核心是 DispatcherServlet — 一个前端控制器，所有请求先经过它再分发到具体的 Controller。
- 拦截器（Interceptor）在 Handler 前后执行，与 Servlet Filter 是不同层次的机制。

## 怎么处理

1. 先理解一个 HTTP 请求从进入 DispatcherServlet 到返回响应的完整流程。
2. 再理解参数绑定和数据校验的机制。
3. 最后理解全局异常处理的实现。

## 典型知识点

| 专题 | 先看什么 |
|------|------|
| [请求处理流程](./request-flow) | DispatcherServlet 流程、拦截器、参数绑定、异常处理 |
| [RESTful API](./restful-api) | REST 设计原则、HTTP 方法语义、状态码 |

## 面试常问 & 怎么答

### Q1: Spring MVC 的请求处理流程？

请求进入 DispatcherServlet → HandlerMapping 找到对应的 Handler（Controller 方法）→ HandlerAdapter 执行 Handler → 返回 ModelAndView → ViewResolver 解析视图 → 渲染响应。前后端分离下不走 ViewResolver，直接通过 @ResponseBody 返回 JSON。

### Q2: 拦截器和 Filter 的区别？

Filter 是 Servlet 规范的，在 DispatcherServlet 之前执行，作用于所有请求；Interceptor 是 Spring MVC 的，在 Handler 前后执行，可以访问 Spring 容器。执行顺序：Filter → DispatcherServlet → Interceptor → Controller。

### Q3: @Controller 和 @RestController 的区别？

@RestController = @Controller + @ResponseBody。@Controller 的方法默认返回视图名称；@RestController 的方法直接返回数据（JSON），不走 ViewResolver。前后端分离项目统一用 @RestController。

## 看到什么就先想到这类

- 出现 Controller、@RequestMapping、DispatcherServlet。
- 出现拦截器、HandlerInterceptor。
- 出现参数校验、@Valid、@Validated。
- 出现全局异常处理、@ControllerAdvice。
