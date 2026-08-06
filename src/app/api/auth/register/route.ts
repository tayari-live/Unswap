import { NextRequest, NextResponse } from "next/server"
import { registerMember } from "@/server/services/registration"
import { toErrorResponse } from "@/server/http"
import { clientIp, enforceRateLimit } from "@/server/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Public and sends mail, so limit before doing any work. Per IP to stop a
    // signup flood, and per address so one inbox cannot be targeted from many.
    await enforceRateLimit({
      scope: "register:ip",
      identifier: clientIp(req),
      limit: 5,
      windowSeconds: 3600,
    })
    if (typeof body.email === "string" && body.email) {
      await enforceRateLimit({
        scope: "register:email",
        identifier: body.email,
        limit: 3,
        windowSeconds: 3600,
      })
    }

    const result = await registerMember({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
