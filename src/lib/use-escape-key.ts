"use client"

import { useEffect } from "react"

/**
 * Close a dialog on Escape.
 *
 * Clicking the backdrop is a mouse-only affordance, so a dialog that offers
 * only that leaves keyboard users stuck at the close button. Pass `active` so
 * the listener is bound only while the dialog is open.
 */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, onEscape])
}
