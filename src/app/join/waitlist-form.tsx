"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MailCheck, BadgeCheck } from "lucide-react"
import { useToast } from "@/components/ui/toast"

const inputCls =
  "block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"

type Initiated = { status: "pending" | "already_confirmed"; email: string; confirmUrl?: string }

export function WaitlistForm() {
  const params = useSearchParams()
  const ref = params.get("ref") || undefined
  const initialError = params.get("error") || ""
  const toast = useToast()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<Initiated | null>(null)
  const [social, setSocial] = useState<{ count: number; recentJoiners: { initials: string }[] } | null>(null)

  // Surface an expired/used confirmation link redirected back here.
  useEffect(() => {
    if (initialError) toast(initialError, "error")
  }, [initialError, toast])

  // Social proof.
  useEffect(() => {
    fetch("/api/waitlist/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSocial(d))
      .catch(() => {})
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, ref }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not join the waitlist.", "error")
        return
      }
      setDone(data)
    } catch {
      toast("Something went wrong. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  // ── Confirmation-pending / already-joined states ───────────────────────────
  if (done) {
    const already = done.status === "already_confirmed"
    return (
      <div className="text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--teal-light)] text-[var(--teal)] flex items-center justify-center mb-5">
          {already ? <BadgeCheck size={26} /> : <MailCheck size={26} />}
        </div>
        <h1 className="font-display text-3xl font-bold text-[var(--navy)]">
          {already ? "You're already on the list" : "Check your email"}
        </h1>
        <p className="mt-3 text-neutral">
          {already ? (
            <>This email is already confirmed on the UnSwap waitlist.</>
          ) : (
            <>We sent a confirmation link to <span className="font-semibold text-[var(--navy)]">{done.email}</span>. Click it to lock in your spot.</>
          )}
        </p>
        {/* Dev only: Kit not configured, so we surface the link directly. */}
        {done.confirmUrl && (
          <a href={done.confirmUrl} className="mt-5 inline-block text-sm font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)] underline">
            Dev: confirm now →
          </a>
        )}
        <p className="mt-6 text-xs text-neutral">
          Didn&apos;t get it? Check spam, or{" "}
          <button onClick={() => setDone(null)} className="font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)]">try again</button>.
        </p>
      </div>
    )
  }

  // ── Join form ──────────────────────────────────────────────────────────────
  return (
    <>
      <h1 className="font-display text-3xl font-bold text-[var(--navy)]">Join the waitlist</h1>
      <p className="mt-2 text-neutral text-sm">
        Be among the first verified members of the UnSwap home exchange network.
      </p>

      {social && social.count > 0 && (
        <div className="mt-5 flex items-center gap-3">
          <div className="flex -space-x-2">
            {social.recentJoiners.map((j, i) => (
              <span key={i} className="w-8 h-8 rounded-full bg-[var(--navy)]/10 border-2 border-white text-[var(--navy)] text-[11px] font-bold flex items-center justify-center">
                {j.initials}
              </span>
            ))}
          </div>
          <span className="text-xs text-neutral font-medium">{social.count.toLocaleString()} professionals already joined</span>
        </div>
      )}

      <form onSubmit={submit} className="mt-7 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className={labelCls}>First name</label>
            <input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className={inputCls} />
          </div>
          <div>
            <label htmlFor="lastName" className={labelCls}>Last name</label>
            <input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>Work email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="j.doe@un.org" className={inputCls} />
        </div>
        {ref && <p className="text-xs text-[var(--teal)] font-medium">You were referred by a member — you&apos;ll help them move up the list.</p>}
        <button type="submit" disabled={loading} className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 transition-colors shadow-sm">
          {loading ? "Sending…" : "Join the waitlist"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-neutral">
        Already verified?{" "}
        <Link href="/register" className="font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)]">Create your account</Link>
      </p>
    </>
  )
}
