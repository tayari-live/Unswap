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
      className={cn("flex flex-col bg-white border-r border-border h-full transition-all duration-300 shadow-[2px_0_15px_rgba(0,0,0,0.04)] z-20 relative", collapsed ? "w-20" : "w-64")}
    >
      <div className="pt-6 pb-2" />

      <nav className="flex-1 px-3 pb-6 space-y-1.5 overflow-y-auto no-scrollbar">
        {memberNavigation.filter(item => item.name !== "Settings").map((item) => {
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
                  "flex items-center gap-3 py-3 px-3 mx-1 rounded-xl text-[13px] font-bold text-navy/20 cursor-not-allowed select-none overflow-hidden"
                )}
                aria-disabled="true"
              >
                <span className="flex items-center gap-3 flex-1 min-w-0">
                  <item.icon size={20} className="text-navy/20 flex-shrink-0" />
                  <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300", collapsed ? "max-w-0 opacity-0" : "max-w-[150px] opacity-100")}>
                    {item.name}
                  </span>
                </span>
                <span className={cn("text-[9px] font-bold uppercase tracking-wide text-navy/20 transition-all duration-300 overflow-hidden", collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[40px] opacity-100 ml-2")}>
                  Soon
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 py-3 px-3 mx-1 rounded-xl text-[13px] font-bold transition-all duration-200 overflow-hidden",
                isActive
                  ? "bg-navy text-white shadow-md border border-navy"
                  : "text-navy/60 hover:bg-navy/5 hover:text-navy"
              )}
            >
              <item.icon size={20} className={cn("flex-shrink-0 transition-colors", isActive ? "text-gold" : "text-navy/40")} />
              <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300 flex-1", collapsed ? "max-w-0 opacity-0" : "max-w-[150px] opacity-100")}>
                {item.name}
              </span>
              
              {item.name === "Messages" && unread > 0 && (
                <span
                  className={cn(
                    "rounded-full bg-gold text-navy font-bold flex items-center justify-center transition-all duration-300 overflow-hidden shadow-sm",
                    collapsed ? "absolute top-1 left-7 w-3 h-3 min-w-3 p-0 text-[0px]" : "ml-auto min-w-5 h-5 px-1.5 text-[11px]"
                  )}
                >
                  {collapsed ? "" : unread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {(() => {
        const settingsItem = memberNavigation.find(i => i.name === "Settings");
        if (!settingsItem) return null;
        
        const isSettingsActive = pathname === settingsItem.href || pathname.startsWith(settingsItem.href + "/");
        
        return (
          <div className="mt-auto p-3 bg-navy-dark shadow-[0_-4px_20px_rgba(11,31,58,0.1)] relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10" />
            <Link
              href={settingsItem.href}
              title={collapsed ? "Settings" : undefined}
              className={cn(
                "flex items-center gap-3 py-3 px-3 mx-1 rounded-xl text-[13px] font-bold transition-all duration-200 overflow-hidden mt-1",
                isSettingsActive
                  ? "bg-white/10 text-white shadow-md border border-white/5"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <settingsItem.icon size={20} className={cn("flex-shrink-0 transition-colors", isSettingsActive ? "text-gold" : "text-white/50")} />
              <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300", collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100")}>
                Settings
              </span>
            </Link>
          </div>
        );
      })()}
    </div>
  )
}
