/**
 * Site-wide configuration. Tweak the wordmark, tagline and links here — every
 * page reads from this object so there is a single source of truth.
 */
export interface SiteLink {
  label: string
  href: string
}

export interface SiteConfig {
  /** Short product name used in the header wordmark and document title. */
  name: string
  /** One-line promise shown in the hero. */
  tagline: string
  /** Longer description for the hero sub-heading and meta tags. */
  description: string
  /** Shown in the footer. */
  author: string
  /** Locale used to format dates in the UI (content language is per-summary). */
  locale: string
  /** Optional links rendered in the header / footer (GitHub, source, etc.). */
  links: SiteLink[]
}

export const site: SiteConfig = {
  name: 'Brief',
  tagline: 'The best tech newsletters, distilled daily.',
  description:
    'A daily, AI-curated digest of the software, programming and AI newsletters worth reading — each one distilled into a clear summary and a quick quiz to make the ideas stick.',
  author: 'Carlos',
  locale: 'en-US',
  links: [],
}
