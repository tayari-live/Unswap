import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { respondToGuarantor } from "@/server/services/guarantor"

// POST /api/verification/guarantor/respond — the guarantor answers (approve or
// decline). Public + token-based: the guarantor need not have an account.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await respondToGuarantor(body.token, body.approve === true)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
