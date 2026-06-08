---
title: 配置体系与 Profile
---

# 配置体系与 Profile

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥🔥 高频</span>

::: tip 💡 核心要点
配置加载优先级、Profile 机制、`@Value` vs `@ConfigurationProperties` 是面试三连。2026 必背：**`spring.config.import`（Boot 2.4+ 替代 `bootstrap.yml`）**、**`@ConfigurationProperties + @Validated` 启动期校验**、**`@RefreshScope` 3 大坑**。生产经验：环境变量覆盖文件、不暴露 `/actuator/env`。
:::

---

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

## spring.config.import：现代统一配置导入（Boot 2.4+）

::: tip 💡 2026 必背：替代 `bootstrap.yml` 的标准方式
Boot 2.4 重写了配置加载机制，引入 **`spring.config.import`**。它**替代了** `bootstrap.yml`、`@PropertySource`、`spring.cloud.config.uri` 等多种碎片化方案，**统一为一个声明式入口**。
:::

```yaml
spring:
  config:
    import:
      - optional:file:./config/local.yml       # 本地可选文件
      - optional:configtree:/etc/secrets/      # K8s ConfigMap/Secret 挂载目录
      - optional:configserver:                 # Spring Cloud Config Server
      - optional:nacos:my-app.yml              # Nacos（spring-cloud-starter-alibaba-nacos-config）
      - optional:consul:/config/my-app/        # Consul KV
```

| 前缀 | 来源 | 备注 |
|------|------|------|
| `file:` / `classpath:` | 本地/JAR 内文件 | 替代 `@PropertySource` |
| `configtree:` | 目录树（每个文件 = 一个配置项） | **K8s Secret/ConfigMap 首选** |
| `configserver:` | Spring Cloud Config | 替代 `bootstrap.yml` |
| `nacos:` / `consul:` / `vault:` | 各配置中心 | 由对应 Starter 提供 |
| `optional:` | 加 `optional:` 前缀文件不存在不报错 | 强烈推荐 |

**Boot 2.4+ 不再需要 `bootstrap.yml`**：所有外部配置加载移至 `spring.config.import`，启动阶段更可控、错误信息更清晰。老项目升级时移除 `spring-cloud-starter-bootstrap` 依赖即可。

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

### @ConfigurationProperties + @Validated 启动期校验（强烈推荐）

```java
@ConfigurationProperties(prefix = "app")
@Validated                          // ★ 启动时校验
public record AppProperties(
    @NotBlank String name,
    @Min(1) @Max(65535) int port,
    @Email String contact,
    @DurationMin(seconds = 1) Duration timeout,
    @Valid Security security        // 嵌套对象也要 @Valid 才会递归校验
) {
    public record Security(@NotEmpty String jwtSecret, @Min(60) long expiresSec) {}
}
```

**收益**：配置错了**应用启动失败**而不是上线后运行时崩溃；错误信息精准到字段。Boot 3.x **要求显式引入** `spring-boot-starter-validation`。

### 动态刷新：@RefreshScope（Spring Cloud）

```java
@RefreshScope                       // ★ Bean 在配置变更时重新创建
@Component
public class RateLimiter {
    @Value("${rate.limit.qps}") int qps;
}
```

调用 POST `/actuator/refresh`（或 Nacos / Apollo 推送）后，**只有标了 `@RefreshScope` 的 Bean 重建**，其余 singleton 不受影响。

::: warning ⚠️ @RefreshScope 三大坑
1. **`@RefreshScope` 是基于代理的作用域** → 与 `@Async` / `@Transactional` 同类失效规则一致（自调用不生效）
2. **不要在 `@RefreshScope` Bean 上加 `@PostConstruct` 做重资源初始化** → 每次刷新都会重新执行
3. **被注入 `@RefreshScope` Bean 的其他 singleton 仍持有旧引用** → 必须也注入代理（`@Lazy` 或 `ObjectProvider`）
:::

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
