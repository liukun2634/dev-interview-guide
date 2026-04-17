---
title: 设计模式
---

# 设计模式

## 概念

设计模式是软件开发中针对常见问题的可复用解决方案，由 GoF（Gang of Four）在《设计模式》一书中归纳为 23 种，分为三大类：

- **创建型**：关注对象创建方式（单例、工厂、建造者等）
- **结构型**：关注类和对象的组合方式（代理、适配器、装饰器等）
- **行为型**：关注对象之间的职责分配（策略、观察者、模板方法、责任链等）

面试重点在于：能说清每个模式解决什么问题、在 Spring/项目中哪里用到、以及相互之间的区别。

---

## 核心原理

### 1. 单例模式

**一句话定义**：保证一个类在 JVM 中只有一个实例，并提供全局访问点。

**UML 关系**：类持有自身静态实例，构造器私有，通过静态方法对外提供实例。

**四种实现方式：**

```java
// 1. 饿汉式 — 类加载时初始化，线程安全，但可能造成资源浪费
public class HungrySingleton {
    private static final HungrySingleton INSTANCE = new HungrySingleton();

    private HungrySingleton() {}

    public static HungrySingleton getInstance() {
        return INSTANCE;
    }
}

// 2. 懒汉式（非线程安全）— 延迟初始化，多线程下可能创建多个实例
public class LazySingleton {
    private static LazySingleton instance;

    private LazySingleton() {}

    public static LazySingleton getInstance() {
        if (instance == null) {
            instance = new LazySingleton(); // 多线程下此处有竞争
        }
        return instance;
    }
}

// 3. DCL（Double-Checked Locking）— 懒加载 + 线程安全，volatile 防止指令重排
public class DCLSingleton {
    // volatile 禁止指令重排：new 操作分三步（分配内存、初始化、赋值），
    // 重排可能导致其他线程拿到未初始化的对象
    private static volatile DCLSingleton instance;

    private DCLSingleton() {}

    public static DCLSingleton getInstance() {
        if (instance == null) {                     // 第一次检查，避免每次加锁
            synchronized (DCLSingleton.class) {
                if (instance == null) {             // 第二次检查，防止重复创建
                    instance = new DCLSingleton();
                }
            }
        }
        return instance;
    }
}

// 4. 枚举（推荐）— 最简洁，天然线程安全，防止反射和反序列化破坏单例
public enum EnumSingleton {
    INSTANCE;

    public void doSomething() {
        System.out.println("枚举单例方法");
    }
}
// 使用：EnumSingleton.INSTANCE.doSomething();
```

**Spring 中的应用**：Spring Bean 默认作用域为 `singleton`，容器负责管理单例生命周期，无需手动实现。

---

### 2. 工厂模式

**一句话定义**：将对象的创建逻辑封装起来，调用者只关心接口，不关心具体实现类。

**UML 关系**：
- 简单工厂：一个工厂类，根据参数创建不同产品。
- 工厂方法：定义工厂接口，每个具体工厂负责创建一种产品。
- 抽象工厂：工厂接口可创建一族相关产品（多个产品维度）。

```java
// 产品接口
public interface Payment {
    void pay(BigDecimal amount);
}

// 具体产品
public class AlipayPayment implements Payment {
    public void pay(BigDecimal amount) { System.out.println("支付宝支付：" + amount); }
}

public class WechatPayment implements Payment {
    public void pay(BigDecimal amount) { System.out.println("微信支付：" + amount); }
}

// 简单工厂
public class PaymentFactory {
    public static Payment create(String type) {
        return switch (type) {
            case "alipay"  -> new AlipayPayment();
            case "wechat"  -> new WechatPayment();
            default        -> throw new IllegalArgumentException("未知支付类型：" + type);
        };
    }
}

// 工厂方法：新增支付方式只需新增工厂类，不修改已有代码（符合开闭原则）
public interface PaymentCreator {
    Payment create();
}

public class AlipayCreator implements PaymentCreator {
    public Payment create() { return new AlipayPayment(); }
}
```

**Spring 中的应用**：`BeanFactory` 是工厂方法模式的典型实现，`FactoryBean` 接口允许自定义 Bean 的创建逻辑。

---

### 3. 策略模式

**一句话定义**：将算法族封装成独立策略类，运行时按需切换，消除大量 if-else。

**UML 关系**：Context 持有 Strategy 接口引用，委托给具体策略执行。

```java
// 策略接口
public interface DiscountStrategy {
    BigDecimal calculate(BigDecimal price);
}

// 具体策略
@Component("vip")
public class VipDiscount implements DiscountStrategy {
    public BigDecimal calculate(BigDecimal price) {
        return price.multiply(new BigDecimal("0.9"));
    }
}

@Component("svip")
public class SvipDiscount implements DiscountStrategy {
    public BigDecimal calculate(BigDecimal price) {
        return price.multiply(new BigDecimal("0.8"));
    }
}

// 用 Map 注册策略，Spring 会自动将所有 DiscountStrategy 实现注入
@Service
public class OrderService {
    // key = Bean name（即 @Component 的值），value = 策略实现
    @Autowired
    private Map<String, DiscountStrategy> strategyMap;

    public BigDecimal discount(String userType, BigDecimal price) {
        DiscountStrategy strategy = strategyMap.get(userType);
        if (strategy == null) {
            throw new IllegalArgumentException("未知用户类型：" + userType);
        }
        return strategy.calculate(price);
    }
}
```

**Spring 中的应用**：`ResourceLoader`、`HandlerMapping` 均使用策略模式；项目中用 `Map<String, Strategy>` 替代 if-else 是最常见的落地方式。

---

### 4. 观察者模式

**一句话定义**：定义对象间一对多依赖，当被观察者状态变化时，自动通知所有观察者。

**UML 关系**：Subject 持有 Observer 列表，状态变更时遍历通知；观察者实现统一监听接口。

```java
// Spring 事件驱动（观察者模式的标准 Spring 实现）

// 1. 定义事件
public class OrderCreatedEvent extends ApplicationEvent {
    private final Long orderId;

    public OrderCreatedEvent(Object source, Long orderId) {
        super(source);
        this.orderId = orderId;
    }

    public Long getOrderId() { return orderId; }
}

// 2. 发布事件
@Service
@RequiredArgsConstructor
public class OrderService {
    private final ApplicationEventPublisher publisher;

    public void createOrder(Order order) {
        // 业务逻辑 ...
        publisher.publishEvent(new OrderCreatedEvent(this, order.getId()));
    }
}

// 3. 监听事件（多个监听器互不干扰）
@Component
public class InventoryListener {
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        System.out.println("扣减库存，订单ID：" + event.getOrderId());
    }
}

@Component
public class NotificationListener {
    @EventListener
    @Async  // 异步处理，不阻塞主流程
    public void onOrderCreated(OrderCreatedEvent event) {
        System.out.println("发送通知，订单ID：" + event.getOrderId());
    }
}
```

**Spring 中的应用**：`ApplicationEvent` / `ApplicationListener` / `@EventListener`，`ContextRefreshedEvent` 容器刷新事件。

---

### 5. 代理模式

**一句话定义**：为目标对象提供代理，在不修改原有代码的前提下，增强其功能（如日志、事务、权限）。

**UML 关系**：代理类和目标类实现相同接口，代理持有目标对象引用，方法调用前后织入逻辑。

```java
// ---- 静态代理 ----
public interface UserService {
    void save(User user);
}

public class UserServiceImpl implements UserService {
    public void save(User user) { System.out.println("保存用户"); }
}

public class UserServiceProxy implements UserService {
    private final UserService target;

    public UserServiceProxy(UserService target) { this.target = target; }

    public void save(User user) {
        System.out.println("前置增强：记录日志");
        target.save(user);
        System.out.println("后置增强：记录日志");
    }
}

// ---- JDK 动态代理（要求目标类实现接口）----
public class JdkProxyFactory {
    public static Object getProxy(Object target) {
        return Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            (proxy, method, args) -> {
                System.out.println("JDK 代理前置");
                Object result = method.invoke(target, args);
                System.out.println("JDK 代理后置");
                return result;
            }
        );
    }
}

// ---- CGLIB 动态代理（无需接口，对类生成子类）----
public class CglibProxyFactory implements MethodInterceptor {
    public Object getProxy(Class<?> clazz) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(clazz);
        enhancer.setCallback(this);
        return enhancer.create();
    }

    @Override
    public Object intercept(Object obj, Method method,
                            Object[] args, MethodProxy proxy) throws Throwable {
        System.out.println("CGLIB 代理前置");
        Object result = proxy.invokeSuper(obj, args);
        System.out.println("CGLIB 代理后置");
        return result;
    }
}
```

| 对比维度 | JDK 动态代理 | CGLIB |
|---|---|---|
| 要求 | 目标类必须实现接口 | 无需接口，对类生成子类 |
| 原理 | 反射 `InvocationHandler` | 字节码增强（ASM） |
| 性能 | 较慢（反射调用） | 较快（直接调用字节码） |
| 限制 | 只能代理接口方法 | 不能代理 `final` 类/方法 |

**Spring 中的应用**：Spring AOP 默认优先使用 CGLIB（Spring Boot 2.x+ 起），`@Transactional`、`@Async` 均基于代理实现。

---

### 6. 模板方法模式

**一句话定义**：在抽象类中定义算法骨架，将某些步骤延迟到子类实现，子类不改变算法结构。

**UML 关系**：抽象类定义 `final` 模板方法（骨架）+ 抽象/钩子方法（子类实现）。

```java
public abstract class DataExporter {
    // 模板方法，定义固定流程
    public final void export() {
        connect();
        List<Object> data = fetchData();   // 子类实现
        List<Object> processed = process(data);
        writeOutput(processed);            // 子类实现
        close();
    }

    private void connect()  { System.out.println("建立连接"); }
    private void close()    { System.out.println("关闭连接"); }

    protected abstract List<Object> fetchData();
    protected abstract void writeOutput(List<Object> data);

    // 钩子方法：子类可选择性覆盖
    protected List<Object> process(List<Object> data) { return data; }
}

public class CsvExporter extends DataExporter {
    protected List<Object> fetchData() {
        return List.of("row1", "row2");
    }
    protected void writeOutput(List<Object> data) {
        System.out.println("写入 CSV：" + data);
    }
}
```

**Spring 中的应用**：`JdbcTemplate`、`RestTemplate`、`RedisTemplate` 均是模板方法模式；`AbstractApplicationContext#refresh()` 定义了容器启动的完整骨架。

---

### 7. 责任链模式

**一句话定义**：将请求沿着处理链传递，每个处理者决定是否处理请求以及是否继续向下传递。

**UML 关系**：处理者持有下一个处理者的引用，形成链式结构。

```java
// 自定义责任链示例
public abstract class AbstractHandler {
    protected AbstractHandler next;

    public AbstractHandler setNext(AbstractHandler next) {
        this.next = next;
        return next; // 支持链式设置
    }

    public abstract void handle(Request request);
}

public class AuthHandler extends AbstractHandler {
    public void handle(Request request) {
        if (!request.isAuthenticated()) {
            System.out.println("鉴权失败，拒绝请求");
            return;
        }
        System.out.println("鉴权通过");
        if (next != null) next.handle(request);
    }
}

public class RateLimitHandler extends AbstractHandler {
    public void handle(Request request) {
        if (request.isRateLimited()) {
            System.out.println("超出限流阈值");
            return;
        }
        System.out.println("限流检查通过");
        if (next != null) next.handle(request);
    }
}

// 构建链：auth -> rateLimit -> business
AbstractHandler auth = new AuthHandler();
auth.setNext(new RateLimitHandler()).setNext(new BusinessHandler());
auth.handle(request);
```

**Spring 中的应用**：Servlet `FilterChain`、Spring MVC `HandlerInterceptor`、Spring Security `SecurityFilterChain`（多个 Filter 按顺序执行）。

---

### 8. 建造者模式

**一句话定义**：分步骤构建复杂对象，将构建过程与表示分离，支持链式调用。

**UML 关系**：Builder 持有目标对象，每个 setter 返回 `this`，最终 `build()` 返回完整对象。

```java
// 手动实现
public class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    private final int timeout;

    private HttpRequest(Builder builder) {
        this.url     = builder.url;
        this.method  = builder.method;
        this.headers = builder.headers;
        this.body    = builder.body;
        this.timeout = builder.timeout;
    }

    public static class Builder {
        private String url;
        private String method = "GET";
        private Map<String, String> headers = new HashMap<>();
        private String body;
        private int timeout = 5000;

        public Builder url(String url)         { this.url = url;         return this; }
        public Builder method(String method)   { this.method = method;   return this; }
        public Builder header(String k, String v) { headers.put(k, v);  return this; }
        public Builder body(String body)       { this.body = body;       return this; }
        public Builder timeout(int ms)         { this.timeout = ms;      return this; }
        public HttpRequest build()             { return new HttpRequest(this); }
    }
}

// 使用
HttpRequest req = new HttpRequest.Builder()
    .url("https://api.example.com/users")
    .method("POST")
    .header("Content-Type", "application/json")
    .body("{\"name\":\"张三\"}")
    .timeout(3000)
    .build();

// Lombok @Builder：自动生成 Builder 模板代码
@Builder
@Data
public class UserDTO {
    private Long id;
    private String name;
    private String email;
}

// 使用：UserDTO.builder().id(1L).name("张三").email("z@example.com").build();
```

**Spring 中的应用**：`UriComponentsBuilder`、`MockMvcRequestBuilders`、`BeanDefinitionBuilder`；Mybatis-Plus `LambdaQueryWrapper` 链式查询。

---

### 设计原则速查（SOLID）

| 原则 | 全称 | 一句话解释 |
|---|---|---|
| **S** | 单一职责原则 | 一个类只做一件事，一个类只有一个变化的理由 |
| **O** | 开闭原则 | 对扩展开放，对修改关闭（加新功能加新类，不改旧代码） |
| **L** | 里氏替换原则 | 子类对象可以替换父类对象，且程序行为不变 |
| **I** | 接口隔离原则 | 不应强迫客户端依赖它不使用的方法（接口粒度要细） |
| **D** | 依赖倒置原则 | 高层模块不依赖低层模块，都依赖抽象（面向接口编程） |

---

## 面试常问 & 怎么答

**Q1：单例模式有几种实现？为什么推荐枚举？**

> 常见实现有四种：饿汉式、懒汉式、DCL（双重检查锁）、枚举。推荐枚举的原因有三：
> 1. **线程安全**：枚举实例由 JVM 在类加载时保证唯一，无需额外同步。
> 2. **防反射攻击**：通过反射调用枚举构造器会抛出 `IllegalArgumentException`，其他实现无此保护。
> 3. **防反序列化破坏**：枚举序列化/反序列化后返回同一实例，其他实现需手动实现 `readResolve()` 才能保证。
>
> DCL 虽然也很常用，但必须加 `volatile`，否则指令重排可能导致返回未初始化的对象。

---

**Q2：策略模式怎么消除 if-else？在项目中怎么用？**

> 核心思路：用 `Map<String, Strategy>` 替代 `if-else if` 分支。
>
> 项目落地步骤：
> 1. 定义策略接口，每种业务逻辑实现一个策略类，用 `@Component("key")` 注册为 Bean。
> 2. 在 Service 中注入 `Map<String, Strategy>`，Spring 自动将所有实现注入，key 为 Bean name。
> 3. 调用时通过业务类型字符串从 Map 中取出对应策略执行。
>
> 好处是新增业务逻辑只需新增一个策略类，完全符合开闭原则，不需要动原有代码。我在项目中用这个方式处理过多种支付渠道/消息推送渠道的分发逻辑。

---

**Q3：JDK 动态代理和 CGLIB 有什么区别？**

> | | JDK 动态代理 | CGLIB |
> |---|---|---|
> | 代理方式 | 基于接口，生成接口实现类 | 基于继承，生成目标类的子类 |
> | 要求 | 目标类必须实现接口 | 无需接口，但不能代理 final 类/方法 |
> | 实现机制 | 反射（`InvocationHandler`） | 字节码增强（ASM 库） |
> | 性能 | JDK 8 后差距已缩小 | 调用更快（直接字节码调用） |
>
> Spring Boot 2.x 起默认使用 CGLIB（`spring.aop.proxy-target-class=true`），因为它不要求目标类实现接口，通用性更好。`@Transactional` 失效的常见原因之一就是在同一个类中自调用（绕过了代理）。

---

## 看到什么就先想到这类

| 关键词/场景 | 优先想到的模式 |
|---|---|
| 全局唯一实例、配置类、连接池 | 单例模式 |
| `new` 逻辑复杂、需要隐藏具体实现类 | 工厂模式 |
| 大量 `if-else` 判断业务类型 | 策略模式 |
| 一个动作触发多个下游处理 | 观察者模式 |
| 不改原代码加日志/事务/权限 | 代理模式（AOP） |
| 固定流程、步骤可变 | 模板方法模式 |
| 请求依次经过多个处理节点 | 责任链模式 |
| 构造参数很多、链式 `.set().set().build()` | 建造者模式 |
| `@Transactional` 失效 | 代理模式（自调用绕过代理） |
| Spring AOP、`@Async`、`@Cacheable` | 代理模式 |
| `ApplicationEvent` 解耦业务 | 观察者模式 |
