"use client"

import { useState } from "react"
import { Heart } from "lucide-react"

export function FavouriteButton({
  listingId,
  initial,
  className,
}: {
  listingId: string
  initial: boolean
  className?: string
}) {
  const [fav, setFav] = useState(initial)
  const [busy, setBusy] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    const optimistic = !fav
    setFav(optimistic)
    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      })
      const data = await res.json()
      if (res.ok) setFav(data.favourited)
      else setFav(!optimistic)
    } catch {
      setFav(!optimistic)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={fav ? "Remove from saved" : "Save listing"}
      aria-pressed={fav}
      className={
        className ??
        "w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors"
      }
    >
      <Heart
        size={18}
        className={fav ? "text-[var(--crimson)]" : "text-neutral"}
        fill={fav ? "currentColor" : "none"}
      />
    </button>
  )
}
