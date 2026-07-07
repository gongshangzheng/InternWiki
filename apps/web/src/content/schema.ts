import { z } from 'zod'

/**
 * Base shape of every report. Each Velite collection refines this — for now we
 * keep the runtime schema in sync with the Velite config and use the generated
 * types as the source of truth.
 */
export const reportMetaSchema = z.object({
  title: z.string(),
  slug: z.string(),
  date: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
  intern: z.string(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  body: z.string(),
})

export type ReportMeta = z.infer<typeof reportMetaSchema>

// ── Task types ───────────────────────────────────────────────

export type TaskStatus = 'planned' | 'active' | 'completed' | 'paused'

export interface RecurringConfig {
  pattern: 'daily' | 'weekly' | 'every-N-days'
  every?: number
  startTime?: string
  endTime?: string
  location?: string
  category?: string
  activeFrom?: string
  activeUntil?: string | null
  excludeDates?: string[]
}

export interface TaskNode {
  id: string
  title: string
  status: TaskStatus
  startDate?: string | null
  endDate?: string | null
  description?: string
  recurring?: RecurringConfig
  startTime?: string
  endTime?: string
  location?: string
  category?: string
  children: TaskNode[]
}

export interface TaskTree {
  project: string
  intern?: string
  tasks: TaskNode[]
}
