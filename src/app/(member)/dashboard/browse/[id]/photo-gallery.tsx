"use client"

import { useState, useEffect, useCallback } from "react"
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react"

type Photo = { url: string; caption?: string | null }

/**
 * Listing photo gallery: a large active image with navigation arrows,
 * keyboard support (← / →), and a clickable thumbnail strip below.
 * Photos are cacheable /api/photos/:id URLs.
 */
export function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [active, setActive] = useState(0)
  const count = photos.length

  const goPrev = useCallback(() => {
    setActive((i) => (i - 1 + count) % count)
  }, [count])

  const goNext = useCallback(() => {
    setActive((i) => (i + 1) % count)
  }, [count])

  // Keyboard arrow navigation
  useEffect(() => {
    if (count <= 1) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        goNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [count, goPrev, goNext])

  if (count === 0) {
    return (
      <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--background)] h-72 sm:h-96 flex items-center justify-center text-neutral/30">
        <MapPin size={40} />
      </div>
    )
  }

  const current = photos[Math.min(active, count - 1)]

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--background)] h-72 sm:h-[26rem] group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.caption || title} className="w-full h-full object-cover" />

        {/* Counter badge */}
        {count > 1 && (
          <span className="absolute top-4 left-4 text-xs font-semibold bg-black/50 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
            {active + 1} / {count}
          </span>
        )}

        {/* Navigation arrows — visible on hover / always on touch */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Caption overlay */}
        {current.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--navy-dark)]/80 to-transparent p-4">
            <p className="text-sm text-white">{current.caption}</p>
          </div>
        )}
      </div>

      {count > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                i === active ? "border-[var(--gold)]" : "border-transparent hover:border-[var(--border)]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption || `${title} photo ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
