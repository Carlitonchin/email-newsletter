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
        <p className="text-sm font-medium text-muted-foreground">Daily digest</p>
        <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight text-balance capitalize">
          {day.title ?? formatDateLong(day.date)}
        </h1>
        {day.title && <p className="mt-1 text-sm text-muted-foreground">{formatDateLong(day.date)}</p>}
        {day.intro ? (
          <p className="mt-3 text-pretty text-muted-foreground">{day.intro}</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {count} {count === 1 ? 'article' : 'articles'} · open one to read it and take its quiz.
          </p>
        )}
      </header>

      <div className="flex flex-col gap-4">
        {day.articles.map((article, i) => (
          <ArticleCard key={article.slug} article={article} index={i} />
        ))}
      </div>
    </div>
  )
}
