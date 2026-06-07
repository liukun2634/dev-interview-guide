---
title: HTTP/3 与 QUIC 深度
---

# HTTP/3 与 QUIC 深度

<span class="dig-tag dig-tag--category">网络协议</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**HTTP/3 已是 2026 主流——Cloudflare 70%+ 流量、Google 80%+ 已 HTTP/3**。面试**必问**："为什么 QUIC 能解决 HTTP/2 的 TCP 队头阻塞？" 能讲清 **QUIC = UDP + TLS 1.3 + 多路复用 + 连接迁移 + 0-RTT** 立刻区分中/高级。
:::

## 三代 HTTP 演进

### HTTP/1.1 → HTTP/2 → HTTP/3 关键差异

```text
═══════════════════════════════════════════════════════════════
HTTP/1.1（1997）
═══════════════════════════════════════════════════════════════
   ┌─────────────────────────────┐
   │ Request 1 → wait → Response │   ← 串行（队头阻塞 #1）
   │ Request 2 → wait → Response │
   └─────────────────────────────┘
   优化: Pipelining（少见）+ 多连接（浏览器 6 个）

═══════════════════════════════════════════════════════════════
HTTP/2（2015）over TCP
═══════════════════════════════════════════════════════════════
   ┌─────────────────────────────────────┐
   │ 单 TCP 连接                          │
   │  ├ Stream 1: req/resp                │
   │  ├ Stream 2: req/resp  ← 多路复用!   │
   │  └ Stream N: req/resp                │
   └─────────────────────────────────────┘

   ✅ 解决: HTTP 层队头阻塞
   ❌ 仍存在: TCP 层队头阻塞（TCP 是 in-order 字节流）
       → 1 个包丢失 → 所有 Stream 都等

═══════════════════════════════════════════════════════════════
HTTP/3（2022 RFC 9114）over QUIC over UDP
═══════════════════════════════════════════════════════════════
   ┌─────────────────────────────────────┐
   │ QUIC（UDP 之上）                      │
   │  ├ Stream 1: 独立可靠传输             │
   │  ├ Stream 2: 独立可靠传输 ← 真独立!   │
   │  └ Stream N: 独立可靠传输             │
   └─────────────────────────────────────┘

   ✅ 解决: HTTP 层 + TCP 层队头阻塞
   ✅ 加: 0-RTT 握手 + 连接迁移 + 内建加密
```

### 关键参数对比

| 维度 | HTTP/1.1 | HTTP/2 | **HTTP/3** |
|------|---------|--------|-----------|
| **传输层** | TCP | TCP | **UDP（QUIC）** |
| **加密** | 可选 | 实际强制 TLS | **强制 TLS 1.3，内置 QUIC** |
| **多路复用** | ❌ | ✅ | ✅ |
| **TCP 层队头阻塞** | 有 | **有** | **❌ 彻底解决** |
| **首字节延迟** | 1-2 RTT + TLS | 1-2 RTT + TLS | **0-1 RTT** |
| **连接迁移** | ❌（IP/端口变 = 断连）| ❌ | **✅ Connection ID** |
| **头部压缩** | ❌ | HPACK | **QPACK**（无队头阻塞）|
| **服务器推送** | ❌ | ✅（已废弃）| ✅ |

---

## QUIC 协议核心设计

### QUIC = UDP + TCP 可靠性 + TLS 1.3 + 多路复用

```text
┌─────────────────────────────────────────────┐
│                  HTTP/3                       │
├─────────────────────────────────────────────┤
│                  QUIC                         │
│  - 流（Streams）多路复用                       │
│  - 可靠传输（重传、拥塞控制）                   │
│  - TLS 1.3 内建（不可降级）                    │
│  - 连接迁移（Connection ID）                  │
├─────────────────────────────────────────────┤
│                  UDP                          │
├─────────────────────────────────────────────┤
│                  IP                           │
└─────────────────────────────────────────────┘
```

### QUIC 关键创新

#### 1. 用户态实现（不在内核）

```text
TCP: Linux 内核栈实现
  ↑ 升级困难，需要 OS 更新
  ↑ 中间盒（防火墙、NAT）僵化（Internet ossification）

QUIC: 用户态库实现
  ✅ 应用可独立升级 QUIC 协议版本
  ✅ Google quiche / msquic / quinn / aioquic 多种实现
  ❌ CPU 开销高（chromium 测试 vs TCP +30-50% CPU）
  → 2024+ 硬件卸载和内核 GRO/UDP 加速 缓解
```

#### 2. Stream（流）真正独立

**TCP 字节流** vs **QUIC 多 Stream**：

```text
TCP（一条字节流）:
   连接 ┌──── byte 1 2 3 [LOST] 5 6 7 ────┐
        客户端必须等 [4] 重传到 → 才能交付 5 6 7

QUIC（多个独立 Stream）:
   Stream A ┌── byte 1 2 [LOST] 4 ──┐ ← 单独等
   Stream B ┌── byte 1 2 3 4 ──────┐ ← 直接交付！
   Stream C ┌── byte 1 2 3 4 ──────┐ ← 不受 A 影响

   → A 丢包不影响 B、C 的交付
```

#### 3. 0-RTT 连接建立

```text
首次连接（1-RTT）:
   Client ──ClientHello + key share ────→ Server
   Client ←──ServerHello + cert ────────  Server
   Client ──app data ───────────────────→ Server
   (相比 TCP+TLS 1.2 的 3-RTT 大幅节省)

复用连接（0-RTT）:
   Client ──ClientHello + early data ────→ Server   ★ 第一包就带数据
   Client ←──response + key ─────────────  Server
```

::: warning ⚠️ 0-RTT 重放攻击

> **重放攻击**：攻击者抓 0-RTT 包后重发 → 重复执行（如重复转账）。
>
> **防御**：
> ① **0-RTT 仅用于幂等接口**（GET / HEAD / 查询）— RFC 8446 明确要求
> ② **服务器拒绝 0-RTT 中的写请求**（POST/PUT/DELETE）→ 返 425 Too Early 让客户重试 1-RTT
> ③ **Anti-replay 窗口**：服务器维护 hash 记录拒绝重复

```nginx
# nginx 配置
ssl_early_data on;
proxy_set_header Early-Data $ssl_early_data;
# 后端见 Early-Data: 1 且非幂等方法 → 返 425
```

:::

详见 [HTTP-HTTPS — HTTP/3 关键改进](./http-https#http-3-的关键改进)。

#### 4. 连接迁移（Connection Migration）

**为什么 TCP 做不到**：TCP 连接身份 = `<srcIP, srcPort, dstIP, dstPort>` 四元组。手机 WiFi → 4G → srcIP 变了 → 连接必断。

**QUIC 怎么做到**：用 **Connection ID（8 字节随机）** 作为身份，IP 变了 Connection ID 不变 → 服务器能识别继续使用。

```text
0:00  Client@WiFi(192.168.1.5) ──→ QUIC conn_id=ABC ──→ Server
0:30  地铁上切 4G(10.0.0.7)
0:31  Client@4G(10.0.0.7)     ──→ QUIC conn_id=ABC ──→ Server
                                  ✅ 同一连接，零中断
```

**实战价值**：手机 App / 车载 / IoT，连接迁移让用户体验顶峰 30%+。

#### 5. 拥塞控制（用户态可插拔）

QUIC 各实现支持多种拥塞控制：
- **CUBIC**（默认）— 与 TCP CUBIC 相同算法
- **BBRv2**（Google）— 基于带宽估计，丢包不必降速
- **PRR**（Proportional Rate Reduction）

**关键优势**：拥塞控制是**用户态代码**，可热更新——不必等 Linux 内核升级。

---

## HPACK vs QPACK（头部压缩）

### HPACK（HTTP/2）的痛点

**HPACK 的动态表是单点共享** → 接收端按收到顺序更新表 → **跨 Stream 严格有序** → 引入新的队头阻塞。

### QPACK（HTTP/3）的解决

```text
HPACK: 单动态表 + 严格有序
   → Stream 5 必须等 Stream 1-4 处理完才能解码

QPACK: 分离编码流 + 阻塞流
   - Encoder Stream: 持续更新动态表（双向独立）
   - Stream 内部头部: 允许引用未应用的索引（带阻塞标记）
   - 接收端可选: 等待表更新 vs 立即解码（容忍小延迟）

   → 不同 Stream 头部解码彼此独立 ✅
```

---

## HTTP/3 现状（2026）

### 部署率

| 服务 | HTTP/3 启用 |
|------|------------|
| **Cloudflare** | 70%+ 流量 |
| **Google**（YouTube / Search）| 80%+ |
| **Facebook / Instagram** | 80%+ |
| **Akamai** | 30%+ |
| **AWS CloudFront** | 默认开启 |
| **Azure Front Door** | 默认开启 |
| **国内**（阿里 / 腾讯 / 字节 CDN）| 30-60% |

### 浏览器支持

| 浏览器 | 状态 |
|--------|------|
| Chrome | ✅ 89+ 默认（2021）|
| Firefox | ✅ 88+ 默认 |
| Safari | ✅ 14+ 默认 |
| Edge | ✅ 90+ 默认 |
| 老 IE / Opera Mini | ❌ 退化 HTTP/1.1 / 2 |

### 主流服务器/网关支持

| 软件 | HTTP/3 状态 |
|------|-----------|
| **Nginx** | 1.25+ 实验性 / Plus 稳定 |
| **Caddy** | **默认开启** |
| **Cloudflare quiche** | 生产 |
| **Envoy** | 1.18+ 稳定 |
| **HAProxy** | 2.6+ 支持 |
| **LiteSpeed** | 早期支持 |

### Nginx 配置示例

```nginx
server {
    listen 443 ssl;
    listen 443 quic reuseport;          # ★ HTTP/3 监听 UDP
    http3 on;

    # 告诉客户端: "我支持 HTTP/3，下次直连 QUIC"
    add_header Alt-Svc 'h3=":443"; ma=86400';

    ssl_certificate     cert.pem;
    ssl_certificate_key key.pem;
    ssl_protocols       TLSv1.3;        # ★ HTTP/3 必须 TLS 1.3
}
```

---

## HTTP/3 不适用的场景

| 场景 | 原因 |
|------|------|
| **大量服务器内部通信** | gRPC over HTTP/2 已最优、QUIC CPU 开销大 |
| **超低带宽 IoT** | UDP 包头开销 vs TCP 比例高 |
| **企业网络** | 防火墙常封 UDP 443 |
| **大文件下载**（CDN 边缘）| TCP BBR 已极好 |

**实际**：浏览器 → CDN → 用户的"最后一公里" HTTP/3 收益最大；服务间 RPC 一般不用 HTTP/3。

---

## HTTP/3 + 其他协议生态

### 上游协议演进图

```text
QUIC
├─ HTTP/3                    （Web）
├─ DNS-over-QUIC (DoQ)       （DNS）
├─ WebTransport              （浏览器 ↔ 服务器双向流，替代 WebSocket）
├─ MASQUE                    （over QUIC 隧道，代替 VPN）
└─ MoQ (Media over QUIC)     （低延迟直播）
```

### WebTransport（2024 W3C）

**让浏览器有"原生 QUIC API"**——双向流、可靠+不可靠混合，**是 WebSocket 的下一代**：

```javascript
const transport = new WebTransport('https://example.com/wt');
await transport.ready;

// 可靠流（类似 WebSocket）
const stream = await transport.createBidirectionalStream();
const writer = stream.writable.getWriter();
writer.write(new TextEncoder().encode('hello'));

// 不可靠数据报（实时游戏 / 视频）
transport.datagrams.writable.getWriter()
  .write(new TextEncoder().encode('low latency'));
```

**比 WebSocket 强在**：
- ✅ 多流（不像 WebSocket 单流）
- ✅ 可靠 + 不可靠混合
- ✅ 复用 QUIC 连接（0-RTT）
- ⚠️ 浏览器支持还在普及（Chrome ✅ / Safari ⚠️）

详见 [WebSocket — vs SSE 对比](./websocket)。

---

## HTTP/3 调试与排查

### 浏览器侧

```text
Chrome DevTools → Network → Protocol 列
  h2          → HTTP/2
  h3          → HTTP/3 ★
  http/1.1    → 退化
```

### 命令行

```bash
# curl 测试 HTTP/3（需 curl 7.66+ + libcurl 编译支持）
curl --http3 -v https://cloudflare.com

# 看 Alt-Svc 头（服务器宣告支持 HTTP/3）
curl -I https://cloudflare.com
# Alt-Svc: h3=":443"; ma=86400, h3-29=":443"; ma=86400

# Wireshark 抓 QUIC（需 4.x+ 解密 QLOG 文件）
SSLKEYLOGFILE=/tmp/keys curl --http3 https://example.com
```

---

## 黄金答题模板（必背）

> **面试官：HTTP/3 比 HTTP/2 强在哪？**
>
> **答**：HTTP/2 用 TCP 多路复用解决了 HTTP 层队头阻塞，但 **TCP 层队头阻塞还在**——1 个包丢失会阻塞所有 Stream。
>
> HTTP/3 用 **QUIC over UDP** 彻底解决：
> ① **多 Stream 真独立**——每条流单独可靠传输，丢包只影响该流；
> ② **0-RTT 握手**——复用连接 0 个 RTT 就能发数据（vs TCP+TLS 1.2 的 3-RTT），但要防重放（仅幂等 / Anti-replay）；
> ③ **连接迁移**——Connection ID 替代四元组，手机 WiFi 切 4G 不断连；
> ④ **内建 TLS 1.3**——加密融入协议，不可降级；
> ⑤ **QPACK 头压缩**——不再有 HPACK 的解码队头阻塞；
> ⑥ **用户态实现**——拥塞控制可热更，不等内核升级。
>
> **代价**：① 用户态实现 **CPU 开销比 TCP 高 30-50%**；② 部分企业防火墙封 UDP 443；③ 内部 RPC 不需要（gRPC over HTTP/2 已够好）。
>
> **2026 现状**：Cloudflare 70% / Google 80% 流量已 HTTP/3，浏览器全支持。
>
> **下一代演进**：**WebTransport**（浏览器原生 QUIC API，替代 WebSocket）、**DoQ**（DNS over QUIC）、**MoQ**（Media over QUIC，低延迟直播）。

---

## 看到什么就先想到这类

- **"为什么 HTTP/3 用 UDP"** → 解决 TCP 队头阻塞 + 用户态可升级
- **"TCP 队头阻塞"** → 1 个包丢失阻塞所有 Stream
- **"手机网络切换不断连"** → QUIC Connection Migration
- **"首字节延迟最低"** → HTTP/3 + 0-RTT
- **"0-RTT 安全"** → 仅幂等 + Anti-replay
- **"WebSocket 下一代"** → WebTransport
- **"HTTP/2 服务器推送"** → 已废弃，改用 SSE / WebSocket / WebTransport
- **"HTTP/3 浏览器调试"** → DevTools 看 Protocol 列、curl --http3
- **"内部 RPC 要不要 HTTP/3"** → 不用，gRPC over HTTP/2 已最优
- **"什么阻碍 HTTP/3 部署"** → UDP 被防火墙封、CPU 开销
- **"HTTP/3 配置 Nginx"** → 1.25+ + listen 443 quic + Alt-Svc 头
