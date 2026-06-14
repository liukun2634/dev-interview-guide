---
title: Helm 与 Kustomize
---

# Helm 与 Kustomize

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 高频（K8s 部署必考）</span>

::: tip 💡 核心要点
K8s 配置管理两大流派：**Helm（模板化 + 包管理）** 和 **Kustomize（声明式覆盖）**。**面试金句**：「**Helm = K8s 的 apt/yum**——一条命令装完整系统（带模板、版本、回滚）；**Kustomize = K8s 的 git patch**——base + overlay 无模板纯叠加」。2026 主流实践：**复杂第三方服务用 Helm（Bitnami / 官方 Chart 生态）+ 自家应用用 Kustomize（无侵入、Git 友好）+ Argo CD 统一编排**。
:::

---

## 为什么需要 Helm / Kustomize

**裸 `kubectl apply -f` 的 3 大痛点**：

| 痛点 | 实际场景 |
|------|---------|
| **多环境复用** | 同一应用 dev / staging / prod 参数不同（image tag / replicas / ingress host）→ 复制 N 份 manifest |
| **依赖管理** | 装一个 Prometheus 需要 50+ 个 YAML（Deployment / Service / ConfigMap / RBAC / CRD） |
| **版本化升级** | 改 manifest 后无法记录"我装的是 v1 还是 v2"，无法回滚 |

**Helm** 用模板 + Chart 包管理解决；**Kustomize** 用 base + overlay 覆盖解决。**两者解决同一问题，方向相反**：Helm 走"模板渲染"路线，Kustomize 走"声明式覆盖"路线。

---

## Helm 3 核心架构

```
┌──────────────────────────────────────────────────────────┐
│ Helm 3：客户端工具（不需要 Tiller，K8s 原生 CRD）          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Chart Repository（远程仓库）                              │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Bitnami / Artifact Hub / 私有 ChartMuseum / OCI  │    │
│  └──────────────────────────────────────────────────┘    │
│         ↑ helm pull / install                            │
│         │                                                │
│  ┌──────────────────┐                                    │
│  │  Helm CLI        │  → helm install / upgrade / rollback│
│  │  (helm 3.x)      │                                    │
│  └──────────────────┘                                    │
│         ↓ 渲染模板 + 应用                                  │
│  ┌──────────────────────────────────────────────────┐    │
│  │  K8s API Server                                  │    │
│  │  + Release 信息存为 Secret（namespace 级）         │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

::: warning ⚠️ Helm 2 → Helm 3 重大变化（必知）
**Helm 2 已 EOL（2020.11）**，新项目禁用。Helm 3 三大变化：
1. **干掉 Tiller**（Helm 2 的服务端组件）—— 直接走 K8s API + RBAC，权限模型对齐 K8s
2. **Release 存为 Secret**（默认）—— Helm 2 存 ConfigMap，Helm 3 用 Secret 更安全
3. **三路合并补丁** —— `live state` + `last applied` + `new` 三方比对（Helm 2 仅 `last applied` vs `new`，会丢手工改）
:::

---

## Chart 结构（一个标准的 Helm 包）

```
my-app/
├── Chart.yaml              # 包元数据（name / version / appVersion）
├── values.yaml             # 默认值（用户主要改这个）
├── values.schema.json      # values 的 JSON Schema 校验（可选但强烈推荐）
├── templates/
│   ├── deployment.yaml     # 模板（Go template + Sprig 函数）
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── _helpers.tpl        # 复用模板片段（如 labels / fullname）
│   ├── NOTES.txt           # install 后打印的提示
│   └── tests/
│       └── test-connection.yaml  # helm test 跑的烟雾测试
├── charts/                 # 子 Chart 依赖（如 redis / postgres）
└── crds/                   # CRD 定义（不走 template 渲染，install 时直接 apply）
```

### Chart.yaml 示例

```yaml
apiVersion: v2                     # Helm 3 必须 v2
name: my-app
description: A Spring Boot demo
type: application                  # application 或 library
version: 0.3.1                     # Chart 自身版本（语义化）
appVersion: "1.16.0"               # 应用版本（任意字符串）
dependencies:
  - name: postgresql
    version: "13.x.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled  # values 控制是否启用
  - name: redis
    version: "18.x.x"
    repository: "https://charts.bitnami.com/bitnami"
```

### values.yaml 示例（用户主要改这个）

```yaml
replicaCount: 3

image:
  repository: myorg/myapp
  tag: ""                          # 留空则取 .Chart.AppVersion
  pullPolicy: IfNotPresent

resources:
  requests: {cpu: 500m, memory: 512Mi}
  limits: {cpu: 1, memory: 1Gi}

ingress:
  enabled: true
  className: nginx
  host: app.example.com
  tls: true

postgresql:                        # 子 chart 的 values 嵌套
  enabled: true
  auth:
    database: myapp
    password: ""                   # 留空让 chart 自动生成 Secret
```

### templates/deployment.yaml（Go template + Sprig）

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          {{- with .Values.env }}
          env:
            {{- toYaml . | nindent 12 }}
          {{- end }}
```

### templates/_helpers.tpl（复用片段）

```yaml
{{- define "my-app.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end }}

{{- define "my-app.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
```

---

## Helm 常用命令（生产必背）

```bash
# === Repository 管理 ===
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo postgresql

# === Install / Upgrade ===
helm install my-release ./my-app                              # 装本地 chart
helm install my-release bitnami/postgresql --version 13.2.0   # 装远程 chart
helm install my-release ./my-app \
    --namespace prod --create-namespace \
    --values values-prod.yaml \
    --set image.tag=v1.2.3 \
    --set replicaCount=10                                     # 覆盖 values

helm upgrade --install my-release ./my-app -f values-prod.yaml  # ★ "upgrade or install"，CI/CD 黄金命令

# === 模板调试（不实际部署）===
helm template ./my-app -f values-prod.yaml > /tmp/out.yaml    # 渲染出最终 YAML
helm install --dry-run --debug my-release ./my-app            # 模拟安装
helm lint ./my-app                                            # 模板语法校验

# === 查询 / 历史 / 回滚 ===
helm list -A                                                  # 所有 namespace 的 release
helm history my-release                                       # release 版本历史
helm rollback my-release 3                                    # 回滚到 revision 3
helm get values my-release                                    # 当前生效的 values
helm get manifest my-release                                  # 渲染后的实际 YAML

# === 卸载 ===
helm uninstall my-release                                     # 删除 release（保留 history）
helm uninstall my-release --keep-history                      # 显式保留
```

::: tip 💡 CI/CD 黄金命令
```bash
helm upgrade --install my-app ./chart -f values-prod.yaml --wait --timeout 5m
```
- `--install`：不存在则装、存在则升级（**幂等**）
- `--wait`：等所有资源 Ready
- `--timeout`：失败兜底（默认 5 分钟）
- 失败自动回滚：加 `--atomic`
:::

---

## Helm Hooks（生命周期钩子）

类似 Argo CD Sync Hooks，控制资源应用顺序：

| Hook | 时机 | 典型用途 |
|------|------|---------|
| `pre-install` / `pre-upgrade` | 资源应用**前** | DB schema 校验、备份 |
| `post-install` / `post-upgrade` | 资源应用**后** | 烟雾测试、发通知 |
| `pre-delete` / `post-delete` | 卸载前后 | 备份数据、清理外部资源 |
| `pre-rollback` / `post-rollback` | 回滚前后 | 通知监控降级 |
| `test` | `helm test` 触发 | 集成测试 |

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-migration"
  annotations:
    "helm.sh/hook": pre-upgrade,pre-install
    "helm.sh/hook-weight": "-5"                          # 权重越小越早执行
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      containers:
      - name: flyway
        image: flyway/flyway:9
        command: ["flyway", "migrate"]
      restartPolicy: Never
```

---

## Helm 7 大生产陷阱

::: warning ⚠️ 这些坑大概率你已经踩过
1. **Secret 明文存 values.yaml** → 用 `helm-secrets` 插件 + SOPS / Vault；或 External Secrets Operator
2. **`helm upgrade` 后某些资源丢失** → 把它们标 `helm.sh/resource-policy: keep` annotation 防误删
3. **CRD 在 `crds/` 目录** → **不参与 upgrade**（Helm 故意设计，CRD 一旦装上只能手动改）
4. **`--force` 滥用** → 触发资源**删后重建**（StatefulSet PVC 也会丢）；99% 场景不要用
5. **`--recreate-pods` 已 deprecated** → 改用 `template.metadata.annotations.checksum/config` 模式
6. **Subchart values 嵌套覆盖错** → 子 chart 的 values 必须放在 **`<subchart-name>:` 节点下**
7. **没用 `values.schema.json`** → 用户 typo 一个字段（如 `replicasCount` 而非 `replicaCount`）默默被忽略
:::

---

## Kustomize：另一条路（无模板纯叠加）

Kustomize 是 K8s 1.14+ 内置在 `kubectl apply -k` 的工具——**完全不用模板，靠 base + overlay 声明式覆盖**。

### 仓库结构

```
my-app/
├── base/                       # 基础配置
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── replicas-patch.yaml     # dev 用 1 副本
    ├── staging/
    │   ├── kustomization.yaml
    │   └── image-patch.yaml
    └── prod/
        ├── kustomization.yaml
        ├── replicas-patch.yaml     # prod 用 10 副本
        └── ingress.yaml            # prod 才有 ingress
```

### base/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml

commonLabels:
  app: my-app
  managed-by: kustomize

namespace: default
```

### overlays/prod/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: prod
namePrefix: prod-                  # 所有资源名加 prod- 前缀
nameSuffix: -v1

bases:
  - ../../base                     # ★ 引用 base

patches:
  - path: replicas-patch.yaml      # 改副本数
  - patch: |-
      - op: replace
        path: /spec/template/spec/containers/0/image
        value: myorg/myapp:v1.2.3
    target:
      kind: Deployment
      name: my-app

configMapGenerator:                # 自动生成 ConfigMap（带 hash 后缀）
  - name: app-config
    files:
      - application-prod.properties

secretGenerator:                   # 自动生成 Secret
  - name: db-credentials
    envs:
      - .env.prod

replicas:                          # 简化的副本数覆盖
  - name: my-app
    count: 10
```

### 用法

```bash
# 渲染预览
kubectl kustomize overlays/prod

# 直接 apply
kubectl apply -k overlays/prod

# 或用独立 kustomize CLI（功能更全）
kustomize build overlays/prod | kubectl apply -f -
```

---

## Helm vs Kustomize vs Operator：三方对比

| 维度 | **Helm** | **Kustomize** | **Operator** |
|------|----------|--------------|--------------|
| **定位** | K8s 包管理器 | 配置叠加器 | Day 2 运维框架 |
| **机制** | Go 模板渲染 | YAML 声明式覆盖（Strategic Merge / JSON Patch）| 自定义 Controller + CRD |
| **学习曲线** | 中（Go template + Sprig）| **低**（纯 YAML） | **高**（Go + controller-runtime） |
| **版本管理** | ✅ `helm history` + `helm rollback` | ❌ 靠 Git tag | ❌ 靠 CRD spec 版本 |
| **依赖管理** | ✅ Chart dependencies + 子 chart | ⚠️ 用 base + remote URL 引用 | ❌ 自管 |
| **多环境** | ✅ 多 values.yaml | ✅ 多 overlay | ⚠️ 多 CR 实例 |
| **第三方生态** | ✅ **Artifact Hub 万级 Chart** | ⚠️ 不发包 | ✅ Bitnami / Red Hat 大量 Operator |
| **DB 备份 / 主从切换** | ❌ | ❌ | ✅ **核心场景** |
| **配置漂移检测** | ❌（要配 Argo CD）| ❌（要配 Argo CD）| ✅ Reconcile loop 内置 |
| **典型用户** | Bitnami / Prometheus / Nginx 安装 | 多环境自家应用 | **Prometheus Operator / TiDB / Strimzi Kafka** |

### 一句话选型

| 场景 | 选 |
|------|---|
| **装第三方服务**（Prometheus / Ingress-NGINX / cert-manager） | **Helm**（Bitnami / 官方 Chart） |
| **自家应用多环境部署** | **Kustomize**（Git 友好、零模板）|
| **复杂有状态服务**（数据库 / 消息队列）| **Operator**（备份 / failover 自动化）|
| **GitOps 流水线** | **Helm / Kustomize 任意 + Argo CD**（Argo CD 双方都原生支持） |
| **微服务自家应用 + GitOps** | **Kustomize + Argo CD**（2026 最主流组合）|

---

## 2026 主流组合：Kustomize + Helm + Argo CD

::: tip 💡 大厂真实姿势
- **第三方服务**（Prometheus / Loki / cert-manager）→ **Helm Chart**（用 Artifact Hub 现成的）
- **自家应用**（微服务）→ **Kustomize**（base + overlay）
- **统一编排** → **Argo CD**（Application 引用 Helm chart 或 Kustomize 目录都行）
- **密钥** → **External Secrets / Sealed Secrets**
:::

Argo CD Application 同时支持两者：

```yaml
# 引用 Helm chart
apiVersion: argoproj.io/v1alpha1
kind: Application
spec:
  source:
    repoURL: https://prometheus-community.github.io/helm-charts
    chart: kube-prometheus-stack
    targetRevision: 55.0.0
    helm:
      valueFiles: [values-prod.yaml]
      parameters:
        - {name: grafana.adminPassword, value: $ARGOCD_ENV_GRAFANA_PWD}

# 引用 Kustomize
apiVersion: argoproj.io/v1alpha1
kind: Application
spec:
  source:
    repoURL: https://github.com/myorg/manifests
    path: apps/my-app/overlays/prod
    # 不写 kustomize 块 Argo CD 自动检测 kustomization.yaml
```

详见 [GitOps 与 Argo CD](./gitops-argo-cd)。

---

## 面试常问 & 怎么答

### Q1: Helm 解决了什么问题？

**核心定位**：K8s 的"包管理器"，类比 apt/yum。解决三个痛点：① **复杂应用一键安装**（Prometheus 50+ YAML 用 helm install 一条命令）；② **模板复用 + 多环境**（同一 Chart 配不同 values.yaml 部署 dev/prod）；③ **版本管理 + 回滚**（helm history / helm rollback）。**Helm 2 → 3 关键变化**：干掉 Tiller、Release 存 Secret、三路合并补丁。

### Q2: Helm 和 Kustomize 怎么选？

**两者解决同一问题，方向相反**——Helm 走"模板渲染"，Kustomize 走"声明式覆盖"。**Helm 优势**：包管理 + Artifact Hub 万级第三方 Chart + 版本回滚。**Kustomize 优势**：纯 YAML 无模板（Git diff 友好）、K8s 1.14+ 内置无需额外工具、学习曲线低。**生产推荐**：**第三方服务用 Helm**（不要造轮子）、**自家应用用 Kustomize**（base + overlay 多环境）。两者可在 Argo CD 中共存。

### Q3: Helm 和 Operator 区别？

**Helm 只管"装"**（Day 1）；**Operator 还管"运维"**（Day 2：备份、failover、扩缩容、升级）。**举例**：用 Helm 装 PostgreSQL 只是把 Pod/PVC/Service 创建出来；Postgres Operator 则把"备份策略、主从切换、版本升级"等运维知识编码进 Controller，用户只要 `kubectl apply` 一个 `PostgresCluster` CRD 就行。**复杂有状态服务（DB / Kafka / Elasticsearch）一律用 Operator**；**无状态应用 / 简单服务用 Helm 即可**。

### Q4: Helm Chart 的目录结构？

**6 个核心文件 / 目录**：① `Chart.yaml`（元数据：name / version / appVersion）；② `values.yaml`（默认值，用户主要改这个）；③ `templates/`（Go template 模板文件）；④ `templates/_helpers.tpl`（复用片段）；⑤ `charts/`（子 chart 依赖）；⑥ `crds/`（CRD 定义，**不走模板，install 时直接 apply 且 upgrade 时不更新**）。可选：`values.schema.json`（强烈推荐，避免用户 typo）。

### Q5: helm upgrade 失败怎么办？

**两个层次**：① **自动回滚**：装时加 `--atomic` 失败自动 rollback；CI/CD 强烈推荐；② **手动回滚**：`helm history my-release` 查版本 → `helm rollback my-release 3` 回滚到 revision 3。**坑**：① **CRD 不会回滚**（Helm 不管 crds/ 目录的 CRD 升级）；② **PVC 不会回滚**（数据是持久化的，回滚只回滚 spec 不回滚数据）。

### Q6: Kustomize 怎么实现多环境部署？

**base + overlay 模式**：① `base/` 放通用 manifest 和默认 `kustomization.yaml`；② `overlays/{dev,staging,prod}/` 各自放 `kustomization.yaml` 引用 `../../base` + 写差异 patch；③ 用 `kubectl apply -k overlays/prod` 部署。**常用覆盖手段**：`namePrefix` / `commonLabels` / `patches`（Strategic Merge 或 JSON 6902）/ `configMapGenerator` / `replicas`。**核心理念**："不污染 base"——base 任何时候都能独立部署。

### Q7: 2026 K8s 配置管理最佳实践？

**主流组合**："**Helm（第三方）+ Kustomize（自家）+ Argo CD（统一编排）+ External Secrets（密钥）**"。**理由**：① Helm 生态强但模板复杂——只用现成 Chart 不自己写；② Kustomize 纯 YAML 适合 Git 流程；③ Argo CD 同时支持 Helm 和 Kustomize 两种 Source；④ 密钥永远不进 Git。复杂有状态服务退化到 **Operator**。

---

## 常见陷阱

::: warning ⚠️ 8 大新手坑

1. **values.yaml 提交了密码** → 永远用 External Secrets / Sealed Secrets，不要 helm-secrets 把密文塞 Git
2. **`helm upgrade --force` 滥用** → StatefulSet PVC 也会丢；99% 场景禁用
3. **CRD 在 `crds/` 目录后改不动** → Helm 故意设计 CRD 装上后不参与 upgrade；手动 `kubectl apply -f`
4. **Subchart values 嵌套错** → 必须放在 **`<subchart-name>:` 节点下**，否则 silently ignored
5. **没用 `values.schema.json`** → 用户 typo `replicasCount` 默认值生效，问题难排查
6. **Kustomize patches 路径错** → `op: replace` 的 path 用 JSON 6902 语法（`/spec/template/spec/containers/0/image`）
7. **Helm 和 Kustomize 混在同一 Chart 里** → 双方都会失控，二选一
8. **不用 GitOps 直接 `helm install` 到生产** → 没审计、没 PR review、没回滚链路；**一定走 Argo CD / Flux**
:::

---

## 看到什么就先想到这类

- **"K8s 装第三方服务"** → Helm + Bitnami / Artifact Hub
- **"自家应用多环境部署"** → Kustomize base + overlay
- **"声明式应用打包"** → Helm Chart
- **"Helm 版本回滚"** → `helm rollback <release> <revision>`
- **"CI/CD 自动部署"** → `helm upgrade --install --atomic`
- **"Helm vs Operator"** → "装 vs 运维"——有状态服务用 Operator
- **"Helm vs Kustomize"** → "模板 vs 覆盖"——第三方用 Helm、自家用 Kustomize
- **"Helm hooks"** → pre-install / post-upgrade / test
- **"Helm 密钥管理"** → External Secrets / Sealed Secrets（**不要** helm-secrets 把密文存 Git）
- **"GitOps + Helm"** → Argo CD Application 直接引用 Chart + values
- **"K8s 1.14+ 内置 Kustomize"** → `kubectl apply -k`

## 延伸阅读

- 📄 [Kubernetes 实战](./kubernetes) — Pod 故障 5 模式 + Operator vs Helm
- 📄 [GitOps 与 Argo CD](./gitops-argo-cd) — Argo CD 同时支持 Helm / Kustomize
- 📄 [Docker 容器化](./docker)
- 📄 [Service Mesh 与 Istio](./microservice-governance#service-mesh-与-istio)
- 🔗 [helm.sh/docs](https://helm.sh/docs/)
- 🔗 [artifacthub.io](https://artifacthub.io) — Helm Chart 中央仓库（万级 Chart）
- 🔗 [kustomize.io](https://kustomize.io)
- 🔗 [github.com/helm/charts](https://github.com/bitnami/charts) — Bitnami Charts（最常用）
