---
title: Java 工程实战
---

# Java 工程实战（JVM 调优 / 框架选型 / AOT / 性能 / 陷阱 / 答题模板）

<span class="dig-tag dig-tag--category">编程语言</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 章节范围
本页覆盖 **Java 工程实战与高阶面试**：JVM 调优 checklist、Spring Boot / Quarkus / Micronaut / GraalVM 选型、CRaC / Native Image 启动加速、性能优化技巧、Java vs Go / C# / Kotlin 选型、虚拟线程 Pinning / ThreadLocal 泄漏等真实生产陷阱、黄金答题模板。语法基础见 [Java 基础](./java-fundamentals)；JVM 内核见 [JVM 深入](./jvm-internals)；并发见 [Java 并发编程](./java-concurrency)。
:::

---

## JVM 调优 Checklist（生产可用）

### 1. 基本启动参数模板（JDK 21+）

```bash
java \
  -Xms4g -Xmx4g \                       # 堆固定，避免动态扩容引起 GC
  -XX:+UseZGC -XX:+ZGenerational \      # ZGC + 分代（JDK 21 GA，亚毫秒停顿）
  -XX:MaxGCPauseMillis=10 \             # 目标停顿
  -XX:+AlwaysPreTouch \                 # 启动时分配真实物理内存，避免运行期缺页
  -XX:+UseStringDeduplication \         # 字符串去重（高内存收益）
  -XX:NativeMemoryTracking=summary \    # 排查 native 内存泄漏
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heapdump/ \
  -Xlog:gc*,gc+heap=trace:file=/var/log/gc.log:time,uptime:filecount=10,filesize=100M \
  -jar app.jar
```

### 2. GC 选型决策树（2026）

```text
延迟敏感 / 在线服务？
├─ 堆 < 4GB → G1（默认，平衡选择）
├─ 4-16GB  → G1 或 ZGC（看停顿要求）
└─ > 16GB  → ZGC + Generational（JDK 21+）★ 推荐

吞吐优先 / 离线批处理？
└─ ParallelGC（最大吞吐，但 STW 长）

低内存嵌入式 / Native Image？
└─ Serial / Epsilon（无 GC，仅适用于短生命周期）
```

| GC | JDK | 适用堆 | 停顿 | 吞吐 |
|----|-----|-------|------|------|
| **G1** | 9+ | 4-32GB | 100-200ms | ⭐⭐⭐⭐ |
| **ZGC** | 11+ | 8GB-16TB | < 10ms | ⭐⭐⭐ |
| **Generational ZGC** | **21+** ★ | 8GB-16TB | < 1ms | ⭐⭐⭐⭐ |
| **Shenandoah** | 12+ | 4-64GB | < 50ms | ⭐⭐⭐ |
| **Parallel** | 全部 | 任意 | 长 | ⭐⭐⭐⭐⭐ |

### 3. 线程 / 容器 / 监控

| 维度 | 设置 |
|------|------|
| **容器感知** | JDK 10+ 默认开启 `UseContainerSupport`，但**仍要显式设置 `-Xmx`** |
| **线程栈** | `-Xss256k`（默认 1MB，虚拟线程时代可调小）|
| **CPU 限额** | K8s `cpu.limits` 透传到 `Runtime.availableProcessors()` |
| **元空间** | `-XX:MaxMetaspaceSize=512m`（Spring Boot 应用建议显式上限）|
| **JFR 持续录制** | `-XX:StartFlightRecording=duration=24h,filename=app.jfr` |
| **诊断神器** | `jcmd <pid> ...` / Async Profiler / JFR Mission Control |

---

## 线上诊断与调试工具箱（必备）

> 高频面试题"**线上出问题你怎么排查**"——能报出这套 JDK 自带工具 + Arthas + 远程调试，立刻区分有无生产经验。

### JDK 自带命令行工具（必背）

| 工具 | 用途 | 高频命令 |
|------|------|---------|
| **jps** | 列出 Java 进程 | `jps -l`（带主类全名）|
| **jstack** | 线程栈快照（**死锁 / 线程阻塞**）| `jstack <pid>`；死锁会直接打印 `Found 1 deadlock` |
| **jmap** | 堆直方图 / 堆 dump | `jmap -histo:live <pid>`；`jmap -dump:live,format=b,file=heap.hprof <pid>` |
| **jstat** | GC 实时统计 | `jstat -gcutil <pid> 1000`（每秒打印各代占比 + GC 次数/耗时）|
| **jcmd** | 万能诊断入口（推荐）| `jcmd <pid> Thread.print` / `GC.heap_info` / `VM.flags` / `JFR.start` |
| **jinfo** | 查看 / 动态改 JVM 参数 | `jinfo -flag MaxHeapSize <pid>` |
| **jhsdb** | 取代 jstack -F，强制取栈 / 分析 core | `jhsdb jstack --pid <pid>` |

::: tip 💡 jcmd 正在统一一切
现代 JDK 推荐用 `jcmd` 一个入口替代 jstack/jmap/jinfo：`jcmd <pid> help` 列出该进程支持的全部诊断命令，且对容器更友好。
:::

### 线程栈状态怎么读（jstack 必看）

```
"http-nio-8080-exec-1" #42 ... 
   java.lang.Thread.State: BLOCKED (on object monitor)   ← 等锁
        at com.app.Service.method(Service.java:30)
        - waiting to lock <0x000...a8> (a java.lang.Object)  ← 等谁的锁
        - locked <0x000...b0>                                ← 自己持有的锁
```

| 线程状态 | 含义 | 排查方向 |
|---------|------|---------|
| **RUNNABLE** | 在跑（或在跑 native）| CPU 高 → 定位热点代码 |
| **BLOCKED** | 等 `synchronized` 锁 | 锁竞争 → 找持锁线程 |
| **WAITING** | `wait()` / `park()` 无限等 | 线程池空闲 / 死等条件 |
| **TIMED_WAITING** | `sleep` / 带超时的等 | 通常正常 |
| 大量同 `waiting to lock` 同一地址 | **锁瓶颈** | 减小锁粒度 / 换无锁 |

### Arthas（阿里开源，线上不停机诊断）

不重启、不改代码，直接 attach 到运行中的 JVM：

```bash
java -jar arthas-boot.jar          # attach 到目标进程
dashboard                          # 实时大盘（线程/内存/GC）
thread -n 3                        # CPU 最高的 3 个线程栈（替代 top+jstack 组合拳）
thread -b                          # 一键找死锁
trace com.app.Service method       # 方法内部各调用耗时（定位慢在哪）
watch com.app.Service method '{params,returnObj}'  # 观察入参/返回值，不用打日志
jad com.app.Service                # 反编译线上类，确认部署的代码版本
redefine /tmp/Service.class        # 热更新类（临时热修）
```

> **Arthas 杀手锏**：`trace` / `watch` 让你**不改代码不重启**就能看方法耗时和参数，是排查"偶发慢请求 / 线上和本地行为不一致"的神器。

### 远程调试（JDWP）

```bash
# 启动参数加 JDWP agent（suspend=n 表示不等调试器连接就先跑）
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar app.jar

# IDEA: Run → Edit Configurations → Remote JVM Debug，填主机 + 5005 端口
```

::: warning ⚠️ 生产远程调试三大风险
① 断点会**挂起业务线程**（`suspend` 命中后整条请求卡住）；② `address=*:5005` 暴露调试端口有**安全风险**（应绑内网 / 跳板）；③ 条件断点求值可能有副作用。**生产优先用 Arthas `watch`，而非断点。**
:::

### 容器 / K8s 里怎么调试

```bash
# Pod 内进程通常是 PID 1
kubectl exec -it <pod> -- jcmd 1 Thread.print

# 工具镜像没装诊断工具？用 ephemeral container 注入（K8s 1.25+）
kubectl debug -it <pod> --image=arthas/arthas --target=<container>

# OOM 后捞 heap dump（配合启动参数 -XX:+HeapDumpOnOutOfMemoryError）
kubectl cp <pod>:/var/log/heapdump/xxx.hprof ./xxx.hprof   # 下载到本地用 MAT 分析
```

### 离线分析工具

| 工具 | 分析对象 | 看什么 |
|------|---------|--------|
| **MAT**（Eclipse Memory Analyzer）| heap dump（.hprof）| Dominator Tree 找最大保留对象、Leak Suspects 报告 |
| **JProfiler / YourKit** | 实时 attach | CPU/内存/锁 全维度商业级 |
| **Async Profiler** | 运行中 JVM | 低开销火焰图（CPU / alloc / lock）|
| **JMC**（JDK Mission Control）| JFR 录制文件 | 生产持续录制后离线分析 |

---

## Spring Boot vs Quarkus vs Micronaut vs Helidon

| 维度 | **Spring Boot 3.x** | **Quarkus 3.x** | **Micronaut 4.x** | Helidon 4 |
|------|--------------------|------------------|-----|-----|
| **定位** | 企业事实标准 | 云原生 / K8s 优先 | 微服务 / GraalVM 友好 | Oracle 云原生 |
| **启动时间（JVM）** | 2-5s | 0.5-1s | 0.3-1s | 0.5-1s |
| **启动时间（Native）** | 50-200ms（GraalVM 6.0）| **20-50ms** | **20-50ms** | 30-80ms |
| **内存（JVM）** | 200-400MB | 100-200MB | 80-150MB | 100-200MB |
| **内存（Native）** | 50-100MB | **30-60MB** | **20-50MB** | 30-60MB |
| **反射 / 动态代理** | 重（启动慢）| 编译期 | 编译期 | 编译期 |
| **DI 处理** | 运行时 | **编译期**（Build Time）| **编译期**（AOT）| 编译期 |
| **生态** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **学习曲线** | 最熟悉 | 中（CDI / MicroProfile）| 中 | 陡 |
| **典型场景** | 通用后端 | K8s / Serverless / FaaS | 微服务 / Serverless | Oracle Cloud |

**选型建议（2026）**

- 已有 Spring 团队 / 复杂业务 → **Spring Boot 3.x + GraalVM 6 Native（按需）**
- 新建 Serverless / Lambda / 冷启动敏感 → **Quarkus** 或 **Micronaut**
- 重计算微服务 → **Spring Boot + JVM 模式**（不强求 Native）

---

## GraalVM Native Image 实战

### 收益与代价

| 指标 | JVM 模式 | **Native Image** |
|------|---------|------------------|
| **启动时间** | 1-5s | **20-100ms** ⭐ |
| **峰值内存** | 200-500MB | **30-100MB** ⭐ |
| **峰值吞吐** | 100% | **80-95%**（缺 JIT 极限优化）|
| **构建时间** | 10s | **2-5min** ⚠️ |
| **运行时反射** | 自由 | **必须声明** ⚠️ |
| **CPU 占用** | 高（JIT）| 低 |

### 必踩坑（Native 模式）

```java
// ❌ Native 模式失败：动态加载未声明
Class.forName("com.example.MyClass");

// ✅ 在 reflect-config.json 中声明
[ { "name": "com.example.MyClass", "allDeclaredConstructors": true } ]

// ✅ Spring Boot 3 + AOT 自动生成大部分 hint
// 复杂场景手写 @RegisterReflectionForBinding(MyDto.class)
```

```bash
# Spring Boot 3 GraalVM Native 构建
./mvnw -Pnative native:compile

# 运行时 PGO（Profile-Guided Optimization，Oracle GraalVM）
native-image --pgo-instrument MyApp
./myapp                                  # 跑业务流量收集 profile
native-image --pgo=default.iprof MyApp   # 用 profile 重新编译 → 性能提升 15-30%
```

---

## CRaC（Coordinated Restore at Checkpoint）—— JDK 21+ 启动加速

**核心思想**：把一个"预热好"的 JVM 进程 checkpoint 成文件 → 启动时直接 restore。

```bash
# 1. 启动并预热
java -XX:CRaCCheckpointTo=./cr -jar app.jar
# ... 业务请求预热 JIT ...
jcmd <pid> JDK.checkpoint                # 创建检查点

# 2. 极速 restore（毫秒级，含 JIT 热点已优化）
java -XX:CRaCRestoreFrom=./cr            # ★ 启动 < 100ms，性能直接达到 JVM 峰值
```

| 方案 | 启动时间 | 峰值性能 | 复杂度 |
|------|---------|---------|-------|
| 普通 JVM | 1-5s | 100% | 低 |
| **GraalVM Native** | 20-100ms | 80-95% | 中 |
| **CRaC（Spring Boot 3.2+）** | **50-200ms** | **100%** ⭐ | 中（要处理资源关闭）|

**适用**：Serverless / 短生命周期容器 / 弹性伸缩。

---

## Java 性能优化技巧

| 技巧 | 收益 | 何时用 |
|------|------|--------|
| **虚拟线程（JDK 21+）** | I/O 密集吞吐 10-100× | Tomcat / 同步代码 + 大量阻塞 |
| **StringBuilder vs +=** | O(n²) → O(n) | 循环拼接字符串 |
| **`List.of()` / `Map.of()`** | 不可变 + 节省内存 | 静态常量集合 |
| **ConcurrentHashMap 替 `synchronized` Map** | 高并发读写 5-10× | 共享缓存 |
| **`StringBuilder.append(char)` vs `+ "x"`** | 减装箱 | 高频路径 |
| **逃逸分析 + 标量替换** | 栈上分配，0 GC | JIT 自动，确保对象不外泄 |
| **`@Contended`（JDK 8+）** | 消除伪共享 | 高竞争计数器 |
| **`MemorySegment`（JDK 22 FFM API）** | 替代 Unsafe / Native 互操作 | 高性能 IO / Native 调用 |
| **JIT inlining**（小方法）| 减调用开销 | 热点路径方法控制在 35 字节内 |
| **PGO（GraalVM Native）** | 15-30% 性能提升 | Native Image 生产环境 |

### 虚拟线程使用模板

```java
// ✅ JDK 21 推荐：每请求每虚拟线程
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> {
            // 阻塞 I/O 不再占用 OS 线程
            httpCall();
        });
    });
}

// ✅ Spring Boot 3.2+：一行启用
spring.threads.virtual.enabled=true

// ⚠️ 避坑：避免 synchronized 锁 I/O（Pinning）
// JDK 24 已修复 synchronized Pinning，但 24 之前要改 ReentrantLock
```

---

## Java vs Go vs C# vs Kotlin（必背选型对比）

| 维度 | **Java 21+** | Go | C# / .NET 8 | Kotlin |
|------|--------------|-----|-------------|--------|
| **并发模型** | 虚拟线程 + Thread | Goroutine + Channel | async/await + TPL | 协程 Coroutine |
| **内存管理** | GC（G1/ZGC）| GC | GC | GC（同 JVM）|
| **启动时间** | 1-5s / Native 50ms | < 100ms | 1s / Native 50ms | 同 JVM |
| **内存占用** | 中（200MB+）| **低**（10-50MB）| 中 | 同 JVM |
| **类型系统** | 强 + 范型 | 简 + 范型（弱）| 强 + Records | **最强**（空安全 + sealed）|
| **生态** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐（云原生）| ⭐⭐⭐⭐ | ⭐⭐⭐⭐（Android + 后端兼容 Java）|
| **学习曲线** | 中 | **平缓** | 中 | 平缓（懂 Java）|
| **典型场景** | **企业后端 / 大数据 / 中间件** | K8s / 网关 / CLI | 外企 / Azure / 金融 | **Android / 现代后端**（Spring Boot 6 支持）|
| **国内大厂** | 全部 | 字节 / 滴滴 / Bilibili | 微软 / 摩根 | 字节 / 京东（部分后端）|

**记忆要点**：
- **企业复杂业务 → Java**（生态最深）
- **基础设施 / 网关 → Go**
- **Azure / 外企 → C#**
- **更现代语法 + JVM 生态 → Kotlin**

---

## 真实生产陷阱（高频面试 + 线上事故）

### 1. ThreadLocal 内存泄漏（Tomcat 线程池场景）

```java
// ❌ 用完不清理 → 老 ThreadLocal 引用永留在线程上
static final ThreadLocal<HeavyContext> CTX = new ThreadLocal<>();
CTX.set(new HeavyContext());
// 业务结束忘记 remove()

// ✅ try-finally 模板
try {
    CTX.set(ctx);
    doBusiness();
} finally {
    CTX.remove();   // ★ 必须
}
```

### 2. 虚拟线程 Pinning（JDK 21-23）

```java
// ❌ synchronized 包阻塞 IO → 虚拟线程被钉住载体线程
synchronized (lock) {
    httpClient.send(...);   // 阻塞期间 carrier thread 不能调度其他虚拟线程
}

// ✅ JDK 24 已修复；之前版本改 ReentrantLock
lock.lock();
try { httpClient.send(...); }
finally { lock.unlock(); }

// 诊断
-Djdk.tracePinnedThreads=full
```

### 3. HashMap 在并发下死循环（JDK 7）/ 数据丢失（JDK 8）

```java
// ❌ 多线程 put HashMap → JDK 7 死循环 CPU 100%，JDK 8 数据丢失
// ✅ 用 ConcurrentHashMap
```

### 4. String.intern() OOM

```java
// ❌ JDK 6 PermGen 易满；JDK 7+ 移到堆，但仍长生命周期不回收
for (String s : userInput) {
    s.intern();   // 累积 → Metaspace 持续增长
}
```

### 5. `Optional` 误用

```java
// ❌ 字段用 Optional（不可序列化）
class User { Optional<String> name; }

// ❌ Optional.get() 不判 isPresent
opt.get();

// ✅ 只用于返回值；推荐 .map / .orElse / .orElseThrow 链式
return repo.findById(id).map(User::getName).orElse("匿名");
```

### 6. 大对象 / 大数组进老年代直接 OOM

```bash
# 默认 -XX:PretenureSizeThreshold=0（仅 ParallelGC）
# 大对象（如 1MB byte[]）直接进老年代 → 触发 Full GC
# ✅ 优化：分块、复用、用 ByteBuffer 池
```

### 7. SimpleDateFormat 线程不安全

```java
// ❌ static SimpleDateFormat → 多线程时间错乱
// ✅ DateTimeFormatter（线程安全）or ThreadLocal<SimpleDateFormat>
private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
```

### 8. Stream 误用 parallel

```java
// ❌ parallelStream 在小数据 / 有副作用 / I/O 场景反而更慢
list.parallelStream().forEach(this::saveDb);  // 共用 ForkJoinPool.commonPool() 阻塞其他任务

// ✅ 仅在 CPU 密集 + 大数据 + 无副作用 时用，并自定义线程池
```

---

## 黄金答题模板

### Q：如何排查线上 CPU 100%？

> **5 步定位法**：
> 1. `top` 找到 Java 进程 PID
> 2. `top -Hp <PID>` 找到最高 CPU 的**线程 ID**
> 3. `printf "%x\n" <TID>` 转 16 进制
> 4. `jstack <PID> | grep -A 30 <hex_tid>` 看堆栈
> 5. 常见原因：**死循环 / GC 频繁 / 锁竞争 / JSON 反序列化**
>
> 长期方案：**Async Profiler / JFR 持续录制**，配合 [APM](../engineering-practice/monitoring-observability) 做火焰图。

### Q：FullGC 频繁怎么办？

> 三步法：
> 1. **看现象**：GC log / `jstat -gcutil <pid> 1000` 看老年代增长曲线
> 2. **找原因**：`jmap -histo:live <pid>` 找占用最多的类 / dump 堆用 MAT 分析 Dominator Tree
> 3. **改方案**：
>    - 堆设小了 → 调 `-Xmx`
>    - 大对象 → 复用 / 池化（[Redis 缓存](../databases/redis)）
>    - 老年代碎片 → 换 G1 / ZGC
>    - 内存泄漏 → 修代码

### Q：Java 项目选 Spring Boot 还是 Quarkus？

> 取决于**冷启动敏感度**：
> - **传统长生命周期服务（K8s 常驻 Pod）→ Spring Boot 3 + JVM**，生态最稳
> - **Serverless / Lambda / FaaS / 冷启动敏感 → Quarkus 或 Spring Boot + GraalVM Native**
> - **混合方案**：Spring Boot 3.2+ **CRaC** 兼顾启动速度（50-200ms）和峰值性能（100%）

### Q：虚拟线程能完全替代线程池吗？

> **不能**。虚拟线程只解决**阻塞 I/O 场景**：
> - ✅ HTTP / DB / RPC 阻塞调用 → 虚拟线程吞吐 10-100×
> - ❌ **CPU 密集** → 用 ForkJoinPool（虚拟线程无优势）
> - ❌ **Native 调用 / 长 synchronized** → 会 Pinning（JDK 24 修复）
> - ❌ **需要细粒度限流** → 仍用固定线程池（Bulkhead）

### Q：为什么 Java 用 Native Image？什么时候不用？

> **用**：Serverless / CLI / 短生命周期容器 / 内存敏感
> **不用**：长生命周期服务 / 重反射动态代理（成本太高）/ JIT 极限优化场景（HFT、大数据计算）

---

## 关联章节

- [Java 基础](./java-fundamentals) — 类型 / OOP / 异常 / IO
- [Java 并发](./java-concurrency) — 线程池 / AQS / CAS / 虚拟线程
- [JVM 深入](./jvm-internals) — 类加载 / JMM / JIT / GC 算法详解
- [Java 集合](./java-collections) — HashMap / ConcurrentHashMap 源码
- [Java 新特性](./java-modern-features) — Lambda / Stream / Record / 模式匹配
- [Spring Boot 3 新特性](../web-and-frameworks/spring-boot3-new-features) — AOT / Virtual Thread / Observability
- [监控与可观测性](../engineering-practice/monitoring-observability) — JFR / Async Profiler / Prometheus
