import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import {
  getAllDaily,
  getAllWeekly,
  getAllMonthly,
  getAllDocs,
  getAllProjects,
  getAllInterns,
} from '@/content/loader'
import { stripMarkdown } from '@/lib/markdown'

interface SearchResult {
  type: 'daily' | 'weekly' | 'monthly' | 'docs' | 'project' | 'intern'
  title: string
  slug: string
  date?: string
  summary?: string
  intern?: string
  to: string
  score: number
}

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  daily: '日报',
  weekly: '周报',
  monthly: '月报',
  docs: '文档',
  project: '项目',
  intern: '实习生',
}

const TYPE_COLORS: Record<SearchResult['type'], string> = {
  daily: 'bg-primary/10 text-primary',
  weekly: 'bg-blue-500/10 text-blue-500',
  monthly: 'bg-amber-500/10 text-amber-500',
  docs: 'bg-violet-500/10 text-violet-500',
  project: 'bg-emerald-500/10 text-emerald-500',
  intern: 'bg-pink-500/10 text-pink-500',
}

function fuzzyMatch(text: string, query: string): number {
  if (!query) return 0
  const lower = text.toLowerCase()
  const q = query.toLowerCase()

  // Exact match
  if (lower === q) return 100
  // Starts with
  if (lower.startsWith(q)) return 90
  // Contains
  if (lower.includes(q)) return 70

  // Fuzzy: all chars in order
  let qi = 0
  for (let ti = 0; ti < lower.length && qi < q.length; ti++) {
    if (lower[ti] === q[qi]) qi++
  }
  if (qi === q.length) return 40

  return 0
}

function searchAll(query: string): SearchResult[] {
  if (!query.trim()) return []

  const results: SearchResult[] = []
  const q = query.trim()

  // Daily
  for (const r of getAllDaily()) {
    const titleScore = fuzzyMatch(r.title ?? '', q)
    const summaryScore = fuzzyMatch(r.summary ?? '', q)
    const bodyScore = fuzzyMatch(stripMarkdown(r.body ?? '').slice(0, 500), q)
    const score = Math.max(titleScore, summaryScore * 0.7, bodyScore * 0.3)
    if (score > 0) {
      results.push({
        type: 'daily', title: r.title ?? r.slug, slug: r.slug, date: r.date,
        summary: r.summary, intern: r.intern,
        to: `/interns/${r.intern}/report/daily/${r.slug}`, score,
      })
    }
  }

  // Weekly
  for (const r of getAllWeekly()) {
    const score = Math.max(
      fuzzyMatch(r.title ?? '', q),
      fuzzyMatch(r.summary ?? '', q) * 0.7,
    )
    if (score > 0) {
      results.push({
        type: 'weekly', title: r.title ?? r.slug, slug: r.slug, date: r.date,
        summary: r.summary, intern: r.intern,
        to: `/interns/${r.intern}/report/weekly/${r.slug}`, score,
      })
    }
  }

  // Monthly
  for (const r of getAllMonthly()) {
    const score = Math.max(
      fuzzyMatch(r.title ?? '', q),
      fuzzyMatch(r.summary ?? '', q) * 0.7,
    )
    if (score > 0) {
      results.push({
        type: 'monthly', title: r.title ?? r.slug, slug: r.slug, date: r.date,
        summary: r.summary, intern: r.intern,
        to: `/interns/${r.intern}/report/monthly/${r.slug}`, score,
      })
    }
  }

  // Docs
  for (const r of getAllDocs()) {
    const titleScore = fuzzyMatch(r.title ?? '', q)
    const bodyScore = fuzzyMatch(stripMarkdown(r.body ?? '').slice(0, 500), q)
    const score = Math.max(titleScore, bodyScore * 0.3)
    if (score > 0) {
      results.push({
        type: 'docs', title: r.title ?? r.slug, slug: r.slug, date: r.date,
        summary: r.summary, intern: r.intern,
        to: `/interns/${r.intern}/docs/${r.slug}`, score,
      })
    }
  }

  // Projects
  for (const p of getAllProjects()) {
    const score = Math.max(
      fuzzyMatch(p.title ?? '', q),
      fuzzyMatch(p.summary ?? '', q) * 0.7,
    )
    if (score > 0) {
      results.push({
        type: 'project', title: p.title ?? p.slug ?? '', slug: p.slug ?? '',
        summary: p.summary, intern: p.intern,
        to: `/interns/${p.intern}/projects`, score,
      })
    }
  }

  // Interns
  for (const i of getAllInterns()) {
    const score = fuzzyMatch(i.name ?? '', q)
    if (score > 0) {
      results.push({
        type: 'intern', title: i.name ?? '', slug: i.slug ?? '',
        summary: i.role, intern: i.slug,
        to: `/interns/${i.slug}`, score,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 20)
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => searchAll(query), [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && results[activeIndex]) {
        // Navigate via Link click
        const link = document.querySelector(`[data-search-idx="${activeIndex}"]`) as HTMLAnchorElement
        link?.click()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, results, activeIndex, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-20"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索日报、周报、月报、文档、项目、实习生…"
            className="flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-placeholder"
          />
          <button onClick={onClose} className="rounded p-1 text-dim hover:text-heading">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-sm text-dim">
              输入关键词开始搜索
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-sm text-dim">
              未找到匹配结果
            </div>
          ) : (
            <div className="py-2">
              {results.map((r, i) => (
                <Link
                  key={`${r.type}-${r.slug}-${r.intern}`}
                  to={r.to}
                  data-search-idx={i}
                  onClick={onClose}
                  className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${
                    i === activeIndex ? 'bg-muted' : 'hover:bg-muted'
                  }`}
                >
                  <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[r.type]}`}>
                    {TYPE_LABELS[r.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-heading">
                      {r.title}
                    </div>
                    {r.summary && (
                      <div className="truncate text-xs text-dim">
                        {stripMarkdown(r.summary)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2 text-[10px] text-dim">
                    {r.intern && <span>{r.intern}</span>}
                    {r.date && <span className="font-mono">{r.date.slice(0, 10)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-placeholder">
          <div className="flex items-center gap-3">
            <span>↑↓ 导航</span>
            <span>↵ 选择</span>
            <span>ESC 关闭</span>
          </div>
          <span>{results.length} 个结果</span>
        </div>
      </div>
    </div>
  )
}
