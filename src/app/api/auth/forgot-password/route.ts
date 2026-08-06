import { NextRequest, NextResponse } from "next/server"
import { requestPasswordReset } from "@/server/services/password-reset"
import { toErrorResponse } from "@/server/http"
import { clientIp, enforceRateLimit } from "@/server/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // The per-address limit is the important one here: without it anyone can
    // loop this to bury a member's inbox in password-reset mail.
    await enforceRateLimit({
      scope: "forgot:ip",
      identifier: clientIp(req),
      limit: 10,
      windowSeconds: 3600,
    })
    if (typeof body.email === "string" && body.email) {
      await enforceRateLimit({
        scope: "forgot:email",
        identifier: body.email,
        limit: 3,
        windowSeconds: 3600,
      })
    }

    const result = await requestPasswordReset(body.email)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
