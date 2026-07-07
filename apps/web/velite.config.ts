import { defineConfig, defineCollection, s } from 'velite'

// ── Report schema (daily / weekly / monthly / docs 共用) ──────

const reportSchema = s
  .object({
    title: s.string().optional(),
    slug: s.string().optional(),
    date: s.isodate().optional(),
    summary: s.string().optional(),
    tags: s.array(s.string()).default([]),
    metadata: s.record(s.string(), s.unknown()).default({}),
    body: s.raw(),
  })
  .transform((data, { meta }) => {
    const parts = (meta.path ?? '').replace(/\.md$/, '').split('/')
    const filename = parts.pop() ?? ''
    // intern = 目录中 "interns" 后面的一段
    const internsIdx = parts.indexOf('interns')
    const intern = internsIdx >= 0 ? (parts[internsIdx + 1] ?? '') : ''
    return {
      ...data,
      title: data.title ?? filename,
      slug: data.slug ?? filename,
      intern,
    }
  })

// ── Project schema ───────────────────────────────────────────

const projectSchema = s
  .object({
    title: s.string().optional(),
    slug: s.string().optional(),
    status: s.enum(['active', 'completed', 'paused', 'planned']).default('active'),
    startDate: s.isodate().optional(),
    endDate: s.isodate().nullish(),
    category: s.string().default('work'),
    tags: s.array(s.string()).default([]),
    summary: s.string().optional(),
    timeline: s
      .array(
        s.object({
          date: s.isodate(),
          title: s.string(),
          type: s
            .enum(['milestone', 'progress', 'blocker', 'decision', 'note'])
            .default('progress'),
          description: s.string().optional(),
        }),
      )
      .default([]),
    metadata: s.record(s.string(), s.unknown()).default({}),
    body: s.raw(),
  })
  .transform((data, { meta }) => {
    const parts = (meta.path ?? '').replace(/\.md$/, '').split('/')
    const filename = parts.pop() ?? ''
    const fallback = filename === 'README' ? (parts.pop() ?? '') : filename
    const internsIdx = parts.indexOf('interns')
    const intern = internsIdx >= 0 ? (parts[internsIdx + 1] ?? '') : ''
    return {
      ...data,
      title: data.title ?? fallback,
      slug: data.slug ?? fallback,
      intern,
    }
  })

// ── Intern schema ────────────────────────────────────────────

const internSchema = s.object({
  name: s.string(),
  slug: s.string().optional(),
  team: s.string().optional(),
  role: s.string().optional(),
  startDate: s.isodate().optional(),
  endDate: s.isodate().nullish(),
  metadata: s.record(s.string(), s.unknown()).default({}),
  body: s.raw(),
})

// ── Guide schema ────────────────────────────────────────────

const guideSchema = s
  .object({
    title: s.string(),
    slug: s.string().optional(),
    category: s.string().default('其他'),
    order: s.number().default(0),
    summary: s.string().optional(),
    tags: s.array(s.string()).default([]),
    metadata: s.record(s.string(), s.unknown()).default({}),
    body: s.raw(),
  })
  .transform((data, { meta }) => {
    const parts = (meta.path ?? '').replace(/\.md$/, '').split('/')
    const filename = parts.pop() ?? ''
    return {
      ...data,
      slug: data.slug ?? filename,
    }
  })

// ── Collections ──────────────────────────────────────────────

export default defineConfig({
  root: 'content',
  output: {
    data: 'src/content/.velite',
    assets: 'src/content/.velite/assets',
    base: '/InternWiki/assets/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: {
    interns: defineCollection({
      name: 'interns',
      pattern: 'interns/*/profile.md',
      schema: internSchema,
    }),
    daily: defineCollection({
      name: 'daily',
      pattern: 'interns/*/daily/**/*.md',
      schema: reportSchema,
    }),
    weekly: defineCollection({
      name: 'weekly',
      pattern: 'interns/*/weekly/**/*.md',
      schema: reportSchema,
    }),
    monthly: defineCollection({
      name: 'monthly',
      pattern: 'interns/*/monthly/**/*.md',
      schema: reportSchema,
    }),
    docs: defineCollection({
      name: 'docs',
      pattern: 'interns/*/docs/**/*.md',
      schema: reportSchema,
    }),
    shared: defineCollection({
      name: 'shared',
      pattern: '_shared/**/*.md',
      schema: reportSchema,
    }),
    guide: defineCollection({
      name: 'guide',
      pattern: '_guide/**/*.md',
      schema: guideSchema,
    }),
    projects: defineCollection({
      name: 'projects',
      pattern: 'interns/*/projects/*/README.md',
      schema: projectSchema,
    }),
  },
  markdown: {
    gfm: true,
    removeComments: true,
  },
})
