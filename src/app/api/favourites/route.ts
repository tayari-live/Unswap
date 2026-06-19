import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { toggleFavourite } from "@/server/services/discovery"

// POST /api/favourites { listingId } — toggle a saved listing for the member.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { listingId } = await req.json()
    const result = await toggleFavourite(session.user!.id as string, listingId)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
