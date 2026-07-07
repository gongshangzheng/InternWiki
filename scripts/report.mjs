#!/usr/bin/env node

/**
 * InternWiki Report CLI — 实习生档案与报告管理
 *
 * Usage:
 *   pnpm report new-intern  --name 张三 --slug zhangsan [--team 后端组] [--role 实习生] [--start-date 2026-07-01]
 *   pnpm report new-daily   --intern alice [--date 2026-07-07]
 *   pnpm report new-weekly  --intern alice [--week 2026-W28]
 *   pnpm report new-monthly --intern alice [--month 2026-07]
 *   pnpm report new-doc     --intern alice --title "Redis 指南" [--slug redis-guide]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_ROOT = resolve(__dirname, '..', 'apps', 'web', 'content')
const INTERN_ROOT = resolve(CONTENT_ROOT, 'interns')

// ── Helpers ──────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {}
  const positional = []
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        args[key] = next
        i++
      } else {
        args[key] = true
      }
    } else {
      positional.push(arg)
    }
  }
  return { args, positional }
}

function getIsoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// ── Commands ─────────────────────────────────────────────────

function cmdNewIntern(args) {
  const name = args.name
  const slug = args.slug
  const team = args.team || '未分组'
  const role = args.role || '实习生'
  const startDate = args['start-date'] || args.startDate || new Date().toISOString().slice(0, 10)

  if (!name || !slug) {
    console.error('✗ --name and --slug are required')
    console.error('  pnpm report new-intern --name 张三 --slug zhangsan --team 后端组 --role 后端开发实习生 --start-date 2026-07-01')
    process.exit(1)
  }

  const internDir = resolve(INTERN_ROOT, slug)
  if (existsSync(resolve(internDir, 'profile.md'))) {
    console.error(`✗ Intern already exists: ${slug}`)
    process.exit(1)
  }

  mkdirSync(resolve(internDir, 'daily'), { recursive: true })
  mkdirSync(resolve(internDir, 'weekly'), { recursive: true })
  mkdirSync(resolve(internDir, 'monthly'), { recursive: true })
  mkdirSync(resolve(internDir, 'docs'), { recursive: true })
  mkdirSync(resolve(internDir, 'projects'), { recursive: true })

  const profile = `---
name: ${name}
slug: ${slug}
team: ${team}
role: ${role}
startDate: ${startDate}
---

## 自我介绍

${name}，${role}。

## 技术栈

- **语言**: 
- **框架**: 
- **工具**: 

## 联系方式

- GitHub: 
- Email: 
`
  writeFileSync(resolve(internDir, 'profile.md'), profile)
  console.log(`✓ Created intern: ${name} (${slug})`)
  console.log(`  → ${internDir}`)
  console.log('  Run pnpm content:build to compile.')
}

function cmdNewReport(args, type) {
  const intern = args.intern
  let date = args.date

  if (!intern) {
    console.error('✗ --intern is required')
    console.error('  pnpm report new-daily   --intern alice [--date 2026-07-07]')
    console.error('  pnpm report new-weekly  --intern alice [--week 2026-W28]')
    console.error('  pnpm report new-monthly --intern alice [--month 2026-07]')
    process.exit(1)
  }

  const now = new Date()
  let slug, title, dateStr, weekday

  if (type === 'daily') {
    const d = date ? new Date(date) : now
    dateStr = d.toISOString().slice(0, 10)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    weekday = weekdays[d.getDay()]
    slug = dateStr
    title = `日报 - ${dateStr} ${weekday}`
  } else if (type === 'weekly') {
    slug = args.week || getIsoWeek(now)
    dateStr = now.toISOString().slice(0, 10)
    title = `周报 - ${slug}`
  } else if (type === 'monthly') {
    slug = args.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    dateStr = now.toISOString().slice(0, 10)
    title = `月报 - ${slug}`
  }

  const dir = resolve(INTERN_ROOT, intern, type)
  const filepath = resolve(dir, `${slug}.md`)

  if (existsSync(filepath)) {
    console.error(`✗ Report already exists: ${filepath}`)
    process.exit(1)
  }

  mkdirSync(dir, { recursive: true })

  const content = type === 'daily'
    ? `---
title: ${title}
slug: ${slug}
date: ${dateStr}
summary: 
tags: []
---

## 今日完成

- 

## 进行中

- 

## 阻塞项

- 无

## 笔记

## 习惯打卡

- [ ] 晨会 #routine
`
    : type === 'weekly'
    ? `---
title: ${title}
slug: ${slug}
date: ${dateStr}
summary: 
tags: [周报]
---

## 本周总结


## 关键成果

- 

## 数据

- PR 合并: 0
- 代码审查: 0
- Bug 修复: 0
- 文档撰写: 0

## 下周计划

- 

## 反思

`
    : `---
title: ${title}
slug: ${slug}
date: ${dateStr}
summary: 
tags: [月报]
---

## 月度概览


## 重要成果

- 

## 月度数据

- 工作日: 0
- PR 合并: 0
- 代码审查: 0
- Bug 修复: 0
- 文档产出: 0

## 成长复盘

### 技术成长

### 协作成长

## 下月计划

- 
`

  writeFileSync(filepath, content)
  console.log(`✓ Created ${type} report: ${title}`)
  console.log(`  → ${filepath}`)
  console.log('  Run pnpm content:build to compile.')
}

function cmdNewDoc(args) {
  const intern = args.intern
  const title = args.title
  const slug = args.slug || title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)

  if (!intern || !title) {
    console.error('✗ --intern and --title are required')
    console.error('  pnpm report new-doc --intern alice --title "Redis 缓存指南" [--slug redis-guide]')
    process.exit(1)
  }

  if (!slug) {
    console.error('✗ Could not generate slug from title. Provide --slug manually.')
    process.exit(1)
  }

  const dir = resolve(INTERN_ROOT, intern, 'docs')
  const filepath = resolve(dir, `${slug}.md`)

  if (existsSync(filepath)) {
    console.error(`✗ Doc already exists: ${filepath}`)
    process.exit(1)
  }

  mkdirSync(dir, { recursive: true })

  const date = new Date().toISOString().slice(0, 10)
  const content = `---
title: ${title}
slug: ${slug}
date: ${date}
summary: 
tags: []
---

## 背景


## 正文

`

  writeFileSync(filepath, content)
  console.log(`✓ Created doc: ${title}`)
  console.log(`  → ${filepath}`)
  console.log('  Run pnpm content:build to compile.')
}

// ── Main ─────────────────────────────────────────────────────

const HELP = `
InternWiki Report CLI — 实习生档案与报告管理

Commands:
  pnpm report new-intern   --name 张三 --slug zhangsan [--team 后端组] [--role 实习生] [--start-date 2026-07-01]
  pnpm report new-daily    --intern <slug> [--date YYYY-MM-DD]
  pnpm report new-weekly   --intern <slug> [--week YYYY-Wxx]
  pnpm report new-monthly  --intern <slug> [--month YYYY-MM]
  pnpm report new-doc      --intern <slug> --title "标题" [--slug custom-slug]

Examples:
  pnpm report new-intern   --name 张三 --slug zhangsan --team 后端组
  pnpm report new-daily    --intern alice
  pnpm report new-doc      --intern alice --title "Redis 缓存指南"
`

const { args, positional } = parseArgs(process.argv)

if (positional.length === 0 || positional[0] === 'help' || args.help) {
  console.log(HELP)
  process.exit(0)
}

const command = positional[0]

switch (command) {
  case 'new-intern':
    cmdNewIntern(args)
    break
  case 'new-daily':
    cmdNewReport(args, 'daily')
    break
  case 'new-weekly':
    cmdNewReport(args, 'weekly')
    break
  case 'new-monthly':
    cmdNewReport(args, 'monthly')
    break
  case 'new-doc':
    cmdNewDoc(args)
    break
  default:
    console.error(`✗ Unknown command: ${command}`)
    console.error(HELP)
    process.exit(1)
}
