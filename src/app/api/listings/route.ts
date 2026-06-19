import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse, ApiError } from "@/server/http"
import { createListing } from "@/server/services/listings"

// POST /api/listings — the signed-in member creates a listing they own.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    if ((session.user as any).role !== "member") {
      throw new ApiError(403, "Only members can create listings.")
    }
    const body = await req.json()
    const listing = await createListing(session.user!.id as string, body)
    return NextResponse.json(listing, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
