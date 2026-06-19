import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import {
  updateListing,
  updateMemberListing,
  deleteMemberListing,
} from "@/server/services/listings"

// PATCH /api/listings/:id
// Admins moderate any listing (status/flag); members edit only their own.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    const body = await req.json()
    const userId = session.user!.id as string

    if ((session.user as any).role === "admin") {
      return NextResponse.json(
        await updateListing({ actorId: userId, id, status: body.status, flagged: body.flagged })
      )
    }
    return NextResponse.json(await updateMemberListing(userId, id, body))
  } catch (err) {
    return toErrorResponse(err)
  }
}

// DELETE /api/listings/:id — a member removes their own listing.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    return NextResponse.json(await deleteMemberListing(session.user!.id as string, id))
  } catch (err) {
    return toErrorResponse(err)
  }
}
