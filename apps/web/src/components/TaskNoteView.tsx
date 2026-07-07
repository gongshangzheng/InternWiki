import { useState, useEffect } from 'react'
import { User, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarkdownView } from './MarkdownView'
import { fetchTaskNote, type TaskNode } from '@/content/loader'

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

export function TaskNoteView({
  task,
  internSlug,
  projectSlug,
}: {
  task: TaskNode
  internSlug: string
  projectSlug: string
}) {
  const [noteContent, setNoteContent] = useState<string | null>(null)
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const statusCfg = TASK_STATUS_CONFIG[task.status] ?? TASK_STATUS_CONFIG.planned

  useEffect(() => {
    if (!task.notePath) {
      setNoteContent(null)
      setNoteError(null)
      return
    }
    let cancelled = false
    setNoteLoading(true)
    setNoteError(null)
    fetchTaskNote(internSlug, projectSlug, task.notePath)
      .then((text) => {
        if (!cancelled) {
          if (text === null) {
            setNoteError('笔记文件不存在')
          } else {
            setNoteContent(text)
          }
          setNoteLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setNoteError(err.message)
          setNoteLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [task.notePath, internSlug, projectSlug])

  return (
    <div>
      {/* Task header */}
      <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <span className={cn('h-2.5 w-2.5 rounded-full ring-2', statusCfg.dot, statusCfg.ring)} />
        <h1 className="text-lg font-bold text-heading">{task.title}</h1>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-dim">
          {statusCfg.label}
        </span>
        {task.assignee && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            <User className="h-3 w-3" />
            {task.assignee}
          </span>
        )}
        {task.startDate && (
          <span className="font-mono text-xs text-dim">
            {task.startDate.slice(0, 10)}
            {task.endDate ? ` → ${task.endDate.slice(0, 10)}` : ''}
          </span>
        )}
        {task.startTime && (
          <span className="inline-flex items-center gap-1 text-xs text-dim">
            <Clock className="h-3 w-3" />
            {task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}
          </span>
        )}
        {task.location && (
          <span className="inline-flex items-center gap-1 text-xs text-dim">
            <MapPin className="h-3 w-3" />
            {task.location}
          </span>
        )}
      </div>

      {/* Note content */}
      {task.notePath ? (
        noteLoading ? (
          <div className="py-8 text-center text-xs text-dim">加载笔记中…</div>
        ) : noteError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <p className="text-sm text-red-400">加载失败: {noteError}</p>
            <p className="mt-1 text-xs text-dim">路径: {task.notePath}</p>
          </div>
        ) : noteContent !== null ? (
          <MarkdownView body={noteContent} />
        ) : (
          <></>
        )
      ) : task.description ? (
        <div className="text-sm leading-relaxed text-body whitespace-pre-line">
          {task.description}
        </div>
      ) : (
        <p className="text-sm text-dim">该任务暂无描述或笔记。</p>
      )}
    </div>
  )
}
