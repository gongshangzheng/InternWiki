import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { stripMarkdown } from '@/lib/markdown'
import { MarkdownView } from './MarkdownView'

export type ReportDetailItem = {
  title: string
  slug: string
  date?: string
  summary?: string
  body: string
  tags?: string[]
}

type ReportDetailProps = {
  title?: string
  item: ReportDetailItem | undefined
  backTo: string
  backLabel: string
  notFoundTitle?: string
  internSlug?: string
}

function formatDate(iso?: string): string | null {
  if (!iso) return null
  return iso.slice(0, 10)
}

export function ReportDetail({
  title,
  item,
  backTo,
  backLabel,
  notFoundTitle = '未找到',
  internSlug,
}: ReportDetailProps) {
  if (!item) {
    return (
      <section className="space-y-3">
        <h1 className="lo-section-title">{notFoundTitle}</h1>
        <p className="text-sm text-dim">
          没有找到该报告。
        </p>
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回 {backLabel}
        </Link>
      </section>
    )
  }

  const date = formatDate(item.date)
  const summary = item.summary ? stripMarkdown(item.summary) : ''

  return (
    <article className="space-y-5">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-xs text-dim transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>

      <header className="space-y-2 border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-heading">
          {title ?? item.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-dim">
          {date && <span className="font-mono">{date}</span>}
          <span className="font-mono text-placeholder">/{item.slug}</span>
        </div>
        {summary && <p className="text-sm text-body">{summary}</p>}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
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

      <MarkdownView body={item.body} internSlug={internSlug} />
    </article>
  )
}
