import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Check, Copy } from 'lucide-react'
import { cn, slugify, extractText } from '@/lib/utils'
import { internalLinkHref, preprocessWikiLinks, preprocessHabitTags } from '@/lib/markdown'

// Track .dark class on <html> so code blocks can switch theme reactively
function useDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true,
  )
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

type CodeProps = {
  className?: string
  children?: ReactNode
}

type PreProps = {
  children?: ReactNode
}

function CodeBlock({ className, children }: CodeProps) {
  const [copied, setCopied] = useState(false)
  const isDark = useDarkMode()
  const raw = String(children ?? '').replace(/\n$/, '')
  const langMatch = /language-([\w-]+)/.exec(className ?? '')
  const language = langMatch?.[1] ?? 'text'

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(raw)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard might be unavailable — ignore
    }
  }

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-1 text-[10px] uppercase tracking-widest text-dim">
        <span>{language}</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-dim transition-colors hover:bg-background hover:text-heading"
          aria-label="复制代码"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: '0.9rem 1rem',
          background: 'transparent',
          fontSize: '0.82rem',
          lineHeight: 1.55,
        }}
        codeTagProps={{
          style: {
            display: 'block',
            background: 'transparent',
            width: '100%',
          },
        }}
        PreTag="div"
      >
        {raw}
      </SyntaxHighlighter>
    </div>
  )
}

// Mermaid fence: emit <pre class="mermaid"> (raw text); SVG is injected by the
// post-render effect in MarkdownView (see ProjFlow MarkdownRenderer.vue).
function MermaidBlock({ children }: CodeProps) {
  return <pre className="mermaid">{String(children ?? '').replace(/\n$/, '')}</pre>
}

function InlineCode({ className, children, ...rest }: CodeProps) {
  const text = String(children ?? '')
  if ((className ?? '').includes('language-mermaid')) {
    return <MermaidBlock>{children}</MermaidBlock>
  }
  if ((className ?? '').includes('language-') || text.includes('\n')) {
    return <CodeBlock className={className}>{children}</CodeBlock>
  }
  return (
    <code className={cn('lo-code', className)} {...rest}>
      {children}
    </code>
  )
}

function MarkdownPre({ children }: PreProps) {
  return <>{children}</>
}

function MarkdownLink({
  href,
  children,
}: {
  href?: string
  children?: ReactNode
}) {
  const target = href ?? ''
  const internal = target ? internalLinkHref(target, currentInternSlug) : null

  if (internal) {
    return <Link to={internal} className="lo-link">{children}</Link>
  }

  const isExternal = /^https?:\/\//i.test(target)
  return (
    <a
      href={target}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer noopener' : undefined}
      className="lo-link"
    >
      {children}
    </a>
  )
}

// ── Heading components with auto-generated IDs for TOC anchors ──

function makeHeading(tag: 'h1' | 'h2' | 'h3' | 'h4') {
  const Tag = tag
  const Component = ({ children, ...rest }: { children?: ReactNode }) => {
    const text = extractText(children)
    const id = slugify(text)
    return (
      <Tag id={id} {...rest}>
        {children}
      </Tag>
    )
  }
  Component.displayName = `Markdown${tag.toUpperCase()}`
  return Component
}

const components: Components = {
  a: MarkdownLink,
  code: InlineCode,
  pre: MarkdownPre,
  h1: makeHeading('h1'),
  h2: makeHeading('h2'),
  h3: makeHeading('h3'),
  h4: makeHeading('h4'),
  table: ({ children, ...rest }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm" {...rest}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...rest }) => (
    <thead className="bg-muted text-heading" {...rest}>
      {children}
    </thead>
  ),
  th: ({ children, ...rest }) => (
    <th className="border-b border-border px-3 py-2 text-left font-medium" {...rest}>
      {children}
    </th>
  ),
  td: ({ children, ...rest }) => (
    <td className="border-b border-border px-3 py-2 align-top text-body" {...rest}>
      {children}
    </td>
  ),
  blockquote: ({ children, ...rest }) => (
    <blockquote
      className="my-4 border-l-2 border-primary/60 bg-primary-subtle px-4 py-1 text-body"
      {...rest}
    >
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="my-6 border-border" {...props} />,
  input: ({ type, checked, ...rest }) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={!!checked}
          readOnly
          disabled
          className="mr-2 h-3.5 w-3.5 rounded border-border bg-card accent-primary"
          {...rest}
        />
      )
    }
    return <input type={type} {...rest} />
  },
}

type MarkdownViewProps = {
  body: string
  className?: string
  /** Intern slug for building intern-scoped links (project/task deep links) */
  internSlug?: string
}

// Module-level variable to pass internSlug to MarkdownLink without prop drilling
// through react-markdown's component system.
let currentInternSlug: string | undefined

export function MarkdownView({ body, className, internSlug }: MarkdownViewProps) {
  currentInternSlug = internSlug
  const containerRef = useRef<HTMLDivElement>(null)
  const isDark = useDarkMode()
  const processedBody = useMemo(
    () => preprocessHabitTags(preprocessWikiLinks(body)),
    [body],
  )

  // Post-render mermaid processing (mirrors ~/ProjFlow MarkdownRenderer.vue):
  // re-run whenever content or theme changes; keep original source in
  // dataset.source so re-theming starts from text, not processed SVG.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const nodes = Array.from(container.querySelectorAll<HTMLPreElement>('pre.mermaid'))
    if (nodes.length === 0) return

    let cancelled = false
    void (async () => {
      try {
        const mermaid = (await import('mermaid')).default
        if (cancelled) return
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'system-ui, sans-serif',
        })
        for (const node of nodes) {
          if (!node.dataset.source) {
            node.dataset.source = node.textContent ?? ''
          } else {
            node.textContent = node.dataset.source
            node.removeAttribute('data-processed')
          }
          node.querySelector('svg')?.remove()
        }
        await mermaid.run({ nodes, suppressErrors: true })
      } catch (e) {
        console.warn('Mermaid render error:', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [processedBody, isDark])

  return (
    <div
      ref={containerRef}
      className={cn('md-body text-[0.92rem] leading-relaxed text-body', className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {processedBody}
      </ReactMarkdown>
    </div>
  )
}
