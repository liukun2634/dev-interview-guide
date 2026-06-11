---
title: GeoHash 附近搜索
---

# GeoHash + 附近的人 — 地理位置查询的工业标准

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
**把二维经纬度编码成一维字符串，且地理相近的点字符串前缀也相近**——这样"附近的人"查询就变成了"**前缀匹配 + 范围扫描**"。Redis GEO、MongoDB 2dsphere、ES geo_point、美团/Uber/滴滴派单系统全用 GeoHash 或其变体。算法本身简单，但**面试官最爱追问"边界陷阱"和"查询要扫几个格子"**。
:::

## 为什么单独讲它

「**附近的人** / **附近的餐厅** / **派单**」类问题，方案对比：

| 方案 | 单次查询 | 索引大小 | 致命缺点 |
|------|------|------|------|
| `WHERE distance(lat, lon, ?, ?) < 5km` | **O(n)** 扫全表 | 0 | 慢，全表扫描 |
| **2D 矩形索引** `WHERE lat BETWEEN ... AND lon BETWEEN ...` | O(log n) | B+Tree | **不是真正的"附近"**（同纬度相距远）|
| R-Tree / 四叉树 | O(log n) | 平衡树 | 维护复杂、写性能差 |
| **GeoHash 字符串前缀** | **O(log n)** | 普通字符串索引 | 简单到能 SQL 直接实现 |

**GeoHash 的精髓**：用普通的字符串 B+Tree 索引（任何数据库都有）解决地理查询，**不需要专门的空间索引**。

## 编码原理：二维 → 一维的 Z-order 曲线

### Step 1：递归二分经纬度

把地球用经线 / 纬线递归切成网格：

```
经度 [-180, +180]
  → 切一半：[-180, 0] = 0、[0, 180] = 1   ← 经度第 1 位
纬度 [-90, +90]
  → 切一半：[-90, 0] = 0、[0, 90] = 1     ← 纬度第 1 位
```

### Step 2：交错（interleave）经纬度位

```
经度二进制：11010 01101 11100
纬度二进制：10110 11001 01011

交错合并：1 1 1 0 0 1 1 1 0 0 1 1 1 0 1 1 ...
         经纬 经纬 经纬 经纬 ...
```

### Step 3：Base32 编码成字符串

每 5 bit 编码成 1 个字符（不用 `iloIO` 避免歧义）：

```
binary: 11010 01101 11100 01011 ...
base32: u    e    s    f    ...    → 字符串 "uesf..."
```

### 编码精度对应的格子大小

| GeoHash 长度 | 精度（约） | 实际尺寸 |
|------|------|------|
| 4 | 39 km × 19 km | 城市级 |
| 5 | 4.9 km × 4.9 km | 城区级 |
| 6 | 1.2 km × 0.6 km | 街区级 |
| 7 | 153 m × 153 m | 楼栋级 |
| 8 | 38 m × 19 m | 房间级 |
| 9 | 4.8 m × 4.8 m | 米级 |

**Redis GEO 默认用 11 位（厘米级）** 但只取前几位做范围查询。

## 完整代码（编码 + 解码）

```java
class GeoHash {
    private static final String BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

    /** 编码：(lat, lon) → 字符串 */
    public static String encode(double lat, double lon, int precision) {
        double[] latRange = {-90, 90};
        double[] lonRange = {-180, 180};
        StringBuilder sb = new StringBuilder();
        int bit = 0, ch = 0;
        boolean evenBit = true;                            // ★ 偶数位编经度，奇数位编纬度

        while (sb.length() < precision) {
            double mid;
            if (evenBit) {                                 // 经度
                mid = (lonRange[0] + lonRange[1]) / 2;
                if (lon >= mid) {
                    ch = (ch << 1) | 1;
                    lonRange[0] = mid;
                } else {
                    ch = ch << 1;
                    lonRange[1] = mid;
                }
            } else {                                       // 纬度
                mid = (latRange[0] + latRange[1]) / 2;
                if (lat >= mid) {
                    ch = (ch << 1) | 1;
                    latRange[0] = mid;
                } else {
                    ch = ch << 1;
                    latRange[1] = mid;
                }
            }
            evenBit = !evenBit;
            bit++;
            if (bit == 5) {                                // ★ 每 5 bit 一个 Base32 字符
                sb.append(BASE32.charAt(ch));
                bit = 0; ch = 0;
            }
        }
        return sb.toString();
    }
}
```

## 查询：附近的人 / 附近的餐厅

**核心思路**：

```
1. 把用户的 (lat, lon) 编码成 GeoHash，取前 N 位（N 决定查询半径）
2. SELECT * FROM places WHERE geohash LIKE 'wx4g0%'  ← 前缀匹配
3. 对结果做精确距离过滤（Haversine 公式）
```

**关键陷阱：必须查 9 个格子！**

```
     ┌──┬──┬──┐
     │NW│ N│NE│
     ├──┼──┼──┤
     │ W│ * │ E│         * = 用户当前格子
     ├──┼──┼──┤          NW,N,NE,W,E,SW,S,SE = 8 个相邻格子
     │SW│ S│SE│
     └──┴──┴──┘
```

**为什么**？用户站在格子边缘时，最近的人可能在隔壁格子。只查中心格子会漏。所以**必须查中心 + 8 邻居 = 9 个格子**。

```java
// 完整流程
public List<Place> nearby(double lat, double lon, double radiusKm) {
    String myHash = GeoHash.encode(lat, lon, 6);         // 6 位 ≈ 1.2km 格子
    Set<String> candidateHashes = new HashSet<>();
    candidateHashes.add(myHash);
    candidateHashes.addAll(GeoHash.neighbors(myHash));   // ★ 加上 8 邻居

    List<Place> candidates = new ArrayList<>();
    for (String hash : candidateHashes) {
        // SELECT * FROM places WHERE geohash LIKE 'hash%'
        candidates.addAll(db.queryByPrefix(hash));
    }

    // ★ 精确距离过滤（Haversine 公式算球面距离）
    return candidates.stream()
        .filter(p -> haversine(lat, lon, p.lat, p.lon) <= radiusKm)
        .sorted(Comparator.comparingDouble(p -> haversine(lat, lon, p.lat, p.lon)))
        .collect(Collectors.toList());
}
```

### Haversine 距离公式

```java
private static double haversine(double lat1, double lon1, double lat2, double lon2) {
    double R = 6371;                                     // 地球半径 km
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
             + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
             * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
```

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 只查中心格子 | 边缘附近的人漏掉 | **必须查 9 个格子**（中心 + 8 邻居） |
| 不做精确距离过滤 | 同格子两端可能 > 1km | 取候选后用 Haversine 算实际距离 |
| 精度选太高（精确到米）| 9 个格子总面积太小，覆盖不了半径要求 | **格子边长应略大于查询半径**（半径 1km → GeoHash 6 位 1.2km 格子）|
| 跨经线 ±180° 边界 | 太平洋中线附近"邻居"逻辑断裂 | 邻居算法专门处理边界回绕 |
| Z-order 曲线的"跳变" | 相邻 GeoHash 不一定地理相近 | 这就是为什么要查 9 个格子，**不能假设 hash 相近 = 物理相近** |
| 不用 BTree 索引 | SQL 前缀 LIKE 'xx%' 可走索引，全表扫不行 | 数据库必须建 GeoHash 列的 B+Tree 索引 |

## Redis GEO 的实现

Redis 5.0+ 自带 `GEOADD` / `GEORADIUS` 等命令。底层：

```
GeoHash 编码 → 52-bit 整数（精度 ~ 0.6m）
存入 Sorted Set（ZSet），score = 这个整数

查询 GEORADIUS：
  1. 算出查询区域的所有 GeoHash 范围
  2. ZRANGEBYSCORE 拉出候选
  3. 精确距离过滤
```

**为什么用 Sorted Set 不用 String/Hash**：ZSet 的 score 排序天然适合"前缀匹配 + 范围扫描"——`ZRANGEBYSCORE` 用跳表能 O(log n + m)。

```shell
GEOADD nearby:beijing 116.404 39.915 "天安门"
GEOADD nearby:beijing 116.397 39.908 "故宫"

GEORADIUSBYMEMBER nearby:beijing "天安门" 1 km
# 返回 1km 内的所有 POI
```

## 业界应用

| 系统 | 用法 |
|------|------|
| **Redis GEO** | GEOADD / GEORADIUS 命令，底层 GeoHash + ZSet |
| **MongoDB** | `2dsphere` 索引内部用 GeoHash（地理 + 球面）|
| **Elasticsearch** | `geo_point` 字段、`geo_distance` 查询 |
| **美团 / Uber / 滴滴派单** | 司机位置实时打到 GeoHash 格子，订单按格子推送 |
| **微信"附近的人"** | 用户 GPS 编码 GeoHash，地理库查询 |
| **Yelp / 大众点评** | 商家位置索引，附近商家查询 |
| **滴滴热力图** | 格子聚合订单密度 |

## 进阶变体

### Uber 的 H3（六边形网格）

GeoHash 的格子是矩形，**六边形比矩形相邻关系更均匀**（六边形每个邻居都等距，矩形邻居有 4 个等距 + 4 个对角较远）。Uber 在 2018 开源 [H3](https://h3geo.org/)，全公司派单都迁移到 H3。

### S2 Geometry（Google）

把球面用希尔伯特曲线分层映射到一维。Google Maps、Pokemon GO 都用。比 GeoHash 更优雅但代码复杂得多。

### 选型

| 场景 | 推荐 |
|------|------|
| 简单"附近" + 已有 Redis | **GeoHash + Redis GEO** |
| 大规模派单系统 | **H3**（Uber 开源）|
| Google Maps 级地理分析 | **S2** |
| 已有数据库索引 | **GeoHash 字符串列 + LIKE 前缀** |

## 面试常问 & 怎么答

### 为什么不直接 `WHERE distance(...) < 5km`

`distance` 是函数计算，**无法走索引**，必须全表扫描。GeoHash 把空间查询变成字符串前缀匹配，普通 B+Tree 索引就够。

### 为什么必须查 9 个格子

用户站在格子边缘时，**最近的目标可能在隔壁格子**。Z-order 曲线（Hilbert / Peano 类似）有"跳变"——hash 相邻不代表物理相邻、物理相邻不代表 hash 相邻。所以查中心 + 8 邻居才能保证"半径内的目标不漏"。

### 精度怎么选

**格子边长 ≥ 查询半径**。查 5km 内的人，选 5 位 GeoHash（4.9km 格子）；查 100m 内，选 8 位（38m 格子，再放大 9 倍 ≈ 114m 范围）。

### Redis GEO 比自己用 Hash + ZSet 实现好在哪

- Redis 内部已优化好编码 + 邻居算法
- 直接给球面距离 km / m，不用自己写 Haversine
- 与 Sorted Set 操作完全兼容（ZRANGEBYSCORE 也能用）

### GeoHash 跟四叉树 / R-Tree 比

- **GeoHash 优势**：用普通 B+Tree 就能存，简单、跨语言、跨数据库通用
- **R-Tree 优势**：精确，不需要查 9 个格子；但实现复杂、写性能差
- **结论**：90% 业务用 GeoHash 就够。极致精度要求（GIS 专业系统）才上 R-Tree / S2

## 看到什么就先想到这类

- "附近的人 / 附近的餐厅 / 派单" → GeoHash + 前缀查询
- "Redis 怎么做地理查询" → GEO 命令背后是 GeoHash + ZSet
- "Uber 派单怎么做" → H3 六边形格子（GeoHash 进化版）
- "为什么用字符串存经纬度" → GeoHash，B+Tree 索引友好
- "面试官问'格子边缘的人漏了怎么办'" → 查中心 + 8 邻居 = 9 格
- "全球数据 GIS 查询" → S2 Geometry（Google 开源）
