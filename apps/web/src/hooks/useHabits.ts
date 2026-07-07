import { useMemo } from 'react'
import { getInternReports } from '@/content/loader'

export interface HabitRecord {
  date: string
  checked: boolean
  label: string
}

export interface HabitTag {
  tag: string
  label: string
  records: HabitRecord[]
  streak: number
  bestStreak: number
  rate: number
}

const HABIT_PATTERN = /^-\s*\[([x ])\]\s*(.+?)\s*#(\w+)\s*$/i

/** Parse habit checkmarks from daily report body */
function parseHabits(body: string, date: string): HabitRecord[] {
  const records: HabitRecord[] = []
  const lines = body.split('\n')
  for (const line of lines) {
    const match = line.match(HABIT_PATTERN)
    if (match) {
      const checked = match[1].toLowerCase() === 'x'
      const label = match[2].trim()
      const tag = match[3].toLowerCase()
      records.push({ date, checked, label })
    }
  }
  return records
}

/** Calculate current streak (ending at most recent checked date) */
function calcStreak(records: HabitRecord[]): { streak: number; bestStreak: number } {
  const checkedDates = records
    .filter((r) => r.checked)
    .map((r) => r.date)
    .sort()

  if (checkedDates.length === 0) return { streak: 0, bestStreak: 0 }

  // Best streak
  let best = 1
  let current = 1
  for (let i = 1; i < checkedDates.length; i++) {
    const prev = new Date(checkedDates[i - 1])
    const curr = new Date(checkedDates[i])
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diff === 1) {
      current++
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }

  // Current streak: count backwards from the last checked date
  const sortedDesc = [...checkedDates].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  const lastChecked = sortedDesc[0]
  // If last checked is not today or yesterday, streak is 0
  const daysSinceLast = Math.round(
    (new Date(today).getTime() - new Date(lastChecked).getTime()) / 86400000,
  )
  if (daysSinceLast > 1) return { streak: 0, bestStreak: best }

  let streak = 1
  for (let i = 1; i < sortedDesc.length; i++) {
    const prev = new Date(sortedDesc[i - 1])
    const curr = new Date(sortedDesc[i])
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }

  return { streak, bestStreak: best }
}

/** Extract all habit tags and their records from daily reports */
export function useHabits(internSlug: string): HabitTag[] {
  return useMemo(() => {
    const dailies = getInternReports(internSlug).daily
    if (dailies.length === 0) return []

    // Collect all habit records grouped by tag
    const tagMap = new Map<string, HabitRecord[]>()

    for (const d of dailies) {
      const date = d.date?.slice(0, 10) ?? d.slug
      const records = parseHabits(d.body ?? '', date)
      for (const r of records) {
        // Use label as key for grouping (tags are the same per label typically)
        const key = r.label.toLowerCase()
        if (!tagMap.has(key)) tagMap.set(key, [])
        tagMap.get(key)!.push(r)
      }
    }

    const tags: HabitTag[] = []
    for (const [label, records] of tagMap) {
      const sorted = records.sort((a, b) => a.date.localeCompare(b.date))
      const { streak, bestStreak } = calcStreak(sorted)
      const checkedCount = sorted.filter((r) => r.checked).length
      const rate = sorted.length > 0 ? Math.round((checkedCount / sorted.length) * 100) : 0

      // Derive tag name from the first record's tag
      const tag = sorted[0]?.label ?? label

      tags.push({
        tag: label,
        label: tag,
        records: sorted,
        streak,
        bestStreak,
        rate,
      })
    }

    // Sort by streak descending
    return tags.sort((a, b) => b.streak - a.streak || b.bestStreak - a.bestStreak)
  }, [internSlug])
}
