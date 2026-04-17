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
