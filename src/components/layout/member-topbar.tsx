"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LogOut, BadgeCheck, Clock, ShieldAlert, Bell } from "lucide-react"
import { Logo } from "@/components/brand/logo"

/** Bell linking to the notifications page, with a polled unread-activity badge. */
function NotificationBell() {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch("/api/member-notifications", { cache: "no-store" })
        if (res.ok && active) setUnread((await res.json()).unread ?? 0)
      } catch {
        /* ignore */
      }
    }
    load()
    const t = setInterval(load, 30000)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [pathname]) // re-check on navigation so the badge clears after visiting the page

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={unread > 0 ? `Notifications (${unread} new)` : "Notifications"}
      className="relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors border border-white/5"
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[var(--gold)] text-[var(--navy)] text-[10px] font-bold flex items-center justify-center shadow-sm">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  )
}

export function MemberTopbar({
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
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[var(--navy)] border-b border-white/10 h-20 relative shadow-sm z-30">
      <Logo wordClassName="text-white" href="/dashboard" />

      <div className="flex items-center gap-3 sm:gap-4 relative" ref={ref}>
        <NotificationBell />
        {/* Verification status chip — constant awareness + one-tap to verify */}
        {verificationStatus === "FULLY_VERIFIED" ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase text-[var(--teal)] bg-[var(--teal)]/10 px-3 py-1.5 rounded-full border border-[var(--teal)]/20">
            <BadgeCheck size={14} /> Verified
          </span>
        ) : verificationStatus === "PENDING_ID_REVIEW" ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase text-[var(--gold)] bg-[var(--gold)]/10 px-3 py-1.5 rounded-full border border-[var(--gold)]/20">
            <Clock size={14} /> In review
          </span>
        ) : (
          <Link
            href="/verify-identity"
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-3 py-1.5 rounded-full transition-colors shadow-sm"
          >
            <ShieldAlert size={14} /> Verify
          </Link>
        )}
        <div className="text-right hidden sm:block pl-4 border-l border-white/20">
          <div className="text-sm font-bold text-white leading-none">{name}</div>
          <div className="text-[10px] uppercase font-bold text-white/50 mt-1.5 tracking-wider">
            Member
          </div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-[var(--gold)]/40 hover:border-[var(--gold)] hover:shadow-md transition-all ml-1"
        >
          {image ? (
            <img src={image} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white">{initials || "M"}</span>
          )}
        </button>

        {open && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-surface rounded-xl shadow-lg border border-[var(--border)] py-1 z-50">
            <div className="px-4 py-2 border-b border-[var(--border)] sm:hidden">
              <div className="text-sm font-semibold text-[var(--navy)] truncate">{name}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition-colors text-left"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
