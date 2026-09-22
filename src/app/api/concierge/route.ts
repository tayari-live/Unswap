import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { requestConcierge } from "@/server/services/concierge"

// POST /api/concierge — a trust-eligible member requests Relocation Concierge help.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const result = await requestConcierge(session.user!.id as string, {
      destination: body.destination,
      timeframe: body.timeframe,
      needs: body.needs,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
