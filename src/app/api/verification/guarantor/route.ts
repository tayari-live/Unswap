import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { requestGuarantor } from "@/server/services/guarantor"

// POST /api/verification/guarantor — the signed-in member invites a UN/IO
// contact to vouch for them.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const result = await requestGuarantor(session.user!.id as string, body.email, body.name)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
