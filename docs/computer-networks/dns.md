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
