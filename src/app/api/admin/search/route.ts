import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, toErrorResponse } from "@/server/http"
import { prisma } from "@/server/prisma"

// GET /api/admin/search?q= — the admin top bar's global search. Matches by
// name/email/title/city, not by raw id: swaps and reports don't have a
// human-readable short code (e.g. "SW-10294") in the data model today, so
// swap results are matched by requester/host name or listing title instead
// of inventing IDs that don't exist.
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const q = (req.nextUrl.searchParams.get("q") || "").trim()
    if (!q) return NextResponse.json({ members: [], listings: [], swaps: [] })

    const [members, listings, swaps] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "member",
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, fullName: true, email: true, avatarInitials: true },
        take: 5,
      }),
      prisma.listing.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, city: true, country: true },
        take: 5,
      }),
      prisma.swapRequest.findMany({
        where: {
          OR: [
            { requester: { fullName: { contains: q, mode: "insensitive" } } },
            { host: { fullName: { contains: q, mode: "insensitive" } } },
            { listing: { title: { contains: q, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          requester: { select: { fullName: true } },
          host: { select: { fullName: true } },
          listing: { select: { title: true } },
        },
        take: 5,
      }),
    ])

    return NextResponse.json({
      members,
      listings,
      swaps: swaps.map((s) => ({
        id: s.id,
        label: `${s.requester.fullName} ↔ ${s.host.fullName} · ${s.listing.title}`,
      })),
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}
