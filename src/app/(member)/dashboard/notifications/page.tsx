import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowLeftRight, Repeat, CalendarCheck, MessageSquare, Star, ShieldAlert, ShieldCheck, ShieldX, UserCircle, Bell, Coins,
} from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import {
  getMemberNotifications,
  markNotificationsSeen,
  ACTIVITY_KINDS,
  type MemberNotification,
} from "@/server/services/member-notifications"
import { LuxPageHeader } from "@/components/ui/lux"

export const dynamic = "force-dynamic"

const KIND: Record<MemberNotification["kind"], { icon: typeof Bell; tone: string }> = {
  swap: { icon: ArrowLeftRight, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
  counter: { icon: Repeat, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
  confirmed: { icon: CalendarCheck, tone: "bg-[var(--teal)]/15 text-[var(--teal)]" },
  message: { icon: MessageSquare, tone: "bg-[var(--navy)]/10 text-[var(--fg)]" },
  review: { icon: Star, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
  verification: { icon: ShieldAlert, tone: "bg-[var(--parchment)] text-[var(--gold-dark)]" },
  verified: { icon: ShieldCheck, tone: "bg-[var(--teal)]/15 text-[var(--teal)]" },
  rejected: { icon: ShieldX, tone: "bg-[var(--crimson)]/10 text-[var(--crimson)]" },
  credit: { icon: Coins, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
  profile: { icon: UserCircle, tone: "bg-[var(--navy)]/10 text-[var(--fg)]" },
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

  const [items, user] = await Promise.all([
    getMemberNotifications(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { notificationsSeenAt: true },
    }),
  ])

  // Visiting this page clears the bell badge; anything newer than the previous
  // visit is highlighted below.
  const seenBefore = user?.notificationsSeenAt ?? new Date(0)
  await markNotificationsSeen(userId)
  const isNew = (n: MemberNotification) =>
    ACTIVITY_KINDS.includes(n.kind) && n.date > seenBefore

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <LuxPageHeader eyebrow="Activity" title="Notifications" subtitle="Everything that needs your attention, in one place." />

      {items.length === 0 ? (
        <div className="bg-surface rounded-md border border-[var(--hair)] p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-md bg-[var(--navy)]/10 text-[var(--fg)] flex items-center justify-center mb-4">
            <Bell size={26} />
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--fg)]">You&apos;re all caught up</h2>
          <p className="mt-2 text-sm text-neutral">No new activity right now.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-md border border-[var(--hair)] overflow-hidden divide-y divide-[var(--hair)]">
          {items.map((n) => {
            const k = KIND[n.kind]
            return (
              <Link key={n.id} href={n.link} className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--background)] transition-colors">
                <span className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center ${k.tone}`}>
                  <k.icon size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--fg)]">{n.title}</span>
                    {isNew(n) && (
                      <span className="text-[9px] font-bold uppercase tracking-wide bg-[var(--gold)]/20 text-[var(--gold-dark)] px-1.5 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
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
