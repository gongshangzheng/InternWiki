import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sun, Moon, Search } from 'lucide-react'
import { getAllInterns } from '@/content/loader'
import { useTheme } from '@/hooks/useTheme'
import { SearchModal } from '@/components/SearchModal'
import { Home } from '@/pages/Home'
import { InternHome } from '@/pages/InternHome'
import {
  DailyList,
  DailyDetail,
  WeeklyList,
  WeeklyDetail,
  MonthlyList,
  MonthlyDetail,
  DocsList,
  DocsDetail,
} from '@/pages/ReportPages'
import { ProjectsPage } from '@/pages/Projects'
import { SharedList, SharedDetail } from '@/pages/Shared'
import { HabitsPage } from '@/pages/Habits'
import { CalendarPage } from '@/pages/Calendar'

// ── Layout ──────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="rounded-md p-1.5 text-dim transition-colors hover:bg-muted hover:text-heading"
      aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
      title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

function NavBar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const allInterns = getAllInterns()
  const location = useLocation()

  // Determine active intern from URL
  const internMatch = location.pathname.match(/^\/interns\/([^/]+)/)
  const activeInternSlug = internMatch?.[1]
  const activeIntern = allInterns.find((i) => i.slug === activeInternSlug)

  return (
    <header className="lo-nav">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-4">
        {/* Logo */}
        <Link to="/" className="mr-4 flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <span className="text-xs font-bold">I</span>
          </div>
          <span className="text-sm font-semibold tracking-wide text-heading">
            InternWiki
          </span>
        </Link>

        {/* Intern switcher */}
        {allInterns.length > 0 && (
          <div className="flex items-center gap-0.5">
            {allInterns.map((intern) => (
              <NavLink
                key={intern.slug}
                to={`/interns/${intern.slug}`}
                className={({ isActive }) =>
                  `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive || intern.slug === activeInternSlug
                      ? 'bg-primary/10 text-primary'
                      : 'text-dim hover:text-heading'
                  }`
                }
              >
                {intern.name}
              </NavLink>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onSearchOpen}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-dim transition-colors hover:bg-muted hover:text-heading"
          >
            <Search className="h-3.5 w-3.5" />
            搜索
          </button>
          <Link to="/calendar" className="rounded-md px-2.5 py-1 text-xs font-medium text-dim transition-colors hover:text-heading">日历</Link>
          <ThemeToggle />
          <span className="text-[10px] uppercase tracking-widest text-placeholder">v0.1</span>
        </div>
      </div>

      {/* Sub-nav for active intern */}
      {activeIntern && (
        <div className="border-t border-border bg-muted/50">
          <div className="mx-auto flex max-w-7xl items-center gap-0.5 px-4">
            <SubNav to={`/interns/${activeIntern.slug}`} label="概览" end />
            <SubNav to={`/interns/${activeIntern.slug}/daily`} label="日报" />
            <SubNav to={`/interns/${activeIntern.slug}/weekly`} label="周报" />
            <SubNav to={`/interns/${activeIntern.slug}/monthly`} label="月报" />
            <SubNav to={`/interns/${activeIntern.slug}/docs`} label="文档" />
            <SubNav to={`/interns/${activeIntern.slug}/projects`} label="项目" />
            <SubNav to={`/interns/${activeIntern.slug}/habits`} label="习惯" />
          </div>
        </div>
      )}
    </header>
  )
}

function SubNav({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
          isActive
            ? 'border-primary text-primary'
            : 'border-transparent text-dim hover:text-heading'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)

  // Cmd/Ctrl + K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <NavBar onSearchOpen={() => setSearchOpen(true)} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
      <footer className="lo-footer">
        InternWiki — 实习生之间相互分享工作成果
      </footer>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Layout>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Intern pages */}
          <Route path="/interns/:name" element={<InternHome />} />

          {/* Daily */}
          <Route path="/interns/:name/daily" element={<DailyList />} />
          <Route path="/interns/:name/daily/:slug" element={<DailyDetail />} />

          {/* Weekly */}
          <Route path="/interns/:name/weekly" element={<WeeklyList />} />
          <Route path="/interns/:name/weekly/:slug" element={<WeeklyDetail />} />

          {/* Monthly */}
          <Route path="/interns/:name/monthly" element={<MonthlyList />} />
          <Route path="/interns/:name/monthly/:slug" element={<MonthlyDetail />} />

          {/* Docs */}
          <Route path="/interns/:name/docs" element={<DocsList />} />
          <Route path="/interns/:name/docs/:slug" element={<DocsDetail />} />

          {/* Habits */}
          <Route path="/interns/:name/habits" element={<HabitsPage />} />

          {/* Projects (single page with hash-based tabs) */}
          <Route path="/interns/:name/projects" element={<ProjectsPage />} />
          <Route path="/interns/:name/projects/:slug" element={<ProjectsPage />} />

          {/* Calendar */}
          <Route path="/calendar" element={<CalendarPage />} />

          {/* Shared */}
          <Route path="/shared" element={<SharedList />} />
          <Route path="/shared/:slug" element={<SharedDetail />} />

          {/* Fallback */}
          <Route
            path="*"
            element={
              <div className="py-16 text-center">
                <p className="text-sm text-dim">404 — 页面不存在</p>
                <Link to="/" className="mt-2 inline-block text-xs text-primary hover:underline">
                  返回首页
                </Link>
              </div>
            }
          />
        </Routes>
      </Layout>
    </>
  )
}
