import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { resendJoinEmail } from "@/server/services/waitlist"
import { clientIp, enforceRateLimit } from "@/server/rate-limit"

/**
 * POST /api/waitlist/resend — re-send the "add your property" invite for a
 * still-unconfirmed entry, keyed by the referral code the share page holds.
 * Rate limited like the other public send endpoints. The reply is always ok so
 * unknown/confirmed codes reveal nothing.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const code = typeof body.code === "string" ? body.code : ""

    await enforceRateLimit({
      scope: "waitlist-resend:ip",
      identifier: clientIp(req),
      limit: 10,
      windowSeconds: 3600,
      message: "Too many requests. Please try again later.",
    })
    if (code) {
      await enforceRateLimit({
        scope: "waitlist-resend:code",
        identifier: code,
        limit: 3,
        windowSeconds: 3600,
        message: "You've requested this a few times already. Please try again later.",
      })
    }

    await resendJoinEmail(code)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}
