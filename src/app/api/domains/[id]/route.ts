import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, toErrorResponse } from "@/server/http"
import { deleteDomain, updateDomain } from "@/server/services/domains"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const updated = await updateDomain({
      actorId: session.user!.id as string,
      id,
      fastTrack: typeof body.fastTrack === "boolean" ? body.fastTrack : undefined,
      autoVerify: typeof body.autoVerify === "boolean" ? body.autoVerify : undefined,
    })
    return NextResponse.json(updated)
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    return NextResponse.json(await deleteDomain({ actorId: session.user!.id as string, id }))
  } catch (err) {
    return toErrorResponse(err)
  }
}
