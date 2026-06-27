import { getStats } from '@/lib/content'
import { formatRelativeFromNow } from '@/lib/format'
import { site } from '@/lib/site'

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center px-5 sm:px-8">
      <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</span>
      <span className="text-eyebrow mt-2 text-muted-foreground">{label}</span>
    </div>
  )
}

export function Hero() {
  const stats = getStats()

  return (
    <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center sm:pt-24">
      {stats.lastUpdated && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 font-mono text-xs font-medium text-muted-foreground tabular-nums backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-1 duration-700">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/40" />
            <span className="relative inline-flex size-1.5 rounded-full bg-foreground/70" />
          </span>
          Updated {formatRelativeFromNow(stats.lastUpdated)}
        </div>
      )}

      <h1 className="text-hero font-heading font-semibold text-balance animate-in fade-in-0 slide-in-from-bottom-2 duration-700">
        {site.tagline}
      </h1>

      <p className="mx-auto mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg animate-in fade-in-0 slide-in-from-bottom-3 duration-700">
        {site.description}
      </p>

      {stats.dayCount > 0 && (
        <div className="mt-10 flex items-stretch justify-center divide-x divide-border/70 animate-in fade-in-0 duration-1000">
          <Stat value={stats.dayCount} label={stats.dayCount === 1 ? 'Edition' : 'Editions'} />
          <Stat value={stats.articleCount} label="Articles" />
          <Stat value={stats.quizCount} label="Quizzes" />
        </div>
      )}
    </section>
  )
}
