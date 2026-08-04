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

/** Hairline card: warm surface, thin gold border, minimal radius, no heavy shadow. */
export function LuxCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("bg-[var(--surface)] border border-[var(--hair)] rounded-md", className)}>
      {children}
    </div>
  )
}

/** Editorial page header: gold eyebrow + large light-weight Cormorant title. */
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
        <h1 className="font-display font-light leading-[1.1] tracking-tight text-[var(--fg)] text-[clamp(1.9rem,3.5vw,2.75rem)]">
          {title}
        </h1>
        {subtitle && <p className="text-neutral mt-2 text-sm max-w-xl leading-relaxed">{subtitle}</p>}
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
  "inline-flex justify-center items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#0a0e1a] bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-6 py-3 rounded-sm transition-colors duration-200"

// Ghost CTA: foreground text, gold hairline that warms on hover.
export const LUX_GHOST_BTN =
  "inline-flex justify-center items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--fg)] border border-[var(--hair)] hover:border-[var(--gold)] hover:text-[var(--gold-soft)] px-6 py-3 rounded-sm transition-colors duration-200"
