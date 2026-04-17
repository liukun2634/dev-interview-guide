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

## 调试自动配置

```yaml
# application.yml — 查看哪些自动配置生效/未生效
debug: true
```

启动时会打印：
- **Positive matches** — 生效的自动配置及匹配的条件
- **Negative matches** — 未生效的自动配置及不满足的条件

也可以通过 Actuator：`GET /actuator/conditions`

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
