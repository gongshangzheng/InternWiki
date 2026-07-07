import { useParams, Link } from 'react-router-dom'
import { Flame, TrendingUp, TrendingDown, Check, X } from 'lucide-react'
import { getInternBySlug } from '@/content/loader'
import { useHabits, type HabitTag } from '@/hooks/useHabits'

// ── Habit Heatmap ──────────────────────────────────────────────

function HabitHeatmap({ habit }: { habit: HabitTag }) {
  // Build last 30 days grid
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days: Array<{ date: string; record?: { checked: boolean } }> = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    const rec = habit.records.find((r) => r.date === ds)
    days.push({ date: ds, record: rec ? { checked: rec.checked } : undefined })
  }

  return (
    <div className="flex flex-wrap gap-1">
      {days.map((day) => {
        const hasRecord = !!day.record
        const isChecked = day.record?.checked
        return (
          <div
            key={day.date}
            className={`h-4 w-4 rounded-sm transition-colors ${
              isChecked
                ? 'bg-green-500'
                : hasRecord
                  ? 'bg-red-400/40'
                  : 'bg-muted'
            }`}
            title={`${day.date}: ${isChecked ? '✓' : hasRecord ? '✗' : '—'}`}
          />
        )
      })}
    </div>
  )
}

// ── Habit Card ────────────────────────────────────────────────

function HabitCard({ habit }: { habit: HabitTag }) {
  const total = habit.records.length
  const checked = habit.records.filter((r) => r.checked).length

  return (
    <div className="lo-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame
            className={`h-4 w-4 ${habit.streak > 0 ? 'text-orange-500' : 'text-dim'}`}
          />
          <span className="text-sm font-semibold text-heading">{habit.label}</span>
        </div>
        <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-dim">
          #{habit.tag}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="flex items-center justify-center gap-1 text-lg font-bold text-orange-500">
            <Flame className="h-3.5 w-3.5" />
            {habit.streak}
          </div>
          <div className="text-[10px] text-dim">连续</div>
        </div>
        <div>
          <div className="text-lg font-bold text-heading">{habit.bestStreak}</div>
          <div className="text-[10px] text-dim">最长</div>
        </div>
        <div>
          <div className="text-lg font-bold text-heading">{habit.rate}%</div>
          <div className="text-[10px] text-dim">{checked}/{total}</div>
        </div>
      </div>

      <div className="mt-4">
        <HabitHeatmap habit={habit} />
        <div className="mt-1 flex items-center justify-between text-[9px] text-placeholder">
          <span>30 天前</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-green-500" /> 完成
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-red-400/40" /> 未完成
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-muted" /> 无记录
            </span>
          </div>
          <span>今天</span>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────

export function HabitsPage() {
  const { name } = useParams<{ name: string }>()
  const intern = getInternBySlug(name ?? '')
  const habits = useHabits(name ?? '')

  if (!intern) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-dim">未找到实习生: {name}</p>
        <Link to="/" className="mt-2 inline-block text-xs text-primary hover:underline">
          返回首页
        </Link>
      </div>
    )
  }

  const checkedToday = habits.filter((h) => {
    const today = new Date().toISOString().slice(0, 10)
    const rec = h.records.find((r) => r.date === today)
    return rec?.checked
  }).length

  const totalToday = habits.length
  const rateToday = totalToday > 0 ? Math.round((checkedToday / totalToday) * 100) : 0

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-heading">{intern.name} · 习惯追踪</h1>
          <p className="text-sm text-dim">从日报打卡记录自动生成</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-heading">
              {checkedToday}<span className="text-sm text-dim">/{totalToday}</span>
            </div>
            <div className="text-[10px] text-dim">今日打卡</div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${rateToday >= 80 ? 'text-green-500' : rateToday >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {rateToday}%
            </div>
            <div className="text-[10px] text-dim">完成率</div>
          </div>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="lo-card py-16 text-center">
          <p className="text-sm text-dim">
            还没有习惯打卡记录。
          </p>
          <p className="mt-2 text-xs text-placeholder">
            在日报中添加格式：<code className="rounded bg-muted px-1.5 py-0.5">- [x] 习惯名 #tag</code>
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => (
            <HabitCard key={habit.tag} habit={habit} />
          ))}
        </div>
      )}

      {/* Recent habit log */}
      {habits.length > 0 && (
        <div className="lo-card p-4">
          <h2 className="text-sm font-semibold text-heading">打卡记录</h2>
          <div className="mt-3 space-y-2">
            {[...habits]
              .flatMap((h) => h.records.map((r) => ({ ...r, label: h.label })))
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 15)
              .map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-dim">{r.date}</span>
                  {r.checked ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-red-400" />
                  )}
                  <span className="text-body">{r.label}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  )
}
