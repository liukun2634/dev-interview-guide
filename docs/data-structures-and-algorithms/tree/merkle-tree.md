---
title: Merkle Tree
---

# Merkle Tree（默克尔树）— Git / 区块链 / 大数据校验的底层

<span class="dig-tag dig-tag--category">树与堆</span> <span class="dig-tag dig-tag--hard">⭐⭐⭐ 进阶</span> <span class="dig-tag dig-tag--hot">🔥 高频</span>

::: tip 💡 核心要点
Merkle Tree 把**大量数据块的哈希两两合并，最终形成一个根哈希**——根哈希一动，肯定有某块数据动了；某块数据动，只需 O(log n) 个兄弟哈希就能证明（**Merkle Proof**）。**Git、Bitcoin、IPFS、Dynamo 反熵、S3 ETag 全都在用**，2026 大厂面试高频，区块链/分布式岗位必考。
:::

## 为什么单独讲它

普通哈希校验只能证明"两份数据完全相同"，**没法定位差异**。Merkle Tree 解决两个问题：

1. **快速定位差异**：两棵树根哈希不同时，从根往下走，只下到哈希不同的子树即可定位坏块。比较两个 1GB 文件，**不需要传输整个文件**，O(log n) 步就能找到第一个差异
2. **轻节点证明**：手机上验证"这笔交易确实在区块链里"，不需要下载整条链 60GB，只需服务器给你 ~30 个哈希（Merkle Proof）

```
                Root = h(h12, h34)
               /                  \
         h12 = h(h1,h2)      h34 = h(h3,h4)
         /         \         /         \
       h1         h2       h3         h4
       │          │        │          │
      [data1]   [data2]   [data3]   [data4]
```

## 数据结构与构建

```java
class MerkleTree {
    static class Node {
        byte[] hash;
        Node left, right;
        Node(byte[] hash) { this.hash = hash; }
        Node(Node l, Node r) {
            this.left = l;
            this.right = r;
            this.hash = sha256(concat(l.hash, r.hash));   // ★ 内部节点 = 子节点哈希拼接后再哈希
        }
    }

    Node root;
    List<Node> leaves;                                    // 叶子节点列表（按数据顺序）

    public MerkleTree(List<byte[]> data) {
        leaves = new ArrayList<>();
        for (byte[] d : data) leaves.add(new Node(sha256(d)));

        // ★ 自底向上构建
        List<Node> level = new ArrayList<>(leaves);
        while (level.size() > 1) {
            List<Node> next = new ArrayList<>();
            for (int i = 0; i < level.size(); i += 2) {
                Node left = level.get(i);
                Node right = (i + 1 < level.size()) ? level.get(i + 1) : left;  // ★ 奇数时复制最后一个
                next.add(new Node(left, right));
            }
            level = next;
        }
        root = level.get(0);
    }

    public byte[] rootHash() { return root.hash; }
}
```

**关键设计点：**

- **奇数节点处理**：补一个跟自己一样的节点（Bitcoin 用法）或留空（Ethereum）；面试两种都对，说明清楚即可
- **必须按固定顺序构建**：树形状跟数据顺序强相关，否则根哈希不一致
- **哈希函数选 SHA-256**：抗碰撞、固定 32 字节；Git 历史用 SHA-1（已知碰撞，2017 SHAttered），新版正在迁移 SHA-256

## 核心操作：Merkle Proof（轻节点证明）

**场景**：手机钱包想验证"交易 T3 确实在区块里"，但只有 root 哈希，不想下载整个区块。

**Proof = 从 T3 到 root 路径上所有兄弟节点的哈希**：

```
                Root
               /    \
           h12      h34            ← 我手机里没有 h34，但服务器告诉我 h34
           /   \    /   \
         h1   h2  h3   h4
                  │
                 T3   ← 我手上有 T3，自己算 h3 = hash(T3)

Proof for T3 = [h4, h12]            ← 两个兄弟哈希

验证：
  h3 = sha256(T3)                   ← 自己算
  h34 = sha256(h3 || h4)            ← 用 proof[0] = h4
  root' = sha256(h12 || h34)        ← 用 proof[1] = h12
  return root' == knownRoot         ← 比对！
```

**复杂度：n 个交易的区块，proof 只需要 log₂(n) 个哈希**。比特币一个区块 ~3000 笔交易 → proof 只需 12 个 SHA-256 哈希 = **384 字节**。这就是 **SPV 钱包**（Simplified Payment Verification）的原理。

### 完整 Proof 代码

```java
public List<byte[]> generateProof(int leafIndex) {
    List<byte[]> proof = new ArrayList<>();
    int n = leaves.size();
    int idx = leafIndex;

    // 收集每一层的"兄弟哈希"
    List<Node> level = new ArrayList<>(leaves);
    while (level.size() > 1) {
        int sibling = (idx % 2 == 0) ? idx + 1 : idx - 1;
        if (sibling >= level.size()) sibling = idx;       // ★ 奇数尾节点情况
        proof.add(level.get(sibling).hash);

        // 走到上一层
        List<Node> next = new ArrayList<>();
        for (int i = 0; i < level.size(); i += 2) {
            Node l = level.get(i);
            Node r = (i + 1 < level.size()) ? level.get(i + 1) : l;
            next.add(new Node(l, r));
        }
        level = next;
        idx /= 2;
    }
    return proof;
}

/** 验证 proof（任何人有 leafData + leafIndex + proof + 已知 root 即可验证）*/
public static boolean verifyProof(byte[] leafData, int leafIndex,
                                  List<byte[]> proof, byte[] knownRoot) {
    byte[] hash = sha256(leafData);
    int idx = leafIndex;
    for (byte[] sibling : proof) {
        if (idx % 2 == 0) {
            hash = sha256(concat(hash, sibling));         // 我在左，sibling 在右
        } else {
            hash = sha256(concat(sibling, hash));         // 我在右，sibling 在左
        }
        idx /= 2;
    }
    return Arrays.equals(hash, knownRoot);
}
```

## 关键细节与陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| 拼接顺序不固定 | 同样的两个哈希算出不同 root | **永远按"左右"顺序拼接**，记 leafIndex 决定自己在左还是右 |
| 奇数节点处理不一致 | 验证失败 | 双方约定（复制最后一个 / 留空 / Padding），写死 |
| 用 SHA-1 / MD5 | 抗碰撞性差，被攻击 | 用 **SHA-256**，新系统不用 SHA-1 |
| Bitcoin "CVE-2012-2459" 漏洞 | 复制末尾节点时可伪造另一棵树有相同 root | 现代实现额外加深度位或类型前缀 |
| 不固定 leaf 类型前缀 | 把内部节点哈希当 leaf 哈希提交，绕过验证 | leaf 加 `0x00` 前缀，内部加 `0x01`（Certificate Transparency 做法） |

## 复杂度

- **构建**：O(n) 时间，O(n) 空间
- **生成 Proof**：O(log n)，proof 长度 = log₂ n 个哈希
- **验证 Proof**：O(log n) 哈希运算

## 业界应用

| 系统 | 用 Merkle Tree 干什么 |
|------|------|
| **Git** | 每个 commit 包含一棵 Merkle Tree（文件 + 目录），`git diff` 就是比较两棵树的根 |
| **Bitcoin** | 每个区块的"交易根"（Merkle Root），SPV 轻钱包验证依赖此 |
| **Ethereum** | 状态树（State Trie）+ 交易树 + 收据树，全用 Merkle Patricia Trie 变体 |
| **IPFS** | 整个文件系统是 Merkle DAG，**CID（内容 ID）= 文件的 Merkle Root** |
| **Cassandra / Dynamo** | 副本节点反熵（anti-entropy）用 Merkle Tree 找出哪些数据范围不一致 |
| **AWS S3** | 大文件分片上传后，ETag = 各分片 MD5 拼接后的 MD5（简化版 Merkle）|
| **Certificate Transparency** | Google 维护的全球证书日志，用 Merkle Tree 防止 CA 偷偷颁假证书 |
| **ZFS / Btrfs** | 文件系统校验和按 Merkle Tree 组织，每次读都验证 |

## 进阶变体

### Sparse Merkle Tree（稀疏默克尔树）

**问题**：标准 MT 要存所有叶子。如果叶子空间是 2^256（如以太坊状态树），存不下。

**解法**：用"空叶子用固定 zeroHash 表示"，整棵树**虚拟存在但只实例化非空路径**。Plasma、zkRollup、CT 日志都用这个。

### Merkle Patricia Trie

**以太坊状态树**用的变体——Merkle + Radix Tree 结合，支持高效的范围查询和稀疏 key。

### Merkle Mountain Range（MMR）

**只追加场景**（如日志、区块链）的优化版，新数据进入时只需 O(log n) 更新，不用重算整棵树。Mimblewimble、Bitcoin Lightning Network 用。

## 面试常问 & 怎么答

### Git 怎么用 Merkle Tree

每个 commit 引用一棵 tree object（Merkle Tree 的根），tree 里每个 entry 是 (mode, name, hash, type)，hash 是 blob 或子 tree 的 SHA-1。`git diff` / `git status` 比较两棵 tree 的 hash 即可知道哪些文件变了，不变的子树直接跳过。

### SPV 钱包怎么验证一笔交易

1. 钱包连接到全节点
2. 给定 txid，全节点返回该交易在哪个区块 + Merkle Proof
3. 钱包用 Proof 重算 root，跟自己已知的区块头里的 Merkle Root 比对
4. 通过 → 这笔交易确实被打包了

**钱包只存区块头（80 字节 × 区块数 ≈ 50MB），不存全链 600GB**。

### Merkle Tree vs Hash 链有什么区别

Hash 链（如 git log 每个 commit 指向 parent 的 hash）只能保证"历史不可篡改"，但**没法快速定位某个数据在不在**。Merkle Tree 提供 O(log n) 成员证明。

### 怎么防止 CVE-2012-2459 那种伪造

- 奇数节点不简单复制，加深度位或长度
- 区分 leaf 哈希和 internal 哈希（前缀 0x00 / 0x01，**RFC 6962 Certificate Transparency** 标准做法）

## 看到什么就先想到这类

- "大文件分片校验 / 增量同步" → Merkle Tree
- "轻钱包 SPV 验证" → Merkle Proof
- "Git 怎么知道哪些文件变了" → Merkle Tree 的 root hash 对比
- "分布式副本一致性校验" → Cassandra / Dynamo 的反熵机制
- "区块链 / IPFS / 内容寻址存储" → 必涉及 Merkle Tree
- "证书日志透明性 CT" → 标准 Merkle Tree（RFC 6962）
