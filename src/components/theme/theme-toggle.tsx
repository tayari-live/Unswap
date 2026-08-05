"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

// Light/dark switch for the dashboard rails. Renders a stable placeholder until
// mounted to avoid a hydration mismatch (theme is only known client-side).
export function ThemeToggle({
  collapsed = false,
  className,
}: {
  collapsed?: boolean
  className?: string
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
      className={cn(
        "group flex items-center gap-3 py-2.5 px-3 rounded-xl text-[13px] font-semibold transition-colors overflow-hidden",
        "text-white/60 hover:bg-white/5 hover:text-white",
        className,
      )}
    >
      <span className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
        <Sun
          size={19}
          className={cn(
            "absolute transition-all duration-300 text-[var(--gold)]",
            isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100",
          )}
        />
        <Moon
          size={18}
          className={cn(
            "absolute transition-all duration-300 text-[var(--gold)]",
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50",
          )}
        />
      </span>
      {!collapsed && <span className="flex-1 text-left">{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  )
}

/**
 * Icon-only toggle for public pages (waitlist, login, register), where there is
 * no rail to sit in. Borders and icons use gold so it reads on cream + obsidian.
 */
export function ThemeToggleIcon({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
      className={cn(
        "w-10 h-10 flex items-center justify-center rounded-sm border transition-colors",
        "border-[rgba(201,168,76,0.35)] text-[#c9a84c] hover:border-[#c9a84c] hover:bg-[rgba(201,168,76,0.12)]",
        className,
      )}
    >
      <span className="relative w-5 h-5 flex items-center justify-center">
        <Sun size={18} className={cn("absolute transition-all duration-300", isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100")} />
        <Moon size={17} className={cn("absolute transition-all duration-300", isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50")} />
      </span>
    </button>
  )
}
