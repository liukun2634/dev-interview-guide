---
title: AOP 原理与实践
---

# AOP 原理与实践

## 核心概念

AOP（Aspect-Oriented Programming，面向切面编程）把散布在多个类中的横切逻辑（日志、事务、权限）抽取到一个地方统一处理。

| 概念 | 说明 | 类比 |
|------|------|------|
| 切面（Aspect） | 横切关注点的模块化 | 一个处理日志的类 |
| 连接点（JoinPoint） | 程序执行中可以插入切面的点 | 每一个方法的执行 |
| 切入点（Pointcut） | 匹配连接点的表达式 | "所有 Service 层的方法" |
| 通知（Advice） | 在连接点执行的动作 | 方法执行前打印日志 |
| 织入（Weaving） | 把切面应用到目标对象的过程 | Spring 在运行时通过代理织入 |

## 五种通知类型

| 类型 | 注解 | 执行时机 |
|------|------|----------|
| 前置通知 | @Before | 目标方法执行前 |
| 后置通知 | @After | 目标方法执行后（无论是否异常） |
| 返回通知 | @AfterReturning | 目标方法正常返回后 |
| 异常通知 | @AfterThrowing | 目标方法抛出异常后 |
| 环绕通知 | @Around | 包裹目标方法，可控制是否执行 |

```java
@Aspect
@Component
public class LogAspect {

    // 切入点：所有 service 包下的 public 方法
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}

    @Before("serviceLayer()")
    public void logBefore(JoinPoint jp) {
        System.out.println("调用: " + jp.getSignature().getName());
    }

    @Around("serviceLayer()")
    public Object logAround(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = pjp.proceed(); // 执行目标方法
        long cost = System.currentTimeMillis() - start;
        System.out.println(pjp.getSignature().getName() + " 耗时: " + cost + "ms");
        return result;
    }
}
```

**多个切面的执行顺序：** 用 `@Order(n)` 控制，值越小优先级越高。

## 代理机制

Spring AOP 通过动态代理实现，不修改目标类的源代码：

| 对比项 | JDK 动态代理 | CGLIB 代理 |
|--------|-------------|------------|
| 代理目标 | 接口 | 类 |
| 实现方式 | 实现目标接口 | 生成目标类的子类 |
| 限制 | 目标必须有接口 | 目标类和方法不能是 final |
| 性能 | 调用通过反射，较慢 | 调用通过字节码，较快 |
| Spring Boot 默认 | ❌ | ✅（spring.aop.proxy-target-class=true） |

**Spring Boot 默认用 CGLIB**，即使目标类实现了接口也用 CGLIB 代理。原因是 CGLIB 统一代理方式，避免了 JDK 代理下注入时必须用接口类型的问题。

## AOP 的典型应用

| 场景 | 实现 |
|------|------|
| 事务管理 | @Transactional — 最经典的 AOP 应用 |
| 日志记录 | 自定义 @Around 记录方法入参、出参、耗时 |
| 权限校验 | @PreAuthorize（Spring Security 基于 AOP） |
| 缓存 | @Cacheable（Spring Cache 基于 AOP） |
| 重试 | @Retryable（Spring Retry 基于 AOP） |

## AOP 失效场景

这是高频面试题 — 以下情况 AOP 不会生效：

### 1. 自调用（同类方法调用）

```java
@Service
public class OrderService {
    public void createOrder() {
        this.validate(); // ❌ this 是原始对象，不是代理对象，AOP 不生效
    }
    
    @Transactional
    public void validate() { ... }
}
```

**原因：** `this.validate()` 直接调用的是原始对象的方法，没有经过代理。

**解决方式：**
- 将方法拆到另一个 Bean 中
- 注入自身代理：`@Autowired private OrderService self;` 然后 `self.validate()`
- 使用 `AopContext.currentProxy()`（需开启 `exposeProxy`）

### 2. 方法不是 public

Spring AOP 默认只拦截 public 方法。protected、private、default 方法上的 @Transactional 等注解不会生效。

### 3. final 类或 final 方法

CGLIB 通过继承实现代理，final 类无法被继承，final 方法无法被重写，因此 AOP 不生效。

### 4. 非 Spring 管理的对象

直接 `new MyService()` 创建的对象不受 Spring 管理，AOP 不会生效。必须由 Spring 容器创建的 Bean 才有代理。

### 5. 内部类

内部类通常不由 Spring 直接管理，AOP 不会生效。

## 面试常问 & 怎么答

### Q1: JDK 动态代理和 CGLIB 的区别？

JDK 代理基于接口（实现接口的代理类），CGLIB 基于继承（生成目标类的子类）。JDK 代理要求目标有接口，CGLIB 要求目标类不能是 final。Spring Boot 默认用 CGLIB，统一代理方式，避免必须用接口类型注入的问题。

### Q2: AOP 在什么场景下会失效？

五种情况：自调用（this 调用不经过代理）、方法不是 public、类或方法是 final（CGLIB 无法继承）、对象不是 Spring 管理的（手动 new）、内部类。最常考的是自调用 — @Transactional 标在同类的方法上，通过 this 调用时事务不会生效。

### Q3: @Transactional 为什么会失效？

@Transactional 是基于 AOP 实现的，所以 AOP 失效的场景它都会失效。最典型的是自调用：在同一个类中用 this 调用 @Transactional 方法，因为没经过代理所以事务不生效。另外，默认只回滚 RuntimeException 和 Error，checked exception 不回滚（除非指定 rollbackFor）。

## 看到什么就先想到这类

- 出现 @Aspect、@Pointcut、@Around、@Before。
- 出现 JDK 动态代理、CGLIB。
- 出现 @Transactional 失效、AOP 失效。
- 出现"为什么自调用不生效"。
