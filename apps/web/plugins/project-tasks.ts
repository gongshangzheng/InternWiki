import type { Plugin } from 'vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const contentRoot = resolve(__dirname, '..', 'content')

/**
 * Find all tasks.json files under content/interns/{name}/projects/{slug}/
 */
function findTaskFiles(): Array<{ intern: string; project: string; path: string }> {
  const results: Array<{ intern: string; project: string; path: string }> = []
  const internsDir = resolve(contentRoot, 'interns')
  if (!existsSync(internsDir)) return results

  for (const intern of readdirSync(internsDir)) {
    const internPath = resolve(internsDir, intern)
    if (!statSync(internPath).isDirectory()) continue
    const projectsDir = resolve(internPath, 'projects')
    if (!existsSync(projectsDir)) continue

    for (const project of readdirSync(projectsDir)) {
      const projectPath = resolve(projectsDir, project)
      if (!statSync(projectPath).isDirectory()) continue
      const tasksFile = resolve(projectPath, 'tasks.json')
      if (existsSync(tasksFile)) {
        results.push({ intern, project, path: tasksFile })
      }
    }
  }
  return results
}

/**
 * Vite plugin: serve tasks.json via dev middleware + copy to dist on build.
 *
 * Dev:  GET /InternWiki/interns/{name}/{slug}.tasks.json → tasks.json
 *       GET /InternWiki/interns/{name}/{slug}/notes/{path} → task notes (markdown)
 * Build: closeBundle copies all tasks.json + notes/ to dist/interns/{name}/{slug}.tasks.json
 */
export function projectTasksPlugin(base: string): Plugin {
  // Normalize base to ensure leading and trailing slashes
  const basePrefix = base.startsWith('/') ? base : `/${base}`
  const normalizedBase = basePrefix.endsWith('/') ? basePrefix.slice(0, -1) : basePrefix

  return {
    name: 'internwiki-project-tasks',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''

        // Match: /InternWiki/interns/{name}/{slug}.tasks.json
        const tasksMatch = url.match(
          new RegExp(`${normalizedBase}/interns/([^/]+)/([^/]+)\\.tasks\\.json$`),
        )
        if (tasksMatch) {
          const [, intern, project] = tasksMatch
          const filePath = resolve(contentRoot, 'interns', intern, 'projects', project, 'tasks.json')
          if (existsSync(filePath)) {
            const data = readFileSync(filePath, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(data)
            return
          }
          res.statusCode = 404
          res.end('Not found')
          return
        }

        // Match: /InternWiki/interns/{name}/{slug}/notes/{path}
        const notesMatch = url.match(
          new RegExp(`${normalizedBase}/interns/([^/]+)/([^/]+)/notes/(.+)$`),
        )
        if (notesMatch) {
          const [, intern, project, notePath] = notesMatch
          const filePath = resolve(
            contentRoot,
            'interns',
            intern,
            'projects',
            project,
            'notes',
            notePath,
          )
          if (existsSync(filePath)) {
            const data = readFileSync(filePath, 'utf-8')
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.end(data)
            return
          }
          res.statusCode = 404
          res.end('Not found')
          return
        }

        next()
      })
    },
    closeBundle() {
      // Copy all tasks.json and notes/ to dist/
      const taskFiles = findTaskFiles()
      const distRoot = resolve(__dirname, '..', 'dist')

      for (const { intern, project, path } of taskFiles) {
        // Copy tasks.json → dist/interns/{intern}/{project}.tasks.json
        const destDir = resolve(distRoot, 'interns', intern)
        const destFile = resolve(destDir, `${project}.tasks.json`)
        mkdirSync(destDir, { recursive: true })
        copyFileSync(path, destFile)

        // Copy notes/ directory if it exists
        const notesDir = resolve(contentRoot, 'interns', intern, 'projects', project, 'notes')
        if (existsSync(notesDir)) {
          copyDirRecursive(notesDir, resolve(destDir, project, 'notes'))
        }
      }
    },
  }
}

function copyDirRecursive(src: string, dest: string) {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath = resolve(src, entry)
    const destPath = resolve(dest, entry)
    if (statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}
