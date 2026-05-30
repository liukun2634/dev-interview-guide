# 大厂系统设计实战题章节设计

**日期：** 2026-05-30  
**状态：** 待实现

---

## 目标

在现有 `system-design` 章节内新增一个独立子目录 `interview-cases`，收录腾讯、阿里、美团、字节跳动四家大厂的高频系统设计面试题，每题工程实战深度，覆盖真实技术选型与踩坑经验。

---

## 目录结构

```
docs/system-design/
├── (现有文件保持不变)
└── interview-cases/
    ├── index.md                    # 总览：按公司 & 按场景双索引
    ├── wechat-messaging.md         # 微信消息系统
    ├── wechat-moments.md           # 微信朋友圈 Feed 流
    ├── wechat-red-packet.md        # 微信红包
    ├── wechat-login.md             # 微信登录与在线状态
    ├── double-eleven-spike.md      # 阿里双十一洪峰
    ├── alipay-payment.md           # 支付宝支付系统
    ├── taobao-search.md            # 淘宝商品搜索
    ├── inventory-system.md         # 阿里库存系统
    ├── delivery-dispatch.md        # 美团外卖调度
    ├── nearby-restaurant.md        # 美团附近搜索
    ├── review-system.md            # 美团评价系统
    ├── tiktok-feed.md              # 抖音推荐流
    ├── live-streaming.md           # 抖音直播系统
    └── feishu-collab-doc.md        # 飞书协同编辑
```

总计：1 个 index.md + 14 道题目文件。

---

## VitePress Sidebar 变更

在 `docs/.vitepress/config.ts` 的 `/system-design/` sidebar 中，在现有列表末尾追加一个新的折叠分组：

```ts
{
  text: '大厂实战面试题',
  collapsed: false,
  items: [
    { text: '题目总览', link: '/system-design/interview-cases/' },
    { text: '微信消息系统', link: '/system-design/interview-cases/wechat-messaging' },
    { text: '微信朋友圈', link: '/system-design/interview-cases/wechat-moments' },
    { text: '微信红包', link: '/system-design/interview-cases/wechat-red-packet' },
    { text: '微信登录与在线状态', link: '/system-design/interview-cases/wechat-login' },
    { text: '阿里双十一洪峰', link: '/system-design/interview-cases/double-eleven-spike' },
    { text: '支付宝支付系统', link: '/system-design/interview-cases/alipay-payment' },
    { text: '淘宝商品搜索', link: '/system-design/interview-cases/taobao-search' },
    { text: '阿里库存系统', link: '/system-design/interview-cases/inventory-system' },
    { text: '美团外卖调度', link: '/system-design/interview-cases/delivery-dispatch' },
    { text: '美团附近搜索', link: '/system-design/interview-cases/nearby-restaurant' },
    { text: '美团评价系统', link: '/system-design/interview-cases/review-system' },
    { text: '抖音推荐流', link: '/system-design/interview-cases/tiktok-feed' },
    { text: '抖音直播系统', link: '/system-design/interview-cases/live-streaming' },
    { text: '飞书协同编辑', link: '/system-design/interview-cases/feishu-collab-doc' },
  ],
},
```

同时在 `system-design/index.md` 的分类地图表格末尾追加一行：

```md
| [大厂实战面试题](./interview-cases/) | 腾讯/阿里/美团/字节真实面试题解析 | 微信消息、双十一洪峰、外卖调度、抖音推荐等 14 道工程实战题 |
```

---

## index.md 结构（interview-cases/index.md）

```
---
title: 大厂系统设计实战题
---

# 大厂系统设计实战题

## 按公司索引
| 公司 | 题目 | 核心考点 |
|------|------|---------|
| 腾讯 | 微信消息系统 / 朋友圈 / 红包 / 登录 | IM、Feed流、高并发、状态服务 |
| 阿里 | 双十一洪峰 / 支付宝 / 淘宝搜索 / 库存 | 流量削峰、分布式事务、搜索、防超卖 |
| 美团 | 外卖调度 / 附近搜索 / 评价系统 | 实时调度、地理位置、UGC |
| 字节 | 抖音推荐 / 直播 / 飞书协同 | 推荐系统、直播CDN、CRDT |

## 按场景索引
| 场景 | 题目 |
|------|------|
| 高并发/削峰 | 双十一洪峰、微信红包、微信登录 |
| 消息/IM | 微信消息系统、飞书协同编辑 |
| Feed 流/推荐 | 微信朋友圈、抖音推荐流 |
| 支付/事务 | 支付宝支付、阿里库存 |
| 地理位置 | 美团附近搜索、外卖调度 |
| 流媒体 | 抖音直播 |
| 搜索 | 淘宝商品搜索 |
| UGC/内容 | 美团评价系统 |
```

---

## 每题文件统一结构（工程实战深度）

```markdown
---
title: [题目名称]
---

# [题目名称]

> **面试场景：** [公司] [岗位级别] 系统设计面试  
> **高频指数：** ⭐⭐⭐⭐⭐

## 题目背景

[面试官真实提问方式。描述业务背景、规模量级、约束条件。]

## 关键指标估算

| 指标 | 估算过程 | 结果 |
|------|---------|------|
| DAU | ... | ... |
| 峰值 QPS | ... | ... |
| 存储容量 | ... | ... |
| 带宽 | ... | ... |

## 高层架构

[Mermaid 架构图，展示核心组件和数据流]

## 核心设计决策

### [决策点 1]
- **方案 A**：xxx — 优点 / 缺点
- **方案 B**：xxx — 优点 / 缺点
- **大厂实际选择**：xxx，**原因**：xxx

### [决策点 2]
...

## 详细设计

[关键模块的深入拆解，包含数据模型、接口设计、时序图]

## 踩过的坑 / 生产经验

[大厂在实际落地时遇到的问题和解决方案]

## 扩展考点

- **追问方向**：xxx
- **边界 Case**：xxx
- **演进路径**：xxx

## 面试评分维度

| 维度 | 基础分（60分） | 加分项（80+分） | 满分项（100分） |
|------|-------------|--------------|--------------|
| 需求分析 | ... | ... | ... |
| 架构设计 | ... | ... | ... |
| 技术深度 | ... | ... | ... |
| 权衡表达 | ... | ... | ... |
```

---

## 题目清单

| 序号 | 文件名 | 中文标题 | 公司 | 核心考点 |
|------|--------|---------|------|---------|
| 1 | `wechat-messaging.md` | 微信消息系统 | 腾讯 | IM 架构、离线推送、消息时序、已读未读 |
| 2 | `wechat-moments.md` | 微信朋友圈 Feed 流 | 腾讯 | 写扩散/读扩散、隐私可见性、评论通知 |
| 3 | `wechat-red-packet.md` | 微信红包 | 腾讯 | 高并发抢红包、DB 削峰、金额一致性 |
| 4 | `wechat-login.md` | 微信登录与 10 亿在线状态 | 腾讯 | OAuth、Token、状态服务、长连接 |
| 5 | `double-eleven-spike.md` | 阿里双十一洪峰 | 阿里 | 限流熔断、库存扣减、流量预热 |
| 6 | `alipay-payment.md` | 支付宝支付系统 | 阿里 | 分布式事务、对账系统、幂等设计 |
| 7 | `taobao-search.md` | 淘宝商品搜索 | 阿里 | 倒排索引、个性化、搜索排序 |
| 8 | `inventory-system.md` | 阿里库存系统 | 阿里 | 超卖防护、预扣库存、最终一致性 |
| 9 | `delivery-dispatch.md` | 美团外卖调度系统 | 美团 | 骑手分配、实时位置、调度算法 |
| 10 | `nearby-restaurant.md` | 美团附近搜索 | 美团 | GeoHash/四叉树、距离计算、实时更新 |
| 11 | `review-system.md` | 美团评价系统 | 美团 | UGC 审核、评分聚合、防刷单 |
| 12 | `tiktok-feed.md` | 抖音推荐流 | 字节 | 召回→排序→重排、协同过滤、冷启动 |
| 13 | `live-streaming.md` | 抖音直播系统 | 字节 | 推流/拉流、CDN 分发、弹幕、连麦 |
| 14 | `feishu-collab-doc.md` | 飞书协同编辑 | 字节 | OT/CRDT、冲突解决、实时同步 |

---

## 实现注意事项

1. **与现有 `real-world-cases.md` 的区分**：现有文件侧重通用设计方法（短链接、分布式文件存储），新章节侧重大厂真实场景与工程深度，两者互补不重叠。
2. **语言**：全部中文，技术术语保留英文（如 OT、CRDT、GeoHash）。
3. **Mermaid 图**：每题至少一张架构图，复杂题目加时序图。
4. **大厂实际方案**：基于公开技术博客/演讲（如腾讯云+社区、阿里中间件团队、美团技术团队、字节跳动技术博客）中披露的信息。
