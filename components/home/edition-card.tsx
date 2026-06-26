import { ArrowUpRightIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBadge, CategoryDot } from '@/components/site/category-badge'
import { Link } from '@/lib/router'
import { cn } from '@/lib/utils'
import type { Edition } from '@/lib/edition'
import { formatDay, formatMonthShort, formatWeekday } from '@/lib/format'

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

export function EditionCard({ edition, featured = false }: { edition: Edition; featured?: boolean }) {
  const categories = unique(edition.summaries.map((summary) => summary.category))
  const newsletters = unique(edition.summaries.map((summary) => summary.newsletter))
  const count = edition.summaries.length

  return (
    <Link
      to={`/edition/${edition.date}`}
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
                {formatDay(edition.date)}
              </div>
              <div className="mt-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {formatMonthShort(edition.date)}
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className={cn('capitalize', featured && 'text-lg')}>
                {formatWeekday(edition.date)}
              </CardTitle>
              {featured && <Badge variant="outline">Latest</Badge>}
            </div>
            <CardDescription className="mt-1 truncate">
              {count} {count === 1 ? 'summary' : 'summaries'} · {newsletters.join(' · ')}
            </CardDescription>
          </div>

          <ArrowUpRightIcon className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover/edition:-translate-y-0.5 group-hover/edition:translate-x-0.5" />
        </CardHeader>

        {featured && (
          <CardContent>
            <ul className="flex flex-col gap-2.5">
              {edition.summaries.map((summary) => (
                <li key={summary.id} className="flex items-center gap-2.5 text-sm">
                  <CategoryDot category={summary.category} />
                  <span className="truncate">{summary.title}</span>
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
