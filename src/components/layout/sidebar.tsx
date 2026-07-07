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
      className={cn("flex flex-col bg-[var(--navy)] border-r border-white/10 h-full transition-all duration-300", collapsed ? "w-20" : "w-64")}
    >
      <div className="pt-6 pb-2" />

      <nav className="flex-1 px-4 pb-6 space-y-1 overflow-y-auto">
        {adminNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-[var(--gold)]" : "text-white/50")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-white/10">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 py-4 w-full text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-6",
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          )}
        >
          <Settings size={20} className={cn(pathname === "/settings" || pathname.startsWith("/settings/") ? "text-[var(--gold)]" : "text-white/50")} />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  )
}
