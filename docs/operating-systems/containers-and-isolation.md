---
title: 容器隔离原理（Namespace + cgroup）
---

# 容器隔离原理（Namespace + cgroup + Capabilities + seccomp）

<span class="dig-tag dig-tag--category">操作系统</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 中等</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点（2026 必备）
**"容器不是虚拟机"**——容器就是**带了 Namespace + cgroup + chroot 的普通 Linux 进程**。Docker / Containerd / K8s 都基于这套 Linux 内核机制。2026 面试**必问**："Docker 怎么实现隔离？" 能讲清 **6 种 Namespace + cgroup v2 + Capabilities + seccomp** 四件套，立刻区分初/中/高级工程师。
:::

## 容器 vs 虚拟机

```text
┌──────────────────────────┐  ┌──────────────────────────┐
│       虚拟机              │  │        容器               │
│ ┌──────┐ ┌──────┐         │  │ ┌──────┐ ┌──────┐         │
│ │ App  │ │ App  │         │  │ │ App  │ │ App  │         │
│ │ Libs │ │ Libs │         │  │ │ Libs │ │ Libs │         │
│ ├──────┤ ├──────┤         │  │ └──────┘ └──────┘         │
│ │ Guest│ │ Guest│         │  │   ↑ Namespace + cgroup    │
│ │  OS  │ │  OS  │         │  │ ┌─────────────────────────┐│
│ ├──────┤ ├──────┤         │  │ │   共享 Host OS Kernel   ││
│ │Hyper-│ │Hyper-│         │  │ └─────────────────────────┘│
│ │visor │ │visor │         │  │     Host OS               │
│ ├──────┴─┴──────┤         │  │ ┌─────────────────────────┐│
│ │  Host OS      │         │  │ │     Hardware             ││
│ ├───────────────┤         │  │ └─────────────────────────┘│
│ │   Hardware    │         │  │                            │
│ └───────────────┘         │  │                            │
└──────────────────────────┘  └──────────────────────────┘

虚拟机: 隔离强、启动慢（30s+）、内存重（GB 级）
容器:   隔离弱、启动快（< 1s）、内存轻（MB 级）、密度高 10×+
```

**容器的本质**：

| 维度 | 实现机制 |
|------|---------|
| **进程隔离** | PID Namespace |
| **网络隔离** | Network Namespace |
| **文件系统隔离** | Mount Namespace + chroot/pivot_root |
| **资源限制** | cgroup v2 |
| **能力隔离** | Capabilities + seccomp + SELinux/AppArmor |
| **镜像** | Overlay FS（分层只读 + 可写层）|

---

## 6 种 Linux Namespace（必背）

```bash
# 查看进程所属的 namespace
ls -l /proc/$$/ns/
# lrwxrwxrwx ... cgroup -> 'cgroup:[4026531835]'
# lrwxrwxrwx ... ipc    -> 'ipc:[4026531839]'
# lrwxrwxrwx ... mnt    -> 'mnt:[4026531840]'
# lrwxrwxrwx ... net    -> 'net:[4026531992]'
# lrwxrwxrwx ... pid    -> 'pid:[4026531836]'
# lrwxrwxrwx ... user   -> 'user:[4026531837]'
# lrwxrwxrwx ... uts    -> 'uts:[4026531838]'
```

### Namespace 6 种类型

| Namespace | 隔离什么 | 创建系统调用 | 容器中的表现 |
|-----------|---------|------------|-----------|
| **PID** | 进程 ID | `CLONE_NEWPID` | 容器内 `ps` 只能看自己的进程，PID 1 是容器主进程 |
| **NET** | 网络栈（IP、路由、防火墙、Socket） | `CLONE_NEWNET` | 容器有独立的 eth0、loopback、iptables |
| **MNT** | 挂载点 | `CLONE_NEWNS` | 容器有独立的 `/`、`/proc`、`/dev` |
| **UTS** | hostname + domainname | `CLONE_NEWUTS` | 容器可以 `hostname my-container` 不影响宿主机 |
| **IPC** | System V IPC / POSIX 消息队列 | `CLONE_NEWIPC` | 容器间无法用 `shmget` / msqid 通信 |
| **USER** | UID / GID | `CLONE_NEWUSER` | 容器内 root（UID 0）= 宿主机非特权用户（UID 1000）|
| **CGROUP**（Linux 4.6+）| cgroup 视图 | `CLONE_NEWCGROUP` | 容器看到的 cgroup 路径就是 `/` |
| **TIME**（Linux 5.6+）| 系统时间偏移 | `CLONE_NEWTIME` | 容器可有不同的时间（少用）|

### 实战：手工创建一个"迷你容器"

```bash
# ① 用 unshare 创建多个 namespace 同时隔离
sudo unshare --fork --pid --net --mount --uts --ipc /bin/bash

# 进入新 namespace 后
hostname my-container       # ★ 不影响宿主机
ps -ef                       # 只看到 bash + ps 两个进程
ip link                       # 只有 lo 设备（没有 eth0）

# ② 模拟 chroot 改根目录
mkdir /tmp/rootfs && debootstrap stable /tmp/rootfs
chroot /tmp/rootfs /bin/bash   # 现在 / 就是 /tmp/rootfs

# 这就是一个最简单的"容器"
```

### User Namespace —— 容器安全的核心

**最容易被忽略但最重要的 Namespace**：

```text
没有 user namespace 时:
   容器内 root (UID 0)  =  宿主机 root (UID 0)
   → 容器逃逸 = 宿主机失守

有 user namespace 时:
   容器内 UID 0  →  宿主机 UID 100000（映射）
   → 即使逃逸也只是无害用户
```

**K8s `runAsNonRoot: true`** + **User Namespace（K8s 1.30 GA）** 是 2026 安全标配。

---

## cgroup v2（资源限制核心）

### cgroup v1 vs v2 区别

| 维度 | **cgroup v1**（老）| **cgroup v2**（2017+ GA，2024+ 主流）|
|------|------------------|--------------------------------|
| **层级结构** | **每个子系统独立树**（cpu / memory / blkio 各自）| **统一树**（一个目录管所有）|
| **进程归属** | 同一进程在不同子系统可能在不同 cgroup | 统一归属 |
| **API 一致性** | 每个子系统接口不同 | 统一接口 |
| **K8s 支持** | 默认 | **K8s 1.25+ 默认开启** |
| **Linux 内核** | 2.6.24+ | 4.5+，**5.x 主流** |

### cgroup v2 实战

```bash
# 创建 cgroup
sudo mkdir /sys/fs/cgroup/my-group

# 限制 CPU（最多用 50% 单核）
echo "50000 100000" > /sys/fs/cgroup/my-group/cpu.max

# 限制内存（最多 256MB）
echo "256M" > /sys/fs/cgroup/my-group/memory.max

# 限制 PID 数（防 fork 炸弹）
echo "100" > /sys/fs/cgroup/my-group/pids.max

# 把进程加入 cgroup
echo $$ > /sys/fs/cgroup/my-group/cgroup.procs
```

### cgroup 关键控制器

| 控制器 | 控制 |
|--------|------|
| **cpu** | CPU 时间份额（weights / quota）|
| **memory** | 内存上限（含 swap）|
| **io** | 块设备 IO 带宽 + IOPS |
| **pids** | 进程数 |
| **cpuset** | 绑定 CPU 核心 + NUMA 节点 |
| **hugetlb** | HugePage 限额 |
| **rdma** | InfiniBand 资源 |
| **misc** | GPU 等其他设备 |

::: warning ⚠️ K8s CFS Throttling 经典坑

> K8s 设 `cpu: 500m`（半核）→ 翻译成 cgroup `cpu.cfs_quota_us=50000` + `cpu.cfs_period_us=100000`（每 100ms 给 50ms）。**问题**：100ms 内只要用满 50ms 就被 throttle，**即使后面 90ms 空闲也不能用**。
>
> **现象**：CPU 利用率才 30%，但 P99 延迟暴涨，`nr_throttled` 指标飙升。
>
> **修复**：① 调大 `cpu.cfs_period_us` 至 300-500ms；② 用 `cpu.weight` 弹性分配；③ 不设 limits 只设 requests（生产很多人这么做）。

:::

详见 [CPU 调度 — Linux Container 调度真实困境](./cpu-scheduling)。

---

## Capabilities（细粒度权限）

**Linux 把 root 权限拆分成 40+ 个能力**，容器只授必需的：

| Capability | 含义 |
|-----------|------|
| `CAP_NET_ADMIN` | 修改网络（iptables / 路由）|
| `CAP_NET_BIND_SERVICE` | 绑定 < 1024 端口 |
| `CAP_SYS_ADMIN` | "**新 root**"（最危险，能挂载、改 namespace）|
| `CAP_SYS_PTRACE` | 调试其他进程 |
| `CAP_DAC_OVERRIDE` | 跳过文件权限检查 |
| `CAP_SETUID` / `CAP_SETGID` | 改 UID/GID |
| `CAP_CHOWN` | 改文件所有者 |
| `CAP_KILL` | 杀其他用户进程 |

### Docker / K8s 实战

```yaml
# Docker
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE nginx

# K8s Pod Security Standard "restricted" 必需
securityContext:
  runAsNonRoot: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]                # ★ 先全部 drop
    add: ["NET_BIND_SERVICE"]    # ★ 只 add 必需
  readOnlyRootFilesystem: true
  seccompProfile:
    type: RuntimeDefault
```

详见 [K8s — Pod Security Standards](../engineering-practice/kubernetes#pod-安全标准pss-podsecuritypolicy-的继任者)。

---

## seccomp（系统调用过滤）

**最后一道防线**：限制容器能调用哪些 syscall。

**为什么需要**：即使 capabilities 收紧了，root 容器仍能调用 400+ 系统调用，攻击面巨大。**seccomp 把 400 个砍到 50 个**：

```json
// Docker 默认 seccomp profile 片段
{
  "defaultAction": "SCMP_ACT_ERRNO",   // ★ 默认拒绝
  "syscalls": [
    {
      "names": ["read", "write", "open", "close", ...],
      "action": "SCMP_ACT_ALLOW"        // 白名单允许
    },
    {
      "names": ["mount", "umount", "reboot", "kexec_load"],
      "action": "SCMP_ACT_ERRNO"        // 危险的拒绝
    }
  ]
}
```

**Docker 默认 profile** 已经禁用了 ~40 个危险 syscall（包括 `mount` / `reboot` / `keyctl`）。

**生产建议**：
- ① **K8s 必开** `seccompProfile: RuntimeDefault`
- ② 严格场景用 [bane](https://github.com/genuinetools/bane) 或 [oci-seccomp-bpf-hook](https://github.com/containers/oci-seccomp-bpf-hook) 生成业务最小化 profile

---

## SELinux vs AppArmor vs seccomp（三层防御对比）

| 维度 | **seccomp** | **AppArmor** | **SELinux** |
|------|------------|-------------|-------------|
| **粒度** | syscall 级 | 路径级 | 标签级（最细）|
| **配置** | JSON 简单 | profile 简单 | 复杂（学习曲线陡）|
| **默认发行版** | 所有 Linux | **Ubuntu / Debian** | **RHEL / Fedora / CentOS** |
| **容器友好度** | 高 | 中 | 中（K8s 有 SELinux annotations）|

**生产建议**：**三层一起开**——seccomp（syscall）+ AppArmor/SELinux（资源访问）+ Capabilities（权限），防御纵深。

---

## OverlayFS — 容器镜像的分层秘密

```text
┌────────────────────────────┐
│  Container Writable Layer   │ ← 容器写时复制层（COW）
├────────────────────────────┤
│  Image Layer N (App code)   │ ← 上层
├────────────────────────────┤
│  Image Layer 2 (npm install)│
├────────────────────────────┤
│  Image Layer 1 (Node 18)    │
├────────────────────────────┤
│  Image Layer 0 (Alpine OS)  │ ← 下层（base image）
└────────────────────────────┘

读: 从上往下找，找到立即返回
写: COW 复制到 Writable Layer 再修改
```

**OverlayFS 核心**：

```bash
# 手工挂载 overlay
mkdir lower upper work merged
echo "from lower" > lower/file.txt

sudo mount -t overlay overlay \
  -o lowerdir=lower,upperdir=upper,workdir=work \
  merged

cat merged/file.txt          # "from lower"
echo "modified" > merged/file.txt  # ★ COW，写到 upper/
cat lower/file.txt           # 原文件未变："from lower"
cat upper/file.txt           # "modified"
```

**实战价值**：
- ✅ 多个容器**共享同一镜像**（base 层只占一份磁盘）
- ✅ 镜像分发只传**差异层**（K8s 拉镜像快）
- ⚠️ 容器内写大量数据会膨胀 Writable Layer——**生产用 Volume 而非容器内写**

---

## Docker / Containerd / runc / Kata 关系（必懂）

```text
┌──────────────────────────────────┐
│         Docker CLI / Compose     │  ← 用户界面
└────────────┬─────────────────────┘
             │ Docker API
┌────────────▼─────────────────────┐
│         dockerd (Docker Daemon)  │
└────────────┬─────────────────────┘
             │ gRPC (CRI)
┌────────────▼─────────────────────┐
│         containerd               │  ← K8s 直连这层（不用 dockershim）
│  - 镜像管理                       │
│  - 容器生命周期                   │
└────────────┬─────────────────────┘
             │ shim
┌────────────▼─────────────────────┐
│         runc (OCI 运行时)         │  ← 真正调用 clone/unshare
│   或 runsc(gVisor) / kata        │
└──────────────────────────────────┘
```

**关键事实（必背）**：
- ① **K8s 1.24+ 移除 dockershim**——直接用 containerd 或 CRI-O
- ② **Docker 镜像 ≡ OCI 镜像**（标准化）
- ③ **runc 是事实标准**（runtime-spec）
- ④ **替代品**：
  - **gVisor**：用户态内核拦截 syscall，**强隔离**（接近 VM），性能损失 30%
  - **Kata Containers**：用轻量 VM 跑容器，**最强隔离**，启动慢
  - **Firecracker**（AWS Lambda）：极轻量 VM，125ms 启动

---

## Java / Go 容器感知（生产必踩坑）

### Java 容器陷阱

**JDK 10 之前**：Java 看 **宿主机** 的 CPU 和内存——容器限 512MB 内存，JVM 默认堆 1/4 宿主机内存 = 32GB → OOMKilled。

**JDK 10+ 修复**（`-XX:+UseContainerSupport` 默认开）：

```bash
# 标准 Java 容器配置（2026 必备）
java \
  -XX:+UseContainerSupport \              # 默认开
  -XX:MaxRAMPercentage=75.0 \             # ★ 用容器内存的 75%
  -XX:InitialRAMPercentage=50.0 \
  -XX:+UseG1GC \
  -XX:+ExitOnOutOfMemoryError \           # OOM 立即退出，由 K8s 重启
  -jar app.jar
```

详见 [K8s — Pod 故障 5 大模式 OOMKilled](../engineering-practice/kubernetes#pod-故障-5-大模式排查生产必备)。

### Go 容器陷阱

```go
// Go 默认 GOMAXPROCS = 宿主机 CPU 数（不感知容器 limit！）
// 容器限 500m（半核），但 GOMAXPROCS 仍是 32 → 大量 context switch

// ✅ 修复 1：用 automaxprocs 库（最简单）
import _ "go.uber.org/automaxprocs"

// ✅ 修复 2：手工设
runtime.GOMAXPROCS(getCgroupCPULimit())
```

---

## 黄金答题模板（必背）

> **面试官：Docker 怎么实现隔离的？**
>
> **答**：Docker = **Linux 内核机制 + 用户态打包**。核心 4 件套：
>
> ① **Namespace**（6 种）—— 进程隔离（PID）、网络隔离（NET）、文件系统隔离（MNT）、UTS（hostname）、IPC、USER；K8s 1.30+ User Namespace GA 让容器 root ≠ 宿主机 root，是关键安全升级。
>
> ② **cgroup v2** —— 限制 CPU / 内存 / IO / 进程数；K8s 1.25+ 默认 v2，统一层级结构。**最大坑是 CFS Throttling**——`cpu.cfs_period_us` 100ms 内用满就 throttle，导致 P99 暴涨。
>
> ③ **Capabilities** —— 把 root 权限拆 40+ 项，容器默认 `--cap-drop=ALL` 后按需 `--cap-add`；K8s Pod Security Standard "restricted" 强制要求。
>
> ④ **seccomp** —— syscall 白名单，Docker 默认禁了 40+ 个危险 syscall（mount/reboot/keyctl 等），K8s 必开 `RuntimeDefault`。
>
> 加上 **OverlayFS 分层镜像**（COW + 多容器共享 base 层）+ **runc** 真正调用 clone/unshare 创建容器。
>
> 强隔离场景换 **gVisor**（用户态拦截 syscall）或 **Kata Containers**（轻量 VM）。
>
> **必踩坑**：① Java 旧版不识别容器内存导致 OOM——`-XX:+UseContainerSupport`；② Go 不识别 CPU limit——`go.uber.org/automaxprocs`；③ K8s CFS Throttling 看 `nr_throttled` 指标。

---

## 看到什么就先想到这类

- **"Docker 怎么隔离"** → Namespace + cgroup + Capabilities + seccomp
- **"K8s 怎么限 CPU"** → cgroup v2 `cpu.max`
- **"Pod CPU 才 30% 但慢"** → CFS Throttling
- **"容器内 root 是否安全"** → User Namespace 映射
- **"Java OOMKilled"** → `-XX:+UseContainerSupport` + `MaxRAMPercentage`
- **"Go 容器性能差"** → `automaxprocs` 设 GOMAXPROCS
- **"K8s 安全合规"** → PSS restricted + seccomp RuntimeDefault + drop ALL caps
- **"容器逃逸"** → User Namespace + AppArmor/SELinux + seccomp 三层防御
- **"K8s 为什么移除 dockershim"** → 1.24+ 直连 containerd（CRI 标准）
- **"想要 VM 级隔离的容器"** → gVisor / Kata Containers / Firecracker
- **"为什么镜像分层"** → OverlayFS COW + base 层共享省磁盘
