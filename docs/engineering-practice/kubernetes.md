---
title: Kubernetes
---

# Kubernetes

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--advanced">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Kubernetes 是容器编排的事实标准。**学习顺序：先懂设计哲学（声明式 + 控制循环）→ 再逐个模块吃透（Pod / 工作负载 / Service / 网络 / 存储 / 调度 / 安全）→ 理解每个设计背后的"为什么"→ 最后落到部署实战、避坑和面试题。** 本页按这个顺序组织。
:::

本页结构：

1. [核心概念](#一核心概念是什么) —— K8s 是什么、设计哲学、整体架构
2. [核心模块详解](#二核心模块详解) —— 逐个模块 + 每个设计的原因与内核
3. [部署实战](#三部署实战) —— 无状态部署、配置、伸缩、滚动更新、优雅终止
4. [注意的问题](#四注意的问题常见陷阱) —— 生产常见坑
5. [面试常见问题](#五面试常见问题) —— 高频题标准答法

---

# 一、核心概念（是什么）

## 1.1 K8s 解决什么问题

容器（Docker）解决了"单个应用怎么打包和运行"，但生产环境有成百上千个容器，带来新问题：**挂了谁重启？流量怎么分发？怎么滚动升级不停机？配置和密钥怎么管？跨机器怎么调度？** Kubernetes 就是解决这些"**大规模容器编排**"问题的系统。

## 1.2 设计哲学：理解 K8s 的思维模型

在记忆一堆组件之前，先理解 K8s 的**三条设计主线**——几乎所有面试深挖题都能用它们解释。

### 主线一：声明式 API（Declarative）

**命令式 vs 声明式**是理解 K8s 的第一把钥匙：

| 范式 | 你怎么表达 | 例子 |
|------|-----------|------|
| **命令式**（Imperative） | 告诉系统**怎么做**（一步步操作） | `docker run` / `docker stop` / 手动扩容 |
| **声明式**（Declarative） | 告诉系统**要什么**（期望的最终状态） | `replicas: 3`——我要 3 个副本，怎么达到你自己想办法 |

> **核心思想**：用户只声明**期望状态（Desired State）**写进 etcd，K8s 自己负责把**实际状态（Current State）**不断拉向期望状态。你不用管"当前有几个 Pod、挂了要重建谁"——这些都交给控制器。

**为什么声明式更好**：
- **幂等**：同一份 YAML `apply` 一百次结果一样，不怕重复执行
- **自愈**：Pod 挂了控制器自动重建，因为"实际 ≠ 期望"
- **可版本化**：YAML 进 Git 就是 GitOps 的基础（ArgoCD 的原理）

### 主线二：控制循环（Control Loop / Reconciliation）

K8s 的"大脑"不是一次性执行命令，而是**无数个控制器在跑无限循环**，每个循环做三件事：

```
      ┌──────────────────────────────────┐
      │        Reconcile Loop            │
      │   1. Observe  观察实际状态         │  ← 从 API Server 读当前状态
      │   2. Diff     对比期望状态         │  ← Desired（etcd）vs Current
      │   3. Act      执行动作消除差异      │  ← 创建/删除/更新资源
      │        ↺  （永远循环）             │
      └──────────────────────────────────┘

例：Deployment 期望 replicas=3，实际只有 2 个
   → Diff 发现少 1 个 → ReplicaSet 控制器创建 1 个新 Pod → 收敛
```

> **这就是 K8s 自愈能力的本质**：不是"监控到故障再告警人工处理"，而是"控制器持续对比期望与实际，自动消除差异"。理解了 reconcile loop，就理解了 Deployment 滚动更新、HPA 扩缩容、Operator 的共同原理——**它们全是控制循环的不同实现**。

### 主线三：一切围绕 API Server + etcd

```
     用户 / 控制器 / kubelet
              │  （只能通过 API Server 读写，谁都不能直连 etcd）
              ▼
      ┌──────────────┐        ┌────────┐
      │  API Server  │ ◄────► │  etcd  │   ← 唯一的"事实来源"(Source of Truth)
      └──────────────┘        └────────┘
              ▲
      list-watch（增量监听状态变化，而非轮询）
```

| 设计 | 为什么这么设计 |
|------|--------------|
| **只有 API Server 能访问 etcd** | 收敛所有认证/授权/准入/校验逻辑到一处；其他组件无状态，可任意重启/多副本 |
| **所有状态存 etcd** | etcd 用 Raft 保证强一致，是集群唯一"事实来源"；组件全部宕机后从 etcd 恢复即可 |
| **组件间用 list-watch 而非轮询** | 控制器/kubelet 通过 watch **长连接增量接收**状态变更，实时且低开销；避免几千个组件疯狂轮询 API Server |
| **组件彼此不直接通信** | 全部通过 API Server 中转（"状态驱动"），组件解耦、可独立演进、易扩展 |

::: tip 💡 面试黄金回答（一句话讲透 K8s 设计）

> **"K8s 的本质是一个声明式的状态机：用户把期望状态写进 etcd，一群控制器通过 list-watch 监听变化，各自跑 reconcile loop 不断把实际状态拉向期望状态。所有读写都经过 API Server，etcd 是唯一事实来源。理解了'声明式 + 控制循环'，滚动更新、自愈、HPA、Operator 就都是同一个模式的不同实现。"**

:::

## 1.3 整体架构

**控制平面（Control Plane）与数据平面（Node）分离**是 K8s 的基本架构：控制平面负责"决策"（调度、编排、状态管理），Node 负责"执行"（真正跑容器）。

```
┌─────────────────── 控制平面 Control Plane（Master）───────────────────┐
│  API Server    Scheduler    Controller Manager    Cloud Controller   │
│                          etcd（集群状态存储）                          │
└──────────────────────────────────────────────────────────────────────┘
         │                    │                    │
┌─── Node 1 ───┐     ┌─── Node 2 ───┐     ┌─── Node 3 ───┐
│ kubelet       │     │ kubelet       │     │ kubelet       │
│ kube-proxy    │     │ kube-proxy    │     │ kube-proxy    │
│ 容器运行时     │     │ 容器运行时     │     │ 容器运行时     │
│ ┌───┐ ┌───┐  │     │ ┌───┐ ┌───┐  │     │ ┌───┐        │
│ │Pod│ │Pod│  │     │ │Pod│ │Pod│  │     │ │Pod│        │
│ └───┘ └───┘  │     │ └───┘ └───┘  │     │ └───┘        │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Master（控制平面）组件**：

| 组件 | 职责 | 一句话理解 |
|------|------|-----------|
| **API Server** | 集群统一入口，所有操作经 REST API；负责认证、授权、准入、校验 | 集群"前台"，唯一能读写 etcd 的组件 |
| **Scheduler** | 监听未调度 Pod，按资源/亲和性等策略分配到合适 Node | 只决定"放哪个节点"，不负责启动 |
| **Controller Manager** | 运行各类控制器（Deployment、ReplicaSet、Node、Endpoint…），持续收敛状态 | reconcile loop 的"集散地" |
| **etcd** | 分布式 KV 存储，保存集群全部状态，Raft 强一致 | 集群唯一"事实来源"，挂了集群失忆 |
| **Cloud Controller Manager** | 对接云厂商 API（LB、云盘、节点生命周期） | 让 K8s 与云平台解耦 |

**Node（数据平面）组件**：

| 组件 | 职责 |
|------|------|
| **kubelet** | 每个 Node 的"代理"，接收 PodSpec 确保容器按期望运行；上报节点/Pod 状态 |
| **kube-proxy** | 维护节点网络规则（iptables/IPVS），实现 Service 转发与负载均衡 |
| **容器运行时（CRI）** | 真正拉镜像、跑容器（containerd、CRI-O；Docker 已于 1.24 移除 dockershim）|

::: tip 💡 一次 `kubectl apply` 背后发生了什么（必背串场题）

> ① `kubectl` 把 YAML 发给 **API Server** → 认证/授权/准入 → 写 **etcd**；② **Deployment Controller** watch 到 → 创建 ReplicaSet；③ **ReplicaSet Controller** watch 到 → 创建 Pod 对象（还没节点）；④ **Scheduler** watch 到未调度 Pod → 选节点 → 写回 `nodeName`；⑤ 对应节点 **kubelet** watch 到 → 调容器运行时拉镜像起容器；⑥ kubelet 上报状态写回 etcd → `kubectl get pod` 看到 Running。
>
> **整条链路没有任何组件直接互相调用，全靠 watch etcd 状态变化驱动**——这就是"声明式 + 控制循环"的实际运转。

:::

## 1.4 核心资源对象总览

| 资源对象 | 作用 | 详见 |
|----------|------|------|
| **Pod** | 最小调度单元，封装一个或多个容器 | [2.1](#_2-1-pod-最小调度单元) |
| **Deployment / ReplicaSet** | 声明式管理无状态 Pod，滚动更新/回滚 | [2.2](#_2-2-工作负载-workload) |
| **StatefulSet / DaemonSet / Job / CronJob** | 有状态 / 每节点 / 批处理 | [2.2](#_2-2-工作负载-workload) |
| **Service / Ingress** | 稳定访问入口 / 七层路由 | [2.4](#_2-4-service-与网络) |
| **ConfigMap / Secret** | 配置 / 敏感数据注入 | [2.3](#_2-3-配置管理-configmap-secret) |
| **PV / PVC / StorageClass** | 持久化存储 | [2.5](#_2-5-存储-volume-pv-pvc) |
| **HPA / VPA** | 自动伸缩 | [2.6](#_2-6-自动伸缩) |
| **RBAC / PSS** | 权限 / Pod 安全 | [2.7](#_2-7-安全) |

---

# 二、核心模块详解

> 每个模块按"**是什么 → 怎么用 → 为什么这么设计（原因和内核）**"讲。

## 2.1 Pod（最小调度单元）

### 是什么

Pod 是 K8s 最小调度单元，封装一个或多个共享资源的容器。

### 为什么 Pod 是最小单位，而不是容器？（设计内核）

> **Pod = 一组"必须部署在一起、共享资源"的容器的原子单元。**

| 设计原因 | 说明 |
|---------|------|
| **共享网络** | 同 Pod 内所有容器共享网络命名空间（同一 IP、同一端口空间），可 `localhost` 互访——适合主容器 + Sidecar |
| **共享存储** | 同 Pod 容器可挂同一个 Volume，方便数据共享 |
| **共同生命周期** | "生死与共"的进程作为整体调度、伸缩、重建，避免调度到不同节点无法通信 |
| **保持单一职责** | 一个容器一个进程（Docker 最佳实践），多进程协作用多容器 Pod 而非"胖容器" |

**Sidecar 模式**是 Pod 多容器设计的最典型应用：主容器专注业务，Sidecar 处理横切关注点（服务网格代理、日志、监控），二者共享网络与存储、同生共死。K8s **1.28 引入原生 Sidecar**（`initContainers` + `restartPolicy: Always`），保证 Sidecar 先启动、晚退出，解决启动竞态与优雅退出。

### Pod 生命周期

```
Pending → Running → Succeeded / Failed

Pod 内部启动顺序:
  Init Container（串行，全部成功才继续）
    → Main Container 启动
      → PostStart Hook（可选）
        → 运行中（探针持续检测）
          → PreStop Hook（可选）→ 容器终止
```

| 阶段 | 含义 |
|------|------|
| **Pending** | 已接受但容器未全部创建（拉镜像/调度中）|
| **Running** | 至少一个容器在运行 |
| **Succeeded** | 所有容器正常退出（exit 0），不重启 |
| **Failed** | 所有容器退出，至少一个非正常退出 |
| **Unknown** | 无法获取状态（通常节点失联）|

**Init Container 典型用途**：等待依赖就绪（DB/配置中心）、预处理数据、权限/网络初始化——串行执行且必须全成功，主容器才启动。

## 2.2 工作负载（Workload）

### 是什么

Pod 通常不直接创建，而是交给上层 **Workload Controller** 管理。选哪个取决于应用特性：

| Controller | 适用场景 | 核心特性 | 典型例子 |
|-----------|---------|---------|---------|
| **Deployment** | **无状态**应用 | Pod 对等、随机命名、滚动更新/回滚 | Web 服务、API 网关 |
| **StatefulSet** | **有状态**应用 | 稳定标识（`app-0`）+ 独立存储 + 有序启动/伸缩 | MySQL、Kafka、ZK |
| **DaemonSet** | **每节点一个** | 每 Node 各跑一个，节点加入自动补 | 日志采集、监控、CNI |
| **Job** | **一次性任务** | 跑完即退，保证成功完成 N 次 | 数据迁移、批处理 |
| **CronJob** | **定时任务** | 按 cron 周期创建 Job | 定时备份、报表 |

### Deployment vs StatefulSet（高频对比）

| 维度 | Deployment | StatefulSet |
|------|-----------|-------------|
| Pod 身份 | 随机后缀（`app-7d4f-xk2p`）| 稳定有序（`app-0`、`app-1`）|
| 网络标识 | IP 随机变化 | 固定 DNS，配 Headless Service |
| 存储 | 共享或无持久存储 | 每 Pod 独占 PVC，重建仍绑原数据 |
| 启动/伸缩顺序 | 并行、无序 | 严格有序（0→1→2，缩容反向）|

### 为什么是 Deployment → ReplicaSet → Pod 三层？（设计内核）

> **关键答案：为了实现滚动更新和版本回滚。**

```
Deployment（管版本 + 更新策略）
    ├── ReplicaSet v1（旧版本 image:1.0）← 保留，用于回滚
    └── ReplicaSet v2（新版本 image:2.0）← 当前
            └── Pod、Pod、Pod

滚动更新: 逐步 v2 +1 Pod、v1 -1 Pod → 平滑切换、零停机
回滚:     把流量切回 v1 ReplicaSet（一直保留着）→ 秒级回滚
```

**职责分离**：ReplicaSet 只负责"维持 N 个副本"（副本控制）；Deployment 在其上管理"多版本 + 更新策略 + 回滚"（版本控制）。旧 ReplicaSet 保留（`revisionHistoryLimit` 控制数量），回滚直接切回，无需重拉镜像。这是职责单一原则在资源设计上的体现。

## 2.3 配置管理（ConfigMap / Secret）

### 是什么

- **ConfigMap**：存非敏感配置（键值对或配置文件）
- **Secret**：存敏感数据（密码、证书、token）

两者都可通过**环境变量**或**文件挂载**注入 Pod。

### 设计内核：Secret 不是加密，只是 Base64

> Secret 数据仅 Base64 编码，任何有读权限的人都能 `base64 -d` 还原明文。生产必须：① 开 etcd 静态加密（EncryptionConfiguration）；② 用外部密钥系统（Vault / AWS Secrets Manager / External Secrets Operator）；③ RBAC 严格限制读取权限。

**环境变量 vs 文件挂载的关键区别**：文件挂载的 ConfigMap/Secret **更新后会自动同步到 Pod**（有延迟）；而**环境变量注入的值在 Pod 启动后固定**，改了 ConfigMap 也不生效，必须重启 Pod。

## 2.4 Service 与网络

### 为什么需要 Service？—— Pod 是"牲畜"不是"宠物"（设计内核）

**Pod 是临时的（Ephemeral）**：滚动更新、扩缩容、故障重建都会让 Pod 被销毁重建，**IP 每次都变**。客户端直接记 Pod IP，一重建就找不到了。

```
没有 Service: 客户端记 10.1.1.5 → Pod 重建 → 变 10.1.1.9 → 找不到 ❌
有 Service:   客户端访问 Service（稳定 ClusterIP / DNS）
              → Service 靠 Label Selector 动态跟踪 Pod → 负载均衡到存活 Pod ✅
```

> **Service 的本质**：给一组"随时会变"的 Pod 一个**稳定虚拟入口（ClusterIP + DNS + 负载均衡）**，靠 **Label Selector** 动态维护后端列表（Endpoints）。这就是"把 Pod 当牲畜而非宠物"（Cattle not Pets）云原生理念。

### Service 类型

| 类型 | 访问范围 | 适用 |
|------|----------|------|
| **ClusterIP**（默认） | 仅集群内部 | 微服务互调 |
| **NodePort** | 集群外，`节点IP:端口`（30000-32767）| 测试临时对外 |
| **LoadBalancer** | 集群外，云厂商 LB | 生产对外暴露 |
| **Headless**（`clusterIP: None`） | 返回 Pod IP 列表 | StatefulSet 固定寻址 |

> 生产常用 **ClusterIP + Ingress** 组合，避免每个服务开昂贵的 LoadBalancer。

### 服务发现 + Endpoints（内核）

CoreDNS 为每个 Service 建 DNS 记录 `<service>.<namespace>.svc.cluster.local`，Pod 直接用服务名访问。Service **不直接连 Pod**，而是通过 **Endpoints/EndpointSlice** 动态维护"匹配且**就绪**的 Pod IP 列表"，kube-proxy 据此生成转发规则。readinessProbe 失败的 Pod 被移出 Endpoints——这就是"摘流量不重启"的实现。

### 容器网络模型与 CNI

**K8s 网络四大铁律**：① 每个 Pod 一个 IP，Pod 内容器共享网络命名空间；② 所有 Pod 不经 NAT 互通（跨节点也是）；③ 节点与 Pod 互通；④ Pod 自看 IP == 他看它的 IP。

> **关键**：K8s **只定义 CNI 规范，不实现网络**——具体由 CNI 插件实现（所以装完 K8s 还要单独装网络插件）。

| CNI 插件 | 模式 | 性能 | NetworkPolicy | 适用 |
|------|------|------|---------|------|
| **Flannel** | Overlay（VXLAN）| 中（封装开销）| ❌ | 入门/测试 |
| **Calico** | BGP / IPIP | 高（接近裸网络）| ✅ | **生产首选** |
| **Cilium** | eBPF + BGP | 最高（绕开 iptables）| ✅✅ L3-L7 | **现代云原生首选** |

### kube-proxy 三种模式（内核 + 规模瓶颈）

| 模式 | 数据结构 | 大规模性能 |
|------|--------|-----------|
| **iptables**（默认） | 规则链 | **O(N) 线性匹配**，5000+ Service 后膨胀到几十万条、更新阻塞数秒 |
| **IPVS** | LVS 内核哈希表 | **O(1) 匹配** + RR/LC 等算法，**大规模推荐** |
| **eBPF**（Cilium） | eBPF Map | 最高 |

> **ClusterIP 是虚拟 IP**——不绑在任何网卡上，只是 kube-proxy 的一个 DNAT 目标，所以 ping 不通、抓包也看不到。大规模生产必须切 IPVS 或 Cilium eBPF。

### Ingress：七层入口

Service 是四层（TCP）暴露，**Ingress 提供七层（HTTP/HTTPS）路由**：按域名/路径分发、统一 TLS 终止、一个入口服务多个后端。Ingress 本身只是规则，必须部署 **Ingress Controller**（Nginx/Traefik）才生效。新一代标准是 **Gateway API**（2023 GA，角色分离 + 支持 TCP/UDP/gRPC）。

### NetworkPolicy：网络隔离

默认所有 Pod 互通（"大平层"），**NetworkPolicy 实现 Pod 间防火墙**（零信任底线）。注意它靠 CNI 实现，**Flannel 不支持**，需 Calico/Cilium。一旦某 Pod 被任意 NetworkPolicy 选中，就从"默认全通"变为"默认全拒 + 白名单"。

## 2.5 存储（Volume / PV / PVC）

### 为什么要 PV/PVC 分离？（设计内核）

容器的文件系统是临时的，重建即丢。K8s 存储体系用**三层抽象**解耦"用存储的人"和"提供存储的人"：

| 对象 | 角色 | 类比 |
|------|------|------|
| **PV（PersistentVolume）** | 集群里一块**实际存储**（云盘、NFS…），由管理员/StorageClass 提供 | "仓库里的货" |
| **PVC（PersistentVolumeClaim）** | 用户对存储的**申请**（要 10Gi、ReadWriteOnce） | "领货单" |
| **StorageClass** | **动态制备**模板，PVC 来了自动创建对应 PV | "自动发货规则" |

> **设计意义**：应用只声明"我要一块 10Gi 的读写盘"（PVC），不关心底层是 AWS EBS 还是 Ceph——PV/StorageClass 屏蔽了存储实现，实现**关注点分离 + 可移植**。StatefulSet 的 `volumeClaimTemplates` 就是给每个 Pod 自动生成独立 PVC，保证 `app-0` 重建后仍绑原来的数据盘。

**访问模式**：`ReadWriteOnce`（单节点读写，块存储如云盘）、`ReadOnlyMany`（多节点只读）、`ReadWriteMany`（多节点读写，需 NFS/CephFS）。

## 2.6 自动伸缩

**HPA / VPA / CA 三者别混淆**：

| 伸缩器 | 对象 | 方向 | 适用 |
|-----------|---------|------|------|
| **HPA**（Horizontal） | Pod **数量** | 加减副本 | 无状态应对流量波动 |
| **VPA**（Vertical） | 单 Pod 的 requests/limits | 调规格 | 难水平扩展的有状态应用 |
| **CA**（Cluster Autoscaler） | **节点数量** | 加减 Node | Pod 因资源不足 Pending 时扩节点 |

> **典型组合**：HPA 扩 Pod → 节点不够 Pod Pending → CA 扩节点 → Pod 被调度。HPA 依赖 **Metrics Server**，且 Pod 必须设 `requests` 才能算利用率。HPA 和 VPA 一般不同时作用同一指标（会打架）。

## 2.7 调度、探针与终止

### 调度机制（内核）

```
新 Pod → Scheduler 两阶段:
  Filter（过滤/预选）→ 找"能放"的节点（资源够/端口不冲突/nodeSelector 匹配/污点容忍）
  Score（打分/优选） → 给可行节点打分（亲和性/资源均衡/镜像本地化）
  Bind → 选最高分节点，写回 Pod.spec.nodeName
```

**四种调度控制**：

| 机制 | 谁主动 | 一句话 |
|------|-------|-----------|
| **nodeSelector** | Pod 选节点 | "只去打了 X 标签的节点" |
| **Node Affinity** | Pod 选节点 | "尽量去 SSD 节点，没有也凑合"（软/硬约束）|
| **Pod Affinity/AntiAffinity** | Pod 选 Pod | "和 Redis 同节点 / 副本分散到不同节点" |
| **Taints + Tolerations** | 节点选 Pod | "我有污点，只有能容忍的 Pod 才能来" |

> 硬约束 `requiredDuringScheduling`（不满足就 Pending）vs 软约束 `preferredDuringScheduling`（尽量满足带 weight）。master 节点默认带 `NoSchedule` 污点，所以普通 Pod 不上去。生产高可用必配 `podAntiAffinity + topologyKey: hostname` 让副本跨节点分散。

### 三种探针（分工不同，不能混用）

| 探针 | 作用 | 失败后果 | 用途 |
|------|------|---------|------|
| **livenessProbe** | 是否**还活着** | **重启容器** | 检测死锁等无法自恢复状态 |
| **readinessProbe** | 是否**能接流量** | **从 Endpoints 摘除**（不重启） | 启动预热、依赖未就绪先不接流量 |
| **startupProbe** | 是否**启动完成** | 重启；**通过前禁用另两个** | 保护启动慢的应用（Java/大模型）|

::: warning ⚠️ liveness 和 readiness 别用同一个查外部依赖的端点

> 若两者都探 `/health` 且里面查 DB，当 DB 抖动 → readiness 失败摘流量（合理）+ **liveness 也失败重启 Pod（灾难）** → 重启后 DB 还没好 → 继续重启雪崩。**正确分工**：liveness 只探进程自身是否卡死（轻量、不查外部依赖），readiness 才查下游依赖。

:::

### Pod 优雅终止（内核）

```
kubectl delete pod →
1. Pod 转 Terminating
2. 并发: 从 Endpoints 移除（不再接新流量） + 触发 preStop Hook
3. preStop 执行完 → 发 SIGTERM 给主进程
4. 等 terminationGracePeriodSeconds（默认 30s）
5. 仍未退 → SIGKILL 强杀
```

::: warning ⚠️ 优雅终止两大坑

> ① **502 错误**：摘 Endpoints 是异步的（kube-proxy 同步有延迟），可能 Pod 已关闭但还在被转发。解决：preStop `sleep 5` 等同步完再关。
> ② **PID 1 信号**：用 `sh -c "java ..."` 启动时 shell 是 PID 1，不转发 SIGTERM 给 Java → 优雅终止失效，30s 后被硬杀。解决：用 `exec java ...` 或加 `tini`。

:::

## 2.8 安全

### RBAC：谁能操作什么

| 对象 | 作用 | 作用域 |
|------|------|--------|
| **Role / ClusterRole** | 定义权限（对哪些资源做哪些动作）| Namespace / 全集群 |
| **RoleBinding / ClusterRoleBinding** | 把权限绑给用户/组/ServiceAccount | Namespace / 全集群 |

> 遵循最小权限：给应用 ServiceAccount 只授必需权限，不用 `cluster-admin`；无需访问 API 的 Pod 设 `automountServiceAccountToken: false`。

### Pod 安全标准（PSS）—— PSP 的继任者

**PodSecurityPolicy（PSP）已于 1.25（2022.08）完全移除**（因授权复杂、默认放行、无法灰度），由 **Pod Security Standards（PSS）+ Pod Security Admission** 取代。三级别：

| Profile | 限制 | 适用 |
|---------|---------|---------|
| **privileged** | 完全不限制 | 系统组件（kube-proxy、CNI）|
| **baseline** | 防已知提权（禁 hostNetwork/hostPID/privileged）| 应用默认底线 |
| **restricted** | 严格（强制 runAsNonRoot、drop 所有 capabilities）| 生产应用 |

用法：给 Namespace 打标签 `pod-security.kubernetes.io/enforce: restricted`。更复杂的自定义策略（禁 latest 镜像、强制 limits）用 **OPA Gatekeeper / Kyverno**。

## 2.9 扩展：Operator 模式

### CRD + Controller = Operator（设计内核）

K8s 允许用 **CRD（自定义资源定义）** 定义自己的资源类型，再写一个 **Controller** 跑 reconcile loop 管理它——两者结合就是 Operator，把"运维专家的知识"编码进控制器。

```
apiVersion: mysql.example.com/v1
kind: MySQLCluster            # ← 你自定义的资源类型（CRD）
spec:
  replicas: 3                 # 主 + 2 从
  backup: { schedule: "0 2 * * *" }
→ Operator Controller 自动: 建 StatefulSet + 配主从 + 定时备份 + 主挂 failover + 滚动升级
```

**Operator vs Helm**：Helm 只做模板渲染 + 一次性部署；Operator 还管 **Day 2 运维**（备份/故障恢复/扩容/升级）。Prometheus、TiDB、Kafka（Strimzi）在 K8s 上的事实标准都是 Operator。

---

# 三、部署实战

## 场景 1：无状态应用部署

Deployment 管 3 副本 + ClusterIP Service + 资源限制 + 健康探针：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels: { app: my-app }
  template:
    metadata:
      labels: { app: my-app }
    spec:
      containers:
      - name: my-app
        image: my-app:1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests: { cpu: "100m", memory: "128Mi" }
          limits:   { cpu: "500m", memory: "512Mi" }
        livenessProbe:
          httpGet: { path: /actuator/health, port: 8080 }
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet: { path: /actuator/health, port: 8080 }
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: my-app-svc
spec:
  selector: { app: my-app }
  ports:
  - { port: 80, targetPort: 8080 }
  type: ClusterIP
```

::: tip 💡 requests vs limits 的设计意义

> **requests** 是调度依据（Scheduler 按它找装得下的节点）+ HPA 计算基准；**limits** 是运行时硬约束（CPU 超了限流、内存超了 OOMKilled）。三种 QoS：`requests==limits` → **Guaranteed**（最后被驱逐）；只设 requests → **Burstable**；都不设 → **BestEffort**（资源紧张第一个被驱逐）。生产至少 Burstable。

:::

## 场景 2：配置管理

```yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: app-config }
data:
  APP_ENV: "production"
  application.yaml: |
    server: { port: 8080 }
---
apiVersion: v1
kind: Secret
metadata: { name: app-secret }
type: Opaque
data:
  DB_PASSWORD: cGFzc3dvcmQxMjM=   # base64（非加密！）
---
# Deployment 片段：两种注入方式
spec:
  containers:
  - name: my-app
    image: my-app:1.0.0
    env:                              # 方式一：环境变量
    - name: APP_ENV
      valueFrom: { configMapKeyRef: { name: app-config, key: APP_ENV } }
    - name: DB_PASSWORD
      valueFrom: { secretKeyRef: { name: app-secret, key: DB_PASSWORD } }
    volumeMounts:                     # 方式二：文件挂载
    - { name: config-volume, mountPath: /app/config }
  volumes:
  - name: config-volume
    configMap:
      name: app-config
      items:
      - { key: application.yaml, path: application.yaml }
```

## 场景 3：弹性伸缩（HPA）

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: my-app-hpa }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: my-app }
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target: { type: Utilization, averageUtilization: 50 }
```

> 依赖 Metrics Server，Pod 必须设 `requests`。

## 场景 4：滚动更新与回滚

```yaml
spec:
  replicas: 3
  revisionHistoryLimit: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # 最多多出 1 个 Pod
      maxUnavailable: 0    # 最多 0 个不可用（零停机）
  template:
    spec:
      containers:
      - { name: my-app, image: my-app:2.0.0 }   # 改镜像触发更新
```

```bash
kubectl rollout status deployment/my-app        # 看进度
kubectl rollout history deployment/my-app       # 看历史
kubectl rollout undo deployment/my-app          # 回滚上一版
kubectl rollout undo deployment/my-app --to-revision=2   # 回滚指定版
```

::: tip 💡 maxSurge / maxUnavailable 取舍

> `maxUnavailable:0 + maxSurge:1` 零停机但更新慢、多占资源，**在线服务首选**；`maxUnavailable:1 + maxSurge:0` 不多占资源但少 1 副本。另有 `Recreate`（先全停再全起，有停机，适合不允许多版本共存如 DB schema 不兼容）。

:::

## 场景 5：优雅终止配置

```yaml
spec:
  terminationGracePeriodSeconds: 60
  containers:
  - name: my-app
    image: my-app:1.0.0
    lifecycle:
      preStop:
        exec:
          command: ["sh", "-c", "sleep 5"]   # 等 Endpoints 同步完再关，避免 502
```

---

# 四、注意的问题（常见陷阱）

| 陷阱 | 现象 | 正确做法 |
|------|------|----------|
| 不设 `resources.limits` | 单 Pod 无限吃 CPU/内存，挤爆节点、别的 Pod 被驱逐 | 始终设 requests + limits，HPA 也依赖 requests |
| liveness/readiness 同配置且查外部依赖 | DB 抖动时 liveness 也失败 → 反复重启雪崩 | liveness 只探进程自身，readiness 才查依赖；启动慢用 startupProbe |
| 以为 Secret 是加密的 | 仅 Base64，有读权限即可解码 | 开 etcd 静态加密 / 用 Vault / RBAC 限权 |
| 业务进程不是 PID 1 | SIGTERM 不被转发，优雅终止失效，30s 硬杀 | 用 `exec` 启动或加 tini |
| 环境变量注入配置后改 ConfigMap | 改了不生效 | 环境变量需重启 Pod；要热更新用文件挂载 |
| 4 个节点做集群 | 脑裂时 2+2 没有多数派，etcd 卡死 | etcd/控制平面用奇数节点（3/5/7）|
| JVM 没识别容器内存 | 早期 JDK 看宿主机内存 → OOMKilled | `-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport`（JDK 10+）|
| iptables 模式大集群变慢 | 5000+ Service 后 O(N) 匹配、更新阻塞 | 切 IPVS 或 Cilium eBPF |
| 有状态应用用 Deployment | Pod 重建 IP 变、无固定身份、共享存储数据错乱 | 用 StatefulSet 或专用 Operator |

## Pod 故障 5 大模式速查

| 状态 | 本质 | 首要排查命令 |
|------|------|-------------|
| **Pending** | 调度失败（资源/亲和/污点/PVC）| `kubectl describe pod` 看 Events |
| **ImagePullBackOff** | 镜像拉不下来（名错/私有仓库/网络）| `kubectl describe pod` 看 Events |
| **CrashLoopBackOff** | 启动即退被反复重启 | `kubectl logs --previous` 看崩溃堆栈 |
| **OOMKilled**（Exit 137）| 内存超 limits 被杀 | `kubectl describe pod` 看 Last State |
| **Running 但不通** | Endpoints 空 / selector 不匹配 / NetworkPolicy | `kubectl get endpoints <svc>` |

::: tip 💡 排查口诀

> **"看状态 → describe 事件 → logs --previous → exec 进容器"**，90% 的 Pod 故障 4 步内定位。状态码记两个：**137=OOM，143=优雅终止超时**（128+SIGKILL / 128+SIGTERM）。

:::

---

# 五、面试常见问题

**Q1：K8s 的声明式 API 和控制循环是什么？为什么这样设计？**

声明式 API 指用户只描述**期望状态**（如 `replicas: 3`），而非一步步操作。K8s 通过**控制循环**不断做三件事：观察实际 → 对比期望 → 消除差异，把实际状态持续收敛到期望。好处：① 幂等（反复 apply 结果一致）；② 自愈（Pod 挂了控制器发现"实际≠期望"自动重建）；③ 可版本化（YAML 进 Git = GitOps）。滚动更新、HPA、Operator 本质都是控制循环。

**Q2：K8s 核心组件有哪些？一次 `kubectl apply` 后发生了什么？**

控制平面：API Server（统一入口 + 唯一读写 etcd）、Scheduler（选节点）、Controller Manager（跑控制器收敛状态）、etcd（强一致状态存储）。数据平面：kubelet（确保容器按期望运行）、kube-proxy（Service 网络规则）、容器运行时。apply 流程：kubectl→API Server 认证授权写 etcd→Deployment Controller 建 ReplicaSet→ReplicaSet Controller 建 Pod→Scheduler 选节点写 nodeName→kubelet 调运行时起容器→上报状态。全靠 list-watch 状态驱动，无组件直接互调。

**Q3：为什么 Pod 是最小调度单位而不是容器？**

Pod 是一组"必须部署在一起、共享资源"的容器的原子单元。同 Pod 容器共享网络命名空间（同 IP、localhost 互访）和存储卷，作为整体调度伸缩重建。既保持"一容器一进程"单一职责，又支持主容器 + Sidecar 这类紧耦合、需生死与共的场景。

**Q4：Deployment 和 StatefulSet 的区别？为什么中间要夹 ReplicaSet？**

Deployment 管无状态（Pod 对等、随机命名、IP 随机、可替换）；StatefulSet 管有状态（稳定标识 `app-0`、独占 PVC、有序启停）。夹 ReplicaSet 是为滚动更新和回滚：ReplicaSet 只管"维持 N 副本"，Deployment 管"多版本 + 更新策略"，每次更新新建 ReplicaSet 逐步切换、旧的保留供秒级回滚。

**Q5：Service 有哪几种类型？为什么 ClusterIP ping 不通？**

ClusterIP（默认，仅内部）、NodePort（节点 IP+端口，测试对外）、LoadBalancer（云 LB，生产对外）、Headless（返回 Pod IP，StatefulSet 用）。ClusterIP 是**虚拟 IP**，不绑在任何网卡上，只是 kube-proxy 的 iptables/IPVS 里一个 DNAT 目标，访问时内核直接改写成真实 Pod IP，所以 ping 不通、抓包看不到。

**Q6：liveness 和 readiness 探针的区别？启动慢的应用怎么配？**

liveness 检测是否还活着，失败重启容器（检测死锁）；readiness 检测是否能接流量，失败从 Endpoints 摘除但不重启（启动预热/依赖检查）。切忌两者用同一个查外部依赖的端点，否则依赖抖动引发重启雪崩。启动慢的应用用 startupProbe 保护启动阶段（大 failureThreshold×periodSeconds），通过前 liveness/readiness 都不生效。

**Q7：`kubectl delete pod` 后怎么保证零停机？**

Pod 转 Terminating，并发地摘 Endpoints + 执行 preStop，然后 SIGTERM，等 grace period（默认 30s）超时 SIGKILL。零停机要点：① preStop `sleep 5` 等 kube-proxy 同步完 Endpoints 再关，避免 502；② 应用收 SIGTERM 后处理完存量请求再退；③ 确保业务进程是 PID 1（exec/tini），否则 SIGTERM 不转发。

**Q8：K8s 网络模型？CNI 是什么？大集群 kube-proxy 怎么选？**

四大铁律：每 Pod 独立 IP、所有 Pod 不经 NAT 互通、节点与 Pod 互通、Pod 自看 IP 一致。K8s 只定义 CNI 规范不实现网络，由插件实现：Flannel（Overlay，简单损耗 10%）、Calico（BGP，生产标配）、Cilium（eBPF，最现代）。kube-proxy 默认 iptables 在 5000+ Service 后 O(N) 变慢，大集群切 IPVS（O(1) 哈希）或 Cilium eBPF。

**Q9：怎么排查 Pod 起不来 / 反复重启？**

看状态定位类型：Pending→describe 看 Events（资源/亲和/污点/PVC）；ImagePullBackOff→镜像名/私有仓库 secret/网络；CrashLoopBackOff→`logs --previous` 看崩溃堆栈；Exit 137=OOMKilled（describe 看 Last State，调大 limits 或查内存泄漏）；Running 但不通→`get endpoints` 看是否为空（readiness 失败或 selector 不匹配）。口诀：看状态→describe→logs --previous→exec 进容器。

**Q10：什么是 Operator？和 Helm 的区别？**

Operator = CRD（自定义资源）+ Controller（reconcile loop），把运维专家知识编码进控制器，让用户声明式描述有状态服务（如"3 节点带备份的 MySQL"），自动建 StatefulSet、配主从、备份、failover。与 Helm 区别：Helm 只做模板渲染和一次性部署，Operator 还管 Day 2 运维（备份/恢复/扩容/升级）。Prometheus、TiDB、Kafka 都用 Operator。

---

## 看到什么就先想到这类

| 关键词 / 场景 | 优先想到 |
|--------------|---------|
| 容器编排 / 集群管理 | Kubernetes |
| 声明式 / 期望状态 / 自愈 | 控制循环 Reconcile Loop |
| 唯一事实来源 / 集群状态 | etcd（Raft 强一致）|
| 无状态多副本 / 滚动更新 | Deployment |
| 有状态 / 数据库 / 固定身份 | StatefulSet + Headless Service |
| 每节点一个（日志/监控） | DaemonSet |
| 一次性 / 定时任务 | Job / CronJob |
| 服务发现 / 负载均衡 | Service + CoreDNS |
| 域名/路径路由 / TLS | Ingress（+ Controller）/ Gateway API |
| 配置 / 密钥 | ConfigMap / Secret（+ etcd 加密）|
| 持久化存储 | PV / PVC / StorageClass |
| 自动伸缩 | HPA（Pod）/ VPA（规格）/ CA（节点）|
| 副本分散 / 高可用 | podAntiAffinity / topologySpread |
| 专用节点排斥普通 Pod | Taints + Tolerations |
| 启动慢反复重启 | startupProbe |
| 发布出现 502 | preStop sleep + Endpoints 异步 |
| Pod 间网络隔离 | NetworkPolicy（需 Calico/Cilium）|
| 大集群 Service 变慢 | kube-proxy 切 IPVS / eBPF |
| 有状态服务声明式管理 | Operator（CRD + Controller）|
