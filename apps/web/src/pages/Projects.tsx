import { useParams, Link, Navigate } from 'react-router-dom'
import { getInternBySlug, getProjectsByIntern, getProjectTasks, countTasks } from '@/content/loader'
import { MarkdownView } from '@/components/MarkdownView'

/** Project list for an intern */
export function ProjectsPage() {
  const { name } = useParams<{ name: string }>()
  const intern = getInternBySlug(name ?? '')

  if (!intern) return <Navigate to="/" replace />

  const projects = getProjectsByIntern(intern.slug ?? '')

  return (
    <section className="space-y-4">
      <div>
        <Link to={`/interns/${intern.slug}`} className="text-xs text-dim hover:text-heading">
          ← {intern.name}
        </Link>
        <h1 className="lo-section-title mt-1">项目</h1>
        <p className="text-xs text-dim">任务树与项目进度</p>
      </div>

      {projects.length === 0 ? (
        <p className="py-8 text-center text-sm text-dim">还没有项目。</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const tasks = getProjectTasks(intern.slug ?? '', p.slug ?? '')
            const stats = tasks ? countTasks(tasks.tasks) : { total: 0, completed: 0 }
            const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
            return (
              <Link
                key={`${p.intern}-${p.slug}`}
                to={`/interns/${intern.slug}/projects/${p.slug}`}
                className="lo-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-heading">{p.title}</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-dim">{p.status}</span>
                </div>
                {p.summary && <p className="mt-1 text-xs text-dim">{p.summary}</p>}
                {stats.total > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-dim">
                      <span>{stats.completed}/{stats.total}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

/** Single project detail with task tree */
export function ProjectDetailPage() {
  const { name, slug } = useParams<{ name: string; slug: string }>()
  const intern = getInternBySlug(name ?? '')

  if (!intern) return <Navigate to="/" replace />

  const projects = getProjectsByIntern(intern.slug ?? '')
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-dim">未找到项目: {slug}</p>
        <Link to={`/interns/${intern.slug}/projects`} className="mt-2 inline-block text-xs text-primary hover:underline">
          返回项目列表
        </Link>
      </div>
    )
  }

  const tasks = getProjectTasks(intern.slug ?? '', project.slug ?? '')
  const stats = tasks ? countTasks(tasks.tasks) : { total: 0, completed: 0 }
  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <section className="space-y-4">
      <div>
        <Link to={`/interns/${intern.slug}/projects`} className="text-xs text-dim hover:text-heading">
          ← 项目列表
        </Link>
        <h1 className="lo-section-title mt-1">{project.title}</h1>
        <div className="flex items-center gap-3 text-xs text-dim">
          <span className="rounded bg-muted px-2 py-0.5">{project.status}</span>
          {project.startDate && <span>{project.startDate}</span>}
        </div>
      </div>

      {project.summary && <p className="text-sm text-body">{project.summary}</p>}

      {/* Progress */}
      {stats.total > 0 && (
        <div className="lo-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-heading">任务进度</span>
            <span className="text-dim">{stats.completed}/{stats.total} ({pct}%)</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Task tree placeholder — Phase 3 will implement TaskTree component */}
      {tasks && tasks.tasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-heading">任务树</h2>
          <div className="mt-2 space-y-1">
            {tasks.tasks.map((t) => (
              <div key={t.id} className="lo-card flex items-center gap-2 p-2">
                <span className={`h-2 w-2 rounded-full ${
                  t.status === 'completed' ? 'bg-green-500'
                  : t.status === 'active' ? 'bg-blue-500'
                  : t.status === 'paused' ? 'bg-amber-500'
                  : 'bg-gray-400'
                }`} />
                <span className={`text-sm ${t.status === 'completed' ? 'text-dim line-through' : 'text-body'}`}>
                  {t.title}
                </span>
                <span className="ml-auto text-[10px] text-dim">{t.status}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] text-placeholder">
            Phase 3 将实现完整的可展开/折叠任务树
          </p>
        </div>
      )}

      {/* Project body */}
      <MarkdownView body={project.body} />
    </section>
  )
}
