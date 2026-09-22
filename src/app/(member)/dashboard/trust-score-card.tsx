import { ShieldCheck, Check, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTrustScore } from "@/server/services/trust"
import { BAND_LABEL, MIN_SCORE_HIGH_VALUE, MIN_SCORE_CONCIERGE } from "@/lib/trust"

/**
 * Member-facing view of their live trust score — the composite that gates
 * higher-value homes and Relocation Concierge eligibility. Shown transparently
 * (the three inputs and the two gates) so the member sees exactly how to raise
 * it. Server component: fetches its own score.
 */
export async function TrustScoreCard({ userId }: { userId: string }) {
  const t = await getTrustScore(userId)

  const rows = [
    { label: "Verification", value: t.parts.verification, max: 40 },
    { label: "Referral", value: t.parts.referral, max: 20 },
    { label: "Platform history", value: t.parts.history, max: 40 },
  ]
  const gates = [
    { label: "Request higher-value homes", need: MIN_SCORE_HIGH_VALUE, ok: t.score >= MIN_SCORE_HIGH_VALUE },
    { label: "Relocation Concierge", need: MIN_SCORE_CONCIERGE, ok: t.score >= MIN_SCORE_CONCIERGE },
  ]

  return (
    <div className="mb-16">
      <h3 className="font-sans text-xs font-bold text-[var(--fg)] uppercase tracking-[0.14em] mb-4">Trust Score</h3>
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--hair)] p-6 md:p-8 grid gap-8 md:grid-cols-[auto_1fr] items-center">
        <div className="flex items-center gap-4 md:pr-8 md:border-r border-[var(--hair)]">
          <span className="w-12 h-12 rounded-md bg-[var(--gold)]/12 text-[var(--gold-dark)] flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={24} />
          </span>
          <div>
            <div className="font-display text-[40px] font-bold leading-none text-[var(--fg)]">
              {t.score}
              <span className="font-sans text-[18px] text-[var(--fg)]/40 font-normal">/100</span>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--gold-dark)] mt-1">
              {BAND_LABEL[t.band]}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2.5">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-32 flex-shrink-0 text-[13px] text-neutral-dark">{r.label}</span>
                <span className="flex-1 h-2 rounded-full bg-[var(--navy)]/8 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-[var(--gold)]"
                    style={{ width: `${Math.round((r.value / r.max) * 100)}%` }}
                  />
                </span>
                <span className="w-12 text-right text-[12px] font-semibold text-[var(--fg)]">{r.value}/{r.max}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            {gates.map((g) => (
              <span
                key={g.label}
                className={cn(
                  "inline-flex items-center gap-1.5 text-[12px] font-medium",
                  g.ok ? "text-[var(--teal)]" : "text-neutral",
                )}
              >
                {g.ok ? <Check size={13} /> : <Lock size={12} />} {g.label}
                {!g.ok && <span className="text-neutral">(needs {g.need})</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
