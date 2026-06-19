import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { submitVerification } from "@/server/services/member-verification"

// POST /api/verification — the signed-in member submits verification documents.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const result = await submitVerification({
      userId: session.user!.id as string,
      idCardUrl: body.idCardUrl,
      proofUrl: body.proofUrl,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
