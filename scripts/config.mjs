#!/usr/bin/env node

/**
 * InternWiki Config CLI — 项目级配置管理
 *
 * Usage:
 *   pnpm setting set-default --intern alice   设置默认实习生
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_ROOT = resolve(__dirname, '..', 'apps', 'web', 'content')
const INTERN_ROOT = resolve(CONTENT_ROOT, 'interns')
const ENV_FILE = resolve(__dirname, '..', 'apps', 'web', '.env')

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

function cmdSetDefault(args) {
  const intern = args.intern
  if (!intern) {
    console.error('✗ --intern is required')
    console.error('  pnpm setting set-default --intern alice')
    process.exit(1)
  }

  // Verify intern exists
  const profilePath = resolve(INTERN_ROOT, intern, 'profile.md')
  if (!existsSync(profilePath)) {
    console.error(`✗ Intern not found: ${intern}`)
    console.error(`  Expected: content/interns/${intern}/profile.md`)
    process.exit(1)
  }

  // Read or create .env
  let lines = []
  if (existsSync(ENV_FILE)) {
    lines = readFileSync(ENV_FILE, 'utf-8').split('\n')
  }

  // Update or append VITE_DEFAULT_INTERN
  let found = false
  const updated = lines.map((line) => {
    if (line.startsWith('VITE_DEFAULT_INTERN=')) {
      found = true
      return `VITE_DEFAULT_INTERN=${intern}`
    }
    return line
  })
  if (!found) {
    updated.push(`VITE_DEFAULT_INTERN=${intern}`)
  }

  // Clean up trailing empty lines and ensure single newline at end
  const content = updated
    .filter((l) => l.trim() !== '' || l === updated[updated.length - 1])
    .join('\n')
    .replace(/\n+$/, '\n')
  writeFileSync(ENV_FILE, content + '\n')

  console.log(`✓ Default intern set to: ${intern}`)
  console.log(`  → ${ENV_FILE}`)
  console.log('  Restart dev server for changes to take effect.')
}

// ── Main ─────────────────────────────────────────────────────

const HELP = `
InternWiki Config CLI — 项目级配置管理

Commands:
  pnpm setting set-default  --intern <slug>   设置默认实习生（写入 .env）

Examples:
  pnpm setting set-default  --intern alice
`

const { args, positional } = parseArgs(process.argv)

if (positional.length === 0 || positional[0] === 'help' || args.help) {
  console.log(HELP)
  process.exit(0)
}

const command = positional[0]

switch (command) {
  case 'set-default':
    cmdSetDefault(args)
    break
  default:
    console.error(`✗ Unknown command: ${command}`)
    console.error(HELP)
    process.exit(1)
}
