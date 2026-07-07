import { Link } from 'react-router-dom'
import { FileText, ChevronRight } from 'lucide-react'
import { stripMarkdown } from '@/lib/markdown'

export type ReportListItem = {
  slug: string
  title: string
  date?: string
  summary?: string
  tags?: string[]
  intern?: string
}

type ReportListProps = {
  title: string
  description?: string
  items: ReadonlyArray<ReportListItem>
  basePath: string
  emptyText?: string
}

function formatDate(iso?: string): string | null {
  if (!iso) return null
  return iso.slice(0, 10)
}

export function ReportList({
  title,
  description,
  items,
  basePath,
  emptyText = '还没有内容。',
}: ReportListProps) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="lo-section-title">{title}</h1>
        {description && <p className="text-xs text-dim">{description}</p>}
      </header>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-dim">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => {
            const date = formatDate(it.date)
            const preview = it.summary ? stripMarkdown(it.summary) : ''
            return (
              <li key={`${it.intern ?? ''}-${it.slug}`}>
                <Link
                  to={`${basePath}/${it.slug}`}
                  className="lo-card group flex items-start gap-3 p-3 transition-colors hover:border-primary/40"
                >
                  <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-dim group-hover:text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-medium text-heading group-hover:text-primary">
                        {it.title}
                      </span>
                      {date && (
                        <span className="flex-shrink-0 font-mono text-[11px] text-dim">
                          {date}
                        </span>
                      )}
                    </div>
                    {preview && (
                      <p className="mt-1 line-clamp-2 text-sm text-body">{preview}</p>
                    )}
                    {it.tags && it.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {it.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-dim"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-placeholder group-hover:text-primary" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
