import {
  daily,
  weekly,
  monthly,
  docs,
} from '@/content/.velite'

type CollectionKey = 'daily' | 'weekly' | 'monthly' | 'docs'

/** Report types that live under the /report/ path segment */
const REPORT_ROUTES: CollectionKey[] = ['daily', 'weekly', 'monthly']

/** Build the URL path for a collection route, adding report/ prefix for report types */
function routePath(route: CollectionKey, slug: string, internSlug?: string): string {
  const prefix = REPORT_ROUTES.includes(route) ? 'report/' : ''
  const base = internSlug ? `/interns/${internSlug}/` : '/'
  return `${base}${prefix}${route}/${slug}`
}

const ALL_COLLECTIONS: ReadonlyArray<{
  route: CollectionKey
  items: ReadonlyArray<{ slug: string }>
}> = (
  [
    { route: 'daily', items: daily },
    { route: 'weekly', items: weekly },
    { route: 'monthly', items: monthly },
    { route: 'docs', items: docs },
  ] as const
).map(({ route, items }) => ({
  route,
  items: Array.isArray(items)
    ? (items as ReadonlyArray<{ slug?: string; intern?: string }>).map((it) => ({
        slug: it.slug ?? '',
      }))
    : [],
}))

/** 按精确 slug、完整路径或文件名后缀匹配，返回命中的完整 slug 与所属 route */
function resolveSlug(
  slug: string,
): { route: CollectionKey; fullSlug: string } | null {
  for (const { route, items } of ALL_COLLECTIONS) {
    // 精确匹配 / 子目录完整路径匹配 / 仅文件名后缀匹配
    // （docs 子目录化后 slug 含目录前缀，文档里可能写全路径也可能只写文件名）
    const hit = items.find(
      (it) =>
        it.slug === slug ||
        it.slug?.endsWith(`/${slug}`) ||
        slug.endsWith(`/${it.slug}`),
    )
    if (hit) return { route, fullSlug: hit.slug }
  }
  return null
}

/**
 * Rewrite an internal markdown link to a real SPA route.
 *
 * Handles patterns like:
 *   "daily/2026-07-07.md"  -> "/interns/{intern}/report/daily/2026-07-07"
 *   "2026-07-07"            -> looks up the slug across collections
 *   "internwiki:project:slug" -> "/interns/{intern}/projects#slug"
 *   "internwiki:task:project/task-id" -> "/interns/{intern}/projects#project?task=task-id"
 *
 * @param internSlug - the intern slug for building intern-scoped URLs
 */
export function internalLinkHref(href: string, internSlug?: string): string | null {
  if (!href) return null

  // react-markdown 传入的 href 可能被 URL 编码（中文文件名），先解码
  let target = href
  try {
    target = decodeURIComponent(href)
  } catch {
    // 非法编码序列，保持原样
  }

  // internwiki: protocol for project/task deep links
  if (target.startsWith('internwiki:')) {
    const rest = target.slice('internwiki:'.length)

    // internwiki:project:{slug} -> /interns/{intern}/projects#{slug}
    if (rest.startsWith('project:')) {
      const projectSlug = rest.slice('project:'.length)
      if (!projectSlug) return null
      const base = internSlug ? `/interns/${internSlug}/projects` : '/projects'
      return `${base}#${projectSlug}`
    }

    // internwiki:task:{projectSlug}/{taskId} -> /interns/{intern}/projects#{projectSlug}?task={taskId}
    if (rest.startsWith('task:')) {
      const taskRef = rest.slice('task:'.length)
      const slashIdx = taskRef.indexOf('/')
      if (slashIdx < 1) return null
      const projectSlug = taskRef.slice(0, slashIdx)
      const taskId = taskRef.slice(slashIdx + 1)
      if (!taskId) return null
      const base = internSlug ? `/interns/${internSlug}/projects` : '/projects'
      return `${base}#${projectSlug}?task=${taskId}`
    }

    return null
  }

  // absolute URLs are never internal
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return null
  if (target.startsWith('#') || target.startsWith('mailto:') || target.startsWith('tel:')) return null

  // strip the .md extension
  const path = target.replace(/\.md$/i, '')
  // collapse any leading ./ or ../ segments
  const cleaned = path.replace(/^(\.\.?\/)+/, '')

  // case: "{collection}/{slug}" — e.g. "daily/2026-07-07" or "docs/sub/file"
  const dirSlug = cleaned.match(/^([a-z]+)\/(.+)$/i)
  if (dirSlug) {
    const route = dirSlug[1] as CollectionKey
    if (['daily', 'weekly', 'monthly', 'docs'].includes(route)) {
      const sub = dirSlug[2]
      // 子目录 slug（含 /）按完整路径解析，避免截断
      if (sub.includes('/')) {
        const resolved = resolveSlug(sub)
        if (resolved) return routePath(resolved.route, resolved.fullSlug, internSlug)
      } else {
        return routePath(route, sub, internSlug)
      }
    }
  }

  // case: bare slug — look it up across all collections
  const resolved = resolveSlug(cleaned)
  if (resolved) {
    return routePath(resolved.route, resolved.fullSlug, internSlug)
  }

  return null
}

/**
 * Pre-process wiki-style links in markdown body.
 *
 * Converts [[project:slug]] and [[task:project-slug/task-id]] syntax
 * to standard markdown links with internwiki: protocol.
 *
 * Supported formats:
 *   [[project:search-engine]]            -> [search-engine](internwiki:project:search-engine)
 *   [[project:search-engine|搜索引擎]]    -> [搜索引擎](internwiki:project:search-engine)
 *   [[task:search-engine/t2-3]]           -> [t2-3](internwiki:task:search-engine/t2-3)
 *   [[task:search-engine/t2-3|部署ES]]    -> [部署ES](internwiki:task:search-engine/t2-3)
 */
export function preprocessWikiLinks(body: string): string {
  // [[type:ref]] or [[type:ref|display text]]
  return body.replace(
    /\[\[(project|task):([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_match, type: string, ref: string, display?: string) => {
      const text = display?.trim() || ref.trim()
      return `[${text}](internwiki:${type}:${ref.trim()})`
    },
  )
}

/**
 * Pre-process habit tags in markdown body.
 *
 * Converts `#tag` patterns (preceded by whitespace or start-of-line) into
 * colored HTML badge spans.  Code blocks and inline code are skipped.
 *
 * Only matches `#word` — markdown headings (`# Heading`) are safe because
 * they require a space after `#`.
 */
export function preprocessHabitTags(body: string): string {
  // Split by fenced code blocks and inline code, process only non-code parts
  const parts = body.split(/(```[\s\S]*?```|`[^`]+`)/g)
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part // code — skip
      return part.replace(
        /(^|\s)#(\w+)/gm,
        (_, prefix: string, tag: string) =>
          `${prefix}<span class="habit-tag habit-tag-${tag}">#${tag}</span>`,
      )
    })
    .join('')
}

/**
 * Strip the most common markdown syntax to get a plain-text preview.
 * Used for list cards where rendering full markdown is overkill.
 */
export function stripMarkdown(input: string): string {
  return input
    // [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // **bold** / __bold__
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    // *em* / _em_
    .replace(/(\*|_)(.+?)\1/g, '$2')
    // `code`
    .replace(/`([^`]+)`/g, '$1')
    // leading blockquote markers
    .replace(/^>\s*/gm, '')
    // collapse extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
}
