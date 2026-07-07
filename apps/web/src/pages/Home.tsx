import { Link } from 'react-router-dom'
import { getAllInterns, getInternReports, getAllProjects } from '@/content/loader'

export function Home() {
  const allInterns = getAllInterns()
  const allProjects = getAllProjects()

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-heading">InternWiki</h1>
        <p className="mt-2 text-sm text-dim">
          实习生之间相互分享工作成果 — 一个人的项目，会变成很多个人的项目。
        </p>
      </div>

      <div>
        <h2 className="lo-section-title mb-4">实习生</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allInterns.map((intern) => {
            const reports = getInternReports(intern.slug ?? '')
            const projectCount = allProjects.filter((p) => p.intern === intern.slug).length
            return (
              <Link
                key={intern.slug}
                to={`/interns/${intern.slug}`}
                className="lo-card block p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <span className="text-sm font-bold">
                      {(intern.name ?? '?')[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-heading">
                      {intern.name}
                    </div>
                    <div className="truncate text-xs text-dim">
                      {intern.role ?? '实习生'} · {intern.team ?? '未分组'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-3 text-xs text-dim">
                  <span>日报 {reports.daily.length}</span>
                  <span>周报 {reports.weekly.length}</span>
                  <span>月报 {reports.monthly.length}</span>
                  <span>文档 {reports.docs.length}</span>
                  <span>项目 {projectCount}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
