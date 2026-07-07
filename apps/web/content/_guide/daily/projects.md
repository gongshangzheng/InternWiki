---
title: 项目管理
slug: projects
category: 日常使用
order: 5
summary: 使用 CLI 创建项目、管理任务树、跟踪状态和记录任务笔记。
---

## 创建项目

```bash
pnpm project new --intern zhangsan --slug my-project --title "我的项目" --summary "一句话描述"
```

这会创建：
- `projects/my-project/README.md` — 项目说明
- `projects/my-project/tasks.json` — 任务树（空）
- `projects/my-project/notes/` — 任务笔记目录

---

## 管理任务

```bash
# 添加任务
pnpm task add --intern zhangsan --project my-project --title "设计数据库 Schema"

# 添加子任务
pnpm task add --intern zhangsan --project my-project --title "用户表设计" --parent t1

# 标记完成
pnpm task done --intern zhangsan --project my-project --id t1-1

# 查看任务树
pnpm task list --intern zhangsan --project my-project

# 查看统计
pnpm task stats --intern zhangsan
```

---

## 任务状态

| 状态 | 含义 | 图标 |
|------|------|------|
| planned | 计划中，尚未开始 | ⚪ |
| active | 正在进行 | 🔵 |
| completed | 已完成 | ✅ |
| paused | 暂停 | ⏸ |
| blocked | 被阻塞 | 🔴 |

### 状态流转规则

- `planned` → `active`：开始工作时手动切换
- `active` → `completed`：任务完成后标记
- `active` → `paused`：临时搁置（需说明原因）
- `active` → `blocked`：被外部依赖阻塞（需注明阻塞对象）
- 子任务全部 `completed` 时，父任务自动标记为 `completed`

---

## 任务笔记

在 `projects/{slug}/notes/` 下创建 Markdown 文件，然后在任务中设置 `notePath`：

```json
{
  "id": "t2",
  "title": "爬虫模块",
  "notePath": "notes/crawler-design.md",
  ...
}
```

点击项目页任务树中的任务即可查看笔记。笔记支持完整的 Markdown 渲染，包括代码块、表格和内部链接。

---

## 周期任务与阻塞依赖

任务支持 `recurring` 字段来定义周期性任务（如每日站会），以及 `blockedBy` 字段来声明任务间的依赖关系。这些信息会在日历页和项目 Timeline 中可视化展示。
