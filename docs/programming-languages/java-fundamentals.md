---
title: Java 基础原理
---

# Java 基础原理 Java Fundamentals

<span class="dig-tag dig-tag--category">编程语言</span>
<span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span>
<span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
Java 面试的核心在于：JVM 内存结构与 GC 机制、HashMap 底层实现（数组+链表+红黑树）、synchronized 与 ReentrantLock 的区别、以及 JMM（Java 内存模型）。这几个方向几乎出现在所有 Java 岗位的面试中。
:::

## JVM 内存结构

JVM 运行时数据区分为**线程私有**和**线程共享**两类区域：

```
JVM 内存结构（JDK 8+）
┌────────────────────────────────────────────────────────────┐
│                     线程共享区域                           │
│  ┌───────────────────────────────┐  ┌────────────────────┐ │
│  │            堆 Heap             │  │  元空间 Metaspace  │ │
│  │  ┌────────────┬────────────┐  │  │  (JDK 8+ 替代     │ │
│  │  │  新生代     │   老年代   │  │  │   方法区，在本地  │ │
│  │  │ Eden|S0|S1 │            │  │  │   内存而非堆中)   │ │
│  │  └────────────┴────────────┘  │  └────────────────────┘ │
│  └───────────────────────────────┘                          │
├────────────────────────────────────────────────────────────┤
│                     线程私有区域                           │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐ │
│  │  程序计数器   │  │  虚拟机栈      │  │   本地方法栈      │ │
│  │  (PC Register)│  │  (VM Stack)   │  │  (Native Stack)  │ │
│  └──────────────┘  └───────────────┘  └──────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

| 区域 | 共享/私有 | 作用 | OOM 风险 |
|------|---------|------|---------|
| **堆 Heap** | 共享 | 存放所有对象实例，GC 主战场 | `OutOfMemoryError: Java heap space` |
| **元空间 Metaspace** | 共享 | 存放类元数据（JDK 8 前叫永久代 PermGen） | `OutOfMemoryError: Metaspace` |
| **虚拟机栈** | 私有 | 每个方法调用创建一个栈帧（局部变量、操作数栈） | `StackOverflowError`（递归过深） |
| **程序计数器** | 私有 | 记录当前线程执行的字节码指令地址 | 不会 OOM |
| **本地方法栈** | 私有 | 执行 Native 方法（C/C++）的栈 | `StackOverflowError` |

### 堆内存分代模型

```
堆内存
├── 新生代 Young Generation（~1/3 堆）
│   ├── Eden 区（~8/10 新生代）  ← 新对象优先分配在此
│   ├── Survivor 0 (S0)（~1/10）
│   └── Survivor 1 (S1)（~1/10）
└── 老年代 Old Generation（~2/3 堆）  ← 长期存活对象晋升至此
```

**对象的生命周期：**
1. 新对象在 Eden 区分配
2. Minor GC（Young GC）后，存活对象移到 S0 或 S1，年龄+1
3. 年龄达到阈值（默认 15）或 Survivor 空间不足，晋升到老年代
4. 老年代满时触发 Major GC / Full GC

## 垃圾回收（GC）

### 可达性分析（Reachability Analysis）

JVM 通过可达性分析判断对象是否存活：从 **GC Root** 出发，沿引用链能到达的对象为"存活"，否则为"垃圾"。

**GC Root 包括：**
- 虚拟机栈中局部变量引用的对象
- 静态变量引用的对象
- 常量池中引用的对象
- JNI（Native 方法）引用的对象

### GC 算法

| 算法 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **标记-清除** | 标记垃圾后直接清除 | 简单 | 内存碎片，需要 stop-the-world |
| **标记-整理** | 清除后将存活对象移动紧凑 | 无碎片 | 移动对象开销大 |
| **复制算法** | 存活对象复制到另一半，清空原区域 | 无碎片，高效 | 内存利用率 50% |
| **分代收集** | 不同代使用不同算法（新生代复制，老年代标记整理） | 高效 | 复杂 |

### GC 收集器对比

| 收集器 | 作用范围 | 特点 | 适用场景 |
|-------|---------|------|---------|
| **Serial** | 新生代 | 单线程，STW | 单核、客户端 |
| **Parallel Scavenge** | 新生代 | 多线程，吞吐量优先 | 批处理，后台任务 |
| **CMS** | 老年代 | 并发标记，低停顿 | 响应时间敏感（**JDK 9 标记 deprecated，JDK 14 完全移除**） |
| **G1** | 全堆 | Region 化，可预测停顿时间 | 通用，JDK 9+ 默认 |
| **ZGC** | 全堆 | 停顿 < 10ms，支持 TB 级堆 | 超低延迟（JDK 15+ 生产可用） |

### G1 GC 工作原理

G1（Garbage-First）将堆划分为若干大小相等的 **Region**，分别标记为 Eden、Survivor、Old、Humongous（大对象），可以灵活控制每次 GC 的目标停顿时间。

```java
// JVM 启动参数示例
java -Xms4g -Xmx4g \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \   // 期望最大停顿 200ms
     -XX:G1HeapRegionSize=16m \   // Region 大小
     -jar app.jar
```

## HashMap 底层实现

HashMap 是 Java 面试最高频的数据结构之一。

### 数据结构（JDK 8+）

```
数组（Node<K,V>[]）
index 0: null
index 1: Node(key1,val1) → Node(key2,val2)  ← 链表（长度<8时）
index 2: TreeNode(...)   ← 红黑树（链表长度≥8 且数组长度≥64时）
index 3: null
...
```

**核心参数：**
- 初始容量：16
- 负载因子：0.75
- 扩容规则：元素数 > 容量 × 负载因子 时，扩容为 2 倍

### put 流程

```java
// 简化版 put 流程
public V put(K key, V value) {
    // 1. 计算 hash（高位扰动，减少碰撞）
    int hash = (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    
    // 2. 定位数组下标
    int index = hash & (capacity - 1); // 等价于 hash % capacity（capacity 是 2 的幂时）
    
    // 3. 处理碰撞
    if (table[index] == null) {
        table[index] = new Node(hash, key, value); // 直接插入
    } else {
        // 遍历链表/红黑树，key 相同则更新，否则尾插
        if (链表长度 >= 8 && 数组长度 >= 64) {
            转换为红黑树;
        }
    }
    
    // 4. 超过阈值则扩容
    if (++size > threshold) resize();
}
```

### 为什么容量必须是 2 的幂？

`index = hash & (capacity - 1)` 当 capacity 是 2 的幂时，`capacity - 1` 的二进制全为 1，这个按位 AND 等效于取模，且位运算比取模快很多。

### HashMap 线程安全：必踩的三大坑

HashMap **非线程安全**——这是面试**最高频追问**。具体会出什么问题？

| 版本 | 问题 | 后果 |
|------|------|------|
| **JDK 7** | 多线程扩容时**链表头插法形成环** | **CPU 100%**（死循环遍历）|
| **JDK 8** | 改为尾插法，无死链；但仍有**数据丢失** | put 操作相互覆盖 |
| **所有版本** | size 不准 / 遍历时抛 `ConcurrentModificationException` | 业务异常 |

**正确选择**：

| 方案 | 线程安全实现 | 性能 | 适用 |
|------|------------|------|------|
| `Hashtable` | **方法级 synchronized** | 极差（**全表锁**）| 已淘汰 |
| `Collections.synchronizedMap()` | 包装类 + synchronized | 差 | 简单场景 |
| **`ConcurrentHashMap`** | **JDK 7**：分段锁（16 段）<br/>**JDK 8+**：CAS + synchronized（桶级锁）| **最好** | **生产首选** |

#### ConcurrentHashMap 的关键改进（JDK 8）

```
JDK 7: Segment[16] 分段锁
       → 锁粒度 = 桶组（hash % 16）
       → 最多 16 线程并发写

JDK 8: 数组 + 链表/红黑树
       → 锁粒度 = 单个桶（synchronized 锁桶的头节点）
       → 不同 hash 的 put 完全并发
       → 性能比 JDK 7 高 1 个数量级
```

::: warning ⚠️ ConcurrentHashMap 仍然有"复合操作非原子"陷阱

```java
// 错误：竞态条件
if (!map.containsKey(key)) {
    map.put(key, value);   // 两个线程可能都进 if，都执行 put
}

// 正确：原子复合操作
map.putIfAbsent(key, value);
map.computeIfAbsent(key, k -> expensiveCompute(k));
```

`ConcurrentHashMap` 的单个方法是原子的，但**"先检查再操作"的组合**仍要用 `putIfAbsent` / `compute` 系列。

:::

### equals() 与 hashCode() 的契约（必背）

**JDK 文档明确规定的契约**——违反会导致 HashMap/HashSet 行为异常：

::: tip 💡 三条铁律

1. **自反性**：`a.equals(a)` 必须为 `true`
2. **对称性**：`a.equals(b)` 为 true ⇔ `b.equals(a)` 为 true
3. **传递性**：`a.equals(b)` 且 `b.equals(c)` → `a.equals(c)` 为 true
4. **一致性**：多次调用结果相同（只要对象不变）
5. **与 hashCode 的强约束**：**`a.equals(b)` 为 true → `a.hashCode() == b.hashCode()` 必须成立**

:::

#### 常见错误案例

```java
// ❌ 只重写 equals 不重写 hashCode
public class User {
    Long id;
    @Override
    public boolean equals(Object o) {
        return o instanceof User u && Objects.equals(id, u.id);
    }
    // 忘了重写 hashCode!
}

Set<User> set = new HashSet<>();
set.add(new User(1L));
set.contains(new User(1L));   // false! 因为 hashCode 不同，落到不同桶
```

#### 正确写法（IDE 自动生成 / Lombok / record）

```java
// ✅ 方式 1: record（JDK 16+，自动正确）
public record User(Long id, String name) {}

// ✅ 方式 2: Lombok
@EqualsAndHashCode  // 同时生成两者
public class User { Long id; String name; }

// ✅ 方式 3: 手写
@Override public int hashCode() { return Objects.hash(id, name); }
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof User u)) return false;
    return Objects.equals(id, u.id) && Objects.equals(name, u.name);
}
```

### Integer 缓存陷阱

```java
Integer a = 127;
Integer b = 127;
Integer c = 128;
Integer d = 128;

a == b;   // true   ← 落入缓存
c == d;   // false  ← 超出缓存，new 出新对象
a.equals(b);  // true（用 equals 永远对）
c.equals(d);  // true
```

**Integer 缓存范围**：`-128 ~ 127`（可通过 `-XX:AutoBoxCacheMax=N` 调大上限）。**面试黄金一句**："Integer == 比较只在 -128 ~ 127 才可靠，业务代码永远用 equals。"

## 集合三大金刚：ArrayList / LinkedList / CopyOnWriteArrayList

**Java 集合面试 Top 3 必问**——能讲清扩容算法、真实性能、并发场景，立刻区分初级和中高级。

### ArrayList 扩容算法（必背）

```java
// JDK 17 ArrayList.grow() 简化版
private Object[] grow(int minCapacity) {
    int oldCapacity = elementData.length;
    int newCapacity = ArraysSupport.newLength(
        oldCapacity,
        minCapacity - oldCapacity,    // minimum growth
        oldCapacity >> 1              // ★ 1.5 倍扩容 (oldCapacity / 2)
    );
    return elementData = Arrays.copyOf(elementData, newCapacity);
}
```

#### 关键细节

| 维度 | 值 |
|------|---|
| **默认初始容量** | **10**（首次 add 时才创建数组，懒初始化）|
| **扩容倍数** | **1.5 倍**（`oldCapacity + oldCapacity >> 1`）|
| **添加性能** | 摊还 O(1)，扩容时 O(n) |
| **空间浪费** | 平均 25%（1.5 倍扩容数学期望）|

::: tip 💡 一个能记一辈子的细节

> **`new ArrayList<>()` 的初始容量不是 10**，而是 **0**（指向共享的 `EMPTY_ELEMENTDATA`）。**首次 `add()`** 才扩容到 10——这是 Java 8+ 的延迟初始化优化，避免大量空 ArrayList 占内存。

:::

#### 为什么是 1.5 倍而不是 2 倍

```
2 倍扩容（如 C++ vector）:
  ✅ 简单，移位 1 位
  ❌ 每次新数组大小 > 历史已释放空间之和 → 永远无法复用旧内存

1.5 倍扩容（Java ArrayList）:
  ✅ N + 1.5N + 2.25N + ... 可能从堆某个位置复用
  ❌ 略复杂、内存增长慢
```

**一句话**：Java 选 1.5× 是为了**潜在的内存复用**，让 GC/分配器更可能找到合适的空闲块。

### LinkedList 真的快吗？（高频陷阱题）

**面试官最爱问**："增删快、查询慢，所以高频增删用 LinkedList 对吗？" → **大错特错**。

#### ArrayList vs LinkedList 真实性能（基准测试）

| 操作 | ArrayList | LinkedList | 真相 |
|------|----------|----------|------|
| **末尾 add** | 摊还 O(1) | O(1) | 持平 |
| **末尾 remove** | O(1) | O(1) | 持平 |
| **按 index 访问** | **O(1)** | O(n/2) | ArrayList 完胜 |
| **中间插入**（已知 index）| O(n)（拷贝）| **O(1)**（理论）| 但**找到 index 要 O(n)**！|
| **中间删除**（已知 element）| O(n) | O(n)（要先找到）| 持平 |
| **迭代器遍历** | **极快**（CPU 缓存友好）| 慢（指针跳跃）| ArrayList 完胜 |

::: warning ⚠️ LinkedList 几乎从不使用

> **Java 核心库作者 Stuart Marks 在 2020 年明确说**："I don't use LinkedList. **Hardly anyone does**. ArrayList is faster in almost every case."
>
> **唯一推荐 LinkedList 的场景**：用作 **Deque**（双端队列）的简单实现。但即使这个场景，**`ArrayDeque` 也更快**——它基于循环数组，缓存友好。
>
> **生产经验**：见到 LinkedList 90% 是历史代码，**新代码一律用 ArrayList 或 ArrayDeque**。

:::

#### 为什么 ArrayList 比 LinkedList 快（即使理论上 LinkedList 中间插入更快）

```
1. ArrayList 数据连续 → CPU 每次预取 64 字节 cache line → 顺序遍历极快
2. LinkedList 每个节点对象散落 → 大量 cache miss → 慢 5-10×
3. LinkedList 每节点要存 prev + next 指针 → 内存开销 2-3×
4. LinkedList 没有 random access → 用 get(i) 要从头遍历 O(n)
```

### CopyOnWriteArrayList 适用场景

**Java 并发集合的"特殊用法"**——读极多、写极少的场景。理解它的核心权衡，是高级 Java 面试加分点。

#### 工作原理

```java
public boolean add(E e) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        Object[] elements = getArray();
        int len = elements.length;
        Object[] newElements = Arrays.copyOf(elements, len + 1);   // ★ 完整复制
        newElements[len] = e;
        setArray(newElements);
        return true;
    } finally { lock.unlock(); }
}

public E get(int index) {
    return get(getArray(), index);    // 读完全无锁
}
```

**核心思想**：
- **读完全无锁**——直接返回 volatile 数组引用
- **写复制整个数组**——加锁 + 复制 + 修改 + 替换引用
- **读不到最新数据**——弱一致性（eventually consistent）

#### 适用 vs 不适用

| 场景 | 推荐？ |
|------|------|
| **配置缓存、白名单、监听器列表**（读 99%，写 < 1%）| ✅ **完美** |
| **事件总线的订阅者列表** | ✅ |
| **频繁写入**（每秒 > 100 次写）| ❌ **灾难**（每次写都 O(n) 复制）|
| **大数组**（> 10000 元素）| ❌（每次写都复制 GB 级数据）|
| **需要立刻看到写入** | ❌（弱一致）|

### 三大集合面试 5 连问

::: tip 💡 高频追问 5 连击

**Q1: ArrayList 默认初始容量？**
> **0**（懒初始化），首次 add 扩容到 **10**。

**Q2: ArrayList 扩容多少倍？**
> **1.5 倍**（`oldCapacity + oldCapacity >> 1`）。

**Q3: ArrayList 和 Vector 区别？**
> Vector 方法都是 `synchronized` → 线程安全但慢；ArrayList 无锁。**Vector 已淘汰**，需要线程安全用 `Collections.synchronizedList()` 或 `CopyOnWriteArrayList`。

**Q4: 遍历 ArrayList 时删除会怎样？**
> 抛 `ConcurrentModificationException`（fail-fast）。正确做法：**用 `Iterator.remove()`** 或用 `removeIf()`。

**Q5: ArrayList 如何避免扩容？**
> **构造时指定初始容量**：`new ArrayList<>(预计大小)`。大批量插入前用 `ensureCapacity(n)` 一次性扩容。

:::

#### fail-fast 与 fail-safe

| 机制 | 实现 | 行为 | 代表集合 |
|------|------|------|---------|
| **fail-fast** | 维护 `modCount`，遍历时检查 | **立刻抛 CME** | `ArrayList` / `HashMap`（标准集合）|
| **fail-safe** | 遍历快照副本 / CoW | **不抛异常，但读不到最新** | `CopyOnWriteArrayList` / `ConcurrentHashMap` |

```java
// fail-fast 触发 CME
List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
for (Integer i : list) {
    if (i == 2) list.remove(i);     // ❌ ConcurrentModificationException
}

// 正确写法 1: Iterator.remove()
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (it.next() == 2) it.remove();
}

// 正确写法 2: removeIf (Java 8+, 推荐)
list.removeIf(i -> i == 2);
```

## 并发：synchronized vs ReentrantLock

| 特性 | `synchronized` | `ReentrantLock` |
|------|---------------|----------------|
| **实现层** | JVM 内置（monitorenter/exit 字节码） | JDK 层（AQS 实现） |
| **可重入** | 支持 | 支持 |
| **公平锁** | 不支持 | 支持（`new ReentrantLock(true)`） |
| **可中断等待** | 不支持 | 支持（`lockInterruptibly()`） |
| **超时获取** | 不支持 | 支持（`tryLock(timeout)`） |
| **条件变量** | 每个锁一个（`wait/notify`） | 多个（`Condition`） |
| **锁释放** | 自动（代码块结束） | 手动（`finally` 里调 `unlock()`） |

```java
// ReentrantLock 用法
private final ReentrantLock lock = new ReentrantLock();

public void transfer(int amount) {
    lock.lock();
    try {
        // critical section
        balance -= amount;
    } finally {
        lock.unlock(); // 必须在 finally 中释放！
    }
}

// 可中断等待
public void tryTransfer() throws InterruptedException {
    if (lock.tryLock(100, TimeUnit.MILLISECONDS)) {
        try {
            balance -= 100;
        } finally {
            lock.unlock();
        }
    } else {
        System.out.println("获取锁超时，放弃");
    }
}
```

## volatile 关键字

`volatile` 保证两点：

1. **可见性：** 对 volatile 变量的写操作会立即刷新到主内存，其他线程读取时会从主内存读取最新值
2. **禁止指令重排：** 编译器和 CPU 不会将 volatile 变量的读写操作重排序到屏障外

```java
// 经典用法：双重检查锁（DCL）单例模式
public class Singleton {
    private static volatile Singleton instance; // 必须 volatile！
    
    public static Singleton getInstance() {
        if (instance == null) {                          // 第一次检查（无锁）
            synchronized (Singleton.class) {
                if (instance == null) {                  // 第二次检查（加锁）
                    instance = new Singleton();
                    // 没有 volatile 时，这一步可能被重排序：
                    // 1. 分配内存  2. 赋给 instance（此时对象未初始化）  3. 调用构造器
                    // 其他线程在 2 和 3 之间进入，会拿到未初始化的对象
                }
            }
        }
        return instance;
    }
}
```

**注意：** volatile 不能保证原子性，`i++` 仍然是非线程安全的（需要 `AtomicInteger`）。

## 反射 / 注解 / 动态代理：Java 三件套

**反射、注解、动态代理是 Java 框架的"三件套"** —— Spring AOP、MyBatis、JUnit、Lombok 全部依赖它们。**2025-2026 年中高级 Java 面试每场必问 1-2 个**。

### 反射（Reflection）核心 API

```java
// 1. 获取 Class 对象（三种方式）
Class<?> c1 = User.class;                       // 编译期获得
Class<?> c2 = user.getClass();                  // 运行期获得
Class<?> c3 = Class.forName("com.example.User"); // 字符串获得（最灵活）

// 2. 反射创建对象
Constructor<?> ctor = c3.getDeclaredConstructor(String.class);
ctor.setAccessible(true);                       // 突破 private
User u = (User) ctor.newInstance("Alice");

// 3. 反射调用方法
Method m = c3.getDeclaredMethod("setName", String.class);
m.setAccessible(true);
m.invoke(u, "Bob");

// 4. 反射读写字段
Field f = c3.getDeclaredField("age");
f.setAccessible(true);
f.set(u, 25);
int age = (int) f.get(u);
```

### 反射的代价（必背）

| 维度 | 普通调用 | 反射调用 | 倍数 |
|------|---------|---------|------|
| **简单方法调用** | 1 ns | **~100 ns** | **100×** |
| **创建对象** | 5 ns | **~200 ns** | 40× |
| **field 读写** | 1 ns | **~50 ns** | 50× |

::: tip 💡 反射为什么慢

> ① **无法 JIT 内联**——反射调用是 native 间接调用；② **类型检查**——每次调用都校验参数类型；③ **访问检查**——除非缓存 + `setAccessible(true)` 否则每次都查访问权限；④ **包装拆箱**——基本类型必须装箱传 Object[]。
> 
> **优化**：① 缓存 `Method` / `Field` 对象；② 用 `MethodHandle`（JDK 7+，比反射快 2-3×）；③ JDK 17+ 用 `VarHandle` / Record。

:::

### 注解（Annotation）原理

```java
// 1. 元注解定义
@Target(ElementType.METHOD)             // 注解能用在哪
@Retention(RetentionPolicy.RUNTIME)     // 保留到运行期才能反射读
@Documented
public @interface MyLog {
    String value() default "";
    int level() default 0;
}

// 2. 使用
public class UserService {
    @MyLog(value = "create-user", level = 1)
    public void create(User u) { ... }
}

// 3. 反射读取注解
Method m = UserService.class.getMethod("create", User.class);
MyLog ann = m.getAnnotation(MyLog.class);
if (ann != null) {
    System.out.println(ann.value());     // "create-user"
}
```

#### 4 种 RetentionPolicy（高频追问）

| Policy | 保留到哪 | 用途 | 反射可读？ |
|--------|---------|------|----------|
| **SOURCE** | 编译后被丢弃 | `@Override` 编译期检查 | ❌ |
| **CLASS**（默认） | 编译到 .class 但不加载到 JVM | 字节码增强（Lombok）| ❌ |
| **RUNTIME** | 加载到 JVM | **Spring / JUnit / Validation** | **✅** |

**面试黄金一句**：**"想用反射读注解，必须 `@Retention(RUNTIME)`"** —— 这是 90% 候选人会忘记的细节。

#### 注解处理器（APT）— Lombok 的秘密

```
Lombok @Data 的工作方式（不是运行期反射）:
  1. 编译时 javac 调用 Annotation Processor
  2. Lombok 处理器 扫描 @Data 注解
  3. 直接修改 AST → 生成 getter/setter 字节码
  4. 编译输出的 .class 已经有 getter/setter
  → 运行期零开销！
```

**对比**：Spring 的 `@Autowired` 是**运行期反射**（有开销），Lombok 的 `@Data` 是**编译期 APT**（零开销）。

### 动态代理：JDK Proxy vs CGLIB

```java
// === JDK 动态代理（基于接口）===
public interface UserService {
    void save(User u);
}

UserService proxy = (UserService) Proxy.newProxyInstance(
    UserService.class.getClassLoader(),
    new Class[]{UserService.class},
    (proxyObj, method, args) -> {
        System.out.println("Before: " + method.getName());
        Object result = method.invoke(target, args);
        System.out.println("After: " + method.getName());
        return result;
    }
);

// === CGLIB（基于继承）===
Enhancer enhancer = new Enhancer();
enhancer.setSuperclass(UserServiceImpl.class);
enhancer.setCallback((MethodInterceptor) (obj, method, args, methodProxy) -> {
    System.out.println("Before: " + method.getName());
    Object result = methodProxy.invokeSuper(obj, args);
    System.out.println("After: " + method.getName());
    return result;
});
UserServiceImpl proxy = (UserServiceImpl) enhancer.create();
```

#### JDK Proxy vs CGLIB 全面对比

| 维度 | **JDK Proxy** | **CGLIB** |
|------|------------|---------|
| **底层** | `java.lang.reflect.Proxy` | ASM 字节码生成（继承）|
| **必须接口** | **是** | 否（任何类皆可）|
| **不能代理** | 无接口的类 | **final 类 / final 方法** |
| **创建速度** | 快（不生成字节码）| 慢（要生成子类字节码）|
| **调用速度** | JDK 17+ 持平 / 略快 | **JDK 11- 时比 JDK 快 2-3×**（JDK 17+ MethodHandle 后差距缩小）|
| **Spring 默认** | 有接口走 JDK | **Boot 2.x+ 默认全用 CGLIB**（避免接口注入问题）|

#### 三件套结合：自定义 @Cacheable 实现

**面试加分案例**——能完整写出一个用注解+反射+动态代理实现的"简化版 @Cacheable" 立刻能拿到 offer 加分：

```java
// 1. 定义注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyCacheable {
    String key();
    int ttl() default 60;
}

// 2. 动态代理拦截
public class CacheableProxy implements InvocationHandler {
    private final Object target;
    private final Map<String, Object> cache = new ConcurrentHashMap<>();

    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        MyCacheable ann = method.getAnnotation(MyCacheable.class);
        if (ann == null) return method.invoke(target, args);

        String key = parseKey(ann.key(), args);
        return cache.computeIfAbsent(key, k -> {
            try { return method.invoke(target, args); }
            catch (Exception e) { throw new RuntimeException(e); }
        });
    }
}

// 3. 使用：和 Spring @Cacheable 一模一样的开发体验
@MyCacheable(key = "user:#0", ttl = 300)
public User findById(Long id) { return db.find(id); }
```

::: tip 💡 面试黄金回答模板

> **"反射 + 注解 + 动态代理是 Java 框架的三件套。注解必须配 RUNTIME 才能反射读；反射比直接调用慢 100× 但很灵活（要缓存 Method 对象）；动态代理 JDK 基于接口、CGLIB 基于继承且能代理无接口类。Spring AOP 默认用 CGLIB 统一行为，MyBatis Mapper 用 JDK 代理。"**

:::

## 常见误区

::: warning 易错点
1. **JDK 8 移除了永久代（PermGen）**，用元空间（Metaspace）替代，Metaspace 默认使用本地内存，不受 `-Xmx` 限制，但可以用 `-XX:MaxMetaspaceSize` 限制
2. **HashMap 不是线程安全的**，并发场景下用 `ConcurrentHashMap`（JDK 8+ 用 CAS + synchronized 分段锁，性能远好于 Hashtable）
3. **String 是不可变对象**，每次 `+` 拼接都会创建新对象（循环拼接用 `StringBuilder`）
4. **== 与 equals()：** `==` 比较引用地址，`equals()` 比较内容。Integer 缓存了 -128 到 127 的对象，在此范围内 `==` 也可能为 true，容易踩坑
:::

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. JVM 内存结构是什么？各区域分别存什么？什么情况下会 OOM？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>2. HashMap 的底层原理？JDK 8 相比 JDK 7 做了哪些优化？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>3. synchronized 和 ReentrantLock 有什么区别？各在什么场景下使用？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### Q1: JVM 内存结构

**线程私有：** 程序计数器、虚拟机栈、本地方法栈（三者随线程生命周期）

**线程共享：** 堆（对象实例）、元空间（类元数据）

**OOM 场景：**
- `Java heap space`：堆内存不足，通常是内存泄漏或对象过多
- `Metaspace`：类加载过多（如动态代理），元空间不足
- `StackOverflowError`：方法递归太深，栈帧耗尽栈空间

### Q2: HashMap 底层原理

**JDK 7：** 数组 + 链表，头插法（并发扩容可能导致循环链表死循环）

**JDK 8 优化：**
1. 链表长度 ≥ 8 且数组长度 ≥ 64 时转为**红黑树**，查询 O(log n)（JDK 7 是 O(n)）
2. **尾插法**（避免并发扩容死循环）
3. **hash 扰动函数**优化：`hash ^ (hash >>> 16)` 让高位参与取模，减少碰撞
4. 扩容时节点位置只有两种：**原位置** 或 **原位置 + 旧容量**（利用 hash 最高位判断）

### Q3: synchronized vs ReentrantLock

synchronized 是 JVM 内置，简单安全，无需手动释放锁。

ReentrantLock 是 JDK 层实现（基于 AQS），具有以下 synchronized 没有的能力：
- **公平锁**（保证等待最久的线程优先获得锁）
- **可中断等待**（`lockInterruptibly()`，避免死等）
- **超时获取**（`tryLock(time)`，避免无限阻塞）
- **多个条件变量**（复杂的生产消费场景）

**选用原则：** 需要 synchronized 没有的特性时才用 ReentrantLock，其他情况 synchronized 即可（JVM 会做锁升级优化）。

## 延伸阅读

- [Java 8 HashMap 源码分析](https://tech.meituan.com/2016/06/24/java-hashmap.html) — 美团技术博客
- [深入理解 JVM（第 3 版）](https://book.douban.com/subject/34907497/) — 周志明
- [JEP 333: ZGC 介绍](https://openjdk.org/jeps/333)

---

## 深度图解与高频面试题

### String 常量池与不可变性

```mermaid
flowchart TD
    A["String s1 = \"hello\""] --> B{"字符串常量池\n是否存在 hello?"}
    B -->|存在| C["s1 直接指向常量池中的对象"]
    B -->|不存在| D["常量池创建 hello\ns1 指向它"]

    E["String s2 = new String(\"hello\")"] --> F["堆中创建新对象\n内容同常量池中的 hello"]

    G["s1 == s2 → false（引用不同）\ns1.equals(s2) → true（内容相同）"]
```

**intern() 陷阱（JDK7+）：**
```java
String s1 = "ab";
String s2 = new String("a") + new String("b"); // 堆上新对象
s2.intern(); // JDK7+: 若常量池无"ab"，将堆对象引用放入常量池
String s3 = "ab";
System.out.println(s2 == s3); // JDK7+: true（s3复用了s2的引用）
System.out.println(s1 == s3); // true（s1和s3都指向常量池同一对象）
```

---

### equals 与 hashCode 契约

**核心约定：** `equals()` 返回 true 的两个对象，`hashCode()` 必须相同。

若只重写 `equals` 不重写 `hashCode`，相同内容的对象hashCode不同，HashMap/HashSet无法正常工作：
```java
class Student {
    String name;
    // 只重写了equals，未重写hashCode
    @Override
    public boolean equals(Object o) {
        return this.name.equals(((Student)o).name);
    }
}

Map<Student, String> map = new HashMap<>();
Student s1 = new Student("张三");
map.put(s1, "数学");

Student s2 = new Student("张三");
System.out.println(s1.equals(s2)); // true（内容相同）
System.out.println(map.get(s2));   // null！hashCode不同，定位到错误的桶
```

**正确实现：** 使用 `Objects.hash(name)` 或 IDE自动生成，确保equals相等的对象hashCode也相等。

---

### 高频面试Q&A

**Q: String、StringBuilder、StringBuffer 如何选择？**

A: 三者区别：① **String**：不可变，每次拼接创建新对象。适合字符串不变或极少拼接的场景；② **StringBuilder**：可变，**非线程安全**，无锁，性能最高。单线程大量字符串拼接首选（Java编译器会把循环外的 `+` 自动优化为StringBuilder）；③ **StringBuffer**：可变，**线程安全**（方法加synchronized），性能略低于StringBuilder。多线程共享构建字符串时使用（实际较少见）。面试结论：单线程用StringBuilder，多线程用StringBuffer，字符串常量用String。

**Q: Integer 的 == 比较有什么陷阱？**

A: Integer 缓存了 **-128 到 127** 的对象实例（`IntegerCache`），该范围内 `==` 比较返回true；超出范围则每次 `new Integer(n)` 创建新对象，`==` 比较引用返回false：
```java
Integer a = 127, b = 127;
System.out.println(a == b);  // true（常量池同一对象）

Integer c = 128, d = 128;
System.out.println(c == d);  // false（超出缓存，不同对象）
System.out.println(c.equals(d)); // true
```
**结论：** Integer比较一律用 `equals()` 或先拆箱为 int，不要用 `==`。

**Q: final 关键字有哪些用途？**

A: 三种：① **final 类**——不能被继承（如String、Integer），保证不可变性和安全性；② **final 方法**——不能被子类重写（override），防止行为被篡改；③ **final 变量**——引用不可变（基本类型则值不可变）。注意：`final` 修饰引用类型时，只保证引用地址不变，对象内部状态仍可修改（如 `final List<String> list` 仍可 `list.add()`）。匿名内部类访问外部变量时，该变量必须是 `final` 或 effectively final（JDK8+）。

**Q: 接口和抽象类的区别？JDK8后有什么变化？**

A: 传统区别：接口只能有抽象方法+常量，类只能单继承但可实现多接口；抽象类可以有实现方法和成员变量。JDK8新增：① **default方法**——接口可以有带实现的默认方法，解决接口升级时不破坏现有实现类的问题；② **static方法**——接口可以有静态工具方法。JDK9新增：③ **private方法**——接口的private方法供default方法内部复用逻辑。选择建议：IS-A关系（猫是动物）用抽象类；CAN-DO能力（可飞行、可游泳）用接口。

**Q: 说说Java中的四种引用类型？**

A: 从强到弱：① **强引用**（Strong）——普通引用 `Object obj = new Object()`，GC绝不回收；② **软引用**（SoftReference）——内存不足时才被回收，适合缓存（如图片缓存）；③ **弱引用**（WeakReference）——下次GC就会被回收，ThreadLocalMap的key就是弱引用（这也是内存泄漏的根源）；④ **虚引用**（PhantomReference）——无法通过引用获取对象，仅用于对象被GC后接收通知（配合ReferenceQueue）。实际使用最多的是软引用（缓存）和弱引用（防止内存泄漏）。
