import {
  daily,
  weekly,
  monthly,
  docs,
} from '@/content/.velite'

type CollectionKey = 'daily' | 'weekly' | 'monthly' | 'docs'

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

function findRouteForSlug(slug: string): CollectionKey | null {
  for (const { route, items } of ALL_COLLECTIONS) {
    if (items.some((it) => it.slug === slug)) {
      return route
    }
  }
  return null
}

/**
 * Rewrite an internal markdown link to a real SPA route.
 *
 * Handles patterns like:
 *   "daily/2026-07-07.md"  -> "/interns/{intern}/daily/2026-07-07"
 *   "2026-07-07"            -> looks up the slug across collections
 *   "internwiki:project:slug" -> "/interns/{intern}/projects#slug"
 *   "internwiki:task:project/task-id" -> "/interns/{intern}/projects#project?task=task-id"
 *
 * @param internSlug - the intern slug for building intern-scoped URLs
 */
export function internalLinkHref(href: string, internSlug?: string): string | null {
  if (!href) return null

  // internwiki: protocol for project/task deep links
  if (href.startsWith('internwiki:')) {
    const rest = href.slice('internwiki:'.length)

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
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return null
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null

  // strip the .md extension
  const path = href.replace(/\.md$/i, '')
  // collapse any leading ./ or ../ segments
  const cleaned = path.replace(/^(\.\.?\/)+/, '')

  // case: "{collection}/{slug}" — e.g. "daily/2026-07-07"
  const dirSlug = cleaned.match(/^([a-z]+)\/(.+)$/i)
  if (dirSlug) {
    const route = dirSlug[1] as CollectionKey
    if (['daily', 'weekly', 'monthly', 'docs'].includes(route)) {
      return `/${route}/${dirSlug[2]}`
    }
  }

  // case: bare slug — look it up across all collections
  const route = findRouteForSlug(cleaned)
  if (route) {
    return `/${route}/${cleaned}`
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
