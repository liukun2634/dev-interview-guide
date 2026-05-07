---
title: Spring 核心
---

# Spring 核心

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Spring 最底层的容器与编程模型。IoC 容器管理对象的创建和依赖关系，AOP 实现横切关注点，Bean 生命周期决定对象从生到死的每个阶段。**理解这三者是掌握整个 Spring 生态的前提**——Spring MVC、Spring Boot、@Transactional 的原理全部建立在它们之上。
:::

---

## 整体架构

Spring 核心解决的根本问题是：**如何管理大量 Java 对象之间的依赖关系，并在不修改业务代码的情况下插入通用逻辑。**

```
┌─────────────────────────────────────────┐
│              应用代码                     │
│  @Service / @Controller / @Repository   │
├─────────────────────────────────────────┤
│          AOP 代理层                      │
│  @Transactional / @Cacheable / @Async   │
│  （JDK 动态代理 / CGLIB 子类代理）         │
├─────────────────────────────────────────┤
│        Bean 生命周期管理                  │
│  实例化 → 属性注入 → 初始化 → 使用 → 销毁  │
├─────────────────────────────────────────┤
│           IoC 容器                       │
│  BeanFactory / ApplicationContext       │
│  （管理所有 Bean 的创建、依赖、作用域）      │
└─────────────────────────────────────────┘
```

**从下往上理解**：
1. **IoC 容器**是地基——管理所有对象的创建和依赖
2. **Bean 生命周期**是容器管理对象的完整过程
3. **AOP 代理**是在容器创建 Bean 时插入的增强逻辑

## 三大支柱的关系

| 支柱 | 解决什么问题 | 核心机制 | 面试考查方式 |
|------|------------|---------|------------|
| IoC/DI | 对象之间硬编码依赖 → 难以测试和替换 | 容器创建对象并注入依赖 | "IoC 原理？循环依赖怎么解决？" |
| Bean 生命周期 | 对象从创建到销毁需要精细控制 | 8 个阶段 + 扩展点 | "Bean 生命周期？BeanPostProcessor？" |
| AOP | 日志/事务等横切逻辑散布在各处 | 动态代理（JDK / CGLIB） | "@Transactional 原理？AOP 失效？" |

**它们的连接点**：AOP 的实现依赖 Bean 生命周期中的 BeanPostProcessor 扩展点——Spring 在 Bean 初始化完成后，通过 BeanPostProcessor 判断是否需要创建代理对象。这就是为什么 @Transactional 等注解能"自动生效"的原因。

## 详细专题

| 专题 | 核心知识点 | 面试频率 | 详细页面 |
|------|-----------|---------|---------|
| IoC 与依赖注入 | 控制反转、三种注入方式、BeanFactory vs ApplicationContext、循环依赖三级缓存 | 🔥🔥🔥 | [IoC 与依赖注入](./ioc-di) |
| Bean 生命周期与作用域 | 8 阶段生命周期、singleton vs prototype、BeanPostProcessor 扩展机制 | 🔥🔥🔥 | [Bean 生命周期与作用域](./bean-lifecycle) |
| AOP 原理与实践 | 五种通知、JDK 代理 vs CGLIB、AOP 失效场景 | 🔥🔥🔥 | [AOP 原理与实践](./aop) |

## 学习建议

1. **先理解 IoC**——这是 Spring 的核心哲学，不理解 IoC 就无法理解 Spring 为什么存在
2. **再理解 Bean 生命周期**——这是 IoC 的实现细节，面试高频且是理解 AOP 的前置知识
3. **最后理解 AOP**——它依赖前两者，但应用最广泛（@Transactional、@Cacheable、@Async 都是 AOP）

**关键直觉**：Spring 中"自动生效"的注解（如 @Transactional），本质都是 AOP 代理。理解了这一点，就能回答所有"为什么 XX 注解失效了"的面试题。

## 面试常问 & 怎么答

### Q1: 什么是 IoC？

IoC（控制反转）是指对象的创建和依赖关系不再由对象自己控制，而是交给 Spring 容器管理。DI（依赖注入）是 IoC 的具体实现方式：容器在创建对象时自动注入它所依赖的其他对象。好处是解耦——对象不需要知道依赖从哪来，便于测试和替换。

### Q2: 什么是 AOP？

AOP（面向切面编程）是把多个类中重复出现的横切逻辑（如日志、事务、权限）抽取到切面中统一处理。Spring AOP 通过动态代理实现：在目标方法执行前后插入切面逻辑，而不修改原有代码。@Transactional 就是 AOP 最典型的应用。

### Q3: Spring Bean 的作用域有哪些？

最常用两种：singleton（默认，整个容器一个实例）和 prototype（每次获取创建新实例）。Web 环境下还有 request、session、application。singleton 的 Bean 注入 prototype 会有问题——prototype 不会每次都创建新实例，需要用 @Scope 的 proxyMode 或 ObjectProvider 解决。

### Q4: IoC、DI、AOP 三者的关系？

IoC 是思想（控制反转），DI 是 IoC 的实现方式（依赖注入），AOP 是建立在 IoC 容器之上的编程范式。IoC 容器管理 Bean 的创建和依赖，AOP 在 Bean 创建过程中通过 BeanPostProcessor 为需要增强的 Bean 创建代理。三者层层递进：IoC → DI → Bean 管理 → AOP 代理。

## 看到什么就先想到这类

- 出现依赖注入、@Autowired、@Component、Bean → IoC/DI
- 出现代理、切面、@Aspect、@Transactional 原理 → AOP
- 出现循环依赖、三级缓存 → IoC
- 出现 Bean 生命周期、BeanPostProcessor → Bean 生命周期
- 出现"注解失效"（@Transactional / @Async / @Cacheable） → AOP 代理问题
