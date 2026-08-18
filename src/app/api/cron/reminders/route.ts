import { NextRequest, NextResponse } from "next/server"
import { runReminders } from "@/server/services/reminders"
import { runSwapLifecycle } from "@/server/services/swaps"
import { pruneRateLimits } from "@/server/rate-limit"

export const dynamic = "force-dynamic"

/**
 * GET /api/cron/reminders — sends due 48h-swap and 7-day-renewal reminders and
 * advances swap lifecycle state.
 *
 * Protected by CRON_SECRET: Vercel Cron sends `Authorization: Bearer <secret>`;
 * a `?key=<secret>` query param is also accepted.
 *
 * This route sends real email and mutates swap state, so a missing secret is
 * refused outside local development rather than waved through. Guarding only
 * when the variable happened to be set meant forgetting it left the endpoint
 * open to anyone who knew the URL — repeatable at will.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const isLocalDev = process.env.NODE_ENV !== "production"

  if (!secret) {
    if (!isLocalDev) {
      console.error("CRON_SECRET is not set. Refusing to run the cron job.")
      return NextResponse.json({ error: "Cron is not configured." }, { status: 503 })
    }
    // Local development only: run unguarded so the job stays testable.
  } else {
    const auth = req.headers.get("authorization")
    const key = req.nextUrl.searchParams.get("key")
    if (auth !== `Bearer ${secret}` && key !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const reminders = await runReminders()
    const lifecycle = await runSwapLifecycle()
    // Expired rate-limit windows are dead rows; sweep them on the daily run.
    const pruned = await pruneRateLimits()
    return NextResponse.json({ ok: true, ...reminders, ...lifecycle, ...pruned })
  } catch (err) {
    console.error("Cron run failed:", err)
    return NextResponse.json({ error: "Cron run failed" }, { status: 500 })
  }
}
