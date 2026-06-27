import { InboxIcon } from 'lucide-react'

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Hero } from '@/components/home/hero'
import { EditionCard } from '@/components/home/edition-card'
import { getDays } from '@/lib/content'

export function HomePage() {
  const days = getDays()

  return (
    <>
      <Hero />
      <section className="mx-auto max-w-2xl px-6 pb-8">
        {days.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>No editions yet</EmptyTitle>
              <EmptyDescription>
                The first digest will appear here as soon as the daily agent processes your inbox.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-heading text-sm font-medium tracking-wide text-muted-foreground uppercase">
                All editions
              </h2>
              <span className="text-xs text-muted-foreground tabular-nums">{days.length}</span>
            </div>
            {days.map((day, i) => (
              <EditionCard key={day.date} day={day} featured={i === 0} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
