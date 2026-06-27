import * as React from 'react'

import { cn } from '@/lib/utils'

// Tokenize the few inline marks we support: **bold** and `code`.
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`)/g

function renderInline(text: string): React.ReactNode[] {
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
 * Renders a plain-text summary as paragraphs. A blank line starts a new
 * paragraph; `**bold**` and `` `code` `` are supported inline. Deliberately
 * minimal — no Markdown dependency, no HTML injection.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <div className={cn('flex flex-col gap-4 text-sm/relaxed text-muted-foreground', className)}>
      {paragraphs.map((paragraph, i) => (
        <p key={i}>{renderInline(paragraph)}</p>
      ))}
    </div>
  )
}
