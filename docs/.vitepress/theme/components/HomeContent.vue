<template>
  <section class="dig-home">

    <!-- Stats Row -->
    <div class="dig-stats">
      <div class="dig-stat" v-for="s in stats" :key="s.label">
        <span class="dig-stat__value">{{ s.value }}<span>{{ s.suffix }}</span></span>
        <span class="dig-stat__label">{{ s.label }}</span>
      </div>
    </div>

    <!-- Domain Grid -->
    <p class="dig-section-title">知识领域</p>
    <div class="dig-domains">
      <a
        v-for="(d, i) in domains"
        :key="d.link"
        :href="d.link"
        class="dig-domain-card"
        :style="{ animationDelay: `${i * 0.05}s` }"
      >
        <div class="dig-domain-card__head">
          <div class="dig-domain-card__badge">{{ d.badge }}</div>
        </div>
        <div class="dig-domain-card__title">{{ d.title }}</div>
        <div class="dig-domain-card__desc">{{ d.desc }}</div>
        <div class="dig-domain-card__tags">
          <span v-for="tag in d.tags" :key="tag" class="dig-domain-card__tag">{{ tag }}</span>
        </div>
        <div class="dig-domain-card__arrow">↗</div>
      </a>
    </div>

    <!-- Features -->
    <p class="dig-section-title">学习方式</p>
    <div class="dig-features">
      <div class="dig-feature" v-for="f in features" :key="f.title">
        <div class="dig-feature__icon">{{ f.icon }}</div>
        <div class="dig-feature__title">{{ f.title }}</div>
        <div class="dig-feature__desc">{{ f.desc }}</div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
const stats = [
  { value: '8',   suffix: '',   label: '技术领域' },
  { value: '15',  suffix: '+',  label: '深度文章' },
  { value: '100', suffix: '+',  label: '高频真题' },
  { value: '300', suffix: '+',  label: '代码示例' },
]

const domains = [
  {
    badge: 'DS / ALGO',
    title: '数据结构与算法',
    desc: '二叉树、哈希表、排序、动态规划、图论等核心知识与高频真题',
    tags: ['数组', '树', '动态规划', '图'],
    link: '/dev-interview-guide/data-structures-and-algorithms/',
  },
  {
    badge: 'OS',
    title: '操作系统',
    desc: '进程与线程、内存管理、死锁、调度算法、IO 模型详解',
    tags: ['进程', '线程', '内存', 'IO'],
    link: '/dev-interview-guide/operating-systems/',
  },
  {
    badge: 'NETWORK',
    title: '计算机网络',
    desc: 'TCP/UDP、HTTP/HTTPS、DNS、WebSocket 等协议原理',
    tags: ['TCP', 'HTTP', 'DNS', 'HTTPS'],
    link: '/dev-interview-guide/computer-networks/',
  },
  {
    badge: 'DB',
    title: '数据库',
    desc: 'SQL 基础、索引原理、事务与锁、Redis 缓存、NoSQL',
    tags: ['MySQL', 'Redis', '索引', '事务'],
    link: '/dev-interview-guide/databases/',
  },
  {
    badge: 'SYS DESIGN',
    title: '系统设计与工程实践',
    desc: '分布式系统、缓存策略、限流熔断、Docker 容器化、微服务架构',
    tags: ['分布式', '缓存', 'Docker', '限流'],
    link: '/dev-interview-guide/system-design/',
  },
  {
    badge: 'LANG',
    title: '编程语言',
    desc: 'Java / Go / Python 语言特性、并发模型、GC 机制详解',
    tags: ['Java', 'Go', 'Python', '并发'],
    link: '/dev-interview-guide/programming-languages/',
  },
  {
    badge: 'WEB',
    title: 'Web 与框架',
    desc: 'RESTful API、GraphQL、OAuth/JWT 认证、Spring / Express',
    tags: ['REST', 'GraphQL', 'Auth', 'Spring'],
    link: '/dev-interview-guide/web-and-frameworks/',
  },
  {
    badge: 'AI / LLM',
    title: 'AI 技术',
    desc: 'Transformer 架构、大语言模型原理、RAG 检索增强生成、Prompt Engineering',
    tags: ['LLM', 'RAG', 'Transformer', 'RLHF'],
    link: '/dev-interview-guide/ai-technology/',
  },
]

const features = [
  {
    icon: '📐',
    title: '结构化知识体系',
    desc: '按面试频率与难度系统整理，从基础概念到高频真题，循序渐进。',
  },
  {
    icon: '💻',
    title: '可运行代码示例',
    desc: '每个关键知识点配套 TypeScript / Java 代码示例，强化理解与记忆。',
  },
  {
    icon: '🎯',
    title: '高频真题精选',
    desc: '收录各大厂真实考题，标注难度与热度，聚焦面试核心考察点。',
  },
]
</script>
