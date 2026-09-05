import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

let mermaidInitialized = false
let mermaidCounter = 0

function ensureInitialized(isDark: boolean) {
  if (mermaidInitialized) return
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: 'system-ui, sans-serif',
  })
  mermaidInitialized = true
}

type MermaidBlockProps = {
  code: string
  isDark: boolean
}

export function MermaidBlock({ code, isDark }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const idRef = useRef(`mermaid-svg-${++mermaidCounter}`)

  useEffect(() => {
    let cancelled = false
    ensureInitialized(isDark)
    // Re-initialize when theme flips so mermaid re-renders with matching colors
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'system-ui, sans-serif',
    })
    setError(null)
    mermaid
      .render(idRef.current, code)
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e))
          setSvg(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [code, isDark])

  if (error) {
    return (
      <div className="my-4 overflow-x-auto rounded-lg border border-border bg-card p-4">
        <p className="mb-2 text-[11px] uppercase tracking-widest text-dim">mermaid 渲染失败</p>
        <pre className="text-xs text-body">{code}</pre>
      </div>
    )
  }

  return (
    <div
      className="mermaid-diagram my-4 flex justify-center overflow-x-auto rounded-lg border border-border bg-card p-4 [&_svg]:max-w-full"
      // SVG 由 mermaid 渲染站内作者自己的文档内容，与 MarkdownView 的 rehypeRaw 同信任级别
      dangerouslySetInnerHTML={{ __html: svg ?? '' }}
    />
  )
}
