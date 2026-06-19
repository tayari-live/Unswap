import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, toErrorResponse } from "@/server/http"
import { setWaitlistStatus } from "@/server/services/waitlist"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const { status } = await req.json()
    return NextResponse.json(await setWaitlistStatus({ actorId: session.user!.id as string, id, status }))
  } catch (err) {
    return toErrorResponse(err)
  }
}
