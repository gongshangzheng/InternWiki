import { useParams, Navigate } from 'react-router-dom'
import { ReportList, type ReportListItem } from '@/components/ReportList'
import { ReportDetail, type ReportDetailItem } from '@/components/ReportDetail'
import { RelatedReports } from '@/components/RelatedReports'
import { getInternBySlug, getInternReports } from '@/content/loader'
import type { Daily, Weekly, Monthly, Docs } from '@/content/loader'

type CollectionKey = 'daily' | 'weekly' | 'monthly' | 'docs'

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

function getTags(item: Daily | Weekly | Monthly | Docs): string[] {
  if ('tags' in item && Array.isArray(item.tags)) {
    return item.tags as string[]
  }
  return []
}

/** Report list page — generic for daily/weekly/monthly/docs */
export function ReportListPage({ type }: { type: CollectionKey }) {
  const { name } = useParams<{ name: string }>()
  const intern = getInternBySlug(name ?? '')
  const cfg = COLLECTION_CONFIG[type]

  if (!intern) return <Navigate to="/" replace />

  const internSlug = intern.slug ?? ''
  const reports = getInternReports(internSlug)
  const collection = reports[type] as Array<Daily | Weekly | Monthly | Docs>

  const items: ReportListItem[] = collection.map((r) => ({
    slug: r.slug,
    title: r.title,
    date: r.date,
    summary: r.summary,
    tags: getTags(r),
    intern: internSlug,
  }))

  return (
    <ReportList
      title={cfg.label}
      description={cfg.description}
      items={items}
      basePath={cfg.basePath(internSlug)}
      emptyText={cfg.empty}
    />
  )
}

/** Report detail page — generic, renders Markdown body */
export function ReportDetailPage({ type }: { type: CollectionKey }) {
  const { name, slug } = useParams<{ name: string; slug: string }>()
  const intern = getInternBySlug(name ?? '')
  const cfg = COLLECTION_CONFIG[type]

  if (!intern) return <Navigate to="/" replace />

  const internSlug = intern.slug ?? ''
  const reports = getInternReports(internSlug)
  const collection = reports[type] as Array<Daily | Weekly | Monthly | Docs>
  const raw = collection.find((r) => r.slug === slug)

  const item: ReportDetailItem | undefined = raw
    ? {
        title: raw.title,
        slug: raw.slug,
        date: raw.date,
        summary: raw.summary,
        body: raw.body,
        tags: getTags(raw),
      }
    : undefined

  return (
    <>
      <ReportDetail
        item={item}
        backTo={cfg.basePath(internSlug)}
        backLabel={`${cfg.label}列表`}
        notFoundTitle={`未找到${cfg.label}`}
      />
      {item?.date && (
        <RelatedReports type={type} intern={internSlug} slug={item.slug} date={item.date} />
      )}
    </>
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
