---
title: DNS
---

# DNS

## 概念

DNS（Domain Name System）是互联网的"电话簿"，将人类可读的域名（如 www.example.com）解析为 IP 地址（如 93.184.216.34）。面试中主要考解析流程和缓存机制。

## DNS 解析流程

### 完整解析流程

```
浏览器输入 www.example.com
        ↓
1. 浏览器 DNS 缓存（有 → 直接用）
        ↓ 没有
2. 操作系统 DNS 缓存（hosts 文件 + 系统缓存）
        ↓ 没有
3. 本地 DNS 服务器（运营商 / 公司 DNS，如 114.114.114.114）
        ↓ 没有缓存
4. 本地 DNS 服务器开始递归查询：
   ├── 问根域名服务器：.com 在哪？→ 返回 .com 顶级域服务器地址
   ├── 问 .com 顶级域服务器：example.com 在哪？→ 返回权威 DNS 地址
   └── 问 example.com 权威 DNS：www.example.com 的 IP？→ 返回 93.184.216.34
        ↓
5. 本地 DNS 缓存结果，返回给客户端
```

### 递归查询 vs 迭代查询

| 方式 | 说明 | 谁来做 |
|------|------|--------|
| 递归查询 | 客户端问本地 DNS，本地 DNS 负责查到底 | 客户端 → 本地 DNS |
| 迭代查询 | 每次返回"你去问谁"，由本地 DNS 逐个问 | 本地 DNS → 根 → 顶级 → 权威 |

**实际流程：** 客户端到本地 DNS 是递归（"你帮我查"），本地 DNS 到各级 DNS 服务器是迭代（"你去问那个"）。

## DNS 记录类型

| 类型 | 说明 | 示例 |
|------|------|------|
| A | 域名 → IPv4 地址 | example.com → 93.184.216.34 |
| AAAA | 域名 → IPv6 地址 | example.com → 2606:2800:220:1:... |
| CNAME | 域名 → 另一个域名（别名） | www.example.com → example.com |
| MX | 邮件服务器 | example.com → mail.example.com |
| NS | 域名的权威 DNS 服务器 | example.com → ns1.example.com |
| TXT | 文本记录（SPF、域名验证） | |

**CNAME 的用途：** CDN 场景中，`www.example.com` CNAME 到 CDN 域名（如 `xxx.cdn.com`），CDN 再根据地理位置返回最近节点的 IP。

## DNS 缓存

每一层都有缓存，TTL（Time To Live）控制缓存时间：

| 缓存层 | TTL | 说明 |
|--------|-----|------|
| 浏览器缓存 | ~1 分钟 | Chrome 默认 60 秒 |
| 操作系统缓存 | 分钟级 | 可通过 ipconfig /flushdns 清除 |
| 本地 DNS 缓存 | 取决于 TTL | 通常分钟到小时 |

**TTL 设置建议：**
- 普通网站：3600（1 小时）
- 经常变动：60-300（1-5 分钟）
- 切换前降低 TTL：迁移服务器前先把 TTL 降低，减少旧缓存影响

## DNS 安全问题

### DNS 劫持

攻击者篡改 DNS 响应，将域名解析到恶意 IP：

| 类型 | 方式 | 防御 |
|------|------|------|
| 本地劫持 | 修改 hosts 文件或路由器 DNS | 检查 hosts、使用可信 DNS |
| 运营商劫持 | ISP 篡改 DNS 响应（植入广告） | 使用公共 DNS（8.8.8.8、114.114.114.114） |
| DNS 缓存投毒 | 伪造 DNS 响应注入缓存 | DNSSEC（DNS 签名验证） |

### DNS over HTTPS (DoH) / DNS over TLS (DoT)

传统 DNS 查询是明文 UDP，容易被监听和篡改。DoH 通过 HTTPS 加密 DNS 查询，DoT 通过 TLS 加密。主流浏览器已支持 DoH。

### 加密 DNS：DoH / DoT / DoQ 详解（2026 必懂）

**传统 DNS over UDP 53** 是 1987 年的设计——**完全明文**，运营商、咖啡店 WiFi、黑客都能监听 + 篡改。

#### 三种加密 DNS 协议

| 协议 | 传输层 | 端口 | 特色 |
|------|-------|------|------|
| **DoT**（DNS over TLS，RFC 7858 2016）| TCP + TLS | **853** | 独立端口，运维易识别（也易封）|
| **DoH**（DNS over HTTPS，RFC 8484 2018）| HTTPS | **443** | **混入 HTTPS 流量难屏蔽**、浏览器友好 |
| **DoQ**（DNS over QUIC，RFC 9250 2022）| QUIC | **853** | **最新最快**（0-RTT + 多路复用）|

#### 公共加密 DNS 服务（2026）

| 服务商 | DoH 地址 | 特色 |
|-------|---------|------|
| **Cloudflare** | `https://1.1.1.1/dns-query` | 全球最快、隐私承诺最强 |
| **Google** | `https://dns.google/dns-query` | 8.8.8.8 加密版 |
| **Quad9** | `https://dns.quad9.net/dns-query` | 内置恶意域名拦截 |
| **AdGuard** | `https://dns.adguard-dns.com/dns-query` | 拦截广告 / 跟踪 |
| **国内 DNS.SB** | `https://dot.sb/dns-query` | 国内可用 |

#### 浏览器 / 系统启用

```text
Chrome:    Settings → Privacy → Security → Use secure DNS
Firefox:   Settings → Network → DNS over HTTPS（默认 Cloudflare）
Windows 11: Settings → Network → DNS-over-HTTPS
macOS:     需配置 .mobileconfig 文件
iOS / Android: 系统级 Private DNS（DoT）
```

#### 命令行测试

```bash
# DoH
curl -H 'accept: application/dns-message' \
  'https://1.1.1.1/dns-query?name=example.com&type=A' \
  | xxd

# DoT
kdig +tls @1.1.1.1 example.com

# DoQ（需新版 dig 或 dnsproxy）
dig @1.1.1.1 +quic example.com
```

### ECS (EDNS Client Subnet) — 地理就近解析

**问题**：传统 DNS 中递归服务器代用户查权威，**权威只看到递归 IP，不知道用户在哪** → 给所有用户返回同一 IP → CDN 不能就近调度。

**ECS 方案**：递归服务器在查询时**带上用户子网信息**（如 `203.0.113.0/24`）→ 权威按地理返回最近 IP。

```text
没有 ECS:
   用户北京 → 用 Google DNS（美国）→ 权威看到美国IP → 返美国 CDN
   → 用户跨洋访问，慢

有 ECS:
   用户北京 → Google DNS 带上 ECS=北京子网 → 权威看到北京
   → 返北京 CDN → 快
```

::: warning ⚠️ ECS 的隐私争议

> ECS 暴露用户大概位置（不是精确 IP）→ Cloudflare DNS **默认不支持 ECS**（隐私优先）。
> 想要 CDN 调度精准 → 用 Google / 阿里 DNS（支持 ECS）。

:::

### Anycast DNS — 一个 IP 全球部署

**Anycast**：**同一 IP 在多个机房同时宣告 BGP 路由**，用户的请求由 BGP 路由到地理最近的机房。

```text
1.1.1.1 同时部署在: 北京 / 法兰克福 / 圣何塞 / 悉尼 ...

北京用户 ─请求 1.1.1.1─→ BGP 自动路由到北京机房     ← 1ms
法兰克福用户 ─请求 1.1.1.1─→ BGP 自动路由到法兰克福机房 ← 1ms

→ 全球用户都觉得"1.1.1.1 很快"
```

**实战使用**：
- ✅ **Cloudflare 1.1.1.1 / Google 8.8.8.8 / Quad9 9.9.9.9** 都是 Anycast
- ✅ 同时实现**自动故障转移**（某机房挂，BGP 自动撤路由）
- ✅ **抗 DDoS**（攻击分散到全球节点）

### DNSSEC — 防 DNS 投毒（响应签名）

**问题**：DNS 缓存投毒（Kaminsky 2008）— 攻击者伪造 DNS 响应注入递归缓存。

**DNSSEC**：权威给 DNS 响应**签名**，递归验证签名 → 拒绝伪造。

```text
没 DNSSEC:
   攻击者发"baidu.com A 6.6.6.6"，递归没验证 → 缓存中毒

有 DNSSEC:
   权威返"baidu.com A 1.2.3.4 + RRSIG 签名"
   递归用 baidu.com 的公钥验签 → 通过
   攻击者伪造响应没合法签名 → 拒绝
```

**采用率**（2024）：
- 全球 ~25% 域名签名
- 国内采用率低（< 5%）
- 浏览器一般不直接验证 DNSSEC（依赖递归服务器）

### DNS 性能优化

| 优化 | 收益 | 适用 |
|------|------|------|
| **TTL 合理设置** | 平衡新鲜度 vs 解析次数 | 静态资源长 TTL（1d），动态短（5min）|
| **HTTP DNS**（绕过递归）| 跳过运营商劫持 | 移动 App（阿里 / 腾讯 / DNSPod 都提供）|
| **DoH / DoT** | 加密 + 防劫持 | 浏览器 / 客户端 |
| **本地缓存**（systemd-resolved / dnsmasq）| 减少 DNS 查询 | 服务器 |
| **预解析**（dns-prefetch）| 浏览器后台预解析 | Web |
| **就近权威**（GeoDNS）| 全球用户低延迟 | 大流量站点 |

```html
<!-- 浏览器 DNS 预解析 -->
<link rel="dns-prefetch" href="//cdn.example.com">
<link rel="preconnect" href="//api.example.com">      <!-- DNS + TCP + TLS -->
```

## 面试常问 & 怎么答

### Q1: DNS 解析流程？

先查本地缓存（浏览器 → OS → 本地 DNS），缓存没有则本地 DNS 进行递归/迭代查询：问根域名服务器获得顶级域服务器地址 → 问顶级域服务器获得权威 DNS 地址 → 问权威 DNS 获得最终 IP。结果按 TTL 缓存在各级。

### Q2: 递归查询和迭代查询的区别？

递归查询是"你帮我查到底"（客户端 → 本地 DNS），迭代查询是"你去问那个"（本地 DNS → 根 → 顶级 → 权威）。实际中两种结合使用。

### Q3: DNS 用 TCP 还是 UDP？

默认用 UDP（端口 53），因为查询包小、追求速度。但当响应超过 512 字节（如区域传输、DNSSEC）时会用 TCP。DNS over HTTPS (DoH) 用 HTTPS/TCP。

## 看到什么就先想到这类

- 出现 DNS 解析、域名、IP 映射。
- 出现递归查询、迭代查询。
- 出现 DNS 缓存、TTL。
- 出现 DNS 劫持、DNSSEC、DoH。
- 出现 CNAME、A 记录。
