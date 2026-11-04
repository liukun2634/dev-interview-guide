---
title: Kubernetes
---

# Kubernetes

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--advanced">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Kubernetes 是容器编排的事实标准。**学习顺序：先懂设计哲学（声明式 + 控制循环）→ 再逐个模块吃透（Pod / 工作负载 / Service / 网络 / 存储 / 调度 / 安全）→ 理解每个设计背后的"为什么"→ 最后落到部署实战、避坑和面试题。** 本页按这个顺序组织。
:::

本页结构：

1. [核心概念](#一、核心概念-是什么) —— K8s 是什么、设计哲学、整体架构
2. [核心模块详解](#二、核心模块详解) —— 逐个模块 + 每个设计的原因与内核
3. [部署实战](#三、部署实战) —— 无状态部署、配置、伸缩、滚动更新、优雅终止
4. [注意的问题](#四、注意的问题-常见陷阱) —— 生产常见坑
5. [面试常见问题](#五、面试常见问题) —— 高频题标准答法

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
| **API 资源状态持久化到 etcd** | etcd 用 Raft 维护一致性；应用数据、节点上的容器状态和外部云资源并不因此获得备份 |
| **组件间用 list-watch 而非轮询** | 控制器/kubelet 通过 watch **长连接增量接收**状态变更，实时且低开销；避免几千个组件疯狂轮询 API Server |
| **控制器通过 API 资源解耦** | 编排协作以资源状态为中心；API Server 到 kubelet 的日志/执行请求、kubelet 到运行时的 CRI 调用等仍是直接通信 |

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
> **编排链路由 API 资源变化驱动，控制器监听的是 API Server，而不是直连 etcd。** kubelet 仍要通过 CRI 调用运行时。`Running` 只描述 Pod 阶段，不等于应用已经 Ready，也不等于请求已经可以通过 Service 成功到达。

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
| **RBAC / PSS** | 权限 / Pod 安全 | [2.8](#_2-8-安全) |

## 1.5 控制循环深挖：事件会丢，为什么仍能收敛？

控制器不是把每个通知当作必须执行一次的业务命令，而是把通知当作“这个对象可能需要重新检查”的提示。典型链路是：

```text
API Server LIST/WATCH
  -> Informer 本地缓存
  -> Workqueue（通常按 namespace/name 排队、去重）
  -> Reconcile：读当前状态，计算差异，执行有限动作
  -> 成功后结束；暂时失败则限速重试
```

**为什么不直接在 watch 回调里创建资源？** 事件可能重复，连接可能中断，控制器可能在执行外部操作后崩溃；本地缓存也可能暂时落后于 API Server。必须基于当前状态做幂等调谐，而不是假定通知恰好送达一次。watch 的旧 `resourceVersion` 不再可用时，客户端需要重新 LIST 并恢复 WATCH。

| 字段/机制 | 解决的问题 | 不能推导出的保证 |
|-----------|------------|------------------|
| `metadata.resourceVersion` | 标识资源版本；更新时用于乐观并发控制，冲突后重新读取并计算 | 不是业务时间戳，也不能当作业务自增序列 |
| `metadata.generation` | 对 Deployment 等资源，期望配置变化会递增代数 | 不表示控制器已经完成发布 |
| `status.observedGeneration` | 支持该字段的控制器报告自己观察到的期望代数 | “已观察”不等于“全部副本可用”，还要看 Conditions 和副本数 |
| `ownerReferences` | 建立 Deployment、ReplicaSet、Pod 等从属关系，供垃圾回收使用 | 不负责回滚外部数据库、云服务中的副作用 |
| `finalizers` | 删除时先设置 `deletionTimestamp`，等待清理控制器完成职责后移除标记 | 控制器失效会让对象长期 Terminating；强行移除可能泄漏外部资源 |

**Operator 创建云资源的例子**：创建云盘成功后，写回 Kubernetes 状态失败。下一次调谐不能盲目再创建一块盘，应通过对象 UID 派生的幂等标识查询已有资源，再补写状态。删除则要考虑云 API 超时、资源已不存在、凭据失效，确保重试能够推进，而不是无限重复副作用。

### 控制平面故障与业务故障不是同一件事

| 故障 | 通常还能工作 | 受影响的能力与检查点 |
|------|--------------|----------------------|
| API Server 暂不可用 | 已运行容器与已下发的部分网络规则可能继续服务 | 新发布、调度及状态更新受阻；依赖实时 Kubernetes API 的应用可能直接失败 |
| Scheduler 不可用 | 已调度 Pod 不会因此停止 | 新 Pod 保持 Pending；检查调度器健康和 leader election |
| Controller Manager 不可用 | 现有进程通常继续运行 | 副本补齐、节点处理等调谐受阻，不能把“存量可用”当作“自愈可用” |
| etcd 失去多数派 | 现有数据平面可能继续运行 | 控制平面无法正常提交状态更新；恢复 quorum 或按流程恢复快照 |
| 工作节点失联 | 其他节点上的副本可能继续服务 | 检测、驱逐、重建、存储挂载都需要时间；失联节点上的旧进程未必已停止 |

**备份边界**：etcd 快照保存 Kubernetes API 状态，不包含 PVC 中的数据库数据，也不自动包含外部密钥和所有证书。恢复演练要同时验证 etcd 快照、解密所需密钥、应用备份、卷快照一致性及恢复后的网络依赖，实际测量 RPO/RTO。

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

Pod 内部启动过程（不含原生 Sidecar 的常规情况）:
  Init Container（串行，全部成功才继续）
    → Main Container 启动，PostStart Hook 可能与入口进程并发
      → 运行中（探针持续检测）
        → 进入终止宽限期 → PreStop Hook（可选）→ TERM → 到期后 KILL
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
| 启动/伸缩顺序 | 通常并行，不保证顺序 | 默认 `OrderedReady`；可用 `Parallel` 放宽扩缩容顺序，更新另由更新策略控制 |

### 为什么是 Deployment → ReplicaSet → Pod 三层？（设计内核）

> **关键答案：为了实现滚动更新和版本回滚。**

```
Deployment（管版本 + 更新策略）
    ├── ReplicaSet v1（旧版本 image:1.0）← 保留，用于回滚
    └── ReplicaSet v2（新版本 image:2.0）← 当前
            └── Pod、Pod、Pod

滚动更新: 按策略增加 v2、缩减 v1；是否无损取决于容量、就绪和摘流
回滚:     恢复旧 Pod 模板，扩容旧 ReplicaSet、缩减新 ReplicaSet
```

**职责分离**：ReplicaSet 只负责"维持 N 个副本"（副本控制）；Deployment 在其上管理"多版本 + 更新策略 + 回滚"（版本控制）。`revisionHistoryLimit` 保留的是历史 ReplicaSet 对象，不保证旧 Pod 或节点镜像缓存仍在。回滚仍可能经历调度、拉镜像、启动和就绪检查；也不会自动恢复数据库 schema 或外部配置。

## 2.3 配置管理（ConfigMap / Secret）

### 是什么

- **ConfigMap**：存非敏感配置（键值对或配置文件）
- **Secret**：存敏感数据（密码、证书、token）

两者都可通过**环境变量**或**文件挂载**注入 Pod。

### 设计内核：Secret 不是加密，只是 Base64

> Secret 数据仅 Base64 编码，任何有读权限的人都能 `base64 -d` 还原明文。生产必须：① 开 etcd 静态加密（EncryptionConfiguration）；② 用外部密钥系统（Vault / AWS Secrets Manager / External Secrets Operator）；③ RBAC 严格限制读取权限。

**环境变量 vs 文件挂载的关键区别**：普通投射卷中的 ConfigMap/Secret 更新会最终同步，但使用 `subPath` 挂载不会自动更新，应用也必须主动重新读取或监听文件变化。环境变量在容器启动后固定，需要替换 Pod 才能使用新值。不可变配置配合版本化名称或 Pod 模板中的配置摘要，可以把配置变化纳入可追踪的发布过程。

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
| **ExternalName** | DNS 返回外部名称的 CNAME | 外部服务别名，不提供代理或健康检查 |
| **Headless**（`clusterIP: None`） | 返回 Pod IP 列表 | StatefulSet 固定寻址 |

> Headless 是 `ClusterIP` Service 的一种配置，不是单独的 `spec.type`。生产 HTTP 服务常用 **ClusterIP + Ingress/Gateway** 组合；NodePort 也可以作为外部负载均衡的后端，并非只能用于测试。

### 服务发现 + Endpoints（内核）

在常用的 `cluster.local` 集群域下，CoreDNS 为 Service 提供 `<service>.<namespace>.svc.cluster.local` 记录。EndpointSlice 控制器维护后端地址及 `ready`、`serving`、`terminating` 条件，网络数据平面据此选择后端。普通 Service 通常不把新连接分配给未就绪 Pod，但 `publishNotReadyAddresses` 等配置会改变此行为；已有连接也不会因 readiness 失败自动迁移。新系统优先使用 EndpointSlice，旧 Endpoints API 已从 Kubernetes 1.33 起弃用。

### 容器网络模型与 CNI

**K8s 网络四大铁律**：① 每个 Pod 一个 IP，Pod 内容器共享网络命名空间；② 所有 Pod 不经 NAT 互通（跨节点也是）；③ 节点与 Pod 互通；④ Pod 自看 IP == 他看它的 IP。

> **关键**：Kubernetes 定义 Pod 网络模型，常见 Linux 容器运行时通过 CNI 接口调用网络插件完成地址分配、网络配置。CNI 是独立规范，不是由 Kubernetes 单独定义；NetworkPolicy 是否生效取决于网络实现。

| 网络实现 | 常见能力 | 选型时必须确认 |
|----------|----------|----------------|
| **Flannel** | VXLAN 等 Pod 连通方案 | 单独使用通常不执行 NetworkPolicy，需要其他策略组件 |
| **Calico** | 路由、Overlay、网络策略及可选 eBPF 数据平面 | 底层网络是否支持路由模式、MTU、策略与内核兼容性 |
| **Cilium** | eBPF 数据平面、网络策略、可观测性及可选 Service 代理替换 | 内核要求、替换 kube-proxy 的配置、升级与故障定位成本 |

### kube-proxy 与替代数据平面（内核 + 规模瓶颈）

| 实现 | 核心机制 | 评估重点 |
|------|----------|----------|
| kube-proxy **iptables** | 生成 netfilter 规则，配合 conntrack 转发 | 新连接匹配成本、规则同步耗时、Service/Endpoint 变化频率 |
| kube-proxy **nftables** | 使用 nftables 的集合和映射表达转发规则 | Kubernetes、内核和网络插件支持情况，以及 NodePort 等行为差异 |
| kube-proxy **IPVS** | IPVS 虚拟服务和连接调度，部分功能仍需其他规则 | 维护状态及 Service 语义兼容性，不能仅凭查表复杂度认定更优 |
| **eBPF Service 实现** | 由 Cilium 等网络组件实现，可替换 kube-proxy | 不是 kube-proxy 的一个模式；评估功能、可观测性与运维能力 |

> **ClusterIP 是服务虚拟地址，但实现不唯一**：iptables 模式通常不把它绑定到接口，IPVS 模式可能绑定到虚拟接口。Service 面向配置的传输层端口，`ping` 的 ICMP 结果不能判定 Service 是否正常；抓包能看到什么取决于抓取位置与数据平面。应通过目标协议和端口验证，不以固定 Service 数量作为换方案的唯一阈值。

### 一次集群内 HTTP 请求经过哪些层？

1. 客户端解析 Service 名称，普通 ClusterIP Service 返回虚拟 IP；Headless 通常返回后端地址，选择与重试更多由客户端承担。
2. 建立连接时，节点的数据平面选择后端，将流量送到 `targetPort`。EndpointSlice 和 API Server 不在每个请求的数据转发路径上。
3. 后端在其他节点时，由网络插件配置的路由或隧道完成跨节点传输。Overlay 需要考虑封装后的 MTU；大包失败而小包成功时应检查 PMTU。
4. TCP 连接建立后通常保持同一后端。HTTP keep-alive、HTTP/2 与 gRPC 的长连接可能造成负载倾斜，增加 Pod 不等于存量连接自动再平衡。
5. 外部流量还涉及云 LB、Ingress/Gateway、源地址转换与连接排空。`externalTrafficPolicy: Local` 可限制为节点本地后端，但要配合 LB 健康检查，考虑节点间流量不均。

**排查顺序**：域名解析 → Pod IP 与端口 → Service IP 与端口 → Ingress/Gateway。Pod IP 可达而 Service 不通，优先检查 selector、EndpointSlice、端口和数据平面规则；只有域名不通，优先检查 CoreDNS、DNS 出站策略和客户端 DNS 缓存。

### Ingress：七层入口

Service 提供 TCP/UDP/SCTP 等传输层服务抽象，**Ingress 提供 HTTP/HTTPS 路由规则**，必须配合具体 Ingress Controller 才生效。Gateway API 通过 GatewayClass、Gateway 和不同 Route 资源区分基础设施与应用职责；各 Route 类型的成熟度和控制器支持范围并不相同，不能把“Gateway API 核心资源 GA”理解成所有协议、功能都可用。

### NetworkPolicy：网络隔离

默认没有网络策略隔离时，Pod 间通常可以互通。NetworkPolicy 的隔离按 **Ingress/Egress 方向分别生效**：被某方向的策略选中后，该方向只允许匹配任一策略的流量，规则是并集，不存在“后写规则覆盖前面规则”。一次连接必须同时满足源端适用的 Egress 和目标端适用的 Ingress 规则。默认拒绝出站后要显式考虑 DNS 的 UDP/TCP 53、数据库与外部依赖；策略对象创建成功不代表 CNI 已支持并执行策略。

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

### 从 PVC 到挂载：调度和存储为什么会互相等待？

```text
PVC 申请容量与 StorageClass
  -> 动态制备/绑定 PV
  -> 为 Pod 选择满足卷拓扑的节点
  -> CSI 控制器 attach（如果驱动需要）
  -> 节点侧 stage/publish，容器获得挂载点
```

`volumeBindingMode: WaitForFirstConsumer` 会把制备/绑定延后到有 Pod 需要该卷、调度器能综合节点约束时，避免先把云盘建在可用区 A，Pod 却只能去 B。因此 PVC Pending 不一定是故障，要看是否仍在等待使用者，以及 StorageClass、CSI 和节点拓扑事件。

| 容易混淆的保证 | 实际边界 |
|----------------|----------|
| RWO 等于只能一个 Pod 写 | RWO 是单节点访问约束，同节点多个 Pod 可能共享；支持该能力的 CSI 卷可用 `ReadWriteOncePod` 限制为一个 Pod |
| StatefulSet 等于数据库高可用 | 它管理身份和 Pod/PVC，不实现数据库选主、复制一致性和数据修复 |
| 删除 Pod 等于删除数据 | PVC 通常独立保留；还要检查 StatefulSet PVC 保留策略、PV `reclaimPolicy` 和驱动行为 |
| `Retain` 等于备份 | 保留原卷不防误写、误删、勒索和可用区级故障；仍需独立备份及恢复演练 |
| 强删失联 Pod 能马上恢复单写 | API 对象消失不证明旧进程已停；有状态服务需要 fencing，避免旧实例继续写共享资源 |

**恢复时间要分段测量**：节点故障检测 + Pod 重建 + 卷 detach/attach + 数据库恢复/追日志 + readiness。仅看到新 Pod Running，不能宣称业务已经恢复。

## 2.6 自动伸缩

**HPA / VPA / CA 三者别混淆**：

| 伸缩器 | 对象 | 方向 | 适用 |
|-----------|---------|------|------|
| **HPA**（Horizontal） | Pod **数量** | 加减副本 | 无状态应对流量波动 |
| **VPA**（Vertical） | 单 Pod 的 requests/limits | 调规格 | 难水平扩展的有状态应用 |
| **CA**（Cluster Autoscaler） | **节点数量** | 加减 Node | Pod 因资源不足 Pending 时扩节点 |

> **典型组合**：HPA 扩 Pod → 节点不够 Pod Pending → CA 扩节点 → Pod 被调度。CPU/内存资源指标通常由 Metrics Server 提供；自定义/外部指标需要相应适配器。以资源利用率为目标时，必须设置对应的 `requests`，绝对值或外部指标不都依赖这一分母。HPA 和 VPA 不宜未经协调同时改变同一资源的利用率与 request。

### HPA 如何从指标算出副本数？

忽略缺失指标、容差和稳定窗口时，基本关系是：

$$
N_{desired} = \left\lceil N_{current} \times \frac{M_{current}}{M_{target}} \right\rceil
$$

例如 4 个 Pod，每个 CPU request 为 500m，平均用量为 400m，利用率是 80%；目标 50%，建议副本数为 `ceil(4 × 80 / 50) = 7`。这不是“CPU 使用达到 limit 的 80%”。若错误地把 request 降到 250m，同样的负载会显示 160%，扩容建议也随之改变。

实际控制器还要处理：

- **多个指标**：分别计算，采用较大的副本建议；指标获取失败时会保守处理，不能把缺失值直接当零缩容。
- **启动阶段**：未就绪 Pod、缺失采样和启动 CPU 峰值需要特殊处理，避免把预热误判成稳定负载。
- **稳定窗口与速率**：缩容窗口保留近期较高建议，伸缩策略限制单位时间变化量，减少反复扩缩。
- **扩容滞后**：采样、控制循环、节点创建、镜像下载和应用预热都耗时。秒级突发需要预留容量、预扩容和入口限流。
- **错误的扩容信号**：数据库锁等待导致 P99 上升时，增加应用副本可能制造更多 DB 连接；应结合并发、队列年龄和依赖饱和度判断。

HPA 接管后，GitOps 不应持续把 `spec.replicas` 强行改回固定值。迁移字段所有权时需按所用 apply 方式操作，避免直接删除字段触发一次意外缩容。

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

> 硬约束 `requiredDuringScheduling` 不满足会 Pending；软约束 `preferredDuringScheduling` 只是带权偏好。容忍污点表示“可以来”，不保证被调度到该节点。生产可结合反亲和与 `topologySpreadConstraints` 分散节点/可用区；硬性“一节点一个副本”也可能让滚动发布的额外副本无处可放。

### requests、limits、QoS 与驱逐：四层机制不能混为一谈

| 机制 | 作用时间 | 具体影响 |
|------|----------|----------|
| `requests` | 调度与资源竞争 | 按 Node Allocatable 和已请求资源判断能否放入，不是看 `kubectl top` 此刻是否空闲 |
| CPU limit | 容器运行时 | 常见 Linux 实现通过 CPU 配额节流；可能 CPU 总量不高但短时耗尽配额，导致 P99 上升 |
| memory limit | 容器运行时 | 触及 cgroup 内存约束可能触发 OOM；不是像 CPU 一样限速等待 |
| QoS 与节点压力驱逐 | 节点资源不足时 | 与是否超出 request、Pod Priority、资源用量有关，不能只按 QoS 名称断言固定驱逐顺序 |

按常见的容器级资源配置，**Guaranteed** 要求 Pod 中所有相关容器的 CPU、内存 request 和 limit 都设置且分别相等；不满足 Guaranteed、但有资源设置的是 **Burstable**；完全没有这些设置的是 **BestEffort**。Guaranteed 也不能防止容器超过自己的内存 limit。

**Java 服务例子**：容器 limit 为 1Gi，不应直接给 `-Xmx1g`。RSS 还包括 metaspace、线程栈、直接内存、JIT 和 native 分配；`emptyDir.medium: Memory` 的 tmpfs 也会消耗内存预算。先分解内存，再设堆上限，结合 working set、RSS、GC 和 OOM 事件验证。

**CPU limit 是否必须设置？** 多租户环境可能要求严格配额；对延迟敏感、隔离条件良好的服务，也可能保留合理 request 而不设过紧 CPU limit。依据平台策略和节流指标决策，不把“所有资源一律设相同 request/limit”当作万能模板。

### 三种探针（分工不同，不能混用）

| 探针 | 作用 | 失败后果 | 用途 |
|------|------|---------|------|
| **livenessProbe** | 是否**还活着** | **重启容器** | 检测死锁等无法自恢复状态 |
| **readinessProbe** | 是否**能接流量** | **从 Endpoints 摘除**（不重启） | 启动预热、依赖未就绪先不接流量 |
| **startupProbe** | 是否**启动完成** | 重启；**通过前禁用另两个** | 保护启动慢的应用（Java/大模型）|

::: warning ⚠️ liveness 和 readiness 别用同一个查外部依赖的端点

> 若两者都探包含 DB 检查的 `/health`，DB 抖动可能导致所有实例反复重启，进一步增加连接与恢复压力。liveness 应检查进程自身不可恢复的故障；readiness 判断能否提供所承诺的服务，而不是把所有下游都列为硬依赖。共享依赖故障时，若所有副本同时被摘除，反而失去返回缓存或降级响应的能力。

:::

### Pod 优雅终止（内核）

```
kubectl delete pod →
1. API 标记删除；kubelet 观察后启动本地终止流程与宽限期计时
2. 并发: EndpointSlice 标记终止/非就绪 + 执行 preStop Hook
3. preStop 执行完 → 发 SIGTERM 给主进程
4. 使用宽限期剩余时间完成请求、连接排空和进程退出
5. 仍未退 → SIGKILL 强杀
```

::: warning ⚠️ 优雅终止两大坑

> ① **502 错误**：EndpointSlice、代理、外部 LB 的状态传播是异步的，已有连接也可能继续送请求。preStop 的短暂等待只能缓解传播竞态，`sleep 5` 不是通用保证。需要测量摘流延迟，配合应用停止接新请求、处理存量请求及客户端安全重试。
> ② **PID 1 信号**：用 `sh -c "java ..."` 启动时 shell 是 PID 1，不转发 SIGTERM 给 Java → 优雅终止失效，30s 后被硬杀。解决：用 `exec java ...` 或加 `tini`。

:::

宽限期包含 preStop，不是在 hook 结束后再给完整 30 秒。预算应覆盖“摘流等待 + 最长允许在途请求 + 退出清理 + 余量”；WebSocket/gRPC 长流还需要最大连接寿命、重连和恢复协议。

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

Deployment 管 3 副本 + ClusterIP Service + 资源限制 + 健康探针。以下使用占位镜像；应用需提供对应健康端点。Spring Boot 应启用 Actuator 的 probes 分组，并确认端口与安全规则允许 kubelet 访问：

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
        startupProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          periodSeconds: 5
          timeoutSeconds: 2
          failureThreshold: 30
        livenessProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          periodSeconds: 10
          timeoutSeconds: 2
          failureThreshold: 3
        readinessProbe:
          httpGet: { path: /actuator/health/readiness, port: 8080 }
          periodSeconds: 5
          timeoutSeconds: 2
          failureThreshold: 2
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

> 上例是 Burstable，数值仅示意，不代表 Java 服务的生产推荐规格。startupProbe 约提供 `30 × 5 = 150` 秒的启动探测预算；readiness 成功还应意味着初始化和必要预热已完成。资源参数要由压测、启动峰值与故障冗余要求确定。

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
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target: { type: Utilization, averageUtilization: 50 }
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 20
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Pods
        value: 2
        periodSeconds: 30
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
      maxUnavailable: 0
  minReadySeconds: 10
  progressDeadlineSeconds: 600
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

> `maxUnavailable:0 + maxSurge:1` 优先保留旧副本，但需要额外调度容量，且不等于请求零失败。`minReadySeconds` 要求新副本持续 Ready 一段时间才算 Available；`progressDeadlineSeconds` 超时会报告发布未取得进展，不会自动回滚。百分比 `maxSurge` 向上取整、`maxUnavailable` 向下取整；正在终止的 Pod 还可能继续占资源。

> `Recreate` 会先停旧版本再启动新版本，有明确停机窗口。涉及数据库字段变更时，优先采用 expand-contract：先加兼容字段、部署兼容读写、回填与核对，再移除旧字段，保留应用回滚的可能性。

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
          command: ["sh", "-c", "sleep 5"]
```

这里的 5 秒只是示例，且镜像需要包含 `sh` 和 `sleep`。应用必须另外实现 SIGTERM 优雅关闭；若宽限期 60 秒，hook 用掉 5 秒后，业务退出预算就少了 5 秒。

## 场景 6：跨故障域部署与 PDB

在 Deployment 的 Pod 模板中加入以下片段，尝试将副本分散到不同可用区：

```yaml
spec:
  template:
    spec:
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: my-app
```

它依赖节点的可用区标签与可调度容量，不会凭空产生三个可用区；必须查看实际放置结果。只剩部分故障域时，硬约束可能阻止恢复副本，需要提前决定“严格分散”与“降级集中部署”的取舍。

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: my-app
```

对于 3 个 Ready 副本，这个 PDB 通常允许经 Eviction API 一次驱逐 1 个；如果已有 1 个不可用，再 drain 可能被阻塞。**PDB 不防节点宕机，不限制 Deployment 自身的滚动更新，也不拦截直接删除 Pod。** 故障会消耗预算，但不能被预算“阻止”。

发布前检查节点容量、PDB、拓扑约束、资源配额和 HPA 下限是否相容。若 `minAvailable` 等于当前全部副本，维护可能一直无法推进；正确处理是恢复健康或补容量，再按变更流程调整，不能习惯性绕过 PDB。

## 场景 7：一次发布的验收与回退清单

| 阶段 | 必须确认 | 失败时动作 |
|------|----------|------------|
| 发布前 | 镜像可拉取、配置版本、schema 兼容、surge 容量、回退版本 | 暂停发布，补齐前置条件 |
| 发布中 | 新副本 Ready/Available、5xx、P99、依赖错误、CPU 节流 | 停止放量；区分应用故障、容量不足和基础设施故障 |
| 发布后 | 业务成功率、队列年龄、旧版本连接排空、资源回落 | 在回退兼容窗口内恢复旧模板或执行预定修复 |
| 故障演练 | 单 Pod/单节点故障、依赖超时、镜像仓库不可用 | 测量恢复时间和错误预算消耗，不能只检查副本数 |

---

# 四、注意的问题（常见陷阱）

| 陷阱 | 现象 | 正确做法 |
|------|------|----------|
| 资源预算未经压测 | 调度超卖、CPU 节流或 OOM | 设置合理 requests、内存上限；CPU limit 按隔离要求和延迟指标决定 |
| liveness/readiness 同配置且查外部依赖 | DB 抖动时 liveness 也失败 → 反复重启雪崩 | liveness 只探进程自身，readiness 才查依赖；启动慢用 startupProbe |
| 以为 Secret 是加密的 | 仅 Base64，有读权限即可解码 | 开 etcd 静态加密 / 用 Vault / RBAC 限权 |
| 业务进程不是 PID 1 | SIGTERM 不被转发，优雅终止失效，30s 硬杀 | 用 `exec` 启动或加 tini |
| 环境变量注入配置后改 ConfigMap | 改了不生效 | 环境变量需重启 Pod；要热更新用文件挂载 |
| 混淆工作节点数与 etcd 成员数 | 误以为所有 K8s 节点都必须奇数 | etcd 常用 3/5 个投票成员；4 成员和 3 成员都只能容忍 1 个失败，工作节点不受此限制 |
| JVM 没识别容器内存 | 早期 JDK 看宿主机内存 → OOMKilled | `-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport`（JDK 10+）|
| 不测量就更换网络数据平面 | 规则同步、conntrack 或带宽问题被混淆 | 先定位瓶颈，再评估 nftables/eBPF 等方案的兼容性与收益 |
| 有状态应用用 Deployment | Pod 重建 IP 变、无固定身份、共享存储数据错乱 | 用 StatefulSet 或专用 Operator |

## Pod 故障 5 大模式速查

| 状态 | 本质 | 首要排查命令 |
|------|------|-------------|
| **Pending** | 调度失败（资源/亲和/污点/PVC）| `kubectl describe pod` 看 Events |
| **ImagePullBackOff** | 镜像拉不下来（名错/私有仓库/网络）| `kubectl describe pod` 看 Events |
| **CrashLoopBackOff** | 启动即退被反复重启 | `kubectl logs --previous` 看崩溃堆栈 |
| **OOMKilled** | 容器或节点内存压力触发终止 | `kubectl describe pod` 看 Last State，结合节点事件 |
| **Running 但不通** | 后端未就绪 / selector 或端口不匹配 / 网络策略 | `kubectl get endpointslices -l kubernetes.io/service-name=my-app-svc` |

::: tip 💡 排查口诀

> **先保留现场，再改配置**：看状态 → describe 事件 → logs --previous → 必要时进入调试环境。137 通常对应 `128 + SIGKILL(9)`，不一定是 OOM；143 通常对应 `128 + SIGTERM(15)`，不等于优雅终止超时。需要结合终止 reason、时间线、探针与节点日志判断。

:::

### 实战排障：应用 CPU 不高，为什么 P99 突然升高？

1. 用请求 trace 分离入口等待、业务执行、DB/Redis 调用和响应写回，先判断时间花在哪一层。
2. 查看容器 CPU throttling 与 request/limit。分钟平均 CPU 低，不能排除短时间配额耗尽；不要因此直接缩容。
3. 对比连接池等待、GC 暂停、节点 memory/disk pressure、DNS 延迟和 conntrack 使用量。
4. 按 Pod、节点、可用区、版本分组：只有新版本异常优先暂停发布；同节点多个服务异常优先查节点；所有副本访问同依赖都慢则查依赖。
5. 在单个金丝雀副本调整一个变量，观察 P99 与错误率，确认后再推广。

以下是只读起点，将 namespace 和 Pod 名替换为实际值；日志可能包含业务敏感信息，导出前需脱敏：

```bash
kubectl -n app get pods -l app=my-app -o wide
kubectl -n app describe pod my-app-pod
kubectl -n app logs my-app-pod -c my-app --previous --tail=100
kubectl -n app get events --sort-by=.metadata.creationTimestamp
kubectl -n app get endpointslices -l kubernetes.io/service-name=my-app-svc -o yaml
kubectl -n app describe hpa my-app-hpa
kubectl -n app get pdb
kubectl -n app top pod --containers
```

`kubectl top` 依赖资源指标服务，也不是历史监控。没有上一轮容器实例时 `logs --previous` 不适用；CrashLoopBackOff/Terminating 是展示状态，不是新的 Pod phase。

---

# 五、面试常见问题

**Q1：K8s 的声明式 API 和控制循环是什么？为什么这样设计？**

声明式 API 指用户只描述**期望状态**（如 `replicas: 3`），而非一步步操作。K8s 通过**控制循环**不断做三件事：观察实际 → 对比期望 → 消除差异，把实际状态持续收敛到期望。好处：① 幂等（反复 apply 结果一致）；② 自愈（Pod 挂了控制器发现"实际≠期望"自动重建）；③ 可版本化（YAML 进 Git = GitOps）。滚动更新、HPA、Operator 本质都是控制循环。

**Q2：K8s 核心组件有哪些？一次 `kubectl apply` 后发生了什么？**

控制平面：API Server、Scheduler、Controller Manager、etcd。数据平面：kubelet、Service 网络实现、容器运行时。apply 后通过 API 资源依次驱动 Deployment、ReplicaSet、调度与 kubelet 的调谐；kubelet 通过 CRI 启动容器并上报状态。控制器监听 API Server，不直接监听 etcd；Running 与 Ready/Available 要分别判断。

**Q3：为什么 Pod 是最小调度单位而不是容器？**

Pod 是一组"必须部署在一起、共享资源"的容器的原子单元。同 Pod 容器共享网络命名空间（同 IP、localhost 互访）和存储卷，作为整体调度伸缩重建。既保持"一容器一进程"单一职责，又支持主容器 + Sidecar 这类紧耦合、需生死与共的场景。

**Q4：Deployment 和 StatefulSet 的区别？为什么中间要夹 ReplicaSet？**

Deployment 管可替换的无状态副本；StatefulSet 提供稳定身份、卷关联及可配置的顺序语义，不替代数据库复制与选主。ReplicaSet 维持副本数，Deployment 协调不同版本；回滚恢复旧模板，仍需要创建并就绪相应 Pod，不保证秒级，也不自动回滚数据库。

**Q5：Service 有哪几种类型？为什么 ClusterIP ping 不通？**

`spec.type` 有 ClusterIP、NodePort、LoadBalancer、ExternalName；Headless 通过 `clusterIP: None` 配置。虚拟 IP 的实现随数据平面而异，Service 只定义配置的传输层协议和端口，所以应检查 TCP/UDP 等实际服务，而不是通过 ICMP 判断健康。

**Q6：liveness 和 readiness 探针的区别？启动慢的应用怎么配？**

liveness 检测是否还活着，失败重启容器（检测死锁）；readiness 检测是否能接流量，失败从 Endpoints 摘除但不重启（启动预热/依赖检查）。切忌两者用同一个查外部依赖的端点，否则依赖抖动引发重启雪崩。启动慢的应用用 startupProbe 保护启动阶段（大 failureThreshold×periodSeconds），通过前 liveness/readiness 都不生效。

**Q7：`kubectl delete pod` 后怎么保证零停机？**

不能仅靠 delete 命令保证零失败。需要冗余容量、就绪检测、异步摘流、应用连接排空和正确的信号处理。preStop 与退出处理共用终止宽限期，等待时长需实测；长连接需要重连和恢复协议。滚动发布由 Deployment 策略控制，维护驱逐还要结合 PDB。

**Q8：K8s 网络模型？CNI 是什么？大集群 kube-proxy 怎么选？**

Kubernetes 定义 Pod 网络模型，运行时通常通过 CNI 配置网络。选型要分开讨论 Pod 连通、NetworkPolicy 和 Service 转发：iptables、nftables、IPVS 属于 kube-proxy 的实现选项，Cilium 等可以用 eBPF 替代 Service 代理。依据内核兼容性、规则同步、连接规模和运维能力压测，不用固定服务数量或未经测量的性能排名做决定。

**Q9：怎么排查 Pod 起不来 / 反复重启？**

先用 describe 事件区分调度、拉镜像、卷挂载与启动失败，再结合上一轮日志、终止 reason、探针和节点压力定位。Exit 137 只能提示 SIGKILL，不能直接断定 OOM。Running 但不可达时检查 EndpointSlice 条件、selector、端口、网络策略，再沿 Pod IP、Service IP、DNS 分层测试。

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
| 发布出现 502 | 异步摘流、连接排空、就绪与终止时间预算 |
| Pod 间网络隔离 | NetworkPolicy（需 Calico/Cilium）|
| 大集群 Service 变慢 | 规则同步、conntrack、连接倾斜与数据平面选型 |
| 有状态服务声明式管理 | Operator（CRD + Controller）|

## 延伸阅读

- [Kubernetes：Pod 生命周期与终止](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Kubernetes：Service 与 EndpointSlice](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Kubernetes：HPA 算法与伸缩行为](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Kubernetes：中断与 PDB](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
- [高可用架构](../system-design/high-availability)：把副本、容量和故障域放回业务 SLO 中讨论。
