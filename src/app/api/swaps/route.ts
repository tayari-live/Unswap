import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse, ApiError } from "@/server/http"
import { createSwapRequest } from "@/server/services/swaps"

// POST /api/swaps — a verified member requests a swap on a listing.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    if ((session.user as any).role !== "member") {
      throw new ApiError(403, "Only members can request swaps.")
    }
    const body = await req.json()
    const swap = await createSwapRequest({
      requesterId: session.user!.id as string,
      listingId: body.listingId,
      mode: body.mode,
      startDate: body.startDate,
      endDate: body.endDate,
      guests: body.guests,
      message: body.message,
    })
    return NextResponse.json(swap, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
