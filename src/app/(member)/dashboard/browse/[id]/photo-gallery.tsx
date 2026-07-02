"use client"

import { useState } from "react"
import { MapPin } from "lucide-react"

type Photo = { url: string; caption?: string | null }

/**
 * Listing photo gallery: a large active image with a clickable thumbnail strip
 * below. Photos are stored inline as base64 data URLs, so they render directly.
 */
export function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [active, setActive] = useState(0)

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--background)] h-72 sm:h-96 flex items-center justify-center text-neutral/30">
        <MapPin size={40} />
      </div>
    )
  }

  const current = photos[Math.min(active, photos.length - 1)]

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--background)] h-72 sm:h-[26rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.caption || title} className="w-full h-full object-cover" />
        {photos.length > 1 && (
          <span className="absolute top-4 left-4 text-xs font-semibold bg-black/50 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
            {active + 1} / {photos.length}
          </span>
        )}
        {current.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--navy-dark)]/80 to-transparent p-4">
            <p className="text-sm text-white">{current.caption}</p>
          </div>
        )}
      </div>

      {photos.length > 1 && (
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
