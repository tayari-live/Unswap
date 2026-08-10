"use client"

import { cn } from "@/lib/utils"

/** Pill-group filter, shared across admin list/table pages. Scrolls horizontally
 *  rather than wrapping, so it never breaks a page's layout on narrow screens. */
export function FilterTabs({
  options,
  value,
  onChange,
  className,
}: {
  options: { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
  className?: string
}) {
  return (
    <div className={cn("flex gap-1 bg-surface border border-[var(--navy)]/10 rounded-xl p-1 overflow-x-auto", className)}>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition",
            value === o.key ? "bg-[var(--navy)] text-white" : "text-neutral-dark hover:bg-neutral-light",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
