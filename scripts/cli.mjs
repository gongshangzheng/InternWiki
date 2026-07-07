#!/usr/bin/env node

/**
 * InternWiki CLI — task management
 *
 * Usage:
 *   pnpm cli task add    --intern alice --project search-engine --title "添加测试" [--parent t2] [--status planned] [--assignee alice] [--description "..."]
 *   pnpm cli task done   --intern alice --project search-engine --id t2-2
 *   pnpm cli task list   --intern alice --project search-engine
 *   pnpm cli task stats  --intern alice
 *   pnpm cli task remove  --intern alice --project search-engine --id t2-3
 *   pnpm cli task move   --intern alice --project search-engine --id t2-2 --parent t3
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs'
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

function getTasksPath(intern, project) {
  return resolve(INTERN_ROOT, intern, 'projects', project, 'tasks.json')
}

function loadTasks(intern, project) {
  const path = getTasksPath(intern, project)
  if (!existsSync(path)) {
    console.error(`✗ tasks.json not found: ${path}`)
    console.error(`  Expected at: content/interns/${intern}/projects/${project}/tasks.json`)
    process.exit(1)
  }
  const raw = readFileSync(path, 'utf-8')
  return JSON.parse(raw)
}

function saveTasks(intern, project, tree) {
  const path = getTasksPath(intern, project)
  const json = JSON.stringify(tree, null, 2) + '\n'
  writeFileSync(path, json)
  console.log(`✓ Saved: ${path}`)
}

function findTaskById(tasks, id, parent = null) {
  for (const task of tasks) {
    if (task.id === id) return { task, parent, siblings: tasks }
    if (task.children && task.children.length > 0) {
      const found = findTaskById(task.children, id, task)
      if (found) return found
    }
  }
  return null
}

function generateId(title, existingIds) {
  // Generate a readable ID: try English words, fallback to t-NNNN
  const slug = title
    .toLowerCase()
    .replace(/[\u4e00-\u9fff]+/g, '') // strip CJK
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)

  let id
  if (slug && !existingIds.has(slug)) {
    id = slug
  } else {
    // Fallback: t-NNNN (last 4 digits of timestamp)
    id = `t-${Date.now().toString().slice(-4)}`
    while (existingIds.has(id)) {
      id = `t-${Date.now().toString().slice(-4)}`
    }
  }
  return id
}

function collectAllIds(tasks, ids = new Set()) {
  for (const task of tasks) {
    ids.add(task.id)
    if (task.children) collectAllIds(task.children, ids)
  }
  return ids
}

function countTasks(tasks) {
  let total = 0
  let completed = 0
  let active = 0
  let planned = 0
  let paused = 0
  let blocked = 0
  for (const t of tasks) {
    total++
    if (t.status === 'completed') completed++
    else if (t.status === 'active') active++
    else if (t.status === 'planned') planned++
    else if (t.status === 'paused') paused++
    else if (t.status === 'blocked') blocked++
    if (t.children && t.children.length > 0) {
      const sub = countTasks(t.children)
      total += sub.total
      completed += sub.completed
      active += sub.active
      planned += sub.planned
      paused += sub.paused
      blocked += sub.blocked
    }
  }
  return { total, completed, active, planned, paused, blocked }
}

function findInternProjects(intern) {
  const internDir = resolve(INTERN_ROOT, intern)
  if (!existsSync(internDir)) return []
  const projectsDir = resolve(internDir, 'projects')
  if (!existsSync(projectsDir)) return []
  return readdirSync(projectsDir)
    .filter((d) => {
      const p = resolve(projectsDir, d)
      return statSync(p).isDirectory()
    })
    .filter((d) => existsSync(resolve(projectsDir, d, 'tasks.json')))
}

// ── Print helpers ────────────────────────────────────────────

const STATUS_ICONS = {
  completed: '✓',
  active: '●',
  planned: '○',
  paused: '⏸',
  blocked: '✗',
}

function printTaskTree(tasks, depth = 0, prefix = '') {
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i]
    const isLast = i === tasks.length - 1
    const branch = isLast ? '└── ' : '├── '
    const icon = STATUS_ICONS[t.status] ?? '?'
    const childPrefix = prefix + (isLast ? '    ' : '│   ')

    let line = `${prefix}${branch}${icon} `
    line += `[${t.status}] `
    line += t.title
    if (t.assignee) line += `  @${t.assignee}`
    if (t.startDate) line += `  (${t.startDate})`
    console.log(line)

    if (t.children && t.children.length > 0) {
      printTaskTree(t.children, depth + 1, childPrefix)
    }
  }
}

// ── Commands ─────────────────────────────────────────────────

function cmdAdd(args) {
  const { intern, project, title, parent, status, assignee, description, notePath, startDate, endDate, tags } = args

  if (!intern || !project || !title) {
    console.error('✗ Required: --intern, --project, --title')
    process.exit(1)
  }

  const tree = loadTasks(intern, project)
  const allIds = collectAllIds(tree.tasks)
  const id = generateId(title, allIds)

  const newTask = {
    id,
    title,
    status: status || 'planned',
    assignee: assignee || intern,
    startDate: startDate || null,
    endDate: endDate || null,
    description: description || '',
    children: [],
  }

  if (notePath) newTask.notePath = notePath
  if (tags) newTask.tags = tags.split(',').map((t) => t.trim())

  if (parent) {
    const found = findTaskById(tree.tasks, parent)
    if (!found) {
      console.error(`✗ Parent task not found: ${parent}`)
      process.exit(1)
    }
    found.task.children = found.task.children || []
    found.task.children.push(newTask)
  } else {
    tree.tasks.push(newTask)
  }

  saveTasks(intern, project, tree)
  console.log(`  Added: ${id} "${title}" ${parent ? `under ${parent}` : 'at root'}`)
}

function cmdDone(args) {
  const { intern, project, id } = args
  if (!intern || !project || !id) {
    console.error('✗ Required: --intern, --project, --id')
    process.exit(1)
  }

  const tree = loadTasks(intern, project)
  const found = findTaskById(tree.tasks, id)
  if (!found) {
    console.error(`✗ Task not found: ${id}`)
    process.exit(1)
  }

  found.task.status = 'completed'
  saveTasks(intern, project, tree)
  console.log(`  Done: ${id} "${found.task.title}"`)
}

function cmdList(args) {
  const { intern, project } = args
  if (!intern || !project) {
    console.error('✗ Required: --intern, --project')
    process.exit(1)
  }

  const tree = loadTasks(intern, project)
  const stats = countTasks(tree.tasks)

  console.log(`\n  ${intern} / ${project}`)
  console.log(`  ${stats.completed}/${stats.total} completed · ${stats.active} active · ${stats.planned} planned · ${stats.paused} paused · ${stats.blocked} blocked\n`)

  printTaskTree(tree.tasks)
  console.log()
}

function cmdStats(args) {
  const { intern } = args
  if (!intern) {
    console.error('✗ Required: --intern')
    process.exit(1)
  }

  const projects = findInternProjects(intern)
  if (projects.length === 0) {
    console.log(`\n  No projects found for intern: ${intern}\n`)
    return
  }

  let grandTotal = { total: 0, completed: 0, active: 0, planned: 0, paused: 0, blocked: 0 }

  console.log(`\n  ${intern} — task statistics\n`)
  for (const project of projects) {
    const tree = loadTasks(intern, project)
    const s = countTasks(tree.tasks)
    const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0

    console.log(`  ${project}`)
    console.log(`    ${s.completed}/${s.total} (${pct}%) · active: ${s.active} · planned: ${s.planned} · paused: ${s.paused} · blocked: ${s.blocked}`)

    const bar = renderBar(s.completed, s.total, 30)
    console.log(`    ${bar}\n`)

    grandTotal.total += s.total
    grandTotal.completed += s.completed
    grandTotal.active += s.active
    grandTotal.planned += s.planned
    grandTotal.paused += s.paused
    grandTotal.blocked += s.blocked
  }

  const pct = grandTotal.total > 0 ? Math.round((grandTotal.completed / grandTotal.total) * 100) : 0
  console.log(`  ── Total ──`)
  console.log(`    ${grandTotal.completed}/${grandTotal.total} (${pct}%) · active: ${grandTotal.active} · planned: ${grandTotal.planned} · paused: ${grandTotal.paused} · blocked: ${grandTotal.blocked}\n`)
}

function renderBar(completed, total, width) {
  if (total === 0) return '─'.repeat(width)
  const filled = Math.round((completed / total) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

function cmdRemove(args) {
  const { intern, project, id } = args
  if (!intern || !project || !id) {
    console.error('✗ Required: --intern, --project, --id')
    process.exit(1)
  }

  const tree = loadTasks(intern, project)
  const found = findTaskById(tree.tasks, id)
  if (!found) {
    console.error(`✗ Task not found: ${id}`)
    process.exit(1)
  }

  const idx = found.siblings.indexOf(found.task)
  found.siblings.splice(idx, 1)
  saveTasks(intern, project, tree)
  console.log(`  Removed: ${id} "${found.task.title}"`)
}

function cmdMove(args) {
  const { intern, project, id, parent } = args
  if (!intern || !project || !id) {
    console.error('✗ Required: --intern, --project, --id')
    process.exit(1)
  }

  const tree = loadTasks(intern, project)
  const found = findTaskById(tree.tasks, id)
  if (!found) {
    console.error(`✗ Task not found: ${id}`)
    process.exit(1)
  }

  // Remove from current position
  const idx = found.siblings.indexOf(found.task)
  found.siblings.splice(idx, 1)

  if (parent) {
    const target = findTaskById(tree.tasks, parent)
    if (!target) {
      console.error(`✗ Target parent not found: ${parent}`)
      // Re-insert at original position
      found.siblings.splice(idx, 0, found.task)
      process.exit(1)
    }
    target.task.children = target.task.children || []
    target.task.children.push(found.task)
  } else {
    // Move to root
    tree.tasks.push(found.task)
  }

  saveTasks(intern, project, tree)
  console.log(`  Moved: ${id} → ${parent || 'root'}`)
}

// ── Content management commands ─────────────────────────────

function getIsoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function cmdNewIntern(args) {
  const name = args.name
  const slug = args.slug
  const team = args.team || '未分组'
  const role = args.role || '实习生'
  const startDate = args['start-date'] || args.startDate || new Date().toISOString().slice(0, 10)

  if (!name || !slug) {
    console.error('✗ --name and --slug are required')
    console.error('  pnpm cli new-intern --name 张三 --slug zhangsan --team 后端组 --role 后端开发实习生 --start-date 2026-07-01')
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

function cmdNewReport(args) {
  const intern = args.intern
  const type = args.type
  let date = args.date

  if (!intern || !type) {
    console.error('✗ --intern and --type are required')
    console.error('  pnpm cli new-report --intern alice --type daily [--date 2026-07-07]')
    console.error('  pnpm cli new-report --intern alice --type weekly [--week 2026-W28]')
    console.error('  pnpm cli new-report --intern alice --type monthly [--month 2026-07]')
    process.exit(1)
  }

  const validTypes = ['daily', 'weekly', 'monthly']
  if (!validTypes.includes(type)) {
    console.error(`✗ Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`)
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
    console.error('  pnpm cli new-doc --intern alice --title "Redis 缓存指南" [--slug redis-guide]')
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

function cmdNewProject(args) {
  const intern = args.intern
  const slug = args.slug
  const title = args.title
  const summary = args.summary || ''
  const category = args.category || 'work'
  const startDate = args['start-date'] || args.startDate || new Date().toISOString().slice(0, 10)

  if (!intern || !slug || !title) {
    console.error('✗ --intern, --slug, and --title are required')
    console.error('  pnpm cli new-project --intern alice --slug search-engine --title "搜索引擎" --summary "..."')
    process.exit(1)
  }

  const projectDir = resolve(INTERN_ROOT, intern, 'projects', slug)
  if (existsSync(resolve(projectDir, 'README.md'))) {
    console.error(`✗ Project already exists: ${slug}`)
    process.exit(1)
  }

  mkdirSync(projectDir, { recursive: true })
  mkdirSync(resolve(projectDir, 'notes'), { recursive: true })

  const readme = `---
title: ${title}
slug: ${slug}
status: active
startDate: ${startDate}
endDate: null
category: ${category}
tags: []
summary: ${summary}
timeline:
  - date: ${startDate}
    title: 项目立项
    type: milestone
    description: 项目启动
---

## 项目背景

${summary}

## 技术方案

- 

## 当前阶段

项目启动中。
`
  writeFileSync(resolve(projectDir, 'README.md'), readme)

  const tasks = {
    project: slug,
    intern: intern,
    tasks: [],
  }
  writeFileSync(resolve(projectDir, 'tasks.json'), JSON.stringify(tasks, null, 2) + '\n')

  console.log(`✓ Created project: ${title} (${slug})`)
  console.log(`  → ${projectDir}`)
  console.log('  Run pnpm content:build to compile.')
}

// ── Main ─────────────────────────────────────────────────────

const HELP = `
InternWiki CLI

Content management:
  pnpm cli new-intern   --name 张三 --slug zhangsan [--team 后端组] [--role 实习生] [--start-date 2026-07-01]
  pnpm cli new-report   --intern <slug> --type daily|weekly|monthly [--date YYYY-MM-DD] [--week YYYY-Wxx] [--month YYYY-MM]
  pnpm cli new-doc       --intern <slug> --title "标题" [--slug custom-slug]
  pnpm cli new-project   --intern <slug> --slug project-slug --title "项目名" [--summary "..."] [--category work]

Task management:
  pnpm cli task add     --intern <name> --project <slug> --title "..." [--parent <id>] [--status planned] [--assignee <name>] [--description "..."] [--notePath notes/x.md] [--startDate YYYY-MM-DD] [--tags a,b,c]
  pnpm cli task done    --intern <name> --project <slug> --id <task-id>
  pnpm cli task remove  --intern <name> --project <slug> --id <task-id>
  pnpm cli task move    --intern <name> --project <slug> --id <task-id> [--parent <id>]
  pnpm cli task list    --intern <name> --project <slug>
  pnpm cli task stats   --intern <name>

Examples:
  pnpm cli new-intern   --name 张三 --slug zhangsan --team 后端组
  pnpm cli new-report   --intern alice --type daily
  pnpm cli new-doc      --intern alice --title "Redis 缓存指南"
  pnpm cli new-project  --intern alice --slug search-engine --title "搜索引擎"
  pnpm cli task add     --intern alice --project search-engine --title "添加测试" --parent t2
  pnpm cli task done    --intern alice --project search-engine --id t2-2
  pnpm cli task list    --intern alice --project search-engine
  pnpm cli task stats   --intern alice
`

const { args, positional } = parseArgs(process.argv)

if (positional.length === 0 || positional[0] === 'help' || args.help) {
  console.log(HELP)
  process.exit(0)
}

const command = positional[0]

if (command === 'new-intern') {
  cmdNewIntern(args)
} else if (command === 'new-report') {
  cmdNewReport(args)
} else if (command === 'new-doc') {
  cmdNewDoc(args)
} else if (command === 'new-project') {
  cmdNewProject(args)
} else if (command === 'task') {
  const subcommand = positional[1]
  switch (subcommand) {
    case 'add':
      cmdAdd(args)
      break
    case 'done':
      cmdDone(args)
      break
    case 'list':
      cmdList(args)
      break
    case 'stats':
      cmdStats(args)
      break
    case 'remove':
      cmdRemove(args)
      break
    case 'move':
      cmdMove(args)
      break
    default:
      console.error(`✗ Unknown subcommand: task ${subcommand}`)
      console.error(HELP)
      process.exit(1)
  }
} else {
  console.error(`✗ Unknown command: ${command}`)
  console.error(HELP)
  process.exit(1)
}
