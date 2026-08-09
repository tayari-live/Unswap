"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Search, ChevronDown, HelpCircle, Menu, X, BadgeCheck, ShieldAlert, Clock,
  Home, MapPin, Sparkles, ArrowLeftRight, CalendarCheck, MessageSquare, Coins,
  UserCircle, CreditCard, Settings, LogOut, type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import { NotificationBell } from "./notification-bell"

/*
 * The logged-in application navbar.
 *
 * Replaces the persistent sidebar. Grouping the member destinations under two
 * dropdowns keeps every one of them reachable while giving listings, maps and
 * message threads the full width of the viewport, which the rail used to take.
 *
 * Inter throughout: this is interface, and Cormorant stays the display voice
 * for page headlines and editorial moments inside the pages themselves.
 */

type Item = { name: string; href: string; icon: LucideIcon; desc?: string; badge?: number }

const EXPLORE: Item[] = [
  { name: "Homes", href: "/dashboard/browse", icon: Home, desc: "Browse available homes" },
  { name: "Destinations", href: "/dashboard/browse?view=destinations", icon: MapPin, desc: "Browse cities and duty stations" },
  { name: "New listings", href: "/dashboard/browse?sort=new", icon: Sparkles, desc: "Recently added to the network" },
]

const VERIFY: Record<string, { label: string; tone: string; icon: LucideIcon }> = {
  FULLY_VERIFIED: { label: "Verified member", tone: "text-[var(--gold-dark)]", icon: BadgeCheck },
  PENDING_ID_REVIEW: { label: "Verification in review", tone: "text-[var(--gold-dark)]", icon: Clock },
}

/**
 * Dropdown that opens on hover and on click.
 *
 * Hover alone strands anyone on a touch laptop or using a keyboard, and a
 * close-on-leave menu is easy to lose by cutting a corner with the pointer —
 * so the click state latches until dismissed.
 */
function NavDropdown({
  label,
  children,
  align = "left",
  width = "w-[300px]",
}: {
  label: string
  children: (close: () => void) => React.ReactNode
  align?: "left" | "right"
  width?: string
}) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => { setOpen(false); setPinned(false) }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    window.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [open, close])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => !pinned && setOpen(false)}
    >
      <button
        type="button"
        onClick={() => { setPinned((p) => !p); setOpen((o) => !o || !pinned) }}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 px-2.5 py-1.5 rounded-lg group",
          open ? "bg-[var(--parchment-dark)] text-navy" : "text-navy hover:bg-[var(--parchment-dark)] bg-transparent",
        )}
      >
        {label}
        <ChevronDown size={15} className={cn("transition-transform duration-150", open ? "text-[var(--gold)] rotate-180" : "text-navy/55 group-hover:text-[var(--gold)]")} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 bg-white border border-navy/10 rounded-[10px] shadow-dropdown overflow-hidden z-dropdown",
            width,
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}

function MenuRow({ item, onClick }: { item: Item; onClick: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-start gap-3 px-4 py-3 bg-white hover:bg-[var(--parchment)] transition-colors group"
    >
      <item.icon size={18} strokeWidth={1.75} className="mt-0.5 flex-shrink-0 text-navy/45 group-hover:text-[var(--gold)] transition-colors" />
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-navy">{item.name}</span>
          {!!item.badge && item.badge > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] inline-block flex-shrink-0" title={`${item.badge} unread`} />
          )}
        </span>
        {item.desc && <span className="block text-xs text-navy/50 group-hover:text-navy/60 mt-0.5 leading-snug transition-colors">{item.desc}</span>}
      </span>
    </Link>
  )
}

export function AppNavbar({
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
  const router = useRouter()
  const [unread, setUnread] = useState(0)
  const [q, setQ] = useState("")
  const [drawer, setDrawer] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Moved here from the sidebar this replaces. Beyond the message badge, this
  // poll is the app-wide presence beat that keeps lastSeenAt fresh, so losing
  // it would quietly break the online indicator in chat.
  const load = useCallback(async () => {
    try {
      const m = await fetch("/api/conversations?count=1", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))
      if (m) setUnread(m.unread ?? 0)
    } catch {
      /* a badge is never worth surfacing an error */
    }
  }, [pathname])
  useEffect(() => { load() }, [load])
  useVisiblePolling(load, 20000, { immediate: false })

  useEffect(() => {
    if (!profileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setProfileOpen(false)
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    window.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [profileOpen])

  // The drawer covers the page, so the page beneath must not scroll with it.
  useEffect(() => {
    if (!drawer) return
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [drawer])

  const MINE: Item[] = [
    { name: "My homes", href: "/dashboard/listings", icon: Home, desc: "Manage your properties" },
    { name: "Swap requests", href: "/dashboard/swaps", icon: ArrowLeftRight, desc: "Incoming and outgoing" },
    { name: "My exchanges", href: "/dashboard/exchanges", icon: CalendarCheck, desc: "Confirmed and completed" },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: unread },
    { name: "Credits", href: "/dashboard/credits", icon: Coins },
  ]

  const v = VERIFY[verificationStatus]

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    router.push(term ? `/dashboard/browse?q=${encodeURIComponent(term)}` : "/dashboard/browse")
    setDrawer(false)
  }

  return (
    <>
      <header className="sticky top-0 z-sticky bg-white border-b border-navy/10">
        <div className="max-w-[1440px] mx-auto flex items-center gap-6 lg:gap-8 px-6 lg:px-10 h-[72px] md:h-[76px]">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="md:hidden -ml-1 p-2 text-navy"
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>

          {/* Permanent brand anchor; returns to the dashboard, not the marketing site. */}
          <Link
            href="/dashboard"
            className="font-sans text-base font-bold tracking-[0.10em] text-navy hover:text-[var(--gold-dark)] transition-colors w-[92px] flex-shrink-0"
          >
            UNSWAP
          </Link>

          {/* Search sits before Explore on purpose: it serves the visitor who
              already knows what they want, which is the more common case. */}
          <form onSubmit={submitSearch} className="hidden md:block flex-shrink min-w-0 w-[300px] lg:w-[400px]">
            <label htmlFor="app-search" className="sr-only">Search homes, cities or duty stations</label>
            <div className="relative group">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45 pointer-events-none" />
              <input
                id="app-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search homes, cities or duty stations"
                className="w-full h-[44px] pl-10 pr-4 rounded-lg bg-[var(--navy)] border-2 border-transparent text-sm text-white placeholder:text-white/45 hover:placeholder:text-white/60 focus:outline-none focus:border-[var(--gold)] focus:ring-0 transition-colors"
              />
            </div>
          </form>

          <nav className="hidden md:flex items-center gap-5 lg:gap-7">
            <NavDropdown label="Explore" width="w-[340px]">
              {(close) => (
                <div className="py-1.5">
                  {EXPLORE.map((i) => <MenuRow key={i.name} item={i} onClick={close} />)}
                </div>
              )}
            </NavDropdown>
            
            <NavDropdown label="My UnSwap" width="w-[340px]">
              {(close) => (
                <div className="py-1.5">
                  {MINE.map((i) => <MenuRow key={i.name} item={i} onClick={close} />)}
                  <div className="h-px bg-navy/10 my-1.5" />
                  <MenuRow item={{ name: "Membership", href: "/dashboard/subscription", icon: CreditCard }} onClick={close} />
                </div>
              )}
            </NavDropdown>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <NotificationBell
              buttonClassName="relative w-10 h-10 rounded-lg text-navy/60 hover:text-[var(--gold-dark)] hover:bg-[var(--parchment)] flex items-center justify-center transition-colors"
              panelClassName="absolute right-0 top-full mt-1 w-80 bg-white rounded-[12px] shadow-dropdown border border-navy/10 z-dropdown overflow-hidden"
              dotClassName="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[var(--gold)]"
            />

            <Link
              href="/dashboard/settings"
              aria-label="Help and support"
              title="Help and support"
              className="hidden sm:inline-flex w-10 h-10 rounded-lg text-navy/60 hover:text-[var(--gold-dark)] hover:bg-[var(--parchment)] items-center justify-center transition-colors"
            >
              <HelpCircle size={19} strokeWidth={1.75} />
            </Link>

            {/* Profile */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
                className={cn(
                  "inline-flex items-center gap-2 pl-1 pr-1.5 sm:pr-2.5 py-1 rounded-lg transition-colors group",
                  profileOpen ? "bg-[var(--parchment-dark)]" : "hover:bg-[var(--parchment-dark)] bg-transparent",
                )}
              >
                <span className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center overflow-hidden flex-shrink-0">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] font-bold text-navy">{initials || "M"}</span>
                  )}
                </span>
                <span className="hidden lg:block text-sm font-medium text-navy max-w-[110px] truncate">
                  {name?.split(" ")[0] || "Member"}
                </span>
                <ChevronDown size={14} className={cn("transition-transform", profileOpen ? "text-[var(--gold)] rotate-180" : "text-navy/55 group-hover:text-[var(--gold)]")} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-[260px] bg-white border border-navy/10 rounded-[12px] shadow-dropdown overflow-hidden z-dropdown">
                  <div className="px-4 py-3.5 border-b border-navy/10">
                    <div className="text-sm font-semibold text-navy truncate">{name || "Member"}</div>
                    {/* Verification is the network's premise, so it is stated
                        wherever the member looks at their own account. */}
                    {v ? (
                      <div className={cn("mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em]", v.tone)}>
                        <v.icon size={12} /> {v.label}
                      </div>
                    ) : (
                      <Link
                        href="/verify-identity"
                        onClick={() => setProfileOpen(false)}
                        className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--gold-dark)] hover:underline"
                      >
                        <ShieldAlert size={12} /> Get verified
                      </Link>
                    )}
                  </div>
                  {/* Account-level only: the product destinations live under
                      My UnSwap and are deliberately not repeated here. */}
                  <div className="py-1.5">
                    {[
                      { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
                      { name: "Membership", href: "/dashboard/subscription", icon: CreditCard },
                      { name: "Settings", href: "/dashboard/settings", icon: Settings },
                    ].map((i) => (
                      <Link
                        key={i.name}
                        href={i.href}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-navy bg-white hover:bg-[var(--parchment)] transition-colors group"
                      >
                        <i.icon size={17} className="text-navy/45 group-hover:text-[var(--gold)] transition-colors" />
                        {i.name}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-navy/10 py-1.5">
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-navy bg-white hover:bg-[var(--parchment)] transition-colors group"
                    >
                      <LogOut size={17} className="text-navy/45 group-hover:text-[var(--gold)] transition-colors" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer — the full navigation, since nothing is squeezed into
          the bar itself at this width. */}
      {drawer && (
        <div className="fixed inset-0 z-drawer md:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[340px] bg-white flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 h-16 border-b border-navy/10">
              <span className="font-sans text-base font-bold tracking-[0.10em] text-navy">UNSWAP</span>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="-mr-1 p-2 text-navy">
                <X size={22} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={submitSearch} className="px-5 py-4 border-b border-navy/10">
              <label htmlFor="drawer-search" className="sr-only">Search homes, cities or duty stations</label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/40 pointer-events-none" />
                <input
                  id="drawer-search"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search homes or cities"
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-parchment border border-navy/10 text-sm text-navy placeholder:text-navy/40 focus:outline-none focus:border-[var(--gold)]"
                />
              </div>
            </form>

            <div className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/40">Explore</div>
            {EXPLORE.map((i) => <MenuRow key={i.name} item={i} onClick={() => setDrawer(false)} />)}

            <div className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/40">My UnSwap</div>
            {MINE.map((i) => <MenuRow key={i.name} item={i} onClick={() => setDrawer(false)} />)}
            <MenuRow item={{ name: "Membership", href: "/dashboard/subscription", icon: CreditCard }} onClick={() => setDrawer(false)} />

            <div className="mt-auto border-t border-navy/10 py-2">
              <MenuRow item={{ name: "Profile", href: "/dashboard/profile", icon: UserCircle }} onClick={() => setDrawer(false)} />
              <MenuRow item={{ name: "Settings", href: "/dashboard/settings", icon: Settings }} onClick={() => setDrawer(false)} />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--destructive)]"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
