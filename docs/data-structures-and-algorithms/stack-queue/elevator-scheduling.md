---
title: 电梯调度
---

# 电梯调度系统 — OOP + 调度算法的综合压轴题

<span class="dig-tag dig-tag--category">栈与队列</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 经典</span>

::: tip 💡 核心要点
**单部电梯本质是磁盘 SCAN/LOOK 算法换皮，多部电梯就是带成本函数的派单问题**。这是少数把 **OOP 设计 + 调度算法 + 状态机 + 并发** 四件事一次性考完的题。题目能套到任何"派单 / 抢单 / 资源分配"的场景：滴滴派单、外卖派送、AGV 仓储机器人、CPU 进程调度。
:::

## 为什么单独讲它

电梯调度是少数**面试中既能写代码（10–20 行核心调度）、又能聊架构（多电梯协调 / 监控 / 故障切换）** 的题。它的"上行 / 下行 / 待命"三态状态机几乎是所有调度系统的骨架。

### 跟操作系统的对应关系

操作系统中的"磁盘调度算法"和电梯本质是一回事——磁头在磁道间移动，电梯在楼层间移动。详见 [操作系统 / 文件系统](../../operating-systems/file-system#磁盘调度算法)。

| 磁盘调度 | 电梯调度 | 含义 |
|------|------|------|
| **FCFS** | 来一个接一个 | 完全按请求时间序，可能反复掉头 |
| **SSTF** | 最短寻道优先 | 找最近的目标楼层，**有饿死问题** |
| **SCAN（电梯算法）** | 一个方向到顶再反向 | **生产标配**，绝不饿死 |
| **LOOK** | SCAN 的优化，没人就掉头 | 实际电梯都用 LOOK，不会跑空一趟 |
| **C-SCAN** | 单向扫描 | 平均响应时间最公平 |

**面试爆点**：直接说"电梯就用 SCAN/LOOK，OS 里叫电梯算法（Elevator Algorithm），同一个东西换个名字"，立刻让面试官知道你**听过 OS 的磁盘调度**。

## 单部电梯：状态机 + LOOK 算法

### 状态机

```
       ┌──────────────────────────────────────┐
       │                                      │
       ▼                                      │
   ┌────────┐  有上行请求    ┌────────┐  到顶 │
   │  IDLE  │ ───────────▶  │   UP   │ ──┐   │
   │  待命  │ ◀───────────  │  上行  │   │   │
   └────────┘  全部完成      └────────┘   │   │
       │                         ▲        │   │
       │ 有下行请求              │        ▼   │
       ▼                         │    ┌──────┴─┐
   ┌────────┐                    └────│  DOWN  │
   │  DOWN  │  到底  ─────────────────│  下行  │
   │  下行  │                         └────────┘
   └────────┘
```

**核心不变量**：
- 电梯**当前方向上**遇到的请求顺路接，**反方向**请求等当前方向完成。
- IDLE 时**就近响应**第一个请求。

### 数据结构

```java
class Elevator {
    enum Direction { UP, DOWN, IDLE }
    enum DoorState { OPEN, CLOSED }

    private int currentFloor = 1;
    private Direction direction = Direction.IDLE;
    private DoorState door = DoorState.CLOSED;

    // ★ 关键：两个 TreeSet 分别存"当前方向"和"反向"请求
    //    TreeSet 自带排序：UP 用升序 firstEntry，DOWN 用降序 firstEntry
    private final TreeSet<Integer> upRequests = new TreeSet<>();
    private final TreeSet<Integer> downRequests = new TreeSet<>(Comparator.reverseOrder());
}
```

**为什么不用 PriorityQueue**：调度过程中要**频繁删除任意目标楼层**（用户中途取消、抵达后删除），堆删除是 O(n)，`TreeSet.remove` 是 O(log n)。

### LOOK 算法核心调度

```java
public void step() {
    if (direction == Direction.IDLE) {
        pickInitialDirection();
        if (direction == Direction.IDLE) return;       // 真的没活
    }

    // ★ 同方向有请求 → 继续走
    TreeSet<Integer> queue = (direction == Direction.UP) ? upRequests : downRequests;

    if (queue.isEmpty()) {                              // 同向跑完
        flipDirection();                                // ★ LOOK：直接掉头，不跑到顶
        return;
    }

    int target = queue.first();                          // ★ 顺路第一站

    if (currentFloor == target) {                       // 到了
        openDoor();
        queue.remove(currentFloor);
    } else {
        // 移动一层
        currentFloor += (direction == Direction.UP) ? 1 : -1;
    }
}

private void flipDirection() {
    if (direction == Direction.UP && !downRequests.isEmpty()) {
        direction = Direction.DOWN;
    } else if (direction == Direction.DOWN && !upRequests.isEmpty()) {
        direction = Direction.UP;
    } else {
        direction = Direction.IDLE;
    }
}

public void requestFloor(int floor) {                   // 厢内按钮
    if (floor > currentFloor) upRequests.add(floor);
    else if (floor < currentFloor) downRequests.add(floor);
    else openDoor();                                    // 已在该层
}
```

**复杂度**：每 step O(log n)，n = 待处理请求数。

### 关键陷阱

| 陷阱 | 错误后果 | 正确做法 |
|------|------|---------|
| **上下行请求混着排** | UP 中途碰到 5→3 的请求会反复掉头 | **分两个 TreeSet 按方向存** |
| **用 PriorityQueue** | 中途取消请求要 O(n) 删除 | **TreeSet** O(log n) 删除 |
| **SCAN 版本跑到顶才掉头** | 没人也跑到顶，能耗高 | **用 LOOK：同方向无请求立即掉头** |
| **门开着也接受按钮** | 状态机断裂 | **OPEN 状态必须先关门再走** |
| **同时按 5↑ 和 5↓ 视为同一请求** | 5 楼上行的用户被带到下楼 | **5↑ 和 5↓ 要分开排队**（厢外按钮带方向）|

## 多部电梯：派单 = 成本函数最小化

### 派单评分函数

电梯派单 = **司机抢单**：每个电梯计算服务该请求的"成本"，最低者中标。

```java
double estimateCost(Elevator e, int callFloor, Direction callDir) {
    int distance = Math.abs(e.currentFloor - callFloor);

    // ★ 情况 1：电梯顺路（同方向 + 还没过去）
    boolean sameDirection = e.direction == callDir;
    boolean willPass = (callDir == UP && e.currentFloor <= callFloor)
                    || (callDir == DOWN && e.currentFloor >= callFloor);
    if (sameDirection && willPass) {
        return distance;                                // 最便宜
    }

    // ★ 情况 2：电梯空闲
    if (e.direction == IDLE) {
        return distance + 2;                            // 略高于顺路
    }

    // ★ 情况 3：电梯反向或已过 → 等它跑完一圈
    int remainingTrip = remainingDistance(e);           // 预估当前路线剩余
    return distance + remainingTrip + 5;
}

// 派单：所有电梯算 cost，最小者赢
Elevator dispatch(int callFloor, Direction callDir) {
    return elevators.stream()
        .min(Comparator.comparingDouble(e -> estimateCost(e, callFloor, callDir)))
        .orElseThrow();
}
```

### 进阶：考虑超载与忙等

| 维度 | 加分 / 罚分 | 实际权重 |
|------|------|------|
| 满载（容量 80%+）| **罚 +999**（基本拒绝） | 高 |
| 长时间等待用户 | **饿死保护**：等待 > 60s 强制派单 | 高 |
| 群控（高层 / 低层）| 早高峰分组：1-10 给 E1，11-20 给 E2 | 中 |
| 故障 / 维护中 | **罚 +∞**（直接踢出） | 高 |
| 节能（晚间停首层）| 闲置返回 1 楼 | 低 |

### 经典群控策略

| 策略 | 场景 | 工业代表 |
|------|------|------|
| **Round Robin** | 简单兜底，电梯数 ≥ 8 时退化 | 老旧物业 |
| **Cost Function（上面那种）** | 通用 | Otis / Schindler / Mitsubishi |
| **Zoning（分区群控）** | 高峰期固定服务区段 | 写字楼早高峰 |
| **Destination Control（目的层派单）** | 大堂输入目标楼层，**同目标拼车** | 摩天楼标配（IBM、上海中心）|
| **AI / RL 强化学习** | 学习楼宇人流规律 | 近 5 年研究热点 |

**Destination Control 的反直觉**：传统电梯进去再按楼层，运行中可能掉头无数次；目的层派单**一进电梯就知道所有人去哪**，可以全局最优分组，**等待时间和能耗降 30%**。

## 完整 OOP 设计骨架

```java
class ElevatorSystem {
    private final List<Elevator> elevators;
    private final Queue<HallCall> pendingCalls = new LinkedBlockingQueue<>();

    static class HallCall {                             // 厢外按钮
        int floor;
        Direction direction;
        long requestTime;
    }

    public ElevatorSystem(int numElevators) {
        this.elevators = IntStream.range(0, numElevators)
            .mapToObj(i -> new Elevator(i))
            .toList();
    }

    /** 用户按厢外按钮 */
    public void callElevator(int floor, Direction dir) {
        Elevator chosen = dispatch(floor, dir);          // ★ 评分派单
        chosen.addHallCall(floor, dir);
    }

    /** 调度主循环（实际是事件驱动 / 时间轮） */
    public void tick() {
        elevators.forEach(Elevator::step);
        rebalanceIfIdle();                              // 闲时返回首层
    }

    private void rebalanceIfIdle() { /* ... */ }
}
```

## 并发模型

| 模型 | 适用 | 缺点 |
|------|------|------|
| **每部电梯一个线程**（基础） | 实现简单 | 派单决策要加锁，线程切换开销 |
| **单线程调度器 + 时间轮**（推荐） | 高吞吐、易调试 | 单点瓶颈（但电梯本身慢，不是问题）|
| **Actor 模型**（高级） | 多楼栋分布式调度 | 复杂度高 |

实际物业系统几乎都是**单线程调度器**——电梯物理动作以秒计，调度决策以毫秒计，单核绝对够用。

## 复杂度

- **单部电梯调度**：每步 O(log n)，n = 请求数
- **N 部电梯派单**：O(N log m)，m = 单部电梯请求数
- **空间**：O(总请求数)

## 业界生产级架构

```
                    ┌──────────────────────┐
                    │  Group Controller    │   ← 群控大脑（单线程）
                    │  (评分派单 + 调度)    │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │ Elevator │    │ Elevator │    │ Elevator │
        │    #1    │    │    #2    │    │    #3    │
        │ (LOOK)   │    │ (LOOK)   │    │ (LOOK)   │
        └──────────┘    └──────────┘    └──────────┘
              │                │                │
              ▼                ▼                ▼
        各自的厢内按钮 / 楼层目的地
```

**安全机制（不会考代码但要能说出来）**：
- 超速保护：限速器 + 安全钳（机械层，不依赖软件）
- 缓冲器：底坑液压缓冲
- 双向冗余通信：CAN bus + 备用线
- 紧急召回：消防员开关、停电应急模式

## 面试常问 & 怎么答

### 单部电梯怎么调度

**LOOK 算法**：维护两个有序集合分别存上行和下行请求，同方向有请求就继续走，没了就掉头。本质是磁盘调度的 SCAN/LOOK 算法换皮。**绝不饿死、能耗最优**。

### 多部电梯怎么派单

**评分函数派单**：每个电梯计算服务该请求的成本（顺路 < 空闲 < 反向），最低者中标。考虑顺路、满载、等待时间、故障状态多个因素。

### 为什么不用 PriorityQueue

中途取消请求要 O(n) 删除，电梯运行时频繁删除任意目标楼层。**TreeSet** 删除 O(log n) 更合适。

### 早高峰大堂排队怎么办

**Destination Control（目的层派单）**：大堂输入目标楼层，**同目标拼车**。比传统进电梯按楼层减少 30% 等待时间和能耗。

### Group Controller 是单线程吗

是的。电梯物理动作以秒计，调度决策以毫秒计，**单线程完全够用**，还避免锁竞争和死锁。摩天楼几十部电梯一样单线程跑。

## 看到什么就先想到这类

| 信号 | 套用 |
|------|------|
| 单维资源多请求调度 | 电梯 / 磁盘 SCAN |
| 多 worker 抢任务 | 成本函数派单（电梯 / 滴滴 / 外卖）|
| 顺路 + 反向需要分开排 | 双 TreeSet 按方向 |
| 频繁随机删除 | TreeSet/SkipList 而非 Heap |
| 防饿死 | 等待时间惩罚项 / SCAN 算法 |
| OOP 设计题"设计 XX 调度系统" | 电梯模板：状态机 + 评分函数 + 单线程主循环 |
