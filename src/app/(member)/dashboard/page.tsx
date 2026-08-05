import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Home,
  ArrowLeftRight,
  CalendarCheck,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Check,
  Star,
  ChevronRight,
  PlusCircle,
} from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { LuxPageHeader, SectionLabel } from "@/components/ui/lux"
import { ResendEmailButton } from "@/components/ui/resend-email-button"

export const dynamic = "force-dynamic"

const TIER_LABELS: Record<string, string> = {
  limited_1x: "Limited 1X",
  standard_2x: "Standard 2X",
  professional_4x: "Professional 4X",
  unlimited_pro: "Unlimited Pro",
  lifetime: "Lifetime",
}

const VERIFICATION_LABELS: Record<string, string> = {
  PENDING_EMAIL: "Confirm your email",
  EMAIL_VERIFIED: "Upload your staff ID",
  PENDING_ID_REVIEW: "ID under review",
  FULLY_VERIFIED: "Fully verified",
  REJECTED: "Verification rejected",
  SUSPENDED: "Account suspended",
}

const PENDING_INCOMING = ["REQUESTED", "COUNTER_OFFERED"]
const UPCOMING = ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"]

function nights(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000))
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

export default async function MemberDashboardPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      listings: true,
      subscription: true,
      hostedRequests: { include: { requester: true, listing: true }, orderBy: { createdAt: "desc" } },
      sentRequests: { include: { host: true, listing: true }, orderBy: { createdAt: "desc" } },
    },
  })
  if (!user) redirect("/login")

  const activeListings = user.listings.filter((l) => l.status === "ACTIVE").length
  const incoming = user.hostedRequests.filter((r) => PENDING_INCOMING.includes(r.status))
  const upcoming = [...user.hostedRequests, ...user.sentRequests]
    .filter((r) => UPCOMING.includes(r.status))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  // Credits: 1 night hosted = 1 credit earned; 1 night stayed = 1 spent.
  const earned = user.hostedRequests
    .filter((r) => r.status === "COMPLETED" && r.mode === "credits")
    .reduce((s, r) => s + nights(r.startDate, r.endDate), 0)
  const spent = user.sentRequests
    .filter((r) => r.status === "COMPLETED" && r.mode === "credits")
    .reduce((s, r) => s + nights(r.startDate, r.endDate), 0)
  const credits = earned - spent

  const isVerified = user.verificationStatus === "FULLY_VERIFIED"
  const profileIncomplete = user.profileCompletion < 80

  // Getting-started checklist — consolidates the onboarding path; hidden once done.
  const idReview = user.verificationStatus === "PENDING_ID_REVIEW"

  // On rejection, surface the reviewer's note so the member knows what to fix.
  const lastRejection =
    user.verificationStatus === "REJECTED"
      ? await prisma.verificationSubmission.findFirst({
          where: { memberId: userId, status: "REJECTED" },
          orderBy: { reviewedAt: "desc" },
          select: { reviewNote: true },
        })
      : null
  const checklist = [
    {
      title: "Confirm your email",
      sub: user.verificationStatus === "PENDING_EMAIL" ? "Check your inbox for the confirmation link." : null,
      done: user.verificationStatus !== "PENDING_EMAIL",
      href: undefined as string | undefined,
      action: "",
      resendEmail: user.verificationStatus === "PENDING_EMAIL" ? user.email : undefined,
    },
    {
      title: "Complete your profile",
      sub: profileIncomplete ? `${user.profileCompletion}% done — members exchange with people, not just listings.` : null,
      done: !profileIncomplete,
      href: "/dashboard/profile",
      action: "Complete",
    },
    {
      title: "List your first home",
      sub: user.listings.length ? null : "Add a home you'd like to offer for exchange.",
      done: user.listings.length > 0,
      href: "/dashboard/listings/new",
      action: "Add home",
    },
    {
      title: "Verify your identity",
      sub: isVerified
        ? null
        : idReview
        ? "Under review — usually within 2 business days."
        : user.verificationStatus === "REJECTED"
        ? `Not approved${lastRejection?.reviewNote ? ` — “${lastRejection.reviewNote}”` : ""}. Resubmit with updated documents.`
        : "Required to request or accept a swap.",
      done: isVerified,
      href: isVerified || idReview ? undefined : "/verify-identity",
      action: user.verificationStatus === "REJECTED" ? "Resubmit" : "Verify",
    },
  ]
  const checklistDone = checklist.filter((s) => s.done).length
  const showChecklist = checklistDone < checklist.length

  const cards = [
    { label: "Active Listings", value: activeListings, icon: Home },
    { label: "Incoming Requests", value: incoming.length, icon: ArrowLeftRight },
    { label: "Upcoming Exchanges", value: upcoming.length, icon: CalendarCheck },
    { label: "UnSwap Credits", value: credits, icon: Coins },
  ] as const

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <LuxPageHeader eyebrow="Your Network"
        title={`Welcome back, ${user.firstName}`}
        subtitle="Your activity across the UnSwap exchange network."
      />

      {/* Getting-started checklist — replaces the scattered status cards */}
      {showChecklist && (
        <div className="rounded-md border border-[var(--hair)] bg-[var(--surface)] p-6 mb-5">
          <div className="flex items-end justify-between mb-1">
            <SectionLabel>First Steps</SectionLabel>
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral tabular-nums">
              {checklistDone} of {checklist.length}
            </span>
          </div>
          <h2 className="font-display font-light text-2xl text-[var(--fg)] leading-none">Getting started</h2>
          {/* Progress as a hairline rule rather than a bar */}
          <div className="mt-4 mb-5 h-px bg-[var(--hair)] overflow-hidden">
            <div
              className="h-full bg-[var(--gold)] transition-all duration-500"
              style={{ width: `${(checklistDone / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-3.5">
            {checklist.map((s, i) => (
              <li key={s.title} className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 border flex items-center justify-center text-[11px] font-medium flex-shrink-0 transition-colors ${
                    s.done
                      ? "border-[var(--gold)] text-[var(--gold-soft)]"
                      : "border-[var(--hair)] text-neutral"
                  }`}
                >
                  {s.done ? <Check size={13} strokeWidth={2} /> : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${s.done ? "text-neutral" : "text-[var(--fg)] font-medium"}`}>
                    {s.title}
                  </div>
                  {s.sub && <div className="text-xs text-neutral mt-0.5 leading-relaxed">{s.sub}</div>}
                </div>
                {!s.done && s.href && (
                  <Link
                    href={s.href}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] px-4 py-2 rounded-sm bg-[var(--gold)] text-[#0a0e1a] hover:bg-[var(--gold-hover)] transition-colors"
                  >
                    {s.action} <ChevronRight size={13} />
                  </Link>
                )}
                {!s.done && s.resendEmail && (
                  <ResendEmailButton email={s.resendEmail} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-[var(--surface)] rounded-md p-6 border border-[var(--hair)]"
          >
            <span className="w-11 h-11 border border-[var(--hair)] flex items-center justify-center text-[var(--gold-soft)]">
              <c.icon size={20} strokeWidth={1.4} />
            </span>
            <div className="mt-5 font-display font-light text-4xl leading-none text-[var(--fg)]">{c.value}</div>
            <div className="text-[11px] text-neutral uppercase tracking-[0.18em] mt-2 font-medium">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Incoming swap requests */}
        <div className="lg:col-span-2 bg-surface rounded-md border border-[var(--hair)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--hair)]">
            <h2 className="font-display font-bold text-lg text-[var(--fg)]">Incoming Swap Requests</h2>
          </div>
          <div className="divide-y divide-[var(--hair)]">
            {incoming.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-neutral">No pending requests right now.</p>
            )}
            {incoming.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-[var(--navy)]/10 text-[var(--fg)] flex items-center justify-center text-xs font-bold">
                    {r.requester.avatarInitials}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--fg)]">{r.requester.fullName}</div>
                    <div className="text-xs text-neutral">
                      {r.listing.title} · {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[var(--gold)]/15 text-[var(--gold-dark)]">
                  {r.status === "COUNTER_OFFERED" ? "Counter" : "New"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Verification + trust */}
          <div className="bg-surface rounded-md border border-[var(--hair)] p-6">
            <div className="flex items-center gap-2 mb-3">
              {isVerified ? (
                <ShieldCheck size={18} className="text-[var(--teal)]" />
              ) : (
                <ShieldAlert size={18} className="text-[var(--gold-dark)]" />
              )}
              <h2 className="font-display font-bold text-base text-[var(--fg)]">Verification</h2>
            </div>
            <p className="text-sm text-neutral-dark">
              {VERIFICATION_LABELS[user.verificationStatus] ?? user.verificationStatus}
            </p>
            <div className="mt-4 pt-4 border-t border-[var(--hair)] flex items-center justify-between">
              <span className="text-xs text-neutral uppercase tracking-wide font-semibold">Trust Score</span>
              <span className="flex items-center gap-1 text-sm font-bold text-[var(--fg)]">
                <Star size={14} className="text-[var(--gold)]" />
                {user.trustScore != null ? user.trustScore.toFixed(1) : "—"}
              </span>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-surface rounded-md border border-[var(--hair)] p-6">
            <h2 className="font-display font-bold text-base text-[var(--fg)] mb-3">Subscription</h2>
            {user.subscription ? (
              <>
                <div className="inline-flex items-center text-sm font-bold px-3 py-1 rounded-full bg-[var(--navy)] text-[var(--gold)]">
                  {TIER_LABELS[user.subscription.tier] ?? user.subscription.tier}
                </div>
                <div className="mt-3 text-xs text-neutral space-y-1">
                  <div>
                    Guarantee: ${user.subscription.propertyGuarantee.toLocaleString()}
                  </div>
                  <div>
                    Exchanges/year:{" "}
                    {user.subscription.exchangesPerYear === -1
                      ? "Unlimited"
                      : user.subscription.exchangesPerYear}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral">No active subscription.</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming exchanges */}
      <div className="bg-surface rounded-md border border-[var(--hair)] overflow-hidden mt-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--hair)]">
          <h2 className="font-display font-bold text-lg text-[var(--fg)]">Upcoming Exchanges</h2>
        </div>
        <div className="divide-y divide-[var(--hair)]">
          {upcoming.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-neutral">No upcoming exchanges yet.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral/60">
                <PlusCircle size={15} /> List a home to start exchanging
              </span>
            </div>
          )}
          {upcoming.slice(0, 5).map((r) => (
            <div key={r.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <div className="text-sm font-semibold text-[var(--fg)]">{r.listing.title}</div>
                <div className="text-xs text-neutral">
                  {fmtDate(r.startDate)} – {fmtDate(r.endDate)} · {nights(r.startDate, r.endDate)} nights
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[var(--teal)]/15 text-[var(--teal)]">
                {r.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
