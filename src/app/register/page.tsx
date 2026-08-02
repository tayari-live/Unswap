"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Info, ShieldCheck } from "lucide-react"
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
  return FAST_TRACK_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`)) ? "fast" : "manual"
}

const inputCls =
  "w-full bg-[rgba(10,14,26,0.5)] border border-wl-border px-4 py-3 text-wl-ivory placeholder-wl-muted focus:outline-none focus:border-wl-gold focus:shadow-[0_0_0_1px_var(--border)] transition-all duration-300 text-[15px]"
const labelCls = "block text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1"

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  // Prefill from the waitlist hand-off (?email=&name=) so people who came from
  // the waitlist don't re-enter their details — they only set a password.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const e = params.get("email")
    const n = params.get("name")
    if (e) setEmail(e)
    if (n) {
      const [first, ...rest] = n.trim().split(/\s+/)
      setFirstName(first)
      if (rest.length) setLastName(rest.join(" "))
    }
  }, [])

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
      const qs = new URLSearchParams({ email })
      if (data.fastTrack) qs.set("fast", "1")
      router.push(`/confirm-email?${qs}`)
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full relative">
      {/* IMAGE — background on mobile, left column on desktop */}
      <div className="absolute inset-0 lg:static lg:w-[38%] lg:sticky lg:top-0 lg:h-[100dvh] overflow-hidden z-0 bg-wl-deep border-r border-wl-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/waitlist/interior.png" alt="Luxury interior" className="absolute inset-0 w-full h-full object-cover object-center opacity-80" />
        <div className="absolute inset-0 bg-wl-navy/90 lg:hidden" />
        <div className="hidden lg:block absolute bottom-0 left-0 right-0 p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="w-[60px] h-px bg-wl-gold" />
            <p className="text-wl-gold/60 text-[11px] tracking-[0.22em] uppercase">Verified access only</p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="w-full lg:w-[62%] lg:ml-auto flex items-center justify-center p-8 sm:p-12 lg:p-16 relative z-10 min-h-[100dvh] overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--gold-dim)_0%,_transparent_60%)] pointer-events-none" />

        <div className="w-full max-w-md mx-auto relative">
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/waitlist/logo.png" alt="UnSwap" className="w-24 h-24 object-contain" />
          </div>

          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-wl-border" />
            <span className="text-wl-ivory text-[11px] tracking-[0.22em] uppercase font-medium">Create your account</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-wl-border" />
          </div>

          <h1 className="font-display text-[32px] sm:text-[40px] font-light text-wl-gold text-center leading-tight mb-2">
            Join the network
          </h1>
          <p className="text-wl-ivory-dim text-center text-sm leading-relaxed mb-8">
            Verified home exchange for UN, World Bank, IMF and diplomatic professionals.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelCls}>First name</label>
                <input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className={inputCls} />
              </div>
              <div>
                <label htmlFor="lastName" className={labelCls}>Last name</label>
                <input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={inputCls} />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelCls}>Work email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="j.doe@un.org" className={inputCls} />
            </div>

            <div>
              <label htmlFor="password" className={labelCls}>Password</label>
              <div className="relative flex items-center">
                <input id="password" type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 flex items-center text-wl-muted hover:text-wl-gold transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Eligibility hint reacts to the email domain */}
            <div className={`flex gap-2.5 p-3.5 rounded-xl text-sm border ${status === "fast" ? "border-wl-gold/40 bg-wl-gold-dim text-wl-gold-light" : "border-wl-border bg-[rgba(10,14,26,0.5)] text-wl-ivory-dim"}`}>
              {status === "fast" ? <ShieldCheck size={18} className="flex-shrink-0 mt-0.5 text-wl-gold" /> : <Info size={18} className="flex-shrink-0 mt-0.5 text-wl-gold" />}
              <span>
                {status === "fast"
                  ? "Recognised institutional email — you qualify for fast-track verification."
                  : "Use your institutional email (@un.org, @undp.org, etc.) for fast-track verification. Other addresses enter manual review."}
              </span>
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center mt-2 shadow-[0_4px_24px_var(--gold-dim)]">
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-wl-border text-center">
            <p className="text-sm text-wl-ivory-dim">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-wl-gold hover:text-wl-gold-light transition-colors">Log in</Link>
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] text-wl-muted">
            UnSwap is an independent, staff-led platform, not affiliated with the United Nations.
          </p>
        </div>
      </div>
    </div>
  )
}
