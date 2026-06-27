import * as React from 'react'

import { cn } from '@/lib/utils'

// Tokenize the few inline marks we support: **bold** and `code`.
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`)/g
// A fenced code block: ```lang\n …\n``` (lang optional).
const FENCE = /```([\w-]*)[ \t]*\n([\s\S]*?)```/g

/** A top-level block of a write-up: a paragraph or a fenced code block. */
export type TextBlock = { kind: 'paragraph'; text: string } | { kind: 'code'; code: string; lang?: string }

export const renderInline = (text: string): React.ReactNode[] => {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="rounded-md border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      return <React.Fragment key={i}>{part}</React.Fragment>
    })
}

/**
 * Split a plain-text write-up into ordered blocks. Triple-backtick fences become
 * `code` blocks; everything else splits into `paragraph` blocks on blank lines.
 * Deliberately minimal — no Markdown dependency, no HTML injection.
 */
export const parseBlocks = (text: string): TextBlock[] => {
  const blocks: TextBlock[] = []
  const pushParagraphs = (chunk: string) => {
    chunk
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) => blocks.push({ kind: 'paragraph', text: p }))
  }

  let lastIndex = 0
  for (const match of text.matchAll(FENCE)) {
    const index = match.index ?? 0
    pushParagraphs(text.slice(lastIndex, index))
    blocks.push({ kind: 'code', lang: match[1] || undefined, code: match[2].replace(/\n+$/, '') })
    lastIndex = index + match[0].length
  }
  pushParagraphs(text.slice(lastIndex))
  return blocks
}

/** A fenced, horizontally-scrollable code block with an optional language tag. */
export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border bg-muted/40">
      {lang ? (
        <figcaption className="border-b px-4 py-1.5 font-mono text-[0.7rem] tracking-wide text-muted-foreground uppercase">
          {lang}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto p-4 text-[0.8rem]/relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </figure>
  )
}

/** Render a single text block (paragraph or code). */
export function TextBlockView({ block }: { block: TextBlock }) {
  if (block.kind === 'code') return <CodeBlock code={block.code} lang={block.lang} />
  return <p>{renderInline(block.text)}</p>
}

/**
 * Renders a plain-text write-up as paragraphs (and fenced code blocks). A blank
 * line starts a new paragraph; `**bold**` and `` `code` `` are supported inline.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text)
  return (
    <div className={cn('flex flex-col gap-4 text-sm/relaxed text-muted-foreground', className)}>
      {blocks.map((block, i) => (
        <TextBlockView key={i} block={block} />
      ))}
    </div>
  )
}
