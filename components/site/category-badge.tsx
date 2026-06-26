import type { LucideIcon } from 'lucide-react'
import {
  BriefcaseIcon,
  CodeIcon,
  DatabaseIcon,
  FlaskConicalIcon,
  GlobeIcon,
  ShieldIcon,
  SparklesIcon,
  TagIcon,
  WrenchIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { CATEGORIES, type CategoryId } from '@/lib/edition'

const ICONS: Record<CategoryId, LucideIcon> = {
  ai: SparklesIcon,
  programming: CodeIcon,
  web: GlobeIcon,
  devtools: WrenchIcon,
  data: DatabaseIcon,
  security: ShieldIcon,
  science: FlaskConicalIcon,
  business: BriefcaseIcon,
  other: TagIcon,
}

/** A small colored dot for the category accent — handy in dense lists. */
export function CategoryDot({ category }: { category: CategoryId }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ backgroundColor: CATEGORIES[category].accent }}
    />
  )
}

export function CategoryBadge({ category }: { category: CategoryId }) {
  const Icon = ICONS[category]
  const meta = CATEGORIES[category]
  return (
    <Badge variant="secondary">
      <Icon style={{ color: meta.accent }} />
      {meta.label}
    </Badge>
  )
}
