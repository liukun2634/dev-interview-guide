---
title: 网络故障排查工具集
---

# 网络故障排查工具集（tcpdump / wireshark / mtr / ss / curl）

<span class="dig-tag dig-tag--category">网络运维</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**面试 Top 真题："服务突然变慢，怎么定位是网络问题？"** 能 5 秒说出 `ping → mtr → ss → tcpdump → curl --trace` 排查流程，并讲清每个工具能看什么，立刻区分中/高级工程师。
:::

## 排查 4 步法（必背）

```text
慢 / 不通 / 抖动
       ↓
① 连通性: ping / mtr     ── 判断是否网络层问题
       ↓
② 端口/链接: ss / nc / telnet ── 判断端口是否开 / 连接是否成功
       ↓
③ 应用层: curl -v / curl --trace ── HTTP 详细诊断
       ↓
④ 抓包: tcpdump / wireshark ── 终极武器
```

---

## L3 网络层：ping / mtr / traceroute

### ping — 测试基本连通性

```bash
# 默认 4 个包（Linux 持续）
ping baidu.com

# 指定包数 + 超时
ping -c 5 -W 2 baidu.com

# 大包测试 MTU
ping -M do -s 1472 baidu.com    # ★ -M do 禁止分片，1472=1500-28（IP+ICMP）

# IPv6
ping6 baidu.com
```

**关键输出**：
```
64 bytes from 1.2.3.4: icmp_seq=1 ttl=53 time=12.3 ms
                                  ↑              ↑
                                跳数线索        延迟
--- ping statistics ---
5 packets transmitted, 5 received, 0% packet loss, time 4006ms
rtt min/avg/max/mdev = 12.034/12.235/12.553/0.197 ms
                                              ↑
                                          抖动（标准差）
```

::: tip 💡 ping 看不出来的问题

> ① **被 ICMP 限速**：某些云厂商对 ping 速率限制 → 看 latency 高其实是限速
> ② **被 ICMP 完全屏蔽**：ping 不通但 TCP 通（用 nc / telnet 测）
> ③ **路径不对称**：去和回的路由不同 → 用 `mtr` 看双向

:::

### mtr — ping + traceroute 二合一

**强烈推荐**——比 traceroute 信息密度高 10×。

```bash
# 持续显示每跳 loss / latency
mtr baidu.com

# 报告模式（跑 100 次后输出）
mtr -r -c 100 baidu.com

# 用 TCP 80 端口（避免 ICMP 被封）
mtr -T -P 80 baidu.com
```

**输出示例**：
```
HOST: my-server                  Loss%  Snt  Last  Avg   Best  Wrst  StDev
1. _gateway                      0.0%   100   1.2  1.3   1.0   2.1   0.2
2. 10.0.0.1                      0.0%   100   2.3  2.4   2.1   3.5   0.3
3. ???                          100.0%   100   0.0  0.0   0.0   0.0   0.0   ★ 这跳掉所有包但后续 OK = ICMP 限速
4. 1.1.1.1                       2.0%   100  12.0 13.5  11.5  25.3   2.4   ★ 这跳开始丢包 = 网络问题源
5. baidu.com                     0.0%   100  12.5 13.8  12.0  24.5   2.3
```

**怎么读**：
- ✅ 中间某跳 100% loss 但后续 OK → 那跳 ICMP 限速，可忽略
- ❌ 某跳开始 loss% 高，**后续都受影响** → 真问题点
- ❌ StDev（抖动）大 → 链路不稳

### traceroute

```bash
# 显示每跳 IP + 延迟
traceroute baidu.com

# 用 TCP 探测（绕过 ICMP）
traceroute -T -p 80 baidu.com
```

**面试加分**：`mtr` 已是 traceroute + ping 的现代替代，**生产几乎都用 mtr**。

---

## L4 传输层：ss / netstat / nc / telnet

### ss — netstat 的现代替代

**`netstat` 已被弃用**（基于 /proc/net 文件读取慢），**`ss` 直接读内核 netlink，快 10×**。

```bash
# 看所有 TCP 连接 + 监听端口
ss -tan

# 看监听端口（含进程）
sudo ss -tlnp

# 看连接数 by 状态
ss -tan | awk '{print $1}' | sort | uniq -c
#   1 State
#  50 ESTAB
#  10 TIME-WAIT
#   2 LISTEN
#   3 CLOSE-WAIT    ← ★ CLOSE_WAIT 多说明应用没关闭连接

# 看某端口连接
ss -tan | grep :80

# 看 socket 选项（拥塞控制等）
ss -ti dst :443
# tcp ESTAB 0 0 1.2.3.4:443 5.6.7.8:54321
#   cubic wscale:7,7 rto:204 rtt:1.5/0.3 ato:40 mss:1448
#   cwnd:10 bytes_sent:1234 segs_out:5
```

### TIME_WAIT / CLOSE_WAIT 诊断（必背）

```bash
# 大量 TIME_WAIT（主动关闭方）
ss -tan | grep TIME-WAIT | wc -l
# > 10000 → 短连接太多 / 没启用 Keep-Alive
```

详见 [TCP/UDP — TIME_WAIT 排查](./tcp-udp)。

### nc / telnet — 测端口

```bash
# 测端口是否开
nc -zv baidu.com 443       # -z 不发数据 -v 详细
telnet baidu.com 443

# 测 UDP 端口
nc -zv -u dns.google 53

# 模拟简单 TCP 服务器（监听 9999）
nc -l 9999

# 给端口发数据
echo "HEAD / HTTP/1.0" | nc baidu.com 80
```

---

## L7 应用层：curl / dig / host

### curl — HTTP/HTTPS 万能调试

```bash
# 详细输出
curl -v https://api.example.com/users

# 看 timing 拆分（重要！）
curl -w '@-' -o /dev/null -s https://api.example.com <<EOF
DNS:           %{time_namelookup}s
TCP connect:   %{time_connect}s
TLS handshake: %{time_appconnect}s
First byte:    %{time_starttransfer}s
Total:         %{time_total}s
EOF

# 完整追踪（含每个字节）
curl --trace-ascii trace.log https://example.com

# 模拟 POST 提交
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"alice"}'

# 强制 HTTP/3
curl --http3 -v https://cloudflare.com

# 看证书详情
curl -v https://example.com 2>&1 | grep -A 20 "Server certificate"

# 不验证证书（仅测试）
curl -k https://self-signed.example.com

# 代理 / 走指定 IP（绕过 DNS 解析）
curl --resolve example.com:443:1.2.3.4 https://example.com
```

**curl `-w` 阶段含义**：

```text
0─────time_namelookup─────time_connect─────time_appconnect─────time_pretransfer─────time_starttransfer─────time_total
   DNS              TCP 握手        TLS 握手           准备好           收到首字节                完成

慢在 namelookup → DNS 问题
慢在 connect    → 网络 / 服务器忙
慢在 appconnect → TLS 配置
慢在 starttransfer → 后端处理慢
```

### dig — DNS 调试

```bash
# 基本查询
dig baidu.com

# 查特定记录类型
dig MX gmail.com         # 邮件交换
dig AAAA baidu.com       # IPv6
dig TXT _dmarc.gmail.com

# 用指定 DNS 服务器
dig @8.8.8.8 baidu.com

# 看完整解析过程
dig +trace baidu.com

# DoH 查询（DNS over HTTPS）
dig +https @1.1.1.1 baidu.com

# 反向解析
dig -x 8.8.8.8
```

---

## L2/L3 抓包：tcpdump / wireshark

### tcpdump — 命令行抓包神器

```bash
# 抓 eth0 上所有包（生产慎用，量大）
sudo tcpdump -i eth0

# 抓特定端口
sudo tcpdump -i any port 443

# 抓 src/dst IP
sudo tcpdump -i any host 1.2.3.4
sudo tcpdump -i any src 1.2.3.4 and dst port 80

# 抓握手 SYN 包
sudo tcpdump -i any 'tcp[tcpflags] & tcp-syn != 0'

# 抓 HTTP（明文）
sudo tcpdump -i any -A -s 0 'port 80 and (tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x47455420)'

# 写文件给 Wireshark 分析（最常用）
sudo tcpdump -i any -w capture.pcap port 443

# 只抓 100 个包
sudo tcpdump -c 100 -i any port 80

# 看 DNS
sudo tcpdump -i any -nn port 53
```

**Berkeley Packet Filter (BPF) 表达式**：
```bash
host 1.2.3.4 and (port 80 or port 443)
not arp
tcp[tcpflags] & tcp-syn != 0
```

### Wireshark / tshark

**Wireshark**（GUI）和 **tshark**（命令行）是 tcpdump 之后的深度分析。

```bash
# Linux 命令行 tshark
tshark -i any -f "port 443"  -Y "tls.handshake"

# 看 TLS 握手 + 证书
tshark -r capture.pcap -Y "tls.handshake.type == 11"
```

**Wireshark 必背技巧**：
- `Statistics → Flow Graph`：可视化整个握手过程
- `Statistics → I/O Graph`：吞吐曲线
- `Analyze → Expert Information`：自动找出"重传/乱序/丢包"
- 过滤：`tcp.analysis.retransmission`（重传）、`tcp.analysis.duplicate_ack`（dup ack）、`http.response.code >= 500`

### 解密 TLS 流量（生产必会）

```bash
# 让 Chrome / curl 写 TLS 密钥
export SSLKEYLOGFILE=/tmp/tlskeys.log
curl https://example.com

# Wireshark: Edit → Preferences → Protocols → TLS → (Pre)-Master-Secret log filename
# → 设为 /tmp/tlskeys.log
# 现在可以看 HTTPS 明文了
```

---

## L2 链路层：ip / ifconfig / ethtool

```bash
# 看所有接口（替代 ifconfig）
ip addr
ip -br -c link              # 简洁彩色

# 看路由表
ip route

# 看 ARP 表
ip neigh

# 网卡详细参数
ethtool eth0

# 看 NIC 统计（丢包 / 错误）
ethtool -S eth0 | grep -E "drop|error|miss"
# rx_errors: 0
# rx_dropped: 12345         ← ★ 丢包，看网卡或 ring buffer

# 看 ring buffer
ethtool -g eth0
# RX: 256 / max 4096        ← 太小，丢包高时调大: ethtool -G eth0 rx 4096
```

---

## 带宽 / 流量

```bash
# iftop — 实时流量（按 IP 排序）
sudo iftop -i eth0

# nethogs — 实时流量（按进程排序）
sudo nethogs eth0

# bmon — 各接口图形化
bmon

# iperf3 — 端到端带宽测试
# 服务端
iperf3 -s
# 客户端
iperf3 -c server.example.com -t 60
```

---

## 实战案例：5 大场景排查 SOP

### 场景 1：HTTP 请求慢

```bash
# 第 1 步：curl timing 拆分
curl -w '\nDNS: %{time_namelookup}\nTCP: %{time_connect}\nTLS: %{time_appconnect}\nTTFB: %{time_starttransfer}\nTotal: %{time_total}\n' -o /dev/null -s https://api.example.com

# 第 2 步：根据慢在哪段，进一步排查
DNS 慢       → dig +trace / 换 DNS（8.8.8.8 vs 114.114.114.114）
TCP 慢       → mtr 看链路 / ss 看连接队列
TLS 慢       → curl -v 看握手 / 证书链长度
TTFB 慢      → 后端日志 / APM Trace
```

### 场景 2：连接被拒（Connection refused）

```bash
# 第 1 步：本地端口是否开
sudo ss -tlnp | grep :8080

# 第 2 步：远程能否连
nc -zv server.example.com 8080

# 第 3 步：防火墙是否拦
sudo iptables -L -n          # 看规则
sudo ufw status              # Ubuntu
sudo firewall-cmd --list-all # CentOS

# 第 4 步：云安全组是否拦（AWS / Azure / Aliyun 控制台）
```

### 场景 3：连接超时（Connection timed out）

```bash
# 第 1 步：mtr 看路由
mtr -T -P 443 server.example.com

# 第 2 步：tcpdump 看是否 SYN 发出 + 是否收到 SYN-ACK
sudo tcpdump -i any 'host server.example.com and (port 443)'

# 现象 1: 看到 SYN 发出，无 SYN-ACK
#   → 服务器没回，或中间防火墙丢包
# 现象 2: 看到 SYN-ACK 但有大量重传
#   → 网络链路质量差
```

### 场景 4：大量 CLOSE_WAIT

```bash
# 第 1 步：定位 CLOSE_WAIT 进程
sudo ss -tanp | grep CLOSE-WAIT

# 现象: 100+ CLOSE_WAIT 全在某 Java 进程
#   → 应用代码 bug，对方关闭后没调 socket.close()
#   → 修代码：try-with-resources / finally close
```

详见 [TCP/UDP — CLOSE_WAIT 排查](./tcp-udp)。

### 场景 5：HTTPS 证书问题

```bash
# 查证书有效期 + 链
openssl s_client -connect example.com:443 -showcerts < /dev/null

# 验证证书链
openssl verify -CAfile /etc/ssl/certs/ca-bundle.crt server.pem

# 查 SNI 匹配
curl -v https://example.com 2>&1 | grep -i "subject\|issuer\|SAN"

# 测试 TLS 配置（用 SSL Labs）
# https://www.ssllabs.com/ssltest/
```

---

## eBPF 新一代工具（2024-2026 兴起）

**eBPF 让我们能"零代码、无侵入"看任何网络事件**。

### tcplife（bcc-tools）

```bash
# 实时看每个 TCP 连接的生命周期 + 字节数
sudo tcplife
# PID  COMM      LADDR     LPORT RADDR      RPORT TX_KB RX_KB  MS
# 1234 curl      1.2.3.4   58432 5.6.7.8    443    0     12    234.5
```

### Cilium / Pixie（K8s 神器）

| 工具 | 用途 |
|------|------|
| **Cilium**（CNI + 安全）| K8s 网络观测 + 策略 |
| **Pixie**（New Relic）| K8s 集群一键安装，自动出 HTTP / DNS / MySQL / Redis trace |
| **bcc-tools** | tcptop / tcpconnect / tcpretrans |
| **bpftrace** | 类 awk 的 eBPF DSL |

详见 [可观测性 — eBPF Tracing](../engineering-practice/monitoring-observability#ebpf-tracing零代码全栈观测2026-兴起)。

---

## 排查命令速查表

| 任务 | 命令 |
|------|------|
| **测连通性** | `ping`、`mtr`、`traceroute` |
| **看监听端口** | `sudo ss -tlnp` |
| **看连接数 by 状态** | `ss -tan \| awk '{print $1}' \| sort \| uniq -c` |
| **测远程端口** | `nc -zv host port` |
| **HTTP timing** | `curl -w '...' -o /dev/null -s URL` |
| **DNS 查询** | `dig`、`dig +trace`、`dig @8.8.8.8` |
| **抓包到文件** | `sudo tcpdump -i any -w cap.pcap port 443` |
| **看路由** | `ip route` |
| **网卡丢包** | `ethtool -S eth0 \| grep drop` |
| **进程流量** | `sudo nethogs eth0` |
| **看 TCP 内部状态** | `ss -ti dst :443` |
| **K8s Pod 网络** | `kubectl exec -- ip addr / ss / tcpdump` |
| **eBPF 实时观测** | `sudo tcplife`、`tcpretrans` |

---

## 黄金答题模板（必背）

> **面试官：服务接口慢，怎么定位是网络问题？**
>
> **答**：分 4 层排查：
>
> ① **L3 网络层** — `mtr -T -P 443 server` 看每跳延迟 / 丢包，能定位"哪段路链路差"；
> ② **L4 传输层** — `ss -tan` 看连接状态分布（CLOSE_WAIT 多 = 应用 bug、TIME_WAIT 多 = 短连接太频繁），`nc -zv` 测端口；
> ③ **L7 应用层** — **`curl -w` 拆分阶段最关键**——`time_namelookup`（DNS）、`time_connect`（TCP）、`time_appconnect`（TLS）、`time_starttransfer`（TTFB），慢在哪段对应不同处理；
> ④ **抓包终极** — `tcpdump -i any -w cap.pcap port 443` 配合 Wireshark 分析，重点看 `tcp.analysis.retransmission`（重传）和握手过程。
>
> **常见症状速判**：
> - DNS 慢 → 换 DoH / 用 dnsmasq 本地缓存
> - 大量 CLOSE_WAIT → 应用代码忘关 socket
> - 大量 TIME_WAIT → 短连接没用 Keep-Alive
> - 网卡 drop 高 → `ethtool -G eth0 rx 4096` 调大 ring buffer
> - TLS 慢 → 证书链过长 / OCSP 慢 → OCSP Stapling
>
> **2024+ eBPF 工具神器**：`tcplife` 看连接生命周期、Pixie / Cilium 在 K8s 集群一键全栈观测，**零代码侵入**。
>
> **K8s 场景**：`kubectl exec` 进 Pod 用 `ss / curl / tcpdump`，配合 Pixie / Cilium 看跨 Pod 流量。

---

## 看到什么就先想到这类

- **"测连通性"** → ping → mtr
- **"测端口"** → nc -zv / telnet
- **"看监听端口"** → ss -tlnp
- **"看连接状态分布"** → ss -tan | awk
- **"HTTP 接口慢"** → curl -w 拆分阶段
- **"DNS 慢"** → dig +trace / 换 DoH
- **"抓包"** → tcpdump -w + Wireshark
- **"看路由"** → ip route / mtr
- **"看丢包"** → ethtool -S | grep drop
- **"K8s 集群网络"** → Pixie / Cilium / Hubble
- **"解密 HTTPS"** → SSLKEYLOGFILE + Wireshark
- **"实时流量 by 进程"** → nethogs
- **"带宽测试"** → iperf3
- **"看证书"** → openssl s_client
