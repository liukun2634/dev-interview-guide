---
title: 停车场系统
---

# 停车场系统设计 — OOP 设计 + 空位分配算法

<span class="dig-tag dig-tag--category">哈希</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 经典 OOP</span>

::: tip 💡 核心要点
**HashMap 定位车 + TreeMap/PriorityQueue 找最近空位 + 锁防止重复分配**。这是面试中"设计一个 XXX"OOP 题的祖师爷题——多车型分级、入口出口并发、车位定位、计费规则一次性考完。LC1603 是它的最小版本。
:::

## 为什么单独讲它

停车场是**最经典的 OOP 设计题**之一，它考察的不是某个具体算法，而是：
1. **抽象能力**：怎么划分 Vehicle / ParkingSpot / Ticket / Floor 等类
2. **数据结构选择**：HashMap、TreeMap、PriorityQueue、BitSet 各有什么用
3. **并发设计**：多入口同时进车，怎么防止两辆车分到同一个位
4. **可扩展性**：未来加电动桩 / 充电费 / 月卡 / 预约怎么改

类似的"设计 XXX"题还有：**自动售货机、ATM、酒店预订、共享单车锁车桩、餐厅订座**——骨架完全一样，套路通用。

## 需求澄清（必问）

| 问题 | 常见答案 |
|------|------|
| 多大规模？多少层？ | 中型 1000 位、3 层；超大型按机场 10w 位算 |
| 几种车型？ | 摩托 / 小车 / 大车（卡车），对应不同位 |
| 收费规则？ | 按小时 / 阶梯 / 月卡 / 首小时免费 |
| 入口出口几个？并发吗？ | 4 个入口同时进车要并发安全 |
| 找位方式？ | 自动分配最近空位 vs 用户自选 |
| 是否要"找车功能"？ | 用车牌反查车位（VIP 服务）|
| 电动桩？ | 加 ChargingSpot 子类 |
| 预约？月卡？ | 影响数据模型 |

## 核心数据模型

```java
enum VehicleSize { MOTORCYCLE, COMPACT, LARGE }        // 三类车

class Vehicle {
    String licensePlate;
    VehicleSize size;
}

class ParkingSpot {
    int floor;
    int row;
    int spotNumber;
    VehicleSize size;                                   // 该位最大支持
    Vehicle currentVehicle;                             // null = 空位

    boolean canFit(Vehicle v) {
        return currentVehicle == null && size.ordinal() >= v.size.ordinal();
    }
}

class Ticket {
    String id;
    String licensePlate;
    int spotId;
    LocalDateTime entryTime;
    LocalDateTime exitTime;                             // null 直到出场
    BigDecimal fee;
}
```

## 找位算法 5 选 1

| 策略 | 数据结构 | 优点 | 缺点 |
|------|------|------|------|
| **任意分配** | `Stack<ParkingSpot>` | O(1)，最简单 | 不是最近，用户体验差 |
| **顺序遍历找最近** | `List<ParkingSpot>` 按距离排好 | O(n) 简单 | 1w 位时慢 |
| **TreeMap 按距离** | `TreeMap<Integer, Queue<Spot>>` distance → spots | O(log n) 找最近 | 实现稍复杂 |
| **PriorityQueue 每个 size 一队** | `Map<VehicleSize, PriorityQueue<Spot>>` 按距离 | O(log n)，按车型分桶 | **生产标配** |
| **BitSet 按层位图扫描** | `BitSet[]` 每层一个 | 内存极省（10w 位 12KB）| 自定义距离函数复杂 |

**生产推荐：PriorityQueue 按车型分桶**

```java
class ParkingLot {
    // ★ 每种车型一个最小堆（按到入口的距离排序）
    private final Map<VehicleSize, PriorityQueue<ParkingSpot>> availableSpots = new HashMap<>();
    // ★ 车牌 → 车位（用于反查 "我的车在哪"）
    private final Map<String, ParkingSpot> vehicleLocations = new ConcurrentHashMap<>();
    // ★ 车牌 → ticket（出场计费要查）
    private final Map<String, Ticket> activeTickets = new ConcurrentHashMap<>();

    private final ReentrantLock lock = new ReentrantLock();  // ★ 多入口并发锁

    public Ticket park(Vehicle vehicle) {
        lock.lock();
        try {
            ParkingSpot spot = findSpot(vehicle);
            if (spot == null) throw new ParkingLotFullException();

            spot.currentVehicle = vehicle;
            availableSpots.get(spot.size).remove(spot);  // ★ 从可用池移除
            vehicleLocations.put(vehicle.licensePlate, spot);

            Ticket ticket = new Ticket(/* ... */);
            activeTickets.put(vehicle.licensePlate, ticket);
            return ticket;
        } finally {
            lock.unlock();
        }
    }

    private ParkingSpot findSpot(Vehicle v) {
        // ★ 先找完全匹配车型的位
        PriorityQueue<ParkingSpot> exact = availableSpots.get(v.size);
        if (exact != null && !exact.isEmpty()) return exact.peek();

        // ★ 找更大的位（小车可以停大位，反过来不行）
        for (VehicleSize size : VehicleSize.values()) {
            if (size.ordinal() <= v.size.ordinal()) continue;
            PriorityQueue<ParkingSpot> q = availableSpots.get(size);
            if (q != null && !q.isEmpty()) return q.peek();
        }
        return null;
    }

    public BigDecimal exit(String licensePlate) {
        lock.lock();
        try {
            Ticket ticket = activeTickets.remove(licensePlate);
            ParkingSpot spot = vehicleLocations.remove(licensePlate);
            if (ticket == null || spot == null) throw new IllegalArgumentException();

            spot.currentVehicle = null;
            availableSpots.get(spot.size).offer(spot);   // ★ 还回池子

            ticket.exitTime = LocalDateTime.now();
            ticket.fee = calculateFee(ticket);
            return ticket.fee;
        } finally {
            lock.unlock();
        }
    }
}
```

## 并发优化：分段锁 / 无锁化

| 方案 | 适用 | 优势 | 代价 |
|------|------|------|------|
| `ReentrantLock` 全局锁（上面）| 入口数 ≤ 4 | 简单正确 | 高并发瓶颈 |
| **分段锁**：每个 size 一把锁 | 入口数 8–32 | 不同车型并行 | 实现复杂 |
| **无锁 `ConcurrentLinkedQueue`** | 不要求"最近" | 高并发 | 不是最优位 |
| **乐观锁 CAS**：`AtomicReference<Spot>` | 极致性能 | 真正并发 | 重试逻辑 |
| **分布式 Redis ZSet** | 多停车场连锁 | 跨机房 | 网络延迟 |

**面试金句**：单停车场用 `ReentrantLock` + `PriorityQueue` 足够（入口物理上就 2-4 个）；连锁停车场（机场 / 商业综合体）才需要 Redis ZSet 做集中调度。

## 计费规则的设计模式

收费规则容易变化（首小时免费、阶梯计费、节假日加价），用**策略模式**：

```java
interface PricingStrategy {
    BigDecimal calculate(Duration duration, VehicleSize size);
}

class FlatHourlyPricing implements PricingStrategy { /* 5 元/小时 */ }

class TieredPricing implements PricingStrategy {
    // 首 1 小时 5 元，2-4 小时 8 元/小时，4+ 小时 6 元/小时
}

class WeekendPricing implements PricingStrategy {
    // 装饰器模式：周末 1.5 倍
    private final PricingStrategy base;
}
```

## 关键陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| `HashMap` 不加锁 | 两入口同时分到同一位 | `ConcurrentHashMap` + 找位时锁定 |
| 小车不能停大位 | 大位浪费 | **就近升级**：找匹配位 → 找更大的位 |
| `PriorityQueue.remove(spot)` O(n) | 出场慢 | 接受 O(n)（停车场内存小）；或用 `TreeSet` |
| 计费规则硬编码 | 改价要改代码 | **策略模式** + 配置中心热更新 |
| 不存"哪个车在哪个位" | 找车功能做不了 | `vehicleLocations: Map<plate, Spot>` |
| `activeTickets` 内存泄漏 | 不正常出场（车开走没扫码）| TTL 24h + 异常告警 |

## 复杂度

- **入场**：O(log n) 找位 + O(1) 记录
- **出场**：O(log n) 还位 + O(1) 计费
- **找车**：O(1) HashMap 反查
- **空间**：O(总位数)

## 业界生产级架构

```
                    ┌──────────────────────┐
                    │   入口 / 出口 道闸   │   ← 车牌识别
                    └──────────┬───────────┘
                               │ HTTP API
                    ┌──────────▼───────────┐
                    │  Parking Service     │   ← 找位 / 计费
                    │  (单实例 + 锁)       │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │  Redis   │    │  MySQL   │    │  Payment │
        │ (车位状态)│    │ (Ticket) │    │  (微信/Alipay)│
        └──────────┘    └──────────┘    └──────────┘
              │
              ▼
        车位电子显示屏 / 楼层引导灯
```

**实际系统模块**：

| 模块 | 实现 |
|------|------|
| **车牌识别** | OCR + AI 模型（YOLOv8、PaddleOCR）|
| **车位检测** | 地感线圈 + 摄像头视觉 |
| **预约 / 月卡** | 占位逻辑 + TTL 释放 |
| **找车功能** | 微信小程序输入车牌返回楼层 + 导航 |
| **反向寻车** | 室内 BLE/UWB 定位精确到 1-2 米 |
| **电动桩占用** | 充电中标识 + 充满后释放占位倒计时 |
| **拥堵均衡** | 楼层人数分布 + 引导到空闲层 |

## 类比题 / 同模板

| 题目 | 共同骨架 |
|------|------|
| 设计酒店预订系统 | 房间 = ParkingSpot，订单 = Ticket，房型 = VehicleSize |
| 设计共享单车 | 车桩 = ParkingSpot，车 = Vehicle，骑行时间 = 计费 |
| 设计 ATM | 状态机 + 钞票库存 = ParkingSpot 池 |
| 设计自动售货机 | 槽位 = ParkingSpot，商品 = Vehicle，找零 = 贪心 |
| 设计图书馆借阅 | 书架位 = ParkingSpot，借书证 = Ticket |
| 设计电影院选座 | 区位定价 + 同行就近 = 找位算法变种 |

**通用模板**：枚举资源类型 + Map 反查 + PriorityQueue 或 TreeMap 找最优 + 锁 / 分段锁。

## 面试常问 & 怎么答

### 为什么用 PriorityQueue 而不是 List

要找"最近的空位"，PriorityQueue 按距离自动排序，`peek()` O(1)。List 要 O(n) 遍历，或者保持有序 List 插入 O(n)。

### 多入口同时进车怎么防止分到同一个位

**最小可用方案**：`ReentrantLock` 全局锁，找位 + 占位是一个原子操作。**进阶**：按 size 分段锁，三种车型互不阻塞。**极致**：CAS 乐观锁 + 重试。

### 小车能停大位吗

可以。**找位策略**先找完全匹配的位，没有再找更大的位（升级停）。反过来不行——大车进不去小位。

### 计费规则变化怎么办

**策略模式 + 配置中心**。`PricingStrategy` 接口隔离不同计费规则（按时 / 阶梯 / 月卡 / 节假日），运营在后台改配置就生效，不用改代码。

### 找车功能怎么做

维护 `Map<licensePlate, ParkingSpot>` 反查表，O(1)。用户在小程序输入车牌返回楼层 + 区位号，加 BLE/UWB 室内导航。

### 如何应对停车场满

1. **预约系统**：未到预约时段保留位
2. **错峰引导**：到下一个有空位的停车场（连锁场景）
3. **等待队列**：通知列表 + 出场时按序通知
4. **价格调节**：满载时小幅涨价分流

## 看到什么就先想到这类

| 信号 | 套用 |
|------|------|
| 资源池 + 类型分级 | 停车场（车型→车位）|
| 找"最近的可用资源" | PriorityQueue + 距离函数 |
| 反查"X 在哪" | Map\<key, Resource\> |
| 多入口竞争资源 | 锁 / 分段锁 / CAS |
| 计费 / 价格易变 | 策略模式 + 配置中心 |
| OOP 设计题"设计 XX 系统" | 停车场模板：枚举 + Map + 锁 + 策略 |
