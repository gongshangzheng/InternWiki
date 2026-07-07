# 静态资源、Git 工作流与部署

图片放置、Git 分支管理、开发命令、CI/CD 部署的完整指南。

## 目录

1. [静态资源（图片）放置](#1-静态资源图片放置)
2. [Git 分支工作流](#2-git-分支工作流)
3. [开发命令](#3-开发命令)
4. [GitHub Actions 部署](#4-github-actions-部署)
5. [注意事项](#5-注意事项)

---

## 1. 静态资源（图片）放置

图片等静态资源放在 `apps/web/public/` 目录下，按实习生和用途分类：

```
apps/web/public/
├── interns/
│   └── {slug}/
│       ├── avatar.png           # 实习生头像
│       ├── daily/               # 日报配图
│       │   └── 2026-07-07-screenshot.png
│       ├── docs/                # 文档配图
│       │   └── architecture-diagram.png
│       └── projects/            # 项目截图
│           └── search-engine-arch.png
```

### 在 Markdown 中引用图片

使用绝对路径（带 base path 前缀）：

```markdown
![架构图](/InternWiki/interns/alice/docs/architecture-diagram.png)
```

Base path 为 `/InternWiki/`，所有 public 下的资源 URL 都需要加这个前缀。

也可使用相对路径引用同目录图片，但推荐统一放 public 下管理。

---

## 2. Git 分支工作流

**重要：每个实习生必须在自己的分支上工作，不要直接提交到 main。**

```bash
# 1. 切到 main 拉最新代码
git checkout main
git pull origin main

# 2. 创建你的分支（命名规则：intern-你的英文名）
git checkout -b intern-zhangsan
git push -u origin intern-zhangsan

# 3. 之后所有日报、周报、文档、任务修改都提交到你的分支
git add .
git commit -m "日报 2026-07-07"
git push

# 4. 定期从 main 拉取最新代码，避免冲突
git fetch origin
git rebase origin/main  # 或 merge

# 5. 内容稳定后可以提 PR 合并到 main
```

### 分支命名规则

- 个人分支：`intern-{英文名}`，如 `intern-zhangsan`
- 功能分支（少见）：`feat-{功能名}`

---

## 3. 开发命令

```bash
pnpm dev          # 启动开发服务器 (port 5180, base /InternWiki/)
pnpm build        # 构建 (velite build + tsc + vite build)
pnpm preview      # 预览构建结果
pnpm content:build  # 仅编译 Velite 内容
pnpm typecheck    # 类型检查
pnpm cli          # CLI 工具入口
```

- 开发服务器固定端口 **5180**，base 路径 `/InternWiki/`
- `pnpm dev` 有热重载，修改 Markdown 内容会自动重新编译 Velite
- `tasks.json` 不经过 Velite，由 Vite 插件直接 serve，修改即时生效

---

## 4. GitHub Actions 部署

项目配置了 GitHub Actions 自动部署（`.github/workflows/deploy.yml`）：

- **触发**：push 到 `main` 分支
- **流程**：pnpm install → velite build → vite build → upload-pages-artifact → deploy-pages
- **要求**：仓库需为 **public** 才能使用 GitHub Pages（private 仓库需要 GitHub Pro+）

如果仓库当前是 private，部署不会生效。可以：
1. 将仓库设为 public
2. 或升级 GitHub 计划

---

## 5. 注意事项

1. **修改内容后需重新编译**：运行 `pnpm content:build` 或 `pnpm dev`（热重载）

2. **tasks.json 不经过 Velite**：由 Vite 插件直接 serve，修改即时生效，无需编译

3. **端口 5180**：开发服务器固定端口 5180，base 路径 `/InternWiki/`

4. **文件名规则**：日报 `YYYY-MM-DD.md`，周报 `YYYY-Wxx.md`，月报 `YYYY-MM.md`

5. **项目 README**：文件名必须为 `README.md`，放在项目目录下

6. **图片资源**：放 `apps/web/public/interns/{slug}/` 下，Markdown 中用 `/InternWiki/interns/{slug}/xxx.png` 引用

7. **Git 分支**：必须在自己的 `intern-xxx` 分支上工作，不要直接提交 main

8. **暗/亮模式**：CSS 变量 `:root`（亮色）/`.dark`（暗色）两套，导航栏可切换。修改样式时注意两套都改。

9. **Tailwind v4 @theme**：颜色变量需在 `@theme` 块中注册为 `--color-xxx: var(--color-xxx)` 才能生成 `bg-card` / `text-heading` 等工具类。
