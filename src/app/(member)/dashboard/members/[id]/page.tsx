import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { BadgeCheck, Star, ShieldAlert, ChevronLeft, ArrowRight } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { listReviewsForUser } from "@/server/services/reviews"
import { ReviewsList } from "@/components/profile/reviews-list"
import { MessageButton } from "../../messages/message-button"

export const dynamic = "force-dynamic"

/**
 * Another member's profile — the trust view a potential swap partner needs.
 *
 * Deliberately excludes anything the member didn't publish for other members:
 * no email, no phone, no exact address, no profile-completion percentage, and
 * no verification-workflow detail beyond the badge itself. The fields shown
 * (bio, organisation, duty station, nationality, languages, LinkedIn) are the
 * ones the profile wizard collects explicitly to show other members.
 *
 * Verified-only, matching messaging: profile detail is part of what
 * verification unlocks, so it shouldn't leak to unverified accounts.
 */
export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const viewerId = (session?.user as any)?.id as string | undefined
  if (!viewerId) redirect("/login")

  // Your own profile has an edit affordance and private sections — send you there.
  if (id === viewerId) redirect("/dashboard/profile")

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { verificationStatus: true },
  })

  if (viewer?.verificationStatus !== "FULLY_VERIFIED") {
    return (
      <div className="max-w-md mx-auto py-16">
        <div className="bg-surface rounded-md border border-[var(--hair)] p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-md border border-[var(--hair)] text-[var(--gold-dark)] flex items-center justify-center mb-5">
            <ShieldAlert size={26} />
          </div>
          <h2 className="font-sans text-2xl font-semibold text-[var(--fg)]">Verification required</h2>
          <p className="mt-3 text-neutral leading-relaxed">
            Member profiles are reserved for verified members. Complete verification to see who you&apos;re exchanging with.
          </p>
          <Link
            href="/verify-identity"
            className="mt-7 inline-flex items-center justify-center py-3 px-6 rounded-sm text-[12px] font-medium uppercase tracking-[0.12em] text-ink bg-[var(--gold)] hover:bg-[var(--gold-hover)] transition-colors w-full"
          >
            Get verified
          </Link>
        </div>
      </div>
    )
  }

  const member = await prisma.user.findUnique({
    where: { id },
    // Explicit select, not a bare include: this is another member's record, so
    // the shape of what leaves the database is the privacy boundary.
    select: {
      id: true,
      firstName: true,
      fullName: true,
      avatarInitials: true,
      imageUrl: true,
      organisation: true,
      dutyStation: true,
      nationality: true,
      languages: true,
      bio: true,
      linkedinUrl: true,
      trustScore: true,
      verificationStatus: true,
      role: true,
      createdAt: true,
    },
  })

  // Admin accounts aren't network members and have no profile to show.
  if (!member || member.role !== "member") return notFound()

  const [reviews, completedExchanges] = await Promise.all([
    listReviewsForUser(id),
    prisma.swapRequest.count({
      where: { OR: [{ requesterId: id }, { hostId: id }], status: "COMPLETED" },
    }),
  ])

  const isVerified = member.verificationStatus === "FULLY_VERIFIED"

  const aboutRows = [
    { label: "Organisation", value: member.organisation },
    { label: "Duty station", value: member.dutyStation },
    { label: "Nationality", value: member.nationality },
    { label: "Languages", value: member.languages },
    { label: "Member since", value: String(member.createdAt.getFullYear()) },
  ].filter((r) => r.value)

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/dashboard/browse"
          className="inline-flex items-center gap-2 font-sans text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--gold-dark)] hover:text-[var(--fg)] transition-colors"
        >
          <ChevronLeft size={16} /> Discover homes
        </Link>
      </div>

      {/* Identity + trust */}
      <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-8">
        <div className="flex items-center gap-4">
          {member.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.imageUrl} alt="" className="w-16 h-16 rounded-full object-cover border border-[var(--hair)]" />
          ) : (
            <span className="w-16 h-16 rounded-full bg-[var(--navy)]/10 text-[var(--fg)] flex items-center justify-center text-lg font-bold flex-shrink-0">
              {member.avatarInitials}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-sans text-xl font-semibold text-[var(--fg)] truncate">{member.fullName}</h1>
              {isVerified && <BadgeCheck size={18} className="text-[var(--teal)] flex-shrink-0" />}
            </div>
            <div className="text-sm text-neutral mt-0.5 truncate">
              {isVerified ? "Verified UN Professional" : "Member"}
              {member.dutyStation ? ` · ${member.dutyStation}` : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 mt-5 pt-5 border-t border-[var(--hair)] text-sm">
          <span className="flex items-center gap-1.5 font-semibold text-[var(--fg)]">
            <Star size={14} className="text-[var(--gold)] fill-[var(--gold)]" />
            {member.trustScore != null ? member.trustScore.toFixed(1) : "New member"}
          </span>
          <span className="text-neutral">{completedExchanges} exchange{completedExchanges === 1 ? "" : "s"}</span>
          <span className="text-neutral">{reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
        </div>

        <div className="mt-5">
          <MessageButton
            otherUserId={member.id}
            label={`Message ${member.firstName}`}
            className="inline-flex items-center justify-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--fg)] border border-[var(--hair)] hover:border-[var(--gold)] px-6 py-3 rounded-sm transition-colors"
          />
        </div>
      </div>

      {/* About — only what this member chose to publish */}
      {(member.bio || aboutRows.length > 0 || member.linkedinUrl) && (
        <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-8 mt-6">
          <h2 className="font-sans font-semibold text-xl text-[var(--fg)] mb-4">About</h2>
          {member.bio && <p className="text-sm text-neutral-dark leading-relaxed mb-5">{member.bio}</p>}
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
          {member.linkedinUrl && (
            <a
              href={member.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--gold-soft)] hover:text-[var(--gold)] mt-4"
            >
              View LinkedIn <ArrowRight size={13} />
            </a>
          )}
        </div>
      )}

      <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-8 mt-6">
        <h2 className="font-sans font-semibold text-xl text-[var(--fg)] mb-4">Reviews</h2>
        <ReviewsList
          reviews={reviews}
          subjectName={member.firstName}
          emptyMessage={`${member.firstName} hasn't received any reviews yet.`}
        />
      </div>
    </div>
  )
}
