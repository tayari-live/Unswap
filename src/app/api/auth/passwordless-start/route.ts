import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { startPasswordlessSession } from "@/server/services/registration"
import { clientIp, enforceRateLimit } from "@/server/rate-limit"

// POST /api/auth/passwordless-start — instant, email-free sign-in for a waitlist
// member who has not set a password yet. Returns a one-time token the browser
// immediately exchanges for a session (via the `onetime` provider), so they land
// in onboarding without an inbox round-trip.
//
// This deliberately grants access on knowledge of the email alone (an accepted
// product trade-off, scoped to passwordless accounts). Rate limited to blunt
// bulk attempts; the reply carries a token only for a genuinely passwordless
// account, and { token: null } otherwise.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === "string" ? body.email : ""

    await enforceRateLimit({
      scope: "auth-pwless:ip",
      identifier: clientIp(req),
      limit: 20,
      windowSeconds: 3600,
      message: "Too many attempts. Please try again later.",
    })
    if (email) {
      await enforceRateLimit({
        scope: "auth-pwless:email",
        identifier: email,
        limit: 8,
        windowSeconds: 3600,
        message: "Too many attempts for that address. Please try again later.",
      })
    }

    const token = await startPasswordlessSession(email)
    return NextResponse.json({ token })
  } catch (err) {
    return toErrorResponse(err)
  }
}
