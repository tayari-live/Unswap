import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

// Initials/icon chip shared across admin cards, tables, and rows.
const SIZE = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-12 h-12 text-lg",
}

const ICON_SIZE = { sm: 14, md: 16, lg: 20 }

const TONE = {
  navy: "bg-[var(--navy)]/10 text-[var(--fg)]",
  gold: "bg-[var(--gold)]/20 text-[var(--gold-dark)]",
}

export function AvatarInitials({
  initials,
  icon: Icon,
  size = "md",
  tone = "navy",
  className,
}: {
  initials?: string
  icon?: LucideIcon
  size?: "sm" | "md" | "lg"
  tone?: "navy" | "gold"
  className?: string
}) {
  return (
    <span
      className={cn(
        "rounded-xl flex items-center justify-center font-bold flex-shrink-0",
        SIZE[size],
        TONE[tone],
        className,
      )}
    >
      {Icon ? <Icon size={ICON_SIZE[size]} /> : initials}
    </span>
  )
}
