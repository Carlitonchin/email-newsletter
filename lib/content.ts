/// <reference types="vite/client" />
import type { Edition } from './edition'
import { validateEdition } from './edition'

/**
 * Every `content/editions/*.json` file is bundled at build time. The agent only
 * has to drop a new JSON file in that folder and rebuild — no manifest to keep
 * in sync, no imports to wire up.
 */
const modules = import.meta.glob<Edition>('/content/editions/*.json', {
  eager: true,
  import: 'default',
})

function load(): Edition[] {
  const list: Edition[] = []
  for (const [path, data] of Object.entries(modules)) {
    const errors = validateEdition(data, path)
    if (errors.length > 0) {
      // Don't crash the whole site over one bad file — skip it loudly instead.
      console.error(`[content] Ignoring invalid edition "${path}":\n${errors.map((e) => `  • ${e}`).join('\n')}`)
      continue
    }
    list.push(data)
  }
  // Newest first.
  return list.sort((a, b) => b.date.localeCompare(a.date))
}

export const editions: Edition[] = load()

export function getEditions(): Edition[] {
  return editions
}

export function getEdition(date: string): Edition | undefined {
  return editions.find((edition) => edition.date === date)
}

export interface SiteStats {
  editionCount: number
  summaryCount: number
  quizCount: number
  /** ISO datetime of the most recent edition, if any. */
  lastUpdated?: string
}

export function getStats(): SiteStats {
  const summaryCount = editions.reduce((total, edition) => total + edition.summaries.length, 0)
  const quizCount = editions.reduce(
    (total, edition) => total + edition.summaries.reduce((n, summary) => n + summary.quiz.length, 0),
    0,
  )
  return {
    editionCount: editions.length,
    summaryCount,
    quizCount,
    lastUpdated: editions[0]?.generatedAt ?? editions[0]?.date,
  }
}
