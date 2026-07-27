"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, Copy, Sparkles, Trophy, Share2, ArrowUp } from "lucide-react"

type Status = {
  found: boolean
  firstName?: string
  referralUrl?: string
  position?: number
  referrals?: number
  earlyBird?: boolean
}

export function ShareCard() {
  const code = useSearchParams().get("ref") || ""
  const [status, setStatus] = useState<Status | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!code) return
    fetch(`/api/waitlist/status?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStatus(d ?? { found: false }))
      .catch(() => setStatus({ found: false }))
  }, [code])

  if (status && !status.found) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-[var(--navy)]">We couldn&apos;t find your spot</h1>
        <p className="mt-3 text-neutral text-sm">This link looks invalid. Try joining again.</p>
        <Link href="/join" className="mt-6 inline-block text-sm font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)]">Back to the waitlist</Link>
      </div>
    )
  }

  if (!status) {
    return <p className="text-center text-sm text-neutral">Loading your spot…</p>
  }

  const url = status.referralUrl ?? ""
  const shareText = `I just joined the UnSwap waitlist — the verified home-exchange network for UN & international organisation staff. Join with my link:`

  function copy() {
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function share() {
    // Native share sheet on mobile; falls back to copy on desktop.
    if (navigator.share) {
      try {
        await navigator.share({ title: "UnSwap waitlist", text: shareText, url })
        return
      } catch {
        /* user cancelled */
      }
    }
    copy()
  }

  return (
    <div className="text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--teal-light)] text-[var(--teal)] flex items-center justify-center mb-5">
        <Check size={26} />
      </div>
      <h1 className="font-display text-3xl font-bold text-[var(--navy)]">You&apos;re confirmed!</h1>
      <p className="mt-3 text-neutral">
        You&apos;re <span className="font-bold text-[var(--navy)]">#{status.position}</span> in line for early access.
      </p>

      {status.earlyBird && (
        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold-dark)] bg-[var(--parchment)] border border-[var(--gold)]/30 rounded-xl px-4 py-2.5">
          <Sparkles size={16} /> Founding member: 50% off Limited 1X at launch
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-[var(--navy)]/5 border border-[var(--navy)]/10 px-4 py-3.5 flex items-center justify-center gap-2 text-sm text-[var(--navy)]">
        <ArrowUp size={16} className="text-[var(--teal)]" />
        <span><span className="font-bold">Invite peers to jump the queue.</span> Each confirmed referral moves you up.</span>
      </div>

      <div className="mt-6 text-left">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2">Your referral link</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="block flex-1 px-4 py-3 border border-[var(--border)] rounded-xl bg-white text-sm text-[var(--navy)] focus:outline-none"
          />
          <button onClick={copy} className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--navy)] hover:bg-[var(--navy-light)] transition-colors">
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-neutral">{status.referrals ?? 0} confirmed referral{(status.referrals ?? 0) === 1 ? "" : "s"}</p>
          <button onClick={share} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)]">
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      <Link href="/early-access" className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)]">
        <Trophy size={15} /> See the referral leaderboard
      </Link>
    </div>
  )
}
