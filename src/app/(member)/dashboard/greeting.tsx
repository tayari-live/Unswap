"use client"

import { useEffect, useState } from "react"

function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning"
  if (hour >= 12 && hour < 18) return "Good afternoon"
  return "Good evening"
}

/**
 * Time-aware greeting, resolved in the member's own timezone.
 *
 * This has to be a client component: computing it on the server reads the
 * host's clock, so a member in Washington DC at 20:00 local (01:00 UTC on a
 * UTC host) was greeted with "Good morning". The server still renders a value
 * so there's no empty flash, and the effect re-resolves it locally on mount —
 * hence `suppressHydrationWarning`, since the two legitimately differ.
 */
export function Greeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState(() => greetingFor(new Date().getHours()))

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()))
  }, [])

  return (
    <h1 className="font-display text-4xl md:text-[48px] font-bold text-navy tracking-tight leading-none mb-3">
      <span suppressHydrationWarning>{greeting}</span>, {firstName || "Member"}.
    </h1>
  )
}
