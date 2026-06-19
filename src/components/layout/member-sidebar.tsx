"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { memberNavigation } from "./member-nav-items"

export function MemberSidebar() {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)

  // Poll the unread-message count for the Messages badge.
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch("/api/conversations?count=1", { cache: "no-store" })
        if (res.ok && active) setUnread((await res.json()).unread ?? 0)
      } catch {
        /* ignore */
      }
    }
    load()
    const t = setInterval(load, 10000)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [pathname])

  return (
    <div className="flex flex-col w-64 bg-[var(--navy)] border-r border-white/10 h-full">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--teal-light)]">
          <span className="w-2 h-2 rounded-full bg-[var(--teal)] flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--teal)]">
            Member Workspace
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 pb-6 space-y-1 overflow-y-auto">
        {memberNavigation.map((item) => {
          // Home matches exactly so it doesn't stay active on /dashboard/*.
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/")

          if (!item.live) {
            return (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/30 cursor-not-allowed select-none"
                aria-disabled="true"
                title="Coming soon"
              >
                <span className="flex items-center gap-3">
                  <item.icon size={20} className="text-white/25" />
                  {item.name}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-white/30">
                  Soon
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-[var(--gold)]" : "text-white/50")} />
              {item.name}
              {item.name === "Messages" && unread > 0 && (
                <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-[var(--gold-dark)] text-white text-[11px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 pb-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] leading-snug text-white/60">
            Independent, staff-led platform. Not affiliated with the United Nations.
          </p>
        </div>
      </div>
    </div>
  )
}
