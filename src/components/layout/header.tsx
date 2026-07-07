"use client"

import { LogOut } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { useProfile } from "@/context/profile-context"
import { NotificationBell } from "@/components/layout/notification-bell"
import Image from "next/image"

export function Header() {
  const { profile } = useProfile()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-[var(--border)] h-20 relative z-30 shadow-sm">
      <Link href="/overview" className="flex items-center gap-2.5">
        <Image
          src="/unswap-logo.png"
          alt="UnSwap Logo"
          width={56}
          height={56}
          className="w-10 h-10 sm:w-14 sm:h-14 object-contain rounded-lg flex-shrink-0"
          priority
        />
        <div className="flex flex-col leading-none">
          <span className="font-display font-bold text-[var(--navy)] text-2xl sm:text-3xl tracking-tight">UnSwap</span>
          <span className="text-[9px] uppercase tracking-widest text-[var(--gold)] font-bold mt-1">Admin Console</span>
        </div>
      </Link>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-neutral-dark">
          <NotificationBell />
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-[var(--border)] relative" ref={dropdownRef}>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-[var(--navy)] leading-none">{profile.name}</div>
            <div className="text-[10px] uppercase font-bold text-neutral mt-1.5 tracking-wider">
              Verification Officer
            </div>
          </div>

          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-10 w-10 rounded-full bg-[var(--parchment)] flex items-center justify-center overflow-hidden border-2 border-[var(--border)] hover:border-[var(--gold)] hover:shadow-md transition-all ml-2"
          >
            {profile.image ? (
              <img src={profile.image} alt="User Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-[var(--navy)]">{profile.initials || "UA"}</span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-surface rounded-xl shadow-lg border border-[var(--border)] py-1 z-50">
              <div className="px-4 py-2 border-b border-[var(--border)] sm:hidden">
                <div className="text-sm font-semibold text-[var(--navy)] truncate">{profile.name}</div>
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
      </div>
    </header>
  )
}
