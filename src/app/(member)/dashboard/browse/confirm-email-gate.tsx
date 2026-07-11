"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/toast"

/** One-tap resend of the signed-in member's own confirmation email. */
export function ResendMyVerification({ email }: { email: string }) {
  const toast = useToast()
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")

  const resend = async () => {
    setState("sending")
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
    } catch {
      /* always show a neutral confirmation */
    }
    setState("sent")
    toast(`A fresh link is on its way to ${email}. Check your inbox.`, "success")
  }

  return (
    <button
      onClick={resend}
      disabled={state !== "idle"}
      className="inline-flex items-center justify-center py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 transition-colors"
    >
      {state === "sending" ? "Sending…" : state === "sent" ? "Sent — check your inbox" : "Resend confirmation email"}
    </button>
  )
}
