"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/toast"

/**
 * "Resend confirmation email" button used in the getting-started checklist on
 * the member dashboard. Calls the resend-verification API endpoint and shows a
 * neutral toast regardless of result (to avoid leaking whether the email exists).
 */
export function ResendEmailButton({ email }: { email: string }) {
  const toast = useToast()
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
      /* neutral — always confirm */
    }
    setState("sent")
    toast(`A fresh confirmation link is on its way to ${email}.`, "success")
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={state !== "idle"}
      className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] px-4 py-2 rounded-sm bg-[var(--gold)] text-ink hover:bg-[var(--gold-hover)] transition-colors disabled:opacity-50"
    >
      {state === "sending" ? "Sending…" : state === "sent" ? "Sent" : "Resend email"}
    </button>
  )
}
