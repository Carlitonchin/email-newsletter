import { useHashPath } from '@/lib/router'
import { AmbientBackground } from '@/components/site/ambient-background'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { HomePage } from './pages/home'
import { EditionPage } from './pages/edition'
import { NotFoundPage } from './pages/not-found'

function resolve(path: string) {
  const editionMatch = path.match(/^\/edition\/(.+)$/)
  if (path === '/' || path === '') return { key: 'home', element: <HomePage /> }
  if (editionMatch) {
    const date = decodeURIComponent(editionMatch[1])
    return { key: `edition:${date}`, element: <EditionPage date={date} /> }
  }
  return { key: 'not-found', element: <NotFoundPage /> }
}

export function App() {
  const path = useHashPath()
  const { key, element } = resolve(path)

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AmbientBackground />
      <SiteHeader />
      <main className="flex-1">
        {/* Re-key on navigation so each view fades in fresh. */}
        <div key={key} className="animate-in fade-in-0 duration-500">
          {element}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
