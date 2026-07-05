---
title: Kubernetes
---

# Kubernetes

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--advanced">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Kubernetes 是容器编排的事实标准，负责容器的部署、扩缩容和管理。面试重点：Master/Node 架构、Pod 生命周期、Service 类型、Deployment 滚动更新、探针配置。
:::

---

## 设计哲学：理解 K8s 的思维模型

在记忆一堆组件之前，先理解 K8s 的**两条设计主线**——几乎所有面试深挖题都能用它们解释。

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
      │                                  │
      │   1. Observe  观察实际状态         │  ← 从 API Server 读当前状态
      │        ↓                         │
      │   2. Diff     对比期望状态         │  ← Desired（etcd）vs Current
      │        ↓                         │
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

**几个关键设计决策（面试高频"为什么"）**：

| 设计 | 为什么这么设计 |
|------|--------------|
| **只有 API Server 能访问 etcd** | 收敛所有认证/授权/准入/校验逻辑到一处；其他组件无状态，可任意重启/多副本 |
| **所有状态存 etcd** | etcd 用 Raft 保证强一致，是集群唯一"事实来源"；组件全部宕机后从 etcd 恢复即可 |
| **组件间用 list-watch 而非轮询** | 控制器/kubelet 通过 watch **长连接增量接收**状态变更，实时且低开销；避免几千个组件疯狂轮询 API Server |
| **组件彼此不直接通信** | 全部通过 API Server 中转（"状态驱动"），组件解耦、可独立演进、易扩展 |

::: tip 💡 面试黄金回答（一句话讲透 K8s 设计）

> **"K8s 的本质是一个声明式的状态机：用户把期望状态写进 etcd，一群控制器通过 list-watch 监听变化，各自跑 reconcile loop 不断把实际状态拉向期望状态。所有读写都经过 API Server，etcd 是唯一事实来源。理解了'声明式 + 控制循环'，滚动更新、自愈、HPA、Operator 就都是同一个模式的不同实现。"**

:::

---

## 核心概念

### K8s 整体架构

```
┌─────────────────── Master ───────────────────┐
│  API Server    Scheduler    Controller Mgr   │
│                   etcd                        │
└──────────────────────────────────────────────┘
         │              │              │
┌─── Node 1 ───┐ ┌─── Node 2 ───┐ ┌─── Node 3 ───┐
│ kubelet       │ │ kubelet       │ │ kubelet       │
│ kube-proxy    │ │ kube-proxy    │ │ kube-proxy    │
│ ┌───┐ ┌───┐  │ │ ┌───┐ ┌───┐  │ │ ┌───┐        │
│ │Pod│ │Pod│  │ │ │Pod│ │Pod│  │ │ │Pod│        │
│ └───┘ └───┘  │ │ └───┘ └───┘  │ │ └───┘        │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Master 组件

| 组件 | 职责 |
|------|------|
| **API Server** | 集群的统一入口，所有操作均通过 REST API 暴露；负责认证、授权与准入控制 |
| **Scheduler** | 监听未调度的 Pod，根据资源需求、亲和性等策略将 Pod 分配到合适的 Node |
| **Controller Manager** | 运行各类控制器（Deployment、ReplicaSet、Node 等），持续将集群状态收敛到期望状态 |
| **etcd** | 分布式键值存储，保存集群所有配置与状态数据；是集群的唯一数据来源 |

### Node 组件

| 组件 | 职责 |
|------|------|
| **kubelet** | 运行在每个 Node 上，负责接收 PodSpec 并确保容器按期望状态运行 |
| **kube-proxy** | 维护节点上的网络规则（iptables/IPVS），实现 Service 的流量转发 |
| **容器运行时** | 实际负责拉取镜像、创建和运行容器（如 containerd、CRI-O） |

### 核心资源对象

| 资源对象 | 作用 | 与其他对象的关系 |
|----------|------|-----------------|
| **Pod** | K8s 最小调度单元，封装一个或多个容器 | 由 ReplicaSet 管理生命周期 |
| **ReplicaSet** | 保证指定数量的 Pod 副本始终运行 | 由 Deployment 管理，不直接使用 |
| **Deployment** | 声明式管理 Pod 副本，支持滚动更新与回滚 | 管理 ReplicaSet，进而管理 Pod |
| **Service** | 为一组 Pod 提供稳定的访问入口（ClusterIP/DNS） | 通过 Label Selector 关联 Pod |
| **ConfigMap** | 存储非敏感配置数据（键值对或配置文件） | 挂载到 Pod 作为环境变量或文件 |
| **Secret** | 存储敏感数据（Base64 编码，可配合加密） | 与 ConfigMap 类似，用于密码/证书 |
| **Ingress** | 管理集群外部 HTTP/HTTPS 路由规则 | 依赖 Ingress Controller 实现转发 |
| **HPA** | 根据 CPU/内存等指标自动水平扩缩 Pod 数量 | 作用于 Deployment / ReplicaSet |

### 为什么 Pod 是最小单位，而不是容器？

**面试高频**：为什么 K8s 不直接调度容器，而要用 Pod 包一层？

> **Pod = 一组"必须部署在一起、共享资源"的容器的原子单元。**

| 设计原因 | 说明 |
|---------|------|
| **共享网络** | 同一 Pod 内所有容器共享一个网络命名空间（同一 IP、同一端口空间），可通过 `localhost` 互访——适合主容器 + Sidecar（如日志采集、Envoy 代理）紧耦合场景 |
| **共享存储** | 同 Pod 容器可挂载同一个 Volume，方便数据共享（如主容器写日志、Sidecar 读日志上报）|
| **共同生命周期** | 需要"生死与共"的进程（主进程 + 辅助进程）作为一个整体调度、伸缩、重建，避免调度到不同节点导致无法通信 |
| **保持容器单一职责** | 一个容器只跑一个进程（Docker 最佳实践），需要多进程协作时用多容器 Pod 而非"胖容器" |

**Sidecar 模式**是 Pod 多容器设计的最典型应用：主容器专注业务，Sidecar 处理横切关注点（服务网格代理、日志、监控），二者共享网络与存储、同生共死。

### 为什么需要 Service？—— Pod 是"牲畜"不是"宠物"

**Pod 是临时的（Ephemeral）**：滚动更新、扩缩容、故障重建都会让 Pod 被销毁重建，**IP 每次都变**。如果客户端直接记 Pod IP，Pod 一重建就找不到了。

```
没有 Service:
  客户端 → 记住 Pod IP 10.1.1.5 → Pod 重建 → 新 IP 10.1.1.9 → 客户端找不到 ❌

有 Service:
  客户端 → 访问 Service（稳定 ClusterIP / DNS 名）
              ↓  Service 通过 Label Selector 动态跟踪后端 Pod
        自动负载均衡到当前存活的 Pod ✅
```

> **Service 的本质**：给一组"随时会变"的 Pod 提供一个**稳定的虚拟入口（ClusterIP + DNS 名 + 负载均衡）**。它靠 **Label Selector** 动态维护后端 Pod 列表（Endpoints），Pod 增删时自动更新，客户端无感知。这正是"把 Pod 当牲畜而非宠物"（Cattle not Pets）云原生理念的体现。

### 工作负载类型：不同场景用不同 Controller

Pod 通常不直接创建，而是交给上层 **Workload Controller** 管理。选哪个取决于应用特性：

| Controller | 适用场景 | 核心特性 | 典型例子 |
|-----------|---------|---------|---------|
| **Deployment** | **无状态**应用 | Pod 完全对等、可随意替换、随机命名、支持滚动更新/回滚 | Web 服务、API 网关 |
| **StatefulSet** | **有状态**应用 | Pod 有**稳定网络标识**（`app-0`/`app-1`）+ **独立持久存储** + **有序**启动/伸缩 | MySQL、Kafka、ZooKeeper、Redis 集群 |
| **DaemonSet** | **每节点一个** | 保证每个（或指定）Node 各跑一个 Pod，节点加入自动补 | 日志采集(Fluentd)、监控(node-exporter)、CNI |
| **Job** | **一次性任务** | 跑完即退出，保证成功完成指定次数 | 数据迁移、批处理 |
| **CronJob** | **定时任务** | 按 cron 表达式周期创建 Job | 定时备份、报表生成 |

**Deployment vs StatefulSet 是高频对比题**：

| 维度 | Deployment | StatefulSet |
|------|-----------|-------------|
| Pod 身份 | 无身份，随机后缀（`app-7d4f-xk2p`）| 稳定有序（`app-0`、`app-1`）|
| 网络标识 | IP 随机变化 | 固定 DNS（`app-0.svc...`），配合 Headless Service |
| 存储 | 共享或无持久存储 | 每个 Pod 独占 PVC，重建后仍绑定原数据 |
| 启动/伸缩顺序 | 并行、无序 | 严格有序（0→1→2，缩容 2→1→0）|
| 适用 | 无状态 | 有状态（数据库、消息队列）|

### 为什么是 Deployment → ReplicaSet → Pod 三层？

**面试常问**：为什么不 Deployment 直接管 Pod，中间要夹一层 ReplicaSet？

> **关键答案：为了实现滚动更新和版本回滚。**

```
Deployment（管版本 + 更新策略）
    ├── ReplicaSet v1（旧版本，image:1.0）  ← 保留，用于回滚
    └── ReplicaSet v2（新版本，image:2.0）  ← 当前
            └── Pod、Pod、Pod

滚动更新过程:
  逐步 v2 ReplicaSet +1 Pod、v1 ReplicaSet -1 Pod
  → 平滑切换、零停机
回滚过程:
  把流量切回 v1 ReplicaSet（它一直保留着）→ 秒级回滚
```

**各层职责分离**：
- **ReplicaSet**：只负责"维持 N 个副本"这一件事（副本控制）
- **Deployment**：在 ReplicaSet 之上管理"多个版本 + 更新策略 + 回滚"（版本控制）

每次改镜像/配置，Deployment 就新建一个 ReplicaSet 并逐步扩容，同时缩容旧的——**旧 ReplicaSet 保留下来（由 `revisionHistoryLimit` 控制数量）**，回滚时直接切回，无需重新拉镜像。这就是职责单一原则在 K8s 资源设计上的体现。

### Pod 生命周期

```
Pending → Running → Succeeded
                 ↘ Failed
```

Pod 内部启动顺序：

```
Init Container（串行执行）
      ↓ 全部成功后
Main Container 启动
      ↓
PostStart Hook（可选）
      ↓ 运行中（探针持续检测）
PreStop Hook（可选）→ 容器终止
```

- **Pending**：Pod 已被接受，但容器尚未全部创建（镜像拉取中、调度中）
- **Running**：至少一个容器正在运行
- **Succeeded**：所有容器正常退出（exit 0），不会重启
- **Failed**：所有容器已退出，至少一个非正常退出

---

## 典型场景与最佳实践

### 场景 1：无状态应用部署

使用 Deployment 管理 3 个副本，通过 ClusterIP Service 暴露内部访问，并配置资源限制与健康探针：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: my-app-svc
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

### 场景 2：配置管理

使用 ConfigMap 存储应用配置，Secret 存储敏感信息，分别通过环境变量和文件挂载两种方式注入 Pod：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
  application.yaml: |
    server:
      port: 8080
    logging:
      level: info
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
data:
  DB_PASSWORD: cGFzc3dvcmQxMjM=   # base64 编码
  API_KEY: c2VjcmV0a2V5MTIz
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:1.0.0
        # 方式一：环境变量注入
        env:
        - name: APP_ENV
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: APP_ENV
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: DB_PASSWORD
        # 方式二：文件挂载
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
      volumes:
      - name: config-volume
        configMap:
          name: app-config
          items:
          - key: application.yaml
            path: application.yaml
```

### 场景 3：弹性伸缩（HPA）

根据 CPU 使用率自动扩缩容，保持 CPU 利用率在 50% 左右，副本数在 2 到 10 之间：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
```

> **注意：** HPA 依赖 Metrics Server，需要提前在集群中安装。Pod 必须设置 `resources.requests`，否则 HPA 无法计算利用率。

### 场景 4：滚动更新与回滚

配置 RollingUpdate 策略，控制更新过程中的可用性，并在出问题时快速回滚：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # 更新期间最多多出 1 个 Pod（超出 replicas）
      maxUnavailable: 0    # 更新期间最多 0 个 Pod 不可用（保证零停机）
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:2.0.0   # 更新镜像版本触发滚动更新
```

常用运维命令：

```yaml
# 以下为 kubectl 命令说明（非 YAML）
# 查看滚动更新状态
# kubectl rollout status deployment/my-app

# 查看更新历史（需在 Deployment 中设置 revisionHistoryLimit）
# kubectl rollout history deployment/my-app

# 回滚到上一版本
# kubectl rollout undo deployment/my-app

# 回滚到指定版本
# kubectl rollout undo deployment/my-app --to-revision=2
```

### 场景 5：Pod 调度与亲和性

**Pod 调度**是 2025-2026 年 K8s 面试**深度题**，能讲清楚 nodeSelector / Affinity / Taints / Topology 四个概念的层次关系，是一线大厂 SRE/平台岗位的硬通货。

#### 调度机制总览

```
新 Pod 创建
    ↓
kube-scheduler 调度阶段:
  ┌───────────────────────┐
  │  Filter（过滤）         │  → 找出"能放"的节点（资源够 / 端口不冲突 / nodeSelector 匹配）
  └───────────────────────┘
              ↓
  ┌───────────────────────┐
  │  Score（打分）         │  → 给每个节点打分（亲和性 / 资源平衡 / 镜像本地化）
  └───────────────────────┘
              ↓
  ┌───────────────────────┐
  │  Bind（绑定）          │  → 选分数最高的节点
  └───────────────────────┘
```

#### 四种调度控制对比

| 机制 | 用途 | 谁主动 | 一句话理解 |
|------|-----|-------|-----------|
| **nodeSelector** | 简单标签匹配 | Pod 选节点 | "我只去打了 X 标签的节点" |
| **Node Affinity** | 复杂表达式 + 软/硬约束 | Pod 选节点 | "尽量去 SSD 节点，没有也凑合" |
| **Pod Affinity / AntiAffinity** | Pod 之间关系 | Pod 选 Pod | "和 Redis 部署到同节点 / 和自己副本分散到不同节点" |
| **Taints + Tolerations** | 节点驱逐 Pod | 节点选 Pod | "我这节点有污点，只有能容忍的 Pod 才能来" |

#### 实战配置

```yaml
spec:
  # 硬约束：必须满足
  nodeSelector:
    disktype: ssd

  affinity:
    # 软约束：优先 GPU 节点，没有也行
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          preference:
            matchExpressions:
              - key: gpu-type
                operator: In
                values: [a100]

    # Pod 反亲和：自己的副本要分散到不同节点（高可用）
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: my-app
          topologyKey: kubernetes.io/hostname    # 按主机名分散
        # topologyKey: topology.kubernetes.io/zone   # 按可用区分散

  # 容忍节点污点（专用节点）
  tolerations:
    - key: dedicated
      operator: Equal
      value: gpu
      effect: NoSchedule
```

::: tip 💡 生产高可用必备配置

> **任何重要应用的 Pod 都要加 `podAntiAffinity + topologyKey: kubernetes.io/hostname`**——保证多副本不会被调度到同一节点，节点宕机时不会全挂。

:::

### 场景 6：startupProbe + Pod 优雅终止

#### startupProbe 解决"启动慢"应用

Java 应用、大模型推理服务等**启动慢**（30 秒以上）。如果只用 livenessProbe：

```
错误配置:
  livenessProbe: initialDelaySeconds=10, periodSeconds=10
  ↓
  10 秒后开始探活，但 Spring Boot 还在初始化 → 失败
  ↓
  连续失败 → kubelet 重启 Pod → 死循环
```

**正确做法**：用 `startupProbe` 接管启动阶段，**它通过后** liveness/readiness 才开始：

```yaml
startupProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 30      # 最多重试 30 次
  periodSeconds: 10         # 每 10 秒一次 → 总共 5 分钟启动窗口
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  periodSeconds: 10         # startupProbe 通过后才开始
```

#### Pod 优雅终止流程

**面试加分点**：能讲清"`kubectl delete pod` 后到底发生了什么"。

```
1. Pod 状态变为 Terminating
2. **同时并发**:
   ├─ 从 Service Endpoints 移除（不再接受新流量）
   └─ 触发 preStop Hook（如果有）
3. preStop 执行完后，发 SIGTERM 给容器主进程
4. 等待 terminationGracePeriodSeconds（默认 30s）
5. 仍未退出 → 强制 SIGKILL
```

::: warning ⚠️ 优雅终止的常见坑

**问题**：Service 移除 Endpoints 是**异步**的，可能 Pod 已发 SIGTERM 但 kube-proxy 还在转发流量 → 502 错误。

**解决**：preStop 中 `sleep 5`，等 Endpoints 同步完再开始关闭：

```yaml
lifecycle:
  preStop:
    exec:
      command: ["sh", "-c", "sleep 5"]
terminationGracePeriodSeconds: 60
```

:::

### 场景 7：Operator 模式

**Operator** 是 K8s **最重要的扩展模式**，把"运维知识"编码成 Kubernetes 控制器，让有状态服务（DB / MQ / 监控）也能像无状态应用一样**声明式管理**。

#### CRD + Controller = Operator

```
传统部署 MySQL 主从:
  → 手动 helm install + 配 backup CronJob + 配主从切换脚本 + ...
  → 几百行 yaml + 一份运维手册

Operator 部署:
  apiVersion: mysql.example.com/v1
  kind: MySQLCluster
  metadata:
    name: my-db
  spec:
    replicas: 3              # 主 + 2 个从
    storageSize: 100Gi
    backup:
      schedule: "0 2 * * *"
      retention: 7
  → Operator Controller 自动:
    ① 创建 StatefulSet
    ② 配置主从复制
    ③ 创建定时备份
    ④ 主挂了自动 failover
    ⑤ 升级时滚动 + 数据迁移
```

#### Operator vs Helm

| 维度 | Helm | **Operator** |
|------|------|-----------|
| **定位** | 模板渲染 + 一次性部署 | **持续协调**（reconcile loop）|
| **生命周期管理** | 部署/升级/卸载 | **+ 备份 / 故障恢复 / 扩容 / 版本升级** |
| **Day 2 运维** | 无 | **核心价值** |
| **适合** | 无状态应用 | **有状态服务**（DB / MQ / 监控）|

#### 主流 Operator 生态

| 服务 | 知名 Operator |
|------|--------------|
| **数据库** | MySQL Operator、Postgres Operator (Zalando)、TiDB Operator |
| **MQ** | Strimzi (Kafka)、RabbitMQ Cluster Operator |
| **缓存** | Redis Operator (OT)、Spotahome Redis Operator |
| **监控** | Prometheus Operator |
| **CI/CD** | ArgoCD、Tekton |
| **AI 推理** | KServe、KubeRay |

::: tip 💡 面试黄金回答

> **"Operator 把'运维专家的知识'编码进 Kubernetes Controller——通过自定义资源 CRD 让用户声明式描述'我要什么'，Operator 用 reconcile loop 持续把现实拉到期望状态。它和 Helm 的本质区别是 Helm 只管一次性部署，Operator 还管 Day 2 运维（备份、failover、扩缩容）。Prometheus、TiDB、Kafka 这些复杂服务在 K8s 上的事实标准都是用 Operator 部署。"**

:::

### 场景 8：容器网络与 CNI

**K8s 网络模型是高级运维/SRE 面试的硬通货**，能讲清 CNI、Service 流量路径、CNI 插件选型，立刻显出深度。

#### K8s 网络模型四大铁律

```
1. 每个 Pod 一个 IP，Pod 内所有容器共享网络命名空间（共用 localhost）
2. 所有 Pod 不经 NAT 即可互通（跨节点也是）
3. 节点不经 NAT 可与 Pod 互通
4. Pod 看到的自己的 IP == 其他 Pod 看它的 IP
```

**关键含义**：K8s **不实现网络**，只**定义规范**——具体网络由 CNI 插件实现。

#### 主流 CNI 插件对比

| 插件 | 模式 | 性能 | 网络策略 | 适用 |
|------|------|------|---------|------|
| **Flannel** | **Overlay**（VXLAN）| 中（有封装开销）| ❌ 简单不支持 NetworkPolicy | 入门、测试集群 |
| **Calico** | **BGP**（无封装）/ IPIP | **高**（接近裸网络）| ✅ 强（NetworkPolicy + Felix）| **生产首选**、强网络隔离 |
| **Cilium** | **eBPF + BGP** | **最高**（绕开 iptables/conntrack）| ✅✅ 极强（L3-L7 策略 + Hubble 观测）| **现代云原生首选**（GKE/AKS 默认）|
| **Weave** | Overlay | 中 | ✅ | 小规模、简单部署 |
| **AWS VPC CNI** | VPC ENI 直挂 | **极高**（用 VPC 原生）| Calico for policy | AWS EKS |

#### 三种网络模式深度对比

```
1. Overlay 模式（VXLAN/IPIP）:
   Pod A 包 → 节点封装一层 UDP/VXLAN → 跨节点 → 解封装 → Pod B
   优势: 不依赖底层网络配置，配置简单
   劣势: +5-15% CPU + 包大小膨胀

2. BGP 模式（Calico 推荐）:
   Pod A 包 → 节点路由表（BGP 学到 Pod B 所在节点）→ 直接发 → Pod B
   优势: 无封装开销、性能接近裸网络
   劣势: 需要交换机/路由器支持 BGP

3. eBPF 模式（Cilium）:
   绕过 iptables/conntrack → 直接 eBPF 程序在 socket 层路由
   优势: 性能最高、可见性最好、支持 L7 策略
   劣势: 需要较新内核（5.10+）
```

#### Service 流量路径（必背）

```
ClusterIP Service 流量:
  Pod A → Service ClusterIP
            ↓
  kube-proxy 写入的 iptables / IPVS 规则
            ↓
  DNAT 到某个 Pod IP（按 sessionAffinity 选择）
            ↓
  CNI 网络层把包送到目标 Pod 所在节点
            ↓
  Pod B 接收

NodePort Service 流量:
  外部客户端 → 任意节点:NodePort
                  ↓
  kube-proxy iptables DNAT
                  ↓
  转发到任意节点的 Pod B（可能不在本节点）→ 跨节点跳转

LoadBalancer Service 流量:
  外部 → 云厂商 LB（如 AWS ELB / 阿里 SLB）
              ↓
  → 任意节点:NodePort → 后续同 NodePort
```

#### kube-proxy 三种模式

| 模式 | 数据结构 | 大规模性能 | 状态 |
|------|--------|-----------|------|
| **userspace**（已淘汰）| 用户态代理 | 极差 | 不再使用 |
| **iptables**（默认）| iptables 规则 | 大集群下规则增多，**O(N) 匹配** | 通用 |
| **IPVS** | LVS 内核哈希表 | **O(1) 匹配**，支持 RR/LC 等算法 | **大规模集群推荐** |
| **eBPF**（Cilium） | eBPF Map | 最高 | 云原生新趋势 |

::: warning ⚠️ iptables 模式的瓶颈

> 当集群 Service 数 > 5000 / Pod 数 > 1 万时，**每个节点的 iptables 规则会膨胀到几十万条**，包匹配延迟显著上升，且更新规则会阻塞数秒。**生产集群必须切换 IPVS 或 Cilium**。

:::

#### NetworkPolicy 隔离策略

```yaml
# 只允许 frontend pod 访问 backend pod 的 8080 端口
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: backend-allow-frontend, namespace: prod }
spec:
  podSelector: { matchLabels: { app: backend } }
  policyTypes: [Ingress]
  ingress:
    - from: [{ podSelector: { matchLabels: { app: frontend }}}]
      ports: [{ port: 8080, protocol: TCP }]
```

::: tip 💡 面试黄金回答

> **"K8s 不实现网络，只定义 CNI 规范——所有 Pod 互通、Pod 不经 NAT、Pod IP 一致是四大铁律。主流 CNI 三种模式：Flannel Overlay（简单但性能损失 10%）、Calico BGP（生产标配、接近裸性能）、Cilium eBPF（最现代、绕开 iptables、支持 L7 策略）。**
>
> **大集群必看 kube-proxy 模式：默认 iptables 在 5000+ Service 后会因为 O(N) 匹配变慢，必须切 IPVS 或 Cilium。NetworkPolicy 实现 Pod 间网络隔离，是云原生安全的底线。"**

:::

---

## Pod 安全标准（PSS）—— PodSecurityPolicy 的继任者

**2026 必知**：PodSecurityPolicy（PSP）已于 **Kubernetes 1.25（2022.08）完全移除**，以 **Pod Security Standards （PSS）+ Pod Security Admission 控制器** 取代。面试谈到 K8s 安全这是高频追问点。

### PSP 为什么被移除

| 问题 | 说明 |
|------|------|
| 授权复杂 | RBAC + PSP 双重授权，配错使用者很多 |
| 默认 允许 | 需手动绑定，忘记绑定等于无限制 |
| 不能 dry-run / audit | 只能强推，无法如今推行安全治理 |

### Pod Security Standards 三级别

| Profile | 限制程度 | 适用场景 |
|---------|---------|---------|
| **privileged** | 完全不限制 | 系统组件（如 kube-proxy、CNI） |
| **baseline** | 防御已知提权（禁 hostNetwork / hostPID / privileged）| 应用 Pod 默认底线 |
| **restricted** | 严格、遵循安全最佳实践（必须 runAsNonRoot、readOnlyRootFilesystem、限制 capabilities）| 生产应用 |

### 用法：Namespace 标签控制

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-app
  labels:
    # 强制：不符合 restricted 的 Pod 直接拒绝创建
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    # 审计：记录不符合 baseline 的 Pod，不拦截
    pod-security.kubernetes.io/audit: baseline
    # 警告：kubectl apply 时提示，不拦截
    pod-security.kubernetes.io/warn: baseline
```

### 符合 restricted 的 Pod 最小示例

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
spec:
  securityContext:
    runAsNonRoot: true               # ✅ PSS restricted 必需
    runAsUser: 1000
    seccompProfile:
      type: RuntimeDefault           # ✅ 必需
  containers:
    - name: app
      image: myapp:1.0
      securityContext:
        allowPrivilegeEscalation: false   # ✅ 必需
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]                   # ✅ 必需
```

::: tip 💡 生产黑金组合

> **三层防护**：① Namespace 加 PSS `enforce: baseline`（全局默认）→ ② 关键应用 Namespace 提升为 `enforce: restricted` → ③ 超外需求用 **OPA Gatekeeper / Kyverno** 做自定义策略（PSS 仅覆盖常见场景）。
>
> **迁移路径**：从K8s 1.22 开始，PSP 和 PSS 可以并存 → 1.23 PSS 进入 Beta 默认启用 → 1.25 PSP 完全移除。

:::

### kubectl 排查命令

```bash
# 查看 Namespace 的 PSS 策略
kubectl get ns my-app -o yaml | grep pod-security

# 验证 Pod 是否符合 restricted（dry-run）
kubectl apply --dry-run=server -f pod.yaml

# 查看拒绝原因
kubectl describe rs my-app-xxxx | grep -i "violates PodSecurity"
```

---

## 面试常问 & 怎么答

**Q1：描述 Pod 的完整生命周期？**

Pod 经历 Pending（调度中/拉取镜像）→ Running（容器运行中）→ Succeeded 或 Failed 几个阶段。Pod 内部先串行执行所有 Init Container，全部成功后主容器才启动。主容器启动后可执行 PostStart Hook，终止前执行 PreStop Hook。kubelet 持续通过 livenessProbe 检测容器健康，失败则重启；通过 readinessProbe 决定是否将 Pod 加入 Service 的 Endpoints。

**Q2：Service 的三种类型分别是什么，适用场景？**

| 类型 | 访问范围 | 适用场景 |
|------|----------|----------|
| **ClusterIP**（默认） | 仅集群内部 | 微服务间内部调用 |
| **NodePort** | 集群外，通过节点 IP + 端口 | 测试环境临时对外暴露 |
| **LoadBalancer** | 集群外，通过云厂商负载均衡器 | 生产环境对外暴露服务 |

生产环境通常使用 ClusterIP + Ingress 的组合，由 Ingress Controller（如 Nginx）统一处理外部 HTTP 流量。

**Q3：liveness 探针和 readiness 探针的区别？**

- **livenessProbe（存活探针）**：检测容器是否还活着。失败时 kubelet 会重启容器。用于检测死锁、内存泄漏等无法自恢复的状态。
- **readinessProbe（就绪探针）**：检测容器是否准备好接收流量。失败时将 Pod 从 Service Endpoints 中移除，但不重启容器。用于启动预热、依赖服务检查。

两者的关键区别：liveness 失败 → 重启容器；readiness 失败 → 摘流量不重启。

**Q4：K8s 如何实现服务发现？**

K8s 提供两种服务发现机制：

1. **DNS（推荐）**：CoreDNS 为每个 Service 自动创建 DNS 记录，格式为 `<service-name>.<namespace>.svc.cluster.local`。Pod 直接通过服务名访问，无需关心 IP。
2. **环境变量**：kubelet 在 Pod 启动时注入同 Namespace 下所有 Service 的 IP 和端口环境变量（有顺序依赖，不推荐）。

流量路由由 kube-proxy 维护的 iptables/IPVS 规则实现，将访问 ClusterIP 的流量转发到后端 Pod。

**Q5：K8s 的声明式 API 和控制循环是什么？为什么这样设计？**

声明式 API 指用户只描述**期望状态**（如 `replicas: 3`），而非一步步的操作命令。K8s 通过**控制循环（Reconcile Loop）**不断做三件事：观察实际状态 → 对比期望状态 → 执行动作消除差异，从而把实际状态持续收敛到期望状态。这样设计的好处是：① 幂等（同一 YAML 反复 apply 结果一致）；② 自愈（Pod 挂了控制器发现"实际≠期望"自动重建）；③ 可版本化（YAML 进 Git 就是 GitOps）。Deployment 滚动更新、HPA、Operator 本质都是控制循环的不同实现。

**Q6：为什么 Pod 是最小调度单位而不是容器？**

Pod 是一组"必须部署在一起、共享资源"的容器的原子单元。同一 Pod 内容器共享网络命名空间（同一 IP，可 localhost 互访）和存储卷，并作为整体调度、伸缩、重建。这样既保持了"一个容器一个进程"的单一职责原则，又支持主容器 + Sidecar（如日志采集、服务网格代理）这类紧耦合、需生死与共的场景。

**Q7：Deployment 和 StatefulSet 的区别？分别用在什么场景？**

Deployment 管理**无状态**应用，Pod 完全对等、随机命名、IP 随机变化、可随意替换，适合 Web/API 服务。StatefulSet 管理**有状态**应用，Pod 有稳定的网络标识（`app-0`、`app-1`）、独占的持久存储（PVC 重建后仍绑定原数据）、严格有序的启动和伸缩，适合 MySQL、Kafka、ZooKeeper 等。判断标准：应用是否依赖固定身份或独立数据——是就用 StatefulSet，否则 Deployment。

**Q8：为什么 Deployment 和 Pod 之间要夹一层 ReplicaSet？**

为了实现**滚动更新和版本回滚**。ReplicaSet 只负责"维持 N 个副本"（副本控制），Deployment 在其上管理"多版本 + 更新策略 + 回滚"（版本控制）。每次更新，Deployment 新建一个 ReplicaSet 并逐步扩容、同时缩容旧的实现平滑切换；旧 ReplicaSet 会保留下来，回滚时直接把流量切回，无需重新拉镜像，实现秒级回滚。这是职责单一原则在资源设计上的体现。

---

## Pod 故障 5 大模式排查（生产必备）

**K8s 运维面试 Top 1 题**："Pod 起不来 / 反复重启，怎么排查？"——能讲清 5 大故障模式 + 标准排查命令，立刻显出生产经验。

### 故障 1：Pod 一直 Pending

```
状态: 0/1 Pending
原因: 调度失败 / 资源不足 / 节点亲和不匹配
```

**排查命令套路**：

```bash
# 1. 看事件
kubectl describe pod <name> | grep -A 30 Events

# 典型事件:
# Warning  FailedScheduling   0/3 nodes are available: 3 Insufficient memory.
# Warning  FailedScheduling   1 node(s) had taints that the pod didn't tolerate.
```

**根因 + 解决**：

| 根因 | 解决 |
|------|------|
| **节点资源不足** | 看 `kubectl top nodes`，扩容节点 / 减小 requests |
| **nodeSelector / Affinity 无匹配节点** | 检查 label / 调整 affinity |
| **节点有 Taint 没 Toleration** | Pod 加 toleration / 节点去污 |
| **PVC 还在 Pending** | 检查 StorageClass / PV 是否就绪 |
| **节点磁盘压力** | `kubectl describe node` 看 conditions |

### 故障 2：ImagePullBackOff / ErrImagePull

```
状态: 0/1 ImagePullBackOff
原因: 镜像拉不下来
```

```bash
kubectl describe pod <name> | grep -A 10 Events

# 典型事件:
# Failed to pull image "registry.example.com/app:v1.0":
#   rpc error: code = Unknown desc = Error response from daemon:
#   manifest for app:v1.0 not found
```

| 根因 | 解决 |
|------|------|
| **镜像名/tag 错** | 改镜像 tag |
| **私有仓库未配置 imagePullSecret** | 创建 secret + Pod 引用 |
| **镜像仓库不可达** | 检查节点网络 / Registry 防火墙 |
| **拉取超时**（大镜像 + 慢网络）| 节点预拉镜像 / 用本地 mirror registry |

```yaml
# 私有仓库示例
apiVersion: v1
kind: Secret
metadata: { name: regcred }
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <base64-encoded-docker-auth>

# Pod spec
spec:
  imagePullSecrets:
    - name: regcred
```

### 故障 3：CrashLoopBackOff（最常见）

```
状态: 0/1 CrashLoopBackOff (Restarts: 87)
原因: 容器启动后立刻退出，被 kubelet 反复重启
```

**指数退避**：第 1 次立即重启，第 2 次等 10s，第 3 次 20s... 最长 5 分钟。

```bash
# 1. 看上次崩溃的日志（关键！）
kubectl logs <name> --previous

# 2. 看当前日志
kubectl logs <name>

# 3. 看事件
kubectl describe pod <name>

# 4. 进入容器排查（如果容器还活着几秒）
kubectl exec -it <name> -- sh

# 5. 改 entrypoint 为 sleep 调试
spec:
  containers:
    - name: app
      command: ["sleep", "3600"]    # 临时改成 sleep，进容器手工调试
```

**根因 5 类**：

| 根因 | 排查 |
|------|------|
| **应用代码异常 / 启动失败** | `logs --previous` 看堆栈 |
| **配置错误**（ConfigMap/Secret 没挂上 / 环境变量缺失）| describe 看挂载 |
| **依赖未就绪**（DB / Redis 还没启动）| 加 initContainer 等待依赖 |
| **健康检查路径错误** | livenessProbe 失败被 kubelet 杀掉 |
| **OOMKilled**（见下）| `describe` 看 Last State |

### 故障 4：OOMKilled

```bash
kubectl describe pod <name>
# Last State: Terminated
#   Reason: OOMKilled
#   Exit Code: 137  (= 128 + SIGKILL)
```

| 根因 | 解决 |
|------|------|
| **limits 设太小** | 调大 `resources.limits.memory` |
| **应用真有内存泄漏** | 看 JVM heap dump、Go pprof |
| **JVM 没识别容器内存**（JDK 8u131 之前）| 升级 JDK / 用 `-XX:MaxRAMPercentage=75` |
| **缓存无限增长** | 加 LRU 限制 |

::: warning ⚠️ JVM 在 K8s 的经典坑

> **JDK 10+ 才默认识别容器 cgroup 内存**。早期 JDK 看到的是宿主机总内存，导致 -Xmx 设错被 OOMKilled。**生产标配**：
> ```bash
> JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=75.0 -XX:+UseContainerSupport
> ```

:::

### 故障 5：Pod Running 但服务不通

```
状态: 1/1 Running   ← 看起来 OK
现象: kubectl get svc 也 OK，但用户访问 502
```

**排查 5 步法**：

```bash
# 1. Pod 内能否自连？
kubectl exec <pod> -- curl localhost:8080/health
# 通 → 应用 OK

# 2. 同 Pod 内其他容器能否互通？
kubectl exec <pod> -- curl <other-pod-ip>:8080/health

# 3. Service Endpoint 是否注册？
kubectl get endpoints <service-name>
# 如果是空 → readinessProbe 失败，Pod 没注册到 Service

# 4. kube-proxy 规则是否生效？
iptables -L -t nat | grep <service-cluster-ip>

# 5. NetworkPolicy 是否阻断？
kubectl get networkpolicy -A
```

**最常见根因 Top 3**：
- ① **readinessProbe 失败** → Pod 没被加入 Endpoints
- ② **Service selector 与 Pod label 不匹配**
- ③ **NetworkPolicy 阻断** → 没放行调用方

### 排查命令一图速查

| 命令 | 用途 |
|------|------|
| `kubectl get pods -A -o wide` | 看所有 Pod 状态 |
| `kubectl describe pod <name>` | **看事件 + Last State**（OOMKilled 看这里）|
| `kubectl logs <name>` | 当前日志 |
| `kubectl logs <name> --previous` | **上次崩溃的日志（CrashLoop 必看）** |
| `kubectl logs -f <name> -c <container>` | 跟踪多容器 Pod 的指定容器 |
| `kubectl exec -it <name> -- sh` | 进容器排查 |
| `kubectl get events --sort-by=.metadata.creationTimestamp` | 时间倒序看事件 |
| `kubectl top pod / node` | 资源使用 |
| `kubectl get endpoints <svc>` | 看 Service 后端是否就绪 |

### 故障排查黄金顺序

::: tip 💡 一句话排查口诀

> **"看状态 → describe 事件 → logs --previous → exec 进容器"**——90% 的 Pod 故障 4 步内能定位。

:::

---

## 常见陷阱

| 陷阱 | 现象 | 正确做法 |
|------|------|----------|
| 不设置 `resources.limits` | 单个 Pod 无限制地消耗节点 CPU/内存，导致同节点其他 Pod 被驱逐（OOMKilled） | 始终为每个容器设置 `requests` 和 `limits`，HPA 也依赖 `requests` 计算利用率 |
| liveness 和 readiness 使用同一个探针配置 | 启动慢的应用（如 JVM 预热）在就绪前就被 liveness 判为失败并反复重启，永远无法正常运行 | liveness 用较长的 `initialDelaySeconds`，或改用 `startupProbe` 处理启动阶段 |
| 以为 Secret 是加密的 | Secret 数据仅 Base64 编码，任何有权限读取 Secret 的人都能直接解码获取明文 | 开启 etcd 静态加密，或使用外部密钥管理系统（如 Vault、AWS Secrets Manager） |

---

## 看到什么就先想到这类

- "容器编排/集群管理" → Kubernetes
- "自动伸缩/弹性" → HPA
- "滚动更新/零停机" → Deployment strategy
- "服务发现/负载均衡" → Service + Ingress
- "配置管理/密钥" → ConfigMap / Secret
