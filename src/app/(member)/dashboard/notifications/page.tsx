import { redirect } from "next/navigation"
import { Bell } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import {
  getMemberNotifications,
  markNotificationsSeen,
  ACTIVITY_KINDS,
} from "@/server/services/member-notifications"
import { LuxPageHeader } from "@/components/ui/lux"
import { NotificationsList, type NotificationRow } from "./notifications-list"

export const dynamic = "force-dynamic"

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

  // Dates are resolved to labels here so the client list stays serializable and
  // can't drift from the server's rendering of "5m ago".
  const rows: NotificationRow[] = items.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    link: n.link,
    timeLabel: timeAgo(n.date),
    isNew: ACTIVITY_KINDS.includes(n.kind) && n.date > seenBefore,
  }))

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <LuxPageHeader eyebrow="Activity" title="Notifications" subtitle="Everything that needs your attention, in one place." />

      {rows.length === 0 ? (
        <div className="bg-surface rounded-md border border-[var(--hair)] p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-md bg-[var(--navy)]/10 text-[var(--fg)] flex items-center justify-center mb-4">
            <Bell size={26} />
          </div>
          <h2 className="font-display font-light text-2xl text-[var(--fg)]">You&apos;re all caught up</h2>
          <p className="mt-2 text-sm text-neutral">No new activity right now.</p>
        </div>
      ) : (
        <NotificationsList items={rows} />
      )}
    </div>
  )
}
