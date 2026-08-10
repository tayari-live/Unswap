"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { adminNavigation } from "./nav-items"

// Admin console rail — fixed-width, grouped sections, no hover-collapse or
// account menu (both moved to AdminTopbar so the brand/account UI isn't
// duplicated between the rail and the top bar). Deliberately plainer than the
// old expand-on-hover version: an operations console reads as calm and
// structured, not as another piece of editorial chrome.
export function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <div
      className={cn(
        "flex flex-col h-full w-60 flex-shrink-0 text-white",
        "bg-gradient-to-b from-[var(--navy)] to-[var(--navy-dark)]",
        "border-r border-white/10",
      )}
    >
      <nav className="flex-1 px-3 py-5 overflow-y-auto no-scrollbar">
        {adminNavigation.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 py-2.5 px-3 rounded-sm text-[14px] font-medium transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-[var(--gold)]/20 via-[var(--gold)]/8 to-transparent text-white ring-1 ring-inset ring-[var(--gold)]/25"
                        : "text-white/60 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-[var(--gold)]" />}
                    <item.icon
                      size={18}
                      strokeWidth={1.6}
                      className={cn("flex-shrink-0 transition-colors", active ? "text-[var(--gold)]" : "text-white/40 group-hover:text-white/70")}
                    />
                    <span className="flex-1">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}
