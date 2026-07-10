"use client"

import { useCallback, useEffect, useState } from "react"
import { MapPin, X, ChevronLeft, ChevronRight, Images } from "lucide-react"

type Photo = { url: string; caption?: string | null }

/**
 * Listing photos as a hero-plus-tiles mosaic (one large image, up to four
 * tiles) with a full-screen lightbox for the complete set. Mobile shows the
 * hero only. Photos are cacheable /api/photos/:id URLs.
 */
export function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const show = (i: number) => {
    setActive(i)
    setOpen(true)
  }
  const prev = useCallback(
    () => setActive((a) => (a - 1 + photos.length) % photos.length),
    [photos.length],
  )
  const next = useCallback(
    () => setActive((a) => (a + 1) % photos.length),
    [photos.length],
  )

  // Lightbox keyboard controls + background scroll lock.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, prev, next])

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--background)] h-72 sm:h-96 flex items-center justify-center text-neutral/30">
        <MapPin size={40} />
      </div>
    )
  }

  const tiles = photos.slice(1, 5)
  const current = photos[Math.min(active, photos.length - 1)]

  return (
    <>
      <div className="relative">
        <div
          className={`grid gap-2 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--background)] h-72 sm:h-[26rem] ${
            tiles.length > 0 ? "grid-cols-1 sm:grid-cols-4 sm:grid-rows-2" : "grid-cols-1"
          }`}
        >
          <button
            type="button"
            onClick={() => show(0)}
            aria-label="View photo 1"
            className={`relative h-full w-full ${tiles.length > 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[0].url}
              alt={photos[0].caption || title}
              className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity"
            />
          </button>
          {tiles.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => show(i + 1)}
              aria-label={`View photo ${i + 2}`}
              className="relative hidden sm:block h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption || `${title} photo ${i + 2}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => show(0)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-white/95 text-[var(--navy)] px-3 py-2 rounded-lg shadow hover:bg-white transition-colors"
        >
          <Images size={14} /> View all {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
          className="fixed inset-0 z-[100] bg-[var(--navy-dark)]/95 flex flex-col"
          onClick={() => setOpen(false)}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 text-white">
            <span className="text-sm font-semibold">
              {active + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close photos"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center px-4 sm:px-16 pb-6 min-h-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="hidden sm:flex flex-shrink-0 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center mr-4 transition-colors"
            >
              <ChevronLeft size={22} />
            </button>

            <figure className="flex flex-col items-center justify-center min-h-0 max-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.url}
                alt={current.caption || title}
                className="max-h-[75vh] max-w-full object-contain rounded-lg"
              />
              {current.caption && (
                <figcaption className="mt-3 text-sm text-white/70 text-center">{current.caption}</figcaption>
              )}
            </figure>

            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="hidden sm:flex flex-shrink-0 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center ml-4 transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Mobile prev/next */}
          <div className="sm:hidden flex justify-center gap-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={prev} aria-label="Previous photo" className="w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center">
              <ChevronLeft size={22} />
            </button>
            <button type="button" onClick={next} aria-label="Next photo" className="w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center">
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
