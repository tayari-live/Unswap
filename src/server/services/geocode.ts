import { prisma } from "@/server/prisma"
import { cityCoords, countryIso } from "@/lib/geo"

// Server-side geocoding uses the Mapbox token. The public map token works for
// the Geocoding API too; a dedicated MAPBOX_TOKEN can override it server-side.
const mapboxToken = () => process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

// Bump when the geocoding query changes, so previously cached (possibly wrong)
// results are re-resolved instead of being read back. v2: settlement-only,
// non-fuzzy — v1 fuzzy-matched "Diani, Kenya" to a street "Diana Close".
const GEOCODE_VERSION = "v3"
const keyOf = (city: string, country: string) =>
  `${GEOCODE_VERSION}|${city.trim().toLowerCase()}|${country.trim().toLowerCase()}`

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
    // Prefer settlement types (never streets/addresses/POIs); fall back to an
    // unrestricted lookup if that finds nothing. Both disable fuzzy matching, so
    // "Diani, Kenya" resolves to the town — not a similarly spelled street like
    // "Diana Close" (the v1 fuzzy bug).
    const coords =
      (await mapboxGeocode(city, country, token, "place,locality,region,district,neighborhood")) ??
      (await mapboxGeocode(city, country, token, null))
    if (!coords) return null

    // Cache for next time; ignore a race on the unique key.
    await prisma.cityGeo
      .create({ data: { key, city: city.trim(), country: country.trim(), lng: coords[0], lat: coords[1] } })
      .catch(() => {})
    return coords
  } catch {
    return null
  }
}

/** One Mapbox Geocoding lookup; `types` null means unrestricted. */
async function mapboxGeocode(
  city: string,
  country: string,
  token: string,
  types: string | null,
): Promise<[number, number] | null> {
  const query = encodeURIComponent(`${city}, ${country}`.trim())
  const params = new URLSearchParams({ limit: "1", fuzzyMatch: "false", access_token: token })
  if (types) params.set("types", types)
  // Hard-constrain to the country when we know its ISO code — Mapbox otherwise
  // treats the country in the text query as a soft hint and can drift abroad.
  const iso = countryIso(country)
  if (iso) params.set("country", iso.toLowerCase())
  const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?${params}`)
  if (!res.ok) return null
  const data = await res.json()
  const center = data?.features?.[0]?.center
  if (!Array.isArray(center) || center.length < 2) return null
  const lng = Number(center[0])
  const lat = Number(center[1])
  return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null
}
