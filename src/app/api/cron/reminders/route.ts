import { NextRequest, NextResponse } from "next/server"
import { runReminders } from "@/server/services/reminders"

export const dynamic = "force-dynamic"

/**
 * GET /api/cron/reminders — sends due 48h-swap and 7-day-renewal reminders.
 * Protected by CRON_SECRET: Vercel Cron sends `Authorization: Bearer <secret>`
 * when the env var is set; a `?key=<secret>` query param is also accepted.
 * With no secret configured (local dev), it runs unguarded.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get("authorization")
    const key = req.nextUrl.searchParams.get("key")
    if (auth !== `Bearer ${secret}` && key !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const result = await runReminders()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("Reminder cron failed:", err)
    return NextResponse.json({ error: "Reminder run failed" }, { status: 500 })
  }
}
