---
title: Bloom Filter 与变种
---

# Bloom Filter（布隆过滤器）

<span class="dig-tag dig-tag--category">数据结构与算法</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 高频（缓存/大数据必考）</span>

::: tip 💡 核心要点
**Bloom Filter** 用 **位图 + k 个独立 hash 函数** 解决"快速判断元素是否存在"——**只有"可能存在"和"绝对不存在"两种答案**（一定存在的判断不可能）。**面试金句**：「Bloom Filter 是用**误判换内存** —— 1 亿元素只要 120 MB，但有 1% 假阳率；**绝对没有假阴**，所以适合"先用布隆挡一层、再走真实查询"的场景」。生产应用：① Redis 防缓存穿透；② HBase / LevelDB / Cassandra 的 SSTable 索引；③ Chrome 恶意 URL 库；④ Bitcoin 钱包同步。**变种**：Counting BF（支持删除）/ Cuckoo Filter（更省空间）/ XOR Filter（最优空间）。
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
**不需要真的实现 k 个独立 hash 函数**！数学证明：用两个独立 hash `h1` 和 `h2`，通过 `h_i(x) = h1(x) + i × h2(x)` 合成 k 个 hash，**统计性质与 k 个独立 hash 完全等效**——但**性能提升 k 倍**。Guava 和 Cassandra 都用这个技巧。
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

详见 [Redis 缓存穿透防御](../../engineering-practice/redis#3-缓存穿透-击穿-雪崩)。

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

### 变种 2：Cuckoo Filter（更省 + 支持删除）

**布谷鸟过滤器** 是 2014 年提出的更先进方案——**支持删除 + 内存比 BF 省 40%**：

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
| 假阳率 1% 内存（n 元素）| 9.6n bit | **8n bit** ✅ |
| 假阳率 0.1% 内存 | 14.4n bit | **12n bit** ✅ |
| 删除 | ❌ | ✅ |
| 查询性能 | O(k) hash | O(1) 两次 hash |
| 插入失败 | 不可能 | **load factor > 95% 可能失败**（需 rebuild） |
| 并发友好 | ✅ | ⚠️ 写需要 lock |

**适合**：HBase / LevelDB 的 SSTable 索引（不再用 BF）；现代 NoSQL 默认选 Cuckoo。

### 变种 3：XOR Filter（最优空间）

**XOR Filter**（2019）是**当前已知空间最优的 AMQ 结构**：

| 维度 | BF | Cuckoo | **XOR** |
|------|----|---------|----------|
| 1% FPR 内存（每元素）| 9.6 bit | 8 bit | **6.4 bit** ✅ |
| 0.1% FPR 内存 | 14.4 bit | 12 bit | **9.6 bit** ✅ |
| 查询速度 | k 次 hash | 2 次 hash | **3 次 hash + XOR** |
| 删除 / 更新 | ❌ / ❌ | ✅ / ❌ | ❌ / ❌ |
| 适合 | 通用 | 动态集合 | **静态集合**（构建慢但查询超快）|

**适合**：CDN 的 URL 黑名单、邮件去重词典等**只构建一次反复查询**的场景。

### 一句话决策

| 场景 | 选 |
|------|---|
| 通用、需要简单 | **Bloom Filter** |
| 需要支持删除 | **Counting BF** 或 **Cuckoo Filter** |
| 内存极致优化 + 静态数据 | **XOR Filter** |
| 并发写为主 | **Bloom Filter** |
| HBase / LSM-Tree 索引 | **Cuckoo Filter** |

---

## 生产应用速查

| 系统 | 用 Bloom Filter 干嘛 | 选哪种 |
|------|---------------------|--------|
| **Redis 缓存穿透防御** | 拦截 DB 中不存在的 key | 标准 BF |
| **HBase / Cassandra / LevelDB / RocksDB** | SSTable 索引："这个 key **可能** 在该 SSTable 中" → 跳过不存在的 SSTable | **Cuckoo Filter**（新版） |
| **Bitcoin / Blockchain** | 钱包同步时只下载相关交易 | 标准 BF |
| **Chrome 安全浏览** | 50 MB 的本地恶意 URL 库（无需联网即可初筛） | 标准 BF |
| **Squid / Varnish 缓存** | 多级缓存命中预判 | 标准 BF |
| **Spam Filter / 推荐去重** | "用户已经看过这个内容" | Counting BF（可过期清理） |
| **大数据 JOIN 优化（Spark）** | Bloom Join：先用 BF 过滤大表 | 标准 BF |
| **Bigtable 行键预过滤** | 避免读取不存在 key 的 Tablet | 标准 BF |
| **Google Bigquery / Snowflake** | 列存储跳过不可能匹配的 partition | XOR Filter |

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

**根因**：多个元素的 hash 可能落在同一 bit；删除一个元素时清掉那 k 个 bit，**会误伤其他元素**。**两种方案**：① **Counting Bloom Filter** —— bit 变 4-bit 计数器，add 时 +1、delete 时 -1；**代价是内存 4×**；② **Cuckoo Filter** —— 直接抛弃 BF 结构，用 fingerprint + cuckoo hashing，**原生支持删除且内存更省 40%**；现代生产首选。

### Q5: Bloom Filter vs HashSet 怎么选？

**HashSet 优势**：① **无假阳**（精确）；② 支持遍历；③ 支持删除。**Bloom 优势**：① **内存少 25-40×**（1 亿元素 BF 180 MB vs HashSet 3-5 GB）；② 查询恒定 O(k)；③ 适合分布式（位图易序列化）。**决策**：① 需要精确 → HashSet；② 海量数据 + 容忍假阳 + 内存紧张 → BF；③ 缓存穿透防御场景 → BF（FPR 1% 意味着 1% 假阳数据库还能查到、不会有错的副作用）。

### Q6: Cuckoo Filter 比 Bloom 强在哪？

**三个核心改进**：① **空间更省 ~20%**（1% FPR：BF 9.6 bit/元素 vs Cuckoo 8 bit）；② **原生支持删除**（BF 不支持）；③ **查询更快**（恒定 2 次 hash vs BF 的 k 次）。**代价**：① load factor 接近 100% 时**插入可能失败**，需要 rebuild；② 并发写需要 lock；③ 实现复杂度高于 BF。**结论**：动态集合优先 Cuckoo；纯插入静态场景 BF 仍可用。

### Q7: Redis 怎么实现布隆过滤器？

**两种方案**：① **RedisBloom 模块**（Redis 7.2+ 部分发行版内置）—— 命令 `BF.RESERVE / BF.ADD / BF.EXISTS / BF.MEXISTS`；不需要自己管理 bit；② **自己用 Bitmap**（Redisson 封装的 `RBloomFilter` 即此方案）—— 用 `SETBIT / GETBIT` 操作 Redis Bitmap；不依赖模块、通用性强；但要自己实现 k 个 hash + 序列化。**生产推荐 RedisBloom 模块**（如果可用）。

---

## 常见陷阱

::: warning ⚠️ 8 大新手坑

1. **以为 Bloom Filter 不会出错** —— **有假阳！** 1% FPR 意味着 1% 概率"返回 true 但实际不存在" → 业务必须能容忍
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
- 📄 [Redis 缓存穿透 / 击穿 / 雪崩](../../engineering-practice/redis#3-缓存穿透-击穿-雪崩)
- 📄 [Roaring Bitmap](../arrays/roaring-bitmap) — 大数据精确去重
- 📄 [一致性哈希](../../computer-networks/cdn-load-balancing#一致性哈希实战) — 同为分布式系统经典
- 🔗 [Bloom Filter Calculator](https://hur.st/bloomfilter/) — 在线计算最优 m / k
- 🔗 [Cuckoo Filter Paper (Fan et al., 2014)](https://www.cs.cmu.edu/~dga/papers/cuckoo-conext2014.pdf)
- 🔗 [XOR Filter Paper (Graf & Lemire, 2019)](https://arxiv.org/abs/1912.08258)
- 🔗 [RedisBloom 文档](https://redis.io/docs/data-types/probabilistic/bloom-filter/)
