"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Logo } from "@/components/brand/logo"

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    // Disable browser's default scroll restoration
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }
    // Force scroll to top on mount
    window.scrollTo(0, 0)

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    
    // Initial check
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-[var(--border)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 h-20">
        <Logo wordClassName={isScrolled ? "text-[var(--navy)]" : "text-white"} />

        <nav className={`hidden md:flex items-center gap-10 text-[12px] font-bold tracking-[0.15em] uppercase transition-colors duration-300 ${isScrolled ? "text-[var(--navy)]/60" : "text-white/70"}`}>
          <a href="#network" className={`transition-colors duration-200 ${isScrolled ? "hover:text-[var(--navy)]" : "hover:text-white"}`}>
            The Network
          </a>
          <a href="#homes" className={`transition-colors duration-200 ${isScrolled ? "hover:text-[var(--navy)]" : "hover:text-white"}`}>
            Homes
          </a>
          <a href="#how" className={`transition-colors duration-200 ${isScrolled ? "hover:text-[var(--navy)]" : "hover:text-white"}`}>
            How It Works
          </a>
          <a href="#pricing" className={`transition-colors duration-200 ${isScrolled ? "hover:text-[var(--navy)]" : "hover:text-white"}`}>
            Membership
          </a>
        </nav>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/login"
            className={`hidden sm:inline-block text-[12px] font-bold uppercase tracking-wider transition-colors duration-200 ${
              isScrolled ? "text-[var(--navy)]/80 hover:text-[var(--navy)]" : "text-white/80 hover:text-white"
            }`}
          >
            Log In
          </Link>
          <Link
            href="/register"
            className={`hidden sm:inline-flex text-[12px] font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-colors duration-200 ${
              isScrolled ? "text-white bg-[var(--navy)] hover:bg-[var(--navy-dark)]" : "text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)]"
            }`}
          >
            Request Access
          </Link>
          <Link
            href="/login"
            className={`sm:hidden text-[12px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors duration-200 ${
              isScrolled ? "text-white bg-[var(--navy)] hover:bg-[var(--navy-dark)]" : "text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)]"
            }`}
          >
            Log In
          </Link>
        </div>
      </div>
    </header>
  )
}
