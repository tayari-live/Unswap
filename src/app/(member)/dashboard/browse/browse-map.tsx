"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { MapPinned } from "lucide-react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

type CityPin = { city: string; country: string; count: number; lng: number; lat: number }

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const NAVY = "#0B1F3A"
const GOLD = "#C9A84C"

function toGeoJSON(pins: CityPin[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: pins.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { city: p.city, country: p.country, count: p.count },
    })),
  }
}

function fit(map: mapboxgl.Map, pins: CityPin[]) {
  if (!pins.length) return
  const b = new mapboxgl.LngLatBounds()
  pins.forEach((p) => b.extend([p.lng, p.lat]))
  map.fitBounds(b, { padding: 64, maxZoom: 6, duration: 0 })
}

/**
 * Browse map: one pin per CITY (never a home's real location), clustered at low
 * zoom, sized by how many homes are there. Clicking a city filters the list to
 * it. City-level only, so it's shown to every member regardless of verification.
 */
export function BrowseMap({ pins }: { pins: CityPin[] }) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const loadedRef = useRef(false)

  // Initialise once.
  useEffect(() => {
    if (!TOKEN || !ref.current || mapRef.current) return
    mapboxgl.accessToken = TOKEN
    const style = resolvedTheme === "dark" ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"
    const map = new mapboxgl.Map({ container: ref.current, style, center: [10, 25], zoom: 1.3 })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")

    map.on("load", () => {
      map.addSource("cities", {
        type: "geojson",
        data: toGeoJSON(pins),
        cluster: true,
        clusterRadius: 45,
        clusterProperties: { total: ["+", ["get", "count"]] },
      })
      map.addLayer({
        id: "clusters", type: "circle", source: "cities", filter: ["has", "point_count"],
        paint: { "circle-color": NAVY, "circle-radius": ["step", ["get", "total"], 18, 10, 24, 50, 30], "circle-stroke-width": 2, "circle-stroke-color": GOLD },
      })
      map.addLayer({
        id: "cluster-count", type: "symbol", source: "cities", filter: ["has", "point_count"],
        layout: { "text-field": ["get", "total"], "text-size": 13, "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"] }, paint: { "text-color": "#ffffff" },
      })
      map.addLayer({
        id: "city", type: "circle", source: "cities", filter: ["!", ["has", "point_count"]],
        paint: { "circle-color": GOLD, "circle-radius": ["step", ["get", "count"], 11, 5, 15, 20, 19], "circle-stroke-width": 2, "circle-stroke-color": NAVY },
      })
      map.addLayer({
        id: "city-count", type: "symbol", source: "cities", filter: ["!", ["has", "point_count"]],
        layout: { "text-field": ["get", "count"], "text-size": 12, "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"] }, paint: { "text-color": NAVY },
      })

      map.on("click", "city", (e) => {
        const city = e.features?.[0]?.properties?.city as string | undefined
        if (city) router.push(`/dashboard/browse?q=${encodeURIComponent(city)}`)
      })
      map.on("click", "clusters", (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0]
        if (f) map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: Math.min(map.getZoom() + 2.5, 8) })
      })
      for (const layer of ["city", "clusters"]) {
        map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer" })
        map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = "" })
      }

      loadedRef.current = true
      fit(map, pins)
    })

    return () => { map.remove(); mapRef.current = null; loadedRef.current = false }
    // Initialise once; data updates are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update the pins when the filters change, without re-creating the map.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const src = map.getSource("cities") as mapboxgl.GeoJSONSource | undefined
    if (src) { src.setData(toGeoJSON(pins)); fit(map, pins) }
  }, [pins])

  if (!TOKEN) {
    return (
      <div className="h-[70vh] rounded-md border border-[var(--hair)] bg-[var(--surface)] flex flex-col items-center justify-center text-center px-6">
        <MapPinned size={30} className="text-neutral mb-3" />
        <p className="text-sm font-semibold text-[var(--fg)]">Map unavailable</p>
        <p className="mt-1 text-sm text-neutral max-w-sm">Set <code className="text-[var(--gold-dark)]">NEXT_PUBLIC_MAPBOX_TOKEN</code> in the environment to enable the map view.</p>
      </div>
    )
  }

  return <div ref={ref} className="h-[70vh] rounded-md overflow-hidden border border-[var(--hair)]" />
}
