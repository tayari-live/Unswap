import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { getWaitlistStatus, getWaitlistStatusByCode } from "@/server/services/waitlist"

// GET /api/waitlist/status?email=… or ?code=… — a confirmed member's position + referrals.
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")
    const email = req.nextUrl.searchParams.get("email")
    const result = code ? await getWaitlistStatusByCode(code) : await getWaitlistStatus(email ?? "")
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
