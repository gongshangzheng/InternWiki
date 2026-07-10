import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { EventInput } from '@fullcalendar/core'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FolderKanban, FileText, Check, Circle, AlertCircle, ChevronDown } from 'lucide-react'
import { getDefaultIntern } from '@/lib/utils'
import {
  getAllInterns,
  getProjectsByIntern,
  getProjectTasks,
  getInternReports,
  flattenDatedTasks,
  flattenUndatedTasks,
  findRecurringTasks,
  type TaskNode,
  type RecurringConfig,
} from '@/content/loader'

// ── Types ─────────────────────────────────────────────────────

interface CalendarEvent {
  id: string
  title: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  category?: string
  description?: string
  project?: string
}

type SelectedItem =
  | { kind: 'task'; data: TaskNode & { projectSlug: string } }

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  study: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-500' },
  health: { bg: 'bg-green-500/15', border: 'border-green-500/40', text: 'text-green-500' },
  work: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-500' },
  social: { bg: 'bg-pink-500/15', border: 'border-pink-500/40', text: 'text-pink-500' },
  life: { bg: 'bg-violet-500/15', border: 'border-violet-500/40', text: 'text-violet-500' },
  other: { bg: 'bg-gray-500/15', border: 'border-gray-500/40', text: 'text-gray-500' },
}

const PROJECT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'search-engine': { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-500' },
  'frontend-components': { bg: 'bg-violet-500/15', border: 'border-violet-500/40', text: 'text-violet-500' },
}

const DEFAULT_COLOR = { bg: 'bg-indigo-500/15', border: 'border-indigo-500/40', text: 'text-indigo-500' }

function getEventColors(project?: string, category?: string) {
  if (project && PROJECT_COLORS[project]) return PROJECT_COLORS[project]
  return CATEGORY_COLORS[category ?? 'other'] ?? CATEGORY_COLORS.other
}

// ── Converters ────────────────────────────────────────────────

function taskNodesToFCEvents(
  datedTasks: Array<TaskNode & { projectSlug: string }>,
): EventInput[] {
  return datedTasks.map((t) => {
    const startDate = t.startDate!
    if (t.startTime) {
      return {
        id: `task-${t.projectSlug}-${t.id}`,
        title: `[${t.projectSlug}] ${t.title}`,
        start: `${startDate}T${t.startTime}`,
        end: t.endTime ? `${startDate}T${t.endTime}` : undefined,
        extendedProps: {
          source: 'task',
          projectSlug: t.projectSlug,
          taskStatus: t.status,
          description: t.description ?? '',
          location: t.location ?? '',
          category: t.category ?? 'work',
        },
      }
    }
    const endDate = t.endDate ?? startDate
    const endExclusive = new Date(endDate)
    endExclusive.setDate(endExclusive.getDate() + 1)
    return {
      id: `task-${t.projectSlug}-${t.id}`,
      title: `[${t.projectSlug}] ${t.title}`,
      start: startDate,
      end: t.endDate ? endExclusive.toISOString().slice(0, 10) : undefined,
      allDay: true,
      extendedProps: {
        source: 'task',
        projectSlug: t.projectSlug,
        taskStatus: t.status,
        description: t.description ?? '',
        location: t.location ?? '',
        category: t.category ?? 'work',
      },
    }
  })
}

function expandProjectRecurring(
  tasks: Array<TaskNode & { projectSlug: string }>,
  fromDate: string,
  toDate: string,
): CalendarEvent[] {
  const result: CalendarEvent[] = []
  for (const t of tasks) {
    const r = t.recurring as RecurringConfig | undefined
    if (!r) continue
    const activeFrom = r.activeFrom || fromDate
    const start = new Date(Math.max(new Date(fromDate).getTime(), new Date(activeFrom).getTime()))
    const end = r.activeUntil
      ? new Date(Math.min(new Date(toDate).getTime(), new Date(r.activeUntil).getTime()))
      : new Date(toDate)
    const excludeSet = new Set(r.excludeDates || [])
    let current = new Date(start)
    while (current <= end) {
      const ds = current.toISOString().slice(0, 10)
      if (!excludeSet.has(ds)) {
        result.push({
          id: `ptask-${t.projectSlug}-${t.id}-${ds}`,
          title: `[${t.projectSlug}] ${t.title}`,
          date: ds,
          startTime: r.startTime,
          endTime: r.endTime,
          location: r.location,
          category: r.category ?? 'work',
          description: t.description ?? '',
          project: t.projectSlug,
        })
      }
      if (r.pattern === 'daily') current.setDate(current.getDate() + 1)
      else if (r.pattern === 'weekly') current.setDate(current.getDate() + 7)
      else if (r.pattern === 'every-N-days') current.setDate(current.getDate() + (r.every || 3))
      else break
    }
  }
  return result
}

function isTaskOverdue(task: TaskNode, todayStr: string, nowTime: string): boolean {
  if (task.status === 'completed') return false
  if (!task.startDate) return false
  if (task.startTime) {
    if (task.startDate < todayStr) return true
    if (task.startDate === todayStr) {
      if (task.endTime) return task.endTime <= nowTime
      return task.startTime <= nowTime
    }
    return false
  }
  if (task.endDate && task.endDate < todayStr) return true
  if (!task.endDate && task.startDate < todayStr) return true
  return false
}

// ── Intern Selector ───────────────────────────────────────────

function InternSelector({
  interns,
  selected,
  onSelect,
}: {
  interns: ReturnType<typeof getAllInterns>
  selected: string
  onSelect: (slug: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = interns.find((i) => i.slug === selected)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-heading transition-colors hover:bg-muted"
      >
        {current && (
          <div className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary text-[10px]">
            {(current.name ?? '?')[0]}
          </div>
        )}
        {current?.name ?? '选择实习生'}
        <ChevronDown className="h-3.5 w-3.5 text-dim" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-card py-1 shadow-lg">
            {interns.map((intern) => (
              <button
                key={intern.slug}
                onClick={() => {
                  onSelect(intern.slug ?? '')
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted ${
                  intern.slug === selected ? 'text-primary' : 'text-body'
                }`}
              >
                <div className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary text-[10px]">
                  {(intern.name ?? '?')[0]}
                </div>
                {intern.name}
                <span className="ml-auto text-[10px] text-dim">{intern.team}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────

export function CalendarPage() {
  const allInterns = getAllInterns()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlIntern = searchParams.get('intern') ?? getDefaultIntern() ?? allInterns[0]?.slug ?? ''

  const [selectedIntern, setSelectedIntern] = useState(urlIntern)
  const [datedTasks, setDatedTasks] = useState<Array<TaskNode & { projectSlug: string }>>([])
  const [undatedTasks, setUndatedTasks] = useState<Array<TaskNode & { projectSlug: string }>>([])
  const [recurringEvents, setRecurringEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SelectedItem | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'pending' | 'completed'>('pending')

  // Sync URL when intern changes
  useEffect(() => {
    setSearchParams(selectedIntern ? { intern: selectedIntern } : {}, { replace: true })
  }, [selectedIntern, setSearchParams])

  // Daily slugs for "view daily" links
  const dailySlugs = useMemo(() => {
    if (!selectedIntern) return new Set<string>()
    return new Set(getInternReports(selectedIntern).daily.map((d) => d.slug))
  }, [selectedIntern])

  // Load task trees for selected intern
  useEffect(() => {
    if (!selectedIntern) {
      setLoading(false)
      return
    }
    setLoading(true)

    const now = new Date()
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    const rangeStartStr = rangeStart.toISOString().slice(0, 10)
    const rangeEndStr = rangeEnd.toISOString().slice(0, 10)

    const projects = getProjectsByIntern(selectedIntern)
    Promise.all(
      projects.map(async (p) => {
        const tree = await getProjectTasks(selectedIntern, p.slug ?? '')
        if (!tree) return { dated: [], undated: [], recurring: [] }
        return {
          dated: flattenDatedTasks(tree.tasks, p.slug ?? ''),
          undated: flattenUndatedTasks(tree.tasks, p.slug ?? ''),
          recurring: findRecurringTasks(tree.tasks, p.slug ?? ''),
        }
      }),
    ).then((results) => {
      const dated = results.flatMap((r) => r.dated)
      const undated = results.flatMap((r) => r.undated)
      const recurring = results.flatMap((r) => r.recurring)
      const events = expandProjectRecurring(recurring, rangeStartStr, rangeEndStr)
      setDatedTasks(dated)
      setUndatedTasks(undated)
      setRecurringEvents(events)
      setLoading(false)
    })
  }, [selectedIntern])

  const fcEvents = useMemo(() => {
    const recurringFC: EventInput[] = recurringEvents.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.startTime ? `${e.date}T${e.startTime}` : e.date,
      end: e.endTime ? `${e.date}T${e.endTime}` : undefined,
      extendedProps: {
        source: 'event',
        category: e.category ?? 'other',
        location: e.location ?? '',
        description: e.description ?? '',
        project: e.project ?? '',
      },
    }))
    return [...recurringFC, ...taskNodesToFCEvents(datedTasks)]
  }, [recurringEvents, datedTasks])

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const todayEvents = recurringEvents.filter((e) => e.date === today)
  const todayTasks = datedTasks.filter(
    (t) => t.startDate && t.startDate <= today && (!t.endDate || t.endDate >= today),
  )
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'completed')

  const allPendingDatedTasks = datedTasks.filter(
    (t) => t.status !== 'completed' && t.startDate && t.startDate <= today,
  )
  const overdueTasks = allPendingDatedTasks
    .filter((t) => isTaskOverdue(t, today, nowTime))
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
  const todayPendingTasks = allPendingDatedTasks
    .filter((t) => !isTaskOverdue(t, today, nowTime))
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const completedDatedTasks = datedTasks.filter(
    (t) => t.status === 'completed' && t.startDate && new Date(t.startDate) >= thirtyDaysAgo,
  )

  const hasPendingItems =
    todayEvents.length > 0 || overdueTasks.length > 0 || todayPendingTasks.length > 0 || undatedTasks.length > 0
  const hasCompletedItems = completedTodayTasks.length > 0 || completedDatedTasks.length > 0

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="lo-section-title">日历</h1>
        <InternSelector
          interns={allInterns}
          selected={selectedIntern}
          onSelect={setSelectedIntern}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* Calendar */}
        <div className="lo-card lo-calendar min-w-0 p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-dim">加载中…</div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="timeGridThreeDay"
              views={{
                timeGridThreeDay: {
                  type: 'timeGrid',
                  duration: { days: 3 },
                  buttonText: '3日',
                },
              }}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridThreeDay,timeGridDay,listWeek',
              }}
              buttonText={{
                today: '今天',
                month: '月',
                week: '周',
                day: '日',
                list: '列表',
              }}
              locale="zh-cn"
              firstDay={1}
              nowIndicator
              events={fcEvents}
              height="auto"
              eventDisplay="block"
              eventClick={(info) => {
                const id = info.event.id
                if (id.startsWith('task-')) {
                  const task = datedTasks.find((t) => `task-${t.projectSlug}-${t.id}` === id)
                  if (task) setSelected({ kind: 'task', data: task })
                }
              }}
              eventContent={(arg) => {
                const source = arg.event.extendedProps.source as string
                if (source === 'task') {
                  const slug = arg.event.extendedProps.projectSlug as string
                  const status = arg.event.extendedProps.taskStatus as string
                  const isCompleted = status === 'completed'
                  const colors = isCompleted
                    ? { bg: 'bg-zinc-500/15', text: 'text-zinc-500' }
                    : (PROJECT_COLORS[slug] ?? DEFAULT_COLOR)
                  return (
                    <div className={`rounded px-1 py-0.5 text-xs ${colors.bg} ${isCompleted ? 'line-through opacity-60' : ''}`}>
                      {arg.event.title}
                    </div>
                  )
                }
                const cat = arg.event.extendedProps.category as string
                const project = arg.event.extendedProps.project as string
                const colors = getEventColors(project || undefined, cat)
                return (
                  <div className={`rounded px-1 py-0.5 text-xs ${colors.bg}`}>
                    {arg.event.title}
                  </div>
                )
              }}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="lo-card overflow-y-auto lg:max-h-[calc(100vh-8rem)] lg:sticky lg:top-20">
          <div className="flex border-b border-border">
            <button
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                sidebarTab === 'pending'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-dim hover:text-body'
              }`}
              onClick={() => setSidebarTab('pending')}
            >
              <Circle className="h-3 w-3" />
              待办
              {hasPendingItems && (
                <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                  {overdueTasks.length + todayPendingTasks.length + undatedTasks.length}
                </span>
              )}
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                sidebarTab === 'completed'
                  ? 'text-green-500 border-b-2 border-green-500'
                  : 'text-dim hover:text-body'
              }`}
              onClick={() => setSidebarTab('completed')}
            >
              <Check className="h-3 w-3" />
              已完成
              {hasCompletedItems && (
                <span className="ml-0.5 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] text-green-500">
                  {completedTodayTasks.length + completedDatedTasks.length}
                </span>
              )}
            </button>
          </div>

          <div className="space-y-4 p-4">
            {sidebarTab === 'pending' && (
              <>
                {overdueTasks.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      逾期
                      <span className="ml-0.5 text-red-500/60">{overdueTasks.length}</span>
                    </h2>
                    {overdueTasks.map((t) => {
                      return (
                        <div
                          key={`task-${t.projectSlug}-${t.id}`}
                          className="flex cursor-pointer items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-2.5 transition-colors hover:opacity-80"
                          onClick={() => setSelected({ kind: 'task', data: t })}
                        >
                          <AlertCircle className="h-3 w-3 flex-shrink-0 text-red-500" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium text-body">{t.title}</div>
                            <div className="truncate text-[10px] text-dim">
                              {t.projectSlug} · {t.startDate}{t.startTime ? ` ${t.startTime}` : ''}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {todayPendingTasks.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
                      今日
                      <span className="ml-1.5 text-placeholder">{todayPendingTasks.length}</span>
                    </h2>
                    {todayPendingTasks.map((t) => {
                      const colors = PROJECT_COLORS[t.projectSlug] ?? DEFAULT_COLOR
                      return (
                        <div
                          key={`task-${t.projectSlug}-${t.id}`}
                          className={`flex cursor-pointer items-center gap-2 rounded-md border ${colors.border} ${colors.bg} p-2.5 transition-colors hover:opacity-80`}
                          onClick={() => setSelected({ kind: 'task', data: t })}
                        >
                          <FolderKanban className={`h-3 w-3 flex-shrink-0 ${colors.text}`} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium text-body">{t.title}</div>
                            <div className="truncate text-[10px] text-dim">
                              {t.projectSlug}{t.startTime ? ` · ${t.startTime}` : ''}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {undatedTasks.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
                      无日期
                      <span className="ml-1.5 text-placeholder">{undatedTasks.length}</span>
                    </h2>
                    {undatedTasks.map((t) => {
                      const colors = PROJECT_COLORS[t.projectSlug] ?? DEFAULT_COLOR
                      return (
                        <div
                          key={`task-${t.projectSlug}-${t.id}`}
                          className={`flex cursor-pointer items-center gap-2 rounded-md border ${colors.border} ${colors.bg} p-2.5 transition-colors hover:opacity-80`}
                          onClick={() => setSelected({ kind: 'task', data: t })}
                        >
                          <FolderKanban className={`h-3 w-3 flex-shrink-0 ${colors.text}`} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium text-body">{t.title}</div>
                            <div className="truncate text-[10px] text-dim">
                              {t.projectSlug} · {t.status}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {!hasPendingItems && (
                  <div className="py-8 text-center text-xs text-dim">暂无待办事项</div>
                )}
              </>
            )}

            {sidebarTab === 'completed' && (
              <>
                {completedTodayTasks.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">今日完成</h2>
                    {completedTodayTasks.map((t) => (
                      <div
                        key={`task-${t.projectSlug}-${t.id}`}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-500/30 bg-zinc-500/15 p-2.5 opacity-70 transition-colors hover:opacity-90"
                        onClick={() => setSelected({ kind: 'task', data: t })}
                      >
                        <Check className="h-3 w-3 flex-shrink-0 text-green-500" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-body line-through">{t.title}</div>
                          <div className="truncate text-[10px] text-dim">{t.projectSlug}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {completedDatedTasks.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
                      近期完成
                      <span className="ml-1.5 text-placeholder">{completedDatedTasks.length}</span>
                    </h2>
                    {completedDatedTasks.map((t) => (
                      <div
                        key={`task-${t.projectSlug}-${t.id}`}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-500/30 bg-zinc-500/15 p-2.5 opacity-70 transition-colors hover:opacity-90"
                        onClick={() => setSelected({ kind: 'task', data: t })}
                      >
                        <Check className="h-3 w-3 flex-shrink-0 text-green-500" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-body line-through">{t.title}</div>
                          <div className="truncate text-[10px] text-dim">
                            {t.projectSlug} · {t.startDate}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!hasCompletedItems && (
                  <div className="py-8 text-center text-xs text-dim">暂无已完成事项</div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Detail modal */}
      {selected && selected.kind === 'task' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSelected(null)}
        >
          <div
            className="lo-card mx-4 w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-heading">{selected.data.title}</h3>
            </div>
            <div className="mt-3 space-y-2 text-sm text-body">
              <div>
                <span className="text-dim">项目：</span>
                {selected.data.projectSlug}
              </div>
              <div>
                <span className="text-dim">状态：</span>
                {selected.data.status}
              </div>
              {selected.data.startDate && (
                <div>
                  <span className="text-dim">日期：</span>
                  <span className="font-mono">
                    {selected.data.startDate}
                    {selected.data.endDate ? ` → ${selected.data.endDate}` : ''}
                  </span>
                </div>
              )}
              {selected.data.startTime && (
                <div>
                  <span className="text-dim">时间：</span>
                  <span className="font-mono">
                    {selected.data.startTime}{selected.data.endTime ? ` - ${selected.data.endTime}` : ''}
                  </span>
                </div>
              )}
              {selected.data.location && (
                <div>
                  <span className="text-dim">地点：</span>
                  {selected.data.location}
                </div>
              )}
              {selected.data.description && (
                <div>
                  <span className="text-dim">描述：</span>
                  {selected.data.description}
                </div>
              )}
              {selected.data.children && selected.data.children.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-placeholder">
                    子任务 ({selected.data.children.filter((c) => c.status === 'completed').length}/{selected.data.children.length})
                  </span>
                  {selected.data.children.map((child) => (
                    <div key={child.id} className="flex items-center gap-2 text-xs">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          child.status === 'completed'
                            ? 'bg-blue-500'
                            : child.status === 'active'
                              ? 'bg-green-500'
                              : 'bg-zinc-400'
                        }`}
                      />
                      <span className={child.status === 'completed' ? 'text-dim line-through' : 'text-body'}>
                        {child.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {selected.data.startDate && dailySlugs.has(selected.data.startDate) && (
                <Link
                  to={`/interns/${selectedIntern}/report/daily/${selected.data.startDate}`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary-subtle px-3 py-1.5 text-xs font-medium text-primary-subtle-foreground transition-colors hover:bg-primary/20"
                >
                  <FileText className="h-3.5 w-3.5" />
                  查看当日日报
                </Link>
              )}
            </div>
            <button
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => setSelected(null)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
