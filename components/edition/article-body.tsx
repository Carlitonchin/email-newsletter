import * as React from 'react'
import { ExternalLinkIcon, PlayIcon } from 'lucide-react'

import type { EmbedMedia, ImageMedia, MediaBlock } from '@/lib/edition'
import { cn } from '@/lib/utils'
import { parseBlocks, TextBlockView } from '@/components/edition/rich-text'

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(value, lo), hi)
}

/** An `<img>` that quietly removes itself if the source fails to load. */
function SafeImage(props: React.ComponentProps<'img'>) {
  const [failed, setFailed] = React.useState(false)
  if (failed) return null
  return <img {...props} loading="lazy" decoding="async" onError={() => setFailed(true)} />
}

/** A captioned image lifted from the original, optionally linking back to it. */
function Figure({ block, sourceUrl }: { block: ImageMedia; sourceUrl: string }) {
  const href = block.href ?? sourceUrl
  const image = (
    <SafeImage
      src={block.src}
      alt={block.alt}
      width={block.width}
      height={block.height}
      className="w-full bg-muted/30 object-cover"
      style={block.width && block.height ? { aspectRatio: `${block.width} / ${block.height}` } : undefined}
    />
  )
  return (
    <figure className="flex flex-col gap-2">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-xl border outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {image}
        </a>
      ) : (
        <span className="block overflow-hidden rounded-xl border">{image}</span>
      )}
      {(block.caption || block.credit) && (
        <figcaption className="text-xs/relaxed text-muted-foreground">
          {block.caption}
          {block.credit && <span className="italic">{block.caption ? ' — ' : ''}{block.credit}</span>}
        </figcaption>
      )}
    </figure>
  )
}

const EMBED_LABEL: Record<NonNullable<EmbedMedia['embedKind']>, string> = {
  video: 'Video',
  tweet: 'Post',
  link: 'Link',
}

/** A link-out card for media a static page can't run (video, tweet, demo). */
function EmbedCard({ block }: { block: EmbedMedia }) {
  const isVideo = block.embedKind === 'video'
  const label = block.provider ?? (block.embedKind ? EMBED_LABEL[block.embedKind] : 'Link')
  return (
    <a
      href={block.url}
      target="_blank"
      rel="noreferrer"
      className="group/embed flex flex-col overflow-hidden rounded-xl border outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:flex-row"
    >
      {block.thumbnailSrc && (
        <div className="relative aspect-video shrink-0 bg-muted sm:aspect-square sm:w-40">
          <SafeImage src={block.thumbnailSrc} alt={block.title} className="size-full object-cover" />
          {isVideo && (
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-11 place-items-center rounded-full bg-background/85 text-foreground ring-1 ring-foreground/10 backdrop-blur-sm transition-transform group-hover/embed:scale-105">
                <PlayIcon className="size-5 translate-x-0.5 fill-current" />
              </span>
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-1 p-4">
        <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
        <span className="font-medium text-foreground">{block.title}</span>
        {block.caption && <span className="text-sm text-muted-foreground">{block.caption}</span>}
        <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground">
          {isVideo ? 'Watch' : 'Open'}
          <ExternalLinkIcon className="size-3.5" />
        </span>
      </div>
    </a>
  )
}

function MediaItem({ block, sourceUrl }: { block: MediaBlock; sourceUrl: string }) {
  if (block.type === 'embed') return <EmbedCard block={block} />
  return <Figure block={block} sourceUrl={sourceUrl} />
}

/**
 * The full write-up: the `summary` text (paragraphs + fenced code) with `media`
 * interleaved at each block's `afterParagraph` anchor. The anchor counts how
 * many summary paragraphs precede the block — `0` is a lead, an omitted /
 * out-of-range value lands after the prose, and blocks sharing a slot keep their
 * array order.
 */
export function ArticleBody({
  summary,
  media,
  sourceUrl,
  className,
}: {
  summary: string
  media?: MediaBlock[]
  sourceUrl: string
  className?: string
}) {
  const blocks = parseBlocks(summary)
  const slots = blocks.length

  const bySlot = new Map<number, MediaBlock[]>()
  for (const block of media ?? []) {
    const slot = clamp(block.afterParagraph ?? slots, 0, slots)
    const list = bySlot.get(slot)
    if (list) list.push(block)
    else bySlot.set(slot, [block])
  }

  const nodes: React.ReactNode[] = []
  const emitMedia = (slot: number) => {
    bySlot.get(slot)?.forEach((block, i) => {
      nodes.push(<MediaItem key={`media-${slot}-${i}`} block={block} sourceUrl={sourceUrl} />)
    })
  }

  emitMedia(0)
  blocks.forEach((block, i) => {
    nodes.push(<TextBlockView key={`block-${i}`} block={block} />)
    emitMedia(i + 1)
  })

  return <div className={cn('flex flex-col gap-5', className)}>{nodes}</div>
}
