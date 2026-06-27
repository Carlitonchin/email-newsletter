import { ArrowUpRightIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBadge, CategoryDot } from '@/components/site/category-badge'
import { Link } from '@/lib/router'
import { cn } from '@/lib/utils'
import type { Day } from '@/lib/edition'
import { formatDay, formatMonthShort, formatWeekday } from '@/lib/format'

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

export function EditionCard({ day, featured = false }: { day: Day; featured?: boolean }) {
  const categories = unique(day.articles.map((article) => article.category))
  const newsletters = unique(day.articles.map((article) => article.newsletter))
  const count = day.articles.length

  return (
    <Link
      to={`/edition/${day.date}`}
      className="group/edition block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="transition-all duration-300 group-hover/edition:-translate-y-0.5 group-hover/edition:shadow-xl group-hover/edition:shadow-foreground/5 group-hover/edition:ring-foreground/20">
        <CardHeader className="flex flex-row items-center gap-4">
          <div
            className={cn(
              'grid shrink-0 place-items-center rounded-xl bg-muted',
              featured ? 'size-16' : 'size-14',
            )}
          >
            <div className="text-center leading-none">
              <div className={cn('font-semibold tabular-nums', featured ? 'text-2xl' : 'text-xl')}>
                {formatDay(day.date)}
              </div>
              <div className="mt-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {formatMonthShort(day.date)}
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className={cn('capitalize', featured && 'text-lg')}>
                {day.title ?? formatWeekday(day.date)}
              </CardTitle>
              {featured && <Badge variant="outline">Latest</Badge>}
            </div>
            <CardDescription className="mt-1 truncate">
              {count} {count === 1 ? 'article' : 'articles'} · {newsletters.join(' · ')}
            </CardDescription>
          </div>

          <ArrowUpRightIcon className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover/edition:-translate-y-0.5 group-hover/edition:translate-x-0.5" />
        </CardHeader>

        {featured && (
          <CardContent>
            <ul className="flex flex-col gap-2.5">
              {day.articles.map((article) => (
                <li key={article.slug} className="flex items-center gap-2.5 text-sm">
                  <CategoryDot category={article.category} />
                  <span className="truncate">{article.title}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}

        <CardFooter className="flex-wrap gap-2">
          {categories.map((category) => (
            <CategoryBadge key={category} category={category} />
          ))}
        </CardFooter>
      </Card>
    </Link>
  )
}
