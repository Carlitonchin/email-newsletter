import { useHashPath } from '@/lib/router'
import { AmbientBackground } from '@/components/site/ambient-background'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { HomePage } from './pages/home'
import { EditionPage } from './pages/edition'
import { ArticlePage } from './pages/article'
import { NotFoundPage } from './pages/not-found'

function resolve(path: string) {
  const article = path.match(/^\/edition\/([^/]+)\/([^/]+)$/)
  if (article) {
    const date = decodeURIComponent(article[1])
    const slug = decodeURIComponent(article[2])
    return { key: `article:${date}/${slug}`, element: <ArticlePage date={date} slug={slug} /> }
  }
  const day = path.match(/^\/edition\/([^/]+)$/)
  if (day) {
    const date = decodeURIComponent(day[1])
    return { key: `edition:${date}`, element: <EditionPage date={date} /> }
  }
  if (path === '/' || path === '') return { key: 'home', element: <HomePage /> }
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
