# Dev Interview Guide - Design Spec

## Overview

A static knowledge-base website for developer interview preparation, covering 8 major technical domains. Each domain combines conceptual knowledge with real interview questions. Built with VitePress and deployed on GitHub Pages.

- **Repo name:** `dev-interview-guide`
- **Target audience:** Full-stack / Backend engineers
- **Content language:** Chinese (primary), English for technical terms
- **Tech stack:** VitePress + GitHub Pages

## Content Structure

Content is organized by technical domain. Each domain is a top-level navigation section containing multiple articles. Every article includes both knowledge explanation and related interview questions.

### Domains

| # | Domain | Scope |
|---|--------|-------|
| 1 | Data Structures & Algorithms | Array, linked list, stack, queue, tree, graph, hash table; sorting, searching, dynamic programming, greedy, backtracking |
| 2 | Operating Systems | Process & thread, memory management, file system, deadlock, scheduling, virtual memory, IO models |
| 3 | Computer Networks | OSI/TCP layers, TCP/UDP, HTTP/HTTPS, DNS, CDN, WebSocket, load balancing |
| 4 | Databases | SQL fundamentals, indexing, transactions & locks, MySQL, PostgreSQL, Redis, MongoDB |
| 5 | System Design | Distributed systems, microservices, message queues, caching strategies, rate limiting, CAP theorem |
| 6 | Programming Languages | Language-specific features, concurrency models, memory models, GC (Java / Go / Python etc.) |
| 7 | Web & Frameworks | RESTful API, GraphQL, authentication, Spring / Express / Django framework internals |
| 8 | DevOps & Engineering Practices | Git, Docker, K8s, CI/CD, monitoring, logging, performance optimization, testing |

### Article Structure

Each article follows a consistent structure:

1. **Knowledge Overview** - One-sentence summary of the core concept
2. **Detailed Explanation** - Principles, diagrams, code examples
3. **Interview Questions** - High-frequency questions with reference answers
4. **Common Pitfalls** - Frequently confused points and traps
5. **Further Reading** - Recommended external resources

## Visual Design

### Style Direction

- **Color scheme:** Green primary (`#2d8659` / `#45b97c`), light background (`#f6f8f4`), white card surfaces
- **Tone:** Bright, warm, professional with design polish - not flat or generic
- **Reading comfort:** Optimized for long reading sessions

### Key Design Elements

- Gradient logo and primary CTA buttons (green gradient)
- Rounded card layouts with subtle shadows for topic cards on homepage
- Each domain has its own gradient icon color (green, pink, blue, orange, etc.) for visual distinction
- Code blocks with dark green background (`#1b2b1b`) and window-style decoration dots
- Interview question sections with green gradient header bar
- Pill-shaped tags for difficulty levels (color-coded: green=easy, yellow=medium, red=hard)
- Right-side TOC (table of contents) navigation on article pages
- Breadcrumb navigation on article pages

### Page Types

1. **Homepage** - Hero section with tagline + grid of domain cards showing article/question counts
2. **Domain landing page** - List of articles within a domain with brief descriptions
3. **Article page** - Three-column layout: left sidebar (navigation), center (content), right sidebar (TOC)

## Technical Architecture

### VitePress Configuration

- Default theme with custom CSS overrides for the green color scheme
- Built-in search (MiniSearch)
- Dark mode toggle available (VitePress built-in) but light mode as default
- Code syntax highlighting with copy button (built-in)
- Sidebar auto-generated from file structure

### Directory Structure

```
dev-interview-guide/
  docs/
    .vitepress/
      config.ts          # VitePress configuration
      theme/
        index.ts         # Theme customization
        custom.css        # Custom styles (green theme)
    index.md             # Homepage
    data-structures-and-algorithms/
      index.md           # Domain landing page
      array-and-linked-list.md
      binary-tree.md
      hash-table.md
      sorting-algorithms.md
      dynamic-programming.md
      ...
    operating-systems/
      index.md
      process-and-thread.md
      memory-management.md
      ...
    computer-networks/
      index.md
      tcp-udp.md
      http-https.md
      ...
    databases/
      index.md
      sql-fundamentals.md
      indexing.md
      redis.md
      ...
    system-design/
      index.md
      distributed-systems.md
      caching-strategies.md
      ...
    programming-languages/
      index.md
      java/
      go/
      python/
      ...
    web-and-frameworks/
      index.md
      restful-api.md
      authentication.md
      ...
    devops/
      index.md
      docker.md
      kubernetes.md
      cicd.md
      ...
  package.json
  .gitignore
```

### Deployment

- GitHub Pages via GitHub Actions
- Trigger on push to `main` branch
- VitePress build output deployed to `gh-pages` branch

### Markdown Frontmatter

Each article uses frontmatter for metadata:

```yaml
---
title: Binary Tree
category: Data Structures & Algorithms
difficulty: intermediate  # beginner | intermediate | advanced
frequency: high           # low | medium | high
tags: [tree, recursion, BFS, DFS]
---
```

## MVP Scope

For the initial release, focus on:

- VitePress project setup with green theme customization
- Homepage with domain cards
- 1-2 sample articles per domain to establish the content pattern
- GitHub Actions deployment pipeline
- Basic sidebar navigation

Content will be expanded incrementally after the foundation is in place.
