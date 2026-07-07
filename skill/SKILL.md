---
description: InternWiki 实习生文档平台使用指南。当用户需要创建实习生内容、管理任务、撰写报告、操作 InternWiki 框架时使用。触发词：添加实习生、写日报、写周报、写月报、新建项目、任务管理、InternWiki、实习生日志。
globs: ["**/InternWiki/**", "**/InternWiki"]
---

# InternWiki 使用指南

InternWiki 是多人实习文档平台。每个实习生拥有独立命名空间，管理日报/周报/月报/文档/项目任务树。
技术栈：Vite 6 + React 19 + TypeScript + Tailwind v4 + Velite + React Router v7。

## 目录结构

```
InternWiki/
├── apps/web/
│   ├── content/
│   │   ├── _shared/              # 团队共享文档
│   │   └── interns/{slug}/      # 每个实习生一个目录
│   │       ├── profile.md        # 实习生档案
│   │       ├── daily/            # 日报 (YYYY-MM-DD)
│   │       ├── weekly/           # 周报 (YYYY-Wxx)
│   │       ├── monthly/          # 月报 (YYYY-MM)
│   │       ├── docs/             # 技术文档
│   │       └── projects/{slug}/  # 项目
│   │           ├── README.md     # 项目说明
│   │           ├── tasks.json    # 任务树
│   │           └── notes/        # 任务笔记 (可选)
│   ├── public/interns/{slug}/    # 静态资源 (图片等)
│   ├── src/
│   └── velite.config.ts
├── scripts/cli.mjs               # CLI 工具
└── .github/workflows/deploy.yml  # GitHub Actions
```

## 路由：你需要做什么？

根据任务类型，阅读对应的参考文件获取详细模板和规范。

| 任务 | 参考文件 | 关键命令 |
|------|----------|----------|
| 创建实习生档案 | `references/content-creation.md` §1 | `pnpm cli new-intern --name 张三 --slug zhangsan` |
| 写日报/周报/月报 | `references/content-creation.md` §2-4 | `pnpm cli new-report --intern alice --type daily` |
| 写技术文档 | `references/content-creation.md` §5 | `pnpm cli new-doc --intern alice --title "Redis 指南"` |
| 创建项目 | `references/project-management.md` §1 | `pnpm cli new-project --intern alice --slug xxx` |
| 管理任务树 | `references/project-management.md` §2-7 | `pnpm cli task add/list/done/move/remove` |
| 放置图片/截图 | `references/assets-and-git.md` §1 | 放 `public/interns/{slug}/` 下 |
| Git 分支操作 | `references/assets-and-git.md` §2 | `git checkout -b intern-xxx` |
| 了解页面功能 | `references/app-features.md` | 仪表盘/习惯/日历/搜索 |

## CLI 速查

```bash
# ── 内容管理 ──
pnpm cli new-intern --name 张三 --slug zhangsan --team 后端组
pnpm cli new-report --intern alice --type daily [--date 2026-07-07]
pnpm cli new-report --intern alice --type weekly [--week 2026-W28]
pnpm cli new-report --intern alice --type monthly [--month 2026-07]
pnpm cli new-doc --intern alice --title "JWT 认证" [--slug jwt-auth]
pnpm cli new-project --intern alice --slug search-engine --title "搜索引擎"

# ── 任务管理 ──
pnpm cli task add    --intern alice --project xxx --title "任务名" [--parent t1] [--status planned]
pnpm cli task done   --intern alice --project xxx --id t1-2
pnpm cli task list   --intern alice --project xxx
pnpm cli task stats  --intern alice
pnpm cli task remove --intern alice --project xxx --id t1-3
pnpm cli task move   --intern alice --project xxx --id t1-2 --parent t3

# ── 开发 ──
pnpm dev            # 开发服务器 (port 5180, base /InternWiki/)
pnpm build          # 构建 (velite + tsc + vite)
pnpm content:build  # 仅编译 Velite 内容
pnpm typecheck      # 类型检查
```

## 全局规则

以下规则适用于所有操作，务必遵守：

1. **Git 分支**：每个实习生必须在自己的 `intern-xxx` 分支上工作，不要直接提交到 main。详见 `references/assets-and-git.md` §2。

2. **内容编译**：修改 Markdown 内容后需运行 `pnpm content:build` 重新编译 Velite（或用 `pnpm dev` 热重载）。`tasks.json` 不经过 Velite，修改即时生效。

3. **Base path**：所有 URL 需带 `/InternWiki/` 前缀。图片引用：`![图](/InternWiki/interns/alice/docs/diagram.png)`。

4. **文件命名**：日报 `YYYY-MM-DD.md`，周报 `YYYY-Wxx.md`（ISO 周），月报 `YYYY-MM.md`。项目说明文件必须叫 `README.md`。

5. **Frontmatter**：Velite 自动从路径推断 `intern` 字段，无需手写。`slug` 不指定时取文件名，`title` 不指定时取 slug。

6. **写作理念**：这个项目配合 Agent 使用，但关键内容（遇到的困难、解决方案、技术决策原因）应由实习生自己动笔，不要完全依赖 AI 写作。

## 任务状态速查

```
planned → active → completed
   │         ├──→ paused (暂停)
   │         └──→ blocked (被阻塞，配合 blockedBy 字段)
```

子任务全完成时，父任务自动级联为 completed。详见 `references/project-management.md` §3-4。
