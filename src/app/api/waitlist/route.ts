import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { initiateWaitlist } from "@/server/services/waitlist"

// POST /api/waitlist — public pre-launch signup (step 1 of double opt-in).
// Emails a confirmation link; nothing counts until it's clicked.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await initiateWaitlist({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      ref: body.ref,
    })
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
