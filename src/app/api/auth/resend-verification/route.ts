import { NextRequest, NextResponse } from "next/server"
import { resendVerificationEmail } from "@/server/services/registration"
import { toErrorResponse } from "@/server/http"
import { clientIp, enforceRateLimit } from "@/server/rate-limit"

// POST /api/auth/resend-verification — re-send the email confirmation link.
// Public; always responds ok for valid emails (no account enumeration).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // The confirm-email page enforces a 45s cooldown, but that is client-side
    // and trivially bypassed, so the real limit lives here.
    await enforceRateLimit({
      scope: "resend:ip",
      identifier: clientIp(req),
      limit: 10,
      windowSeconds: 3600,
    })
    if (typeof body.email === "string" && body.email) {
      await enforceRateLimit({
        scope: "resend:email",
        identifier: body.email,
        limit: 4,
        windowSeconds: 3600,
      })
    }

    const result = await resendVerificationEmail(body.email)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
