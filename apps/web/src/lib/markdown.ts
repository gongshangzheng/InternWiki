import {
  daily,
  weekly,
  monthly,
  docs,
  type daily as Daily,
  type weekly as Weekly,
  type monthly as Monthly,
  type docs as Docs,
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
 *
 * Note: InternWiki links are intern-scoped, so callers should pass
 * the intern slug separately if needed. For now, this handles
 * bare slug lookups (used in RelatedReports).
 */
export function internalLinkHref(href: string): string | null {
  if (!href) return null

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
