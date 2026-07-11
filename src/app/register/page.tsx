"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Info, ShieldCheck } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { useToast } from "@/components/ui/toast"

// Institutional domains that qualify for fast-track verification. Mirrors the
// admin-editable allowlist; kept here for instant client-side feedback only —
// the server remains the source of truth at submission.
const FAST_TRACK_DOMAINS = [
  "un.org", "undp.org", "unicef.org", "who.int", "unhcr.org",
  "imf.org", "worldbank.org", "ilo.org", "fao.org", "wfp.org",
  "unaids.org", "unep.org", "unfpa.org", "habitat.un.org", "ocha.un.org",
]

function domainStatus(email: string): "fast" | "manual" | null {
  const at = email.indexOf("@")
  if (at < 0 || at === email.length - 1) return null
  const domain = email.slice(at + 1).toLowerCase().trim()
  if (!domain.includes(".")) return null
  return FAST_TRACK_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))
    ? "fast"
    : "manual"
}

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const status = domainStatus(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not create your account.", "error")
        setLoading(false)
        return
      }
      // Hand off to the dedicated verify-email interstitial.
      const qs = new URLSearchParams({ email })
      if (data.fastTrack) qs.set("fast", "1")
      router.push(`/confirm-email?${qs}`)
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — institutional branding over a photographic backdrop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 relative overflow-hidden text-white">
        <Image
          src="/images/auth-institution.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--navy)]/85 via-[var(--navy)]/80 to-[var(--navy-dark)]/95" />

        <Logo
          className="relative z-10 text-white"
          markClassName="w-10 h-10 text-[var(--gold)]"
          wordClassName="text-white text-2xl"
        />

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
            Join a network built on trust
          </h1>
          <p className="mt-4 text-white/60 leading-relaxed">
            Verified home exchange, exclusively for UN, World Bank, IMF, and
            affiliated international organisation professionals. Exchange homes,
            not money.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-white/50">
          <ShieldCheck size={16} className="text-[var(--gold)]" />
          Every member verified before access
        </div>
      </div>

      {/* Right panel — sign-up form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-[var(--background)]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Logo underline wordClassName="text-[var(--navy)]" />
          </div>

          <h2 className="font-display text-3xl font-bold text-[var(--navy)]">
            Join the Network
          </h2>
          <p className="mt-2 text-neutral">
            Create your verified UnSwap account.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"
              >
                Work Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="j.doe@un.org"
                className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="block w-full pl-4 pr-11 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 flex items-center text-neutral hover:text-[var(--navy)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Eligibility hint reacts to the email domain */}
            <div
              className={`flex gap-2.5 p-3.5 rounded-xl text-sm border ${
                status === "fast"
                  ? "bg-[var(--teal-light)] border-[var(--teal)]/30 text-[var(--teal)]"
                  : "bg-[var(--parchment)] border-[var(--gold)]/30 text-[var(--gold-dark)]"
              }`}
            >
              {status === "fast" ? (
                <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" />
              ) : (
                <Info size={18} className="flex-shrink-0 mt-0.5" />
              )}
              <span>
                {status === "fast"
                  ? "Recognised institutional email — you qualify for fast-track verification."
                  : "Use your institutional email (@un.org, @undp.org, etc.) for fast-track verification. Other addresses enter manual review."}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-sm text-neutral">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)] transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-neutral">
            UnSwap is an independent, staff-led platform, not affiliated with
            the United Nations.
          </p>
        </div>
      </div>
    </div>
  )
}
