# 浅绿自然主题 UI 重设计 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Dev Interview Guide (程序员面试手册) VitePress site with a light-green natural theme, featuring AI section as a visually prominent wide card, card-style article layout, minimal code blocks, and full-expand sidebar.

**Architecture:** Complete CSS rewrite with new green design tokens, simplified HomeContent.vue with AI-wide-card grid layout, remove ReadingProgress component, update config for new branding and sidebar defaults.

**Tech Stack:** VitePress 1.6.4, Vue 3, CSS custom properties, Google Fonts (Inter, JetBrains Mono, Noto Sans SC)

---

### File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `docs/.vitepress/theme/custom.css` | Rewrite | All design tokens, layout, typography, components |
| `docs/.vitepress/theme/components/HomeContent.vue` | Rewrite | Homepage with AI wide-card grid |
| `docs/.vitepress/theme/index.ts` | Modify | Remove ReadingProgress, simplify |
| `docs/.vitepress/theme/components/ReadingProgress.vue` | Delete | No longer needed |
| `docs/.vitepress/config.ts` | Modify | Theme color, sidebar collapsed, site title |
| `docs/index.md` | Modify | Update hero name to 程序员面试手册 |

---

### Task 1: Delete ReadingProgress and simplify theme entry

**Files:**
- Delete: `docs/.vitepress/theme/components/ReadingProgress.vue`
- Modify: `docs/.vitepress/theme/index.ts`

- [ ] **Step 1: Delete ReadingProgress.vue**

```bash
rm docs/.vitepress/theme/components/ReadingProgress.vue
```

- [ ] **Step 2: Simplify index.ts**

Replace the entire contents of `docs/.vitepress/theme/index.ts` with:

```typescript
import DefaultTheme from 'vitepress/theme'
import HomeContent from './components/HomeContent.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeContent', HomeContent)
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/theme/index.ts docs/.vitepress/theme/components/ReadingProgress.vue
git commit -m "refactor: remove ReadingProgress, simplify theme entry"
```

---

### Task 2: Update config.ts and index.md

**Files:**
- Modify: `docs/.vitepress/config.ts`
- Modify: `docs/index.md`

- [ ] **Step 1: Update config.ts**

Make these changes to `docs/.vitepress/config.ts`:

1. Change `theme-color` meta tag from `#0d9488` to `#059669`:
```typescript
['meta', { name: 'theme-color', content: '#059669' }],
```

2. Change all sidebar sections to `collapsed: false`:
```typescript
// For each sidebar section, set:
collapsed: false,
```

The sections that currently have `collapsed: true` are: 操作系统, 计算机网络, 数据库, 系统设计与工程实践, 编程语言, Web 与框架, AI 技术. Change all of them to `collapsed: false`.

- [ ] **Step 2: Update index.md hero**

Replace the hero section of `docs/index.md`:

```markdown
---
layout: home

hero:
  name: 程序员面试手册
  text: Dev Interview Guide
  tagline: 结构化知识体系 — 从基础概念到高频真题，系统掌握面试核心考点
  actions:
    - theme: brand
      text: 开始阅读
      link: /data-structures-and-algorithms/
    - theme: alt
      text: GitHub
      link: https://github.com/liukun2634/dev-interview-guide
---

<HomeContent />
```

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/config.ts docs/index.md
git commit -m "feat: update branding to 程序员面试手册, expand all sidebar sections"
```

---

### Task 3: Rewrite HomeContent.vue with AI wide-card

**Files:**
- Rewrite: `docs/.vitepress/theme/components/HomeContent.vue`

- [ ] **Step 1: Replace HomeContent.vue**

Replace the entire contents of `docs/.vitepress/theme/components/HomeContent.vue` with:

```vue
<template>
  <section class="dig-home">
    <p class="dig-section-title">知识领域</p>
    <div class="dig-domains">
      <!-- AI wide card (spans 2 columns) -->
      <a
        :href="aiDomain.link"
        class="dig-domain-card dig-domain-card--ai"
      >
        <div class="dig-domain-card__top">
          <div class="dig-domain-card__title">{{ aiDomain.title }}</div>
          <span class="dig-domain-card__hot">HOT</span>
        </div>
        <div class="dig-domain-card__desc">{{ aiDomain.desc }}</div>
        <div class="dig-domain-card__topics">
          <span v-for="t in aiDomain.topics" :key="t" class="dig-domain-card__topic">{{ t }}</span>
        </div>
        <div class="dig-domain-card__meta">{{ aiDomain.meta }}</div>
      </a>

      <!-- Standard cards -->
      <a
        v-for="d in domains"
        :key="d.link"
        :href="d.link"
        class="dig-domain-card"
      >
        <div class="dig-domain-card__title">{{ d.title }}</div>
        <div class="dig-domain-card__desc">{{ d.desc }}</div>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
const aiDomain = {
  title: 'AI 技术',
  desc: '掌握 AI 面试核心，从 Transformer 原理到生产实战',
  topics: ['LLM 基础', 'RAG 检索增强', 'Prompt Engineering', 'AI Agent'],
  meta: '4 篇深度文章 · 12 道面试真题',
  link: '/dev-interview-guide/ai-technology/',
}

const domains = [
  {
    title: '数据结构与算法',
    desc: '二叉树、哈希表、排序、动态规划、图论等核心知识与高频真题',
    link: '/dev-interview-guide/data-structures-and-algorithms/',
  },
  {
    title: '操作系统',
    desc: '进程与线程、内存管理、死锁、调度算法、IO 模型详解',
    link: '/dev-interview-guide/operating-systems/',
  },
  {
    title: '计算机网络',
    desc: 'TCP/UDP、HTTP/HTTPS、DNS、WebSocket 等协议原理',
    link: '/dev-interview-guide/computer-networks/',
  },
  {
    title: '数据库',
    desc: 'SQL 基础、索引原理、事务与锁、Redis 缓存、NoSQL',
    link: '/dev-interview-guide/databases/',
  },
  {
    title: '系统设计与工程实践',
    desc: '分布式系统、缓存策略、限流熔断、Docker 容器化、微服务架构',
    link: '/dev-interview-guide/system-design/',
  },
  {
    title: '编程语言',
    desc: 'Java / Go / Python 语言特性、并发模型、GC 机制详解',
    link: '/dev-interview-guide/programming-languages/',
  },
  {
    title: 'Web 与框架',
    desc: 'RESTful API、GraphQL、OAuth/JWT 认证、Spring / Express',
    link: '/dev-interview-guide/web-and-frameworks/',
  },
]
</script>
```

- [ ] **Step 2: Commit**

```bash
git add docs/.vitepress/theme/components/HomeContent.vue
git commit -m "feat: rewrite HomeContent with AI wide-card layout"
```

---

### Task 4: Rewrite custom.css — Design Tokens & Global Base

**Files:**
- Rewrite: `docs/.vitepress/theme/custom.css`

This is the largest task. The entire 1212-line CSS file is replaced. Write the file in one pass with all sections below.

- [ ] **Step 1: Write complete custom.css**

Replace the entire contents of `docs/.vitepress/theme/custom.css` with the CSS below. This is the full file — write it all at once.

```css
/* ============================================================
   程序员面试手册 — 浅绿自然主题
   Light green natural theme optimized for long reading sessions
   ============================================================ */

/* ---------- Web Fonts ---------- */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400&family=Noto+Sans+SC:wght@400;500;600;700&display=swap');

/* ============================================================
   Design Tokens
   ============================================================ */
:root {
  /* Green palette */
  --dig-green-50:  #f0fdf4;
  --dig-green-100: #ecfdf5;
  --dig-green-200: #d1fae5;
  --dig-green-300: #a7f3d0;
  --dig-green-400: #34d399;
  --dig-green-500: #10b981;
  --dig-green-600: #059669;
  --dig-green-700: #047857;
  --dig-green-800: #065f46;
  --dig-green-900: #064e3b;

  /* Semantic */
  --dig-bg:            #f6faf6;
  --dig-bg-card:       #ffffff;
  --dig-bg-soft:       #f0fdf4;
  --dig-border:        #e5e7eb;
  --dig-border-strong: #d1d5db;

  --dig-text:   #1f2937;
  --dig-text-2: #4b5563;
  --dig-text-3: #9ca3af;

  --dig-accent:       #059669;
  --dig-accent-hover: #047857;
  --dig-accent-light: #ecfdf5;
  --dig-accent-soft:  rgba(5, 150, 105, 0.08);

  /* Code blocks */
  --dig-code-bg:  #f8fafc;
  --dig-code-bar: #f1f5f9;

  /* Radius */
  --dig-radius: 8px;

  /* Status colors */
  --dig-status-green:    #16a34a;
  --dig-status-green-bg: #f0fdf4;
  --dig-status-amber:    #d97706;
  --dig-status-amber-bg: #fffbeb;
  --dig-status-red:      #dc2626;
  --dig-status-red-bg:   #fef2f2;
  --dig-status-blue:     #2563eb;
  --dig-status-blue-bg:  #eff6ff;
  --dig-status-orange:   #ea580c;
  --dig-status-orange-bg:#fff7ed;

  /* Typography */
  --vp-font-family-base: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --vp-font-family-mono: 'JetBrains Mono', Consolas, ui-monospace, monospace;

  /* VitePress overrides */
  --vp-c-brand-1:    var(--dig-accent);
  --vp-c-brand-2:    var(--dig-accent-hover);
  --vp-c-brand-3:    var(--dig-green-500);
  --vp-c-brand-soft: var(--dig-accent-soft);

  --vp-c-bg:      var(--dig-bg);
  --vp-c-bg-alt:  var(--dig-bg-soft);
  --vp-c-bg-elv:  var(--dig-bg-card);
  --vp-c-bg-soft: var(--dig-bg-soft);

  --vp-c-text-1:  var(--dig-text);
  --vp-c-text-2:  var(--dig-text-2);
  --vp-c-text-3:  var(--dig-text-3);

  --vp-c-divider: var(--dig-border);
  --vp-sidebar-bg-color: var(--dig-bg-card);

  --vp-layout-max-width: 1440px;
}

/* ---------- Dark Mode ---------- */
.dark {
  --dig-bg:            #0c1210;
  --dig-bg-card:       #141f1a;
  --dig-bg-soft:       #1a2e22;
  --dig-border:        #2d4a3a;
  --dig-border-strong: #3d5a4a;

  --dig-text:   #e5e7eb;
  --dig-text-2: #9ca3af;
  --dig-text-3: #6b7280;

  --dig-accent-light: #1a2e22;
  --dig-accent-soft:  rgba(5, 150, 105, 0.15);

  --dig-code-bg:  #1a2e22;
  --dig-code-bar: #0c1210;

  --dig-status-green-bg: #052e16;
  --dig-status-amber-bg: #1c1400;
  --dig-status-red-bg:   #1a0505;
  --dig-status-blue-bg:  #0d1b3e;
  --dig-status-orange-bg:#1a0c00;

  --vp-c-bg:      var(--dig-bg);
  --vp-c-bg-alt:  var(--dig-bg-soft);
  --vp-c-bg-elv:  var(--dig-bg-card);
  --vp-c-bg-soft: var(--dig-bg-soft);
  --vp-c-text-1:  var(--dig-text);
  --vp-c-text-2:  var(--dig-text-2);
  --vp-c-text-3:  var(--dig-text-3);
  --vp-c-divider: var(--dig-border);
  --vp-sidebar-bg-color: var(--dig-bg-card);
}

/* ============================================================
   Global Base
   ============================================================ */
*, *::before, *::after { box-sizing: border-box; }

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

::selection {
  background: var(--dig-green-200);
  color: var(--dig-green-900);
}

.dark ::selection {
  background: var(--dig-green-800);
  color: var(--dig-green-100);
}

/* ============================================================
   Navigation
   ============================================================ */
.VPNav {
  border-bottom: 1px solid var(--dig-border) !important;
  background: var(--dig-bg-card) !important;
}

.VPNavBar {
  background: var(--dig-bg-card) !important;
}

.VPNavBar .title {
  font-size: 15px !important;
  font-weight: 700;
  color: var(--dig-text) !important;
}

.VPNavBar .VPNavBarMenu .VPNavBarMenuLink {
  font-size: 14px;
  font-weight: 500;
  color: var(--dig-text-2);
  transition: color 0.15s;
}

.VPNavBar .VPNavBarMenu .VPNavBarMenuLink:hover,
.VPNavBar .VPNavBarMenu .VPNavBarMenuLink.active {
  color: var(--dig-accent);
}

/* ============================================================
   Sidebar
   ============================================================ */
.VPSidebar {
  border-right: 1px solid var(--dig-border) !important;
  background: var(--dig-bg-card) !important;
  padding-top: 68px !important;
}

/* Section headers */
.VPSidebarItem.level-0 > .item > .text {
  font-size: 13px;
  font-weight: 700;
  color: var(--dig-text);
  padding: 16px 0 6px;
}

/* Section divider */
.VPSidebarItem.level-0 + .VPSidebarItem.level-0 {
  border-top: 1px solid var(--dig-border);
  margin-top: 8px;
  padding-top: 4px;
}

/* Leaf items */
.VPSidebarItem .text {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--dig-text-2);
}

.VPSidebarItem .VPSidebarItem .item {
  padding: 3px 0;
}

/* Active leaf */
.VPSidebarItem.is-active > .item .link {
  color: var(--dig-accent) !important;
  font-weight: 600;
  background: var(--dig-accent-light);
  border-radius: 4px;
  margin: 0 -8px;
  padding: 2px 8px;
}

/* Collapse caret */
.VPSidebarItem.level-0 > .item .caret {
  color: var(--dig-text-3);
}

/* ============================================================
   Content Area — Reading Optimization
   ============================================================ */
.VPContent .vp-doc {
  max-width: 860px;
}

/* Card-style content wrapper */
.VPDoc .container .content {
  background: var(--dig-bg-card);
  border: 1px solid var(--dig-border);
  border-radius: var(--dig-radius);
  padding: 32px 40px;
  margin: 24px 0;
}

.vp-doc {
  font-size: 16px;
  line-height: 1.85;
  color: var(--dig-text);
  -webkit-font-smoothing: antialiased;
}

/* ============================================================
   Headings
   ============================================================ */
.vp-doc h1 {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.25;
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--dig-green-800);
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--dig-border);
}

.dark .vp-doc h1 {
  color: var(--dig-green-300);
}

.vp-doc h2 {
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.35;
  margin-top: 2.5rem;
  margin-bottom: 0.75rem;
  color: var(--dig-text);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--dig-border);
}

.vp-doc h3 {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  color: var(--dig-text);
}

.vp-doc h4 {
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--dig-text-2);
}

/* Heading anchors */
.vp-doc h1 .header-anchor,
.vp-doc h2 .header-anchor,
.vp-doc h3 .header-anchor {
  opacity: 0;
  transition: opacity 0.15s;
  color: var(--dig-text-3);
  text-decoration: none !important;
}

.vp-doc h1:hover .header-anchor,
.vp-doc h2:hover .header-anchor,
.vp-doc h3:hover .header-anchor {
  opacity: 1;
}

/* ============================================================
   Paragraph & Inline Text
   ============================================================ */
.vp-doc p { margin-bottom: 1.25em; }

.vp-doc strong {
  font-weight: 600;
  color: var(--dig-text);
}

/* ============================================================
   Links
   ============================================================ */
.vp-doc a {
  color: var(--dig-accent);
  text-decoration: underline;
  text-decoration-color: rgba(5, 150, 105, 0.3);
  text-underline-offset: 3px;
  font-weight: 500;
  transition: color 0.15s, text-decoration-color 0.15s;
}

.vp-doc a:hover {
  color: var(--dig-accent-hover);
  text-decoration-color: var(--dig-accent-hover);
}

/* ============================================================
   Code Blocks — Minimal white with language label
   ============================================================ */
.vp-doc div[class*='language-'] {
  background-color: var(--dig-code-bg) !important;
  border: 1px solid var(--dig-border);
  border-radius: var(--dig-radius);
  overflow: hidden;
  position: relative;
  margin: 1.5rem 0;
}

/* Top bar — clean, no macOS dots */
.vp-doc div[class*='language-']::before {
  content: '';
  display: block;
  height: 36px;
  background: var(--dig-code-bar);
  border-bottom: 1px solid var(--dig-border);
}

.vp-doc div[class*='language-'] > pre {
  background: transparent !important;
  padding-top: 8px !important;
}

.vp-doc div[class*='language-'] code {
  font-family: var(--vp-font-family-mono);
  font-size: 13.5px;
  line-height: 1.75;
}

/* Language label */
.vp-doc div[class*='language-'] > span.lang {
  position: absolute;
  top: 9px;
  left: 16px;
  color: var(--dig-text-3);
  font-size: 12px;
  font-family: var(--vp-font-family-base);
  font-weight: 500;
  z-index: 2;
}

/* Copy button */
.vp-doc div[class*='language-'] .copy {
  top: 5px !important;
  right: 12px !important;
  background: var(--dig-bg-card) !important;
  border: 1px solid var(--dig-border) !important;
  border-radius: 4px !important;
  opacity: 0 !important;
  transition: opacity 0.2s !important;
}

.vp-doc div[class*='language-']:hover .copy {
  opacity: 1 !important;
}

/* Inline code */
.vp-doc :not(pre) > code {
  background: var(--dig-bg-soft);
  border: 1px solid var(--dig-border);
  border-radius: 4px;
  padding: 1px 7px;
  font-size: 0.875em;
  font-family: var(--vp-font-family-mono);
  color: var(--dig-accent);
  font-weight: 500;
  white-space: nowrap;
}

.dark .vp-doc :not(pre) > code {
  background: var(--dig-bg-soft);
  border-color: var(--dig-border-strong);
}

/* ============================================================
   Tables
   ============================================================ */
.vp-doc table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5rem 0;
  font-size: 14px;
  display: block;
  overflow-x: auto;
  border: 1px solid var(--dig-border);
  border-radius: var(--dig-radius);
  overflow: hidden;
}

.vp-doc table th {
  background: var(--dig-bg-soft);
  font-weight: 600;
  text-align: left;
  padding: 10px 16px;
  border-bottom: 1.5px solid var(--dig-border);
  font-size: 13px;
  color: var(--dig-text-2);
  white-space: nowrap;
}

.vp-doc table td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--dig-border);
  vertical-align: top;
  line-height: 1.6;
}

.vp-doc table tr:last-child td { border-bottom: none; }

.vp-doc table tr:hover td {
  background: var(--dig-accent-soft);
}

/* ============================================================
   Blockquotes
   ============================================================ */
.vp-doc blockquote {
  border-left: 3px solid var(--dig-accent);
  padding: 0.6em 1.2em;
  margin: 1.5em 0;
  color: var(--dig-text-2);
  background: var(--dig-accent-soft);
  border-radius: 0 var(--dig-radius) var(--dig-radius) 0;
}

.vp-doc blockquote p {
  margin: 0;
  font-style: italic;
}

/* ============================================================
   Custom Blocks — Left border accent
   ============================================================ */
.vp-doc .custom-block {
  border-radius: 0 var(--dig-radius) var(--dig-radius) 0;
  padding: 14px 18px;
  margin: 1.5rem 0;
  font-size: 14.5px;
  line-height: 1.7;
  border: none;
  border-left: 4px solid transparent;
}

.vp-doc .custom-block .custom-block-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 6px;
}

.vp-doc .custom-block.tip {
  background: var(--dig-status-green-bg);
  border-left-color: var(--dig-status-green);
}
.vp-doc .custom-block.tip .custom-block-title { color: var(--dig-status-green); }

.vp-doc .custom-block.info {
  background: var(--dig-status-blue-bg);
  border-left-color: var(--dig-status-blue);
}
.vp-doc .custom-block.info .custom-block-title { color: var(--dig-status-blue); }

.vp-doc .custom-block.warning {
  background: var(--dig-status-amber-bg);
  border-left-color: var(--dig-status-amber);
}
.vp-doc .custom-block.warning .custom-block-title { color: var(--dig-status-amber); }

.vp-doc .custom-block.danger {
  background: var(--dig-status-red-bg);
  border-left-color: var(--dig-status-red);
}
.vp-doc .custom-block.danger .custom-block-title { color: var(--dig-status-red); }

/* ============================================================
   Lists
   ============================================================ */
.vp-doc ul, .vp-doc ol {
  padding-left: 1.6em;
  margin-bottom: 1.25em;
}

.vp-doc li {
  margin-bottom: 0.45em;
  line-height: 1.75;
}

.vp-doc li::marker { color: var(--dig-accent); }

/* ============================================================
   Horizontal Rules
   ============================================================ */
.vp-doc hr {
  border: none;
  height: 1px;
  background: var(--dig-border);
  margin: 2.5rem 0;
}

/* ============================================================
   Outline / TOC
   ============================================================ */
.VPDocAside .outline-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--dig-text-3);
  margin-bottom: 8px;
}

.VPDocOutlineItem .outline-link {
  font-size: 13px;
  color: var(--dig-text-3);
  line-height: 1.5;
  padding: 3px 0 3px 12px;
  border-left: 1px solid var(--dig-border);
  transition: color 0.15s, border-color 0.15s;
  text-decoration: none;
  display: block;
}

.VPDocOutlineItem .outline-link:hover,
.VPDocOutlineItem .outline-link.active {
  color: var(--dig-accent);
  border-left-color: var(--dig-accent);
}

/* ============================================================
   Doc Footer
   ============================================================ */
.VPDocFooter {
  border-top: 1px solid var(--dig-border);
  padding-top: 24px;
  margin-top: 48px;
}

.VPDocFooter .pager-link {
  border: 1px solid var(--dig-border);
  border-radius: var(--dig-radius);
  padding: 16px 20px;
  transition: border-color 0.2s;
  text-decoration: none;
}

.VPDocFooter .pager-link:hover {
  border-color: var(--dig-accent);
}

.VPDocFooter .pager-label {
  font-size: 12px;
  color: var(--dig-text-3);
  font-weight: 600;
  margin-bottom: 4px;
}

.VPDocFooter .pager-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--dig-text);
}

.VPLastUpdated {
  font-size: 13px;
  color: var(--dig-text-3);
}

/* ============================================================
   Hero (Home page)
   ============================================================ */
.VPHero {
  padding-top: 64px !important;
  padding-bottom: 48px !important;
}

.VPHero .name {
  font-size: 3.25rem !important;
  font-weight: 800 !important;
  letter-spacing: -0.03em !important;
  line-height: 1.15 !important;
  background: linear-gradient(135deg, var(--dig-green-800) 0%, var(--dig-accent) 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}

.dark .VPHero .name {
  background: linear-gradient(135deg, var(--dig-green-300) 0%, var(--dig-green-400) 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}

.VPHero .text {
  font-size: 1.6rem !important;
  font-weight: 500 !important;
  color: var(--dig-text-2) !important;
  margin-top: 8px !important;
}

.VPHero .tagline {
  font-size: 15.5px !important;
  line-height: 1.75 !important;
  color: var(--dig-text-3) !important;
  max-width: 480px;
  margin-top: 12px !important;
}

.VPHero .VPButton.brand {
  background: var(--dig-accent) !important;
  border-color: var(--dig-accent) !important;
  border-radius: var(--dig-radius) !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  padding: 9px 22px !important;
  transition: background 0.2s !important;
}

.VPHero .VPButton.brand:hover {
  background: var(--dig-accent-hover) !important;
  border-color: var(--dig-accent-hover) !important;
}

.VPHero .VPButton.alt {
  background: transparent !important;
  border: 1.5px solid var(--dig-border-strong) !important;
  color: var(--dig-text-2) !important;
  border-radius: var(--dig-radius) !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  transition: border-color 0.2s, color 0.2s !important;
}

.VPHero .VPButton.alt:hover {
  border-color: var(--dig-accent) !important;
  color: var(--dig-accent) !important;
}

/* ============================================================
   Tag System
   ============================================================ */
.dig-tag {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--vp-font-family-base);
  line-height: 1.7;
  margin: 2px 4px 2px 0;
  vertical-align: middle;
}

.dig-tag--category {
  background: var(--dig-accent-light);
  color: var(--dig-green-700);
  border: 1px solid rgba(5, 150, 105, 0.25);
}

.dig-tag--easy {
  background: var(--dig-status-green-bg);
  color: var(--dig-status-green);
  border: 1px solid rgba(22, 163, 74, 0.25);
}

.dig-tag--medium {
  background: var(--dig-status-amber-bg);
  color: var(--dig-status-amber);
  border: 1px solid rgba(217, 119, 6, 0.25);
}

.dig-tag--hard {
  background: var(--dig-status-red-bg);
  color: var(--dig-status-red);
  border: 1px solid rgba(220, 38, 38, 0.25);
}

.dig-tag--hot {
  background: var(--dig-status-orange-bg);
  color: var(--dig-status-orange);
  border: 1px solid rgba(234, 88, 12, 0.25);
}

/* ============================================================
   Interview Questions Block
   ============================================================ */
.dig-questions {
  border: 1px solid var(--dig-border);
  border-radius: var(--dig-radius);
  overflow: hidden;
  margin: 2rem 0;
}

.dig-questions__header {
  background: var(--dig-green-800);
  color: #ffffff;
  padding: 10px 18px;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark .dig-questions__header {
  background: var(--dig-green-900);
  border-bottom: 1px solid var(--dig-border);
}

.dig-questions__item {
  padding: 12px 18px 12px 42px;
  border-bottom: 1px solid var(--dig-border);
  font-size: 14px;
  line-height: 1.65;
  color: var(--dig-text);
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: background 0.12s;
}

.dig-questions__item:last-child { border-bottom: none; }

.dig-questions__item:hover { background: var(--dig-bg-soft); }

.dig-questions__item::before {
  content: 'Q';
  position: absolute;
  left: 14px;
  top: 13px;
  font-size: 9.5px;
  font-weight: 700;
  font-family: var(--vp-font-family-mono);
  color: #ffffff;
  background: var(--dig-accent);
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  flex-shrink: 0;
}

/* ============================================================
   Key Points Callout
   ============================================================ */
.dig-keypoints {
  background: var(--dig-bg-card);
  border: 1px solid var(--dig-border);
  border-radius: var(--dig-radius);
  overflow: hidden;
  margin: 2rem 0;
}

.dig-keypoints__title {
  background: var(--dig-accent);
  color: #ffffff;
  padding: 10px 18px;
  font-weight: 700;
  font-size: 13px;
}

.dig-keypoints__body {
  padding: 16px 18px;
  font-size: 14.5px;
  line-height: 1.85;
  background: var(--dig-accent-soft);
}

.dig-keypoints__body ul {
  margin: 0;
  padding-left: 1.4em;
}

.dig-keypoints__body li { margin-bottom: 6px; }

/* ============================================================
   Homepage
   ============================================================ */
.dig-home {
  max-width: 1140px;
  margin: 0 auto;
  padding: 8px 24px 64px;
}

.dig-section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--dig-text-2);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dig-section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--dig-border);
}

/* Domain Grid — 2 columns */
.dig-domains {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

/* Standard card */
.dig-domain-card {
  background: var(--dig-bg-card);
  border: 1px solid var(--dig-border);
  border-radius: var(--dig-radius);
  padding: 20px 18px;
  text-decoration: none !important;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: inherit !important;
  transition: border-color 0.2s;
}

.dig-domain-card:hover {
  border-color: var(--dig-accent);
  text-decoration: none !important;
}

.dig-domain-card__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--dig-text);
  line-height: 1.3;
}

.dig-domain-card__desc {
  font-size: 13px;
  color: var(--dig-text-3);
  line-height: 1.6;
}

/* AI wide card — spans 2 columns */
.dig-domain-card--ai {
  grid-column: span 2;
  background: linear-gradient(135deg, var(--dig-green-50), var(--dig-green-200));
  border: 2px solid var(--dig-green-400);
  padding: 24px 24px;
  gap: 10px;
}

.dark .dig-domain-card--ai {
  background: linear-gradient(135deg, var(--dig-green-900), #1a2e22);
  border-color: var(--dig-green-700);
}

.dig-domain-card--ai .dig-domain-card__title {
  font-size: 18px;
  color: var(--dig-green-800);
}

.dark .dig-domain-card--ai .dig-domain-card__title {
  color: var(--dig-green-300);
}

.dig-domain-card--ai .dig-domain-card__desc {
  font-size: 14px;
  color: var(--dig-text-2);
}

.dig-domain-card__top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dig-domain-card__hot {
  background: var(--dig-accent);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
}

.dig-domain-card__topics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dig-domain-card__topic {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(5, 150, 105, 0.2);
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--dig-green-800);
}

.dark .dig-domain-card__topic {
  background: rgba(5, 150, 105, 0.15);
  border-color: var(--dig-border);
  color: var(--dig-green-300);
}

.dig-domain-card__meta {
  font-size: 12px;
  color: var(--dig-text-3);
  margin-top: 2px;
}

/* ============================================================
   Responsive
   ============================================================ */
@media (max-width: 640px) {
  .vp-doc h1 { font-size: 1.6rem; }
  .vp-doc h2 { font-size: 1.2rem; }

  .dig-domains {
    grid-template-columns: 1fr;
  }

  .dig-domain-card--ai {
    grid-column: span 1;
  }

  .VPDoc .container .content {
    padding: 20px 16px;
    margin: 12px 0;
    border-left: none;
    border-right: none;
    border-radius: 0;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add docs/.vitepress/theme/custom.css
git commit -m "feat: complete CSS rewrite — light green natural theme"
```

---

### Task 5: Verify in browser

- [ ] **Step 1: Start dev server**

```bash
npm run docs:dev
```

- [ ] **Step 2: Verify homepage**

Open the URL shown in terminal. Check:
- Page background is light green (#f6faf6)
- AI card spans full width at top with green gradient, HOT badge, 4 topic pills
- 7 other domain cards in 2-column grid, white background, subtle border
- Hero title shows "程序员面试手册" in green gradient text
- No stats row, no features section, no card animations

- [ ] **Step 3: Verify article page**

Navigate to any article (e.g. 数据结构与算法 → 二叉树). Check:
- Content is wrapped in white card with border and rounded corners
- Code blocks have white/light background, language label top-left, copy button top-right
- No macOS red/yellow/green dots on code blocks
- Tags (分类/难度/频率) render correctly with appropriate colors
- Interview questions block has dark green header
- Tip/Info/Warning blocks use left-border accent (4px colored left border)
- Headings are clear, no uppercase transforms

- [ ] **Step 4: Verify sidebar**

Check:
- All 8 sections are expanded by default
- Sections can be collapsed by clicking
- Current article highlighted with green background
- Section headers separated by divider lines

- [ ] **Step 5: Verify dark mode**

Toggle dark mode via VitePress theme switch. Check:
- Background changes to deep green (#0c1210)
- Cards use dark green (#141f1a)
- AI card gradient adapts to dark palette
- Code blocks, tags, questions blocks all readable
- No leftover light-mode colors

- [ ] **Step 6: Verify mobile**

Resize browser to mobile width (<640px). Check:
- Domain cards stack to single column
- AI card full width (no span 2)
- Content card loses side borders, full bleed
- Sidebar collapses to hamburger menu

- [ ] **Step 7: Commit verification notes**

If any fix is needed, make the fix and commit. Otherwise no commit needed for this task.

---
