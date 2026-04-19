# Unified Docs Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the VitePress homepage, top navigation, sidebar, and document pages into one reading-first design system without rewriting content or adding growth modules.

**Architecture:** Keep the current theme wiring in `docs/.vitepress/theme/index.ts` and continue using `docs/.vitepress/theme/github-docs.css` as the single source of truth for tokens and shared component styling. Update the navigation/sidebar Vue components only where structure or copy must change, then reshape the homepage component so it matches the same restrained, trust-first visual language as the docs pages.

**Tech Stack:** VitePress 1.6.4, Vue 3 SFCs, CSS custom properties, markdown-it-mathjax3

---

### File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `docs/.vitepress/config.ts` | Modify | Align metadata and theme color with the new unified token system |
| `docs/.vitepress/theme/github-docs.css` | Modify | Single design-system file for tokens, layout shell, docs typography, cards, tables, code, blocks, outline, nav, sidebar |
| `docs/.vitepress/theme/components/NavHeader.vue` | Modify | Brand + section switcher chrome in the top nav |
| `docs/.vitepress/theme/components/GitHubStar.vue` | Modify | Right-side nav CTA styling so it matches the new chrome |
| `docs/.vitepress/theme/components/SidebarHeader.vue` | Modify | Current section identity block above the sidebar tree |
| `docs/.vitepress/theme/components/SidebarBack.vue` | Modify | Low-noise return-home affordance below the sidebar tree |
| `docs/.vitepress/theme/components/HomeContent.vue` | Modify | Restrained trust-first homepage with unified category card family |
| `docs/index.md` | Keep or minor copy-only touch | Homepage entry remains `<HomeContent />`; do not introduce a separate growth layout |
| `docs/.vitepress/theme/index.ts` | No change | Existing slot wiring already matches the intended architecture |
| `docs/.vitepress/theme/components/NavSectionSelector.vue` | No change | Not currently mounted; leave untouched |
| `docs/.vitepress/theme/components/SidebarSelector.vue` | No change | Not currently mounted; leave untouched |

---

### Task 1: Unify design tokens and site metadata

**Files:**
- Modify: `docs/.vitepress/config.ts`
- Modify: `docs/.vitepress/theme/github-docs.css`

- [ ] **Step 1: Update the site metadata to match the approved design direction**

In `docs/.vitepress/config.ts`, change the theme color and fix the description copy so it reflects 9 domains instead of 8:

```typescript
['meta', { name: 'theme-color', content: '#0f766e' }],
```

```typescript
description: '系统化的程序员面试知识体系，涵盖算法、系统设计、数据库、AI 等 9 大领域，含代码示例与高频真题',
```

```typescript
['meta', { property: 'og:description', content: '系统化的程序员面试知识体系，涵盖算法、系统设计、数据库、AI 等 9 大领域，含代码示例与高频真题' }],
['meta', { name: 'twitter:description', content: '系统化的程序员面试知识体系，涵盖算法、系统设计、数据库、AI 等 9 大领域' }],
```

- [ ] **Step 2: Replace the top token block in `github-docs.css` with a single teal-neutral reading system**

Replace the existing `:root` and `.dark` token sections near the top of `docs/.vitepress/theme/github-docs.css` with this token direction:

```css
:root {
  --ghd-font-body: "Segoe UI", "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
  --ghd-font-display: "Georgia", "Times New Roman", "Songti SC", serif;
  --ghd-font-mono: "JetBrains Mono", Consolas, "SFMono-Regular", monospace;

  --ghd-bgColor-default: #f6f4ef;
  --ghd-bgColor-muted: #fbfaf7;
  --ghd-bgColor-inset: #efeae1;
  --ghd-bgColor-white: #ffffff;

  --ghd-fgColor-default: #1f2a2a;
  --ghd-fgColor-muted: #566161;
  --ghd-fgColor-subtle: #7b8686;

  --ghd-borderColor-default: #d9d4c7;
  --ghd-borderColor-muted: rgba(31, 42, 42, 0.08);
  --ghd-borderColor-emphasis: #b6b09f;

  --ghd-fgColor-accent: #0f766e;
  --ghd-fgColor-accent-hover: #115e59;
  --ghd-bgColor-accent-muted: rgba(15, 118, 110, 0.08);

  --ghd-success-fg: #166534;
  --ghd-success-muted: #e9f7ec;
  --ghd-attention-fg: #a16207;
  --ghd-attention-muted: #fff7e6;
  --ghd-danger-fg: #b42318;
  --ghd-danger-muted: #fff0ee;
  --ghd-severe-fg: #c2410c;
  --ghd-severe-muted: #fff2e8;

  --ghd-radius: 10px;
  --ghd-shadow-sm: 0 1px 2px rgba(17, 24, 39, 0.04);
  --ghd-shadow-md: 0 8px 24px rgba(17, 24, 39, 0.06);
  --ghd-shadow-lg: 0 20px 40px rgba(17, 24, 39, 0.10);

  --vp-font-family-base: var(--ghd-font-body);
  --vp-font-family-mono: var(--ghd-font-mono);
  --vp-c-brand-1: var(--ghd-fgColor-accent);
  --vp-c-brand-2: var(--ghd-fgColor-accent-hover);
  --vp-c-brand-soft: var(--ghd-bgColor-accent-muted);
  --vp-c-bg: var(--ghd-bgColor-default);
  --vp-c-bg-alt: var(--ghd-bgColor-muted);
  --vp-c-bg-elv: var(--ghd-bgColor-white);
  --vp-c-bg-soft: var(--ghd-bgColor-muted);
  --vp-c-text-1: var(--ghd-fgColor-default);
  --vp-c-text-2: var(--ghd-fgColor-muted);
  --vp-c-text-3: var(--ghd-fgColor-subtle);
  --vp-c-divider: var(--ghd-borderColor-default);
  --vp-c-border: var(--ghd-borderColor-default);
  --vp-sidebar-bg-color: var(--ghd-bgColor-muted);
  --vp-nav-bg-color: rgba(251, 250, 247, 0.88);
}

.dark {
  --ghd-bgColor-default: #0f1718;
  --ghd-bgColor-muted: #141d1e;
  --ghd-bgColor-inset: #0b1112;
  --ghd-bgColor-white: #172123;

  --ghd-fgColor-default: #e7eceb;
  --ghd-fgColor-muted: #a5b0ae;
  --ghd-fgColor-subtle: #7d8887;

  --ghd-borderColor-default: #2a3838;
  --ghd-borderColor-muted: rgba(231, 236, 235, 0.08);
  --ghd-borderColor-emphasis: #415151;

  --ghd-fgColor-accent: #6dd3c7;
  --ghd-fgColor-accent-hover: #8de3d9;
  --ghd-bgColor-accent-muted: rgba(109, 211, 199, 0.12);

  --ghd-success-fg: #6fcf97;
  --ghd-success-muted: rgba(111, 207, 151, 0.12);
  --ghd-attention-fg: #f5c76a;
  --ghd-attention-muted: rgba(245, 199, 106, 0.12);
  --ghd-danger-fg: #ff8a7a;
  --ghd-danger-muted: rgba(255, 138, 122, 0.12);
  --ghd-severe-fg: #ffb37a;
  --ghd-severe-muted: rgba(255, 179, 122, 0.12);

  --vp-nav-bg-color: rgba(20, 29, 30, 0.88);
}
```

- [ ] **Step 3: Update the global page shell so nav, sidebar, and main canvas share the same rhythm**

In `docs/.vitepress/theme/github-docs.css`, add or replace the global shell rules with:

```css
body {
  background: var(--ghd-bgColor-default);
  color: var(--ghd-fgColor-default);
}

.VPApp {
  background: linear-gradient(180deg, var(--ghd-bgColor-muted) 0, var(--ghd-bgColor-default) 180px);
}

.VPNav {
  background: var(--vp-nav-bg-color) !important;
  border-bottom: 1px solid var(--ghd-borderColor-default) !important;
  backdrop-filter: blur(14px);
}

.VPNavBar.has-sidebar .content,
.VPNavBar .content-body,
.VPNavBar .container {
  max-width: 1440px;
}

.VPSidebar {
  background: transparent !important;
  border-right: 1px solid var(--ghd-borderColor-default) !important;
}

.VPContent {
  background: transparent;
}
```

- [ ] **Step 4: Run the production build to verify token and config edits compile**

Run:

```bash
npm run docs:build
```

Expected: VitePress finishes without TypeScript or CSS parse errors and prints a successful build summary.

- [ ] **Step 5: Commit**

```bash
git add docs/.vitepress/config.ts docs/.vitepress/theme/github-docs.css
git commit -m "style: establish unified docs design tokens"
```

---

### Task 2: Redesign the top navigation chrome

**Files:**
- Modify: `docs/.vitepress/theme/components/NavHeader.vue`
- Modify: `docs/.vitepress/theme/components/GitHubStar.vue`
- Modify: `docs/.vitepress/theme/github-docs.css`

- [ ] **Step 1: Rewrite the nav header markup so brand and section context feel like one product**

In `docs/.vitepress/theme/components/NavHeader.vue`, replace the template with this structure:

```vue
<template>
  <div class="nav-header" :class="{ 'has-current': !!currentSection }">
    <a class="nav-brand" :href="withBase('/')">
      <span class="nav-brand-mark">册</span>
      <span class="nav-brand-copy">
        <span class="nav-brand-title">程序员面试手册</span>
        <span class="nav-brand-subtitle">Interview sprint knowledge base</span>
      </span>
    </a>

    <div class="nav-context" ref="selectorRef">
      <button class="nav-context-btn" @click="toggleDropdown" :class="{ active: dropdownOpen }">
        <span class="nav-context-label">{{ currentSection?.text || '全部领域' }}</span>
        <svg class="nav-context-chevron" viewBox="0 0 12 12" width="12" height="12" fill="currentColor">
          <path d="M6 8.825c-.2 0-.4-.1-.5-.2l-3.3-3.3c-.3-.3-.3-.8 0-1.1.3-.3.8-.3 1.1 0l2.7 2.7 2.7-2.7c.3-.3.8-.3 1.1 0 .3.3.3.8 0 1.1l-3.2 3.3c-.2.1-.4.2-.6.2Z" />
        </svg>
      </button>

      <Transition name="dropdown">
        <div v-if="dropdownOpen" class="nav-context-panel">
          <a
            v-for="section in sections"
            :key="section.link"
            :href="withBase(section.link)"
            class="nav-context-item"
            :class="{ current: isCurrent(section.link) }"
            @click="dropdownOpen = false"
          >
            <span class="nav-context-item__text">{{ section.text }}</span>
            <span v-if="isCurrent(section.link)" class="nav-context-item__badge">当前</span>
          </a>
        </div>
      </Transition>
    </div>
  </div>
</template>
```

Keep the existing `sections`, `currentSection`, `toggleDropdown`, and click-outside logic from the current script.

- [ ] **Step 2: Replace the nav header scoped styles with the restrained editorial treatment**

In the same file, replace the `<style scoped>` block with:

```vue
<style scoped>
.nav-header {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
  min-width: 0;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ghd-fgColor-default);
  text-decoration: none;
  min-width: 0;
}

.nav-brand-mark {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--ghd-bgColor-accent-muted);
  color: var(--ghd-fgColor-accent);
  font-size: 15px;
  font-weight: 700;
}

.nav-brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.nav-brand-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.1;
}

.nav-brand-subtitle {
  font-size: 11px;
  color: var(--ghd-fgColor-subtle);
  line-height: 1.2;
}

.nav-context { position: relative; }

.nav-context-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: 999px;
  background: var(--ghd-bgColor-white);
  color: var(--ghd-fgColor-default);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.nav-context-btn.active,
.nav-context-btn:hover {
  border-color: var(--ghd-borderColor-emphasis);
  background: var(--ghd-bgColor-muted);
}

.nav-context-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 240px;
  padding: 8px;
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: 14px;
  background: var(--ghd-bgColor-white);
  box-shadow: var(--ghd-shadow-lg);
}

.nav-context-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--ghd-fgColor-default);
  text-decoration: none;
}

.nav-context-item:hover,
.nav-context-item.current {
  background: var(--ghd-bgColor-accent-muted);
}

.nav-context-item__badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--ghd-fgColor-accent);
}

@media (max-width: 768px) {
  .nav-header { display: none; }
}
</style>
```

- [ ] **Step 3: Restyle the GitHub CTA to match the new nav chrome**

In `docs/.vitepress/theme/components/GitHubStar.vue`, keep the template structure but replace the `<style scoped>` block with:

```vue
<style scoped>
.nav-github-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
}

.nav-divider {
  width: 1px;
  height: 22px;
  background: var(--ghd-borderColor-default);
}

.nav-github {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: 999px;
  background: var(--ghd-bgColor-white);
  color: var(--ghd-fgColor-default);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
}

.nav-github:hover {
  border-color: var(--ghd-borderColor-emphasis);
  background: var(--ghd-bgColor-muted);
}

.nav-github-star {
  color: var(--ghd-attention-fg);
}

@media (max-width: 768px) {
  .nav-github-wrapper { display: none; }
}
</style>
```

- [ ] **Step 4: Tune the shared nav spacing in `github-docs.css`**

Add or replace these rules in `docs/.vitepress/theme/github-docs.css`:

```css
.VPNavBar {
  height: 72px !important;
}

.VPNavBar .content-body {
  gap: 16px;
}

.VPNavBarSearch {
  padding-right: 8px;
}

.VPNavBarSearch .DocSearch-Button {
  border-radius: 999px;
  border: 1px solid var(--ghd-borderColor-default);
  background: var(--ghd-bgColor-white);
}
```

- [ ] **Step 5: Run the production build**

Run:

```bash
npm run docs:build
```

Expected: Build succeeds and the Vue SFC changes compile cleanly.

- [ ] **Step 6: Commit**

```bash
git add docs/.vitepress/theme/components/NavHeader.vue docs/.vitepress/theme/components/GitHubStar.vue docs/.vitepress/theme/github-docs.css
git commit -m "style: unify top navigation chrome"
```

---

### Task 3: Redesign the sidebar identity and reading navigation

**Files:**
- Modify: `docs/.vitepress/theme/components/SidebarHeader.vue`
- Modify: `docs/.vitepress/theme/components/SidebarBack.vue`
- Modify: `docs/.vitepress/theme/github-docs.css`

- [ ] **Step 1: Replace the sidebar header with a current-section identity block**

In `docs/.vitepress/theme/components/SidebarHeader.vue`, change the template to:

```vue
<template>
  <div v-if="currentSection" class="sidebar-header">
    <p class="sidebar-header-eyebrow">当前领域</p>
    <a class="sidebar-header-title" :href="withBase(currentSection.link)">
      {{ currentSection.text }}
    </a>
    <p class="sidebar-header-note">从该领域概览进入，再按目录继续阅读。</p>
  </div>
</template>
```

Update the `sections` data so the link text remains exactly the current 9 domain names. Keep the existing route-based `currentSection` computed.

- [ ] **Step 2: Replace the sidebar header scoped styles**

Still in `SidebarHeader.vue`, replace the styles with:

```vue
<style scoped>
.sidebar-header {
  padding: 52px 0 14px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--ghd-borderColor-default);
}

.sidebar-header-eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ghd-fgColor-subtle);
}

.sidebar-header-title {
  display: block;
  margin: 0;
  color: var(--ghd-fgColor-default);
  text-decoration: none;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.sidebar-header-title:hover {
  color: var(--ghd-fgColor-accent);
}

.sidebar-header-note {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ghd-fgColor-muted);
}
</style>
```

- [ ] **Step 3: Reduce the visual weight of the sidebar back link**

In `docs/.vitepress/theme/components/SidebarBack.vue`, keep the current `showBack` logic but replace the styles with:

```vue
<style scoped>
.sidebar-back-wrapper {
  display: flex;
  justify-content: flex-start;
  margin-top: 20px;
}

.sidebar-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 999px;
  background: var(--ghd-bgColor-white);
  border: 1px solid var(--ghd-borderColor-default);
  color: var(--ghd-fgColor-muted);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
}

.sidebar-back:hover {
  color: var(--ghd-fgColor-accent);
  border-color: var(--ghd-borderColor-emphasis);
}
</style>
```

- [ ] **Step 4: Replace the sidebar tree styles in `github-docs.css`**

Add or replace these rules:

```css
.VPSidebar .curtain {
  background: transparent;
}

.VPSidebarItem.level-0 {
  padding-top: 10px;
  margin-top: 10px;
}

.VPSidebarItem.level-0 + .VPSidebarItem.level-0 {
  border-top: 1px solid var(--ghd-borderColor-muted);
}

.VPSidebarItem.level-0 > .item > .text {
  font-size: 13px;
  font-weight: 700;
  color: var(--ghd-fgColor-default);
  letter-spacing: 0.01em;
}

.VPSidebarItem .text {
  color: var(--ghd-fgColor-muted);
  line-height: 1.55;
}

.VPSidebarItem .link {
  border-radius: 8px;
}

.VPSidebarItem .link:hover {
  background: rgba(15, 118, 110, 0.05);
  color: var(--ghd-fgColor-accent) !important;
}

.VPSidebarItem.is-active > .item .link {
  background: var(--ghd-bgColor-accent-muted);
  color: var(--ghd-fgColor-default) !important;
  font-weight: 700;
}

.VPSidebarItem.is-active > .item > .indicator {
  background: var(--ghd-fgColor-accent) !important;
  width: 3px;
  border-radius: 999px;
}
```

- [ ] **Step 5: Run the production build**

Run:

```bash
npm run docs:build
```

Expected: Build succeeds and no Vue or CSS syntax errors are introduced.

- [ ] **Step 6: Commit**

```bash
git add docs/.vitepress/theme/components/SidebarHeader.vue docs/.vitepress/theme/components/SidebarBack.vue docs/.vitepress/theme/github-docs.css
git commit -m "style: refine sidebar identity and reading navigation"
```

---

### Task 4: Upgrade the document reading surface

**Files:**
- Modify: `docs/.vitepress/theme/github-docs.css`

- [ ] **Step 1: Wrap the document body in a restrained reading card**

In `docs/.vitepress/theme/github-docs.css`, add or replace the main content rules with:

```css
.VPDoc .container {
  max-width: 1440px;
}

.VPContent .vp-doc {
  max-width: 860px;
}

.VPDoc .container .content {
  margin: 28px 0 40px;
  padding: 36px 42px;
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: 18px;
  background: var(--ghd-bgColor-white);
  box-shadow: var(--ghd-shadow-sm);
}

@media (max-width: 768px) {
  .VPDoc .container .content {
    padding: 24px 18px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
```

- [ ] **Step 2: Replace the heading and paragraph rhythm with a reading-first hierarchy**

Add or replace:

```css
.vp-doc {
  color: var(--ghd-fgColor-default);
  font-size: 16px;
  line-height: 1.88;
}

.vp-doc h1,
.vp-doc h2,
.vp-doc h3 {
  letter-spacing: -0.02em;
}

.vp-doc h1 {
  margin: 0 0 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--ghd-borderColor-default);
  font-family: var(--ghd-font-display);
  font-size: 38px;
  line-height: 1.18;
}

.vp-doc h2 {
  margin-top: 40px;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ghd-borderColor-muted);
  font-size: 28px;
  line-height: 1.25;
}

.vp-doc h3 {
  margin-top: 28px;
  margin-bottom: 10px;
  font-size: 21px;
  line-height: 1.35;
}

.vp-doc p,
.vp-doc ul,
.vp-doc ol,
.vp-doc table,
.vp-doc div[class*='language-'],
.vp-doc .custom-block,
.vp-doc blockquote {
  margin-top: 0;
  margin-bottom: 20px;
}
```

- [ ] **Step 3: Replace code, table, and custom-block styling so all utility surfaces belong to one family**

Add or replace:

```css
.vp-doc div[class*='language-'] {
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: 14px;
  background: #f5f6f3 !important;
  overflow: hidden;
}

.vp-doc div[class*='language-']::before {
  content: "";
  display: block;
  height: 38px;
  border-bottom: 1px solid var(--ghd-borderColor-default);
  background: #ece9e0;
}

.vp-doc div[class*='language-'] > span.lang {
  top: 10px;
  left: 16px;
  font-size: 12px;
  color: var(--ghd-fgColor-subtle);
}

.vp-doc :not(pre) > code {
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--ghd-bgColor-accent-muted);
  color: var(--ghd-fgColor-accent);
}

.vp-doc table {
  display: table;
  width: 100%;
  overflow: hidden;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: 14px;
}

.vp-doc table th {
  background: #f3f0e8;
  color: var(--ghd-fgColor-muted);
  font-size: 13px;
  font-weight: 700;
}

.vp-doc table th,
.vp-doc table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--ghd-borderColor-muted);
}

.vp-doc .custom-block {
  border: 1px solid var(--ghd-borderColor-default);
  border-left-width: 4px;
  border-radius: 12px;
  padding: 14px 16px;
}

.vp-doc .custom-block.tip { background: var(--ghd-success-muted); border-left-color: var(--ghd-success-fg); }
.vp-doc .custom-block.info { background: var(--ghd-bgColor-accent-muted); border-left-color: var(--ghd-fgColor-accent); }
.vp-doc .custom-block.warning { background: var(--ghd-attention-muted); border-left-color: var(--ghd-attention-fg); }
.vp-doc .custom-block.danger { background: var(--ghd-danger-muted); border-left-color: var(--ghd-danger-fg); }
```

- [ ] **Step 4: Bring outline, footer, and custom knowledge blocks into the same system**

Add or replace:

```css
.VPDocAside .outline-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ghd-fgColor-subtle);
}

.VPDocOutlineItem .outline-link {
  border-left: 1px solid var(--ghd-borderColor-default);
  padding: 4px 0 4px 12px;
  color: var(--ghd-fgColor-muted);
}

.VPDocOutlineItem .outline-link.active,
.VPDocOutlineItem .outline-link:hover {
  border-left-color: var(--ghd-fgColor-accent);
  color: var(--ghd-fgColor-accent);
}

.VPDocFooter {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--ghd-borderColor-default);
}

.VPDocFooter .pager-link {
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: 14px;
  background: var(--ghd-bgColor-white);
}

.dig-keypoints,
.dig-questions {
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: 14px;
  overflow: hidden;
  background: var(--ghd-bgColor-white);
}

.dig-keypoints__title,
.dig-questions__header {
  background: #1b4443;
  color: #fff;
  font-weight: 700;
}
```

- [ ] **Step 5: Run the build and visually verify the reading surface**

Run:

```bash
npm run docs:build
```

Then run:

```bash
npm run docs:dev
```

Expected: The dev server prints a local URL such as `http://localhost:5173/`.

Open these pages and verify the golden path:
- `/dev-interview-guide/ai-technology/`
- `/dev-interview-guide/ai-technology/rag`
- `/dev-interview-guide/system-design/caching-strategies`

Check:
- h1/h2/h3 spacing is calmer and more consistent
- tables, code blocks, and custom blocks share one border/radius language
- right outline feels like reading navigation, not default anchors
- doc footer cards match the rest of the surface

- [ ] **Step 6: Commit**

```bash
git add docs/.vitepress/theme/github-docs.css
git commit -m "style: improve document reading surface"
```

---

### Task 5: Redesign the homepage as a restrained trust-first entry page

**Files:**
- Modify: `docs/.vitepress/theme/components/HomeContent.vue`
- Optionally modify: `docs/index.md`
- Modify: `docs/.vitepress/theme/github-docs.css`

- [ ] **Step 1: Replace `HomeContent.vue` with a hero + unified category-card layout**

Replace the component template and data model in `docs/.vitepress/theme/components/HomeContent.vue` with:

```vue
<template>
  <div class="dig-home">
    <section class="dig-home-hero">
      <p class="dig-home-hero__eyebrow">面试冲刺型知识库</p>
      <h1 class="dig-home-hero__title">程序员面试手册</h1>
      <p class="dig-home-hero__desc">
        用统一、可信、耐读的方式整理算法、系统设计、数据库、AI 等 9 大领域，帮助你快速定位重点并持续复习。
      </p>
    </section>

    <section class="dig-home-value">
      <div class="dig-home-value__item">系统化领域覆盖</div>
      <div class="dig-home-value__item">长文阅读优先</div>
      <div class="dig-home-value__item">高频面试场景导向</div>
    </section>

    <section class="dig-home-section">
      <div class="dig-home-section__head">
        <h2>知识领域</h2>
        <p>从基础概念进入，再沿侧栏继续阅读。</p>
      </div>
      <div class="dig-home-grid">
        <a v-for="topic in topics" :key="topic.link" :href="topic.link" class="dig-domain-card">
          <span class="dig-domain-card__kicker">{{ topic.kicker }}</span>
          <h3 class="dig-domain-card__title">{{ topic.title }}</h3>
          <p class="dig-domain-card__desc">{{ topic.desc }}</p>
          <span class="dig-domain-card__meta">{{ topic.meta }}</span>
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const topics = [
  { title: 'AI 技术', kicker: '前沿与高频', desc: 'LLM 原理、Prompt Engineering、RAG、Agent 与工程实践。', meta: '从概览到应用架构', link: '/dev-interview-guide/ai-technology/' },
  { title: '数据结构与算法', kicker: '基础必修', desc: '二叉树、哈希表、搜索与经典题型。', meta: '适合刷题与复盘', link: '/dev-interview-guide/data-structures-and-algorithms/' },
  { title: '编程语言', kicker: '语言核心', desc: 'Java 等语言基础、特性与常见面试问法。', meta: '语言机制与表达能力', link: '/dev-interview-guide/programming-languages/' },
  { title: '操作系统', kicker: '底层原理', desc: '进程线程、调度、内存与 IO 模型。', meta: '理解系统行为', link: '/dev-interview-guide/operating-systems/' },
  { title: '计算机网络', kicker: '协议与连接', desc: 'TCP/UDP、HTTP、网络分层与常见追问。', meta: '覆盖链路到应用层', link: '/dev-interview-guide/computer-networks/' },
  { title: '数据库', kicker: '存储与查询', desc: '索引、事务、锁与缓存协作。', meta: '兼顾 MySQL 与 Redis', link: '/dev-interview-guide/databases/' },
  { title: 'Web 与框架', kicker: '接口与工程', desc: 'RESTful API 与框架常见设计题。', meta: '贴近后端实战', link: '/dev-interview-guide/web-and-frameworks/' },
  { title: '系统设计', kicker: '架构进阶', desc: '缓存、限流、消息队列、微服务。', meta: '面向高频系统题', link: '/dev-interview-guide/system-design/' },
  { title: '工程实践', kicker: '落地能力', desc: 'Docker 与分布式 ID 等工程化主题。', meta: '连接知识与交付', link: '/dev-interview-guide/engineering-practice/' },
]
</script>
```

- [ ] **Step 2: Add homepage-specific styles to `github-docs.css`**

Append or replace the homepage section with:

```css
.dig-home {
  max-width: 1180px;
  margin: 0 auto;
  padding: 40px 24px 72px;
}

.dig-home-hero {
  max-width: 760px;
  margin: 0 0 32px;
}

.dig-home-hero__eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ghd-fgColor-accent);
}

.dig-home-hero__title {
  margin: 0;
  font-family: var(--ghd-font-display);
  font-size: 56px;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.dig-home-hero__desc {
  margin: 18px 0 0;
  max-width: 640px;
  font-size: 18px;
  line-height: 1.8;
  color: var(--ghd-fgColor-muted);
}

.dig-home-value {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.dig-home-value__item,
.dig-domain-card {
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: 16px;
  background: var(--ghd-bgColor-white);
  box-shadow: var(--ghd-shadow-sm);
}

.dig-home-value__item {
  padding: 16px 18px;
  font-size: 14px;
  font-weight: 600;
}

.dig-home-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.dig-domain-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px 20px;
  color: inherit !important;
  text-decoration: none !important;
}

.dig-domain-card:hover {
  border-color: var(--ghd-borderColor-emphasis);
  transform: translateY(-1px);
}

.dig-domain-card__kicker {
  font-size: 12px;
  font-weight: 700;
  color: var(--ghd-fgColor-accent);
}

.dig-domain-card__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
  color: var(--ghd-fgColor-default);
}

.dig-domain-card__desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ghd-fgColor-muted);
}

.dig-domain-card__meta {
  margin-top: auto;
  font-size: 12px;
  color: var(--ghd-fgColor-subtle);
}

@media (max-width: 960px) {
  .dig-home-value,
  .dig-home-grid {
    grid-template-columns: 1fr;
  }

  .dig-home-hero__title {
    font-size: 42px;
  }
}
```

- [ ] **Step 3: Keep `docs/index.md` minimal**

If `docs/index.md` still contains the current page wrapper, leave it as:

```markdown
---
layout: page
title: 程序员面试手册
sidebar: false
---

<HomeContent />
```
```

Do not add a growth hero, recommendation feed, or promo modules.

- [ ] **Step 4: Run the build and verify the homepage in the browser**

Run:

```bash
npm run docs:build
```

Then run:

```bash
npm run docs:dev
```

Open `/dev-interview-guide/` and verify:
- homepage reads as the same product as the docs pages
- hero is restrained and trust-first, not marketing-heavy
- all 9 cards share one visual family
- no featured growth slot, recommendation rail, or exposure module has been added

- [ ] **Step 5: Commit**

```bash
git add docs/.vitepress/theme/components/HomeContent.vue docs/.vitepress/theme/github-docs.css docs/index.md
git commit -m "style: redesign homepage as unified docs entry"
```

---

### Task 6: Final cross-page verification and polish

**Files:**
- Modify only if a defect is found during verification

- [ ] **Step 1: Run the final production build**

Run:

```bash
npm run docs:build
```

Expected: Build succeeds with no warnings that require code changes.

- [ ] **Step 2: Start the dev server for full UI verification**

Run:

```bash
npm run docs:dev
```

Expected: VitePress prints a local URL for browser verification.

- [ ] **Step 3: Verify the golden path in the browser**

Check these routes:
- `/dev-interview-guide/`
- `/dev-interview-guide/ai-technology/`
- `/dev-interview-guide/ai-technology/rag`
- `/dev-interview-guide/system-design/caching-strategies`

Confirm:
- homepage, nav, sidebar, and docs clearly belong to one product
- current section identity is visible in the sidebar
- current article highlight is clear but restrained
- long-form reading rhythm is calmer and more trustworthy
- tables, code blocks, callouts, `dig-keypoints`, and `dig-questions` feel visually consistent

- [ ] **Step 4: Verify dark mode and mobile behavior**

Check in the browser:
- dark mode keeps contrast and accent consistency in nav, sidebar, docs card, and homepage cards
- mobile width collapses the homepage grid cleanly
- nav still works when the desktop custom header is hidden at `max-width: 768px`
- no horizontal overflow appears on docs pages except intentional table overflow

- [ ] **Step 5: Fix any issues found during verification**

If a polish fix is needed, apply the smallest change possible in the affected file and rerun:

```bash
npm run docs:build
```

Expected: The fix compiles cleanly.

- [ ] **Step 6: Commit final polish if changes were required**

```bash
git add docs/.vitepress/config.ts docs/.vitepress/theme/github-docs.css docs/.vitepress/theme/components/NavHeader.vue docs/.vitepress/theme/components/GitHubStar.vue docs/.vitepress/theme/components/SidebarHeader.vue docs/.vitepress/theme/components/SidebarBack.vue docs/.vitepress/theme/components/HomeContent.vue docs/index.md
git commit -m "style: polish unified docs redesign"
```

If no additional fixes were required, skip this commit.

---

### Spec Coverage Check

- Unified token system: Task 1
- Unified top nav and sidebar chrome: Tasks 2 and 3
- Reading-first docs surface: Task 4
- Restrained homepage entry: Task 5
- No content rewrite: preserved throughout; only homepage component and chrome/theme files change
- No growth modules / exposure widgets: enforced in Task 5 and final verification

### Placeholder Scan

- No `TODO`, `TBD`, or “similar to previous task” placeholders remain.
- Every task names exact files, concrete snippets, and verification commands.

### Consistency Check

- The plan keeps `github-docs.css` as the single active theme file, matching `docs/.vitepress/theme/index.ts`.
- Inactive selector components are explicitly left untouched.
- All UI work stays within the approved scope: design-system unification and reading-quality improvements only.
