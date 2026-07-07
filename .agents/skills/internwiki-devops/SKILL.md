---
name: internwiki-devops
description: InternWiki 静态资源、Git 工作流与部署指南。图片放置、Git 分支管理、开发命令、CI/CD 部署。触发词：放图片、截图、Git分支、开发命令、部署、GitHub Actions、pnpm dev。Use when placing static assets, managing Git branches, running dev commands, or configuring deployment in InternWiki.
---

# InternWiki 静态资源、Git 与部署

## 静态资源（图片）放置

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

## Git 分支工作流

**重要：每个实习生必须在自己的分支上工作，不要直接提交到 main。**

```bash
# 1. 切到 main 拉最新代码
git checkout main
git pull origin main

# 2. 创建你的分支（命名规则：intern-你的英文名）
git checkout -b intern-zhangsan
git push -u origin intern-zhangsan

# 3. 所有日报、周报、文档、任务修改都提交到你的分支
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

## 开发命令

```bash
pnpm dev          # 启动开发服务器 (port 5180, base /InternWiki/)
pnpm build        # 构建 (velite build + tsc + vite build)
pnpm preview      # 预览构建结果
pnpm content:build  # 仅编译 Velite 内容
pnpm typecheck    # 类型检查
pnpm report       # 报告与档案 CLI (new-intern/new-daily/new-weekly/new-monthly/new-doc)
pnpm task         # 任务树 CLI (add/done/list/stats/remove/move)
pnpm project      # 项目创建 CLI (new)
```

- 开发服务器固定端口 **5180**，base 路径 `/InternWiki/`
- `pnpm dev` 有热重载，修改 Markdown 内容会自动重新编译 Velite
- `tasks.json` 不经过 Velite，由 Vite 插件直接 serve，修改即时生效

## GitHub Actions 部署

项目配置了 GitHub Actions 自动部署（`.github/workflows/deploy.yml`）：

- **触发**：push 到 `main` 分支
- **流程**：pnpm install → velite build → vite build → upload-pages-artifact → deploy-pages
- **要求**：仓库需为 **public** 才能使用 GitHub Pages（private 仓库需要 GitHub Pro+）

## 注意事项

1. **修改内容后需重新编译**：运行 `pnpm content:build` 或 `pnpm dev`（热重载）
2. **tasks.json 不经过 Velite**：由 Vite 插件直接 serve，修改即时生效
3. **端口 5180**：开发服务器固定端口 5180，base 路径 `/InternWiki/`
4. **暗/亮模式**：CSS 变量 `:root`（亮色）/`.dark`（暗色）两套，导航栏可切换。修改样式时注意两套都改
5. **Tailwind v4 @theme**：颜色变量需在 `@theme` 块中注册为 `--color-xxx: var(--color-xxx)` 才能生成 `bg-card` / `text-heading` 等工具类
