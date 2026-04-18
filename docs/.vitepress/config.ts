import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: '程序员面试手册',
  description: '系统化的程序员面试知识体系，涵盖算法、系统设计、数据库、AI 等 9 大领域，含代码示例与高频真题',
  lang: 'zh-CN',
  base: '/dev-interview-guide/',
  ignoreDeadLinks: true,
  srcExclude: ['**/superpowers/**', '**/devops/**'],

  sitemap: {
    hostname: 'https://liukun2634.github.io/dev-interview-guide',
  },

  head: [
    ['meta', { name: 'keywords', content: '程序员面试,算法,数据结构,系统设计,数据库,操作系统,计算机网络,Java,Docker,AI,LLM,面试题' }],
    ['meta', { name: 'author', content: 'Dev Interview Guide' }],
    ['meta', { name: 'theme-color', content: '#0969da' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Dev Interview Guide' }],
    ['meta', { property: 'og:title', content: 'Dev Interview Guide — 程序员面试知识体系' }],
    ['meta', { property: 'og:description', content: '系统化的程序员面试知识体系，涵盖算法、系统设计、数据库、AI 等 9 大领域，含代码示例与高频真题' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Dev Interview Guide — 程序员面试知识体系' }],
    ['meta', { name: 'twitter:description', content: '系统化的程序员面试知识体系，涵盖算法、系统设计、数据库、AI 等 9 大领域' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/dev-interview-guide/favicon.svg' }],
  ],

  markdown: {
    config: (md) => {
      md.use(mathjax3)
    },
  },

  themeConfig: {
    nav: [],

    sidebar: {
      '/data-structures-and-algorithms/': [
        {
          text: '基础知识',
          collapsed: false,
          items: [
            { text: '一般流程', link: '/data-structures-and-algorithms/foundations/problem-solving-workflow' },
            { text: '算法技巧', link: '/data-structures-and-algorithms/foundations/algorithm-patterns' },
            { text: 'Java环境配置', link: '/data-structures-and-algorithms/foundations/java-problem-solving-basics' },
            { text: '调试技巧', link: '/data-structures-and-algorithms/foundations/debug-and-review' },
            { text: 'AI 时代刷题', link: '/data-structures-and-algorithms/foundations/ai-assisted-practice' },
          ],
        },
        {
          text: '数组与字符串',
          collapsed: false,
          items: [
            { text: '概念与技巧', link: '/data-structures-and-algorithms/arrays/' },
            { text: '双指针', link: '/data-structures-and-algorithms/arrays/two-pointers' },
            { text: '滑动窗口', link: '/data-structures-and-algorithms/arrays/sliding-window' },
            { text: '前缀和与差分', link: '/data-structures-and-algorithms/arrays/prefix-sum-difference' },
            { text: '二分查找', link: '/data-structures-and-algorithms/arrays/binary-search' },
          ],
        },
        {
          text: '链表',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/linked-list/' },
            { text: '链表题处理框架', link: '/data-structures-and-algorithms/linked-list/linked-list-basics' },
          ],
        },
        {
          text: '栈与队列',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/stack-queue/' },
            { text: '顺序结构处理框架', link: '/data-structures-and-algorithms/stack-queue/stack-queue-basics' },
          ],
        },
        {
          text: '哈希',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/hash/' },
            { text: '哈希表', link: '/data-structures-and-algorithms/hash-table' },
          ],
        },
        {
          text: '树与堆',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/tree/' },
            { text: '二叉树', link: '/data-structures-and-algorithms/binary-tree' },
            { text: '二叉搜索树', link: '/data-structures-and-algorithms/tree/binary-search-tree' },
            { text: '堆与优先队列', link: '/data-structures-and-algorithms/tree/heap-priority-queue' },
            { text: 'Trie 字典树', link: '/data-structures-and-algorithms/tree/trie' },
            { text: '并查集', link: '/data-structures-and-algorithms/tree/union-find' },
          ],
        },
        {
          text: '图与搜索',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/graph-search/' },
            { text: '图建模与遍历', link: '/data-structures-and-algorithms/graph-search/graph-basics' },
            { text: 'BFS 与 DFS', link: '/data-structures-and-algorithms/graph-search/bfs-dfs' },
            { text: '二分查找', link: '/data-structures-and-algorithms/graph-search/binary-search' },
            { text: '拓扑排序', link: '/data-structures-and-algorithms/graph-search/topological-sort' },
            { text: '最短路', link: '/data-structures-and-algorithms/graph-search/shortest-path' },
            { text: '回溯', link: '/data-structures-and-algorithms/graph-search/backtracking' },
          ],
        },
        {
          text: '动态规划',
          collapsed: false,
          items: [
            { text: 'DP 总论与解题方法论', link: '/data-structures-and-algorithms/dynamic-programming/' },
            { text: '线性与网格 DP', link: '/data-structures-and-algorithms/dynamic-programming/linear-dp' },
            { text: '背包 DP', link: '/data-structures-and-algorithms/dynamic-programming/knapsack-dp' },
            { text: '序列与回文 DP', link: '/data-structures-and-algorithms/dynamic-programming/sequence-dp' },
            { text: '区间与状态机 DP', link: '/data-structures-and-algorithms/dynamic-programming/interval-and-state-machine-dp' },
            { text: '树形 DP', link: '/data-structures-and-algorithms/dynamic-programming/tree-dp' },
            { text: '状压与计数 DP', link: '/data-structures-and-algorithms/dynamic-programming/advanced-dp' },
          ],
        },
        {
          text: '贪心与技巧',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/greedy-techniques/' },
            { text: '贪心算法', link: '/data-structures-and-algorithms/greedy-techniques/greedy' },
            { text: '位运算技巧', link: '/data-structures-and-algorithms/greedy-techniques/bitwise' },
          ],
        },
      ],
      '/operating-systems/': [
        {
          text: '操作系统',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/operating-systems/' },
            { text: '进程与线程', link: '/operating-systems/process-and-thread' },
            { text: '内存管理', link: '/operating-systems/memory-management' },
            { text: 'I/O 模型', link: '/operating-systems/io-model' },
            { text: 'CPU 调度', link: '/operating-systems/cpu-scheduling' },
            { text: '文件系统', link: '/operating-systems/file-system' },
          ],
        },
      ],
      '/computer-networks/': [
        {
          text: '计算机网络',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/computer-networks/' },
            { text: '网络模型', link: '/computer-networks/network-model' },
            { text: 'TCP 与 UDP', link: '/computer-networks/tcp-udp' },
            { text: 'HTTP 与 HTTPS', link: '/computer-networks/http-https' },
            { text: 'DNS', link: '/computer-networks/dns' },
            { text: 'WebSocket', link: '/computer-networks/websocket' },
            { text: '网络安全', link: '/computer-networks/network-security' },
            { text: 'CDN 与负载均衡', link: '/computer-networks/cdn-load-balancing' },
          ],
        },
      ],
      '/databases/': [
        {
          text: '数据库',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/databases/' },
            { text: 'MySQL 架构', link: '/databases/mysql-architecture' },
            { text: '索引原理', link: '/databases/indexing' },
            { text: '事务与锁', link: '/databases/transaction-lock' },
            { text: 'SQL 优化', link: '/databases/sql-optimization' },
            { text: 'MySQL 日志', link: '/databases/mysql-logs' },
            { text: '分库分表', link: '/databases/sharding' },
            { text: 'Redis 核心', link: '/databases/redis' },
          ],
        },
      ],
      '/system-design/': [
        {
          text: '系统设计',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/system-design/' },
            { text: '系统设计方法论', link: '/system-design/system-design-methodology' },
            { text: '分布式理论', link: '/system-design/distributed-theory' },
            { text: '分布式事务', link: '/system-design/distributed-transaction' },
            { text: '高可用架构', link: '/system-design/high-availability' },
            { text: '缓存策略', link: '/system-design/caching-strategies' },
            { text: '限流与熔断', link: '/system-design/rate-limiting' },
            { text: '消息队列', link: '/system-design/message-queue' },
            { text: '微服务架构', link: '/system-design/microservices' },
          ],
        },
      ],
      '/engineering-practice/': [
        {
          text: '工程实践',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/engineering-practice/' },
            { text: '设计模式', link: '/engineering-practice/design-patterns' },
            { text: 'Git 工作流', link: '/engineering-practice/git-workflow' },
            { text: '监控与日志', link: '/engineering-practice/monitoring-logging' },
            { text: 'Docker 容器化', link: '/engineering-practice/docker' },
            { text: '分布式 ID 生成', link: '/engineering-practice/distributed-id' },
          ],
        },
      ],
      '/programming-languages/': [
        {
          text: '编程语言',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/programming-languages/' },
            { text: 'Java 基础', link: '/programming-languages/java-fundamentals' },
            { text: 'Java 并发编程', link: '/programming-languages/java-concurrency' },
            { text: 'Java 集合框架', link: '/programming-languages/java-collections' },
            { text: 'JVM 深入', link: '/programming-languages/jvm-internals' },
            { text: 'Java 新特性', link: '/programming-languages/java-modern-features' },
          ],
        },
      ],
      '/web-and-frameworks/': [
        {
          text: 'Web 基础',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/web-and-frameworks/' },
            { text: 'Web 基础', link: '/web-and-frameworks/web-basics' },
          ],
        },
        {
          text: 'Spring 核心',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/web-and-frameworks/spring-core/' },
            { text: 'IoC 与依赖注入', link: '/web-and-frameworks/spring-core/ioc-di' },
            { text: 'Bean 生命周期与作用域', link: '/web-and-frameworks/spring-core/bean-lifecycle' },
            { text: 'AOP 原理与实践', link: '/web-and-frameworks/spring-core/aop' },
          ],
        },
        {
          text: 'Spring MVC',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/web-and-frameworks/spring-mvc/' },
            { text: '请求处理流程', link: '/web-and-frameworks/spring-mvc/request-flow' },
            { text: 'RESTful API', link: '/web-and-frameworks/spring-mvc/restful-api' },
          ],
        },
        {
          text: 'Spring Boot',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/web-and-frameworks/spring-boot/' },
            { text: '自动配置原理', link: '/web-and-frameworks/spring-boot/auto-configuration' },
            { text: '配置体系与 Profile', link: '/web-and-frameworks/spring-boot/configuration' },
          ],
        },
        {
          text: '数据访问与事务',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/web-and-frameworks/data-access/' },
            { text: '事务管理与传播行为', link: '/web-and-frameworks/data-access/transaction' },
            { text: 'JPA 与 MyBatis 集成', link: '/web-and-frameworks/data-access/orm-integration' },
          ],
        },
        {
          text: 'Spring Security',
          collapsed: false,
          items: [
            { text: 'Spring Security', link: '/web-and-frameworks/spring-security' },
          ],
        },
        {
          text: 'Spring Boot 3 与新特性',
          collapsed: false,
          items: [
            { text: 'Spring Boot 3 新特性', link: '/web-and-frameworks/spring-boot3-new-features' },
          ],
        },
        {
          text: 'Spring Cloud 速查',
          collapsed: false,
          items: [
            { text: 'Spring Cloud 速查', link: '/web-and-frameworks/spring-cloud-overview' },
          ],
        },
      ],
      '/ai-technology/': [
        {
          text: 'AI 基础',
          collapsed: true,
          items: [
            { text: 'AI 概述与发展历程', link: '/ai-technology/ai-overview' },
            { text: 'LLM 大语言模型原理', link: '/ai-technology/llm-fundamentals' },
          ],
        },
        {
          text: 'LLM 应用技术',
          collapsed: true,
          items: [
            { text: 'Prompt Engineering 提示工程', link: '/ai-technology/prompt-engineering' },
            { text: 'Embedding 与向量数据库', link: '/ai-technology/embedding-and-vector-db' },
            { text: 'RAG 检索增强生成', link: '/ai-technology/rag' },
          ],
        },
        {
          text: 'AI Agent 与工具',
          collapsed: true,
          items: [
            { text: 'AI Agent 智能体', link: '/ai-technology/ai-agents' },
          ],
        },
        {
          text: 'AI 工程实践',
          collapsed: true,
          items: [
            { text: '模型微调与训练', link: '/ai-technology/model-training' },
            { text: '模型评估与对齐', link: '/ai-technology/evaluation-and-alignment' },
            { text: 'LLM 推理优化', link: '/ai-technology/inference-optimization' },
            { text: 'AI 应用架构设计', link: '/ai-technology/ai-architecture' },
            { text: 'AI 系统设计面试题', link: '/ai-technology/ai-system-design' },
          ],
        },
        {
          text: 'AI 面试准备',
          collapsed: true,
          items: [
            { text: 'AI 时代面试准备策略', link: '/ai-technology/ai-interview-prep' },
            { text: '全栈工程师 AI 实战能力', link: '/ai-technology/ai-for-fullstack' },
          ],
        },
      ],
    },

    outline: {
      level: [2, 3],
      label: '本页目录',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },

    socialLinks: [],

    lastUpdated: {
      text: '最后更新',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    editLink: {
      pattern: 'https://github.com/liukun2634/dev-interview-guide/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
  },
}))
