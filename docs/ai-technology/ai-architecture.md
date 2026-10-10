---
title: AI 应用架构设计
---

# AI 应用架构设计

<span class="dig-tag dig-tag--category">AI 技术</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 中频</span>

::: tip 💡 核心要点
AI 应用架构设计涵盖从模型选型、推理优化到系统工程的完整链路。核心决策点包括：**何时使用 RAG vs 微调 vs Prompt Engineering**、**如何优化推理性能和成本**、**如何构建可靠的生产级 AI 系统**。这些知识是将 AI 理论落地为可用产品的关键。
:::

## LLM 应用架构模式

根据任务复杂度和需求，LLM 应用架构从简单到复杂分为多个层级：

```mermaid
graph LR
    L1["单次 LLM 调用<br/>Simple Call"] --> L2["链式调用<br/>Chain"]
    L2 --> L3["RAG<br/>检索增强生成"]
    L3 --> L4["Agent<br/>工具调用+循环"]
    L4 --> L5["多 Agent<br/>协作系统"]
    
    style L1 fill:#d4edda
    style L3 fill:#fff3cd
    style L5 fill:#f8d7da
```

### 架构选型指南

| 场景 | 推荐架构 | 原因 |
|------|----------|------|
| 文本分类、翻译、摘要 | 单次 LLM 调用 | 任务简单明确，无需额外复杂度 |
| 多步骤文档处理 | Prompt Chain | 步骤固定、可预测、无需动态决策 |
| 企业知识问答 | RAG Pipeline | 需要外部知识、实时更新、数据隐私 |
| 复杂研究任务 | Agent Loop | 需要动态决策、多工具协作 |
| 软件开发、数据分析 | 单 Agent + Harness，必要时多 Agent | 先用可控执行循环；只有角色隔离或并行确有收益时再拆分 |

---

## 推理优化

> 更详细的推理优化技术介绍请参阅 [LLM 推理优化](./inference-optimization)。

### KV Cache

在自回归生成中，每生成一个新 Token 都需要计算注意力。由于已生成 Token 的 Key 和 Value 不会改变，可以将其**缓存**起来，避免重复计算。

KV Cache 缓存已计算的 Key/Value，每步只需计算新 Token 的 Q/K/V，将总计算量从 O(n^2) 降为每步 O(n)。(详见 [LLM 推理优化](./inference-optimization))

- KV Cache 是所有 LLM 推理框架的**标配优化**
- **代价**：显存消耗随序列长度线性增长（长上下文场景下成为瓶颈）

### 量化 Quantization

将模型参数从高精度（FP16/BF16）转换为低精度（INT8/INT4），减少显存占用和加速推理：

| 量化方案 | 精度损失 | 显存节省 | 特点 |
|----------|----------|----------|------|
| **FP16/BF16** | 无 | 基准 | 训练和推理标准精度 |
| **INT8** | 极低 | ~50% | 生产部署的安全选择 |
| **GPTQ** | 低 | ~75% | 训练后量化，需要校准数据集 |
| **AWQ** | 低 | ~75% | 保护"重要"权重，效果优于 GPTQ |
| **GGUF** | 低~中 | ~75% | llama.cpp 格式，支持 CPU 推理 |

### 推测解码 Speculative Decoding

使用一个**小模型（Draft Model）**快速生成多个候选 Token，再由**大模型一次性验证**：

```
小模型（快）: 连续预测 K 个 Token → [t1, t2, t3, t4, t5]
大模型（慢）: 一次性验证全部 K 个   → 接受前 3 个 [t1, t2, t3] ✓
                                      → 第 4 个拒绝，从大模型重新采样 t4'
```

- **不损失生成质量**——数学上保证与大模型直接生成等价
- 推理速度可提升 **2~3 倍**
- 适用于大模型推理延迟敏感的场景

### 连续批处理 Continuous Batching

传统静态批处理在所有请求完成后才整体返回，导致短请求被长请求拖慢。连续批处理允许请求在完成后立即返回，新请求可随时加入：

静态批处理要求所有请求完成后才整体返回；连续批处理允许请求完成后立即释放资源，新请求可随时加入当前批次。(详见 [LLM 推理优化](./inference-optimization))

---

## 模型服务框架

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| **vLLM** | PagedAttention、连续批处理、高吞吐 | 大规模生产部署 |
| **TGI（Text Generation Inference）** | Hugging Face 官方、Docker 部署简单 | Hugging Face 生态 |
| **Ollama** | 一键部署、支持 GGUF 格式、Mac 友好 | 本地开发和实验 |
| **TensorRT-LLM** | NVIDIA 深度优化、最高性能 | NVIDIA GPU 生产环境 |
| **llama.cpp** | 纯 C++ 实现、支持 CPU 推理 | 边缘设备、低资源环境 |

---

## API 设计

### 流式传输 Streaming

LLM 生成通常需要数秒到数十秒，使用 Server-Sent Events（SSE）流式返回可显著改善用户体验：

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

async def generate_stream(prompt: str):
    """流式生成 LLM 响应"""
    async for chunk in llm.stream(prompt):
        yield f"data: {json.dumps({'text': chunk})}\n\n"
    yield "data: [DONE]\n\n"

@app.post("/v1/chat/completions")
async def chat(request: ChatRequest):
    if request.stream:
        return StreamingResponse(
            generate_stream(request.prompt),
            media_type="text/event-stream"
        )
    else:
        result = await llm.generate(request.prompt)
        return {"text": result}
```

### Token 预算控制

```python
class TokenBudget:
    """Token 预算管理器"""

    def __init__(self, max_input_tokens: int = 4096,
                 max_output_tokens: int = 2048):
        self.max_input = max_input_tokens
        self.max_output = max_output_tokens

    def check(self, prompt: str) -> bool:
        input_tokens = self.count_tokens(prompt)
        if input_tokens > self.max_input:
            raise TokenBudgetExceeded(
                f"输入 {input_tokens} tokens 超过限制 {self.max_input}"
            )
        return True

    def truncate_context(self, context: str, reserved: int = 512) -> str:
        """截断上下文以适应 Token 预算"""
        max_context = self.max_input - reserved
        tokens = self.tokenize(context)
        if len(tokens) > max_context:
            tokens = tokens[:max_context]
        return self.detokenize(tokens)
```

---

## 成本优化

### 模型路由

根据查询复杂度**动态选择模型**——简单问题用小模型，复杂问题用大模型：

```python
class ModelRouter:
    """根据查询复杂度路由到不同模型"""

    def __init__(self):
        self.models = {
            # 业务代码依赖稳定逻辑名；真实模型 ID 由配置中心更新。
            "simple": "fast-low-cost",
            "complex": "frontier-reasoning",
        }

    def route(self, query: str) -> str:
        complexity = self.classify_complexity(query)
        return self.models[complexity]

    def classify_complexity(self, query: str) -> str:
        # 简单规则或用轻量级分类器判断
        if len(query) < 50 and "?" in query:
            return "simple"
        return "complex"
```

### LLM 网关与多模型管理

在多模型、多团队或强治理场景中，**AI Gateway（AI 网关）** 常作为生产调用入口；小型、单模型应用则未必需要额外一跳。网关不应只追求“兼容某一家 API”，还要处理不同供应商在推理参数、工具调用、结构化输出和流式事件上的语义差异。

#### 为什么需要 LLM 网关

| 痛点（没网关）| 解决（有网关）|
|------------|------------|
| 切换模型要改一堆代码 | 统一 OpenAI 兼容协议，换模型只改配置 |
| 各家 SDK 错误处理不一 | 网关层统一重试、降级、超时 |
| 单家厂商宕机就全挂 | 多家厂商自动故障转移（Fallback） |
| 成本/用量不可见 | 网关统一打点、计费、限额 |
| 各业务线 API Key 混乱 | 网关统一鉴权、虚拟密钥 |
| 缓存逻辑每个应用各写 | 网关层做语义缓存，全局复用 |

#### 主流 LLM 网关对比

| 方案 | 部署 | 核心特性 | 适用 |
|------|------|---------|------|
| **LiteLLM** | 自建 / SaaS | 多模型统一 SDK，路由 / 重试 / 缓存 / Spend Tracking | Python 团队快速接入 |
| **Portkey** | SaaS / 自建 | 网关 + 可观测 + Prompt 库 + Guardrails | 想要"开箱即用全套" |
| **Helicone** | SaaS / 自建 | 轻量代理，重点在可观测与成本分析 | 已有调用层，只想加观测 |
| **OpenRouter** | SaaS | 100+ 模型聚合，按 token 转售 | 个人/小团队快速试模型 |
| **Kong AI Gateway** | 自建 | 企业级 API 网关 + AI 插件 | 已用 Kong 的企业 |
| **自建网关** | 自建 | 完全可控 | 大厂、合规要求严苛 |

#### LLM 网关的 6 大职责（面试黄金答案）

```mermaid
graph LR
    APP["业务应用"] --> GW["LLM Gateway"]
    GW --> M1["OpenAI"]
    GW --> M2["Anthropic"]
    GW --> M3["DeepSeek"]
    GW --> M4["自部署 vLLM"]
    
    GW -.->|1. 统一协议| L1["OpenAI 兼容 API"]
    GW -.->|2. 智能路由| L2["按成本/质量/可用性"]
    GW -.->|3. 容错降级| L3["失败时切备用模型"]
    GW -.->|4. 限流配额| L4["按用户/按 key"]
    GW -.->|5. 缓存| L5["语义缓存 / Prompt Caching"]
    GW -.->|6. 可观测| L6["Trace/Cost/质量打点"]
```

#### LiteLLM 最小实战

```python
import litellm

# 1. 统一 API 调用不同供应商模型（ID 仅为示例，生产中应配置化）
response = litellm.completion(
    model="anthropic/claude-sonnet-5",
    messages=[{"role": "user", "content": "Hello"}],
)

# 2. 自动 Fallback：主模型失败时按列表降级
response = litellm.completion(
    model="anthropic/claude-sonnet-5",
    messages=[...],
    fallbacks=["openai/gpt-5.6-terra", "deepseek/deepseek-chat"],
)

# 3. 路由策略（最低延迟 / 最低成本 / 加权轮询）
from litellm import Router
router = Router(
    model_list=[
        {"model_name": "smart", "litellm_params": {"model": "anthropic/claude-sonnet-5"}},
        {"model_name": "smart", "litellm_params": {"model": "openai/gpt-5.6-terra"}},
        {"model_name": "smart", "litellm_params": {"model": "deepseek/deepseek-chat"}},
    ],
    routing_strategy="latency-based-routing",  # 自动挑当前最快的
)
response = router.completion(model="smart", messages=[...])
```

#### 自建 vs 用现成网关

| 维度 | 用 LiteLLM/Portkey | 自建网关 |
|------|-------------------|---------|
| **接入速度** | 1 天 | 数周 |
| **可观测/计费** | 开箱即用 | 自研 |
| **合规/数据出境** | 受厂商政策约束 | 完全自控 |
| **极致性能** | 中（多一跳代理）| 高（可贴近业务优化）|
| **推荐起点** | 早期 + 中等规模 | 大流量 + 强合规 |

**面试加分点**：能区分 **LLM 网关 vs Model Router vs Reverse Proxy**——
- **Reverse Proxy**（Nginx）只做转发，不懂 LLM 协议
- **Model Router** 只决定"这个请求用哪个模型"，是网关内的一个模块
- **LLM Gateway** 是包含 Router + 协议适配 + 容错 + 计费 + 缓存 + 可观测的**完整中间件层**

生产路由不能只按“问题长度”决策。更稳妥的做法是先在离线评估集上得到每个模型的质量、延迟和成本曲线，再按租户、任务类型、数据地域、工具支持、上下文长度和实时健康状态路由；降级后还要验证输出契约是否兼容，避免“请求成功但语义降级”。

### 缓存策略

| 层级 | 说明 | 效果 |
|------|------|------|
| **Provider Prompt Cache** | 复用相同的长前缀；命中、TTL、写入费和最低长度因供应商/模型而异 | 降低重复 prefill 的延迟与费用 |
| **语义缓存** | 对语义相似的查询返回缓存结果 | 避免重复 LLM 调用 |
| **响应缓存** | 对完全相同的输入缓存输出 | 避免模型调用，通常显著降低延迟 |

缓存键至少要包含模型/快照、Prompt 与工具版本、租户和权限域；语义缓存还要考虑时效、个性化与安全策略，不能跨权限复用结果。离线分类、Embedding、评估等非实时任务优先考虑供应商的 **Batch API**；OpenAI、Anthropic 与 Gemini 的官方 Batch 方案在本文核验时均提供相对标准同步调用的折扣，但完成窗口和支持模型不同，接入前应查官方文档。

### 成本估算参考

> **核验日期：2026-10-10。** 下表来自 [OpenAI Pricing](https://developers.openai.com/api/docs/pricing)、[Claude Pricing](https://platform.claude.com/docs/en/about-claude/pricing) 和 [Gemini Pricing](https://ai.google.dev/gemini-api/docs/pricing)，单位为美元 / 1M Token，采用标准文本调用，不含缓存写入、工具、运行时、Batch/Flex/Fast、区域处理和企业折扣。API ID 不等于客户端产品的显示名，调用前还需核对账户资格、快照和 SDK 支持。

| 模型 / API ID | 价格适用条件 | 输入 | 缓存命中输入 | 输出 |
|---------------|--------------|------|--------------|------|
| GPT-6 Astra / `gpt-6-astra` | 输入不超过 272K Token | $10.00 | $1.00 | $50.00 |
| GPT-6.1 Sol / `gpt-6.1-sol` | 输入不超过 272K Token | $2.00 | $0.10 | $10.00 |
| GPT-6 Luna / `gpt-6-luna` | 输入不超过 272K Token | $0.10 | $0.01 | $0.50 |
| Claude Opus 5.5 / `claude-opus-5-5` | 标准调用，支持的长上下文按标准单价 | $4.00 | $0.20 | $20.00 |
| Claude Sonnet 5.5 / `claude-sonnet-5-5` | 标准调用，缓存命中价已于 10 月更新 | $2.00 | $0.10 | $10.00 |
| Claude Haiku 5.5 / `claude-haiku-5-5` | 单次输入不超过 100K Token | $0.10 | $0.01 | $0.50 |
| Claude Haiku 5.5 / `claude-haiku-5-5` | 单次输入超过 100K Token，含缓存输入 | $0.50 | $0.05 | $2.50 |
| Gemini 3.8 Flash / `gemini-3.8-flash` | 优惠价至 2026-12-31，缓存另收存储费 | $0.75 | $0.075 | $3.75 |

Claude Sonnet 5 原计划在 2026-09-01 调整至 $3/$15 的涨价已取消，$2/$10 已成为标准价，旧预测不再适用。Gemini 3.8 Flash 官方公告的 2027-01-01 起 $1.50/$7.50 是未来计划，不是当前价格。OpenAI 的长上下文价格与表中不同，不能拿短上下文价格估算百万 Token 请求。

成本模型不要只写“输入 + 输出”：

$$
Cost = Input + CacheWrite + CacheRead + Reasoning/Output + Tool + Runtime
$$

其中推理 Token 通常按输出计费；长上下文、区域处理和优先服务也可能改变单价。应从实际 Trace 的 Token 分布、缓存命中率和工具调用次数做容量估算，而不是用一次 Demo 的平均值外推。

更有用的指标是**每个验收成功任务的总成本**：计入失败尝试、重试、子 Agent、工具、缓存写入和运行时，再除以通过验收的任务数。模型升级还可能改变 Tokenizer，不能把同一段文本的 Token 数跨模型直接复用。降低单价或提高 effort 是否有净收益，要用同一业务评测集证明。

### Reasoning Effort 与结构化输出

推理强度是质量、延迟和成本的独立调节旋钮。不同供应商的参数和值不统一（例如 OpenAI 的 `reasoning.effort`、Gemini 的 `thinking_level`、Claude 自适应思考配合 `output_config.effort`），默认值也依模型而变。生产中应按任务路由并通过 Evals 选择档位：分类/抽取偏低，复杂调试和长程规划才提高；同时记录实际 reasoning tokens，不能假设“高”一定更好。

对需要机器消费的结果，优先使用供应商支持的 **Structured Outputs / strict function calling**，用 JSON Schema 约束结构，而不是提示“只返回 JSON”。它能保证受支持 Schema 的形状，不保证字段事实正确；仍需处理拒答、截断、内容过滤和业务校验。工具参数用 Function Calling，面向用户的结构化响应使用响应 Schema，两者不要混为一谈。

---

## 安全与护栏

### 输入过滤

```python
class InputGuard:
    """输入安全检查"""

    def check(self, user_input: str) -> tuple[bool, str]:
        # 1. 长度限制
        if len(user_input) > 10000:
            return False, "输入过长"

        # 2. Prompt 注入检测
        injection_patterns = [
            r"忽略(之前|以上|所有)(的)?(指令|规则)",
            r"ignore (previous|all) instructions",
            r"system prompt",
        ]
        suspicious = False
        for pattern in injection_patterns:
            if re.search(pattern, user_input, re.IGNORECASE):
            suspicious = True

        # 3. PII 检测（个人身份信息）
        if self.detect_pii(user_input):
            return False, "输入包含个人身份信息"

        # 字符串规则只能提供风险信号，不能作为最终授权或唯一拦截依据。
        # 即使未命中，工具端仍需鉴权、参数校验、最小权限与高风险审批。
        return True, "通过（需下游继续执行确定性安全控制）" if suspicious else "通过"
```

    关键词/正则可能误报正常安全讨论，也容易被改写绕过。它适合打标、路由到更严格策略或触发人工复核，不适合单独承担 Prompt Injection 防线；网页、RAG 和工具结果中的**间接注入**尤其无法只靠检查用户输入发现。

### 输出过滤

- **内容审核**：检查输出是否包含有害、违规内容
- **事实核验**：对关键声明与知识库交叉验证
- **格式校验**：确保输出符合预期的结构化格式
- **来源引用**：RAG 场景要求模型标注信息来源

---

## 可观测性

### LLM 调用追踪

生产级 AI 系统需要完整的调用链追踪：

| 维度 | 需要记录的信息 |
|------|---------------|
| **请求** | Prompt 内容、模型名称、参数（temperature 等） |
| **响应** | 输出内容、Token 用量（input/output）、延迟 |
| **RAG** | 检索到的文档、相似度分数、重排序结果 |
| **Agent** | 每步决策、工具调用、中间结果 |
| **成本** | 单次调用成本、累计成本、预算剩余 |
| **质量** | 任务成功率、事实性、引用正确率、结构契约通过率、用户反馈 |
| **版本** | 模型快照、Prompt/Skill/工具 Schema、检索索引与评估集版本 |

常用的 LLM 可观测性工具：**LangSmith**、**Helicone**、**Langfuse**。Trace 解决“发生了什么”，Evals 解决“结果是否足够好”：上线前跑离线黄金集，线上做分层抽样评估与用户反馈回流，并在模型、Prompt、工具或检索索引变更时执行回归。日志中的 Prompt、检索文档和工具结果可能包含 PII/密钥，必须脱敏、分权和设置保留期限。

---

## 架构选型：RAG vs 微调 vs Prompt Engineering

| 维度 | Prompt Engineering | RAG | 微调 |
|------|-------------------|-----|------|
| **知识更新** | 不改变模型知识 | 实时更新知识库 | 需要重新训练 |
| **成本** | 最低 | 中等（向量数据库+检索） | 最高（训练+数据） |
| **实施周期** | 分钟级 | 天级 | 周级 |
| **适用场景** | 通用任务、格式控制 | 企业知识问答、文档检索 | 领域适配、行为调整 |
| **数据需求** | 无 | 需要知识库 | 需要标注数据 |

### 决策流程

```mermaid
graph TD
    A{"需要新的领域知识?"} -->|否| B{"需要特定输出格式/风格?"}
    B -->|否| C["直接使用模型"]
    B -->|是| D["Prompt Engineering"]
    A -->|是| E{"知识需要频繁更新?"}
    E -->|是| F["RAG"]
    E -->|否| G{"数据量足够微调?"}
    G -->|是| H["微调 (可结合 RAG)"]
    G -->|否| F
```

---

## LLMOps

### MCP（Model Context Protocol）

MCP 最初由 Anthropic 提出，现作为 Linux Foundation 项目采用开放治理。它定义了 AI 应用与外部工具、数据源之间的标准化通信方式：

- **统一接口**：工具提供方只需实现一次 MCP Server，即可被所有支持 MCP 的客户端调用
- **动态发现**：LLM 应用可以在运行时发现和连接可用的工具和数据源
- **Server 核心能力**：Resources（数据读取）、Tools（操作执行）、Prompts（提示模板）
- **Client 与扩展能力**：Client 可提供 Elicitation；Tasks、MCP Apps、Skills over MCP 等属于双方显式协商的可选扩展，不应与核心原语混为一谈
- **生态兼容**：已被多个 AI 助手和开发工具采用

MCP **不替代 Function Calling / Tool Calling**：Function Calling 是模型在一次推理中生成结构化工具调用的机制；MCP 是 Host/Client 与外部 Server 之间发现、传输和执行能力的协议。MCP Tool 通常仍会作为模型可调用的 Tool 暴露。对于进程内、少量且稳定的函数，原生 Function Calling 更简单；跨客户端复用、远程发现和统一授权时，MCP 更有价值。

### Agent Harness 与协议分层

生产 Agent 还需要独立的 **Harness（运行时控制层）**：组装指令、按需加载 Skill、注册工具、执行 Function Calling 循环、管理上下文与检查点、权限审批、重试/终止和 Trace。模型升级不能替代这些确定性控制。

| 层次 | 解决的问题 | 不负责什么 |
|------|-----------|-----------|
| **Agent Skills** | 用 `SKILL.md` + 资源封装可复用 SOP，按需加载过程知识 | 不定义远程通信协议 |
| **MCP** | AI 应用连接 Tools / Resources / Prompts | 不定义模型如何决定调用，也不负责 Agent 间委派 |
| **A2A** | 独立 Agent 的发现、任务状态、消息与 Artifact 交换 | 不构建 Agent 内部执行循环 |
| **Function Calling** | 模型输出受约束的工具名和参数 | 不提供跨进程发现、鉴权和传输 |

截至 2026-08-09，MCP 与 A2A 均在 Linux Foundation 体系下开放治理，A2A 1.0 已发布；Agent Skills 是文件系统能力包规范，而 A2A Agent Card 中同名的 `AgentSkill` 只是远程能力描述。三层互补，不应包装成“统一协议已经解决全部互操作”。

### 长时间运行 Agent

分钟到小时级任务不能依赖单条同步 HTTP 连接。应把一次运行建模为持久化 Job/Task：保存目标、计划、事件日志、检查点、幂等键、预算和权限状态；通过队列调度 Worker，以轮询/Webhook/SSE 汇报进度，支持断点恢复、取消、超时和人工审批。供应商 Background API 或 A2A 长任务状态可作为执行通道，但业务状态与审计记录仍应由应用持久化。长任务还要设置最大步数/费用/工具调用数，定期压缩上下文，并在不可逆动作前暂停确认。

将 DevOps 理念应用到 LLM 应用的全生命周期管理：

| 实践 | 说明 |
|------|------|
| **Prompt 版本管理** | 使用 Git 管理 Prompt 模板，变更可追溯 |
| **评估自动化** | CI/CD 中集成 Prompt 回归测试，防止 Prompt 修改导致质量退化 |
| **A/B 测试** | 线上灰度对比不同 Prompt 或模型的效果 |
| **监控告警** | 对延迟、成本、错误率设置阈值告警 |
| **回退机制** | 模型服务异常时自动降级到备用模型 |

---

::: warning ⚠️ 常见误区

1. **所有场景都上 Agent**：Agent 引入了循环和不确定性，简单任务使用 Agent 会增加延迟、成本和不可预测性。**先尝试最简单的架构，复杂度不够时再升级。**

2. **忽视推理成本**：LLM API 按 Token 计费，未做成本控制的系统在流量上涨时成本可能失控。必须在架构层面设计预算、缓存和模型路由。

3. **不做评估就上线**：没有持续评估体系的 AI 系统会在"不知不觉中退化"。模型更新、数据变化、Prompt 修改都可能影响输出质量。

4. **低估安全风险**：Prompt 注入、数据泄露、有害内容生成是 AI 应用特有的安全风险。必须在输入和输出两侧都设置安全护栏。

:::

---

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 设计一个企业级知识问答系统的整体架构</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 如何优化 LLM 推理的延迟和成本？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. RAG、微调、Prompt Engineering 各适用什么场景？如何选择？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

## 面试真题详解

### Q1：设计一个企业级知识问答系统的整体架构

**要点**：

**架构全景**：

```mermaid
graph TD
    User["用户"] -->|问题| GW["API Gateway"]
    GW --> Conv["对话管理"]
    Conv --> Intent{"意图识别"}
    Intent -->|知识问答| RAG["RAG Pipeline"]
    Intent -->|数据查询| DB["业务数据库"]
    Intent -->|闲聊| Chat["闲聊模型"]
    
    RAG --> Ret["检索模块<br/>向量 + BM25"]
    Ret --> VDB["向量数据库"]
    Ret --> Rerank["重排序"]
    Rerank --> LLM["LLM 生成回答"]
    
    LLM --> Guard["安全过滤<br/>Guardrails"]
    DB --> Guard
    Chat --> Guard
    Guard --> Resp["返回结果"]
```

**关键设计决策**：
1. 混合检索（语义+关键词）确保召回率
2. 两阶段检索（粗排+精排）平衡速度和精度
3. 语义缓存减少重复 LLM 调用
4. 流式响应改善用户体验
5. 输入/输出双重安全过滤

---

### Q2：如何优化 LLM 推理的延迟和成本？

**要点**：

**延迟优化**：
- **KV Cache**：避免重复计算注意力，标配优化
- **量化**：INT8/INT4 减少计算量，推理速度提升 2-4 倍
- **推测解码**：小模型草稿+大模型验证，速度提升 2-3 倍
- **连续批处理**：vLLM 的 PagedAttention，提高 GPU 利用率
- **流式响应**：SSE 让用户看到逐 Token 输出，感知延迟大幅降低

**成本优化**：
- **模型路由**：简单查询→小模型（Haiku），复杂查询→大模型（Sonnet）
- **Prompt 缓存**：复用稳定长前缀，并监控 cache read/write tokens 与命中率
- **语义缓存**：相似查询直接返回缓存结果
- **Prompt 精简**：减少冗余指令，压缩 System Prompt
- **输出长度控制**：设置合理的 max_tokens，避免冗长输出

---

### Q3：RAG、微调、Prompt Engineering 各适用什么场景？如何选择？

**要点**：

| 方面 | Prompt Engineering | RAG | 微调 |
|------|-------------------|-----|------|
| **核心能力** | 改变模型行为方式 | 注入外部知识 | 改变模型内在能力 |
| **适用场景** | 格式控制、角色设定、简单任务 | 知识问答、实时信息、私有数据 | 领域专精、风格适配 |
| **实施成本** | 最低 | 中等 | 最高 |
| **迭代速度** | 最快 | 中等 | 最慢 |

**选择原则**：
1. **先试 Prompt Engineering**——先验证最小方案，再用评估结果决定是否增加复杂度
2. **需要外部知识用 RAG**——特别是知识需要频繁更新的场景
3. **行为模式改变用微调**——如统一输出风格、领域术语适配
4. **三者可以组合**——如"微调模型 + RAG 知识库 + 精心设计的 Prompt"

---

## 延伸阅读

- [Patterns for Building LLM-based Systems & Products](https://eugeneyan.com/writing/llm-patterns/)
- [Efficient Memory Management for LLM Serving with PagedAttention (vLLM)](https://arxiv.org/abs/2309.06180)
- [A Survey on Efficient Inference for Large Language Models](https://arxiv.org/abs/2404.14294)
- [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io/specification/latest)
- [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/)
- [Agent Skills Specification](https://agentskills.io/specification)
