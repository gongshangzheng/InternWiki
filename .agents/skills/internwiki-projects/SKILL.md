---
name: internwiki-projects
description: InternWiki 项目管理与任务树指南。创建项目、管理任务树、状态流转、周期任务、阻塞依赖、Timeline。触发词：新建项目、任务管理、tasks.json、任务状态、周期任务、阻塞依赖、项目Timeline、task命令。Use when creating projects, managing task trees, tracking task status, setting up recurring tasks, or handling blocked dependencies in InternWiki.
---

# InternWiki 项目管理与任务树

## 创建项目

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

## 任务状态流转

```
planned → active → completed
   │         │
   │         ├──→ paused (暂停)
   │         └──→ blocked (被阻塞)
   └──→ active
```

| 状态 | 含义 | 使用场景 |
|------|------|----------|
| `planned` | 计划中 | 任务已拆分但尚未开始 |
| `active` | 进行中 | 正在做的任务 |
| `completed` | 已完成 | 任务完成 |
| `paused` | 暂停 | 临时搁置 |
| `blocked` | 被阻塞 | 需外部条件满足，配合 `blockedBy` |

**级联完成**：当某任务的所有子任务都变为 `completed` 时，父任务自动显示为 completed。拆解任务时只需完成最底层子任务。

## CLI 任务管理

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

## tasks.json 结构

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
          "children": []
        }
      ]
    }
  ]
}
```

任务树支持无限层级嵌套。详细字段说明、周期任务、阻塞依赖、Timeline 见 [task-advanced.md](task-advanced.md)。
