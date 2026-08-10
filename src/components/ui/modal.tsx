"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEscapeKey } from "@/lib/use-escape-key"

/**
 * Shared admin dialog shell.
 *
 * Below `sm` it renders as a bottom sheet (`items-end`, `rounded-t-2xl`,
 * anchored to the viewport bottom) so it's usable one-handed on a phone;
 * at `sm`+ it's the centered dialog every admin modal already used.
 */
export function Modal({
  open,
  onClose,
  busy = false,
  title,
  titleId = "modal-title",
  children,
  size = "md",
  className,
}: {
  open: boolean
  onClose: () => void
  busy?: boolean
  title: string
  titleId?: string
  children: React.ReactNode
  size?: "md" | "lg"
  className?: string
}) {
  useEscapeKey(open && !busy, onClose)
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-[var(--navy)]/40"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "bg-surface shadow-2xl w-full rounded-t-2xl sm:rounded-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--hair)] sticky top-0 bg-surface">
          <h2 id={titleId} className="font-sans font-bold text-lg text-[var(--fg)]">{title}</h2>
          <button onClick={onClose} disabled={busy} className="text-neutral hover:text-[var(--fg)]">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
