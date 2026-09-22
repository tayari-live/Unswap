"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { AlertTriangle, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Modal } from "./modal"

/**
 * Promise-based confirmation dialog — a branded replacement for the browser's
 * native window.confirm(). Call sites `await confirm({ ... })` and get back a
 * boolean, so an `if (!confirm(...)) return` guard becomes `if (!(await
 * confirm({...}))) return` with no other restructuring.
 *
 * Renders the shared Modal shell, so it's theme-aware and matches every other
 * dialog in the app instead of the OS-styled pop-up.
 */
export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` paints the confirm button crimson for destructive actions. */
  tone?: "default" | "danger"
}

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null)

/** Returns an async `confirm(options)` that resolves true/false. */
export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider")
  return ctx
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((ok: boolean) => void) | null>(null)

  const confirm = useCallback((o: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setOpts(o)
    })
  }, [])

  // Every exit — confirm, cancel, backdrop, Escape, the X — routes here so the
  // awaiting caller always gets exactly one answer.
  const settle = useCallback((ok: boolean) => {
    resolverRef.current?.(ok)
    resolverRef.current = null
    setOpts(null)
  }, [])

  const danger = opts?.tone === "danger"

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!opts} onClose={() => settle(false)} title={opts?.title ?? ""}>
        {opts && (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <span className={cn("mt-0.5 flex-shrink-0", danger ? "text-[var(--crimson)]" : "text-[var(--gold-dark)]")}>
                {danger ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
              </span>
              <p className="text-sm text-neutral-dark leading-relaxed">{opts.message}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => settle(false)}
                className="px-4 py-2.5 rounded-xl border border-[var(--hair)] text-sm font-semibold text-[var(--fg)] hover:bg-[var(--gold)]/10 transition-colors"
              >
                {opts.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => settle(true)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors",
                  danger ? "bg-[var(--crimson)] hover:bg-[var(--crimson)]/90" : "bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)]",
                )}
              >
                {opts.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  )
}
