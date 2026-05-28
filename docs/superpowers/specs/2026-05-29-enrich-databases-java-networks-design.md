# 丰富数据库/Java/计算机网络三板块设计文档

## 背景

系统设计板块（13个文件）已完成丰富，新增30+个Mermaid图。现有数据库、Java编程语言、计算机网络三个板块共19个文件，**全部为0个Mermaid图**，内容深度不足，需要同步丰富。

## 目标

- 每个核心文件新增 3-5 个 Mermaid 图（sequenceDiagram / stateDiagram / flowchart / graph）
- 补充面试高频 Q&A 深度讲解
- 增加代码示例和对比表格
- 与系统设计板块保持风格一致

## 改动范围

### 板块一：数据库（4 文件）

#### `docs/databases/transaction-lock.md`（378行，高优先级）
- MVCC 版本链时间线图：trx_id/roll_pointer 链接结构，ReadView 可见性判断 flowchart
- 死锁示例时序图：两事务交叉加锁 → 检测 → 回滚
- Next-Key Lock 范围区间示意图
- RC vs RR 隔离级别下 MVCC 行为差异对比

#### `docs/databases/indexing.md`（233行，高优先级）
- B+ 树查询路径图：根节点 → 叶子节点索引定位流程
- 索引失效 6 种场景代码示例（函数/隐式转换/like前缀通配等）
- 回表 vs 覆盖索引对比图（IO 次数可视化）
- 联合索引最左前缀图解

#### `docs/databases/redis.md`（446行，高优先级）
- 部署方案演进图：单机 → 主从复制 → Sentinel → Cluster
- Cluster 16384 槽位分片图 + 节点扩缩容流程
- RDB vs AOF 持久化时间轴对比
- 缓存击穿/穿透/雪崩三场景流程图及解决方案汇总表

#### `docs/databases/mysql-architecture.md`（238行，中优先级）
- redo log / binlog 两阶段提交时序图
- Buffer Pool LRU 改进版淘汰流程图
- 扩充高频 Q&A（1题 → 5题）

### 板块二：Java 编程语言（2 文件）

#### `docs/programming-languages/java-concurrency.md`（432行，高优先级）
- AQS 状态机图：acquire/release + CLH 队列节点状态转换
- 线程池任务执行完整流程图：提交→核心线程→队列→最大线程→拒绝四路分支
- CAS 原理 + ABA 问题时序图（version stamp 解决方案）
- ThreadLocal 内存泄漏 GC 根可达性图解

#### `docs/programming-languages/jvm-internals.md`（391行，高优先级）
- GC 算法演进对比表：Serial/Parallel/CMS/G1/ZGC 停顿/吞吐/适用场景
- G1 Region 布局图：Eden/Survivor/Old/Humongous
- 三种 OOM 类型诊断流程图 + 常见原因表
- JIT 逃逸分析示意图：栈分配 vs 堆分配

### 板块三：计算机网络（2 文件）

#### `docs/computer-networks/tcp-udp.md`（228行，高优先级）
- TCP 完整状态机图（stateDiagram-v2）：CLOSED→SYN_SENT→...→TIME_WAIT→CLOSED
- 滑动窗口工作原理图：发送/接收缓冲区 + 窗口滑动
- 拥塞控制四阶段图：慢启动→拥塞避免→快重传→快恢复（ssthresh标注）
- TIME_WAIT 原因与 MSL 计算说明

#### `docs/computer-networks/http-https.md`（191行，高优先级）
- TLS 1.2 握手完整时序图：ClientHello→Certificate→Finished（RTT标注）
- 证书链验证流程图：Root CA → Intermediate CA → End Entity
- HTTP 缓存决策树：强缓存 → 协商缓存优先级
- HTTP/1.1 vs 2 vs 3 队头阻塞对比图

## 执行策略

三板块并行，每板块使用独立 Agent 同时处理，减少总时间。预计新增 30+ 个 Mermaid 图，每文件增加 100-200 行。

## 验证方式

- `npm run docs:dev` 本地预览，逐页检查 Mermaid 是否正确渲染
- 检查中文排版与格式一致性
