# 任务高级功能

## 目录

1. [任务字段完整说明](#1-任务字段完整说明)
2. [周期任务 (recurring)](#2-周期任务-recurring)
3. [任务阻塞依赖](#3-任务阻塞依赖)
4. [项目 Timeline](#4-项目-timeline)
5. [任务笔记](#5-任务笔记)

---

## 1. 任务字段完整说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一 ID，英文 slug 或 t-NNNN |
| `title` | string | 任务标题 |
| `status` | string | 任务状态（planned/active/completed/paused/blocked） |
| `assignee` | string? | 执行人 |
| `startDate` / `endDate` | string? | 起止日期 |
| `description` | string? | 任务描述 |
| `notePath` | string? | 任务笔记路径（相对项目目录，如 `notes/detail.md`） |
| `tags` | string[]? | 标签 |
| `startTime` / `endTime` | string? | 定时时间（HH:MM），用于日历显示 |
| `location` | string? | 地点 |
| `category` | string? | 日历分类（study/health/work/social/life/other） |
| `blockedBy` | string[]? | 阻塞依赖（见 §3） |
| `recurring` | object? | 周期任务配置（见 §2） |
| `children` | TaskNode[] | 子任务 |

---

## 2. 周期任务 (recurring)

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

## 3. 任务阻塞依赖

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

## 4. 项目 Timeline

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

## 5. 任务笔记

在 `notes/` 下创建 Markdown 文件，任务中设置 `notePath: "notes/xxx.md"` 即可在 UI 中点击查看。
