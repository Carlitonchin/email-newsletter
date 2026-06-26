import { Link } from '@/lib/router'
import { site } from '@/lib/site'
import { BrandMark } from './brand-mark'

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="w-fit rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BrandMark />
        </Link>
        <p className="text-sm text-muted-foreground">
          {site.tagline} · Curated by {site.author} · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
