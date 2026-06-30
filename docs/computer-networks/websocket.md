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

## ws:// vs wss://（基于 HTTPS 的加密 WebSocket）

WebSocket 有两种 scheme，与 HTTP/HTTPS 一一对应：

| Scheme | 类比 | 传输层 | 默认端口 |
|--------|------|--------|---------|
| `ws://` | HTTP | 明文 TCP | 80 |
| **`wss://`** | **HTTPS** | **TLS 加密 TCP** | **443** |

**核心理解：`wss://` = WebSocket over TLS，和 HTTPS 是同一套 TLS。** 升级握手不是直接发生在 TCP 上，而是发生在 **TLS 握手完成之后的加密通道里**：

```
ws://（明文）：
  TCP 三次握手 → HTTP Upgrade 请求(明文) → 101 Switching → 明文帧通信

wss://（加密）：
  TCP 三次握手
    → TLS 握手（证书校验 + 密钥协商，和 HTTPS 完全一样）
      → 在加密通道里发 HTTP Upgrade 请求 → 101 Switching
        → 之后所有 WebSocket 帧都经 TLS 加密
```

```javascript
// 浏览器：HTTPS 页面只能连 wss://（混合内容会被拦截）
const ws = new WebSocket('wss://server.example.com/chat');
```

::: tip 💡 为什么生产必须用 wss://
> ① **页面是 HTTPS 就必须用 wss://**——浏览器禁止 HTTPS 页面建立 `ws://` 明文连接（Mixed Content 拦截）；
> ② **`ws://` 的 Upgrade 握手是明文**，`Cookie` / `Authorization` / `Sec-WebSocket-Key` 都裸奔，易被中间人窃听或篡改；
> ③ **wss:// 更容易穿透代理 / 防火墙**——加密流量中间设备无法识别内容，不会因为看不懂 Upgrade 而粗暴断开。
:::

### wss:// 的 TLS 在哪里终止（生产架构必懂）

和 HTTPS 一样，TLS 通常**不在业务进程**终止，而在入口层卸载：

```
客户端 ──wss(TLS)──> Nginx / ALB / API Gateway ──ws(明文)──> 后端 WebSocket 服务
                     （TLS 卸载 + 证书管理）        （内网明文，省 CPU）
```

- **Nginx 反代 wss** 关键配置：必须显式转发 Upgrade 头，否则握手失败：
  ```nginx
  location /chat {
      proxy_pass http://ws_backend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;       # 必须
      proxy_set_header Connection "upgrade";        # 必须
      proxy_read_timeout 3600s;                     # 长连接防空闲断开
  }
  ```
- 证书、HTTP/2、ALPN、SNI 这些 HTTPS 的能力 wss 都复用，因为底层就是同一个 TLS。详见 [HTTP 与 HTTPS](./http-https)。

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

### Q4: ws:// 和 wss:// 有什么区别？HTTPS 页面能用 ws:// 吗？

`ws://` 是明文（类比 HTTP，端口 80），`wss://` 是 WebSocket over TLS（类比 HTTPS，端口 443），底层用的就是和 HTTPS 同一套 TLS。流程上 wss 是先完成 TLS 握手，再在加密通道里发 Upgrade 请求。HTTPS 页面**不能**用 `ws://`——浏览器会按 Mixed Content 拦截，必须用 `wss://`。生产环境 TLS 一般在 Nginx / ALB 卸载，转给后端走内网明文 ws，但反代必须显式转发 `Upgrade` / `Connection` 头。

## 看到什么就先想到这类

- 出现实时通信、聊天、推送。
- 出现 WebSocket、ws://。
- 出现 wss://、加密 WebSocket、HTTPS 页面连不上 → TLS + Mixed Content。
- 出现轮询、长轮询、SSE 对比。
- 出现 101 Switching Protocols、Upgrade。
- 出现 Nginx 反代 WebSocket 握手失败 → 没转发 Upgrade/Connection 头。
- 出现心跳保活、断线重连。
