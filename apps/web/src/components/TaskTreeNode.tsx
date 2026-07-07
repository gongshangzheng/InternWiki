import { useState, useRef } from 'react'
import {
  ChevronRight,
  ChevronDown,
  User,
  FileText,
  Clock,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { countTasks, type TaskNode } from '@/content/loader'

// ── Status config ────────────────────────────────────────────

const TASK_STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; ring: string }
> = {
  active: { label: '进行中', dot: 'bg-green-500', ring: 'ring-green-500/30' },
  completed: { label: '已完成', dot: 'bg-blue-500', ring: 'ring-blue-500/30' },
  planned: { label: '规划中', dot: 'bg-zinc-400', ring: 'ring-zinc-400/30' },
  blocked: { label: '阻塞', dot: 'bg-red-500', ring: 'ring-red-500/30' },
  paused: { label: '已暂停', dot: 'bg-amber-500', ring: 'ring-amber-500/30' },
}

// ── Project colors ───────────────────────────────────────────

export const PROJECT_COLORS = [
  { name: 'emerald', dot: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', line: 'bg-emerald-500/50' },
  { name: 'blue', dot: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', line: 'bg-blue-500/50' },
  { name: 'amber', dot: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', line: 'bg-amber-500/50' },
  { name: 'violet', dot: 'bg-violet-500', text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', line: 'bg-violet-500/50' },
  { name: 'pink', dot: 'bg-pink-500', text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', line: 'bg-pink-500/50' },
  { name: 'cyan', dot: 'bg-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', line: 'bg-cyan-500/50' },
]

export function getProjectColor(index: number) {
  return PROJECT_COLORS[index % PROJECT_COLORS.length]
}

// ── TaskTreeNode ─────────────────────────────────────────────

export function TaskTreeNode({
  task,
  depth,
  isLast,
  parentLines,
  projectColor,
  selectedId,
  onSelect,
}: {
  task: TaskNode
  depth: number
  isLast: boolean
  parentLines: boolean[]
  projectColor: (typeof PROJECT_COLORS)[number]
  selectedId: string | null
  onSelect: (task: TaskNode) => void
}) {
  const [expanded, setExpanded] = useState(depth < 1)
  const [hovered, setHovered] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasChildren = task.children.length > 0
  const statusCfg = TASK_STATUS_CONFIG[task.status] ?? TASK_STATUS_CONFIG.planned
  const { total, completed } = hasChildren ? countTasks(task.children) : { total: 0, completed: 0 }
  const isSelected = selectedId === task.id
  const isClickable = !!(task.notePath || task.description)

  const handleEnter = () => {
    hoverTimer.current = setTimeout(() => setHovered(true), 400)
  }
  const handleLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setHovered(false)
  }

  return (
    <div className="select-none">
      <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        <div
          className={cn(
            'group flex items-center gap-0 rounded-sm transition-colors',
            isSelected && 'bg-primary/5',
            isClickable && !isSelected && 'hover:bg-muted/50',
            isClickable && 'cursor-pointer',
          )}
          onClick={() => isClickable && onSelect(task)}
        >
          {/* Git-style branch lines */}
          <div className="flex flex-shrink-0 items-center" style={{ width: depth * 20 + 20 }}>
            {parentLines.map((showLine, i) => (
              <div key={i} className="relative h-full w-5 flex-shrink-0">
                {showLine && (
                  <div className={cn('absolute left-2 top-0 bottom-0 w-px', projectColor.line)} />
                )}
              </div>
            ))}
            {depth > 0 && (
              <div className="relative h-7 w-5 flex-shrink-0">
                <div className={cn('absolute left-2 top-0 h-3.5 w-px', projectColor.line)} />
                <div className={cn('absolute left-2 top-3.5 h-px w-2.5', projectColor.line)} />
              </div>
            )}
          </div>

          {/* Node dot */}
          <div className="relative flex flex-shrink-0 items-center">
            <div
              className={cn(
                'h-2.5 w-2.5 rounded-full ring-2',
                statusCfg.dot,
                statusCfg.ring,
                task.status === 'completed' && 'opacity-70',
              )}
            />
          </div>

          {/* Content */}
          <div className="ml-1.5 flex min-w-0 flex-1 items-center gap-1.5 py-1">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(!expanded)
                }}
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-dim transition-colors hover:text-heading"
              >
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            ) : (
              <span className="h-4 w-4 flex-shrink-0" />
            )}

            <span
              className={cn(
                'truncate text-[13px]',
                task.status === 'completed' ? 'text-dim line-through' : 'text-body',
                isSelected && 'font-medium text-heading',
              )}
            >
              {task.title}
            </span>

            {hasChildren && (
              <span className="flex-shrink-0 text-[10px] text-placeholder">
                {completed}/{total}
              </span>
            )}

            {task.assignee && (
              <span className="ml-auto flex flex-shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary">
                <User className="h-2.5 w-2.5" />
                {task.assignee}
              </span>
            )}

            {task.startTime && (
              <span className="flex flex-shrink-0 items-center gap-0.5 text-[10px] text-dim">
                <Clock className="h-2.5 w-2.5" />
                {task.startTime}{task.endTime ? `-${task.endTime}` : ''}
              </span>
            )}
            {!task.startTime && task.startDate && (
              <span className="flex-shrink-0 text-[10px] text-placeholder">
                {task.startDate.slice(5)}
              </span>
            )}

            {task.location && (
              <span className="flex flex-shrink-0 items-center gap-0.5 text-[10px] text-placeholder">
                <MapPin className="h-2.5 w-2.5" />
                {task.location}
              </span>
            )}

            {task.notePath && (
              <FileText className="h-3 w-3 flex-shrink-0 text-placeholder" />
            )}
          </div>
        </div>

        {/* Hover tooltip */}
        {hovered && !isSelected && (
          <div className="absolute left-8 top-full z-50 w-64 rounded-lg border border-border bg-card p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <span className={cn('h-2.5 w-2.5 rounded-full ring-2', statusCfg.dot, statusCfg.ring)} />
              <h3 className="text-sm font-semibold text-heading">{task.title}</h3>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-dim">
                {statusCfg.label}
              </span>
            </div>
            {task.assignee && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-dim">
                <User className="h-3 w-3" />
                执行人: {task.assignee}
              </div>
            )}
            {(task.startTime || task.startDate) && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-dim">
                <Clock className="h-3 w-3" />
                {task.startDate && task.startDate.slice(0, 10)}
                {task.startTime ? ` ${task.startTime}${task.endTime ? `-${task.endTime}` : ''}` : ''}
                {task.endDate ? ` → ${task.endDate.slice(0, 10)}` : ''}
              </div>
            )}
            {task.location && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-dim">
                <MapPin className="h-3 w-3" />
                {task.location}
              </div>
            )}
            {hasChildren && (
              <div className="mt-1.5 text-[11px] text-dim">
                子任务: {completed}/{total} 已完成
                {total > 0 && (
                  <span className="ml-1.5 inline-block h-1.5 w-12 overflow-hidden rounded-full bg-muted align-middle">
                    <span
                      className="block h-full rounded-full bg-green-500"
                      style={{ width: `${(completed / total) * 100}%` }}
                    />
                  </span>
                )}
              </div>
            )}
            {task.description && (
              <p className="mt-2 text-xs text-body">{task.description}</p>
            )}
            {task.notePath && (
              <div className="mt-2 flex items-center gap-1 text-[11px] text-primary">
                <FileText className="h-3 w-3" />
                点击查看笔记
              </div>
            )}
            {hasChildren && (
              <div className="mt-2 space-y-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-placeholder">子任务</span>
                {task.children.map((child) => {
                  const childCfg = TASK_STATUS_CONFIG[child.status] ?? TASK_STATUS_CONFIG.planned
                  return (
                    <div key={child.id} className="flex items-center gap-2 text-xs text-body">
                      <span className={cn('h-1.5 w-1.5 rounded-full', childCfg.dot)} />
                      <span className={child.status === 'completed' ? 'text-dim line-through' : ''}>
                        {child.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {task.children.map((child, i) => (
            <TaskTreeNode
              key={child.id}
              task={child}
              depth={depth + 1}
              isLast={i === task.children.length - 1}
              parentLines={[...parentLines, !isLast]}
              projectColor={projectColor}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
