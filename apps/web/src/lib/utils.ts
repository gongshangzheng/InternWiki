import { clsx, type ClassValue } from 'clsx'

/**
 * Get the default intern slug from environment configuration (.env → VITE_DEFAULT_INTERN).
 * Returns undefined if not configured; callers should provide their own fallback.
 */
export function getDefaultIntern(): string | undefined {
  const slug = import.meta.env.VITE_DEFAULT_INTERN
  return slug || undefined
}
import { twMerge } from 'tailwind-merge'
import type { ReactNode, ReactElement } from 'react'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Convert heading text to a URL-safe anchor slug.
 * Keeps CJK characters, replaces spaces with hyphens.
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
}

/**
 * Extract text content from React children (for heading ID generation).
 */
export function extractText(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    const props = (children as ReactElement).props as { children?: ReactNode }
    return extractText(props.children)
  }
  return ''
}

/**
 * TOC item extracted from markdown headings.
 */
export interface TocItem {
  level: number
  text: string
  slug: string
}

/**
 * Parse markdown body to extract h2/h3 headings for TOC.
 */
export function extractToc(body: string): TocItem[] {
  const lines = body.split('\n')
  const items: TocItem[] = []
  let inCodeBlock = false

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = /^(#{2,3})\s+(.+)$/.exec(line)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      items.push({ level, text, slug: slugify(text) })
    }
  }
  return items
}
