import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { setInitialPassword } from "@/server/services/registration"

// POST /api/account/set-password — final step of the waitlist setup flow. Sets
// the first password for the signed-in passwordless member (rejected if one is
// already set) and sends the welcome email.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const password = typeof body.password === "string" ? body.password : ""
    return NextResponse.json(await setInitialPassword(session.user!.id as string, password))
  } catch (err) {
    return toErrorResponse(err)
  }
}
