---
title: RoaringBitmap
---

# RoaringBitmap — 大数据去重 / 集合运算的新标准

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
RoaringBitmap = **"分桶 + 三种桶内编码（数组/位图/Run）"**——对稀疏数据用数组、稠密数据用位图、连续数据用 Run-Length 编码。**比 BitSet 省 100×内存、比 HashSet 省 10×内存、集合运算快 10-100×**。Elasticsearch / ClickHouse / Druid / Spark 全部用它做精确去重和倒排索引压缩，是 2026 大数据岗位必考。
:::

## 为什么单独讲它

「**统计今天有多少独立用户访问**」类问题，方案对比：

| 方案 | 内存 | 精度 | 集合运算（与/或/非） |
|------|------|------|------|
| `HashSet<Integer>` | n × ~50 字节 | 精确 | O(n) 遍历 |
| **Java BitSet** | 2³² / 8 = **512 MB**（固定）| 精确 | O(N) word，超快 |
| HyperLogLog | **12 KB** | **0.81% 误差** | 困难（需特殊算法） |
| **RoaringBitmap** | **几 KB ~ 几 MB**（按数据稀疏度自适应） | **精确** | **超快（向量化）** |

**核心痛点**：BitSet 只要存最大值是 2³² 就要 512MB（哪怕只存 10 个值）。HyperLogLog 省到 12KB 但是近似算法。**RoaringBitmap 既精确又省内存**，2016 年成为大数据界的事实标准。

## 数据结构核心：高 16 位分桶

把 32 位整数拆成：**高 16 位（桶号）+ 低 16 位（桶内偏移）**。最多 2¹⁶ = 65536 个桶。

```
整数 0x12345678 → 桶号 0x1234，桶内 0x5678
整数 0x12340099 → 桶号 0x1234，桶内 0x0099
                  └─ 同桶 ─┘
```

桶号用 `short[] keys` 排序存储 + 二分查找。

**精髓**：每个桶内 65536 个候选值，**根据稠密度自动选三种编码之一**：

| 桶类型 | 触发条件 | 编码 | 单桶内存 |
|------|------|------|------|
| **ArrayContainer** | 元素 ≤ 4096 | `short[]` 升序数组 | 2 × n 字节 |
| **BitmapContainer** | 元素 > 4096 | `long[1024]` 位图（8192 字节） | 8192 字节 |
| **RunContainer** | 连续段多（< 桶数 × 4 字节） | `short[]` 存 (start, length) 对 | 极省 |

**自适应阈值**：4096 是因为 4096 × 2 = 8192 字节 = BitmapContainer 大小，超过这个值用位图反而省。

### 三种 Container 选型示意

```
桶 0x0001：[5, 100, 7000, 30000]           → ArrayContainer (4 元素 ≤ 4096)
桶 0x0002：[0, 1, 2, ..., 65535]           → BitmapContainer (满桶，2 字节 vs 8KB? 满桶位图反而最省)
桶 0x0003：[100, 101, ..., 5000]           → RunContainer (一段连续 → 仅 1 对 (100, 4900))
```

## 完整代码（简化教学版）

实际 Java 用 [RoaringBitmap 官方库](https://github.com/RoaringBitmap/RoaringBitmap)。下面是**教学骨架**展示核心思路：

```java
class RoaringBitmap {
    private static class Container {
        // 三种实现：ArrayContainer / BitmapContainer / RunContainer
        // ... 省略实现，按桶内元素个数自动转换
        abstract void add(short value);
        abstract boolean contains(short value);
        abstract Container or(Container other);
        abstract Container and(Container other);
        abstract int cardinality();
    }

    // ★ 排序的桶号数组 + 对应 container 数组
    private short[] keys = new short[16];           // 高 16 位
    private Container[] values = new Container[16];
    private int size = 0;

    public void add(int x) {
        short hi = (short) (x >>> 16);              // 高 16 位
        short lo = (short) (x & 0xFFFF);            // 低 16 位

        int idx = Arrays.binarySearch(keys, 0, size, hi);
        if (idx >= 0) {
            values[idx].add(lo);                    // 已有桶
        } else {
            // 新建桶（位置在 -idx-1）
            insertBucket(-idx - 1, hi, new ArrayContainer().add(lo));
        }
    }

    public boolean contains(int x) {
        short hi = (short) (x >>> 16);
        short lo = (short) (x & 0xFFFF);
        int idx = Arrays.binarySearch(keys, 0, size, hi);
        return idx >= 0 && values[idx].contains(lo);
    }

    /** 集合并（or）：两个 RB 的桶按 key 归并，桶内 container 做 or */
    public RoaringBitmap or(RoaringBitmap other) {
        RoaringBitmap result = new RoaringBitmap();
        int i = 0, j = 0;
        while (i < size && j < other.size) {
            if (keys[i] == other.keys[j]) {
                result.append(keys[i], values[i].or(other.values[j]));   // ★ 同桶合并
                i++; j++;
            } else if (keys[i] < other.keys[j]) {
                result.append(keys[i], values[i]);
                i++;
            } else {
                result.append(other.keys[j], other.values[j]);
                j++;
            }
        }
        // 剩余尾部直接追加
        while (i < size) { result.append(keys[i], values[i]); i++; }
        while (j < other.size) { result.append(other.keys[j], other.values[j]); j++; }
        return result;
    }
}
```

### BitmapContainer 的 `and / or` 是 SIMD 友好的

```java
// 两个 long[1024] 位图求交：用 long 一次处理 64 位
class BitmapContainer {
    long[] bitmap = new long[1024];

    public BitmapContainer and(BitmapContainer other) {
        BitmapContainer result = new BitmapContainer();
        for (int i = 0; i < 1024; i++) {
            result.bitmap[i] = this.bitmap[i] & other.bitmap[i];  // ★ JIT 会用 AVX2/AVX-512
        }
        return result;
    }
}
```

JIT 编译器会自动向量化这种循环（AVX-512 一次处理 512 bit = 8 个 long），**实测比 HashSet.retainAll() 快 50-100 倍**。

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 把 RoaringBitmap 当 BitSet 用 | 64 位整数无法直接存 | **存 32 位用 `RoaringBitmap`，存 64 位用 `Roaring64NavigableMap`** |
| 不调用 `runOptimize()` | RunContainer 不会自动开启，错失连续数据压缩 | 写完后调一次 `bitmap.runOptimize()`，体积可再降 50% |
| 持久化用 Java 默认序列化 | 慢且不跨语言 | 用官方 `serialize(DataOutput)` 紧凑格式（Elasticsearch / Lucene 都用） |
| 大量 add 单值 | 频繁触发 ArrayContainer → BitmapContainer 转换 | 用 `addN(int[])` 批量添加 |
| 并发读写无锁 | 数据损坏 | RoaringBitmap **非线程安全**，写时加锁或用 `ImmutableRoaringBitmap` |

## 复杂度

- **add / contains / remove**：O(log n + k)，n = 桶数，k = 桶内查找成本
- **and / or / xor**：O(n)，n = 桶数；桶内位图运算可向量化到 O(1) per 64 bit
- **空间**：**自适应**，最坏 ~ 数据元素数 × 几字节；稠密区接近位图、稀疏区接近数组

## 业界应用

| 系统 | 用法 |
|------|------|
| **Elasticsearch / Lucene** | 倒排索引的 docId 集合存储，过滤器缓存 |
| **ClickHouse** | `bitmapAnd` / `bitmapOr` 函数实现"X 标签 ∩ Y 标签"用户群分析 |
| **Apache Druid** | 维度过滤的倒排索引 |
| **Apache Spark** | RDD 元素去重统计、行号集合 |
| **Apache Kylin** | 多维分析的精确 Count Distinct |
| **Pinot / Doris / StarRocks** | OLAP 查询过滤器、`bitmap_union` 用户去重 |
| **Twitter** | 用户社交图谱的位图存储 |

## 典型大数据应用：用户群运营

**场景**："**北京 18-25 岁 + 看过抖音 + 没付费**" 的用户数？

```sql
-- ClickHouse SQL
SELECT bitmapCardinality(
    bitmapAnd(
        bitmapAnd(city_beijing, age_18_25),
        bitmapAndnot(viewed_douyin, paid_users)
    )
);
-- 1 亿用户、4 个集合交并差 → 毫秒级
```

后面其实就是 4 个 RoaringBitmap 做位运算。对比 `IN (SELECT ...) AND IN (SELECT ...)` 这种 SQL JOIN 会要几十秒。

## 进阶：Roaring64 与 ZSTD 压缩组合

- **`Roaring64NavigableMap`**：32 位不够（如 UUID hash、订单 ID），换 64 位版本
- **磁盘存储**：`runOptimize()` + Snappy/ZSTD 二次压缩，常见再省 20-30%
- **MutableRoaringBitmap vs ImmutableRoaringBitmap**：写用 Mutable，读用 Immutable（零拷贝、mmap 友好）

## 面试常问 & 怎么答

### 为什么不直接用 BitSet

Java `BitSet` 的内存与最大值线性相关。存 10 个值最大 2³² → 强制 512MB。RoaringBitmap **按数据稠密度自适应**，10 个值只用几十字节。

### 为什么不用 HashSet

`HashSet<Integer>` 单个元素 ~50 字节（Integer 16 + Entry 32 + 哈希桶指针），1 亿 UV → 5GB。RoaringBitmap 1 亿稠密 UV ~ 100MB，稀疏更省。**集合运算**：HashSet `retainAll` 是 O(n) 元素级；RoaringBitmap 是 O(桶数) + 桶内向量化。

### 跟 HyperLogLog 怎么选

- **精确去重要求** → RoaringBitmap（精确）
- **只要 UV 估算，能容忍 1% 误差，内存极端紧张** → HyperLogLog（12KB 顶 RoaringBitmap 几 MB）
- **要 A ∩ B、A 减 B 等集合运算** → RoaringBitmap（HLL 集合运算很别扭）

### 三种 Container 怎么选

RoaringBitmap 自动选：
- < 4096 元素 → ArrayContainer（数组省）
- ≥ 4096 元素 → BitmapContainer（位图省）
- 连续段多 → RunContainer（Run-Length 极省）

阈值 4096 来自数学推导：4096 × 2 字节 = 8192 字节 = 位图大小，超过位图反而省。

### Elasticsearch 怎么用它

ES 的 **filter cache** 把"满足某个 filter 的 docId 集合"存成 RoaringBitmap。下次同样 filter 来直接位图 AND，跳过倒排链表扫描。这是 ES 高性能 filter 的核心。

## 看到什么就先想到这类

- "精确 UV 去重 / Count Distinct" → RoaringBitmap
- "用户标签集合的交并差" → RoaringBitmap
- "倒排索引的 docId 集合" → RoaringBitmap（Lucene / ES 都用）
- "1 亿数据求交集" → RoaringBitmap 比 HashSet 快 100×
- "面试官问'BitSet 不行吗'" → 内存固定 2^N / 8，太浪费
- "Bitmap 索引存储" → ClickHouse / Druid 的核心数据结构
