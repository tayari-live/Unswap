"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

// Literal light/dark palettes sourced directly from globals.css's token
// values, rather than reading computed styles at runtime — the palette is
// small and known, and Recharts' SVG props need literal values anyway.
const LIGHT = {
  navy: "#0B1F3A",
  gold: "#C9A84C",
  teal: "#2A9D8F",
  navyLight: "#13355f",
  goldDark: "#9a7c2c",
  grid: "#E3E7EE",
  axis: "#6B7689",
  surface: "#ffffff",
  fg: "#111827",
  hair: "#E3E7EE",
}

const DARK = {
  navy: "#22304f",
  gold: "#C9A84C",
  teal: "#2A9D8F",
  navyLight: "#30416a",
  goldDark: "#9a7c2c",
  grid: "rgba(255,255,255,0.08)",
  axis: "#98a2b6",
  surface: "#121a2b",
  fg: "#f3eee4",
  hair: "rgba(201,168,76,0.22)",
}

/** Theme-aware color set for Recharts, which needs literal values, not CSS vars. */
export function useChartColors() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && resolvedTheme === "dark" ? DARK : LIGHT
}
