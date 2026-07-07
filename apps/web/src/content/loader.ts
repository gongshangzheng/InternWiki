import {
  interns,
  daily,
  weekly,
  monthly,
  docs,
  shared,
  guide,
  projects,
  type interns as Interns,
  type daily as Daily,
  type weekly as Weekly,
  type monthly as Monthly,
  type docs as Docs,
  type shared as Shared,
  type guide as Guide,
  type projects as Projects,
} from './.velite'
import type { TaskTree, TaskNode, TaskStatus } from './schema'

export type { Interns, Daily, Weekly, Monthly, Docs, Shared, Guide, Projects }
export type { TaskTree, TaskNode, TaskStatus }

// ── Sorting helpers ──────────────────────────────────────────

const byDateDesc = <T extends { date?: string | undefined }>(a: T, b: T) => {
  const da = a.date ?? ''
  const db = b.date ?? ''
  return db.localeCompare(da)
}

const byStartDateDesc = <T extends { startDate?: string | undefined }>(a: T, b: T) => {
  const da = a.startDate ?? ''
  const db = b.startDate ?? ''
  return db.localeCompare(da)
}

const findBySlug = <T extends { slug?: string }>(items: readonly T[], slug: string) =>
  items.find((it) => it.slug === slug)

// ── Interns ──────────────────────────────────────────────────

export const getAllInterns = (): Interns[] => [...interns].sort((a, b) =>
  (a.startDate ?? '').localeCompare(b.startDate ?? ''),
)

export const getInternBySlug = (slug: string): Interns | undefined =>
  findBySlug(interns, slug)

// ── Reports (multi-intern: filter by intern slug) ────────────

export const getAllDaily = (): Daily[] => [...daily].sort(byDateDesc)
export const getDailyBySlug = (slug: string, intern?: string): Daily | undefined =>
  daily.find((it) => it.slug === slug && (!intern || it.intern === intern))

export const getAllWeekly = (): Weekly[] => [...weekly].sort(byDateDesc)
export const getWeeklyBySlug = (slug: string, intern?: string): Weekly | undefined =>
  weekly.find((it) => it.slug === slug && (!intern || it.intern === intern))

export const getAllMonthly = (): Monthly[] => [...monthly].sort(byDateDesc)
export const getMonthlyBySlug = (slug: string, intern?: string): Monthly | undefined =>
  monthly.find((it) => it.slug === slug && (!intern || it.intern === intern))

export const getAllDocs = (): Docs[] => [...docs].sort(byDateDesc)
export const getDocBySlug = (slug: string, intern?: string): Docs | undefined =>
  docs.find((it) => it.slug === slug && (!intern || it.intern === intern))

export const getAllShared = (): Shared[] => [...shared].sort(byDateDesc)
export const getSharedBySlug = (slug: string): Shared | undefined =>
  findBySlug(shared, slug)

// ── Guide ────────────────────────────────────────────────────

/** Category display order for the guide sidebar */
const GUIDE_CATEGORY_ORDER = ['开始', '日常使用', '功能参考', '附录']

export const getAllGuides = (): Guide[] =>
  [...guide].sort((a, b) => {
    const catA = GUIDE_CATEGORY_ORDER.indexOf(a.category)
    const catB = GUIDE_CATEGORY_ORDER.indexOf(b.category)
    const catIdxA = catA === -1 ? 999 : catA
    const catIdxB = catB === -1 ? 999 : catB
    if (catIdxA !== catIdxB) return catIdxA - catIdxB
    return (a.order ?? 0) - (b.order ?? 0)
  })

export const getGuideBySlug = (slug: string): Guide | undefined =>
  findBySlug(guide, slug)

/** Group guides by category for sidebar rendering */
export function getGuidesByCategory(): Array<{ category: string; items: Guide[] }> {
  const all = getAllGuides()
  const categories: Array<{ category: string; items: Guide[] }> = []
  for (const item of all) {
    const existing = categories.find((c) => c.category === item.category)
    if (existing) {
      existing.items.push(item)
    } else {
      categories.push({ category: item.category, items: [item] })
    }
  }
  return categories
}

/** Get reports for a specific intern (daily + weekly + monthly + docs) */
export function getInternReports(internSlug: string) {
  return {
    daily: daily.filter((d) => d.intern === internSlug).sort(byDateDesc),
    weekly: weekly.filter((w) => w.intern === internSlug).sort(byDateDesc),
    monthly: monthly.filter((m) => m.intern === internSlug).sort(byDateDesc),
    docs: docs.filter((d) => d.intern === internSlug).sort(byDateDesc),
  }
}

// ── Projects ─────────────────────────────────────────────────

export const getAllProjects = (): Projects[] => [...projects].sort(byStartDateDesc)

export function getProjectsByIntern(internSlug: string): Projects[] {
  return projects.filter((p) => p.intern === internSlug).sort(byStartDateDesc)
}

// ── Task Trees ───────────────────────────────────────────────
// Task trees live alongside project READMEs in
// content/interns/{name}/projects/{slug}/tasks.json.
// Loaded asynchronously via fetch (served by projectTasksPlugin in dev,
// copied to dist/ during build).

/**
 * Async fetch: load a project's task tree from the server.
 * Returns null if the tasks.json file doesn't exist.
 */
export async function getProjectTasks(
  internSlug: string,
  projectSlug: string,
): Promise<TaskTree | null> {
  const url = `/InternWiki/interns/${internSlug}/${projectSlug}.tasks.json`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const tree: TaskTree = await res.json()
    return { ...tree, tasks: cascadeStatus(tree.tasks) }
  } catch {
    return null
  }
}

/**
 * Fetch a task note (Markdown) for a specific project + notePath.
 */
export async function fetchTaskNote(
  internSlug: string,
  projectSlug: string,
  notePath: string,
): Promise<string | null> {
  const url = `/InternWiki/interns/${internSlug}/${projectSlug}/notes/${notePath}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

/** Cascade completion: if all children are completed, mark parent as completed */
function cascadeStatus(tasks: TaskNode[]): TaskNode[] {
  return tasks.map((t) => {
    if (t.children.length === 0) return t
    const children = cascadeStatus(t.children)
    const allCompleted = children.every((c) => c.status === 'completed')
    return {
      ...t,
      children,
      status: allCompleted ? ('completed' as TaskStatus) : t.status,
    }
  })
}

/** Get all task trees for an intern */
export function getInternTaskTrees(
  internSlug: string,
): Array<TaskTree & { projectSlug: string }> {
  // This is a sync placeholder; real async loading is via getProjectTasks()
  return []
}

/** Count tasks recursively */
export function countTasks(tasks: TaskNode[]): { total: number; completed: number } {
  let total = 0
  let completed = 0
  for (const t of tasks) {
    total++
    if (t.status === 'completed') completed++
    if (t.children.length > 0) {
      const sub = countTasks(t.children)
      total += sub.total
      completed += sub.completed
    }
  }
  return { total, completed }
}

/** Flatten all leaf tasks (any status, any date) */
export function flattenAllLeafTasks(
  tasks: TaskNode[],
  projectSlug: string,
): Array<TaskNode & { projectSlug: string }> {
  const result: Array<TaskNode & { projectSlug: string }> = []
  for (const t of tasks) {
    if (t.children.length === 0) {
      result.push({ ...t, projectSlug })
    } else {
      result.push(...flattenAllLeafTasks(t.children, projectSlug))
    }
  }
  return result
}

/** Flatten dated leaf tasks for calendar display */
export function flattenDatedTasks(
  tasks: TaskNode[],
  projectSlug: string,
): Array<TaskNode & { projectSlug: string }> {
  const result: Array<TaskNode & { projectSlug: string }> = []
  for (const t of tasks) {
    if (t.startDate && t.children.length === 0) result.push({ ...t, projectSlug })
    if (t.children.length > 0) result.push(...flattenDatedTasks(t.children, projectSlug))
  }
  return result
}

/** Flatten undated leaf tasks (no startDate, not completed) */
export function flattenUndatedTasks(
  tasks: TaskNode[],
  projectSlug: string,
): Array<TaskNode & { projectSlug: string }> {
  const result: Array<TaskNode & { projectSlug: string }> = []
  for (const t of tasks) {
    if (!t.startDate && t.status !== 'completed' && t.children.length === 0) {
      result.push({ ...t, projectSlug })
    }
    if (t.children.length > 0) result.push(...flattenUndatedTasks(t.children, projectSlug))
  }
  return result
}

/** Find all recurring tasks in a tree */
export function findRecurringTasks(
  tasks: TaskNode[],
  projectSlug: string,
): Array<TaskNode & { projectSlug: string }> {
  const result: Array<TaskNode & { projectSlug: string }> = []
  for (const t of tasks) {
    if (t.recurring) result.push({ ...t, projectSlug })
    if (t.children.length > 0) result.push(...findRecurringTasks(t.children, projectSlug))
  }
  return result
}
