import { NextRequest } from "next/server"
import { prisma } from "@/server/prisma"
import { requireSession, toErrorResponse, ApiError } from "@/server/http"
import { imageResponse } from "@/server/photos"

// GET /api/photos/:id — serve a listing photo as a cacheable image.
// Visible to any signed-in member while the listing is ACTIVE; the owner and
// admins can always see it (drafts, moderation).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    const photo = await prisma.listingPhoto.findUnique({
      where: { id },
      select: { url: true, listing: { select: { status: true, ownerId: true } } },
    })
    const viewer = session.user as any
    const allowed =
      photo &&
      (photo.listing.status === "ACTIVE" ||
        photo.listing.ownerId === viewer.id ||
        viewer.role === "admin")
    if (!allowed) throw new ApiError(404, "Photo not found.")
    return imageResponse(photo.url)
  } catch (err) {
    return toErrorResponse(err)
  }
}
