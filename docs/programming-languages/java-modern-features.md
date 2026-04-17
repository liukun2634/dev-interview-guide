---
title: Java 新特性
---

# Java 新特性

## 概念

Java 8 是现代 Java 的分水岭，引入了 Lambda、Stream、Optional 等函数式编程特性。Java 9–21 持续演进，带来了 Record、Sealed Class、虚拟线程、模式匹配等重要特性，使 Java 更简洁、更安全、更具表达力。

## 核心原理

### 1. Lambda 与函数式接口（Java 8）

**函数式接口**指只有一个抽象方法的接口，可用 `@FunctionalInterface` 注解标记（编译器会做校验）。Lambda 表达式是函数式接口的简洁实现。

```java
@FunctionalInterface
interface Greeting {
    String greet(String name);
}

// Lambda 实现
Greeting g = name -> "Hello, " + name;
System.out.println(g.greet("Java")); // Hello, Java
```

**常用内置函数式接口：**

| 接口 | 签名 | 用途 |
|------|------|------|
| `Function<T, R>` | `R apply(T t)` | 转换，有入参有返回值 |
| `Consumer<T>` | `void accept(T t)` | 消费，有入参无返回值 |
| `Supplier<T>` | `T get()` | 供给，无入参有返回值 |
| `Predicate<T>` | `boolean test(T t)` | 断言，有入参返回 boolean |

```java
Function<String, Integer> strLen = String::length;
Consumer<String> printer = System.out::println;
Supplier<List<String>> listFactory = ArrayList::new;
Predicate<String> isEmpty = String::isEmpty;
```

**方法引用（`::`）四种形式：**

```java
// 1. 静态方法引用：ClassName::staticMethod
Function<String, Integer> parseInt = Integer::parseInt;

// 2. 实例方法引用（任意实例）：ClassName::instanceMethod
Function<String, String> toUpper = String::toUpperCase;

// 3. 实例方法引用（特定实例）：instance::method
String prefix = "Hello";
Predicate<String> startsWith = prefix::equals;

// 4. 构造方法引用：ClassName::new
Supplier<ArrayList<String>> newList = ArrayList::new;
```

---

### 2. Stream API（Java 8）

Stream 是对集合进行声明式、可链式操作的抽象。Stream 本身不存储数据，操作分为**中间操作**（惰性，返回新 Stream）和**终端操作**（触发执行，返回结果）。

**创建流：**

```java
// 从集合
List<String> list = List.of("a", "b", "c");
Stream<String> s1 = list.stream();

// 从数组
Stream<String> s2 = Arrays.stream(new String[]{"x", "y"});

// 直接指定元素
Stream<Integer> s3 = Stream.of(1, 2, 3);

// 无限流
Stream<Integer> s4 = Stream.iterate(0, n -> n + 1);
```

**常用中间操作：**

```java
List<String> names = List.of("Alice", "Bob", "Charlie", "Anna");

List<String> result = names.stream()
    .filter(name -> name.startsWith("A"))       // 过滤
    .map(String::toUpperCase)                   // 转换
    .sorted()                                   // 排序
    .distinct()                                 // 去重
    .collect(Collectors.toList());

// flatMap：将每个元素映射为一个 Stream，然后展平
List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3, 4));
List<Integer> flat = nested.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList());
// [1, 2, 3, 4]
```

**常用终端操作：**

```java
// forEach
names.stream().forEach(System.out::println);

// reduce：聚合
int sum = Stream.of(1, 2, 3, 4).reduce(0, Integer::sum); // 10

// count / min / max
long count = names.stream().filter(n -> n.length() > 3).count();
Optional<String> shortest = names.stream().min(Comparator.comparingInt(String::length));
```

**Collectors 常用方法：**

```java
List<Person> people = List.of(
    new Person("Alice", 30, "Engineering"),
    new Person("Bob", 25, "Marketing"),
    new Person("Charlie", 35, "Engineering")
);

// toList
List<String> nameList = people.stream()
    .map(Person::name)
    .collect(Collectors.toList());

// toMap
Map<String, Integer> nameToAge = people.stream()
    .collect(Collectors.toMap(Person::name, Person::age));

// groupingBy：按部门分组
Map<String, List<Person>> byDept = people.stream()
    .collect(Collectors.groupingBy(Person::department));

// joining：拼接字符串
String joined = people.stream()
    .map(Person::name)
    .collect(Collectors.joining(", ", "[", "]"));
// [Alice, Bob, Charlie]

// 统计示例：各部门平均年龄
Map<String, Double> avgAgeByDept = people.stream()
    .collect(Collectors.groupingBy(
        Person::department,
        Collectors.averagingInt(Person::age)
    ));
```

**并行流（parallelStream）注意事项：**

```java
// 并行流利用 ForkJoinPool 并行处理，适合数据量大且操作无副作用的场景
long sum = LongStream.rangeClosed(1, 1_000_000)
    .parallel()
    .sum();

// 注意事项：
// 1. 操作必须是无状态、无副作用的（避免修改共享变量）
// 2. 数据量小时并行反而更慢（线程调度开销）
// 3. 避免在并行流中使用 forEach 向非线程安全集合添加元素
// 错误示例：
List<Integer> unsafe = new ArrayList<>();
Stream.of(1,2,3).parallel().forEach(unsafe::add); // 线程不安全！

// 正确做法：
List<Integer> safe = Stream.of(1, 2, 3)
    .parallel()
    .collect(Collectors.toList()); // collect 是线程安全的
```

---

### 3. Optional（Java 8）

`Optional<T>` 是一个容器，明确表示"值可能不存在"，目的是消灭随处可见的 `NullPointerException`。

**为什么引入：** 传统方法返回 `null` 时，调用方往往忘记判空，导致运行时异常。`Optional` 强迫调用方在编译时考虑空值情况。

**正确用法：**

```java
// 创建
Optional<String> present = Optional.of("hello");
Optional<String> empty = Optional.empty();
Optional<String> nullable = Optional.ofNullable(null); // 可以传 null

// 链式调用——推荐
String result = Optional.ofNullable(getUserName())
    .map(String::trim)
    .filter(s -> !s.isEmpty())
    .map(String::toUpperCase)
    .orElse("ANONYMOUS");

// orElseGet：惰性求值，适合创建默认值开销较大时
String name = Optional.ofNullable(getUserName())
    .orElseGet(() -> generateDefaultName());

// orElseThrow：值不存在时抛出异常
String required = Optional.ofNullable(getValue())
    .orElseThrow(() -> new IllegalStateException("值不能为空"));

// ifPresent：有值时执行操作
Optional.ofNullable(getUser()).ifPresent(user -> sendEmail(user));
```

**反模式（避免）：**

```java
// 反模式：用 isPresent() + get() 等同于判空，意义全无
Optional<String> opt = Optional.ofNullable(getName());
if (opt.isPresent()) {
    System.out.println(opt.get()); // 不如直接判 null
}

// 反模式：用 Optional 作为方法参数或字段类型
// Optional 设计目的是作为返回类型，不应作为参数或字段
public void process(Optional<String> name) { ... } // 不推荐
```

---

### 4. Record 类（Java 16）

Record 是一种不可变的数据载体类，编译器自动生成构造器、getter（方法名与字段同名）、`equals`、`hashCode`、`toString`。

```java
// 定义一个 Record
record Point(int x, int y) {}

// 使用
Point p = new Point(3, 4);
System.out.println(p.x());     // 3（getter 与字段同名）
System.out.println(p);         // Point[x=3, y=4]

// 可以添加自定义方法
record Person(String name, int age) {
    // 紧凑构造器（Compact Constructor）：用于参数校验
    Person {
        if (age < 0) throw new IllegalArgumentException("年龄不能为负");
    }

    String greeting() {
        return "Hi, I'm " + name;
    }
}
```

**适用场景：** DTO（数据传输对象）、值对象、函数返回多个值、配置数据。

**限制：**
- 不能继承其他类（隐式继承 `java.lang.Record`）
- 所有字段隐式为 `private final`，不可变
- 不能声明实例字段（只有 Record 组件）

---

### 5. Sealed Class（Java 17）

Sealed Class 限制哪些类可以继承或实现它，用 `permits` 关键字声明允许的子类，使类层次结构封闭可知。

```java
// 密封接口
sealed interface Shape permits Circle, Rectangle, Triangle {}

// 子类必须是 final、sealed 或 non-sealed 之一
record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}
final class Triangle implements Shape {
    // ...
}

// 与模式匹配配合，编译器能做穷举检查
double area(Shape shape) {
    return switch (shape) {
        case Circle c    -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.width() * r.height();
        case Triangle t  -> 0; // 简化
        // 无需 default，编译器知道已穷举
    };
}
```

**价值：** 比枚举更灵活（子类可以有状态），比开放继承更安全（编译器能做穷举分析）。

---

### 6. 虚拟线程（Java 21 / Project Loom）

**平台线程 vs 虚拟线程：**

| 维度 | 平台线程（OS Thread） | 虚拟线程（Virtual Thread） |
|------|----------------------|--------------------------|
| 创建成本 | 重（~1MB 栈，系统调用） | 轻（几 KB，JVM 管理） |
| 数量上限 | 数千 | 数百万 |
| 阻塞行为 | 阻塞时占用 OS 线程 | 阻塞时释放 OS 线程 |
| 调度 | OS 调度 | JVM 调度（挂载到 carrier thread） |

```java
// 创建虚拟线程
Thread vt = Thread.ofVirtual().start(() -> {
    System.out.println("虚拟线程运行中：" + Thread.currentThread().isVirtual());
});

// 使用 ExecutorService（推荐方式）
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100_000; i++) {
        executor.submit(() -> {
            Thread.sleep(Duration.ofMillis(100)); // 阻塞时释放 carrier thread
            return "done";
        });
    }
}

// Spring Boot 3.2+ 一行开启
// application.properties:
// spring.threads.virtual.enabled=true
```

**适用场景：**
- I/O 密集型：HTTP 请求、数据库查询、文件读写（大量阻塞等待）
- 高并发服务端：每个请求一个虚拟线程，取代线程池调优

**不适用场景：**
- CPU 密集型计算（虚拟线程不能并行运行 CPU 任务，仍受 carrier thread 数量限制）
- 使用 `synchronized` 持有锁的代码（Java 21 中 synchronized 会 pin 住 carrier thread，建议换用 `ReentrantLock`）

---

### 7. 模式匹配（Java 16/21）

**instanceof 模式匹配（Java 16）：** 消除强制转型的冗余代码。

```java
// 旧写法
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
}

// 新写法：模式变量 s 自动绑定
if (obj instanceof String s) {
    System.out.println(s.length());
}

// 还可以加条件
if (obj instanceof String s && s.length() > 5) {
    System.out.println("长字符串：" + s);
}
```

**switch 模式匹配（Java 21）：** switch 可以对类型进行匹配。

```java
sealed interface Expr permits Num, Add, Mul {}
record Num(int value) implements Expr {}
record Add(Expr left, Expr right) implements Expr {}
record Mul(Expr left, Expr right) implements Expr {}

int eval(Expr expr) {
    return switch (expr) {
        case Num(int v)          -> v;                          // Record 解构
        case Add(var l, var r)   -> eval(l) + eval(r);         // 嵌套解构
        case Mul(var l, var r)   -> eval(l) * eval(r);
    };
}

// 带 guard（when 子句）
String classify(Object obj) {
    return switch (obj) {
        case Integer i when i < 0  -> "负整数";
        case Integer i when i == 0 -> "零";
        case Integer i             -> "正整数";
        case String s              -> "字符串：" + s;
        default                    -> "其他";
    };
}
```

---

## 面试常问 & 怎么答

**Q1：Stream 的 `map` 和 `flatMap` 有什么区别？**

`map` 将每个元素一对一地转换为另一个元素，结果是 `Stream<R>`；`flatMap` 将每个元素映射为一个 `Stream<R>`，再把所有子 Stream **展平**合并成一个 Stream，用于处理"一对多"的转换场景。

```java
// map：String -> Integer（一对一）
Stream<Integer> lengths = Stream.of("a", "bb", "ccc")
    .map(String::length); // Stream<Integer>: [1, 2, 3]

// flatMap：String -> Stream<Character>（一对多，展平）
Stream<String> words = Stream.of("hello world", "foo bar");
List<String> tokens = words
    .flatMap(s -> Arrays.stream(s.split(" ")))
    .collect(Collectors.toList());
// ["hello", "world", "foo", "bar"]

// 如果用 map，结果是 Stream<String[]>，嵌套结构，通常不是想要的
```

记忆口诀：`map` 换元素，`flatMap` 换元素并压平一层嵌套。

---

**Q2：虚拟线程和平台线程有什么区别？什么时候用虚拟线程？**

平台线程与 OS 线程一一对应，创建成本高（约 1MB 栈），数量受限（通常几千）。虚拟线程由 JVM 管理，创建成本极低（几 KB），可以轻松创建数百万个。

核心差异在阻塞行为：平台线程阻塞时占用 OS 线程；虚拟线程阻塞（如等待 I/O）时会自动卸载，释放底层 carrier thread 去执行其他虚拟线程，从而大幅提升吞吐量。

**用虚拟线程的时机：** I/O 密集型高并发场景，例如每个 HTTP 请求分配一个虚拟线程，可以取代线程池调优，代码以同步方式编写却获得异步的吞吐。

**不适合：** CPU 密集型任务（仍受核心数限制，用虚拟线程无增益）；使用 `synchronized` 持有锁时虚拟线程会被 pin 住，应改用 `ReentrantLock`。

---

**Q3：Optional 的正确使用方式是什么？**

`Optional` 的设计意图是作为**方法返回类型**，明确表达"此方法可能没有结果"，而不是消灭所有 null。

正确做法是使用链式 API：`map` / `filter` 变换，`orElse` / `orElseGet` 提供默认值，`orElseThrow` 在值缺失时抛异常，`ifPresent` / `ifPresentOrElse` 执行副作用。

反模式要避免：
1. 用 `isPresent()` + `get()` 的判空写法，与直接判 `null` 无本质区别；
2. 将 `Optional` 用作方法参数或字段类型（序列化不友好、API 语义混乱）；
3. 对 `Optional` 调用 `get()` 而不先确保有值（会抛 `NoSuchElementException`）。

```java
// 推荐的链式写法
return Optional.ofNullable(repo.findByName(name))
    .map(User::getEmail)
    .orElseThrow(() -> new UserNotFoundException(name));
```

---

## 看到什么就先想到这类

| 看到的关键词 | 第一反应 |
|-------------|---------|
| Lambda / `->` | 函数式接口，检查是否有 `@FunctionalInterface` |
| `stream().filter().map().collect()` | Stream 流水线，注意中间操作惰性、终端操作触发执行 |
| `flatMap` | 一对多转换 + 展平，常见于处理嵌套集合或 `Optional` 链 |
| `Optional.ofNullable` | 链式消费，不要 `isPresent + get` |
| `record` 关键字 | 不可变值对象，自动生成标准方法，适合 DTO |
| `sealed` + `permits` | 封闭类层次，配合 switch 模式匹配做穷举 |
| `Thread.ofVirtual()` / `newVirtualThreadPerTaskExecutor` | 虚拟线程，I/O 密集型高并发 |
| `instanceof X x` | 模式匹配，无需强转 |
| `switch` 匹配类型 + `when` | Java 21 switch 模式匹配，注意配合 sealed class 无需 default |
| `parallelStream` | 并行流，确认操作无副作用，数据量要够大 |
