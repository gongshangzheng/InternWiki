export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="lo-nav">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
          <div className="mr-4 flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <span className="text-xs font-bold">I</span>
            </div>
            <span className="text-sm font-semibold tracking-wide text-heading">
              InternWiki
            </span>
          </div>
          <span className="ml-auto text-[10px] uppercase tracking-widest text-placeholder">
            v0.1
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-heading">InternWiki</h1>
          <p className="mt-2 text-sm text-dim">
            多人实习文档平台 — 脚手架已就绪
          </p>
          <p className="mt-1 text-xs text-placeholder">
            Phase 1.1: 项目骨架搭建完成
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lo-card p-4">
            <h2 className="text-sm font-semibold text-heading">技术栈</h2>
            <ul className="mt-2 space-y-1 text-xs text-dim">
              <li>Vite 6 + React 19 + TypeScript 5</li>
              <li>Tailwind CSS v4</li>
              <li>Velite（内容层）</li>
              <li>React Router v7</li>
              <li>Zustand + recharts</li>
            </ul>
          </div>
          <div className="lo-card p-4">
            <h2 className="text-sm font-semibold text-heading">下一步</h2>
            <ul className="mt-2 space-y-1 text-xs text-dim">
              <li>Phase 1.2: Velite 内容层 + 示例内容</li>
              <li>Phase 1.3: 路由 + 布局</li>
              <li>Phase 2: 报告页面</li>
              <li>Phase 3: 任务树</li>
              <li>Phase 4: 仪表盘 + 日历</li>
            </ul>
          </div>
          <div className="lo-card p-4">
            <h2 className="text-sm font-semibold text-heading">状态</h2>
            <ul className="mt-2 space-y-1 text-xs text-dim">
              <li>脚手架: 已完成</li>
              <li>内容层: 待实现</li>
              <li>路由: 待实现</li>
              <li>部署: 待实现</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="lo-footer">
        InternWiki — 实习生之间相互分享工作成果
      </footer>
    </div>
  )
}
