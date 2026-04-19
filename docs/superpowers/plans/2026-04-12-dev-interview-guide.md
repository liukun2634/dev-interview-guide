# Dev Interview Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VitePress-based interview knowledge website with green theme, 8 technical domains, and sample articles with interview questions, deployed to GitHub Pages.

**Architecture:** VitePress static site with custom CSS theme overrides. Content in Markdown with YAML frontmatter. GitHub Actions for automated deployment to GitHub Pages. Directory-per-domain structure with sidebar auto-configured in `config.ts`.

**Tech Stack:** VitePress, Vue 3, TypeScript, GitHub Actions, GitHub Pages

---

## File Structure

```
dev-interview-guide/
  package.json                              # Project config, scripts
  .gitignore                                # Node/VitePress ignores
  docs/
    index.md                                # Homepage (custom Vue layout)
    .vitepress/
      config.ts                             # VitePress config (nav, sidebar, metadata)
      theme/
        index.ts                            # Theme entry (extends default theme, imports CSS)
        custom.css                          # Green theme CSS overrides
        components/
          HomeContent.vue                   # Homepage domain cards grid
    data-structures-and-algorithms/
      index.md                              # Domain landing
      binary-tree.md                        # Sample article 1
      hash-table.md                         # Sample article 2
    operating-systems/
      index.md
      process-and-thread.md
    computer-networks/
      index.md
      tcp-udp.md
    databases/
      index.md
      indexing.md
    system-design/
      index.md
      caching-strategies.md
    programming-languages/
      index.md
      java-fundamentals.md
    web-and-frameworks/
      index.md
      restful-api.md
    devops/
      index.md
      docker.md
  .github/
    workflows/
      deploy.yml                            # GitHub Pages deployment
```

---

### Task 1: Project Initialization

**Files:**
- Create: `dev-interview-guide/package.json`
- Create: `dev-interview-guide/.gitignore`

- [ ] **Step 1: Initialize npm project and install VitePress**

```bash
cd c:/Users/liuku/project/ai-playground/dev-interview-guide
npm init -y
npm install -D vitepress
```

- [ ] **Step 2: Update package.json scripts**

Edit `package.json` to set these scripts:

```json
{
  "name": "dev-interview-guide",
  "private": true,
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "devDependencies": {
    "vitepress": "^1.6.3"
  }
}
```

- [ ] **Step 3: Create .gitignore**

Create `dev-interview-guide/.gitignore`:

```
node_modules/
docs/.vitepress/dist/
docs/.vitepress/cache/
.DS_Store
*.log
```

- [ ] **Step 4: Verify VitePress runs**

```bash
cd c:/Users/liuku/project/ai-playground/dev-interview-guide
npx vitepress init
```

Select `docs` as the directory when prompted. Then:

```bash
npm run docs:dev
```

Expected: Dev server starts on `http://localhost:5173`, shows default VitePress page.

- [ ] **Step 5: Initialize git and commit**

```bash
cd c:/Users/liuku/project/ai-playground/dev-interview-guide
git init
git add package.json package-lock.json .gitignore
git commit -m "chore: initialize VitePress project"
```

---

### Task 2: VitePress Configuration

**Files:**
- Create: `docs/.vitepress/config.ts`

- [ ] **Step 1: Write VitePress config with nav and sidebar**

Create `docs/.vitepress/config.ts`:

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Dev Interview Guide',
  description: '系统化的程序员面试知识体系 - 涵盖算法、系统设计、数据库等 8 大领域',
  lang: 'zh-CN',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Dev Interview Guide',

    nav: [
      { text: '知识库', link: '/data-structures-and-algorithms/' },
      { text: 'GitHub', link: 'https://github.com/YOUR_USERNAME/dev-interview-guide' },
    ],

    sidebar: {
      '/data-structures-and-algorithms/': [
        {
          text: '数据结构与算法',
          items: [
            { text: '概览', link: '/data-structures-and-algorithms/' },
            { text: '二叉树 Binary Tree', link: '/data-structures-and-algorithms/binary-tree' },
            { text: '哈希表 Hash Table', link: '/data-structures-and-algorithms/hash-table' },
          ],
        },
      ],
      '/operating-systems/': [
        {
          text: '操作系统',
          items: [
            { text: '概览', link: '/operating-systems/' },
            { text: '进程与线程', link: '/operating-systems/process-and-thread' },
          ],
        },
      ],
      '/computer-networks/': [
        {
          text: '计算机网络',
          items: [
            { text: '概览', link: '/computer-networks/' },
            { text: 'TCP 与 UDP', link: '/computer-networks/tcp-udp' },
          ],
        },
      ],
      '/databases/': [
        {
          text: '数据库',
          items: [
            { text: '概览', link: '/databases/' },
            { text: '索引原理 Indexing', link: '/databases/indexing' },
          ],
        },
      ],
      '/system-design/': [
        {
          text: '系统设计',
          items: [
            { text: '概览', link: '/system-design/' },
            { text: '缓存策略 Caching', link: '/system-design/caching-strategies' },
          ],
        },
      ],
      '/programming-languages/': [
        {
          text: '编程语言',
          items: [
            { text: '概览', link: '/programming-languages/' },
            { text: 'Java 基础', link: '/programming-languages/java-fundamentals' },
          ],
        },
      ],
      '/web-and-frameworks/': [
        {
          text: 'Web & 框架',
          items: [
            { text: '概览', link: '/web-and-frameworks/' },
            { text: 'RESTful API', link: '/web-and-frameworks/restful-api' },
          ],
        },
      ],
      '/devops/': [
        {
          text: 'DevOps & 工程实践',
          items: [
            { text: '概览', link: '/devops/' },
            { text: 'Docker 容器化', link: '/devops/docker' },
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
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除查询',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
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
```

- [ ] **Step 2: Verify config loads**

```bash
npm run docs:dev
```

Expected: Dev server starts without config errors. Navigation bar shows "知识库" and "GitHub".

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/config.ts
git commit -m "feat: add VitePress config with nav, sidebar, and search"
```

---

### Task 3: Green Theme CSS

**Files:**
- Create: `docs/.vitepress/theme/custom.css`
- Create: `docs/.vitepress/theme/index.ts`

- [ ] **Step 1: Create custom CSS with green color overrides**

Create `docs/.vitepress/theme/custom.css`:

```css
/* ===== Green Theme - Dev Interview Guide ===== */

:root {
  /* Brand colors */
  --dig-green-primary: #2d8659;
  --dig-green-secondary: #45b97c;
  --dig-green-light: #e8f5e9;
  --dig-green-bg: #f6f8f4;

  /* VitePress color overrides */
  --vp-c-brand-1: #2d8659;
  --vp-c-brand-2: #35995f;
  --vp-c-brand-3: #45b97c;
  --vp-c-brand-soft: rgba(45, 134, 89, 0.14);

  /* Background */
  --vp-c-bg: #ffffff;
  --vp-c-bg-alt: #f6f8f4;
  --vp-c-bg-elv: #ffffff;
  --vp-c-bg-soft: #f0f5ed;

  /* Sidebar */
  --vp-sidebar-bg-color: #ffffff;

  /* Typography */
  --vp-font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Noto Sans SC', sans-serif;
  --vp-font-family-mono: 'Fira Code', 'JetBrains Mono', monospace;
}

/* ===== Navigation ===== */

.VPNav {
  border-bottom: 2px solid var(--dig-green-primary) !important;
}

.VPNavBarTitle .title {
  font-weight: 700 !important;
  letter-spacing: -0.3px;
}

/* ===== Sidebar ===== */

.VPSidebar .group .title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--dig-green-primary);
  font-weight: 700;
}

.VPSidebarItem.is-active > .item .link > .text {
  color: var(--dig-green-primary) !important;
  font-weight: 600;
}

.VPSidebarItem.is-active > .item {
  background: linear-gradient(90deg, var(--dig-green-light), var(--dig-green-bg));
  border-radius: 6px;
  border-left: 3px solid var(--dig-green-primary);
}

/* ===== Content ===== */

.vp-doc h1,
.vp-doc h2,
.vp-doc h3 {
  color: #1a2e1a;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.vp-doc h1 {
  font-size: 28px;
}

/* ===== Code blocks ===== */

.vp-doc div[class*='language-'] {
  background: #1b2b1b !important;
  border-radius: 10px;
  border: 1px solid #2a3d2a;
}

.vp-doc div[class*='language-']::before {
  content: '';
  display: block;
  height: 12px;
  margin-bottom: 4px;
  background-image:
    radial-gradient(circle at 8px 6px, #e5534b 4px, transparent 4px),
    radial-gradient(circle at 24px 6px, #f0c674 4px, transparent 4px),
    radial-gradient(circle at 40px 6px, #45b97c 4px, transparent 4px);
}

/* ===== Custom containers (tips, warnings) ===== */

.vp-doc .custom-block.tip {
  background: linear-gradient(135deg, var(--dig-green-light), #f1f8e9);
  border-color: #c8e6c9;
  border-radius: 10px;
}

.vp-doc .custom-block.tip .custom-block-title {
  color: var(--dig-green-primary);
  font-weight: 700;
}

/* ===== Tags / badges ===== */

.dig-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.6;
  margin-right: 6px;
  margin-bottom: 4px;
}
.dig-tag--category { background: var(--dig-green-light); color: var(--dig-green-primary); }
.dig-tag--easy { background: #e8f5e9; color: #2e7d32; }
.dig-tag--medium { background: #fff8e1; color: #f57f17; }
.dig-tag--hard { background: #fce4ec; color: #c62828; }
.dig-tag--hot { background: #fce4ec; color: #c62828; }

/* ===== Interview questions section ===== */

.dig-questions {
  background: #ffffff;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e8f0e4;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  margin: 20px 0;
}

.dig-questions__header {
  padding: 10px 16px;
  background: linear-gradient(90deg, #2d8659, #45b97c);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dig-questions__item {
  padding: 8px 16px;
  border-bottom: 1px solid #f0f5ed;
  font-size: 14px;
  color: #3a4f3a;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dig-questions__item:last-child {
  border-bottom: none;
}

/* ===== Key points callout ===== */

.dig-keypoints {
  background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
  border-radius: 10px;
  padding: 14px 18px;
  margin: 16px 0;
  border: 1px solid #c8e6c9;
}

.dig-keypoints__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--dig-green-primary);
  margin-bottom: 6px;
}

.dig-keypoints__body {
  font-size: 14px;
  color: #4a6a4a;
  line-height: 1.8;
}

/* ===== Homepage domain cards ===== */

.dig-domains {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px 0;
}

.dig-domain-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #e8f0e4;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s, transform 0.2s;
}

.dig-domain-card:hover {
  box-shadow: 0 4px 16px rgba(45, 134, 89, 0.12);
  transform: translateY(-2px);
}

.dig-domain-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 12px;
}

.dig-domain-card__title {
  font-size: 16px;
  font-weight: 700;
  color: #1a2e1a;
  margin-bottom: 4px;
}

.dig-domain-card__desc {
  font-size: 13px;
  color: #6b856b;
  line-height: 1.5;
}

.dig-domain-card__tags {
  margin-top: 10px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.dig-domain-card__tag {
  background: #f0f5ed;
  color: #5a7a5a;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}
```

- [ ] **Step 2: Create theme entry file**

Create `docs/.vitepress/theme/index.ts`:

```ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default DefaultTheme
```

- [ ] **Step 3: Verify theme applies**

```bash
npm run docs:dev
```

Expected: VitePress loads with green accent colors instead of default blue. Navigation bar has green bottom border.

- [ ] **Step 4: Commit**

```bash
git add docs/.vitepress/theme/
git commit -m "feat: add green theme with custom CSS"
```

---

### Task 4: Homepage

**Files:**
- Create: `docs/index.md`
- Create: `docs/.vitepress/theme/components/HomeContent.vue`
- Modify: `docs/.vitepress/theme/index.ts`

- [ ] **Step 1: Create HomeContent Vue component**

Create `docs/.vitepress/theme/components/HomeContent.vue`:

```vue
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
    link: '/data-structures-and-algorithms/',
  },
  {
    icon: '🖥️',
    iconBg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
    title: '操作系统',
    desc: '进程与线程、内存管理、死锁、调度算法、IO 模型',
    tags: ['进程', '内存', '死锁', 'IO'],
    link: '/operating-systems/',
  },
  {
    icon: '🌐',
    iconBg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
    title: '计算机网络',
    desc: 'TCP/UDP、HTTP/HTTPS、DNS、WebSocket、负载均衡',
    tags: ['TCP', 'HTTP', 'DNS'],
    link: '/computer-networks/',
  },
  {
    icon: '🗄️',
    iconBg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)',
    title: '数据库',
    desc: 'SQL 基础、索引原理、事务与锁、Redis、MongoDB',
    tags: ['MySQL', 'Redis', '索引', '事务'],
    link: '/databases/',
  },
  {
    icon: '🏗️',
    iconBg: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
    title: '系统设计',
    desc: '分布式系统、微服务、消息队列、缓存策略、CAP 定理',
    tags: ['分布式', '缓存', 'MQ'],
    link: '/system-design/',
  },
  {
    icon: '💬',
    iconBg: 'linear-gradient(135deg, #e0f2f1, #b2dfdb)',
    title: '编程语言',
    desc: 'Java / Go / Python 语言特性、并发模型、GC 机制',
    tags: ['Java', 'Go', 'Python'],
    link: '/programming-languages/',
  },
  {
    icon: '🔗',
    iconBg: 'linear-gradient(135deg, #e8eaf6, #c5cae9)',
    title: 'Web & 框架',
    desc: 'RESTful API、GraphQL、认证授权、Spring / Express',
    tags: ['REST', 'Auth', 'Spring'],
    link: '/web-and-frameworks/',
  },
  {
    icon: '⚙️',
    iconBg: 'linear-gradient(135deg, #efebe9, #d7ccc8)',
    title: 'DevOps & 工程实践',
    desc: 'Docker、K8s、CI/CD、监控日志、性能优化',
    tags: ['Docker', 'K8s', 'CI/CD'],
    link: '/devops/',
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
```

- [ ] **Step 2: Register component in theme**

Update `docs/.vitepress/theme/index.ts`:

```ts
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

- [ ] **Step 3: Create homepage markdown**

Create `docs/index.md`:

```md
---
layout: home

hero:
  name: Dev Interview Guide
  text: 系统化面试知识体系
  tagline: 涵盖算法、系统设计、数据库等 8 大领域，知识讲解 + 高频真题
  actions:
    - theme: brand
      text: 开始学习
      link: /data-structures-and-algorithms/
    - theme: alt
      text: GitHub
      link: https://github.com/YOUR_USERNAME/dev-interview-guide
---

<HomeContent />
```

- [ ] **Step 4: Verify homepage renders**

```bash
npm run docs:dev
```

Expected: Homepage shows hero section with green "开始学习" button, followed by 8 domain cards in a responsive grid. Cards have colored icons, titles, descriptions, and tags. Hover effect works (shadow + lift).

- [ ] **Step 5: Commit**

```bash
git add docs/index.md docs/.vitepress/theme/
git commit -m "feat: add homepage with domain cards"
```

---

### Task 5: Sample Article - Binary Tree

**Files:**
- Create: `docs/data-structures-and-algorithms/index.md`
- Create: `docs/data-structures-and-algorithms/binary-tree.md`

- [ ] **Step 1: Create domain landing page**

Create `docs/data-structures-and-algorithms/index.md`:

```md
---
title: 数据结构与算法
---

# 数据结构与算法

本章涵盖面试中最常考的数据结构与算法知识，每篇文章包含核心概念讲解和高频面试真题。

## 文章列表

| 主题 | 难度 | 频率 |
|------|------|------|
| [二叉树 Binary Tree](./binary-tree) | ⭐⭐ 中级 | 🔥🔥🔥 高频 |
| [哈希表 Hash Table](./hash-table) | ⭐⭐ 中级 | 🔥🔥🔥 高频 |
```

- [ ] **Step 2: Create binary tree article**

Create `docs/data-structures-and-algorithms/binary-tree.md`:

````md
---
title: 二叉树 Binary Tree
---

# 二叉树 Binary Tree

<span class="dig-tag dig-tag--category">数据结构</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
二叉树是每个节点最多有两个子节点的树结构。面试必考：前序/中序/后序/层序四种遍历方式，递归与迭代实现。
:::

## 基本概念

二叉树（Binary Tree）是一种非线性数据结构，每个节点最多有两个子节点，分别称为**左子节点**和**右子节点**。

### 常见类型

- **满二叉树（Full Binary Tree）**：每个节点有 0 或 2 个子节点
- **完全二叉树（Complete Binary Tree）**：除最后一层外每层都是满的，最后一层节点靠左排列
- **二叉搜索树（BST）**：左子树所有值 < 根 < 右子树所有值
- **平衡二叉树（AVL）**：任意节点左右子树高度差不超过 1

### 节点定义

```typescript
class TreeNode<T> {
  val: T
  left: TreeNode<T> | null
  right: TreeNode<T> | null

  constructor(val: T, left: TreeNode<T> | null = null, right: TreeNode<T> | null = null) {
    this.val = val
    this.left = left
    this.right = right
  }
}
```

## 四种遍历方式

### 前序遍历（Pre-order）

访问顺序：根 → 左 → 右

```typescript
function preorder(root: TreeNode | null): number[] {
  if (!root) return []
  return [root.val, ...preorder(root.left), ...preorder(root.right)]
}
```

### 中序遍历（In-order）

访问顺序：左 → 根 → 右（BST 中序遍历结果是有序的）

```typescript
function inorder(root: TreeNode | null): number[] {
  if (!root) return []
  return [...inorder(root.left), root.val, ...inorder(root.right)]
}
```

### 后序遍历（Post-order）

访问顺序：左 → 右 → 根

```typescript
function postorder(root: TreeNode | null): number[] {
  if (!root) return []
  return [...postorder(root.left), ...postorder(root.right), root.val]
}
```

### 层序遍历（Level-order / BFS）

```typescript
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return []
  const result: number[][] = []
  const queue: TreeNode[] = [root]

  while (queue.length > 0) {
    const levelSize = queue.length
    const level: number[] = []

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!
      level.push(node.val)
      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }

    result.push(level)
  }

  return result
}
```

## 常见易错点

1. **递归终止条件遗漏**：忘记处理 `root === null` 的情况
2. **BST 定义混淆**：BST 要求的是左子树所有节点都小于根，不仅仅是左子节点
3. **高度 vs 深度**：高度从叶子往上数，深度从根往下数
4. **完全二叉树 vs 满二叉树**：完全二叉树最后一层可以不满，但必须从左到右连续

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 二叉树的层序遍历（LeetCode 102）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 判断是否为平衡二叉树（LeetCode 110）</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">简单</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 二叉搜索树中第 K 小的元素（LeetCode 230）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### 真题 1：二叉树的层序遍历

> 给定一个二叉树的根节点 root，返回其节点值的层序遍历（逐层从左到右）。

**思路**：使用 BFS，用队列维护当前层的节点。

```typescript
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return []
  const result: number[][] = []
  const queue: TreeNode[] = [root]

  while (queue.length > 0) {
    const size = queue.length
    const level: number[] = []
    for (let i = 0; i < size; i++) {
      const node = queue.shift()!
      level.push(node.val)
      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }
    result.push(level)
  }
  return result
}
```

### 真题 2：判断平衡二叉树

> 给定一个二叉树，判断它是否是高度平衡的。高度平衡指每个节点的左右子树高度差不超过 1。

**思路**：自底向上递归，边计算高度边判断平衡。

```typescript
function isBalanced(root: TreeNode | null): boolean {
  function height(node: TreeNode | null): number {
    if (!node) return 0
    const left = height(node.left)
    if (left === -1) return -1
    const right = height(node.right)
    if (right === -1) return -1
    if (Math.abs(left - right) > 1) return -1
    return Math.max(left, right) + 1
  }
  return height(root) !== -1
}
```

### 真题 3：BST 第 K 小元素

> 给定一个 BST 的根节点 root 和一个整数 k，返回树中第 k 小的元素。

**思路**：BST 中序遍历是有序的，中序遍历到第 k 个即可。

```typescript
function kthSmallest(root: TreeNode | null, k: number): number {
  const stack: TreeNode[] = []
  let current = root
  let count = 0

  while (current || stack.length > 0) {
    while (current) {
      stack.push(current)
      current = current.left
    }
    current = stack.pop()!
    count++
    if (count === k) return current.val
    current = current.right
  }

  return -1
}
```

## 延伸阅读

- [LeetCode 二叉树标签题目](https://leetcode.cn/tag/binary-tree/)
- [数据结构可视化 - Binary Tree](https://visualgo.net/en/bst)
````

- [ ] **Step 3: Verify article renders**

```bash
npm run docs:dev
```

Navigate to `/data-structures-and-algorithms/binary-tree`. Expected: Article displays with green tags, tip callout, code blocks with green background and window dots, interview questions section with green gradient header, sidebar navigation, and right-side TOC.

- [ ] **Step 4: Commit**

```bash
git add docs/data-structures-and-algorithms/
git commit -m "feat: add data structures domain with binary tree article"
```

---

### Task 6: Sample Article - Hash Table

**Files:**
- Create: `docs/data-structures-and-algorithms/hash-table.md`

- [ ] **Step 1: Create hash table article**

Create `docs/data-structures-and-algorithms/hash-table.md`:

````md
---
title: 哈希表 Hash Table
---

# 哈希表 Hash Table

<span class="dig-tag dig-tag--category">数据结构</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
哈希表通过哈希函数将 key 映射到数组下标，实现 O(1) 平均时间复杂度的查找。面试重点：哈希冲突解决方案、HashMap 底层实现。
:::

## 基本概念

哈希表（Hash Table）是一种基于数组的数据结构，通过**哈希函数**（Hash Function）将键（Key）映射到数组中的一个位置，从而实现快速的插入、删除和查找操作。

### 核心操作时间复杂度

| 操作 | 平均 | 最坏 |
|------|------|------|
| 查找 | O(1) | O(n) |
| 插入 | O(1) | O(n) |
| 删除 | O(1) | O(n) |

### 哈希函数

一个好的哈希函数应满足：
- **确定性**：相同输入总是产生相同输出
- **均匀性**：输出尽可能均匀分布
- **高效性**：计算速度快

```typescript
// 简单的字符串哈希函数
function hash(key: string, size: number): number {
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) % size
  }
  return h
}
```

## 哈希冲突解决

### 1. 链地址法（Separate Chaining）

每个数组位置维护一个链表，冲突的元素追加到链表中。

```typescript
class HashTable<K, V> {
  private buckets: Array<Array<[K, V]>>
  private size: number

  constructor(size: number = 16) {
    this.size = size
    this.buckets = Array.from({ length: size }, () => [])
  }

  private hashKey(key: K): number {
    const str = String(key)
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) % this.size
    }
    return h
  }

  set(key: K, value: V): void {
    const index = this.hashKey(key)
    const bucket = this.buckets[index]
    const existing = bucket.find(([k]) => k === key)
    if (existing) {
      existing[1] = value
    } else {
      bucket.push([key, value])
    }
  }

  get(key: K): V | undefined {
    const index = this.hashKey(key)
    const pair = this.buckets[index].find(([k]) => k === key)
    return pair ? pair[1] : undefined
  }
}
```

### 2. 开放地址法（Open Addressing）

冲突时在数组中寻找下一个空位。

- **线性探测**：依次检查下一个位置 `(hash + 1) % size`
- **二次探测**：按 `(hash + 1²), (hash + 2²)` 跳跃探测
- **双重哈希**：用第二个哈希函数计算步长

## Java HashMap 面试重点

Java 8 的 HashMap 底层实现是面试高频考点：

- **结构**：数组 + 链表 + 红黑树
- **默认容量**：16，负载因子 0.75
- **树化阈值**：链表长度 ≥ 8 且数组长度 ≥ 64 时转为红黑树
- **扩容**：容量翻倍，重新计算每个元素的位置

## 常见易错点

1. **自定义对象做 key 时**，必须同时重写 `hashCode()` 和 `equals()` 方法
2. **负载因子太大**导致冲突增多，太小导致空间浪费
3. **HashMap 不是线程安全的**，多线程环境应使用 ConcurrentHashMap
4. **哈希表不保证顺序**，需要顺序请使用 LinkedHashMap 或 TreeMap

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 两数之和（LeetCode 1）</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">简单</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 字母异位词分组（LeetCode 49）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. LRU 缓存机制（LeetCode 146）</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### 真题 1：两数之和

> 给定一个整数数组和一个目标值，找出数组中和为目标值的两个数的下标。

**思路**：用哈希表存储已遍历元素的值和下标，查找 `target - nums[i]` 是否存在。

```typescript
function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>()
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    if (map.has(complement)) {
      return [map.get(complement)!, i]
    }
    map.set(nums[i], i)
  }
  return []
}
```

### 真题 2：字母异位词分组

> 给定一个字符串数组，将字母异位词组合在一起。

**思路**：以排序后的字符串作为 key 进行分组。

```typescript
function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>()
  for (const s of strs) {
    const key = s.split('').sort().join('')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return Array.from(map.values())
}
```

### 真题 3：LRU 缓存机制

> 设计一个 LRU（最近最少使用）缓存。

**思路**：HashMap + 双向链表，get/put 都是 O(1)。

```typescript
class LRUCache {
  private capacity: number
  private cache: Map<number, number>

  constructor(capacity: number) {
    this.capacity = capacity
    this.cache = new Map()
  }

  get(key: number): number {
    if (!this.cache.has(key)) return -1
    const val = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, val)
    return val
  }

  put(key: number, value: number): void {
    if (this.cache.has(key)) this.cache.delete(key)
    this.cache.set(key, value)
    if (this.cache.size > this.capacity) {
      const firstKey = this.cache.keys().next().value!
      this.cache.delete(firstKey)
    }
  }
}
```

## 延伸阅读

- [LeetCode 哈希表标签题目](https://leetcode.cn/tag/hash-table/)
- [Java HashMap 源码分析](https://github.com/CyC2018/CS-Notes/blob/master/notes/Java%20%E5%AE%B9%E5%99%A8.md)
````

- [ ] **Step 2: Verify article renders**

```bash
npm run docs:dev
```

Navigate to `/data-structures-and-algorithms/hash-table`. Expected: Same visual pattern as binary tree article — tags, tip, code blocks, questions section.

- [ ] **Step 3: Commit**

```bash
git add docs/data-structures-and-algorithms/hash-table.md
git commit -m "feat: add hash table article with interview questions"
```

---

### Task 7: Remaining Domain Landing Pages

**Files:**
- Create: `docs/operating-systems/index.md`
- Create: `docs/computer-networks/index.md`
- Create: `docs/databases/index.md`
- Create: `docs/system-design/index.md`
- Create: `docs/programming-languages/index.md`
- Create: `docs/web-and-frameworks/index.md`
- Create: `docs/devops/index.md`

- [ ] **Step 1: Create operating-systems landing page**

Create `docs/operating-systems/index.md`:

```md
---
title: 操作系统
---

# 操作系统

本章涵盖操作系统核心概念：进程与线程、内存管理、文件系统、死锁等。

## 文章列表

| 主题 | 难度 | 频率 |
|------|------|------|
| [进程与线程](./process-and-thread) | ⭐⭐ 中级 | 🔥🔥🔥 高频 |
```

- [ ] **Step 2: Create computer-networks landing page**

Create `docs/computer-networks/index.md`:

```md
---
title: 计算机网络
---

# 计算机网络

本章涵盖计算机网络核心知识：TCP/UDP、HTTP/HTTPS、DNS 等协议原理与面试真题。

## 文章列表

| 主题 | 难度 | 频率 |
|------|------|------|
| [TCP 与 UDP](./tcp-udp) | ⭐⭐ 中级 | 🔥🔥🔥 高频 |
```

- [ ] **Step 3: Create databases landing page**

Create `docs/databases/index.md`:

```md
---
title: 数据库
---

# 数据库

本章涵盖数据库核心知识：SQL 基础、索引原理、事务与锁、Redis 等。

## 文章列表

| 主题 | 难度 | 频率 |
|------|------|------|
| [索引原理 Indexing](./indexing) | ⭐⭐ 中级 | 🔥🔥🔥 高频 |
```

- [ ] **Step 4: Create system-design landing page**

Create `docs/system-design/index.md`:

```md
---
title: 系统设计
---

# 系统设计

本章涵盖系统设计核心知识：分布式系统、微服务、缓存策略、消息队列等。

## 文章列表

| 主题 | 难度 | 频率 |
|------|------|------|
| [缓存策略 Caching](./caching-strategies) | ⭐⭐⭐ 高级 | 🔥🔥🔥 高频 |
```

- [ ] **Step 5: Create programming-languages landing page**

Create `docs/programming-languages/index.md`:

```md
---
title: 编程语言
---

# 编程语言

本章涵盖编程语言核心知识：语言特性、并发模型、内存模型、GC 机制等。

## 文章列表

| 主题 | 难度 | 频率 |
|------|------|------|
| [Java 基础](./java-fundamentals) | ⭐⭐ 中级 | 🔥🔥🔥 高频 |
```

- [ ] **Step 6: Create web-and-frameworks landing page**

Create `docs/web-and-frameworks/index.md`:

```md
---
title: Web & 框架
---

# Web & 框架

本章涵盖 Web 开发核心知识：RESTful API 设计、认证授权、主流框架原理。

## 文章列表

| 主题 | 难度 | 频率 |
|------|------|------|
| [RESTful API](./restful-api) | ⭐⭐ 中级 | 🔥🔥 中频 |
```

- [ ] **Step 7: Create devops landing page**

Create `docs/devops/index.md`:

```md
---
title: DevOps & 工程实践
---

# DevOps & 工程实践

本章涵盖 DevOps 和工程实践：Docker、K8s、CI/CD、监控日志等。

## 文章列表

| 主题 | 难度 | 频率 |
|------|------|------|
| [Docker 容器化](./docker) | ⭐⭐ 中级 | 🔥🔥 中频 |
```

- [ ] **Step 8: Verify sidebar navigation**

```bash
npm run docs:dev
```

Expected: All 8 domains appear in sidebar when navigating. Each landing page renders correctly.

- [ ] **Step 9: Commit**

```bash
git add docs/operating-systems/ docs/computer-networks/ docs/databases/ docs/system-design/ docs/programming-languages/ docs/web-and-frameworks/ docs/devops/
git commit -m "feat: add landing pages for all 8 domains"
```

---

### Task 8: Sample Articles for Remaining Domains

**Files:**
- Create: `docs/operating-systems/process-and-thread.md`
- Create: `docs/computer-networks/tcp-udp.md`
- Create: `docs/databases/indexing.md`
- Create: `docs/system-design/caching-strategies.md`
- Create: `docs/programming-languages/java-fundamentals.md`
- Create: `docs/web-and-frameworks/restful-api.md`
- Create: `docs/devops/docker.md`

- [ ] **Step 1: Create process-and-thread article**

Create `docs/operating-systems/process-and-thread.md`:

````md
---
title: 进程与线程
---

# 进程与线程

<span class="dig-tag dig-tag--category">操作系统</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
进程是资源分配的基本单位，线程是 CPU 调度的基本单位。一个进程可以包含多个线程，同一进程内的线程共享内存空间。
:::

## 进程 Process

进程是程序的一次执行过程，是操作系统**资源分配**的基本单位。

### 进程状态

```
         就绪 ←——— 新建
          ↓  ↖
          ↓    ↑
        运行 → 阻塞
          ↓
        终止
```

- **新建（New）**：进程刚被创建
- **就绪（Ready）**：等待 CPU 调度
- **运行（Running）**：正在 CPU 上执行
- **阻塞（Blocked）**：等待 I/O 或事件
- **终止（Terminated）**：执行完毕

## 线程 Thread

线程是 CPU 调度的基本单位，是进程内的一个执行单元。

### 进程 vs 线程

| 对比项 | 进程 | 线程 |
|--------|------|------|
| 资源 | 有独立的地址空间 | 共享进程的地址空间 |
| 开销 | 创建/切换开销大 | 创建/切换开销小 |
| 通信 | IPC（管道、消息队列等） | 直接读写共享内存 |
| 影响 | 一个崩溃不影响其他 | 一个崩溃可能导致整个进程崩溃 |
| 并发 | 多进程并发 | 多线程并发 |

## 进程间通信（IPC）

- **管道（Pipe）**：半双工，父子进程间通信
- **命名管道（Named Pipe）**：无亲缘关系进程间通信
- **消息队列（Message Queue）**：内核中的消息链表
- **共享内存（Shared Memory）**：最快的 IPC 方式
- **信号量（Semaphore）**：用于同步，控制并发访问
- **Socket**：支持不同主机间的进程通信

## 常见易错点

1. **协程不是线程**：协程是用户态的轻量级线程，由程序自行调度
2. **多线程不一定比多进程快**：受 GIL（如 Python）、锁竞争等影响
3. **进程间完全隔离**是错误的：共享内存等 IPC 手段可以共享数据

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 进程和线程有什么区别？</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">基础</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 进程间通信方式有哪些？各自优缺点？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 什么是上下文切换？开销有多大？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### 真题 1：进程和线程有什么区别？

**参考回答**：进程是资源分配的基本单位，线程是 CPU 调度的基本单位。进程有独立的地址空间，线程共享进程的地址空间。线程创建和切换的开销比进程小。同一进程内的线程可以直接通信，进程间需要通过 IPC 机制通信。

### 真题 2：进程间通信方式有哪些？

**参考回答**：主要有管道、命名管道、消息队列、共享内存、信号量和 Socket 六种。其中共享内存最快，因为不需要内核参与数据拷贝；Socket 最通用，支持跨主机通信；管道最简单，适合父子进程间通信。

### 真题 3：什么是上下文切换？

**参考回答**：上下文切换是 CPU 从一个进程/线程切换到另一个时，保存当前运行状态（寄存器、程序计数器等）并恢复目标状态的过程。进程切换需要额外切换页表、刷新 TLB，开销约 1-10 微秒。线程切换因共享地址空间，开销更小。

## 延伸阅读

- [Linux 进程管理](https://man7.org/linux/man-pages/man2/fork.2.html)
- [OSTEP - 进程](https://pages.cs.wisc.edu/~remzi/OSTEP/)
````

- [ ] **Step 2: Create tcp-udp article**

Create `docs/computer-networks/tcp-udp.md`:

````md
---
title: TCP 与 UDP
---

# TCP 与 UDP

<span class="dig-tag dig-tag--category">计算机网络</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
TCP 面向连接、可靠传输；UDP 无连接、不可靠但快。面试必考：三次握手、四次挥手、流量控制、拥塞控制。
:::

## TCP vs UDP 对比

| 特性 | TCP | UDP |
|------|-----|-----|
| 连接 | 面向连接 | 无连接 |
| 可靠性 | 可靠（确认重传） | 不可靠 |
| 顺序 | 保证顺序 | 不保证 |
| 速度 | 较慢 | 快 |
| 开销 | 头部 20 字节 | 头部 8 字节 |
| 场景 | HTTP、FTP、邮件 | DNS、视频流、游戏 |

## 三次握手

```
客户端                          服务端
  |                               |
  |  ---- SYN(seq=x) --------->  |  第 1 次：客户端发起连接
  |                               |
  |  <-- SYN+ACK(seq=y,ack=x+1)  |  第 2 次：服务端确认并发起
  |                               |
  |  ---- ACK(ack=y+1) -------->  |  第 3 次：客户端确认
  |                               |
```

**为什么是三次？** 两次无法确认客户端的接收能力。如果只有两次，服务端无法判断一个延迟到达的旧 SYN 是否有效，可能导致建立无效连接浪费资源。

## 四次挥手

```
客户端                          服务端
  |                               |
  |  ---- FIN(seq=u) ---------->  |  第 1 次：客户端请求关闭
  |                               |
  |  <-- ACK(ack=u+1) ----------  |  第 2 次：服务端确认
  |                               |  （服务端可能还有数据要发）
  |  <-- FIN(seq=w) ------------  |  第 3 次：服务端也请求关闭
  |                               |
  |  ---- ACK(ack=w+1) -------->  |  第 4 次：客户端确认
  |      (进入 TIME_WAIT)         |
```

**为什么是四次？** TCP 是全双工的，每个方向需要单独关闭。服务端收到 FIN 后可能还有数据没发完，所以 ACK 和 FIN 不能合并。

**TIME_WAIT 为什么等 2MSL？** 确保最后一个 ACK 能到达服务端，避免延迟报文干扰新连接。

## 常见易错点

1. **三次握手不是为了"防止"**：是为了同步双方的序列号，确认双方收发能力
2. **TIME_WAIT 不是 bug**：是必要的等待，防止旧连接的数据包干扰新连接
3. **UDP 不是完全"不可靠"**：应用层可以自己实现可靠性（如 QUIC）

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 详细描述 TCP 三次握手过程</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">基础</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 为什么挥手需要四次而不是三次？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. TCP 如何保证可靠传输？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### 真题 1：TCP 三次握手

**参考回答**：客户端发送 SYN 报文（seq=x）请求连接；服务端收到后返回 SYN+ACK（seq=y, ack=x+1）；客户端再发送 ACK（ack=y+1）确认。三次握手的目的是同步双方序列号、确认双方收发能力正常。

### 真题 2：为什么四次挥手？

**参考回答**：TCP 是全双工通信，双方都可以独立发送数据。客户端发送 FIN 只表示客户端不再发送数据，但服务端可能还有数据未发送完成，所以服务端的 ACK 和 FIN 不能合并为一次，需要分开发送。

### 真题 3：TCP 如何保证可靠传输？

**参考回答**：通过序列号和确认应答保证数据不丢失、不重复；通过校验和检测数据损坏；通过滑动窗口实现流量控制；通过拥塞控制（慢开始、拥塞避免、快重传、快恢复）避免网络拥堵；超时重传机制处理丢包。

## 延伸阅读

- [TCP 状态机详解](https://www.rfc-editor.org/rfc/rfc793)
- [QUIC 协议 - 基于 UDP 的可靠传输](https://www.chromium.org/quic/)
````

- [ ] **Step 3: Create remaining 5 sample articles**

Create each file as a shorter starter article. These follow the same pattern — tags, tip, core content, questions section.

Create `docs/databases/indexing.md`:

````md
---
title: 索引原理 Indexing
---

# 索引原理 Indexing

<span class="dig-tag dig-tag--category">数据库</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
索引是数据库加速查询的数据结构，底层通常是 B+ 树。面试重点：索引类型、B+ 树原理、索引失效场景、覆盖索引。
:::

## 什么是索引

索引是对数据库表中一列或多列值进行排序的一种数据结构，用于加速数据检索。类比书的目录——不翻遍全书就能快速找到内容。

### 索引类型

- **主键索引（Primary Key）**：唯一且非空
- **唯一索引（Unique）**：值唯一，允许 NULL
- **普通索引（Index）**：最基本的索引
- **复合索引（Composite）**：多列组成的索引
- **全文索引（Full-text）**：用于文本搜索

## B+ 树

MySQL InnoDB 的默认索引结构：

- **非叶子节点**只存储 key，不存储数据 → 能存更多 key → 树更矮
- **叶子节点**存储完整数据，通过链表相连 → 支持范围查询
- 树高通常 3-4 层，千万级数据也只需 3-4 次 IO

## 索引失效场景

1. 使用 `LIKE '%abc'` 左模糊查询
2. 对索引列做函数运算：`WHERE YEAR(create_time) = 2024`
3. 隐式类型转换：`WHERE varchar_col = 123`
4. 复合索引不满足最左前缀原则
5. 使用 `OR` 连接非索引列
6. `NOT IN`、`!=`、`IS NOT NULL` 可能导致失效

## 常见易错点

1. **索引不是越多越好**：每个索引增加写入开销和存储空间
2. **覆盖索引**：查询的字段都在索引中，不需要回表
3. **聚簇索引 vs 非聚簇索引**：InnoDB 主键索引是聚簇索引，叶子节点存完整行数据

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 为什么 MySQL 用 B+ 树而不是 B 树？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 什么是覆盖索引？什么是回表？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. 列举索引失效的常见场景</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">基础</span>
  </div>
</div>

### 真题 1：为什么用 B+ 树？

**参考回答**：B+ 树的非叶子节点不存数据，每个节点能放更多 key，树更矮，IO 次数更少。叶子节点用链表连接，支持高效的范围查询。B 树每个节点都存数据，范围查询需要中序遍历，效率低。

### 真题 2：覆盖索引与回表

**参考回答**：覆盖索引是指查询的所有字段都在索引中，不需要再去主键索引读取完整行数据。回表是指通过非聚簇索引找到主键值后，再去聚簇索引中查找完整数据的过程。使用覆盖索引可以避免回表，提升查询性能。

### 真题 3：索引失效场景

**参考回答**：左模糊查询、对索引列做函数运算、隐式类型转换、不满足最左前缀原则、OR 连接非索引列、NOT IN 等都可能导致索引失效。可以通过 EXPLAIN 分析执行计划来确认索引是否生效。

## 延伸阅读

- [MySQL 索引优化实战](https://dev.mysql.com/doc/refman/8.0/en/optimization-indexes.html)
- [Use The Index, Luke](https://use-the-index-luke.com/)
````

Create `docs/system-design/caching-strategies.md`:

````md
---
title: 缓存策略 Caching
---

# 缓存策略 Caching

<span class="dig-tag dig-tag--category">系统设计</span>
<span class="dig-tag dig-tag--hard">⭐⭐⭐ 高级</span>
<span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
缓存是系统设计中最重要的性能优化手段。面试重点：缓存穿透/击穿/雪崩、缓存更新策略、Redis 常见应用。
:::

## 缓存三大问题

### 缓存穿透

请求的数据在缓存和数据库中都不存在，每次都穿透到数据库。

**解决方案**：
- 缓存空值（设置短过期时间）
- 布隆过滤器：先过滤不存在的 key

### 缓存击穿

热点 key 过期瞬间，大量请求直接打到数据库。

**解决方案**：
- 互斥锁：只允许一个请求重建缓存
- 热点 key 永不过期 + 异步更新

### 缓存雪崩

大量 key 同时过期，数据库压力骤增。

**解决方案**：
- 过期时间加随机值，避免同时失效
- 多级缓存（本地 + 分布式）
- 熔断降级兜底

## 缓存更新策略

| 策略 | 原理 | 适用场景 |
|------|------|----------|
| Cache Aside | 读：先缓存后 DB；写：先更新 DB 再删缓存 | 通用，最常用 |
| Read Through | 缓存层负责读取 DB | 读多写少 |
| Write Through | 缓存层负责写入 DB | 数据一致性要求高 |
| Write Behind | 异步批量写入 DB | 写多，允许短暂不一致 |

## 常见易错点

1. **先删缓存再更新 DB** 是错误的顺序，并发下会导致脏数据
2. **缓存和 DB 双写无法保证强一致性**，最终一致性是更实际的目标
3. **缓存预热**：上线前提前加载热点数据到缓存

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. 什么是缓存穿透、击穿、雪崩？怎么解决？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. 如何保证缓存与数据库的一致性？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
  <div class="dig-questions__item">
    <span>3. Redis 的过期策略和内存淘汰机制？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### 真题 1：穿透、击穿、雪崩

**参考回答**：穿透是查不存在的数据，解决方案是缓存空值或布隆过滤器。击穿是热点 key 过期瞬间大量请求打到 DB，解决方案是互斥锁或永不过期。雪崩是大量 key 同时过期，解决方案是过期时间加随机值、多级缓存、熔断降级。

### 真题 2：缓存与 DB 一致性

**参考回答**：最常用的是 Cache Aside 模式：读时先查缓存，未命中再查 DB 并回填缓存；写时先更新 DB 再删除缓存。这种方式在极端并发下仍可能出现短暂不一致，但概率很低。如需更强一致性，可以用延迟双删或通过 binlog 订阅异步更新缓存。

### 真题 3：Redis 过期与淘汰

**参考回答**：Redis 使用惰性删除（访问时检查过期）+ 定期删除（随机抽样删除过期 key）。内存淘汰有 8 种策略，常用的是 allkeys-lru（所有 key 中淘汰最近最少使用的）和 volatile-lru（只对设置了过期时间的 key 执行 LRU）。

## 延伸阅读

- [Redis 官方文档](https://redis.io/docs/)
- [缓存更新的套路 - 陈皓](https://coolshell.cn/articles/17416.html)
````

Create `docs/programming-languages/java-fundamentals.md`:

````md
---
title: Java 基础
---

# Java 基础

<span class="dig-tag dig-tag--category">编程语言</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Java 面试高频考点：JVM 内存模型、GC 机制、HashMap 原理、多线程并发。
:::

## JVM 内存结构

- **堆（Heap）**：对象实例、GC 主要区域
- **方法区（Method Area）**：类信息、常量、静态变量
- **虚拟机栈（VM Stack）**：线程私有，方法调用栈帧
- **本地方法栈（Native Stack）**：native 方法
- **程序计数器（PC Register）**：当前执行指令地址

## GC 垃圾回收

### 判断对象是否可回收

- **引用计数法**：有循环引用问题
- **可达性分析**：从 GC Roots 出发，不可达即可回收

### 常见垃圾收集器

| 收集器 | 特点 | 适用场景 |
|--------|------|----------|
| Serial | 单线程、STW | 客户端模式 |
| Parallel | 多线程、吞吐量优先 | 后台计算 |
| CMS | 并发标记、低延迟 | Web 应用 |
| G1 | 分区、可预测停顿 | 大堆内存 |
| ZGC | 超低延迟（<10ms） | 实时系统 |

## 常见易错点

1. **String 不可变**：`String s = "a" + "b"` 编译器优化为常量
2. **== vs equals**：== 比较引用，equals 比较值（需重写）
3. **HashMap 线程不安全**：并发用 ConcurrentHashMap

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. JVM 内存结构是什么样的？</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">基础</span>
  </div>
  <div class="dig-questions__item">
    <span>2. HashMap 的底层实现原理？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. synchronized 和 ReentrantLock 区别？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### 真题 1：JVM 内存结构

**参考回答**：JVM 内存主要分为堆、方法区、虚拟机栈、本地方法栈和程序计数器。堆是最大的区域，存放对象实例，是 GC 的主要区域。方法区存放类信息和常量。栈是线程私有的，每次方法调用创建一个栈帧。

### 真题 2：HashMap 原理

**参考回答**：Java 8 的 HashMap 底层是数组 + 链表 + 红黑树。put 时通过 key 的 hashCode 计算数组下标，冲突时用链表。链表长度 ≥ 8 且数组长度 ≥ 64 时转为红黑树。默认初始容量 16，负载因子 0.75，扩容时容量翻倍。

### 真题 3：synchronized vs ReentrantLock

**参考回答**：synchronized 是 JVM 内置锁，自动释放；ReentrantLock 是 API 层面的锁，需要手动 unlock。ReentrantLock 支持公平锁、可中断、超时获取、condition 等高级功能。性能上两者在 Java 6 之后差别不大。

## 延伸阅读

- [深入理解 Java 虚拟机 - 周志明](https://book.douban.com/subject/34907497/)
- [Java 并发编程实战](https://book.douban.com/subject/10484692/)
````

Create `docs/web-and-frameworks/restful-api.md`:

````md
---
title: RESTful API
---

# RESTful API

<span class="dig-tag dig-tag--category">Web & 框架</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--medium">🔥🔥 中频</span>

::: tip 💡 核心要点
REST 是一种 API 架构风格，基于 HTTP 协议，使用 URL 定位资源、HTTP 方法操作资源。面试重点：设计原则、状态码、版本控制。
:::

## 核心原则

- **资源导向**：URL 表示资源，如 `/users/123`
- **HTTP 方法语义**：GET 查、POST 增、PUT 改、DELETE 删
- **无状态**：每次请求包含所有必要信息
- **统一接口**：一致的 URL 和响应格式

## HTTP 方法

| 方法 | 用途 | 幂等 | 安全 |
|------|------|------|------|
| GET | 获取资源 | 是 | 是 |
| POST | 创建资源 | 否 | 否 |
| PUT | 全量更新 | 是 | 否 |
| PATCH | 部分更新 | 否 | 否 |
| DELETE | 删除资源 | 是 | 否 |

## 常用状态码

| 状态码 | 含义 | 场景 |
|--------|------|------|
| 200 | OK | 成功 |
| 201 | Created | 创建成功 |
| 204 | No Content | 删除成功 |
| 400 | Bad Request | 参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 429 | Too Many Requests | 限流 |
| 500 | Server Error | 服务器错误 |

## 常见易错点

1. **URL 用名词不用动词**：`/users` 而非 `/getUsers`
2. **POST 不是万能的**：应根据语义选择正确的 HTTP 方法
3. **PUT vs PATCH**：PUT 是全量替换，PATCH 是部分更新

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">2 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. RESTful API 有哪些设计原则？</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">基础</span>
  </div>
  <div class="dig-questions__item">
    <span>2. PUT 和 PATCH 有什么区别？</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">基础</span>
  </div>
</div>

### 真题 1：RESTful 设计原则

**参考回答**：RESTful API 以资源为核心，URL 表示资源路径，使用 HTTP 方法表达操作语义。遵循无状态原则，统一接口格式，使用合适的状态码。URL 用名词复数形式，如 `/api/v1/users`。

### 真题 2：PUT vs PATCH

**参考回答**：PUT 是全量替换整个资源，需要传入完整对象，未传字段会被置空。PATCH 是部分更新，只传需要修改的字段。PUT 是幂等的，多次调用效果相同；PATCH 不一定幂等。

## 延伸阅读

- [RESTful API 设计指南 - 阮一峰](https://www.ruanyifeng.com/blog/2014/05/restful_api.html)
- [HTTP API Design Guide](https://github.com/interagent/http-api-design)
````

Create `docs/devops/docker.md`:

````md
---
title: Docker 容器化
---

# Docker 容器化

<span class="dig-tag dig-tag--category">DevOps</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--medium">🔥🔥 中频</span>

::: tip 💡 核心要点
Docker 是容器化平台，通过 namespace 和 cgroup 实现进程隔离。面试重点：容器 vs 虚拟机、镜像分层、Dockerfile 优化。
:::

## 容器 vs 虚拟机

| 对比项 | 容器 | 虚拟机 |
|--------|------|--------|
| 隔离级别 | 进程级（共享内核） | 硬件级（独立内核） |
| 启动速度 | 秒级 | 分钟级 |
| 体积 | MB 级 | GB 级 |
| 性能 | 接近原生 | 有损耗 |
| 安全性 | 较弱 | 较强 |

## 核心概念

- **镜像（Image）**：只读模板，分层存储（UnionFS）
- **容器（Container）**：镜像的运行实例，有可写层
- **Dockerfile**：构建镜像的指令文件
- **Registry**：镜像仓库（Docker Hub）

## Dockerfile 最佳实践

```dockerfile
# 使用精简基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 先复制依赖文件（利用分层缓存）
COPY package*.json ./
RUN npm ci --only=production

# 再复制源代码
COPY . .

# 非 root 用户运行
USER node

EXPOSE 3000
CMD ["node", "server.js"]
```

## 常见易错点

1. **容器不是轻量级虚拟机**：容器是隔离的进程，不是虚拟硬件
2. **数据持久化**：容器删除后可写层数据丢失，需要 volume
3. **一个容器一个进程**：不要在容器内运行多个服务

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">2 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. Docker 和虚拟机有什么区别？</span>
    <span class="dig-tag dig-tag--easy" style="margin: 0;">基础</span>
  </div>
  <div class="dig-questions__item">
    <span>2. Docker 镜像分层原理是什么？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
</div>

### 真题 1：Docker vs 虚拟机

**参考回答**：Docker 容器是进程级隔离，共享宿主机内核，通过 namespace 隔离进程空间、通过 cgroup 限制资源。虚拟机是硬件级隔离，有独立的操作系统内核。容器启动快（秒级）、体积小（MB 级）、性能接近原生，但隔离性不如虚拟机。

### 真题 2：镜像分层

**参考回答**：Docker 镜像由多个只读层组成，每条 Dockerfile 指令创建一层。层可以被多个镜像共享，节省存储。运行容器时在最上层添加一个可写层。利用分层缓存特性，应将不常变化的层（如依赖安装）放在前面，常变化的（如代码）放后面。

## 延伸阅读

- [Docker 官方文档](https://docs.docker.com/)
- [Docker 从入门到实践](https://yeasy.gitbook.io/docker_practice/)
````

- [ ] **Step 4: Verify all articles render**

```bash
npm run docs:dev
```

Navigate through each domain and article. Expected: All articles follow the same visual pattern with tags, tip callouts, and interview questions sections.

- [ ] **Step 5: Commit**

```bash
git add docs/operating-systems/ docs/computer-networks/ docs/databases/ docs/system-design/ docs/programming-languages/ docs/web-and-frameworks/ docs/devops/
git commit -m "feat: add sample articles for all 8 domains"
```

---

### Task 9: GitHub Actions Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create deployment workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run docs:build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Update VitePress config for GitHub Pages base path**

Add `base` to `docs/.vitepress/config.ts` (first line inside `defineConfig`):

```ts
base: '/dev-interview-guide/',
```

This is needed because GitHub Pages serves from `https://username.github.io/dev-interview-guide/`.

- [ ] **Step 3: Verify build succeeds locally**

```bash
npm run docs:build
```

Expected: Build completes without errors. Output in `docs/.vitepress/dist/`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml docs/.vitepress/config.ts
git commit -m "feat: add GitHub Actions deployment pipeline"
```

---

### Task 10: Final Verification and Push

- [ ] **Step 1: Run full build**

```bash
npm run docs:build
```

Expected: Clean build with no warnings or errors.

- [ ] **Step 2: Preview the built site**

```bash
npm run docs:preview
```

Expected: Preview server starts. Navigate through homepage (domain cards), domain landing pages, and individual articles. Verify green theme, code blocks, interview questions sections, sidebar, and TOC all render correctly.

- [ ] **Step 3: Create GitHub repository**

```bash
cd c:/Users/liuku/project/ai-playground/dev-interview-guide
gh repo create dev-interview-guide --public --source=. --remote=origin --description="系统化的程序员面试知识体系 - Developer Interview Guide"
```

- [ ] **Step 4: Push to GitHub**

```bash
git push -u origin main
```

- [ ] **Step 5: Enable GitHub Pages**

Go to repo Settings → Pages → Source: "GitHub Actions". The deployment workflow will run automatically on the next push.

- [ ] **Step 6: Verify deployment**

After the action completes, visit `https://YOUR_USERNAME.github.io/dev-interview-guide/`.

Expected: The live site matches the local preview.
