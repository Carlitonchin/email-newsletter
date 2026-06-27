import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, CompassIcon, ExternalLinkIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { CategoryBadge } from '@/components/site/category-badge'
import { ArticleBody } from '@/components/edition/article-body'
import { Quiz } from '@/components/edition/quiz'
import { ReadingProgress } from '@/components/edition/reading-progress'
import { getArticle, getArticleNeighbors } from '@/lib/content'
import type { Article } from '@/lib/edition'
import { formatDateLong, formatDateMedium, languageLabel } from '@/lib/format'
import { Link } from '@/lib/router'
import { cn } from '@/lib/utils'

export function ArticlePage({ date, slug }: { date: string; slug: string }) {
  const article = getArticle(date, slug)

  if (!article) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CompassIcon />
            </EmptyMedia>
            <EmptyTitle>Article not found</EmptyTitle>
            <EmptyDescription>This piece doesn’t exist or may have moved.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to={`/edition/${date}`} className={cn(buttonVariants({ size: 'sm' }))}>
              <ArrowLeftIcon data-icon="inline-start" />
              Back to the day
            </Link>
          </EmptyContent>
        </Empty>
      </section>
    )
  }

  const { prev, next } = getArticleNeighbors(date, slug)

  return (
    <article className="mx-auto max-w-2xl px-6 pt-10 pb-16">
      <ReadingProgress />
      <Link
        to={`/edition/${article.date}`}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-6 -ml-2.5 w-fit text-muted-foreground')}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        {formatDateLong(article.date)}
      </Link>

      <header className="flex flex-col gap-4">
        <div>
          <CategoryBadge category={article.category} />
        </div>
        <h1 className="text-display font-heading font-semibold text-balance">{article.title}</h1>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{article.newsletter}</span>
          {article.author && (
            <>
              <span aria-hidden>·</span>
              <span>{article.author}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span className="font-mono text-xs uppercase tracking-wide">{languageLabel(article.language)}</span>
          {article.readingTimeMinutes ? (
            <>
              <span aria-hidden>·</span>
              <span className="font-mono text-xs tabular-nums">{article.readingTimeMinutes} min read</span>
            </>
          ) : null}
          <span aria-hidden>·</span>
          <span className="font-mono text-xs tabular-nums">{formatDateMedium(article.receivedAt.slice(0, 10))}</span>
        </div>
        <p className="text-lg/relaxed text-pretty text-foreground/80 sm:text-xl/relaxed">{article.tldr}</p>
      </header>

      <Separator className="my-8" />

      {/* Key takeaways */}
      <div className="rounded-2xl bg-muted/40 p-5 ring-1 ring-foreground/5 sm:p-6">
        <h2 className="text-eyebrow text-muted-foreground">Key takeaways</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {article.keyPoints.map((point, i) => (
            <li key={i} className="flex gap-3 text-sm/relaxed">
              <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-foreground/10 text-foreground">
                <CheckIcon className="size-3" />
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Full write-up — mirrors the original author's tone, with the original's
          diagrams, screenshots, code and embeds interleaved in. */}
      <ArticleBody
        summary={article.summary}
        media={article.media}
        sourceUrl={article.sourceUrl}
        className="mt-8 text-base/7 text-foreground"
      />

      {article.tags && article.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-1.5">
          {article.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="font-mono text-muted-foreground">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Button variant="outline" asChild>
          <a href={article.sourceUrl} target="_blank" rel="noreferrer">
            Read the original
            <ExternalLinkIcon data-icon="inline-end" />
          </a>
        </Button>
      </div>

      <div className="mt-12">
        <Quiz quiz={article.quiz} idPrefix={article.slug} />
      </div>

      {(prev || next) && (
        <nav className="mt-12 grid gap-4 sm:grid-cols-2">
          <ArticleNavLink article={prev} direction="prev" />
          <ArticleNavLink article={next} direction="next" />
        </nav>
      )}
    </article>
  )
}

function ArticleNavLink({ article, direction }: { article?: Article; direction: 'prev' | 'next' }) {
  if (!article) return <div className="hidden sm:block" />
  const isNext = direction === 'next'
  return (
    <Link
      to={`/edition/${article.date}/${article.slug}`}
      className={cn(
        'group/nav flex flex-col gap-1.5 rounded-xl border p-4 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring',
        isNext && 'sm:text-right',
      )}
    >
      <span
        className={cn(
          'text-eyebrow inline-flex items-center gap-1.5 text-muted-foreground',
          isNext && 'sm:flex-row-reverse',
        )}
      >
        {isNext ? (
          <ArrowRightIcon className="size-3.5 transition-transform group-hover/nav:translate-x-0.5" />
        ) : (
          <ArrowLeftIcon className="size-3.5 transition-transform group-hover/nav:-translate-x-0.5" />
        )}
        {isNext ? 'Next' : 'Previous'}
      </span>
      <span className="line-clamp-2 text-sm font-medium text-balance">{article.title}</span>
    </Link>
  )
}
