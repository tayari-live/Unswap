"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect, useCallback } from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import { adminNavigation } from "./nav-items"
import { memberMobileNavigation } from "./member-nav-items"

// Keep the bottom bar uncramped: show this many tabs inline, the rest go under "More".
const MAX_INLINE = 4

export function MobileNav({ variant = "admin" }: { variant?: "admin" | "member" }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const moreRef = useRef<HTMLDivElement>(null)

  const navigation = variant === "member" ? memberMobileNavigation : adminNavigation

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  // Members: poll the unread-message count for the Messages tab badge — only
  // while the tab is visible, at a relaxed cadence (matches the desktop sidebar).
  const load = useCallback(async () => {
    if (variant !== "member") return
    try {
      const res = await fetch("/api/conversations?count=1", { cache: "no-store" })
      if (res.ok) setUnread((await res.json()).unread ?? 0)
    } catch {
      /* ignore */
    }
  }, [variant, pathname])
  useEffect(() => { load() }, [load])
  useVisiblePolling(load, 20000, { immediate: false })

  // The member Home tab matches exactly so it doesn't stay lit on /dashboard/*.
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/")

  const hasOverflow = navigation.length > MAX_INLINE
  const inline = hasOverflow ? navigation.slice(0, MAX_INLINE) : navigation
  const overflow = hasOverflow ? navigation.slice(MAX_INLINE) : []
  const overflowActive = overflow.some((i) => isActive(i.href))

  const itemClass = (active: boolean) =>
    cn(
      "relative flex flex-col items-center justify-center gap-1 w-16 transition-colors",
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
              {item.name === "Messages" && unread > 0 && (
                <span className="absolute -top-1.5 right-2 min-w-4 h-4 px-1 rounded-full bg-[var(--gold-dark)] text-white text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
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
