---
title: 计算机网络
---

# 计算机网络

这一章按协议栈分层组织，从网络模型基础到应用层协议逐层递进。每一节都给出核心原理和面试常问。

## 怎么使用这一章

1. 先看网络模型，建立分层思维。
2. 再看传输层（TCP/UDP）和应用层（HTTP/DNS），掌握最高频的面试知识点。
3. 最后看 WebSocket、网络安全和 CDN 等扩展主题。

## 分类地图

| 类别 | 概念 | 核心内容 | 面试频率 |
|------|------|------|------|
| [网络模型](./network-model) | OSI 七层 vs TCP/IP 四层 | 每层职责与常见协议 | 中 |
| [TCP 与 UDP](./tcp-udp) | 传输层核心协议 | 三次握手、四次挥手、可靠传输 | 高 |
| [HTTP 与 HTTPS](./http-https) | 应用层最重要的协议 | HTTP 版本演进、TLS 握手、缓存机制 | 高 |
| [DNS](./dns) | 域名解析系统 | 解析流程、递归 vs 迭代、DNS 缓存 | 中 |
| [WebSocket](./websocket) | 全双工通信协议 | 握手升级、vs 轮询/SSE、心跳保活 | 中 |
| [网络安全](./network-security) | 常见攻击与防御 | TLS/SSL、XSS、CSRF、中间人攻击 | 高 |
| [CDN 与负载均衡](./cdn-load-balancing) | 网络架构优化 | CDN 回源、负载均衡算法 | 中 |

## 建议顺序

1. 先看 [网络模型](./network-model)，建立协议栈的分层思维。
2. 再看 [TCP 与 UDP](./tcp-udp)，掌握传输层最高频考点。
3. 然后看 [HTTP 与 HTTPS](./http-https)，理解应用层协议与 TLS。
4. 再看 [DNS](./dns) 和 [网络安全](./network-security)。
5. 最后看 [WebSocket](./websocket) 和 [CDN 与负载均衡](./cdn-load-balancing)。
