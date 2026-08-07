"use client"

import { useState } from "react"
import { Check, Copy, Sparkles } from "lucide-react"
import { generatePassword } from "@/lib/password"

/**
 * Offers a generated password and lets the member copy it.
 *
 * Generating reveals the field: a password the member cannot see is one they
 * cannot record, and they will need it again at sign-in.
 */
export function SuggestPassword({
  onGenerate,
  value,
  tone = "dark",
}: {
  /** Receives the new password; the caller writes it into the field. */
  onGenerate: (password: string) => void
  /** Current field value — the copy button only appears once there is one. */
  value: string
  tone?: "dark" | "light"
}) {
  const [copied, setCopied] = useState(false)

  const accent =
    tone === "dark"
      ? "text-wl-gold hover:text-wl-gold-light"
      : "text-[var(--gold-dark)] hover:text-[var(--gold)]"

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied; the password is visible either way.
    }
  }

  return (
    <div className="mt-2 flex items-center gap-4">
      <button
        type="button"
        onClick={() => onGenerate(generatePassword())}
        className={`inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors ${accent}`}
      >
        <Sparkles size={14} strokeWidth={2} />
        Suggest a strong password
      </button>

      {value && (
        <button
          type="button"
          onClick={copy}
          className={`inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors ${accent}`}
        >
          {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
          {copied ? "Copied" : "Copy"}
        </button>
      )}

      {/* Announced rather than left to the visual change alone. */}
      <span className="sr-only" aria-live="polite">
        {copied ? "Password copied to clipboard." : ""}
      </span>
    </div>
  )
}
