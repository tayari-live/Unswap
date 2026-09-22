import { redirect } from "next/navigation"
import Link from "next/link"
import { Compass, Lock, Clock } from "lucide-react"
import { auth } from "@/server/auth"
import { conciergeEligibility } from "@/server/services/trust"
import { listMemberConciergeLeads } from "@/server/services/concierge"
import { MIN_SCORE_CONCIERGE } from "@/lib/trust"
import { LuxPageHeader } from "@/components/ui/lux"
import { ConciergeForm } from "./concierge-form"

export const dynamic = "force-dynamic"

const PRIORITY_TONE: Record<string, string> = {
  high: "bg-[var(--crimson)]/10 text-[var(--crimson)]",
  medium: "bg-[var(--gold)]/15 text-[var(--gold-dark)]",
  low: "bg-[var(--navy)]/8 text-[var(--fg)]/70",
}

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

export default async function ConciergePage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const [{ eligible, score }, leads] = await Promise.all([
    conciergeEligibility(userId),
    listMemberConciergeLeads(userId),
  ])

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <LuxPageHeader
        eyebrow="Members' Service"
        title="Relocation Concierge"
        subtitle="Hands-on help settling into your next posting — housing leads, schools, logistics and local setup."
      />

      {eligible ? (
        <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-md bg-[var(--gold)]/12 text-[var(--gold-dark)] flex items-center justify-center flex-shrink-0">
              <Compass size={20} />
            </div>
            <p className="text-sm text-neutral-dark leading-relaxed">
              Tell us about your move and our team will follow up with tailored options. Your
              request is triaged the moment you send it, so the right concierge picks it up.
            </p>
          </div>
          <ConciergeForm />
        </div>
      ) : (
        <div className="bg-surface rounded-md border border-[var(--hair)] p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-md bg-[var(--navy)]/5 text-[var(--gold-dark)] flex items-center justify-center mb-5">
            <Lock size={24} />
          </div>
          <h2 className="font-sans text-xl font-semibold text-[var(--fg)]">Unlocks at trust {MIN_SCORE_CONCIERGE}</h2>
          <p className="mt-3 text-sm text-neutral leading-relaxed max-w-md mx-auto">
            Relocation Concierge is reserved for established members. Your trust score is{" "}
            <span className="font-semibold text-[var(--fg)]">{score}</span>. Get fully verified and
            complete a few exchanges to reach {MIN_SCORE_CONCIERGE}.
          </p>
          <Link
            href="/dashboard"
            className="mt-7 inline-flex items-center justify-center py-2.5 px-5 rounded-xl text-sm font-semibold text-white bg-[var(--navy)] hover:bg-[var(--navy-light)] transition-colors"
          >
            See how to raise your score
          </Link>
        </div>
      )}

      {leads.length > 0 && (
        <div className="mt-8">
          <h3 className="font-sans text-xs font-bold text-[var(--fg)] uppercase tracking-[0.14em] mb-4">Your requests</h3>
          <div className="bg-surface rounded-md border border-[var(--hair)] divide-y divide-[var(--hair)]">
            {leads.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--fg)]">{l.destination}</span>
                    <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${PRIORITY_TONE[l.priority] ?? PRIORITY_TONE.medium}`}>
                      {l.priority}
                    </span>
                    <span className="text-[11px] text-neutral">{l.category}</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-dark leading-snug">{l.summary}</p>
                </div>
                <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs text-neutral">
                  <Clock size={12} /> {fmt(l.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
