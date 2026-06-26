/**
 * A fixed, monochrome "frosted glass" backdrop — soft drifting glows behind the
 * content for a subtle sense of depth. Purely decorative.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-48 left-1/2 size-[60rem] -translate-x-1/2 rounded-full bg-foreground/[0.05] blur-3xl animate-drift" />
      <div
        className="absolute top-1/4 -left-40 size-[42rem] rounded-full bg-foreground/[0.04] blur-3xl animate-drift"
        style={{ animationDelay: '-7s' }}
      />
      <div
        className="absolute -right-48 bottom-0 size-[46rem] rounded-full bg-foreground/[0.035] blur-3xl animate-drift"
        style={{ animationDelay: '-14s' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background" />
    </div>
  )
}
