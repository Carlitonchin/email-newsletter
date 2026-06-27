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
                A fresh edition lands here every day. The first one is on its way — check back soon.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-eyebrow text-muted-foreground">All editions</h2>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {String(days.length).padStart(2, '0')}
              </span>
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
