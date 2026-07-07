import { useParams, Link } from 'react-router-dom'
import { getInternBySlug, getInternReports, getProjectsByIntern } from '@/content/loader'
import { MarkdownView } from '@/components/MarkdownView'

export function InternHome() {
  const { name } = useParams<{ name: string }>()
  const intern = getInternBySlug(name ?? '')

  if (!intern) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-dim">未找到实习生: {name}</p>
        <Link to="/" className="mt-2 inline-block text-xs text-primary hover:underline">
          返回首页
        </Link>
      </div>
    )
  }

  const reports = getInternReports(intern.slug ?? '')
  const projects = getProjectsByIntern(intern.slug ?? '')

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
          <span className="text-lg font-bold">{intern.name[0]}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-heading">{intern.name}</h1>
          <p className="text-sm text-dim">
            {intern.role ?? '实习生'} · {intern.team ?? '未分组'}
            {intern.startDate && ` · ${intern.startDate} 入职`}
          </p>
        </div>
      </div>

      {/* Bio */}
      {intern.body && (
        <div className="lo-card p-4">
          <MarkdownView body={intern.body} />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="lo-card p-4 text-center">
          <div className="text-2xl font-bold text-heading">{reports.daily.length}</div>
          <div className="text-xs text-dim">日报</div>
        </div>
        <div className="lo-card p-4 text-center">
          <div className="text-2xl font-bold text-heading">{reports.weekly.length}</div>
          <div className="text-xs text-dim">周报</div>
        </div>
        <div className="lo-card p-4 text-center">
          <div className="text-2xl font-bold text-heading">{reports.monthly.length}</div>
          <div className="text-xs text-dim">月报</div>
        </div>
        <div className="lo-card p-4 text-center">
          <div className="text-2xl font-bold text-heading">{projects.length}</div>
          <div className="text-xs text-dim">项目</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to={`/interns/${intern.slug}/daily`} className="lo-card p-3 text-center transition-colors hover:border-primary/40">
          <div className="text-sm font-medium text-heading">日报</div>
        </Link>
        <Link to={`/interns/${intern.slug}/weekly`} className="lo-card p-3 text-center transition-colors hover:border-primary/40">
          <div className="text-sm font-medium text-heading">周报</div>
        </Link>
        <Link to={`/interns/${intern.slug}/monthly`} className="lo-card p-3 text-center transition-colors hover:border-primary/40">
          <div className="text-sm font-medium text-heading">月报</div>
        </Link>
        <Link to={`/interns/${intern.slug}/docs`} className="lo-card p-3 text-center transition-colors hover:border-primary/40">
          <div className="text-sm font-medium text-heading">文档</div>
        </Link>
      </div>

      {/* Recent reports */}
      <div>
        <h2 className="lo-section-title mb-4">最近报告</h2>
        <div className="space-y-2">
          {reports.daily.slice(0, 5).map((r) => (
            <Link
              key={`${r.intern}-${r.slug}`}
              to={`/interns/${intern.slug}/daily/${r.slug}`}
              className="lo-card flex items-center gap-3 p-3 transition-colors hover:border-primary/40"
            >
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">日报</span>
              <span className="flex-1 truncate text-sm text-body">{r.summary ?? r.title}</span>
              <span className="text-xs text-dim">{r.date}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <h2 className="lo-section-title mb-4">项目</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <Link
                key={`${p.intern}-${p.slug}`}
                to={`/interns/${intern.slug}/projects/${p.slug}`}
                className="lo-card p-3 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-heading">{p.title}</span>
                  <span className="text-xs text-dim">{p.status}</span>
                </div>
                {p.summary && <p className="mt-1 text-xs text-dim">{p.summary}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
