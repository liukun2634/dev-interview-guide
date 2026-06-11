---
title: Fisher-Yates 洗牌
---

# Fisher-Yates 洗牌（LeetCode 384）— 5 行代码考"等概率"

<span class="dig-tag dig-tag--category">数组与字符串</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
**洗牌的"等概率"不是看代码长短，是看每个排列出现概率是否都等于 1/n!**。Fisher-Yates 是少数能数学证明等概率的算法，5 行代码。**抽样、A/B 测试、随机推荐都用它**——错版本的洗牌算法（朴素 `Math.random()` 交换）会让某些排列出现概率不均，被风控当作"作弊检测"对象。
:::

## 为什么单独讲它

跟 `Collections.shuffle()` 一样的事情，**为什么要自己写一遍**？因为面试官真正在考：
1. **你能不能写一个"等概率"的随机算法**——朴素错版的代码也能跑，但概率分布不均
2. **能不能数学证明它是等概率**——交换论证、概率乘积、归纳法

这是 5 行代码考"算法严谨性"的经典题。

### 朴素错版 vs 正确版

❌ **朴素错版**（很多人会写）：

```java
public void shuffle(int[] nums) {
    int n = nums.length;
    for (int i = 0; i < n; i++) {
        int j = rand.nextInt(n);                        // ★ 整个区间随机
        swap(nums, i, j);
    }
}
```

**为什么错**：每轮在 `[0, n)` 随机一个 j 交换。**总可能性 = n^n** 种执行路径，但**排列只有 n! 种**。`n^n` 不能被 `n!` 整除，所以**某些排列出现概率严格大于其他**。

举例 n=3：n^n=27 种执行，n!=6 种排列，27/6 = 4.5 → 不可能均匀。

✅ **Fisher-Yates 正确版**：

```java
public void shuffle(int[] nums) {
    int n = nums.length;
    for (int i = n - 1; i > 0; i--) {
        int j = rand.nextInt(i + 1);                    // ★ 只在 [0, i] 随机
        swap(nums, i, j);
    }
}
```

**总可能性 = n × (n-1) × ... × 1 = n!**，**与排列数相等**，每种排列对应唯一一条执行路径。

## 等概率的数学证明

**目标**：证明任意元素 x 出现在最终位置 k 的概率 = 1/n。

**Fisher-Yates 从后往前迭代**：

- 第 1 轮（i = n-1）：x 出现在位置 n-1 的概率 = 1/n（n 个候选随便挑）
- 第 2 轮（i = n-2）：x 没被第 1 轮选中（概率 (n-1)/n）× 第 2 轮被选中（概率 1/(n-1)）= 1/n
- 第 k 轮：x 前 k-1 轮没被选中（概率 (n-1)/n × (n-2)/(n-1) × ... × (n-k+1)/(n-k+2)）× 第 k 轮被选中（1/(n-k+1)）= 1/n

**每个位置上 x 出现的概率都是 1/n** → 等概率 ✓

## 完整代码

```java
class Solution {
    private final int[] original;
    private final int[] shuffled;
    private final Random rand = new Random();

    public Solution(int[] nums) {
        original = nums.clone();
        shuffled = nums.clone();
    }

    public int[] reset() {
        return original;
    }

    public int[] shuffle() {
        for (int i = shuffled.length - 1; i > 0; i--) {
            int j = rand.nextInt(i + 1);                // ★ 关键：[0, i] 而非 [0, n)
            int tmp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = tmp;
        }
        return shuffled;
    }
}
```

**Inside-Out 版本**（不能原地修改时用，常见于"流式洗牌"）：

```java
public int[] shuffleInsideOut(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    for (int i = 0; i < n; i++) {
        int j = rand.nextInt(i + 1);                    // ★ [0, i] 区间
        if (j != i) result[i] = result[j];
        result[j] = nums[i];
    }
    return result;
}
```

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| `rand.nextInt(n)` 而不是 `nextInt(i + 1)` | 概率不均（n^n 种执行 vs n! 种排列）| 必须 `nextInt(i + 1)` |
| 用 `Math.random() * n` 截断 | 浮点精度问题，n 大时分布不均 | 用 `Random.nextInt(int bound)` |
| 在循环外 new Random | 没问题；但要多线程并发，用 `ThreadLocalRandom` | `ThreadLocalRandom.current().nextInt(i + 1)` |
| 直接修改 original 数组 | reset 时拿不回原始 | 保存 `original = nums.clone()` |

## 复杂度

- **`shuffle`**：O(n) 时间，O(1) 额外空间（原地）
- **Inside-Out**：O(n) 时间，O(n) 额外空间

## 业界应用

| 场景 | 用法 |
|------|------|
| **A/B 测试分流** | 用户进入实验时洗牌候选组（轻量场景，重场景用一致性哈希） |
| **推荐系统打散** | 推荐列表 top-N 内部打散，避免"前 3 个永远一样"的视觉疲劳 |
| **抽样统计** | 蓄水池抽样的内部步骤 |
| **游戏发牌** | 斗地主 / 扑克 / 麻将的发牌器 |
| **机器学习** | 训练数据 shuffle（PyTorch DataLoader、TF Dataset 都用 Fisher-Yates）|

### Java / Python 标准库

- **Java `Collections.shuffle(list)`**：内部就是 Fisher-Yates
- **Python `random.shuffle(list)`**：同样是 Fisher-Yates
- **`numpy.random.shuffle`**：行级 Fisher-Yates，**列不动**（神经网络 batch shuffle 常用）

## 面试常问 & 怎么答

### 为什么朴素 `rand.nextInt(n)` 是错的

**核心**：n^n 种执行路径 ≠ n! 种排列。当 n > 1 时 n^n 不能被 n! 整除，所以每个排列概率不可能均等。具体证明可以列 n=3 的所有 27 条路径，统计每种排列出现次数，会发现有的 5 次有的 4 次。

### 怎么验证一个洗牌算法是等概率的

跑 100 万次，统计每种排列出现频率。等概率算法的频率应该收敛到 1/n!。**实习生面试时这是一个能写代码当场验证的题**。

### 数据流不知道总长度怎么洗牌

**蓄水池抽样（Reservoir Sampling）**——流式版的 Fisher-Yates。第 i 个元素以 k/i 概率被选中、随机替换池中某个，最终池里就是 k 个等概率样本。Spark / Flink 采样、Kafka Consumer 采样都是这个。

### 一定要用洗牌吗？随机访问 + 标记可不可以

理论可以——随机抽下标，记到 set 里防重复。但 set 不停长大、抽取概率不均。Fisher-Yates 一次 O(n) 解决，不需要额外标记。

## 看到什么就先想到这类

- "洗牌 / shuffle / 等概率随机排列" → Fisher-Yates
- "Java `Collections.shuffle()` 怎么实现" → 同上
- "A/B 测试随机分流" → Fisher-Yates（轻）/ 一致性哈希（重）
- "数据流不知总数的等概率采样" → 蓄水池抽样
- "面试官追问'你这洗牌对吗'" → 用 n^n vs n! 论证
