---
title: 事务管理与传播行为
---

# 事务管理与传播行为

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
`@Transactional` 是面试**永恒 Top 1**。核心三问：**7 种传播行为（REQUIRED / REQUIRES_NEW / NESTED 必背）**、**5 大失效场景（自调用、非 public、异常吞、引擎不支持、rollbackFor 漏写）**、**`readOnly / timeout / rollbackOnly` 生产用法**。2026 必补：**虚拟线程下的事务陷阱**、**NESTED + Savepoint 局部回滚**。
:::

---

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

**`readOnly = true` 是交给事务管理器、驱动及 ORM 的只读意图**，可能影响连接只读标记、flush mode 与脏检查，效果取决于实现。它不等于所有读都不加锁，也不自动完成读写分离；是否禁止写入要看数据库级只读事务和配置。

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
        // REQUIRES_NEW 的异常若继续传播到外层，外层仍可能回滚
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

### 两个必须画时序的传播问题

**REQUIRED 与 `UnexpectedRollbackException`**：外层调用另一个代理 Bean 的 REQUIRED 方法，内层抛运行时异常，使共享事务被标记 rollback-only。外层即使 catch 并返回，提交时仍可能收到 `UnexpectedRollbackException`。相反，若异常完全在同一目标方法内部被捕获、从未经过事务拦截器，事务不一定被自动标记回滚。不能把所有 catch 场景混为一谈。

**REQUIRES_NEW 与连接池耗尽**：外层事务挂起时，已借用的连接通常仍保留；内层需要另一条连接。若 20 个请求各持一条外层连接，而池大小为 20，它们可能都在等内层连接。要控制并发、缩短事务、为嵌套深度留容量，或重新设计独立审计写入；单纯“再加大连接池”也可能压垮数据库。

独立事务还存在可见性和业务语义问题：内层不能假设读到外层未提交的数据；外层失败后独立提交的“下单成功”日志可能不真实。日志应表达已发生的尝试，不能把独立提交视为完整业务成功。

## 事务隔离级别

Spring 的隔离级别对应数据库的隔离级别：

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|----------|------|-----------|------|
| READ_UNCOMMITTED | ✅ 可能 | ✅ 可能 | ✅ 可能 |
| READ_COMMITTED | ❌ | ✅ 可能 | ✅ 可能 |
| REPEATABLE_READ（MySQL 默认） | ❌ | ❌ | ✅ 可能（MySQL InnoDB 通过 MVCC 基本解决） |
| SERIALIZABLE | ❌ | ❌ | ❌ |

可以使用数据库默认值，也可以按业务事务显式指定；加入已有事务时，内层注解的隔离属性不一定重新生效。`SELECT ... FOR UPDATE` 是锁定读，不等于把整个事务升级为某个隔离级别；要说明保护了哪些记录、范围或业务不变量。

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

### 2. 方法不可被所用代理拦截

默认代理模式下，private 方法和自调用不能通过外部代理拦截；基于类的代理也不能覆盖 final 方法。**Spring 6 起，类代理默认可支持 protected 和包可见事务方法**，接口代理则要求通过接口暴露的 public 方法。应同时交代 Spring 版本、代理类型和调用方式，不能笼统说“非 public 一律失效”。

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

MySQL 的 MyISAM 引擎不支持事务，InnoDB 支持。还要确认注解选中了正确的事务管理器、DAO 使用同一事务资源；同一个 Java 方法内调用两套独立数据源，不会自动变成一个原子事务。

### 失效速记

```
未经过代理 | 不可拦截方法 | 回滚规则不匹配 | 异常/rollback-only 处理错误 | 资源不在同一事务
```

## 高频追问：readOnly / timeout / rollbackOnly

::: tip 💡 三个"配置不当 = 生产事故"的细节

**`@Transactional(readOnly = true)` 真的有性能收益吗？**
> 可能有，但必须看 Hibernate、驱动和事务管理器的实际行为，并以 SQL 与性能证据确认。它不保证路由到副本，也不能保证“写一定成功”或“写一定失败”；权限和数据库只读事务是另一个层次。

**`@Transactional(timeout = 30)` 会在第 30 秒强杀 Java 方法吗？**
> 不会。超时由事务管理器和资源支持情况执行，可能转成 JDBC statement timeout，并不是一个能中断任意 Java 或远程 I/O 的计时器。默认 `-1` 通常表示使用事务管理器默认值。应协调入口 deadline、连接获取、SQL、锁等待和远程调用的各层预算。

**手动 `setRollbackOnly()` 的应用场景？**
> 在 `try/catch` 里"吞了异常但仍想回滚"时使用：
> ```java
> TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
> ```
> 标记后不能再正常提交，但是否抛 `UnexpectedRollbackException` 取决于事务参与方式和回滚标记来源。内层参与者把共享事务标记回滚、外层却期望提交，是典型触发条件；顶层自己明确设置 rollback-only 并不总产生该异常。

:::

## 虚拟线程下的事务陷阱（Boot 3.2+ 必读）

::: warning ⚠️ 2026 实战
命令式事务通常把资源绑定到当前 Java Thread；虚拟线程在 carrier thread 之间迁移不会丢失自身 ThreadLocal。平台线程同样存在跨线程不传播事务的问题；响应式事务则依赖 Reactor Context，不能套用命令式线程绑定模型。
:::

| 问题 | 现象 | 应对 |
|------|------|------|
| **新线程/`@Async`** | 不继承调用方事务；异步端经代理可创建自己的事务 | 不手动复制绑定的 Connection/EntityManager；可靠异步由 Outbox 等协议衔接 |
| **连接仍是稀缺资源** | 虚拟线程在等待远程服务时仍可能持有事务连接与锁 | 缩短业务事务，不把事务拆到每个 DAO 而丢掉原子业务边界 |
| **JDK 版本与 pinning** | JDK 21-23 在 synchronized 内阻塞可能占住 carrier；JDK 24 的 JEP 491 解决这类 monitor pinning | 仍需测量锁竞争、native 路径和下游容量，升级不等于无限吞吐 |

**口诀**：「**事务边界要瘦、远程 IO 要出、`ThreadLocal` 要警惕**」。

## 提交边界、外部副作用与测试

### save、flush、commit 是三个不同事件

JPA 的 `save()` 可能只改变持久化上下文；flush 将 SQL 发送到数据库，但不等于事务已提交。唯一约束、乐观锁或数据库异常可能在 flush/commit 才出现，方法体执行完不代表代理已经成功提交。

因此缓存失效、消息发送和对外通知应围绕实际提交点设计。`@TransactionalEventListener(AFTER_COMMIT)` 避免提交前通知，但进程在提交后、回调前崩溃仍会漏通知；需要可靠投递时，在业务事务中写 Outbox，再异步派发。回调中若还需要持久化新数据，应使用明确的新事务，而不是依赖旧事务资源仍看起来可访问。

### 用四个集成测试验证事务，而不是只测方法被调用

| 场景 | 验证内容 |
|------|----------|
| 业务更新后抛异常 | 从另一个连接读取，确认业务修改回滚，不只断言异常类型 |
| REQUIRED 内层异常被外层 catch | 检查共享事务是否 rollback-only，以及调用方最终收到的结果 |
| REQUIRES_NEW 内层提交、外层回滚 | 验证只有设计允许独立提交的数据保留，并测连接池压力 |
| 事务提交失败/响应丢失 | 不提前发送成功通知；用同一请求标识查询或重试 |

测试方法本身若带 `@Transactional` 并在结束时统一回滚，可能掩盖真实提交时异常、事件时序或延迟约束。至少一组测试要让服务边界真实提交，并从独立事务观察。用生产同类数据库验证锁和隔离语义，不能假设内存数据库完全等价。

参考：[Spring 声明式事务注解](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)、[事务传播](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html)。

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

先核对是否经过代理、方法是否可拦截、回滚规则、rollback-only 状态和资源绑定。非 public 是否支持要看 Spring 版本与代理类型；捕获异常不代表共享事务仍可提交；新线程也不会自动加入调用方事务。

### Q2: REQUIRED 和 REQUIRES_NEW 的区别？

REQUIRED 加入当前事务（共命运，一起提交或回滚）；REQUIRES_NEW 总是新建事务并挂起当前事务（各管各的）。典型场景：日志记录用 REQUIRES_NEW，即使业务方法回滚，日志也要保存下来。

## 看到什么就先想到这类

- 出现 @Transactional、事务回滚、事务失效。
- 出现传播行为、REQUIRED、REQUIRES_NEW。
- 出现事务隔离级别、脏读、幻读。
- 出现"自调用事务不生效"。
