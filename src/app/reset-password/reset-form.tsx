"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { AuthShell, authInputCls, authLabelCls, authBtnCls } from "@/components/auth/auth-shell"
import { PasswordRequirements } from "@/components/ui/password-requirements"
import { SuggestPassword } from "@/components/ui/suggest-password"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth"

export function ResetForm() {
  const params = useSearchParams()
  const router = useRouter()
  const toast = useToast()
  const token = params.get("token") || ""

  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)

  // Shared with the server, so a reset cannot bypass the sign-up policy.
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: { password: "", confirm: "" },
  })
  const password = watch("password")

  const onSubmit = async (values: ResetPasswordInput) => {
    if (!token) return toast("This reset link is missing its token.", "error")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not reset your password.", "error")
        return
      }
      setDone(true)
      toast("Password updated.", "success")
      setTimeout(() => router.push("/login"), 2500)
    } catch {
      toast("Something went wrong. Please try again.", "error")
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
      <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="password" className={authLabelCls}>
            New password
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-describedby="password-requirements"
              {...register("password")}
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
            value={password ?? ""}
            onGenerate={(pw) => {
              setValue("password", pw, { shouldValidate: true, shouldDirty: true })
              setValue("confirm", pw, { shouldValidate: true, shouldDirty: true })
              setShowPassword(true)
            }}
          />
          <PasswordRequirements id="password-requirements" value={password ?? ""} />
        </div>

        <div>
          <label htmlFor="confirm" className={authLabelCls}>
            Confirm password
          </label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirm")}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? "confirm-error" : undefined}
            placeholder="Re-enter password"
            className={authInputCls}
          />
          {errors.confirm && (
            <p id="confirm-error" role="alert" className="mt-1.5 text-sm font-medium text-error-light">
              {errors.confirm.message}
            </p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className={`${authBtnCls} mt-2`}>
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  )
}
