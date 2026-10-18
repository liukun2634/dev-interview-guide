---
title: Bloom Filter 与变种
---

# Bloom Filter（布隆过滤器）

<span class="dig-tag dig-tag--category">数据结构与算法</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 高频（缓存/大数据必考）</span>

::: tip 💡 核心要点
**Bloom Filter** 用位图与多个哈希位置回答“可能存在”或“不在已插入集合中”。在完整插入、正确同步且没有误清位的前提下无假阴性，但允许假阳性。典型用途是先过滤明显不存在的 key，再查询真实存储。Counting BF、Cuckoo 和 XOR 分别提供不同的删除、空间与静态构建权衡，不能仅凭名字判断哪种最省内存。
:::

---

## 核心原理

### 数据结构

```
┌─────────────────────────────────────────────────────┐
│ bit 数组（长度 m）：                                  │
│ [0|0|1|0|1|1|0|0|1|0|1|0|0|1|...|0]                 │
└─────────────────────────────────────────────────────┘
        ↑               ↑           ↑
        │               │           │
     hash1(x)        hash2(x)    hashk(x)
```

| 操作 | 流程 | 复杂度 |
|------|------|--------|
| **add(x)** | 用 k 个独立 hash 函数算出 k 个位置，全部置 1 | O(k) |
| **contains(x)** | 算出 k 个位置，**全部为 1** → "可能存在"；**任一为 0** → "绝对不存在" | O(k) |
| **delete(x)** | **❌ 不能删** —— 多个元素可能共享同一 bit | — |

### 假阳率推导（必背公式）

```
m = 位数组长度
n = 已插入元素数
k = hash 函数数量

插入 n 个元素后，某个 bit 仍为 0 的概率：
  p_0 = (1 - 1/m)^(kn) ≈ e^(-kn/m)

假阳率（false positive rate, FPR）：
  P_fp = (1 - p_0)^k ≈ (1 - e^(-kn/m))^k
```

**给定 n 和目标 FPR，最优参数：**
```
最优 m（位数组长度）= -(n × ln(FPR)) / (ln 2)²
最优 k（hash 数量）= (m/n) × ln 2
```

### 空间估算速查表

| 元素数 n | 目标 FPR | 最优 m（bit）| 最优 k | 实际内存 |
|---------|---------|-------------|--------|---------|
| 100 万 | 1% | 9.6 M bit | 7 | **1.2 MB** |
| 100 万 | 0.1% | 14.4 M bit | 10 | **1.8 MB** |
| 1 亿 | 1% | 958 M bit | 7 | **120 MB** |
| 1 亿 | 0.1% | 1.44 G bit | 10 | **180 MB** |
| 1 亿 | 0.01% | 1.92 G bit | 14 | **240 MB** |
| 10 亿 | 1% | 9.6 G bit | 7 | **1.2 GB** |

> **对比 HashSet**：1 亿 String key（平均 16 字节）≈ **3-5 GB**（含 Java 对象头 / 引用 / HashMap.Entry 开销）。**Bloom Filter 省 25-40 倍**。

---

## Java 实现：从原理到生产

### 实现 1：手撸版（面试白板）

```java
public class BloomFilter {
    private final BitSet bits;
    private final int m;          // bit 数组长度
    private final int k;          // hash 函数数量
    private final HashFunction[] hashFunctions;

    public BloomFilter(int n, double fpr) {
        // 公式计算最优参数
        this.m = (int) Math.ceil(-n * Math.log(fpr) / (Math.log(2) * Math.log(2)));
        this.k = Math.max(1, (int) Math.round((double) m / n * Math.log(2)));
        this.bits = new BitSet(m);
        this.hashFunctions = buildHashes(k);
    }

    public void add(String key) {
        for (int i = 0; i < k; i++) {
            int idx = Math.floorMod(hashFunctions[i].hash(key), m);
            bits.set(idx);
        }
    }

    public boolean mightContain(String key) {
        for (int i = 0; i < k; i++) {
            int idx = Math.floorMod(hashFunctions[i].hash(key), m);
            if (!bits.get(idx)) return false;    // ★ 一个 0 → 绝对不存在
        }
        return true;                              // 可能存在
    }

    /** 双哈希技巧：只用 2 个 hash 合成 k 个 → 避免维护 k 个独立函数 */
    private HashFunction[] buildHashes(int k) {
        HashFunction[] arr = new HashFunction[k];
        for (int i = 0; i < k; i++) {
            final int seed = i;
            arr[i] = key -> {
                // h_i(x) = h1(x) + i * h2(x)  （Kirsch-Mitzenmacher 定理证明等效独立）
                int h1 = MurmurHash3.hash32(key, 0);
                int h2 = MurmurHash3.hash32(key, 0x9747b28c);
                return h1 + seed * h2;
            };
        }
        return arr;
    }

    @FunctionalInterface
    interface HashFunction { int hash(String key); }
}
```

::: tip 💡 双哈希技巧（Kirsch-Mitzenmacher，2006）
可以在合适的哈希与参数条件下，通过 `h_i(x)=h1(x)+i*h2(x)` 获得与独立哈希相同的渐近假阳率，并减少哈希计算。它不代表生成的 k 个值真的相互独立，也不保证总性能固定提升 k 倍。上面的接口示意在每个函数内重复计算 h1、h2；实际实现应在一次 add / query 中预先计算两者，再循环组合，且要明确整数回绕与取模规则。`MurmurHash3` 还需要所选库对应的导入和 API，不是 JDK 内置类。
:::

### 实现 2：Guava（生产推荐）

```java
import com.google.common.hash.BloomFilter;
import com.google.common.hash.Funnels;

// 预期 100 万元素，假阳率 0.1%
BloomFilter<String> bf = BloomFilter.create(
    Funnels.stringFunnel(StandardCharsets.UTF_8),
    1_000_000,                       // expectedInsertions
    0.001                            // fpp
);

bf.put("user:123");
bf.mightContain("user:123");         // true
bf.mightContain("user:999");         // 几乎肯定 false（0.1% 概率假阳）

// 序列化（持久化到磁盘 / Redis）
try (var out = new ObjectOutputStream(new FileOutputStream("bf.bin"))) {
    bf.writeTo(out);
}

// 反序列化
try (var in = new ObjectInputStream(new FileInputStream("bf.bin"))) {
    BloomFilter<String> restored = BloomFilter.readFrom(in, Funnels.stringFunnel(StandardCharsets.UTF_8));
}
```

### 实现 3：Redis BloomFilter（分布式）

Redis 7.2+ 通过 **RedisBloom 模块** 内置（部分发行版默认开启），或用 Bitmap 自己实现：

```bash
# 用 RedisBloom 模块（推荐）
BF.RESERVE users:bf 0.001 1000000     # 创建：FPR 0.001，预期 100 万
BF.ADD users:bf "user:123"             # 添加
BF.EXISTS users:bf "user:999"          # 查询 → 0
BF.MEXISTS users:bf "a" "b" "c"        # 批量查询

# 用 Redisson（Java 客户端封装，基于 Bitmap）
RBloomFilter<String> bf = redisson.getBloomFilter("users:bf");
bf.tryInit(1_000_000, 0.001);
bf.add("user:123");
bf.contains("user:999");
```

**典型场景：缓存穿透防御**

```java
@GetMapping("/users/{id}")
public User get(@PathVariable String id) {
    // 1. 布隆挡一层（1ms 内 ）
    if (!bloomFilter.mightContain(id)) {
        return User.notFound();              // ★ 绝对不存在，直接拒绝
    }
    // 2. 查缓存（10ms 内）
    User u = redis.get("user:" + id);
    if (u != null) return u;
    // 3. 查数据库
    u = userRepo.findById(id).orElse(null);
    if (u != null) redis.set("user:" + id, u, Duration.ofMinutes(10));
    return u;
}
```

详见 [Redis 缓存穿透防御](../../engineering-practice/redis#_3-缓存穿透-击穿-雪崩)。

---

## Bloom Filter 三大变种（2026 面试必背）

### 变种 1：Counting Bloom Filter（支持删除）

**问题**：标准 BF 不能删除——bit 共享导致"删一个会影响多个"。
**方案**：把 bit 改成 **小计数器**（通常 4 bit）：

```
[0|0|1|0|2|3|0|0|1|0|1|0|0|3|...|0]
        ↑       ↑           ↑
     hash1   hash2        hashk
   add: 全部 +1
   delete: 全部 -1（变 0 即清除）
```

| 维度 | 标准 BF | Counting BF |
|------|---------|-------------|
| 删除 | ❌ | ✅ |
| 内存 | 1× | **4×**（4 bit / 元素位置）|
| 计数器溢出 | — | ❗ 必须考虑（4 bit 最大 15，超过就饱和）|

**适合**：动态集合（数据库黑名单可删除元素）。
**不适合**：纯插入场景（用标准 BF 即可）。

### 变种 2：Cuckoo Filter（指纹 + 支持删除）

**Cuckoo Filter** 用指纹和两个候选桶表示集合，支持删除。是否比 Bloom 更省空间，取决于目标误判率、桶容量、装载率和编码方式，不存在固定的“省 40%”：

```
原理：每个元素存储 8-16 bit "指纹（fingerprint）"
      用 cuckoo hashing 解决冲突（被踢出的元素找另一个 bucket）

bucket 0: [fp1, fp2, ___, ___]
bucket 1: [fp3, ___, ___, ___]
bucket 2: [fp4, fp5, ___, ___]
...
```

| 维度 | Bloom Filter | **Cuckoo Filter** |
|------|--------------|-------------------|
| 目标假阳率不超过 1% 的空间估算 | 约 9.6n bit | 约 10.53n bit（下述普通四槽桶参数） |
| 目标假阳率不超过 0.1% 的空间估算 | 约 14.4n bit | 约 13.69n bit（下述普通四槽桶参数） |
| 删除 | ❌ | ✅ |
| 查询性能 | O(k) hash | O(1) 两次 hash |
| 插入失败 | 固定数组置位不会因装载而失败，但误判率会升高 | 搬移次数受限时可能失败；高装载增加风险，95% 不是硬阈值 |
| 并发友好 | ✅ | ⚠️ 写需要 lock |

**如何算这些数？** 设每桶 4 槽、检查两个桶、每个指纹 f 位，误判率近似受 `8/2^f` 控制。取 f=10 和 f=13，可分别满足上面两个目标；按 95% 装载率估算空间为 `f/0.95` bit/元素。未计元数据、对齐与扩容冗余，半排序等压缩变种还会改变结果。

**适合**：需要动态删除且能处理插入失败的集合。SSTable 往往不可变，不一定需要删除；不能因此宣称 HBase、LevelDB 等都已默认替换成 Cuckoo Filter。

### 变种 3：XOR Filter（静态集合的紧凑表示）

**XOR Filter** 在构建阶段求出一个指纹数组，使每个已插入 key 对应的三个槽异或后等于该 key 的指纹。查询只比较这两个值；通常不支持原地增删，需要重建。它是紧凑方案之一，不是无条件“空间最优”。

| 维度 | BF | Cuckoo | **XOR** |
|------|----|---------|----------|
| 目标 FPR ≤ 1% 的位空间估算 | 9.6 bit | 10.53 bit | 8.61 bit（7 位指纹） |
| 目标 FPR ≤ 0.1% 的位空间估算 | 14.4 bit | 13.69 bit | 12.30 bit（10 位指纹） |
| 查询速度 | k 次 hash | 2 次 hash | **3 次 hash + XOR** |
| 插入 / 删除 | 支持插入 / 不支持删除 | 支持插入但可能失败 / 支持有前提的删除 | 通常需要重建 |
| 适合 | 通用 | 动态集合 | **静态集合**（构建慢但查询超快）|

**适合**：CDN 的 URL 黑名单、邮件去重词典等**只构建一次反复查询**的场景。

### 为什么 6.4 bit / 1% 不成立

在通常的大值域、无假阴性的近似集合成员查询模型下，每元素空间的渐近信息论下界为 `log2(1/epsilon)`，1% 对应约 6.64 bit，0.1% 对应约 9.97 bit。不能把低于此下界的 6.4、9.6 当成通用 XOR Filter 的参数。

[原论文](https://arxiv.org/html/1912.08258) 的标准构造使用约 `1.23n + 32` 个槽。f 位指纹的假阳率约为 `2^-f`，忽略小规模元数据后空间约为 `1.23f` bit/元素。因此表中 7 位实际约为 0.78125%，10 位约为 0.09765625%，并非恰好等于目标值。表格假设位打包；常见 8 位实现约 9.84 bit/元素、误判率约 0.390625%，不能把位打包估算直接当成库的实际内存。

比较过滤器时应固定相同目标误判率，再列清指纹长度、装载率、对齐、是否可变、构建失败重试和元数据；否则只比较一个“每元素几 bit”的数字会误导选型。

### 假阳率不是“查询结果有多少是假的”

假阳率是 `P(返回存在 | 实际不存在)`，不是 `P(实际不存在 | 返回存在)`。例如 100,000 次查询中只有 100 次真实命中，p=1% 时，其余 99,900 次查询约产生 999 个假阳性；所有约 1099 个阳性结果中，约 91% 都是假阳性。因此仍需真实存储二次确认。

“无假阴性”只针对已经完整插入、没有损坏或错误删除的过滤器集合。数据库新增记录未同步到过滤器、并发位更新丢失或恢复了旧快照，都可能让业务上存在的数据被过滤掉；这不是数学性质失效，而是维护条件被破坏。

Counting / Cuckoo 删除必须确认元素确实已插入且尚未删除，不能仅凭 `mightContain=true` 就删，否则一次假阳性可能误删其他元素的计数或指纹。计数器饱和后再普通递减也不安全：溢出期间丢失了真实数量，需要更宽计数、溢出记录或重建策略。

### 一句话决策

| 场景 | 选 |
|------|---|
| 通用、需要简单 | **Bloom Filter** |
| 需要支持删除 | **Counting BF** 或 **Cuckoo Filter** |
| 内存极致优化 + 静态数据 | **XOR Filter** |
| 并发写为主 | **Bloom Filter** |
| LSM-Tree 的不可变文件过滤 | 按具体引擎支持选择 Bloom、Ribbon 等；静态结构不一定需要删除能力 |

---

## 生产应用速查

| 系统 | 用 Bloom Filter 干嘛 | 选哪种 |
|------|---------------------|--------|
| **Redis 缓存穿透防御** | 拦截 DB 中不存在的 key | 标准 BF |
| **HBase / Cassandra / LevelDB / RocksDB** | SSTable 过滤：可能存在才继续读文件 | Bloom 常见；RocksDB 也支持 Ribbon，取决于版本与配置 |
| **Bitcoin / Blockchain** | 钱包同步时只下载相关交易 | 标准 BF |
| **Chrome 安全浏览** | 50 MB 的本地恶意 URL 库（无需联网即可初筛） | 标准 BF |
| **Squid / Varnish 缓存** | 多级缓存命中预判 | 标准 BF |
| **Spam Filter / 推荐去重** | "用户已经看过这个内容" | Counting BF（可过期清理） |
| **大数据 JOIN 优化（Spark）** | Bloom Join：先用 BF 过滤大表 | 标准 BF |
| **Bigtable 行键预过滤** | 避免读取不存在 key 的 Tablet | 标准 BF |
| **列存储分区过滤** | 跳过不可能匹配的分区 | 须核对具体产品实现，不能由用途推断采用 XOR |

---

## 面试常问 & 怎么答

### Q1: Bloom Filter 的原理和复杂度？

**结构**：长度 m 的 bit 数组 + k 个独立 hash 函数。**add(x)**：用 k 个 hash 算出 k 个位置全部置 1。**contains(x)**：k 个位置**全为 1** 才返回"可能存在"；**任一为 0** 必然返回"绝对不存在"。**复杂度**：插入 / 查询都是 **O(k)**——k 通常是 7-14，**近似 O(1)**。**空间**：远低于 HashSet——1 亿元素 0.1% FPR 仅 180 MB。

### Q2: Bloom Filter 有没有"假阴"（漏报）？为什么？

**没有假阴，只有假阳**。**逻辑**：① 假阴 = "实际存在但 contains 返回 false" → 不可能，因为 add 时所有 k 个 bit 都被置 1，contains 时如果有任何一个 bit 为 0 说明从未被任何元素置 1，即一定没插入过；② 假阳 = "实际不存在但 contains 返回 true" → 可能，多个元素的 hash 位置碰撞导致 k 个 bit 都恰好被其他元素置 1。**结论**：Bloom Filter 的"绝对不存在"是 100% 可信的，所以适合"先用它挡一层"的过滤场景。

### Q3: 怎么选 m 和 k？

**给定 n（元素数）和目标 FPR**：
- **最优 m** = `-n × ln(FPR) / (ln 2)²`
- **最优 k** = `(m/n) × ln 2 ≈ 0.693 × (m/n)`

**简单口诀**：① 1% FPR → 每元素 9.6 bit、7 个 hash；② 0.1% FPR → 14.4 bit、10 个 hash；③ 0.01% FPR → 19.2 bit、14 个 hash。**直接用 Guava `BloomFilter.create(n, fpp)` 让它帮你算**。

### Q4: 为什么 Bloom Filter 不支持删除？怎么解决？

多个元素可能共享 bit，直接清零会误伤其他元素。Counting BF 用计数器，Cuckoo Filter 用桶内指纹支持删除，但都要保证删除对象真实存在，并处理溢出或插入失败。空间优势要按具体参数计算，不存在固定节省比例。

### Q5: Bloom Filter vs HashSet 怎么选？

需要精确成员判断、遍历或直接删除时用 HashSet；海量 key 的前置过滤可以用 Bloom，空间收益取决于 key 类型和对象开销。假阳性意味着数据库通常会返回不存在，只是增加一次无效查询；真实查询才负责最终答案，不能把“可能存在”直接当成命中。

### Q6: Cuckoo Filter 比 Bloom 强在哪？

主要能力是支持删除，以及只探查两个候选桶。它不保证所有参数下更省内存或更快；高装载下还需要处理插入失败，并发写也更复杂。动态集合可以评估 Cuckoo，静态集合还应比较 Bloom、XOR 等，按同一误判率与真实负载测试。

### Q7: Redis 怎么实现布隆过滤器？

**两种方案**：① **RedisBloom 模块**（Redis 7.2+ 部分发行版内置）—— 命令 `BF.RESERVE / BF.ADD / BF.EXISTS / BF.MEXISTS`；不需要自己管理 bit；② **自己用 Bitmap**（Redisson 封装的 `RBloomFilter` 即此方案）—— 用 `SETBIT / GETBIT` 操作 Redis Bitmap；不依赖模块、通用性强；但要自己实现 k 个 hash + 序列化。**生产推荐 RedisBloom 模块**（如果可用）。

---

## 常见陷阱

::: warning ⚠️ 8 大新手坑

1. **混淆条件概率** —— 1% FPR 针对实际不存在的查询，不代表返回 true 的结果只有 1% 是假的
2. **n（元素数）估错** —— 实际比预期多 10 倍 → FPR 飙升 10+ 倍；**估计要保守 + 留 20% 余量**
3. **直接删元素**（标准 BF） —— **会误伤其他元素**；要删用 Counting BF / Cuckoo Filter
4. **k 个 hash 真的写 k 个函数** —— 浪费；用双哈希技巧 `h1 + i × h2` 合成
5. **用 String.hashCode()** 当 hash —— **冲突率高且非独立**；用 MurmurHash3 / xxHash
6. **没考虑 k 的上下限** —— k 太大（如 20）→ 每次查询 20 次 hash 拖慢；公式算的 k 应限制在 ≤ 15
7. **持久化忘记位数组长度** —— 反序列化时 m / k 对不上就全部失效；序列化要带元信息
8. **分布式场景串行测试** —— BF 状态在所有节点不一致；用 Redis 集中存储或定期全量重建
:::

---

## 看到什么就先想到这类

- **"判断元素是否存在 + 海量数据 + 容忍假阳"** → Bloom Filter
- **"缓存穿透防御"** → Bloom Filter 挡一层
- **"HBase / RocksDB / LevelDB SSTable 索引"** → Bloom Filter 或 Cuckoo Filter
- **"需要删除元素的存在性判断"** → Counting BF 或 Cuckoo Filter
- **"内存极致优化 + 静态数据"** → XOR Filter
- **"假阳率 1% 多少内存"** → 9.6 bit / 元素 + 7 个 hash
- **"双哈希技巧"** → Kirsch-Mitzenmacher，2 个 hash 合成 k 个
- **"Bloom Filter 怎么不支持删除"** → bit 共享 → Counting BF 或 Cuckoo
- **"分布式 Bloom"** → Redis Bitmap / RedisBloom 模块
- **"Spark Bloom Join"** → 大表过滤优化

## 延伸阅读

- 📄 [HyperLogLog（基数估计）](../arrays/roaring-bitmap) — 概率数据结构兄弟
- 📄 [Redis 缓存穿透 / 击穿 / 雪崩](../../engineering-practice/redis#_3-缓存穿透-击穿-雪崩)
- 📄 [Roaring Bitmap](../arrays/roaring-bitmap) — 大数据精确去重
- 📄 [一致性哈希](../../computer-networks/cdn-load-balancing#一致性哈希实战-虚拟节点数的工程经验) — 同为分布式系统经典
- 🔗 [Bloom Filter Calculator](https://hur.st/bloomfilter/) — 在线计算最优 m / k
- 🔗 [Cuckoo Filter Paper (Fan et al., 2014)](https://www.cs.cmu.edu/~dga/papers/cuckoo-conext2014.pdf)
- 🔗 [XOR Filter Paper (Graf & Lemire, 2019)](https://arxiv.org/abs/1912.08258)
- 🔗 [RedisBloom 文档](https://redis.io/docs/data-types/probabilistic/bloom-filter/)
