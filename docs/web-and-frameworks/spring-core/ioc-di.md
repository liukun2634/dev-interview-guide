---
title: IoC 与依赖注入
---

# IoC 与依赖注入

## 核心思想

**IoC（Inversion of Control，控制反转）**：对象的创建和依赖关系由 Spring 容器管理，而非对象自己 `new`。

```java
// 没有 IoC — 自己创建依赖
public class OrderService {
    private UserRepository userRepo = new UserRepository(); // 强耦合
}

// 有 IoC — 容器注入依赖
public class OrderService {
    private final UserRepository userRepo;
    
    public OrderService(UserRepository userRepo) { // 容器自动注入
        this.userRepo = userRepo;
    }
}
```

**好处：** 解耦（不依赖具体实现）、可测试（可以注入 Mock）、可替换（换实现只改配置）。

## 三种注入方式

| 方式 | 写法 | 推荐度 | 说明 |
|------|------|--------|------|
| 构造器注入 | 构造方法参数 | ✅ 推荐 | 依赖不可变（final）、不会遗漏、便于测试 |
| Setter 注入 | setter 方法 + @Autowired | 可选 | 适用于可选依赖 |
| 字段注入 | 字段 + @Autowired | ❌ 不推荐 | 无法 final、难以测试、隐藏依赖关系 |

```java
// ✅ 构造器注入（推荐）— Spring 4.3+ 单构造器可省略 @Autowired
@Service
public class OrderService {
    private final UserRepository userRepo;
    private final PaymentService paymentService;

    public OrderService(UserRepository userRepo, PaymentService paymentService) {
        this.userRepo = userRepo;
        this.paymentService = paymentService;
    }
}

// ❌ 字段注入（不推荐）
@Service
public class OrderService {
    @Autowired
    private UserRepository userRepo; // 不能 final，难以测试
}
```

**为什么推荐构造器注入？**
1. 依赖可以是 `final` 的，保证不可变
2. 所有依赖在构造时就明确，不会遗漏
3. 单元测试时直接 new 就能注入 Mock，不依赖 Spring 容器
4. 如果依赖太多，构造器参数过长，说明这个类职责太多，是设计问题的信号

## BeanFactory vs ApplicationContext

| 对比项 | BeanFactory | ApplicationContext |
|--------|-------------|-------------------|
| 加载方式 | 懒加载（getBean 时才创建） | 预加载（容器启动时创建所有 singleton） |
| 功能 | 基础的 Bean 管理 | 扩展了事件发布、国际化、AOP 等 |
| 使用场景 | 资源受限环境 | 几乎所有场景（Spring Boot 默认） |

**实际开发中几乎不直接用 BeanFactory**，ApplicationContext 是它的超集。

## 常用注解语义

| 注解 | 语义 | 说明 |
|------|------|------|
| @Component | 通用组件 | 标记为 Spring 管理的 Bean |
| @Service | 业务逻辑层 | 语义上标识 Service，功能等同 @Component |
| @Repository | 数据访问层 | 额外提供持久化异常转换 |
| @Controller | Web 控制器 | 标识为 Spring MVC Controller |
| @Configuration | 配置类 | 类中的 @Bean 方法会被 CGLIB 代理，保证单例 |

**@Configuration vs @Component 中定义 @Bean：** @Configuration 类会被 CGLIB 增强，类内方法互相调用时返回同一个 Bean 实例；@Component 类中的 @Bean 方法互相调用会创建新实例。

## @Autowired vs @Resource vs @Inject

| 注解 | 来源 | 匹配方式 | 说明 |
|------|------|----------|------|
| @Autowired | Spring | 先按类型，再按名称 | 最常用，配合 @Qualifier 指定名称 |
| @Resource | Jakarta EE | 先按名称，再按类型 | 标准注解，不依赖 Spring |
| @Inject | Jakarta EE | 按类型 | 类似 @Autowired，但没有 required 属性 |

推荐：构造器注入时不需要这些注解（单构造器自动注入）。如果用字段注入，@Resource 比 @Autowired 更明确（按名称优先）。

## 循环依赖与三级缓存

### 什么是循环依赖

A 依赖 B，B 又依赖 A，形成循环：

```
A → B → A  （循环）
```

### 三级缓存解决流程

Spring 用三级缓存解决 **setter/字段注入** 的 singleton 循环依赖：

| 缓存 | 名称 | 存放内容 |
|------|------|----------|
| 一级 | singletonObjects | 完全初始化好的 Bean |
| 二级 | earlySingletonObjects | 提前暴露的半成品 Bean（可能是代理对象） |
| 三级 | singletonFactories | Bean 的 ObjectFactory（用于创建代理） |

**流程（A 和 B 互相依赖）：**

1. 创建 A：实例化 A → 将 A 的 ObjectFactory 放入三级缓存
2. 填充 A 的属性：发现依赖 B → 去创建 B
3. 创建 B：实例化 B → 将 B 的 ObjectFactory 放入三级缓存
4. 填充 B 的属性：发现依赖 A → 从三级缓存获取 A 的 ObjectFactory → 创建 A 的早期引用 → 放入二级缓存
5. B 初始化完成 → 放入一级缓存
6. 回到 A：B 已创建好 → A 初始化完成 → 放入一级缓存

**为什么需要三级而不是两级？** 三级缓存的 ObjectFactory 可以在需要时才创建代理对象（AOP），避免不必要的代理创建。如果没有 AOP，两级缓存就够了。

### 无法解决的情况

- **构造器注入的循环依赖**：A 的构造器需要 B，B 的构造器需要 A，此时 A 还没实例化，无法放入缓存 → 报错
- **prototype 作用域的循环依赖**：Spring 不缓存 prototype Bean → 无法解决
- **Spring Boot 3 默认禁止循环依赖**：需要 `spring.main.allow-circular-references=true` 显式开启

## 面试常问 & 怎么答

### Q1: 什么是 IoC 和 DI？

IoC 是控制反转，对象不再自己创建依赖，而是由容器管理。DI 是依赖注入，是 IoC 的实现方式 — 容器在创建对象时自动注入依赖。好处是解耦、可测试、可替换。

### Q2: 三级缓存解决循环依赖的流程？

创建 A 时把 A 的工厂放三级缓存 → 发现依赖 B → 创建 B → B 依赖 A → 从三级缓存拿 A 的工厂创建早期引用放二级缓存 → B 完成放一级缓存 → A 完成放一级缓存。三级缓存的意义是延迟代理创建（为了 AOP）。

### Q3: 为什么推荐构造器注入？

三个原因：依赖可以是 final 不可变；所有依赖在构造时就确定，不会遗漏；测试时直接 new 不需要 Spring 容器。如果构造器参数太多，说明类职责太多，是设计信号。

## 看到什么就先想到这类

- 出现 @Autowired、@Component、@Service、@Repository。
- 出现 BeanFactory、ApplicationContext。
- 出现循环依赖、三级缓存。
- 出现构造器注入 vs 字段注入的讨论。
