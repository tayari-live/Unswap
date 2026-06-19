import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { createReview } from "@/server/services/reviews"

// POST /api/reviews — submit a post-exchange review.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const b = await req.json()
    const review = await createReview({
      authorId: session.user!.id as string,
      swapId: b.swapId,
      overall: b.overall,
      communication: b.communication,
      propertyAccuracy: b.propertyAccuracy,
      cleanliness: b.cleanliness,
      neighbourhoodSafety: b.neighbourhoodSafety,
      body: b.body,
    })
    return NextResponse.json(review, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
