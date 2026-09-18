import { CITY_TIER1, CITY_TIER2 } from "@/lib/geo"

// HomeExchange-style nightly points valuation. A home is auto-assigned a value
// per night from capped factors (location demand, size/capacity, amenities) on
// a hundreds-per-night scale, and the host may nudge it by ±30. Pure and
// client-safe so the listing wizard and the server compute the same number.

export const NIGHTLY_MIN = 100
export const NIGHTLY_MAX = 300
export const MAX_ADJUSTMENT = 30

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)))

function locationBonus(city: string): number {
  const c = (city || "").trim().toLowerCase()
  if (!c) return 0
  if (CITY_TIER1.some((x) => x.toLowerCase() === c)) return 80
  if (CITY_TIER2.some((x) => x.toLowerCase() === c)) return 40
  return 0
}

export type ValuationInput = {
  city: string
  bedrooms: number
  maxGuests: number
  amenities: string[]
}

/**
 * The algorithm value per night, before the host's ±30 adjustment.
 * Base 100 + location (0/40/80) + size (beds cap +50, guests cap +20)
 * + amenities (cap +50), clamped to 100–300.
 */
export function computeNightlyPoints(input: ValuationInput): number {
  const loc = locationBonus(input.city)
  const size =
    Math.min(50, Math.max(0, (input.bedrooms || 1) - 1) * 20) +
    Math.min(20, Math.max(0, (input.maxGuests || 2) - 2) * 5)
  const amen = Math.min(50, (input.amenities?.length || 0) * 8)
  return clamp(NIGHTLY_MIN + loc + size + amen, NIGHTLY_MIN, NIGHTLY_MAX)
}

/** Keep a host adjustment within ±30. */
export const clampAdjustment = (a: number) =>
  Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, Math.round(a || 0)))

/** The value a guest actually pays / a host earns per night. */
export function effectiveNightly(nightlyPoints: number, adjustment: number): number {
  return clamp(nightlyPoints + clampAdjustment(adjustment), NIGHTLY_MIN, NIGHTLY_MAX)
}
