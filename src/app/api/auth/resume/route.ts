import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { sendResumeLink } from "@/server/services/registration"
import { clientIp, enforceRateLimit } from "@/server/rate-limit"

// POST /api/auth/resume — email a one-time sign-in link to a passwordless member
// who hasn't finished setup. Rate limited; the reply is always ok so it never
// reveals whether an address has an account.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = typeof body.email === "string" ? body.email : ""

    await enforceRateLimit({
      scope: "auth-resume:ip",
      identifier: clientIp(req),
      limit: 10,
      windowSeconds: 3600,
      message: "Too many requests. Please try again later.",
    })
    if (email) {
      await enforceRateLimit({
        scope: "auth-resume:email",
        identifier: email,
        limit: 3,
        windowSeconds: 3600,
        message: "Too many requests for that address. Please try again later.",
      })
    }

    await sendResumeLink(email)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}
