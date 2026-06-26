import { CompassIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Link } from '@/lib/router'
import { cn } from '@/lib/utils'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CompassIcon />
          </EmptyMedia>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>That page doesn’t exist or may have moved.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link to="/" className={cn(buttonVariants({ size: 'sm' }))}>
            Back home
          </Link>
        </EmptyContent>
      </Empty>
    </section>
  )
}
