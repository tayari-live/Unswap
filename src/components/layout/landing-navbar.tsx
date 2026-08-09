"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, BadgeCheck } from "lucide-react"

/*
 * Marketing navbar.
 *
 * Deliberately unlike the product shell: the application uses a navy sidebar
 * for navigation, so this exists to introduce the brand and move a visitor
 * toward requesting access — not to navigate an account.
 *
 * "Request Access" rather than "Join": the network is closed and verified, and
 * the label should say so before anyone reaches the form.
 */

const LINKS = [
  { label: "How It Works", href: "/#how" },
  // Listings are visible only inside the verified network, so this previews
  // the portfolio rather than promising an open catalogue to browse.
  { label: "Destinations", href: "/#homes" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/about" },
]

export function LandingNavbar({ forceLight = false }: { forceLight?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual"
    if (!forceLight) window.scrollTo(0, 0)

    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [forceLight])

  // Escape closes the menu, and the page beneath must not scroll while it is
  // open — otherwise closing it returns you somewhere unexpected.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false)
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  const isLight = forceLight || isScrolled

  const wordmark = `font-sans text-base font-bold tracking-[0.10em] transition-colors duration-150 ${
    isLight ? "text-navy" : "text-gold"
  }`

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-sticky transition-colors duration-300 ${
          isLight ? "bg-cream/95 backdrop-blur-md border-b border-navy/10" : "bg-transparent border-b border-transparent"
        }`}
      >
        {/* Capped so the bar does not stretch across very wide monitors. */}
        <div className="max-w-[1320px] mx-auto flex items-center justify-between px-6 lg:px-12 h-[68px] md:h-20 xl:h-[88px]">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <Image
              src="/unswap-logo.png"
              alt=""
              width={68}
              height={68}
              priority
              className="w-[34px] h-[34px] object-contain"
            />
            <span className={wordmark}>UNSWAP</span>
          </Link>

          {/* Sentence case, not caps: caps are the wordmark's job. */}
          <nav
            className={`hidden md:flex items-center gap-9 text-sm font-medium tracking-[0.015em] transition-colors duration-300 ${
              isLight ? "text-navy/70" : "text-white/80"
            }`}
          >
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`transition-colors duration-150 ${isLight ? "hover:text-navy" : "hover:text-gold"}`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            {/* The closed-network claim, stated where it is read first. Hidden
                below xl, where the bar has no room to spare. */}
            <span
              className={`hidden xl:inline-flex items-center gap-1.5 text-[11px] font-medium ${
                isLight ? "text-navy/60" : "text-white/60"
              }`}
            >
              <BadgeCheck size={13} className="text-gold" />
              Verified Network
            </span>

            {/* Secondary by design: two competing buttons would blunt the CTA. */}
            <Link
              href="/login"
              className={`hidden sm:inline-block text-sm font-medium transition-colors duration-150 ${
                isLight ? "text-navy/80 hover:text-gold-dark" : "text-white/80 hover:text-gold"
              }`}
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="hidden sm:inline-flex items-center justify-center h-[42px] px-6 rounded-md bg-gold hover:bg-gold-hover text-navy text-[13px] font-bold uppercase tracking-[0.07em] transition-colors duration-150"
            >
              Request Access
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className={`md:hidden -mr-1 p-2 transition-colors ${isLight ? "text-navy" : "text-gold"}`}
            >
              <Menu size={22} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — a full surface rather than a dropdown, so the choice is
          the only thing on screen. */}
      {menuOpen && (
        <div className="fixed inset-0 z-modal md:hidden bg-ink text-white flex flex-col">
          <div className="flex items-center justify-between px-6 h-[68px]">
            <Link href="/" onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-2.5">
              <Image src="/unswap-logo.png" alt="" width={68} height={68} className="w-[34px] h-[34px] object-contain" />
              <span className="font-sans text-base font-bold tracking-[0.10em] text-gold">UNSWAP</span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="-mr-1 p-2 text-gold"
            >
              <X size={22} strokeWidth={2} />
            </button>
          </div>

          <nav className="flex flex-col px-6 pt-6 gap-1">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="py-3.5 text-lg font-medium text-white/90 hover:text-gold transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto px-6 pb-10 pt-6">
            <div className="h-px bg-white/10 mb-6" />
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-base font-medium text-white/80 hover:text-gold transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="mt-3 flex items-center justify-center h-[50px] rounded-md bg-gold hover:bg-gold-hover text-navy text-[13px] font-bold uppercase tracking-[0.07em] transition-colors duration-150"
            >
              Request Access
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
