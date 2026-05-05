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
| `FROM` | 指定基础镜像 | 尽量用 alpine 等轻量镜像 |
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
RUN mvn package -DskipTests

# 阶段二：使用轻量 JRE 运行
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
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

**效果：** 最终镜像不含 Maven、JDK 等构建工具，体积从 600MB+ 降至 ~100MB。

### 场景二：Docker Compose 多容器编排

本地开发或测试环境中，用 Compose 同时启动 Web 应用、数据库和缓存：

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
| 使用 `latest` 标签 | 构建结果不可复现，镜像可能悄悄变化 | 固定版本号，如 `node:18.20-alpine` |
| 以 `root` 用户运行容器 | 容器逃逸风险高，违反最小权限原则 | 用 `USER` 指令指定非 root 用户 |
| 忘记 `.dockerignore` | 构建上下文包含 `node_modules`/`.git`，构建慢且镜像大 | 添加 `.dockerignore` 排除无关文件 |

---

## 看到什么就先想到这类

- **"容器化/打包部署"** → Docker
- **"镜像/Dockerfile"** → Docker 镜像构建
- **"多容器编排/本地开发环境"** → Docker Compose
- **"进程隔离/资源限制"** → Namespace + Cgroups
