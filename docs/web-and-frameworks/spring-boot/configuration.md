---
title: 配置体系与 Profile
---

# 配置体系与 Profile

## 配置文件格式

Spring Boot 支持两种格式，功能等价：

```properties
# application.properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/mydb
```

```yaml
# application.yml（推荐 — 层级清晰）
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb
```

**yml 注意事项：** 缩进只能用空格不能用 Tab，冒号后必须有空格。

## 配置加载优先级

从高到低（高优先级覆盖低优先级）：

| 优先级 | 来源 |
|--------|------|
| 1 | 命令行参数（`--server.port=9090`） |
| 2 | 环境变量（`SERVER_PORT=9090`） |
| 3 | `application-{profile}.yml` |
| 4 | `application.yml` |
| 5 | @PropertySource 指定的文件 |
| 6 | 代码中的默认值 |

**文件位置优先级：** `config/` 子目录 > 项目根目录 > classpath `/config/` > classpath 根目录。

**实际开发中：** 开发用 application-dev.yml，测试用 application-test.yml，生产用环境变量或命令行参数覆盖敏感配置（数据库密码等）。

## Profile 机制

```yaml
# application.yml — 指定激活的 Profile
spring:
  profiles:
    active: dev

---
# application-dev.yml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/dev_db

---
# application-prod.yml
server:
  port: 80
spring:
  datasource:
    url: jdbc:mysql://prod-server:3306/prod_db
```

**激活方式：**
- 配置文件：`spring.profiles.active=dev`
- 命令行：`--spring.profiles.active=prod`
- 环境变量：`SPRING_PROFILES_ACTIVE=prod`

**Profile 组（Spring Boot 2.4+）：**

```yaml
spring:
  profiles:
    group:
      prod:
        - prod-db
        - prod-cache
        - prod-mq
```

## 配置绑定

### @Value

```java
@Component
public class MyService {
    @Value("${app.name:默认值}")    // ${key:default}
    private String appName;
    
    @Value("${app.max-retry:3}")
    private int maxRetry;
}
```

缺点：散落在各处，类型不安全，难以管理。

### @ConfigurationProperties（推荐）

```java
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String name;
    private int maxRetry = 3;        // 默认值
    private Security security = new Security();
    
    // getter/setter 或用 @Data
    
    public static class Security {
        private String secretKey;
        private long tokenExpiry = 3600;
        // getter/setter
    }
}
```

```yaml
app:
  name: MyApp
  max-retry: 5
  security:
    secret-key: my-secret
    token-expiry: 7200
```

**启用方式：** 在配置类上加 `@EnableConfigurationProperties(AppProperties.class)` 或在 AppProperties 上加 `@Component`。

### @Value vs @ConfigurationProperties

| 对比项 | @Value | @ConfigurationProperties |
|--------|--------|--------------------------|
| 类型安全 | ❌ 字符串注入，类型错误运行时报错 | ✅ 类型安全，启动时校验 |
| 结构化 | ❌ 每个字段单独注入 | ✅ 前缀绑定，支持嵌套对象 |
| 校验 | ❌ 不支持 | ✅ 支持 @Validated + JSR 303 |
| IDE 支持 | 一般 | ✅ 可生成 metadata，有自动补全 |
| 适用场景 | 少量简单配置 | 一组相关配置 |

## Actuator 监控

Spring Boot Actuator 提供应用监控和管理端点：

| 端点 | 说明 |
|------|------|
| /actuator/health | 健康检查（UP/DOWN） |
| /actuator/info | 应用信息 |
| /actuator/metrics | 度量指标（JVM、HTTP 请求统计等） |
| /actuator/env | 环境配置（所有配置来源和值） |
| /actuator/beans | 所有 Spring Bean 列表 |
| /actuator/conditions | 自动配置匹配报告 |
| /actuator/mappings | 所有 @RequestMapping 映射 |

### 生产环境安全配置

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics   # 只暴露必要端点
  endpoint:
    health:
      show-details: when-authorized    # 认证后才显示详情
```

**默认只暴露 /health 和 /info**，生产环境不要暴露 /env（会泄露配置和密码）。

### 自定义健康检查

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        if (isDatabaseReachable()) {
            return Health.up().withDetail("database", "MySQL 连接正常").build();
        }
        return Health.down().withDetail("database", "MySQL 连接失败").build();
    }
}
```

## 面试常问 & 怎么答

### Q1: 配置加载优先级？

命令行参数 > 环境变量 > application-{profile}.yml > application.yml > 默认值。高优先级覆盖低优先级。生产环境的敏感配置通常用环境变量或命令行参数，不写在配置文件里。

### Q2: @Value 和 @ConfigurationProperties 的区别？

@Value 是单个值注入，字符串类型，散落在代码各处；@ConfigurationProperties 是前缀绑定，类型安全，支持嵌套和校验，IDE 有自动补全。一组相关配置推荐用 @ConfigurationProperties，少量简单值用 @Value。

### Q3: Actuator 有哪些常用端点？

/health（健康检查）、/info（应用信息）、/metrics（度量指标）、/env（环境配置）、/conditions（自动配置报告）。生产环境只暴露必要端点（health、info），/env 不能对外暴露（会泄露密码）。

## 看到什么就先想到这类

- 出现 application.yml / application.properties。
- 出现 Profile、spring.profiles.active、多环境配置。
- 出现 @Value、@ConfigurationProperties。
- 出现 Actuator、/health、/metrics。
