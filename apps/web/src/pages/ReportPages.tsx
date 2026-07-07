import { useParams, Link, Navigate } from 'react-router-dom'
import { getInternBySlug, getInternReports } from '@/content/loader'
import type { Daily, Weekly, Monthly, Docs } from '@/content/loader'

type CollectionKey = 'daily' | 'weekly' | 'monthly' | 'docs'

const COLLECTION_CONFIG: Record<
  CollectionKey,
  { label: string; description: string; basePath: (intern: string) => string; empty: string }
> = {
  daily: {
    label: '日报',
    description: '每日复盘 — 任务、进展、思考。',
    basePath: (i) => `/interns/${i}/daily`,
    empty: '还没有日报。',
  },
  weekly: {
    label: '周报',
    description: '周计划与周复盘。',
    basePath: (i) => `/interns/${i}/weekly`,
    empty: '还没有周报。',
  },
  monthly: {
    label: '月报',
    description: '月度总结与下月规划。',
    basePath: (i) => `/interns/${i}/monthly`,
    empty: '还没有月报。',
  },
  docs: {
    label: '文档',
    description: '知识库文档。',
    basePath: (i) => `/interns/${i}/docs`,
    empty: '还没有文档。',
  },
}

type ReportItem = {
  slug: string
  title: string
  date?: string
  summary?: string
  body: string
  tags?: string[]
  intern: string
}

/** Report list page — generic for daily/weekly/monthly/docs */
export function ReportListPage({ type }: { type: CollectionKey }) {
  const { name } = useParams<{ name: string }>()
  const intern = getInternBySlug(name ?? '')
  const cfg = COLLECTION_CONFIG[type]

  if (!intern) return <Navigate to="/" replace />

  const reports = getInternReports(intern.slug ?? '')
  const items: ReportItem[] = (reports[type] as Array<Daily | Weekly | Monthly | Docs>).map((r) => ({
    slug: r.slug,
    title: r.title,
    date: r.date,
    summary: r.summary,
    body: r.body,
    tags: 'tags' in r ? (r.tags as string[]) : [],
    intern: r.intern,
  }))

  return (
    <section className="space-y-4">
      <div>
        <Link to={`/interns/${intern.slug}`} className="text-xs text-dim hover:text-heading">
          ← {intern.name}
        </Link>
        <h1 className="lo-section-title mt-1">{cfg.label}列表</h1>
        <p className="text-xs text-dim">{cfg.description}</p>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-dim">{cfg.empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.slug}
              to={`${cfg.basePath(intern.slug ?? '')}/${item.slug}`}
              className="lo-card block p-3 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex-1 truncate text-sm font-medium text-heading">
                  {item.summary ?? item.title}
                </span>
                {item.date && <span className="text-xs text-dim">{item.date}</span>}
              </div>
              {item.tags && item.tags.length > 0 && (
                <div className="mt-1 flex gap-1">
                  {item.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-dim">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

/** Report detail page — generic, renders Markdown body */
export function ReportDetailPage({ type }: { type: CollectionKey }) {
  const { name, slug } = useParams<{ name: string; slug: string }>()
  const intern = getInternBySlug(name ?? '')
  const cfg = COLLECTION_CONFIG[type]

  if (!intern) return <Navigate to="/" replace />

  const reports = getInternReports(intern.slug ?? '')
  const collection = reports[type] as Array<Daily | Weekly | Monthly | Docs>
  const item = collection.find((r) => r.slug === slug)

  if (!item) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-dim">未找到: {slug}</p>
        <Link to={cfg.basePath(intern.slug ?? '')} className="mt-2 inline-block text-xs text-primary hover:underline">
          返回{cfg.label}列表
        </Link>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <Link to={cfg.basePath(intern.slug ?? '')} className="text-xs text-dim hover:text-heading">
          ← {cfg.label}列表
        </Link>
        <h1 className="lo-section-title mt-1">{item.title}</h1>
        <div className="flex items-center gap-3 text-xs text-dim">
          {item.date && <span>{item.date}</span>}
          {'tags' in item && item.tags && item.tags.length > 0 && (
            <span>{item.tags.join(', ')}</span>
          )}
        </div>
      </div>

      <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: item.body }} />
    </section>
  )
}

// Exported page components
export const DailyList = () => <ReportListPage type="daily" />
export const DailyDetail = () => <ReportDetailPage type="daily" />
export const WeeklyList = () => <ReportListPage type="weekly" />
export const WeeklyDetail = () => <ReportDetailPage type="weekly" />
export const MonthlyList = () => <ReportListPage type="monthly" />
export const MonthlyDetail = () => <ReportDetailPage type="monthly" />
export const DocsList = () => <ReportListPage type="docs" />
export const DocsDetail = () => <ReportDetailPage type="docs" />
