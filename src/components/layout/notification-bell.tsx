"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  createdAt: string
}

export function NotificationBell({
  panelClassName,
  buttonClassName,
}: {
  // Override the dropdown position (e.g. open upward from a sidebar footer).
  panelClassName?: string
  buttonClassName?: string
} = {}) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const unread = items.filter((n) => !n.read).length

  async function load() {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) setItems(await res.json())
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    await fetch("/api/notifications", { method: "PATCH" })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={buttonClassName ?? "relative hover:text-[var(--gold-dark)] transition-colors"}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-[var(--crimson)] text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className={panelClassName ?? "fixed top-[72px] left-4 right-4 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-80 bg-surface rounded-xl shadow-lg border border-[var(--border)] z-50 overflow-hidden"}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <span className="text-sm font-semibold text-[var(--navy)]">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-[var(--teal)] hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-neutral">No notifications</p>
            )}
            {items.map((n) => {
              const inner = (
                <div className={`px-4 py-3 border-b border-[var(--border)] last:border-0 ${n.read ? "" : "bg-[var(--teal-light)]/40"}`}>
                  <div className="text-sm font-semibold text-[var(--navy)]">{n.title}</div>
                  {n.body && <div className="text-xs text-neutral mt-0.5">{n.body}</div>}
                </div>
              )
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>{inner}</Link>
              ) : (
                <div key={n.id}>{inner}</div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
