---
title: Kubernetes
---

# Kubernetes

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--advanced">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Kubernetes 是容器编排的事实标准，负责容器的部署、扩缩容和管理。面试重点：Master/Node 架构、Pod 生命周期、Service 类型、Deployment 滚动更新、探针配置。
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
