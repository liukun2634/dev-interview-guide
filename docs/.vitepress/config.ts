import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Dev Interview Guide',
  description: '系统化的程序员面试知识体系 - 涵盖算法、系统设计、数据库等 8 大领域',
  lang: 'zh-CN',
  base: '/dev-interview-guide/',
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: '知识库', link: '/data-structures-and-algorithms/' },
      { text: 'GitHub', link: 'https://github.com/liuku/dev-interview-guide' },
    ],

    sidebar: {
      '/data-structures-and-algorithms/': [
        {
          text: '数据结构与算法',
          items: [
            { text: '二叉树', link: '/data-structures-and-algorithms/binary-tree' },
            { text: '哈希表', link: '/data-structures-and-algorithms/hash-table' },
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
            { text: 'TCP 与 UDP', link: '/computer-networks/tcp-and-udp' },
          ],
        },
      ],
      '/databases/': [
        {
          text: '数据库',
          items: [
            { text: '索引原理', link: '/databases/index-principles' },
          ],
        },
      ],
      '/system-design/': [
        {
          text: '系统设计',
          items: [
            { text: '缓存策略', link: '/system-design/caching-strategies' },
          ],
        },
      ],
      '/programming-languages/': [
        {
          text: '编程语言',
          items: [
            { text: 'Java 基础', link: '/programming-languages/java-basics' },
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
      '/devops/': [
        {
          text: 'DevOps',
          items: [
            { text: 'Docker 容器化', link: '/devops/docker-containerization' },
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

    lastUpdated: {
      text: '最后更新',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
  },
})
