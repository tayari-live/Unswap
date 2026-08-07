"use client"

import { Check } from "lucide-react"

/*
 * Live password requirements.
 *
 * Shown as the member types rather than reported after submitting: the policy
 * has five rules, and discovering them one failed attempt at a time is the
 * fastest way to make someone abandon a sign-up form.
 *
 * The rules mirror passwordSchema in lib/validation/auth. They are duplicated
 * here as predicates because a Zod schema can say which rule failed first, but
 * not which of the five currently pass.
 */
const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "A number", test: (v) => /[0-9]/.test(v) },
  { label: "A special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
]

export function PasswordRequirements({
  value,
  id,
  tone = "dark",
}: {
  value: string
  /** Referenced by the input's aria-describedby so the list is announced. */
  id?: string
  /** `dark` for the navy auth pages, `light` for in-app settings. */
  tone?: "dark" | "light"
}) {
  const met = RULES.filter((r) => r.test(value)).length
  const muted = tone === "dark" ? "text-wl-muted" : "text-[var(--muted)]"
  const done = tone === "dark" ? "text-wl-gold-light" : "text-success"

  return (
    <ul id={id} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
      {RULES.map((r) => {
        const ok = r.test(value)
        return (
          <li key={r.label} className={`flex items-center gap-2 text-[13px] ${ok ? done : muted}`}>
            <span
              className={`flex-shrink-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                ok ? "border-current" : "border-current/40"
              }`}
            >
              {/* Shape as well as colour, so the state does not depend on
                  distinguishing green from grey. */}
              {ok && <Check size={9} strokeWidth={3} />}
            </span>
            {r.label}
          </li>
        )
      })}
      {/* One announcement when the whole policy is satisfied, rather than a
          screen reader narrating each tick as it happens. */}
      <li className="sr-only" aria-live="polite">
        {met === RULES.length ? "Password meets all requirements." : `${met} of ${RULES.length} requirements met.`}
      </li>
    </ul>
  )
}
