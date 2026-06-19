import Link from "next/link"
import { Trophy, Sparkles, Gift, ArrowRight } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { getLeaderboard, getWaitlistCount } from "@/server/services/waitlist"

export const dynamic = "force-dynamic"
export const metadata = { title: "Early Access" }

const MEDAL = ["text-[var(--gold)]", "text-neutral", "text-[var(--gold-dark)]"]

export default async function EarlyAccessPage() {
  const [leaders, count] = await Promise.all([getLeaderboard(10), getWaitlistCount()])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Logo wordClassName="text-[var(--navy)] text-lg" /></Link>
          <Link href="/join" className="text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-4 py-2.5 rounded-xl transition-colors">
            Join the waitlist
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold-dark)]">Pre-launch</span>
          <h1 className="mt-3 font-display text-4xl font-bold text-[var(--navy)]">Early Access</h1>
          <p className="mt-3 text-neutral">
            <span className="font-bold text-[var(--navy)]">{count.toLocaleString()}</span> professionals are already in line. Invite peers to climb the leaderboard.
          </p>
        </div>

        {/* Incentives */}
        <div className="grid sm:grid-cols-2 gap-4 mt-10">
          <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
            <Sparkles size={22} className="text-[var(--gold-dark)]" />
            <h2 className="mt-3 font-display font-bold text-lg text-[var(--navy)]">First 500 members</h2>
            <p className="mt-1 text-sm text-neutral">50% off the Limited 1X plan at launch.</p>
          </div>
          <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
            <Gift size={22} className="text-[var(--teal)]" />
            <h2 className="mt-3 font-display font-bold text-lg text-[var(--navy)]">Refer 5+ peers</h2>
            <p className="mt-1 text-sm text-neutral">Earn 6 months of Unlimited Pro, free.</p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden mt-8">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-[var(--border)]">
            <Trophy size={18} className="text-[var(--gold)]" />
            <h2 className="font-display font-bold text-lg text-[var(--navy)]">Top referrers</h2>
          </div>
          {leaders.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-neutral">No referrals yet — be the first to share your link.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {leaders.map((l, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 text-center font-display font-bold ${MEDAL[i] ?? "text-neutral"}`}>{i + 1}</span>
                    <div>
                      <div className="text-sm font-semibold text-[var(--navy)]">{l.name}</div>
                      <div className="text-xs text-neutral">{l.organisation ?? ""}</div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[var(--navy)]">{l.referrals} referral{l.referrals === 1 ? "" : "s"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-10">
          <Link href="/join" className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-7 py-3.5 rounded-xl transition-colors shadow-sm">
            Claim your spot <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </div>
  )
}
