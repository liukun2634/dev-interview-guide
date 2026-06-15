import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: '程序员面试手册',
  description: '系统化的程序员面试知识体系，涵盖算法、系统设计、数据库、AI 等 9 大领域，含代码示例与高频真题',
  lang: 'zh-CN',
  base: '/dev-interview-guide/',
  ignoreDeadLinks: true,
  srcExclude: ['**/superpowers/**', '**/devops/**'],

  sitemap: {
    hostname: 'https://liukun2634.github.io/dev-interview-guide',
  },

  head: [
    ['meta', { name: 'keywords', content: '程序员面试,算法,数据结构,系统设计,数据库,操作系统,计算机网络,Java,Docker,AI,LLM,面试题' }],
    ['meta', { name: 'author', content: 'Dev Interview Guide' }],
    ['meta', { name: 'theme-color', content: '#0969da' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Dev Interview Guide' }],
    ['meta', { property: 'og:title', content: 'Dev Interview Guide — 程序员面试知识体系' }],
    ['meta', { property: 'og:description', content: '系统化的程序员面试知识体系，涵盖算法、系统设计、数据库、AI 等 9 大领域，含代码示例与高频真题' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Dev Interview Guide — 程序员面试知识体系' }],
    ['meta', { name: 'twitter:description', content: '系统化的程序员面试知识体系，涵盖算法、系统设计、数据库、AI 等 9 大领域' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/dev-interview-guide/favicon.svg' }],
  ],

  markdown: {
    config: (md) => {
      md.use(mathjax3)
    },
  },

  themeConfig: {
    nav: [],

    sidebar: {
      '/data-structures-and-algorithms/': [
        {
          text: '基础知识',
          collapsed: false,
          items: [
            { text: '一般流程', link: '/data-structures-and-algorithms/foundations/problem-solving-workflow' },
            { text: '算法技巧', link: '/data-structures-and-algorithms/foundations/algorithm-patterns' },
            { text: '基础算法模板', link: '/data-structures-and-algorithms/foundations/basic-templates' },
            { text: '高阶算法模板', link: '/data-structures-and-algorithms/foundations/advanced-templates' },
            { text: 'Java 环境配置', link: '/data-structures-and-algorithms/foundations/java-problem-solving-basics' },
            { text: '调试技巧', link: '/data-structures-and-algorithms/foundations/debug-and-review' },
            { text: 'AI 时代刷题', link: '/data-structures-and-algorithms/foundations/ai-assisted-practice' },
          ],
        },
        {
          text: '数组与字符串',
          collapsed: false,
          items: [
            { text: '概念与技巧', link: '/data-structures-and-algorithms/arrays/' },
            { text: '双指针', link: '/data-structures-and-algorithms/arrays/two-pointers' },
            { text: '滑动窗口', link: '/data-structures-and-algorithms/arrays/sliding-window' },
            { text: '前缀和与差分', link: '/data-structures-and-algorithms/arrays/prefix-sum-difference' },
            { text: '二分查找', link: '/data-structures-and-algorithms/arrays/binary-search' },
            { text: 'Fisher-Yates 洗牌（工程）', link: '/data-structures-and-algorithms/arrays/shuffle' },
            { text: 'AC 自动机（工程）', link: '/data-structures-and-algorithms/arrays/aho-corasick' },
            { text: 'RoaringBitmap（工程）', link: '/data-structures-and-algorithms/arrays/roaring-bitmap' },
            { text: 'GeoHash 附近搜索（工程）', link: '/data-structures-and-algorithms/arrays/geohash' },
            { text: '令牌桶/漏桶手撕（工程）', link: '/data-structures-and-algorithms/arrays/rate-limiter' },
          ],
        },
        {
          text: '链表',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/linked-list/' },
            { text: '链表题处理框架', link: '/data-structures-and-algorithms/linked-list/linked-list-basics' },
          ],
        },
        {
          text: '栈与队列',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/stack-queue/' },
            { text: '顺序结构处理框架', link: '/data-structures-and-algorithms/stack-queue/stack-queue-basics' },
            { text: '电梯调度系统（工程）', link: '/data-structures-and-algorithms/stack-queue/elevator-scheduling' },
          ],
        },
        {
          text: '哈希',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/hash/' },
            { text: '哈希表', link: '/data-structures-and-algorithms/hash-table' },
            { text: 'LFU 缓存（工程）', link: '/data-structures-and-algorithms/hash/lfu-cache' },
            { text: 'O(1) 插删随机（工程）', link: '/data-structures-and-algorithms/hash/randomized-set' },
            { text: '设计 Twitter（工程）', link: '/data-structures-and-algorithms/hash/twitter-design' },
            { text: '停车场系统设计（工程）', link: '/data-structures-and-algorithms/hash/parking-lot' },
            { text: '🔥 Bloom Filter 与变种（工程）', link: '/data-structures-and-algorithms/hash/bloom-filter' },
          ],
        },
        {
          text: '树与堆',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/tree/' },
            { text: '二叉树', link: '/data-structures-and-algorithms/binary-tree' },
            { text: '二叉搜索树', link: '/data-structures-and-algorithms/tree/binary-search-tree' },
            { text: '堆与优先队列', link: '/data-structures-and-algorithms/tree/heap-priority-queue' },
            { text: 'Trie 字典树', link: '/data-structures-and-algorithms/tree/trie' },
            { text: '并查集', link: '/data-structures-and-algorithms/tree/union-find' },
            { text: '数据流中位数（工程）', link: '/data-structures-and-algorithms/tree/data-stream-median' },
            { text: '跳表 SkipList（工程）', link: '/data-structures-and-algorithms/tree/skip-list' },
            { text: 'Radix Tree（压缩 Trie，工程）', link: '/data-structures-and-algorithms/tree/radix-tree' },
            { text: 'Merkle Tree（工程）', link: '/data-structures-and-algorithms/tree/merkle-tree' },
            { text: '搜索自动补全 LC642（工程）', link: '/data-structures-and-algorithms/tree/autocomplete' },
            { text: '任务调度器 LC621+Cron（工程）', link: '/data-structures-and-algorithms/tree/task-scheduler' },
            { text: '撮合引擎（工程）', link: '/data-structures-and-algorithms/tree/matching-engine' },
          ],
        },
        {
          text: '图与搜索',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/graph-search/' },
            { text: '图建模与遍历', link: '/data-structures-and-algorithms/graph-search/graph-basics' },
            { text: 'BFS 与 DFS', link: '/data-structures-and-algorithms/graph-search/bfs-dfs' },

            { text: '拓扑排序', link: '/data-structures-and-algorithms/graph-search/topological-sort' },
            { text: '最短路', link: '/data-structures-and-algorithms/graph-search/shortest-path' },
            { text: '回溯', link: '/data-structures-and-algorithms/graph-search/backtracking' },
            { text: '并查集', link: '/data-structures-and-algorithms/graph-search/union-find' },
            { text: 'Tarjan 强连通分量（工程）', link: '/data-structures-and-algorithms/graph-search/tarjan-scc' },
          ],
        },
        {
          text: '动态规划',
          collapsed: false,
          items: [
            { text: 'DP 总论与解题方法论', link: '/data-structures-and-algorithms/dynamic-programming/' },
            { text: '线性与网格 DP', link: '/data-structures-and-algorithms/dynamic-programming/linear-dp' },
            { text: '背包 DP', link: '/data-structures-and-algorithms/dynamic-programming/knapsack-dp' },
            { text: '序列与回文 DP', link: '/data-structures-and-algorithms/dynamic-programming/sequence-dp' },
            { text: '区间与状态机 DP', link: '/data-structures-and-algorithms/dynamic-programming/interval-and-state-machine-dp' },
            { text: '树形 DP', link: '/data-structures-and-algorithms/dynamic-programming/tree-dp' },
            { text: '状压与计数 DP', link: '/data-structures-and-algorithms/dynamic-programming/advanced-dp' },
            { text: '数位 DP', link: '/data-structures-and-algorithms/dynamic-programming/digit-dp' },
            { text: '博弈 DP', link: '/data-structures-and-algorithms/dynamic-programming/game-dp' },
            { text: '概率与期望 DP', link: '/data-structures-and-algorithms/dynamic-programming/probability-dp' },
            { text: 'DP 优化技巧', link: '/data-structures-and-algorithms/dynamic-programming/dp-optimization' },
          ],
        },
        {
          text: '贪心与技巧',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/data-structures-and-algorithms/greedy-techniques/' },
            { text: '贪心算法', link: '/data-structures-and-algorithms/greedy-techniques/greedy' },
            { text: '位运算技巧', link: '/data-structures-and-algorithms/greedy-techniques/bitwise' },
          ],
        },
      ],
      '/operating-systems/': [
        {
          text: '操作系统',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/operating-systems/' },
            { text: '进程与线程（含 R/S/D/Z/T 状态机）', link: '/operating-systems/process-and-thread' },
            { text: '内存管理（分配器 / NUMA / HugePage / OOM）', link: '/operating-systems/memory-management' },
            { text: 'I/O 模型（epoll / io_uring / 零拷贝）', link: '/operating-systems/io-model' },
            { text: 'CPU 调度（CFS / EEVDF / 容器 Throttling）', link: '/operating-systems/cpu-scheduling' },
            { text: '文件系统', link: '/operating-systems/file-system' },
            { text: '🔥 容器隔离原理（Namespace + cgroup）', link: '/operating-systems/containers-and-isolation' },
          ],
        },
      ],
      '/computer-networks/': [
        {
          text: '计算机网络',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/computer-networks/' },
            { text: '网络模型 (OSI / TCP/IP)', link: '/computer-networks/network-model' },
            { text: 'TCP 与 UDP（BBR / TIME_WAIT 排查）', link: '/computer-networks/tcp-udp' },
            { text: 'HTTP 与 HTTPS', link: '/computer-networks/http-https' },
            { text: '🔥 HTTP/3 与 QUIC 深度', link: '/computer-networks/http3-quic' },
            { text: 'DNS（DoH / DoT / DoQ / ECS / Anycast）', link: '/computer-networks/dns' },
            { text: 'WebSocket', link: '/computer-networks/websocket' },
            { text: '网络安全（mTLS / 后量子密码 PQC）', link: '/computer-networks/network-security' },
            { text: 'CDN 与负载均衡', link: '/computer-networks/cdn-load-balancing' },
            { text: '🔥 网络故障排查（tcpdump / mtr / curl）', link: '/computer-networks/network-troubleshooting' },
          ],
        },
      ],
      '/databases/': [
        {
          text: '数据库 — 章节总览',
          collapsed: false,
          items: [
            { text: '章节概览与选型地图', link: '/databases/' },
          ],
        },
        {
          text: '关系型数据库（OLTP 核心）',
          collapsed: false,
          items: [
            { text: 'MySQL 架构', link: '/databases/mysql-architecture' },
            { text: '索引原理（B+ 树 / 覆盖索引 / ICP）', link: '/databases/indexing' },
            { text: '事务与锁（ACID / MVCC / 隔离级别）', link: '/databases/transaction-lock' },
            { text: 'SQL 优化（EXPLAIN / 慢 SQL / JOIN）', link: '/databases/sql-optimization' },
            { text: 'MySQL 日志（redo / undo / binlog / 2PC）', link: '/databases/mysql-logs' },
            { text: '🔥 PostgreSQL 深度（vs MySQL 决策）', link: '/databases/postgresql' },
          ],
        },
        {
          text: '扩展与分布式',
          collapsed: false,
          items: [
            { text: '分库分表', link: '/databases/sharding' },
            { text: '🔥 分布式数据库 NewSQL（TiDB / CockroachDB / Spanner / OceanBase）', link: '/databases/distributed-databases' },
          ],
        },
        {
          text: 'NoSQL 与缓存',
          collapsed: false,
          items: [
            { text: 'Redis 核心', link: '/databases/redis' },
            { text: '🔥 NoSQL 全景（MongoDB / Cosmos DB / DynamoDB / Cassandra）', link: '/databases/nosql-databases' },
          ],
        },
        {
          text: '分析与数据栈（OLAP）',
          collapsed: false,
          items: [
            { text: '🔥 数据仓库与 Lakehouse（Snowflake / BigQuery / Databricks）', link: '/databases/data-warehouse' },
            { text: '🔥 Elasticsearch 全文搜索（OpenSearch / 向量混合）', link: '/databases/elasticsearch' },
          ],
        },
        {
          text: '专用存储',
          collapsed: false,
          items: [
            { text: '🔥 向量数据库选型（Milvus / Qdrant / pgvector）', link: '/databases/vector-database-selection' },
            { text: '🔥 对象存储与云存储（Azure Blob / S3 / GCS / MinIO）', link: '/databases/cloud-storage' },
          ],
        },
      ],
      '/system-design/': [
        {
          text: '系统设计',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/system-design/' },
            { text: '系统设计方法论', link: '/system-design/system-design-methodology' },
            { text: '分布式理论', link: '/system-design/distributed-theory' },
            { text: '分布式事务', link: '/system-design/distributed-transaction' },
            { text: '高可用架构', link: '/system-design/high-availability' },
            { text: '高并发读架构', link: '/system-design/high-concurrency-read' },
            { text: '高并发写架构', link: '/system-design/high-concurrency-write' },
            { text: '缓存策略', link: '/system-design/caching-strategies' },
            { text: '限流与熔断', link: '/system-design/rate-limiting' },
            { text: '幂等性与热点 Key', link: '/system-design/hot-key-and-idempotency' },
            { text: '消息队列', link: '/system-design/message-queue' },
            { text: '微服务架构', link: '/system-design/microservices' },
            { text: '存储选型', link: '/system-design/database-selection' },
            { text: 'API 设计', link: '/system-design/api-design' },
            { text: '搜索与推荐', link: '/system-design/search-and-recommendation' },
            { text: '综合案例', link: '/system-design/real-world-cases' },
          ],
        },
        {
          text: '大厂实战面试题',
          collapsed: false,
          items: [
            { text: '题目总览', link: '/system-design/interview-cases/' },
            { text: '微信消息系统', link: '/system-design/interview-cases/wechat-messaging' },
            { text: '微信朋友圈', link: '/system-design/interview-cases/wechat-moments' },
            { text: '微信红包', link: '/system-design/interview-cases/wechat-red-packet' },
            { text: '微信登录与在线状态', link: '/system-design/interview-cases/wechat-login' },
            { text: '阿里双十一洪峰', link: '/system-design/interview-cases/double-eleven-spike' },
            { text: '支付宝支付系统', link: '/system-design/interview-cases/alipay-payment' },
            { text: '淘宝商品搜索', link: '/system-design/interview-cases/taobao-search' },
            { text: '阿里库存系统', link: '/system-design/interview-cases/inventory-system' },
            { text: '美团外卖调度', link: '/system-design/interview-cases/delivery-dispatch' },
            { text: '美团附近搜索', link: '/system-design/interview-cases/nearby-restaurant' },
            { text: '美团评价系统', link: '/system-design/interview-cases/review-system' },
            { text: '抖音推荐流', link: '/system-design/interview-cases/tiktok-feed' },
            { text: '抖音直播系统', link: '/system-design/interview-cases/live-streaming' },
            { text: '飞书协同编辑', link: '/system-design/interview-cases/feishu-collab-doc' },
            { text: '🔥 大模型推理服务', link: '/system-design/interview-cases/llm-inference-service' },
            { text: '🔥 向量数据库与 RAG', link: '/system-design/interview-cases/vector-db-rag' },
            { text: '实时特征平台设计', link: '/system-design/interview-cases/feature-store' },
          ],
        },
      ],
      '/engineering-practice/': [
        {
          text: '工程实践',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/engineering-practice/' },
            { text: '设计模式', link: '/engineering-practice/design-patterns' },
            { text: 'Docker 容器化', link: '/engineering-practice/docker' },
            { text: 'Kubernetes', link: '/engineering-practice/kubernetes' },
            { text: '🔥 Helm 与 Kustomize', link: '/engineering-practice/helm-kustomize' },
            { text: '🔥 GitOps 与 Argo CD', link: '/engineering-practice/gitops-argo-cd' },
            { text: 'Redis 实战', link: '/engineering-practice/redis' },
            { text: '消息队列', link: '/engineering-practice/message-queue' },
            { text: '微服务治理', link: '/engineering-practice/microservice-governance' },
            { text: '监控与可观测性', link: '/engineering-practice/monitoring-observability' },
            { text: '🔥 CPU / 内存 100% 排查（系统+Java+AKS）', link: '/engineering-practice/cpu-memory-troubleshooting' },
            { text: '分布式 ID 生成', link: '/engineering-practice/distributed-id' },
          ],
        },
      ],
      '/programming-languages/': [
        {
          text: '编程语言 — 总览',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/programming-languages/' },
          ],
        },
        {
          text: 'Java 体系',
          collapsed: false,
          items: [
            { text: 'Java 基础', link: '/programming-languages/java-fundamentals' },
            { text: 'Java 并发编程', link: '/programming-languages/java-concurrency' },
            { text: 'Java 集合框架', link: '/programming-languages/java-collections' },
            { text: 'JVM 深入', link: '/programming-languages/jvm-internals' },
            { text: 'Java 新特性', link: '/programming-languages/java-modern-features' },
            { text: '🔥 Java 工程实战（JVM 调优 / Native / CRaC）', link: '/programming-languages/java-engineering' },
            { text: '🔥 JMH 基准测试', link: '/programming-languages/java-jmh' },
          ],
        },
        {
          text: 'C++ 体系',
          collapsed: false,
          items: [
            { text: 'C++ 基础', link: '/programming-languages/cpp-fundamentals' },
            { text: 'C++ 内存管理', link: '/programming-languages/cpp-memory-management' },
            { text: 'C++ STL 与现代特性', link: '/programming-languages/cpp-stl-modern' },
            { text: 'C++ 并发与工具链', link: '/programming-languages/cpp-toolchain' },
            { text: 'C++ 工程实战', link: '/programming-languages/cpp-engineering' },
          ],
        },
        {
          text: 'C# 体系',
          collapsed: false,
          items: [
            { text: 'C# 基础', link: '/programming-languages/csharp-fundamentals' },
            { text: 'C# 现代特性', link: '/programming-languages/csharp-modern-features' },
            { text: 'C# 生态', link: '/programming-languages/csharp-ecosystem' },
            { text: 'C# 工程实战', link: '/programming-languages/csharp-engineering' },
          ],
        },
        {
          text: 'Python 体系',
          collapsed: false,
          items: [
            { text: 'Python 基础', link: '/programming-languages/python-fundamentals' },
            { text: 'Python 并发', link: '/programming-languages/python-concurrency' },
            { text: 'Python 现代特性', link: '/programming-languages/python-modern-features' },
            { text: 'Python 工程实战', link: '/programming-languages/python-engineering' },
            { text: 'Python 生态与选型', link: '/programming-languages/python-ecosystem' },
          ],
        },
        {
          text: 'Go 体系',
          collapsed: false,
          items: [
            { text: 'Go 基础', link: '/programming-languages/go-fundamentals' },
            { text: 'Go 并发编程', link: '/programming-languages/go-concurrency' },
            { text: 'Go 现代特性', link: '/programming-languages/go-modern-features' },
            { text: 'Go 工程实战', link: '/programming-languages/go-engineering' },
          ],
        },
        {
          text: 'Rust 体系',
          collapsed: false,
          items: [
            { text: 'Rust 基础', link: '/programming-languages/rust-fundamentals' },
            { text: 'Rust 所有权', link: '/programming-languages/rust-ownership' },
            { text: 'Rust 进阶', link: '/programming-languages/rust-traits-async' },
            { text: 'Rust 工程实战', link: '/programming-languages/rust-engineering' },
          ],
        },
      ],
      '/web-and-frameworks/': [
        {
          text: 'Web 基础',
          collapsed: false,
          items: [
            { text: '章节概览', link: '/web-and-frameworks/' },
            { text: 'Web 基础', link: '/web-and-frameworks/web-basics' },
          ],
        },
        {
          text: 'Spring 核心',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/web-and-frameworks/spring-core/' },
            { text: 'IoC 与依赖注入', link: '/web-and-frameworks/spring-core/ioc-di' },
            { text: 'Bean 生命周期与作用域', link: '/web-and-frameworks/spring-core/bean-lifecycle' },
            { text: 'AOP 原理与实践', link: '/web-and-frameworks/spring-core/aop' },
          ],
        },
        {
          text: 'Spring MVC',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/web-and-frameworks/spring-mvc/' },
            { text: '请求处理流程', link: '/web-and-frameworks/spring-mvc/request-flow' },
            { text: 'RESTful API', link: '/web-and-frameworks/spring-mvc/restful-api' },
            { text: 'Spring WebFlux', link: '/web-and-frameworks/spring-mvc/webflux' },
          ],
        },
        {
          text: 'Spring Boot',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/web-and-frameworks/spring-boot/' },
            { text: '自动配置原理', link: '/web-and-frameworks/spring-boot/auto-configuration' },
            { text: '配置体系与 Profile', link: '/web-and-frameworks/spring-boot/configuration' },
          ],
        },
        {
          text: '数据访问与事务',
          collapsed: false,
          items: [
            { text: '概念与处理', link: '/web-and-frameworks/data-access/' },
            { text: '事务管理与传播行为', link: '/web-and-frameworks/data-access/transaction' },
            { text: 'JPA 与 MyBatis 集成', link: '/web-and-frameworks/data-access/orm-integration' },
          ],
        },
        {
          text: 'Spring 进阶专题',
          collapsed: false,
          items: [
            { text: 'Spring Security', link: '/web-and-frameworks/spring-security' },
            { text: 'Spring Boot 3 新特性', link: '/web-and-frameworks/spring-boot3-new-features' },
            { text: 'Spring Cloud 速查', link: '/web-and-frameworks/spring-cloud-overview' },
          ],
        },
        {
          text: 'Java 后端框架进阶',
          collapsed: false,
          items: [
            { text: '🔥 Java 云原生（Quarkus / Micronaut / Helidon）', link: '/web-and-frameworks/java-cloud-native' },
            { text: '🔥 Apache Dubbo 3', link: '/web-and-frameworks/dubbo' },
            { text: '🔥 Project Reactor 深度', link: '/web-and-frameworks/project-reactor' },
            { text: '响应式 Java 框架横评（Vert.x / RxJava / Mutiny / Pekko）', link: '/web-and-frameworks/reactive-java' },
          ],
        },
        {
          text: '前端框架',
          collapsed: false,
          items: [
            { text: '🔥 TypeScript 5.x 类型系统深度', link: '/web-and-frameworks/typescript' },
            { text: 'React', link: '/web-and-frameworks/react' },
            { text: 'Angular', link: '/web-and-frameworks/angular' },
          ],
        },
      ],
      '/ai-technology/': [
        {
          text: 'AI 基础',
          collapsed: false,
          items: [
            { text: 'AI 概述与发展历程', link: '/ai-technology/ai-overview' },
            { text: 'LLM 大语言模型原理', link: '/ai-technology/llm-fundamentals' },
            { text: '🔥 VLM 视觉语言模型', link: '/ai-technology/vision-language-models' },
          ],
        },
        {
          text: 'LLM 应用技术',
          collapsed: false,
          items: [
            { text: 'Prompt Engineering 提示工程', link: '/ai-technology/prompt-engineering' },
            { text: 'Embedding 与向量数据库', link: '/ai-technology/embedding-and-vector-db' },
            { text: 'RAG 检索增强生成', link: '/ai-technology/rag' },
          ],
        },
        {
          text: 'AI Agent 与工具',
          collapsed: false,
          items: [
            { text: 'AI Agent 智能体', link: '/ai-technology/ai-agents' },
            { text: 'Agent Skills 编写指南', link: '/ai-technology/ai-agent-skills' },
            { text: '🔥 Computer Use 与多 Agent 编排', link: '/ai-technology/agent-computer-use' },
            { text: 'Harness Engineering', link: '/ai-technology/harness-engineering' },
          ],
        },
        {
          text: 'AI 工程实践',
          collapsed: false,
          items: [
            { text: '模型微调与训练', link: '/ai-technology/model-training' },
            { text: '模型评估、对齐与 AI 安全', link: '/ai-technology/evaluation-and-alignment' },
            { text: '🔥 Prompt Injection 攻防与 LLM 安全', link: '/ai-technology/security-and-jailbreak' },
            { text: 'LLM 推理优化', link: '/ai-technology/inference-optimization' },
            { text: 'AI 应用架构设计', link: '/ai-technology/ai-architecture' },
            { text: 'AI 系统设计面试题', link: '/ai-technology/ai-system-design' },
            { text: 'AI 前沿趋势与新范式', link: '/ai-technology/ai-trends' },
          ],
        },
        {
          text: 'AI 面试准备',
          collapsed: false,
          items: [
            { text: 'AI 时代面试准备策略', link: '/ai-technology/ai-interview-prep' },
            { text: '全栈工程师 AI 实战能力', link: '/ai-technology/ai-for-fullstack' },
          ],
        },
      ],
    },

    outline: {
      level: [2, 3],
      label: '本页目录',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },

    socialLinks: [],

    lastUpdated: {
      text: '最后更新',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    editLink: {
      pattern: 'https://github.com/liukun2634/dev-interview-guide/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
  },
}))
