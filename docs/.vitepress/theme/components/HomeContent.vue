<template>
  <div class="ghd-home">
    <!-- Hero -->
    <div class="ghd-hero">
      <div class="ghd-hero__inner">
        <h1 class="ghd-hero__title">程序员面试手册</h1>
        <p class="ghd-hero__desc">系统化的程序员面试知识体系，涵盖算法、系统设计、数据库等 8 大领域</p>
      </div>
    </div>

    <!-- Main content -->
    <div class="ghd-content">
      <!-- Featured topic -->
      <div class="ghd-featured">
        <a :href="featured.link" class="ghd-featured__card">
          <div class="ghd-featured__head">
            <svg class="ghd-featured__icon" viewBox="0 0 16 16" width="24" height="24" fill="currentColor">
              <path d="M7.998 0a8 8 0 1 1 0 16 8 8 0 0 1 0-16ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7.25-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7.25 8.25v-3.5a.75.75 0 0 1 1.5 0Z"></path>
            </svg>
            <span class="ghd-featured__label">热门</span>
          </div>
          <h3 class="ghd-featured__title">{{ featured.title }}</h3>
          <p class="ghd-featured__desc">{{ featured.desc }}</p>
        </a>
      </div>

      <!-- Topic list -->
      <h2 class="ghd-section-title">全部文档</h2>
      <div class="ghd-topics">
        <a
          v-for="topic in topics"
          :key="topic.link"
          :href="topic.link"
          class="ghd-topic"
        >
          <div class="ghd-topic__icon-wrap" v-html="topic.svg">
          </div>
          <div class="ghd-topic__body">
            <h3 class="ghd-topic__title">{{ topic.title }}</h3>
            <p class="ghd-topic__desc">{{ topic.desc }}</p>
          </div>
          <svg class="ghd-topic__arrow" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path>
          </svg>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const featured = {
  title: 'AI 技术',
  desc: 'Transformer 架构、大语言模型原理、RAG 检索增强生成、Prompt Engineering、AI Agent 智能体',
  link: '/dev-interview-guide/ai-technology/',
}

const topics = [
  {
    title: '数据结构与算法',
    desc: '二叉树、哈希表、排序、动态规划等核心知识与高频真题',
    link: '/dev-interview-guide/data-structures-and-algorithms/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M4 4a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm2-3.5a3.5 3.5 0 0 0-2.834 5.54L.414 8.793A1.5 1.5 0 0 0 0 9.854V13.5A1.5 1.5 0 0 0 1.5 15h1A1.5 1.5 0 0 0 4 13.5v-1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 0 1.5 1.5h1a1.5 1.5 0 0 0 1.5-1.5V9.854a1.5 1.5 0 0 0-.414-1.06L12.834 6.04A3.5 3.5 0 0 0 6 .5ZM1.5 9.854 4.354 7H11.5l3 2.854V13.5h-1v-1A2 2 0 0 0 11.5 10.5h-7A2 2 0 0 0 2.5 12.5v1h-1V9.854Z"></path></svg>',
  },
  {
    title: '操作系统',
    desc: '进程与线程、内存管理、死锁、调度算法、IO 模型',
    link: '/dev-interview-guide/operating-systems/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v3.585a.746.746 0 0 1 0 .83v5.085A1.75 1.75 0 0 1 14.25 13H3.166l-2.573 2.12A.502.502 0 0 1 0 14.777V1.75ZM1.75 1.5a.25.25 0 0 0-.25.25v11.535l1.515-1.25h11.235a.25.25 0 0 0 .25-.25V6.5h-4.75A1.75 1.75 0 0 1 8 4.75V1.5ZM9.5 1.5V4.75c0 .138.112.25.25.25h3.15L9.5 1.5Z"></path></svg>',
  },
  {
    title: '计算机网络',
    desc: 'TCP/UDP、HTTP/HTTPS、DNS、WebSocket 协议原理',
    link: '/dev-interview-guide/computer-networks/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Zm-5.944 1.5A11.151 11.151 0 0 0 5.58 13.4c.18.304.373.592.571.858a6.504 6.504 0 0 1-4.638-4.958Zm8.728 0a6.504 6.504 0 0 1-4.638 4.958c.198-.266.39-.554.571-.858a11.15 11.15 0 0 0 1.304-4.1Zm1.457-1.5a6.504 6.504 0 0 0-4.638-4.958c.198.266.39.554.571.858a11.15 11.15 0 0 0 1.304 4.1ZM4.276 7.25a11.15 11.15 0 0 1 1.304-4.1c.18-.304.373-.592.571-.858A6.504 6.504 0 0 0 1.513 7.25Z"></path></svg>',
  },
  {
    title: '数据库',
    desc: 'SQL 基础、索引原理、事务与锁、Redis 缓存',
    link: '/dev-interview-guide/databases/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M2.5 3.5c0-.133.058-.318.282-.55.227-.237.592-.476 1.063-.7C4.806 1.792 6.043 1.5 7.5 1.5s2.694.292 3.655.75c.471.224.836.463 1.063.7.224.232.282.417.282.55 0 .133-.058.318-.282.55-.227.237-.592.476-1.063.7C10.194 5.208 8.957 5.5 7.5 5.5s-2.694-.292-3.655-.75c-.471-.224-.836-.463-1.063-.7C2.558 3.818 2.5 3.633 2.5 3.5ZM1 3.5c0 1.036.882 1.845 1.904 2.396C4.004 6.447 5.672 6.997 7.5 7v4.5c-1.828-.003-3.496-.553-4.596-1.104C1.882 9.845 1 9.036 1 8V3.5Zm13 0c0 1.036-.882 1.845-1.904 2.396-.46.22-.978.398-1.535.532A7.42 7.42 0 0 1 9 6.808V11.5c1.195-.124 2.268-.498 3.096-.912C13.118 9.845 14 9.036 14 8V3.5ZM7.5 0C3.642 0 1 1.567 1 3.5v8.5c0 1.936 2.642 3.5 6.5 3.5s6.5-1.564 6.5-3.5v-8.5C14 1.567 11.358 0 7.5 0Z"></path></svg>',
  },
  {
    title: '系统设计',
    desc: '缓存策略、限流熔断、消息队列、微服务架构',
    link: '/dev-interview-guide/system-design/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M2.5 1.75v11.5c0 .138.112.25.25.25h3.17a.75.75 0 0 1 0 1.5H2.75A1.75 1.75 0 0 1 1 13.25V1.75C1 .784 1.784 0 2.75 0h8.5C12.216 0 13 .784 13 1.75v5.5a.75.75 0 0 1-1.5 0V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM4.75 4h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM4 7.75A.75.75 0 0 1 4.75 7h2a.75.75 0 0 1 0 1.5h-2A.75.75 0 0 1 4 7.75Zm11.774 3.537a.75.75 0 0 0-1.048-1.074L11.19 13.6l-1.405-1.671a.75.75 0 0 0-1.15.962l1.9 2.262a.75.75 0 0 0 1.1.056l4.139-3.893Z"></path></svg>',
  },
  {
    title: '工程实践',
    desc: '分布式 ID 生成、Docker 容器化部署',
    link: '/dev-interview-guide/engineering-practice/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path></svg>',
  },
  {
    title: '编程语言',
    desc: 'Java / Go / Python 语言特性、并发模型、GC 机制',
    link: '/dev-interview-guide/programming-languages/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L10.94 8 9.22 6.28a.75.75 0 0 1 0-1.06ZM6.78 6.28 5.06 8l1.72 1.72a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-2-2a.75.75 0 0 1 0-1.06l2-2a.75.75 0 0 1 1.06 0Z"></path></svg>',
  },
  {
    title: 'Web 与框架',
    desc: 'RESTful API、GraphQL、OAuth/JWT、Spring / Express',
    link: '/dev-interview-guide/web-and-frameworks/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25ZM3.5 6a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 3.5 6Zm.75 2.25a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5Z"></path></svg>',
  },
]
</script>

<style scoped>
/* ---- Hero ---- */
.ghd-home {
  margin: 0;
}

.ghd-hero {
  background: linear-gradient(135deg, #ddf4ff 0%, #e8f0fe 50%, #f0eef8 100%);
  padding: 56px 24px 48px;
  text-align: center;
  border-bottom: 1px solid var(--gh-border, #d1d9e0);
}

.ghd-hero__inner {
  max-width: 640px;
  margin: 0 auto;
}

.ghd-hero__title {
  font-size: 40px;
  font-weight: 600;
  color: var(--gh-fg-default, #1f2328);
  margin: 0 0 12px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  border: none !important;
}

.ghd-hero__desc {
  font-size: 16px;
  color: var(--gh-fg-muted, #59636e);
  margin: 0;
  line-height: 1.5;
}

/* ---- Content ---- */
.ghd-content {
  max-width: 1012px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

/* ---- Featured ---- */
.ghd-featured {
  margin-bottom: 32px;
}

.ghd-featured__card {
  display: block;
  background: var(--gh-bg-card, #fff);
  border: 1px solid var(--gh-accent, #0969da);
  border-radius: var(--gh-radius, 6px);
  padding: 24px;
  text-decoration: none !important;
  color: inherit !important;
  transition: box-shadow 0.15s;
}

.ghd-featured__card:hover {
  box-shadow: var(--gh-shadow-md, 0 3px 6px rgba(140, 149, 159, 0.15));
}

.ghd-featured__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.ghd-featured__icon {
  color: var(--gh-accent, #0969da);
}

.ghd-featured__label {
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background: var(--gh-accent, #0969da);
  padding: 0 8px;
  line-height: 22px;
  border-radius: 2em;
}

.ghd-featured__title {
  font-size: 20px;
  font-weight: 600;
  color: var(--gh-accent, #0969da);
  margin: 0 0 8px;
  border: none !important;
}

.ghd-featured__desc {
  font-size: 14px;
  color: var(--gh-fg-muted, #656d76);
  line-height: 1.5;
  margin: 0;
}

/* ---- Section Title ---- */
.ghd-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--gh-fg-default, #1f2328);
  margin: 0 0 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--gh-border, #d8d8d4);
}

/* ---- Topics ---- */
.ghd-topics {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--gh-border, #d8d8d4);
  border-radius: var(--gh-radius, 6px);
  overflow: hidden;
}

.ghd-topic {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  text-decoration: none !important;
  color: inherit !important;
  border-bottom: 1px solid var(--gh-border, #d8d8d4);
  transition: background 0.1s;
}

.ghd-topic:last-child {
  border-bottom: none;
}

.ghd-topic:hover {
  background: var(--gh-bg-subtle, #f4f2ef);
}

.ghd-topic__icon-wrap {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gh-bg-subtle, #f4f2ef);
  border-radius: var(--gh-radius, 6px);
  color: var(--gh-fg-muted, #656d76);
}

.ghd-topic__body {
  flex-grow: 1;
  min-width: 0;
}

.ghd-topic__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--gh-accent, #0969da);
  margin: 0 0 2px;
  border: none !important;
}

.ghd-topic__desc {
  font-size: 14px;
  color: var(--gh-fg-muted, #656d76);
  line-height: 1.5;
  margin: 0;
}

.ghd-topic__arrow {
  flex-shrink: 0;
  color: var(--gh-fg-subtle, #6e7781);
  transition: color 0.1s;
}

.ghd-topic:hover .ghd-topic__arrow {
  color: var(--gh-accent, #0969da);
}

/* ---- Responsive ---- */
@media (max-width: 544px) {
  .ghd-hero__title {
    font-size: 28px;
  }

  .ghd-topic__desc {
    display: none;
  }
}

/* ---- Dark mode ---- */
:global(.dark) .ghd-hero {
  background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1a1533 100%);
  border-bottom-color: var(--gh-border, #3d444d);
}

:global(.dark) .ghd-hero__title {
  color: #e6edf3;
}

:global(.dark) .ghd-hero__desc {
  color: #9198a1;
}
</style>
