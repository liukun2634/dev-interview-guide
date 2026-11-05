---
title: WebSocket
---

# WebSocket

## 概念

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。HTTP 是请求-响应模式（客户端主动），WebSocket 建立连接后双方可以随时发送数据。适用于实时通信场景。

## WebSocket vs HTTP 轮询 vs SSE

| 方式 | 方向 | 连接 | 实时性 | 适用场景 |
|------|------|------|--------|----------|
| HTTP 短轮询 | 客户端 → 服务端 | 每次新请求，可复用连接 | 取决于轮询间隔 | 简单状态检查 |
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

下面展示 HTTP/1.1 的 Upgrade 握手。HTTP/2 与 HTTP/3 中的 WebSocket 可使用扩展 CONNECT，但要求客户端、代理和服务端共同支持，不能把 101/Upgrade 当成所有协议版本唯一形式：

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

该描述限定上面的 HTTP/1.1 路径；扩展 CONNECT 仍使用相应 HTTP/2 或 HTTP/3 stream 承载。HTTP/2 不使用 HTTP/1.1 的 Connection/Upgrade 逐跳头。

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

心跳间隔应低于链路上最短 idle timeout，并考虑移动网络、后台标签页计时器节流和带宽。浏览器 WebSocket API 不直接暴露协议 Ping/Pong 的发送控制，可由服务端发 Ping，或在应用消息中定义心跳；Pong 证明连接可响应，不证明某条业务消息已经持久化或处理成功。

## 断线重连

```
连接断开 → 等待 1s 重连 → 失败 → 等待 2s → 失败 → 等待 4s → ... → 成功
```

指数退避应配最大间隔和随机抖动，否则一批同刻掉线的客户端仍会同步重连。鉴权失败、账号被禁用等不是应无限重试的短暂网络错误；恢复后也要限速回放，避免同时重连与补历史压垮服务。

### 连接恢复不等于业务恢复

WebSocket 提供连接内的有序字节/消息传输，不负责跨连接持久化、业务 ACK、重放或去重。`send()` 成功通常只是进入本地发送流程，不等于服务端提交了业务操作。

一个聊天/通知协议可约定：

```json
{
  "type": "message",
  "conversationId": "conversation-42",
  "eventId": "event-987",
  "sequence": 103,
  "payload": { "text": "hello" }
}
```

1. 服务端先把消息写入权威事件存储，再确认“已接收”；若还需“已送达”“已读”，使用不同状态，不混用一个 ACK。
2. `eventId` 用于重复投递去重，`sequence` 的顺序范围限定为会话/频道，不能把某连接的发送顺序当成全系统顺序。
3. 客户端保存最高**连续处理完成**的序号。收到 103 而缺少 102 时，不应把游标直接跳到 103，应补缺口或缓冲后续消息。
4. 重连携带已确认游标，服务端重放之后的事件；ACK 丢失可能导致重复，客户端按事件 ID 或序号幂等处理。
5. 历史已经过期时，返回“需要全量快照”及快照水位，再衔接增量，不能静默跳过缺失消息。

SSE 的 `id` / `Last-Event-ID` 能携带恢复游标，但服务器仍需实现保留与重放；协议自动重连本身不保证不丢消息。用户发起写操作可继续使用普通 HTTP 幂等 API，推送链路只负责分发结果，不必为了“双向”把所有操作塞进一个 socket。

### 慢客户端与背压

客户端处理速率低于推送速率时，无限追加发送缓冲会消耗服务端内存。经典浏览器 WebSocket API 没有自动的接收背压协议，应用需明确容量与处理策略：

| 数据性质 | 可选策略 | 必须保留的语义 |
|----------|----------|----------------|
| 最新行情、光标位置 | 合并同对象更新，只保留最新状态 | 标明序号/版本，允许跳过中间态 |
| 聊天、订单事件 | 持久日志 + 有界发送窗口 + ACK | 不静默丢弃；断开后按游标恢复 |
| 大消息/文件 | 限制帧与消息大小，文件走独立上传下载 | 防止大消息挤占心跳与全部连接内存 |

按连接限制排队字节、未确认条数、最长积压时间和消息速率，监控 `bufferedAmount` 或服务端等价指标。超过预算时断开并要求恢复，比耗尽整个进程内存更可控；压缩也可能增加 CPU 与解压后体积，不能只限制压缩前后其中一个尺寸。

### 长连接安全与身份变更

- 浏览器握手通常携带 Cookie，但原生构造器不能像普通 fetch 一样任意设置 Authorization 头。可使用受控 Cookie 或短时一次性连接票据；避免把长期 token 放在容易被访问日志记录的 URL 中。
- 服务端校验 Origin 白名单以防跨站 WebSocket 劫持，不能假设普通 CORS 配置自动保护 WebSocket；Origin 也不能替代非浏览器客户端的身份认证。
- 握手授权只说明当时能连接。订阅某个租户/频道、发送业务消息时还要检查对象级权限；退出登录、token 到期和权限撤销要定义断开/重新认证策略。
- TLS 在入口终止后，内部链路是否再次加密取决于威胁模型，不能默认“内网天然可信”。

## WebSocket 与负载均衡

WebSocket 是有状态的长连接，负载均衡需要注意：

- 已建立的连接自然固定到处理它的后端，重连不必强制回原节点；只有本地会话状态不可迁移时才依赖额外粘性。
- 连接注册表记录用户/订阅与网关节点的关系，消息路由到真正持有 socket 的节点。Pub/Sub 可做在线分发，但离线恢复依赖持久事件源，不靠广播补历史。

**排障与压测**：同时测活跃连接、握手失败率、心跳 RTT、发送队列字节、消息年龄、重连率和恢复耗时。发布时先停止接收新连接，再通知/排空旧连接，并验证一次网关故障后的重连风暴与重复消息处理。

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
