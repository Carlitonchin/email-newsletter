import * as React from 'react'

/**
 * A tiny hash-based router. Hash routing means deep links like
 * `#/edition/2026-06-26` work on any static host with zero server config
 * (GitHub Pages, Netlify, S3, …) — no rewrite rules required.
 */

function currentPath(): string {
  return window.location.hash.replace(/^#/, '') || '/'
}

export function useHashPath(): string {
  const [path, setPath] = React.useState(currentPath)
  React.useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return path
}

export function navigate(to: string): void {
  const target = to.startsWith('#') ? to : `#${to}`
  if (window.location.hash === target) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  window.location.hash = target
  window.scrollTo({ top: 0 })
}

type LinkProps = { to: string } & Omit<React.ComponentProps<'a'>, 'href'>

export function Link({ to, onClick, ...props }: LinkProps) {
  const href = to.startsWith('#') ? to : `#${to}`
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    onClick?.(event)
    // Respect modifier clicks (open in new tab, etc.).
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return
    }
    event.preventDefault()
    navigate(to)
  }
  return <a href={href} onClick={handleClick} {...props} />
}
