/// <reference types="vite/client" />
import type { Article, Day, DayMeta } from './edition'
import { validateArticle, validateDayMeta } from './edition'

/**
 * Everything under `content/editions/<date>/` is bundled at build time:
 *   - `index.json`         → day metadata (ordered article slugs)
 *   - `<slug>.json`        → one article each
 *
 * The agent only has to drop files in a dated folder and rebuild.
 */
const dayMetaModules = import.meta.glob<DayMeta>('/content/editions/*/index.json', {
  eager: true,
  import: 'default',
})

const articleModules = import.meta.glob<Article>('/content/editions/*/*.json', {
  eager: true,
  import: 'default',
})

function loadArticlesByDate(): Map<string, Map<string, Article>> {
  const byDate = new Map<string, Map<string, Article>>()
  for (const [path, data] of Object.entries(articleModules)) {
    if (path.endsWith('/index.json')) continue // that's day metadata, not an article
    const errors = validateArticle(data, path)
    if (errors.length > 0) {
      console.error(`[content] Ignoring invalid article "${path}":\n${errors.map((e) => `  • ${e}`).join('\n')}`)
      continue
    }
    const articles = byDate.get(data.date) ?? new Map<string, Article>()
    articles.set(data.slug, data)
    byDate.set(data.date, articles)
  }
  return byDate
}

function load(): Day[] {
  const articlesByDate = loadArticlesByDate()
  const days: Day[] = []
  const datesWithMeta = new Set<string>()

  // 1. Days that have an index.json — use its order & blurb.
  for (const [path, meta] of Object.entries(dayMetaModules)) {
    const errors = validateDayMeta(meta, path)
    if (errors.length > 0) {
      console.error(`[content] Ignoring invalid day "${path}":\n${errors.map((e) => `  • ${e}`).join('\n')}`)
      continue
    }
    datesWithMeta.add(meta.date)
    const pool = articlesByDate.get(meta.date) ?? new Map<string, Article>()
    const ordered: Article[] = []
    for (const slug of meta.articles) {
      const article = pool.get(slug)
      if (article) {
        ordered.push(article)
        pool.delete(slug)
      } else {
        console.error(`[content] ${path}: listed article "${slug}" has no matching file`)
      }
    }
    // Append any articles present on disk but not listed, so nothing is dropped.
    for (const leftover of [...pool.values()].sort((a, b) => a.slug.localeCompare(b.slug))) {
      ordered.push(leftover)
    }
    if (ordered.length > 0) {
      days.push({ date: meta.date, generatedAt: meta.generatedAt, title: meta.title, intro: meta.intro, articles: ordered })
    }
  }

  // 2. Defensive: a folder with articles but no index.json still shows up.
  for (const [date, pool] of articlesByDate) {
    if (datesWithMeta.has(date)) continue
    const ordered = [...pool.values()].sort((a, b) => a.slug.localeCompare(b.slug))
    const generatedAt = ordered.reduce((latest, a) => (a.receivedAt > latest ? a.receivedAt : latest), ordered[0].receivedAt)
    days.push({ date, generatedAt, articles: ordered })
  }

  // Newest first.
  return days.sort((a, b) => b.date.localeCompare(a.date))
}

export const days: Day[] = load()

export function getDays(): Day[] {
  return days
}

export function getDay(date: string): Day | undefined {
  return days.find((day) => day.date === date)
}

export function getArticle(date: string, slug: string): Article | undefined {
  return getDay(date)?.articles.find((article) => article.slug === slug)
}

/** Previous / next article within the same day (for blog-style navigation). */
export function getArticleNeighbors(date: string, slug: string): { prev?: Article; next?: Article } {
  const day = getDay(date)
  if (!day) return {}
  const index = day.articles.findIndex((article) => article.slug === slug)
  if (index === -1) return {}
  return { prev: day.articles[index - 1], next: day.articles[index + 1] }
}

export interface SiteStats {
  dayCount: number
  articleCount: number
  quizCount: number
  /** ISO datetime of the most recent day, if any. */
  lastUpdated?: string
}

export function getStats(): SiteStats {
  const articleCount = days.reduce((total, day) => total + day.articles.length, 0)
  const quizCount = days.reduce(
    (total, day) => total + day.articles.reduce((n, article) => n + article.quiz.length, 0),
    0,
  )
  return {
    dayCount: days.length,
    articleCount,
    quizCount,
    lastUpdated: days[0]?.generatedAt ?? days[0]?.date,
  }
}
