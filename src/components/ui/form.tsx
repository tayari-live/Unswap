/*
 * Form primitives.
 *
 * These were previously redefined in five separate files, which is how the
 * label styling drifted into three different treatments. Defining them once
 * means a change to the field spec is a change here.
 *
 * Sizes follow the brand system: 48px control height, 10px radius, labels at
 * 16/500, helper text at 14/400, and validation at 14/500.
 */

/** Text input, select, and anything else a single line tall. */
export const FIELD =
  "block w-full h-12 px-4 border border-[var(--border)] rounded-[10px] bg-[var(--card)] " +
  "text-base text-[var(--foreground)] placeholder:text-[var(--muted)] " +
  "focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/25 " +
  "disabled:opacity-60 disabled:cursor-not-allowed transition-colors"

/** Multi-line input. Height rather than rows, so the 120px minimum is explicit. */
export const TEXTAREA =
  "block w-full min-h-[120px] px-4 py-3 border border-[var(--border)] rounded-[10px] bg-[var(--card)] " +
  "text-base text-[var(--foreground)] placeholder:text-[var(--muted)] " +
  "focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/25 " +
  "disabled:opacity-60 disabled:cursor-not-allowed transition-colors"

/** Field label. Sentence case at 16/500 — not an uppercase micro-label. */
export const LABEL = "block text-base font-medium text-[var(--foreground)] mb-2"

/** Guidance shown before the user acts, so a field never relies on a placeholder. */
export const HELP = "mt-1.5 text-sm text-[var(--muted)] leading-relaxed"

/** Validation message shown after the user acts. */
export const ERROR = "mt-1.5 text-sm font-medium text-[var(--destructive)]"

/**
 * A labelled field with optional helper and error text.
 *
 * `htmlFor` is required rather than optional: a label that points at nothing is
 * invisible to a screen reader, and making it a parameter is the cheapest way
 * to stop that happening by omission.
 */
export function Field({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string
  label: string
  help?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children}
      {/* Errors replace helper text rather than stacking, so the field never
          shows advice and a correction at the same time. */}
      {error ? (
        <p className={ERROR} role="alert">{error}</p>
      ) : help ? (
        <p className={HELP}>{help}</p>
      ) : null}
    </div>
  )
}
