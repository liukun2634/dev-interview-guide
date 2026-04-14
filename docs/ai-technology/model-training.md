---
title: 模型微调与训练
---

# 模型微调与训练

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 中频</span>

::: tip 💡 核心要点
模型训练是指通过特定数据优化大语言模型参数的过程，主要分为**预训练（Pre-training）**、**监督微调（SFT）**和**对齐（Alignment）**三个阶段。对于大多数应用场景，核心关注的是**参数高效微调（PEFT）**——其中 **LoRA** 是最主流的方法——和**人类偏好对齐（RLHF/DPO）**。掌握这些技术是理解 LLM 如何从"通用语言模型"演变为"可用的 AI 助手"的关键。
:::

## 训练范式全景

大语言模型的训练是一个多阶段的流程，每个阶段有不同的目标和数据需求：

```
阶段 1: 预训练                阶段 2: 监督微调 (SFT)         阶段 3: 对齐
Pre-training                 Supervised Fine-Tuning        Alignment

┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│ 海量无标注文本 │            │ 高质量指令数据 │            │ 人类偏好数据  │
│ (数万亿 Token)│            │ (数万~数十万) │            │ (偏好排序)   │
└──────┬───────┘            └──────┬───────┘            └──────┬───────┘
       │                          │                          │
  下一个词预测               指令→回答对               RLHF / DPO
       │                          │                          │
       ▼                          ▼                          ▼
  基础语言模型               指令遵循模型               对齐的 AI 助手
  (GPT base)                (可回答问题)             (安全、有帮助)
```

| 阶段 | 数据规模 | 计算成本 | 目标 |
|------|----------|----------|------|
| **预训练** | TB 级文本（万亿 Token） | 极高（数千 GPU × 数月） | 学习语言知识和世界知识 |
| **SFT** | 数万~数十万条 | 中等（数小时~数天） | 学习遵循指令、对话格式 |
| **对齐** | 数万条偏好数据 | 中等 | 输出与人类期望一致 |

---

## 微调方法概览

### 全量微调 Full Fine-tuning

更新模型的**所有参数**，是最直接的微调方式：

- **优点**：效果最好，模型可充分适配目标任务
- **缺点**：需要与预训练相同级别的显存，70B 模型需要 ~140GB 显存（FP16）
- **适用**：有充足计算资源且任务差异大的场景

### 参数高效微调 PEFT

冻结原始模型的大部分参数，只训练少量新增参数：

| 方法 | 原理 | 可训练参数量 | 效果 |
|------|------|-------------|------|
| **LoRA** | 在权重矩阵旁添加低秩分解增量 | 0.1%~1% | 接近全量微调 |
| **QLoRA** | LoRA + 4-bit 量化基础模型 | 0.1%~1% | 接近 LoRA，显存减少 ~75% |
| **Prefix Tuning** | 在每层注意力前添加可训练的前缀向量 | < 0.1% | 适合特定格式任务 |
| **Adapter** | 在 Transformer 层中插入小型瓶颈网络 | ~1% | 早期方法，已逐步被 LoRA 替代 |
| **IA3** | 学习激活值的缩放因子 | < 0.01% | 极少参数，效果有限 |

---

## LoRA 深入解析

LoRA（Low-Rank Adaptation）是当前最主流的 PEFT 方法，其核心思想：**冻结原始权重 $W$，在旁边添加一个低秩分解的增量矩阵**。

### 数学原理

对于原始权重矩阵 $W \in \mathbb{R}^{d \times d}$，LoRA 将增量分解为两个低秩矩阵的乘积：

$$
W' = W + \Delta W = W + BA
$$

其中 $B \in \mathbb{R}^{d \times r}$，$A \in \mathbb{R}^{r \times d}$，$r \ll d$。

**参数量对比**：
- 全量微调：$d^2$ 参数（如 $d = 4096$，则 $\approx 16.7M$）
- LoRA：$2 \times d \times r$ 参数（$r = 16$ 时，$\approx 131K$，**压缩 128 倍**）

### 为什么低秩有效

研究发现，预训练模型在微调过程中的权重变化 $\Delta W$ 具有**低秩特性**——即权重变化集中在少数几个主要方向上。因此用低秩矩阵近似 $\Delta W$ 信息损失很小。

### 实现细节

```python
import torch
import torch.nn as nn

class LoRALinear(nn.Module):
    """带 LoRA 的线性层"""
    def __init__(self, original_linear: nn.Linear, rank: int = 16, alpha: float = 32):
        super().__init__()
        self.original = original_linear
        self.original.weight.requires_grad = False  # 冻结原始权重

        d_in, d_out = original_linear.in_features, original_linear.out_features

        # LoRA 低秩矩阵
        self.lora_A = nn.Linear(d_in, rank, bias=False)   # 降维
        self.lora_B = nn.Linear(rank, d_out, bias=False)   # 升维

        # 初始化：A 用正态分布，B 用零初始化 → 初始 ΔW = 0
        nn.init.normal_(self.lora_A.weight, std=0.02)
        nn.init.zeros_(self.lora_B.weight)

        self.scaling = alpha / rank  # 缩放因子

    def forward(self, x):
        original_output = self.original(x)
        lora_output = self.lora_B(self.lora_A(x)) * self.scaling
        return original_output + lora_output
```

### 关键超参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| **rank (r)** | 低秩矩阵的秩，控制参数量和表达能力 | 8~64（常用 16 或 32） |
| **alpha (α)** | 缩放因子，控制 LoRA 增量的影响强度 | 通常设为 rank 的 2 倍 |
| **target_modules** | 应用 LoRA 的层（Q/K/V/O/FFN） | 至少 Q、V 投影层 |
| **dropout** | LoRA 层的 Dropout | 0.05~0.1 |

### 推理时合并

LoRA 的一大优势是推理时可以将增量合并回原始权重，**不增加任何推理开销**：

$$
W_{\text{merged}} = W + \frac{\alpha}{r} \cdot BA
$$

合并后的模型与全量微调的模型在计算流程上完全相同。

### QLoRA

QLoRA 是 LoRA 的进一步优化，将基础模型量化为 **4-bit**，只用 LoRA 部分保持高精度：

$$
W'_{\text{QLoRA}} = \text{Dequant}_4(W_{\text{4bit}}) + BA
$$

- 70B 模型微调显存：全量 ~140GB → LoRA ~40GB → QLoRA ~16GB（单卡 24GB GPU 可训练）
- 精度损失极小，是个人和小团队微调大模型的首选方案

---

## 监督微调 SFT

### 指令微调

指令微调（Instruction Tuning）使用**指令-回答对**训练模型学习遵循用户指令：

```json
{
  "instruction": "请将以下英文翻译为中文",
  "input": "The weather is beautiful today.",
  "output": "今天天气很好。"
}
```

### 数据集格式

| 格式 | 结构 | 代表数据集 |
|------|------|------------|
| **Alpaca** | instruction + input + output | Stanford Alpaca（52K 条） |
| **ShareGPT** | 多轮对话 (human/gpt 交替) | ShareGPT、WildChat |
| **OpenAI Chat** | messages 数组 (system/user/assistant) | 自定义对话数据 |

### 数据质量 > 数据数量

研究表明（如 LIMA 论文），**少量高质量数据**（1000 条精心标注的数据）的效果可能优于大量低质量数据。关键在于：

- **多样性**：覆盖目标任务的各种场景
- **一致性**：输出风格和格式统一
- **准确性**：答案正确、逻辑清晰
- **长度适当**：避免过短（信息不足）或过长（注水）

---

## 人类偏好对齐

预训练+SFT 之后的模型已能遵循指令，但输出可能不安全、不诚实或不够有帮助。对齐（Alignment）阶段使模型输出与人类偏好一致。

### RLHF（Reinforcement Learning from Human Feedback）

RLHF 是最经典的对齐方法，由三个子阶段组成：

```
阶段 1：奖励模型训练
┌──────────────────────────────────────┐
│ 同一个 Prompt，模型生成多个回答        │
│ 人类标注员对回答进行偏好排序            │
│ 训练奖励模型 (RM) 预测人类偏好得分      │
└──────────────────────────────────────┘

阶段 2：PPO 强化学习优化
┌──────────────────────────────────────┐
│ SFT 模型生成回答                      │
│ RM 对回答评分                         │
│ PPO 算法根据评分调整策略               │
│ KL 散度约束防止偏离 SFT 模型太远       │
└──────────────────────────────────────┘
```

**RLHF 的优化目标**：

$$
\max_{\pi_\theta} \mathbb{E}_{x \sim D, y \sim \pi_\theta(y|x)} \left[ R_\phi(x, y) - \beta \cdot D_{\text{KL}}(\pi_\theta(y|x) \| \pi_{\text{ref}}(y|x)) \right]
$$

其中 $R_\phi$ 是奖励模型，$\pi_\theta$ 是策略模型，$\pi_{\text{ref}}$ 是 SFT 模型（参考模型），$\beta$ 控制 KL 惩罚力度。

### DPO（Direct Preference Optimization）

DPO 跳过了奖励模型的训练，直接从偏好数据中优化策略：

$$
\mathcal{L}_{\text{DPO}} = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma \left( \beta \log \frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)} \right) \right]
$$

其中 $y_w$ 是偏好的回答（win），$y_l$ 是被拒绝的回答（lose）。

### RLHF vs DPO

| 维度 | RLHF | DPO |
|------|------|-----|
| **流程复杂度** | 需训练奖励模型 + PPO 优化 | 只需一步优化 |
| **训练稳定性** | PPO 调参困难，易不稳定 | 标准监督学习，训练稳定 |
| **效果** | 理论上限更高 | 实践中与 RLHF 接近 |
| **数据需求** | 偏好排序数据 | 偏好对（win/lose） |
| **主流度** | 早期主流（InstructGPT） | 2024 年后成为主流 |

### 其他对齐方法

| 方法 | 特点 | 发布时间 |
|------|------|----------|
| **ORPO** | 合并 SFT 和对齐为一步，无需参考模型 | 2024 |
| **KTO** | 只需"好/坏"二分标签而非成对偏好 | 2024 |
| **SimPO** | 简化 DPO，使用序列平均对数概率作为隐式奖励 | 2024 |

---

## 训练实践

### LoRA 微调示例

使用 Hugging Face PEFT 和 TRL 库进行 LoRA 微调：

```python
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer

# 1. 加载模型和分词器
model_name = "Qwen/Qwen2.5-7B"
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype="auto")
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 2. 配置 LoRA
lora_config = LoraConfig(
    r=16,                          # 秩
    lora_alpha=32,                 # 缩放因子
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# trainable params: 13,107,200 || all params: 7,628,000,000 || trainable%: 0.17%

# 3. 准备数据
dataset = load_dataset("json", data_files="train_data.jsonl")

# 4. 训练
training_args = TrainingArguments(
    output_dir="./output",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    warmup_ratio=0.1,
    bf16=True,
    logging_steps=10,
    save_strategy="epoch",
)

trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    tokenizer=tokenizer,
    max_seq_length=2048,
)

trainer.train()

# 5. 合并并保存
merged_model = model.merge_and_unload()
merged_model.save_pretrained("./merged_model")
```

### 训练基础设施

| 模型规模 | 全量微调显存 | QLoRA 显存 | 推荐硬件 |
|----------|------------|-----------|----------|
| **7B** | ~28GB | ~6GB | 1× A100 40GB / 1× RTX 4090 |
| **13B** | ~52GB | ~10GB | 1× A100 80GB |
| **70B** | ~140GB | ~16GB | 4× A100 80GB / 1× A100 (QLoRA) |

### 分布式训练

大规模模型通常需要多卡甚至多机训练：

| 框架 | 策略 | 特点 |
|------|------|------|
| **FSDP** | 完全分片数据并行 | PyTorch 原生，将模型参数/梯度/优化器状态分片到多卡 |
| **DeepSpeed** | ZeRO（Zero Redundancy Optimizer） | 微软开发，ZeRO-3 可训练万亿参数模型 |
| **Megatron-LM** | 张量并行 + 流水线并行 | NVIDIA 开发，适合超大规模预训练 |

---

## 评估体系

### 通用基准测试

| 基准 | 评估能力 | 说明 |
|------|----------|------|
| **MMLU** | 通用知识 | 57 个学科的多选题（高中~专业级） |
| **HumanEval** | 代码生成 | 164 个 Python 编程题 |
| **MT-Bench** | 对话能力 | 多轮对话质量（GPT-4 评分） |
| **MATH** | 数学推理 | 竞赛级数学问题 |
| **C-Eval** | 中文知识 | 中文多学科知识评估 |

### 自定义评估

生产环境中，通用基准不足以衡量微调效果，需要构建**领域特定评估集**：

1. 准备 100~500 条代表性测试样例
2. 定义评估维度（准确性、格式遵循、安全性等）
3. 使用强模型（如 GPT-4）自动评分或人工评审
4. 对比微调前后的效果差异

---

::: warning ⚠️ 常见误区

1. **认为微调可以注入新知识**：微调的本质是改变模型的**行为模式**（输出格式、风格、偏好），而非注入新的事实知识。如果需要新知识，应使用 RAG 而非微调。

2. **数据量越多效果越好**：低质量数据可能导致模型退化。LIMA 研究表明 1000 条高质量数据即可显著提升效果。关键是数据质量和多样性。

3. **LoRA rank 越大越好**：过大的 rank 不仅增加计算成本，还可能导致过拟合。通常 16~32 的 rank 已经足够。

4. **忽视评估的重要性**：微调后必须在独立测试集上评估，避免过拟合训练数据。通用基准和领域评估都需要。

:::

---

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 解释 LoRA 的原理及其数学基础，为什么低秩分解有效？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 对比 RLHF 和 DPO 两种对齐方法的优缺点</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 如何为企业场景准备高质量的微调数据集？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

## 面试真题详解

### Q1：解释 LoRA 的原理及其数学基础，为什么低秩分解有效？

**要点**：

LoRA 的核心思想是冻结预训练模型的权重 $W$，在旁边添加一个**低秩分解的增量矩阵** $\Delta W = BA$：

$$
W' = W + BA, \quad B \in \mathbb{R}^{d \times r}, A \in \mathbb{R}^{r \times d}, r \ll d
$$

**为什么低秩有效**：
1. 研究发现微调时的权重变化 $\Delta W$ 具有**内在低秩特性**——变化集中在少数几个主要方向上
2. 预训练模型已经学到了丰富的语言表示，微调只需要在这些表示上做**小幅调整**
3. 类比：微调不是"重新学习"，而是"微调旋钮"——需要调节的自由度（秩）远小于模型的总参数维度

**实践要点**：
- 初始化：$A$ 正态初始化，$B$ 零初始化 → 训练开始时 $\Delta W = 0$，不破坏原始模型
- 推理无额外开销：$W_{\text{merged}} = W + BA$ 合并后计算量不变
- 作用于 Q/K/V/O 投影层效果最佳

---

### Q2：对比 RLHF 和 DPO 两种对齐方法的优缺点

**要点**：

**RLHF**：两步走——先训练奖励模型（RM），再用 PPO 强化学习优化。
- 优点：理论上限高，奖励模型可复用
- 缺点：流程复杂（需同时维护 4 个模型：策略/参考/奖励/价值），PPO 训练不稳定

**DPO**：一步到位——将奖励函数隐式嵌入策略优化中，直接从偏好对（win/lose）训练。
- 优点：实现简单（标准监督学习），训练稳定，无需单独的奖励模型
- 缺点：无法复用奖励模型，对偏好数据质量更敏感

**关键数学联系**：DPO 证明了在 KL 约束下，最优策略可以用参考模型和数据直接表示，无需显式奖励模型。

2024 年后 **DPO 已成为主流**选择，因为其简洁性和稳定性在实践中优势明显。

---

### Q3：如何为企业场景准备高质量的微调数据集？

**要点**：

**数据收集**：
1. 从真实业务场景中收集"问题-期望回答"对
2. 让领域专家编写高质量的标准答案
3. 利用强模型（GPT-4）辅助生成初稿，人工审核修正

**数据质量控制**：
- **准确性**：答案必须正确，由专家审核
- **多样性**：覆盖业务场景的各种变体和边界情况
- **一致性**：输出格式、风格、详略程度统一
- **去重和去噪**：移除重复、模糊、矛盾的样例

**数据规模建议**：
- 起步：500~1000 条高质量数据
- 进阶：5000~10000 条
- 关键原则：宁缺勿滥，1000 条精标数据 >> 10000 条粗标数据

**数据格式**：使用 ShareGPT 多轮对话格式或 OpenAI Chat 格式，包含 system prompt 定义角色和约束。

---

## 延伸阅读

- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
- [QLoRA: Efficient Finetuning of Quantized Language Models](https://arxiv.org/abs/2305.14314)
- [Training language models to follow instructions with human feedback (InstructGPT)](https://arxiv.org/abs/2203.02155)
- [Direct Preference Optimization (DPO)](https://arxiv.org/abs/2305.18290)
- [LIMA: Less Is More for Alignment](https://arxiv.org/abs/2305.11206)
