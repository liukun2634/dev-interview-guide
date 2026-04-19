---
title: 程序员面试手册 — 浅绿自然主题 UI 重设计
date: 2026-04-13
status: approved
---

# 程序员面试手册 — 浅绿自然主题 UI 重设计

## 目标

重新设计 Dev Interview Guide (程序员面试手册) 的前端 UI，以浅绿自然色系为基调，突出 AI 技术板块作为核心差异化亮点，优化长时间阅读体验，提升用户吸引力和 GitHub star 转化。

## 设计决策

### 1. 色调方向：浅绿自然风

- **页面底色**: `#f6faf6` (淡绿)
- **强调色**: `#059669` (翠绿)
- **辅助色**: `#34d399` (亮绿，边框/装饰), `#065f46` (深绿，标题)
- **中性色**: `#374151` (正文), `#6b7280` (次要文字), `#9ca3af` (辅助文字)
- **卡片/内容背景**: `#ffffff`
- **边框**: `#e5e7eb` (标准), `#d1d5db` (稍深)
- **Tip/Info 背景**: `#f0fdf4` (浅绿), `#ecfdf5` (极浅绿)
- **暗色模式**: 深绿色系 — `#0c1210` (底色), `#141f1a` (卡片), `#1e3a2a` (subtle), `#2d4a3a` (边框)

### 2. 首页：AI 宽卡片突出

- 2 列网格布局
- AI 技术卡片横跨 2 列 (grid-column: span 2)，浅绿渐变背景 + 绿色边框 + HOT 标签
- 显示 4 个子主题 (LLM · RAG · Prompt · Agent) 和文章数量
- 其他 7 个领域使用标准单列卡片，白底 + 灰边框
- 每张卡片显示标题 + 简述
- 站名改为"程序员面试手册"，tagline 保留

### 3. 侧边栏：全展开 + 可折叠

- 默认所有章节展开，显示全部文章链接
- 章节标题可点击折叠/展开
- 当前文章绿色高亮 (背景 `#ecfdf5` 或左侧绿色竖线)
- 章节标题加粗，用分隔线分隔各章节
- VitePress sidebar 配置：所有 section 设 `collapsed: false`

### 4. 代码块：极简白底 + 轻装饰

- 背景: `#f8fafc` (极浅灰白)
- 边框: `1px solid #e2e8f0`
- 圆角: `8px`
- 顶部细栏: 显示语言标签 (左) 和复制按钮 (右)
- 无 macOS 红绿灯装饰
- 无深色背景
- Shiki 使用内联样式，不需要额外语法高亮 CSS

### 5. 文章排版：卡片式正文

- 正文区域包裹在白色卡片内 (白底 + 细边框 + 圆角)
- 面包屑导航: `AI 技术 / LLM 基础`
- 标签行: 分类 + 难度 + 频率标签
- 阅读时间 + 最后更新日期
- Tip/Info/Warning/Danger 用左侧 4px 彩色边框
- 内容区最大宽度 860px，正文 16px，行高 1.85

## 保留的元素

- **标签系统**: 5 种 `.dig-tag` 变体 (category/easy/medium/hard/hot)，适配绿色主题
- **面试真题块**: `.dig-questions`，深绿头部 + 绿色 Q 标记
- **核心要点块**: `.dig-keypoints`，绿色头部
- **KaTeX 数学公式**: 保留 markdown-it-mathjax3
- **VitePress 自定义块**: `::: tip/info/warning/danger`
- **暗色模式切换**: VitePress 原生

## 移除的元素

- macOS 代码块装饰 (红黄绿圆点)
- ReadingProgress 阅读进度条组件
- 首页统计行 (8 大领域, 15+ 文章...)
- 首页功能展示 (结构化知识体系, 可运行代码...)
- 卡片动画 (stagger animation, hover 动画)
- 所有 box-shadow
- 所有 text-transform: uppercase

## 字体

- **正文**: Inter, "Noto Sans SC", system-ui, sans-serif
- **代码**: "JetBrains Mono", Consolas, monospace
- **加载**: Google Fonts (Inter 400/600/700/800, JetBrains Mono 400)

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `docs/.vitepress/theme/custom.css` | 完全重写 |
| `docs/.vitepress/theme/components/HomeContent.vue` | 重写，AI 宽卡片布局 |
| `docs/.vitepress/theme/index.ts` | 简化，移除 ReadingProgress |
| `docs/.vitepress/theme/components/ReadingProgress.vue` | 删除 |
| `docs/.vitepress/config.ts` | 更新 theme-color, sidebar collapsed 设为 false, 站名更新 |

## 验证标准

1. 首页: AI 宽卡片突出，8 个领域卡片网格正常
2. 文章页: 白色卡片包裹正文，面包屑 + 标签 + 阅读时间显示
3. 侧边栏: 全部展开，可折叠，当前文章绿色高亮
4. 代码块: 白底 + 语言标签 + 复制按钮，无macOS装饰
5. 暗色模式: 所有元素正确适配深绿色系
6. 移动端: 响应式网格，侧边栏折叠
7. 无残留旧主题样式 (teal, shadow, animation 等)
