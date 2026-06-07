---
title: VLM 视觉语言模型
---

# VLM 视觉语言模型（Vision-Language Models）

<span class="dig-tag dig-tag--category">多模态 AI</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**GPT-4o / Claude 3.5 / Gemini 2.5** 都是原生多模态——文本、图像、视频、音频在同一模型里。VLM（Vision-Language Model）是 2024-2026 主流方向，必懂三层架构（**视觉编码器 + 投影层 + LLM**）和 **CLIP / SigLIP / LLaVA** 三大流派的差异。
:::

## VLM 三层架构（必背）

```
┌──────────────────────────────────────────────────────┐
│  图片输入                                              │
│     ↓                                                 │
│  ① 视觉编码器（Vision Encoder）                       │
│     ViT-L/14 或 SigLIP                               │
│     → 输出: image tokens (576 × 1024-dim)           │
│     ↓                                                 │
│  ② 投影层（Projector / Connector）                   │
│     MLP 或 Q-Former 或 Resampler                     │
│     → 把视觉空间映射到 LLM 词嵌入空间                 │
│     → 输出: image tokens (576 × LLM_hidden_dim)     │
│     ↓                                                 │
│  ③ LLM（大语言模型）                                  │
│     LLaMA / Vicuna / Qwen 等                         │
│     → 把图像 token 当成"假词"和文本 token 一起处理     │
│     → 输出: 文本回答                                  │
└──────────────────────────────────────────────────────┘
```

**关键洞察**：图像被 ViT 切成 patches（如 24×24=576 个），每个 patch 变成一个 "token"，**和文本 token 拼在一起喂给 LLM**。LLM 完全不用改架构。

---

## 三大流派对比

### 流派 1：CLIP（Contrastive Learning）— 多模态对齐的鼻祖

**OpenAI 2021 年提出，奠定整个 VLM 时代基础**。

```
训练目标: 学习"图-文"对齐
   ┌────────────┐                ┌────────────┐
   │ Image      │ ──ViT──→       │ Text       │ ──Text──→
   │ "猫的图片"  │               │ "a cat"    │
   └────────────┘                └────────────┘
         ↓                              ↓
    image embedding              text embedding
         └──────── 对比损失 (InfoNCE) ────┘
         "匹配的图文对相似度高，不匹配的低"
```

**核心特点**：
- ✅ **训练数据简单**：4 亿对图-文（互联网爬）
- ✅ **零样本分类**：把分类标签 embed 成 text，看图最像哪个
- ✅ **Embedding 通用**：是 DALL-E / Stable Diffusion 的文本编码器
- ❌ **不能生成文本**——只做对齐，不做 caption / VQA

**面试一句话**："CLIP 不是 VLM，是 VLM 的视觉编码器"。

### 流派 2：SigLIP（Sigmoid Loss）— Google 2023 升级版

**问题**：CLIP 用 Softmax 损失需要**很大 batch size**（32K+）才有效，训练成本高。

**SigLIP 思路**：换成 **Sigmoid 损失**——每个图-文对独立判断是否匹配，不需要"组内归一化"。

| 维度 | CLIP | SigLIP |
|------|------|--------|
| **损失** | Softmax (InfoNCE) | **Sigmoid（pair-wise）** |
| **Batch 要求** | 巨大（32K+）| **小 batch 也行**（256 起）|
| **训练成本** | 高 | **低 2-4 倍** |
| **效果** | 基线 | **小模型场景更好** |
| **代表用户** | OpenAI、各类生成模型 | **LLaVA-NeXT、PaliGemma、Idefics2** |

::: tip 💡 SigLIP 2024 升级

> Google 2024 年发布 **SigLIP 2**，进一步引入多分辨率 + 多任务训练，是当前 2026 年 **开源 VLM 的视觉编码器首选**。

:::

### 流派 3：LLaVA 系列 — 把 CLIP/SigLIP 接入 LLM

**LLaVA（Liu et al. 2023）= CLIP-ViT + MLP + Vicuna**

**核心贡献**：证明**简单的 MLP 投影**就能让纯文本 LLM 看懂图。

```python
# LLaVA 1.5 极简伪代码
image_tokens = vit_encoder(image)                # (576, 1024)
image_tokens = mlp_projector(image_tokens)       # (576, 4096) ← Llama hidden
text_tokens = tokenizer(prompt)                  # (N, 4096)
all_tokens = concat([image_tokens, text_tokens]) # (576+N, 4096)
output = llama(all_tokens)                       # 直接喂给 LLM
```

**LLaVA 演进**：

| 版本 | 年份 | 关键改进 |
|------|------|---------|
| LLaVA 1 | 2023.4 | 提出 MLP 投影方案 |
| LLaVA 1.5 | 2023.10 | 更好的指令数据、Vicuna 13B |
| **LLaVA-NeXT** | 2024.1 | **AnyRes**：处理任意分辨率（关键突破）|
| **LLaVA-OneVision** | 2024.8 | **单图 + 多图 + 视频**统一架构 |

### 投影层 3 种设计

| 投影方案 | 代表模型 | 特点 |
|---------|---------|------|
| **MLP**（最简单）| LLaVA 1.5 / Qwen-VL | **没有压缩**，全部 576 个 patch 都喂 LLM；效果好但 token 多 |
| **Q-Former**（Querying Transformer）| **BLIP-2** / InstructBLIP | 用 32 个 learnable query 通过 cross-attention **压缩**视觉信息；token 少但训练复杂 |
| **Resampler / Perceiver**（Token Merging）| Flamingo / Idefics | Perceiver IO 风格压缩 |

::: warning ⚠️ MLP vs Q-Former 之争（2024-2025 已有定论）

> **MLP 胜出**：训练简单 + 效果不输 Q-Former + scaling 性质更好。**LLaVA 系列彻底带火 MLP 方案**，新一代 VLM（Qwen2.5-VL、InternVL 2.5、LLaVA-OV）都用 MLP。Q-Former 路线（BLIP-2）逐渐边缘化。

:::

---

## 主流 VLM 模型对比（2026 最新）

### 闭源旗舰

| 模型 | 厂商 | 关键特性 |
|------|------|---------|
| **GPT-4o / 4o-mini** | OpenAI | 原生多模态、实时语音、图像生成集成 |
| **Claude 3.5 / 4 Sonnet** | Anthropic | **PDF / 图表理解最强**、Computer Use |
| **Gemini 2.5 Pro** | Google | **原生视频理解**、百万 token 上下文 |

### 开源旗舰（生产可用）

| 模型 | 参数 | 特色 |
|------|------|------|
| **Qwen 2.5-VL**（72B/7B/2B）| 阿里 | **中文场景王者**、文档理解强、Apache 2.0 |
| **InternVL 2.5**（78B/38B/...）| 商汤/上海 AI Lab | 多模态 benchmark SOTA 开源 |
| **LLaVA-OneVision**（72B/7B）| 字节跳动 | 统一图/多图/视频架构 |
| **Pixtral 12B** | Mistral | 12B 性价比高、Apache 2.0 |
| **Llama 3.2-Vision**（11B/90B）| Meta | Llama 系视觉版（注：不支持中文友好）|
| **DeepSeek-VL2** | DeepSeek | MoE 架构、推理成本低 |
| **MiniCPM-V 2.6** | 面壁智能 | 8B 端侧多模态，超 GPT-4V |

### 端侧/手机

| 模型 | 用途 |
|------|------|
| **PaliGemma 2** | Google，端侧多模态 |
| **MiniCPM-V 2.6** | 面壁，**手机能跑** |
| **Phi-3.5-Vision** | 微软，4.2B 手机部署 |

---

## 关键技术细节（深度追问点）

### 1. 高分辨率处理：AnyRes 模式（LLaVA-NeXT 突破）

**问题**：CLIP 默认 224×224 输入太低分辨率，读不清文字 / 图表。

**LLaVA-NeXT 方案**：把高分辨率图**切成多个 224×224 patch**分别编码，再拼接。

```
原图 1344×336（横长图）
  ↓
切成 2×6 = 12 个 patch，每个 224×224
  ↓
每个 patch → CLIP → 576 token
  ↓
共 12 × 576 = 6912 image tokens
+ 原图缩略到 224×224 → 576 全局 token
  ↓
共 7488 token 喂给 LLM
```

**这是 2024-2026 OCR / 文档 / 图表理解的关键技术**。

### 2. 视频理解：抽帧 vs 时序模型

```
方案 A: 均匀抽帧 + 当作多图（LLaVA-Video）
  10s 视频 → 抽 8 帧 → 每帧 576 token → 4608 总 token
  简单但丢失时序

方案 B: 时序融合（Video-LLaVA）
  显式建模时间维度
  复杂但更准确

方案 C: 原生视频 token（Gemini）
  视觉编码器直接吃时空 patch（T×H×W）
  最优但训练贵
```

### 3. 训练范式：两阶段标准流程

```
Stage 1: 预训练（Pretraining）
  数据: 大量图-文 caption 对
  训练: 仅训练投影层（LLM 和 ViT 都冻结）
  目的: 让投影层学会"图像空间 → LLM 词空间"

Stage 2: 指令微调（Instruction Tuning）
  数据: 高质量 VQA / 对话数据（如 LLaVA-Instruct）
  训练: 解冻 LLM + 投影层（ViT 仍冻结）
  目的: 学会按指令理解和回答
```

### 4. 评估基准（必知）

| Benchmark | 测什么 |
|----------|--------|
| **MMMU** | 多学科理解（数学/物理/医学等）|
| **MathVista** | 数学视觉推理 |
| **DocVQA** | 文档问答 |
| **ChartQA** | 图表理解 |
| **MMBench / MMVet** | 综合多模态能力 |
| **OCRBench** | OCR 能力 |
| **VideoMME / MVBench** | 视频理解 |
| **Vibe-Eval**（2024）| 真实场景困难样本 |

---

## VLM 应用场景全景

| 场景 | 推荐模型 |
|------|---------|
| **通用对话** | GPT-4o / Claude / Gemini |
| **文档 / 表格 / 发票** | **Claude / Qwen 2.5-VL / DocLayout** |
| **中文场景** | **Qwen 2.5-VL** / InternVL 2.5 |
| **视频理解** | Gemini 2.5 Pro / LLaVA-Video / LLaVA-OneVision |
| **手机端侧** | MiniCPM-V 2.6 / Phi-3.5-Vision |
| **Code + 截图**（修 bug）| Claude 4 / GPT-4o |
| **医学影像** | LLaVA-Med / Med-PaLM-M |
| **OCR 替代** | Qwen 2.5-VL（已显著超越传统 OCR）|

---

## 常见陷阱（必背踩坑点）

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **图像 token 烧钱**（一张高清图 1000+ token）| API 成本爆炸 | ① 缩图至必要分辨率 ② 用 detail=low（OpenAI）③ 异步处理 |
| **不处理多图顺序** | 模型搞混"第一张/第二张" | 显式标注 `<image_1>` `<image_2>` |
| **混合视频和图片** | 模型理解错 | 用 `<video>` `<image>` 标签清晰区分 |
| **依赖 OCR 文字而非看图** | 模型读图表 / 手写差 | 选 Qwen 2.5-VL / Claude 等专门优化 OCR 的模型 |
| **截图含敏感信息** | PII 泄露 | 调用前 PII 检测 + 内容过滤 |
| **视觉对抗攻击** | 图里藏注入指令 | [Prompt Injection 防御](./security-and-jailbreak#类型-2间接注入indirect-injection-更危险) |

---

## 黄金答题模板（必背）

> **面试官：解释 VLM（多模态大模型）的工作原理**
>
> **答**：标准 VLM 是**三层架构**：① **视觉编码器**（ViT-L 或 SigLIP）把图切成 24×24 = 576 个 patch，每个变成 1024 维向量；② **投影层**（一般是 2 层 MLP）把视觉空间映射到 LLM 词嵌入空间；③ **LLM** 把这些 "图像 token" 当成假词和文本 token 拼在一起处理。
>
> **核心洞察**：LLM 完全不用改架构，关键是**让 ViT 和 LLM 的 embedding 空间对齐**——这就是投影层的工作。MLP 方案（LLaVA 1.5 起）已经胜出 Q-Former 方案（BLIP-2），原因是简单 + 效果 + scaling 性质都更好。
>
> **训练范式**：两阶段——先冻结 LLM/ViT 只训投影层做对齐，再解冻 LLM 做指令微调。
>
> **2024-2026 关键突破**：① **AnyRes**（LLaVA-NeXT）—— 高分辨率切 patch 处理，让 OCR / 文档理解成为可能；② **SigLIP** 取代 CLIP 成开源 VLM 视觉编码器标准；③ **原生视频 token**（Gemini）—— 端到端时空建模。
>
> 选型实战：中文场景用 **Qwen 2.5-VL**，闭源最强是 **Claude 4 / GPT-4o**，视频用 **Gemini 2.5 Pro**，手机端选 **MiniCPM-V 2.6**。

---

## 看到什么就先想到这类

- **"图 + 文一起喂模型"** → VLM 三层架构
- **"为什么 CLIP 不能生成文本"** → CLIP 只做对齐，不做生成
- **"MLP vs Q-Former 怎么选"** → MLP（已胜出）
- **"为什么高分辨率重要"** → AnyRes / OCR / 文档
- **"视频理解原理"** → 抽帧 → 时序融合 → 原生时空 token
- **"中文场景多模态"** → Qwen 2.5-VL
- **"端侧多模态"** → MiniCPM-V 2.6
- **"图像 token 烧钱"** → 缩图 + detail=low + 异步
