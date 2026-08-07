"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "info"
type Toast = { id: number; type: ToastType; message: string }

const ToastContext = createContext<((message: string, type?: ToastType) => void) | null>(null)

/** Returns a `toast(message, type?)` function. Must be used under ToastProvider. */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

const STYLE: Record<ToastType, { icon: typeof Info; cls: string; iconCls: string }> = {
  success: { icon: CheckCircle2, cls: "border-[var(--teal)]/30", iconCls: "text-[var(--teal)]" },
  error: { icon: AlertTriangle, cls: "border-[var(--crimson)]/30", iconCls: "text-[var(--crimson)]" },
  info: { icon: Info, cls: "border-[var(--hair)]", iconCls: "text-[var(--fg)]" },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const pathname = usePathname()

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random()
    // A new toast replaces any lingering error toast.
    setToasts((t) => [...t.filter((x) => x.type !== "error"), { id, type, message }])
    // Everything auto-dismisses so nothing lingers after the issue is resolved;
    // errors get a slightly longer window to be read. Can still be closed early,
    // is replaced by a newer toast, or cleared on navigation.
    const ttl = type === "error" ? 6000 : 4000
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl)
  }, [])

  // Leaving the page clears error toasts (success toasts fired just before a
  // redirect survive their normal 4s).
  useEffect(() => {
    setToasts((t) => t.filter((x) => x.type !== "error"))
  }, [pathname])

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-toast flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => {
          const s = STYLE[t.type]
          return (
            <div
              key={t.id}
              role="status"
              className={`flex items-start gap-3 bg-surface border ${s.cls} rounded-xl shadow-lg p-3.5 animate-[fadeIn_0.15s_ease-out]`}
            >
              <s.icon size={18} className={`${s.iconCls} flex-shrink-0 mt-0.5`} />
              <p className="flex-1 text-sm text-[var(--fg)] leading-snug">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-neutral hover:text-[var(--fg)] transition-colors">
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
