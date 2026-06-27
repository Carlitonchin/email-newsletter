import { ArrowRightIcon, ClockIcon, HelpCircleIcon } from 'lucide-react'

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBadge } from '@/components/site/category-badge'
import { Link } from '@/lib/router'
import type { Article } from '@/lib/edition'
import { languageLabel } from '@/lib/format'

/** A preview card on the day page, linking to the article's own page. */
export function ArticleCard({ article, index = 0 }: { article: Article; index?: number }) {
  return (
    <Link
      to={`/edition/${article.date}/${article.slug}`}
      className="group/article block rounded-xl outline-none animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-both duration-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <Card className="h-full transition-all duration-300 group-hover/article:-translate-y-0.5 group-hover/article:shadow-xl group-hover/article:shadow-foreground/5 group-hover/article:ring-foreground/20">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-muted-foreground">
            <CategoryBadge category={article.category} />
            <span className="font-medium text-foreground">{article.newsletter}</span>
            <span aria-hidden>·</span>
            <span className="font-mono uppercase tracking-wide">{languageLabel(article.language)}</span>
            {article.readingTimeMinutes ? (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <ClockIcon className="size-3.5" />
                  {article.readingTimeMinutes} min
                </span>
              </>
            ) : null}
          </div>
          <CardTitle className="mt-2.5 text-lg leading-snug text-balance transition-colors group-hover/article:text-foreground">
            {article.title}
          </CardTitle>
          <CardDescription className="mt-1 text-[0.95rem] text-pretty">{article.tldr}</CardDescription>
        </CardHeader>

        <CardFooter className="justify-between gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <HelpCircleIcon className="size-4" />
            <span>
              <span className="font-mono tabular-nums">{article.quiz.length}</span>-question quiz
            </span>
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            Read article
            <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover/article:translate-x-0.5" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
