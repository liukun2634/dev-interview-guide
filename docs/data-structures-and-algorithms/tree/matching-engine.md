---
title: 撮合引擎
---

# 撮合引擎核心 — 券商 / 加密交易所面试压轴题

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 小众高频</span>

::: tip 💡 核心要点
**两个按价格排序的"价格档"+ 每档内按时间排序的订单队列**。是金融/量化/Web3 公司必考的"设计一个交易所核心"题。LSE / NASDAQ / Binance / Coinbase 的撮合引擎都是这个数据结构，不同之处只在硬件优化、并发模型、撮合规则。
:::

## 为什么单独讲它

撮合引擎是少数"系统设计 + 数据结构 + 业务规则"三者**强耦合**的面试题。普通后端不一定会考，但**金融科技 / 加密货币 / 量化 / 高频** 岗位几乎必考。

### 业务背景

订单簿（Order Book）维护**两类挂单**：

- **Bid（买单）**：用户出价想买，价格越高越想成交
- **Ask（卖单）**：用户报价想卖，价格越低越想成交

撮合规则（**Price-Time Priority**，几乎所有正规交易所都用）：

1. **价格优先**：买单中价格最高的、卖单中价格最低的优先撮合
2. **时间优先**：同一价格档内，先挂的单先成交

```
Ask 卖盘
  102.5  ─── 10 张
  102.0  ─── 50 张                ← 卖一档：最低卖价 = 102.0
  ──────────────  spread = 0.5
  101.5  ─── 30 张                ← 买一档：最高买价 = 101.5
  101.0  ─── 80 张
  100.5  ─── 20 张
Bid 买盘
```

**新来的市价买单 25 张** → 立即从 102.0 那档吃掉 25 张（同档内按时间优先吃）。
**新来的限价买单 102.5 / 30 张** → 先吃 102.0 那档 50 张里的 30 张（吃完剩 20）。

## 数据结构设计

```
bids:  TreeMap<Price, Deque<Order>>           // 价格降序：最高买价在 firstKey
ask:   TreeMap<Price, Deque<Order>>           // 价格升序：最低卖价在 firstKey
orders: Map<OrderId, Order>                    // 按 ID 撤单时定位
```

**关键选型理由**：

| 维度 | TreeMap | PriorityQueue | SkipList |
|------|------|------|------|
| 取最优价 | O(log n) | O(1) | O(log n) |
| 同档内 FIFO | ✅ `Deque<Order>` 嵌套 | ❌ 堆不保持插入顺序 | ✅ |
| 按价撤单 | O(log n) | ❌ 要扫整堆 | O(log n) |
| 按 OrderId 撤单 | O(log n)（配 Map） | ❌ | O(log n) |

**面试爆点**：很多人第一反应是 `PriorityQueue`，但**堆不能保证同优先级内的插入顺序**——这违反了"时间优先"原则。必须用 `TreeMap<Price, Deque<Order>>` 双层结构。

## 完整代码（必背手撕）

```java
class MatchingEngine {
    enum Side { BUY, SELL }

    static class Order {
        long id;
        Side side;
        double price;
        int qty;
        long timestamp;
        Order(long id, Side side, double price, int qty, long ts) {
            this.id = id; this.side = side; this.price = price; this.qty = qty; this.timestamp = ts;
        }
    }

    static class Trade {
        long buyOrderId, sellOrderId;
        double price;
        int qty;
        Trade(long b, long s, double p, int q) {
            buyOrderId = b; sellOrderId = s; price = p; qty = q;
        }
    }

    // ★ 买盘：价格降序（最高价在 firstEntry）
    private final TreeMap<Double, Deque<Order>> bids = new TreeMap<>(Comparator.reverseOrder());
    // ★ 卖盘：价格升序（最低价在 firstEntry）
    private final TreeMap<Double, Deque<Order>> asks = new TreeMap<>();
    private final Map<Long, Order> ordersById = new HashMap<>();

    /** 提交订单，返回产生的所有成交 */
    public List<Trade> submit(Order order) {
        List<Trade> trades = new ArrayList<>();
        TreeMap<Double, Deque<Order>> oppBook = (order.side == Side.BUY) ? asks : bids;

        // ★ 尝试撮合：对手盘有最优价 + 价格能匹配 + 自己还没吃完
        while (order.qty > 0 && !oppBook.isEmpty()) {
            Map.Entry<Double, Deque<Order>> bestLevel = oppBook.firstEntry();
            double bestPrice = bestLevel.getKey();

            // 限价单：价格不满足就停止
            if (order.side == Side.BUY && bestPrice > order.price) break;
            if (order.side == Side.SELL && bestPrice < order.price) break;

            Deque<Order> queue = bestLevel.getValue();
            Order resting = queue.peekFirst();                  // ★ 时间优先：吃最早挂的
            int tradeQty = Math.min(order.qty, resting.qty);

            // 生成成交
            if (order.side == Side.BUY) {
                trades.add(new Trade(order.id, resting.id, bestPrice, tradeQty));
            } else {
                trades.add(new Trade(resting.id, order.id, bestPrice, tradeQty));
            }

            order.qty -= tradeQty;
            resting.qty -= tradeQty;

            if (resting.qty == 0) {                             // ★ resting 吃完了
                queue.pollFirst();
                ordersById.remove(resting.id);
                if (queue.isEmpty()) oppBook.remove(bestPrice);
            }
        }

        // 没成交完的部分挂单
        if (order.qty > 0) {
            TreeMap<Double, Deque<Order>> ownBook = (order.side == Side.BUY) ? bids : asks;
            ownBook.computeIfAbsent(order.price, k -> new ArrayDeque<>()).addLast(order);
            ordersById.put(order.id, order);
        }
        return trades;
    }

    /** 撤单 */
    public boolean cancel(long orderId) {
        Order order = ordersById.remove(orderId);
        if (order == null) return false;
        TreeMap<Double, Deque<Order>> book = (order.side == Side.BUY) ? bids : asks;
        Deque<Order> queue = book.get(order.price);
        if (queue == null) return false;
        queue.remove(order);                                    // ★ O(n) 同档内查找
        if (queue.isEmpty()) book.remove(order.price);
        return true;
    }
}
```

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 用 `PriorityQueue` 存订单 | 堆不保证同优先级内 FIFO，违反时间优先规则 | `TreeMap<Price, Deque<Order>>` 双层结构 |
| 撮合价取的是新单的报价 | 不公平，应取已挂单（resting）的价格 | **成交价 = resting.price**（行业规则）|
| 用 `double` 比较价格 | 浮点精度问题，10.1 + 0.1 != 10.2 | 用 **整数 ticks**（如 1.05 → 105），或 `BigDecimal` |
| 撤单不从 `ordersById` 删 | 内存泄漏 | 撤单 / 完全成交都要 `ordersById.remove` |
| 同档内 `queue.remove(order)` 是 O(n) | 撤单慢 | 工业级用**双向链表 + Map 直接定位节点** O(1) |
| 自成交（self-match）不处理 | 同一用户的买卖单互相成交，可能触发风控告警 | 添加 STP（Self-Trade Prevention）规则 |

## 复杂度

- **提交订单（不成交）**：O(log n) — TreeMap 插入
- **提交订单（成交 k 次）**：O(k log n)
- **撤单**：O(log n + m)，m = 同档订单数
- **空间**：O(n)，n = 挂单总数

## 业界生产级架构

实际撮合引擎远不止这点东西。生产架构要考虑：

| 维度 | 工业方案 |
|------|------|
| **价格精度** | 整数 ticks（避免浮点）、`long` 表示价格 × 10^N |
| **并发模型** | **单线程撮合 + 上下游异步**（LMAX Disruptor 模式，单核 600w TPS）|
| **存储** | 内存撮合 + WAL 持久化（崩溃恢复）+ 行情广播（多播 / WebSocket）|
| **撮合策略** | Price-Time（NASDAQ）/ Pro-Rata（CME 部分合约）/ ICEberg（隐藏订单）|
| **STP** | 同账户买卖单互相吃掉，可选 CANCEL_OLDEST / CANCEL_NEWEST / CANCEL_BOTH |
| **熔断 / 涨跌停** | 价格变动超阈值暂停撮合（个股 ±10%、加密 ±50%）|
| **市价单** | 不带价格，吃到没有对手盘为止，没吃完按规则取消 / 转挂单 |
| **IOC / FOK / GTC** | Immediate-Or-Cancel / Fill-Or-Kill / Good-Till-Cancel 订单类型 |

### 为什么生产撮合引擎要单线程

**LMAX Disruptor** 哲学：撮合本身是 CPU 极轻量的内存操作（μs 级），瓶颈反而是锁竞争和 cache miss。**单线程 + 高吞吐 ring buffer 收单 / 派发** 反而比多线程加锁吞吐量高一个数量级。

伦敦交易所 LMAX 在 2010 年用一台 4 核机跑出**单核 600 万 TPS**——把整个金融行业惊到了，因为大家都以为撮合一定要分布式。

## 面试常问 & 怎么答

### 为什么不用 PriorityQueue

PriorityQueue 是堆，**同优先级内不保证插入顺序**，违反"时间优先"规则。必须用 TreeMap + Deque 双层结构：外层按价排序，内层按时间排序。

### 为什么单线程比多线程快

撮合本身是 μs 级内存操作，瓶颈是锁竞争。LMAX Disruptor 的 ring buffer + 单线程消费者，避免了所有锁竞争和 false sharing，cache 命中率拉满。单核可达 600w TPS。

### 自成交（self-match）怎么处理

加 STP 规则：同账户的买卖单匹配时，按预设策略处理：
- `CANCEL_OLDEST`：撤掉早挂的那个
- `CANCEL_NEWEST`：拒绝新单
- `CANCEL_BOTH`：两个都撤

正规交易所大多默认 `CANCEL_NEWEST` 防止 wash trading（虚假交易）。

### 价格用 double 行不行

**不行**。`0.1 + 0.2 != 0.3`，撮合时价格比较会出现"明明应该相等却不相等"的 bug。工业做法：
- **整数 ticks**：把价格 × 10⁸ 存成 `long`（加密交易所标准）
- **BigDecimal**：性能稍差但精度无误（Java 后端常用）

### 撤单 O(n) 怎么优化

工业级用**侵入式双向链表**：订单本身就是链表节点。`Map<OrderId, OrderNode>` 直接定位节点位置，O(1) 解除链接。Java 没原生支持，要自己写或用 `LinkedHashMap` 变体。

## 看到什么就先想到这类

- "设计一个交易所核心" → 撮合引擎
- "买卖盘订单簿" → TreeMap + Deque 双层
- "Price-Time Priority" → 必须保持同档内 FIFO
- "撮合引擎单线程吞吐 600w" → LMAX Disruptor / 单线程哲学
- "撤单 O(1)" → 侵入式双向链表 + HashMap
- "STP / Self-Trade Prevention" → 防止 wash trading
- "加密货币 / 量化 / 金融科技岗位" → 这道题大概率会问
