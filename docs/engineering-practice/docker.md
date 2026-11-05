---
title: Docker 容器化
---

# Docker 容器化

<span class="dig-tag dig-tag--category">工程实践</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Docker 通过 Namespace（隔离）和 Cgroups（资源限制）实现轻量级容器。面试重点：容器 vs VM、镜像分层原理、Dockerfile 最佳实践、CMD vs ENTRYPOINT。
:::

---

## 核心概念

### 容器 vs 虚拟机

```
虚拟机架构                              Docker 容器架构
┌──────────────────────────┐           ┌──────────────────────────┐
│  App A     │  App B      │           │  App A     │  App B      │
├────────────┼─────────────┤           ├────────────┼─────────────┤
│  Guest OS  │  Guest OS   │           │  Libs      │  Libs       │
├────────────┴─────────────┤           ├─────────────────────────┤
│        Hypervisor        │           │      Docker Engine       │
├──────────────────────────┤           ├──────────────────────────┤
│         Host OS          │           │         Host OS          │
├──────────────────────────┤           ├──────────────────────────┤
│         Hardware         │           │         Hardware         │
└──────────────────────────┘           └──────────────────────────┘
```

| 维度 | 虚拟机 (VM) | Docker 容器 |
|------|------------|------------|
| **隔离级别** | 硬件级（完整 OS 隔离） | 进程级（共享宿主机内核） |
| **启动速度** | 分钟级 | 秒级 |
| **资源占用** | GB 级（含完整 Guest OS） | MB 级 |
| **性能损耗** | 较大（Hypervisor 层开销） | 极小（接近原生） |
| **安全性** | 更强（内核级隔离） | 相对较弱（共享内核） |

### Docker 核心概念三角：镜像 → 容器 → 仓库

- **镜像（Image）：** 只读模板，包含运行应用所需的代码、运行时、库和配置。通过 Dockerfile 构建，采用分层存储。
- **容器（Container）：** 镜像的运行实例。在只读镜像层之上叠加一个可写层，所有运行时写操作都记录在该可写层。
- **仓库（Registry）：** 存储和分发镜像的服务，类似代码托管平台。公共仓库如 Docker Hub，私有仓库如 Harbor、阿里云 ACR。

### 镜像分层存储原理（Union FS）

Docker 使用**联合文件系统（Union File System）** 将多个只读层叠加，在最上层添加可写层：

```
┌────────────────────────────┐
│  可写层（Container Layer）  │  ← 容器运行时的修改、日志等
├────────────────────────────┤
│  镜像层 N（只读）            │  ← COPY app.jar .
├────────────────────────────┤
│  镜像层 N-1（只读）          │  ← RUN mvn package
├────────────────────────────┤
│  ...                       │
├────────────────────────────┤
│  Base 镜像层（只读）         │  ← FROM eclipse-temurin:17-jre
└────────────────────────────┘
```

多个容器可共享同一镜像的所有只读层，节省磁盘空间；构建时若某层上下文未变，直接复用缓存，加速构建。

### Namespace & Cgroups

| 技术 | 类型 | 作用 |
|------|------|------|
| **PID Namespace** | Namespace | 隔离进程 ID，容器内 PID=1 对应宿主机某个 PID |
| **Network Namespace** | Namespace | 隔离网络接口、IP、路由表 |
| **Mount Namespace** | Namespace | 隔离文件系统挂载点 |
| **Cgroups CPU** | Cgroups | 限制容器可使用的 CPU 配额 |
| **Cgroups Memory** | Cgroups | 限制容器可使用的内存上限 |
| **Cgroups I/O** | Cgroups | 限制磁盘读写速率 |

> **记忆口诀：** Namespace 负责"看不见"（隔离视图），Cgroups 负责"用不多"（资源配额）。

### Dockerfile 核心指令

| 指令 | 用途 | 注意事项 |
|------|------|---------|
| `FROM` | 指定基础镜像 | 按运行时、libc、native 依赖和安全维护选择，体积不是唯一标准 |
| `RUN` | 执行命令并创建新层 | 多条命令用 `&&` 合并，末尾清理缓存 |
| `COPY` | 复制本地文件到镜像 | 推荐用 COPY，比 ADD 更透明 |
| `ADD` | 复制文件（支持 URL、自动解压 tar） | 仅在需要解压时使用 |
| `CMD` | 容器默认启动命令 | 可被 `docker run` 末尾参数覆盖 |
| `ENTRYPOINT` | 容器入口点 | 不可被普通参数覆盖，CMD 作为其参数追加 |
| `EXPOSE` | 声明容器监听端口 | 仅为文档声明，不自动发布端口 |
| `ENV` | 设置环境变量 | 在后续所有层均生效 |
| `VOLUME` | 声明挂载点 | 持久化数据必须使用 Volume |

---

## 典型场景与最佳实践

### 场景一：编写高效 Dockerfile（Java 多阶段构建）

多阶段构建将构建环境与运行环境分离，最终镜像只包含运行时所需内容：

```dockerfile
# 阶段一：使用 Maven 编译打包
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn -B verify

# 阶段二：使用轻量 JRE 运行
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S -G app app
COPY --from=builder --chown=app:app /app/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

配套的 `.dockerignore` 文件，避免不必要的文件进入构建上下文：

```
target/
.git/
*.log
.idea/
*.iml
```

运行时镜像不包含 Maven 等构建工具；实际体积由依赖与基础镜像决定。示例要求 target 中只有一个目标 JAR，真实项目应使用确定的制品路径。若在镜像构建中跳过测试，CI 必须先验证相同源码产生的制品，不能让 `-DskipTests` 成为默认质量门禁。

### 场景二：Docker Compose 多容器编排

本地开发或测试环境中，用 Compose 同时启动 Web 应用、数据库和缓存：

```yaml
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
      - "127.0.0.1:6379:6379"
volumes:
  mysql-data:
```

这是本地编排结构示例，不是生产配置：数据库密码应由本地安全配置或 secret 注入，应用还需配置自己的数据库账号。短格式 `depends_on` 只控制启动依赖，不保证数据库已经就绪；需要 healthcheck 与相应条件，并在应用侧保留有界连接重试。仅容器间访问的 Redis 不需要发布宿主机端口。

```bash
# 启动所有服务（后台运行）
docker compose up -d

# 查看日志
docker compose logs -f app

# 停止并清理
docker compose down
```

### 场景三：容器网络模型

Docker 提供三种内置网络模式，根据场景选择：

| 网络模式 | 隔离性 | 适用场景 |
|---------|--------|---------|
| **bridge**（默认） | 容器间通过虚拟网桥通信，与宿主机隔离 | 多容器应用、Compose 编排 |
| **host** | 直接使用宿主机网络栈，无端口映射 | 追求极低延迟、高性能场景 |
| **none** | 完全禁用网络 | 批处理任务、安全沙箱 |

---

## 面试常问 & 怎么答

**Q：CMD vs ENTRYPOINT 的区别？**

`CMD` 定义默认命令，可以被 `docker run` 末尾的参数**完全覆盖**。`ENTRYPOINT` 定义容器入口点，普通参数**不能覆盖**，而是作为追加参数传给 ENTRYPOINT。两者组合使用时，CMD 作为 ENTRYPOINT 的默认参数：

```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
CMD ["--spring.profiles.active=prod"]
# 运行：java -jar app.jar --spring.profiles.active=prod
# 覆盖：docker run myapp --spring.profiles.active=dev
```

---

**Q：COPY vs ADD 的区别？**

`ADD` 功能更多（支持 URL 下载、自动解压 `.tar` 文件），但行为不透明，难以预测。`COPY` 语义清晰，只做文件复制。**推荐优先使用 COPY**，只有明确需要解压 tar 包时才用 ADD。

---

**Q：Docker 容器如何实现隔离？**

依赖两个 Linux 核心特性：**Namespace** 实现资源视图隔离（PID、Network、Mount 等六种命名空间，让容器"看不见"宿主机和其他容器的资源）；**Cgroups** 实现资源用量限制（CPU、内存、I/O 的配额上限）。两者结合，Namespace 管"隔离视图"，Cgroups 管"资源配额"。

---

**Q：如何减小 Docker 镜像体积？**

1. 选用 **alpine 等轻量基础镜像**（alpine 仅 ~5MB，远小于 ubuntu 的 ~72MB）
2. **多阶段构建**，运行时镜像不含构建工具（如 Maven、JDK 换成 JRE）
3. **合并 RUN 指令**，减少镜像层数，并在同一层内清理包管理器缓存
4. 配置 **.dockerignore**，排除 `.git`、`node_modules`、日志等无用文件

---

## 常见陷阱

| 错误做法 | 问题 | 正确做法 |
|---------|------|---------|
| 每条命令单独一个 `RUN` | 镜像层数过多，体积膨胀 | 合并 `RUN`，用 `&&` 连接并清理缓存 |
| 只依赖可变 tag | 相同标签可能指向不同镜像 | 部署固定 digest，并配合受控更新流程 |
| 以 `root` 用户运行容器 | 容器逃逸风险高，违反最小权限原则 | 用 `USER` 指令指定非 root 用户 |
| 忘记 `.dockerignore` | 构建上下文包含 `node_modules`/`.git`，构建慢且镜像大 | 添加 `.dockerignore` 排除无关文件 |

---

## 深入：可复现构建与供应链

### 固定 tag 为什么还不够？

tag 是可变引用，digest 标识特定内容。构建应记录基础镜像 digest、依赖锁定文件、编译器和构建参数，发布时让同一 digest 逐级晋升。多架构镜像的 manifest list 与某一平台镜像 digest 也要区分，测试的架构应与生产匹配。

固定 digest 只能避免内容悄悄变化，不会自动获得安全更新。需要定期重新构建、扫描、测试和推广新 digest；不能以“可复现”为由无限期保留已知漏洞。

### Secrets 不能先 COPY 再删除

镜像层保留历史，后续 `RUN rm secret` 不会抹掉早期层里的秘密；ARG、ENV、构建日志与缓存也可能泄露。BuildKit secret/SSH mount 可让构建临时访问凭据，但命令仍不能把内容复制到最终制品或打印到日志。

以下是构建阶段片段，假设调用方已提供名为 maven-settings 的 secret：

```dockerfile
RUN --mount=type=secret,id=maven-settings,target=/root/.m2/settings.xml \
  mvn -B verify
```

`.dockerignore` 是缩小构建上下文的一层防线，不是秘密扫描或访问权限控制的替代。发布仓库访问令牌应最小权限、短时有效，CI 对不可信 PR 不授予生产凭据。

### SBOM、漏洞扫描、签名分别证明什么？

| 机制 | 主要回答 | 不证明 |
|------|----------|--------|
| SBOM | 制品包含哪些已识别组件与版本 | 组件没有漏洞，或应用不可被攻击 |
| 漏洞扫描 | 已知漏洞库中有哪些匹配项 | 零日漏洞不存在、所有发现都可利用 |
| 制品签名与身份验证 | 该制品由受信身份签发，内容未改变 | 签发者的代码一定正确或无恶意 |
| 构建 provenance | 制品与源码、构建流程的来源关系 | 构建环境绝对可信 |
| 准入策略 | 是否满足组织要求才允许部署 | 运行时权限与网络攻击面已自动最小化 |

签名必须验证可信身份、发行者和被签名 digest，而不只是“签名文件存在”。扫描策略应记录例外、可利用性、修复期限和负责人，不能永久忽略告警。

### 运行时隔离的最后边界

非 root、只读根文件系统、drop capabilities、seccomp、受控挂载与最小网络权限相互补充。把 Docker socket 挂进应用、使用 privileged 或挂宿主机敏感路径，可能绕过原先隔离假设。rootless 降低一部分 daemon/容器权限风险，但不等于任意不可信代码都可安全运行。

镜像精简后要提前设计调试路径：distroless 可能没有 shell，不能临时依赖 `docker exec sh`。CPU/内存限制、PID 1 信号处理与连接排空也应纳入上线测试，关联 [Kubernetes](./kubernetes) 和 [测试策略与可靠交付](./testing-and-delivery)。

## 看到什么就先想到这类

- **"容器化/打包部署"** → Docker
- **"镜像/Dockerfile"** → Docker 镜像构建
- **"多容器编排/本地开发环境"** → Docker Compose
- **"进程隔离/资源限制"** → Namespace + Cgroups
