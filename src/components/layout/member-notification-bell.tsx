"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { useVisiblePolling } from "@/lib/use-visible-polling"

/**
 * Member activity bell: a count that links straight to the notifications page.
 *
 * Not a dropdown like the admin bell — member notifications are derived from
 * live state rather than stored rows, so there is no per-item read flag to
 * drive one, and the page itself owns filtering and mark-as-seen. The admin
 * `NotificationBell` can't be reused here at all: it reads `/api/notifications`,
 * which is `requireAdmin`-gated and 403s for every member.
 */
export function MemberNotificationBell({
  buttonClassName,
  dotClassName,
}: {
  buttonClassName?: string
  dotClassName?: string
}) {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/member-notifications", { cache: "no-store" })
      if (res.ok) setUnread((await res.json()).unread ?? 0)
    } catch {
      /* a badge is never worth surfacing an error */
    }
  }, [pathname])

  useEffect(() => { load() }, [load])
  useVisiblePolling(load, 20000, { immediate: false })

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={unread > 0 ? `Notifications (${unread} new)` : "Notifications"}
      title="Notifications"
      className={buttonClassName ?? "relative hover:text-[var(--gold-dark)] transition-colors"}
    >
      <Bell size={19} strokeWidth={1.75} />
      {unread > 0 && (
        dotClassName ? (
          <span className={dotClassName} title={`${unread} new`} />
        ) : (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-[var(--gold-dark)] text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )
      )}
    </Link>
  )
}
