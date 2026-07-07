"use client"

import { useState } from "react"
import { MailCheck } from "lucide-react"

/**
 * Inline "Resend confirmation email" button used in the getting-started
 * checklist on the member dashboard. Calls the resend-verification API
 * endpoint and shows neutral confirmation regardless of result (to avoid
 * leaking whether the email exists).
 */
export function ResendEmailButton({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")

  const handleResend = async () => {
    setState("sending")
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
    } catch {
      /* neutral — always show sent */
    }
    setState("sent")
  }

  if (state === "sent") {
    return (
      <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--teal)]/15 text-[var(--teal)]">
        <MailCheck size={13} /> Sent
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={state === "sending"}
      className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--gold-dark)] text-white hover:bg-[var(--gold-hover)] transition-colors disabled:opacity-50"
    >
      {state === "sending" ? "Sending…" : "Resend email"}
    </button>
  )
}
