---
title: Docker 容器化
---

# Docker 容器化

<span class="dig-tag dig-tag--category">系统设计与工程实践</span>
<span class="dig-tag dig-tag--medium">⭐⭐ 中级</span>
<span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 核心要点
Docker 通过 Linux 的 Namespace（隔离）和 Cgroups（资源限制）实现轻量级容器，相比虚拟机没有 Hypervisor 和 Guest OS 的开销。镜像采用分层存储（Union FS），多个容器共享只读层，极大节省存储空间。
:::

## 容器 vs 虚拟机

Docker 容器和虚拟机（VM）都提供隔离环境，但实现原理截然不同：

```
虚拟机架构                        Docker 容器架构
┌──────────────────────┐          ┌──────────────────────┐
│  App A  │  App B     │          │  App A  │  App B     │
├─────────┼────────────┤          ├─────────┼────────────┤
│ Guest OS│ Guest OS   │          │  Libs   │  Libs      │
├─────────┴────────────┤          ├──────────────────────┤
│     Hypervisor       │          │    Docker Engine      │
├──────────────────────┤          ├──────────────────────┤
│       Host OS        │          │       Host OS        │
├──────────────────────┤          ├──────────────────────┤
│      Hardware        │          │      Hardware        │
└──────────────────────┘          └──────────────────────┘
```

| 维度 | 虚拟机 (VM) | Docker 容器 |
|------|------------|------------|
| **隔离级别** | 硬件级（完整 OS 隔离） | 进程级（共享宿主机内核） |
| **启动时间** | 分钟级 | 秒级 |
| **镜像大小** | GB 级（含完整 OS） | MB 级 |
| **性能开销** | 较大（Hypervisor 层） | 极小（接近原生） |
| **安全性** | 更强（内核级隔离） | 相对较弱（共享内核） |
| **资源密度** | 低（每个 VM 独占 OS） | 高（同一宿主机可跑数百容器） |
| **适用场景** | 强隔离需求、不同 OS | 微服务、CI/CD、快速部署 |

## 核心概念

### 镜像（Image）

镜像是容器的**只读模板**，包含运行应用所需的代码、运行时、库、配置文件等。

- 通过 Dockerfile 构建
- 存储在镜像仓库（Docker Hub、阿里云 ACR、私有 Registry）
- 采用**分层存储**（每条 Dockerfile 指令对应一层）

### 容器（Container）

容器是镜像的**运行实例**，相当于在只读镜像上加了一个可写层（Container Layer）：

```
┌──────────────────────────┐
│   可写层 (Container Layer)│  ← 容器运行时的修改、日志等
├──────────────────────────┤
│   镜像层 N（只读）         │
├──────────────────────────┤
│   镜像层 N-1（只读）       │
├──────────────────────────┤
│   ...                    │
├──────────────────────────┤
│   Base 镜像层（只读）      │  ← 如 ubuntu, alpine 等
└──────────────────────────┘
```

多个容器可以共享同一镜像的只读层，节省磁盘空间。

### Dockerfile

Dockerfile 是构建镜像的文本脚本，每条指令创建一个新的镜像层：

```dockerfile
# 选择基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 先复制 package.json（利用 Docker 缓存层机制）
COPY package*.json ./

# 安装依赖（单独一层，依赖不变时可直接用缓存）
RUN npm ci --only=production

# 复制源代码（代码变动不会影响依赖层缓存）
COPY . .

# 构建
RUN npm run build

# 暴露端口（仅声明，不自动映射）
EXPOSE 3000

# 指定启动命令（推荐 ENTRYPOINT + CMD 组合）
CMD ["node", "dist/main.js"]
```

### Registry（镜像仓库）

存储和分发镜像的服务，类似代码托管平台：

- **公共仓库：** Docker Hub（`docker.io`）
- **私有仓库：** 自建（Harbor）或云厂商（阿里云 ACR、AWS ECR）

## 镜像分层原理（Union FS）

Docker 使用**联合文件系统（Union File System）** 实现镜像分层，将多个只读层叠加，并在最上层添加一个可写层：

```
# 构建过程中，每条指令创建一层
FROM alpine             → Layer A: alpine 基础层 (5MB)
RUN apk add curl        → Layer B: curl 安装层 (3MB)
RUN apk add bash        → Layer C: bash 安装层 (1.5MB)
COPY app.js .           → Layer D: 应用代码层 (0.1MB)
```

**缓存复用的关键：** 若 Layer A、B、C 没有变化，Docker Build 时可以直接复用缓存，只重建 Layer D，极大加速构建速度。

### Dockerfile 最佳实践

```dockerfile
# 1. 使用多阶段构建（Multi-stage Build）减小最终镜像体积
FROM node:18 AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime    # 最终镜像不含构建工具
WORKDIR /app
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]

# 2. 合并 RUN 指令，减少层数（但注意可读性 vs 缓存效率的权衡）
# 错误：每个 apt install 一层，层数多
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git

# 正确：合并为一层，且清理缓存
RUN apt-get update && \
    apt-get install -y curl git && \
    rm -rf /var/lib/apt/lists/*

# 3. 用 .dockerignore 排除不需要的文件
# .dockerignore 文件内容：
# node_modules
# .git
# *.log
# dist
```

## 常用 Docker 命令

```bash
# 镜像操作
docker pull nginx:latest               # 拉取镜像
docker images                          # 列出本地镜像
docker build -t myapp:1.0 .            # 构建镜像
docker push myregistry/myapp:1.0       # 推送镜像
docker rmi myapp:1.0                   # 删除镜像

# 容器操作
docker run -d -p 8080:80 nginx         # 后台运行，端口映射
docker run -it ubuntu bash             # 交互模式
docker ps                              # 查看运行中容器
docker ps -a                           # 查看所有容器（含已停止）
docker stop <container_id>             # 停止容器
docker rm <container_id>               # 删除容器
docker logs -f <container_id>          # 实时查看日志
docker exec -it <container_id> bash    # 进入运行中的容器

# 数据卷
docker run -v /host/path:/container/path nginx  # 挂载目录
docker volume create mydata                      # 创建命名卷
docker volume ls                                 # 列出卷

# 资源限制
docker run -m 512m --cpus 1.5 nginx    # 限制内存 512MB，CPU 1.5 核
```

## Docker 底层技术

Docker 的容器隔离依赖两个 Linux 核心特性：

### Namespace（命名空间）- 隔离

| Namespace | 隔离内容 |
|-----------|---------|
| **PID** | 进程 ID（容器内 PID=1 对应宿主机某个 PID） |
| **Network** | 网络接口、IP、路由表 |
| **Mount** | 文件系统挂载点 |
| **UTS** | 主机名和域名 |
| **IPC** | 进程间通信（共享内存、消息队列） |
| **User** | 用户和组 ID 映射 |

### Cgroups（控制组）- 资源限制

```bash
# Cgroups 限制 CPU 使用量（50%）
echo 50000 > /sys/fs/cgroup/cpu/docker/<container_id>/cpu.cfs_quota_us

# Cgroups 限制内存使用量（256MB）
echo 268435456 > /sys/fs/cgroup/memory/docker/<container_id>/memory.limit_in_bytes
```

这就是为什么 Docker 速度快但隔离性不如 VM——所有容器共享同一个宿主机内核，Namespace 只是让容器"看起来"有独立的环境。

## 常见误区

::: warning 易错点
1. **EXPOSE 只是声明，不会自动发布端口**，真正发布端口需要在 `docker run` 时用 `-p <host>:<container>` 指定
2. **容器内数据不持久**，容器删除后可写层随之消失。需要数据持久化必须使用 Volume（数据卷）或 Bind Mount
3. **不要在容器内用 root 运行应用**，这是安全最佳实践，应在 Dockerfile 中用 `USER` 指令切换到非特权用户
4. **多阶段构建**可以大幅缩小镜像体积，构建工具（compiler、test tools）不会出现在最终镜像中，生产镜像体积从 1GB+ 可瘦身到 100MB 以内
:::

<div class="dig-questions">
  <div class="dig-questions__header">
    <span>📝 面试真题</span>
    <span style="font-size: 12px; opacity: 0.8;">3 道高频</span>
  </div>
  <div class="dig-questions__item">
    <span>1. Docker 容器和虚拟机有什么区别？各自的适用场景是什么？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>2. Docker 镜像的分层原理是什么？为什么说镜像是只读的？</span>
    <span class="dig-tag dig-tag--medium" style="margin: 0;">中等</span>
  </div>
  <div class="dig-questions__item">
    <span>3. Docker 底层用了哪些 Linux 技术？如何实现资源隔离和限制？</span>
    <span class="dig-tag dig-tag--hard" style="margin: 0;">困难</span>
  </div>
</div>

### Q1: Docker vs 虚拟机

**核心区别：** 虚拟机通过 Hypervisor 模拟完整硬件，包含完整的 Guest OS；Docker 容器直接运行在宿主机内核上，用 Namespace 和 Cgroups 实现隔离。

**优势对比：**
- Docker：启动快（秒级）、体积小（MB 级）、资源利用率高
- VM：隔离性更强（内核级隔离）、支持不同操作系统

**适用场景：**
- Docker：微服务部署、CI/CD 环境、快速打包分发
- VM：需要强隔离（安全合规要求）、需要不同操作系统内核

### Q2: 镜像分层原理

镜像是**只读的分层联合文件系统**，每条 Dockerfile 指令创建一个只读层（Layer）。

运行容器时，Docker 在所有只读层上叠加一个**可写层**（Container Layer），容器内的所有写操作都记录在这个可写层，不影响原始镜像层。

**分层的好处：**
1. **共享（节省存储）：** 基础层（如 ubuntu）被多个镜像共享，磁盘只存一份
2. **缓存（加速构建）：** 构建时如果某层的上下文未变，直接复用缓存层

### Q3: 底层 Linux 技术

Docker 依赖两个核心技术：
1. **Namespace（命名空间）实现隔离：** PID、Network、Mount、UTS、IPC、User 六种命名空间，让每个容器"看起来"拥有独立的进程树、网络、文件系统等
2. **Cgroups（Control Groups）实现资源限制：** 限制容器可使用的 CPU、内存、I/O、网络带宽等资源上限

两者结合：Namespace 负责让容器看不到宿主机和其他容器的资源（隔离视图），Cgroups 负责限制容器能使用多少资源（资源配额）。

## 延伸阅读

- [Docker 官方文档](https://docs.docker.com/)
- [Docker 从入门到实践](https://vuepress.mirror.docker-practice.com/) — 开源中文教程
- [万字长文：彻底搞懂 Docker 网络模型](https://www.cnblogs.com/bakari/p/10601938.html)
