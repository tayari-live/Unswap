import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { getWaitlistStatus, getWaitlistStatusByCode } from "@/server/services/waitlist"
import { clientIp, enforceRateLimit } from "@/server/rate-limit"

// GET /api/waitlist/status?email=… or ?code=… — a confirmed member's position + referrals.
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")
    const email = req.nextUrl.searchParams.get("email")

    // Looking up by email answers "is this person on the waitlist?" for any
    // address, which for a network built on discretion is worth protecting.
    // The lookup cannot simply be removed — members use it to recover their
    // referral link — so limit it per IP instead: checking your own status
    // takes one or two attempts, while enumerating a staff directory takes
    // thousands. Lookups by code are the member's own token and stay open.
    if (!code) {
      await enforceRateLimit({
        scope: "waitlist-status:ip",
        identifier: clientIp(req),
        limit: 15,
        windowSeconds: 3600,
        message: "Too many lookups. Please try again later.",
      })
    }

    const result = code ? await getWaitlistStatusByCode(code) : await getWaitlistStatus(email ?? "")
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
