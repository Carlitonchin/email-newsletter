import { ArrowLeftIcon, CalendarXIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { SummaryCard } from '@/components/edition/summary-card'
import { getEdition } from '@/lib/content'
import { formatDateLong } from '@/lib/format'
import { Link } from '@/lib/router'
import { cn } from '@/lib/utils'

export function EditionPage({ date }: { date: string }) {
  const edition = getEdition(date)

  if (!edition) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarXIcon />
            </EmptyMedia>
            <EmptyTitle>No edition for this date</EmptyTitle>
            <EmptyDescription>There’s no digest for {date}. It may not have been generated yet.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/" className={cn(buttonVariants({ size: 'sm' }))}>
              <ArrowLeftIcon data-icon="inline-start" />
              All editions
            </Link>
          </EmptyContent>
        </Empty>
      </section>
    )
  }

  const count = edition.summaries.length

  return (
    <article className="mx-auto max-w-2xl px-6 pt-10 pb-8">
      <Link
        to="/"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-6 -ml-2.5 w-fit text-muted-foreground')}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        All editions
      </Link>

      <header className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">Daily digest</p>
        <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight capitalize text-balance">
          {formatDateLong(edition.date)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {count} {count === 1 ? 'summary' : 'summaries'} · read each one, then test yourself with its quiz.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {edition.summaries.map((summary, i) => (
          <SummaryCard key={summary.id} summary={summary} index={i} />
        ))}
      </div>
    </article>
  )
}
