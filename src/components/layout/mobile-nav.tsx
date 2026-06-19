"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { adminNavigation } from "./nav-items"

// Keep the bottom bar uncramped: show this many tabs inline, the rest go under "More".
const MAX_INLINE = 4

export function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const hasOverflow = adminNavigation.length > MAX_INLINE
  const inline = hasOverflow ? adminNavigation.slice(0, MAX_INLINE) : adminNavigation
  const overflow = hasOverflow ? adminNavigation.slice(MAX_INLINE) : []
  const overflowActive = overflow.some((i) => isActive(i.href))

  const itemClass = (active: boolean) =>
    cn(
      "flex flex-col items-center justify-center gap-1 w-16 transition-colors",
      active ? "text-white" : "text-white/60 hover:text-white"
    )

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--navy)] border-t border-white/10 pb-safe z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.25)]">
      <nav className="flex justify-around items-center px-2 py-3">
        {inline.map((item) => {
          const active = isActive(item.href)
          return (
            <Link key={item.name} href={item.href} className={itemClass(active)}>
              <item.icon size={20} className={cn(active ? "text-[var(--gold)]" : "text-white/50")} />
              <span className="text-[9px] font-bold uppercase tracking-wide text-center leading-tight">{item.name}</span>
            </Link>
          )
        })}

        {overflow.length > 0 && (
          <div className="relative" ref={moreRef}>
            <button onClick={() => setMoreOpen((v) => !v)} className={itemClass(overflowActive)}>
              <MoreHorizontal size={20} className={cn(overflowActive ? "text-[var(--gold)]" : "text-white/50")} />
              <span className="text-[9px] font-bold uppercase tracking-wide text-center leading-tight">More</span>
            </button>

            {moreOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-44 bg-white rounded-xl border border-[var(--border)] shadow-lg py-1 overflow-hidden">
                {overflow.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors",
                        active ? "bg-[var(--teal-light)] text-[var(--navy)]" : "text-neutral-dark hover:bg-neutral-light"
                      )}
                    >
                      <item.icon size={18} className={cn(active ? "text-[var(--gold-dark)]" : "text-neutral")} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  )
}
