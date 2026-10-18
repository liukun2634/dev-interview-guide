---
title: Claude Code 工具与权限
---

# 工具与权限

<span class="dig-tag dig-tag--category">Claude Code</span> <span class="dig-tag dig-tag--hard">深入</span>

::: tip 核心要点
工具系统把模型的动作意图转换成真实副作用。需要分别回答：**工具是否可见、参数是否合法、调用是否获准、能否并发、执行在哪里发生、结果如何进入下一轮**。这些问题不能合并成一个 allow 布尔值。工具级审批控制“能不能调用”，沙箱限制“运行之后能接触什么”，两者都不等于业务验证。
:::

## 1. 工具是一组契约

### 不只是一个函数名

模型看到的是工具名称、说明和输入 Schema；宿主还需要工具实现、权限判断、结果转换与显示逻辑。以 CLI 2.1.84 的工具对象为例，可以直接看到以下成员承担不同职责：

- `inputSchema`：描述并解析参数结构。
- `validateInput`：部分工具提供的语义校验，例如路径和文件状态是否满足要求。
- `isEnabled`：当前环境或模式是否启用该能力。
- `isConcurrencySafe`、`isReadOnly`：根据工具及输入说明并发和读取属性。
- `checkPermissions`：进入该工具的权限判断逻辑。
- `call`：实际执行动作并返回数据。
- `mapToolResultToToolResultBlockParam`：把内部数据转换成模型可消费的工具结果。
- 渲染相关成员：生成终端里的调用、进度、拒绝或错误展示。

这些成员不是可以随意互换的装饰。一个工具执行成功，仍可能在输出转换时遇到体积或格式问题；工具显示为“只读”，也不代表外部服务不记录审计或消耗配额。

### Schema 校验与语义校验

`file_path` 是字符串，只能说明类型合法。路径是否允许访问、文件是否存在、是否是支持的类型、内容是否发生变化，属于另一层判断。

因此工具应尽早把错误转换成模型可以修正的反馈，例如“匹配到多处文本”“文件在读取后已变化”，而不是直接以模糊的执行异常结束整个任务。

### 可见性、可调用性与批准

工具没有加载，模型不能正常选择它；工具已加载但参数不合法，调用不应执行；参数合法但未获批准，也不应执行。`--tools`、拒绝规则、自动批准规则和具体权限模式分别影响这些阶段。

最常见的误读是把 `allowed_tools` 当作唯一工具集合。它主要表示自动批准，未列入的工具并不必然消失；MCP 工具又有自己的发现与过滤过程。

## 2. 从调用块到执行结果

### 一个工具调用的生命周期

```text
模型产生 tool_use，携带名称、输入和 ID
  → 查找当前可用工具
  → 解析参数，执行适用的语义校验
  → 工具前 Hook 与权限决策
  → 按并发约束进入执行器
  → 调用工具，收集进度、数据或错误
  → 处理工具后事件与结果体积
  → 生成关联原调用 ID 的 tool_result
  → 主循环带着结果进入下一轮
```

这是职责顺序的概括，不是所有工具都经过同样数量的固定步骤。Hook、审批、流式执行和特定工具会增加或调整分支，不能用一个“若干步流水线”的数字代替条件判断。

### 结果不是任意日志

工具结果需要保留调用 ID、成功或错误语义，以及足够的后续决策信息。路径、输出文件、截断提示和结构化数据都可能有意义。

在所选实现中，工具结果映射之后还有通用体积处理。超大输出可以落到文件并提供摘要或预览，而不是永远完整塞回对话。后续模型要能知道“这是截断后的内容”和“去哪里读取剩余部分”。

执行进度、最终输出和用户可见展示也不同。一个进度事件不能被误认为最终成功结果；一个美观的终端摘要也不能替代完整的错误数据。

### 上下文修改也是执行产物

有些工具除了返回文本，还会更新运行状态，例如计划模式、文件读取记录或任务信息。主循环需要合并新的执行上下文，而不只是追加一个 user 消息。

这解释了为什么工具调用通常需要 context 参数：它提供本次动作的身份、权限、取消与状态访问能力，而不是让每个工具自行创建无约束的全局状态。

### 代码：把调用转换成关联结果

下面以教学接口保留 `inputSchema`、`isConcurrencySafe`、`call` 的职责，不复刻完整工具对象。Schema 解析器由外部注入，实际项目应使用已有 Schema 库；`authorize` 代表 **Hook、规则和审批处理之后的最终决策**，不是只调用工具自身的 `checkPermissions` 就跳过其他规则。

```typescript
type Parsed<Input> =
  | { success: true; data: Input }
  | { success: false; error: string };

type ToolSpec<Input> = {
  name: string;
  inputSchema: { safeParse(value: unknown): Parsed<Input> };
  isConcurrencySafe(input: Input): boolean;
  call(input: Input, signal: AbortSignal): Promise<string>;
};

type ToolDecision<Input> =
  | { behavior: "allow"; input: Input }
  | { behavior: "deny"; reason: string };

type ToolResult = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error: boolean;
};

async function executeCall<Input>(
  callId: string,
  rawInput: unknown,
  tool: ToolSpec<Input>,
  authorize: (input: Input) => Promise<ToolDecision<Input>>,
  signal: AbortSignal,
): Promise<ToolResult> {
  const result = (content: string, is_error: boolean): ToolResult => ({
    type: "tool_result", tool_use_id: callId, content, is_error,
  });

  try {
    signal.throwIfAborted();
    const parsed = tool.inputSchema.safeParse(rawInput);
    if (!parsed.success) return result(parsed.error, true);

    const decision = await authorize(parsed.data);
    signal.throwIfAborted();
    if (decision.behavior === "deny") return result(decision.reason, true);

    const approved = tool.inputSchema.safeParse(decision.input);
    if (!approved.success) return result(approved.error, true);
    return result(await tool.call(approved.data, signal), false);
  } catch {
    return result("Tool execution failed or was interrupted", true);
  }
}
```

这段代码说明了四件事：不合法参数和拒绝决策不会进入 `call`；审批可以修改输入；真正执行的是获准后的输入；成功、拒绝与失败都保留同一个 `tool_use_id`。异常文本在示例中被概括，实际系统应将详细错误放入经过脱敏的内部诊断，不直接泄露给模型或最终用户。

审批后的再次 Schema 解析只检查结构，不重新证明授权正确。如果 Hook 或用户改了路径等参数，完整授权逻辑仍需验证修改后的对象。工具也必须响应传入的取消信号；包装函数无法强行让一个忽略 signal 的远程写操作回滚。

## 3. 并发调度怎样避免冲突

### 为什么不能全部 Promise.all

同时读取两个互不依赖的文件通常可以节省时间；先读取文件、再基于结果修改它则存在依赖；同时修改同一个文件则可能产生覆盖和陈旧读。

仅看工具名称不够。Shell 命令可能只读取，也可能安装依赖或改变目录中的文件；同一种工具的不同参数可能对应不同风险。

### 实际调度中的保守判断

CLI 2.1.84 的流式工具队列在接收调用时，先用 `inputSchema.safeParse` 解析输入，再计算 `isConcurrencySafe`。解析失败或能力判断抛错时，并发安全判断落到 false，而不是默认乐观并发。

队列会跟踪 queued 与 executing 等状态：没有正在执行的工具时可以启动一个调用；若已有调用在执行，只有新调用与当前执行集合都满足并发安全条件，才允许重叠运行。遇到需要串行执行的边界，后续队列不能无限越过它。

这相当于把不确定能力视为串行屏障。它降低误并发风险，但也意味着某个过于保守的能力声明可能降低吞吐，因此声明本身需要测试。

### 代码：选择下一批可启动调用

下面继续使用上面的 `ToolSpec`，先计算并发属性，再从待执行队列选出可以启动的前缀。它是队列决策的纯函数示例，不是完整的异步执行器。

```typescript
function concurrencyFlag<Input>(tool: ToolSpec<Input>, input: unknown): boolean {
  try {
    const parsed = tool.inputSchema.safeParse(input);
    return parsed.success ? Boolean(tool.isConcurrencySafe(parsed.data)) : false;
  } catch {
    return false;
  }
}

type ScheduledCall = { id: string; concurrencySafe: boolean };

function runnablePrefix(
  queued: readonly ScheduledCall[],
  running: readonly ScheduledCall[],
): ScheduledCall[] {
  if (running.some(call => !call.concurrencySafe)) return [];
  const first = queued[0];
  if (!first) return [];
  if (!first.concurrencySafe) {
    return running.length === 0 ? [first] : [];
  }

  const selected: ScheduledCall[] = [];
  for (const call of queued) {
    if (!call.concurrencySafe) break;
    selected.push(call);
  }
  return selected;
}
```

例如队列是 `Read A → Read B → Edit A → Read C`，且两个 Read 已被判定可安全并发：空闲时先启动前两个；它们未完成时不启动 Edit，也不越过 Edit 启动最后的 Read。所有读取完成后，Edit 单独运行，再继续后续队列。

真实执行器必须在启动前登记 executing 状态，完成或异常后释放状态，并在每次决策时取得新的队列视图。不能让两个调度任务基于同一份旧快照同时启动同一个调用。若审批修改了会影响并发安全的参数，还应重新评估能力或保守串行执行。

### 只读不等于可并发

一个只读工具可能依赖非线程安全的会话对象，或者读取正在被别的工具修改的共享状态。一个不修改项目文件的网络工具，也可能有服务端限流或不可重入的连接。

测试调度器时应至少覆盖：两个安全读取可以重叠、写操作不跨越屏障、失败调用能释放执行槽位、取消后不会留下永久 executing 状态。

## 4. 文件与 Shell 的具体保护

### 搜索先缩小读取范围

Glob、Grep 和文件读取分别回答“有哪些文件”“哪里匹配”“相关片段是什么”。让模型先拿到候选路径，再读取具体实现，可以减少无关上下文和不必要的权限请求。

符号跳转与引用查询又是另一类能力，适合处理文本搜索难以区分的同名符号。是否具备这类能力取决于入口与配置，不能把文本匹配解释成完整的语言语义分析。

### 编辑前为什么检查读取状态

CLI 2.1.84 的文件编辑校验包含以下判断：尚未读取文件时要求先读取；文件在读取后变化时要求重新读取；待替换字符串不存在或匹配多处时返回具体错误。

实际逻辑还会结合读取范围、时间戳与内容比较处理变化，不能简化成“只比较 mtime”或“任何 mtime 变化都必定拒绝”。核心目标是避免模型基于旧文件内容盲目覆盖用户或格式化工具的新改动。

```text
读到版本 A
  → 模型生成修改意图
  → 用户或格式化器把文件改成版本 B
  → 编辑器校验发现基线过期
  → 返回需要重新读取的反馈
  → 模型基于 B 重新生成修改
```

这是一种乐观并发控制思路，但不是数据库事务。即使有读取状态校验，也仍需考虑校验到写入之间的竞争、符号链接、换行和编码等边界。

### 精确替换与全文件写入

局部替换适合小范围、可确定的改动，可以减少意外覆盖；全文件写入适合新建文件或明确的整体生成，但更容易覆盖无关内容。工具选择应由任务需要决定，不应为绕开替换失败而直接重写整份文件。

如果匹配多处，应扩充上下文或者明确确实需要全部替换，而不是盲目打开 replace_all。错误反馈本身是在保护修改范围。

### 代码：只在明确的基线上替换一次

下面把“已读取、基线没有变化、匹配唯一”提炼成一个只处理字符串的函数。它使用完整内容一致性检查，比仅凭时间戳判断更容易演示；不包含真实工具的部分读取、路径规范化、编码、符号链接与文件写入逻辑，也不提供文件系统事务保证。

```typescript
function replaceFromSnapshot(
  snapshot: string | undefined,
  current: string,
  oldText: string,
  newText: string,
): string {
  if (snapshot === undefined) throw new Error("Read the file first");
  if (snapshot !== current) throw new Error("File changed; read it again");
  if (oldText.length === 0) throw new Error("Replacement target is empty");

  const start = current.indexOf(oldText);
  if (start < 0) throw new Error("Replacement target not found");
  if (current.indexOf(oldText, start + 1) >= 0) {
    throw new Error("Replacement target is ambiguous");
  }
  return current.slice(0, start) + newText + current.slice(start + oldText.length);
}
```

这里通过字符串拼接插入 `newText`，不会把其中的 `$&`、`$1` 等字符解释成正则替换模板。检查第二个匹配时从 `start + 1` 开始，还会拒绝重叠匹配，例如在 `aaa` 中把 `aa` 当作唯一目标。

写回文件仍是另一个步骤：需要在实际写入前重新检查基线，并采用适合平台的写入策略。该函数返回了新内容，并不意味着期间没有其他进程修改文件。

### Shell 为什么需要单独处理

Shell 可以启动编译器、测试、网络客户端和其他解释器，其影响远超单个文件工具。运行时需要处理工作目录、环境变量、超时、取消、输出上限和后台任务。

“批准 npm test”只批准一个动作形式，不证明项目中的测试脚本可信。脚本内容、依赖安装钩子或调用到的其他程序都可能产生副作用，因此工具规则需要与环境隔离组合。

## 5. 权限决策与审批

### 三个问题，三层答案

1. 模型是否能看到并选择这个工具？由工具加载与可见性控制。
2. 这次输入是否获准执行？由权限规则、模式、Hook 和审批决定。
3. 执行中的进程实际能接触什么？由操作系统权限、沙箱和部署环境决定。

历史实现和新版本的细节会变化，部署配置应以[当前官方权限契约](https://code.claude.com/docs/en/agent-sdk/permissions)为准，不能把某个旧版本的分支永久当成安全规则。

### 从工具前 Hook 到最终决定

官方权限流程可以概括为：工具前 Hook、deny 规则、ask 规则、权限模式、allow 规则，以及仍需确认时的审批路径。工具自身的路径检查和特殊交互要求也会影响结果。

其中最重要的短路关系是：**前面已经获批的调用通常不会再进入 SDK 的 `can_use_tool` 回调**。要把检查应用于每次工具尝试，应研究 `PreToolUse`，而不是假设批准回调是全局拦截器。

Hook 返回 allow 也不是拥有最高优先级的万能许可。显式 deny、ask 与特定受保护动作仍有自己的约束；Plan 也不能被解释为只靠一句提示词保证只读。

### 为什么需要 passthrough

工具本身有时无法独立决定“允许还是拒绝”，需要把请求交给外层规则或用户。这种“继续评估”与 allow 不同：它没有完成授权，只是在表达本层没有最终决定。

审批结果还可能包含更新后的输入，例如用户修改了目标路径。真正执行和审计的对象应是最后确认的参数；不能对 A 审批，却在执行时偷偷使用 B。

### 规则匹配不是 Shell 语义证明

命令别名、绝对路径、管道、子命令、脚本调用和重定向都可能改变执行含义。字符串规则可以表达有限的允许范围，却不能完整证明任意 Shell 程序安全。

拒绝应产生可理解的反馈：缺少权限、命中明确策略、用户取消与参数错误不是同一类故障。后续模型可以调整合理步骤，但不应通过换一种写法逃避同一个授权边界。

## 6. Hooks 与沙箱的分工

### Hook 看的是生命周期

常见事件包括 `UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`PostToolUseFailure`、`Stop` 和压缩相关事件。事件决定处理时机，输入 Schema 决定可观察信息，返回契约决定反馈怎样被消费。

下面是一个工具前 Hook 拒绝某次调用时的 JSON 输出示意，不是完整 Hook 程序：

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "This task does not authorize writes to deployment configuration."
  }
}
```

`PostToolUse` 发生时动作已经执行，适合做验证和记录，不等于事前阻止。Stop Hook 可以要求继续处理，但不能靠重复返回阻塞永久拖住任务。

### command Hook 与 SDK Hook

command Hook 运行外部程序，通常通过 stdin 读取事件数据，通过 stdout、stderr 和退出状态返回信息。SDK Hook 是宿主中的回调，通过控制协议被请求执行。两者的配置入口与支持事件需要分别核对。

Hook 本身也可能失败、超时或包含不可信脚本。关键安全检查应明确失败时是拒绝、暂停还是继续，不能把“启动过检查”写成“检查一定完成”。

### 沙箱约束执行中的进程

Claude Code 的内置 Shell 沙箱在 macOS、Linux 和 WSL2 上依赖相应系统机制；原生 Windows 不具有同样的内置沙箱运行条件。Linux/WSL2 的实现涉及 bubblewrap 与网络代理，macOS 使用 Seatbelt。

但这个边界主要包围 **Shell 命令与其子进程**，并不自动包围所有文件工具、Hook、MCP Server 或插件辅助进程。若要约束整个 Claude Code 进程及所有辅助能力，需要外层容器、虚拟机或其他部署隔离。

启用沙箱时还要检查：不可用时是否允许降级、是否允许无沙箱重试、是否存在 excludedCommands、哪些路径可读写、环境中有哪些凭据、是否允许访问高权限本地服务。

**允许某个域名不代表允许把任何数据发到该域名**；允许访问 Docker socket 也可能获得远超当前任务所需的主机能力。安全策略必须联合考虑文件、网络、凭据与本地 IPC。

## 7. 用失败场景验证设计

| 场景 | 需要观察的结果 |
|------|----------------|
| 参数格式错误 | 没有执行副作用，返回可修正的参数错误 |
| 同一替换匹配多处 | 不静默修改任意一处，要求消除歧义 |
| 用户在读取后改了文件 | 识别陈旧上下文，不覆盖用户的新改动 |
| 工具已经自动获批 | 不错误依赖未触发的批准回调来执行安全检查 |
| 两个工具存在写冲突 | 保持必要顺序，不以提高并发为由破坏语义 |
| Shell 运行中被取消 | 处理进程与任务状态，不伪造“从未执行” |
| Hook 超时或沙箱不可用 | 按明确策略暂停、拒绝或报告降级，而非隐瞒 |
| 输出超过上下文预算 | 提供截断标记与剩余结果入口，保留关键错误 |

在分页任务中，正确的工具链不仅应修复 off-by-one，还应证明：没有越权改动、没有覆盖用户变更、测试结果来自实际执行，且失败场景能够留下可解释的记录。

进一步阅读：[运行机制](./runtime)、[官方工具参考](https://code.claude.com/docs/en/tools-reference)、[Hooks](https://code.claude.com/docs/en/hooks)、[沙箱](https://code.claude.com/docs/en/sandboxing)。