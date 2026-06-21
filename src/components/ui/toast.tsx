"use client"

import { createContext, useCallback, useContext, useState } from "react"
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
  info: { icon: Info, cls: "border-[var(--border)]", iconCls: "text-[var(--navy)]" },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => {
          const s = STYLE[t.type]
          return (
            <div
              key={t.id}
              role="status"
              className={`flex items-start gap-3 bg-surface border ${s.cls} rounded-xl shadow-lg p-3.5 animate-[fadeIn_0.15s_ease-out]`}
            >
              <s.icon size={18} className={`${s.iconCls} flex-shrink-0 mt-0.5`} />
              <p className="flex-1 text-sm text-[var(--navy)] leading-snug">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-neutral hover:text-[var(--navy)] transition-colors">
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
