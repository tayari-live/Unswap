"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Check } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { FIELD, LABEL, ERROR } from "@/components/ui/form"
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validation/auth"
import { PasswordRequirements } from "@/components/ui/password-requirements"
import { SuggestPassword } from "@/components/ui/suggest-password"

export function ChangePasswordForm() {
  const toast = useToast()
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  // Same schema as sign-up and reset, so the policy cannot be sidestepped by
  // changing a password rather than setting one.
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    defaultValues: { current: "", next: "", confirm: "" },
  })
  const next = watch("next")

  async function onSubmit(values: ChangePasswordInput) {
    setSaved(false)
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: values.current, newPassword: values.next }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not change your password.", "error")
        return
      }
      toast("Password updated.", "success")
      setSaved(true)
      reset()
    } catch {
      toast("Something went wrong. Please try again.", "error")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className={LABEL}>Current password</label>
        <input
          id="currentPassword"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          {...register("current")}
          aria-invalid={!!errors.current}
          aria-describedby={errors.current ? "current-error" : undefined}
          className={FIELD}
          placeholder="Enter your current password"
        />
        {errors.current && <p id="current-error" role="alert" className={ERROR}>{errors.current.message}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="newPassword" className={LABEL}>New password</label>
          <input
            id="newPassword"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            {...register("next")}
            aria-invalid={!!errors.next}
            aria-describedby={errors.next ? "next-error" : "next-requirements"}
            className={FIELD}
            placeholder="Choose a strong password"
          />
          {errors.next && <p id="next-error" role="alert" className={ERROR}>{errors.next.message}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className={LABEL}>Confirm new password</label>
          <input
            id="confirmPassword"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirm")}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? "confirm-error" : undefined}
            className={FIELD}
            placeholder="Re-enter new password"
          />
          {errors.confirm && <p id="confirm-error" role="alert" className={ERROR}>{errors.confirm.message}</p>}
        </div>
      </div>

      {/* Fills both fields: re-typing a generated password by hand is exactly
          the step that goes wrong. */}
      <SuggestPassword
        tone="light"
        value={next ?? ""}
        onGenerate={(pw) => {
          setValue("next", pw, { shouldValidate: true, shouldDirty: true })
          setValue("confirm", pw, { shouldValidate: true, shouldDirty: true })
          setShow(true)
        }}
      />
      <PasswordRequirements id="next-requirements" value={next ?? ""} tone="light" />

      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)] hover:text-[var(--gold-dark)] transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
        {show ? "Hide passwords" : "Show passwords"}
      </button>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-[10px] text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "Saving…" : saved ? (<><Check size={16} /> Updated</>) : "Update password"}
        </button>
      </div>
    </form>
  )
}
