import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, toErrorResponse } from "@/server/http"
import { resendConfirmation } from "@/server/services/waitlist"

// POST /api/waitlist/:id/resend — admin re-sends a confirmation email (fresh token).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    return NextResponse.json(await resendConfirmation(session.user!.id as string, id))
  } catch (err) {
    return toErrorResponse(err)
  }
}
