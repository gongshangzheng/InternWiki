---
description: InternWiki 实习生文档平台使用指南。当用户需要创建实习生内容、管理任务、撰写报告、或操作 InternWiki 框架时使用。触发词：添加实习生、写日报、写周报、写月报、新建项目、任务管理、InternWiki。
globs: ["**/InternWiki/**", "**/InternWiki"]
---

# InternWiki 使用指南

InternWiki 是多人实习文档平台。每个实习生拥有独立命名空间，管理日报/周报/月报/文档/项目任务树。
技术栈：Vite 6 + React 19 + TypeScript + Tailwind v4 + Velite + React Router v7。

## 1. 目录结构

```
InternWiki/
├── apps/web/
│   ├── content/
│   │   ├── _shared/              # 团队共享文档
│   │   └── interns/
│   │       ├── {slug}/           # 每个实习生一个目录
│   │       │   ├── profile.md    # 实习生档案
│   │       │   ├── daily/        # 日报 (slug=YYYY-MM-DD)
│   │       │   ├── weekly/       # 周报 (slug=YYYY-Wxx)
│   │       │   ├── monthly/      # 月报 (slug=YYYY-MM)
│   │       │   ├── docs/         # 技术文档
│   │       │   └── projects/
│   │       │       └── {slug}/
│   │       │           ├── README.md    # 项目说明
│   │       │           ├── tasks.json  # 任务树
│   │       │           └── notes/      # 任务笔记 (可选)
│   │       └── ...
│   ├── src/
│   └── velite.config.ts          # Velite 内容编译配置
├── scripts/cli.mjs               # CLI 任务管理
└── package.json
```

## 2. 创建新实习生

在 `content/interns/{slug}/profile.md` 创建文件：

```markdown
---
name: 张三
slug: zhangsan
team: 后端组
role: 后端开发实习生
startDate: 2026-07-01
---

## 自我介绍

简短的自我介绍。

## 技术栈

- **语言**: Python, Go
- **框架**: Gin, FastAPI
```

**规则**：
- `slug` 必须为英文，与目录名一致
- `name` 为中文姓名
- 创建后需运行 `pnpm content:build` 重新编译 Velite

## 3. 撰写报告

### 日报

文件路径：`content/interns/{intern}/daily/YYYY-MM-DD.md`

```markdown
---
title: 日报 - 2026-07-07 周二
slug: 2026-07-07
date: 2026-07-07
summary: 一句话总结今日工作
tags: [后端, API]
---

## 今日完成

- 完成了 XXX 功能
- 修复了 YYY Bug

## 进行中

- ZZZ 模块开发 (50%)

## 阻塞项

- 等待 XXX 资源

## 笔记

技术笔记/学习记录。

## 习惯打卡

- [x] 晨会 #routine
- [x] 代码审查 #growth
- [ ] 文档更新 #writing
```

### 周报

文件路径：`content/interns/{intern}/weekly/YYYY-Wxx.md`（ISO 周编号）

```markdown
---
title: 周报 - 2026-W27
slug: 2026-W27
date: 2026-07-04
summary: 一句话总结本周工作
tags: [周报]
---

## 本周总结

本周主要完成了...

## 关键成果

- 成果 1
- 成果 2

## 数据

- PR 合并: X
- 代码审查: Y
- Bug 修复: Z

## 下周计划

- 计划 1
- 计划 2

## 反思

本周的收获与反思。
```

### 月报

文件路径：`content/interns/{intern}/monthly/YYYY-MM.md`

```markdown
---
title: 月报 - 2026-06
slug: 2026-06
date: 2026-06-30
summary: 一句话总结本月工作
tags: [月报]
---

## 月度概览

本月主要...

## 重要成果

- 成果 1

## 月度数据

- 工作日: 22
- PR 合并: 12

## 成长复盘

### 技术成长
### 协作成长

## 下月计划

- 计划 1
```

### 技术文档

文件路径：`content/interns/{intern}/docs/{slug}.md`

```markdown
---
title: JWT 认证指南
slug: jwt-auth-guide
date: 2026-07-05
summary: JWT token 签发与校验的实践指南
tags: [认证, JWT, 安全]
---

正文内容，支持完整 Markdown 语法...
```

### 共享文档

文件路径：`content/_shared/{slug}.md`（所有实习生共享）

## 4. 创建项目

### 4.1 项目 README

在 `content/interns/{intern}/projects/{slug}/README.md` 创建：

```markdown
---
title: 搜索引擎
slug: search-engine
status: active
startDate: 2026-07-07
endDate: null
category: work
tags: [搜索引擎, Elasticsearch]
summary: 一句话项目描述
---

## 项目背景

...

## 技术方案

- **技术 1**: ...

## 当前阶段

...
```

**项目状态**：`active` / `completed` / `paused` / `planned`

### 4.2 任务树 (tasks.json)

在同目录创建 `tasks.json`：

```json
{
  "project": "search-engine",
  "intern": "alice",
  "tasks": [
    {
      "id": "t1",
      "title": "需求分析",
      "status": "completed",
      "assignee": "alice",
      "startDate": "2026-07-07",
      "endDate": "2026-07-07",
      "description": "需求调研与架构设计",
      "tags": ["设计"],
      "children": [
        {
          "id": "t1-1",
          "title": "需求调研",
          "status": "completed",
          "assignee": "alice",
          "startDate": null,
          "endDate": null,
          "description": "",
          "children": []
        }
      ]
    }
  ]
}
```

**任务状态**：`planned` / `active` / `completed` / `paused` / `blocked`

**任务字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一 ID，英文 slug 或 t-NNNN |
| `title` | string | 任务标题 |
| `status` | string | 任务状态 |
| `assignee` | string? | 执行人 |
| `startDate` / `endDate` | string? | 起止日期 |
| `description` | string? | 任务描述 |
| `notePath` | string? | 任务笔记路径（相对项目目录，如 `notes/detail.md`） |
| `tags` | string[]? | 标签 |
| `startTime` / `endTime` | string? | 定时时间（HH:MM） |
| `location` | string? | 地点 |
| `category` | string? | 日历分类（study/health/work/social/life/other） |
| `blockedBy` | string[]? | 阻塞依赖 |
| `recurring` | object? | 周期任务配置 |
| `children` | TaskNode[] | 子任务 |

### 4.3 任务笔记

在 `content/interns/{intern}/projects/{slug}/notes/` 下创建 Markdown 文件，
任务中设置 `notePath: "notes/xxx.md"` 即可在 UI 中点击查看。

## 5. CLI 任务管理

```bash
# 添加任务
pnpm cli task add --intern alice --project search-engine --title "write tests" --parent t2 --status planned --tags test,quality

# 标记完成
pnpm cli task done --intern alice --project search-engine --id t2-2

# 列出任务树
pnpm cli task list --intern alice --project search-engine

# 查看统计（聚合所有项目）
pnpm cli task stats --intern alice

# 删除任务
pnpm cli task remove --intern alice --project search-engine --id t2-3

# 移动任务到新父节点
pnpm cli task move --intern alice --project search-engine --id t2-2 --parent t3
```

**task add 参数**：
- `--intern` (必填) 实习生 slug
- `--project` (必填) 项目 slug
- `--title` (必填) 任务标题
- `--parent` 父任务 ID（不指定则添加到根级）
- `--status` 状态（默认 planned）
- `--assignee` 执行人（默认同 intern）
- `--description` 任务描述
- `--notePath` 笔记路径
- `--startDate` / `--endDate` 日期
- `--tags` 逗号分隔标签

## 6. 开发命令

```bash
pnpm dev          # 启动开发服务器 (port 5180, base /InternWiki/)
pnpm build        # 构建 (velite build + tsc + vite build)
pnpm preview      # 预览构建结果
pnpm content:build  # 仅编译 Velite 内容
pnpm typecheck    # 类型检查
pnpm cli          # CLI 工具入口
```

## 7. 内容规范

### Frontmatter 规则

- Velite 自动从文件路径推断 `intern` 字段，无需手写
- `slug` 不指定时自动取文件名
- `title` 不指定时自动取 slug
- `date` 使用 ISO 8601 格式（YYYY-MM-DD）
- `tags` 为字符串数组

### 习惯打卡格式

日报中使用 GFM task list + `#tag` 标记习惯：

```markdown
## 习惯打卡

- [x] 晨会 #routine
- [x] 代码审查 #growth
- [ ] 文档更新 #writing
```

### 报告层级关系

- 日报 → 所属周报（按 ISO 周匹配）
- 日报 → 所属月报（按年月匹配）
- 周报 → 所属月报
- 详情页底部自动显示关联报告链接

## 8. 注意事项

1. **修改内容后需重新编译**：运行 `pnpm content:build` 或 `pnpm dev`（热重载）
2. **tasks.json 不经过 Velite**：由 Vite 插件直接 serve，修改即时生效
3. **端口 5180**：开发服务器固定端口 5180，base 路径 `/InternWiki/`
4. **文件名规则**：日报 `YYYY-MM-DD.md`，周报 `YYYY-Wxx.md`，月报 `YYYY-MM.md`
5. **项目 README**：文件名必须为 `README.md`，放在项目目录下
