import { redirect } from "next/navigation"
import { Star } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { listReviewsForUser } from "@/server/services/reviews"
import { PageHeader } from "@/components/ui/page-header"
import { ProfileWizard } from "@/components/profile/profile-wizard"

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

export const dynamic = "force-dynamic"

const VERIFICATION_LABELS: Record<string, string> = {
  PENDING_EMAIL: "Email not confirmed",
  EMAIL_VERIFIED: "Email verified",
  PENDING_ID_REVIEW: "ID under review",
  FULLY_VERIFIED: "Fully verified",
  REJECTED: "Verification rejected",
  SUSPENDED: "Suspended",
}

export default async function ProfilePage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect("/login")

  const reviews = await listReviewsForUser(userId)
  const hostReviews = reviews.filter((r) => r.aboutHost)

  const initial = {
    fullName: user.fullName ?? "",
    imageUrl: user.imageUrl ?? null,
    nationality: user.nationality ?? "",
    dutyStation: user.dutyStation ?? "",
    organisation: user.organisation ?? "",
    languages: user.languages ?? "",
    bio: user.bio ?? "",
    linkedinUrl: user.linkedinUrl ?? "",
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <PageHeader title="Profile" subtitle="How you appear to other members of the network." />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <div className="text-xs text-neutral uppercase tracking-wide font-semibold">Profile completion</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-neutral-light overflow-hidden">
              <div className="h-full bg-[var(--gold)]" style={{ width: `${user.profileCompletion}%` }} />
            </div>
            <span className="text-sm font-bold text-[var(--navy)]">{user.profileCompletion}%</span>
          </div>
        </div>
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <div className="text-xs text-neutral uppercase tracking-wide font-semibold">Verification</div>
          <div className="mt-2 text-sm font-semibold text-[var(--navy)]">
            {VERIFICATION_LABELS[user.verificationStatus] ?? user.verificationStatus}
          </div>
        </div>
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <div className="text-xs text-neutral uppercase tracking-wide font-semibold">Trust score</div>
          <div className="mt-2 flex items-center gap-1.5">
            <Star size={16} className="text-[var(--gold)]" fill={user.trustScore != null ? "currentColor" : "none"} />
            <span className="text-sm font-bold text-[var(--navy)]">
              {user.trustScore != null ? user.trustScore.toFixed(1) : "New host"}
            </span>
            {hostReviews.length > 0 && (
              <span className="text-xs text-neutral">· {hostReviews.length} review{hostReviews.length === 1 ? "" : "s"}</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-8">
        <ProfileWizard initial={initial} />
      </div>

      {/* Reviews received */}
      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-8 mt-6">
        <h2 className="font-display font-bold text-lg text-[var(--navy)] mb-4">Reviews received</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-neutral">No reviews yet. Complete an exchange to start building your reputation.</p>
        ) : (
          <div className="space-y-5">
            {reviews.map((rv) => (
              <div key={rv.id} className="border-b border-[var(--border)] last:border-0 pb-5 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-xs font-bold">
                      {rv.author.avatarInitials}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-[var(--navy)]">{rv.author.fullName}</div>
                      <div className="text-xs text-neutral">
                        {rv.aboutHost ? "Stayed at your home" : "You stayed with them"} · {fmtDate(rv.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={13} className={rv.overall >= n ? "text-[var(--gold)]" : "text-[var(--border)]"} fill={rv.overall >= n ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <p className="mt-2.5 text-sm text-neutral-dark leading-relaxed">{rv.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
