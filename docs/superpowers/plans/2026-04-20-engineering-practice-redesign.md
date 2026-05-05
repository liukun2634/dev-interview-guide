# Engineering Practice Chapter Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the entire engineering practice chapter (8 topic pages + 1 index) with a unified interview-oriented template focusing on concept understanding and interview preparation.

**Architecture:** Each page follows a fixed template: 核心概念 → 典型场景与最佳实践 → 面试常问 & 怎么答 → 常见陷阱 → 看到什么就先想到这类. Content is Chinese-language, code examples in Java. Existing files are either rewritten or replaced; `git-workflow.md` and `monitoring-logging.md` are deleted.

**Tech Stack:** VitePress, Markdown, Java code examples

---

## Context for all tasks

**Unified page template** — every topic page MUST follow this structure:

```markdown
---
title: 标题
---

# 标题

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
一句话概括这个技术解决什么问题、面试中的考查重点。
:::

---

## 核心概念

关键术语、原理、架构。用表格、ASCII 图、对比表。

## 典型场景与最佳实践

### 场景 N：标题
问题 → 方案 → 为什么这样做 → 代码/配置示例

## 面试常问 & 怎么答

### 问题？
答案。

## 常见陷阱

| 陷阱 | 症状 | 正确做法 |
|------|------|---------|

## 看到什么就先想到这类

- 关键词 → 技术映射
```

**Positioning:** Engineering practice = "这个技术怎么工作、面试怎么答". System design chapter = "大规模系统怎么设计". Avoid duplicating system design architecture discussions.

---

### Task 1: Delete old files and update sidebar

**Files:**
- Delete: `docs/engineering-practice/git-workflow.md`
- Delete: `docs/engineering-practice/monitoring-logging.md`
- Modify: `docs/.vitepress/config.ts:199-211`

- [ ] **Step 1: Delete git-workflow.md**

```bash
rm docs/engineering-practice/git-workflow.md
```

- [ ] **Step 2: Delete monitoring-logging.md**

```bash
rm docs/engineering-practice/monitoring-logging.md
```

- [ ] **Step 3: Update sidebar in config.ts**

Replace lines 199-211 in `docs/.vitepress/config.ts`:

```typescript
      '/engineering-practice/': [
        {
          text: '工程实践',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/engineering-practice/' },
            { text: '设计模式', link: '/engineering-practice/design-patterns' },
            { text: 'Docker 容器化', link: '/engineering-practice/docker' },
            { text: 'Kubernetes', link: '/engineering-practice/kubernetes' },
            { text: 'Redis 实战', link: '/engineering-practice/redis' },
            { text: '消息队列', link: '/engineering-practice/message-queue' },
            { text: '微服务治理', link: '/engineering-practice/microservice-governance' },
            { text: '监控与可观测性', link: '/engineering-practice/monitoring-observability' },
            { text: '分布式 ID 生成', link: '/engineering-practice/distributed-id' },
          ],
        },
      ],
```

- [ ] **Step 4: Commit**

```bash
git add -A docs/engineering-practice/git-workflow.md docs/engineering-practice/monitoring-logging.md docs/.vitepress/config.ts
git commit -m "chore: remove git-workflow and monitoring-logging, update sidebar for engineering practice redesign"
```

---

### Task 2: Rewrite index.md

**Files:**
- Modify: `docs/engineering-practice/index.md`

- [ ] **Step 1: Write the new index.md**

Full content for `docs/engineering-practice/index.md`:

```markdown
---
title: 工程实践
---

# 工程实践

本章覆盖生产环境中的核心工程技术，侧重**概念理解**和**面试应对**。每个主题按统一模板编写：核心概念 → 典型场景 → 面试常问 → 常见陷阱。

## 分类地图

| 主题 | 核心知识点 | 面试热度 |
|------|------|------|
| [设计模式](./design-patterns) | SOLID 原则、8 大高频模式、Spring 应用 | 🔥🔥🔥 |
| [Docker 容器化](./docker) | 容器 vs VM、镜像分层、Dockerfile、Compose | 🔥🔥🔥 |
| [Kubernetes](./kubernetes) | Pod/Service/Deployment、弹性伸缩、滚动更新 | 🔥🔥 |
| [Redis 实战](./redis) | 5 种数据结构、缓存策略、分布式锁、穿透/击穿/雪崩 | 🔥🔥🔥 |
| [消息队列](./message-queue) | Kafka/RabbitMQ、可靠投递、幂等消费、顺序保证 | 🔥🔥🔥 |
| [微服务治理](./microservice-governance) | 限流/熔断/降级、服务注册发现、配置中心 | 🔥🔥 |
| [监控与可观测性](./monitoring-observability) | Metrics/Logs/Traces 三大支柱、Prometheus、ELK | 🔥🔥 |
| [分布式 ID 生成](./distributed-id) | 雪花算法、号段模式、UUID 对比 | 🔥🔥 |

## 建议学习顺序

1. 先看 [设计模式](./design-patterns) 和 [Redis 实战](./redis)，面试出现频率最高。
2. 再看 [Docker 容器化](./docker) 和 [消息队列](./message-queue)，中高级岗位必考。
3. 然后看 [Kubernetes](./kubernetes) 和 [微服务治理](./microservice-governance)，后端进阶必备。
4. 最后看 [监控与可观测性](./monitoring-observability) 和 [分布式 ID 生成](./distributed-id)，补全工程素养。
```

- [ ] **Step 2: Commit**

```bash
git add docs/engineering-practice/index.md
git commit -m "docs: rewrite engineering practice index with new topic map"
```

---

### Task 3: Rewrite design-patterns.md

**Files:**
- Modify: `docs/engineering-practice/design-patterns.md`

- [ ] **Step 1: Write the new design-patterns.md**

Full rewrite of `docs/engineering-practice/design-patterns.md`. Follow the unified template. Content requirements:

**Header:** title=设计模式, category=工程实践, level=⭐⭐ 中级, hot=🔥 高频

**核心要点 tip:** 设计模式是面试高频考点。重点不是背 23 种模式，而是理解 SOLID 原则、能说清每个模式解决什么问题、在 Spring/项目中的实际应用。

**核心概念 section:**

1. SOLID 原则表格（5 行）：

| 原则 | 一句话定义 | 违反时的症状 |
|------|---------|-----------|
| S — 单一职责 | 一个类只负责一件事 | 一个类改动频繁、牵一发而动全身 |
| O — 开闭原则 | 对扩展开放，对修改关闭 | 每加一种新类型就要改 if-else |
| L — 里氏替换 | 子类可以替换父类 | 重写父类方法后调用方行为异常 |
| I — 接口隔离 | 接口小而专，不强迫实现不需要的方法 | 实现类有大量空方法 |
| D — 依赖倒置 | 依赖抽象而非具体实现 | 换一个实现要改大量代码 |

2. 23 种模式三类概览表（创建型/结构型/行为型各列出主要模式名）

3. 面试重点 8 个模式的详细讲解，每个模式包含：
   - 一句话定义
   - 结构关系（文字描述，不需要 UML 图）
   - Java 代码示例（简短，15-25 行）
   - Spring 中的应用（1-2 句）
   - 面试追问（1 个关键问题 + 简答）

8 个模式及其内容要求：

**单例模式：**
- 场景：全局配置、连接池
- 代码：双重检查锁定（DCL）实现，包含 volatile 关键字
- Spring：Spring Bean 默认单例（singleton scope）
- 追问：为什么要 volatile？（防止指令重排序，半初始化对象）

**工厂方法模式：**
- 场景：多种支付方式（微信/支付宝/银行卡）
- 代码：PaymentFactory 接口 + 具体工厂
- Spring：BeanFactory、FactoryBean
- 追问：工厂方法 vs 抽象工厂？（工厂方法生产一个产品，抽象工厂生产一族产品）

**建造者模式：**
- 场景：复杂对象构建（多个可选参数）
- 代码：User.Builder 链式调用
- Spring：StringBuilder、Lombok @Builder
- 追问：建造者 vs 工厂？（建造者关注构建过程，工厂关注创建哪种产品）

**代理模式：**
- 场景：AOP 日志、事务、权限
- 代码：JDK 动态代理 InvocationHandler 示例
- Spring：Spring AOP 默认用 JDK 动态代理（接口），CGLIB（无接口）
- 追问：JDK 动态代理 vs CGLIB？（JDK 基于接口+反射，CGLIB 基于继承+字节码生成，CGLIB 不能代理 final 类/方法）

**策略模式：**
- 场景：多种折扣计算策略
- 代码：DiscountStrategy 接口 + 具体策略 + Context
- Spring：Comparator、Resource 加载策略
- 追问：策略 vs 状态模式？（策略由调用方选择，状态由对象内部转换）

**观察者模式：**
- 场景：订单创建后通知库存、积分、短信
- 代码：EventListener 接口 + EventPublisher
- Spring：ApplicationEvent + @EventListener
- 追问：观察者 vs 发布订阅？（观察者直接依赖，发布订阅通过中间件解耦）

**模板方法模式：**
- 场景：不同数据源的导出流程（查询→转换→输出）
- 代码：AbstractExporter 抽象类 + 子类实现 hook
- Spring：JdbcTemplate、RestTemplate
- 追问：模板方法 vs 策略？（模板方法用继承，策略用组合）

**责任链模式：**
- 场景：请求校验（参数→权限→频率限制）
- 代码：Handler 抽象类 + next 链
- Spring：Filter 链、HandlerInterceptor
- 追问：责任链在哪些框架中见过？（Servlet Filter、Netty ChannelPipeline、MyBatis Plugin）

**面试常问 section（4 题）：**
- 单例模式有几种实现方式？各自的优缺点？（饿汉/懒汉/DCL/静态内部类/枚举，推荐枚举）
- JDK 动态代理 vs CGLIB 动态代理？
- 设计模式的六大原则？（SOLID + 迪米特法则）
- 你在项目中用过哪些设计模式？（给出 2-3 个实际场景的回答模板）

**常见陷阱表格（3-4 行）：**
- 过度设计：简单问题用复杂模式
- 单例滥用：所有东西都做成单例
- 模式混淆：策略和状态、工厂和建造者分不清

**看到什么就先想到这类：**
- "全局唯一实例" → 单例
- "创建不同子类对象" → 工厂
- "多种可选参数构建" → 建造者
- "动态增强/AOP" → 代理
- "多种算法切换" → 策略
- "事件通知/解耦" → 观察者
- "固定流程+可变步骤" → 模板方法
- "多级校验/过滤" → 责任链

- [ ] **Step 2: Commit**

```bash
git add docs/engineering-practice/design-patterns.md
git commit -m "docs: rewrite design patterns with unified template and 8 patterns"
```

---

### Task 4: Rewrite docker.md

**Files:**
- Modify: `docs/engineering-practice/docker.md`

- [ ] **Step 1: Write the new docker.md**

Full rewrite of `docs/engineering-practice/docker.md`. Follow unified template.

**Header:** title=Docker 容器化, category=工程实践, level=⭐⭐ 中级, hot=🔥 高频

**核心要点 tip:** Docker 通过 Namespace（隔离）和 Cgroups（资源限制）实现轻量级容器。面试重点：容器 vs VM、镜像分层原理、Dockerfile 最佳实践、CMD vs ENTRYPOINT。

**核心概念 section:**

1. 容器 vs 虚拟机对比（保留 ASCII 架构图，加对比表）：

| 维度 | 容器 | 虚拟机 |
|------|------|------|
| 隔离级别 | 进程级（共享内核） | 系统级（独立内核） |
| 启动速度 | 秒级 | 分钟级 |
| 资源占用 | MB 级 | GB 级 |
| 性能损耗 | 接近原生 | 有虚拟化开销 |
| 安全性 | 较弱（共享内核） | 较强（完全隔离） |

2. Docker 核心概念三角：镜像（只读模板）→ 容器（运行实例）→ 仓库（镜像存储）

3. 镜像分层存储原理：Union FS、每条 Dockerfile 指令产生一层、多容器共享只读层

4. Namespace 与 Cgroups 表格：

| Linux 技术 | 作用 | 隔离内容 |
|-----------|------|---------|
| PID Namespace | 进程隔离 | 容器只能看到自己的进程 |
| Network Namespace | 网络隔离 | 独立网卡、IP、端口 |
| Mount Namespace | 文件系统隔离 | 独立挂载点 |
| Cgroups | 资源限制 | CPU、内存、磁盘 IO 上限 |

5. Dockerfile 核心指令表：

| 指令 | 作用 | 注意事项 |
|------|------|---------|
| FROM | 基础镜像 | 尽量用 alpine/slim 减小体积 |
| RUN | 执行命令 | 合并多条减少层数 |
| COPY | 复制文件 | 优先于 ADD（ADD 会自动解压） |
| CMD | 默认启动命令 | 可被 docker run 参数覆盖 |
| ENTRYPOINT | 入口命令 | 不可覆盖，CMD 作为参数追加 |
| EXPOSE | 声明端口 | 仅文档作用，不实际发布 |
| ENV | 环境变量 | 构建和运行时都可用 |
| VOLUME | 数据卷 | 持久化数据，不随容器删除 |

**典型场景 section（3 个）：**

场景 1：编写高效 Dockerfile
- 多阶段构建示例（Java 应用：Maven 构建阶段 + JRE 运行阶段）
- 减少层数技巧（合并 RUN）
- .dockerignore 配置

```dockerfile
# 多阶段构建示例
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

场景 2：Docker Compose 多容器编排
- Web + MySQL + Redis 的 docker-compose.yml 示例
- depends_on、networks、volumes 用法

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - mysql
      - redis
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/mydb

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: mydb
    volumes:
      - mysql-data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mysql-data:
```

场景 3：容器网络模型
- bridge（默认，容器间通过虚拟网桥通信）
- host（共享宿主机网络，性能最好，无隔离）
- none（无网络，用于安全场景）
- 表格对比三种模式

**面试常问 section（4 题）：**
- CMD 和 ENTRYPOINT 的区别？
- COPY 和 ADD 的区别？
- Docker 容器如何实现隔离？
- 如何减小 Docker 镜像体积？（alpine 基础镜像、多阶段构建、合并 RUN、清理缓存）

**常见陷阱（3-4 行表格）：**
- 每条命令一个 RUN → 镜像层数过多 → 合并 RUN 用 &&
- 用 latest 标签 → 构建不可复现 → 用固定版本号
- root 运行容器 → 安全风险 → 用 USER 指令指定非 root 用户
- 忘记 .dockerignore → 镜像包含 node_modules/.git → 添加 .dockerignore

**看到什么就先想到这类：**
- "容器化/打包部署" → Docker
- "镜像/Dockerfile" → Docker 镜像构建
- "多容器编排/本地开发" → Docker Compose
- "进程隔离/资源限制" → Namespace + Cgroups

- [ ] **Step 2: Commit**

```bash
git add docs/engineering-practice/docker.md
git commit -m "docs: rewrite docker with unified template"
```

---

### Task 5: Create kubernetes.md

**Files:**
- Create: `docs/engineering-practice/kubernetes.md`

- [ ] **Step 1: Write kubernetes.md**

Create `docs/engineering-practice/kubernetes.md`. Follow unified template.

**Header:** title=Kubernetes, category=工程实践, level=⭐⭐⭐ 进阶, hot=🔥 高频

**核心要点 tip:** Kubernetes 是容器编排的事实标准，负责容器的部署、扩缩容和管理。面试重点：Master/Node 架构、Pod 生命周期、Service 类型、Deployment 滚动更新、探针配置。

**核心概念 section:**

1. K8s 架构 ASCII 图：

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

2. Master 组件表：

| 组件 | 职责 |
|------|------|
| API Server | 集群入口，所有操作通过 REST API |
| Scheduler | 决定 Pod 调度到哪个 Node |
| Controller Manager | 维护期望状态（ReplicaSet、Deployment 等控制器） |
| etcd | 分布式键值存储，保存集群所有状态 |

3. Node 组件表：

| 组件 | 职责 |
|------|------|
| kubelet | 管理 Pod 生命周期，向 API Server 汇报状态 |
| kube-proxy | 维护网络规则，实现 Service 负载均衡 |
| 容器运行时 | 运行容器（containerd、CRI-O） |

4. 核心资源对象表：

| 资源 | 作用 | 关系 |
|------|------|------|
| Pod | 最小调度单元，包含 1+ 容器 | 由 ReplicaSet 管理 |
| ReplicaSet | 维护 Pod 副本数 | 由 Deployment 管理 |
| Deployment | 声明式管理 Pod，支持滚动更新 | 面试最常问 |
| Service | 为 Pod 提供稳定访问入口 | ClusterIP/NodePort/LoadBalancer |
| ConfigMap | 存储非敏感配置 | 环境变量或挂载文件 |
| Secret | 存储敏感信息（密码、证书） | Base64 编码，非加密 |
| Ingress | HTTP/HTTPS 路由，七层负载均衡 | 需要 Ingress Controller |
| HPA | 水平自动伸缩 | 基于 CPU/内存/自定义指标 |

5. Pod 生命周期：Pending → Running → Succeeded/Failed，加 Init Container → Main Container → Prestop Hook

**典型场景 section（4 个）：**

场景 1：无状态应用部署（Deployment + Service + Ingress）
- YAML 示例：Deployment（3 副本）+ Service（ClusterIP）+ Ingress

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

场景 2：配置管理（ConfigMap + Secret）
- ConfigMap 用环境变量注入 vs 挂载文件
- Secret 用于数据库密码
- 简短 YAML 示例

场景 3：弹性伸缩（HPA）
- HPA YAML 示例（基于 CPU 50% 阈值，min 2, max 10）
- 解释 HPA 工作原理：Metrics Server → HPA Controller → 调整 replicas

场景 4：滚动更新与回滚
- strategy.type: RollingUpdate
- maxSurge / maxUnavailable 含义
- kubectl rollout undo 回滚命令

**面试常问 section（4 题）：**
- Pod 的生命周期是什么？（Pending→Running→Succeeded/Failed，解释每个阶段）
- Service 的三种类型及区别？（ClusterIP 集群内 / NodePort 暴露端口 / LoadBalancer 云厂商 LB）
- liveness 和 readiness 探针的区别？（liveness 失败重启容器，readiness 失败从 Service 摘除流量）
- K8s 如何实现服务发现？（Service 提供稳定 DNS 名，kube-proxy 维护 iptables/IPVS 规则转发到 Pod）

**常见陷阱（3-4 行表格）：**
- 不设 resource limits → 单 Pod 耗尽节点资源 → 始终设置 requests 和 limits
- liveness 和 readiness 用同一个探针 → 启动慢的应用反复重启 → readiness 的 initialDelaySeconds 要短，liveness 要长
- Secret 以为是加密的 → 实际只是 Base64 编码 → 需要配合 RBAC 和加密存储

**看到什么就先想到这类：**
- "容器编排/集群管理" → Kubernetes
- "自动伸缩/弹性" → HPA
- "滚动更新/零停机" → Deployment strategy
- "服务发现/负载均衡" → Service + Ingress
- "配置管理/密钥" → ConfigMap / Secret

- [ ] **Step 2: Commit**

```bash
git add docs/engineering-practice/kubernetes.md
git commit -m "docs: add kubernetes page with unified template"
```

---

### Task 6: Create redis.md

**Files:**
- Create: `docs/engineering-practice/redis.md`

- [ ] **Step 1: Write redis.md**

Create `docs/engineering-practice/redis.md`. Follow unified template.

**Header:** title=Redis 实战, category=工程实践, level=⭐⭐ 中级, hot=🔥 高频

**核心要点 tip:** Redis 是基于内存的键值存储，单线程 + IO 多路复用实现高性能。面试重点：5 种数据结构的场景选型、缓存策略、分布式锁实现、缓存穿透/击穿/雪崩的区别和解决方案。

**核心概念 section:**

1. 5 种数据结构 + 适用场景表：

| 类型 | 底层实现 | 典型场景 | 常用命令 |
|------|---------|---------|---------|
| String | SDS（Simple Dynamic String） | 缓存、计数器、分布式锁 | GET/SET/INCR/SETNX |
| Hash | ziplist / hashtable | 对象存储（用户信息） | HGET/HSET/HMSET/HGETALL |
| List | quicklist（ziplist + 双向链表） | 消息队列、最新列表 | LPUSH/RPOP/LRANGE |
| Set | intset / hashtable | 去重、交集（共同好友） | SADD/SMEMBERS/SINTER |
| ZSet | skiplist + hashtable | 排行榜、延迟队列 | ZADD/ZRANGE/ZRANGEBYSCORE |

2. 持久化对比表：

| 方式 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| RDB | 定时快照，fork 子进程写磁盘 | 恢复快，文件紧凑 | 可能丢失最后一次快照后的数据 |
| AOF | 记录每条写命令 | 数据安全性高（可配 everysec） | 文件大，恢复慢 |
| 混合持久化 | RDB 快照 + AOF 增量 | 兼顾恢复速度和数据安全 | Redis 4.0+ 支持 |

3. 内存淘汰策略表（8 种，按 volatile/allkeys 分组）：

| 策略 | 范围 | 规则 |
|------|------|------|
| volatile-lru | 有过期时间的 key | 最近最少使用 |
| volatile-ttl | 有过期时间的 key | 即将过期优先 |
| volatile-random | 有过期时间的 key | 随机淘汰 |
| volatile-lfu | 有过期时间的 key | 最不经常使用 |
| allkeys-lru | 所有 key | 最近最少使用（**最常用**） |
| allkeys-random | 所有 key | 随机淘汰 |
| allkeys-lfu | 所有 key | 最不经常使用 |
| noeviction | — | 不淘汰，写入报错（默认） |

**典型场景 section（3 个）：**

场景 1：缓存策略
- Cache Aside 模式（最常用）：读→先查缓存→miss→查 DB→写缓存；写→先更新 DB→删缓存
- 为什么是"删缓存"而不是"更新缓存"？（避免并发写导致脏数据）
- 延迟双删策略

场景 2：分布式锁
- 基础实现：`SET key value NX EX 30`
- 释放锁必须用 Lua 脚本保证原子性（先 GET 比对 value 再 DEL）
- Lua 脚本代码示例
- Redisson 的 WatchDog 机制（自动续期）
- Redis 主从架构下锁可能丢失（RedLock 方案简述）

```java
// 分布式锁 — 释放锁的 Lua 脚本
String luaScript =
    "if redis.call('get', KEYS[1]) == ARGV[1] then " +
    "  return redis.call('del', KEYS[1]) " +
    "else " +
    "  return 0 " +
    "end";
```

场景 3：缓存穿透 / 击穿 / 雪崩

| 问题 | 描述 | 解决方案 |
|------|------|---------|
| 穿透 | 查询不存在的数据，缓存和 DB 都 miss | 布隆过滤器 / 缓存空值（短 TTL） |
| 击穿 | 热点 key 过期瞬间大量请求打到 DB | 互斥锁（SETNX）/ 不过期 + 异步更新 |
| 雪崩 | 大量 key 同时过期 | TTL 加随机值 / 多级缓存 / 限流降级 |

**面试常问 section（4 题）：**
- Redis 为什么快？（纯内存、单线程无锁竞争、IO 多路复用 epoll、高效数据结构如 ziplist/skiplist）
- Redis 6.0 的多线程做了什么？（IO 线程多线程处理网络读写，命令执行仍然单线程）
- 大 key 问题怎么处理？（string > 10KB、集合 > 5000 元素。拆分、异步删除 UNLINK、定期扫描）
- 热 key 问题怎么处理？（本地缓存 + Redis 缓存两级、key 加后缀分散到多个 slot）

**常见陷阱（3-4 行表格）：**
- 缓存与 DB 双写不一致 → 数据错误 → 先更新 DB 再删缓存 + 延迟双删
- 分布式锁不设过期时间 → 锁永不释放 → 必须设 EX，用 WatchDog 续期
- 大 key 用 DEL 删除 → 阻塞主线程 → 用 UNLINK 异步删除
- 所有 key 用相同 TTL → 缓存雪崩 → TTL 加随机偏移

**看到什么就先想到这类：**
- "缓存/高性能读取" → Redis String/Hash
- "排行榜/Top-K" → Redis ZSet
- "分布式锁" → SETNX + Lua + Redisson
- "计数器/限流" → Redis INCR
- "去重/共同好友" → Redis Set
- "缓存穿透/击穿/雪崩" → 布隆过滤器/互斥锁/TTL随机

- [ ] **Step 2: Commit**

```bash
git add docs/engineering-practice/redis.md
git commit -m "docs: add redis page with unified template"
```

---

### Task 7: Create message-queue.md

**Files:**
- Create: `docs/engineering-practice/message-queue.md`

- [ ] **Step 1: Write message-queue.md**

Create `docs/engineering-practice/message-queue.md`. Follow unified template.

**Header:** title=消息队列, category=工程实践, level=⭐⭐ 中级, hot=🔥 高频

**核心要点 tip:** 消息队列实现异步解耦和削峰填谷。面试重点：消息模型（点对点 vs 发布订阅）、如何保证不丢失、如何保证顺序、如何幂等消费、Kafka 高吞吐原理。

**核心概念 section:**

1. 消息模型对比：

| 模型 | 特点 | 适用场景 |
|------|------|---------|
| 点对点（P2P） | 一条消息只被一个消费者处理 | 任务分发 |
| 发布订阅（Pub/Sub） | 一条消息被多个订阅者接收 | 事件广播 |

2. 主流消息队列对比表：

| 特性 | Kafka | RabbitMQ | RocketMQ |
|------|-------|----------|----------|
| 吞吐量 | 百万级/s | 万级/s | 十万级/s |
| 延迟 | ms 级 | μs 级 | ms 级 |
| 消息模型 | 发布订阅 | 两者都支持 | 两者都支持 |
| 消息回溯 | 支持（Offset） | 不支持 | 支持 |
| 语言 | Scala/Java | Erlang | Java |
| 适用场景 | 大数据/日志 | 业务消息 | 电商/金融 |

3. Kafka 核心概念图：

```
Producer → Topic ─┬─ Partition 0 → Consumer Group A
                   ├─ Partition 1 → Consumer Group A
                   └─ Partition 2 → Consumer Group A
                                  → Consumer Group B
```

- Topic：消息分类
- Partition：Topic 的分区，并行处理单元
- Consumer Group：消费者组，组内竞争消费，组间广播
- Offset：消费者在 Partition 中的消费位移

**典型场景 section（4 个）：**

场景 1：异步解耦
- 订单系统 → 消息队列 → 库存/积分/通知
- 好处：订单服务不依赖下游，下游故障不影响下单

场景 2：可靠投递（如何保证消息不丢失）
- 三个环节分别保证：
  - 生产者 → Broker：同步发送 + 确认（acks=all）
  - Broker 存储：持久化 + 多副本同步（ISR）
  - Broker → 消费者：手动提交 Offset（关闭自动提交）
- 表格总结三环节

场景 3：幂等消费
- 问题：消费者处理完但提交 Offset 前挂了 → 重启后重复消费
- 方案 1：数据库唯一键（INSERT IGNORE / ON DUPLICATE KEY）
- 方案 2：Redis SETNX 去重（消息 ID 作 key）
- 方案 3：业务状态机（已支付的订单不再扣款）

场景 4：消息积压处理
- 紧急扩容消费者实例
- 临时增加 Partition（Kafka）
- 消息转移到新 Topic + 批量消费

**面试常问 section（4 题）：**
- 如何保证消息不丢失？（三环节回答）
- 如何保证消息顺序？（Kafka：同一 key 发到同一 Partition，Partition 内有序）
- Kafka 为什么吞吐量高？（顺序写磁盘、零拷贝 sendfile、分区并行、批量发送+压缩）
- 消费者重平衡是什么？什么时候触发？（Consumer Group 成员变化或 Partition 数变化时，重新分配 Partition 给消费者）

**常见陷阱（3-4 行表格）：**
- 自动提交 Offset → 消费失败但 Offset 已提交 → 消息丢失 → 改手动提交
- 消费者处理时间太长 → 触发重平衡 → 调整 session.timeout 和 max.poll.interval
- 不做幂等处理 → 重复消费导致数据错误 → 唯一键/去重/状态机

**看到什么就先想到这类：**
- "异步/解耦/削峰" → 消息队列
- "事件驱动/广播通知" → 发布订阅
- "消息不丢失" → 三环节保证
- "消息顺序" → 同 Key 同 Partition
- "重复消费" → 幂等性设计
- "高吞吐日志" → Kafka

- [ ] **Step 2: Commit**

```bash
git add docs/engineering-practice/message-queue.md
git commit -m "docs: add message queue page with unified template"
```

---

### Task 8: Create microservice-governance.md

**Files:**
- Create: `docs/engineering-practice/microservice-governance.md`

- [ ] **Step 1: Write microservice-governance.md**

Create `docs/engineering-practice/microservice-governance.md`. Follow unified template.

**Header:** title=微服务治理, category=工程实践, level=⭐⭐⭐ 进阶, hot=🔥 高频

**核心要点 tip:** 微服务治理解决分布式系统的稳定性问题。面试重点：限流算法对比、熔断状态机、服务注册发现机制、服务雪崩的预防。

**核心概念 section:**

1. 微服务拆分原则：
- 单一职责（一个服务负责一个业务域）
- 高内聚低耦合（服务间通过 API 通信，避免共享数据库）
- 按业务域拆分（DDD 界限上下文）

2. 服务注册与发现：

```
Service A ──注册──→ Registry (Nacos/Eureka)
Service B ──注册──→ Registry
Service A ──发现──→ Registry ──返回 B 的地址──→ Service A ──调用──→ Service B
```

- 对比表：Nacos vs Eureka vs Consul

| 特性 | Nacos | Eureka | Consul |
|------|-------|--------|--------|
| 一致性模型 | AP/CP 可切换 | AP | CP |
| 配置中心 | 内置 | 无 | 有 |
| 健康检查 | 客户端+服务端 | 客户端心跳 | 多种方式 |
| 生态 | Spring Cloud Alibaba | Spring Cloud Netflix | 多语言 |

3. 限流算法对比表：

| 算法 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| 固定窗口 | 固定时间窗口内计数 | 简单 | 窗口边界突发 |
| 滑动窗口 | 窗口随时间滑动 | 平滑 | 内存占用大 |
| 漏桶 | 固定速率流出 | 绝对平滑 | 不能应对突发 |
| 令牌桶 | 固定速率放令牌，取到令牌才放行 | 允许突发 | 实现较复杂 |

4. 熔断器状态机：

```
     成功率恢复
  ┌──────────────┐
  ↓              │
关闭 ──失败率达阈值──→ 打开 ──超时后──→ 半开
  ↑                               │
  └────── 试探请求成功 ─────────────┘
```

**典型场景 section（4 个）：**

场景 1：限流（Sentinel 为例）
- 配置 QPS 阈值
- 代码示例：@SentinelResource 注解 + fallback 方法

```java
@SentinelResource(value = "getOrder", blockHandler = "handleBlock")
public Order getOrder(Long id) {
    return orderService.getById(id);
}

public Order handleBlock(Long id, BlockException e) {
    return Order.defaultOrder(); // 限流后的降级响应
}
```

场景 2：熔断
- 状态转换条件（失败率/慢调用率 > 阈值 → 打开 → 等待超时 → 半开 → 试探）
- Sentinel 熔断规则配置

场景 3：降级
- 三种降级策略：返回默认值、返回缓存、简化逻辑
- Feign + Sentinel fallback 示例

场景 4：超时与重试
- 指数退避：1s → 2s → 4s → 8s
- 最大重试次数
- 幂等接口才能重试（非幂等的 POST 不要重试）

**面试常问 section（4 题）：**
- 四种限流算法的区别和适用场景？
- 熔断器的三个状态是什么？怎么转换？
- 什么是服务雪崩？怎么防？（一个服务超时→调用方线程耗尽→级联故障。用限流+熔断+降级+超时控制）
- 注册中心选 AP 还是 CP？为什么？（互联网业务优先可用性选 AP/Nacos；金融等强一致场景选 CP/Consul）

**常见陷阱（3-4 行表格）：**
- 熔断阈值设太低 → 正常波动就触发熔断 → 根据历史数据设合理阈值
- 非幂等接口配了重试 → 重复扣款/下单 → 重试只用于幂等接口（GET、DELETE）
- 限流只在网关层做 → 内部调用绕过限流 → 关键服务自身也要限流

**看到什么就先想到这类：**
- "限流/QPS 控制" → 令牌桶/滑动窗口
- "熔断/circuit breaker" → Sentinel/Hystrix 状态机
- "降级/fallback" → 返回默认值/缓存
- "服务注册/发现" → Nacos/Eureka
- "配置中心" → Nacos Config/Apollo
- "服务雪崩" → 限流+熔断+降级组合拳

- [ ] **Step 2: Commit**

```bash
git add docs/engineering-practice/microservice-governance.md
git commit -m "docs: add microservice governance page with unified template"
```

---

### Task 9: Create monitoring-observability.md

**Files:**
- Create: `docs/engineering-practice/monitoring-observability.md`

- [ ] **Step 1: Write monitoring-observability.md**

Create `docs/engineering-practice/monitoring-observability.md`. Follow unified template. Reference existing `monitoring-logging.md` content for reuse but restructure completely.

**Header:** title=监控与可观测性, category=工程实践, level=⭐⭐ 中级, hot=🔥 高频

**核心要点 tip:** 可观测性由 Metrics、Logs、Traces 三大支柱构成，目标不只是知道"系统挂了"，而是能回答"为什么挂、哪里慢、影响了多少用户"。面试重点：三大支柱的区别、Prometheus 数据模型、四大黄金指标、SLI/SLO/SLA。

**核心概念 section:**

1. 三大支柱对比表：

| 支柱 | 特点 | 典型工具 | 适合回答 |
|------|------|---------|---------|
| Metrics（指标） | 聚合数值，时间序列 | Prometheus、InfluxDB | "系统整体趋势如何？" |
| Logs（日志） | 离散事件，详细上下文 | ELK、Loki | "具体发生了什么？" |
| Traces（链路追踪） | 请求全链路 | Jaeger、Zipkin、SkyWalking | "这个请求慢在哪？" |

2. Prometheus 数据模型（4 种 Metric 类型）：

| 类型 | 特点 | 使用场景 | 示例 |
|------|------|---------|------|
| Counter | 只增不减 | 请求总数、错误总数 | http_requests_total |
| Gauge | 可增可减 | 当前连接数、温度 | jvm_memory_used |
| Histogram | 分桶统计分布 | 请求延迟分布 | http_request_duration_seconds |
| Summary | 客户端计算分位数 | P99 延迟 | rpc_duration_seconds |

3. Prometheus 架构：

```
应用 ──/metrics──→ Prometheus Server ──→ Grafana
                        ↓
                   AlertManager ──→ 告警通知
```

4. ELK Stack 架构：

```
应用日志 → Filebeat → Logstash → Elasticsearch → Kibana
                    (采集)     (解析转换)    (存储索引)    (可视化)
```

5. 分布式链路追踪核心概念：Trace（一次完整请求）→ 多个 Span（一个服务调用）→ Parent-Child 关系

6. 四大黄金指标（Google SRE）：

| 指标 | 含义 | 关注点 |
|------|------|------|
| Latency（延迟） | 请求处理时间 | 区分成功和失败请求的延迟 |
| Traffic（流量） | 系统负载 | QPS、并发连接数 |
| Errors（错误率） | 失败请求比例 | HTTP 5xx / 总请求 |
| Saturation（饱和度） | 资源利用率 | CPU、内存、磁盘、连接池 |

7. SLI / SLO / SLA：

| 术语 | 定义 | 示例 |
|------|------|------|
| SLI（指标） | 衡量服务质量的具体指标 | 请求延迟 P99 |
| SLO（目标） | SLI 的目标值 | P99 < 200ms |
| SLA（协议） | 对外承诺 + 违约后果 | 可用性 99.9%，低于则赔偿 |

**典型场景 section（3 个）：**

场景 1：Prometheus + Grafana 监控体系
- 应用暴露 /metrics 端点（Spring Boot Actuator + Micrometer）
- Prometheus 拉取指标
- Grafana 配置 Dashboard
- AlertManager 告警规则示例（错误率 > 1% 持续 5 分钟）

```yaml
# Prometheus 告警规则示例
groups:
- name: app-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "错误率超过 1%"
```

场景 2：ELK 日志体系
- 日志规范：JSON 格式、包含 traceId
- Logstash 解析配置要点
- Kibana 查询语法

场景 3：告警设计
- 告警分级（P0-P3）
- 告警抑制（同类告警合并）
- 告警静默（维护窗口）
- 值班机制（PagerDuty/飞书 on-call）

**面试常问 section（4 题）：**
- 可观测性的三大支柱是什么？各自的特点？
- Prometheus 是 Pull 还是 Push 模式？为什么选 Pull？（Pull：Prometheus 主动拉，方便服务发现和健康检查。Push：Pushgateway 用于短生命周期任务）
- 如何排查线上慢接口？（Metrics 发现 P99 飙高 → Traces 定位慢 Span → Logs 查看具体错误）
- SLI、SLO、SLA 的区别？

**常见陷阱（3-4 行表格）：**
- 告警太多（alert fatigue） → 值班人员忽略告警 → 合理设阈值 + 告警分级
- 日志不带 traceId → 分布式链路无法串联 → 统一日志格式包含 traceId
- 只看平均值不看分位数 → P99 问题被掩盖 → 关注 P95/P99 而非 AVG

**看到什么就先想到这类：**
- "监控/告警/指标" → Prometheus + Grafana
- "日志收集/分析" → ELK Stack
- "请求链路/调用链" → Jaeger/SkyWalking
- "P99/延迟分布" → Histogram/Summary
- "SLO/可用性" → 四大黄金指标

- [ ] **Step 2: Commit**

```bash
git add docs/engineering-practice/monitoring-observability.md
git commit -m "docs: add monitoring and observability page with unified template"
```

---

### Task 10: Rewrite distributed-id.md

**Files:**
- Modify: `docs/engineering-practice/distributed-id.md`

- [ ] **Step 1: Write the new distributed-id.md**

Full rewrite of `docs/engineering-practice/distributed-id.md`. Follow unified template. The existing content (393 lines) has good material on snowflake — preserve the core ideas but restructure to match the template.

**Header:** title=分布式 ID 生成, category=工程实践, level=⭐⭐ 中级, hot=🔥 高频

**核心要点 tip:** 分布式系统中需要全局唯一且趋势递增的 ID。Snowflake（雪花算法）是最主流方案，理解其 64 位结构和时钟回拨处理是面试高频考点。

**核心概念 section:**

1. 为什么需要分布式 ID（分库分表、微服务、数据合并场景，复用现有内容的核心思路）

2. 方案对比表：

| 方案 | 全局唯一 | 趋势递增 | 性能 | 依赖 | 适用场景 |
|------|---------|---------|------|------|---------|
| UUID | ✅ | ❌ | 高 | 无 | 不做主键的场景（traceId） |
| 数据库自增 | ✅（单库） | ✅ | 低 | 数据库 | 小规模系统 |
| 雪花算法 | ✅ | ✅ | 高 | 时钟 | **最主流方案** |
| 号段模式 | ✅ | ✅ | 高 | 数据库 | 美团 Leaf |
| Redis INCR | ✅ | ✅ | 高 | Redis | 需要 Redis 的场景 |

3. 雪花算法 64 位结构：

```
0 | 00000000 00000000 00000000 00000000 00000000 0 | 00000 00000 | 000000000000
  |<---------- 41 bit 时间戳 ---------->|<-10bit->|<--12 bit-->|
  |           约 69 年                   | 机器ID  |  序列号    |
  |                                      |1024台   |4096/ms    |
```

**典型场景 section（3 个）：**

场景 1：雪花算法详解
- 64 位拆分详细解释
- Java 实现代码（简化版 ~30 行）
- 时钟回拨处理：等待 / 拒绝 / 扩展位预留

```java
public class SnowflakeIdWorker {
    private final long workerId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    private static final long EPOCH = 1609459200000L; // 2021-01-01
    private static final long WORKER_ID_BITS = 10L;
    private static final long SEQUENCE_BITS = 12L;
    private static final long MAX_SEQUENCE = ~(-1L << SEQUENCE_BITS);
    private static final long WORKER_ID_SHIFT = SEQUENCE_BITS;
    private static final long TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;

    public SnowflakeIdWorker(long workerId) {
        this.workerId = workerId;
    }

    public synchronized long nextId() {
        long timestamp = System.currentTimeMillis();
        if (timestamp < lastTimestamp) {
            throw new RuntimeException("时钟回拨，拒绝生成 ID");
        }
        if (timestamp == lastTimestamp) {
            sequence = (sequence + 1) & MAX_SEQUENCE;
            if (sequence == 0) { // 序列号溢出，等待下一毫秒
                while (timestamp <= lastTimestamp) {
                    timestamp = System.currentTimeMillis();
                }
            }
        } else {
            sequence = 0L;
        }
        lastTimestamp = timestamp;
        return ((timestamp - EPOCH) << TIMESTAMP_SHIFT)
             | (workerId << WORKER_ID_SHIFT)
             | sequence;
    }
}
```

场景 2：号段模式
- 原理：数据库批量取号（一次取 1000 个），本地分配
- 双 Buffer 优化：当前号段用到 10% 时异步加载下一段
- 优点：不依赖时钟，容忍数据库短暂不可用

场景 3：选型决策
- 不需要有序 → UUID
- 单机/小规模 → 数据库自增
- 高并发+有序 → 雪花算法
- 高可用+有序 → 号段模式（Leaf）
- 决策流程图（文字描述）

**面试常问 section（3 题）：**
- 雪花算法时钟回拨怎么处理？（三种策略：等待、拒绝生成、使用扩展位记录回拨次数）
- UUID 为什么不适合做数据库主键？（无序导致 B+ 树频繁页分裂、32 字节占用空间大、可读性差）
- 美团 Leaf 方案是什么？（同时支持号段模式和雪花算法，号段模式用双 Buffer 解决 DB 单点问题）

**常见陷阱（3 行表格）：**
- 雪花算法 workerId 重复 → ID 冲突 → 通过 ZooKeeper/数据库分配唯一 workerId
- 不处理时钟回拨 → ID 重复 → 至少做拒绝处理，生产环境用 NTP 平滑同步
- 号段用完才申请下一段 → 申请期间阻塞 → 双 Buffer 提前异步加载

**看到什么就先想到这类：**
- "全局唯一 ID" → 雪花算法
- "分库分表主键" → 雪花 / 号段模式
- "链路追踪 ID" → UUID（无序但简单）
- "高并发 ID 生成" → 雪花（本地生成，无网络开销）
- "时钟回拨" → 雪花算法的核心风险点

- [ ] **Step 2: Commit**

```bash
git add docs/engineering-practice/distributed-id.md
git commit -m "docs: rewrite distributed ID with unified template"
```

---

### Task 11: Build verification

**Files:** None (verification only)

- [ ] **Step 1: Run VitePress build**

```bash
npx vitepress build docs
```

Expected: Build completes successfully with no broken links.

- [ ] **Step 2: Verify all pages load**

Start dev server and manually verify each page loads:
```bash
npx vitepress dev docs
```

Check these URLs:
- /engineering-practice/
- /engineering-practice/design-patterns
- /engineering-practice/docker
- /engineering-practice/kubernetes
- /engineering-practice/redis
- /engineering-practice/message-queue
- /engineering-practice/microservice-governance
- /engineering-practice/monitoring-observability
- /engineering-practice/distributed-id
