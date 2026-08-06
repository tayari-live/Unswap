import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { getWaitlistStatusByCode, sendWaitlistStatusLink } from "@/server/services/waitlist"
import { clientIp, enforceRateLimit } from "@/server/rate-limit"

/**
 * GET /api/waitlist/status?code=… — a confirmed member's position + referrals.
 * The code is the member's own token, so this answers directly.
 */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")
    if (!code) return NextResponse.json({ found: false })
    return NextResponse.json(await getWaitlistStatusByCode(code))
  } catch (err) {
    return toErrorResponse(err)
  }
}

/**
 * POST /api/waitlist/status — email a member their place and share link.
 *
 * Looking up by address used to answer "is this person on the waitlist?" to
 * anyone who asked. Now the reply is the same whether or not the address is
 * known, and the answer goes to the inbox, so only its owner learns anything.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = typeof body.email === "string" ? body.email : ""

    // This sends mail, so it needs the same protection as the other public
    // send endpoints: per IP against a flood, per address so one inbox cannot
    // be targeted from many sources.
    await enforceRateLimit({
      scope: "waitlist-status:ip",
      identifier: clientIp(req),
      limit: 10,
      windowSeconds: 3600,
      message: "Too many requests. Please try again later.",
    })
    if (email) {
      await enforceRateLimit({
        scope: "waitlist-status:email",
        identifier: email,
        limit: 3,
        windowSeconds: 3600,
        message: "Too many requests for that address. Please try again later.",
      })
    }

    await sendWaitlistStatusLink(email)
    // Deliberately identical for known and unknown addresses.
    return NextResponse.json({ ok: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}
