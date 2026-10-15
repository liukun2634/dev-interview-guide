---
title: 全栈工程师 AI 实战能力
---

# 全栈工程师 AI 实战能力

<span class="dig-tag dig-tag--category">面试准备</span> <span class="dig-tag dig-tag--intermediate">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
全栈工程师不需要训练模型，但需要知道怎么把 AI 能力集成到产品中。面试重点考察的是：你能不能设计一个调用 LLM 的后端服务、处理流式响应的前端界面、以及保证整个系统可靠运行的工程方案。
:::

## 概念

全栈工程师在 AI 时代的核心价值是**集成能力**——把 AI 模型的能力变成用户可用的产品功能。这要求你同时理解前端交互、后端服务和 AI 接口三个层面。

全栈 AI 技能可以分为三层：

| 层级 | 能力 | 典型场景 |
|------|------|------|
| **必备** | 调用 LLM API、流式响应、Structured Outputs、Prompt/模型版本管理 | 给产品加可验证的 AI 功能 |
| **进阶** | RAG、AI Gateway/Model Routing、缓存与 Batch、可观测性/Evals | 基于私有知识库的生产系统 |
| **加分** | Agent Harness、MCP/A2A/Skills 分层、长任务与人工审批 | 自动化工作流、AI 驱动的产品功能 |

## 后端：AI 服务集成

### API 设计

调用 LLM 的后端服务和传统 API 有几个关键差异：

| 差异点 | 传统 API | LLM API |
|------|------|------|
| 响应时间 | 毫秒级 | 秒级到十秒级 |
| 响应方式 | 一次返回完整结果 | 流式返回（SSE/WebSocket） |
| 费用模型 | 按请求次数 | 按 Token 数量 |
| 结果确定性 | 确定性输出 | 非确定性输出 |

**面试常见设计题：设计一个 LLM 对话接口**

关键决策点：
1. **流式 vs 非流式**：面向用户的对话用流式（SSE），后台批量任务用非流式
2. **超时处理**：LLM 响应慢，需要设置合理的超时时间（通常 30-60s），并提供取消机制
3. **重试策略**：区分可重试错误（限流 429、部分 5xx）和不可重试错误（参数错误 400），使用指数退避、抖动和幂等键
4. **Token 预算**：根据业务场景设置 max_tokens，避免费用失控
5. **结构化契约**：机器消费的返回值使用 Structured Outputs / strict tool schema，并处理拒答、截断和业务校验
6. **长任务**：研究、批量生成和 Agent 工作流改为异步 Job，提供状态查询、取消、断点恢复和进度事件

```java
// Spring Boot SSE 端点示例
@GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<String>> chatStream(@RequestParam String message) {
    return llmService.streamChat(message)
        .map(chunk -> ServerSentEvent.<String>builder()
            .data(chunk)
            .build())
        .timeout(Duration.ofSeconds(60))
        .onErrorResume(e -> Flux.just(
            ServerSentEvent.<String>builder()
                .event("error")
                .data(e.getMessage())
                .build()));
}
```

### Prompt 管理

生产环境中 Prompt 不能硬编码在代码里：

| 方案 | 适用场景 | 优缺点 |
|------|------|------|
| 配置文件 | 简单场景，Prompt 很少变 | 简单，但修改需要重新部署 |
| 数据库存储 | Prompt 需要频繁调整 | 灵活，支持 A/B 测试和版本管理 |
| Prompt 模板引擎 | 复杂 Prompt 需要动态拼装 | 可组合，但需要维护模板逻辑 |

Prompt、模型/快照、工具 Schema、检索索引和 Skill 都应有版本号，并记录在 Trace 中。模型别名会变化，生产配置应通过评估后灰度升级，而不是把某个“当前默认模型”硬编码进业务代码。

### AI Gateway、路由与结构化输出

多供应商或多业务线场景通常在后端增加 AI Gateway，统一处理鉴权、配额、超时、重试、Fallback、协议适配、成本和 Trace。Model Router 只是其中负责“选哪个模型/推理档位”的模块：先按任务、地域、工具与上下文能力筛选，再用离线 Evals 和线上指标选择满足质量门槛的最低成本方案。

Provider API 的字段并不完全等价，特别是 reasoning effort、工具调用、流式事件和缓存语义。兼容层必须保留能力矩阵，不能只把所有请求改成同一种 JSON。对于工具参数使用 Function Calling；对于面向应用的 JSON 响应使用 Structured Outputs。结构正确不等于事实正确，后端仍需鉴权和业务规则校验。

**面试追问：Prompt 注入怎么防？**

- **来源分级**：用户指令、网页/RAG/邮件、工具结果分别标记信任级别；分隔符有帮助但不是安全边界
- **能力最小化**：按任务暴露最少工具，参数由服务端鉴权和业务规则校验，高风险动作执行前确认
- **执行隔离**：不可信代码和浏览器自动化放入受限沙箱，限制文件、网络、时间和费用
- **输出处理**：按 HTML/SQL/Shell/URL 等目标解释器做转义或参数化；结构正确不等于内容安全

### 缓存与成本控制

LLM 调用贵且慢，缓存是必要的工程手段：

| 策略 | 实现方式 | 适用场景 |
|------|------|------|
| 精确缓存 | 相同输入 → 返回缓存结果 | FAQ、固定 Prompt 模板 |
| 语义缓存 | 相似输入 → 返回近似结果 | 用户问法不同但意图相同 |
| 分层缓存 | 本地 → Redis → LLM | 高并发场景 |
| Provider Prompt Cache | 复用稳定的长前缀和工具定义 | 长 System Prompt、文档与 Agent 循环 |

成本控制要点：
- 选择合适的模型：用评估集先建立质量门槛，再将简单任务路由到低成本模型，复杂任务升级能力或 reasoning effort
- 控制上下文长度：只传必要的上下文，不要把整个对话历史都塞进去
- 设置用量限额：按用户、按时间段设置 Token 上限
- 非实时分类、Embedding 和离线评估使用 Batch API；缓存要监控 read/write tokens、TTL 与命中率

> 模型价格、上下文上限和缓存费变化频繁。成本文档应记录核验日期并链接供应商官方价目表；更稳妥的日常做法是按实际 usage 字段计算，而不是在业务代码里维护静态单价。

## 前端：AI 交互体验

语音交互不只是文本流的另一种渲染：音频传输、轮次、打断与后台工具状态需要独立协调，详见 [实时语音与 Voice Agent](./voice-agents)。

### 流式响应渲染（以下示例是纯文本字节流，不是 SSE）

用户期望看到"AI 正在打字"的效果，而不是等待几秒后突然出现一大段文字。

```typescript
// React 中处理 SSE 流式响应
function useChatStream(url: string) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (message: string) => {
    setLoading(true);
    setContent('');

    try {
      const response = await fetch(`${url}?message=${encodeURIComponent(message)}`);
      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setContent(prev => prev + decoder.decode(value, { stream: true }));
      }
      setContent(prev => prev + decoder.decode()); // flush
    } finally {
      setLoading(false);
    }
  };

  return { content, loading, send };
}
```

若后端返回真正的 SSE（含 `event:` / `data:` 帧），应使用 `EventSource` 或 SSE parser，并处理 `[DONE]`、事件类型、重连和取消，不能把协议帧直接拼进正文。`EventSource` 可自动重连；上面的 `fetch()` 示例不会自动重连，需要应用自己保存游标并恢复。

### Markdown 渲染

LLM 输出通常是 Markdown 格式，前端需要实时渲染：

- 使用 `react-markdown` 或 `marked` 解析 Markdown
- 代码块需要语法高亮（`highlight.js` 或 `prism`）
- 流式场景下注意不完整 Markdown 的处理（如未闭合的代码块）

### 交互状态设计

| 状态 | UI 表现 | 实现要点 |
|------|------|------|
| 空闲 | 输入框可用 | 默认状态 |
| 等待 | 显示 loading 指示器 | 首个 chunk 到达前 |
| 流式输出 | 逐字显示 + 打字光标 | 持续接收 chunk |
| 完成 | 显示完整结果 + 操作按钮 | 流结束，显示复制/重试按钮 |
| 错误 | 错误提示 + 重试按钮 | 区分网络错误和 AI 错误 |

### 用户体验要点

- **取消机制**：用户应该能随时中断 AI 生成（前端 `AbortController` + 后端取消请求）
- **历史管理**：对话历史的存储和加载（IndexedDB 或后端持久化）
- **输入限制**：显示 Token 估算，防止用户输入过长内容
- **反馈机制**：给用户提供"有用/没用"的反馈按钮，用于后续优化
- **长任务状态**：展示排队/运行/等待审批/完成/失败，允许离开页面后恢复，不用一条 SSE 连接承载整个生命周期

## 可观测性与 Evals

评测集设计、Judge 校准、统计指标与发布门槛详见 [AI 评估与可靠性工程](./ai-evaluation)。

传统 APM 的延迟、错误率和吞吐仍然需要，但 AI 应用还要记录模型与 Prompt 版本、输入/输出/推理 Token、缓存读写、检索文档、工具调用和每步 Agent 状态。Trace 回答“发生了什么”，Evals 回答“结果是否足够好”。

- **离线**：维护真实失败案例和 Golden Dataset，在模型、Prompt、Schema、Skill 或索引变更时回归
- **在线**：按场景抽样，结合规则、人工、用户反馈和经校准的 LLM-as-Judge
- **安全**：Prompt、工具结果和 Trace 可能含 PII/密钥，需脱敏、分权、审计和设置保留期限

## Agent 集成：Harness 与协议分层

Function Calling 是模型生成工具名和参数的机制；MCP 标准化 AI 应用到外部 Tools/Resources/Prompts 的连接，并不替代 Function Calling。A2A 面向独立 Agent 的发现和任务委派，Agent Skills 用 `SKILL.md` 等文件封装可加载 SOP。Harness 才是应用内的运行时：加载 Skill、注册工具、执行循环、管理上下文/检查点、权限、终止条件和 Trace。

长时间运行 Agent 应使用持久化 Job/Task、队列和 Worker，保存事件与检查点，设置步骤/Token/费用/时间预算；工具调用带幂等键，不可逆动作前等待人工批准。供应商 Background API 可以解决连接超时，但不能替代应用自己的业务状态和审计。

## 全栈 AI 项目面试怎么讲

面试时讲 AI 项目，用 STAR 框架 + 技术深度：

| 维度 | 要讲什么 | 示例 |
|------|------|------|
| **Situation** | 业务背景和痛点 | "客服每天处理 500+ 重复问题，人力成本高" |
| **Task** | 你的目标 | "用 AI 自动回答 80% 的常见问题" |
| **Action** | 技术方案和你的贡献 | "设计了 RAG 架构，后端 Spring Boot + 向量数据库，前端 React 流式对话" |
| **Result** | 量化结果 | "上线后自动解决率 75%，客服工单减少 60%" |

**面试官通常会追问的方向：**
- 为什么选这个模型/架构？考虑过哪些替代方案？
- 准确率怎么保证？出现幻觉怎么办？
- 成本多少？怎么控制？
- 响应延迟多少？怎么优化？

## 面试常问 & 怎么答

### 你做过 AI 相关的项目吗？

**没做过也可以这么答：** "我没有上线过 AI 产品，但我做过技术调研和 POC：搭建过基于 RAG 的内部知识库问答原型，从 API 调用、Prompt 设计到前端流式渲染都走通了。我理解全链路的工程考量——缓存策略、错误处理、成本控制这些。"

### 流式响应怎么实现？

**答题框架：** 后端用 SSE（Server-Sent Events）推送 LLM 的 chunk 输出，前端用 `EventSource` 或 `fetch` + `ReadableStream` 接收。选 SSE 而不是 WebSocket 是因为这是单向推送场景，SSE 更简单、自动重连、兼容性好。如果需要双向通信（比如用户中途取消），可以单独用一个 REST 接口发取消指令。

### RAG 和直接 Prompt 有什么区别？

**答题框架：** 直接 Prompt 依赖模型的训练数据，无法回答私有知识或最新信息。RAG 在生成前先从知识库检索相关文档，把检索结果拼入 Prompt，让模型基于真实数据回答。核心优势是减少幻觉、支持私有数据、知识可更新。核心挑战是检索质量——检索不到正确文档，生成就不可能对。

### AI 应用的成本怎么控制？

**答题框架：** 五个维度——基于 Evals 的模型/effort 路由、精确/语义/Prompt 缓存、非实时任务 Batch、Token/步骤预算、按 Trace 统计的用量告警。给出经过测量的命中率、P95 延迟、任务成功率和单任务成本，比背某个模型单价更有说服力。

## 看到什么就先想到这类

| 关键词 | 联想方向 |
|------|------|
| "AI 集成" / "接入大模型" | API 设计 → Structured Outputs → Gateway/路由 → Trace/Evals |
| "智能客服" / "AI 问答" | RAG 架构 → 知识库建设 → 检索质量 → 兜底策略 |
| "流式输出" / "打字效果" | SSE vs WebSocket → ReadableStream → 不完整 Markdown 处理 |
| "AI 成本" / "Token 费用" | 模型/effort 路由 → Cache/Batch → 预算 → 用量监控 |
| "Prompt 注入" / "AI 安全" | 输入清洗 → 角色隔离 → 输出校验 → 限流 |
| "Agent / 自动化" | Harness → Function Calling/MCP → Skills → 长任务检查点与审批 |
