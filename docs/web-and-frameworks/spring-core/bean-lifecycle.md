---
title: Bean 生命周期与作用域
---

# Bean 生命周期与作用域

## Bean 完整生命周期

一个 Spring Bean 从创建到销毁经历以下阶段：

### 1. 实例化（Instantiation）

容器通过构造器或工厂方法创建 Bean 的原始对象（此时属性还未填充）。

### 2. 属性填充（Population）

注入依赖（@Autowired、@Value 等），这一步会触发其他 Bean 的创建。

### 3. Aware 接口回调

如果 Bean 实现了 Aware 接口，容器会注入对应的基础设施对象：

| 接口 | 注入内容 |
|------|----------|
| BeanNameAware | Bean 自己的名称 |
| BeanFactoryAware | BeanFactory 引用 |
| ApplicationContextAware | ApplicationContext 引用 |

一般不推荐用 Aware 接口（耦合 Spring API），优先用构造器注入。

### 4. 初始化前（BeanPostProcessor#postProcessBeforeInitialization）

所有 `BeanPostProcessor` 的前置处理。`@PostConstruct` 就是在这一步被 `CommonAnnotationBeanPostProcessor` 执行的。

### 5. 初始化

按以下顺序执行：

1. `@PostConstruct` 标注的方法
2. `InitializingBean#afterPropertiesSet()`
3. `init-method`（XML 或 `@Bean(initMethod = "...")` 指定）

### 6. 初始化后（BeanPostProcessor#postProcessAfterInitialization）

所有 `BeanPostProcessor` 的后置处理。**AOP 代理就是在这一步创建的** — `AbstractAutoProxyCreator` 在此检查是否需要创建代理。

### 7. 使用

Bean 可以正常使用了。

### 8. 销毁

容器关闭时，按以下顺序执行销毁回调：

1. `@PreDestroy` 标注的方法
2. `DisposableBean#destroy()`
3. `destroy-method`（XML 或 `@Bean(destroyMethod = "...")` 指定）

**注意：** prototype 作用域的 Bean 不会执行销毁回调 — 容器创建后就不再管理。

### 生命周期速记

```
实例化 → 属性填充 → Aware 回调 → BeanPostProcessor 前置 → 初始化（@PostConstruct → InitializingBean → init-method） → BeanPostProcessor 后置（AOP 代理） → 使用 → 销毁（@PreDestroy → DisposableBean → destroy-method）
```

## Bean 作用域

| 作用域 | 说明 | 生命周期 |
|--------|------|----------|
| singleton（默认） | 整个容器只有一个实例 | 随容器启动创建，随容器关闭销毁 |
| prototype | 每次 getBean 创建新实例 | 容器只负责创建，不管理后续生命周期 |
| request | 每个 HTTP 请求一个实例 | Web 环境 |
| session | 每个 HTTP Session 一个实例 | Web 环境 |
| application | 每个 ServletContext 一个实例 | Web 环境 |

### singleton vs prototype 关键区别

| 对比项 | singleton | prototype |
|--------|-----------|-----------|
| 实例数 | 容器中唯一 | 每次请求新建 |
| 线程安全 | 需注意（共享状态） | 天然安全（每次新建） |
| 销毁回调 | 容器关闭时执行 | ❌ 不执行 |
| 性能 | 好（复用） | 差（频繁创建） |

### singleton 注入 prototype 的坑

```java
@Component
public class SingletonBean {
    @Autowired
    private PrototypeBean proto; // ❌ 只注入一次！后续一直是同一个实例
}
```

**解决方式：**

```java
// 方式 1：ObjectProvider（推荐）
@Component
public class SingletonBean {
    private final ObjectProvider<PrototypeBean> protoProvider;
    
    public void doSomething() {
        PrototypeBean proto = protoProvider.getObject(); // 每次都是新实例
    }
}

// 方式 2：@Scope 代理
@Component
@Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class PrototypeBean { }
```

## BeanPostProcessor

`BeanPostProcessor` 是 Spring 最重要的扩展点之一，可以在 Bean 初始化前后做自定义处理。

**典型实现：**

| 实现类 | 作用 |
|--------|------|
| `CommonAnnotationBeanPostProcessor` | 处理 @PostConstruct、@PreDestroy |
| `AutowiredAnnotationBeanPostProcessor` | 处理 @Autowired、@Value |
| `AbstractAutoProxyCreator` | 创建 AOP 代理 |

**自定义 BeanPostProcessor 示例：**

```java
@Component
public class LoggingBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean instanceof MyService) {
            System.out.println("MyService initialized: " + beanName);
        }
        return bean; // 必须返回 bean（可以返回代理）
    }
}
```

## 完整生命周期 13 步（超详细版本）

**Spring 高级面试经常要求**：能列出 Bean 创建的 **每一步**（不只是 6 步合并版）。这是中高级 Java 面试**Top 1 追问**。

```
1. 实例化前 (InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation)
   ↓ 返回非 null 则直接用该对象（AOP 代理 short-circuit）
2. 实例化 (Constructor / FactoryMethod 创建对象)
3. 实例化后 (InstantiationAwareBeanPostProcessor#postProcessAfterInstantiation)
4. 属性填充 (populateBean: @Autowired/@Value 在此注入)
5. Aware 接口回调
   ├─ BeanNameAware#setBeanName
   ├─ BeanFactoryAware#setBeanFactory
   └─ ApplicationContextAware#setApplicationContext
6. BeanPostProcessor#postProcessBeforeInitialization (前置处理)
   └─ @PostConstruct 在此执行 (CommonAnnotationBeanPostProcessor)
7. InitializingBean#afterPropertiesSet
8. 自定义 init-method (XML <bean init-method=""/> 或 @Bean(initMethod=""))
9. BeanPostProcessor#postProcessAfterInitialization (后置处理)
   └─ AOP 代理在此创建 (AbstractAutoProxyCreator)
   └─ ★ 返回的对象是真正放入容器的对象（可能是代理）
   ────────────────────
10. 使用阶段 (业务调用)
   ↓ 容器销毁时
11. @PreDestroy (DestructionAwareBeanPostProcessor)
12. DisposableBean#destroy
13. 自定义 destroy-method
```

### 关键时机问答

::: tip 💡 经典 5 连问

**Q1: 循环依赖在哪一步解决的？**
> 第 4 步"属性填充"——发现依赖 B 时，把当前 A 的 ObjectFactory（**早期引用**）放入三级缓存，B 拿到 A 早期引用完成自己的创建，A 再继续注入。

**Q2: AOP 代理在哪一步创建？**
> 第 9 步"BeanPostProcessor 后置处理"——`AbstractAutoProxyCreator` 检查 Bean 是否匹配 Advisor，匹配则用 JDK 或 CGLIB 包装成代理对象。

**Q3: @PostConstruct 在 InitializingBean 之前？**
> **是**。`CommonAnnotationBeanPostProcessor` 的前置处理（第 6 步）就执行 @PostConstruct；`afterPropertiesSet` 在第 7 步。

**Q4: @Autowired 在哪一步注入？**
> 第 4 步"属性填充" —— `AutowiredAnnotationBeanPostProcessor` 在 `populateBean()` 中扫描所有 @Autowired 注解并注入。

**Q5: 三级缓存和 AOP 怎么协调？**
> A 依赖 B，B 依赖 A，且 A 需要 AOP：
> ① A 实例化后放入**三级缓存**（ObjectFactory）；
> ② B 注入 A 时，三级缓存的 ObjectFactory 调用 `getEarlyBeanReference()` → **提前创建 AOP 代理**；
> ③ 这就是为什么三级而不是二级——延迟代理创建避免不必要的开销。

:::

## AOP 织入时机：编译期 vs 类加载期 vs 运行期

**Spring AOP 用运行期动态代理，AspectJ 可用编译期/类加载期织入**——能讲清三者差异立刻显出深度。

| 织入时机 | 实现 | 时机 | 性能 | 灵活性 |
|---------|------|------|------|-------|
| **编译期织入**（AspectJ ajc）| 源码编译时改 .class | 编译 | **最好**（无运行时代理）| 改源码后必须重编 |
| **类加载期织入**（AspectJ LTW）| ClassFileTransformer 改字节码 | JVM 类加载 | 中 | 需配 javaagent |
| **运行期代理**（Spring AOP）| JDK/CGLIB 动态生成代理 | 容器启动 | **较低**（每次调用走 invoke 方法）| 灵活，可配置 |

### Spring AOP 局限性（必背）

::: warning ⚠️ Spring AOP 的"自调用失效"根因

> Spring AOP 是**运行期代理** → 走代理对象才生效。**同类内部 `this.xxx()` 不走代理** → AOP 失效。
>
> AspectJ 编译期织入直接改字节码 → 任何调用都生效 → **彻底解决自调用问题**。但 Spring 默认用运行期代理（开箱即用、配置灵活），所以这个坑成了面试常考。
>
> **解决**详见 [AOP 失效场景](./aop#aop-失效场景)。

:::

### Spring AOP vs AspectJ 选型

| 场景 | 推荐 |
|------|------|
| **普通业务 + 注解切面** | **Spring AOP**（够用、零配置）|
| **需要切 private/final/构造方法** | **AspectJ** |
| **极致性能（高频调用切面）** | **AspectJ 编译期** |
| **历史 jar 注入 / agent 监控** | **AspectJ LTW** |

## 面试常问 & 怎么答

### Q1: Bean 生命周期的完整流程？

实例化 → 属性填充 → Aware 回调 → BeanPostProcessor 前置处理（@PostConstruct 在此执行）→ InitializingBean → init-method → BeanPostProcessor 后置处理（AOP 代理在此创建）→ 使用 → @PreDestroy → DisposableBean → destroy-method。

### Q2: singleton 和 prototype 的区别？

singleton 整个容器只有一个实例，随容器创建和销毁；prototype 每次获取都创建新实例，但容器不管理销毁。singleton 中注入 prototype 要注意 — 只会注入一次，需要用 ObjectProvider 或 @Scope 代理来解决。

### Q3: BeanPostProcessor 的作用？

BeanPostProcessor 是 Bean 初始化前后的扩展点。@Autowired 注入、@PostConstruct 执行、AOP 代理创建都是通过不同的 BeanPostProcessor 实现的。它是 Spring 框架内部大量使用的核心扩展机制。

## 看到什么就先想到这类

- 出现 Bean 生命周期、初始化顺序。
- 出现 @PostConstruct、InitializingBean、BeanPostProcessor。
- 出现 singleton vs prototype、作用域代理。
- 出现"容器启动时做了什么"。
