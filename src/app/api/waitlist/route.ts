import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { joinWaitlist } from "@/server/services/waitlist"

// POST /api/waitlist — public pre-launch signup.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await joinWaitlist({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      ref: body.ref,
    })
    return NextResponse.json(result, { status: result.alreadyJoined ? 200 : 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
