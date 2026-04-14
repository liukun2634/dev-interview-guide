---
title: 大语言模型基础 LLM Fundamentals
---

# 大语言模型基础 LLM Fundamentals

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
大语言模型（Large Language Model, LLM）是基于 Transformer 架构、通过海量文本数据预训练而成的深度学习模型，具备强大的语言理解与生成能力。理解其核心机制——**自注意力（Self-Attention）**、**预训练与微调范式**、**解码策略**——是 AI 领域面试的基础考点。
:::

## 什么是大语言模型

大语言模型（LLM）是**参数量通常在数十亿以上**的神经网络模型，通过在大规模语料库上进行自监督学习（Self-Supervised Learning），学会对自然语言的统计规律建模。其核心能力包括：

- **文本生成**：根据上下文逐 Token 预测下一个词
- **语义理解**：对输入文本进行深层语义表征
- **上下文学习（In-Context Learning）**：通过 Prompt 中的示例即可完成新任务，无需额外训练

典型的 LLM 采用**仅解码器（Decoder-Only）**架构，如 GPT 系列、Claude、LLaMA 等。

---

## Transformer 架构

Transformer 由 Vaswani 等人于 2017 年在论文《Attention Is All You Need》中提出，是当前几乎所有 LLM 的基础架构。

### 自注意力机制 Self-Attention

自注意力机制使模型能够在处理每个 Token 时，关注输入序列中所有其他 Token 的信息，从而捕获长距离依赖关系。

给定输入序列的表示矩阵 $X$，通过三个线性变换得到查询（Query）、键（Key）、值（Value）矩阵：

$$
Q = XW_Q, \quad K = XW_K, \quad V = XW_V
$$

注意力得分的计算公式为：

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

其中 $d_k$ 是 Key 向量的维度，除以 $\sqrt{d_k}$ 的目的是**防止点积值过大导致 softmax 梯度消失**。

### 多头注意力 Multi-Head Attention

多头注意力将 Q、K、V 分别投影到 $h$ 个不同的子空间，并行计算注意力后拼接：

$$
\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \ldots, \text{head}_h)W_O
$$

$$
\text{head}_i = \text{Attention}(QW_Q^i, KW_K^i, VW_V^i)
$$

多头机制允许模型同时从**不同的表示子空间**中捕获信息（例如句法关系、语义关联等）。

### 位置编码 Positional Encoding

Transformer 本身不包含序列顺序信息（不像 RNN 天然具有时序性），因此需要显式注入位置信息。原始 Transformer 使用正弦/余弦位置编码：

$$
PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d}}\right), \quad PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d}}\right)
$$

现代 LLM 大多采用**旋转位置编码（RoPE, Rotary Position Embedding）**，它将位置信息编码为旋转矩阵，具有更好的外推能力。

### 前馈网络 Feed-Forward Network

每个 Transformer 层中，注意力子层之后是一个逐位置的前馈网络（FFN）：

$$
\text{FFN}(x) = \text{ReLU}(xW_1 + b_1)W_2 + b_2
$$

现代模型通常使用 **SwiGLU** 激活函数替代 ReLU，以获得更好的训练效果。

### 整体结构示意

```
输入 Token 序列
       │
  ┌────▼────┐
  │ Embedding │ + Positional Encoding
  └────┬────┘
       │
  ┌────▼─────────────────┐
  │  Multi-Head Attention │◄── Masked (Decoder-Only)
  │  + Residual + LayerNorm│
  └────┬─────────────────┘
       │
  ┌────▼─────────────────┐
  │  Feed-Forward Network │
  │  + Residual + LayerNorm│
  └────┬─────────────────┘
       │
       ×N 层（N = 32~128）
       │
  ┌────▼────┐
  │ LM Head │ → 下一个 Token 概率分布
  └─────────┘
```

---

## 预训练与微调

### 预训练 Pre-training

预训练阶段使用**海量无标注文本**（通常数万亿 Token），通过**下一个词预测（Next Token Prediction）**任务训练模型：

$$
\mathcal{L}_{\text{pretrain}} = -\sum_{t=1}^{T} \log P(x_t \mid x_1, x_2, \ldots, x_{t-1}; \theta)
$$

这一阶段的目标是让模型学习语言的通用知识，包括语法、事实信息、推理能力等。

微调是在预训练模型基础上，使用特定任务数据进一步训练的过程，详见 [模型微调与训练](./model-training)。

---

## 分词 Tokenization

LLM 不直接处理原始文本，而是先将文本切分为**子词（Subword）**单元。

| 算法 | 特点 | 代表模型 |
|------|------|----------|
| **BPE（Byte-Pair Encoding）** | 从字符开始，反复合并最高频的相邻字符对 | GPT 系列 |
| **WordPiece** | 类似 BPE，但基于似然度选择合并 | BERT |
| **SentencePiece** | 语言无关，直接在原始文本上训练，支持 BPE/Unigram | LLaMA, Qwen |

**关键概念**：
- **Vocabulary Size**（词表大小）：通常 32K~150K
- **Token ≠ 单词**：一个英文单词可能被拆为多个 Token（如 `"uncomfortable"` → `["un", "comfort", "able"]`）
- 中文通常按字或常用词切分，每个汉字约消耗 1~2 个 Token

---

## 解码策略：Temperature, Top-K, Top-P

模型在生成文本时，需要从词表概率分布中**采样**下一个 Token。不同的采样策略对生成质量有显著影响。

### Temperature（温度）

Temperature 参数 $\tau$ 用于调节 softmax 输出的概率分布：

$$
P(x_i) = \frac{\exp(z_i / \tau)}{\sum_j \exp(z_j / \tau)}
$$

- $\tau \to 0$：分布趋向确定性，选择概率最高的 Token（贪心解码）
- $\tau = 1$：保持原始分布
- $\tau > 1$：分布更平坦，增加随机性和多样性

### Top-K 采样

只从概率最高的前 $K$ 个 Token 中采样，其余 Token 概率设为 0。

### Top-P 采样（Nucleus Sampling）

选择概率累积和刚好超过 $P$ 的最小 Token 集合，从中采样。相比 Top-K，Top-P 能自适应调整候选集大小。

### Python 实现示例

```python
import numpy as np

def sample_with_temperature(logits: np.ndarray, temperature: float = 1.0,
                            top_k: int = 0, top_p: float = 1.0) -> int:
    """
    从 logits 中按指定策略采样下一个 Token。

    Args:
        logits: 模型输出的原始分数 (vocab_size,)
        temperature: 温度参数，越低越确定
        top_k: 仅保留概率最高的 K 个 Token，0 表示不启用
        top_p: 核采样阈值，1.0 表示不启用
    Returns:
        采样得到的 Token ID
    """
    # 1. 应用温度缩放
    logits = logits / temperature

    # 2. Top-K 过滤
    if top_k > 0:
        top_k_indices = np.argsort(logits)[-top_k:]
        mask = np.full_like(logits, -np.inf)
        mask[top_k_indices] = logits[top_k_indices]
        logits = mask

    # 3. 计算 softmax 概率
    exp_logits = np.exp(logits - np.max(logits))
    probs = exp_logits / exp_logits.sum()

    # 4. Top-P (Nucleus) 过滤
    if top_p < 1.0:
        sorted_indices = np.argsort(probs)[::-1]
        sorted_probs = probs[sorted_indices]
        cumulative_probs = np.cumsum(sorted_probs)

        # 找到累积概率超过 top_p 的截断点
        cutoff_index = np.searchsorted(cumulative_probs, top_p) + 1
        keep_indices = sorted_indices[:cutoff_index]

        filtered_probs = np.zeros_like(probs)
        filtered_probs[keep_indices] = probs[keep_indices]
        probs = filtered_probs / filtered_probs.sum()

    # 5. 按概率采样
    return int(np.random.choice(len(probs), p=probs))
```

---

## RLHF 人类反馈强化学习

RLHF（Reinforcement Learning from Human Feedback）是使 LLM 输出与人类偏好对齐的关键技术。关于 RLHF 的三阶段流程、DPO 等替代方案的详细介绍，请参阅 [模型微调与训练](./model-training)。

---

## 主流模型家族

关于 GPT-4、Claude、LLaMA、Qwen、DeepSeek 等主流模型的详细对比，以及 MoE 架构和多模态 AI 的介绍，请参阅 [AI 概述与发展历程](./ai-overview)。

---

## 推理优化

KV Cache、量化（Quantization）、推测解码（Speculative Decoding）等推理优化技术的详细介绍，请参阅 [AI 应用架构设计](./ai-architecture)。

---

## 常见陷阱

::: warning ⚠️ 常见误区

1. **混淆 Encoder-Only / Decoder-Only / Encoder-Decoder 架构**：BERT 是 Encoder-Only（适合理解任务），GPT 是 Decoder-Only（适合生成任务），T5 是 Encoder-Decoder（适合 seq2seq 任务）。当前主流 LLM 几乎都是 Decoder-Only。

2. **认为 Temperature=0 是确定性输出**：严格来说 Temperature=0 是贪心解码（Greedy Decoding），每步选概率最高的 Token。但由于浮点精度问题，相同输入在不同硬件上仍可能产生细微差异。

3. **混淆微调与 Prompt Engineering**：微调修改模型参数，Prompt Engineering 不修改参数而是通过精心设计输入引导模型输出。二者适用场景不同，不可互相替代。

4. **忽视 Tokenization 对性能的影响**：不同语言的 Token 化效率不同，中文在英文为主的模型中通常消耗更多 Token，影响成本和上下文长度利用率。

:::

---

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">2 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 请解释 Transformer 的自注意力机制及其计算过程</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. Temperature、Top-K、Top-P 三种采样策略有何区别？如何选择？</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">简单</span>
  </div>
</div>

## 面试真题详解

### Q1：请解释 Transformer 的自注意力机制及其计算过程

**要点**：

自注意力机制是 Transformer 的核心组件，其目的是让序列中每个位置的 Token 都能"关注"到序列中所有其他位置的信息。

**计算过程**：

1. 将输入向量 $x$ 通过三个权重矩阵 $W_Q$、$W_K$、$W_V$ 分别映射为 Query、Key、Value 向量
2. 计算 Query 和所有 Key 的点积作为注意力得分：$\text{score} = QK^T$
3. 除以缩放因子 $\sqrt{d_k}$ 防止梯度消失：$\text{scaled\_score} = \frac{QK^T}{\sqrt{d_k}}$
4. 通过 softmax 将得分归一化为注意力权重
5. 用注意力权重对 Value 进行加权求和，得到输出

**多头注意力**在此基础上，将 Q、K、V 分成 $h$ 个头，分别计算后拼接，使模型能从不同子空间捕获不同类型的关系。

**为什么要缩放？** 当 $d_k$ 较大时，$QK^T$ 的值可能非常大，导致 softmax 的梯度趋近于零，缩放因子确保梯度稳定。

---

### Q2：Temperature、Top-K、Top-P 三种采样策略有何区别？如何选择？

**要点**：

| 策略 | 作用 | 效果 |
|------|------|------|
| **Temperature** | 缩放 logits 分布的平坦程度 | 低温确定性高、高温多样性大 |
| **Top-K** | 仅从概率前 K 个 Token 中采样 | 截断尾部低概率 Token |
| **Top-P** | 从累积概率达到阈值 P 的最小集合中采样 | 自适应候选集大小 |

**选择建议**：

- **代码生成 / 数学推理**：低 Temperature（0.0~0.3），追求准确性
- **创意写作 / 对话**：中等 Temperature（0.7~1.0），平衡质量和多样性
- **头脑风暴**：高 Temperature（1.0~1.5），追求多样性

Top-K 和 Top-P 通常与 Temperature 组合使用。Top-P 相比 Top-K 更灵活，因为它会根据分布形状自动调整候选 Token 数量——在模型非常确定时只保留少量候选，在不确定时保留更多候选。

---

## 延伸阅读

- [Attention Is All You Need (Vaswani et al., 2017)](https://arxiv.org/abs/1706.03762)
- [Language Models are Few-Shot Learners (GPT-3 Paper)](https://arxiv.org/abs/2005.14165)
- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
- [Training language models to follow instructions with human feedback (InstructGPT)](https://arxiv.org/abs/2203.02155)
- [LLaMA: Open and Efficient Foundation Language Models](https://arxiv.org/abs/2302.13971)
