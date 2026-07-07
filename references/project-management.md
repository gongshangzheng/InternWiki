# 项目管理与任务树

创建项目、管理任务树、状态流转、周期任务、阻塞依赖、Timeline 的完整指南。

## 目录

1. [创建项目](#1-创建项目)
2. [任务树结构 (tasks.json)](#2-任务树结构-tasksjson)
3. [任务状态流转](#3-任务状态流转)
4. [级联完成](#4-级联完成)
5. [周期任务 (recurring)](#5-周期任务-recurring)
6. [任务阻塞依赖](#6-任务阻塞依赖)
7. [项目 Timeline](#7-项目-timeline)
8. [CLI 任务管理命令](#8-cli-任务管理命令)

---

## 1. 创建项目

```bash
pnpm cli new-project --intern alice --slug search-engine --title "搜索引擎" --summary "基于 ES 的全文搜索" --category work
```

自动创建 `content/interns/{intern}/projects/{slug}/`：
- `README.md` — 项目说明模板
- `tasks.json` — 空任务树
- `notes/` — 任务笔记目录

### 项目 README 模板

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

**项目状态**：`planned`(计划) / `active`(进行中) / `completed`(已完成) / `paused`(暂停)

---

## 2. 任务树结构 (tasks.json)

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

任务树支持无限层级嵌套，适合管理从大方向到具体子任务的完整计划。

### 任务字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一 ID，英文 slug 或 t-NNNN |
| `title` | string | 任务标题 |
| `status` | string | 任务状态（见 §3） |
| `assignee` | string? | 执行人 |
| `startDate` / `endDate` | string? | 起止日期 |
| `description` | string? | 任务描述 |
| `notePath` | string? | 任务笔记路径（相对项目目录，如 `notes/detail.md`） |
| `tags` | string[]? | 标签 |
| `startTime` / `endTime` | string? | 定时时间（HH:MM），用于日历显示 |
| `location` | string? | 地点 |
| `category` | string? | 日历分类（study/health/work/social/life/other） |
| `blockedBy` | string[]? | 阻塞依赖（见 §6） |
| `recurring` | object? | 周期任务配置（见 §5） |
| `children` | TaskNode[] | 子任务 |

### 任务笔记

在 `notes/` 下创建 Markdown 文件，任务中设置 `notePath: "notes/xxx.md"` 即可在 UI 中点击查看。

---

## 3. 任务状态流转

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
| `completed` | 已完成 | ✅ | 任务完成 |
| `paused` | 暂停 | ⏸ | 临时搁置，之后可能继续 |
| `blocked` | 被阻塞 | 🔴 | 需要外部条件满足才能继续，配合 `blockedBy` 字段 |

---

## 4. 级联完成

当某任务的所有子任务都变为 `completed` 时，父任务会自动显示为 `completed`（无需手动修改）。这在 UI 渲染时自动处理。

所以拆解任务时，把最底层的子任务标记完成即可，父任务会自动跟进。

---

## 5. 周期任务 (recurring)

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
| `category` | 日历分类颜色（study/health/work/social/life/other） |
| `activeFrom` | 生效起始日期 |
| `activeUntil` | 结束日期（null = 无限期） |
| `excludeDates` | 排除的日期数组（如法定假日） |
| `reportLevels` | 哪些报告层级需要包含此任务 |

---

## 6. 任务阻塞依赖

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

`blockedBy` 是字符串数组，每个元素是一条阻塞原因描述（不是任务 ID 引用，而是人类可读的原因说明）。

---

## 7. 项目 Timeline

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

Timeline 类型：

| 类型 | 含义 |
|------|------|
| `milestone` | 里程碑节点 |
| `progress` | 进展记录 |
| `blocker` | 遇到的阻塞 |
| `decision` | 关键决策 |
| `note` | 备注信息 |

---

## 8. CLI 任务管理命令

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

### task add 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--intern` | 是 | 实习生 slug |
| `--project` | 是 | 项目 slug |
| `--title` | 是 | 任务标题 |
| `--parent` | 否 | 父任务 ID（不指定则添加到根级） |
| `--status` | 否 | 状态（默认 planned） |
| `--assignee` | 否 | 执行人（默认同 intern） |
| `--description` | 否 | 任务描述 |
| `--notePath` | 否 | 笔记路径 |
| `--startDate` / `--endDate` | 否 | 日期 |
| `--tags` | 否 | 逗号分隔标签 |
