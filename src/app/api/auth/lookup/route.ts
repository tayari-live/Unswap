import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { lookupLoginState } from "@/server/services/registration"
import { clientIp, enforceRateLimit } from "@/server/rate-limit"

// POST /api/auth/lookup — email-first login: returns whether the address has an
// account and whether it has a password, so the login page shows the right next
// step. Rate limited (it reveals account existence) to deter bulk enumeration.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = typeof body.email === "string" ? body.email : ""

    await enforceRateLimit({
      scope: "auth-lookup:ip",
      identifier: clientIp(req),
      limit: 30,
      windowSeconds: 3600,
      message: "Too many attempts. Please try again later.",
    })
    if (email) {
      await enforceRateLimit({
        scope: "auth-lookup:email",
        identifier: email,
        limit: 6,
        windowSeconds: 3600,
        message: "Too many attempts for that address. Please try again later.",
      })
    }

    return NextResponse.json({ state: await lookupLoginState(email) })
  } catch (err) {
    return toErrorResponse(err)
  }
}
