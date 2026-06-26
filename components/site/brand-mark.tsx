import { cn } from '@/lib/utils'
import { site } from '@/lib/site'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="grid size-7 place-items-center rounded-lg bg-foreground text-background">
        <svg viewBox="0 0 32 32" className="size-4" aria-hidden>
          <rect x="7" y="9" width="18" height="2.6" rx="1.3" fill="currentColor" />
          <rect x="7" y="15" width="18" height="2.6" rx="1.3" fill="currentColor" opacity="0.7" />
          <rect x="7" y="21" width="11" height="2.6" rx="1.3" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
      <span className="font-heading text-lg font-semibold tracking-tight">{site.name}</span>
    </span>
  )
}
