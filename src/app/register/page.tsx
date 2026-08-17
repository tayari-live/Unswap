"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, Info, ShieldCheck } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { ThemeToggleIcon } from "@/components/theme/theme-toggle"
import { registerSchema, type RegisterInput } from "@/lib/validation/auth"
import { PasswordRequirements } from "@/components/ui/password-requirements"
import { SuggestPassword } from "@/components/ui/suggest-password"

// Institutional domains that qualify for fast-track verification. Mirrors the
// admin-editable allowlist; client-side feedback only — server is the source of truth.
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
  // --field-bg flips with the theme; a hardcoded white here left ivory text on
  // a white field (invisible) once dark mode was added.
  "w-full bg-[var(--field-bg)] border border-wl-border px-5 py-4 text-wl-ivory placeholder-wl-muted focus:outline-none focus:border-wl-gold focus:shadow-[0_0_0_1px_rgba(201,168,76,0.35)] transition-all duration-300 text-[15px]"
const labelCls = "block text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1"
// Validation text sits on a dark ground, so the fixed light red rather than
// --destructive, which is too dark to read here.
const errCls = "mt-1.5 text-sm font-medium text-error-light"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const toast = useToast()

  // Waitlist hand-off: a signed grant means the email is already verified, and
  // `next` is where to land once the account is live (onboarding → listing).
  const [grant, setGrant] = useState<string | null>(null)
  const [next, setNext] = useState<string | null>(null)

  // The schema is shared with the server, so the rules a member sees while
  // typing are the rules the endpoint enforces on submit.
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  })
  const email = watch("email")
  const password = watch("password")

  // Prefill from the waitlist hand-off (?email=&name=) so people who came from
  // the waitlist don't re-enter their details — they only set a password.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const e = params.get("email")
    const n = params.get("name")
    if (e) setValue("email", e)
    if (n) {
      const [first, ...rest] = n.trim().split(/\s+/)
      setValue("firstName", first)
      if (rest.length) setValue("lastName", rest.join(" "))
    }
    setGrant(params.get("grant"))
    setNext(params.get("next"))
  }, [setValue])

  const status = domainStatus(email)

  const onSubmit = async (values: RegisterInput) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, grant: grant ?? undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not create your account.", "error")
        return
      }

      // Pre-verified (came from the waitlist link): no email step — sign them in
      // and continue straight into the app (onboarding → add their property).
      if (data.emailVerified) {
        const signRes = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        })
        if (signRes?.error) {
          // Account exists but auto sign-in failed — fall back to manual login.
          router.push(`/login?email=${encodeURIComponent(values.email)}`)
          return
        }
        router.push(next || "/dashboard")
        router.refresh()
        return
      }

      const qs = new URLSearchParams({ email: values.email })
      if (data.fastTrack) qs.set("fast", "1")
      router.push(`/confirm-email?${qs}`)
    } catch {
      toast("Something went wrong. Please try again.", "error")
    }
  }

  return (
    <div className="min-h-screen w-full relative bg-wl-navy text-wl-ivory font-sans">
      {/* Theme switch */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggleIcon />
      </div>

      {/* IMAGE — background on mobile, left column on desktop (original backdrop, dark overlay) */}
      <div className="absolute inset-0 lg:fixed lg:inset-y-0 lg:left-0 lg:w-[38%] overflow-hidden z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/auth-institution.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[rgba(10,14,26,0.6)]" />
        {/* lighten on mobile so the overlaid form stays readable */}
        <div className="absolute inset-0 bg-wl-navy/92 lg:hidden" />
        <div className="hidden lg:block absolute bottom-0 left-0 right-0 p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="w-[60px] h-px bg-wl-gold" />
            <p className="text-white/80 text-[11px] tracking-[0.22em] uppercase">Verified access only</p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="w-full lg:w-[62%] lg:ml-[38%] flex items-center justify-center p-8 sm:p-12 lg:p-16 relative z-10 min-h-[100dvh]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,168,76,0.12)_0%,_transparent_60%)] pointer-events-none" />

        <div className="w-full max-w-md mx-auto relative">
          <div className="flex justify-center mb-6">
            {/* The logo is the way back out of the funnel: from sign-up, that is
                the public landing page. */}
            <Link href="/" aria-label="UnSwap — home" className="inline-flex transition-opacity hover:opacity-90">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/waitlist/logo.png" alt="UnSwap" className="w-24 h-24 object-contain" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-wl-border" />
            <span className="text-wl-ivory-dim text-[11px] tracking-[0.22em] uppercase font-medium">Create your account</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-wl-border" />
          </div>

          <h1 className="font-display text-[32px] sm:text-[40px] font-light text-wl-ivory text-center leading-tight mb-2">
            Join the network
          </h1>
          <p className="text-wl-ivory-dim text-center text-sm leading-relaxed mb-8">
            Verified home exchange for UN, World Bank, IMF and diplomatic professionals.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelCls}>First name</label>
                <input id="firstName" {...register("firstName")} aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? "firstName-error" : undefined} placeholder="John" className={inputCls} />
                {errors.firstName && <p id="firstName-error" role="alert" className={errCls}>{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className={labelCls}>Last name</label>
                <input id="lastName" {...register("lastName")} aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? "lastName-error" : undefined} placeholder="Doe" className={inputCls} />
                {errors.lastName && <p id="lastName-error" role="alert" className={errCls}>{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelCls}>Work email</label>
              <input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} placeholder="j.doe@un.org" className={inputCls} />
              {errors.email && <p id="email-error" role="alert" className={errCls}>{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className={labelCls}>Password</label>
              <div className="relative flex items-center">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" {...register("password")} aria-invalid={!!errors.password} aria-describedby="password-requirements" placeholder="Choose a strong password" className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-4 flex items-center text-wl-muted hover:text-wl-gold-light transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <SuggestPassword
                value={password ?? ""}
                onGenerate={(pw) => {
                  setValue("password", pw, { shouldValidate: true, shouldDirty: true })
                  setShowPassword(true)
                }}
              />
              <PasswordRequirements id="password-requirements" value={password ?? ""} />
            </div>

            {/* Eligibility hint reacts to the email domain */}
            {/* --panel, not a hardcoded white: the text colour flips with the
                theme while a fixed white background does not, which left light
                ivory text on white in dark mode. */}
            <div className={`flex gap-2.5 p-3.5 text-sm border ${status === "fast" ? "border-wl-border bg-[rgba(201,168,76,0.1)] text-wl-gold" : "border-wl-border bg-[var(--panel)] text-wl-ivory-dim"}`}>
              {status === "fast" ? <ShieldCheck size={18} className="flex-shrink-0 mt-0.5 text-wl-gold" /> : <Info size={18} className="flex-shrink-0 mt-0.5 text-wl-gold" />}
              <span>
                {status === "fast"
                  ? "Recognised institutional email — you qualify for fast-track verification."
                  : "Use your institutional email (@un.org, @undp.org, etc.) for fast-track verification. Other addresses enter manual review."}
              </span>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-wl-gold hover:bg-wl-gold-light text-wl-navy text-sm font-medium tracking-[0.08em] uppercase py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(201,168,76,0.25)]">
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          {/* Footer sits on its own navy band (ivory text via the `wl-navy`
              palette) in both themes, matching /login. */}
          <div className="wl-navy bg-wl-navy mt-8 px-6 py-5 rounded-xl text-center space-y-2">
            <p className="text-sm text-wl-ivory-dim">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-wl-gold hover:text-wl-gold-light transition-colors">Log in</Link>
            </p>
            <p className="text-[11px] text-wl-muted">
              UnSwap is an independent, staff-led platform, not affiliated with the United Nations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
