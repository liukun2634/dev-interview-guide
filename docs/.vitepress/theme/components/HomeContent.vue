<template>
  <div class="ghd-home">
    <!-- Hero with search -->
    <div class="ghd-hero">
      <div class="ghd-hero__inner">
        <h1 class="ghd-hero__title">程序员面试手册</h1>
        <p class="ghd-hero__desc">系统化的程序员面试知识体系，涵盖算法、系统设计、数据库等 8 大领域</p>
        <div class="ghd-hero__search" @click="focusSearch">
          <svg class="ghd-hero__search-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path>
          </svg>
          <span class="ghd-hero__search-text">搜索文档</span>
          <span class="ghd-hero__search-key">/</span>
        </div>
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
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path></svg>',
  },
  {
    title: '操作系统',
    desc: '进程与线程、内存管理、死锁、调度算法、IO 模型',
    link: '/dev-interview-guide/operating-systems/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25ZM6.5 6.5v8h7.75a.25.25 0 0 0 .25-.25V6.5Zm8-1.5V1.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25V5ZM5 14.5v-8H1.5v7.75c0 .138.112.25.25.25Z"></path></svg>',
  },
  {
    title: '计算机网络',
    desc: 'TCP/UDP、HTTP/HTTPS、DNS、WebSocket 协议原理',
    link: '/dev-interview-guide/computer-networks/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L12.19 4l-1.47-1.47a.75.75 0 0 1 0-1.06l.001-.003Z"></path></svg>',
  },
  {
    title: '数据库',
    desc: 'SQL 基础、索引原理、事务与锁、Redis 缓存',
    link: '/dev-interview-guide/databases/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M1 3.5c0-.626.292-1.165.7-1.59.406-.422.885-.733 1.37-.965C4.045.488 5.218.25 6.5.25c1.282 0 2.455.238 3.43.695.485.232.964.543 1.37.965.408.425.7.964.7 1.59v9c0 .626-.292 1.165-.7 1.59-.406.422-.885.733-1.37.965-.975.457-2.148.695-3.43.695-1.282 0-2.455-.238-3.43-.695-.485-.232-.964-.543-1.37-.965C1.292 13.665 1 13.126 1 12.5Zm1.5 0c0 .128.09.36.381.645.29.282.749.568 1.339.8.59.232 1.29.38 2.03.43l.25.005V3.12c-.74.05-1.44.198-2.03.43-.59.232-1.05.518-1.339.8-.29.285-.381.517-.381.65ZM6.5 7h.75v2.25H6.5c-1.282 0-2.455-.238-3.43-.695A4.987 4.987 0 0 1 2.5 8.12V9.88c.29.238.621.442.97.614.975.457 2.148.695 3.43.695h.35V7Z"></path></svg>',
  },
  {
    title: '系统设计',
    desc: '缓存策略、限流熔断、消息队列、微服务架构',
    link: '/dev-interview-guide/system-design/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M6 2a.75.75 0 0 1 .696.471L10 10.731l1.304-3.26A.751.751 0 0 1 12 7h3.25a.75.75 0 0 1 0 1.5h-2.742l-1.812 4.528a.751.751 0 0 1-1.392 0L6 4.77 4.696 8.03A.75.75 0 0 1 4 8.5H.75a.75.75 0 0 1 0-1.5h2.742L5.304 2.47A.751.751 0 0 1 6 2Z"></path></svg>',
  },
  {
    title: '工程实践',
    desc: '分布式 ID 生成、Docker 容器化部署',
    link: '/dev-interview-guide/engineering-practice/',
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.25a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path></svg>',
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
    svg: '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Zm-5.944 1.5A11.151 11.151 0 0 0 5.58 13.4c.18.304.373.592.571.858a6.504 6.504 0 0 1-4.638-4.958Zm8.728 0a6.504 6.504 0 0 1-4.638 4.958c.198-.266.39-.554.571-.858a11.15 11.15 0 0 0 1.304-4.1Zm1.457-1.5a6.504 6.504 0 0 0-4.638-4.958c.198.266.39.554.571.858a11.15 11.15 0 0 0 1.304 4.1ZM4.276 7.25a11.15 11.15 0 0 1 1.304-4.1c.18-.304.373-.592.571-.858A6.504 6.504 0 0 0 1.513 7.25Z"></path></svg>',
  },
]

function focusSearch() {
  // Trigger VitePress search
  const btn = document.querySelector('.VPNavBarSearchButton') as HTMLElement
    || document.querySelector('.DocSearch-Button') as HTMLElement
  if (btn) btn.click()
}
</script>

<style scoped>
/* ---- Hero ---- */
.ghd-home {
  margin: 0;
}

.ghd-hero {
  background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
  padding: 48px 24px 56px;
  text-align: center;
}

.ghd-hero__inner {
  max-width: 640px;
  margin: 0 auto;
}

.ghd-hero__title {
  font-size: 40px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  border: none !important;
}

.ghd-hero__desc {
  font-size: 16px;
  color: #8b949e;
  margin: 0 0 32px;
  line-height: 1.5;
}

.ghd-hero__search {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  transition: border-color 0.15s;
  min-width: 300px;
  position: relative;
}

.ghd-hero__search:hover {
  border-color: #58a6ff;
}

.ghd-hero__search-icon {
  color: #8b949e;
  flex-shrink: 0;
}

.ghd-hero__search-text {
  font-size: 14px;
  color: #484f58;
  flex-grow: 1;
  text-align: left;
}

.ghd-hero__search-key {
  font-size: 12px;
  color: #484f58;
  border: 1px solid #30363d;
  border-radius: 4px;
  padding: 1px 6px;
  font-family: var(--gh-font-mono, monospace);
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

  .ghd-hero__search {
    min-width: auto;
    width: 100%;
  }

  .ghd-topic__desc {
    display: none;
  }
}

/* ---- Dark mode ---- */
:global(.dark) .ghd-hero {
  background: linear-gradient(180deg, #010409 0%, #0d1117 100%);
}

:global(.dark) .ghd-hero__search {
  background: #161b22;
  border-color: #30363d;
}

:global(.dark) .ghd-hero__search:hover {
  border-color: #58a6ff;
}
</style>
