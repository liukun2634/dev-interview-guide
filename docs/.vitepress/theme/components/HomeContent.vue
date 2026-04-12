<template>
  <div class="dig-home">
    <div class="dig-domains">
      <a
        v-for="domain in domains"
        :key="domain.link"
        :href="domain.link"
        class="dig-domain-card"
      >
        <div
          class="dig-domain-card__icon"
          :style="{ background: domain.iconBg }"
        >
          {{ domain.icon }}
        </div>
        <div class="dig-domain-card__title">{{ domain.title }}</div>
        <div class="dig-domain-card__desc">{{ domain.desc }}</div>
        <div class="dig-domain-card__tags">
          <span
            v-for="tag in domain.tags"
            :key="tag"
            class="dig-domain-card__tag"
          >
            {{ tag }}
          </span>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
const domains = [
  {
    icon: '📊',
    iconBg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
    title: '数据结构与算法',
    desc: '数组、链表、树、图、排序、动态规划等核心知识与高频真题',
    tags: ['数组', '树', 'DP', '图', '排序'],
    link: '/dev-interview-guide/data-structures-and-algorithms/',
  },
  {
    icon: '🖥️',
    iconBg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
    title: '操作系统',
    desc: '进程与线程、内存管理、死锁、调度算法、IO 模型',
    tags: ['进程', '内存', '死锁', 'IO'],
    link: '/dev-interview-guide/operating-systems/',
  },
  {
    icon: '🌐',
    iconBg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
    title: '计算机网络',
    desc: 'TCP/UDP、HTTP/HTTPS、DNS、WebSocket、负载均衡',
    tags: ['TCP', 'HTTP', 'DNS'],
    link: '/dev-interview-guide/computer-networks/',
  },
  {
    icon: '🗄️',
    iconBg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)',
    title: '数据库',
    desc: 'SQL 基础、索引原理、事务与锁、Redis、MongoDB',
    tags: ['MySQL', 'Redis', '索引', '事务'],
    link: '/dev-interview-guide/databases/',
  },
  {
    icon: '🏗️',
    iconBg: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
    title: '系统设计',
    desc: '分布式系统、微服务、消息队列、缓存策略、CAP 定理',
    tags: ['分布式', '缓存', 'MQ'],
    link: '/dev-interview-guide/system-design/',
  },
  {
    icon: '💬',
    iconBg: 'linear-gradient(135deg, #e0f2f1, #b2dfdb)',
    title: '编程语言',
    desc: 'Java / Go / Python 语言特性、并发模型、GC 机制',
    tags: ['Java', 'Go', 'Python'],
    link: '/dev-interview-guide/programming-languages/',
  },
  {
    icon: '🔗',
    iconBg: 'linear-gradient(135deg, #e8eaf6, #c5cae9)',
    title: 'Web & 框架',
    desc: 'RESTful API、GraphQL、认证授权、Spring / Express',
    tags: ['REST', 'Auth', 'Spring'],
    link: '/dev-interview-guide/web-and-frameworks/',
  },
  {
    icon: '⚙️',
    iconBg: 'linear-gradient(135deg, #efebe9, #d7ccc8)',
    title: 'DevOps & 工程实践',
    desc: 'Docker、K8s、CI/CD、监控日志、性能优化',
    tags: ['Docker', 'K8s', 'CI/CD'],
    link: '/dev-interview-guide/devops/',
  },
]
</script>

<style scoped>
.dig-home {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px 40px;
}
</style>
