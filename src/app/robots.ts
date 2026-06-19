import type { MetadataRoute } from "next"

const base = process.env.AUTH_URL || "http://localhost:3000"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep authenticated / private areas out of search results.
        disallow: [
          "/api/",
          "/dashboard",
          "/overview",
          "/members",
          "/listings",
          "/swaps",
          "/verification",
          "/verify-identity",
          "/domains",
          "/analytics",
          "/onboarding",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
