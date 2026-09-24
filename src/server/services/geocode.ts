import { prisma } from "@/server/prisma"
import { cityCoords } from "@/lib/geo"

// Server-side geocoding uses the Mapbox token. The public map token works for
// the Geocoding API too; a dedicated MAPBOX_TOKEN can override it server-side.
const mapboxToken = () => process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

const keyOf = (city: string, country: string) =>
  `${city.trim().toLowerCase()}|${country.trim().toLowerCase()}`

/**
 * City-centre coordinates [lng, lat] for the map. Resolves in order:
 *   1. the built-in duty-station table (instant, no network),
 *   2. the persisted geocode cache (one row per city),
 *   3. the Mapbox Geocoding API (the result is then cached).
 * Deliberately city-level — never a home's real location, matching the privacy
 * model. Returns null when nothing resolves (no token or no match) so the
 * caller can omit the city from the map.
 */
export async function resolveCityCoords(city: string, country: string): Promise<[number, number] | null> {
  if (!city?.trim()) return null

  const builtIn = cityCoords(city)
  if (builtIn) return builtIn

  const key = keyOf(city, country)
  const cached = await prisma.cityGeo.findUnique({ where: { key } }).catch(() => null)
  if (cached) return [cached.lng, cached.lat]

  const token = mapboxToken()
  if (!token) return null

  try {
    const query = encodeURIComponent(`${city}, ${country}`.trim())
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?limit=1&access_token=${token}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const center = data?.features?.[0]?.center
    if (!Array.isArray(center) || center.length < 2) return null
    const lng = Number(center[0])
    const lat = Number(center[1])
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null

    // Cache for next time; ignore a race on the unique key.
    await prisma.cityGeo.create({ data: { key, city: city.trim(), country: country.trim(), lng, lat } }).catch(() => {})
    return [lng, lat]
  } catch {
    return null
  }
}
