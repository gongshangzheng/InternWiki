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
│   │   └── ...
│   ├── public/                   # 静态资源 (图片等)
│   ├── src/
│   └── velite.config.ts          # Velite 内容编译配置
├── scripts/cli.mjs               # CLI 工具
├── .github/workflows/deploy.yml  # GitHub Actions 自动部署
└── package.json
```

### 静态资源（图片）放置

图片等静态资源放在 `apps/web/public/` 目录下，按实习生和用途分类：

```
apps/web/public/
├── interns/
│   └── {slug}/
│       ├── daily/          # 日报配图
│       │   └── 2026-07-07-screenshot.png
│       ├── docs/           # 文档配图
│       │   └── architecture-diagram.png
│       └── projects/       # 项目截图
│           └── search-engine-arch.png
│       └── avatar.png     # 实习生头像
```

在 Markdown 中引用图片时使用绝对路径（带 base path）：

```markdown
![架构图](/InternWiki/interns/alice/docs/architecture-diagram.png)
```

注意：base path 为 `/InternWiki/`，所有 public 下的资源 URL 都需要加这个前缀。

也可使用相对路径引用同目录图片，但推荐统一放 public 下管理。

## 2. Git 分支工作流

**重要：每个实习生必须在自己的分支上工作。**

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

**不要直接提交到 main 分支。**

## 3. CLI 内容管理

CLI 工具位于 `scripts/cli.mjs`，通过 `pnpm cli` 调用。分为内容管理和任务管理两部分。

### 3.1 创建新实习生

```bash
pnpm cli new-intern --name 张三 --slug zhangsan --team 后端组 --role 后端开发实习生
```

自动创建目录结构和 `profile.md` 模板。参数：
- `--name` (必填) 中文姓名
- `--slug` (必填) 英文 slug，与目录名一致
- `--team` 所属团队
- `--role` 角色
- `--start-date` 入职日期

也可手动创建 `content/interns/{slug}/profile.md`：

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

### 3.2 创建报告

```bash
# 创建日报（自动用今天日期）
pnpm cli new-report --intern alice --type daily

# 创建指定日期的日报
pnpm cli new-report --intern alice --type daily --date 2026-07-07

# 创建周报（自动用当前 ISO 周）
pnpm cli new-report --intern alice --type weekly

# 创建指定周的周报
pnpm cli new-report --intern alice --type weekly --week 2026-W28

# 创建月报（自动用当前年月）
pnpm cli new-report --intern alice --type monthly

# 创建指定月的月报
pnpm cli new-report --intern alice --type monthly --month 2026-07
```

### 3.3 创建技术文档

```bash
pnpm cli new-doc --intern alice --title "Redis 缓存指南"
# 自动生成 slug: redis-cache-guide

pnpm cli new-doc --intern alice --title "JWT 认证" --slug jwt-auth
```

### 3.4 创建项目

```bash
pnpm cli new-project --intern alice --slug search-engine --title "搜索引擎" --summary "基于 Elasticsearch 的全文搜索" --category work
```

自动创建：
- `README.md` — 项目说明模板
- `tasks.json` — 空任务树
- `notes/` — 任务笔记目录

## 4. 撰写报告

### 4.1 日报

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

### 4.2 周报

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

### 4.3 月报

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

### 4.4 技术文档

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

### 4.5 共享文档

文件路径：`content/_shared/{slug}.md`（所有实习生共享）

## 5. 项目管理

### 5.1 项目 README

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

### 5.2 任务树 (tasks.json)

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

### 5.3 任务笔记

在 `content/interns/{intern}/projects/{slug}/notes/` 下创建 Markdown 文件，
任务中设置 `notePath: "notes/xxx.md"` 即可在 UI 中点击查看。

## 6. CLI 任务管理

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

## 7. 开发命令

```bash
pnpm dev          # 启动开发服务器 (port 5180, base /InternWiki/)
pnpm build        # 构建 (velite build + tsc + vite build)
pnpm preview      # 预览构建结果
pnpm content:build  # 仅编译 Velite 内容
pnpm typecheck    # 类型检查
pnpm cli          # CLI 工具入口
```

## 8. 内容规范

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

## 9. 页面功能说明

### 9.1 实习生仪表盘（`/interns/:name`）

- 日报热力图（26 周，GitHub 风格）
- 任务进度条（各项目完成率）
- 统计卡片（日报/周报/月报/项目数量）
- 最近报告列表（混合类型）
- 项目卡片

### 9.2 习惯追踪（`/interns/:name/habits`）

从日报的 `- [x] 习惯名 #tag` 自动解析：
- 连续打卡天数 + 最长连续天数
- 完成率百分比
- 30 天热力图（绿=完成，红=未完成，灰=无记录）
- 今日打卡完成率

### 9.3 日历（`/calendar`）

- 实习生选择器（URL `?intern=xxx` 同步，可分享）
- FullCalendar 6，五种视图：月/周/3日/日/列表
- 中文本地化，周一为首日
- 侧边栏：待办/已完成两个 Tab
  - 逾期任务（红色标记）
  - 今日待办
  - 无日期任务
  - 近期完成（30 天内）
- 点击任务弹出详情弹窗

### 9.4 搜索（`⌘K` / `Ctrl+K`）

- 导航栏点击「搜索」或按快捷键打开
- 覆盖日报/周报/月报/文档/项目/实习生
- 模糊匹配 + 键盘导航（↑↓ 选择，回车跳转）
- 按相关度排序，最多显示 20 条

### 9.5 使用指南（`/guide`）

导航栏「指南」入口，面向实习生的使用说明页面。

## 10. 项目计划与状态管理

### 10.1 用项目和任务树管理计划

每个实习生可以创建多个项目，每个项目有一棵任务树。任务树支持无限层级嵌套，适合管理从大方向到具体子任务的完整计划：

```json
{
  "id": "t1",
  "title": "搜索引擎项目",
  "status": "active",
  "children": [
    {
      "id": "t1-1",
      "title": "需求分析",
      "status": "completed",
      "children": [
        { "id": "t1-1-1", "title": "用户调研", "status": "completed", "children": [] }
      ]
    },
    {
      "id": "t1-2",
      "title": "爬虫模块",
      "status": "active",
      "children": []
    }
  ]
}
```

### 10.2 任务状态流转

```
planned → active → completed
   │         │
   │         ├──→ paused (暂停)
   │         └──→ blocked (被阻塞)
   └──→ active
```

| 状态 | 含义 | 图标 | 使用场景 |
|------|------|------|----------|
| `planned` | 计划中 | ⚪ | 任务已拆分但尚未开始 |
| `active` | 进行中 | 🔵 | 正在做的任务 |
| `completed` | 已完成 | ✅ | 任务完成（子任务全完成时父任务自动级联为完成）|
| `paused` | 暂停 | ⏸ | 临时搁置，之后可能继续 |
| `blocked` | 被阻塞 | 🔴 | 需要外部条件满足才能继续，配合 `blockedBy` 字段记录原因 |

### 10.3 级联完成

当某任务的所有子任务都变为 `completed` 时，父任务会自动显示为 `completed`（无需手动修改）。这在 UI 渲染时自动处理。

### 10.4 周期任务（recurring）

周期任务在 `recurring` 字段中配置，会在日历中自动展开为多个实例：

```json
{
  "id": "r-1",
  "title": "晨会",
  "status": "active",
  "recurring": {
    "pattern": "weekly",
    "startTime": "09:30",
    "endTime": "10:00",
    "location": "会议室A",
    "category": "work",
    "activeFrom": "2026-07-01",
    "activeUntil": null,
    "excludeDates": ["2026-07-15"]
  },
  "children": []
}
```

| 字段 | 说明 |
|------|------|
| `pattern` | `daily` / `weekly` / `every-N-days` |
| `every` | 当 pattern 为 `every-N-days` 时的间隔天数 |
| `startTime` / `endTime` | 时间（HH:MM），出现在日历时间轴 |
| `location` | 地点 |
| `category` | 日历分类颜色（study/health/work/social/life/other）|
| `activeFrom` | 生效起始日期 |
| `activeUntil` | 结束日期（null = 无限期）|
| `excludeDates` | 排除的日期数组（如法定假日）|
| `reportLevels` | 哪些报告层级需要包含此任务 |

### 10.5 任务阻塞依赖

当任务被阻塞时，用 `blockedBy` 字段记录原因：

```json
{
  "id": "t2-3",
  "title": "部署 Elasticsearch 集群",
  "status": "blocked",
  "blockedBy": ["等待运维分配集群资源"],
  "children": []
}
```

### 10.6 项目状态

项目（README.md frontmatter）也有状态：

| 状态 | 含义 |
|------|------|
| `planned` | 计划阶段，尚未启动 |
| `active` | 进行中 |
| `completed` | 已完成 |
| `paused` | 暂停 |

### 10.7 项目 Timeline

项目 README 的 frontmatter 中可定义 `timeline` 记录里程碑：

```yaml
timeline:
  - date: 2026-07-07
    title: 项目立项
    type: milestone
    description: 完成需求分析和索引 Schema 设计。
  - date: 2026-07-15
    title: 爬虫模块上线
    type: progress
    description: 爬虫模块完成开发和测试。
  - date: 2026-07-20
    title: 遇到性能瓶颈
    type: blocker
    description: 索引写入速度不足，需要优化批写入策略。
```

Timeline 类型：`milestone`（里程碑）/ `progress`（进展）/ `blocker`（阻塞）/ `decision`（决策）/ `note`（备注）。

## 11. 注意事项

1. **修改内容后需重新编译**：运行 `pnpm content:build` 或 `pnpm dev`（热重载）
2. **tasks.json 不经过 Velite**：由 Vite 插件直接 serve，修改即时生效
3. **端口 5180**：开发服务器固定端口 5180，base 路径 `/InternWiki/`
4. **文件名规则**：日报 `YYYY-MM-DD.md`，周报 `YYYY-Wxx.md`，月报 `YYYY-MM.md`
5. **项目 README**：文件名必须为 `README.md`，放在项目目录下
6. **图片资源**：放 `apps/web/public/interns/{slug}/` 下，Markdown 中用 `/InternWiki/interns/{slug}/xxx.png` 引用
7. **Git 分支**：必须在自己的 `intern-xxx` 分支上工作
8. **暗/亮模式**：CSS 变量 `:root`（亮）/`.dark`（暗）两套，导航栏可切换
9. **GitHub Actions**：push 到 main 自动构建部署（仓库需为 public 才能用 GitHub Pages）
