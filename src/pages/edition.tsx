import { ArrowLeftIcon, CalendarXIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ArticleCard } from '@/components/edition/article-card'
import { getDay } from '@/lib/content'
import { formatDateLong } from '@/lib/format'
import { Link } from '@/lib/router'
import { cn } from '@/lib/utils'

export function EditionPage({ date }: { date: string }) {
  const day = getDay(date)

  if (!day) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarXIcon />
            </EmptyMedia>
            <EmptyTitle>No edition for this date</EmptyTitle>
            <EmptyDescription>There’s no edition for {date} yet — it may not be published.</EmptyDescription>
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

  const count = day.articles.length

  return (
    <div className="mx-auto max-w-2xl px-6 pt-10 pb-8">
      <Link
        to="/"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-6 -ml-2.5 w-fit text-muted-foreground')}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        All editions
      </Link>

      <header className="mb-8">
        <p className="text-eyebrow text-muted-foreground">Daily digest</p>
        <h1 className="text-display font-heading mt-2 font-semibold text-balance capitalize">
          {day.title ?? formatDateLong(day.date)}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground tabular-nums">
          <span>{formatDateLong(day.date)}</span>
          <span aria-hidden>·</span>
          <span>
            {count} {count === 1 ? 'article' : 'articles'}
          </span>
        </div>
        {day.intro && <p className="mt-4 max-w-prose text-pretty text-muted-foreground">{day.intro}</p>}
      </header>

      <div className="flex flex-col gap-4">
        {day.articles.map((article, i) => (
          <ArticleCard key={article.slug} article={article} index={i} />
        ))}
      </div>
    </div>
  )
}
