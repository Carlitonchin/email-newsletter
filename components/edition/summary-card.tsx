import { BookOpenIcon, CheckIcon, ClockIcon, ExternalLinkIcon } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBadge } from '@/components/site/category-badge'
import { RichText } from './rich-text'
import { QuizDialog } from './quiz-dialog'
import type { Summary } from '@/lib/edition'
import { formatRelativeFromNow, languageLabel } from '@/lib/format'

export function SummaryCard({ summary, index = 0 }: { summary: Summary; index?: number }) {
  return (
    <Card
      id={summary.id}
      className="scroll-mt-24 animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-both duration-700"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-muted-foreground">
          <CategoryBadge category={summary.category} />
          <span className="font-medium text-foreground">{summary.newsletter}</span>
          {summary.author && <span>· {summary.author}</span>}
          <span aria-hidden>·</span>
          <span>{languageLabel(summary.language)}</span>
          {summary.readingTimeMinutes ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="size-3.5" />
                {summary.readingTimeMinutes} min
              </span>
            </>
          ) : null}
          <span aria-hidden>·</span>
          <span>{formatRelativeFromNow(summary.receivedAt)}</span>
        </div>
        <CardTitle className="mt-2 text-xl leading-snug text-balance">{summary.title}</CardTitle>
        <CardDescription className="text-[0.95rem] text-pretty text-foreground/80">{summary.tldr}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <ul className="flex flex-col gap-2.5">
          {summary.keyPoints.map((point, i) => (
            <li key={i} className="flex gap-2.5 text-sm">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-foreground/10 text-foreground">
                <CheckIcon className="size-3" />
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <Accordion type="single" collapsible>
          <AccordionItem value="full" className="border-none">
            <AccordionTrigger className="py-0 text-sm text-muted-foreground hover:text-foreground hover:no-underline">
              <span className="inline-flex items-center gap-2">
                <BookOpenIcon className="size-4" />
                Full summary
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <RichText text={summary.summary} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {summary.tags && summary.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {summary.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-muted-foreground">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <a href={summary.sourceUrl} target="_blank" rel="noreferrer">
            Read original
            <ExternalLinkIcon data-icon="inline-end" />
          </a>
        </Button>
        <QuizDialog summary={summary} />
      </CardFooter>
    </Card>
  )
}
