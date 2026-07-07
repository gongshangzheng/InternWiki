#!/usr/bin/env node

/**
 * InternWiki Project CLI — 项目创建
 *
 * Usage:
 *   pnpm project new --intern alice --slug search-engine --title "搜索引擎" [--summary "..."] [--category work]
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
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

// ── Commands ─────────────────────────────────────────────────

function cmdNewProject(args) {
  const intern = args.intern
  const slug = args.slug
  const title = args.title
  const summary = args.summary || ''
  const category = args.category || 'work'
  const startDate = args['start-date'] || args.startDate || new Date().toISOString().slice(0, 10)

  if (!intern || !slug || !title) {
    console.error('✗ --intern, --slug, and --title are required')
    console.error('  pnpm project new --intern alice --slug search-engine --title "搜索引擎" --summary "..."')
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
InternWiki Project CLI — 项目创建

Commands:
  pnpm project new --intern <slug> --slug <project-slug> --title "项目名" [--summary "..."] [--category work] [--start-date YYYY-MM-DD]

Examples:
  pnpm project new --intern alice --slug search-engine --title "搜索引擎" --summary "基于 ES 的全文搜索"
`

const { args, positional } = parseArgs(process.argv)

if (positional.length === 0 || positional[0] === 'help' || args.help) {
  console.log(HELP)
  process.exit(0)
}

const command = positional[0]

switch (command) {
  case 'new':
    cmdNewProject(args)
    break
  default:
    console.error(`✗ Unknown command: ${command}`)
    console.error(HELP)
    process.exit(1)
}
