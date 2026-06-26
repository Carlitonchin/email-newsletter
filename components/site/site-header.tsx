import { Button } from '@/components/ui/button'
import { Link } from '@/lib/router'
import { site } from '@/lib/site'
import { BrandMark } from './brand-mark'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6">
        <Link
          to="/"
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <BrandMark />
        </Link>
        <nav className="flex items-center gap-1">
          {site.links.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </Button>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
