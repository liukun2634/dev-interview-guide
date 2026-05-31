---
title: 大厂系统设计实战题
---

# 大厂系统设计实战题

本章收录腾讯、阿里、美团、字节跳动四家大厂的高频系统设计面试真题，每道题均包含真实规模估算、架构设计、核心技术决策、生产踩坑经验，以及面试评分维度，适合 3 年以上工程师备战大厂系统设计面试。

## 按公司索引

| 公司 | 题目 | 核心考点 |
|------|------|---------|
| 腾讯 | [微信消息系统](./wechat-messaging) / [微信朋友圈](./wechat-moments) / [微信红包](./wechat-red-packet) / [登录与在线状态](./wechat-login) | IM、Feed 流、高并发、状态服务 |
| 阿里 | [双十一洪峰](./double-eleven-spike) / [支付宝支付](./alipay-payment) / [淘宝搜索](./taobao-search) / [库存系统](./inventory-system) | 流量削峰、分布式事务、搜索排序、防超卖 |
| 美团 | [外卖调度](./delivery-dispatch) / [附近搜索](./nearby-restaurant) / [评价系统](./review-system) | 实时调度、地理位置、UGC 审核 |
| 字节 | [抖音推荐流](./tiktok-feed) / [抖音直播](./live-streaming) / [飞书协同编辑](./feishu-collab-doc) | 推荐系统、直播 CDN、CRDT |

## 按场景索引

| 场景 | 题目 |
|------|------|
| 高并发 / 削峰 | [双十一洪峰](./double-eleven-spike)、[微信红包](./wechat-red-packet) |
| 消息 / IM | [微信消息系统](./wechat-messaging)、[飞书协同编辑](./feishu-collab-doc) |
| Feed 流 / 推荐 | [微信朋友圈](./wechat-moments)、[抖音推荐流](./tiktok-feed) |
| 支付 / 分布式事务 | [支付宝支付](./alipay-payment)、[阿里库存系统](./inventory-system) |
| 地理位置 | [美团附近搜索](./nearby-restaurant)、[美团外卖调度](./delivery-dispatch) |
| 流媒体 | [抖音直播系统](./live-streaming) |
| 搜索 | [淘宝商品搜索](./taobao-search) |
| UGC / 内容 | [美团评价系统](./review-system) |
| 登录 / 状态 | [微信登录与在线状态](./wechat-login) |

## 答题框架

每道题建议按以下步骤回答：

1. **需求澄清**（2 分钟）：确认 DAU/QPS 规模、核心功能边界、一致性要求
2. **规模估算**（3 分钟）：计算峰值 QPS、存储容量、带宽
3. **高层架构**（5 分钟）：画出核心组件和数据流，识别系统瓶颈
4. **核心设计**（10 分钟）：针对瓶颈展开关键技术决策，说清楚 **为什么选 A 不选 B**
5. **扩展优化**（5 分钟）：说明演进路径、容灾方案、监控指标
