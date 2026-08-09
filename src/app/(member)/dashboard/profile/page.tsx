import { redirect } from "next/navigation"
import { Star } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { listReviewsForUser } from "@/server/services/reviews"
import { LuxPageHeader } from "@/components/ui/lux"
import { ProfileWizard } from "@/components/profile/profile-wizard"

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

export const dynamic = "force-dynamic"


export default async function ProfilePage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect("/login")

  const reviews = await listReviewsForUser(userId)

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
      <LuxPageHeader eyebrow="Your Profile" title="Profile" subtitle="How you appear to other members of the network." />

      <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-8">
        <ProfileWizard initial={initial} />
      </div>

      {/* Reviews received */}
      <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-8 mt-6">
        <h2 className="font-sans font-semibold text-xl text-[var(--fg)] mb-4">Reviews received</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-neutral">No reviews yet. Complete an exchange to start building your reputation.</p>
        ) : (
          <div className="space-y-5">
            {reviews.map((rv) => (
              <div key={rv.id} className="border-b border-[var(--hair)] last:border-0 pb-5 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-full bg-[var(--navy)]/10 text-[var(--fg)] flex items-center justify-center text-xs font-bold">
                      {rv.author.avatarInitials}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-[var(--fg)]">{rv.author.fullName}</div>
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
