"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeftRight, Repeat, CalendarCheck, MessageSquare, Star, ShieldAlert, ShieldCheck, ShieldX,
  UserCircle, Bell, Coins, CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  NOTIFICATION_CATEGORIES,
  categoryOf,
  type NotificationKind,
  type NotificationCategory,
} from "@/lib/notification-categories"

export type NotificationRow = {
  id: string
  kind: NotificationKind
  title: string
  body: string
  link: string
  timeLabel: string
  isNew: boolean
}

const KIND: Record<NotificationKind, { icon: typeof Bell; tone: string }> = {
  swap: { icon: ArrowLeftRight, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
  counter: { icon: Repeat, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
  confirmed: { icon: CalendarCheck, tone: "bg-[var(--teal)]/15 text-[var(--teal)]" },
  message: { icon: MessageSquare, tone: "bg-[var(--navy)]/10 text-[var(--fg)]" },
  review: { icon: Star, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
  verification: { icon: ShieldAlert, tone: "bg-[var(--navy)]/5 text-[var(--gold-dark)]" },
  verified: { icon: ShieldCheck, tone: "bg-[var(--teal)]/15 text-[var(--teal)]" },
  rejected: { icon: ShieldX, tone: "bg-[var(--crimson)]/10 text-[var(--crimson)]" },
  credit: { icon: Coins, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
  profile: { icon: UserCircle, tone: "bg-[var(--navy)]/10 text-[var(--fg)]" },
  membership: { icon: CreditCard, tone: "bg-[var(--gold)]/15 text-[var(--gold-dark)]" },
}

/**
 * Filtering is client-side on an already-loaded list rather than a `?category=`
 * round trip: navigating would re-run the page's "mark notifications seen"
 * effect and wipe the New badges the member is still reading.
 */
export function NotificationsList({ items }: { items: NotificationRow[] }) {
  const [category, setCategory] = useState<NotificationCategory>("all")

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    for (const n of items) {
      const k = categoryOf(n.kind)
      c[k] = (c[k] ?? 0) + 1
    }
    return c
  }, [items])

  const shown = category === "all" ? items : items.filter((n) => categoryOf(n.kind) === category)

  // Only offer tabs that can actually show something, plus whichever is active.
  const tabs = NOTIFICATION_CATEGORIES.filter(
    (c) => c.key === "all" || (counts[c.key] ?? 0) > 0 || c.key === category,
  )

  return (
    <>
      <div className="flex gap-4 sm:gap-6 mb-8 border-b border-[var(--hair)] overflow-x-auto">
        {tabs.map((c) => {
          const active = category === c.key
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={cn(
                "px-1 sm:px-2 py-2.5 text-[14px] font-sans font-bold whitespace-nowrap border-b-2 transition-colors",
                active ? "border-[var(--gold)] text-[var(--fg)]" : "border-transparent text-neutral hover:text-[var(--fg)]",
              )}
            >
              {c.label}
              {(counts[c.key] ?? 0) > 0 && (
                <span className={cn("ml-1.5", active ? "text-[var(--gold-dark)]" : "text-neutral")}>
                  ({counts[c.key]})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <div className="bg-surface rounded-md border border-[var(--hair)] p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-md bg-[var(--navy)]/10 text-[var(--fg)] flex items-center justify-center mb-4">
            <Bell size={26} />
          </div>
          <h2 className="font-display font-light text-2xl text-[var(--fg)]">Nothing here</h2>
          <p className="mt-2 text-sm text-neutral">No {category} activity right now.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-md border border-[var(--hair)] overflow-hidden divide-y divide-[var(--hair)]">
          {shown.map((n) => {
            const k = KIND[n.kind]
            return (
              <Link key={n.id} href={n.link} className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--navy)]/5 transition-colors">
                <span className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center ${k.tone}`}>
                  <k.icon size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--fg)]">{n.title}</span>
                    {n.isNew && (
                      <span className="text-[9px] font-bold uppercase tracking-wide bg-[var(--gold)]/20 text-[var(--gold-dark)] px-1.5 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-neutral truncate">{n.body}</div>
                </div>
                <span className="text-xs text-neutral flex-shrink-0">{n.timeLabel}</span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
