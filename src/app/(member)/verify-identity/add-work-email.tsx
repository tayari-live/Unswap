"use client"

import { useEffect, useState } from "react"
import { MailCheck, ArrowRight, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { FIELD, LABEL } from "@/components/ui/form"

/**
 * The friendlier, no-documents path: a member who signed up with a personal
 * address adds an institutional email. We email that address a confirmation
 * link; clicking it verifies them instantly (auto-verify domains) or moves them
 * to fast-track. Recognised-domain check happens server-side.
 */
export function AddWorkEmail({
  heading = "Have an institutional email?",
  blurb = "Add your work address (e.g. an organisation domain) to verify faster — often instantly, with no documents. We'll email it a confirmation link.",
  cta = "Send link",
}: {
  heading?: string
  blurb?: string
  cta?: string
} = {}) {
  const toast = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  // If they typed a work email at signup, we stashed it — pre-fill it here once,
  // then clear it so it doesn't linger.
  useEffect(() => {
    try {
      const hint = window.localStorage.getItem("unswap.workEmailHint")
      if (hint) {
        setEmail(hint)
        window.localStorage.removeItem("unswap.workEmailHint")
      }
    } catch {
      /* private mode — ignore */
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/verification/work-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not send the confirmation.", "error")
        setLoading(false)
        return
      }
      setSentTo(data.email || email.trim())
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  if (sentTo) {
    return (
      <div className="bg-[var(--teal-light)] border border-[var(--teal)]/30 rounded-md p-5 flex items-start gap-3">
        <CheckCircle2 size={20} className="text-[var(--teal)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[var(--fg)]">Confirmation sent</p>
          <p className="mt-1 text-sm text-neutral-dark leading-relaxed">
            Open the link we sent to <span className="font-semibold text-[var(--fg)]">{sentTo}</span> to
            verify. Check spam if it doesn&apos;t arrive within a few minutes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-md border border-[var(--gold)]/30 p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-md bg-[var(--navy)]/5 text-[var(--gold-dark)] flex items-center justify-center flex-shrink-0">
          <MailCheck size={20} />
        </div>
        <div>
          <h2 className="font-sans text-lg font-semibold text-[var(--fg)]">{heading}</h2>
          <p className="mt-1 text-sm text-neutral-dark leading-relaxed">{blurb}</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label htmlFor="work-email" className={LABEL}>Institutional email</label>
          <input
            id="work-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@your-organisation.org"
            className={FIELD}
            autoComplete="email"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Sending…" : <>{cta} <ArrowRight size={16} /></>}
        </button>
      </form>
    </div>
  )
}
