# 报告模板详细规范

## 目录

1. [创建新实习生](#1-创建新实习生)
2. [日报](#2-日报)
3. [周报](#3-周报)
4. [月报](#4-月报)
5. [技术文档](#5-技术文档)
6. [共享文档](#6-共享文档)

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
pnpm cli new-report --intern alice --type daily --date 2026-07-07
```

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
pnpm cli new-report --intern alice --type weekly --week 2026-W28
```

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
pnpm cli new-report --intern alice --type monthly --month 2026-07
```

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
pnpm cli new-doc --intern alice --title "JWT 认证" --slug jwt-auth
```

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
