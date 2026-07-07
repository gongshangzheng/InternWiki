---
name: internwiki-reports
description: InternWiki 报告与文档撰写指南。创建实习生档案、日报/周报/月报/技术文档、习惯打卡、wiki 风格内部链接。触发词：写日报、写周报、写月报、写文档、新建实习生、习惯打卡、报告模板、frontmatter、wiki链接。Use when creating intern profiles, writing daily/weekly/monthly reports, technical docs, habit tracking, or inserting wiki-style internal links in InternWiki.
---

# InternWiki 报告与文档撰写

## 快速创建

```bash
# 创建实习生档案
pnpm report new-intern --name 张三 --slug zhangsan --team 后端组 --role 后端开发实习生

# 日报/周报/月报
pnpm report new-daily   --intern alice [--date 2026-07-07]
pnpm report new-weekly  --intern alice [--week 2026-W28]
pnpm report new-monthly  --intern alice [--month 2026-07]

# 技术文档
pnpm report new-doc --intern alice --title "JWT 认证" [--slug jwt-auth]
```

详细模板和规范见 [report-templates.md](report-templates.md)。

## 日报模板

文件：`content/interns/{intern}/daily/YYYY-MM-DD.md`

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

周报/月报/技术文档模板详见 [report-templates.md](report-templates.md)。

## 习惯打卡格式

日报中使用 GFM task list + `#tag` 标记习惯：

```markdown
## 习惯打卡
- [x] 晨会 #routine
- [x] 代码审查 #growth
- [ ] 文档更新 #writing
```

- `- [x]` 已完成，`- [ ]` 未完成
- `#tag` 是习惯分类标签（routine/growth/writing/learning 等）
- 系统自动计算连续天数、完成率，在习惯追踪页面展示

## Wiki 风格内部链接

在报告和文档中可以引用项目或任务，系统自动转为可点击的 SPA 路由。

### 链接到项目

```markdown
今天主要在 [[project:search-engine]] 上工作。
今天主要在 [[project:search-engine|搜索引擎项目]] 上工作。
```

### 链接到任务

```markdown
完成了 [[task:search-engine/t2-3]] 的部署。
完成了 [[task:search-engine/t2-3|ES集群部署]] 的部署。
```

格式为 `[[task:项目slug/任务ID]]`。

### 链接语法总结

| 语法 | 效果 |
|------|------|
| `[[project:slug]]` | 跳转到项目 |
| `[[project:slug\|文字]]` | 自定义文字跳转项目 |
| `[[task:slug/id]]` | 跳转到任务详情 |
| `[[task:slug/id\|文字]]` | 自定义文字跳转任务 |
| `[文字](路径.md)` | 引用其他报告 |

## Frontmatter 规则

- Velite 自动从文件路径推断 `intern` 字段，无需手写
- `slug` 不指定时自动取文件名
- `title` 不指定时自动取 slug
- `date` 使用 ISO 8601 格式（YYYY-MM-DD）
- `tags` 为字符串数组

## 报告层级关系

系统自动建立报告间关联：

- 日报 → 所属周报（按 ISO 周匹配）
- 日报 → 所属月报（按年月匹配）
- 周报 → 所属月报

详情页底部自动显示关联报告链接，无需手动维护。
