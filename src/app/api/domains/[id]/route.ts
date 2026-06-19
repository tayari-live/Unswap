import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, toErrorResponse } from "@/server/http"
import { deleteDomain } from "@/server/services/domains"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    return NextResponse.json(await deleteDomain({ actorId: session.user!.id as string, id }))
  } catch (err) {
    return toErrorResponse(err)
  }
}
