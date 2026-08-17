"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { PasswordRequirements } from "@/components/ui/password-requirements"
import { SuggestPassword } from "@/components/ui/suggest-password"

const inputCls =
  "w-full bg-[var(--field-bg)] border border-wl-border px-5 py-4 text-wl-ivory placeholder-wl-muted focus:outline-none focus:border-wl-gold focus:shadow-[0_0_0_1px_rgba(201,168,76,0.35)] transition-all duration-300 text-[15px]"

export function SetPasswordForm({ firstName }: { firstName: string }) {
  const router = useRouter()
  const toast = useToast()
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/account/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not set your password.", "error")
        setSubmitting(false)
        return
      }
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/waitlist/logo.png" alt="UnSwap" className="w-20 h-20 object-contain" />
      </div>
      <div className="flex items-center justify-center gap-3 mb-5">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-wl-border" />
        <span className="text-wl-ivory-dim text-[11px] tracking-[0.22em] uppercase font-medium">Last step</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-wl-border" />
      </div>
      <h1 className="font-display text-[30px] sm:text-[36px] font-light text-wl-ivory text-center leading-tight mb-2">
        Secure your account
      </h1>
      <p className="text-wl-ivory-dim text-center text-sm leading-relaxed mb-8">
        Nice work, {firstName} — your home is listed. Set a password so you can sign back in anytime.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1">
            Password
          </label>
          <div className="relative flex items-center">
            <input
              id="new-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              className={`${inputCls} pr-11`}
            />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-4 flex items-center text-wl-muted hover:text-wl-gold-light transition-colors">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <SuggestPassword
            value={password}
            onGenerate={(pw) => {
              setPassword(pw)
              setShow(true)
            }}
          />
          <PasswordRequirements id="password-requirements" value={password} />
        </div>

        <button type="submit" disabled={submitting} className="w-full bg-wl-gold hover:bg-wl-gold-light text-wl-navy text-sm font-medium tracking-[0.08em] uppercase py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(201,168,76,0.25)]">
          {submitting ? "Saving…" : "Finish & enter UnSwap"}
        </button>
      </form>
    </div>
  )
}
