"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { UserCircle, Settings, LogOut, BadgeCheck, Clock, ShieldAlert, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import { memberNavigation } from "./member-nav-items"

// These live in the bottom account menu, not the main nav list.
const ACCOUNT_ITEMS = new Set(["Profile", "Subscription", "Settings", "Notifications"])

const VERIFY: Record<string, { label: string; tone: string; icon: typeof BadgeCheck }> = {
  FULLY_VERIFIED: { label: "Verified", tone: "text-[var(--teal)]", icon: BadgeCheck },
  PENDING_ID_REVIEW: { label: "In review", tone: "text-[var(--gold)]", icon: Clock },
}

export function MemberSidebar({
  name,
  initials,
  image,
  verificationStatus,
}: {
  name: string
  initials: string
  image: string | null
  verificationStatus: string
}) {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)
  const [notifs, setNotifs] = useState(0)
  const [collapsed, setCollapsed] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)

  // Poll unread messages + new-activity counts for the two badges — only while
  // the tab is visible, at a relaxed cadence (also the app-wide presence beat).
  const load = useCallback(async () => {
    try {
      const [m, n] = await Promise.all([
        fetch("/api/conversations?count=1", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/member-notifications", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      ])
      if (m) setUnread(m.unread ?? 0)
      if (n) setNotifs(n.unread ?? 0)
    } catch {
      /* ignore */
    }
  }, [pathname])
  // Refresh badges on mount and whenever the route changes (e.g. after visiting
  // the notifications page clears it); the interval handles ongoing updates.
  useEffect(() => { load() }, [load])
  useVisiblePolling(load, 20000, { immediate: false })

  // Collapsing the rail (mouse leave) closes the account menu too.
  useEffect(() => {
    if (collapsed) setAccountOpen(false)
  }, [collapsed])

  const mainNav = memberNavigation.filter((i) => !ACCOUNT_ITEMS.has(i.name))
  const notificationsItem = memberNavigation.find((i) => i.name === "Notifications")
  const v = VERIFY[verificationStatus]

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
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 pt-5 pb-4 overflow-hidden">
        <Image src="/unswap-logo.png" alt="UnSwap" width={80} height={80} priority className="w-9 h-9 flex-shrink-0 object-contain" />
        <span className={cn("font-display font-bold text-xl text-white", label(!collapsed))}>UnSwap</span>
      </Link>

      <div className="mx-4 h-px bg-white/10" />

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {mainNav.map((item) => {
          // Home matches exactly so it doesn't stay active on /dashboard/*.
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/")
          const badge = item.name === "Messages" ? unread : 0

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
              {/* Gold accent bar on the active item */}
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--gold)]" />}
              <item.icon
                size={20}
                className={cn("flex-shrink-0 transition-colors", isActive ? "text-[var(--gold)]" : "text-white/40 group-hover:text-white/70")}
              />
              <span className={cn("flex-1", label(!collapsed))}>{item.name}</span>
              {badge > 0 && (
                <span
                  className={cn(
                    "rounded-full bg-[var(--gold)] text-[var(--navy)] font-bold flex items-center justify-center shadow-sm",
                    collapsed ? "absolute top-1 left-7 w-3 h-3 min-w-3 p-0 text-[0px]" : "ml-auto min-w-5 h-5 px-1.5 text-[11px]",
                  )}
                >
                  {collapsed ? "" : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Account footer */}
      <div className="mt-auto border-t border-white/10 bg-black/20 p-2 relative">
        {/* Inline account menu (opens upward, stays inside the rail) */}
        {accountOpen && !collapsed && (
          <div className="mb-1.5 space-y-0.5">
            {notificationsItem && (
              <AccountLink href={notificationsItem.href} icon={notificationsItem.icon} label="Notifications" badge={notifs} active={pathname.startsWith("/dashboard/notifications")} />
            )}
            <AccountLink href="/dashboard/profile" icon={UserCircle} label="Profile" active={pathname.startsWith("/dashboard/profile")} />
            <AccountLink href="/dashboard/settings" icon={Settings} label="Settings" active={pathname.startsWith("/dashboard/settings")} />
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
              <span className="text-xs font-bold text-white">{initials || "M"}</span>
            )}
            {/* Collapsed: dot when there's any account-area activity */}
            {collapsed && notifs > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--gold)] border border-[var(--navy-dark)]" />}
          </span>
          <span className={cn("flex-1 min-w-0 text-left", label(!collapsed))}>
            <span className="block text-[13px] font-bold text-white truncate">{name || "Member"}</span>
            {v ? (
              <span className={cn("flex items-center gap-1 text-[11px] font-semibold", v.tone)}>
                <v.icon size={11} /> {v.label}
              </span>
            ) : (
              <Link href="/verify-identity" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[11px] font-semibold text-[var(--gold)] hover:underline">
                <ShieldAlert size={11} /> Verify now
              </Link>
            )}
          </span>
          <ChevronDown size={16} className={cn("text-white/40 flex-shrink-0 transition-transform", label(!collapsed), accountOpen && "rotate-180")} />
        </button>
      </div>
    </div>
  )
}

function AccountLink({
  href,
  icon: Icon,
  label,
  active,
  badge = 0,
}: {
  href: string
  icon: typeof UserCircle
  label: string
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 py-2.5 px-3 rounded-xl text-[13px] font-semibold transition-colors",
        active ? "bg-white/10 text-white ring-1 ring-inset ring-white/10" : "text-white/70 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon size={18} className={cn("flex-shrink-0", active ? "text-[var(--gold)]" : "text-white/40")} />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="min-w-5 h-5 px-1.5 rounded-full bg-[var(--gold)] text-[var(--navy)] text-[11px] font-bold flex items-center justify-center">{badge}</span>
      )}
    </Link>
  )
}
