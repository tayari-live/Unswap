"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { memberNavigation } from "./member-nav-items"

export function MemberSidebar() {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)
  const [collapsed, setCollapsed] = useState(true)

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
    <div 
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={cn("flex flex-col bg-[var(--navy)] border-r border-white/10 h-full transition-all duration-300", collapsed ? "w-20" : "w-64")}
    >
      <div className="pt-6 pb-2" />

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
                title={collapsed ? "Coming soon" : undefined}
                className={cn(
                  "flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium text-white/30 cursor-not-allowed select-none",
                  collapsed ? "justify-center px-0" : "justify-between px-3"
                )}
                aria-disabled="true"
              >
                <span className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                  <item.icon size={20} className="text-white/25" />
                  {!collapsed && item.name}
                </span>
                {!collapsed && (
                  <span className="text-[9px] font-bold uppercase tracking-wide text-white/30">
                    Soon
                  </span>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0 relative" : "px-3",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-[var(--gold)]" : "text-white/50")} />
              {!collapsed && item.name}
              
              {item.name === "Messages" && unread > 0 && (
                <span
                  className={cn(
                    "min-w-5 h-5 px-1.5 rounded-full bg-[var(--gold-dark)] text-white text-[11px] font-bold flex items-center justify-center",
                    collapsed ? "absolute top-1 right-1 w-3 h-3 min-w-3 p-0 text-[0px]" : "ml-auto"
                  )}
                >
                  {collapsed ? "" : unread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>


    </div>
  )
}
