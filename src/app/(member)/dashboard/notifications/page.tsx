import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowLeftRight, Repeat, CalendarCheck, MessageSquare, Star, ShieldAlert, UserCircle, Bell,
} from "lucide-react"
import { auth } from "@/server/auth"
import { getMemberNotifications, type MemberNotification } from "@/server/services/member-notifications"
import { PageHeader } from "@/components/ui/page-header"

export const dynamic = "force-dynamic"

const KIND: Record<MemberNotification["kind"], { icon: typeof Bell; tone: string }> = {
  swap: { icon: ArrowLeftRight, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
  counter: { icon: Repeat, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
  confirmed: { icon: CalendarCheck, tone: "bg-[var(--teal)]/15 text-[var(--teal)]" },
  message: { icon: MessageSquare, tone: "bg-[var(--navy)]/10 text-[var(--navy)]" },
  review: { icon: Star, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
  verification: { icon: ShieldAlert, tone: "bg-[var(--parchment)] text-[var(--gold-dark)]" },
  profile: { icon: UserCircle, tone: "bg-[var(--navy)]/10 text-[var(--navy)]" },
}

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d)
}

export default async function NotificationsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const items = await getMemberNotifications(userId)

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <PageHeader title="Notifications" subtitle="Everything that needs your attention, in one place." />

      {items.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center mb-4">
            <Bell size={26} />
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">You&apos;re all caught up</h2>
          <p className="mt-2 text-sm text-neutral">No new activity right now.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden divide-y divide-[var(--border)]">
          {items.map((n) => {
            const k = KIND[n.kind]
            return (
              <Link key={n.id} href={n.link} className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--background)] transition-colors">
                <span className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center ${k.tone}`}>
                  <k.icon size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--navy)]">{n.title}</div>
                  <div className="text-sm text-neutral truncate">{n.body}</div>
                </div>
                <span className="text-xs text-neutral flex-shrink-0">{timeAgo(n.date)}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
