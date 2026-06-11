---
title: O(1) 插删随机
---

# O(1) 插删随机集合（LeetCode 380）— 抽奖系统原型

<span class="dig-tag dig-tag--category">哈希</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
**HashMap + ArrayList 双向映射**做到 `insert` / `delete` / `getRandom` 都是 O(1)。这是**抽奖系统、洗牌池、连接池随机选择**的核心数据结构——也是面试官最爱用来追问 "为什么不能光用 HashMap" 的题。
:::

## 为什么单独讲它

单一数据结构办不到全 O(1)：

| 操作 | HashSet | ArrayList | **HashMap + ArrayList** |
|------|------|------|------|
| `insert` | O(1) | O(1) 尾部 | **O(1)** |
| `delete(val)` | O(1) | **O(n)** | **O(1)** |
| `getRandom` | **O(n)**（要扫一遍）| O(1) | **O(1)** |

**关键洞察**：
- 要 `getRandom` O(1) → 必须**连续存储**（数组），随机下标抽取
- 要 `delete(val)` O(1) → 必须**快速定位 val 在数组里的下标**，否则要 O(n) 扫

**双向映射**：HashMap 记 `val → 数组下标`，ArrayList 按插入顺序存值。删除时用"**跟末尾元素交换再 pop**"避免 O(n) 移动。

## 数据结构示意

```
ArrayList: [10, 20, 30, 40, 50]              ← 连续存储，O(1) 随机抽取
            0   1   2   3   4

HashMap:   { 10→0, 20→1, 30→2, 40→3, 50→4 }  ← 反向定位下标

删除 20（下标 1）：
  1. 用 list 末尾的 50 覆盖位置 1
  2. list 长度 -1
  3. HashMap 更新：50→1，删除 20

之后：
  ArrayList: [10, 50, 30, 40]
  HashMap:   { 10→0, 50→1, 30→2, 40→3 }
```

## 完整代码（必背手撕）

```java
class RandomizedSet {
    private final Map<Integer, Integer> valToIdx;       // ★ val → 数组下标
    private final List<Integer> nums;                   // 连续存值
    private final Random rand;

    public RandomizedSet() {
        valToIdx = new HashMap<>();
        nums = new ArrayList<>();
        rand = new Random();
    }

    public boolean insert(int val) {
        if (valToIdx.containsKey(val)) return false;
        valToIdx.put(val, nums.size());                 // ★ 先记下标，再 add
        nums.add(val);
        return true;
    }

    public boolean remove(int val) {
        Integer idx = valToIdx.get(val);
        if (idx == null) return false;

        // ★ 核心技巧：把要删的位置用末尾元素覆盖
        int last = nums.get(nums.size() - 1);
        nums.set(idx, last);                            // 覆盖待删位置
        valToIdx.put(last, idx);                        // ★ 更新末尾元素的下标记录

        nums.remove(nums.size() - 1);                   // pop 末尾
        valToIdx.remove(val);
        return true;
    }

    public int getRandom() {
        return nums.get(rand.nextInt(nums.size()));     // ★ O(1) 抽取
    }
}
```

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| `insert` 先 add 再记下标 | 下标记成 `nums.size()` 而不是 `size - 1` | 先 put 后 add，或 add 后用 `size() - 1` |
| `remove` 不更新末尾元素的 map | 下次找末尾元素时下标错位 | `valToIdx.put(last, idx)` 必须 |
| 删除时 `val == last`（删的就是末尾）| 上面 put 把待删的 val 又写回了 map | 顺序无所谓，最后 `valToIdx.remove(val)` 会把它擦掉，安全 |
| `rand.nextInt(0)` | 空集合 NPE / 抛异常 | 题目保证 getRandom 时非空；面试可加 `if (nums.isEmpty()) return -1` |
| 用 `LinkedList` 代替 `ArrayList` | `get(i)` 是 O(n)！ | **必须 ArrayList**（数组支撑） |

## 复杂度

- **`insert` / `remove` / `getRandom`**：均摊 **O(1)**
- **空间**：O(n)

## 进阶变体

### 允许重复（LC381）

`val` 可能重复出现。HashMap 改成 `val → Set<Integer>`（同一 val 的所有下标集合）：

```java
Map<Integer, Set<Integer>> valToIdx;                    // val → 下标集合
List<Integer> nums;

// remove 时从 set 里随便挑一个下标删，删完 set 空了就 remove key
```

### 加权随机（按权重抽取）

需要"中奖概率"按权重分配。两种方案：
- **前缀和 + 二分**：O(log n) 抽取
- **Alias Method**：O(1) 抽取，预处理 O(n)（广告/推荐系统标准做法）

### 蓄水池抽样（数据流不知总数）

流式数据，**不知道总长度也要等概率抽 k 个**。第 i 个元素以 `k/i` 概率被选中、随机替换池中某个。Spark / Flink 采样都用这个。

## 业界应用

| 场景 | 用法 |
|------|------|
| **抽奖系统** | 中奖号码池 → `getRandom` 抽一个 |
| **A/B 测试分流** | 用户进来时 `getRandom` 决定走哪个实验组（轻度场景；重度场景用一致性哈希） |
| **连接池随机选择** | 数据库连接池 / RPC 客户端随机挑一个空闲连接（避免羊群效应） |
| **游戏 NPC 随机动作** | 候选动作集合 + 随机抽取 |
| **限流采样** | 高并发场景下采样 1% 请求记日志，等概率随机 |

## 面试常问 & 怎么答

### 为什么不能光用 HashSet

`HashSet` 没有"按下标访问"，要 `getRandom` 就必须遍历到第 k 个，O(n)。哪怕 Java 的 `HashSet` 内部用数组，迭代器顺序也不是连续紧凑的，不能 `O(1)` 随机访问。

### 为什么用末尾交换而不是真正删除

`ArrayList.remove(int idx)` 是 **O(n)**（要把后面所有元素左移一格）。"用末尾覆盖 + pop 末尾"把 O(n) 变 O(1)，是 ArrayList 删除的经典技巧。

### 如果允许 val 重复怎么办

HashMap value 改为 `Set<Integer>` 存所有下标。删除时从 set 里**随便挑一个下标**和末尾交换。这是 LC 381。

### `getRandom` 真的等概率吗

`Random.nextInt(n)` 在 n 为 2 的幂时严格均匀；非 2 的幂时有极轻微偏差（< 1/2³¹），生产场景可忽略。如果对均匀性极致要求，用 `SplittableRandom` 或 `ThreadLocalRandom`。

## 看到什么就先想到这类

- "抽奖 / 等概率随机" → HashMap + ArrayList 双向映射
- "插入删除随机查询都 O(1)" → 这道题的变体
- "数据流采样不知总数" → 蓄水池抽样
- "带权重的随机选择" → Alias Method / 前缀和二分
- "连接池随机选连接" → 此题模型直接搬
