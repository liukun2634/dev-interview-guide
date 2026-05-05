---
title: 设计模式
---

# 设计模式

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
设计模式是面试高频考点。重点不是背 23 种模式，而是理解 SOLID 原则、能说清每个模式解决什么问题、在 Spring/项目中的实际应用。
:::

---

## 核心概念

### SOLID 原则

| 原则 | 一句话定义 | 违反时的症状 |
|------|---------|-----------|
| S — 单一职责 | 一个类只负责一件事 | 一个类改动频繁、牵一发而动全身 |
| O — 开闭原则 | 对扩展开放，对修改关闭 | 每加一种新类型就要改 if-else |
| L — 里氏替换 | 子类可以替换父类 | 重写父类方法后调用方行为异常 |
| I — 接口隔离 | 接口小而专，不强迫实现不需要的方法 | 实现类有大量空方法 |
| D — 依赖倒置 | 依赖抽象而非具体实现 | 换一个实现要改大量代码 |

### 23 种模式分类概览

| 类型 | 模式 |
|------|------|
| 创建型 | 单例、工厂方法、抽象工厂、建造者、原型 |
| 结构型 | 代理、适配器、装饰器、桥接、外观、组合、享元 |
| 行为型 | 策略、观察者、模板方法、责任链、命令、状态、备忘录、迭代器、中介者、访问者、解释器 |

### 面试重点模式

#### 1. 单例模式

**一句话定义**：保证一个类在 JVM 中只有一个实例，并提供全局访问点。

**结构关系**：类持有自身静态实例，构造器私有，通过静态方法对外提供唯一实例。外部无法 `new`，只能通过 `getInstance()` 获取。

```java
// DCL（Double-Checked Locking）推荐写法
public class ConfigManager {
    // volatile 禁止指令重排：new 操作分三步（分配内存、初始化对象、赋值引用），
    // 重排后其他线程可能拿到尚未初始化完成的对象
    private static volatile ConfigManager instance;

    private final Map<String, String> config = new HashMap<>();

    private ConfigManager() {
        // 加载配置
        config.put("timeout", "5000");
    }

    public static ConfigManager getInstance() {
        if (instance == null) {                      // 第一次检查：避免每次加锁
            synchronized (ConfigManager.class) {
                if (instance == null) {              // 第二次检查：防止重复创建
                    instance = new ConfigManager();
                }
            }
        }
        return instance;
    }

    public String get(String key) {
        return config.get(key);
    }
}
```

**Spring 应用**：Spring Bean 默认作用域为 `singleton`，容器负责管理单例生命周期，无需手动实现。连接池（`HikariDataSource`）也是典型单例。

**面试追问**：为什么要加 `volatile`？`new` 操作在 JVM 层面分三步：分配内存 → 初始化对象 → 将引用赋值给变量。指令重排可能导致步骤二和三互换，另一个线程在第一次检查时拿到非 `null` 但未初始化完成的对象，`volatile` 通过内存屏障禁止这种重排。

---

#### 2. 工厂方法模式

**一句话定义**：将对象的创建逻辑封装到工厂，调用者只依赖接口，不依赖具体实现类。

**结构关系**：定义工厂接口，每个具体工厂负责创建一种具体产品。新增产品只需新增工厂类，无需修改已有代码，符合开闭原则。

```java
// 产品接口
public interface Payment {
    void pay(java.math.BigDecimal amount);
}

// 具体产品
public class AlipayPayment implements Payment {
    public void pay(java.math.BigDecimal amount) {
        System.out.println("支付宝支付：" + amount);
    }
}

public class WechatPayment implements Payment {
    public void pay(java.math.BigDecimal amount) {
        System.out.println("微信支付：" + amount);
    }
}

// 工厂接口
public interface PaymentFactory {
    Payment create();
}

// 具体工厂：新增支付方式只需新增工厂类，不修改已有代码
public class AlipayFactory implements PaymentFactory {
    public Payment create() { return new AlipayPayment(); }
}

public class WechatFactory implements PaymentFactory {
    public Payment create() { return new WechatPayment(); }
}

// 调用方
PaymentFactory factory = new AlipayFactory();
Payment payment = factory.create();
payment.pay(new java.math.BigDecimal("99.00"));
```

**Spring 应用**：`BeanFactory` 是工厂方法模式的典型实现；`FactoryBean` 接口允许自定义 Bean 的创建逻辑，`getObject()` 即工厂方法。

**面试追问**：工厂方法 vs 抽象工厂？工厂方法针对单一产品维度，每个工厂创建一种产品；抽象工厂针对产品族，一个工厂可以创建多个相关联的产品（如 UI 组件工厂同时创建按钮和文本框）。

---

#### 3. 建造者模式

**一句话定义**：分步骤构建复杂对象，将构建过程与表示分离，支持链式调用，避免大量构造器重载。

**结构关系**：Builder 持有目标对象的各个参数，每个 setter 返回 `this` 支持链式调用，最终 `build()` 返回不可变的完整对象。

```java
public class UserProfile {
    private final Long id;
    private final String name;
    private final String email;
    private final String phone;   // 可选
    private final String avatar;  // 可选

    private UserProfile(Builder builder) {
        this.id     = builder.id;
        this.name   = builder.name;
        this.email  = builder.email;
        this.phone  = builder.phone;
        this.avatar = builder.avatar;
    }

    public static class Builder {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String avatar;

        public Builder id(Long id)         { this.id = id;         return this; }
        public Builder name(String name)   { this.name = name;     return this; }
        public Builder email(String email) { this.email = email;   return this; }
        public Builder phone(String phone) { this.phone = phone;   return this; }
        public Builder avatar(String url)  { this.avatar = url;    return this; }

        public UserProfile build() {
            if (id == null || name == null) throw new IllegalStateException("id 和 name 必填");
            return new UserProfile(this);
        }
    }
}

// 使用：链式构建，只传必要参数
UserProfile user = new UserProfile.Builder()
    .id(1L)
    .name("张三")
    .email("zhangsan@example.com")
    .build();
```

**Spring 应用**：`StringBuilder`、`UriComponentsBuilder`、`BeanDefinitionBuilder`；Lombok `@Builder` 注解自动生成完整 Builder 代码；MyBatis-Plus `LambdaQueryWrapper` 链式查询也体现建造者思想。

**面试追问**：建造者 vs 工厂？工厂关注"创建哪种产品"（对象类型的选择），建造者关注"如何一步步构建产品"（复杂对象的组装过程）。参数超过 4 个且有可选参数时优先考虑建造者。

---

#### 4. 代理模式

**一句话定义**：为目标对象提供代理，在不修改原有代码的前提下，在方法调用前后织入增强逻辑（日志、事务、权限）。

**结构关系**：代理类与目标类实现相同接口，代理持有目标对象引用，方法调用时委托给目标执行，并在前后添加增强逻辑。

```java
// JDK 动态代理（目标类必须实现接口）
public interface OrderService {
    void createOrder(String orderId);
}

public class OrderServiceImpl implements OrderService {
    public void createOrder(String orderId) {
        System.out.println("创建订单：" + orderId);
    }
}

// 通用日志代理工厂
public class LoggingProxyFactory {
    public static <T> T getProxy(T target) {
        return (T) java.lang.reflect.Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            (proxy, method, args) -> {
                long start = System.currentTimeMillis();
                System.out.println("调用方法：" + method.getName());
                Object result = method.invoke(target, args);
                long cost = System.currentTimeMillis() - start;
                System.out.println("耗时：" + cost + "ms");
                return result;
            }
        );
    }
}

// 使用
OrderService proxy = LoggingProxyFactory.getProxy(new OrderServiceImpl());
proxy.createOrder("ORDER-001");
```

**Spring 应用**：Spring AOP 基于代理实现；有接口时默认用 JDK 动态代理，无接口时用 CGLIB（字节码子类）。`@Transactional`、`@Async`、`@Cacheable` 均依赖代理，因此同类内部调用会导致这些注解失效。

**面试追问**：JDK 动态代理 vs CGLIB？JDK 基于接口 + 反射，要求目标类实现接口；CGLIB 基于继承 + ASM 字节码生成，无需接口但不能代理 `final` 类/方法。Spring Boot 2.x 起默认使用 CGLIB。

---

#### 5. 策略模式

**一句话定义**：将算法族封装成独立策略类，运行时按需切换，消除大量 if-else。

**结构关系**：定义策略接口，每种算法实现为独立策略类；Context 持有策略引用，将执行委托给策略。新增算法只需新增策略类。

```java
// 策略接口
public interface DiscountStrategy {
    java.math.BigDecimal calculate(java.math.BigDecimal price);
}

// 具体策略：用 @Component("key") 注册，key 即业务类型标识
@org.springframework.stereotype.Component("vip")
public class VipDiscount implements DiscountStrategy {
    public java.math.BigDecimal calculate(java.math.BigDecimal price) {
        return price.multiply(new java.math.BigDecimal("0.9")); // 九折
    }
}

@org.springframework.stereotype.Component("svip")
public class SvipDiscount implements DiscountStrategy {
    public java.math.BigDecimal calculate(java.math.BigDecimal price) {
        return price.multiply(new java.math.BigDecimal("0.8")); // 八折
    }
}

// Context：用 Map 注入所有策略，彻底消除 if-else
@org.springframework.stereotype.Service
public class PriceService {
    // Spring 自动将所有 DiscountStrategy Bean 注入，key = Bean name
    @org.springframework.beans.factory.annotation.Autowired
    private java.util.Map<String, DiscountStrategy> strategyMap;

    public java.math.BigDecimal getPrice(String userType, java.math.BigDecimal price) {
        DiscountStrategy strategy = strategyMap.get(userType);
        if (strategy == null) throw new IllegalArgumentException("未知用户类型：" + userType);
        return strategy.calculate(price);
    }
}
```

**Spring 应用**：`Comparator` 是策略接口的典型例子；`ResourceLoader`、`HandlerMapping` 也使用策略模式。项目中用 `Map<String, Strategy>` + `@Component` 是消除 if-else 最常见的落地方案。

**面试追问**：策略 vs 状态？策略模式的切换由客户端主动触发，算法之间无关联；状态模式的切换由状态对象自身触发，状态之间有转换关系，侧重对象行为随状态变化而变化。

---

#### 6. 观察者模式

**一句话定义**：定义对象间一对多依赖，当被观察者状态变化时，自动通知所有观察者，实现发布方与订阅方解耦。

**结构关系**：Subject（被观察者）维护 Observer 列表，状态变更时遍历通知；观察者实现统一监听接口，互不干扰。

```java
// Spring 事件驱动（观察者模式的标准 Spring 实现）

// 1. 定义事件（携带业务数据）
public class OrderCreatedEvent extends org.springframework.context.ApplicationEvent {
    private final Long orderId;
    private final java.math.BigDecimal amount;

    public OrderCreatedEvent(Object source, Long orderId, java.math.BigDecimal amount) {
        super(source);
        this.orderId = orderId;
        this.amount  = amount;
    }
    public Long getOrderId()                   { return orderId; }
    public java.math.BigDecimal getAmount()    { return amount; }
}

// 2. 发布事件（发布方只关心发布，不关心谁在监听）
@org.springframework.stereotype.Service
public class OrderService {
    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.context.ApplicationEventPublisher publisher;

    public void createOrder(Long orderId, java.math.BigDecimal amount) {
        // 核心业务逻辑 ...
        publisher.publishEvent(new OrderCreatedEvent(this, orderId, amount));
    }
}

// 3. 多个监听器独立处理，互不影响
@org.springframework.stereotype.Component
public class InventoryListener {
    @org.springframework.context.event.EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        System.out.println("扣减库存，订单：" + event.getOrderId());
    }
}

@org.springframework.stereotype.Component
public class PointsListener {
    @org.springframework.context.event.EventListener
    @org.springframework.scheduling.annotation.Async
    public void onOrderCreated(OrderCreatedEvent event) {
        System.out.println("增加积分，金额：" + event.getAmount());
    }
}
```

**Spring 应用**：`ApplicationEvent` + `@EventListener` 是标准实现；`ContextRefreshedEvent`、`ContextClosedEvent` 是容器内置事件。`@Async` 可将监听器改为异步，不阻塞主业务流程。

**面试追问**：观察者 vs 发布订阅？观察者模式中，Subject 直接持有并通知 Observer，两者存在直接依赖；发布订阅模式通过消息中间件（如 Kafka、RabbitMQ）解耦，发布方和订阅方完全不知道彼此的存在，是观察者模式的进一步解耦。

---

#### 7. 模板方法模式

**一句话定义**：在抽象类中定义算法骨架（固定流程），将可变步骤延迟到子类实现，子类不改变整体结构。

**结构关系**：抽象类定义 `final` 模板方法（骨架）+ 抽象方法（子类必须实现）+ 钩子方法（子类可选覆盖）。父类控制流程，子类填充细节。

```java
public abstract class DataExporter {
    // 模板方法：定义固定导出流程，final 禁止子类覆盖
    public final void export(String destination) {
        connect();
        java.util.List<String> data = fetchData();    // 子类实现：从不同数据源取数
        if (needFilter()) {                            // 钩子方法：子类可选择是否过滤
            data = filter(data);
        }
        writeOutput(data, destination);               // 子类实现：写入不同格式
        close();
    }

    private void connect() { System.out.println("建立数据源连接"); }
    private void close()   { System.out.println("关闭连接，释放资源"); }

    // 抽象方法：子类必须实现
    protected abstract java.util.List<String> fetchData();
    protected abstract void writeOutput(java.util.List<String> data, String dest);

    // 钩子方法：子类可选覆盖，默认不过滤
    protected boolean needFilter()                   { return false; }
    protected java.util.List<String> filter(java.util.List<String> d) { return d; }
}

// 具体子类：只关注自己负责的步骤
public class CsvExporter extends DataExporter {
    protected java.util.List<String> fetchData() {
        return java.util.Arrays.asList("row1,a", "row2,b");
    }
    protected void writeOutput(java.util.List<String> data, String dest) {
        System.out.println("写入 CSV 文件 [" + dest + "]：" + data);
    }
}
```

**Spring 应用**：`JdbcTemplate`、`RestTemplate`、`RedisTemplate` 均是模板方法模式的典型应用，封装了样板代码（连接/释放），开放数据处理逻辑；`AbstractApplicationContext#refresh()` 定义了容器启动的完整骨架。

**面试追问**：模板方法 vs 策略？模板方法通过继承在编译时固定算法骨架，子类只能替换部分步骤；策略模式通过组合在运行时动态切换完整算法。模板方法适合"流程固定，局部可变"；策略适合"算法整体可替换"。

---

#### 8. 责任链模式

**一句话定义**：将请求沿着处理链传递，每个处理者决定是否处理请求及是否继续向下传递，实现请求发送者与处理者解耦。

**结构关系**：每个处理者持有下一个处理者的引用，形成链式结构。请求从链头进入，沿链传递直到被处理或到达链尾。

```java
public abstract class RequestHandler {
    protected RequestHandler next;

    // 链式设置，返回 next 支持 a.setNext(b).setNext(c) 写法
    public RequestHandler setNext(RequestHandler next) {
        this.next = next;
        return next;
    }

    public abstract void handle(HttpRequest request);

    protected void passToNext(HttpRequest request) {
        if (next != null) next.handle(request);
    }
}

public class AuthHandler extends RequestHandler {
    public void handle(HttpRequest request) {
        if (!request.isAuthenticated()) {
            System.out.println("鉴权失败，拒绝请求：" + request.getPath());
            return; // 不继续传递
        }
        System.out.println("鉴权通过");
        passToNext(request);
    }
}

public class RateLimitHandler extends RequestHandler {
    public void handle(HttpRequest request) {
        if (request.isRateLimited()) {
            System.out.println("触发限流，拒绝请求");
            return;
        }
        System.out.println("限流检查通过");
        passToNext(request);
    }
}

public class BusinessHandler extends RequestHandler {
    public void handle(HttpRequest request) {
        System.out.println("处理业务逻辑：" + request.getPath());
    }
}

// 构建并使用责任链
RequestHandler auth = new AuthHandler();
auth.setNext(new RateLimitHandler()).setNext(new BusinessHandler());
auth.handle(request);
```

**Spring 应用**：Servlet `FilterChain`（`doFilter` 中调用 `chain.doFilter()` 传递请求）；Spring Security `SecurityFilterChain` 由多个 `Filter` 按序组成；Spring MVC `HandlerInterceptor` 拦截器链；Netty `ChannelPipeline`。

**面试追问**：哪些框架用了责任链？Servlet Filter、Spring Security Filter Chain、Spring MVC Interceptor、Dubbo Filter、Netty Pipeline、MyBatis Plugin（拦截器链）都是责任链模式的经典应用。

---

## 面试常问 & 怎么答

### 单例模式有几种实现方式？各自优缺点？

饿汉式（类加载时创建，线程安全但浪费资源）、懒汉式（需加锁）、DCL（双重检查+volatile）、静态内部类（推荐，延迟加载+线程安全）、枚举（最安全，防反射和序列化破坏）。

### JDK 动态代理和 CGLIB 的区别？

JDK 动态代理基于接口 + 反射（`Proxy.newProxyInstance`），要求目标类实现接口。CGLIB 基于继承 + 字节码生成（ASM），不需要接口但不能代理 `final` 类/方法。Spring AOP 默认：有接口用 JDK，无接口用 CGLIB。

### 设计模式的六大原则？

SOLID 五原则 + 迪米特法则（最少知道原则：一个对象应当对其他对象有尽可能少的了解）。

### 你在项目中用过哪些设计模式？

回答模板：说场景 → 说用了什么模式 → 说解决了什么问题。例如：支付系统中使用策略模式封装不同支付方式，新增支付渠道只需实现接口，无需修改原有代码。

---

## 常见陷阱

| 陷阱 | 症状 | 正确做法 |
|------|------|---------|
| 过度设计 | 简单问题用复杂模式，代码难以理解 | 先写直白代码，出现重复或扩展需求再引入模式 |
| 单例滥用 | 所有东西都做成单例，全局状态难以测试 | 只有真正需要全局唯一的才用单例 |
| 模式混淆 | 策略和状态、工厂和建造者分不清 | 理解每个模式解决的核心问题，而非记忆结构 |

---

## 看到什么就先想到这类

- "全局唯一实例" → 单例
- "创建不同子类对象" → 工厂
- "多种可选参数构建" → 建造者
- "动态增强/AOP" → 代理
- "多种算法切换" → 策略
- "事件通知/解耦" → 观察者
- "固定流程+可变步骤" → 模板方法
- "多级校验/过滤" → 责任链
