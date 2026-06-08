---
title: CPU / 内存 100% 排查实战
---

# CPU / 内存 100% 排查实战（系统 + Java + AKS 三层 SOP）

<span class="dig-tag dig-tag--category">性能排查</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**面试 Top 真题**："生产 CPU / 内存飙到 100%，怎么排查？"——能在 30 秒内说出 **3 层 SOP（系统 → Java → AKS）+ 6 个核心命令** 立刻区分中/高级。不光会用 `top`，还要会**用 jstack 定位热点线程**、**用 kubectl describe 看 OOMKilled**、**用 Azure Monitor 看 Node Pool 资源压力**。
:::

## 全景排查地图

```text
故障告警: CPU/内存 100%
        ↓
┌────────────────────────────────────────────────────────┐
│  Layer 1: 宿主机 / Node                                 │
│  - top / htop / vmstat / sar                            │
│  - iostat / iotop / pidstat                             │
│  - 定位: 哪个进程 / 哪种资源 / 哪个内核函数              │
└────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────┐
│  Layer 2: 应用进程（Java / Go / Python）                 │
│  - jstack / jstat / jmap / jcmd                         │
│  - Async Profiler / Arthas（国内事实标准）              │
│  - 火焰图（Flame Graph）                                 │
│  - 定位: 哪个线程 / 哪个方法 / 哪段代码                  │
└────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────┐
│  Layer 3: Kubernetes / AKS                              │
│  - kubectl top / describe / logs                        │
│  - Container Insights + Prometheus + Grafana            │
│  - HPA / VPA 自动扩缩                                    │
│  - 定位: 是 Pod 限额 / Node 资源 / 调度问题              │
└────────────────────────────────────────────────────────┘
```

---

## Layer 1：宿主机层排查（必背 SOP）

### CPU 100% 排查 4 步

#### 第 1 步：top 看进程级 CPU

```bash
# 实时查看 CPU 使用
top -c                    # -c 显示完整命令行
# 按 P 排序（CPU 降序）按 M 排序（内存降序）

# 看哪个进程吃 CPU
ps aux --sort=-%cpu | head -10
```

**关键字段**：
```
%CPU: 进程 CPU 使用率（多核会 > 100%，4 核满 = 400%）
%MEM: 物理内存使用率
RES:  常驻物理内存（KB）
VIRT: 虚拟内存（含 swap、共享库）
S:    状态（R/S/D/Z/T，详见 OS 章节）
TIME+: 累计 CPU 时间
```

#### 第 2 步：`top -Hp <pid>` 看线程级

```bash
# 显示某进程内所有线程的 CPU
top -Hp 12345

# 或用 ps -L
ps -mp 12345 -o THREAD,tid,time | sort -rk 2 | head -10
#   USER  %CPU PRI SCNT WCHAN  USER SYSTEM   TID     TIME
#   root  85.0  19    -     -    -      -  12351 00:05:23   ← 线程 12351 吃 85% CPU
```

#### 第 3 步：定位用户态 vs 内核态

```bash
# vmstat 1 看系统层面
vmstat 1
# procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
#  r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
# 12  0   0    234M   12M   876M    0    0    12   456 5K   12K 80 15  3  2  0
#                                                              ↑  ↑  ↑  ↑
#                                                            us=80 用户态高 → 应用代码热
#                                                            sy=15 内核态正常
#                                                            wa=2 IO 等待低
#                                                            st=0 被虚拟化偷的 CPU
```

**判断方向**：
| us 高 | sy 高 | wa 高 | st 高 |
|------|------|------|------|
| 应用代码热（算法 / 死循环）| 系统调用频繁（context switch / 中断 / fork）| 磁盘 IO 瓶颈 | 云主机被宿主机抢 CPU |

#### 第 4 步：perf / async-profiler 火焰图（终极武器）

```bash
# 安装 perf
yum install perf -y      # CentOS
apt install linux-tools-common -y   # Ubuntu

# 采样 60 秒
sudo perf record -F 99 -p 12345 -g -- sleep 60
sudo perf script > out.perf

# 生成火焰图
git clone https://github.com/brendangregg/FlameGraph
./FlameGraph/stackcollapse-perf.pl out.perf | \
  ./FlameGraph/flamegraph.pl > flame.svg
```

**火焰图怎么读**：
- X 轴：CPU 占用宽度（**越宽 = 越耗 CPU**）
- Y 轴：调用栈深度（顶上是当前正在执行的函数）
- **找最宽的"平顶山"** = 性能瓶颈

### 内存 100% 排查 4 步

#### 第 1 步：free + top 看总量

```bash
# 看内存总览
free -h
#               total        used        free      shared  buff/cache   available
# Mem:           7.7Gi       7.2Gi       100Mi        50Mi       400Mi       200Mi
# Swap:          0Bi           0Bi         0Bi

# 关键: available 是真正可用的（含 reclaim 的 buff/cache）
# available < 10% total → 危险
```

**注意陷阱**：`free` 列低不代表内存不够——Linux 会**主动用空闲内存做 buff/cache**，看 **available**。

#### 第 2 步：定位吃内存的进程

```bash
# RSS 排序（物理内存）
ps aux --sort=-rss | head -10

# 用 smem 看 PSS（共享内存按比例分摊，更准）
smem -tk -s pss
```

**RSS vs PSS vs VSZ**：
| 指标 | 含义 |
|------|------|
| **VSZ**（虚拟）| 进程申请的所有虚拟内存（含 mmap、swap、共享库）|
| **RSS**（常驻）| 实际占用物理内存（**含共享库重复计算**）|
| **PSS**（按比例）| 共享内存按"共享进程数"分摊（**最准**）|
| **USS**（独占）| 只算进程自己独占的部分（**杀死能释放多少**）|

#### 第 3 步：定位是用户态 / 内核态 / Slab

```bash
# 内核 slab 内存（dentry / inode cache 等）
slabtop -s c
# 如果 slab 占用 GB 级，可能是大量 file descriptor / 容器创建销毁

# /proc/meminfo 详细分析
cat /proc/meminfo | head -20
# MemTotal:       8000000 kB
# MemFree:         100000 kB
# Buffers:         200000 kB    ← 文件元数据 cache
# Cached:          400000 kB    ← Page Cache
# Slab:            300000 kB    ← 内核对象 cache
# SReclaimable:    250000 kB    ← 可回收 slab
# AnonPages:      5000000 kB   ← 进程匿名内存（malloc 之类）

# 强制释放 Page Cache（紧急救命）
sync; echo 3 > /proc/sys/vm/drop_caches
```

#### 第 4 步：dmesg 看 OOM Killer

```bash
# 看是否触发 OOM Killer
dmesg -T | grep -i "killed process\|out of memory"
# [Mon Jun 8 14:30:12 2026] Out of memory: Killed process 12345 (java)
#   total-vm:8GB anon-rss:7.5GB file-rss:0 shmem-rss:0
```

详见 [OS — OOM Killer](../operating-systems/memory-management#oom-killer必背)。

### 磁盘 IO 100%（顺便提）

```bash
# 看 IO 是否瓶颈
iostat -x 1
# Device  r/s  w/s  rkB/s  wkB/s  await  %util
# sda     50   100  200    8000   25.0   95.0   ← %util 95% = 接近饱和

# 看哪个进程 IO 高
iotop -o          # -o 只显示有活动的

# pidstat 综合视图
pidstat -d 1      # 看进程 IO
pidstat -u 1      # 看进程 CPU
pidstat -r 1      # 看进程内存
```

---

## Layer 2：Java 应用层排查（生产必背）

### Java CPU 100% 黄金 5 步

```text
① `top -Hp <pid>`               看哪个 Java 线程 CPU 高，记下 tid
② `printf '%x\n' <tid>`          tid 转 16 进制
③ `jstack <pid> | grep <hex>`    在 jstack 输出找对应线程
④ 看堆栈定位代码
⑤ 修复（死循环 / 大对象操作 / 锁竞争）
```

#### 完整示例

```bash
# 1. 看 Java 进程 ID
$ jps -l
12345 com.example.Application

# 2. 看 Java 进程的高 CPU 线程
$ top -Hp 12345
   PID USER     %CPU  COMMAND
 12399 root     95.0  java
 12351 root     82.3  java

# 3. 把高 CPU 的 tid 12399 转 16 进制
$ printf '%x\n' 12399
3060

# 4. jstack 找对应线程（注意 nid=0x3060）
$ jstack 12345 | grep -A 30 "nid=0x3060"
"http-nio-8080-exec-7" #45 daemon prio=5 os_prio=0 tid=0x... nid=0x3060 runnable
   java.lang.Thread.State: RUNNABLE
    at com.example.UserService.findUsers(UserService.java:45)
    at com.example.UserController.list(UserController.java:23)
    ...

# 5. 看代码（UserService.java:45）发现是 nested loop O(N²) 死循环
```

### jstack 输出关键状态

| 状态 | 含义 | 排查方向 |
|------|------|---------|
| **RUNNABLE** | 正在执行或等 CPU | 看代码是否死循环 |
| **BLOCKED** | 等 monitor 锁（synchronized）| 看等谁的锁 |
| **WAITING / TIMED_WAITING** | 等 Object.wait() / Thread.sleep() | 正常或死锁 |
| **TIMED_WAITING (parking)** | LockSupport.park() | ReentrantLock / CompletableFuture |

#### 死锁检测

```bash
$ jstack -l 12345 | head -100
# 末尾会有: Found one Java-level deadlock:
# =============================
# "Thread-1":
#   waiting to lock monitor 0x... (object 0x..., a java.lang.Object),
#   which is held by "Thread-2"
```

### Java 内存 100% 黄金 5 步

```text
① `jstat -gc <pid> 1s`          看 GC 频率和耗时
② `jmap -histo:live <pid>`      看堆里对象统计
③ `jmap -dump:live,format=b,file=heap.hprof <pid>`   dump 堆
④ MAT / VisualVM 分析 hprof   找最大对象 + 引用链
⑤ 修复（缓存膨胀 / 大对象 / 内存泄漏）
```

#### jstat 实时看 GC

```bash
$ jstat -gc 12345 1s 10
 S0C    S1C    S0U    S1U  EC       EU       OC       OU       YGC YGCT  FGC FGCT
1024   1024   0      512  8192     7800     20480    18432    35  0.5   8   2.1
                                                              ↑               ↑
                                                       Young GC 次数      Full GC 次数

# 关键指标:
# YGC 持续涨 + YGCT 单次 > 100ms = Young GC 频繁
# FGC 持续涨 + OU 居高不下     = 内存泄漏 / 大对象
# OU 接近 OC = 老年代要满 → 触发 Full GC → STW
```

#### jmap 看类直方图

```bash
# 看堆里哪些类对象最多（不 dump 整个堆）
$ jmap -histo:live 12345 | head -20
 num     #instances         #bytes  class name
   1:        500000      120000000  [B                  ← byte[] 500K 个，1.2GB
   2:        100000       80000000  java.util.HashMap$Node
   3:         50000       50000000  com.example.User    ← 自定义类
```

#### dump 完整堆 + MAT 分析

```bash
# dump 堆（会 STW 几秒，生产慎用）
$ jmap -dump:live,format=b,file=/tmp/heap.hprof 12345

# 或用 jcmd（更现代）
$ jcmd 12345 GC.heap_dump /tmp/heap.hprof

# 下载到本机用 Eclipse MAT 分析
# 重点看: Leak Suspects Report
#         Top Consumers
#         Dominator Tree
```

::: warning ⚠️ 生产 jmap dump 注意事项

> ① **STW 时间长**：堆 8GB 可能 STW 30+ 秒，业务暂停
> ② **磁盘空间**：dump 文件 = 堆大小，预留 2× 空间
> ③ **JVM 内存压力**：dump 时如果堆已满，会失败
>
> **生产替代方案**：
> - **`-XX:+HeapDumpOnOutOfMemoryError`**：OOM 时自动 dump（最常用）
> - **`-XX:HeapDumpPath=/var/log/`**：指定路径
> - **JFR（Java Flight Recorder）**：低开销持续采样，比 dump 实用

:::

### Arthas（国内事实标准，必装）

**[Arthas](https://arthas.aliyun.com/)** 是阿里开源的 Java 在线诊断神器——**不重启** + **不改代码** 就能看运行时一切。

```bash
# 一行启动
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar
# 选择要诊断的 Java 进程

# === 进入交互界面后 ===

# 1. 看 CPU 热点（替代 top -Hp + jstack）
[arthas]$ thread -n 3         # Top 3 CPU 线程
[arthas]$ thread <tid>        # 看某线程详细栈

# 2. 看内存大对象
[arthas]$ heapdump --live /tmp/heap.hprof

# 3. 看 GC 情况
[arthas]$ dashboard           # 实时看堆 / GC / 线程 / OS

# 4. 监控某方法执行（线上调试神器）
[arthas]$ watch com.example.UserService findUsers '{params, returnObj, throwExp}' -x 3 -n 5
# 看每次调用的入参、返回值、异常，前 5 次

# 5. 看方法耗时 + 调用链
[arthas]$ trace com.example.UserService findUsers
# 实时显示每个子方法耗时

# 6. 反编译验证生产代码版本
[arthas]$ jad com.example.UserService

# 7. 改代码热部署
[arthas]$ retransform UserService.class

# 8. 看类加载情况
[arthas]$ classloader
[arthas]$ sc com.example.*    # 搜类
```

::: tip 💡 Arthas vs jstack 对比

> jstack 输出**静态快照**（一次性）；Arthas 是**实时交互**——能看方法入参出参、动态 trace、热修复。**生产排查首选 Arthas**。

:::

### Async Profiler（火焰图首选）

**比 perf 更适合 Java**（懂 JVM 符号，能区分 GC / JIT / 用户代码）。

```bash
# 启动 60s 采样 → 直接生成火焰图 HTML
$ ./profiler.sh -d 60 -f flame.html 12345

# 采样内存分配
$ ./profiler.sh -d 60 --event alloc -f alloc.html 12345

# 采样锁竞争
$ ./profiler.sh -d 60 --event lock -f lock.html 12345
```

---

## Layer 3：AKS / Kubernetes 层排查

### AKS（Azure Kubernetes Service）专用工具

| 工具 | 用途 |
|------|------|
| **kubectl top** | Pod / Node CPU 内存即时数据（需 Metrics Server）|
| **kubectl describe** | Pod 事件、限额、状态 |
| **Container Insights** | Azure 原生 K8s 可观测性（Log Analytics 后端）|
| **Azure Monitor for Containers** | 完整指标 + 告警 |
| **Application Insights** | Java / .NET APM 集成 |
| **Prometheus on AKS** | Azure 托管 Prometheus（2024 GA）|
| **az aks** CLI | 集群级管理 |
| **kubectl debug** | 临时调试容器（K8s 1.25+）|

### AKS CPU / 内存 100% 排查 SOP

#### 第 1 步：定位是 Pod 还是 Node 资源问题

```bash
# 看 Pod 资源使用（需 Metrics Server）
kubectl top pod -A --sort-by=cpu
kubectl top pod -A --sort-by=memory

# 看 Node 资源
kubectl top node
# NAME              CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
# aks-default-001   3500m        87%    7000Mi          90%    ← Node 已满
# aks-default-002   200m         5%     2000Mi          25%

# Pod 受 limit 影响还是 Node 不够？
kubectl describe node aks-default-001 | grep -A 10 "Allocated"
# Resource    Requests   Limits
# cpu         3600m      6000m       ← Requests > Allocatable，Node 调度上限到了
# memory     7Gi        12Gi
```

**两种症状对策**：

| 现象 | 原因 | 解决 |
|------|------|------|
| **单 Pod CPU 高** | 应用代码热点 | 进 Pod 用 Arthas 排查 |
| **单 Pod 内存高** | 应用内存泄漏 | dump heap + MAT 分析 |
| **多 Pod 都高** | Node 资源不够 | 扩 Node Pool / HPA 扩 Pod |
| **CPU 远低于 limit 但 P99 高** | **CFS Throttling** | 调 `cpu.cfs_period_us` 或不设 limits |

详见 [OS — K8s CFS Throttling](../operating-systems/cpu-scheduling)。

#### 第 2 步：进 Pod 用 Java 工具排查

```bash
# 进入 Pod 交互
kubectl exec -it my-pod -- /bin/bash

# 在 Pod 内运行 Java 排查命令
$ jps
$ jstack <pid> > /tmp/jstack.txt
$ jmap -histo:live <pid> | head -20

# 把 dump 文件拷出来分析
kubectl cp my-pod:/tmp/heap.hprof ./heap.hprof
```

**问题**：很多生产镜像 **没装 jdk 工具**（只有 jre）。

**解决方案 — `kubectl debug`（K8s 1.25+）**：

```bash
# 临时附加一个 debug 容器到目标 Pod
kubectl debug -it my-pod \
  --image=openjdk:21-jdk \
  --target=my-app-container \
  --share-processes

# 在 debug 容器内看主容器进程
$ jps -l
$ jstack <pid>

# 退出后自动删除 debug 容器
```

#### 第 3 步：看 Pod 事件 + 容器日志

```bash
# Pod 最近事件（含 OOMKilled / Evicted）
kubectl describe pod my-pod
# Events:
#   Warning   OOMKilled    container memory limit reached
#   Warning   Evicted      The node was low on resource: memory

# 查看上一次崩溃的日志（OOMKilled 后会重启，看 --previous）
kubectl logs my-pod --previous

# 看 Pod 状态码 137 = SIGKILL（OOM）
kubectl get pod my-pod -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}'
```

详见 [K8s — Pod 故障 5 大模式](./kubernetes#pod-故障-5-大模式排查生产必备)。

#### 第 4 步：Azure Monitor Container Insights

```text
Azure Portal → AKS Cluster → Monitoring → Insights
   ├─ Cluster: 整体 CPU/内存/Pod 状态
   ├─ Nodes:   每个 Node 资源压力曲线
   ├─ Controllers: Deployment 视图
   └─ Containers: 每容器 metrics
```

**KQL 查询常用**：

```kusto
// Node CPU 持续 > 80% 的告警
Perf
| where TimeGenerated > ago(1h)
| where ObjectName == "K8SNode" and CounterName == "cpuUsageNanoCores"
| extend cpuPercent = CounterValue / 1e7
| where cpuPercent > 80
| summarize avg(cpuPercent), max(cpuPercent) by Computer, bin(TimeGenerated, 5m)

// 找 OOMKilled 的 Pod
KubeEvents
| where Reason == "OOMKilling" and TimeGenerated > ago(24h)
| project TimeGenerated, Namespace, Name, Message
```

#### 第 5 步：触发自动扩缩

```yaml
# HPA（Horizontal Pod Autoscaler） - 按 CPU/Mem 自动扩 Pod
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70    # CPU > 70% 触发扩
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

# AKS Cluster Autoscaler 自动加 Node
az aks update --resource-group rg --name my-cluster \
  --enable-cluster-autoscaler --min-count 3 --max-count 20
```

### AKS 独有特性（必背）

#### 1. Spot Node Pool — 省钱必备

```bash
# 创建抢占式 node pool（费用降 60-90%）
az aks nodepool add \
  --resource-group rg --cluster-name my-cluster \
  --name spotpool \
  --priority Spot \
  --eviction-policy Delete \
  --spot-max-price -1                # -1 = 按当前价
```

**适用**：批处理 / 非核心服务 / CI 任务。**核心服务用 Regular Node Pool**。

#### 2. Karpenter on AKS（2024 GA）

**比 Cluster Autoscaler 更智能**——根据 Pod 实际需求即时创建匹配的 Node 类型，节省 30-50% 成本。

```yaml
# AKS Node Auto Provisioning (NAP) - Karpenter 集成
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
```

#### 3. Workload Identity（Managed Identity 集成）

```yaml
# Pod 自动获得 Azure 资源访问权限（无需 secret）
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-sa
  annotations:
    azure.workload.identity/client-id: <managed-identity-client-id>
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      serviceAccountName: my-sa
      containers:
        - name: app
          # 应用代码用 DefaultAzureCredential() 自动认证
```

#### 4. AKS Insights 关键告警规则

```bash
# CPU 持续高
Container CPU % > 80 for 15min

# 内存高
Container memory working set % > 80 for 15min

# Pod 频繁重启（OOMKilled）
Pod restart count > 5 in 1h

# Node 不可用
Node not ready > 10min
```

---

## 真实 5 大场景排查 SOP

### 场景 1：Java 应用 CPU 长期 100%

```bash
# Step 1: 进 Pod
kubectl exec -it my-pod -- /bin/bash

# Step 2: 找高 CPU 线程
top -Hp $(pgrep java)

# Step 3: tid 转 hex
printf '%x\n' 12399

# Step 4: jstack 找代码
jstack <pid> | grep -A 30 "nid=0x3060"

# 常见根因:
# - 死循环（while(true) 没 sleep）
# - 大集合迭代（O(N²) 算法）
# - JSON 序列化大对象
# - 正则灾难性回溯（catastrophic backtracking）
```

### 场景 2：Java 内存持续上涨 → OOMKilled

```bash
# Step 1: JVM 参数提前加 OOM 自动 dump
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/oom-%t.hprof
-XX:+ExitOnOutOfMemoryError                 # OOM 立即退出，由 K8s 重启

# Step 2: 看是否被 K8s OOMKilled
kubectl describe pod my-pod | grep -A 5 "Last State"
# Reason: OOMKilled / Exit Code: 137

# Step 3: 看 dmesg
kubectl exec -it my-pod -- dmesg | grep -i oom

# Step 4: 拷 hprof 分析
kubectl cp my-pod:/var/log/oom-xxx.hprof ./
# 用 MAT 打开看 Leak Suspects

# 常见根因:
# - 大 List / Map / HashMap 缓存无淘汰
# - ThreadLocal 未 remove + 线程池复用 → 累积
# - 大 JSON 解析未流式
# - Netty DirectBuffer 没 release
# - JVM heap 设置不当 (-XX:MaxRAMPercentage)
```

### 场景 3：CPU 利用率才 30% 但 P99 延迟暴涨

**典型 CFS Throttling 案例**：

```bash
# Step 1: 看 throttling 指标
kubectl exec -it my-pod -- cat /sys/fs/cgroup/cpu.stat
# nr_periods 1000
# nr_throttled 800       ← 80% 周期被限流！
# throttled_time 12000000000

# Step 2: 临时移除 CPU limits 验证
kubectl edit deployment my-app
# spec.containers[0].resources.limits.cpu: 删除

# Step 3: 永久解决
# 方案 A: 不设 cpu limits（只设 requests）
# 方案 B: 调大 cfs_period_us（K8s 1.25+ 支持配置）
```

详见 [OS — K8s CFS Throttling](../operating-systems/cpu-scheduling)。

### 场景 4：Node 内存压力 → Pod 被 Evicted

```bash
# Step 1: 看哪个 Pod 被 Evicted
kubectl get pod -A | grep Evicted

# Step 2: 看 Node 状态
kubectl describe node aks-default-001 | grep -A 10 "Conditions"
# MemoryPressure: True       ← 内存压力中

# Step 3: 看哪些 Pod 占用最多
kubectl top pod -A --sort-by=memory | head -10

# Step 4: 解决
# - 调高 limits（如果是合理使用）
# - 修内存泄漏（应用 bug）
# - 加 Node（扩容）
# - 设 PriorityClass 保护关键服务不被驱逐
```

### 场景 5：Java GC 频繁 + STW 高

```bash
# Step 1: 看 GC 频率
kubectl exec -it my-pod -- jstat -gc <pid> 1s

# Step 2: 看 GC 日志（生产必开）
-Xlog:gc*:file=/var/log/gc.log:time,uptime:filecount=10,filesize=10M

# Step 3: 分析（GCViewer / GCEasy 上传日志）
# 关键指标:
#   - Young GC > 5/s 频繁 → 调大 Young 区
#   - Full GC > 1/min → 老年代要满 → 内存泄漏或 cache 过大
#   - STW > 200ms → 换 G1 或 ZGC

# Step 4: 升级到 ZGC (JDK 21+)
-XX:+UseZGC -XX:+ZGenerational
# STW 通常 < 1ms 不管堆多大
```

详见 [Java 现代特性 — GC 演进](../programming-languages/java-modern-features#gc-演进-g1-vs-zgc-vs-generational-zgc)。

---

## 排查命令终极速查表

### 系统层

| 任务 | 命令 |
|------|------|
| **CPU 进程级** | `top -c` / `htop` |
| **CPU 线程级** | `top -Hp <pid>` / `ps -mp <pid> -o THREAD,tid` |
| **CPU 系统级** | `vmstat 1` / `mpstat -P ALL 1` |
| **内存总览** | `free -h` / `vmstat 1` |
| **内存进程级** | `ps aux --sort=-rss` / `smem -tk -s pss` |
| **内存内核** | `cat /proc/meminfo` / `slabtop` |
| **IO 设备级** | `iostat -x 1` / `iotop -o` |
| **IO 进程级** | `pidstat -d 1` |
| **网络** | `ss -tan` / `iftop` / `nethogs` |
| **OOM** | `dmesg -T \| grep -i "killed process"` |
| **火焰图** | `perf record -F 99 -p <pid> -g` |

### Java 层

| 任务 | 命令 |
|------|------|
| **看进程** | `jps -l` |
| **线程栈** | `jstack <pid>` |
| **GC 实时** | `jstat -gc <pid> 1s` |
| **堆直方图** | `jmap -histo:live <pid>` |
| **堆 dump** | `jmap -dump:live,format=b,file=heap.hprof <pid>` |
| **JFR 录制** | `jcmd <pid> JFR.start duration=60s filename=app.jfr` |
| **现代综合** | `jcmd <pid> GC.heap_info / VM.flags / Thread.print` |
| **生产首选** | **Arthas**（`dashboard / thread -n 3 / watch / trace`）|
| **火焰图** | **Async Profiler** `./profiler.sh -d 60 -f flame.html <pid>` |

### Kubernetes / AKS 层

| 任务 | 命令 |
|------|------|
| **Pod 资源** | `kubectl top pod -A --sort-by=cpu` |
| **Node 资源** | `kubectl top node` |
| **Pod 详情** | `kubectl describe pod <pod>` |
| **OOMKilled** | `kubectl get pod -o jsonpath='{.status.containerStatuses[*].lastState.terminated.reason}'` |
| **被驱逐** | `kubectl get pod -A \| grep Evicted` |
| **进 Pod** | `kubectl exec -it <pod> -- bash` |
| **debug 容器** | `kubectl debug -it <pod> --image=openjdk:21-jdk --target=<container>` |
| **上次日志** | `kubectl logs <pod> --previous` |
| **AKS 集群事件** | `az aks get-credentials` + `kubectl get events --sort-by=.lastTimestamp` |
| **Azure Monitor** | Portal → AKS → Insights / KQL 查询 |

---

## 黄金答题模板（必背）

> **面试官：生产 Java 服务 CPU 100%，怎么排查？**
>
> **答**：分 **3 层 5 步**：
>
> **Layer 1 系统层**：
> ① `top -Hp <pid>` 找出 Java 进程内 CPU 最高的线程 tid；
> ② `printf '%x\n' <tid>` 转 16 进制；
>
> **Layer 2 Java 层**：
> ③ `jstack <pid> | grep -A 30 "nid=0x<hex>"` 找对应线程栈，定位到具体代码行；
> 或者用 **Arthas** `thread -n 3` 一步到位 + `dashboard` 实时看 + `watch` 看方法入参出参；
> 终极武器是 **Async Profiler** 生成火焰图找平顶山。
>
> **Layer 3 K8s/AKS 层**：
> ④ `kubectl top pod` 看资源、`kubectl describe pod` 看 OOMKilled / Throttling；
> ⑤ 临时用 `kubectl debug --image=openjdk:21-jdk --target=...` 加诊断工具进 Pod。
>
> **必踩坑警告**：
> - **CPU 才 30% 但 P99 高** → 大概率是 **CFS Throttling**，`cat /sys/fs/cgroup/cpu.stat` 看 `nr_throttled`
> - **Pod 突然 137 退出** → OOMKilled，必须开 `-XX:+HeapDumpOnOutOfMemoryError`
> - **Java 不识别容器内存** → `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`
> - **`vmstat` 看 us 高** = 应用代码热；**sy 高** = 系统调用频繁（fork 炸弹？）；**wa 高** = IO 瓶颈
>
> **常见根因 Top 5**：① 死循环 / O(N²) 算法；② JSON 序列化大对象；③ 正则灾难性回溯；④ 缓存无淘汰；⑤ ThreadLocal 泄漏 + 线程池复用。
>
> **AKS 特色**：用 **Azure Container Insights + KQL** 做集群层告警，**Karpenter on AKS** 智能扩 Node，**Workload Identity** 替代 secret。

---

## 看到什么就先想到这类

- **"CPU 100%"** → `top -Hp` → `jstack` / Arthas / 火焰图
- **"内存持续涨"** → `jstat -gc` + `jmap -histo` + MAT
- **"P99 高但 CPU 低"** → CFS Throttling / GC / 锁竞争
- **"Pod 突然 137"** → OOMKilled → 加 `-XX:+HeapDumpOnOutOfMemoryError`
- **"Pod 被 Evicted"** → Node MemoryPressure → 加 Node / 修泄漏
- **"GC 频繁"** → 看 jstat + 升级 ZGC
- **"生产 jstack 不够"** → 装 Arthas
- **"生产没 JDK 工具"** → `kubectl debug --image=openjdk:21-jdk`
- **"AKS 集群级告警"** → Azure Monitor + KQL
- **"AKS 省钱"** → Spot Node Pool + Karpenter
- **"Pod 无密码访问 Azure"** → Workload Identity
- **"火焰图"** → Async Profiler（Java）/ perf + FlameGraph（通用）
- **"线上不重启诊断"** → Arthas watch / trace
- **"OOM 提前 dump"** → `-XX:+HeapDumpOnOutOfMemoryError`
- **"长期内存监控"** → JFR + Mission Control
