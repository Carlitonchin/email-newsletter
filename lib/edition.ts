/**
 * The data contract shared by the website and the generation scripts.
 *
 * This file is intentionally free of any Vite / browser / React specifics so it
 * can be imported both by the app (`@/lib/edition`) and by the Node scripts
 * (`scripts/newsletter/*`). Keep it that way.
 */

/** The fixed set of topics a summary can be filed under. */
export const CATEGORIES = {
  ai: { label: 'AI', accent: 'oklch(0.62 0.19 290)' },
  programming: { label: 'Programming', accent: 'oklch(0.62 0.17 255)' },
  web: { label: 'Web & Frontend', accent: 'oklch(0.7 0.13 200)' },
  devtools: { label: 'Tools & DevOps', accent: 'oklch(0.75 0.15 85)' },
  data: { label: 'Data & ML', accent: 'oklch(0.68 0.15 162)' },
  security: { label: 'Security', accent: 'oklch(0.62 0.2 25)' },
  science: { label: 'Science', accent: 'oklch(0.6 0.16 270)' },
  business: { label: 'Tech Business', accent: 'oklch(0.66 0.17 12)' },
  other: { label: 'Other', accent: 'oklch(0.62 0 0)' },
} as const

export type CategoryId = keyof typeof CATEGORIES

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[]

export interface QuizQuestion {
  /** The question text, in the summary's language. */
  question: string
  /** 2–5 answer choices. */
  options: string[]
  /** Index into `options` of the correct answer. */
  answerIndex: number
  /** Optional one-line explanation revealed after answering. */
  explanation?: string
}

export interface Summary {
  /** Stable slug, unique within its edition (lowercase, digits, hyphens). */
  id: string
  /** Human title for the card (can differ from the email subject). */
  title: string
  category: CategoryId
  /** Name of the newsletter / source, e.g. "TLDR", "Bytes". */
  newsletter: string
  /** Optional author of the original piece. */
  author?: string
  /** Absolute http(s) link to the original (web version preferred). */
  sourceUrl: string
  /** Language of this summary as an ISO code, e.g. "en", "es". */
  language: string
  /** Optional estimated reading time of the summary, in minutes. */
  readingTimeMinutes?: number
  /** ISO datetime the source email was received. */
  receivedAt: string
  /** A single punchy sentence — the hook. */
  tldr: string
  /** The full, self-contained summary (plain text; blank line = new paragraph). */
  summary: string
  /** 2–6 at-a-glance bullet points. */
  keyPoints: string[]
  /** Optional freeform tags. */
  tags?: string[]
  /** 3–5 multiple-choice questions about the content. */
  quiz: QuizQuestion[]
}

export interface Edition {
  /** Calendar date of the digest, YYYY-MM-DD. */
  date: string
  /** ISO datetime the edition was generated. */
  generatedAt: string
  /** Up to 5 summaries, most relevant first. */
  summaries: Summary[]
}

/* ------------------------------------------------------------------ */
/* Validation — used by the build, the runtime loader and the CLI gate. */
/* ------------------------------------------------------------------ */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const SLUG_RE = /^[a-z0-9-]+$/
const URL_RE = /^https?:\/\//
const MIN_SUMMARY_CHARS = 120
const MAX_SUMMARIES = 5

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isText(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

/** Returns a list of human-readable problems. Empty array = valid. */
export function validateEdition(value: unknown, label = 'edition'): string[] {
  const errors: string[] = []
  if (!isObject(value)) return [`${label}: must be a JSON object`]

  if (!isText(value.date) || !DATE_RE.test(value.date)) {
    errors.push(`${label}.date: required, format YYYY-MM-DD`)
  }
  if (!isText(value.generatedAt)) {
    errors.push(`${label}.generatedAt: required ISO datetime string`)
  }

  if (!Array.isArray(value.summaries)) {
    errors.push(`${label}.summaries: required array`)
    return errors
  }
  if (value.summaries.length === 0) {
    errors.push(`${label}.summaries: must contain at least one summary`)
  }
  if (value.summaries.length > MAX_SUMMARIES) {
    errors.push(
      `${label}.summaries: at most ${MAX_SUMMARIES} summaries per edition (got ${value.summaries.length}) — keep the most relevant`,
    )
  }

  const seen = new Set<string>()
  value.summaries.forEach((summary, i) => {
    const sl = `${label}.summaries[${i}]`
    errors.push(...validateSummary(summary, sl))
    if (isObject(summary) && isText(summary.id)) {
      if (seen.has(summary.id)) errors.push(`${sl}.id: duplicate id "${summary.id}" within edition`)
      seen.add(summary.id)
    }
  })

  return errors
}

function validateSummary(value: unknown, label: string): string[] {
  const errors: string[] = []
  if (!isObject(value)) return [`${label}: must be an object`]

  if (!isText(value.id)) errors.push(`${label}.id: required non-empty slug`)
  else if (!SLUG_RE.test(value.id)) {
    errors.push(`${label}.id: lowercase letters, digits and hyphens only`)
  }
  if (!isText(value.title)) errors.push(`${label}.title: required`)
  if (!isText(value.category) || !(value.category in CATEGORIES)) {
    errors.push(`${label}.category: required, one of: ${CATEGORY_IDS.join(', ')}`)
  }
  if (!isText(value.newsletter)) errors.push(`${label}.newsletter: required source name`)
  if (!isText(value.sourceUrl) || !URL_RE.test(value.sourceUrl)) {
    errors.push(`${label}.sourceUrl: required absolute http(s) URL to the original`)
  }
  if (!isText(value.language)) errors.push(`${label}.language: required code, e.g. "en" / "es"`)
  if (!isText(value.receivedAt)) errors.push(`${label}.receivedAt: required ISO datetime of the email`)
  if (!isText(value.tldr)) errors.push(`${label}.tldr: required one-line hook`)

  if (!isText(value.summary)) {
    errors.push(`${label}.summary: required detailed summary`)
  } else if (value.summary.trim().length < MIN_SUMMARY_CHARS) {
    errors.push(
      `${label}.summary: too short — write enough that a reader needn't open the source (>= ${MIN_SUMMARY_CHARS} chars)`,
    )
  }

  if (!Array.isArray(value.keyPoints) || value.keyPoints.length < 2) {
    errors.push(`${label}.keyPoints: required array with at least 2 bullet points`)
  } else if (!value.keyPoints.every(isText)) {
    errors.push(`${label}.keyPoints: every item must be a non-empty string`)
  }

  if (
    value.readingTimeMinutes !== undefined &&
    (typeof value.readingTimeMinutes !== 'number' || value.readingTimeMinutes <= 0)
  ) {
    errors.push(`${label}.readingTimeMinutes: optional positive number`)
  }
  if (value.tags !== undefined && (!Array.isArray(value.tags) || !value.tags.every(isText))) {
    errors.push(`${label}.tags: optional array of non-empty strings`)
  }
  if (value.author !== undefined && !isText(value.author)) {
    errors.push(`${label}.author: optional non-empty string`)
  }

  if (!Array.isArray(value.quiz) || value.quiz.length === 0) {
    errors.push(`${label}.quiz: required array with at least one question (aim for 3–5)`)
  } else {
    value.quiz.forEach((q, i) => errors.push(...validateQuestion(q, `${label}.quiz[${i}]`)))
  }

  return errors
}

function validateQuestion(value: unknown, label: string): string[] {
  const errors: string[] = []
  if (!isObject(value)) return [`${label}: must be an object`]

  if (!isText(value.question)) errors.push(`${label}.question: required`)

  const optionCount = Array.isArray(value.options) ? value.options.length : 0
  if (!Array.isArray(value.options) || optionCount < 2) {
    errors.push(`${label}.options: required array with at least 2 options`)
  } else {
    if (optionCount > 5) errors.push(`${label}.options: at most 5 options`)
    if (!value.options.every(isText)) errors.push(`${label}.options: every option must be a non-empty string`)
  }

  if (
    typeof value.answerIndex !== 'number' ||
    !Number.isInteger(value.answerIndex) ||
    value.answerIndex < 0 ||
    value.answerIndex >= optionCount
  ) {
    errors.push(`${label}.answerIndex: required integer in range 0..${Math.max(optionCount - 1, 0)}`)
  }

  if (value.explanation !== undefined && !isText(value.explanation)) {
    errors.push(`${label}.explanation: optional non-empty string`)
  }

  return errors
}
