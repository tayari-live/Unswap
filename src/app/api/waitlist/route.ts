import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { initiateWaitlist } from "@/server/services/waitlist"
import { clientIp, enforceRateLimit } from "@/server/rate-limit"

// POST /api/waitlist — public pre-launch signup (step 1 of double opt-in).
// Emails a confirmation link; nothing counts until it's clicked.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // The IP limit is looser than signup: a shared institutional network can
    // legitimately produce several joins from one address.
    await enforceRateLimit({
      scope: "waitlist:ip",
      identifier: clientIp(req),
      limit: 10,
      windowSeconds: 3600,
    })
    if (typeof body.email === "string" && body.email) {
      await enforceRateLimit({
        scope: "waitlist:email",
        identifier: body.email,
        limit: 3,
        windowSeconds: 3600,
      })
    }

    const result = await initiateWaitlist({
      name: body.name,
      email: body.email,
      organization: body.organization,
      ref: body.ref,
    })
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
