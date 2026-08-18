import Link from "next/link"
import { redirect } from "next/navigation"
import { BadgeCheck, Star, ShieldCheck, Mail, Clock, ArrowRight } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { listReviewsForUser } from "@/server/services/reviews"
import { LuxPageHeader } from "@/components/ui/lux"
import { ReviewsList } from "@/components/profile/reviews-list"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect("/login")

  const [reviews, completedExchanges] = await Promise.all([
    listReviewsForUser(userId),
    prisma.swapRequest.count({
      where: { OR: [{ requesterId: userId }, { hostId: userId }], status: "COMPLETED" },
    }),
  ])

  const isFullyVerified = user.verificationStatus === "FULLY_VERIFIED"
  const emailConfirmed = user.verificationStatus !== "PENDING_EMAIL"
  const identityPending = user.verificationStatus === "PENDING_ID_REVIEW"

  // Only real, filled-in fields — no placeholder rows for anything the member skipped.
  const aboutRows = [
    { label: "Organisation", value: user.organisation },
    { label: "Duty station", value: user.dutyStation },
    { label: "Nationality", value: user.nationality },
    { label: "Languages", value: user.languages },
  ].filter((r) => r.value)

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <LuxPageHeader
        eyebrow="Your Profile"
        title="Profile"
        subtitle="How you appear to other members of the network."
        action={
          <Link
            href="/dashboard/profile/edit"
            className="inline-flex items-center justify-center text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--fg)] px-6 py-3 rounded-sm border border-[var(--hair)] hover:border-[var(--gold)] transition-colors"
          >
            Edit Profile
          </Link>
        }
      />

      {/* Identity header — avatar, verified badge, org/duty station, trust summary */}
      <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-8">
        <div className="flex items-center gap-4">
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="w-16 h-16 rounded-full object-cover border border-[var(--hair)]" />
          ) : (
            <span className="w-16 h-16 rounded-full bg-[var(--navy)]/10 text-[var(--fg)] flex items-center justify-center text-lg font-bold flex-shrink-0">
              {user.avatarInitials}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-sans text-xl font-semibold text-[var(--fg)] truncate">{user.fullName}</h2>
              {isFullyVerified && <BadgeCheck size={18} className="text-[var(--teal)] flex-shrink-0" />}
            </div>
            <div className="text-sm text-neutral mt-0.5 truncate">
              {[user.organisation, user.dutyStation].filter(Boolean).join(" · ") || "No organisation added yet"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 mt-5 pt-5 border-t border-[var(--hair)] text-sm">
          <span className="flex items-center gap-1.5 font-semibold text-[var(--fg)]">
            <Star size={14} className="text-[var(--gold)] fill-[var(--gold)]" />
            {user.trustScore != null ? user.trustScore.toFixed(1) : "New member"}
          </span>
          <span className="text-neutral">{completedExchanges} exchange{completedExchanges === 1 ? "" : "s"}</span>
          <span className="text-neutral">{reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      {/* About — only rendered if the member has actually filled something in */}
      {(user.bio || aboutRows.length > 0 || user.linkedinUrl) && (
        <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-8 mt-6">
          <h2 className="font-sans font-semibold text-xl text-[var(--fg)] mb-4">About</h2>
          {user.bio && <p className="text-sm text-neutral-dark leading-relaxed mb-5">{user.bio}</p>}
          {aboutRows.length > 0 && (
            <dl className="text-sm divide-y divide-[var(--hair)] border border-[var(--hair)] rounded-xl overflow-hidden">
              {aboutRows.map((r) => (
                <div key={r.label} className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-neutral">{r.label}</dt>
                  <dd className="font-medium text-[var(--fg)] text-right truncate">{r.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {user.linkedinUrl && (
            <a href={user.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--gold-soft)] hover:text-[var(--gold)] mt-4">
              View LinkedIn <ArrowRight size={13} />
            </a>
          )}
        </div>
      )}

      {/* Verification — honest about what's actually tracked: email + a single
          identity/employment review step (the data model doesn't split those
          into two independent checks), not a fabricated three-item list. */}
      <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-8 mt-6">
        <h2 className="font-sans font-semibold text-xl text-[var(--fg)] mb-4">Verification</h2>
        <div className="space-y-3">
          <VerificationRow done={emailConfirmed} icon={Mail} label="Email confirmed" />
          <VerificationRow
            done={isFullyVerified}
            pending={identityPending}
            icon={ShieldCheck}
            label={identityPending ? "Identity and employment under review" : "Identity & employment verified"}
          />
        </div>
        {!isFullyVerified && (
          <Link
            href="/verify-identity"
            className="inline-flex items-center justify-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-ink bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-6 py-3 rounded-sm transition-colors mt-5"
          >
            Verify Identity
          </Link>
        )}
      </div>

      {/* Reviews received */}
      <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-8 mt-6">
        <h2 className="font-sans font-semibold text-xl text-[var(--fg)] mb-4">Reviews received</h2>
        <ReviewsList
          reviews={reviews}
          emptyMessage="No reviews yet. Complete an exchange to start building your reputation."
        />
      </div>
    </div>
  )
}

function VerificationRow({
  done,
  pending,
  icon: Icon,
  label,
}: {
  done: boolean
  pending?: boolean
  icon: typeof Mail
  label: string
}) {
  const tone = done ? "text-[var(--teal)]" : pending ? "text-[var(--gold-dark)]" : "text-neutral"
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-[var(--teal)]/15" : pending ? "bg-[var(--gold)]/15" : "bg-neutral-light"} ${tone}`}>
        {pending && !done ? <Clock size={14} /> : <Icon size={14} />}
      </span>
      <span className={done ? "text-[var(--fg)] font-medium" : "text-neutral-dark"}>{label}</span>
    </div>
  )
}
