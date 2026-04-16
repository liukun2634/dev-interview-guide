import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'

export default defineConfig({
  title: '程序员面试手册',
  description: '系统化的程序员面试知识体系，涵盖算法、系统设计、数据库、AI 等 9 大领域，含代码示例与高频真题',
  lang: 'zh-CN',
  base: '/dev-interview-guide/',
  ignoreDeadLinks: true,
  srcExclude: ['**/superpowers/**', '**/devops/**'],

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
          text: '数据结构与算法',
          items: [
            { text: '章节提要', link: '/data-structures-and-algorithms/' },
          ],
        },
        {
          text: '基础方法',
          collapsed: false,
          items: [
            { text: '基础方法导览', link: '/data-structures-and-algorithms/foundations/' },
            { text: '复杂度与递归', link: '/data-structures-and-algorithms/foundations/complexity-recursion' },
          ],
        },
        {
          text: '数组与字符串',
          collapsed: false,
          items: [
            { text: '数组与字符串导览', link: '/data-structures-and-algorithms/arrays/' },
            { text: '数组与字符串基础', link: '/data-structures-and-algorithms/arrays/array-basics' },
            { text: '双指针', link: '/data-structures-and-algorithms/arrays/two-pointers' },
            { text: '滑动窗口', link: '/data-structures-and-algorithms/arrays/sliding-window' },
            { text: '前缀和与差分', link: '/data-structures-and-algorithms/arrays/prefix-sum-difference' },
          ],
        },
        {
          text: '链表',
          collapsed: false,
          items: [
            { text: '链表导览', link: '/data-structures-and-algorithms/linked-list/' },
            { text: '链表基础', link: '/data-structures-and-algorithms/linked-list/linked-list-basics' },
          ],
        },
        {
          text: '栈与队列',
          collapsed: false,
          items: [
            { text: '栈与队列导览', link: '/data-structures-and-algorithms/stack-queue/' },
            { text: '栈与队列基础', link: '/data-structures-and-algorithms/stack-queue/stack-queue-basics' },
          ],
        },
        {
          text: '哈希',
          collapsed: false,
          items: [
            { text: '哈希分类导览', link: '/data-structures-and-algorithms/hash/' },
            { text: '哈希表', link: '/data-structures-and-algorithms/hash-table' },
          ],
        },
        {
          text: '树与堆',
          collapsed: false,
          items: [
            { text: '树与堆导览', link: '/data-structures-and-algorithms/tree/' },
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
            { text: '图与搜索导览', link: '/data-structures-and-algorithms/graph-search/' },
            { text: '图基础', link: '/data-structures-and-algorithms/graph-search/graph-basics' },
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
            { text: '动态规划分类导览', link: '/data-structures-and-algorithms/dynamic-programming/' },
            { text: '线性 DP', link: '/data-structures-and-algorithms/dynamic-programming/linear-dp' },
            { text: '区间 DP', link: '/data-structures-and-algorithms/dynamic-programming/interval-dp' },
            { text: '树形 DP', link: '/data-structures-and-algorithms/dynamic-programming/tree-dp' },
            { text: '状态压缩 DP', link: '/data-structures-and-algorithms/dynamic-programming/state-compression-dp' },
            { text: '典型动态规划问题', link: '/data-structures-and-algorithms/dynamic-programming/classic-problems' },
          ],
        },
        {
          text: '贪心与技巧',
          collapsed: false,
          items: [
            { text: '贪心与技巧导览', link: '/data-structures-and-algorithms/greedy-techniques/' },
            { text: '贪心算法', link: '/data-structures-and-algorithms/greedy-techniques/greedy' },
            { text: '位运算技巧', link: '/data-structures-and-algorithms/greedy-techniques/bitwise' },
          ],
        },
      ],
      '/operating-systems/': [
        {
          text: '操作系统',
          items: [
            { text: '进程与线程', link: '/operating-systems/process-and-thread' },
          ],
        },
      ],
      '/computer-networks/': [
        {
          text: '计算机网络',
          items: [
            { text: 'TCP 与 UDP', link: '/computer-networks/tcp-udp' },
          ],
        },
      ],
      '/databases/': [
        {
          text: '数据库',
          items: [
            { text: '索引原理', link: '/databases/indexing' },
          ],
        },
      ],
      '/system-design/': [
        {
          text: '系统设计',
          items: [
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
          items: [
            { text: '分布式 ID 生成', link: '/engineering-practice/distributed-id' },
            { text: 'Docker 容器化', link: '/engineering-practice/docker' },
          ],
        },
      ],
      '/programming-languages/': [
        {
          text: '编程语言',
          items: [
            { text: 'Java 基础', link: '/programming-languages/java-fundamentals' },
          ],
        },
      ],
      '/web-and-frameworks/': [
        {
          text: 'Web 与框架',
          items: [
            { text: 'RESTful API', link: '/web-and-frameworks/restful-api' },
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
            { text: 'AI 应用架构设计', link: '/ai-technology/ai-architecture' },
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
})
