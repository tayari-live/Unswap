import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, toErrorResponse } from "@/server/http"
import { resolveReport } from "@/server/services/moderation"

// PATCH /api/reports/:id { action: "dismiss" | "remove" } — admin resolves a report.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const { action } = await req.json()
    return NextResponse.json(
      await resolveReport({ adminId: session.user!.id as string, id, action })
    )
  } catch (err) {
    return toErrorResponse(err)
  }
}
