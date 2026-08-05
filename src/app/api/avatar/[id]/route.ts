import { NextResponse } from "next/server"
import { prisma } from "@/server/prisma"

/**
 * GET /api/avatar/:id — serve a member's profile photo as real image bytes.
 *
 * Photos are stored as base64 data URLs on the User row. Putting that string in
 * the session meant every page render fetched (and inlined) up to ~130 KB of
 * base64. Serving it here instead lets the browser cache the image once and
 * reuse it across navigations, so the session payload stays tiny.
 *
 * The URL carries a ?v= content hash, so it is safe to cache immutably: a new
 * photo produces a new URL. The id is an unguessable UUID, which is the access
 * control for what is only ever a profile picture inside a closed network.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const row = await prisma.user.findUnique({ where: { id }, select: { imageUrl: true } })
  const dataUrl = row?.imageUrl
  if (!dataUrl) return new NextResponse(null, { status: 404 })

  const m = /^data:(image\/[a-zA-Z+.-]+);base64,([\s\S]*)$/.exec(dataUrl)
  if (!m) return new NextResponse(null, { status: 404 })

  const bytes = Buffer.from(m[2], "base64")
  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": m[1],
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
