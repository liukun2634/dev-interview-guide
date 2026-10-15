---
title: VLM 视觉语言模型
---

# VLM 视觉语言模型（Vision-Language Models）

<span class="dig-tag dig-tag--category">多模态 AI</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（截至 2026-08）
VLM（Vision-Language Model）至少联合处理视觉与语言。最常见的开放权重生成式 VLM 可用三层理解：**视觉编码器 + 连接器 + LLM**；但它不是所有多模态模型的唯一架构。Llama 4 等模型采用视觉/文本 Token 的早期融合，闭源模型未披露内部结构时，只能确认产品支持的输入/输出，不能因为能处理音视频就断言“所有模态都在同一模型里”。
:::

## VLM 三层架构（常见模块化范式）

本页重点是视觉与语言的理解和融合。生成或编辑图像、视频见 [生成式多模态](./generative-multimodal)；从视觉语言预测机器人动作，以及建模动作的环境后果，见 [世界模型与具身智能](./world-models-and-embodied-ai)。

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

**关键洞察**：图像通常被 ViT 切成 patches，视觉特征经连接器映射、压缩或重采样为视觉 Token，再与文本 Token 联合处理。具体 Token 数由输入分辨率、patch size、裁剪策略和压缩器决定，不固定为 576。对于 LLaVA 这类模型，语言骨干可基本沿用自回归接口；但加入特殊 Token、位置处理、跨注意力或早期融合时，不能笼统说“LLM 完全不用改”。

### 模块化 VLM vs 原生多模态

| 范式 | 训练/架构特征 | 优势 | 边界 |
|------|---------------|------|------|
| **后接式/模块化** | 预训练视觉编码器 + Connector + 语言模型，分阶段对齐 | 可复用成熟组件，训练成本较低 | 模态融合较晚，视觉细节受 Encoder/Connector 瓶颈影响 |
| **早期融合/联合预训练** | 视觉与文本 Token 较早进入共享骨干并联合训练，如 Llama 4 的公开方案 | 跨模态交互更早，可统一优化 | 训练昂贵，仍可能保留单独视觉编码器；“原生”不等于没有组件边界 |
| **产品级编排** | 主模型调用 OCR、ASR、图像/视频生成或搜索工具 | 能快速组合多种输入输出 | 产品是多模态，不证明单个权重模型端到端覆盖所有模态 |

**记忆法**：先问“模态在哪里融合”，再问“生成由同一模型还是工具完成”。

---

## 三大流派对比

### 流派 1：CLIP（Contrastive Learning）— 代表性图文双编码器

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
- ❌ 原始 CLIP **不能自回归生成文本**——它做图文表示与匹配，不直接做 caption / VQA

**准确说法**：CLIP 本身就是一种视觉—语言模型（双编码器），也经常被生成式 VLM 复用为视觉编码器；“VLM”不只指能聊天的多模态 LLM。

### 流派 2：SigLIP（Sigmoid Loss）— Google 2023 升级版

**问题**：CLIP 的全局 Softmax 对比损失依赖批内负样本并涉及跨设备归一化；大 Batch 往往有利，但不存在“32K 以下无效”的硬阈值。

**SigLIP 思路**：换成 **Sigmoid 损失**——每个图-文对独立判断是否匹配，不需要"组内归一化"。

| 维度 | CLIP | SigLIP |
|------|------|--------|
| **损失** | Softmax (InfoNCE) | **Sigmoid（pair-wise）** |
| **Batch/通信** | 借助批内负样本并做全局归一化 | 每个图文对独立二分类，更易扩展并减少全局归一化依赖 |
| **训练成本** | 与全局相似度矩阵和实现有关 | 原论文强调效率与规模扩展，不承诺固定 2~4 倍 |
| **效果** | 强基线 | 依数据、模型规模和下游任务而定 |
| **代表用户** | OpenAI、各类生成模型 | **LLaVA-NeXT、PaliGemma、Idefics2** |

::: tip 💡 SigLIP 2

> Google 在 **2025 年 2 月**发布 SigLIP 2（arXiv:2502.14786），扩展了多语言语义理解、定位和稠密特征，并提供多种分辨率/NaFlex 变体。它是重要选择之一，但视觉编码器还包括 CLIP/MetaCLIP、DINO 系列及领域模型，不存在跨任务统一“首选”。

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
| **MLP**（简单）| LLaVA 1.5 等 | 直接映射视觉特征；是否压缩和 Token 数由前后处理决定，并非固定 576 |
| **Q-Former**（Querying Transformer）| **BLIP-2** / InstructBLIP | 用 32 个 learnable query 通过 cross-attention **压缩**视觉信息；token 少但训练复杂 |
| **Resampler / Perceiver**（Token Merging）| Flamingo / Idefics | Perceiver IO 风格压缩 |

::: warning ⚠️ MLP vs Q-Former 没有统一胜负

> MLP 连接器因简单、易扩展而广泛使用；Q-Former/Resampler 在需要固定少量视觉 Token、冻结大组件或控制长视频成本时仍有价值。高分辨率文档偏向保留更多细节，端侧与视频偏向压缩，应该按**信息保真—Token 成本—训练复杂度**选择，而不是背“MLP 已胜出”。

:::

---

## 代表性 VLM 模型（型号会快速变化）

### 闭源旗舰

| 模型 | 厂商 | 关键特性 |
|------|------|---------|
| **GPT-5.x** | OpenAI | 图像理解、可调推理与 Computer Use；图像/视频生成可能由产品工具或专用模型完成 |
| **Claude Fable 5 / Opus 5 / Sonnet 5** | Anthropic | 文本与图像输入、文本输出，强调长程 Agent 与知识工作；不能写成覆盖音视频输出的单一全模态模型 |
| **Gemini 3.x** | Google | 文本、图像、视频、音频理解及 Agent 能力；生成媒体需区分 Gemini、Nano Banana、Veo 等具体型号 |

### 开放权重代表（生产前需验证许可证与部署条件）

| 模型 | 参数 | 特色 |
|------|------|------|
| **Qwen-VL 系列** | 阿里 | 多语言、文档、定位与视频等能力；参数和许可证按具体版本核对 |
| **InternVL 系列** | OpenGVLab/上海 AI Lab 等 | 覆盖多种规模与动态高分辨率方案 |
| **LLaVA-OneVision**（72B/7B）| 字节跳动 | 统一图/多图/视频架构 |
| **Pixtral 12B** | Mistral | 12B 性价比高、Apache 2.0 |
| **Llama 4 Scout/Maverick** | Meta | 开放权重、MoE、视觉文本早期融合；公开训练含图像与视频帧，输出仍以文本为主 |
| **DeepSeek-VL2** | DeepSeek | MoE 架构、推理成本低 |
| **MiniCPM-V 系列** | 面壁智能 | 面向端侧的多模态模型；与闭源模型的胜负取决于基准、版本和推理设置 |

### 端侧/手机

| 模型 | 用途 |
|------|------|
| **PaliGemma 2** | Google，端侧多模态 |
| **MiniCPM-V 系列** | 面壁；量化后可探索手机/边缘部署，需核对内存和芯片支持 |
| **Phi Vision 系列** | 微软；小型多模态模型，端侧可行性依量化、Runtime 与上下文 |

---

## 关键技术细节（深度追问点）

### 1. 高分辨率处理：AnyRes 模式（LLaVA-NeXT 突破）

**问题**：CLIP 默认 224×224 输入太低分辨率，读不清文字 / 图表。

**LLaVA-NeXT 方案**：选择适合宽高比的网格，把图像切成多个局部块并保留全局视图，再分别编码与拼接。实际分辨率和每块 Token 数取决于视觉编码器配置，并非所有实现固定 224×224 或 576 Token。

```text
以采用 336×336 视觉块的 LLaVA-NeXT 配置为例：

原图 1344×336（4:1 横长图）
  ↓
选择 4×1 网格 → 4 个 336×336 局部块
  + 1 个全局缩略视图
  ↓
分别经过视觉编码器，再按处理器规则拼接、去 padding
```

如果视觉编码器每个 336×336 块产生 24×24=576 个 Token，那么“4 个局部块 + 1 个全局视图”的直观上限约为 2880 个视觉 Token；实际数量还会受 unpadding、换行 Token、连接器和具体模型实现影响。因此面试时应记住**瓦片数决定 Token 成本近似线性增长**，不要死背一个固定总数。

切块提高了小字和局部细节可见性，但 Token 数随瓦片数增长，还可能切断跨块布局。动态分辨率、Token 压缩、原生高分辨率编码和文档布局训练都是后续关键方向。

### 2. 视频理解：抽帧 vs 时序模型

```
方案 A: 均匀抽帧 + 当作多图（LLaVA-Video）
  10s 视频 → 抽 8 帧 → 每帧 576 token → 4608 总 token
  简单但丢失时序

方案 B: 时序融合（Video-LLaVA）
  显式建模时间维度
  复杂但更准确

方案 C: 时空视觉 token / 联合视频训练（部分原生多模态模型）
  视觉编码器直接吃时空 patch（T×H×W）
  能建模时间信息但训练与推理成本高，也不保证在所有视频任务最优
```

### 3. 训练范式：常见两阶段起点

```
Stage 1: 预训练（Pretraining）
  数据: 大量图-文 caption 对
  训练: 仅训练投影层（LLM 和 ViT 都冻结）
  目的: 让投影层学会"图像空间 → LLM 词空间"

Stage 2: 指令微调（Instruction Tuning）
  数据: 高质量 VQA / 对话数据（如 LLaVA-Instruct）
  训练: 可训练 LLM + 投影层，也可能部分/全部解冻 ViT
  目的: 学会按指令理解和回答
```

这是 LLaVA 风格的教学简化，不是统一标准。更晚的模型会联合预训练视觉与语言、逐步解冻视觉塔、加入 OCR/grounding/视频数据，并在训练后阶段混合 SFT、偏好优化和多模态 RL。冻结策略取决于数据量、算力和是否需要改变视觉表征。

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

**评测边界**：多模态分数对图片分辨率、裁剪/压缩、视觉 Token 预算、Prompt、是否允许 OCR/代码工具非常敏感。公开题还可能进入训练数据。生产中至少分开测：

1. **感知**：OCR 字符/字段、物体、颜色、数量和空间定位是否读对
2. **推理**：在感知正确的前提下，图表计算、跨图比较和时序因果是否正确
3. **忠实性**：问题中不存在的物体/文字是否被“看见”（视觉幻觉）
4. **系统成本**：不同分辨率与帧数下的视觉 Token、TTFT、费用和超时率

反例：提高分辨率能看清小字，却也会增加瓦片和视觉 Token；均匀多抽视频帧能提高覆盖率，却可能挤掉文本上下文或降低服务吞吐。

---

## VLM 应用场景全景

| 场景 | 推荐模型 |
|------|---------|
| **通用对话** | GPT-5.x / Claude 5 系列 / Gemini 3.x；按模态输入输出和地区可用性选具体版本 |
| **文档 / 表格 / 发票** | Claude、Qwen-VL、InternVL 等候选；用自有扫描件、版式和字段准确率评估 |
| **中文场景** | Qwen-VL / InternVL 等候选；同时测繁简体、小字、专业术语与幻觉 |
| **视频理解** | Gemini、LLaVA-OneVision 等候选；关注帧采样、时序定位和长视频成本 |
| **手机端侧** | MiniCPM-V / Phi Vision 等小模型；按量化后内存、温升和端到端延迟选择 |
| **Code + 截图**（修 bug）| GPT-5.x / Claude 5 系列 / Gemini 3.x 等；同时评估 OCR、定位与工具执行 |
| **医学影像** | LLaVA-Med / Med-PaLM-M |
| **OCR / 文档抽取** | VLM 适合复杂语义与版式，传统 OCR + 规则在固定模板、低成本和可审计场景仍可能更稳 |

---

## 常见陷阱（必背踩坑点）

| 陷阱 | 后果 | 解决 |
|------|------|------|
| **图像 token 烧钱**（一张高清图 1000+ token）| API 成本爆炸 | ① 缩图至必要分辨率 ② 用 detail=low（OpenAI）③ 异步处理 |
| **不处理多图顺序** | 模型搞混"第一张/第二张" | 显式标注 `<image_1>` `<image_2>` |
| **混合视频和图片** | 模型理解错 | 用 `<video>` `<image>` 标签清晰区分 |
| **把 OCR 与视觉推理混为一谈** | 文字读对不代表图表关系、空间位置推对 | 分别评估字符错误率、字段抽取、图表问答和空间 grounding |
| **截图含敏感信息** | PII 泄露 | 调用前 PII 检测 + 内容过滤 |
| **视觉对抗攻击** | 图里藏注入指令 | [Prompt Injection 防御](./security-and-jailbreak#indirect-prompt-injection) |

---

## 黄金答题模板（必背）

> **面试官：解释 VLM（多模态大模型）的工作原理**
>
> **答**：常见模块化 VLM 可分三层：① **视觉编码器**把图像切成 patch 并提取特征；② **连接器**（MLP、Q-Former 或 Resampler）把视觉特征映射/压缩到语言模型可处理的表示；③ **语言模型**联合处理视觉与文本 Token 并生成回答。Patch 和视觉 Token 数由分辨率、patch size 与压缩策略决定，不固定为 576。
>
> **核心洞察**：关键是让视觉信息进入语言生成空间并进行跨模态对齐。MLP 简单易扩展，Q-Former/Resampler 更擅长控制视觉 Token 数；选择取决于保真度、延迟与上下文预算。原生多模态模型还可能采用早期融合和联合预训练，不能全部套进“冻结 ViT + MLP”模板。
>
> **训练范式**：LLaVA 风格常先冻结大组件训练连接器，再做视觉指令微调；更大模型可能联合预训练、逐步解冻视觉塔并加入多模态偏好优化/RL。
>
> **关键演进**：① 动态高分辨率与 AnyRes 提升小字/文档细节；② SigLIP 2、MetaCLIP 等视觉编码器改善多语言、定位和稠密特征；③ 图文早期融合与视频联合训练加强跨模态和时序理解。
>
> 选型实战：先固定真实图片/视频分布，再比较准确率、幻觉、视觉 Token 成本、延迟、隐私和许可证。通用榜单不能替代中文小字、票据版式、长视频时序或端侧内存等业务评估。

---

## 看到什么就先想到这类

- **"图 + 文一起喂模型"** → VLM 三层架构
- **"为什么 CLIP 不能生成文本"** → CLIP 只做对齐，不做生成
- **"MLP vs Q-Former 怎么选"** → 保真度 vs Token 压缩 vs 训练复杂度
- **"为什么高分辨率重要"** → AnyRes / OCR / 文档
- **"视频理解原理"** → 抽帧 → 时序融合 → 原生时空 token
- **"中文场景多模态"** → 中文 OCR/术语/图表自建集，不只看通用榜单
- **"端侧多模态"** → 模型大小 + 量化 + Runtime + 峰值内存/温升
- **"图像 token 烧钱"** → 缩图 + detail=low + 异步

---

## 延伸阅读

- [Learning Transferable Visual Models From Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020)
- [Sigmoid Loss for Language Image Pre-Training (SigLIP)](https://arxiv.org/abs/2303.15343)
- [SigLIP 2: Multilingual Vision-Language Encoders](https://arxiv.org/abs/2502.14786)
- [Visual Instruction Tuning (LLaVA)](https://arxiv.org/abs/2304.08485)
- [LLaVA-NeXT: Improved Reasoning, OCR, and World Knowledge](https://llava-vl.github.io/blog/2024-01-30-llava-next/)
- [Llama 4: Native Multimodality and Early Fusion](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
