import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { MarkdownView } from '@/components/MarkdownView'
import { getAllGuides, getGuideBySlug, getGuidesByCategory } from '@/content/loader'
import { extractToc } from '@/lib/utils'

export function GuidePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const allGuides = getAllGuides()
  const categories = getGuidesByCategory()

  // Redirect to first article if no slug
  if (!slug && allGuides.length > 0) {
    return <Navigate to={`/guide/${allGuides[0].slug}`} replace />
  }

  const article = slug ? getGuideBySlug(slug) : undefined

  if (!article) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-dim">未找到指南文章: {slug}</p>
        <Link to="/guide" className="mt-2 inline-block text-xs text-primary hover:underline">
          返回指南首页
        </Link>
      </div>
    )
  }

  // Find prev/next articles
  const currentIdx = allGuides.findIndex((g) => g.slug === article.slug)
  const prevArticle = currentIdx > 0 ? allGuides[currentIdx - 1] : null
  const nextArticle =
    currentIdx < allGuides.length - 1 ? allGuides[currentIdx + 1] : null

  // Extract TOC from article body
  const tocItems = extractToc(article.body)

  return (
    <div className="flex gap-6">
      {/* ── Left sidebar: article list ── */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          <div className="mb-3 flex items-center gap-1.5 px-2 text-xs font-semibold text-heading">
            <BookOpen className="h-3.5 w-3.5" />
            使用指南
          </div>
          <nav>
            {categories.map(({ category, items }) => (
              <div key={category}>
                <div className="guide-sidebar-category">{category}</div>
                {items.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/guide/${item.slug}`}
                    className={`guide-sidebar-link ${item.slug === article.slug ? 'active' : ''}`}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* ── Center: article content ── */}
      <article className="min-w-0 flex-1">
        {/* Mobile article selector */}
        <div className="mb-4 lg:hidden">
          <label className="mb-1 block text-xs font-medium text-dim">选择文章</label>
          <select
            value={article.slug}
            onChange={(e) => {
              navigate(`/guide/${e.target.value}`)
            }}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-heading"
          >
            {categories.map(({ category, items }) => (
              <optgroup key={category} label={category}>
                {items.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-1 text-xs text-dim">
          <Link to="/guide" className="hover:text-heading">
            使用指南
          </Link>
          <span>/</span>
          <span className="text-body">{article.category}</span>
        </div>

        {/* Article header */}
        <header className="mb-6 border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-heading">{article.title}</h1>
          {article.summary && (
            <p className="mt-2 text-sm text-dim">{article.summary}</p>
          )}
        </header>

        {/* Article body */}
        <div className="lo-card p-6">
          <MarkdownView body={article.body} />
        </div>

        {/* Prev / Next navigation */}
        <div className="mt-6 flex items-stretch gap-3">
          {prevArticle ? (
            <Link
              to={`/guide/${prevArticle.slug}`}
              className="lo-card group flex flex-1 items-center gap-3 p-4 transition-colors hover:border-primary/40"
            >
              <ChevronLeft className="h-5 w-5 shrink-0 text-dim transition-colors group-hover:text-primary" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-placeholder">上一篇</div>
                <div className="truncate text-sm font-medium text-heading">
                  {prevArticle.title}
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextArticle ? (
            <Link
              to={`/guide/${nextArticle.slug}`}
              className="lo-card group flex flex-1 items-center justify-end gap-3 p-4 text-right transition-colors hover:border-primary/40"
            >
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-placeholder">下一篇</div>
                <div className="truncate text-sm font-medium text-heading">
                  {nextArticle.title}
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
