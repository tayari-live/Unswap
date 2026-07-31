"use client"

import { useEffect } from "react"

// Same Trafft account/calendar the sales funnel (jo.my/bookdaa) already books into.
const TRAFFT_QUERY = "&t=s&uuid=bafee450-aaf8-43be-a37b-bdae72cddc89"

export function BookingWidget() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://tayarilive.trafft.com/embed.js"
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div
      className="embedded-booking"
      data-url="https://tayarilive.trafft.com"
      data-query={TRAFFT_QUERY}
      data-lang="en"
      data-autoresize="0"
      data-showsidebar="1"
      data-showservices="0"
      style={{ minWidth: 320, height: 768, display: "flex", flexDirection: "column" }}
    />
  )
}
