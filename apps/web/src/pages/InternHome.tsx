import { useParams, Link } from 'react-router-dom'
import { FileText, ChevronRight } from 'lucide-react'
import { getInternBySlug, getInternReports, getProjectsByIntern } from '@/content/loader'
import { MarkdownView } from '@/components/MarkdownView'
import { stripMarkdown } from '@/lib/markdown'

type RecentItem = {
  slug: string
  title: string
  date?: string
  summary?: string
  type: 'daily' | 'weekly' | 'monthly' | 'docs'
  to: string
}

const TYPE_LABELS: Record<RecentItem['type'], string> = {
  daily: '日报',
  weekly: '周报',
  monthly: '月报',
  docs: '文档',
}

const TYPE_COLORS: Record<RecentItem['type'], string> = {
  daily: 'bg-primary/10 text-primary',
  weekly: 'bg-blue-500/10 text-blue-500',
  monthly: 'bg-amber-500/10 text-amber-500',
  docs: 'bg-violet-500/10 text-violet-500',
}

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

  const internSlug = intern.slug ?? ''
  const reports = getInternReports(internSlug)
  const projects = getProjectsByIntern(internSlug)

  // Collect recent reports across all types, sorted by date desc
  const recentItems: RecentItem[] = [
    ...reports.daily.map((r) => ({ slug: r.slug, title: r.title, date: r.date, summary: r.summary, type: 'daily' as const, to: `/interns/${internSlug}/daily/${r.slug}` })),
    ...reports.weekly.map((r) => ({ slug: r.slug, title: r.title, date: r.date, summary: r.summary, type: 'weekly' as const, to: `/interns/${internSlug}/weekly/${r.slug}` })),
    ...reports.monthly.map((r) => ({ slug: r.slug, title: r.title, date: r.date, summary: r.summary, type: 'monthly' as const, to: `/interns/${internSlug}/monthly/${r.slug}` })),
    ...reports.docs.map((r) => ({ slug: r.slug, title: r.title, date: r.date, summary: r.summary, type: 'docs' as const, to: `/interns/${internSlug}/docs/${r.slug}` })),
  ].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link to={`/interns/${internSlug}/daily`} className="lo-card flex flex-col items-center gap-1 p-3 transition-colors hover:border-primary/40">
          <FileText className="h-4 w-4 text-dim" />
          <span className="text-sm font-medium text-heading">日报</span>
          <span className="text-[10px] text-dim">{reports.daily.length} 篇</span>
        </Link>
        <Link to={`/interns/${internSlug}/weekly`} className="lo-card flex flex-col items-center gap-1 p-3 transition-colors hover:border-primary/40">
          <FileText className="h-4 w-4 text-dim" />
          <span className="text-sm font-medium text-heading">周报</span>
          <span className="text-[10px] text-dim">{reports.weekly.length} 篇</span>
        </Link>
        <Link to={`/interns/${internSlug}/monthly`} className="lo-card flex flex-col items-center gap-1 p-3 transition-colors hover:border-primary/40">
          <FileText className="h-4 w-4 text-dim" />
          <span className="text-sm font-medium text-heading">月报</span>
          <span className="text-[10px] text-dim">{reports.monthly.length} 篇</span>
        </Link>
        <Link to={`/interns/${internSlug}/docs`} className="lo-card flex flex-col items-center gap-1 p-3 transition-colors hover:border-primary/40">
          <FileText className="h-4 w-4 text-dim" />
          <span className="text-sm font-medium text-heading">文档</span>
          <span className="text-[10px] text-dim">{reports.docs.length} 篇</span>
        </Link>
      </div>

      {/* Recent reports — mixed types */}
      {recentItems.length > 0 && (
        <div>
          <h2 className="lo-section-title mb-4">最近报告</h2>
          <div className="space-y-2">
            {recentItems.slice(0, 8).map((item) => {
              const preview = item.summary ? stripMarkdown(item.summary) : item.title
              return (
                <Link
                  key={`${item.type}-${item.slug}`}
                  to={item.to}
                  className="lo-card group flex items-start gap-3 p-3 transition-colors hover:border-primary/40"
                >
                  <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[item.type]}`}>
                    {TYPE_LABELS[item.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="truncate text-sm text-body group-hover:text-primary">{preview}</span>
                  </div>
                  {item.date && (
                    <span className="flex-shrink-0 font-mono text-[11px] text-dim">{item.date.slice(0, 10)}</span>
                  )}
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-placeholder group-hover:text-primary" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <h2 className="lo-section-title mb-4">项目</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <Link
                key={`${p.intern}-${p.slug}`}
                to={`/interns/${internSlug}/projects`}
                className="lo-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-heading">{p.title}</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-dim">{p.status}</span>
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
