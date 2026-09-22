import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { requestWorkEmailVerification } from "@/server/services/work-email"

// POST /api/verification/work-email — the signed-in member adds an institutional
// email to verify affiliation. A confirmation link is sent to that address.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const result = await requestWorkEmailVerification(session.user!.id as string, body.email)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
