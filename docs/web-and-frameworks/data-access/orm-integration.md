---
title: JPA 与 MyBatis 集成
---

# JPA 与 MyBatis 集成

## Spring Data JPA vs MyBatis 选型

| 对比项 | Spring Data JPA | MyBatis |
|--------|----------------|---------|
| 开发效率 | ✅ 高（方法名推导、无 SQL） | 中等（需写 SQL） |
| SQL 控制 | ❌ 弱（复杂查询需 @Query 或原生 SQL） | ✅ 强（完全控制 SQL） |
| 灵活性 | 低（ORM 思维，表结构映射对象） | ✅ 高（SQL 思维，适合复杂查询） |
| 学习成本 | 中等（JPA 规范 + Hibernate） | 低（会 SQL 就能上手） |
| 适用场景 | CRUD 为主、领域模型清晰 | 复杂查询多、报表统计、遗留数据库 |
| 国内使用 | 外企、Spring 生态深度用户 | ✅ 国内主流 |

**选型建议：** 国内大多数项目用 MyBatis（SQL 控制力强，团队熟悉）。如果是 CRUD 为主、领域模型清晰、追求开发效率的项目，可以用 JPA。两者也可以共存。

## Spring Data JPA 核心用法

### Repository 接口

```java
// 只需定义接口，Spring Data 自动生成实现
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 方法名推导查询 — 不需要写 SQL
    List<User> findByUsername(String username);
    List<User> findByAgeGreaterThanAndStatus(int age, String status);
    Optional<User> findByEmail(String email);
    
    // @Query — 自定义 JPQL
    @Query("SELECT u FROM User u WHERE u.department.id = :deptId")
    List<User> findByDepartment(@Param("deptId") Long deptId);
    
    // 原生 SQL
    @Query(value = "SELECT * FROM users WHERE created_at > :date", nativeQuery = true)
    List<User> findRecentUsers(@Param("date") LocalDate date);
}
```

### JPA 核心注解

| 注解 | 说明 |
|------|------|
| @Entity | 标记实体类 |
| @Table | 指定表名 |
| @Id | 主键 |
| @GeneratedValue | 主键生成策略（IDENTITY、SEQUENCE、AUTO） |
| @Column | 列映射 |
| @OneToMany / @ManyToOne | 关联关系 |
| @Transient | 不映射到数据库 |

## MyBatis 核心用法

### XML 映射（主流）

```java
// Mapper 接口
@Mapper
public interface UserMapper {
    User selectById(Long id);
    List<User> selectByCondition(UserQuery query);
    int insert(User user);
    int update(User user);
}
```

```xml
<!-- UserMapper.xml -->
<mapper namespace="com.example.mapper.UserMapper">
    
    <resultMap id="userMap" type="User">
        <id property="id" column="id"/>
        <result property="username" column="user_name"/>
        <result property="createTime" column="created_at"/>
    </resultMap>
    
    <select id="selectById" resultMap="userMap">
        SELECT * FROM users WHERE id = #{id}
    </select>
    
    <!-- 动态 SQL -->
    <select id="selectByCondition" resultMap="userMap">
        SELECT * FROM users
        <where>
            <if test="username != null">
                AND user_name LIKE CONCAT('%', #{username}, '%')
            </if>
            <if test="status != null">
                AND status = #{status}
            </if>
            <if test="minAge != null">
                AND age >= #{minAge}
            </if>
        </where>
        ORDER BY created_at DESC
    </select>
</mapper>
```

### #{} vs ${}

| 语法 | 处理方式 | SQL 注入 | 使用场景 |
|------|----------|----------|----------|
| `#{}` | 预编译（PreparedStatement 参数） | ✅ 安全 | 绝大多数场景 |
| `${}` | 字符串拼接 | ❌ 有风险 | 动态表名、列名、ORDER BY |

```xml
<!-- ✅ 安全 — 预编译 -->
SELECT * FROM users WHERE id = #{id}
<!-- 实际执行: SELECT * FROM users WHERE id = ? -->

<!-- ❌ 危险 — 字符串拼接，可能 SQL 注入 -->
SELECT * FROM users WHERE id = ${id}
<!-- 实际执行: SELECT * FROM users WHERE id = 1 OR 1=1 -->

<!-- $() 的合理用途 — 动态表名 -->
SELECT * FROM ${tableName} WHERE id = #{id}
```

### MyBatis-Plus 简述

MyBatis-Plus 是 MyBatis 的增强工具，在 MyBatis 基础上只做增强不做改变：

- 内置通用 CRUD（BaseMapper）— 单表操作不用写 SQL
- 条件构造器（QueryWrapper / LambdaQueryWrapper）— 链式编程
- 分页插件 — 自动分页
- 代码生成器 — 自动生成 Entity、Mapper、Service

```java
// 继承 BaseMapper 即获得基础 CRUD
public interface UserMapper extends BaseMapper<User> { }

// 条件查询
List<User> users = userMapper.selectList(
    new LambdaQueryWrapper<User>()
        .eq(User::getStatus, "active")
        .ge(User::getAge, 18)
        .orderByDesc(User::getCreateTime)
);
```

## 数据源与连接池

### HikariCP（Spring Boot 默认）

Spring Boot 2.x+ 默认使用 HikariCP，号称最快的连接池。

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: secret
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 20          # 最大连接数（默认 10）
      minimum-idle: 5                # 最小空闲连接
      idle-timeout: 600000           # 空闲超时（10 分钟）
      max-lifetime: 1800000          # 连接最大生命周期（30 分钟）
      connection-timeout: 30000      # 获取连接超时（30 秒）
```

**连接池大小经验公式：** `connections = ((core_count * 2) + effective_spindle_count)`。大多数场景 10-20 足够，过大反而因为上下文切换降低性能。

### 连接池关键参数与坑

| 参数 | 含义 | 生产推荐 | 坑 |
|------|------|---------|------|
| **maximum-pool-size** | 最大连接数 | **10-20**（不要无脑设大）| 设 200 会让 MySQL 反而变慢 |
| **minimum-idle** | 最小空闲 | 等于 max（**HikariCP 官方建议**）| 频繁创建销毁连接慢 |
| **connection-timeout** | 等连接超时 | 3-10 秒 | 默认 30 秒太长，会拖垮上游 |
| **max-lifetime** | 连接最大存活时间 | **比 MySQL wait_timeout 短**（如 28 分钟）| 超过 MySQL 主动断开会报"Connection is closed" |
| **validation-query** | 检测语句 | MySQL 8+ 不需要 | 老版本用 `SELECT 1` |

::: warning ⚠️ 连接池配置 Top 3 坑

> ① **maximum-pool-size 过大**：MySQL 上下文切换瓶颈，500 连接吞吐反而下降；② **max-lifetime > MySQL wait_timeout**：连接被 MySQL 断开但池子不知道，下次借连接报 `Connection is closed`；③ **没设 leak-detection-threshold**：连接泄漏不报警，最后连接耗尽全挂。

:::

## N+1 查询问题：ORM 最经典的性能杀手

**N+1 是 ORM 面试 Top 1 性能题**——能讲清楚是什么、怎么发现、怎么解决，立刻显出对 ORM 的真正理解。

### 什么是 N+1

```java
// JPA 查询用户列表，每个 User 有多个 Order
List<User> users = userRepo.findAll();   // 1 次 SQL: SELECT * FROM user
for (User u : users) {
    System.out.println(u.getOrders());   // N 次 SQL: SELECT * FROM order WHERE user_id=?
}
// 总共 1 + N 次 SQL → N+1 问题
```

**1 次主查询 + N 次关联查询** = 数据量越大 SQL 越多，直接打爆数据库。

### N+1 的根因

| ORM | 触发原因 |
|-----|---------|
| **JPA / Hibernate** | 默认 `@OneToMany / @ManyToOne` 是 LAZY，访问时才发 SQL |
| **MyBatis** | resultMap 配置了 association/collection 且开启了 lazyLoading |

### 4 种解决方案

| 方案 | 适用 ORM | 原理 | 代价 |
|------|---------|------|------|
| **JOIN FETCH** | JPA | `SELECT u FROM User u JOIN FETCH u.orders` 一次 JOIN 取回 | 笛卡尔积，结果集可能膨胀 |
| **`@EntityGraph`** | JPA | 注解声明要立即加载的关联 | 同上 |
| **`IN` 批量查询** | 通用 | 第二次查询用 `WHERE user_id IN (id1, id2, ...)` | 2 次 SQL 替代 N+1 次 |
| **MyBatis nested select** + `fetchType=eager` | MyBatis | 显式控制 | 配置复杂 |

#### JPA 解法示例

```java
// ❌ 触发 N+1
@Query("SELECT u FROM User u WHERE u.status = 1")
List<User> findActiveUsers();

// ✅ 方案 1: JOIN FETCH（一次 JOIN）
@Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders WHERE u.status = 1")
List<User> findActiveUsers();

// ✅ 方案 2: @EntityGraph
@EntityGraph(attributePaths = {"orders"})
@Query("SELECT u FROM User u WHERE u.status = 1")
List<User> findActiveUsers();

// ✅ 方案 3: Hibernate @BatchSize（每次取 50 个 user 的 orders）
@OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
@BatchSize(size = 50)
private List<Order> orders;
// → 1 + ceil(N/50) 次 SQL
```

#### MyBatis 解法

```xml
<!-- 方案 A: 立即加载 + nested select -->
<resultMap id="userMap" type="User">
  <id property="id" column="id"/>
  <collection property="orders" select="findOrdersByUser"
              column="id" fetchType="eager"/>
</resultMap>

<!-- 方案 B: 一次 JOIN（推荐）-->
<resultMap id="userMap" type="User">
  <id property="id" column="u_id"/>
  <collection property="orders" ofType="Order">
    <id property="id" column="o_id"/>
    <result property="amount" column="o_amount"/>
  </collection>
</resultMap>
<select id="findActiveUsers" resultMap="userMap">
  SELECT u.id u_id, o.id o_id, o.amount o_amount
  FROM user u LEFT JOIN order o ON u.id = o.user_id
  WHERE u.status = 1
</select>
```

### 怎么发现 N+1

```properties
# JPA: 打印所有 SQL
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# MyBatis: 启用日志
logging.level.com.example.mapper=DEBUG

# 生产环境: P6Spy 拦截 + 计数告警
# 单接口 SQL 数 > 10 触发告警
```

::: tip 💡 面试黄金回答

> **"N+1 是 ORM 最经典坑——1 次主查询 + N 次关联查询。JPA 用 JOIN FETCH 或 @EntityGraph 一次性 JOIN；如果担心笛卡尔积膨胀，用 @BatchSize 折中。MyBatis 用 nested resultMap 或一次 JOIN。生产用 P6Spy 拦截 SQL 数量做告警，超阈值立即报警。"**

:::

## Hibernate 一级缓存 / 二级缓存

**JPA/Hibernate 缓存机制** 是面试的"加分细节"：

| 缓存 | 范围 | 默认开启 | 适用 |
|------|------|---------|------|
| **一级缓存（Session）** | 单次事务/Session 内 | **是** | 同一事务多次查同一个对象不重复 |
| **二级缓存（SessionFactory）** | 整个应用 | **否** | 读多写少的字典表 / 配置 |
| **查询缓存** | SQL → 结果 | 否 | 几乎不推荐用（命中率低）|

::: warning ⚠️ 一级缓存的"脏读"陷阱

> Hibernate 一级缓存默认开启，但**只对同一对象 ID** 生效。同一事务内：
> ```java
> User u1 = repo.findById(1L);   // 走 DB
> jdbcTemplate.update("UPDATE user SET name='X' WHERE id=1");  // 绕开 ORM
> User u2 = repo.findById(1L);   // 还从一级缓存返回旧数据 → 看不到 X
> ```
> 解决：要么全走 ORM，要么用 `entityManager.clear()` 清缓存。

:::

## 面试常问 & 怎么答

### Q1: JPA 和 MyBatis 怎么选？

看项目需求：CRUD 为主、领域模型清晰选 JPA（开发效率高）；复杂查询多、需要精确控制 SQL 选 MyBatis（灵活性强）。国内大多数项目用 MyBatis，外企和 Spring 深度用户倾向 JPA。两者也可以共存。

### Q2: MyBatis 的 #{} 和 ${} 的区别？

#{} 是预编译参数（PreparedStatement），安全防 SQL 注入，绝大多数场景使用；${} 是字符串拼接，有 SQL 注入风险，只在动态表名、列名、ORDER BY 等不能用预编译的场景使用。

### Q3: 连接池怎么配置？

Spring Boot 默认用 HikariCP。核心参数是 maximum-pool-size（最大连接数，默认 10），经验公式是 CPU 核心数 × 2 + 磁盘数。不要设太大，过多连接反而因上下文切换降低性能。

## 看到什么就先想到这类

- 出现 JPA vs MyBatis 选型。
- 出现 #{} vs ${}、SQL 注入。
- 出现 ResultMap、动态 SQL。
- 出现数据源、连接池、HikariCP。
