import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

const TONE = {
  success: { icon: "text-[var(--teal)]", roundel: "bg-[var(--teal)]/15 text-[var(--teal)]" },
  neutral: { icon: "text-neutral", roundel: "bg-neutral-light text-neutral-dark" },
}

/**
 * Shared "nothing here" state for admin lists/tables/queues.
 *
 * `bare` drops all card chrome — for a `<td>` empty row or a list that already
 * sits inside its own bordered container. `iconVariant="bare"` (default when an
 * icon is passed with no roundel) mirrors the plain icon-above-text layout the
 * verification queue used; `"roundel"` wraps it in a tinted box like moderation.
 */
export function EmptyState({
  icon: Icon,
  iconVariant = "roundel",
  title,
  description,
  tone = "neutral",
  padding = "lg",
  bare = false,
  className,
}: {
  icon?: LucideIcon
  iconVariant?: "bare" | "roundel"
  title?: string
  description: string
  tone?: "success" | "neutral"
  padding?: "sm" | "lg"
  bare?: boolean
  className?: string
}) {
  if (bare) {
    return <p className={cn("text-center text-sm text-neutral py-8", className)}>{description}</p>
  }

  const t = TONE[tone]

  return (
    <div
      className={cn(
        "bg-surface rounded-md border border-[var(--navy)]/10 text-center",
        padding === "lg" ? "p-12" : "p-10",
        className,
      )}
    >
      {Icon && iconVariant === "roundel" && (
        <div className={cn("mx-auto w-14 h-14 rounded-md flex items-center justify-center mb-4", t.roundel)}>
          <Icon size={26} />
        </div>
      )}
      {Icon && iconVariant === "bare" && <Icon className={cn("mx-auto mb-3", t.icon)} size={40} />}
      {title && (
        <p className={cn("font-display font-light text-[var(--fg)]", iconVariant === "bare" ? "text-xl" : "text-2xl")}>
          {title}
        </p>
      )}
      <p className={cn("text-sm text-neutral", title ? "mt-1" : "")}>{description}</p>
    </div>
  )
}
