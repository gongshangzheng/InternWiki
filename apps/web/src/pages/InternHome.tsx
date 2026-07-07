import { useParams, Link } from 'react-router-dom'
import { FileText, ChevronRight, FolderKanban } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  getInternBySlug,
  getInternReports,
  getProjectsByIntern,
  getProjectTasks,
  countTasks,
} from '@/content/loader'
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

// ── Contribution Heatmap ──────────────────────────────────────

function ContributionHeatmap({ internSlug }: { internSlug: string }) {
  const { weeks, months, streakDays, totalCount } = useMemo(() => {
    const dailies = getInternReports(internSlug).daily
    const dateSet = new Set(dailies.map((d) => d.date?.slice(0, 10)).filter(Boolean) as string[])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const totalDays = 26 * 7
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - totalDays + 1)
    const startDay = startDate.getDay()
    const mondayOffset = startDay === 0 ? -6 : 1 - startDay
    startDate.setDate(startDate.getDate() + mondayOffset)

    const allDays: Array<{ date: string; hasReport: boolean }> = []
    const d = new Date(startDate)
    while (d <= today) {
      const ds = d.toISOString().slice(0, 10)
      allDays.push({ date: ds, hasReport: dateSet.has(ds) })
      d.setDate(d.getDate() + 1)
    }

    const wks: Array<Array<{ date: string; hasReport: boolean }>> = []
    for (let i = 0; i < allDays.length; i += 7) {
      wks.push(allDays.slice(i, i + 7))
    }

    const mos: Array<{ label: string; col: number }> = []
    let lastMonth = ''
    wks.forEach((week, col) => {
      const m = week[0]?.date?.slice(0, 7) ?? ''
      if (m && m !== lastMonth) {
        mos.push({ label: m.slice(5), col })
        lastMonth = m
      }
    })

    let streak = 0
    const td = new Date(today)
    while (dateSet.has(td.toISOString().slice(0, 10))) {
      streak++
      td.setDate(td.getDate() - 1)
    }

    return { weeks: wks, months: mos, totalCount: dailies.length, streakDays: streak }
  }, [internSlug])

  const DAY_LABELS = ['', '一', '', '三', '', '五', '']

  return (
    <div className="lo-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-heading">日报热力图</h2>
        <div className="flex items-center gap-3 text-[11px] text-dim">
          <span>连续 {streakDays} 天</span>
          <span>共 {totalCount} 篇</span>
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <div className="flex gap-1 pb-1 pl-6">
          {months.map((m, i) => (
            <span
              key={i}
              className="text-[9px] text-placeholder"
              style={{ position: 'relative', left: `${m.col * 14}px` }}
            >
              {m.label}月
            </span>
          ))}
        </div>
        <div className="flex gap-0">
          <div className="flex flex-col gap-1 pr-1.5 pt-0.5">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-3 text-[9px] leading-3 text-placeholder">{label}</div>
            ))}
          </div>
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {Array.from({ length: 7 }, (_, di) => {
                  const day = week[di]
                  if (!day) return <div key={di} className="h-3 w-3" />
                  return (
                    <div
                      key={di}
                      className={`h-3 w-3 rounded-sm transition-colors ${
                        day.hasReport ? 'bg-green-500' : 'bg-muted'
                      } hover:ring-1 hover:ring-primary`}
                      title={`${day.date}${day.hasReport ? ' ✓' : ''}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-dim">
          <span>少</span>
          <div className="h-2.5 w-2.5 rounded-sm bg-muted" />
          <div className="h-2.5 w-2.5 rounded-sm bg-green-500" />
          <span>多</span>
        </div>
      </div>
    </div>
  )
}

// ── Task Stats ────────────────────────────────────────────────

function TaskStats({ internSlug }: { internSlug: string }) {
  const [stats, setStats] = useState<Array<{ project: string; projectSlug: string; stats: { total: number; completed: number } | null }>>([])

  useEffect(() => {
    const projects = getProjectsByIntern(internSlug)
    Promise.all(
      projects.map(async (p) => {
        const tree = await getProjectTasks(internSlug, p.slug ?? '')
        return {
          project: p.title ?? p.slug ?? '',
          projectSlug: p.slug ?? '',
          stats: tree ? countTasks(tree.tasks) : null,
        }
      }),
    ).then(setStats)
  }, [internSlug])

  const totals = stats.reduce(
    (acc, s) => {
      if (!s.stats) return acc
      return { total: acc.total + s.stats.total, completed: acc.completed + s.stats.completed }
    },
    { total: 0, completed: 0 },
  )

  if (totals.total === 0) return null

  const pct = totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0

  return (
    <div className="lo-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-heading">任务进度</h2>
        <span className="text-xs text-dim">{totals.completed} / {totals.total} ({pct}%)</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 space-y-2">
        {stats.filter((s) => s.stats && s.stats.total > 0).map((s) => {
          const sp = s.stats!
          const spp = Math.round((sp.completed / sp.total) * 100)
          return (
            <div key={s.projectSlug} className="flex items-center gap-3">
              <span className="w-24 truncate text-xs text-body">{s.project}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${spp}%` }} />
              </div>
              <span className="font-mono text-[10px] text-dim">{sp.completed}/{sp.total}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
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
            {intern.role ?? '实习生'}
            {intern.team && ` · ${intern.team}`}
            {intern.startDate && ` · ${intern.startDate} 入职`}
          </p>
        </div>
      </div>

      {/* Bio */}
      {intern.body && (
        <div className="lo-card p-4">
          <MarkdownView body={intern.body} internSlug={internSlug} />
        </div>
      )}

      {/* Heatmap + Task Stats */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <ContributionHeatmap internSlug={internSlug} />
        <TaskStats internSlug={internSlug} />
      </div>

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
        <Link to={`/interns/${internSlug}/projects`} className="lo-card flex flex-col items-center gap-1 p-3 transition-colors hover:border-primary/40">
          <FolderKanban className="h-4 w-4 text-dim" />
          <span className="text-sm font-medium text-heading">项目</span>
          <span className="text-[10px] text-dim">{projects.length} 个</span>
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
