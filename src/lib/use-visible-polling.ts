import { useEffect, useRef } from "react"

/**
 * Run `cb` on an interval, but ONLY while the tab is visible — a hidden or
 * backgrounded tab stops polling entirely (saves DB compute/egress), and a
 * fresh poll fires the moment the tab becomes visible again so it catches up.
 *
 * `immediate` (default true) also runs `cb` once on mount when visible.
 */
export function useVisiblePolling(cb: () => void, intervalMs: number, opts?: { immediate?: boolean }) {
  const cbRef = useRef(cb)
  cbRef.current = cb
  const immediate = opts?.immediate ?? true

  useEffect(() => {
    const run = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") cbRef.current()
    }
    if (immediate) run()
    const id = setInterval(run, intervalMs)
    document.addEventListener("visibilitychange", run)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", run)
    }
  }, [intervalMs, immediate])
}
