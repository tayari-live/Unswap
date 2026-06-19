import type { MetadataRoute } from "next"

const base = process.env.AUTH_URL || "http://localhost:3000"

// Public, indexable routes only.
const routes = ["", "/about", "/privacy", "/terms", "/join", "/early-access", "/login", "/register"]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return routes.map((r) => ({
    url: `${base}${r}`,
    lastModified: now,
    changeFrequency: r === "" ? "weekly" : "monthly",
    priority: r === "" ? 1 : 0.6,
  }))
}
