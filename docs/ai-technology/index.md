---
title: AI 技术
---

# AI 技术

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hot">🔥 核心章节</span>

::: tip 💡 核心要点
AI 应用工程可以沿着 **LLM 基础 → 最小应用 → Agent 与 Harness → 按任务接入检索、记忆和交互 → 部署与评估** 学习。检索不是每个 Agent 的必选模块，Harness 也不替代 RAG。模型训练与推理基础设施按岗位深入，理解每一层解决什么问题，比按热词凑齐组件更重要。
:::

---

## 全局视角：AI 应用的完整技术栈

理解 AI 技术的最好方式是跟踪**一个用户提问从输入到回答**的完整过程：

```
用户输入（自然语言）
  ↓
Prompt 工程（System Prompt + 上下文组装）
  ↓ 是否需要外部知识？
  ├── 是 → 选择权威数据源与访问方式
  │     ├── 文件 / 结构化查询 / 全文或向量检索
  │     ├── 身份与权限过滤 → 证据选择
  │     └── 按需读取原文 → 上下文组装
  ├── 是否需要执行动作？
  │     └── Agent Harness → 规划 → 行动/工具调用 → 观察 → 验证/恢复
  │           └── 按需加载 Skill、连接 MCP、持久化检查点
  └── 否 → 直接调用 LLM
  ↓
LLM 推理（以因果 Transformer 自回归生成作示例）
  ├── KV Cache 加速
  ├── 量化 / 推测解码优化
  ├── Structured Outputs / 业务校验
  └── 安全护栏（Guardrails）
  ↓
流式输出 → 前端渲染 → 用户看到回答
```

多模型、多租户或规模化部署可以引入 **AI Gateway + Model Router**，统一处理协议适配、配额和成本；简单应用不必先搭完整网关。Trace 用于定位过程，Evals 验证任务结果；长任务还需要持久状态、取消和恢复，不能仅依赖一条长连接。

## AI 知识体系全景

```
┌─────────────────────────────────────────────────────┐
│                   AI 面试与实战                       │
│  (面试准备策略 / 全栈 AI 实战 / AI 系统设计)           │
├─────────────────────────────────────────────────────┤
│                AI 工程实践                            │
│  (模型训练 / 推理优化 / 评估对齐 / 应用架构)            │
├─────────────────────────────────────────────────────┤
│          AI Agent              │   RAG 系统           │
│  (Harness / Skills / Tool Use /│  (检索 / 向量数据库 / │
│   MCP / A2A / 长任务)           │   Rerank / 评估)      │
├─────────────────────────────────────────────────────┤
│               LLM 应用技术                            │
│  (Prompt Engineering / Embedding / 向量数据库)         │
├─────────────────────────────────────────────────────┤
│                   LLM 基础                            │
│  (Transformer / 自注意力 / Tokenization / 解码策略)     │
├─────────────────────────────────────────────────────┤
│                   AI 概述                             │
│  (发展历程 / 弱AI-AGI / ML分类 / Scaling Laws)         │
└─────────────────────────────────────────────────────┘
```

**从下往上理解**：
1. **AI 概述**是背景知识——理解 AI 发展脉络和当前所处阶段
2. **LLM 基础**是核心——Transformer 架构、注意力机制、解码策略
3. **应用技术**是工具箱——Prompt Engineering 调优输出，Embedding 连接语义空间，向量数据库存储知识
4. **RAG & Agent**是高级应用——RAG 让 LLM 连接外部知识，Agent 让 LLM 具备行动能力
5. **工程实践**是生产化——训练、推理优化、架构设计、评估对齐
6. **面试实战**是综合运用——系统设计题、项目表达、能力展示

---

## 核心概念速查

| 概念 | 一句话解释 | 为什么重要 |
|------|-----------|-----------|
| [Transformer](./llm-fundamentals#transformer-架构) | 基于注意力的序列架构，训练可并行处理多个位置 | LLM 的主流骨干，但不是唯一架构，自回归生成仍有序列依赖 |
| Self-Attention | 按内容聚合允许访问的位置；因果解码器不能访问未来 Token | 理解掩码、历史访问与计算成本 |
| KV Cache | 缓存已计算的 Key/Value，避免重复计算 | 推理加速的第一手段 |
| Embedding | 将文本映射到高维向量空间，语义相近的文本距离接近 | RAG 和语义搜索的基础 |
| [RAG](./rag) | 检索外部证据并用于生成，仍可能漏召回或误用证据 | 适用于需要可更新、可核验资料的任务，不保证消除幻觉 |
| [Agent](./ai-agents) | 根据环境反馈选择动作的决策循环，长期记忆与多 Agent 是可选能力 | 判断何时需要动态决策，何时使用固定工作流 |
| [Agent Skills](./ai-agent-skills) | 以 SKILL.md 为入口、按需加载的过程知识与资源包 | 复用任务方法，不自动授予权限 |
| [MCP](./mcp) | AI 应用连接外部工具、资源和 Prompt 的协议 | 降低跨应用集成成本 |
| [A2A](./a2a) | 独立 Agent 系统发现能力、委派任务和交换产物的协议 | 支持跨系统协作，不要求暴露内部实现 |
| RLHF | 用人类反馈训练奖励模型，再优化 LLM 的输出偏好 | 让 LLM 从"能说话"到"说人话" |
| LoRA | 冻结原始权重，只训练低秩增量矩阵 | 参数高效微调的主流基线之一 |
| 量化 | 降低权重或激活的数值精度，减少存储需求 | 速度与质量仍取决于模型、算子、硬件和负载 |
| Function Calling | LLM 输出结构化的函数调用指令，由系统执行 | Agent 调用工具的核心机制 |
| [上下文工程与记忆](./context-and-memory) | 选择本轮信息，并受控地保留跨任务知识 | 管理预算、来源、冲突、时效与删除 |
| [测试时计算](./reasoning-models) | 使用模型时增加思考、候选搜索与验证 | 通过评测选择质量、延迟和成本的平衡 |
| [Voice Agent](./voice-agents) | 通过语音会话完成有授权的任务 | 处理轮次、打断、音频与业务状态一致性 |
| [AI 评估](./ai-evaluation) | 在指定任务和预算下验证系统质量与可靠性 | 评测集隔离、过程约束、发布门槛与反馈 |
| [合成数据与蒸馏](./synthetic-data-and-distillation) | 构造可验证样本，并让学生学习教师的行为或分布 | 数据来源、训练成本、质量迁移与评测隔离 |
| [生成式多模态](./generative-multimodal) | 根据条件生成或编辑图像、视频等媒体 | 区分表示、网络、目标、采样与内容控制 |
| [世界模型与具身智能](./world-models-and-embodied-ai) | 建模环境演化，并结合感知、策略、控制和反馈完成任务 | 预测、动作选择与真实执行有不同边界 |
| Structured Outputs | 用受支持的 JSON Schema 约束输出结构 | 降低解析失败，但仍需事实与业务校验 |
| AI Gateway | 统一模型协议、鉴权、路由、容错、成本和 Trace | 多模型生产治理入口 |
| [Harness](./harness-engineering) | Agent 的运行时控制层，管理 Skill、工具、上下文、权限和循环 | 落实可恢复执行、审批与验证 |

---

## 面试中 AI 题的特点

可用三个层次自测理解深度；它们不是公司统一的题型或评分标准：

| 层次 | 问法 | 考查重点 | 举例 |
|------|------|---------|------|
| **概念层** | "XX 是什么" | 知不知道这个技术 | "什么是 RAG？" |
| **原理层** | "XX 怎么实现的" | 理不理解底层机制 | "Transformer 的注意力机制怎么工作的？" |
| **设计层** | "设计一个 XX 系统" | 能不能落地 | "设计一个企业知识库问答系统" |

**回答策略**：
1. **先说"是什么"**——一句话定义（如 "RAG 是检索增强生成，让 LLM 基于外部知识回答问题"）
2. **再说"怎么做"**——核心流程（如 "用户查询 → Embedding → 向量检索 → Rerank → 注入 Prompt → LLM 生成"）
3. **最后说"如何验证"**——举出失败条件和对照方法，例如区分漏召回与重排错误，而不是直接声称 Rerank 一定改善答案。

---

## 学习技巧与直觉培养

### 技巧一：理解"为什么有这个东西"比"怎么用"更重要

每个技术的存在都是为了解决一个具体痛点：

| 技术 | 解决的痛点 |
|------|-----------|
| Transformer / Self-Attention | RNN 无法并行 + 长距离依赖丢失 |
| Prompt Engineering | LLM 输出质量取决于输入质量 → 系统化调优方法 |
| Embedding + 向量数据库 | 关键词搜索无法捕捉语义 → 语义相似度检索 |
| RAG | LLM 知识有截断日期 + 会产生幻觉 → 注入实时外部知识 |
| Agent | LLM 只能生成文本 → 让它能规划、使用工具、完成任务 |
| LoRA / QLoRA | 全量微调成本太高 → 只训练低秩适配参数；参数占比与效果取决于秩、目标层、数据和任务 |
| 量化 | 模型太大放不进显存 → 降低精度换空间 |
| KV Cache | 自回归解码每步重复计算 → 缓存避免冗余 |
| RLHF / DPO | 预训练模型不懂人类偏好 → 用反馈信号对齐 |
| Guardrails | LLM 可能输出有害内容 → 安全护栏过滤 |

### 技巧二：对比学习

很多概念成对出现，对比记忆效率更高：

| A | B | 核心区别 |
|---|---|---------|
| RAG | 微调 | RAG 注入外部知识（不改模型），微调改变模型权重（不需要检索） |
| RAG | Long Context | 前者选择外部证据，后者容纳更长输入；两者都可能遗漏信息，需要同任务对照 |
| RAG | Skill | RAG 是“给任务找资料”，Skill 是“给 Agent 加载过程知识与资源”；两者可组合，权限仍由宿主 Harness 强制 |
| Skill | Tool | Skill 是可加载的指令/脚本/参考资料包，Tool 是可调用能力；Skill 可以指导多个 Tool，但不会自动授予工具权限 |
| MCP | A2A | MCP 是 Agent 与工具/数据源之间的协议（垂直），A2A 是 Agent 与 Agent 之间的协议（水平） |
| Function Calling | MCP | Function Calling 是模型生成工具调用的机制；MCP 是 AI 应用连接外部能力的协议，后者不替代前者 |
| Reasoning Model | 普通 LLM | Reasoning Model 使用额外 test-time compute；按 reasoning effort 权衡质量、延迟和成本，原始思维链通常不直接暴露 |
| 单模型调用 | Compound AI System | 多组件可分离职责，也增加延迟和故障面；是否更可靠需验证 |
| LoRA | 全量微调 | 更新的参数集合与资源需求不同；效果取决于数据、训练配置和评测任务 |
| RLHF | DPO | 显式奖励模型加 PPO 是常见 RLHF 路线；DPO 直接利用偏好对优化策略 |
| Dense Retrieval | Sparse Retrieval (BM25) | 语义匹配与词项匹配各有适用查询；混合检索的增量收益需测量 |
| Agent | Chain/Pipeline | Agent 有自主规划和反思能力，Chain 是预定义的固定流程 |
| Prefill | Decode | Prefill 并行处理输入（计算密集），Decode 自回归逐 token 生成（显存密集） |
| MQA / GQA | MHA | 减少 KV Head 数量降低显存，MQA 极端到 1 个 Head，GQA 是折中 |
| Temperature 高 | Temperature 低 | 高温更随机多样，低温更确定保守 |

### 技巧三：画架构图是最好的理解方法

AI 的核心机制都可以用架构图表达：
- **RAG 流程**：Query → Embedding → 向量检索 → Rerank → 上下文注入 → LLM → 回答
- **Agent 循环**：感知 → 规划 → 行动 → 观察 → 反思 → 下一步行动
- **推理优化**：Prefill（并行）→ KV Cache 存储 → Decode（自回归 + Cache 复用）
- **训练流程**：预训练（海量数据）→ SFT（指令微调）→ RLHF/DPO（对齐）

面试时主动画图，展示你的系统思维。

### 技巧四：从"失败原因"反推原理

理解失败原因就是理解原理：

| 失败现象 | 反推出的原理 |
|---------|------------|
| RAG 检索到了但回答错误 | 区分证据错误、上下文遗漏与生成不忠实，再决定优化哪一层 |
| RAG 回答中出现幻觉 | 核对证据是否存在、是否支持结论，以及拒答和引用策略 |
| Agent 陷入死循环 | 核对工具反馈、状态推进与停止条件，限制预算；增加反思不保证收敛 |
| 微调后模型变差 | 过拟合或遗忘 → 数据质量问题 + 学习率过高 |
| Prompt 不稳定 | 模型对指令措辞敏感 → 需要 Few-shot 示例 + 结构化 Prompt |
| 量化后精度下降明显 | 压缩过度 → 考虑 INT8 而非 INT4，或混合精度量化 |

---

## 分类地图

### AI 基础

| 主题 | 核心内容 | 详细页面 |
|------|---------|---------|
| AI 概述与发展历程 | ML 分类、Scaling Laws、模型架构与发展背景 | [AI 概述](./ai-overview) |
| LLM 大语言模型原理 | Transformer、注意力、位置编码、Tokenization、解码 | [LLM 原理](./llm-fundamentals) |
| 推理模型与测试时计算 | 串行/并行计算、搜索、验证器、预算与状态 | [推理模型](./reasoning-models) |
| 视觉语言模型 | 多模态架构、视觉编码、训练与应用 | [视觉语言模型](./vision-language-models) |
| 生成式多模态 | 扩散、DiT、Flow Matching、条件编辑与评估 | [生成式多模态](./generative-multimodal) |
| 世界模型与具身智能 | 动作条件预测、VLA、仿真迁移与安全控制 | [世界模型与具身智能](./world-models-and-embodied-ai) |

### LLM 应用技术

| 主题 | 核心内容 | 详细页面 |
|------|---------|---------|
| Prompt Engineering | 示例、推理引导、结构约束与安全边界 | [Prompt Engineering](./prompt-engineering) |
| 上下文工程与 Agent 记忆 | 信息组装、压缩、恢复、记忆生命周期 | [上下文与记忆](./context-and-memory) |
| Embedding 与向量数据库 | 表示学习、向量数据库选型、ANN 算法 | [Embedding 与向量数据库](./embedding-and-vector-db) |
| RAG 检索增强生成 | 分块、检索、重排、授权与失败定位 | [RAG](./rag) |

### AI Agent

按五个问题串起来读：**Agent 如何决定下一步 → Skills 告诉它怎么做 → MCP 连接外部能力 → A2A 委派给独立 Agent → Harness 控制执行与恢复**。这些机制可以组合，但不是每个 Agent 都需要全部采用。Computer Use 作为环境交互的进阶专题单独保留。

| 主题 | 核心内容 | 详细页面 |
|------|---------|---------|
| AI Agent 基本概念 | 决策循环、工具契约与协作边界 | [AI Agent 基本概念](./ai-agents) |
| Agent Skills | 标准目录、渐进加载、指令设计与版本管理 | [Agent Skills](./ai-agent-skills) |
| MCP 模型上下文协议 | 原语、Server、宿主接入、认证与排查 | [MCP](./mcp) |
| A2A 智能体协作协议 | Agent Card、任务、断线恢复与授权 | [A2A](./a2a) |
| Harness Engineering | 执行状态、环境、幂等、审批与验证 | [Harness Engineering](./harness-engineering) |
| Agent 交互与生成式 UI | AG-UI、A2UI、MCP Apps 与状态恢复 | [Agent 交互](./agent-ui) |
| Computer Use 与多 Agent 编排 | GUI 操作、视觉定位、沙箱与编排 | [Computer Use](./agent-computer-use) |
| 实时语音与 Voice Agent | 实时架构、打断、工具执行与音频评估 | [Voice Agent](./voice-agents) |

### Claude Code

以具体编程 Agent 为主线，连接产品使用、运行机制与工程实现。先理解与 Codex 等工具的异同，再追踪一次任务如何被执行、验证与恢复。

| 章节 | 核心内容 | 阅读入口 |
|------|----------|----------|
| 概念与对比 | 产品定位、Coding Agent、Codex / Cursor / Copilot 对比与选型 | [概念与对比](./claude-code/) |
| 使用实践 | 官方安装配置、项目约定、任务验证、权限与自动化 | [使用实践](./claude-code/practice) |
| 运行机制 | 启动与输入、主循环状态、模型流、工具轮、恢复与终止 | [运行机制](./claude-code/runtime) |
| 工具与权限 | 工具契约、并发调度、编辑一致性、审批、Hooks 与沙箱 | [工具与权限](./claude-code/tools) |
| 上下文与会话 | Prompt 组装、缓存预算、压缩记忆、持久化与恢复 | [上下文与会话](./claude-code/context) |
| 协作与扩展 | 子 Agent、任务状态、MCP、Skills、插件与 SDK 接口 | [协作与扩展](./claude-code/extensions) |

### AI 工程实践

| 主题 | 核心内容 | 详细页面 |
|------|---------|---------|
| 模型微调与训练 | SFT、LoRA/QLoRA、偏好优化与分布式训练 | [模型训练](./model-training) |
| 合成数据与知识蒸馏 | 数据生产、蒸馏、来源隔离与学生评测 | [合成数据与蒸馏](./synthetic-data-and-distillation) |
| AI 评估与可靠性工程 | 评测集、Judge、业务评分器、统计与发布 | [AI 评估](./ai-evaluation) |
| 模型对齐与 AI 安全 | 偏好优化、反馈、红队与行为边界 | [对齐与安全](./evaluation-and-alignment) |
| LLM 推理优化 | KV、量化、批处理、PD 分离与容量 | [推理优化](./inference-optimization) |
| AI 应用架构设计 | API 迁移、重试、幂等、成本与观测 | [应用架构](./ai-architecture) |
| AI 系统设计练习 | 约束澄清、客服/补全案例与取舍 | [系统设计](./ai-system-design) |
| AI 前沿趋势与新范式 | 技术变化、适用边界与选型影响 | [前沿趋势](./ai-trends) |
| AI 安全与越狱防护 | 注入、泄露、权限隔离与红队 | [安全与越狱](./security-and-jailbreak) |

### AI 面试准备

| 主题 | 核心内容 | 详细页面 |
|------|---------|---------|
| AI 时代面试准备策略 | 岗位场景、自测与可复核的项目证据 | [面试准备策略](./ai-interview-prep) |
| 全栈工程师 AI 实战能力 | BFF、流式渲染、取消与端到端交互 | [全栈 AI 实战](./ai-for-fullstack) |

---

## 建议学习顺序

```
第一阶段（基础与最小应用）：
  AI 概述 → LLM 原理 → 推理模型与测试时计算
  → Prompt Engineering → 结构化输出与工具调用

第二阶段（可控执行）：
  AI Agent → Harness → 上下文工程与记忆
  → 工具授权、预算、恢复与完成验证

第三阶段（按任务补齐能力）：
  外部证据：RAG → 按需深入 Embedding 与向量数据库
  工具与协作：Skills / MCP / A2A
  交互与环境：Agent UI / Computer Use / Voice Agent
  服务交付：AI 应用架构设计 → AI 系统设计

第四阶段（工程深入，按需学习）：
  模型训练（LoRA）→ 合成数据与知识蒸馏 → 推理优化 → 模型对齐与安全

多模态与具身方向（按岗位扩展）：
  VLM 视觉理解 → 生成式多模态 → 世界模型与具身智能
```

**评估贯穿全程**：从第一个模型调用开始阅读 [AI 评估与可靠性工程](./ai-evaluation)，先建立验收与回归，再增加复杂度。上述顺序是应用工程路线；训练、推理与多模态岗位可直接深入对应专题。

### 相邻章节怎么分工

| 要回答的问题 | 主讲章节 |
|--------------|----------|
| 模型怎样提出下一步，工具契约怎样返回结果？ | [AI Agent](./ai-agents) |
| 哪些动作允许执行，失败后怎样恢复并证明完成？ | [Harness](./harness-engineering) |
| 当前请求该读哪些信息，记忆怎样更新和删除？ | [上下文与记忆](./context-and-memory) |
| 证据怎样找到、授权、更新与评估？ | [RAG](./rag) |
| API 迁移、配额、重试与成本如何进入生产契约？ | [应用架构](./ai-architecture) |
| 在给定约束下如何取舍，什么证据会改变选择？ | [系统设计](./ai-system-design) |
| 浏览器与 BFF 怎样处理流、取消、重连和审批？ | [全栈实战](./ai-for-fullstack)与 [Agent UI](./agent-ui) |
| 技术变化改变了哪些决策？ | [前沿趋势](./ai-trends) |

---

## 场景自测速查 {#高频面试题速查}

| 问题 | 核心答案 | 详见 |
|------|---------|------|
| Transformer 的自注意力机制？ | Q·K 点积算权重，加权求和 V，捕捉全局依赖 | [LLM 原理](./llm-fundamentals) |
| 什么是 RAG？为什么需要它？ | 检索外部证据辅助生成，不保证消除幻觉 | [RAG](./rag) |
| RAG vs 微调怎么选？ | 先区分缺证据还是行为能力不足，再用同任务基线验证 | [RAG](./rag) |
| Agent 的核心架构？ | 感知→规划→行动→记忆，ReAct 模式交替推理和行动 | [AI Agent](./ai-agents) |
| LoRA 的原理？ | 冻结原始权重，训练两个低秩矩阵 A·B 作为增量 | [模型训练](./model-training) |
| KV Cache 是什么？ | 缓存历史 K/V；Decode 计算新 token 的 Q/K/V，追加 K/V，再用 Q 访问允许范围内的缓存 | [推理优化](./inference-optimization) |
| Prompt Engineering 的核心技巧？ | Few-shot 示例 + CoT 推理链 + 结构化输出 + 角色设定 | [Prompt Engineering](./prompt-engineering) |
| 如何评估 LLM / Agent？ | 独立评测集 + 确定性检查 + 校准 Judge + 过程/结果与成本评估 | [AI 评估](./ai-evaluation) |
| MCP 会替代 Function Calling 吗？ | 不会；MCP 管连接与发现，Function Calling 管模型生成调用，两者可组合 | [应用架构](./ai-architecture) |
| 长时间运行 Agent 怎么设计？ | 持久化 Task + Queue/Worker + Checkpoint + 预算/取消/审批 | [Harness Engineering](./harness-engineering) |

## 对比速查

| A | B | 一句话区别 |
|---|---|-----------|
| RAG | 微调 | 前者改变可用外部证据，后者更新参数，两者可以组合 |
| LoRA | 全量微调 | 前者训练低秩增量，参数比例依配置；后者更新全部可训练参数 |
| RLHF | DPO | 显式奖励模型加 PPO 是常见 RLHF 路线；DPO 直接使用偏好对优化 |
| Dense | Sparse (BM25) | Dense 向量语义匹配，Sparse 关键词精确匹配 |
| Agent | RAG | Agent 能规划和执行动作，RAG 只增强知识检索 |
| Prefill | Decode | Prefill 并行处理输入，Decode 自回归逐 token 生成 |
| MHA | GQA / MQA | MHA 每个头独立 KV，GQA/MQA 共享 KV 头省显存 |
| CoT | Few-shot | CoT 引导推理过程，Few-shot 提供输入输出示例 |
