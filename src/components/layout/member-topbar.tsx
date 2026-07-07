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
      className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
    >
      <Bell size={17} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[var(--gold-dark)] text-white text-[10px] font-bold flex items-center justify-center">
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
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[var(--navy)] border-b border-white/10 h-20 relative">
      <Logo wordClassName="text-white" href="/dashboard" />

      <div className="flex items-center gap-3 relative" ref={ref}>
        <NotificationBell />
        {/* Verification status chip — constant awareness + one-tap to verify */}
        {verificationStatus === "FULLY_VERIFIED" ? (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--teal)] bg-[var(--teal)]/15 px-2.5 py-1 rounded-full">
            <BadgeCheck size={13} /> Verified
          </span>
        ) : verificationStatus === "PENDING_ID_REVIEW" ? (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--gold)] bg-white/10 px-2.5 py-1 rounded-full">
            <Clock size={13} /> In review
          </span>
        ) : (
          <Link
            href="/verify-identity"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-2.5 py-1 rounded-full transition-colors"
          >
            <ShieldAlert size={13} /> Verify
          </Link>
        )}
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-white leading-none">{name}</div>
          <div className="text-[10px] uppercase font-medium text-white/50 mt-1 tracking-wider">
            Member
          </div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-[var(--gold)]/40 hover:ring-2 hover:ring-[var(--gold)] hover:ring-offset-1 hover:ring-offset-[var(--navy)] transition-all"
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
