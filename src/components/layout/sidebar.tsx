"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { adminNavigation } from "./nav-items"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-[var(--navy)] border-r border-white/10 h-full">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--teal-light)]">
          <span className="w-2 h-2 rounded-full bg-[var(--teal)] flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--teal)]">
            Admin Workspace
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 pb-6 space-y-1 overflow-y-auto">
        {adminNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
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
