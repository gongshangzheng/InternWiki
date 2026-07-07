import {
  CheckCircle2,
  Pause,
  Circle,
  GitBranch,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProjectColor } from './TaskTreeNode'
import type { Projects } from '@/content/loader'

const PROJECT_STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Circle; color: string }
> = {
  active: { label: '进行中', icon: GitBranch, color: 'text-green-400' },
  completed: { label: '已完成', icon: CheckCircle2, color: 'text-blue-400' },
  paused: { label: '已暂停', icon: Pause, color: 'text-amber-400' },
  planned: { label: '规划中', icon: Circle, color: 'text-dim' },
}

export function ProjectTabs({
  projects,
  activeSlug,
  onSelect,
}: {
  projects: Projects[]
  activeSlug: string | null
  onSelect: (slug: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {projects.map((p, idx) => {
        const color = getProjectColor(idx)
        const isActive = activeSlug === p.slug
        const StatusIcon = PROJECT_STATUS_CONFIG[p.status]?.icon ?? Circle
        return (
          <button
            key={p.slug}
            onClick={() => onSelect(p.slug ?? '')}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? cn(color.bg, color.border, color.text)
                : 'border-border bg-card/50 text-dim hover:bg-muted hover:text-heading',
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', isActive ? color.dot : 'bg-placeholder')} />
            <StatusIcon className={cn('h-3 w-3', isActive ? color.text : PROJECT_STATUS_CONFIG[p.status]?.color)} />
            {p.title}
          </button>
        )
      })}
    </div>
  )
}

export { PROJECT_STATUS_CONFIG }
