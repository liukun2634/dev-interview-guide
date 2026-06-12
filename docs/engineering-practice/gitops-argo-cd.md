---
title: GitOps 与 Argo CD
---

# GitOps 与 Argo CD

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--medium">⭐⭐⭐ 高级</span> <span class="dig-tag dig-tag--hot">🔥🔥 高频（K8s 后端必考）</span>

::: tip 💡 核心要点
**GitOps = "Git 作为唯一真实源" + "声明式状态" + "持续协调"**。所有 K8s 资源（Deployment / Service / ConfigMap）都写在 Git 仓库，**Controller 持续比对集群实际状态与 Git 期望状态，自动收敛**。2026 K8s 部署事实标准是 **Argo CD（CNCF 毕业项目）** 或 **Flux v2**。面试金句：「**`kubectl apply` 是命令式过去式；GitOps 是声明式现代答案——所有变更必走 PR，Git 历史 = 部署历史**」。
:::

---

## GitOps 四大原则（Weaveworks 提出）

| 原则 | 含义 |
|------|------|
| **1. 声明式** | 所有系统配置以**声明式**形式表达（YAML / Helm / Kustomize），不是脚本步骤 |
| **2. 版本化 + 不可变** | 所有配置存 **Git**，PR + 审计 + Rollback 全靠 Git 历史 |
| **3. 自动拉取** | Controller **从 Git 主动拉取**（pull）—— 而不是 CI **推送**（push） |
| **4. 持续协调** | Controller 持续比对**期望状态 vs 实际状态**，发现漂移自动修复 |

### 传统 CI/CD vs GitOps

```
传统 CI/CD（push 模式）：
┌────────┐  build  ┌─────────┐  kubectl apply  ┌──────────┐
│  Git   │ ──────▶│   CI    │ ───────────────▶│ K8s 集群 │
└────────┘         └─────────┘                 └──────────┘
痛点：① CI 持有集群凭证（暴露面大）
      ② 漂移无人发现（手工 kubectl edit 后 Git 不同步）
      ③ 多集群多账号 CI 配置繁琐

GitOps（pull 模式）：
┌────────┐         ┌─────────┐
│  Git   │ ◀───────│ Argo CD │ ──对比/同步──▶ ┌──────────┐
│ (期望) │  watch  │(集群内) │                 │ K8s 集群 │
└────────┘         └─────────┘                 └──────────┘
优势：① Controller 在集群内，无外部凭证
      ② Self-Heal: 手工 kubectl edit 几秒后被自动还原
      ③ 多集群可扩展，每个集群跑自己的 Argo CD
```

### 三大收益（生产真实案例）

| 收益 | 量化效果 |
|------|---------|
| **回滚速度** | `git revert` 30 秒 → Argo CD 自动同步 → 1-2 分钟回滚完成 |
| **审计合规** | 100% 部署变更 = Git PR；金融监管直接看 Git log |
| **多集群一致性** | 同一份 manifest 部署到 N 个集群（dev/staging/prod）；用 `ApplicationSet` 模板化 |
| **配置漂移检测** | 手工修改集群后**自动告警 + 自动回滚** |
| **凭证收敛** | CI 不再需要 kubeconfig；只需要 Git push 权限 |

---

## Argo CD 架构

```
┌───────────────────────────────────────────────────────────┐
│                  Argo CD（部署在 K8s 集群内）              │
├───────────────────────────────────────────────────────────┤
│  ┌──────────────┐     ┌──────────────┐     ┌──────────┐  │
│  │ Repo Server  │     │ Application  │     │   API    │  │
│  │ (Git 拉取 +  │────▶│  Controller  │────▶│  Server  │  │
│  │  渲染 YAML)  │     │ (协调状态)   │     │  + UI    │  │
│  └──────────────┘     └──────────────┘     └──────────┘  │
│        ↑                     ↓                            │
│        │ git pull            │ apply                      │
│        │                     ▼                            │
│  ┌──────────────┐     ┌──────────────────────────────┐    │
│  │  Git Repo    │     │   K8s API（部署目标集群）     │    │
│  │ (期望状态)   │     │   Deployment/Service/...     │    │
│  └──────────────┘     └──────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
```

| 组件 | 职责 |
|------|------|
| **API Server** | gRPC + REST API；处理 UI/CLI 请求；管理 Application CRD |
| **Repository Server** | 克隆 Git；渲染 Helm/Kustomize → 输出最终 YAML（缓存 24h） |
| **Application Controller** | 核心调度器；定期对比 期望 vs 实际，触发 Sync |
| **Dex / OIDC**（可选）| SSO 集成（GitHub / GitLab / Okta） |
| **ApplicationSet Controller** | 动态生成多个 Application（多集群 / Monorepo） |

---

## 核心 CRD：Application

最重要的资源。一个 `Application` = "我要把这个 Git 路径部署到这个集群的这个 namespace"。

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: order-service
  namespace: argocd                # ★ Argo CD 自己装在哪
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/k8s-manifests.git
    targetRevision: HEAD            # ★ 跟踪分支 / tag / commit
    path: apps/order-service/overlays/prod
    # 也可以用 helm
    # helm:
    #   valueFiles: [values-prod.yaml]
    #   parameters:
    #     - {name: image.tag, value: v1.2.3}
  destination:
    server: https://kubernetes.default.svc   # 部署到当前集群
    namespace: order-prod
  syncPolicy:
    automated:
      prune: true                    # ★ Git 删了的资源 → 集群也删
      selfHeal: true                 # ★ 手工 kubectl 改了 → 自动还原
      allowEmpty: false              # 防止"空 manifest 误删全部"
    syncOptions:
      - CreateNamespace=true         # 自动创建 namespace
      - PrunePropagationPolicy=foreground
      - PruneLast=true               # 先 Apply 新的，再删旧的
    retry:
      limit: 5
      backoff:
        duration: 5s
        maxDuration: 3m
```

### 同步策略选择

| 模式 | 触发 | 适合 |
|------|------|------|
| **Manual** | Git 变更后**人工点 Sync** | 严肃环境（金融 prod） |
| **Automated 不带 selfHeal** | Git 变更**自动 Sync**；但手工修改保留 | 渐进式迁移期 |
| **Automated + selfHeal** | Git 变更自动同步 + 手工修改自动还原 | **生产推荐**（强一致） |
| **Automated + prune + selfHeal** | 完全 GitOps；Git 是唯一真相 | **生产黄金标准** |

::: warning ⚠️ `prune: true` 的灾难时刻
某团队在 GitOps 仓库**误删了 100+ 个 ConfigMap 的 directory**，Argo CD **自动 prune 全部删除**——所有应用瞬间失去配置。**防御措施**：
- 启用 **`syncOptions: PruneLast=true`**（先 Apply 新的再 Prune 旧的，减少时间窗）
- **`allowEmpty: false`** 防止整个空 manifest 触发"删除全部"
- 关键 namespace 加 **`Annotations.argocd.argoproj.io/sync-options: Prune=false`** 禁止 prune
- 启用 **ApplicationSet + Pre-Sync Hook 校验**
:::

---

## 同步状态（Sync Status）

每个 Application 有两个独立状态维度：

| 维度 | 状态值 | 含义 |
|------|--------|------|
| **Sync** | `Synced` / `OutOfSync` / `Unknown` | Git 期望 == 集群实际？ |
| **Health** | `Healthy` / `Progressing` / `Degraded` / `Suspended` / `Missing` | 业务是否健康（Pod Running / Deployment Ready） |

```
理想态：Synced + Healthy ✅
紧急态：OutOfSync + Degraded ❌
正常发布中：OutOfSync → Syncing → Synced + Progressing → Synced + Healthy
故障：Synced + Degraded → 业务挂了但 manifest 没问题（应用 bug）
配置漂移：OutOfSync + Healthy → 有人手工改了集群（selfHeal 会自动还原）
```

---

## Sync Hooks：发布生命周期钩子

类似 Helm Hooks，控制资源的应用顺序：

| Hook | 时机 | 典型用途 |
|------|------|---------|
| `PreSync` | Sync 前 | DB migration、备份 |
| `Sync` | 默认 | 业务资源 |
| `PostSync` | Sync 后 | 烟雾测试、通知 Slack |
| `SyncFail` | Sync 失败 | 回滚通知、告警 |

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  annotations:
    argocd.argoproj.io/hook: PreSync              # ★ 关键
    argocd.argoproj.io/hook-delete-policy: HookSucceeded  # 成功后删除 Job
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

## ApplicationSet：模板化多 Application

多集群 / 多环境 / Monorepo 必备。一份模板 + 多份 generator → 自动展开成 N 个 Application。

### 多集群部署（Cluster Generator）

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: order-service-multi-cluster
spec:
  generators:
  - clusters:                        # ★ 遍历所有注册的集群
      selector:
        matchLabels:
          env: production
  template:
    metadata:
      name: 'order-{{name}}'         # name = cluster 名
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/manifests.git
        targetRevision: HEAD
        path: 'apps/order-service/overlays/{{metadata.labels.region}}'
      destination:
        server: '{{server}}'
        namespace: order-prod
      syncPolicy:
        automated: {prune: true, selfHeal: true}
```

### Monorepo 自动发现（Git Directory Generator）

```yaml
generators:
- git:
    repoURL: https://github.com/myorg/manifests.git
    revision: HEAD
    directories:
    - path: 'apps/*'              # 自动为 apps/ 下每个子目录创建 Application
```

| Generator 类型 | 用途 |
|---------------|------|
| **List** | 静态枚举 |
| **Cluster** | 遍历所有 K8s 集群 |
| **Git Directory** | 仓库子目录 = Application |
| **Git Files** | 配置文件 = Application |
| **Matrix** | 多个 generator 笛卡尔积（如 cluster × env） |
| **SCM Provider** | GitHub/GitLab 整个 org 的所有仓库 |
| **Pull Request** | **每个 PR 自动生成临时环境**（PR 关闭自动销毁） |

---

## Argo CD vs Flux v2

| 维度 | **Argo CD** | **Flux v2** |
|------|-------------|-------------|
| **CNCF 状态** | ✅ 毕业 | ✅ 毕业 |
| **UI / 可视化** | ✅ **强**（开箱即用）| ⚠️ Weave GitOps（独立组件） |
| **多租户** | ✅ Project + RBAC | ✅ 通过 namespace 隔离 |
| **多 Source / Helm Values 来源** | ✅ 3.0+ `multipleSources` | ✅ 原生支持 |
| **Progressive Delivery** | 配合 **Argo Rollouts** | 配合 **Flagger** |
| **ApplicationSet** | ✅ | ✅ Notification + Image Automation |
| **架构** | 单体大型 controller | 多个小 Controller（GitOps Toolkit） |
| **学习曲线** | 低（UI 友好） | 中（CLI / GitOps Toolkit） |
| **典型用户** | Intuit、IBM、Adobe、Tesla、字节 | Microsoft Azure Flux extension、SUSE Rancher |
| **2026 市占率** | **更高**（社区活跃，UI 优势） | 增长稳定（CLI 流派偏好） |

**一句话定位**：「**Argo CD = UI-first / 直观可视；Flux v2 = CLI-first / 工具链优雅**」。**Java 后端团队大多数选 Argo CD**（学习快、运维直观）。

---

## Progressive Delivery：Argo Rollouts 实战

> Argo CD 只负责"发布到集群"；**渐进式发布**（蓝绿 / 金丝雀 / 流量切分）由 **Argo Rollouts** 实现。

### 金丝雀发布配置

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: order-service
spec:
  replicas: 10
  selector:
    matchLabels: {app: order-service}
  template:
    metadata:
      labels: {app: order-service}
    spec:
      containers:
      - name: order
        image: myorg/order:v2.0
  strategy:
    canary:
      canaryService: order-service-canary    # 流量切分
      stableService: order-service-stable
      trafficRouting:
        istio:
          virtualService: {name: order-vs}
      steps:
      - setWeight: 10                        # 10% 流量到金丝雀
      - pause: {duration: 5m}                # 观察 5 分钟
      - analysis:                            # 自动分析指标
          templates:
          - templateName: success-rate
          args:
          - name: service-name
            value: order-service-canary
      - setWeight: 30
      - pause: {duration: 10m}
      - setWeight: 50
      - pause: {duration: 10m}
      - setWeight: 100                       # 全量发布
```

```yaml
# AnalysisTemplate：从 Prometheus 查成功率
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  metrics:
  - name: success-rate
    interval: 30s
    successCondition: result[0] >= 0.99
    failureLimit: 3                          # 连续 3 次失败 → 自动回滚
    provider:
      prometheus:
        address: http://prometheus.svc
        query: |
          sum(rate(http_requests_total{service="{{args.service-name}}",code!~"5.."}[5m]))
          /
          sum(rate(http_requests_total{service="{{args.service-name}}"}[5m]))
```

**自动化效果**：
- 10% → 5 分钟观察 → 30% → 自动从 Prometheus 查成功率 → 不达标自动回滚
- **全程无人工介入**，符合 SLO 自动推进，违反自动回滚

---

## 密钥管理：External Secrets / Sealed Secrets

::: warning ⚠️ GitOps 最大 trade-off：密钥不能裸放 Git
直接把 K8s Secret YAML push 到 Git → **base64 等同明文，扫描机器人秒抓**。
:::

### 三大主流方案

| 方案 | 原理 | 学习成本 | 优势 | 劣势 |
|------|------|---------|------|------|
| **Sealed Secrets**（Bitnami） | kubeseal CLI 用集群公钥加密 → 加密后的 SealedSecret 可入 Git；集群内 Controller 自动解密为 Secret | 低 | 完全离线、无外部依赖 | 集群迁移需备份私钥 |
| **External Secrets Operator**（ESO） | Controller 从 **Vault / AWS Secrets Manager / GCP Secret Manager** 同步到集群 Secret | 中 | 集中管理、可审计 | 依赖外部服务 |
| **SOPS + KMS** | YAML 文件用 KMS 加密，Argo CD 加 `argocd-vault-plugin` 解密 | 高 | 文件级加密、Mozilla 出品 | 配置链路长 |

```yaml
# External Secrets 示例：从 AWS Secrets Manager 拉取
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: db-secret                          # ★ 生成的 K8s Secret 名
  data:
  - secretKey: password
    remoteRef:
      key: prod/db/order-service
      property: password
```

---

## 生产实战：仓库结构 + 多环境

### Monorepo 推荐布局

```
k8s-manifests/
├── apps/
│   ├── order-service/
│   │   ├── base/                         # 通用 manifest
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── kustomization.yaml
│   │   └── overlays/                     # 环境差异
│   │       ├── dev/
│   │       │   ├── kustomization.yaml
│   │       │   └── replicas-patch.yaml   # dev 用 1 副本
│   │       ├── staging/
│   │       └── prod/
│   │           ├── kustomization.yaml
│   │           ├── replicas-patch.yaml   # prod 用 10 副本
│   │           └── ingress.yaml          # prod 才有 ingress
│   └── user-service/...
├── infra/
│   ├── ingress-nginx/
│   ├── cert-manager/
│   └── prometheus/
└── argocd/
    └── applicationsets/                  # ★ Argo CD 自管理
        └── all-apps.yaml
```

### App-of-Apps 模式（Argo CD 自管理）

```yaml
# 根 Application：管理所有其他 Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root-app
spec:
  source:
    repoURL: https://github.com/myorg/k8s-manifests.git
    path: argocd/applicationsets
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated: {prune: true, selfHeal: true}
```

部署一次根应用 → 自动展开成 N 个子 Application → 子 Application 各自管理业务。**Argo CD 自我管理 Argo CD**。

---

## 面试常问 & 怎么答

### Q1: 什么是 GitOps？它解决了什么问题？

**核心定义**：GitOps = "**Git 作为唯一真实源** + **声明式状态** + **Controller 持续协调**"。所有 K8s 资源以 YAML 形式存储在 Git，Argo CD / Flux 等 Controller 在集群内**主动拉取**对比并同步。**解决的痛点**：① CI 推送模式需要外部凭证（kubeconfig 泄漏风险）；② 手工 `kubectl edit` 后无人发现，配置漂移；③ 多集群多环境部署难一致；④ 没有可审计的部署历史。**核心收益**：Git 历史 = 部署历史，回滚 = `git revert`，多集群一致性靠模板。

### Q2: Argo CD 和 Flux 怎么选？

两者都是 CNCF 毕业项目、功能相当：① **Argo CD**：UI 友好、学习曲线低、社区活跃度高、**Java 后端团队首选**；② **Flux v2**：架构更简洁（多个小 Controller）、CLI 体验好、与 Microsoft Azure 深度集成。**国内 2026 Argo CD 占主流**，外企两者均常见。选型靠"团队是否需要 UI 操作 vs 工程师习惯 CLI"。

### Q3: `selfHeal` 和 `prune` 各起什么作用？

**`automated.selfHeal: true`** —— 监测到**集群实际状态偏离 Git 期望**就自动同步还原。典型场景：有人手工 `kubectl edit deployment` 改了 replicas，**几秒后被自动还原成 Git 里的值**。**`automated.prune: true`** —— 监测到 **Git 里删了某资源**就在集群删除。**坑**：误删 manifest 目录 → 集群应用全删；要配 `PruneLast=true` + `allowEmpty: false` + 关键 namespace 用 `Prune=false` annotation。

### Q4: 为什么需要 ApplicationSet？

单个 Application 只能定义"**一个**仓库 → **一个**集群 → **一个**路径"。**多环境 / 多集群场景**手写 N 个 Application 重复且容易漂移。**ApplicationSet** 通过 generators（Cluster / Git / Matrix / PR）+ template 动态展开成 N 个 Application。**典型场景**：① 一份 manifest 模板部署到 dev/staging/prod 三集群；② Monorepo 下 `apps/*` 每个子目录自动生成 Application；③ 每个 PR 自动起一个临时环境。

### Q5: GitOps 怎么管理敏感信息（密钥 / 证书）？

**三大方案**：① **Sealed Secrets**（Bitnami）—— kubeseal CLI 用集群公钥加密，**加密后的 YAML 可放 Git**，Controller 在集群内解密；离线无依赖；② **External Secrets Operator** —— Controller 从 Vault / AWS Secrets Manager 同步到集群 Secret；适合多团队集中管理；③ **SOPS + KMS** —— Mozilla 出品，文件级加密；配 `argocd-vault-plugin`。**绝对禁止**：直接把 Secret YAML 推到 Git（base64 等同明文）。

### Q6: Argo CD 自身怎么部署？App-of-Apps 是什么？

**App-of-Apps 模式**：① 部署一个 **"root" Application**，它 source 指向一个目录；② 那个目录里全是其他 Application 的 YAML；③ root Application 自动同步 → Argo CD 自动展开成 N 个子 Application。**好处**：**Argo CD 自管理 Argo CD**——新集群只需手动部署一次 root，后续所有变更走 Git PR。常配合 ApplicationSet 用。

### Q7: 怎么实现金丝雀发布？

**Argo CD 不直接做金丝雀**——它只负责"部署到集群"。**渐进式发布要用 Argo Rollouts**：① 定义 `Rollout` 替代 `Deployment`；② 配 `strategy.canary` 的 steps（10% → pause → 30% → analysis → 50% → 100%）；③ 配 `AnalysisTemplate` 从 Prometheus 查成功率/延迟自动决策；④ 配合 Istio / NGINX Ingress 做流量切分。**全程自动化**：指标达标自动推进，违反自动回滚。

---

## 常见陷阱

::: warning ⚠️ GitOps 8 大新手坑

1. **`prune: true` 删全部** —— 误删 manifest 目录瞬间销毁 N 个应用；必须配 `allowEmpty: false` + `PruneLast=true`
2. **直接把 Secret YAML 推 Git** —— base64 等同明文；用 Sealed Secrets / ESO
3. **CI 镜像构建后人工改 manifest** —— **应自动化**：CI 推新镜像 tag → 自动 PR 到 manifest 仓库（Argo Image Updater）
4. **手工 kubectl 改集群** —— 配 `selfHeal: true` 自动还原；团队禁止操作 prod 集群
5. **没设 Resource Limits** —— Argo CD 应用控制器本身 OOM；HA 模式建议 4Gi+ 内存
6. **Argo CD 和业务同 namespace** —— 必须独立 namespace（默认 `argocd`），权限隔离
7. **多团队共用一个 Project** —— Project + RBAC 是多租户基础，每团队独立 Project
8. **不打 `app.kubernetes.io/instance` label** —— Argo CD 靠它跟踪资源归属；自定义资源要主动加
:::

---

## 看到什么就先想到这类

- **"K8s 部署 / CD"** → Argo CD / Flux v2 GitOps
- **"配置漂移 / 手工 kubectl 改了集群"** → `selfHeal: true`
- **"多集群一致性"** → ApplicationSet + Cluster Generator
- **"PR 自动起预览环境"** → ApplicationSet Pull Request Generator
- **"K8s 密钥管理"** → Sealed Secrets / External Secrets / SOPS
- **"金丝雀 / 蓝绿 / 渐进式发布"** → Argo Rollouts + AnalysisTemplate
- **"DB migration 在部署前跑"** → PreSync Hook
- **"镜像更新自动 PR"** → Argo CD Image Updater / Flux Image Automation
- **"GitOps 加 IaC"** → Crossplane / Terraform Operator
- **"App-of-Apps"** → Argo CD 自管理 Argo CD

## 延伸阅读

- 📄 [Docker 容器化](./docker)
- 📄 [Kubernetes 实战](./kubernetes) — Pod 故障 5 模式 + JVM 容器配置
- 📄 [Service Mesh 与 Istio](./microservice-governance#service-mesh-与-istio) — 流量治理
- 📄 [可观测性 · OpenTelemetry](./monitoring-observability#opentelemetry-深度)
- 🔗 [argo-cd.readthedocs.io](https://argo-cd.readthedocs.io)
- 🔗 [argoproj.github.io/argo-rollouts](https://argoproj.github.io/argo-rollouts/)
- 🔗 [fluxcd.io](https://fluxcd.io)
- 🔗 [opengitops.dev](https://opengitops.dev/) — GitOps Principles 1.0
