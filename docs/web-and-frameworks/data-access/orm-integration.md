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
