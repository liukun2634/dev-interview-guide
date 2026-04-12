<template>
  <div class="dig-home">
    <div class="dig-home__intro">
      <p class="dig-home__lead">
        覆盖 <strong>{{ domains.length }}</strong> 大核心领域，从数据结构到系统设计，
        每篇文章包含<em>知识讲解</em>、<em>代码示例</em>与<em>高频真题</em>。
      </p>
    </div>

    <div class="dig-domains">
      <a
        v-for="(domain, index) in domains"
        :key="domain.link"
        :href="domain.link"
        class="dig-domain-card"
        :style="{ animationDelay: `${index * 0.06 + 0.1}s` }"
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
    icon: '{}',
    iconBg: 'linear-gradient(135deg, #e6f2ef, #d0e8e2)',
    title: '数据结构与算法',
    desc: '数组、链表、树、图、排序、动态规划等核心知识与高频真题',
    tags: ['数组', '树', 'DP', '图', '排序'],
    link: '/dev-interview-guide/data-structures-and-algorithms/',
  },
  {
    icon: '>>',
    iconBg: 'linear-gradient(135deg, #e8edf4, #d5dde8)',
    title: '操作系统',
    desc: '进程与线程、内存管理、死锁、调度算法、IO 模型',
    tags: ['进程', '内存', '死锁', 'IO'],
    link: '/dev-interview-guide/operating-systems/',
  },
  {
    icon: '</>',
    iconBg: 'linear-gradient(135deg, #f2ece0, #e8dfd0)',
    title: '计算机网络',
    desc: 'TCP/UDP、HTTP/HTTPS、DNS、WebSocket、负载均衡',
    tags: ['TCP', 'HTTP', 'DNS'],
    link: '/dev-interview-guide/computer-networks/',
  },
  {
    icon: '[ ]',
    iconBg: 'linear-gradient(135deg, #f0e8ec, #e4d8de)',
    title: '数据库',
    desc: 'SQL 基础、索引原理、事务与锁、Redis、MongoDB',
    tags: ['MySQL', 'Redis', '索引', '事务'],
    link: '/dev-interview-guide/databases/',
  },
  {
    icon: '::',
    iconBg: 'linear-gradient(135deg, #ede8f2, #ddd4e8)',
    title: '系统设计',
    desc: '分布式系统、微服务、消息队列、缓存策略、CAP 定理',
    tags: ['分布式', '缓存', 'MQ'],
    link: '/dev-interview-guide/system-design/',
  },
  {
    icon: 'fn',
    iconBg: 'linear-gradient(135deg, #e4efed, #d1e4e0)',
    title: '编程语言',
    desc: 'Java / Go / Python 语言特性、并发模型、GC 机制',
    tags: ['Java', 'Go', 'Python'],
    link: '/dev-interview-guide/programming-languages/',
  },
  {
    icon: '//',
    iconBg: 'linear-gradient(135deg, #e8eaf2, #d4d7e4)',
    title: 'Web & 框架',
    desc: 'RESTful API、GraphQL、认证授权、Spring / Express',
    tags: ['REST', 'Auth', 'Spring'],
    link: '/dev-interview-guide/web-and-frameworks/',
  },
  {
    icon: '$_',
    iconBg: 'linear-gradient(135deg, #edeae4, #ddd8ce)',
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
  padding: 0 24px 48px;
}

.dig-home__intro {
  margin-bottom: 8px;
}

.dig-home__lead {
  font-size: 15px;
  color: var(--dig-ink-muted, #8e8e93);
  line-height: 1.7;
  max-width: 560px;
}

.dig-home__lead strong {
  color: var(--dig-accent, #1a6b5a);
  font-weight: 600;
}

.dig-home__lead em {
  font-style: normal;
  border-bottom: 1px dashed var(--dig-rule, #d6d3cd);
}

/* Card entrance animation */
@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dig-domain-card {
  animation: cardFadeIn 0.45s ease-out both;
}
</style>
