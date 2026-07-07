# 内容创建指南

创建实习生档案、日报/周报/月报、技术文档的完整模板和规范。

## 目录

1. [创建新实习生](#1-创建新实习生)
2. [日报](#2-日报)
3. [周报](#3-周报)
4. [月报](#4-月报)
5. [技术文档](#5-技术文档)
6. [共享文档](#6-共享文档)
7. [Frontmatter 规则](#7-frontmatter-规则)
8. [习惯打卡格式](#8-习惯打卡格式)
9. [报告层级关系](#9-报告层级关系)
10. [内部链接语法](#10-内部链接语法)

---

## 1. 创建新实习生

```bash
pnpm cli new-intern --name 张三 --slug zhangsan --team 后端组 --role 后端开发实习生
```

参数：`--name`(必填) `--slug`(必填) `--team` `--role` `--start-date`

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

**规则**：`slug` 必须为英文且与目录名一致；`name` 为中文姓名；创建后运行 `pnpm content:build`。

---

## 2. 日报

文件路径：`content/interns/{intern}/daily/YYYY-MM-DD.md`

```bash
pnpm cli new-report --intern alice --type daily
# 或指定日期
pnpm cli new-report --intern alice --type daily --date 2026-07-07
```

模板：

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

---

## 3. 周报

文件路径：`content/interns/{intern}/weekly/YYYY-Wxx.md`（ISO 周编号）

```bash
pnpm cli new-report --intern alice --type weekly
# 或指定周
pnpm cli new-report --intern alice --type weekly --week 2026-W28
```

模板：

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

---

## 4. 月报

文件路径：`content/interns/{intern}/monthly/YYYY-MM.md`

```bash
pnpm cli new-report --intern alice --type monthly
# 或指定月
pnpm cli new-report --intern alice --type monthly --month 2026-07
```

模板：

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

---

## 5. 技术文档

文件路径：`content/interns/{intern}/docs/{slug}.md`

```bash
pnpm cli new-doc --intern alice --title "Redis 缓存指南"
# 自动生成 slug: redis-cache-guide
pnpm cli new-doc --intern alice --title "JWT 认证" --slug jwt-auth
```

模板：

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

---

## 6. 共享文档

文件路径：`content/_shared/{slug}.md`（所有实习生共享，不带 intern 字段）

---

## 7. Frontmatter 规则

- Velite 自动从文件路径推断 `intern` 字段，无需手写
- `slug` 不指定时自动取文件名
- `title` 不指定时自动取 slug
- `date` 使用 ISO 8601 格式（YYYY-MM-DD）
- `tags` 为字符串数组

---

## 8. 习惯打卡格式

日报中使用 GFM task list + `#tag` 标记习惯，系统自动解析：

```markdown
## 习惯打卡

- [x] 晨会 #routine
- [x] 代码审查 #growth
- [ ] 文档更新 #writing
```

- `- [x]` 表示已完成，`- [ ]` 表示未完成
- `#tag` 是习惯的分类标签（如 routine/growth/writing/learning 等）
- 系统自动计算连续天数、完成率，在习惯追踪页面展示
- 详见 `app-features.md` §习惯追踪

---

## 9. 报告层级关系

系统自动建立报告间的关联：

- 日报 → 所属周报（按 ISO 周匹配）
- 日报 → 所属月报（按年月匹配）
- 周报 → 所属月报

详情页底部自动显示关联报告链接，无需手动维护。

---

## 10. 内部链接语法

在日报、周报、月报、技术文档、项目 README 中，可以使用 **wiki 风格链接**引用项目或任务。
系统会自动将链接转换为可点击的 SPA 内部路由。

### 链接到项目

```markdown
<!-- 自动用 slug 作为链接文字 -->
今天主要在 [[project:search-engine]] 上工作。

<!-- 自定义链接文字 -->
今天主要在 [[project:search-engine|搜索引擎项目]] 上工作。
```

渲染后点击跳转到该实习生的项目页面，自动选中对应项目 tab。

### 链接到任务

```markdown
<!-- 自动用 task ID 作为链接文字 -->
完成了 [[task:search-engine/t2-3]] 的部署。

<!-- 自定义链接文字 -->
完成了 [[task:search-engine/t2-3|ES集群部署]] 的部署。
```

格式为 `[[task:项目slug/任务ID]]`，渲染后点击跳转到项目页面，自动选中对应项目并展开任务详情。

### 链接到其他报告

也可以使用标准 Markdown 链接引用其他报告：

```markdown
详见 [周报 2026-W27](weekly/2026-W27.md)
参考 [Redis缓存指南](docs/redis-cache-guide.md)
```

系统会自动将 `.md` 后缀的内部链接转换为 SPA 路由。

### 链接语法总结

| 语法 | 效果 | 示例 |
|------|------|------|
| `[[project:slug]]` | 跳转到项目 | `[[project:search-engine]]` |
| `[[project:slug\|文字]]` | 自定义文字跳转项目 | `[[project:search-engine\|搜索引擎]]` |
| `[[task:slug/id]]` | 跳转到任务详情 | `[[task:search-engine/t2-3]]` |
| `[[task:slug/id\|文字]]` | 自定义文字跳转任务 | `[[task:search-engine/t2-3\|ES部署]]` |
| `[文字](路径.md)` | 引用其他报告 | `[周报](weekly/2026-W27.md)` |
