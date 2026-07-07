"use client"

import { useState } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { adminNavigation } from "./nav-items"
import { Settings } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div 
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={cn("flex flex-col bg-white border-r border-[var(--border)] h-full transition-all duration-300 shadow-[2px_0_15px_rgba(0,0,0,0.03)] z-20 relative", collapsed ? "w-20" : "w-64")}
    >
      <div className="pt-6 pb-2" />

      <nav className="flex-1 px-3 pb-6 space-y-1.5 overflow-y-auto no-scrollbar">
        {adminNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 py-3 px-3 mx-1 rounded-xl text-[13px] font-bold transition-all duration-200 overflow-hidden",
                isActive
                  ? "bg-[var(--navy)] text-white shadow-md"
                  : "text-neutral-dark hover:bg-neutral-light/50 hover:text-[var(--navy)]"
              )}
            >
              <item.icon size={20} className={cn("flex-shrink-0 transition-colors", isActive ? "text-[var(--gold)]" : "text-neutral")} />
              <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300", collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100")}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-[var(--border)] p-3 bg-white">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 py-3 px-3 mx-1 rounded-xl text-[13px] font-bold transition-all duration-200 overflow-hidden",
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "bg-[var(--navy)] text-white shadow-md"
              : "text-neutral-dark hover:bg-neutral-light/50 hover:text-[var(--navy)]"
          )}
        >
          <Settings size={20} className={cn("flex-shrink-0 transition-colors", pathname === "/settings" || pathname.startsWith("/settings/") ? "text-[var(--gold)]" : "text-neutral")} />
          <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300", collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100")}>
            Settings
          </span>
        </Link>
      </div>
    </div>
  )
}
