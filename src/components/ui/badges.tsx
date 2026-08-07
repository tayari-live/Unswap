import { cn } from "@/lib/utils"

/*
 * Status tones. Named for meaning rather than colour, so the palette can move
 * without every call site having to. `teal` is retained as an alias for
 * `success` because older markup still asks for it by name.
 */
type Tone = "navy" | "gold" | "success" | "warning" | "destructive" | "neutral" | "teal" | "crimson"

const toneClasses: Record<Tone, string> = {
  navy: "bg-[var(--navy)]/10 text-[var(--fg)]",
  gold: "bg-[var(--gold)]/15 text-[var(--gold-dark)]",
  success: "bg-[var(--color-success)]/12 text-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  destructive: "bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]",
  neutral: "bg-neutral-light text-neutral-dark",
  // Aliases.
  teal: "bg-[var(--color-success)]/12 text-[var(--color-success)]",
  crimson: "bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]",
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

// Maps a member's verification status to a labelled, toned badge.
const VERIFICATION_TONE: Record<string, { tone: Tone; label: string }> = {
  PENDING_EMAIL: { tone: "neutral", label: "Pending email" },
  EMAIL_VERIFIED: { tone: "gold", label: "Email verified" },
  PENDING_ID_REVIEW: { tone: "gold", label: "ID review" },
  FULLY_VERIFIED: { tone: "teal", label: "Verified" },
  REJECTED: { tone: "crimson", label: "Rejected" },
  SUSPENDED: { tone: "crimson", label: "Suspended" },
}

export function VerificationBadge({ status }: { status: string }) {
  const v = VERIFICATION_TONE[status] ?? { tone: "neutral" as Tone, label: status }
  return <Badge tone={v.tone}>{v.label}</Badge>
}

// Generic status badge for listings / swaps.
const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: "teal",
  CONFIRMED: "teal",
  COMPLETED: "teal",
  IN_PROGRESS: "navy",
  ACCEPTED: "navy",
  REQUESTED: "gold",
  COUNTER_OFFERED: "gold",
  DRAFT: "neutral",
  PAUSED: "gold",
  ARCHIVED: "neutral",
  CANCELLED: "crimson",
  pending: "gold",
  invited: "navy",
  converted: "teal",
}

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral"
  return <Badge tone={tone}>{status.replace(/_/g, " ").toLowerCase()}</Badge>
}
