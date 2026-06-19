import Link from "next/link"
import {
  ShieldCheck,
  Users,
  Home,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  DollarSign,
  ChevronRight,
} from "lucide-react"
import { getOverviewStats } from "@/server/services/dashboard"
import { prisma } from "@/server/prisma"
import { PageHeader } from "@/components/ui/page-header"

export const dynamic = "force-dynamic"

const TIER_LABELS: Record<string, string> = {
  limited_1x: "Limited 1X",
  standard_2x: "Standard 2X",
  professional_4x: "Professional 4X",
  unlimited_pro: "Unlimited Pro",
  lifetime: "Lifetime",
}

export default async function OverviewPage() {
  const stats = await getOverviewStats()
  const recentSubmissions = await prisma.verificationSubmission.findMany({
    where: { status: "PENDING" },
    include: { member: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const cards = [
    { label: "Verified Members", value: stats.verifiedMembers, icon: Users, href: "/members", tone: "navy" },
    { label: "Pending Verification", value: stats.pendingVerifications, icon: ShieldCheck, href: "/verification", tone: "gold" },
    { label: "Active Listings", value: stats.activeListings, icon: Home, href: "/listings", tone: "teal" },
    { label: "Swaps In Progress", value: stats.swapsInProgress, icon: ArrowLeftRight, href: "/swaps", tone: "navy" },
    { label: "Swaps Completed", value: stats.swapsCompleted, icon: CheckCircle2, href: "/swaps", tone: "teal" },
    { label: "Open Disputes", value: stats.openDisputes, icon: AlertTriangle, href: "/swaps", tone: "crimson" },
    { label: "Waitlist", value: stats.waitlistCount, icon: ListChecks, href: "/waitlist", tone: "gold" },
    { label: "Est. MRR", value: `$${stats.mrr.toLocaleString()}`, icon: DollarSign, href: "/analytics", tone: "navy" },
  ] as const

  const toneRing: Record<string, string> = {
    navy: "text-[var(--navy)] bg-[var(--navy)]/10",
    gold: "text-[var(--gold-dark)] bg-[var(--gold)]/15",
    teal: "text-[var(--teal)] bg-[var(--teal)]/15",
    crimson: "text-[var(--crimson)] bg-[var(--crimson)]/10",
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Network Overview"
        subtitle="Operational snapshot of the UnSwap verified exchange network."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-surface rounded-2xl p-5 border border-[var(--border)] shadow-sm hover:border-[var(--gold)] hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${toneRing[c.tone]}`}>
                <c.icon size={18} />
              </span>
              <ChevronRight size={16} className="text-neutral group-hover:text-[var(--gold-dark)] transition-colors" />
            </div>
            <div className="mt-4 text-3xl font-display font-bold text-[var(--navy)]">{c.value}</div>
            <div className="text-xs text-neutral uppercase tracking-wide mt-1 font-semibold">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Verification queue preview */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h2 className="font-display font-bold text-lg text-[var(--navy)]">Awaiting Verification</h2>
            <Link href="/verification" className="text-xs font-semibold text-[var(--teal)] hover:underline">
              View queue
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {recentSubmissions.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-neutral">The verification queue is clear.</p>
            )}
            {recentSubmissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-xs font-bold">
                    {s.member.avatarInitials}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--navy)]">{s.member.fullName}</div>
                    <div className="text-xs text-neutral">{s.member.organisation} · {s.member.dutyStation}</div>
                  </div>
                </div>
                <Link
                  href="/verification"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-hover)] transition"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Tier distribution */}
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
          <h2 className="font-display font-bold text-lg text-[var(--navy)] mb-4">Subscription Mix</h2>
          {stats.tierDistribution.length === 0 && (
            <p className="text-sm text-neutral">No active subscriptions yet.</p>
          )}
          <div className="space-y-3">
            {stats.tierDistribution.map((t) => {
              const total = stats.tierDistribution.reduce((s, x) => s + x.count, 0) || 1
              const pct = Math.round((t.count / total) * 100)
              return (
                <div key={t.tier}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-neutral-dark">{TIER_LABELS[t.tier] ?? t.tier}</span>
                    <span className="text-neutral">{t.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-light overflow-hidden">
                    <div className="h-full bg-[var(--gold)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
