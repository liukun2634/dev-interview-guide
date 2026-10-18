---
title: LLM 推理优化
---

# LLM 推理优化

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
LLM 推理优化是系统设计面试的高频考点。自回归解码的**逐 Token 生成**特性使推理成为 memory-bound 任务，KV Cache、量化、推测解码和持续批处理是四大核心优化技术。理解这些技术的原理和权衡，是设计高性能 LLM 服务的基础。
:::

## 为什么推理优化重要

LLM 推理分为两个阶段：

- **预填充（Prefill）**：一次性处理所有输入 Token，是 **compute-bound**（计算密集型）
- **解码（Decode）**：逐个生成输出 Token，每步读取模型权重并访问相关历史 KV 状态，低批量时通常是 **memory-bound**（访存密集型）

解码阶段常是长输出的主要瓶颈——每生成一个 Token 都需要一次前向传播。短输入或超长 Prompt 则可能由 Prefill/TTFT 主导；大批量、MoE 和多卡部署还可能转为计算或通信瓶颈。优化前应分别测 TTFT、TPOT、排队时间和吞吐，而不是默认只有一个瓶颈。

### 推理性能三角

| 指标 | 含义 | 优化方向 |
|------|------|----------|
| **延迟（Latency）** | 首 Token 时间（**TTFT** = Time To First Token）+ 每 Token 时间（**TPOT** = Time Per Output Token） | 模型压缩、推测解码 |
| **吞吐量（Throughput）** | 每秒生成的 Token 数（tokens/s） | 批处理、并行化 |
| **成本（Cost）** | 每百万 Token 的计算费用 | 量化、缓存、模型选择 |

三者往往存在权衡：高吞吐可能增加单请求延迟，低精度量化降低成本但可能影响质量。

---

## KV Cache（Key/Value Cache）

### 原理

在自回归生成中，每生成一个新 Token，模型需要对整个序列（包括所有历史 Token）计算注意力。如果每步都重新计算所有 Token 的 Key 和 Value，会产生大量冗余计算。

**KV Cache 的核心思想**：缓存已计算的 Key 和 Value 矩阵，新 Token 生成时只需计算当前 Token 的 Q/K/V，然后与缓存的 K/V 拼接即可。

```mermaid
graph LR
    subgraph Without["无 KV Cache (每步重新计算)"]
        direction TB
        W1["Step 1: 计算 K₁V₁ → Token₁"]
        W2["Step 2: 计算 K₁V₁K₂V₂ → Token₂ ← 重复"]
        W3["Step 3: 计算 K₁V₁K₂V₂K₃V₃ → Token₃ ← 更多重复"]
    end
    subgraph With["有 KV Cache"]
        direction TB
        C1["Step 1: 计算 K₁V₁ → 缓存 → Token₁"]
        C2["Step 2: 仅计算 K₂V₂ → 追加缓存 → Token₂ ✓"]
        C3["Step 3: 仅计算 K₃V₃ → 追加缓存 → Token₃ ✓"]
    end
```

### KV Cache 显存开销

KV Cache 的大小随序列长度线性增长。对采用 GQA/MQA 的模型，应使用 **K/V 头数**而非 Q 头数：

$$
  ext{KV Cache Size} = 2 \times n_{\text{layers}} \times n_{\text{kv-heads}} \times d_{\text{head}} \times \text{seq\_len} \times \text{batch\_size} \times \text{bytes}
$$

例如 Llama 2 70B 使用 8 个 K/V 头（而不是 64 个 Q 头），80 层、head dim=128、FP16，在序列长度 4096、batch=32 时 KV Cache 约为 **40 GiB**；若错误代入 64 个 Q 头会高估 8 倍，得到约 320 GiB。若 batch=4，则约为 5 GiB。这也说明架构配置和批大小比“70B”标签更能决定 KV Cache 占用。

### KV Cache 优化技术

#### Multi-Query Attention (MQA) 与 Grouped-Query Attention (GQA)

标准多头注意力中，每个头有独立的 K/V。MQA 和 GQA 通过共享 K/V 头来减少 KV Cache 大小：

| 方案 | K/V 头数 | Cache 大小 | 质量 | 代表模型 |
|------|---------|-----------|------|----------|
| **MHA** | = Q 头数 | 100% | 最好 | GPT-3 |
| **GQA** | Q 头数 / g（分组） | 100/g % | 接近 MHA | LLaMA 2 70B, Qwen |
| **MQA** | 1 | 极小 | 略有下降 | PaLM, Falcon |

#### PagedAttention（vLLM 核心）

传统实现为每个请求预分配连续显存块存放 KV Cache，但实际序列长度不可预知，导致严重的**显存碎片化**。

PagedAttention 借鉴操作系统的虚拟内存分页思想：
- 将 KV Cache 分成固定大小的**页（Block）**
- 使用**页表**映射逻辑位置到物理显存
- 按需分配，避免预分配浪费
- 支持跨请求共享页（如共享 System Prompt 的 KV Cache）

PagedAttention 论文报告接近零的 KV Cache 浪费，并在其硬件、模型和负载下以相近延迟实现 2~4× 吞吐提升。它解决的是分页分配与共享，不保证任意生产负载都有固定的“>95% 利用率”。

#### KV Cache 压缩

| 技术 | 原理 | 场景 |
|------|------|------|
| **H2O（Heavy-Hitter Oracle）** | 保留注意力分数高的"重要"Token 的 KV，淘汰低分 Token | 超长序列 |
| **StreamingLLM** | 保留开头 Token + 滑动窗口内 Token 的 KV | 流式/无限长度生成 |
| **KV Cache 量化** | 将 KV Cache 从 FP16 压缩到 INT8/INT4 | 显存受限场景 |

---

## 量化 Quantization

量化是将模型权重和/或激活值从高精度（FP32/FP16）转换为低精度（INT8/INT4）表示，以减少显存占用和加速计算。

### 量化基础

| 精度 | 位宽 | 压缩比 | 说明 |
|------|------|--------|------|
| FP16 | 16 bit | 基准 | 标准训练精度 |
| INT8 | 8 bit | 2x 压缩 | 精度损失小 |
| INT4 | 4 bit | 4x 压缩 | 需要特殊处理 |

核心权衡：**精度 vs 速度 vs 显存**。INT4 量化可将 70B 模型从 140GB 压缩到 ~35GB，使其可在单卡（A100 80GB）上运行。

### 主流量化方案

| 方案 | 类型 | 原理 | 优势 | 局限 |
|------|------|------|------|------|
| **GPTQ** | 训练后量化 | 基于二阶信息（Hessian）逐层量化，需校准数据集 | 精度损失小，推理快 | 量化过程需数小时 |
| **AWQ** | 训练后量化 | 识别"重要"权重通道（基于激活分布），对其保持高精度 | 比 GPTQ 更快量化，质量相当 | 需要校准数据 |
| **GGUF** | 训练后量化 | llama.cpp 格式，支持 CPU+GPU 混合推理，多种量化级别（Q4_K_M 等） | 灵活部署，CPU 可运行 | CPU 推理速度有限 |
| **SmoothQuant** | 训练后量化 | 将激活的量化难度"转移"到权重上 | 同时量化权重和激活 | 实现复杂 |
| **QLoRA** | 训练时量化 | 4-bit 量化模型 + LoRA 微调 | 极低显存微调 | 仅用于微调场景 |

### 量化实践建议

- **INT8/FP8 量化**：常是稳健起点，但是否加速取决于硬件 Kernel；Reasoning、代码、长上下文等任务仍需回归
- **INT4 量化**：适合显存受限或带宽受限场景；小模型、异常值多的层和量化 KV Cache 更敏感
- **本地部署**：使用 GGUF 格式 + llama.cpp / Ollama
- **微调**：使用 QLoRA（4-bit 量化 + LoRA）

---

## 推测解码 Speculative Decoding

推测解码通过**用小模型加速大模型推理**，在不改变输出分布的前提下提升生成速度。

### 原理

```mermaid
graph TD
    subgraph Traditional["传统解码 (每步 1 Token)"]
        direction LR
        A1["大模型"] -->|100ms| A2["T₁"]
        A2 --> A3["大模型"]
        A3 -->|100ms| A4["T₂"]
        A4 --> A5["大模型"]
        A5 -->|100ms| A6["T₃"]
    end
    
    subgraph Speculative["推测解码"]
        direction TB
        B1["小模型快速生成 γ 个候选<br/>t₁ t₂ t₃ t₄ t₅ (~10ms)"] --> B2["大模型一次性验证<br/>✓ ✓ ✓ ✗ (~100ms)"]
        B2 --> B3["接受前 3 个<br/>从拒绝位置重新开始"]
    end
```

**关键保证与边界**：标准的采样式推测解码使用校正后的拒绝采样时，目标输出分布与大模型直接采样相同（忽略浮点实现差异）。Medusa、EAGLE、贪心验证或工程化变体是否保持完全相同分布，要看其验证算法，不能把保证自动推广给所有“投机”方案。

### 加速效果

加速比取决于小模型与大模型的**一致率 α**（小模型生成被大模型接受的概率）：

$$
\text{Speedup} \approx \frac{\gamma \cdot \alpha}{1 + \gamma \cdot c}
$$

其中 $c$ 是小模型与大模型的速度比。典型场景下可实现 **2~3x 加速**。

### 变体

| 变体 | 特点 | 适用场景 |
|------|------|----------|
| **标准推测解码** | 独立小模型作为 Draft Model | 通用场景 |
| **Self-Speculative** | 跳过大模型部分层作为 Draft | 无需额外小模型 |
| **Medusa** | 在大模型头部添加多个预测头，同时预测多个未来位置 | 高一致率场景 |
| **EAGLE** | 学习特征级别的 Draft，而非 Token 级别 | 更高加速比 |

---

## 持续批处理 Continuous Batching

### 静态批处理的问题

传统静态批处理等待一批请求凑齐后一起处理，所有请求必须等最长的请求完成：

**静态批处理**：所有请求必须等最长请求完成才能释放，导致 GPU 大量空闲。

**持续批处理**：请求完成后立即释放资源，新请求可在任意解码步加入当前批次。

### 持续批处理（Iteration-Level Scheduling）

核心思想：在**每个解码步（iteration）**粒度进行调度——

- 请求完成后**立即释放**资源
- 新请求可在**任意解码步**加入当前批次
- 避免短请求等待最长请求，通常显著提高利用率和吞吐；具体收益取决于到达率、长度分布、调度策略和显存预算

这是 vLLM、TGI 等推理框架的核心调度策略。

---

## MoE 推理优化

MoE（Mixture of Experts）已被 DeepSeek-V3、Mixtral、Llama 4 等代表模型采用。GPT-4o 的底层是否为 MoE 未由 OpenAI 公开，不能列作确定案例。MoE 在推理侧带来了**与 Dense 模型不同的瓶颈**：

### Dense vs MoE 推理特性

| 维度 | Dense（稠密） | MoE | 工程含义 |
|------|------------|-----|---------|
| **参数总量** | 全部激活 | 部分激活（如 DeepSeek-V3 671B 中只激活 37B） | MoE 算力需求小，**显存需求大** |
| **显存占用** | 主要由全部权重决定 | 通常要容纳或分片**总参数**；也可 offload/按需加载，代价是带宽与延迟 | 激活参数不能代表显存需求 |
| **计算量 FLOPs** | 与激活参数成正比 | 与激活参数成正比 | MoE 推理速度可媲美小 Dense 模型 |
| **带宽瓶颈** | 加载全部权重 | 每 Token 仅加载被路由到的专家权重 | MoE 受**显存带宽**限制更显著 |
| **批处理友好度** | 高 | 低（不同 Token 路由到不同专家，难凑批） | MoE 需要专门的批调度 |

### 三大核心挑战

**① 专家负载不均（Expert Load Imbalance）**

理想情况下 N 个专家应均匀分担流量，但实际推理时少数"热门专家"会被反复路由，导致：
- 热门专家所在 GPU 排队，冷门 GPU 闲置
- 整体延迟由最热 GPU 决定（木桶效应）

**应对**：
- 训练时：辅助损失（auxiliary loss）惩罚不均衡，DeepSeek-V3 采用**无辅助损失**的偏置项动态调整
- 推理时：副本部署热门专家（Expert Replication）、动态再分配

**② 跨 GPU 通信开销（Expert Parallelism）**

大型 MoE 必须把专家切分到多卡，每个 Token 在路由后要 **All-to-All 通信**送到对应专家的 GPU：

```
Token Routing (Decode 阶段):
  GPU 0 上的 Token → 被路由到 → GPU 5 上的 Expert 42
  GPU 3 上的 Token → 被路由到 → GPU 0 上的 Expert 7
  ...
  → 每步 Decode 都触发 All-to-All，是 MoE 推理的主要延迟来源
```

**应对**：
- **Expert Parallelism + Tensor Parallelism 混合切分**（DeepSpeed-MoE、SGLang）
- 在节点内用 NVLink 减少跨节点流量
- **MoE-aware Prefill/Decode 分离**：Prefill 阶段 Token 多易凑批，Decode 阶段单独优化

**③ KV Cache 仍然是全量的**

容易踩坑：MoE 只稀疏化了 FFN 层，**Attention 层和 KV Cache 不变**——所以 KV Cache 显存压力跟同等隐藏维度的 Dense 模型一样大。

### MoE 工程化关键技术

| 技术 | 解决问题 | 代表实现 |
|------|---------|---------|
| **Expert Parallelism (EP)** | 单卡装不下所有专家 | DeepSpeed-MoE、Megatron-LM |
| **Expert Caching** | 冷门专家按需 swap 进显存 | Mixtral 本地部署、llama.cpp MoE |
| **通信—计算重叠** | 隐藏 All-to-All 等待 | DeepSeek-V3、主流分布式推理框架 |
| **Grouped Expert Layout / Replication** | 把相关或热门专家合理放置/复制 | 依负载与框架实现 |
| **MoE 量化** | 量化专家权重以减小容量与带宽 | 需硬件 Kernel 与逐任务质量评估 |

::: tip 💡 面试加分点

**记忆法**：MoE 推理“**计算看激活参数，存储看总参数，扩展看通信与负载均衡**”。DeepSeek-V3 还公开了 FP8 混合精度训练、无辅助损失负载均衡和多 Token 预测；不要把训练特性直接等同为所有部署框架的推理优化。

:::

---

## 长上下文推理优化

随着 128K-1M Token 上下文成为主流，长上下文推理出现了**与短文本完全不同**的瓶颈——Prefill 阶段的注意力计算和 KV Cache 显存。本节聚焦推理侧的优化技术（与长度外推训练侧的 RoPE/YaRN 区分，详见 [LLM 基础 — 长度外推](./llm-fundamentals#长度外推技术)）。

### 长上下文的两个瓶颈

| 阶段 | 主要瓶颈 | 数量级 |
|------|---------|--------|
| **Prefill（处理输入）** | 全注意力 $O(n^2)$ 算术与显存 IO | 实际增长受 FlashAttention、分块和并行影响，不能用固定倍数估算 |
| **Decode（生成输出）** | KV Cache 与权重读写带宽 | 大小取决于层数、K/V 头数、精度和并发，不能只看 Token 数 |

### 核心优化技术

**① FlashAttention（必备基础）**

把注意力计算重新组织为**分块流式**，所有中间矩阵不再实例化到 HBM，只在 SRAM 中运算：
- 计算复杂度依然 $O(n^2)$，但**显存复杂度从 $O(n^2)$ 降到 $O(n)$**
- 长上下文场景 prefill 提速 2-4×
- 已是 PyTorch、vLLM、SGLang、TensorRT-LLM 的默认实现
- 演进：FlashAttention-2（更好的并行）、FlashAttention-3（FP8 + Hopper 架构）

**② Ring Attention（超长上下文必备）**

当单卡装不下完整 KV Cache（如 1M Token）时，把 KV Cache **环形切分到多卡**，Q 在卡之间"绕环"逐段计算：

```
GPU 0: Q + KV[0:250K]
GPU 1:     KV[250K:500K]   ← Q 旋转到 GPU 1 计算这段
GPU 2:     KV[500K:750K]   ← Q 继续旋转
GPU 3:     KV[750K:1M]
```

- 让上下文长度**线性扩展**（卡数翻倍 → 上下文翻倍）
- 代表实现/相关方向包括 Ring Attention 与 Megatron-LM Context Parallelism；闭源模型未披露时，不能断言 Gemini 或 Claude 的内部实现就是 Ring Attention

**③ Chunked Prefill**

把超长输入的 prefill **切成多个小块**，与其他请求的 decode 步**交替执行**：
- 解决"长 prefill 阻塞所有 decode 请求"的尾延迟问题
- vLLM、SGLang、TensorRT-LLM 已原生支持

**④ Prefix Cache / KV Cache 复用**

多个请求共享相同前缀（System Prompt、Few-shot、长文档）时，**KV Cache 只算一次跨请求复用**：
- vLLM 的 Automatic Prefix Caching、SGLang 的 RadixAttention 是代表
- 托管 API 的 [Prompt Caching](./ai-agents#prompt-caching) 可能在服务端复用前缀计算，但厂商未披露时不能断言底层一定保存可跨请求共享的 KV 页；应用层响应缓存、Prompt Cache 与自托管 Prefix KV Cache 也不是同一层

**为什么有收益**：它主要省掉命中前缀的 Prefill 计算，通常不减少后续 Decode 的 TPOT。缓存键至少要区分模型/适配器版本、精确 Token 序列和影响 KV 的配置；动态时间戳、用户信息插在前缀中会破坏命中。多租户服务还要做访问隔离、淘汰和容量控制，避免跨租户复用或侧信道泄露。

**⑤ KV Cache 压缩 / 驱逐**

超长对话中老 Token 价值递减，可主动丢弃或压缩：
- **StreamingLLM**：保留 attention sink token（前几个）+ 滑动窗口
- **H2O / SnapKV**：基于注意力分数动态淘汰
- 适合无限长流式对话（如长期 Agent 会话）

---

## 推理引擎选型对比

引擎版本、模型支持和 Kernel 演进很快，不能长期固定为“吞吐第一/延迟第一”。可靠选型应在同一模型、硬件、精度、上下文分布、并发和 SLA 下复测。

### 主流引擎核心差异

| 引擎 | 核心技术 | 强项 | 弱项 | 适用场景 |
|------|---------|------|------|---------|
| **vLLM** | **分页式 KV 管理** + Continuous Batching | 模型/平台生态广、OpenAI 兼容服务成熟 | 新模型/新量化组合仍需核对支持矩阵 | 通用 GPU API 服务、高吞吐场景 |
| **SGLang** | **RadixAttention**（前缀树共享 KV）+ 高性能 Runtime | 前缀复用、结构化输出与 Agent/RAG 工作负载 | 收益依赖请求重复率和具体版本 | Agent / RAG / 多轮对话 / 结构化输出 |
| **TensorRT-LLM** | **NVIDIA 官方 + Kernel 融合 + FP8/INT4** | 深度利用 NVIDIA GPU 特性、可与 Triton 集成 | 仅 NVIDIA，构建和调优复杂 | NVIDIA 生产集群、延迟/吞吐精调 |
| **llama.cpp** | **GGUF 量化 + CPU/GPU 混合 + Metal/Vulkan/CUDA** | 跨平台、本地与边缘生态成熟 | 大规模多租户吞吐通常不是其首要目标 | 桌面、Mac、本地与边缘设备 |
| **TGI**（HF Text Generation Inference）| HuggingFace 官方 + 速度优化 | 与 HuggingFace 生态无缝、易上手 | 性能逐渐落后 vLLM/SGLang | HF 用户快速原型 |
| **Ollama** | llama.cpp 封装 + 极简体验 | **零配置**本地体验 | 服务化弱、性能受限 llama.cpp | 个人 / 小团队本地实验 |

<small>注：对比快照为 2026-08；模型支持与性能随版本变化，选型前需复测。</small>

### PagedAttention vs RadixAttention 本质对比

**PagedAttention（vLLM）—— 解决显存碎片**

```
传统 KV Cache: 给每个请求预留 max_seq_len 显存 → 极大浪费

vLLM 思路: 像操作系统分页 → KV Cache 按 16 token 一块切分
  ├── 物理块池（连续 GPU 显存）
  └── 逻辑表（每请求一张 KV 块表）

效果: 减少内部/外部碎片和预留浪费；论文在特定负载中报告 2-4× 吞吐提升，实际值需压测
```

**RadixAttention（SGLang）—— 解决前缀重复**

```
场景: 10 个用户问相同 System Prompt 的不同问题
  System Prompt: 2000 token（重复 10 次）
  用户问题: 200 token（10 个不同）

传统: 10 × 2200 = 22000 个 KV Cache 槽
SGLang: 2000（共享）+ 10 × 200 = 4000 个槽 → 节省 80%

实现: 用基数树（Radix Tree）按 token 前缀组织 KV Cache
       命中前缀的请求直接复用，不重算 prefill
```

::: tip 💡 真实业务选型矩阵

| 业务类型 | 推荐 | 原因 |
|---------|------|------|
| **OpenAI 风格 API 服务**（高吞吐） | **vLLM** | 默认最稳 |
| **企业知识库 RAG**（长 System Prompt + 多用户） | **SGLang** | RadixAttention 前缀复用收益巨大 |
| **Agent / 多轮对话** | **SGLang** | 上下文重复率高 |
| **C 端聊天前端**（极致首 token 延迟） | **TensorRT-LLM / vLLM / SGLang 实测** | TTFT 还受排队、Prefill、网络和模型影响 |
| **Apple Silicon Mac 本地** | **llama.cpp / Ollama 等** | Metal 与 GGUF 生态成熟，但不是唯一可运行方案 |
| **生产 NVIDIA Triton 集群** | **TensorRT-LLM** | 官方深度集成 |
| **快速试新模型** | **vLLM** 或 **TGI** | 上线时间最快 |

:::

### 量化方案速查

| 方案 | 精度 | 显存节省 | 性能损失 | 主流支持 |
|------|------|---------|---------|---------|
| **FP16 / BF16**（基线）| 16-bit | 1× | 0% | 全部 |
| **FP8** | 8-bit | 理论权重约 2× | 通常较小，需按任务验证 | 新一代 NVIDIA/AMD 等硬件及主流引擎逐步支持 |
| **INT8（W8A8）** | 8-bit | 理论约 2× | 依模型、校准和 Kernel | TensorRT-LLM / vLLM 等 |
| **AWQ INT4** | 4-bit 权重 | 理论约 4× | 依模型与任务 | vLLM / TensorRT-LLM 等 |
| **GPTQ INT4** | 4-bit 权重 | 理论约 4× | 依模型与任务 | vLLM / TGI 等 |
| **GGUF K-Quant** | 混合位宽 | 依量化类型 | 位宽越低通常风险越高 | llama.cpp 生态为主，其他 Runtime 也可能支持 |

::: warning ⚠️ KV Cache 量化的隐藏陷阱

> **权重量化与 KV Cache 量化要分开评估**。KV 量化误差会沿长上下文和多步解码累积，部分模型还需要校准 scale；不能用固定的 32K 阈值或笼统断言“Reasoning 模型必须关闭”。应在目标长度、任务、并发和硬件 Kernel 上同时回归质量、TTFT、TPOT 与显存。

:::

### 投机解码进阶：EAGLE / Medusa

**核心思想**：让小模型/小头先猜几个 token，大模型一次验证多个，**单步生成 2-3 个 token**。

| 方案 | 实现 | 加速比 | 接受率 |
|------|------|--------|--------|
| **传统 Speculative Decoding** | 小草稿模型提出候选，目标模型并行验证 | 与草稿成本、接受长度和批量有关 | 同域、低批量时常更有利 |
| **Medusa** | 在目标模型上加多个预测头形成候选树 | 需要额外头与树验证 | 无独立 Draft Model |
| **EAGLE 系列** | 在特征空间预测候选并由目标模型验证 | 论文报告较高接受长度，但随模型/任务变化 | 需要匹配的 Draft Head/Checkpoint |
| **Lookahead Decoding** | 通过 Jacobi 风格迭代并行提出候选 | 无固定通用倍数 | 对输出模式敏感 |

各引擎对模型、量化、张量并行和投机方法的组合支持会随版本变化。生产选择应比较**平均接受 Token 数、Draft 开销、目标验证开销、批量下的吞吐和尾延迟**；高并发时目标模型本已吃满，投机解码甚至可能降低总吞吐。

### 黄金答题模板

> **面试官：你的推理服务怎么选型？**
>
> **答**：按 4 个维度决策：
> ① **先固定工作负载**：模型、精度、输入/输出长度分布、并发与 P99 SLA；
> ② **看瓶颈**：高前缀重复率重点测 Prefix Cache，高并发测 Continuous Batching，超长输入测 Chunked Prefill；
> ③ **看硬件与支持矩阵**：TensorRT-LLM 面向 NVIDIA，跨平台本地部署可测 llama.cpp；vLLM/SGLang 的优劣按具体版本实测；
> ④ **量化和投机都做回归**：比较质量、TTFT、TPOT、吞吐、显存和成本，不预设 FP8/AWQ/EAGLE 必胜。


### 技术选型对照

| 场景 | 推荐组合 |
|------|---------|
| **128K 以内、单卡部署** | FlashAttention-2/3 + PagedAttention + Prefix Cache |
| **1M+ 上下文、多卡部署** | + Ring Attention / Context Parallelism |
| **高并发长 prefill** | + Chunked Prefill |
| **无限长流式 Agent** | + StreamingLLM 风格的 KV 驱逐 |

---

## 推理框架对比

| 框架 | 开发者 | 核心特性 | 适用场景 | 典型性能 |
|------|--------|----------|----------|----------|
| **vLLM** | UC Berkeley / 开源社区 | 分页式 KV 管理、连续批处理、广泛模型支持 | 高并发线上服务 | 需按版本与负载压测 |
| **TGI** | Hugging Face | 易部署、支持多种模型、生产就绪 | HF 生态快速部署 | 中等 |
| **TensorRT-LLM** | NVIDIA | 深度 GPU 优化、FP8/INT4、Inflight Batching | NVIDIA GPU 生产优化 | 可深度调优 |
| **SGLang** | 开源社区 | 结构化生成、RadixAttention、高性能 Runtime | Agent/RAG 与结构化输出 | 前缀复用场景有优势 |
| **Ollama** | Ollama | 一键本地部署、GGUF 格式、极简 API | 本地开发/测试 | 适合个人使用 |
| **llama.cpp** | 开源社区 | CPU/GPU 混合推理、跨平台、量化支持 | 边缘设备/CPU/桌面部署 | 跨平台生态成熟 |

**选型建议**：
- 线上服务高并发 → vLLM
- NVIDIA GPU 追求极致延迟 → TensorRT-LLM
- 需要结构化输出 → SGLang
- 本地快速实验 → Ollama
- 边缘/嵌入式设备 → llama.cpp

---

## 常见陷阱

::: warning ⚠️ 常见误区

1. **认为量化一定显著降质，或一定无损**：损失取决于模型规模、异常值、校准集、量化粒度、KV/激活是否量化和目标任务。应在应用评估集上比较，而非只看困惑度或位宽。

2. **忽视 KV Cache 的显存占用**：对于长上下文场景，KV Cache 的显存消耗可能超过模型权重本身。必须在系统设计中预留 KV Cache 的显存预算。

3. **混淆延迟和吞吐量**：高吞吐框架（如 vLLM）通过增大批次提升吞吐，但单请求延迟可能增加。面向实时交互的场景应优先优化延迟。

4. **推测解码的适用条件**：当小模型与大模型的一致率低（如领域差异大）时，推测解码可能不如直接推理。需根据具体任务评估一致率。

:::

---

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 请解释 KV Cache 的原理及主要优化方法</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. GPTQ 和 AWQ 量化方案有何区别？如何选择？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 设计一个高吞吐 LLM 推理服务，你会如何选型和优化？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
</div>

## 面试真题详解

### Q1：请解释 KV Cache 的原理及主要优化方法

**要点**：

KV Cache 利用自回归生成的特性——每步生成新 Token 时，历史 Token 的 Key 和 Value 不会改变——将已计算的 K/V 缓存起来，避免重复计算。

**显存挑战**：KV Cache 大小与 `层数 × 头数 × 维度 × 序列长度 × 批大小` 成正比，长序列场景下可能超过模型权重本身的显存占用。

**三大优化方向**：

1. **减少 KV 头数**：GQA（分组共享 K/V 头）在质量几乎不降的前提下将 Cache 缩小到 1/g
2. **优化显存管理**：PagedAttention（vLLM）采用虚拟内存分页思想，按需分配并减少碎片；论文在特定设置下实现近零 KV 浪费和 2~4× 吞吐提升
3. **压缩/淘汰**：H2O 保留高注意力分数的"重要" Token KV，StreamingLLM 保留开头+滑动窗口

---

### Q2：GPTQ 和 AWQ 量化方案有何区别？如何选择？

**要点**：

| 维度 | GPTQ | AWQ |
|------|------|-----|
| **原理** | 基于二阶信息（Hessian 矩阵）逐层量化，最小化量化误差 | 基于激活分布识别"重要"权重通道，对其保持高精度 |
| **校准数据** | 需要，用于计算 Hessian | 需要，用于分析激活分布 |
| **量化速度** | 较慢（数小时） | 较快 |
| **推理质量** | 优秀 | 与 GPTQ 相当或略优 |
| **生态支持** | AutoGPTQ、vLLM、TGI | AutoAWQ、vLLM、TGI |

**选择建议**：
- 两者质量没有跨模型的固定胜负；按模型支持、目标硬件 Kernel、校准成本和领域评估选择
- 如已有 GPTQ 格式模型（HuggingFace 上大量社区量化版本），直接使用即可
- 本地/CPU 部署优先选择 GGUF 格式

---

### Q3：设计一个高吞吐 LLM 推理服务，你会如何选型和优化？

**要点**：

**架构设计**：

1. **推理引擎选择**：vLLM（PagedAttention + 连续批处理），已验证的高吞吐方案
2. **模型优化**：
   - 使用 GQA 模型（如 LLaMA 2 70B）减少 KV Cache
  - 在质量回归通过且硬件 Kernel 有效时，用 FP8/INT8/INT4 降低显存与带宽压力
3. **系统层优化**：
   - 连续批处理：在每个解码步粒度调度请求
   - Prefix Caching：缓存共享 System Prompt 的 KV Cache
   - 推测解码：对延迟敏感场景使用小模型加速
4. **基础设施**：
   - 多实例负载均衡，按显存利用率路由
   - 请求队列 + 优先级调度
   - 流式返回（SSE）降低用户感知延迟
5. **监控指标**：
   - TTFT（首 Token 时间）、TPOT（每 Token 时间）
   - 吞吐量（tokens/s）、GPU 利用率
   - P99 延迟、请求排队时间

**权衡讨论**：批次越大吞吐越高，但单请求延迟会增加。应根据 SLA 设置最大批次大小和排队超时。

---

## 延伸阅读

- [Efficient Memory Management for Large Language Model Serving with PagedAttention (vLLM)](https://arxiv.org/abs/2309.06180)
- [GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers](https://arxiv.org/abs/2210.17323)
- [AWQ: Activation-aware Weight Quantization](https://arxiv.org/abs/2306.00978)
- [Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192)
- [Efficient Streaming Language Models with Attention Sinks (StreamingLLM)](https://arxiv.org/abs/2309.17453)
- [FlashAttention-2: Faster Attention with Better Parallelism](https://arxiv.org/abs/2307.08691)
- [SGLang: Efficient Execution of Structured Language Model Programs](https://arxiv.org/abs/2312.07104)
- [EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077)
