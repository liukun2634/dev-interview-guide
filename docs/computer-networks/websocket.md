---
title: WebSocket
---

# WebSocket

## 概念

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。HTTP 是请求-响应模式（客户端主动），WebSocket 建立连接后双方可以随时发送数据。适用于实时通信场景。

## WebSocket vs HTTP 轮询 vs SSE

| 方式 | 方向 | 连接 | 实时性 | 适用场景 |
|------|------|------|--------|----------|
| HTTP 短轮询 | 客户端 → 服务端 | 每次新建 | 差（轮询间隔） | 简单状态检查 |
| HTTP 长轮询 | 客户端 → 服务端 | 持续挂起 | 中等 | 消息通知 |
| SSE（Server-Sent Events） | 服务端 → 客户端 | 单向持久 | 好 | 股票行情、新闻推送 |
| WebSocket | 双向 | ✅ 全双工持久 | ✅ 最好 | 聊天、游戏、协作编辑 |

### 短轮询 vs 长轮询

```
短轮询：客户端每 N 秒请求一次
  客户端 → 有新消息吗？→ 没有
  客户端 → 有新消息吗？→ 没有
  客户端 → 有新消息吗？→ 有！返回数据

长轮询：客户端请求后服务端挂起，有数据才响应
  客户端 → 有新消息吗？→ 服务端挂起等待...  → 有了！返回数据
  客户端 → 立即再次请求...
```

**长轮询的问题：** 服务端需要为每个客户端保持连接，并发量大时资源消耗高。

### SSE（Server-Sent Events）

```http
# 服务端响应
Content-Type: text/event-stream

data: {"price": 150.5}

data: {"price": 151.2}
```

SSE 是基于 HTTP 的单向推送，简单易用，自动重连。但只能服务端向客户端推送。

## WebSocket 握手

WebSocket 通过 HTTP Upgrade 机制建立连接：

```http
# 客户端请求
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

```http
# 服务端响应
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

**握手后：** HTTP 连接升级为 WebSocket 连接，不再使用 HTTP 协议，而是使用 WebSocket 的帧格式通信。

### Sec-WebSocket-Key 的作用

- **不是加密！** 只是防止客户端意外发起 WebSocket 请求
- 服务端将 Key + GUID 拼接 → SHA1 → Base64 → 返回 Sec-WebSocket-Accept
- 客户端验证 Accept 值，确认服务端支持 WebSocket

## 心跳保活

WebSocket 连接可能被中间代理或防火墙因空闲超时而关闭，需要心跳保活：

```
# WebSocket 协议内置 Ping/Pong 帧
客户端 → Ping 帧 → 服务端
客户端 ← Pong 帧 ← 服务端

# 或应用层自定义心跳
客户端 → {"type": "ping"} → 服务端
客户端 ← {"type": "pong"} ← 服务端
```

**心跳间隔：** 通常 30-60 秒。超过一定次数未收到 Pong 则认为连接断开，触发重连。

## 断线重连

```
连接断开 → 等待 1s 重连 → 失败 → 等待 2s → 失败 → 等待 4s → ... → 成功
```

**指数退避（Exponential Backoff）：** 每次重连失败后等待时间翻倍，避免大量客户端同时重连导致服务端过载。

## WebSocket 与负载均衡

WebSocket 是有状态的长连接，负载均衡需要注意：

- **粘性会话（Sticky Session）**：同一客户端的请求始终转发到同一后端
- **或使用消息中间件**：后端通过 Redis Pub/Sub 或 MQ 广播消息，任何节点都能推送

## 面试常问 & 怎么答

### Q1: WebSocket 和 HTTP 的区别？

HTTP 是请求-响应模式，客户端主动发起，服务端被动响应；WebSocket 是全双工通信，双方都可以随时发送数据。WebSocket 通过 HTTP Upgrade 握手建立，之后不再走 HTTP 协议。适用于实时场景（聊天、游戏、协作）。

### Q2: WebSocket、轮询、SSE 怎么选？

简单状态检查用短轮询（最简单）；服务端单向推送用 SSE（自动重连、简单）；双向实时通信用 WebSocket（聊天、游戏）。SSE 不能客户端向服务端推送，WebSocket 可以。

### Q3: WebSocket 怎么保活？

用 Ping/Pong 心跳帧（WebSocket 协议内置）或应用层心跳消息，通常 30-60 秒一次。超时未收到 Pong 则判定断线，触发重连。重连采用指数退避策略。

## 看到什么就先想到这类

- 出现实时通信、聊天、推送。
- 出现 WebSocket、ws://。
- 出现轮询、长轮询、SSE 对比。
- 出现 101 Switching Protocols、Upgrade。
- 出现心跳保活、断线重连。
