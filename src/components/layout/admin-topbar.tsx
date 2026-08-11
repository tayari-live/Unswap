"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Search, ChevronDown, User, Settings, LogOut, Home, ArrowLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { NotificationBell } from "./notification-bell"
import { ThemeToggle } from "@/components/theme/theme-toggle"

type SearchResults = {
  members: { id: string; fullName: string; email: string; avatarInitials: string }[]
  listings: { id: string; title: string; city: string; country: string }[]
  swaps: { id: string; label: string }[]
}

/**
 * Desktop-only top bar: brand, global search, notifications, and the account
 * menu. Account UI lives here rather than in `AdminSidebar` so it exists in
 * exactly one place instead of being duplicated between rail and bar.
 */
export function AdminTopbar({
  name,
  initials,
  image,
}: {
  name: string
  initials: string
  image: string | null
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults(null)
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
        if (res.ok) setResults(await res.json())
      } catch {
        /* ignore */
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  function goToMember(fullName: string) {
    setSearchOpen(false)
    setQuery("")
    router.push(`/members?q=${encodeURIComponent(fullName)}`)
  }

  const hasResults = results && (results.members.length > 0 || results.listings.length > 0 || results.swaps.length > 0)

  return (
    <header className="hidden md:flex items-center gap-6 h-16 px-6 bg-[var(--navy)] text-white border-b border-white/10 flex-shrink-0">
      <Link href="/overview" className="font-sans font-bold text-sm tracking-[0.14em] flex-shrink-0">
        UNSWAP <span className="text-white/50 font-medium">ADMIN</span>
      </Link>

      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSearchOpen(true)
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search members, properties, exchanges…"
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/10 border border-transparent text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--gold)] focus:bg-white/15 transition-colors"
        />
        {searchOpen && query.trim() && (
          <div className="absolute top-full left-0 mt-2 w-full bg-surface text-[var(--fg)] rounded-xl border border-[var(--border)] shadow-lg overflow-hidden max-h-96 overflow-y-auto z-50">
            {!hasResults ? (
              <p className="px-4 py-6 text-center text-sm text-neutral">No matches for “{query.trim()}”.</p>
            ) : (
              <>
                {results!.members.length > 0 && (
                  <SearchGroup label="Members">
                    {results!.members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => goToMember(m.fullName)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--parchment)] transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[var(--navy)]/10 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {m.avatarInitials}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium truncate">{m.fullName}</span>
                          <span className="block text-xs text-neutral truncate">{m.email}</span>
                        </span>
                      </button>
                    ))}
                  </SearchGroup>
                )}
                {results!.listings.length > 0 && (
                  <SearchGroup label="Properties">
                    {results!.listings.map((l) => (
                      <Link
                        key={l.id}
                        href="/listings"
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--parchment)] transition-colors"
                      >
                        <Home size={14} className="text-neutral flex-shrink-0" />
                        <span className="text-sm truncate">
                          {l.title} <span className="text-neutral">· {l.city}, {l.country}</span>
                        </span>
                      </Link>
                    ))}
                  </SearchGroup>
                )}
                {results!.swaps.length > 0 && (
                  <SearchGroup label="Swap requests">
                    {results!.swaps.map((s) => (
                      <Link
                        key={s.id}
                        href="/swaps"
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--parchment)] transition-colors"
                      >
                        <ArrowLeftRight size={14} className="text-neutral flex-shrink-0" />
                        <span className="text-sm truncate">{s.label}</span>
                      </Link>
                    ))}
                  </SearchGroup>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <NotificationBell
          buttonClassName="relative w-9 h-9 rounded-full text-white/80 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
          panelClassName="absolute top-full right-0 mt-2 w-80 bg-surface rounded-xl shadow-lg border border-[var(--border)] z-50 overflow-hidden"
        />

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="w-7 h-7 rounded-full bg-white/10 border border-[var(--gold)]/50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold">{initials || "A"}</span>
              )}
            </span>
            <span className="text-sm font-medium hidden lg:inline">{name || "Administrator"}</span>
            <ChevronDown size={14} className={cn("text-white/50 transition-transform", profileOpen && "rotate-180")} />
          </button>

          {profileOpen && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-surface text-[var(--fg)] rounded-xl border border-[var(--border)] shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[var(--hair)]">
                <div className="text-sm font-semibold truncate">{name || "Administrator"}</div>
                <div className="text-xs text-neutral">Administrator</div>
              </div>
              <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--parchment)] transition-colors">
                <User size={15} className="text-neutral" /> My Profile
              </Link>
              <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--parchment)] transition-colors">
                <Settings size={15} className="text-neutral" /> Admin Settings
              </Link>
              {/* ThemeToggle defaults to the navy rail's white-on-dark styling;
                  restyled here for this light dropdown surface. */}
              <ThemeToggle className="w-full rounded-none px-4 py-2.5 text-sm font-normal text-[var(--fg)] hover:bg-[var(--parchment)] hover:text-[var(--fg)]" />
              <div className="border-t border-[var(--hair)]" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition-colors"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function SearchGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1.5">
      <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral">{label}</div>
      {children}
    </div>
  )
}
