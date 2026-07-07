---
name: internwiki-overview
description: InternWiki 项目概览与全局规则。首次接触项目、不确定目录结构或全局约定时使用。触发词：InternWiki 概览、项目结构、全局规则、CLI 速查、开发命令。Use when onboarding to the InternWiki project, understanding directory structure, or checking global conventions.
---

# InternWiki 项目概览

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
├── scripts/                     # CLI 工具 (按领域拆分)
│   ├── report.mjs               #   报告与档案
│   ├── task.mjs                 #   任务树
│   └── project.mjs              #   项目创建
└── .github/workflows/deploy.yml  # GitHub Actions
```

## 任务路由：你需要做什么？

根据任务类型，选择对应的 skill 获取详细模板和规范。

| 任务 | Skill | 关键命令 |
|------|-------|----------|
| 创建实习生档案 | `internwiki-reports` | `pnpm report new-intern --name 张三 --slug zhangsan` |
| 写日报/周报/月报 | `internwiki-reports` | `pnpm report new-daily --intern alice` |
| 写技术文档 | `internwiki-reports` | `pnpm report new-doc --intern alice --title "Redis 指南"` |
| 在报告中链接项目/任务 | `internwiki-reports` | `[[project:slug]]` / `[[task:slug/id]]` |
| 创建项目 | `internwiki-projects` | `pnpm project new --intern alice --slug xxx` |
| 管理任务树 | `internwiki-projects` | `pnpm task add/list/done/move/remove` |
| 放置图片/截图 | `internwiki-devops` | 放 `public/interns/{slug}/` 下 |
| Git 分支操作 | `internwiki-devops` | `git checkout -b intern-xxx` |

## CLI 速查

```bash
# ── 报告与档案 (pnpm report) ──
pnpm report new-intern   --name 张三 --slug zhangsan --team 后端组
pnpm report new-daily    --intern alice [--date 2026-07-07]
pnpm report new-weekly   --intern alice [--week 2026-W28]
pnpm report new-monthly  --intern alice [--month 2026-07]
pnpm report new-doc      --intern alice --title "JWT 认证" [--slug jwt-auth]

# ── 项目创建 (pnpm project) ──
pnpm project new --intern alice --slug search-engine --title "搜索引擎"

# ── 任务管理 (pnpm task) ──
pnpm task add    --intern alice --project xxx --title "任务名" [--parent t1] [--status planned]
pnpm task done   --intern alice --project xxx --id t1-2
pnpm task list   --intern alice --project xxx
pnpm task stats  --intern alice
pnpm task remove --intern alice --project xxx --id t1-3
pnpm task move   --intern alice --project xxx --id t1-2 --parent t3

# ── 开发 ──
pnpm dev            # 开发服务器 (port 5180, base /InternWiki/)
pnpm build          # 构建 (velite + tsc + vite)
pnpm content:build  # 仅编译 Velite 内容
pnpm typecheck      # 类型检查
```

## 全局规则

以下规则适用于所有操作：

1. **Git 分支**：每个实习生必须在自己的 `intern-xxx` 分支上工作，不要直接提交到 main。详见 `internwiki-devops` skill。

2. **内容编译**：修改 Markdown 内容后需运行 `pnpm content:build` 重新编译 Velite（或用 `pnpm dev` 热重载）。`tasks.json` 不经过 Velite，修改即时生效。

3. **Base path**：所有 URL 需带 `/InternWiki/` 前缀。图片引用：`![图](/InternWiki/interns/alice/docs/diagram.png)`。

4. **文件命名**：日报 `YYYY-MM-DD.md`，周报 `YYYY-Wxx.md`（ISO 周），月报 `YYYY-MM.md`。项目说明文件必须叫 `README.md`。

5. **Frontmatter**：Velite 自动从路径推断 `intern` 字段，无需手写。`slug` 不指定时取文件名，`title` 不指定时取 slug。

6. **写作理念**：这个项目配合 Agent 使用，但关键内容（遇到的困难、解决方案、技术决策原因）应由实习生自己动笔，不要完全依赖 AI 写作。
