<div align="center">

# 程序员面试手册 / Dev Interview Guide

**A comprehensive, structured knowledge base for software engineer interviews — in Chinese.**

**系统化的程序员面试知识体系 — 覆盖算法、系统设计、Spring、AI 等 9 大领域，200+ 篇专题正文**

[![在线阅读](https://img.shields.io/badge/📖_在线阅读-Docs-0969da?style=for-the-badge)](https://liukun2634.github.io/dev-interview-guide/)
[![GitHub Stars](https://img.shields.io/github/stars/liukun2634/dev-interview-guide?style=for-the-badge&color=f5c542)](https://github.com/liukun2634/dev-interview-guide/stargazers)
[![VitePress](https://img.shields.io/badge/Built_with-VitePress-646cff?style=for-the-badge)](https://vitepress.dev/)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC_BY--SA_4.0-lightgrey?style=for-the-badge)](./LICENSE)

[在线阅读](https://liukun2634.github.io/dev-interview-guide/) · [GitHub 仓库](https://github.com/liukun2634/dev-interview-guide) · [参与贡献](./CONTRIBUTING.md)

</div>

---

> Not a random collection of interview questions — each topic follows a clear path: **Concept → Key Differences → Code Examples → Follow-up Questions**, designed for efficient review and long-term retention.

不是零散题解的堆叠，而是把每个主题整理成一条清晰路径：**概念原理 → 关键区别 → 代码实战 → 高频追问**，帮你在面试前快速查阅和系统复习。

## ✨ 特点

- 🗂️ **9 大领域** — 覆盖后端/全栈面试全部高频知识面
- 🤖 **独立 AI 专题** — LLM、RAG、Agent、Prompt Engineering，紧跟行业趋势
- 🛤️ **学习路径导向** — 每个章节有决策树、对比表和学习顺序，不是资料堆砌
- 💻 **代码驱动** — 算法专题含通用模板 + LeetCode 例题完整题解 (Java/C++)
- 🏗️ **架构图 + 流程图** — Spring 请求流程、分布式架构、AI Agent 循环等可视化讲解
- 🔍 **全站搜索** — 按关键词随时检索
- 📱 **移动端适配** — 通勤路上也能复习

## 📚 知识覆盖

| 领域 | 核心内容 |
|:------|:------|
| **🤖 AI 技术** | LLM 与多模态、RAG、Embedding、Agent Harness、Skills、MCP/A2A、训练、推理、评估与安全、最新发布与 AI 系统设计 |
| **📊 数据结构与算法** | 数组、链表、哈希、树与堆、图搜索、动态规划、贪心、工程数据结构与系统手撕 |
| **🌍 Web 与框架** | Spring、云原生与响应式 Java、ASP.NET Core、TypeScript、React、Angular |
| **☕ 编程语言** | Java、C++、C#、Python、Go、Rust 的基础、并发、内存管理与工程实践 |
| **🗄️ 数据库** | MySQL、PostgreSQL、Redis、NewSQL、NoSQL、搜索、数据仓库、向量数据库与云存储 |
| **🌐 计算机网络** | 网络模型、TCP/UDP、HTTP/HTTPS/QUIC、DNS、WebSocket、安全、CDN 与网络排障 |
| **💻 操作系统** | 进程与线程、调度、同步、内存、文件系统、I/O、系统调用与容器隔离 |
| **🏗️ 系统设计** | 分布式、缓存、读写架构、消息队列、微服务、业务系统与 AI 系统设计案例 |
| **🔧 工程实践** | Docker/K8s、Helm、GitOps、Redis、消息队列、监控、线上排障与分布式 ID |

具体专题以网站分类导航为准；概览、跳转页与未发布的维护文档不作为独立面试专题重复计数。

## 面试深度自测

每个领域至少完成一次“解释机制、构造反例、运行验证、讨论取舍”，不要把读完文章等同于能回答追问。

| 领域 | 深入练习入口 |
|------|--------------|
| 算法 | [不变量、二分边界与差分测试](docs/data-structures-and-algorithms/foundations/problem-solving-workflow.md) |
| 语言 | [跨语言执行、取消与资源模型](docs/programming-languages/index.md) |
| 框架 | [事务传播与提交验证](docs/web-and-frameworks/data-access/transaction.md)、[React 请求竞态](docs/web-and-frameworks/react.md) |
| 数据库 | [隔离级别、写偏斜与锁范围](docs/databases/transaction-lock.md) |
| 网络 | [WebSocket 重放、背压与权限](docs/computer-networks/websocket.md) |
| 操作系统 | [futex、内存序与安全回收](docs/operating-systems/synchronization.md) |
| 系统设计 | [API 授权、幂等与并发修改](docs/system-design/api-design.md) |
| 工程实践 | [分层测试、契约与可靠交付](docs/engineering-practice/testing-and-delivery.md) |
| AI 与项目面试 | [岗位取舍、项目证据与模拟面试评分](docs/ai-technology/ai-interview-prep.md) |

## 🎯 适合谁

- 准备**后端 / 全栈**方向技术面试的工程师
- 想把零散八股整理成**可持续复习知识库**的人
- 想系统补齐 **AI / LLM 面试基础**的开发者
- 想边阅读边补充，把面试笔记沉淀成**公开仓库**的人

## 🚀 快速开始

在线阅读（推荐）：**[https://liukun2634.github.io/dev-interview-guide/](https://liukun2634.github.io/dev-interview-guide/)**

本地运行：

```bash
git clone https://github.com/liukun2634/dev-interview-guide.git
cd dev-interview-guide
npm install
npm run docs:dev
```

本地地址以启动日志为准，默认包含 `/dev-interview-guide/` 基础路径。

文档质量检查：

```bash
npm run docs:check:source
npm run docs:check:ai
npm run docs:check
```

`docs:check:source` 快速检查 Markdown 内部链接与锚点；`docs:check:ai` 直接提取文档中的 JavaScript，离线验证评估指标、业务评分与重试策略，不调用收费模型。`docs:check` 会先运行 AI 示例检查，再完成生产构建并检查实际生成页面与 sitemap，GitHub Pages 部署使用同一门禁。搜索索引覆盖标题、正文和行内代码，不索引大段代码块；代码示例仍在文章中完整显示。

## 🤝 参与贡献

欢迎通过 Issue 或 PR 一起完善这个知识库，具体方式请参阅 [贡献指南](./CONTRIBUTING.md)。

## ⭐ Star History

如果这个仓库帮你节省了整理面试知识的时间，欢迎点一个 Star。

[![Star History Chart](https://api.star-history.com/svg?repos=liukun2634/dev-interview-guide&type=Date)](https://star-history.com/#liukun2634/dev-interview-guide&Date)

## License

除另有说明的第三方内容外，本项目采用 [CC BY-SA 4.0](./LICENSE)（知识共享署名-相同方式共享 4.0 国际许可协议）。

允许商业使用和改编；分享时须署名、标注修改，分享改编作品时须使用相同或兼容的许可。详见 [许可摘要](https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans)。
