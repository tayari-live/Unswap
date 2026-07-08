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
      className={cn("flex flex-col bg-white border-r border-border h-full transition-all duration-300 shadow-[2px_0_15px_rgba(0,0,0,0.04)] z-20 relative", collapsed ? "w-20" : "w-64")}
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
                  ? "bg-navy text-white shadow-md border border-navy"
                  : "text-navy/60 hover:bg-navy/5 hover:text-navy"
              )}
            >
              <item.icon size={20} className={cn("flex-shrink-0 transition-colors", isActive ? "text-gold" : "text-navy/40")} />
              <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300", collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100")}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto p-3 bg-navy-dark shadow-[0_-4px_20px_rgba(11,31,58,0.1)] relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10" />
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 py-3 px-3 mx-1 rounded-xl text-[13px] font-bold transition-all duration-200 overflow-hidden mt-1",
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "bg-white/10 text-white shadow-md border border-white/5"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings size={20} className={cn("flex-shrink-0 transition-colors", pathname === "/settings" || pathname.startsWith("/settings/") ? "text-gold" : "text-white/50")} />
          <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300", collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100")}>
            Settings
          </span>
        </Link>
      </div>
    </div>
  )
}
