import { Star } from "lucide-react"

export type ProfileReview = {
  id: string
  overall: number
  body: string
  aboutHost: boolean
  createdAt: Date
  author: { fullName: string; avatarInitials: string; organisation: string | null }
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

/**
 * Reviews a member has received. Shared between the member's own profile and
 * another member's, which is why the relationship line is parameterised:
 * `subjectName` switches it from second person ("Stayed at your home") to
 * third ("Stayed at Amara's home").
 */
export function ReviewsList({
  reviews,
  subjectName,
  emptyMessage,
}: {
  reviews: ProfileReview[]
  /** Omit for the viewer's own profile. */
  subjectName?: string
  emptyMessage: string
}) {
  if (reviews.length === 0) {
    return <p className="text-sm text-neutral">{emptyMessage}</p>
  }

  return (
    <div className="space-y-5">
      {reviews.map((rv) => {
        const context = subjectName
          ? rv.aboutHost
            ? `Stayed at ${subjectName}'s home`
            : `Hosted ${subjectName}`
          : rv.aboutHost
            ? "Stayed at your home"
            : "You stayed with them"

        return (
          <div key={rv.id} className="border-b border-[var(--hair)] last:border-0 pb-5 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-full bg-[var(--navy)]/10 text-[var(--fg)] flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {rv.author.avatarInitials}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--fg)] truncate">{rv.author.fullName}</div>
                  <div className="text-xs text-neutral truncate">{context} · {fmtDate(rv.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={13}
                    className={rv.overall >= n ? "text-[var(--gold)]" : "text-[var(--border)]"}
                    fill={rv.overall >= n ? "currentColor" : "none"}
                  />
                ))}
              </div>
            </div>
            <p className="mt-2.5 text-sm text-neutral-dark leading-relaxed">{rv.body}</p>
          </div>
        )
      })}
    </div>
  )
}
