"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Settings, LogOut, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { adminNavigation } from "./nav-items"
import { NotificationBell } from "./notification-bell"

// Admin console rail. Shares the navy visual language of the member sidebar so
// both areas of the app feel like one product.
export function AdminSidebar({
  name,
  initials,
  image,
}: {
  name: string
  initials: string
  image: string | null
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)

  // Collapsing the rail (mouse leave) closes the account menu too.
  useEffect(() => {
    if (collapsed) setAccountOpen(false)
  }, [collapsed])

  const settingsActive = pathname === "/settings" || pathname.startsWith("/settings/")

  const label = (show: boolean) =>
    cn("overflow-hidden whitespace-nowrap transition-all duration-300", show ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0")

  return (
    <div
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={cn(
        // Navy rail: subtle top-to-bottom gradient with a gold hairline on the right edge.
        "flex flex-col h-full transition-all duration-300 relative z-20 text-white",
        "bg-gradient-to-b from-[var(--navy)] to-[var(--navy-dark)]",
        "border-r border-white/10 shadow-[2px_0_24px_rgba(7,23,43,0.35)]",
        "after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gradient-to-b after:from-transparent after:via-[var(--gold)]/40 after:to-transparent",
        collapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo */}
      <Link href="/overview" className="flex items-center gap-2.5 px-5 pt-5 pb-4 overflow-hidden">
        <Image src="/unswap-logo.png" alt="UnSwap" width={80} height={80} priority className="w-9 h-9 flex-shrink-0 object-contain" />
        <span className={cn("font-display font-bold text-xl text-white", label(!collapsed))}>UnSwap</span>
      </Link>

      <div className="mx-4 h-px bg-white/10" />

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {adminNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "group relative flex items-center gap-3 py-3 px-3 mx-1 rounded-xl text-[13px] font-bold transition-all duration-200 overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-[var(--gold)]/25 via-[var(--gold)]/10 to-transparent text-white ring-1 ring-inset ring-[var(--gold)]/25"
                  : "text-white/55 hover:bg-white/5 hover:text-white",
              )}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--gold)]" />}
              <item.icon
                size={20}
                className={cn("flex-shrink-0 transition-colors", isActive ? "text-[var(--gold)]" : "text-white/40 group-hover:text-white/70")}
              />
              <span className={cn("flex-1", label(!collapsed))}>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Account footer */}
      <div className="mt-auto border-t border-white/10 bg-black/20 p-2 relative">
        {/* Notifications bell — opens its dropdown upward, out of the rail */}
        {!collapsed && (
          <div className="flex justify-end px-1 pb-1">
            <NotificationBell
              buttonClassName="relative w-9 h-9 rounded-full text-white/70 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
              panelClassName="absolute bottom-full left-0 mb-2 w-80 bg-surface rounded-xl shadow-lg border border-[var(--border)] z-50 overflow-hidden"
            />
          </div>
        )}

        {/* Inline account menu (opens upward, stays inside the rail) */}
        {accountOpen && !collapsed && (
          <div className="mb-1.5 space-y-0.5">
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 py-2.5 px-3 rounded-xl text-[13px] font-semibold transition-colors",
                settingsActive ? "bg-white/10 text-white ring-1 ring-inset ring-white/10" : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <Settings size={18} className={cn("flex-shrink-0", settingsActive ? "text-[var(--gold)]" : "text-white/40")} />
              <span className="flex-1">Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-[13px] font-semibold text-red-300 hover:bg-red-400/10 hover:text-red-200 transition-colors"
            >
              <LogOut size={18} className="flex-shrink-0" />
              Sign out
            </button>
          </div>
        )}

        {/* Account button */}
        <button
          type="button"
          onClick={() => !collapsed && setAccountOpen((o) => !o)}
          title={collapsed ? name : undefined}
          className="w-full flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/5 transition-colors overflow-hidden"
        >
          <span className="relative w-9 h-9 flex-shrink-0 rounded-full bg-white/10 border-2 border-[var(--gold)]/50 flex items-center justify-center overflow-hidden">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white">{initials || "A"}</span>
            )}
          </span>
          <span className={cn("flex-1 min-w-0 text-left", label(!collapsed))}>
            <span className="block text-[13px] font-bold text-white truncate">{name || "Administrator"}</span>
            <span className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide">Administrator</span>
          </span>
          <ChevronDown size={16} className={cn("text-white/40 flex-shrink-0 transition-transform", label(!collapsed), accountOpen && "rotate-180")} />
        </button>
      </div>
    </div>
  )
}
