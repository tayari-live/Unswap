import { NextRequest, NextResponse } from "next/server"
import { resendVerificationEmail } from "@/server/services/registration"
import { toErrorResponse } from "@/server/http"

// POST /api/auth/resend-verification — re-send the email confirmation link.
// Public; always responds ok for valid emails (no account enumeration).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await resendVerificationEmail(body.email)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
