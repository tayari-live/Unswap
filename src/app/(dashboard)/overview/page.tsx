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
import { LuxPageHeader, LuxCard, SectionLabel } from "@/components/ui/lux"

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
    // Only the few member fields this list shows — a bare `include` would pull
    // each member's base64 imageUrl too.
    include: {
      member: {
        select: { fullName: true, avatarInitials: true, organisation: true, dutyStation: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const cards = [
    { label: "Verified Members", value: stats.verifiedMembers, icon: Users, href: "/members" },
    { label: "Pending Verification", value: stats.pendingVerifications, icon: ShieldCheck, href: "/verification" },
    { label: "Active Listings", value: stats.activeListings, icon: Home, href: "/listings" },
    { label: "Swaps In Progress", value: stats.swapsInProgress, icon: ArrowLeftRight, href: "/swaps" },
    { label: "Swaps Completed", value: stats.swapsCompleted, icon: CheckCircle2, href: "/swaps" },
    { label: "Open Disputes", value: stats.openDisputes, icon: AlertTriangle, href: "/swaps", alert: stats.openDisputes > 0 },
    { label: "Waitlist", value: stats.waitlistCount, icon: ListChecks, href: "/waitlist-admin" },
    { label: "Est. MRR", value: `$${stats.mrr.toLocaleString()}`, icon: DollarSign, href: "/analytics" },
  ] as const

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <LuxPageHeader
        eyebrow="The Console"
        title="Network Overview"
        subtitle="An operational snapshot of the UnSwap verified exchange network."
      />

      {/* KPI cards — hairline tiles, gold monochrome icons, Cormorant figures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group bg-[var(--surface)] rounded-md p-6 border border-[var(--hair)] hover:border-[var(--gold)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="w-11 h-11 border border-[var(--hair)] flex items-center justify-center text-[var(--gold-soft)] group-hover:border-[var(--gold)] transition-colors">
                <c.icon size={20} strokeWidth={1.4} />
              </span>
              <ChevronRight size={16} className="text-neutral group-hover:text-[var(--gold-soft)] transition-colors" />
            </div>
            <div className={`mt-5 font-sans font-semibold text-4xl leading-none ${"alert" in c && c.alert ? "text-[var(--crimson)]" : "text-[var(--fg)]"}`}>
              {c.value}
            </div>
            <div className="text-[11px] text-neutral uppercase tracking-[0.18em] mt-2 font-medium">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Verification queue preview */}
        <LuxCard className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--hair)]">
            <div>
              <SectionLabel>Queue</SectionLabel>
              <h2 className="font-sans font-semibold text-2xl text-[var(--fg)] leading-none">Awaiting Verification</h2>
            </div>
            <Link href="/verification" className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--gold-soft)] hover:text-[var(--gold)] transition-colors whitespace-nowrap">
              View queue
            </Link>
          </div>
          <div className="divide-y divide-[var(--hair)]">
            {recentSubmissions.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-neutral">The verification queue is clear.</p>
            )}
            {recentSubmissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3.5">
                  <span className="w-10 h-10 border border-[var(--hair)] text-[var(--gold-soft)] flex items-center justify-center text-xs font-semibold tracking-wide">
                    {s.member.avatarInitials}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-[var(--fg)]">{s.member.fullName}</div>
                    <div className="text-xs text-neutral mt-0.5">{s.member.organisation} · {s.member.dutyStation}</div>
                  </div>
                </div>
                <Link
                  href="/verification"
                  className="text-[11px] font-medium uppercase tracking-[0.12em] px-4 py-2 rounded-sm bg-[var(--gold)] text-[#0a0e1a] hover:bg-[var(--gold-hover)] transition-colors"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </LuxCard>

        {/* Tier distribution */}
        <LuxCard className="p-6">
          <SectionLabel>Revenue</SectionLabel>
          <h2 className="font-sans font-semibold text-2xl text-[var(--fg)] leading-none mb-5">Subscription Mix</h2>
          {stats.tierDistribution.length === 0 && (
            <p className="text-sm text-neutral">No active subscriptions yet.</p>
          )}
          <div className="space-y-4">
            {stats.tierDistribution.map((t) => {
              const total = stats.tierDistribution.reduce((s, x) => s + x.count, 0) || 1
              const pct = Math.round((t.count / total) * 100)
              return (
                <div key={t.tier}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-[var(--fg)]">{TIER_LABELS[t.tier] ?? t.tier}</span>
                    <span className="text-neutral tabular-nums">{t.count}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--hair)] overflow-hidden">
                    <div className="h-full bg-[var(--gold)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </LuxCard>
      </div>
    </div>
  )
}
