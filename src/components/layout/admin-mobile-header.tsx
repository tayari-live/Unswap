"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Menu, X, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { adminNavigation } from "./nav-items"
import { NotificationBell } from "./notification-bell"
import { ThemeToggle } from "@/components/theme/theme-toggle"

/**
 * Mobile-only top bar + slide-out drawer for the admin console — mirrors the
 * member dashboard's `AppNavbar` drawer mechanics (hamburger, scrim, panel
 * sliding from the left, body-scroll-locked while open), but keeps the navy
 * rail's own visual language rather than the member drawer's white/parchment
 * one, so mobile and desktop admin nav read as the same surface.
 *
 * Replaces the old bottom tab bar outright: that only fit 4 of 9 sections
 * inline and buried the rest (plus Settings, which wasn't in the list at all)
 * behind a "More" popover.
 */
export function AdminMobileHeader({
  name,
  initials,
  image,
}: {
  name: string
  initials: string
  image: string | null
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  // Belt-and-braces: Link onClick already closes the drawer, but this covers
  // programmatic navigation (e.g. router.push from an action inside it).
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <div className="md:hidden">
      <header className="flex items-center justify-between px-4 h-16 bg-gradient-to-b from-[var(--navy)] to-[var(--navy-dark)] text-white border-b border-white/10 relative z-20">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="-ml-1 p-2 text-white/80 hover:text-white"
        >
          <Menu size={22} strokeWidth={1.9} />
        </button>

        <Link href="/overview" className="flex items-center gap-2">
          <Image src="/unswap-logo.png" alt="UnSwap" width={28} height={28} className="w-7 h-7 object-contain" />
          <span className="font-display font-light text-lg tracking-[0.08em]">Admin</span>
        </Link>

        <NotificationBell
          buttonClassName="relative w-9 h-9 rounded-full text-white/80 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
          panelClassName="absolute top-full right-0 mt-2 w-80 max-w-[90vw] bg-surface rounded-xl shadow-lg border border-[var(--border)] z-50 overflow-hidden"
        />
      </header>

      {open && (
        <div className="fixed inset-0 z-drawer">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[340px] bg-gradient-to-b from-[var(--navy)] to-[var(--navy-dark)] text-white flex flex-col overflow-y-auto shadow-[2px_0_24px_rgba(7,23,43,0.35)]">
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Image src="/unswap-logo.png" alt="UnSwap" width={28} height={28} className="w-7 h-7 object-contain" />
                <span className="font-display font-light text-lg tracking-[0.08em]">UnSwap Admin</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="-mr-1 p-2 text-white/80 hover:text-white">
                <X size={22} strokeWidth={2} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 overflow-y-auto">
              {adminNavigation.map((group) => (
                <div key={group.label} className="mb-5 last:mb-0">
                  <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                    {group.label}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "group relative flex items-center gap-3 py-3 px-3 rounded-sm text-[15px] font-medium transition-all duration-200",
                            active
                              ? "bg-gradient-to-r from-[var(--gold)]/20 via-[var(--gold)]/8 to-transparent text-white ring-1 ring-inset ring-[var(--gold)]/25"
                              : "text-white/55 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-[var(--gold)]" />}
                          <item.icon size={19} strokeWidth={1.6} className={active ? "text-[var(--gold)]" : "text-white/40 group-hover:text-white/70"} />
                          <span className="flex-1">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto border-t border-white/10 bg-black/20 p-2 flex-shrink-0">
              <div className="flex items-center gap-3 py-2 px-2 mb-1">
                <span className="relative w-9 h-9 flex-shrink-0 rounded-full bg-white/10 border-2 border-[var(--gold)]/50 flex items-center justify-center overflow-hidden">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">{initials || "A"}</span>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-medium text-white truncate">{name || "Administrator"}</span>
                  <span className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide">Administrator</span>
                </span>
              </div>
              <ThemeToggle className="w-full" />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-[13px] font-semibold text-red-300 hover:bg-red-400/10 hover:text-red-200 transition-colors"
              >
                <LogOut size={18} className="flex-shrink-0" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
