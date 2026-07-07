#!/usr/bin/env node

/**
 * InternWiki Task CLI — 任务树管理
 *
 * Usage:
 *   pnpm task add    --intern alice --project search-engine --title "添加测试" [--parent t2] [--status planned]
 *   pnpm task done   --intern alice --project search-engine --id t2-2
 *   pnpm task list   --intern alice --project search-engine
 *   pnpm task stats  --intern alice
 *   pnpm task remove --intern alice --project search-engine --id t2-3
 *   pnpm task move   --intern alice --project search-engine --id t2-2 --parent t3
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
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
  const slug = title
    .toLowerCase()
    .replace(/[\u4e00-\u9fff]+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)

  let id
  if (slug && !existingIds.has(slug)) {
    id = slug
  } else {
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

function renderBar(completed, total, width) {
  if (total === 0) return '─'.repeat(width)
  const filled = Math.round((completed / total) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
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

  const idx = found.siblings.indexOf(found.task)
  found.siblings.splice(idx, 1)

  if (parent) {
    const target = findTaskById(tree.tasks, parent)
    if (!target) {
      console.error(`✗ Target parent not found: ${parent}`)
      found.siblings.splice(idx, 0, found.task)
      process.exit(1)
    }
    target.task.children = target.task.children || []
    target.task.children.push(found.task)
  } else {
    tree.tasks.push(found.task)
  }

  saveTasks(intern, project, tree)
  console.log(`  Moved: ${id} → ${parent || 'root'}`)
}

// ── Main ─────────────────────────────────────────────────────

const HELP = `
InternWiki Task CLI — 任务树管理

Commands:
  pnpm task add    --intern <name> --project <slug> --title "..." [--parent <id>] [--status planned] [--assignee <name>] [--description "..."] [--notePath notes/x.md] [--startDate YYYY-MM-DD] [--tags a,b,c]
  pnpm task done   --intern <name> --project <slug> --id <task-id>
  pnpm task remove --intern <name> --project <slug> --id <task-id>
  pnpm task move   --intern <name> --project <slug> --id <task-id> [--parent <id>]
  pnpm task list   --intern <name> --project <slug>
  pnpm task stats  --intern <name>

Examples:
  pnpm task add  --intern alice --project search-engine --title "添加测试" --parent t2
  pnpm task done --intern alice --project search-engine --id t2-2
  pnpm task list --intern alice --project search-engine
  pnpm task stats --intern alice
`

const { args, positional } = parseArgs(process.argv)

if (positional.length === 0 || positional[0] === 'help' || args.help) {
  console.log(HELP)
  process.exit(0)
}

const command = positional[0]

switch (command) {
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
    console.error(`✗ Unknown command: ${command}`)
    console.error(HELP)
    process.exit(1)
}
