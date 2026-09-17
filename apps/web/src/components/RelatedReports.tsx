import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUp, Calendar } from 'lucide-react'
import { getInternReports } from '@/content/loader'

// ── Helpers ──────────────────────────────────────────────────

function getIsoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function formatDate(iso?: string): string {
  return iso?.slice(0, 10) ?? ''
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// ── Types ────────────────────────────────────────────────────

type ReportType = 'daily' | 'weekly' | 'monthly' | 'docs'

type RelatedReportsProps = {
  type: ReportType
  intern: string
  slug: string
  date?: string
}

type RelatedLink = {
  to: string
  label: string
  icon: typeof ArrowLeft
  hint?: string
}

// ── Component ────────────────────────────────────────────────

export function RelatedReports({ type, intern, date }: RelatedReportsProps) {
  if (!date) return null

  const reports = getInternReports(intern)
  const links: RelatedLink[] = []
  const d = new Date(date)
  const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const weekKey = getIsoWeekKey(d)

  const base = `/interns/${intern}/report`

  if (type === 'daily') {
    // Previous / next daily
    const prevSlug = addDays(date, -1)
    const nextSlug = addDays(date, 1)
    const prevDaily = reports.daily.find((x) => x.slug === prevSlug)
    const nextDaily = reports.daily.find((x) => x.slug === nextSlug)
    if (prevDaily) {
      links.push({ to: `${base}/daily/${prevSlug}`, label: prevDaily.title, icon: ArrowLeft, hint: '前一天' })
    }
    if (nextDaily) {
      links.push({ to: `${base}/daily/${nextSlug}`, label: nextDaily.title, icon: ArrowRight, hint: '后一天' })
    }

    // Parent weekly
    const parentWeek = reports.weekly.find((w) => w.slug.includes(weekKey))
    if (parentWeek) {
      links.push({ to: `${base}/weekly/${parentWeek.slug}`, label: parentWeek.title, icon: ArrowUp, hint: '所属周报' })
    }

    // Parent monthly
    const parentMonth = reports.monthly.find((m) => m.slug === ym)
    if (parentMonth) {
      links.push({ to: `${base}/monthly/${parentMonth.slug}`, label: parentMonth.title, icon: ArrowUp, hint: '所属月报' })
    }
  }

  if (type === 'weekly') {
    // Dailies in this week
    const weekDailies = reports.daily.filter(
      (x) => x.date && getIsoWeekKey(new Date(x.date)) === weekKey,
    )
    for (const wd of weekDailies.slice(0, 7)) {
      links.push({ to: `${base}/daily/${wd.slug}`, label: wd.title, icon: Calendar, hint: formatDate(wd.date) })
    }

    // Parent monthly
    const parentMonth = reports.monthly.find((m) => m.slug === ym)
    if (parentMonth) {
      links.push({ to: `${base}/monthly/${parentMonth.slug}`, label: parentMonth.title, icon: ArrowUp, hint: '所属月报' })
    }
  }

  if (type === 'monthly') {
    // Weeklies in this month
    const monthWeeklies = reports.weekly.filter((w) => w.date && w.date.startsWith(ym))
    for (const mw of monthWeeklies.slice(0, 5)) {
      links.push({ to: `${base}/weekly/${mw.slug}`, label: mw.title, icon: Calendar, hint: mw.slug })
    }
  }

  if (links.length === 0) return null

  return (
    <div className="mt-8 border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">关联报告</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-body transition-colors hover:border-primary/40 hover:bg-muted hover:text-primary"
            >
              <Icon className="h-3 w-3 text-dim" />
              <span className="line-clamp-1">{link.label}</span>
              {link.hint && <span className="text-[10px] text-placeholder">({link.hint})</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
