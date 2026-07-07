import { useParams, Link } from 'react-router-dom'
import { getAllShared, getSharedBySlug } from '@/content/loader'
import { MarkdownView } from '@/components/MarkdownView'

export function SharedList() {
  const items = getAllShared()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="lo-section-title">团队共享</h1>
        <p className="text-xs text-dim">入职指南、编码规范、团队约定等共享文档。</p>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-dim">还没有共享文档。</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.slug}
              to={`/shared/${item.slug}`}
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

export function SharedDetail() {
  const { slug } = useParams<{ slug: string }>()
  const item = getSharedBySlug(slug ?? '')

  if (!item) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-dim">未找到文档: {slug}</p>
        <Link to="/shared" className="mt-2 inline-block text-xs text-primary hover:underline">
          返回共享列表
        </Link>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <Link to="/shared" className="text-xs text-dim hover:text-heading">
          ← 共享文档
        </Link>
        <h1 className="lo-section-title mt-1">{item.title}</h1>
        <div className="flex items-center gap-3 text-xs text-dim">
          {item.date && <span>{item.date}</span>}
          {item.tags && item.tags.length > 0 && <span>{item.tags.join(', ')}</span>}
        </div>
      </div>

      <MarkdownView content={item.body} />
    </section>
  )
}
