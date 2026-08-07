"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { AuthShell, authInputCls, authLabelCls, authBtnCls } from "@/components/auth/auth-shell"
import { PasswordRequirements } from "@/components/ui/password-requirements"
import { SuggestPassword } from "@/components/ui/suggest-password"

export function ResetForm() {
  const params = useSearchParams()
  const router = useRouter()
  const toast = useToast()
  const token = params.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return toast("Password must be at least 8 characters.", "error")
    if (password !== confirm) return toast("Passwords do not match.", "error")
    if (!token) return toast("This reset link is missing its token.", "error")

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not reset your password.", "error")
        setLoading(false)
        return
      }
      setDone(true)
      toast("Password updated.", "success")
      setTimeout(() => router.push("/login"), 2500)
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthShell eyebrow="All done" title="Password updated">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 border border-wl-border text-wl-gold flex items-center justify-center mb-6">
            <CheckCircle2 size={26} strokeWidth={1.4} />
          </div>
          <p className="text-wl-ivory-dim leading-relaxed">Redirecting you to sign in…</p>
          <Link href="/login" className={`${authBtnCls} mt-7 inline-block text-center`}>
            Sign in now
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="Enter a new password for your account."
      footer={
        <Link
          href="/login"
          className="text-[12px] tracking-[0.1em] uppercase font-medium text-wl-gold hover:text-wl-gold-light transition-colors"
        >
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className={authLabelCls}>
            New password
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              aria-describedby="password-requirements"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              className={`${authInputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 text-wl-muted hover:text-wl-ivory transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <SuggestPassword
            value={password}
            onGenerate={(pw) => {
              setPassword(pw)
              setConfirm(pw)
              setShowPassword(true)
            }}
          />
          <PasswordRequirements id="password-requirements" value={password} />
        </div>

        <div>
          <label htmlFor="confirm" className={authLabelCls}>
            Confirm password
          </label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            className={authInputCls}
          />
        </div>

        <button type="submit" disabled={loading} className={`${authBtnCls} mt-2`}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  )
}
