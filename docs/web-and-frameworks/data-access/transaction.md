---
title: 事务管理与传播行为
---

# 事务管理与传播行为

## 声明式事务 vs 编程式事务

| 方式 | 实现 | 适用场景 |
|------|------|----------|
| 声明式 | @Transactional 注解 | 绝大多数场景（推荐） |
| 编程式 | TransactionTemplate | 需要精细控制事务边界（如部分提交） |

```java
// 声明式（推荐）
@Transactional
public void createOrder(OrderDTO dto) {
    orderRepo.save(dto.toOrder());
    inventoryService.deduct(dto.getItems());
}

// 编程式
public void createOrder(OrderDTO dto) {
    transactionTemplate.execute(status -> {
        orderRepo.save(dto.toOrder());
        inventoryService.deduct(dto.getItems());
        return null;
    });
}
```

## @Transactional 的 AOP 实现原理

```
调用方 → 代理对象 → 开启事务 → 执行目标方法 → 正常返回？ → 提交事务
                                              → 抛出异常？ → 回滚事务
```

底层流程：
1. Spring 为 @Transactional 标注的 Bean 创建 AOP 代理
2. 代理拦截方法调用 → `TransactionInterceptor` 处理
3. 从 `PlatformTransactionManager` 获取事务（JDBC 的实现是 `DataSourceTransactionManager`）
4. 执行目标方法
5. 无异常 → 提交；有异常 → 检查异常类型决定是否回滚

### @Transactional 常用属性

| 属性 | 说明 | 默认值 |
|------|------|--------|
| propagation | 传播行为 | REQUIRED |
| isolation | 隔离级别 | DEFAULT（使用数据库默认） |
| rollbackFor | 指定回滚的异常类型 | RuntimeException, Error |
| noRollbackFor | 指定不回滚的异常类型 | |
| timeout | 超时时间（秒） | -1（不超时） |
| readOnly | 是否只读 | false |

```java
@Transactional(
    propagation = Propagation.REQUIRED,
    rollbackFor = Exception.class,    // 所有异常都回滚
    timeout = 30,
    readOnly = false
)
public void transfer(Long from, Long to, BigDecimal amount) { ... }
```

**readOnly = true 的好处：** 提示数据库优化（如 MySQL 不加锁），Hibernate 不做脏检查，提升查询性能。

## 7 种事务传播行为

| 传播行为 | 有当前事务时 | 没有当前事务时 | 典型场景 |
|----------|-------------|---------------|----------|
| **REQUIRED**（默认） | 加入当前事务 | 新建事务 | 绝大多数业务方法 |
| **REQUIRES_NEW** | 挂起当前事务，新建事务 | 新建事务 | 日志记录（不受业务回滚影响） |
| **NESTED** | 嵌套事务（Savepoint） | 新建事务 | 批量处理（单条失败不影响整体） |
| SUPPORTS | 加入当前事务 | 以非事务方式执行 | 查询方法 |
| NOT_SUPPORTED | 挂起当前事务，以非事务执行 | 以非事务方式执行 | 不需要事务的操作 |
| MANDATORY | 加入当前事务 | ❌ 抛异常 | 必须在事务中调用的方法 |
| NEVER | ❌ 抛异常 | 以非事务方式执行 | 不允许有事务的方法 |

### REQUIRED vs REQUIRES_NEW vs NESTED

```java
@Service
public class OrderService {
    @Autowired private LogService logService;
    
    @Transactional  // REQUIRED
    public void createOrder() {
        // 1. 保存订单
        orderRepo.save(order);
        
        // 2. 记录日志 — 用 REQUIRES_NEW
        // 即使 createOrder 回滚，日志也会保存
        logService.saveLog("创建订单");
        
        // 3. 扣减库存 — 如果这里抛异常
        // REQUIRED: 整个事务（包括订单）回滚
        // REQUIRES_NEW: 只有库存的事务回滚，订单的事务不受影响
        inventoryService.deduct(items);
    }
}

@Service
public class LogService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveLog(String message) {
        logRepo.save(new Log(message));
    }
}
```

**NESTED 的特殊性：** 嵌套事务通过 Savepoint 实现。内层回滚只回滚到 Savepoint，不影响外层；但外层回滚会连带内层一起回滚。

## 事务隔离级别

Spring 的隔离级别对应数据库的隔离级别：

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|----------|------|-----------|------|
| READ_UNCOMMITTED | ✅ 可能 | ✅ 可能 | ✅ 可能 |
| READ_COMMITTED | ❌ | ✅ 可能 | ✅ 可能 |
| REPEATABLE_READ（MySQL 默认） | ❌ | ❌ | ✅ 可能（MySQL InnoDB 通过 MVCC 基本解决） |
| SERIALIZABLE | ❌ | ❌ | ❌ |

**实际开发中**一般不在 Spring 层指定隔离级别，使用数据库默认值。需要更高隔离级别时在 SQL 层面处理（`SELECT ... FOR UPDATE`）。

## @Transactional 失效的典型场景

### 1. 自调用（最常考）

```java
@Service
public class OrderService {
    public void createOrder() {
        this.validate(); // ❌ this 是原始对象，不经过代理
    }
    
    @Transactional
    public void validate() {
        // 事务不生效！
    }
}
```

**解决：** 将 validate() 移到另一个 Bean，或注入自身代理 `@Autowired private OrderService self`。

### 2. 方法不是 public

Spring AOP 默认只代理 public 方法。protected、private、default 方法上的 @Transactional 不生效。

### 3. 异常类型不对

```java
@Transactional
public void transfer() throws Exception {
    // 抛出 checked exception
    throw new IOException("文件不存在"); // ❌ 默认不回滚！
}
```

**解决：** `@Transactional(rollbackFor = Exception.class)` 指定所有异常都回滚。

### 4. 异常被 catch 吞掉

```java
@Transactional
public void createOrder() {
    try {
        orderRepo.save(order);
        inventoryService.deduct(items); // 抛异常
    } catch (Exception e) {
        log.error("失败", e); // ❌ 吞掉了异常，事务不知道需要回滚
    }
}
```

**解决：** catch 后重新 throw，或手动 `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()`。

### 5. 数据库引擎不支持事务

MySQL 的 MyISAM 引擎不支持事务，只有 InnoDB 支持。Spring 的 @Transactional 依赖数据库的事务能力。

### 失效速记

```
自调用 | 非 public | 异常类型错 | 异常被吞 | 引擎不支持
```

## 高频追问：readOnly / timeout / rollbackOnly

::: tip 💡 三个"配置不当 = 生产事故"的细节

**`@Transactional(readOnly = true)` 真的有性能收益吗？**
> 有。① Hibernate 会**跳过 dirty check**（不再对比快照）；② MySQL 8.0+ 在副本读取时可选择 `SET TRANSACTION READ ONLY` 释放部分 undo 资源；③ 主从分离中间件（如 ShardingSphere）可**自动路由到从库**。**报表 / 列表查询方法务必加上**。但写也会成功——它**不是数据库级别的写保护**，只是"声明这个事务不写"。

**`@Transactional(timeout = 30)` 为什么生产必加？**
> 默认 `-1` = 无超时。某个 SQL 卡住 → 事务无限期持有行锁 + 连接 → 连接池打满 → 雪崩。**生产代码应该有兜底默认**（如 30s）。

**手动 `setRollbackOnly()` 的应用场景？**
> 在 `try/catch` 里"吞了异常但仍想回滚"时使用：
> ```java
> TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
> ```
> 一旦标记，事务在提交时会直接回滚并抛 `UnexpectedRollbackException`。**调用方需要知道这个异常**，否则会被"看似成功实则回滚"坑到。

:::

## 虚拟线程下的事务陷阱（Boot 3.2+ 必读）

::: warning ⚠️ 2026 实战
事务管理底层依赖 `TransactionSynchronizationManager` 的 **`ThreadLocal`** 存储当前事务上下文。虚拟线程"用完即弃"的特性带来三个新问题：
:::

| 问题 | 现象 | 应对 |
|------|------|------|
| **`@Async` 内事务丢失** | 异步方法**新开虚拟线程**，事务上下文不传递；`@Transactional` 仍生效但是一个**全新事务** | 不要在 `@Async` 方法上跨事务边界；如需传上下文用 `TransactionSynchronizationManager.getResource()` 显式抓 |
| **HikariCP 连接持有变长** | 老代码假设"线程 = 短连接占用"；虚拟线程下事务可能"挂起"等远程调用 | 在事务方法里**禁止远程 IO**；事务边界严格控制在 DAO 层 |
| **`synchronized` 触发 Pinning** | 事务方法用了 `synchronized` 同步块 → 虚拟线程被钉到 OS 线程，丧失轻量优势 | JDK 24+ 修复了 `synchronized` Pinning；老库改 `ReentrantLock` |

**口诀**：「**事务边界要瘦、远程 IO 要出、`ThreadLocal` 要警惕**」。

## NESTED 与 Savepoint：被遗忘的"局部回滚"

`Propagation.NESTED` 利用数据库 **Savepoint** 实现"子事务回滚不影响外层"：

```java
@Transactional                              // 外层事务
public void batchImport(List<Order> orders) {
    for (Order o : orders) {
        try {
            self.importOne(o);              // ★ 走代理；NESTED 起 savepoint
        } catch (Exception e) {
            log.warn("跳过 {}", o.getId(), e);  // 只回滚这一条，外层继续
        }
    }
}

@Transactional(propagation = Propagation.NESTED)
public void importOne(Order o) { ... }
```

| 维度 | NESTED | REQUIRES_NEW |
|------|--------|--------------|
| 物理事务 | **同一个**（用 savepoint） | **新事务**（挂起当前） |
| 数据库连接 | 共享 | 独立连接 |
| 外层回滚 | 子事务一起回滚 | 子事务独立提交，不影响 |
| 数据库支持 | 需支持 savepoint（**Oracle/PG/MySQL InnoDB 都支持**） | 通用 |
| 典型用途 | 批处理中"忽略个别失败" | 日志、审计等独立事务 |

::: warning ⚠️ NESTED 常见误区
- **`DataSourceTransactionManager` 支持 NESTED**，但 **JTA / JPA 默认不支持**（抛 `NestedTransactionNotSupportedException`）
- NESTED 内层抛异常**外层 catch** 才能局部回滚；不 catch 异常会传到外层导致全部回滚
- 与 `REQUIRES_NEW` 都解决"局部失败"，但**语义完全不同**：NESTED 共命运，REQUIRES_NEW 各自独立
:::

## 面试常问 & 怎么答

### Q1: @Transactional 失效的 5 种场景？

自调用（this 调用不过代理）、方法不是 public、异常类型不对（默认只回滚 RuntimeException，加 rollbackFor=Exception.class）、异常被 catch 吞掉、数据库引擎不支持（MyISAM 不支持事务）。最常考的是自调用。

### Q2: REQUIRED 和 REQUIRES_NEW 的区别？

REQUIRED 加入当前事务（共命运，一起提交或回滚）；REQUIRES_NEW 总是新建事务并挂起当前事务（各管各的）。典型场景：日志记录用 REQUIRES_NEW，即使业务方法回滚，日志也要保存下来。

## 看到什么就先想到这类

- 出现 @Transactional、事务回滚、事务失效。
- 出现传播行为、REQUIRED、REQUIRES_NEW。
- 出现事务隔离级别、脏读、幻读。
- 出现"自调用事务不生效"。
