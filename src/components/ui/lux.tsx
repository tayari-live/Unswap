import { cn } from "@/lib/utils"

/*
 * Editorial-luxury primitives shared across the dashboard, mirroring the
 * waitlist / landing vocabulary (Cormorant display, gold eyebrows, hairline
 * cards, restrained palette) but theme-aware so they hold up in light + dark.
 * Presentational only — safe to use inside server components.
 */

/** Gold eyebrow label: "— LABEL —" with hairline rules. */
export function SectionLabel({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode
  align?: "left" | "center"
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3 mb-3", align === "center" && "justify-center", className)}>
      {align === "center" && (
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--gold-soft)]/50" />
      )}
      <span className="text-[11px] tracking-[0.28em] uppercase font-medium text-[var(--gold-soft)]">
        {children}
      </span>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--gold-soft)]/50" />
    </div>
  )
}

/**
 * Product card: white surface, 10px radius, light shadow.
 *
 * Elevation rather than a hairline separates surfaces in the product, per the
 * brand system. A faint border is kept so cards still read on the parchment
 * ground, where the shadow alone is too subtle to register.
 */
export function LuxCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-[var(--card)] border border-[var(--border)] rounded-[10px] shadow-card",
        className,
      )}
    >
      {children}
    </div>
  )
}

/*
 * Card typography.
 *
 * Card headings were inline <h2>/<h3> at whatever size each page happened to
 * use. These give the three roles the spec defines a single definition, so a
 * card title reads the same wherever it appears.
 */

/** Card title — 20/600. */
export function CardTitle({
  children,
  className,
  as: Tag = "h3",
}: {
  children: React.ReactNode
  className?: string
  /** Choose the level that fits the page outline; the styling is unaffected. */
  as?: "h2" | "h3" | "h4"
}) {
  return (
    <Tag className={cn("text-xl font-semibold text-[var(--foreground)] leading-snug", className)}>
      {children}
    </Tag>
  )
}

/** Supporting line beneath a card title — 16/400. */
export function CardSubtitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-base text-[var(--muted)] leading-relaxed", className)}>{children}</p>
}

/** Dates, counts, statuses — 14/400. */
export function CardMeta({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-[var(--muted)]", className)}>{children}</p>
}

/**
 * Product page header.
 *
 * Inter, not Cormorant: the display face is reserved for marketing, on the
 * reasoning that a serif at UI sizes costs legibility for no gain. Sized to
 * the H3/H2 steps of the scale, stepped down on narrow viewports.
 */
export function LuxPageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8">
      <div>
        <SectionLabel>{eyebrow}</SectionLabel>
        <h1 className="font-sans font-bold leading-tight tracking-tight text-[var(--foreground)] text-[32px] lg:text-[40px]">
          {title}
        </h1>
        {subtitle && <p className="text-[var(--muted)] mt-2 text-base max-w-xl leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

/** Thin gold divider (optionally with a centred label). */
export function LuxDivider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-[var(--hair)]", className)} />
}

// Gold CTA: dark text on gold in both themes; uppercase, letter-spaced, near-sharp.
export const LUX_GOLD_BTN =
  "inline-flex justify-center items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-6 py-3 rounded-sm transition-colors duration-200"

// Ghost CTA: foreground text, gold hairline that warms on hover.
export const LUX_GHOST_BTN =
  "inline-flex justify-center items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--fg)] border border-[var(--hair)] hover:border-[var(--gold)] hover:text-[var(--gold-soft)] px-6 py-3 rounded-sm transition-colors duration-200"
