import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { MarkdownView } from '@/components/MarkdownView'
import { RelatedReports } from '@/components/RelatedReports'
import { getInternBySlug, getInternReports } from '@/content/loader'
import type { Daily, Weekly, Monthly, Docs } from '@/content/loader'
import { extractToc } from '@/lib/utils'
import { stripMarkdown } from '@/lib/markdown'

type CollectionKey = 'daily' | 'weekly' | 'monthly' | 'docs'

type ReportItem = Daily | Weekly | Monthly | Docs

const COLLECTION_CONFIG: Record<
  CollectionKey,
  {
    label: string
    description: string
    basePath: (intern: string) => string
    empty: string
  }
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

function getTags(item: ReportItem): string[] {
  if ('tags' in item && Array.isArray(item.tags)) {
    return item.tags as string[]
  }
  return []
}

function formatDate(iso?: string): string {
  return iso?.slice(0, 10) ?? ''
}

/** Unified report page — wiki layout with sidebar + content + TOC */
function ReportPage({ type }: { type: CollectionKey }) {
  const { name, slug } = useParams<{ name: string; slug: string }>()
  const navigate = useNavigate()
  const intern = getInternBySlug(name ?? '')
  const cfg = COLLECTION_CONFIG[type]

  if (!intern) return <Navigate to="/" replace />

  const internSlug = intern.slug ?? ''
  const reports = getInternReports(internSlug)
  const collection = reports[type] as ReportItem[]

  // Empty state — no reports yet
  if (collection.length === 0) {
    return (
      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="lo-section-title">{cfg.label}</h1>
          <p className="text-xs text-dim">{cfg.description}</p>
        </header>
        <p className="py-8 text-center text-sm text-dim">{cfg.empty}</p>
      </section>
    )
  }

  // Redirect to first report if no slug
  if (!slug) {
    return <Navigate to={`${cfg.basePath(internSlug)}/${collection[0].slug}`} replace />
  }

  const article = collection.find((r) => r.slug === slug)

  // Not found
  if (!article) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-dim">未找到{cfg.label}: {slug}</p>
        <Link to={cfg.basePath(internSlug)} className="mt-2 inline-block text-xs text-primary hover:underline">
          返回{cfg.label}
        </Link>
      </div>
    )
  }

  // Find prev/next (collection is sorted by date desc, so prev = newer, next = older)
  const currentIdx = collection.findIndex((r) => r.slug === article.slug)
  const prevReport = currentIdx > 0 ? collection[currentIdx - 1] : null
  const nextReport =
    currentIdx < collection.length - 1 ? collection[currentIdx + 1] : null

  // Extract TOC from article body
  const tocItems = extractToc(article.body)

  // Article metadata
  const date = formatDate(article.date)
  const summary = article.summary ? stripMarkdown(article.summary) : ''
  const tags = getTags(article)
  const basePath = cfg.basePath(internSlug)

  return (
    <div className="flex gap-6">
      {/* ── Left sidebar: report list ── */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          <div className="mb-3 flex items-center gap-1.5 px-2 text-xs font-semibold text-heading">
            <FileText className="h-3.5 w-3.5" />
            {cfg.label}
          </div>
          <nav>
            {collection.map((item) => (
              <Link
                key={item.slug}
                to={`${basePath}/${item.slug}`}
                className={`guide-sidebar-link ${item.slug === article.slug ? 'active' : ''}`}
              >
                <div className="truncate">{item.title}</div>
                {item.date && (
                  <div className="mt-0.5 font-mono text-[10px] text-placeholder">
                    {formatDate(item.date)}
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* ── Center: article content ── */}
      <article className="min-w-0 flex-1">
        {/* Mobile article selector */}
        <div className="mb-4 lg:hidden">
          <label className="mb-1 block text-xs font-medium text-dim">选择{cfg.label}</label>
          <select
            value={article.slug}
            onChange={(e) => {
              navigate(`${basePath}/${e.target.value}`)
            }}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-heading"
          >
            {collection.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-1 text-xs text-dim">
          <Link to={`/interns/${internSlug}`} className="hover:text-heading">
            {intern.name}
          </Link>
          <span>/</span>
          <Link to={basePath} className="hover:text-heading">
            {cfg.label}
          </Link>
        </div>

        {/* Article header */}
        <header className="mb-6 border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-heading">{article.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-dim">
            {date && <span className="font-mono">{date}</span>}
            <span className="font-mono text-placeholder">/{article.slug}</span>
          </div>
          {summary && <p className="mt-2 text-sm text-dim">{summary}</p>}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-dim"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Article body */}
        <div className="lo-card p-6">
          <MarkdownView body={article.body} internSlug={internSlug} />
        </div>

        {/* Related reports */}
        {article.date && (
          <RelatedReports type={type} intern={internSlug} slug={article.slug} date={article.date} />
        )}

        {/* Prev / Next navigation */}
        <div className="mt-6 flex items-stretch gap-3">
          {prevReport ? (
            <Link
              to={`${basePath}/${prevReport.slug}`}
              className="lo-card group flex flex-1 items-center gap-3 p-4 transition-colors hover:border-primary/40"
            >
              <ChevronLeft className="h-5 w-5 shrink-0 text-dim transition-colors group-hover:text-primary" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-placeholder">较新</div>
                <div className="truncate text-sm font-medium text-heading">
                  {prevReport.title}
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextReport ? (
            <Link
              to={`${basePath}/${nextReport.slug}`}
              className="lo-card group flex flex-1 items-center justify-end gap-3 p-4 text-right transition-colors hover:border-primary/40"
            >
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-placeholder">较旧</div>
                <div className="truncate text-sm font-medium text-heading">
                  {nextReport.title}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-dim transition-colors group-hover:text-primary" />
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </article>

      {/* ── Right sidebar: TOC ── */}
      {tocItems.length > 0 && (
        <aside className="hidden w-48 shrink-0 xl:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="mb-2 px-2 text-xs font-semibold text-heading">
              目录
            </div>
            <nav>
              {tocItems.map((item, idx) => (
                <a
                  key={idx}
                  href={`#${item.slug}`}
                  className={`guide-toc-link ${item.level === 3 ? 'level-3' : ''}`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  )
}

// Exported page components — list and detail both render the unified ReportPage
export const DailyList = () => <ReportPage type="daily" />
export const DailyDetail = () => <ReportPage type="daily" />
export const WeeklyList = () => <ReportPage type="weekly" />
export const WeeklyDetail = () => <ReportPage type="weekly" />
export const MonthlyList = () => <ReportPage type="monthly" />
export const MonthlyDetail = () => <ReportPage type="monthly" />
export const DocsList = () => <ReportPage type="docs" />
export const DocsDetail = () => <ReportPage type="docs" />
