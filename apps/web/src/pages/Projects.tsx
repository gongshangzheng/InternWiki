import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { GitBranch, ArrowLeft, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarkdownView } from '@/components/MarkdownView'
import { TaskTreeNode, getProjectColor, TASK_STATUS_CONFIG } from '@/components/TaskTreeNode'
import { ProjectTabs, PROJECT_STATUS_CONFIG } from '@/components/ProjectTabs'
import { TaskNoteView } from '@/components/TaskNoteView'
import {
  getInternBySlug,
  getProjectsByIntern,
  getProjectTasks,
  countTasks,
  type TaskTree,
  type TaskNode,
  type Projects,
} from '@/content/loader'

// ── Status legend tooltip ────────────────────────────────────

function StatusLegend() {
  return (
    <div className="group/help relative flex-shrink-0">
      <HelpCircle className="h-3.5 w-3.5 cursor-help text-placeholder transition-colors group-hover/help:text-dim" />
      <div className="invisible absolute right-0 top-full z-50 mt-1 w-60 rounded-lg border border-border bg-card p-3 opacity-0 shadow-xl transition-all group-hover/help:visible group-hover/help:opacity-100">
        <h4 className="mb-2 text-xs font-semibold text-heading">任务状态说明</h4>
        <ul className="space-y-1.5">
          {Object.entries(TASK_STATUS_CONFIG).map(([key, cfg]) => (
            <li key={key} className="flex items-center gap-2 text-[11px] text-body">
              <span className={cn('h-2 w-2 flex-shrink-0 rounded-full ring-2', cfg.dot, cfg.ring)} />
              <span className="font-medium">{cfg.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2.5 border-t border-border pt-2">
          <p className="text-[10px] leading-relaxed text-dim">
            圆点颜色表示任务的执行状态；分支线颜色对应所属项目。
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Helper: find task by ID in tree ───────────────────────

function findTaskById(tasks: TaskNode[], id: string): TaskNode | null {
  for (const task of tasks) {
    if (task.id === id) return task
    const found = findTaskById(task.children, id)
    if (found) return found
  }
  return null
}

// ── Project README renderer ──────────────────────────────────

function ProjectReadme({
  project,
  colorIndex,
  internSlug,
}: {
  project: Projects
  colorIndex: number
  internSlug: string
}) {
  const StatusIcon = PROJECT_STATUS_CONFIG[project.status]?.icon ?? GitBranch
  const color = getProjectColor(Math.max(0, colorIndex))

  return (
    <div>
      {/* Meta header */}
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <span className={cn('h-3 w-3 rounded-full', color.dot)} />
        <h1 className="text-xl font-bold text-heading">{project.title}</h1>
        <span className={cn('inline-flex items-center gap-1 text-xs', PROJECT_STATUS_CONFIG[project.status]?.color)}>
          <StatusIcon className="h-3.5 w-3.5" />
          {PROJECT_STATUS_CONFIG[project.status]?.label ?? project.status}
        </span>
        {project.startDate && (
          <span className="font-mono text-xs text-dim">
            {project.startDate.slice(0, 10)}
            {project.endDate ? ` → ${project.endDate.slice(0, 10)}` : ' → 至今'}
          </span>
        )}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-dim"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Markdown body */}
      {project.body ? (
        <MarkdownView body={project.body} internSlug={internSlug} />
      ) : (
        <p className="text-sm text-dim">暂无 README 内容。</p>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────

export function ProjectsPage() {
  const { name } = useParams<{ name: string }>()
  const intern = getInternBySlug(name ?? '')

  if (!intern) return <Navigate to="/" replace />

  const internSlug = intern.slug ?? ''
  const allProjects = getProjectsByIntern(internSlug)

  const [activeSlug, setActiveSlug] = useState<string | null>(() => {
    const hash = window.location.hash.slice(1)
    const pureSlug = hash.split('?')[0]
    if (pureSlug && allProjects.some((p) => p.slug === pureSlug)) return pureSlug
    return allProjects.length > 0 ? (allProjects[0].slug ?? null) : null
  })
  const [taskTrees, setTaskTrees] = useState<Record<string, TaskTree | null>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [selectedTask, setSelectedTask] = useState<TaskNode | null>(null)
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(() => {
    const hash = window.location.hash.slice(1)
    const taskMatch = hash.match(/\?task=([^&]+)/)
    return taskMatch?.[1] ?? null
  })

  const loadTaskTree = useCallback(
    async (slug: string) => {
      if (taskTrees[slug] !== undefined || loading[slug]) return
      setLoading((prev) => ({ ...prev, [slug]: true }))
      const tree = await getProjectTasks(internSlug, slug)
      setTaskTrees((prev) => ({ ...prev, [slug]: tree }))
      setLoading((prev) => ({ ...prev, [slug]: false }))
    },
    [taskTrees, loading, internSlug],
  )

  // Load task tree for active project
  useEffect(() => {
    if (activeSlug) loadTaskTree(activeSlug)
  }, [activeSlug, loadTaskTree])

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1)
      const pureSlug = hash.split('?')[0]
      const taskMatch = hash.match(/\?task=([^&]+)/)
      if (pureSlug && allProjects.some((p) => p.slug === pureSlug)) {
        setActiveSlug(pureSlug)
        setSelectedTask(null)
        if (taskMatch?.[1]) {
          setPendingTaskId(taskMatch[1])
        }
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [allProjects])

  const activeProject = allProjects.find((p) => p.slug === activeSlug) ?? null
  const activeColorIdx = allProjects.findIndex((p) => p.slug === activeSlug)
  const activeColor = getProjectColor(Math.max(0, activeColorIdx))
  const activeTree = activeSlug ? taskTrees[activeSlug] ?? null : null
  const isLoadingTree = activeSlug ? loading[activeSlug] ?? false : false

  // Auto-select task when task tree loads and we have a pending task ID
  useEffect(() => {
    if (pendingTaskId && activeTree) {
      const found = findTaskById(activeTree.tasks, pendingTaskId)
      if (found) {
        setSelectedTask(found)
        setPendingTaskId(null)
      }
    }
  }, [pendingTaskId, activeTree])

  const handleProjectChange = (slug: string) => {
    setActiveSlug(slug)
    setSelectedTask(null)
    loadTaskTree(slug)
    window.location.hash = slug
  }

  const handleBackToReadme = () => setSelectedTask(null)

  if (allProjects.length === 0) {
    return (
      <div className="py-16 text-center">
        <GitBranch className="mx-auto h-10 w-10 text-placeholder" />
        <p className="mt-3 text-sm text-dim">还没有项目。</p>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      {/* Header + tabs */}
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <h1 className="lo-section-title">项目</h1>
        </div>
        <ProjectTabs
          projects={allProjects}
          activeSlug={activeSlug}
          onSelect={handleProjectChange}
        />
      </header>

      {activeProject && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Left sidebar: task tree */}
          <aside className="flex min-w-0 flex-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]">
            {/* Header — stays fixed at top of sidebar */}
            <div className="flex flex-shrink-0 items-center gap-2 border-b border-border pb-2">
              <button
                onClick={handleBackToReadme}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-semibold tracking-wide transition-colors',
                  selectedTask ? 'text-primary hover:text-primary/80' : 'text-heading',
                )}
              >
                {selectedTask && <ArrowLeft className="h-3 w-3" />}
                {activeProject.title}
              </button>
              <div className="ml-auto flex items-center gap-2">
                {activeTree && (
                  <span className="text-[10px] text-placeholder">
                    {countTasks(activeTree.tasks).completed}/{countTasks(activeTree.tasks).total}
                  </span>
                )}
                <StatusLegend />
              </div>
            </div>

            {/* Task tree — scrolls independently */}
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden lg:pr-3 lg:pb-3">
              {isLoadingTree ? (
                <div className="py-8 text-center text-xs text-dim">加载中…</div>
              ) : activeTree && activeTree.tasks.length > 0 ? (
                <div className="space-y-0.5 pt-2">
                  {activeTree.tasks.map((task, i) => (
                    <TaskTreeNode
                      key={task.id}
                      task={task}
                      depth={0}
                      isLast={i === activeTree.tasks.length - 1}
                      parentLines={[]}
                      projectColor={activeColor}
                      selectedId={selectedTask?.id ?? null}
                      onSelect={setSelectedTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <GitBranch className="mx-auto h-8 w-8 text-placeholder" />
                  <p className="mt-2 text-xs text-dim">暂无任务树数据。</p>
                </div>
              )}
            </div>
          </aside>

          {/* Right: project README or task note */}
          <main className="min-w-0">
            {selectedTask ? (
              <TaskNoteView
                task={selectedTask}
                internSlug={internSlug}
                projectSlug={activeProject.slug ?? ''}
              />
            ) : (
              <ProjectReadme project={activeProject} colorIndex={activeColorIdx} internSlug={internSlug} />
            )}
          </main>
        </div>
      )}
    </section>
  )
}

// Keep the old export name for backward compatibility (App.tsx import)
export const ProjectDetailPage = ProjectsPage
