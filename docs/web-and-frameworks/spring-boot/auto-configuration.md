---
title: 自动配置原理
---

# 自动配置原理

## @SpringBootApplication 拆解

```java
@SpringBootApplication
// 等价于以下三个注解的组合：
@SpringBootConfiguration    // 标识为配置类（本质就是 @Configuration）
@EnableAutoConfiguration    // 开启自动配置（核心）
@ComponentScan              // 扫描当前包及子包下的 @Component
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

**启动类放在根包下的原因：** @ComponentScan 默认扫描启动类所在包及其子包，放在根包下可以自动扫描所有业务代码。

## 自动配置加载机制

### Spring Boot 2.x

通过 `SpringFactoriesLoader` 加载 `META-INF/spring.factories` 文件：

```properties
# spring-boot-autoconfigure.jar 中的 spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,\
  org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration,\
  ...
```

### Spring Boot 3.x

改用专用文件 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`：

```
org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration
```

**为什么改？** spring.factories 混合了多种用途（AutoConfiguration、Listener、Initializer 等），专用文件更清晰，加载更快。

## 条件注解体系

自动配置类通过条件注解决定是否生效：

| 注解 | 条件 | 示例 |
|------|------|------|
| @ConditionalOnClass | classpath 上存在指定类 | 有 DataSource.class 才配置数据源 |
| @ConditionalOnMissingClass | classpath 上不存在指定类 | |
| @ConditionalOnBean | 容器中存在指定 Bean | |
| @ConditionalOnMissingBean | 容器中不存在指定 Bean | 用户没自定义就用默认的 |
| @ConditionalOnProperty | 配置属性匹配指定值 | `spring.cache.type=redis` |
| @ConditionalOnWebApplication | 是 Web 应用 | |
| @ConditionalOnJava | Java 版本匹配 | |

### 自动配置生效流程

```
classpath 上有相关类？ → 用户有自定义 Bean？ → 配置属性满足？ → 自动配置生效
      ↓ 没有                    ↓ 有                  ↓ 不满足
    跳过                   跳过（用户优先）           跳过
```

**核心原则：用户配置永远优先。** @ConditionalOnMissingBean 保证了用户自定义的 Bean 不会被覆盖。

### 典型自动配置示例

```java
@AutoConfiguration
@ConditionalOnClass(DataSource.class)                    // classpath 有 DataSource
@EnableConfigurationProperties(DataSourceProperties.class) // 绑定配置属性
public class DataSourceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean                             // 用户没自定义 DataSource
    public DataSource dataSource(DataSourceProperties properties) {
        return DataSourceBuilder.create()
                .url(properties.getUrl())
                .username(properties.getUsername())
                .password(properties.getPassword())
                .build();
    }
}
```

## Starter 机制

一个 Starter 由两部分组成：

| 组件 | 职责 | 命名 |
|------|------|------|
| starter | 引入依赖（pom 依赖聚合） | `spring-boot-starter-{name}` |
| autoconfigure | 提供自动配置类 | `spring-boot-{name}-autoconfigure` |

**官方 Starter** 命名：`spring-boot-starter-*`（如 `spring-boot-starter-web`）

**第三方 Starter** 命名：`*-spring-boot-starter`（如 `mybatis-spring-boot-starter`）

### 自定义 Starter 步骤

1. 创建 autoconfigure 模块：编写自动配置类 + 条件注解 + 配置属性类
2. 注册到 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
3. 创建 starter 模块：只包含 pom，依赖 autoconfigure 模块和所需的第三方库
4. 用户引入 starter 依赖即可自动生效

### 自定义 Starter 完整示例（必背模板）

**面试经常追问"你写过 starter 吗？怎么写的？"**——能完整答出三步骤+条件注解+ConfigurationProperties，立刻显出 Spring Boot 工程经验。

#### 步骤 1：定义配置属性类

```java
@ConfigurationProperties(prefix = "myservice")
@Data
public class MyServiceProperties {
    private boolean enabled = true;
    private String endpoint = "http://localhost:8080";
    private int timeout = 5000;
}
```

#### 步骤 2：编写自动配置类

```java
@AutoConfiguration                                          // ← Boot 3 替代 @Configuration + @AutoConfigureOrder
@ConditionalOnClass(MyServiceClient.class)                  // 只有客户端类在 classpath 才生效
@ConditionalOnProperty(prefix = "myservice", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(MyServiceProperties.class)   // 启用属性绑定
public class MyServiceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean                               // 用户没自定义才创建
    public MyServiceClient myServiceClient(MyServiceProperties props) {
        return new MyServiceClient(props.getEndpoint(), props.getTimeout());
    }
}
```

#### 步骤 3：注册到 AutoConfiguration.imports（**Boot 3 新规范**）

```
src/main/resources/META-INF/spring/
└── org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

```
# 文件内容（每行一个全限定类名）
com.example.myservice.autoconfigure.MyServiceAutoConfiguration
```

::: tip 💡 Spring Boot 2 vs 3 关键差异

| 维度 | Boot 2 | **Boot 3** |
|------|--------|---------|
| **注册文件** | `META-INF/spring.factories` | **`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`** |
| **文件格式** | `key=value1,value2` 多种用途共用 | **每行一个类，更清晰** |
| **入口注解** | `@Configuration` + 顺序注解 | **`@AutoConfiguration`** 单注解 |
| **加载机制** | `SpringFactoriesLoader` | **`ImportCandidates`** |
| **配置元数据** | spring-configuration-metadata.json | 同 |

**为什么改？** ① spring.factories 混合了 AutoConfiguration、Listener、Initializer 等不同用途，难维护；② 新文件每行一个类，加载更快、Native Image 编译友好；③ 与 Spring Framework 解耦。

:::

### Boot 3 启动加速：从 spring.factories 到 ImportCandidates

```
Boot 2 启动流程（慢）:
  SpringFactoriesLoader 扫描所有 jar 的 spring.factories
  → 每个文件解析 key=value
  → 一次性把所有 EnableAutoConfiguration 类加载到内存
  → 应用 @Conditional 过滤

Boot 3 启动流程（快）:
  ImportCandidates 只扫描 META-INF/spring/*.imports
  → 每行一个类，无需解析复杂键值
  → 更快加载 + Native Image 提前编译时可静态分析
```

实测：**中型项目启动时间减少 5-10%**，Native Image 编译时间显著缩短。

## 调试自动配置

```yaml
# application.yml — 查看哪些自动配置生效/未生效
debug: true
```

启动时会打印：
- **Positive matches** — 生效的自动配置及匹配的条件
- **Negative matches** — 未生效的自动配置及不满足的条件

也可以通过 Actuator：`GET /actuator/conditions`

## SPI 机制深度：Java SPI vs Spring SPI

**SPI（Service Provider Interface）是 Spring Boot 自动装配的灵魂**。理解 Java SPI、Spring SPI 和 Dubbo SPI 的差异，是高级 Java 面试的硬通货。

### 三种 SPI 对比

| 维度 | **Java SPI** | **Spring SPI** | **Dubbo SPI** |
|------|------------|--------------|-------------|
| **文件位置** | `META-INF/services/<接口全名>` | `META-INF/spring.factories` (2) / `*.imports` (3) | `META-INF/dubbo/<接口全名>` |
| **加载机制** | `ServiceLoader.load()` | `SpringFactoriesLoader` / `ImportCandidates` | `ExtensionLoader.getExtension(name)` |
| **加载粒度** | **一次性加载所有实现** | 一次性加载所有 | **按名称懒加载** |
| **是否支持 IOC** | ❌ | ❌（只是类加载）| **✅** |
| **是否支持 AOP** | ❌ | ❌ | **✅**（Wrapper 机制）|
| **典型应用** | JDBC Driver、SLF4J | Spring Boot 自动配置 | Dubbo 协议/序列化/集群 |

### Java SPI 经典案例：JDBC Driver

```java
// 1. 接口
public interface java.sql.Driver { ... }

// 2. MySQL Connector 在 META-INF/services/java.sql.Driver 中写入：
// com.mysql.cj.jdbc.Driver

// 3. Java SPI 加载：
ServiceLoader<Driver> loader = ServiceLoader.load(Driver.class);
for (Driver d : loader) { /* 注册到 DriverManager */ }
```

这就是为什么**只需要引入 mysql-connector jar，JDBC 就能自动找到驱动**——纯靠 Java SPI。

### Java SPI 的三大缺陷（Dubbo 为什么自研）

::: warning ⚠️ Java SPI 不适合复杂场景

> ① **必须一次性加载所有实现**，浪费资源；② **不支持按名称取指定实现**（要遍历）；③ **不支持依赖注入**——加载的对象不能 `@Autowired` 其他 Bean。
> 
> Dubbo SPI 解决了全部三个问题，所以阿里所有 RPC/序列化/负载均衡都用 Dubbo SPI 而非 Java SPI。

:::

## 面试常问 & 怎么答

### Q1: 自动配置的加载流程？

@EnableAutoConfiguration 触发加载 META-INF 下的自动配置类列表（Boot 2 用 spring.factories，Boot 3 用 AutoConfiguration.imports）。每个配置类上有条件注解，Spring 依次检查：classpath 有没有相关类、容器有没有用户自定义的 Bean、配置属性是否满足。全部通过才自动注册 Bean。

### Q2: @ConditionalOnMissingBean 的作用？

保证用户配置优先。如果用户已经自定义了一个同类型的 Bean，自动配置就不再创建默认的。这是"约定优于配置"的核心 — 不配置就用默认值，配置了就用你的。

### Q3: 如何自定义 Starter？

两个模块：autoconfigure 模块写自动配置类（@AutoConfiguration + 条件注解 + @ConfigurationProperties），注册到 AutoConfiguration.imports 文件；starter 模块只是一个 pom，引入 autoconfigure 和所需依赖。用户引入 starter 即可自动生效。

## 看到什么就先想到这类

- 出现 @SpringBootApplication、@EnableAutoConfiguration。
- 出现 spring.factories、AutoConfiguration.imports。
- 出现 @ConditionalOnClass、@ConditionalOnMissingBean。
- 出现 Starter 原理、自定义 Starter。
