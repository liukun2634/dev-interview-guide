---
title: 大厂系统设计实战题
---

# 大厂系统设计实战题

本章收录腾讯、阿里、美团、字节跳动四家大厂的高频系统设计面试真题，每道题均包含真实规模估算、架构设计、核心技术决策、生产踩坑经验，以及面试评分维度，适合 3 年以上工程师备战大厂系统设计面试。

> **备考提示：** 🔥 必考题 建议优先掌握；⭐ 高频题 按目标公司选择；📌 专项题 针对特定岗位准备。AI 相关岗位（推荐/搜索/风控/ML 平台）请额外关注文末 AI 通用部分。

## 按公司索引

| 公司 | 题目 | 频率 |
|------|------|------|
| 腾讯 | [微信消息系统](./wechat-messaging) | 🔥 必考题 |
| 腾讯 | [微信朋友圈](./wechat-moments) | ⭐ 高频题 |
| 腾讯 | [微信红包](./wechat-red-packet) | ⭐ 高频题 |
| 腾讯 | [微信登录与在线状态](./wechat-login) | 📌 专项题 |
| 阿里 | [双十一洪峰](./double-eleven-spike) | 🔥 必考题 |
| 阿里 | [支付宝支付系统](./alipay-payment) | 🔥 必考题 |
| 金融科技 | [证券交易系统（撮合/清算）](./trading-system) | 🔥 必考题（金融岗） |
| 阿里 | [淘宝商品搜索](./taobao-search) | ⭐ 高频题 |
| 阿里 | [阿里库存系统](./inventory-system) | ⭐ 高频题 |
| 美团 | [外卖调度系统](./delivery-dispatch) | ⭐ 高频题 |
| 美团 | [附近商家搜索](./nearby-restaurant) | ⭐ 高频题 |
| 美团 | [评价系统](./review-system) | 📌 专项题 |
| 字节 | [抖音推荐流](./tiktok-feed) | 🔥 必考题 |
| 字节 | [抖音直播系统](./live-streaming) | ⭐ 高频题 |
| 字节 | [飞书协同编辑](./feishu-collab-doc) | 📌 专项题 |
| AI 通用 | [大模型推理服务设计](./llm-inference-service) | 🔥 必考题（AI 岗） |
| AI 通用 | [向量数据库与 RAG 系统设计](./vector-db-rag) | 🔥 必考题（AI 岗） |
| AI 通用 | [实时特征平台设计](./feature-store) | ⭐ 高频题（ML 平台岗） |

## 按场景索引

| 场景 | 题目 |
|------|------|
| 高并发 / 削峰 | [双十一洪峰](./double-eleven-spike)、[微信红包](./wechat-red-packet) |
| 消息 / IM | [微信消息系统](./wechat-messaging)、[飞书协同编辑](./feishu-collab-doc) |
| Feed 流 / 推荐 | [微信朋友圈](./wechat-moments)、[抖音推荐流](./tiktok-feed) |
| 支付 / 分布式事务 | [支付宝支付](./alipay-payment)、[阿里库存系统](./inventory-system) |
| 金融 / 交易 / 撮合 | [证券交易系统](./trading-system)（另可参考算法章节的 [撮合引擎手撕](../../data-structures-and-algorithms/tree/matching-engine)） |
| 地理位置 | [美团附近搜索](./nearby-restaurant)、[美团外卖调度](./delivery-dispatch) |
| 流媒体 | [抖音直播系统](./live-streaming) |
| 搜索 | [淘宝商品搜索](./taobao-search) |
| UGC / 内容 | [美团评价系统](./review-system) |
| 登录 / 状态 | [微信登录与在线状态](./wechat-login) |
| AI / 机器学习系统 | [大模型推理服务](./llm-inference-service)、[向量数据库与 RAG](./vector-db-rag)、[抖音推荐流](./tiktok-feed)、[实时特征平台](./feature-store) |

## 答题框架

每道题建议按以下步骤回答：

1. **需求澄清**（2 分钟）：确认 DAU/QPS 规模、核心功能边界、一致性要求
2. **规模估算**（3 分钟）：计算峰值 QPS、存储容量、带宽
3. **高层架构**（5 分钟）：画出核心组件和数据流，识别系统瓶颈
4. **核心设计**（10 分钟）：针对瓶颈展开关键技术决策，说清楚 **为什么选 A 不选 B**
5. **扩展优化**（5 分钟）：说明演进路径、容灾方案、监控指标
