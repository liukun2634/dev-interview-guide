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
| **必备** | 调用 LLM API、处理流式响应、Prompt 管理 | 给产品加 AI 对话功能 |
| **进阶** | RAG 集成、向量数据库选型、缓存策略 | 基于私有知识库的问答系统 |
| **加分** | Agent 编排、多模型协同、评估体系 | 自动化工作流、AI 驱动的产品功能 |

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
3. **重试策略**：区分可重试错误（限流 429）和不可重试错误（参数错误 400）
4. **Token 预算**：根据业务场景设置 max_tokens，避免费用失控

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

**面试追问：Prompt 注入怎么防？**

- 输入清洗：过滤用户输入中的指令性内容
- 角色隔离：System Prompt 和 User 输入严格分开
- 输出校验：对 LLM 输出做格式和内容校验，防止泄露系统 Prompt

### 缓存与成本控制

LLM 调用贵且慢，缓存是必要的工程手段：

| 策略 | 实现方式 | 适用场景 |
|------|------|------|
| 精确缓存 | 相同输入 → 返回缓存结果 | FAQ、固定 Prompt 模板 |
| 语义缓存 | 相似输入 → 返回近似结果 | 用户问法不同但意图相同 |
| 分层缓存 | 本地 → Redis → LLM | 高并发场景 |

成本控制要点：
- 选择合适的模型：简单任务用小模型（如 Claude Haiku 3.5），复杂任务用大模型（如 Claude Sonnet 4 / Opus 4）
- 控制上下文长度：只传必要的上下文，不要把整个对话历史都塞进去
- 设置用量限额：按用户、按时间段设置 Token 上限

## 前端：AI 交互体验

### 流式响应渲染

用户期望看到"AI 正在打字"的效果，而不是等待几秒后突然出现一大段文字。

```typescript
// React 中处理 SSE 流式响应
function useChatStream(url: string) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (message: string) => {
    setLoading(true);
    setContent('');

    const response = await fetch(`${url}?message=${encodeURIComponent(message)}`);
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      setContent(prev => prev + text);
    }
    setLoading(false);
  };

  return { content, loading, send };
}
```

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

**答题框架：** 三个维度——模型选择（简单任务用小模型）、缓存策略（相同/相似问题复用结果）、Token 控制（精简 Prompt、限制上下文长度、设置 max_tokens）。给出你实际项目中的数据更有说服力。

## 看到什么就先想到这类

| 关键词 | 联想方向 |
|------|------|
| "AI 集成" / "接入大模型" | API 设计（流式 SSE）→ Prompt 管理 → 缓存 → 成本控制 |
| "智能客服" / "AI 问答" | RAG 架构 → 知识库建设 → 检索质量 → 兜底策略 |
| "流式输出" / "打字效果" | SSE vs WebSocket → ReadableStream → 不完整 Markdown 处理 |
| "AI 成本" / "Token 费用" | 模型分级 → 缓存 → Token 预算 → 用量监控 |
| "Prompt 注入" / "AI 安全" | 输入清洗 → 角色隔离 → 输出校验 → 限流 |
