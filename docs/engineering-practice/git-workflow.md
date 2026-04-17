---
title: Git 工作流
---

# Git 工作流

## 概念

Git 是一个**分布式版本控制系统**，每个开发者本地都有完整的仓库历史。区别于集中式版本控制（如 SVN），Git 允许离线提交、灵活分支、快速合并，是现代软件工程协作的基础工具。

**Git 工作流**指团队约定的分支命名规范、合并策略、发布流程的总和。选择合适的工作流直接影响团队协作效率和发布质量。

## 核心原理

### 1. Git 基础原理

**快照而非差异**

Git 每次提交保存的是项目文件的完整快照，而不是与上一版本的差异（diff）。未修改的文件只存储指向已有快照的指针，节省空间。

**三个区域**

```
工作区 (Working Directory)
    ↓  git add
暂存区 (Staging Area / Index)
    ↓  git commit
本地仓库 (Local Repository)
    ↓  git push
远程仓库 (Remote Repository)
```

**对象模型**

| 对象 | 说明 |
|------|------|
| `blob` | 文件内容，不含文件名 |
| `tree` | 目录结构，包含文件名和指向 blob/tree 的指针 |
| `commit` | 快照指针 + 作者/时间/消息 + 父 commit 指针 |
| `tag` | 指向特定 commit 的有名称的引用，可附加签名 |

每个对象以其内容的 SHA-1 哈希值寻址，保证内容可寻址和完整性。

---

### 2. 分支策略对比

#### Git Flow

适合有明确版本号的软件（如移动端 App、桌面软件）。

```
main    ─────●───────────────────────────────●──── (v1.0)
              \                             /
develop  ──────●──────●──────●────────────●────────
                \    /        \          /
feature          ●──           ●────────
                               \
release                         ●──●──●
                                      \
hotfix                                 ●
```

- `main`：生产环境代码，只接受 release/hotfix 合并，打版本 tag
- `develop`：集成分支，feature 分支从此分出并合回
- `feature/xxx`：新功能开发，完成后合入 develop
- `release/x.x`：发布准备，只允许 bug fix，完成后合入 main 和 develop
- `hotfix/xxx`：从 main 切出修复紧急 bug，合入 main 和 develop

#### GitHub Flow

适合持续部署的 Web 服务，流程简单。

```
main    ─────●──────────────────────●──── (随时可部署)
              \                    /
feature        ●──●──●  → PR → review → merge
```

- 只有 `main` 一个长期分支
- 功能开发在 `feature` 分支，通过 PR 合入 main
- 合入即部署（CI/CD 自动触发）

#### Trunk-Based Development（主干开发）

适合高频发布、有成熟 CI/CD 的大型团队（如 Google、Facebook）。

```
main(trunk)  ──●──●──●──●──●──●──●──  (持续集成，每天多次提交)
                \      /
short-lived      ●────   (< 2 天生命周期)
```

- 所有开发者频繁提交到主干（或短生命周期分支，最长 1-2 天）
- 用 **Feature Flag** 隐藏未完成功能，实现代码上线和功能上线解耦
- 要求完善的自动化测试覆盖，提交前必须通过 CI

#### 对比表

| 维度 | Git Flow | GitHub Flow | Trunk-Based |
|------|----------|-------------|-------------|
| 适用团队规模 | 中小团队 | 中小团队 | 中大型团队 |
| 发布节奏 | 定期版本发布 | 持续部署 | 持续集成/部署 |
| 分支复杂度 | 高（5 类分支） | 低（2 类） | 极低（1-2 类） |
| 学习成本 | 高 | 低 | 中（需要 Feature Flag） |
| 并行开发隔离 | 强 | 中 | 弱（依赖 Feature Flag） |
| 适合场景 | 版本化产品、移动端 | Web 服务、SaaS | 大型互联网、DevOps 成熟 |

---

### 3. 合并策略

#### merge（三方合并）

```bash
git checkout main
git merge feature/login
```

保留完整历史，产生一个 merge commit，历史图是非线性的。

- 优点：完整保留分支历史，可追溯
- 缺点：历史图复杂，commit 记录有噪音

#### rebase（变基）

```bash
git checkout feature/login
git rebase main
```

将 feature 分支的提交"移植"到 main 最新节点之后，历史线性整洁。

- 优点：历史线性，`git log` 清晰
- 缺点：改写提交历史（SHA 变化），**不能对已推送到远程的公共分支 rebase**

#### squash merge

```bash
git merge --squash feature/login
git commit -m "feat: add login feature"
```

将 feature 分支所有提交压缩成一个提交合入目标分支。

- 优点：主分支历史极简洁，每个功能一个 commit
- 缺点：丢失 feature 分支内部开发历史

#### 团队规范建议

| 场景 | 推荐策略 |
|------|----------|
| feature 合入 main/develop | squash merge 或 merge |
| 同步 main 最新代码到 feature | rebase（保持线性） |
| 长期维护分支之间合并 | merge（保留历史） |
| 本地清理提交再推送 | interactive rebase（`git rebase -i`） |

---

### 4. 常用命令速查

```bash
# stash — 临时保存工作区修改
git stash                        # 保存当前修改
git stash pop                    # 恢复最近一次 stash
git stash list                   # 查看所有 stash
git stash apply stash@{2}        # 应用指定 stash（不删除）

# cherry-pick — 摘取指定 commit 到当前分支
git cherry-pick <commit-sha>
git cherry-pick <sha1>..<sha2>   # 摘取范围（左开右闭）

# reset — 回退提交
git reset --soft HEAD~1          # 撤销 commit，修改保留在暂存区
git reset --mixed HEAD~1         # 撤销 commit，修改退回工作区（默认）
git reset --hard HEAD~1          # 撤销 commit，修改彻底丢弃

# reflog — 查看操作历史（救命命令）
git reflog                       # 查看 HEAD 的所有移动记录
git reset --hard HEAD@{3}        # 恢复到某个历史状态

# bisect — 二分查找引入 bug 的 commit
git bisect start
git bisect bad                   # 当前是有 bug 的
git bisect good v1.0             # v1.0 是正常的
# Git 自动 checkout 中间版本，手动测试后标记 good/bad
git bisect good / git bisect bad
git bisect reset                 # 结束 bisect
```

---

### 5. 冲突解决

#### merge conflict 处理流程

```bash
git merge feature/login
# 出现冲突时，Git 暂停并标记冲突文件

# 冲突文件中的标记：
<<<<<<< HEAD
当前分支的内容
=======
feature/login 分支的内容
>>>>>>> feature/login

# 处理步骤：
# 1. 打开冲突文件，手动编辑保留正确内容
# 2. 删除冲突标记（<<<, ===, >>>）
# 3. git add <冲突文件>
# 4. git commit  （会自动生成 merge commit 消息）
```

#### rebase conflict 处理

rebase 逐个重放提交，每个提交都可能产生冲突。

```bash
git rebase main
# 遇到冲突时 rebase 暂停

# 处理步骤：
# 1. 手动解决冲突文件
# 2. git add <冲突文件>
# 3. git rebase --continue   # 继续下一个提交
# 或
# git rebase --abort         # 放弃整个 rebase，恢复原状
```

---

### 6. Code Review

#### PR 最佳实践

- **小而专注**：单个 PR 只做一件事，代码行数尽量控制在 400 行以内
- **描述清晰**：PR 描述说明「做了什么」「为什么这样做」「如何测试」
- **自我 Review 先行**：提交前先自己过一遍，减少低级错误
- **关联 Issue**：PR 描述中用 `closes #123` 自动关联并关闭 Issue
- **截图/录屏**：UI 改动附上截图，便于 reviewer 快速理解

#### Review 检查清单

| 维度 | 检查要点 |
|------|----------|
| 正确性 | 逻辑是否正确，边界条件是否处理 |
| 可读性 | 命名是否清晰，复杂逻辑是否有注释 |
| 安全性 | 有无 SQL 注入、XSS、敏感信息泄露 |
| 性能 | 有无 N+1 查询、不必要的大对象操作 |
| 测试 | 是否有对应单元/集成测试，覆盖关键路径 |
| 向后兼容 | API 变更是否破坏现有调用方 |

## 面试常问 & 怎么答

**Q1：merge 和 rebase 有什么区别？什么时候用哪个？**

> merge 会产生一个 merge commit，保留完整的分支历史，历史图是非线性的；rebase 则将提交重新"嫁接"到目标分支上，历史是线性的，但会改写 commit SHA。
>
> 用哪个取决于场景：**本地 feature 分支同步 main 最新代码用 rebase**，保持提交历史整洁；**feature 合入 main 用 merge 或 squash merge**，保留合并节点。最重要的原则是：**不要对已推送到远程的公共分支执行 rebase**，因为会改写历史，导致其他人的本地分支冲突。

---

**Q2：Git Flow 和 Trunk-Based Development 的区别？你们团队用哪种？**

> Git Flow 有多条长期存在的分支（main、develop、release 等），适合有明确版本周期的产品；Trunk-Based 所有人都提交到主干，依靠 Feature Flag 隐藏未完成功能，适合持续部署的互联网产品。
>
> Git Flow 的优点是分支隔离清晰，缺点是分支合并频繁容易产生大量冲突；Trunk-Based 的优点是集成快、冲突少，缺点是对测试覆盖率和 CI/CD 成熟度要求高。
>
> （结合实际经历回答：）我们团队用的是 GitHub Flow，main 分支随时可部署，feature 分支开发完经 PR review 后 squash merge 进 main，每次合并触发自动部署到测试环境。

---

**Q3：git reset --soft / --mixed / --hard 有什么区别？**

> 三者都会移动 HEAD 指针到指定 commit，区别在于对工作区和暂存区的处理：
>
> - `--soft`：只移动 HEAD，暂存区和工作区不变。修改还在暂存区，可以直接重新 commit。适合合并最近几个提交（`git reset --soft HEAD~3` 后重新 commit）。
> - `--mixed`（默认）：移动 HEAD，暂存区清空，修改退回工作区。需要重新 `git add` 再 commit。
> - `--hard`：移动 HEAD，暂存区和工作区全部丢弃，彻底回到目标 commit 状态。**操作不可逆**，慎用（可用 `git reflog` 补救）。

## 看到什么就先想到这类

| 关键词 | 联想到 |
|--------|--------|
| 分支混乱、合并冲突多 | 评估分支策略是否匹配团队规模，考虑引入 Trunk-Based |
| 历史记录一堆 merge commit | squash merge 或 rebase 整理历史 |
| 误操作删了提交/分支 | `git reflog` + `git reset --hard` 恢复 |
| 找哪个提交引入了 bug | `git bisect` 二分定位 |
| 临时切换任务 | `git stash` 保存现场 |
| 只需要另一分支的某个 commit | `git cherry-pick` |
| PR 太大难以 review | 拆分 PR，单个 PR 聚焦一个功能点 |
| CI 流水线在 main 上挂了 | 主干开发的前提是有完善的自动化测试保护主干 |
