import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { createReport } from "@/server/services/moderation"

// POST /api/reports { targetType, targetId, reason? } — member reports content.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const result = await createReport({
      reporterId: session.user!.id as string,
      targetType: body.targetType,
      targetId: body.targetId,
      reason: body.reason,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
